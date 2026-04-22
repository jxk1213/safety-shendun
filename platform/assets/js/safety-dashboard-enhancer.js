(function () {
  'use strict';

  var DASHBOARD_MODE = {
    SAFETY: 'safety',
    WEATHER: 'weather'
  };

  var currentMode = DASHBOARD_MODE.SAFETY;
  var enhancerReady = false;
  var dashboardVm = null;
  var mapVm = null;
  var originalDrawChart = null;
  var weatherLookup = {};
  var weatherSeriesData = [];
  var weatherCenterLookup = {};
  var weatherLoading = false;
  var weatherFetchError = '';
  var weatherFetchPromise = null;
  var weatherRefreshTimer = null;
  var mountRetryTimer = null;
  var enhancerWatchTimer = null;
  var destroyRequested = false;

  var WEATHER_API_URL = '/api/weather/dashboard';
  var WEATHER_REFRESH_MS = 5 * 60 * 1000;

  var WEATHER_LEVEL_META = {
    '红色': { value: 4, color: '#ff5b6e', glow: 'rgba(255, 91, 110, 0.34)' },
    '橙色': { value: 3, color: '#ff9b4a', glow: 'rgba(255, 155, 74, 0.3)' },
    '黄色': { value: 2, color: '#ffd84f', glow: 'rgba(255, 216, 79, 0.28)' },
    '蓝色': { value: 1, color: '#3fc7ff', glow: 'rgba(63, 199, 255, 0.28)' }
  };

  function injectEnhancerStyles() {
    if (document.getElementById('safetyDashboardEnhancerStyle')) return;
    var style = document.createElement('style');
    style.id = 'safetyDashboardEnhancerStyle';
    style.textContent = '' +
      '.sd-mode-switch{' +
        'display:flex;' +
        'align-items:center;' +
        'justify-content:space-between;' +
        'gap:20px;' +
        'margin:4px 0 14px;' +
        'padding:8px 14px 10px;' +
        'flex:0 0 auto;' +
        'border:1px solid rgba(28,72,122,0.82);' +
        'background:linear-gradient(180deg, rgba(3,20,50,0.94), rgba(6,24,58,0.82));' +
        'box-shadow:inset 0 0 0 1px rgba(0,229,255,0.08), 0 10px 24px rgba(0,0,0,0.18);' +
      '}' +
      '.sd-mode-switch-main{' +
        'display:grid;' +
        'grid-template-columns:1fr 1fr;' +
        'gap:12px;' +
        'flex:1;' +
      '}' +
      '.sd-mode-btn{' +
        'position:relative;' +
        'height:42px;' +
        'border:1px solid rgba(0,229,255,0.34);' +
        'background:rgba(8,48,74,0.72);' +
        'color:#7feeff;' +
        'font-size:22px;' +
        'font-weight:700;' +
        'letter-spacing:1px;' +
        'cursor:pointer;' +
        'transition:all .18s ease;' +
      '}' +
      '.sd-mode-btn:hover{' +
        'border-color:rgba(0,229,255,0.7);' +
        'color:#dfffff;' +
      '}' +
      '.sd-mode-btn.is-active{' +
        'background:linear-gradient(180deg, rgba(0,229,255,0.22), rgba(8,48,74,0.94));' +
        'box-shadow:inset 0 -2px 0 rgba(0,229,255,0.82), 0 0 22px rgba(0,229,255,0.12);' +
        'color:#ffffff;' +
      '}' +
      '.sd-mode-btn.is-active::after{' +
        'content:"";' +
        'position:absolute;' +
        'left:16%;' +
        'right:16%;' +
        'bottom:-1px;' +
        'height:3px;' +
        'background:#39f0ff;' +
        'box-shadow:0 0 12px rgba(57,240,255,0.7);' +
      '}' +
      '.sd-weather-legend{' +
        'display:none;' +
        'align-items:center;' +
        'gap:14px;' +
        'flex-wrap:wrap;' +
        'font-size:12px;' +
        'color:rgba(190,243,255,0.8);' +
        'white-space:nowrap;' +
      '}' +
      '.sd-weather-legend.is-visible{display:flex;}' +
      '.sd-weather-legend-item{' +
        'display:inline-flex;' +
        'align-items:center;' +
        'gap:6px;' +
      '}' +
      '.sd-weather-legend-dot{' +
        'width:8px;' +
        'height:8px;' +
        'border-radius:999px;' +
        'box-shadow:0 0 10px currentColor;' +
      '}' +
      '.sd-weather-tooltip{' +
        'min-width:250px;' +
        'max-width:320px;' +
        'padding:12px 14px 14px;' +
        'background:linear-gradient(180deg, rgba(5,18,42,0.98), rgba(8,28,64,0.95));' +
        'border:1px solid rgba(63,199,255,0.42);' +
        'box-shadow:0 16px 34px rgba(0,0,0,0.34);' +
        'color:#e7fbff;' +
      '}' +
      '.sd-weather-tooltip-header{' +
        'display:flex;' +
        'align-items:center;' +
        'justify-content:space-between;' +
        'gap:12px;' +
        'margin-bottom:8px;' +
      '}' +
      '.sd-weather-tooltip-title{' +
        'font-size:16px;' +
        'font-weight:700;' +
        'color:#ffffff;' +
      '}' +
      '.sd-weather-tooltip-badge{' +
        'display:inline-flex;' +
        'align-items:center;' +
        'padding:2px 8px;' +
        'border-radius:999px;' +
        'font-size:12px;' +
        'font-weight:700;' +
        'color:#0b1630;' +
      '}' +
      '.sd-weather-tooltip-subtitle{' +
        'font-size:13px;' +
        'line-height:1.5;' +
        'color:#9fefff;' +
      '}' +
      '.sd-weather-tooltip-meta{' +
        'margin-top:10px;' +
        'display:grid;' +
        'grid-template-columns:1fr 1fr;' +
        'gap:8px;' +
      '}' +
      '.sd-weather-tooltip-item{' +
        'padding:8px 10px;' +
        'background:rgba(255,255,255,0.06);' +
        'border:1px solid rgba(63,199,255,0.12);' +
      '}' +
      '.sd-weather-tooltip-item strong{' +
        'display:block;' +
        'font-size:11px;' +
        'font-weight:600;' +
        'color:rgba(185,245,255,0.72);' +
        'margin-bottom:4px;' +
      '}' +
      '.sd-weather-tooltip-item span{' +
        'font-size:13px;' +
        'color:#ffffff;' +
      '}' +
      '.sd-weather-tooltip-empty{' +
        'padding:10px 12px;' +
        'background:rgba(255,255,255,0.05);' +
        'border:1px solid rgba(63,199,255,0.1);' +
        'font-size:13px;' +
        'line-height:1.6;' +
        'color:#c7f6ff;' +
      '}' +
      '.sd-weather-tooltip-cities{' +
        'margin-top:10px;' +
        'display:flex;' +
        'flex-wrap:wrap;' +
        'gap:8px;' +
      '}' +
      '.sd-weather-tooltip-cities span{' +
        'display:inline-flex;' +
        'align-items:center;' +
        'padding:3px 8px;' +
        'background:rgba(63,199,255,0.12);' +
        'border:1px solid rgba(63,199,255,0.16);' +
        'font-size:12px;' +
        'color:#e8fcff;' +
      '}' +
      '.sd-weather-tooltip-section-title{' +
        'margin-top:10px;' +
        'font-size:12px;' +
        'font-weight:700;' +
        'letter-spacing:0.4px;' +
        'color:#9fefff;' +
      '}' +
      '.sd-weather-tooltip-centers{' +
        'margin-top:8px;' +
        'display:grid;' +
        'gap:8px;' +
        'max-height:220px;' +
        'overflow:auto;' +
        'padding-right:4px;' +
      '}' +
      '.sd-weather-tooltip-centers::-webkit-scrollbar{' +
        'width:6px;' +
      '}' +
      '.sd-weather-tooltip-centers::-webkit-scrollbar-thumb{' +
        'background:rgba(63,199,255,0.3);' +
        'border-radius:999px;' +
      '}' +
      '.sd-weather-tooltip-center{' +
        'padding:8px 10px;' +
        'background:rgba(255,255,255,0.06);' +
        'border:1px solid rgba(63,199,255,0.14);' +
      '}' +
      '.sd-weather-tooltip-center-row{' +
        'display:flex;' +
        'align-items:center;' +
        'justify-content:space-between;' +
        'gap:8px;' +
      '}' +
      '.sd-weather-tooltip-center-name{' +
        'font-size:13px;' +
        'font-weight:700;' +
        'color:#ffffff;' +
      '}' +
      '.sd-weather-tooltip-center-badge{' +
        'display:inline-flex;' +
        'align-items:center;' +
        'padding:1px 6px;' +
        'border-radius:999px;' +
        'font-size:11px;' +
        'font-weight:700;' +
        'color:#0b1630;' +
      '}' +
      '.sd-weather-tooltip-center-meta{' +
        'margin-top:4px;' +
        'font-size:12px;' +
        'line-height:1.6;' +
        'color:#d8f8ff;' +
      '}' +
      '.large-screen-wrap .container .content .content-middle{' +
        'min-height:0;' +
      '}' +
      '.large-screen-wrap .container .content .content-middle .bottom-col{' +
        'min-height:0;' +
      '}';
    document.head.appendChild(style);
  }

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function normalizeProvinceName(value) {
    return normalizeText(value)
      .replace(/省公司|市公司|大区|省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区/g, '');
  }

  function getLevelValue(level) {
    return WEATHER_LEVEL_META[level] ? WEATHER_LEVEL_META[level].value : 0;
  }

  function getAlertTypeLabel(type) {
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
        return normalizeText(type) || '天气';
    }
  }

  function buildCenterWeatherLabel(entry) {
    if (!entry) return '';
    var bits = [];
    if (entry.city || entry.shortName) bits.push(entry.city || entry.shortName);
    if (entry.weather) bits.push(entry.weather);
    if (entry.temperature) bits.push(entry.temperature + '℃');
    if (entry.aqi) bits.push('AQI ' + entry.aqi);
    return bits.join(' ');
  }

  function uniqueList(list) {
    var seen = {};
    return (Array.isArray(list) ? list : []).filter(function (item) {
      var key = normalizeText(item);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function compareAlertPriority(left, right) {
    var levelDiff = getLevelValue(right && right.level) - getLevelValue(left && left.level);
    if (levelDiff !== 0) return levelDiff;
    return normalizeText(left && left.cityName).localeCompare(normalizeText(right && right.cityName), 'zh-CN');
  }

  function matchesCenterAlert(entry, alert) {
    var centerName = normalizeText(entry && (entry.shortName || entry.centerName || entry.city));
    var cityName = normalizeText(entry && entry.city);
    var centerNames = Array.isArray(alert && alert.centerNames) ? alert.centerNames : [];
    return centerNames.some(function (name) {
      var text = normalizeText(name);
      if (!text) return false;
      return (centerName && (centerName.indexOf(text) >= 0 || text.indexOf(centerName) >= 0))
        || (cityName && (cityName.indexOf(text) >= 0 || text.indexOf(cityName) >= 0));
    });
  }

  function buildCenterWeatherDetails(centers, alerts) {
    return centers.map(function (entry) {
      var matchedAlert = (alerts || []).find(function (alert) {
        return matchesCenterAlert(entry, alert);
      });
      return {
        name: normalizeText(entry.shortName || entry.centerName || entry.city) || '--',
        weather: normalizeText(entry.weather) || '天气平稳',
        temperature: normalizeText(entry.temperature),
        aqi: normalizeText(entry.aqi),
        updatedAt: normalizeText(entry.updatedAt),
        level: matchedAlert ? matchedAlert.level : '',
        response: matchedAlert ? matchedAlert.response : ''
      };
    }).sort(function (left, right) {
      var levelDiff = getLevelValue(right.level) - getLevelValue(left.level);
      if (levelDiff !== 0) return levelDiff;
      return normalizeText(left.name).localeCompare(normalizeText(right.name), 'zh-CN');
    });
  }

  function buildProvinceWeatherState(payload) {
    var provinceInfo = {};
    var alerts = Array.isArray(payload && payload.alerts) ? payload.alerts : [];
    var centerWeather = Array.isArray(payload && payload.centerWeather) ? payload.centerWeather : [];

    centerWeather.forEach(function (entry) {
      var provinceName = normalizeProvinceName(entry.provinceName);
      if (!provinceName) return;
      if (!provinceInfo[provinceName]) {
        provinceInfo[provinceName] = {
          provinceName: provinceName,
          alerts: [],
          centers: []
        };
      }
      provinceInfo[provinceName].centers.push(entry);
    });

    alerts.forEach(function (alert) {
      if (alert.scope !== 'city') return;
      var provinceName = normalizeProvinceName(alert.provinceName);
      if (!provinceName) return;
      if (!provinceInfo[provinceName]) {
        provinceInfo[provinceName] = {
          provinceName: provinceName,
          alerts: [],
          centers: []
        };
      }
      provinceInfo[provinceName].alerts.push(alert);
    });

    weatherLookup = {};
    weatherCenterLookup = {};
    weatherSeriesData = [];

    Object.keys(provinceInfo).forEach(function (provinceName) {
      var info = provinceInfo[provinceName];
      var sortedAlerts = info.alerts.slice().sort(compareAlertPriority);
      var topAlert = sortedAlerts[0] || null;
      var centers = info.centers.slice().sort(function (left, right) {
        return normalizeText(left.city || left.shortName).localeCompare(normalizeText(right.city || right.shortName), 'zh-CN');
      });
      var cities = uniqueList(
        sortedAlerts.map(function (item) { return item.cityName; })
          .concat(centers.map(function (item) { return item.city || item.shortName; }))
      );
      var centerSummaries = uniqueList(centers.map(buildCenterWeatherLabel));
      var centerDetails = buildCenterWeatherDetails(centers, sortedAlerts);

      weatherLookup[provinceName] = {
        mapName: provinceName,
        label: provinceName,
        type: topAlert ? getAlertTypeLabel(topAlert.type) : '无预警',
        level: topAlert ? topAlert.level : '',
        updatedAt: topAlert ? topAlert.updatedAt : (centers[0] && centers[0].updatedAt) || '--:--',
        title: topAlert ? topAlert.title : (provinceName + '天气平稳'),
        action: topAlert ? topAlert.response : '当前暂无天气预警，维持常态监测。',
        desc: topAlert ? topAlert.desc : (centerSummaries[0] || '当前暂无天气预警，维持常态监测。'),
        cities: cities,
        centerSummaries: centerSummaries,
        centerDetails: centerDetails
      };

      weatherCenterLookup[provinceName] = centers;

      if (topAlert && WEATHER_LEVEL_META[topAlert.level]) {
        weatherSeriesData.push({
          name: provinceName,
          value: WEATHER_LEVEL_META[topAlert.level].value,
          weatherLevel: topAlert.level,
          weatherType: getAlertTypeLabel(topAlert.type),
          alertTitle: topAlert.title,
          updatedAt: topAlert.updatedAt,
          cities: cities,
          action: topAlert.response
        });
      }
    });
  }

  function fetchWeatherDashboard(forceRefresh) {
    if (destroyRequested) {
      return Promise.resolve(null);
    }
    if (weatherFetchPromise) return weatherFetchPromise;

    weatherLoading = true;
    weatherFetchError = '';
    var url = WEATHER_API_URL + (forceRefresh ? '?force=1' : '');

    weatherFetchPromise = window.fetch(url, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function (payload) {
        if (destroyRequested) return payload;
        buildProvinceWeatherState(payload || {});
        weatherLoading = false;
        weatherFetchPromise = null;
        if (currentMode === DASHBOARD_MODE.WEATHER) {
          renderCurrentMode();
        }
        return payload;
      })
      .catch(function (error) {
        if (destroyRequested) return null;
        weatherLoading = false;
        weatherFetchPromise = null;
        weatherFetchError = error && error.message ? error.message : '天气数据加载失败';
        if (currentMode === DASHBOARD_MODE.WEATHER) {
          renderCurrentMode();
        }
      });

    return weatherFetchPromise;
  }

  function getLevelBadgeStyle(level) {
    var meta = WEATHER_LEVEL_META[level] || WEATHER_LEVEL_META['蓝色'];
    return 'background:' + meta.color + '; box-shadow: 0 0 16px ' + meta.glow + ';';
  }

  function renderWeatherTooltip(params) {
    var info = weatherLookup[params.name];
    if (!info) {
      return '' +
        '<div class="sd-weather-tooltip">' +
          '<div class="sd-weather-tooltip-header">' +
            '<div class="sd-weather-tooltip-title">' + escapeHtml(params.name) + '</div>' +
          '</div>' +
          '<div class="sd-weather-tooltip-empty">' + escapeHtml(weatherLoading ? '天气数据加载中，请稍候。' : (weatherFetchError || '当前暂无天气预警，维持常态监测。')) + '</div>' +
        '</div>';
    }

    var badge = info.level
      ? '<span class="sd-weather-tooltip-badge" style="' + getLevelBadgeStyle(info.level) + '">' + escapeHtml(info.level) + '</span>'
      : '<span class="sd-weather-tooltip-badge" style="' + getLevelBadgeStyle('蓝色') + '">平稳</span>';
    var cityMarkup = info.cities.length
      ? '<div class="sd-weather-tooltip-cities">' + info.cities.map(function (city) {
          return '<span>' + escapeHtml(city) + '</span>';
        }).join('') + '</div>'
      : '';
    var centerSummaryMarkup = info.centerSummaries.length
      ? '<div class="sd-weather-tooltip-cities">' + info.centerSummaries.map(function (summary) {
          return '<span>' + escapeHtml(summary) + '</span>';
        }).join('') + '</div>'
      : '';
    var centerDetailMarkup = info.centerDetails && info.centerDetails.length
      ? '<div class="sd-weather-tooltip-section-title">所辖中心天气</div>' +
        '<div class="sd-weather-tooltip-centers">' + info.centerDetails.map(function (center) {
          var centerBadge = center.level
            ? '<span class="sd-weather-tooltip-center-badge" style="' + getLevelBadgeStyle(center.level) + '">' + escapeHtml(center.level) + '</span>'
            : '';
          var meta = [
            center.weather,
            center.temperature ? (center.temperature + '℃') : '',
            center.aqi ? ('AQI ' + center.aqi) : '',
            center.updatedAt ? ('更新 ' + center.updatedAt) : ''
          ].filter(Boolean).join(' · ');
          return '' +
            '<div class="sd-weather-tooltip-center">' +
              '<div class="sd-weather-tooltip-center-row">' +
                '<span class="sd-weather-tooltip-center-name">' + escapeHtml(center.name) + '</span>' +
                centerBadge +
              '</div>' +
              '<div class="sd-weather-tooltip-center-meta">' + escapeHtml(meta || '当前暂无中心天气详情') + '</div>' +
              (center.response ? '<div class="sd-weather-tooltip-center-meta">' + escapeHtml(center.response) + '</div>' : '') +
            '</div>';
        }).join('') + '</div>'
      : '';

    return '' +
      '<div class="sd-weather-tooltip">' +
        '<div class="sd-weather-tooltip-header">' +
          '<div class="sd-weather-tooltip-title">' + escapeHtml(info.label) + '</div>' +
          badge +
        '</div>' +
        '<div class="sd-weather-tooltip-subtitle">' + escapeHtml(info.type + ' · ' + info.title) + '</div>' +
        '<div class="sd-weather-tooltip-meta">' +
          '<div class="sd-weather-tooltip-item"><strong>更新时间</strong><span>' + escapeHtml(info.updatedAt) + '</span></div>' +
          '<div class="sd-weather-tooltip-item"><strong>应对措施</strong><span>' + escapeHtml(info.action) + '</span></div>' +
        '</div>' +
        '<div class="sd-weather-tooltip-subtitle" style="margin-top:10px;">' + escapeHtml(info.desc) + '</div>' +
        cityMarkup +
        centerSummaryMarkup +
        centerDetailMarkup +
      '</div>';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function createWeatherOption(chartInstance) {
    var echarts = chartInstance.$echarts || window.echarts;
    var graphic = echarts && echarts.graphic;
    return {
      visualMap: {
        show: false,
        type: 'piecewise',
        pieces: [
          { value: 4, color: WEATHER_LEVEL_META['红色'].color },
          { value: 3, color: WEATHER_LEVEL_META['橙色'].color },
          { value: 2, color: WEATHER_LEVEL_META['黄色'].color },
          { value: 1, color: WEATHER_LEVEL_META['蓝色'].color }
        ]
      },
      geo: {
        map: 'China',
        roam: false,
        zoom: 1.23,
        label: {
          normal: {
            show: true,
            fontSize: 10,
            color: '#ffffff'
          },
          emphasis: {
            show: true,
            fontSize: 12,
            color: '#ffffff'
          }
        },
        itemStyle: {
          normal: {
            areaColor: '#0f356a',
            borderColor: 'rgba(0, 0, 0, 0.2)'
          },
          emphasis: {
            borderColor: '#7ef2ff',
            borderWidth: 2,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowBlur: 18,
            shadowColor: 'rgba(0, 229, 255, 0.24)'
          }
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        extraCssText: 'box-shadow:none;',
        formatter: renderWeatherTooltip
      },
      series: [
        {
          name: '天气预警',
          type: 'map',
          geoIndex: 0,
          data: weatherSeriesData,
          animationDuration: 600,
          itemStyle: {
            borderColor: 'rgba(0, 0, 0, 0.22)',
            borderWidth: 1
          },
          emphasis: {
            label: {
              color: '#ffffff'
            },
            itemStyle: {
              borderColor: '#7ef2ff',
              borderWidth: 2,
              shadowBlur: 22,
              shadowColor: 'rgba(0, 229, 255, 0.28)'
            }
          }
        }
      ]
    };
  }

  function tuneSafetyVisualMap() {
    if (!mapVm || !mapVm.chart) return;
    mapVm.chart.setOption({
      visualMap: {
        type: 'continuous',
        orient: 'vertical',
        left: 14,
        right: 'auto',
        top: 'auto',
        bottom: 34,
        itemWidth: 14,
        itemHeight: 92,
        textGap: 10,
        precision: 0,
        textStyle: {
          color: '#ffffff',
          fontSize: 14
        }
      }
    });
  }

  function renderSafetyMode() {
    if (!mapVm || !mapVm.chart || typeof originalDrawChart !== 'function' || !mapVm.chartData) return;
    mapVm.chart.clear();
    originalDrawChart.call(mapVm, mapVm.chartData);
    tuneSafetyVisualMap();
  }

  function renderCurrentMode() {
    if (!mapVm || !mapVm.chart) return;
    if (currentMode === DASHBOARD_MODE.WEATHER) {
      fetchWeatherDashboard(false);
      mapVm.chart.clear();
      mapVm.chart.setOption(createWeatherOption(mapVm), true);
      updateToggleState();
      return;
    }
    if (typeof originalDrawChart === 'function' && mapVm.chartData) {
      renderSafetyMode();
      updateToggleState();
    }
  }

  function patchMapVm() {
    if (!mapVm || mapVm.__sdPatched) return;
    originalDrawChart = mapVm.drawChart;
    mapVm.drawChart = function (chartData) {
      this.chartData = chartData;
      if (currentMode === DASHBOARD_MODE.WEATHER) {
        if (this.chart) {
          this.chart.clear();
          this.chart.setOption(createWeatherOption(this), true);
        }
        return;
      }
      renderSafetyMode();
    };
    mapVm.__sdPatched = true;
  }

  function setMode(mode) {
    if (!mode || mode === currentMode) return;
    currentMode = mode;
    renderCurrentMode();
  }

  function updateToggleState() {
    var root = document.getElementById('sdModeSwitch');
    if (!root) return;
    root.querySelectorAll('.sd-mode-btn').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-mode') === currentMode);
    });
    var legend = root.querySelector('.sd-weather-legend');
    if (legend) legend.classList.toggle('is-visible', currentMode === DASHBOARD_MODE.WEATHER);
  }

  function injectToolbar() {
    if (document.getElementById('sdModeSwitch')) return true;
    var middleColumn = document.querySelector('.large-screen-wrap .content .content-middle');
    if (!middleColumn) return false;
    var bottomCol = middleColumn.querySelector('.bottom-col');
    if (!bottomCol) return false;

    var toolbar = document.createElement('div');
    toolbar.id = 'sdModeSwitch';
    toolbar.className = 'sd-mode-switch';
    toolbar.innerHTML = '' +
      '<div class="sd-mode-switch-main">' +
        '<button class="sd-mode-btn is-active" type="button" data-mode="safety">安全态势</button>' +
        '<button class="sd-mode-btn" type="button" data-mode="weather">天气预警</button>' +
      '</div>' +
      '<div class="sd-weather-legend">' +
        '<span class="sd-weather-legend-item"><i class="sd-weather-legend-dot" style="color:#ff5b6e;background:#ff5b6e;"></i>红色</span>' +
        '<span class="sd-weather-legend-item"><i class="sd-weather-legend-dot" style="color:#ff9b4a;background:#ff9b4a;"></i>橙色</span>' +
        '<span class="sd-weather-legend-item"><i class="sd-weather-legend-dot" style="color:#ffd84f;background:#ffd84f;"></i>黄色</span>' +
        '<span class="sd-weather-legend-item"><i class="sd-weather-legend-dot" style="color:#3fc7ff;background:#3fc7ff;"></i>蓝色</span>' +
        '<span class="sd-weather-legend-item">悬停省区查看预警详情</span>' +
      '</div>';

    toolbar.addEventListener('click', function (event) {
      var target = event.target.closest('.sd-mode-btn[data-mode]');
      if (!target) return;
      setMode(target.getAttribute('data-mode'));
    });

    middleColumn.insertBefore(toolbar, bottomCol);
    updateToggleState();
    return true;
  }

  function findDashboardVm() {
    var nodes = document.querySelectorAll('*');
    for (var i = 0; i < nodes.length; i += 1) {
      var vm = nodes[i].__vue__;
      if (vm && vm.$refs && vm.$refs.chart3 && vm.$refs.chart3.$refs && vm.$refs.chart3.$refs.chart) {
        return vm;
      }
    }
    return null;
  }

  function ensureEnhancerMounted() {
    if (destroyRequested) return false;
    if (enhancerReady && document.getElementById('sdModeSwitch') && mapVm && mapVm.chart) return true;
    injectEnhancerStyles();
    dashboardVm = findDashboardVm();
    if (!dashboardVm) return false;
    mapVm = dashboardVm.$refs.chart3.$refs.chart;
    if (!mapVm) return false;
    patchMapVm();
    if (!injectToolbar()) return false;
    renderCurrentMode();
    enhancerReady = true;
    return true;
  }

  function bootstrapEnhancer() {
    destroyRequested = false;
    fetchWeatherDashboard(false);
    var attempts = 0;
    if (mountRetryTimer) {
      window.clearInterval(mountRetryTimer);
    }
    mountRetryTimer = window.setInterval(function () {
      attempts += 1;
      ensureEnhancerMounted();
      if (attempts > 80) {
        window.clearInterval(mountRetryTimer);
        mountRetryTimer = null;
      }
    }, 500);
    ensureEnhancerMounted();

    if (enhancerWatchTimer) {
      window.clearInterval(enhancerWatchTimer);
    }
    enhancerWatchTimer = window.setInterval(function () {
      if (!document.querySelector('.large-screen-wrap')) return;
      ensureEnhancerMounted();
    }, 1500);

    if (!weatherRefreshTimer) {
      weatherRefreshTimer = window.setInterval(function () {
        fetchWeatherDashboard(true);
      }, WEATHER_REFRESH_MS);
    }
  }

  function destroyEnhancer() {
    destroyRequested = true;
    enhancerReady = false;
    dashboardVm = null;

    if (mountRetryTimer) {
      window.clearInterval(mountRetryTimer);
      mountRetryTimer = null;
    }
    if (enhancerWatchTimer) {
      window.clearInterval(enhancerWatchTimer);
      enhancerWatchTimer = null;
    }
    if (weatherRefreshTimer) {
      window.clearInterval(weatherRefreshTimer);
      weatherRefreshTimer = null;
    }

    var toolbar = document.getElementById('sdModeSwitch');
    if (toolbar && toolbar.parentNode) {
      toolbar.parentNode.removeChild(toolbar);
    }

    if (mapVm && originalDrawChart) {
      mapVm.drawChart = originalDrawChart;
      mapVm.__sdPatched = false;
    }

    mapVm = null;
    originalDrawChart = null;
    weatherFetchPromise = null;
    window.__SAFETY_DASHBOARD_ENHANCER__ = null;
  }

  window.__SAFETY_DASHBOARD_ENHANCER__ = {
    destroy: destroyEnhancer
  };

  window.addEventListener('pagehide', destroyEnhancer);
  window.addEventListener('beforeunload', destroyEnhancer);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapEnhancer);
  } else {
    bootstrapEnhancer();
  }
})();
