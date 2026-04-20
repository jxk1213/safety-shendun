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

  var WEATHER_LEVEL_META = {
    '红色': { value: 4, color: '#ff5b6e', glow: 'rgba(255, 91, 110, 0.34)' },
    '橙色': { value: 3, color: '#ff9b4a', glow: 'rgba(255, 155, 74, 0.3)' },
    '黄色': { value: 2, color: '#ffd84f', glow: 'rgba(255, 216, 79, 0.28)' },
    '蓝色': { value: 1, color: '#3fc7ff', glow: 'rgba(63, 199, 255, 0.28)' }
  };

  var WEATHER_ALERTS = [
    {
      mapName: '广东',
      label: '广东',
      type: '高温',
      level: '红色',
      updatedAt: '10:20',
      title: '粤中高温持续增强',
      cities: ['广州', '深圳', '中山'],
      action: '启用高温停靠与错峰作业机制'
    },
    {
      mapName: '京津冀大区',
      label: '京津冀大区',
      type: '雾霾 / 雨雪',
      level: '橙色',
      updatedAt: '10:05',
      title: '低能见度与冰冻路段叠加',
      cities: ['北京', '石家庄', '保定'],
      action: '下发进场慢行与防滑提醒'
    },
    {
      mapName: '广西',
      label: '广西',
      type: '冰雹',
      level: '橙色',
      updatedAt: '08:55',
      title: '桂中冰雹对流活跃',
      cities: ['南宁', '柳州'],
      action: '暂停室外装卸并巡检临时设施'
    },
    {
      mapName: '山东',
      label: '山东',
      type: '雾霾',
      level: '黄色',
      updatedAt: '08:10',
      title: '鲁中重污染抬升',
      cities: ['济南', '济宁'],
      action: '开启雾霾运输提示与慢行机制'
    },
    {
      mapName: '浙江',
      label: '浙江',
      type: '短时强降水',
      level: '蓝色',
      updatedAt: '09:12',
      title: '杭州局部短时强降水',
      cities: ['杭州', '临平'],
      action: '重点检查装卸坡道与防滑垫'
    },
    {
      mapName: '湖南',
      label: '湖南',
      type: '高温',
      level: '橙色',
      updatedAt: '09:28',
      title: '长沙热浪持续',
      cities: ['长沙'],
      action: '执行高温轮岗与补水检查'
    },
    {
      mapName: '西北大区',
      label: '西北大区',
      type: '沙尘暴',
      level: '蓝色',
      updatedAt: '08:36',
      title: '西北风沙回流',
      cities: ['兰州', '乌鲁木齐'],
      action: '加强场地防尘与车辆滤芯巡检'
    }
  ];

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
      '.large-screen-wrap .container .content .content-middle{' +
        'min-height:0;' +
      '}' +
      '.large-screen-wrap .container .content .content-middle .bottom-col{' +
        'min-height:0;' +
      '}';
    document.head.appendChild(style);
  }

  function buildWeatherLookup() {
    var lookup = {};
    WEATHER_ALERTS.forEach(function (item) {
      lookup[item.mapName] = item;
    });
    return lookup;
  }

  var weatherLookup = buildWeatherLookup();

  function buildWeatherSeriesData() {
    return WEATHER_ALERTS.map(function (item) {
      return {
        name: item.mapName,
        value: WEATHER_LEVEL_META[item.level].value,
        weatherLevel: item.level,
        weatherType: item.type,
        alertTitle: item.title,
        updatedAt: item.updatedAt,
        cities: item.cities,
        action: item.action
      };
    });
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
          '<div class="sd-weather-tooltip-empty">当前暂无天气预警，维持常态监测。</div>' +
        '</div>';
    }

    return '' +
      '<div class="sd-weather-tooltip">' +
        '<div class="sd-weather-tooltip-header">' +
          '<div class="sd-weather-tooltip-title">' + escapeHtml(info.label) + '</div>' +
          '<span class="sd-weather-tooltip-badge" style="' + getLevelBadgeStyle(info.level) + '">' + escapeHtml(info.level) + '</span>' +
        '</div>' +
        '<div class="sd-weather-tooltip-subtitle">' + escapeHtml(info.type + ' · ' + info.title) + '</div>' +
        '<div class="sd-weather-tooltip-meta">' +
          '<div class="sd-weather-tooltip-item"><strong>更新时间</strong><span>' + escapeHtml(info.updatedAt) + '</span></div>' +
          '<div class="sd-weather-tooltip-item"><strong>应对措施</strong><span>' + escapeHtml(info.action) + '</span></div>' +
        '</div>' +
        '<div class="sd-weather-tooltip-cities">' +
          info.cities.map(function (city) {
            return '<span>' + escapeHtml(city) + '</span>';
          }).join('') +
        '</div>' +
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
    var seriesData = buildWeatherSeriesData();
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
          data: seriesData,
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
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      ensureEnhancerMounted();
      if (attempts > 80) {
        window.clearInterval(timer);
      }
    }, 500);
    ensureEnhancerMounted();

    window.setInterval(function () {
      if (!document.querySelector('.large-screen-wrap')) return;
      ensureEnhancerMounted();
    }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapEnhancer);
  } else {
    bootstrapEnhancer();
  }
})();
