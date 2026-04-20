const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const WEATHER_API_URL = process.env.JUHE_WEATHER_API_URL || 'http://apis.juhe.cn/simpleWeather/query';
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
  '闽南': '漳州'
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
let provincesData = [];

try {
  centersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../platform/data/centers.json'), 'utf-8'));
  provincesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../platform/data/provinces.json'), 'utf-8'));
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

function cleanCityName(value) {
  return normalizeText(value).replace(/(特别行政区|自治州|地区|盟|市|区|县)$/g, '');
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

  const municipalityMatch = normalized.match(/(北京|天津|上海|重庆)/);
  if (municipalityMatch) return municipalityMatch[1];

  const cityMatch = normalized.match(/([\u4e00-\u9fa5]{2,}(?:自治州|地区|盟|市))/);
  if (cityMatch) return cleanCityName(cityMatch[1]);

  return '';
}

function inferQueryCity(center) {
  const shortName = normalizeText(center.shortName);
  if (CITY_ALIAS_MAP[shortName]) return CITY_ALIAS_MAP[shortName];

  const fromAddress = extractCityFromText(center.address);
  if (fromAddress) return fromAddress;

  const fromName = extractCityFromText(center.name);
  if (fromName) return fromName;

  return shortName || cleanCityName(center.name);
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
  const weatherTexts = [entry.weather].concat((entry.future || []).slice(0, 2).map(item => item.weather)).filter(Boolean).join(' ');
  const aqi = Number(entry.aqi || 0);
  const temperature = Number(entry.temperature || 0);

  if (/雷阵雨伴有冰雹|冰雹/.test(weatherTexts)) {
    pushCandidate(candidates, 'hail', /雷阵雨伴有冰雹/.test(weatherTexts) ? '橙色' : '黄色', '短时对流天气较强，需关注棚顶与车辆停放安全');
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

async function fetchJuheWeather(city, apiKey) {
  const url = new URL(WEATHER_API_URL);
  url.searchParams.set('city', city);
  url.searchParams.set('key', apiKey);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(WEATHER_REQUEST_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }

  const payload = await response.json();
  if (!payload || payload.error_code !== 0 || !payload.result) {
    throw new Error((payload && payload.reason) || '天气接口返回异常');
  }

  return payload.result;
}

function toCenterWeatherRecord(center, weatherResult, updatedAt) {
  const realtime = weatherResult && weatherResult.realtime ? weatherResult.realtime : {};
  return {
    centerCode: center.code,
    centerName: center.name,
    shortName: center.shortName,
    provinceCode: center.provinceCode,
    provinceName: inferProvinceName(center),
    city: cleanCityName(weatherResult && weatherResult.city) || inferQueryCity(center),
    queryCity: inferQueryCity(center),
    weather: normalizeText(realtime.info),
    temperature: normalizeText(realtime.temperature),
    humidity: normalizeText(realtime.humidity),
    direct: normalizeText(realtime.direct),
    power: normalizeText(realtime.power),
    aqi: normalizeText(realtime.aqi),
    future: Array.isArray(weatherResult && weatherResult.future) ? weatherResult.future : [],
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
    const apiKey = normalizeText(process.env.JUHE_WEATHER_API_KEY);

    if (!apiKey) {
      res.json({
        source: 'unconfigured',
        generatedAt: new Date().toISOString(),
        cacheTtlMs: WEATHER_CACHE_TTL_MS,
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
        message: '未配置 JUHE_WEATHER_API_KEY，当前无法拉取聚合天气数据。'
      });
      return;
    }

    if (!forceRefresh && weatherCache.payload && weatherCache.expiresAt > Date.now()) {
      res.json(Object.assign({}, weatherCache.payload, { source: 'cache' }));
      return;
    }

    const updatedAt = new Date().toTimeString().slice(0, 5);
    const cityGroups = {};

    centersData.forEach(center => {
      const queryCity = inferQueryCity(center);
      if (!cityGroups[queryCity]) {
        cityGroups[queryCity] = [];
      }
      cityGroups[queryCity].push(center);
    });

    const queryCities = Object.keys(cityGroups);
    const weatherResults = await mapWithConcurrency(queryCities, WEATHER_CONCURRENCY, async city => {
      try {
        const result = await fetchJuheWeather(city, apiKey);
        return { city, ok: true, result };
      } catch (error) {
        return { city, ok: false, error: error.message };
      }
    });

    const weatherByCity = {};
    const failures = [];

    weatherResults.forEach(item => {
      if (item.ok) {
        weatherByCity[item.city] = item.result;
      } else {
        failures.push({
          city: item.city,
          message: item.error
        });
      }
    });

    const centerWeather = [];
    centersData.forEach(center => {
      const queryCity = inferQueryCity(center);
      const result = weatherByCity[queryCity];
      if (!result) return;
      centerWeather.push(toCenterWeatherRecord(center, result, updatedAt));
    });

    const payload = buildDashboardPayload(centerWeather, failures, 'juhe');
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
