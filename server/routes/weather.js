const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const UAPIS_WEATHER_API_URL = process.env.UAPIS_WEATHER_API_URL || 'https://uapis.cn/api/v1/misc/weather';
const OPEN_METEO_GEOCODING_URL = process.env.OPEN_METEO_GEOCODING_URL || 'https://geocoding-api.open-meteo.com/v1/search';
const OPEN_METEO_FORECAST_URL = process.env.OPEN_METEO_FORECAST_URL || 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_TIMEZONE = process.env.OPEN_METEO_TIMEZONE || 'Asia/Shanghai';
const WEATHER_FORECAST_DAYS = Math.min(15, Math.max(3, Number(process.env.WEATHER_FORECAST_DAYS || 5)));
const WEATHER_CACHE_TTL_MS = Number(process.env.WEATHER_CACHE_TTL_MS || 10 * 60 * 1000);
const WEATHER_REQUEST_TIMEOUT_MS = Number(process.env.WEATHER_REQUEST_TIMEOUT_MS || 10000);
const WEATHER_CONCURRENCY = Math.max(1, Number(process.env.WEATHER_REQUEST_CONCURRENCY || 6));

const PROVINCE_NAMES = [
  '黑龙江', '内蒙古', '辽宁', '吉林', '河北', '山西', '山东', '陕西', '甘肃', '青海', '宁夏',
  '新疆', '河南', '江西', '湖南', '广西', '广东', '海南', '福建', '江苏', '浙江', '安徽',
  '湖北', '贵州', '四川', '西藏', '云南', '北京', '天津', '上海', '重庆'
];

const WEATHER_GROUP_GEO_MAP = {
  '北京': '京津冀大区',
  '天津': '京津冀大区',
  '河北': '京津冀大区',
  '四川': '川藏省公司',
  '西藏': '川藏省公司',
  '辽宁': '东北大区',
  '吉林': '东北大区',
  '黑龙江': '东北大区',
  '陕西': '西北大区',
  '甘肃': '西北大区',
  '青海': '西北大区',
  '宁夏': '西北大区',
  '新疆': '西北大区'
};

const CITY_ALIAS_MAP = {
  '浦东': '上海',
  '临平': '杭州',
  '武昌': '武汉',
  '增城': '广州',
  '闽南': '漳州',
  '余姚': '宁波',
  '义乌': '金华',
  '江阴': '无锡',
  '简阳': '成都',
  '公主岭': '长春',
  '晋江': '泉州',
  '卫辉': '新乡',
  '吴川': '湛江',
  '粤西': '湛江',
  '静海': '天津',
  '盘山': '盘锦',
  '兖州': '济宁'
};

const PROVINCE_CAPITAL_MAP = {
  '安徽': '合肥',
  '北京': '北京',
  '重庆': '重庆',
  '福建': '福州',
  '甘肃': '兰州',
  '广东': '广州',
  '广西': '南宁',
  '贵州': '贵阳',
  '海南': '海口',
  '河北': '石家庄',
  '河南': '郑州',
  '黑龙江': '哈尔滨',
  '湖北': '武汉',
  '湖南': '长沙',
  '吉林': '长春',
  '江苏': '南京',
  '江西': '南昌',
  '辽宁': '沈阳',
  '内蒙古': '呼和浩特',
  '宁夏': '银川',
  '青海': '西宁',
  '山东': '济南',
  '山西': '太原',
  '陕西': '西安',
  '上海': '上海',
  '四川': '成都',
  '天津': '天津',
  '西藏': '拉萨',
  '新疆': '乌鲁木齐',
  '云南': '昆明',
  '浙江': '杭州'
};

const FALLBACK_PROVINCE_BY_CODE = {
  P01: '上海',
  P02: '浙江',
  P03: '江苏',
  P04: '安徽',
  P05: '重庆',
  P06: '云南',
  P07: '湖北',
  P08: '贵州',
  P09: '四川',
  P10: '北京',
  P11: '天津',
  P12: '河北',
  P13: '山西',
  P14: '内蒙古',
  P15: '辽宁',
  P16: '山东',
  P17: '陕西',
  P18: '河南',
  P19: '江西',
  P20: '湖南',
  P21: '广西',
  P22: '广东',
  P23: '福建'
};

let centersData = [];

try {
  centersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../platform/data/centers.json'), 'utf-8'));
} catch (error) {
  console.warn('加载天气基础数据失败:', error.message);
}

let weatherCache = {
  expiresAt: 0,
  payload: null
};

function normalizeText(value) {
  return String(value || '').trim();
}

function hasMeaningfulValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

function cleanCityName(value) {
  return normalizeText(value).replace(/(特别行政区|自治州|地区|盟|市|区|县)$/g, '');
}

function applyCityAlias(value) {
  const cityName = cleanCityName(value);
  return CITY_ALIAS_MAP[cityName] || cityName;
}

function cleanProvinceName(value) {
  return normalizeText(value)
    .replace(/省公司|市公司|大区|省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区/g, '');
}

function inferProvinceName(center) {
  const combined = [center.name, center.address, center.provinceName].map(normalizeText).join(' ');
  for (const provinceName of PROVINCE_NAMES) {
    if (combined.indexOf(provinceName) >= 0) {
      return provinceName;
    }
  }
  return FALLBACK_PROVINCE_BY_CODE[center.provinceCode] || cleanProvinceName(center.provinceName) || '未知';
}

function extractCityFromText(text) {
  const normalized = normalizeText(text).replace(/\s+/g, '');
  if (!normalized) return '';

  const provinceCityMatch = normalized.match(/(?:省|自治区|特别行政区)([\u4e00-\u9fa5]{2,}?(?:自治州|地区|盟|市))/);
  if (provinceCityMatch) return applyCityAlias(provinceCityMatch[1]);

  const municipalityMatch = normalized.match(/(?:^|[^A-Za-z])(北京|天津|上海|重庆)(?:市|[^A-Za-z]|$)/);
  if (municipalityMatch) return municipalityMatch[1];

  const districtMatch = normalized.match(/([\u4e00-\u9fa5]{2,}?)(新区|区|县|镇|乡|街道)/);
  if (districtMatch) {
    const districtName = cleanCityName(districtMatch[1]);
    if (CITY_ALIAS_MAP[districtName]) {
      return CITY_ALIAS_MAP[districtName];
    }
  }

  return '';
}

function inferQueryCity(center) {
  const candidates = inferQueryCandidates(center);
  return candidates[0] || '';
}

function pushUniqueCandidate(bucket, value) {
  const text = applyCityAlias(value);
  if (!text) return;
  const normalized = cleanCityName(text);
  if (!normalized) return;
  if (bucket.some(item => cleanCityName(item) === normalized)) return;
  bucket.push(normalized);
}

function inferQueryCandidates(center) {
  const candidates = [];
  const shortName = normalizeText(center.shortName);
  const fromAddress = extractCityFromText(center.address);
  const fromName = extractCityFromText(center.name);
  const centerName = normalizeText(center.name).replace(/转运中心$/g, '');
  const provinceName = inferProvinceName(center);
  const provinceCapital = PROVINCE_CAPITAL_MAP[provinceName] || '';

  pushUniqueCandidate(candidates, shortName);
  pushUniqueCandidate(candidates, fromAddress);
  pushUniqueCandidate(candidates, fromName);
  pushUniqueCandidate(candidates, centerName);

  if (/^(北京|天津|上海|重庆)$/.test(provinceName)) {
    pushUniqueCandidate(candidates, provinceName);
  }

  pushUniqueCandidate(candidates, provinceCapital);
  return candidates;
}

function getLevelRank(level) {
  switch (level) {
    case '红色':
      return 4;
    case '橙色':
      return 3;
    case '黄色':
      return 2;
    default:
      return 1;
  }
}

function getTypeLabel(type) {
  switch (type) {
    case 'rainSnow':
      return '雨雪';
    case 'smog':
      return '雾霾';
    case 'heat':
      return '高温';
    case 'hail':
      return '冰雹';
    case 'sandstorm':
      return '沙尘';
    default:
      return '天气';
  }
}

function getTypeResponse(type) {
  switch (type) {
    case 'rainSnow':
      return '加强防滑、防积水与夜间车辆绕行提醒';
    case 'smog':
      return '下发慢行、开灯与人员防护提醒';
    case 'heat':
      return '执行错峰作业、补水与轮岗检查';
    case 'hail':
      return '暂停室外高风险作业并加固临时设施';
    case 'sandstorm':
      return '加强场地防尘和车辆滤芯巡检';
    default:
      return '保持天气跟踪并及时下发现场提醒';
  }
}

function pushCandidate(bucket, type, level, reason) {
  if (!level) return;
  bucket.push({
    type,
    level,
    rank: getLevelRank(level),
    reason
  });
}

function pickBestCandidate(candidates) {
  return candidates.sort((a, b) => {
    if (b.rank !== a.rank) return b.rank - a.rank;
    return getTypeLabel(a.type).localeCompare(getTypeLabel(b.type), 'zh-CN');
  })[0] || null;
}

function buildAlertDescription(entry, reason) {
  const parts = [];
  if (entry.weather) parts.push('当前' + entry.weather);
  if (entry.temperature) parts.push(entry.temperature + '℃');
  if (entry.humidity) parts.push('湿度' + entry.humidity + '%');
  if (entry.aqi) parts.push('AQI ' + entry.aqi);
  if (reason) parts.push(reason);
  return parts.join('，');
}

function evaluateWeatherAlert(entry) {
  const candidates = [];
  const todayForecast = entry.future && entry.future[0] ? entry.future[0].weather : '';
  const weatherTexts = [entry.weather, todayForecast].filter(Boolean).join(' ');
  const currentWeatherText = [entry.weather].filter(Boolean).join(' ');
  const aqi = Number(entry.aqi || 0);
  const temperature = Number(entry.temperature || 0);

  if (/雷阵雨伴有冰雹|冰雹/.test(currentWeatherText)) {
    pushCandidate(candidates, 'hail', /雷阵雨伴有冰雹/.test(currentWeatherText) ? '橙色' : '黄色', '短时对流天气较强，需关注棚顶与车辆停放安全');
  }

  if (/强沙尘暴/.test(weatherTexts)) {
    pushCandidate(candidates, 'sandstorm', '红色', '风沙能见度较低，需严格控制长途发运和场地扬尘');
  } else if (/沙尘暴|扬沙/.test(weatherTexts)) {
    pushCandidate(candidates, 'sandstorm', '橙色', '风沙天气影响运输能见度和设备过滤能力');
  }

  if (/特大暴雨|大暴雨|暴雪|冻雨/.test(weatherTexts)) {
    pushCandidate(candidates, 'rainSnow', '红色', '强降水或冰冻天气可能影响干线发运与场地通行');
  } else if (/暴雨|大雪/.test(weatherTexts)) {
    pushCandidate(candidates, 'rainSnow', '橙色', '强降水降雪天气对道路附着力、场地排水和夜间作业影响较大');
  }

  if (aqi >= 300) {
    pushCandidate(candidates, 'smog', '红色', '空气质量重度污染，需加强人员防护和车辆慢行');
  } else if (aqi >= 200) {
    pushCandidate(candidates, 'smog', '橙色', '空气质量较差，需关注能见度和现场作业舒适度');
  }

  if (temperature >= 38) {
    pushCandidate(candidates, 'heat', '红色', '高温持续，需严格执行错峰与补水轮岗');
  } else if (temperature >= 35) {
    pushCandidate(candidates, 'heat', '橙色', '体感温度较高，需关注露天装卸和高强度岗位轮换');
  }

  const best = pickBestCandidate(candidates);
  if (!best) return null;

  return {
    id: 'WEA-' + entry.centerCode,
    scope: 'city',
    provinceName: entry.provinceName,
    cityName: entry.city || entry.shortName,
    type: best.type,
    level: best.level,
    title: entry.shortName + getTypeLabel(best.type) + '风险关注',
    desc: buildAlertDescription(entry, best.reason),
    updatedAt: entry.updatedAt,
    centerNames: [entry.shortName || entry.city || entry.centerName],
    response: getTypeResponse(best.type)
  };
}

function buildRegionAlerts(cityAlerts) {
  const grouped = {};

  cityAlerts.forEach(alert => {
    const geoName = WEATHER_GROUP_GEO_MAP[alert.provinceName] || alert.provinceName;
    if (!grouped[geoName]) {
      grouped[geoName] = [];
    }
    grouped[geoName].push(alert);
  });

  return Object.keys(grouped).map(geoName => {
    const items = grouped[geoName].slice().sort((a, b) => {
      const rankDiff = getLevelRank(b.level) - getLevelRank(a.level);
      if (rankDiff !== 0) return rankDiff;
      return a.cityName.localeCompare(b.cityName, 'zh-CN');
    });
    const top = items[0];
    const centerNames = Array.from(new Set(items.flatMap(item => item.centerNames || [])));
    const cityNames = Array.from(new Set(items.map(item => item.cityName))).filter(Boolean);

    return {
      id: 'WEA-REGION-' + geoName,
      scope: 'region',
      provinceName: geoName,
      cityName: cityNames[0] || geoName,
      type: top.type,
      level: top.level,
      title: geoName + getTypeLabel(top.type) + '态势关注',
      desc: (cityNames.slice(0, 3).join('、') || geoName) + '等 ' + items.length + ' 个中心出现天气风险，建议提前组织作业提醒。',
      updatedAt: top.updatedAt,
      centerNames,
      response: top.response
    };
  }).sort((a, b) => {
    const rankDiff = getLevelRank(b.level) - getLevelRank(a.level);
    if (rankDiff !== 0) return rankDiff;
    return a.provinceName.localeCompare(b.provinceName, 'zh-CN');
  });
}

async function mapWithConcurrency(items, limit, mapper) {
  const result = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex;
      currentIndex += 1;
      result[index] = await mapper(items[index], index);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return result;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(WEATHER_REQUEST_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('天气接口返回非 JSON 响应');
  }
}

function pickWeatherAqi(result) {
  if (!result) return '';
  if (typeof result === 'string' || typeof result === 'number') {
    return normalizeText(result);
  }

  const directAqi = pickNestedValue(result, [
    'aqi',
    'air.aqi',
    'city.aqi',
    'now.aqi',
    'air_now.aqi',
    'airNow.aqi',
    'airQuality.aqi',
    'aqi.value'
  ]);
  if (directAqi) return normalizeText(directAqi);

  const stations = pickNestedArray(result, ['stations', 'air.stations']);
  for (const station of stations) {
    const stationAqi = pickNestedValue(station, ['aqi', 'value']);
    if (stationAqi) return normalizeText(stationAqi);
  }

  return '';
}

function formatWeatherNumber(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return '';
  return String(Math.round(numberValue));
}

function formatRainfall(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return '';
  return numberValue === 0 ? '0' : numberValue.toFixed(1).replace(/\.0$/, '');
}

function getNestedValue(source, path) {
  if (!source || !path) return undefined;
  const segments = Array.isArray(path) ? path : String(path).split('.');
  let current = source;
  for (const segment of segments) {
    if (current === undefined || current === null) return undefined;
    current = current[segment];
  }
  return current;
}

function pickNestedValue(source, paths) {
  for (const path of paths) {
    const value = getNestedValue(source, path);
    if (hasMeaningfulValue(value)) {
      return value;
    }
  }
  return '';
}

function pickNestedObject(source, paths) {
  for (const path of paths) {
    const value = getNestedValue(source, path);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
  }
  return null;
}

function pickNestedArray(source, paths) {
  for (const path of paths) {
    const value = getNestedValue(source, path);
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value === 'object') {
      if (Array.isArray(value.list)) return value.list;
      if (Array.isArray(value.daily)) return value.daily;
      if (Array.isArray(value.forecasts)) return value.forecasts;
    }
  }
  return [];
}

function normalizeWindDirectionValue(value) {
  const text = normalizeText(value);
  if (!text) return '';
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return toWindDirectionLabel(Number(text));
  }
  return text.replace(/风$/, '');
}

function normalizeWindScaleValue(value) {
  const text = normalizeText(value);
  if (!text) return '';
  if (/^\d+(\.\d+)?$/.test(text)) {
    return toWindScaleLabel(Number(text));
  }
  const match = text.match(/\d+/);
  return match ? match[0] : text;
}

function toWindDirectionLabel(value) {
  const degrees = Number(value);
  if (!Number.isFinite(degrees)) return '';
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  return directions[Math.round((((degrees % 360) + 360) % 360) / 45) % directions.length];
}

function toWindScaleLabel(value) {
  const speed = Number(value);
  if (!Number.isFinite(speed)) return '';
  if (speed < 1) return '0';
  if (speed <= 5) return '1';
  if (speed <= 11) return '2';
  if (speed <= 19) return '3';
  if (speed <= 28) return '4';
  if (speed <= 38) return '5';
  if (speed <= 49) return '6';
  if (speed <= 61) return '7';
  if (speed <= 74) return '8';
  if (speed <= 88) return '9';
  if (speed <= 102) return '10';
  if (speed <= 117) return '11';
  return '12';
}

function getOpenMeteoWeatherText(code) {
  switch (Number(code)) {
    case 0:
      return '晴';
    case 1:
      return '晴间多云';
    case 2:
      return '多云';
    case 3:
      return '阴';
    case 45:
    case 48:
      return '雾';
    case 51:
    case 53:
    case 55:
      return '毛毛雨';
    case 56:
    case 57:
      return '冻毛毛雨';
    case 61:
    case 63:
    case 65:
      return '雨';
    case 66:
    case 67:
      return '冻雨';
    case 71:
    case 73:
    case 75:
      return '雪';
    case 77:
      return '冰粒';
    case 80:
    case 81:
    case 82:
      return '阵雨';
    case 85:
    case 86:
      return '阵雪';
    case 95:
      return '雷暴';
    case 96:
    case 99:
      // Open-Meteo 官方说明：96/99 的冰雹雷暴仅在中欧可用，不能直接用于中国城市。
      return '雷暴';
    default:
      return '天气平稳';
  }
}

function pickOpenMeteoLocation(results, city) {
  const candidates = Array.isArray(results) ? results : [];
  const normalizedCity = cleanCityName(city);
  const filtered = candidates.filter(item => normalizeText(item && item.country_code).toUpperCase() === 'CN');

  return filtered.sort((left, right) => {
    const leftExact = cleanCityName(left && left.name) === normalizedCity ? 1 : 0;
    const rightExact = cleanCityName(right && right.name) === normalizedCity ? 1 : 0;
    if (rightExact !== leftExact) return rightExact - leftExact;
    return Number(right && right.population || 0) - Number(left && left.population || 0);
  })[0] || null;
}

async function fetchOpenMeteoWeather(city) {
  const geoUrl = new URL(OPEN_METEO_GEOCODING_URL);
  geoUrl.searchParams.set('name', city);
  geoUrl.searchParams.set('count', '5');
  geoUrl.searchParams.set('language', 'zh');
  geoUrl.searchParams.set('countryCode', 'CN');

  const geoPayload = await fetchJson(geoUrl);
  const location = pickOpenMeteoLocation(geoPayload && geoPayload.results, city);
  if (!location) {
    throw new Error('Open-Meteo 未匹配到城市');
  }

  const forecastUrl = new URL(OPEN_METEO_FORECAST_URL);
  forecastUrl.searchParams.set('latitude', String(location.latitude));
  forecastUrl.searchParams.set('longitude', String(location.longitude));
  forecastUrl.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m');
  forecastUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant');
  forecastUrl.searchParams.set('forecast_days', String(WEATHER_FORECAST_DAYS));
  forecastUrl.searchParams.set('timezone', OPEN_METEO_TIMEZONE);

  const forecastPayload = await fetchJson(forecastUrl);
  const current = forecastPayload && forecastPayload.current ? forecastPayload.current : {};
  const daily = forecastPayload && forecastPayload.daily ? forecastPayload.daily : {};
  const dates = Array.isArray(daily.time) ? daily.time : [];

  return {
    location: {
      name: normalizeText(location.name) || city,
      timezone: normalizeText(location.timezone || forecastPayload.timezone)
    },
    now: {
      text: getOpenMeteoWeatherText(current.weather_code),
      temperature: formatWeatherNumber(current.temperature_2m),
      humidity: formatWeatherNumber(current.relative_humidity_2m),
      wind_direction: toWindDirectionLabel(current.wind_direction_10m),
      wind_scale: toWindScaleLabel(current.wind_speed_10m)
    },
    daily: dates.map((date, index) => ({
      date: normalizeText(date),
      text_day: getOpenMeteoWeatherText(daily.weather_code && daily.weather_code[index]),
      text_night: getOpenMeteoWeatherText(daily.weather_code && daily.weather_code[index]),
      low: formatWeatherNumber(daily.temperature_2m_min && daily.temperature_2m_min[index]),
      high: formatWeatherNumber(daily.temperature_2m_max && daily.temperature_2m_max[index]),
      rainfall: formatRainfall(daily.precipitation_sum && daily.precipitation_sum[index]),
      wind_direction: toWindDirectionLabel(daily.wind_direction_10m_dominant && daily.wind_direction_10m_dominant[index]),
      wind_scale: toWindScaleLabel(daily.wind_speed_10m_max && daily.wind_speed_10m_max[index])
    })),
    air: null,
    lastUpdate: normalizeText(current.time)
  };
}

function pickWeatherPayloadRoot(payload) {
  const candidates = [
    payload && payload.data,
    payload && payload.result,
    payload && (Array.isArray(payload.results) ? payload.results[0] : null),
    payload && payload.weather,
    payload
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      return candidate;
    }
  }

  return null;
}

function normalizeUapisDailyRecord(item) {
  return {
    date: normalizeText(pickNestedValue(item, ['date', 'fxDate', 'time', 'valid_date', 'day'])),
    text_day: normalizeText(pickNestedValue(item, [
      'text_day', 'textDay', 'day_text', 'dayText', 'day_weather', 'dayWeather', 'day.condition', 'day.text', 'condition_day'
    ])),
    text_night: normalizeText(pickNestedValue(item, [
      'text_night', 'textNight', 'night_text', 'nightText', 'night_weather', 'nightWeather', 'night.condition', 'night.text', 'condition_night'
    ])),
    low: normalizeText(pickNestedValue(item, ['low', 'min', 'tempMin', 'temp_min', 'temperature_min', 'night.temp'])),
    high: normalizeText(pickNestedValue(item, ['high', 'max', 'tempMax', 'temp_max', 'temperature_max', 'day.temp'])),
    rainfall: normalizeText(pickNestedValue(item, ['rainfall', 'precip', 'precipitation', 'precip_sum', 'precipitation_sum'])),
    wind_direction: normalizeWindDirectionValue(pickNestedValue(item, [
      'wind_direction', 'windDirection', 'wind_dir', 'windDir', 'wind_direction_day', 'windDirDay', 'day.windDir', 'day.wind_direction'
    ])),
    wind_scale: normalizeWindScaleValue(pickNestedValue(item, [
      'wind_scale', 'windScale', 'wind_level', 'windLevel', 'wind_speed', 'windSpeed', 'wind_scale_day', 'windScaleDay', 'day.windScale', 'day.wind_speed'
    ]))
  };
}

async function fetchUapisWeather(city) {
  const url = new URL(UAPIS_WEATHER_API_URL);
  url.searchParams.set('city', city);

  const payload = await fetchJson(url);
  const data = pickWeatherPayloadRoot(payload);
  if (!data) {
    throw new Error('UAPIS 返回结构异常');
  }

  const realtime = pickNestedObject(data, ['now', 'current', 'realtime', 'live', 'observe', 'weather.now', 'weather.current']) || data;
  const daily = pickNestedArray(data, [
    'daily',
    'forecast',
    'forecasts',
    'future',
    'days',
    'weather.daily',
    'weather.forecast',
    'result.daily',
    'result.forecast'
  ]).slice(0, WEATHER_FORECAST_DAYS).map(normalizeUapisDailyRecord);
  const locationName = normalizeText(pickNestedValue(data, [
    'location.name',
    'city.name',
    'city',
    'location',
    'area',
    'name'
  ])) || city;
  const weatherText = normalizeText(pickNestedValue(realtime, [
    'text',
    'weather',
    'cond_txt',
    'condition',
    'description',
    'phenomena',
    'weatherText'
  ])) || (daily[0] && (daily[0].text_day || daily[0].text_night)) || '';
  const temperature = normalizeText(pickNestedValue(realtime, [
    'temperature',
    'temp',
    'temp_c',
    'tempC',
    'temperature_2m'
  ]));
  const humidity = normalizeText(pickNestedValue(realtime, [
    'humidity',
    'relative_humidity',
    'relativeHumidity',
    'rh',
    'relative_humidity_2m'
  ]));
  const windDirection = normalizeWindDirectionValue(pickNestedValue(realtime, [
    'wind_direction',
    'windDirection',
    'wind_dir',
    'windDir',
    'wind.direction',
    'wind_direction_10m'
  ]));
  const windScale = normalizeWindScaleValue(pickNestedValue(realtime, [
    'wind_scale',
    'windScale',
    'wind_level',
    'windLevel',
    'wind_speed',
    'windSpeed',
    'wind.speed',
    'wind_speed_10m'
  ]));
  const air = pickNestedObject(data, ['air', 'air_now', 'airNow', 'airQuality']) || pickNestedValue(data, ['aqi']);

  if (!weatherText && !temperature && !daily.length) {
    throw new Error('UAPIS 未返回可用天气字段');
  }

  return {
    location: {
      name: locationName,
      timezone: normalizeText(pickNestedValue(data, ['location.timezone', 'timezone']))
    },
    now: {
      text: weatherText,
      temperature,
      humidity,
      wind_direction: windDirection,
      wind_scale: windScale
    },
    daily,
    air,
    lastUpdate: normalizeText(pickNestedValue(data, [
      'lastUpdate',
      'last_update',
      'updateTime',
      'updatedAt',
      'obsTime',
      'now.obsTime',
      'current.time'
    ]))
  };
}

function toCenterWeatherRecord(center, weatherResult, updatedAt, queryCity, provider) {
  const realtime = weatherResult && weatherResult.now ? weatherResult.now : {};
  const air = weatherResult && weatherResult.air ? weatherResult.air : {};
  const future = Array.isArray(weatherResult && weatherResult.daily)
    ? weatherResult.daily.map(item => ({
      date: normalizeText(item.date),
      weather: normalizeText(item.text_day || item.text_night),
      weatherDay: normalizeText(item.text_day),
      weatherNight: normalizeText(item.text_night),
      low: normalizeText(item.low),
      high: normalizeText(item.high),
      rainfall: normalizeText(item.rainfall),
      direct: normalizeText(item.wind_direction),
      power: normalizeText(item.wind_scale)
    }))
    : [];

  return {
    centerCode: center.code,
    centerName: center.name,
    shortName: center.shortName,
    provinceCode: center.provinceCode,
    provinceName: inferProvinceName(center),
    city: cleanCityName(weatherResult && weatherResult.location && weatherResult.location.name) || queryCity || inferQueryCity(center),
    queryCity: queryCity || inferQueryCity(center),
    provider: provider || 'uapis',
    weather: normalizeText(realtime.text) || (future[0] && future[0].weather) || '',
    temperature: normalizeText(realtime.temperature),
    humidity: normalizeText(realtime.humidity),
    direct: normalizeText(realtime.wind_direction),
    power: normalizeText(realtime.wind_scale),
    aqi: pickWeatherAqi(air),
    future,
    updatedAt
  };
}

function buildDashboardPayload(centerWeather, failures, source) {
  const cityAlerts = centerWeather.map(evaluateWeatherAlert).filter(Boolean).sort((a, b) => {
    const rankDiff = getLevelRank(b.level) - getLevelRank(a.level);
    if (rankDiff !== 0) return rankDiff;
    return a.cityName.localeCompare(b.cityName, 'zh-CN');
  });
  const regionAlerts = buildRegionAlerts(cityAlerts);
  const impactedCenterCount = Array.from(new Set(cityAlerts.flatMap(item => item.centerNames || []).filter(Boolean))).length;

  return {
    source,
    generatedAt: new Date().toISOString(),
    cacheTtlMs: WEATHER_CACHE_TTL_MS,
    alerts: regionAlerts.concat(cityAlerts),
    centerWeather,
    failures,
    stats: {
      totalCenters: centersData.length,
      successCenters: centerWeather.length,
      failedCenters: failures.length,
      regionAlerts: regionAlerts.length,
      cityAlerts: cityAlerts.length,
      impactedCenters: impactedCenterCount
    }
  };
}

router.get('/dashboard', async (req, res) => {
  try {
    const forceRefresh = String(req.query.force || '') === '1';

    if (!forceRefresh && weatherCache.payload && weatherCache.expiresAt > Date.now()) {
      res.json(Object.assign({}, weatherCache.payload, { source: 'cache' }));
      return;
    }

    const updatedAt = new Date().toTimeString().slice(0, 5);
    const weatherRequestCache = new Map();
    const failures = [];
    const fetchWeatherByCity = city => {
      if (!city) {
        return Promise.resolve({
          city,
          ok: false,
          error: '缺少天气查询城市'
        });
      }
      if (!weatherRequestCache.has(city)) {
        weatherRequestCache.set(city, (async () => {
          try {
            const result = await fetchUapisWeather(city);
            return { city, ok: true, result, provider: 'uapis' };
          } catch (error) {
            try {
              const fallbackResult = await fetchOpenMeteoWeather(city);
              return { city, ok: true, result: fallbackResult, provider: 'open-meteo' };
            } catch (fallbackError) {
              return {
                city,
                ok: false,
                error: (error && error.message ? error.message : 'UAPIS 失败') + ' / ' + (fallbackError && fallbackError.message ? fallbackError.message : 'Open-Meteo 失败')
              };
            }
          }
        })());
      }
      return weatherRequestCache.get(city);
    };

    const centerWeatherResults = await mapWithConcurrency(centersData, WEATHER_CONCURRENCY, async center => {
      const queryCandidates = inferQueryCandidates(center);
      const attemptErrors = [];

      for (const city of queryCandidates) {
        const weatherResult = await fetchWeatherByCity(city);
        if (weatherResult.ok) {
          return {
            ok: true,
            center,
            queryCity: city,
            provider: weatherResult.provider,
            result: weatherResult.result
          };
        }
        attemptErrors.push(city + ': ' + weatherResult.error);
      }

      return {
        ok: false,
        center,
        queryCandidates,
        error: attemptErrors.join(' | ') || '所有天气候选城市均获取失败'
      };
    });

    const centerWeather = [];
    centerWeatherResults.forEach(item => {
      if (!item.ok) {
        failures.push({
          city: inferQueryCity(item.center),
          attemptedCities: item.queryCandidates,
          centerName: item.center.shortName || item.center.name,
          message: item.error
        });
        return;
      }

      const lastUpdateMs = Date.parse(item.result.lastUpdate || '');
      const recordUpdatedAt = Number.isNaN(lastUpdateMs)
        ? updatedAt
        : new Date(lastUpdateMs).toTimeString().slice(0, 5);
      centerWeather.push(toCenterWeatherRecord(item.center, item.result, recordUpdatedAt, item.queryCity, item.provider));
    });

    const payload = buildDashboardPayload(centerWeather, failures, 'uapis');
    weatherCache = {
      expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
      payload
    };

    res.json(payload);
  } catch (error) {
    console.error('获取天气大屏数据失败:', error);
    res.status(500).json({
      source: 'error',
      generatedAt: new Date().toISOString(),
      alerts: [],
      centerWeather: [],
      failures: [],
      stats: {
        totalCenters: centersData.length,
        successCenters: 0,
        failedCenters: 0,
        regionAlerts: 0,
        cityAlerts: 0,
        impactedCenters: 0
      },
      message: error.message || '天气数据获取失败'
    });
  }
});

module.exports = router;
