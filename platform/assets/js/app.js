/**
 * 申盾智能安全平台 - 前端应用
 */

(function () {
  'use strict';

  // ============ API 配置 ============
  var API_BASE = (function () {
    var origin = window.location.origin;
    if (!origin || origin === 'null' || origin === 'file://' || window.location.protocol === 'file:') {
      return 'http://localhost:3000';
    }
    return origin;
  })();

  function apiGet(path) {
    return fetch(API_BASE + path).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function apiPost(path, body) {
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function apiPostForm(path, formData) {
    return fetch(API_BASE + path, {
      method: 'POST',
      body: formData
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function apiPatch(path, body) {
    return fetch(API_BASE + path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function apiDelete(path) {
    return fetch(API_BASE + path, { method: 'DELETE' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  // ============ 页面配置 ============
  const PAGE_CONFIG = {
    'safety-dashboard': {
      title: '安全大屏',
      breadcrumb: ['首页', '安全大屏']
    },
    dashboard: {
      title: '工作台',
      breadcrumb: ['首页', '工作台']
    },
    'dual-prevention': {
      title: '双重预防机制',
      breadcrumb: ['首页', '核心业务', '双重预防机制']
    },
    'accident-emergency': {
      title: '事故与应急管理',
      breadcrumb: ['首页', '核心业务', '事故与应急管理']
    },
    'accident-report': {
      title: '事故上报',
      breadcrumb: ['首页', '核心业务', '事故与应急管理', '事故上报']
    },
    personnel: {
      title: '人员安全管理',
      breadcrumb: ['首页', '基础要素', '人员安全管理']
    },
    facility: {
      title: '场地与设施管理',
      breadcrumb: ['首页', '基础要素', '场地与设施管理']
    },
    park: {
      title: '园区综合管理',
      breadcrumb: ['首页', '基础要素', '园区综合管理']
    },
    'delivery-safety': {
      title: '寄递安全管理',
      breadcrumb: ['首页', '专项安全', '寄递安全管理']
    },
    training: {
      title: '培训与宣教',
      breadcrumb: ['首页', '培训与文化', '培训与宣教']
    },
    'data-center': {
      title: '数据与分析中心',
      breadcrumb: ['首页', '辅助运营', '数据与分析中心']
    },
    document: {
      title: '制度与文档管理',
      breadcrumb: ['首页', '辅助运营', '制度与文档管理']
    },
    system: {
      title: '系统与权限管理',
      breadcrumb: ['首页', '辅助运营', '系统与权限管理']
    }
  };

  const BREADCRUMB_NAV_MAP = {
    '首页': 'dashboard',
    '安全大屏': 'safety-dashboard',
    '核心业务': 'dual-prevention',
    '基础要素': 'personnel',
    '专项安全': 'delivery-safety',
    '培训与文化': 'training',
    '辅助运营': 'data-center',
    '工作台': 'dashboard',
    '双重预防机制': 'dual-prevention',
    '事故与应急管理': 'accident-emergency',
    '事故上报': 'accident-report',
    '人员安全管理': 'personnel',
    '场地与设施管理': 'facility',
    '园区综合管理': 'park',
    '寄递安全管理': 'delivery-safety',
    '培训与宣教': 'training',
    '数据与分析中心': 'data-center',
    '制度与文档管理': 'document',
    '系统与权限管理': 'system'
  };

  /**
   * 隐患类别与二级描述（与《隐患及内容选项.xlsx》Sheet1 一致）
   * 分类 -> 内容选项列表
   */
  var HAZARD_CATEGORY_LIST = [
    '消防安全',
    '设备安全',
    '标志标牌类',
    '人车分离',
    '场所管理',
    '人员管理',
    '台账类',
    '消防类',
    '其他',
    '食安类'
  ];
  var HAZARD_CATEGORY_CONTENT = {
    '消防安全': [
      '未建立健全消防安全工作责任制且未落实各层级各岗位人员消防安全职责（消防制度、操作规程、应急预案、演练、消防器材）；'
    ],
    '设备安全': [
      '传送带滚筒、托辊、皮带分段接缝等人体能触及到的设备外露旋转部位未设置符合安全要求的防护罩、防护栏、过渡板等安全防护装置；',
      '分抹设备人员操作侧未设置符合国家标准的急停装置（10米）；'
    ],
    '标志标牌类': [
      '易发生高处坠落、物体打击、机械伤害等事故区域未设置安全警示标志和安全防护设备；',
      '对邮件快件处理场所内部人车交汇、装卸、接驳等区域未设置安全警示标志和安全防护设备；'
    ],
    '人车分离': [
      '在邮件快件处理场所内部未通过地面划线或安装隔离设备等方式划分人行道与机动车道；',
      '对进入邮件快件处理场所内部道路的装卸、接驳车辆未规划指定行驶路线、指定停靠位置;'
    ],
    '场所管理': [
      '该场所为“三合一”场所；'
    ],
    '人员管理': [
      '从业人员未进行培训或培训不达标或无书面培训记录；'
    ],
    '台账类': [
      '监控录像保存时间不足90日（含监控不在线）；'
    ],
    '消防类': [
      '从业人员在场所内吸烟或者有明火；',
      '充电柜旁、消防设施等堆放杂物；',
      '室内不规范充电；'
    ],
    '其他': [
      '其他（备案资质、警示牌、消防点检卡等）'
    ],
    '食安类': [
      '场地内部发现虫鼠害实体（鼠、猫、狗等）'
    ]
  };

  // ============ DOM 元素 ============
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarNav = document.getElementById('sidebarNav');
  const mainContent = document.getElementById('mainContent');
  const breadcrumb = document.getElementById('breadcrumb');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const topbar = document.querySelector('.topbar');

  let currentPage = 'dashboard';

  // ============ 初始化 ============
  function init() {
    renderPage('dashboard');
    bindEvents();
  }

  function bindEvents() {
    sidebarNav.addEventListener('click', function (e) {
      const navItem = e.target.closest('.nav-item');
      if (!navItem) return;
      const page = navItem.dataset.page;
      if (page) navigateTo(page);
    });

    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('collapsed');
    });

    mobileMenuBtn.addEventListener('click', function () {
      sidebar.classList.toggle('mobile-open');
      sidebarOverlay.classList.toggle('active');
    });

    sidebarOverlay.addEventListener('click', function () {
      sidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('active');
    });

    fullscreenBtn.addEventListener('click', function () {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    mainContent.addEventListener('click', function (e) {
      const card = e.target.closest('.module-card[data-page]');
      if (card) {
        navigateTo(card.dataset.page);
        return;
      }

      const quickAction = e.target.closest('.quick-action-item[data-page]');
      if (quickAction) {
        navigateTo(quickAction.dataset.page);
        return;
      }

      const featureCard = e.target.closest('.feature-card[data-page]');
      if (featureCard) {
        navigateTo(featureCard.dataset.page);
      }
    });

    breadcrumb.addEventListener('click', function (e) {
      const item = e.target.closest('.breadcrumb-item[data-page]');
      if (item) {
        navigateTo(item.dataset.page);
      }
    });
  }

  function navigateTo(page) {
    if (!PAGE_CONFIG[page]) return;
    currentPage = page;

    document.querySelectorAll('.nav-item').forEach(function (item) {
      item.classList.toggle('active', item.dataset.page === page);
    });

    updateBreadcrumb(page);
    renderPage(page);

    // 大屏页面时隐藏顶部工具栏
    if (topbar) {
      topbar.style.display = (page === 'safety-dashboard') ? 'none' : 'flex';
    }

    sidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('active');
  }

  function updateBreadcrumb(page) {
    const config = PAGE_CONFIG[page];
    if (!config) return;
    const items = config.breadcrumb;
    let html = '';
    items.forEach(function (item, index) {
      if (index > 0) html += '<span class="breadcrumb-separator">/</span>';
      const isLast = index === items.length - 1;
      const navPage = BREADCRUMB_NAV_MAP[item];
      
      if (navPage && !isLast) {
        html += '<span class="breadcrumb-item clickable" data-page="' + navPage + '">' + item + '</span>';
      } else {
        html += '<span class="breadcrumb-item' + (isLast ? ' active' : '') + '">' + item + '</span>';
      }
    });
    breadcrumb.innerHTML = html;
  }

  // ============ 页面渲染 ============
  function renderPage(page) {
    mainContent.scrollTop = 0;
    switch (page) {
      case 'safety-dashboard': mainContent.innerHTML = renderSafetyDashboard(); break;
      case 'dashboard': mainContent.innerHTML = renderDashboard(); break;
      case 'dual-prevention':
        mainContent.innerHTML = renderDualPrevention();
        initDualPreventionMainTab();
        initDualPreventionRiskReportWorkflow();
        initDualPreventionRiskTierTablePager();
        initDualPreventionRiskControlSimplePager();
        initDualPreventionHazardTab();
        break;
      case 'accident-emergency':
        mainContent.innerHTML = renderAccidentEmergency();
        initAccidentEmergencyTab();
        break;
      case 'personnel': mainContent.innerHTML = renderPersonnel(); break;
      case 'facility': mainContent.innerHTML = renderFacility(); break;
      case 'park': mainContent.innerHTML = renderPark(); break;
      case 'delivery-safety': mainContent.innerHTML = renderDeliverySafety(); break;
      case 'accident-report':
        mainContent.innerHTML = renderAccidentReport();
        initAccidentReport();
        break;
      case 'training': mainContent.innerHTML = renderTraining(); break;
      case 'data-center': mainContent.innerHTML = renderDataCenter(); break;
      case 'document': mainContent.innerHTML = renderDocument(); break;
      case 'system': mainContent.innerHTML = renderSystem(); break;
      default: mainContent.innerHTML = renderDashboard();
    }
  }

  // ============ 安全大屏 ============
  function renderSafetyDashboard() {
    return '' +
      '<div style="margin: -24px; height: 100vh; width: calc(100% + 48px); display:flex; flex-direction:column; overflow:hidden;">' +
        '<div style="flex:1; width:100%; position:relative;">' +
          '<iframe src="safety-dashboard/index.html" style="width:100%; height:100%; border:none; background:#000; position:absolute; top:0; left:0;"></iframe>' +
        '</div>' +
      '</div>';
  }

  // ============ 工作台（首页） ============
  function renderDashboard() {
    return '' +
      '<div class="page-header">' +
        '<div class="page-title">工作台</div>' +
        '<div class="page-desc">申通快递安全管理平台 -- 全面掌控安全态势</div>' +
      '</div>' +

      // 统计卡片
      '<div class="stats-row">' +
        buildStatCard('待处理隐患', '12', '较上周 +3', 'up',
          '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', 'orange') +
        buildStatCard('本月安全检查', '48', '完成率 92%', 'up',
          '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l8 4v6c0 5.25-3.5 10-8 11-4.5-1-8-5.75-8-11V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>', 'blue') +
        buildStatCard('培训完成人数', '326', '较上月 +58', 'up',
          '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>', 'green') +
        buildStatCard('本月事故数', '0', '连续安全运营 32 天', 'up',
          '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', 'red') +
      '</div>' +

      // 快捷入口
      '<div class="section-title">快捷入口</div>' +
      '<div class="quick-actions">' +
        buildQuickAction('隐患上报', 'var(--warning-light)', 'var(--warning)',
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', 'dual-prevention') +
        buildQuickAction('安全检查', 'var(--primary-light)', 'var(--primary)',
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l8 4v6c0 5.25-3.5 10-8 11-4.5-1-8-5.75-8-11V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>', 'dual-prevention') +
        buildQuickAction('事故上报', 'var(--danger-light)', 'var(--danger)',
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>', 'accident-emergency') +
        buildQuickAction('培训报名', 'var(--success-light)', 'var(--success)',
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>', 'training') +
        buildQuickAction('文档查询', 'var(--info-light)', 'var(--info)',
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', 'document') +
      '</div>' +

      // 双列面板
      '<div class="two-col">' +
        // 待办事项
        '<div class="panel">' +
          '<div class="panel-header">' +
            '<div class="panel-title">待办事项</div>' +
            '<span class="panel-link">查看全部</span>' +
          '</div>' +
          '<div class="panel-body">' +
            '<ul class="todo-list">' +
              buildTodoItem('urgent', '华东分拨中心消防隐患待整改', '2026-03-20 截止') +
              buildTodoItem('urgent', '3月安全生产检查报告待审批', '2026-03-19 截止') +
              buildTodoItem('normal', '新员工入职安全培训（第3批）', '2026-03-22 截止') +
              buildTodoItem('normal', '叉车年检资质更新', '2026-03-25 截止') +
              buildTodoItem('low', '安全文化月活动方案确认', '2026-03-28 截止') +
            '</ul>' +
          '</div>' +
        '</div>' +

        // 最新通知
        '<div class="panel">' +
          '<div class="panel-header">' +
            '<div class="panel-title">最新通知</div>' +
            '<span class="panel-link">查看全部</span>' +
          '</div>' +
          '<div class="panel-body">' +
            '<ul class="notice-list">' +
              buildNoticeItem('warn', '预警', '暴雨黄色预警：华东区域未来24小时有大到暴雨', '10 分钟前') +
              buildNoticeItem('err', '事故', '西南转运中心发生轻微叉车碰撞事件', '2 小时前') +
              buildNoticeItem('info', '通知', '2026年Q1安全培训考核成绩已发布', '3 小时前') +
              buildNoticeItem('info', '系统', '系统将于今晚 22:00-23:00 进行升级维护', '5 小时前') +
            '</ul>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // 模块总览
      '<div class="section-title">功能模块</div>' +
      '<div class="module-grid">' +
        buildModuleCard('dual-prevention', '双重预防机制', '建立风险分级管控和隐患排查治理双重预防体系，实现风险管理闭环。',
          ['风险分级管控', '隐患排查治理'], 'var(--primary-light)', 'var(--primary)') +
        buildModuleCard('accident-emergency', '事故与应急管理', '事故全流程管理与应急预案管理，包含天气预警、车辆预警等功能。',
          ['事故管理', '应急预案', '预警中心'], 'var(--danger-light)', 'var(--danger)') +
        buildModuleCard('personnel', '人员安全管理', '管理全员安全档案，特种作业人员资质跟踪及外来人员安全管控。',
          ['人员档案', '特种作业', '外来人员'], 'var(--success-light)', 'var(--success)') +
        buildModuleCard('facility', '场地与设施管理', '场地信息台账管理，设备设施安全状态监控及区域划分管理。',
          ['场地信息', '设备安全', '区域划分'], 'var(--info-light)', 'var(--info)') +
        buildModuleCard('park', '园区综合管理', '园区整体运营安全管理，支持多场地协同与安防系统联动。',
          ['运营安全', '多场地协同', '安防联动'], 'var(--primary-light)', 'var(--primary)') +
        buildModuleCard('delivery-safety', '寄递安全管理', '保障寄递物品安全，实名登记管理及危险品识别检查。',
          ['安全检查', '实名登记', '危险品识别'], 'var(--warning-light)', 'var(--warning)') +
        buildModuleCard('training', '培训与宣教', '安全培训课程管理，宣传资料分发及在线考试考核系统。',
          ['安全培训', '宣传资料', '考试考核'], 'var(--success-light)', 'var(--success)') +
        buildModuleCard('data-center', '数据与分析中心', '多维度统计报表与数据可视化，风险趋势分析与KPI考核。',
          ['统计报表', '风险趋势', 'KPI'], 'var(--info-light)', 'var(--info)') +
        buildModuleCard('document', '制度与文档管理', '安全管理制度文件统一管理，操作规程与法规标准库。',
          ['制度文件', '操作规程', '法规标准'], 'var(--primary-light)', 'var(--primary)') +
        buildModuleCard('system', '系统与权限管理', '系统用户权限配置，组织架构管理与操作日志审计。',
          ['用户权限', '组织架构', '日志审计'], 'var(--text-tertiary)', 'var(--text-secondary)') +
      '</div>';
  }

  // ============ 双重预防机制 ============
  function renderDualPrevention() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">双重预防机制</div>' +
            '<div class="page-desc">风险分级管控与隐患排查治理</div>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav" id="dualPreventionMainTabNav">' +
          '<div class="tab-item active" data-dp-tab="risk">风险分级管控</div>' +
          '<div class="tab-item" data-dp-tab="hazard">隐患排查治理</div>' +
        '</div>' +

        '<div id="dualPreventionPanelRisk" class="dual-prevention-panel">' +
        '<div class="stats-row">' +
          buildStatCard('红色风险', '0', 'red', 'statCountRed') +
          buildStatCard('橙色风险', '0', 'orange', 'statCountOrange') +
          buildStatCard('黄色风险', '0', 'yellow', 'statCountYellow') +
          buildStatCard('蓝色风险', '0', 'blue', 'statCountBlue') +
        '</div>' +

        '<div class="tab-nav" id="riskDomainTabNav" style="margin-top:28px;">' +
          '<div class="tab-item active" data-domain="转运中心">转运中心</div>' +
          '<div class="tab-item" data-domain="网点">网点</div>' +
          '<div class="tab-item" data-domain="车队">车队</div>' +
        '</div>' +
        '<div class="data-table-wrapper">' +
          '<div class="table-toolbar">' +
            '<div class="table-toolbar-left">' +
              '<button class="btn btn-primary" id="riskTierReportBtn">' +
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></svg>' +
                '上报风险' +
              '</button>' +
              '<div class="table-filter">' +
                '<span>风险等级：</span>' +
                '<select id="riskTierRiskLevelSelect"><option>全部</option><option>红色</option><option>橙色</option><option>黄色</option><option>蓝色</option></select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>风险区域：</span>' +
                '<select id="riskTierAreaSelect"><option>全部</option></select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>管控层级：</span>' +
                '<select id="riskTierControlLevelSelect"><option>全部</option></select>' +
              '</div>' +
            '</div>' +
            '<div class="table-search" style="flex-direction:column;align-items:flex-start;gap:8px;">' +
              '<div style="display:flex;align-items:center;gap:10px;width:100%;">' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
                '<input id="riskTierSearchInput" type="text" placeholder="搜索风险点描述/管控措施..." style="flex:1;min-width:220px;">' +
                '<button class="btn btn-outline" id="riskTierExportBtn" type="button">导出报表</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<table class="data-table risk-tier-table">' +
            '<thead>' +
              '<tr>' +
                '<th style="width:60px;">序号</th>' +
                '<th style="width:100px;">风险区域</th>' +
                '<th style="width:250px;">风险点描述</th>' +
                '<th>L</th>' +
                '<th>E</th>' +
                '<th>C</th>' +
                '<th>D</th>' +
                '<th style="width:140px;">风险等级</th>' +
                '<th style="width:110px;">管控层级</th>' +
                '<th style="width:360px;">管控措施</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="riskTierTbody">' +
              '<tr><td colspan="10" style="text-align:center;color:var(--text-secondary);padding:24px;">加载中...</td></tr>' +
            '</tbody>' +
          '</table>' +
          '<div class="table-pagination">' +
            '<span id="riskTierTotalCount">共 0 条记录</span>' +
            '<div class="pagination-btns" id="riskTierPaginationBtns"></div>' +
          '</div>' +
        '</div>' +
        '<div class="panel" style="margin-top:16px;">' +
          '<div class="panel-header">' +
            '<div class="panel-title">总部评审队列</div>' +
            '<span class="panel-link" id="riskTierPendingCount">待评审 0 条</span>' +
          '</div>' +
          '<div class="panel-body">' +
            '<div id="riskTierPendingEmpty" style="padding:18px 0;color:var(--text-secondary);text-align:center;">暂无待评审风险</div>' +
            '<div id="riskTierPendingTableWrap" style="display:none;">' +
              '<table class="data-table">' +
                '<thead><tr><th style="width:250px;">风险描述</th><th style="width:120px;">风险区域</th><th>管控措施</th><th style="width:140px;">操作</th></tr></thead>' +
                '<tbody id="riskTierPendingTbody"></tbody>' +
              '</table>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="modal-overlay" id="riskTierReportModalOverlay" style="display:none;">' +
          '<div class="modal" role="dialog" aria-modal="true">' +
            '<div class="modal-header">' +
              '<div class="modal-title">上报风险</div>' +
              '<button class="modal-close" id="riskTierReportCancelBtn" type="button" title="关闭">×</button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<div class="form-grid">' +
                '<div class="form-field span-2"><div class="form-label">所属领域</div>' +
                  '<select id="riskTierReportDomain"><option>转运中心</option><option>网点</option><option>车队</option></select></div>' +
                '<div class="form-field span-2"><div class="form-label">风险区域</div><input type="text" id="riskTierReportRiskArea" placeholder="例如 一楼分拣区 / A栋转运中心..."></div>' +
                '<div class="form-field span-2"><div class="form-label">风险描述</div><textarea id="riskTierReportRiskPoint" rows="3" placeholder="请详细描述具体的风险点..."></textarea></div>' +
                '<div class="form-field span-2"><div class="form-label">管控措施</div><textarea id="riskTierReportControlMeasures" rows="3" placeholder="例如 1. 严格加强管理物品堆放规范。"></textarea></div>' +
              '</div>' +
              '<div class="modal-hint" id="riskTierReportFormHint" style="margin-top:12px;color:var(--text-secondary);font-size:13px;"></div>' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button class="btn btn-outline" id="riskTierReportCancelBtn2" type="button">取消</button>' +
              '<button class="btn btn-primary" id="riskTierReportSubmitBtn" type="button">提交上报</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="modal-overlay" id="riskTierReviewModalOverlay" style="display:none;">' +
          '<div class="modal" role="dialog" aria-modal="true">' +
            '<div class="modal-header">' +
              '<div class="modal-title">总部评审（LEC）</div>' +
              '<button class="modal-close" id="riskTierReviewCloseBtn" type="button" title="关闭">×</button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<div class="form-grid">' +
                '<div class="form-field span-2"><div class="form-label">风险点（只读）</div><input type="text" id="riskTierReviewRiskPoint" readonly></div>' +
                '<div class="form-field span-2"><div class="form-label">风险区域（只读）</div><input type="text" id="riskTierReviewRiskArea" readonly></div>' +
                '<div class="form-field span-2"><div class="form-label">管控措施（只读）</div><textarea id="riskTierReviewControlMeasures" rows="3" readonly></textarea></div>' +

                '<div class="form-field"><div class="form-label">L（可能性）</div><input type="number" step="0.1" min="0" id="riskTierReviewL" placeholder="例如 3"></div>' +
                '<div class="form-field"><div class="form-label">E（暴露频次）</div><input type="number" step="0.1" min="0" id="riskTierReviewE" placeholder="例如 6"></div>' +
                '<div class="form-field"><div class="form-label">C（后果严重性）</div><input type="number" step="0.1" min="0" id="riskTierReviewC" placeholder="例如 7"></div>' +
                '<div class="form-field"><div class="form-label">D（危险值，只读）</div><input type="text" id="riskTierReviewD" readonly placeholder="自动计算"></div>' +
                '<div class="form-field span-2"><div class="form-label">风险分级（自动）</div><div id="riskTierReviewRiskBadge">--</div></div>' +

                '<div class="form-field span-2">' +
                  '<div class="form-label">驳回理由</div>' +
                  '<textarea id="riskTierReviewRejectReason" rows="3" placeholder="请填写驳回原因（例如：信息不完整/描述不清/需补充现场照片等）"></textarea>' +
                '</div>' +

                '<div class="form-field span-2">' +
                  '<div class="form-label">LEC 数值含义（简要）</div>' +
                  '<div style="background:var(--bg-body);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 12px;color:var(--text-secondary);font-size:13px;line-height:1.6;">' +
                    '<div style="font-weight:600;color:var(--text-primary);margin-bottom:6px;">D = L × E × C</div>' +
                    '<div><b>L（可能性）</b>：事故发生的可能性，值越大表示越可能发生（可按 0.5 / 1 / 3 / 6 / 10 等梯度打分）。</div>' +
                    '<div><b>E（暴露频次）</b>：人员/设备暴露在危险环境中的频次，值越大表示暴露越频繁（可按 0.5 / 1 / 2 / 3 / 6 / 10 等梯度打分）。</div>' +
                    '<div><b>C（后果严重性）</b>：一旦发生的后果严重程度，值越大表示后果越严重（可按 1 / 3 / 7 / 15 / 40 / 100 等梯度打分）。</div>' +
                    '<div style="margin-top:6px;">系统会根据输入的 L/E/C 自动计算 D 并自动生成风险分级。</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="modal-hint" id="riskTierReviewHint" style="margin-top:12px;color:var(--text-secondary);font-size:13px;"></div>' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button class="btn btn-outline" id="riskTierReviewCancelBtn" type="button">取消</button>' +
              '<button class="btn btn-outline" id="riskTierReviewRejectBtn" type="button">驳回风险</button>' +
              '<button class="btn btn-primary" id="riskTierReviewApproveBtn" type="button">评审通过</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        renderDualPreventionHazardPanel() +
      '</div>';
  }

  function renderDualPreventionHazardPanel() {
    return '' +
        '<div id="dualPreventionPanelHazard" class="dual-prevention-panel" style="display:none;">' +
          '<div class="stats-row">' +
            buildStatCard('隐患上报', '56', '待处理隐患', 'up',
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', 'orange') +
            buildStatCard('自查自纠', '32', '本月自查报告', 'up',
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg>', 'blue') +
            buildStatCard('安全稽核', '12', '季度稽核进度', 'up',
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>', 'green') +
            buildStatCard('专项稽查', '5', '进行中专项', 'up',
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>', 'indigo') +
          '</div>' +
          '<div class="tab-nav hazard-sub-tab-nav" style="margin-top:20px;margin-bottom:12px;">' +
            '<div class="tab-item active" data-hazard-sub="report">隐患上报</div>' +
            '<div class="tab-item" data-hazard-sub="selfcheck">自查自纠</div>' +
            '<div class="tab-item" data-hazard-sub="audit">安全稽核</div>' +
            '<div class="tab-item" data-hazard-sub="special">专项稽查</div>' +
          '</div>' +
          '<div id="hazardSubPanelReport" class="hazard-sub-panel">' +
            '<div class="hazard-list-header">' +
              '<div class="section-title">隐患上报列表</div>' +
              '<div class="hazard-list-header-actions">' +
                '<button class="btn btn-primary" id="hazardReportAddBtn" type="button">' +
                  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></svg> 新增隐患上报' +
                '</button>' +
                '<button class="btn btn-outline" id="hazardReportExportBtn" type="button">导出报表</button>' +
              '</div>' +
            '</div>' +
            '<div class="data-table-wrapper">' +
              '<div class="table-toolbar hazard-report-toolbar">' +
                '<div class="hazard-toolbar-row hazard-toolbar-row--filters">' +
                  '<div class="hazard-filter-item"><label>隐患类别</label><select id="hazardFilterCategory"><option value="">全部</option></select></div>' +
                  '<div class="hazard-filter-item"><label>状态</label><select id="hazardFilterStatus"><option value="">全部</option><option>待稽核</option><option>稽核通过</option><option>稽核不通过-待修正</option><option>待再次稽核</option><option>整改中</option><option>待验收</option><option>验收通过-关闭</option></select></div>' +
                  '<div class="hazard-filter-item"><label>所属片区</label><select id="hazardFilterArea"><option value="">全部</option><option value="北部">北部</option><option value="南部">南部</option><option value="中部">中部</option></select></div>' +
                  '<div class="hazard-filter-item"><label>所属省区</label><select id="hazardFilterProvince"><option value="">全部</option></select></div>' +
                  '<div class="hazard-filter-item"><label>所属中心</label><select id="hazardFilterCenter"><option value="">全部</option></select></div>' +
                  '<div class="hazard-toolbar-search hazard-toolbar-search--inline">' +
                    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
                    '<input id="hazardSearchInput" type="text" placeholder="搜索问题描述/地点...">' +
                  '</div>' +
                  '<button class="btn btn-outline hazard-delete-btn" id="hazardDeleteToggleBtn" type="button">删除</button>' +
                '</div>' +
              '</div>' +
              '<div class="data-table-scroll">' +
                '<table class="data-table" id="hazardReportTable">' +
                  '<thead><tr><th class="hazard-select-col"><input type="checkbox" id="hazardSelectAll" aria-label="全选隐患"></th><th style="width:100px;">上报时间</th><th style="width:80px;">所属片区</th><th style="width:100px;">所属省区</th><th style="width:100px;">所属中心</th><th style="width:90px;">隐患类别</th><th style="width:160px;">隐患内容</th><th style="width:72px;">整改前照片</th><th style="width:200px;">具体问题描述</th><th style="width:100px;">整改时间</th><th style="width:90px;">整改后照片</th><th style="width:120px;">整改描述</th><th style="width:90px;">整改状态</th><th style="width:80px;">整改人</th><th style="width:100px;">操作</th><th style="width:72px;">是否闭环</th></tr></thead>' +
                  '<tbody id="hazardReportTbody">' +
                    '<tr><td colspan="16" style="text-align:center;color:var(--text-secondary);padding:24px;">暂无数据，可点击「新增隐患上报」提交</td></tr>' +
                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div id="hazardSubPanelSelfcheck" class="hazard-sub-panel" style="display:none;">' +
            '<div class="hazard-list-header">' +
              '<div class="section-title">中心自查自纠任务下发</div>' +
              '<div class="hazard-list-header-actions">' +
                '<button class="btn btn-outline" id="selfcheckTaskUploadBtn">' +
                  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
                  '上传检查表' +
                '</button>' +
                '<button class="btn btn-primary" id="selfcheckTaskDispatchBtn">' +
                  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7-7-7"/><path d="M5 12h14"/></svg>' +
                  '下发任务' +
                '</button>' +
                '<input type="file" id="selfcheckTaskFileInput" style="display:none;" accept=".xlsx,.xls,.doc,.docx,.pdf">' +
              '</div>' +
            '</div>' +
            '<p style="color:var(--text-secondary);margin-bottom:12px;">首先上传《中心安全检查表》，然后选择目标中心下发自查自纠任务。</p>' +
            '<div class="data-table-wrapper">' +
              '<table class="data-table"><thead><tr><th>任务名称</th><th>下发时间</th><th>截止时间</th><th>文件名</th><th>状态</th><th>完成率</th><th>操作</th></tr></thead>' +
              '<tbody id="selfcheckTaskTbody">' +
                '<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:30px;">加载中...</td></tr>' +
              '</tbody></table>' +
            '</div>' +

            '<div class="hazard-list-header" style="margin-top:24px;">' +
              '<div class="section-title">自查自纠报告</div>' +
              '<div class="hazard-list-header-actions">' +
                '<button class="btn btn-outline" id="selfcheckExportBtn" type="button">导出报表</button>' +
              '</div>' +
            '</div>' +
            '<div class="data-table-wrapper">' +
              '<div class="table-toolbar selfcheck-toolbar">' +
                '<div class="hazard-toolbar-row hazard-toolbar-row--filters">' +
                  '<div class="hazard-filter-item"><label>隐患类别</label><select id="selfcheckFilterCategory"><option value="">全部</option></select></div>' +
                  '<div class="hazard-filter-item"><label>状态</label><select id="selfcheckFilterStatus"><option value="">全部</option><option>待稽核</option><option>稽核通过</option><option>稽核不通过-待修正</option><option>待再次稽核</option><option>整改中</option><option>待验收</option><option>验收通过-关闭</option></select></div>' +
                  '<div class="hazard-filter-item"><label>所属片区</label><select id="selfcheckFilterArea"><option value="">全部</option><option value="北部">北部</option><option value="南部">南部</option><option value="中部">中部</option></select></div>' +
                  '<div class="hazard-filter-item"><label>所属省区</label><select id="selfcheckFilterProvince"><option value="">全部</option></select></div>' +
                  '<div class="hazard-filter-item"><label>所属中心</label><select id="selfcheckFilterCenter"><option value="">全部</option></select></div>' +
                  '<div class="hazard-toolbar-search hazard-toolbar-search--inline">' +
                    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
                    '<input id="selfcheckSearchInput" type="text" placeholder="搜索问题描述/地点...">' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="data-table-scroll">' +
                '<table class="data-table">' +
                  '<thead><tr><th style="width:100px;">上报时间</th><th style="width:80px;">所属片区</th><th style="width:100px;">所属省区</th><th style="width:100px;">所属中心</th><th style="width:90px;">隐患类别</th><th style="width:160px;">隐患内容</th><th style="width:72px;">整改前照片</th><th style="width:200px;">具体问题描述</th><th style="width:100px;">整改时间</th><th style="width:90px;">整改后照片</th><th style="width:120px;">整改描述</th><th style="width:90px;">整改状态</th><th style="width:80px;">整改人</th><th style="width:100px;">操作</th><th style="width:72px;">是否闭环</th></tr></thead>' +
                  '<tbody id="selfcheckReportsTbody">' +
                    '<tr><td colspan="15" style="text-align:center;color:var(--text-secondary);padding:24px;">暂无数据</td></tr>' +
                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div id="hazardSubPanelAudit" class="hazard-sub-panel" style="display:none;">' +
            '<div class="hazard-list-header">' +
              '<div class="section-title">安全稽核任务下发</div>' +
              '<div class="hazard-list-header-actions">' +
                '<button class="btn btn-outline" id="securityAuditTaskUploadBtn">' +
                  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
                  '上传稽核表' +
                '</button>' +
                '<button class="btn btn-primary" id="securityAuditTaskDispatchBtn">' +
                  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7-7-7"/><path d="M5 12h14"/></svg>' +
                  '下发任务' +
                '</button>' +
                '<input type="file" id="securityAuditTaskFileInput" style="display:none;" accept=".xlsx,.xls,.doc,.docx,.pdf">' +
              '</div>' +
            '</div>' +
            '<p style="color:var(--text-secondary);margin-bottom:12px;">首先上传《安全稽核表》，然后选择部门下发稽核任务。支持总部直查或指派省区互查。</p>' +
            '<div class="data-table-wrapper">' +
              '<table class="data-table"><thead><tr><th>任务名称</th><th>下发时间</th><th>截止时间</th><th>文件名</th><th>状态</th><th>完成率</th><th>操作</th></tr></thead>' +
              '<tbody id="securityAuditTaskTbody">' +
                '<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:30px;">加载中...</td></tr>' +
              '</tbody></table>' +
            '</div>' +

            '<div class="hazard-list-header" style="margin-top:24px;">' +
              '<div class="section-title">安全稽核报告</div>' +
              '<div class="hazard-list-header-actions">' +
                '<button class="btn btn-outline" id="securityAuditExportBtn" type="button">导出报表</button>' +
              '</div>' +
            '</div>' +
            '<div class="data-table-wrapper">' +
              '<div class="table-toolbar security-audit-toolbar">' +
                '<div class="hazard-toolbar-row hazard-toolbar-row--filters">' +
                  '<div class="hazard-filter-item"><label>隐患类别</label><select id="securityAuditFilterCategory"><option value="">全部</option></select></div>' +
                  '<div class="hazard-filter-item"><label>状态</label><select id="securityAuditFilterStatus"><option value="">全部</option><option>待稽核</option><option>稽核通过</option><option>稽核不通过-待修正</option><option>待再次稽核</option><option>整改中</option><option>待验收</option><option>验收通过-关闭</option></select></div>' +
                  '<div class="hazard-filter-item"><label>所属片区</label><select id="securityAuditFilterArea"><option value="">全部</option><option value="北部">北部</option><option value="南部">南部</option><option value="中部">中部</option></select></div>' +
                  '<div class="hazard-filter-item"><label>所属省区</label><select id="securityAuditFilterProvince"><option value="">全部</option></select></div>' +
                  '<div class="hazard-filter-item"><label>所属中心</label><select id="securityAuditFilterCenter"><option value="">全部</option></select></div>' +
                  '<div class="hazard-toolbar-search hazard-toolbar-search--inline">' +
                    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
                    '<input id="securityAuditSearchInput" type="text" placeholder="搜索问题描述/地点...">' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="data-table-scroll">' +
                '<table class="data-table">' +
                  '<thead><tr><th style="width:100px;">上报时间</th><th style="width:80px;">所属片区</th><th style="width:100px;">所属省区</th><th style="width:100px;">所属中心</th><th style="width:90px;">隐患类别</th><th style="width:160px;">隐患内容</th><th style="width:72px;">整改前照片</th><th style="width:200px;">具体问题描述</th><th style="width:100px;">整改时间</th><th style="width:90px;">整改后照片</th><th style="width:120px;">整改描述</th><th style="width:90px;">整改状态</th><th style="width:80px;">整改人</th><th style="width:100px;">操作</th><th style="width:72px;">是否闭环</th></tr></thead>' +
                  '<tbody id="securityAuditReportsTbody">' +
                    '<tr><td colspan="15" style="text-align:center;color:var(--text-secondary);padding:24px;">暂无数据</td></tr>' +
                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div id="hazardSubPanelSpecial" class="hazard-sub-panel" style="display:none;">' +
            '<div class="hazard-list-header">' +
              '<div class="section-title">专项稽查任务下发</div>' +
              '<div class="hazard-list-header-actions">' +
                '<button class="btn btn-primary" id="specialAuditTaskUploadBtn">' +
                  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
                  '上传稽查表并下发任务' +
                '</button>' +
                '<input type="file" id="specialAuditTaskFileInput" style="display:none;" accept=".xlsx,.xls,.doc,.docx,.pdf">' +
              '</div>' +
            '</div>' +
            '<p style="color:var(--text-secondary);margin-bottom:12px;">针对突发事件、国家要求或临时工作，下发专项稽查任务。</p>' +
            '<div class="data-table-wrapper">' +
              '<table class="data-table"><thead><tr><th>任务名称</th><th>下发时间</th><th>截止时间</th><th>文件名</th><th>状态</th><th>完成率</th><th>操作</th></tr></thead>' +
              '<tbody id="specialAuditTaskTbody">' +
                '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary);padding:24px;">暂无专项稽查任务</td></tr>' +
              '</tbody></table>' +
            '</div>' +

            '<div class="hazard-list-header" style="margin-top:24px;">' +
              '<div class="section-title">专项稽查报告</div>' +
              '<div class="hazard-list-header-actions">' +
                '<button class="btn btn-outline" id="specialAuditExportBtn" type="button">导出报表</button>' +
              '</div>' +
            '</div>' +
            '<div class="data-table-wrapper">' +
              '<div class="table-toolbar special-audit-toolbar">' +
                '<div class="hazard-toolbar-row hazard-toolbar-row--filters">' +
                  '<div class="hazard-filter-item"><label>隐患类别</label><select id="specialAuditFilterCategory"><option value="">全部</option></select></div>' +
                  '<div class="hazard-filter-item"><label>状态</label><select id="specialAuditFilterStatus"><option value="">全部</option><option>待稽核</option><option>稽核通过</option><option>稽核不通过-待修正</option><option>待再次稽核</option><option>整改中</option><option>待验收</option><option>验收通过-关闭</option></select></div>' +
                  '<div class="hazard-filter-item"><label>所属片区</label><select id="specialAuditFilterArea"><option value="">全部</option><option value="北部">北部</option><option value="南部">南部</option><option value="中部">中部</option></select></div>' +
                  '<div class="hazard-filter-item"><label>所属省区</label><select id="specialAuditFilterProvince"><option value="">全部</option></select></div>' +
                  '<div class="hazard-filter-item"><label>所属中心</label><select id="specialAuditFilterCenter"><option value="">全部</option></select></div>' +
                  '<div class="hazard-toolbar-search hazard-toolbar-search--inline">' +
                    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
                    '<input id="specialAuditSearchInput" type="text" placeholder="搜索问题描述/地点...">' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="data-table-scroll">' +
                '<table class="data-table">' +
                  '<thead><tr><th style="width:100px;">上报时间</th><th style="width:80px;">所属片区</th><th style="width:100px;">所属省区</th><th style="width:100px;">所属中心</th><th style="width:90px;">隐患类别</th><th style="width:160px;">隐患内容</th><th style="width:72px;">整改前照片</th><th style="width:200px;">具体问题描述</th><th style="width:100px;">整改时间</th><th style="width:90px;">整改后照片</th><th style="width:120px;">整改描述</th><th style="width:90px;">整改状态</th><th style="width:80px;">整改人</th><th style="width:100px;">操作</th><th style="width:72px;">是否闭环</th></tr></thead>' +
                  '<tbody id="specialAuditReportsTbody">' +
                    '<tr><td colspan="15" style="text-align:center;color:var(--text-secondary);padding:24px;">暂无数据</td></tr>' +
                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '</div>' +
          '<div class="modal-overlay" id="hazardReportModalOverlay" style="display:none;">' +
            '<div class="modal modal-hazard-report" role="dialog" style="max-width:600px;">' +
              '<div class="modal-header">' +
                '<div class="modal-title">新增隐患上报</div>' +
                '<button class="modal-close" id="hazardReportModalClose" type="button" title="关闭" aria-label="关闭">×</button>' +
              '</div>' +
              '<div class="modal-body">' +
                '<div class="form-grid form-grid-hazard">' +
                  '<div class="form-field span-2"><label class="form-label required">隐患类别</label><select id="hazardFormCategory" class="form-control"><option value="">请选择</option></select></div>' +
                  '<div class="form-field span-2" id="hazardFormSecondWrap">' +
                    '<label class="form-label">二级隐患描述 <span id="hazardSecondGuide" style="font-size: 11px; font-weight: 400; color: var(--text-tertiary); margin-left: 8px;">(点击卡片选择对应的内容)</span><a id="hazardSecondChangeBtn" class="hazard-change-link" style="display:none;">[更改]</a></label>' +
                    '<div id="hazardFormSecondList" class="hazard-second-list"></div>' +
                    '<input type="hidden" id="hazardFormSecond" value="">' +
                  '</div>' +
                  '<div class="form-field span-2" id="hazardFormOtherWrap" style="display:none;"><label class="form-label required">自填隐患描述</label><input type="text" id="hazardFormOtherDesc" class="form-control" placeholder="选择「其他」时必填"></div>' +
                  '<div class="form-field span-2"><label id="hazardFormDescLabel" class="form-label">具体问题描述</label><textarea id="hazardFormDesc" class="form-control" rows="3" placeholder="请详细描述具体问题"></textarea></div>' +
                  '<div class="form-field"><label class="form-label">南北部</label><select id="hazardFormNorthSouth" class="form-control"><option value="">请选择</option><option value="北部">北部</option><option value="南部">南部</option><option value="中部">中部</option></select></div>' +
                  '<div class="form-field"><label class="form-label">省区</label><select id="hazardFormProvince" class="form-control"><option value="">请选择</option></select></div>' +
                  '<div class="form-field span-2"><label class="form-label">中心</label><select id="hazardFormCenter" class="form-control"><option value="">请选择</option></select></div>' +
                  '<div class="form-field"><label class="form-label">发现时间</label><input type="datetime-local" id="hazardFormTime" class="form-control"></div>' +
                  '<div class="form-field"><label class="form-label">附件</label><div class="file-upload-area" id="hazardFormFileArea"><input type="file" id="hazardFormFile" multiple accept="image/*,.pdf" class="file-upload-input"><span class="file-upload-text" id="hazardFormFileText">点击或拖拽上传</span></div></div>' +
                '</div>' +
                '<div class="modal-hint" id="hazardReportFormHint" style="margin-top:10px;color:var(--danger);font-size:13px;"></div>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button class="btn btn-outline" id="hazardReportModalCancel" type="button">取消</button>' +
                '<button class="btn btn-primary" id="hazardReportSubmitBtn" type="button">提交上报</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="modal-overlay" id="hazardDetailModalOverlay" style="display:none;">' +
            '<div class="modal modal-hazard-detail" role="dialog" style="max-width:640px;">' +
              '<div class="modal-header"><div class="modal-title">隐患处理 · 闭环治理</div><button class="modal-close" id="hazardDetailModalClose" type="button" title="关闭">×</button></div>' +
              '<div class="modal-body">' +
                '<div class="hazard-detail-info" id="hazardDetailInfo"></div>' +
                '<div class="hazard-detail-images">' +
                  '<div class="hazard-detail-section"><div class="form-label">整改前图片</div><div class="hazard-imgs-row" id="hazardDetailBeforeImgs"></div></div>' +
                  '<div class="hazard-detail-section" id="hazardDetailAfterSection"><div class="form-label">整改后图片</div><div class="file-upload-area hazard-upload-after" id="hazardDetailAfterUpload"><input type="file" id="hazardDetailAfterFile" accept="image/*" class="file-upload-input" multiple><span class="file-upload-text" id="hazardDetailAfterFileText">点击上传整改后照片</span></div><div class="hazard-imgs-row" id="hazardDetailAfterImgs"></div></div>' +
                '</div>' +
                '<div class="hazard-detail-section" style="margin-top:12px;"><div class="form-label">整改描述</div><textarea id="hazardDetailRectifyDesc" class="form-control" rows="3" placeholder="请详细描述具体整改措施和完成情况" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;outline:none;background:var(--bg-white);"></textarea></div>' +
                '<div class="modal-hint" id="hazardDetailFormHint" style="margin-top:8px;color:var(--danger);font-size:13px;"></div>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button class="btn btn-outline" id="hazardDetailModalCancel" type="button">取消</button>' +
                '<button class="btn btn-primary" id="hazardDetailCloseLoopBtn" type="button">确认闭环</button>' +
                '<button class="btn btn-outline" id="hazardDetailOnlyCloseBtn" type="button" style="display:none;">关闭</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="modal-overlay" id="selfcheckTaskDispatchModalOverlay" style="display:none;">' +
            '<div class="modal" role="dialog" aria-modal="true" style="max-width:550px;">' +
              '<div class="modal-header">' +
                '<div class="modal-title">下发自查自纠任务</div>' +
                '<button class="modal-close" id="selfcheckDispatchModalClose" type="button">×</button>' +
              '</div>' +
              '<div class="modal-body">' +
                '<div class="form-grid">' +
                  '<div class="form-field span-2">' +
                    '<label class="form-label required">任务名称</label>' +
                    '<input type="text" id="selfcheckDispatchName" class="form-control" placeholder="输入任务名称">' +
                  '</div>' +
                  '<div class="form-field span-2">' +
                    '<label class="form-label required">选择检查表</label>' +
                    '<select id="selfcheckDispatchChecklist" class="form-control">' +
                      '<option value="">请先上传检查表</option>' +
                    '</select>' +
                  '</div>' +
                  '<div class="form-field">' +
                    '<label class="form-label required">下发片区</label>' +
                    '<select id="selfcheckDispatchArea" class="form-control">' +
                      '<option value="">全部</option>' +
                      '<option value="北部">北部</option>' +
                      '<option value="南部">南部</option>' +
                      '<option value="中部">中部</option>' +
                    '</select>' +
                  '</div>' +
                  '<div class="form-field">' +
                    '<label class="form-label">下发省区</label>' +
                    '<select id="selfcheckDispatchProvince" class="form-control">' +
                      '<option value="">全部</option>' +
                    '</select>' +
                  '</div>' +
                  '<div class="form-field span-2">' +
                    '<label class="form-label">下发中心</label>' +
                    '<select id="selfcheckDispatchCenter" class="form-control">' +
                      '<option value="">全部</option>' +
                    '</select>' +
                  '</div>' +
                  '<div class="form-field span-2">' +
                    '<label class="form-label required">截止日期</label>' +
                    '<input type="datetime-local" id="selfcheckDispatchDeadline" class="form-control">' +
                  '</div>' +
                '</div>' +
                '<div id="selfcheckDispatchHint" style="margin-top:10px; color:var(--danger); font-size:13px;"></div>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button class="btn btn-outline" id="selfcheckDispatchCancel" type="button">取消</button>' +
                '<button class="btn btn-primary" id="selfcheckDispatchSubmit" type="button">确认下发</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="modal-overlay" id="securityAuditTaskDispatchModalOverlay" style="display:none;">' +
            '<div class="modal" role="dialog" aria-modal="true" style="max-width:800px;">' +
              '<div class="modal-header">' +
                '<div class="modal-title">下发安全稽核任务</div>' +
                '<button class="modal-close" id="securityAuditDispatchModalClose" type="button">×</button>' +
              '</div>' +
              '<div class="modal-body">' +
                '<div class="form-grid">' +
                  '<div class="form-field span-2">' +
                    '<label class="form-label required">任务名称</label>' +
                    '<input type="text" id="securityAuditDispatchName" class="form-control" placeholder="输入任务名称">' +
                  '</div>' +
                  '<div class="form-field span-2">' +
                    '<label class="form-label required">选择稽核表</label>' +
                    '<select id="securityAuditDispatchChecklist" class="form-control">' +
                      '<option value="">请先上传稽核表</option>' +
                    '</select>' +
                  '</div>' +
                  
                  '<div class="form-field span-2" style="border-bottom: 1px solid var(--border); margin: 5px 0 15px 0; padding-bottom: 5px; font-weight: 600; color: var(--primary);">被审单位 (目标)</div>' +
                  '<div class="form-field">' +
                    '<label class="form-label required">片区</label>' +
                    '<select id="securityAuditDispatchTargetArea" class="form-control"><option value="">全部</option><option value="北部">北部</option><option value="南部">南部</option><option value="中部">中部</option></select>' +
                  '</div>' +
                  '<div class="form-field">' +
                    '<label class="form-label">省区</label>' +
                    '<select id="securityAuditDispatchTargetProvince" class="form-control"><option value="">全部</option></select>' +
                  '</div>' +
                  '<div class="form-field span-2">' +
                    '<label class="form-label">中心</label>' +
                    '<select id="securityAuditDispatchTargetCenter" class="form-control"><option value="">全部</option></select>' +
                  '</div>' +

                  '<div class="form-field span-2" style="border-bottom: 1px solid var(--border); margin: 15px 0; padding-bottom: 5px; font-weight: 600; color: var(--success);">主审单位 (执行人)</div>' +
                  '<div class="form-field">' +
                    '<label class="form-label">片区</label>' +
                    '<select id="securityAuditDispatchExecutorArea" class="form-control"><option value="">总部</option><option value="北部">北部</option><option value="南部">南部</option><option value="中部">中部</option></select>' +
                  '</div>' +
                  '<div class="form-field">' +
                    '<label class="form-label">省区</label>' +
                    '<select id="securityAuditDispatchExecutorProvince" class="form-control"><option value="">全部</option></select>' +
                  '</div>' +

                  '<div class="form-field span-2" style="margin-top: 15px;">' +
                    '<label class="form-label required">截止日期</label>' +
                    '<input type="datetime-local" id="securityAuditDispatchDeadline" class="form-control">' +
                  '</div>' +
                '</div>' +
                '<div id="securityAuditDispatchHint" style="margin-top:10px; color:var(--danger); font-size:13px;"></div>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button class="btn btn-outline" id="securityAuditDispatchCancel" type="button">取消</button>' +
                '<button class="btn btn-primary" id="securityAuditDispatchSubmit" type="button">确认下发</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
  }

  function initDualPreventionMainTab() {
    const nav = document.getElementById('dualPreventionMainTabNav');
    const panelRisk = document.getElementById('dualPreventionPanelRisk');
    const panelHazard = document.getElementById('dualPreventionPanelHazard');
    if (!nav || !panelRisk || !panelHazard) return;
    nav.addEventListener('click', function (e) {
      const tab = e.target.closest('.tab-item[data-dp-tab]');
      if (!tab) return;
      const value = tab.dataset.dpTab;
      document.querySelectorAll('#dualPreventionMainTabNav .tab-item').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      panelRisk.style.display = value === 'risk' ? '' : 'none';
      panelHazard.style.display = value === 'hazard' ? '' : 'none';
    });
  }

  function initAccidentEmergencyTab() {
    const nav = document.getElementById('accidentEmergencyTabNav');
    const panels = {
      accident: document.getElementById('accidentPanel'),
      emergency: document.getElementById('emergencyPanel'),
      drill: document.getElementById('drillPanel'),
      warning: document.getElementById('warningPanel')
    };
    if (!nav) return;
    nav.addEventListener('click', function (e) {
      const tab = e.target.closest('.tab-item[data-tab]');
      if (!tab) return;
      const key = tab.dataset.tab;
      document.querySelectorAll('#accidentEmergencyTabNav .tab-item').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      Object.keys(panels).forEach(function (k) {
        const el = panels[k];
        if (el) el.style.display = k === key ? '' : 'none';
      });
    });
  }

  function initAccidentReport() {
    const form = document.getElementById('accidentReportForm');
    if (!form) return;

    const submitBtn = document.getElementById('submitAccidentBtn');
    const followUpSection = document.getElementById('followUpSection');
    let currentStep = 1;

    // 处理文件选择预览
    const fileInputs = form.querySelectorAll('.file-input');
    fileInputs.forEach(input => {
      input.addEventListener('change', function () {
        const area = this.closest('.file-upload-area');
        if (this.files && this.files.length > 0) {
          area.classList.add('has-files');
          const text = area.querySelector('.file-upload-text');
          if (this.multiple) {
            text.textContent = '已选择 ' + this.files.length + ' 个文件';
          } else {
            text.textContent = '已选择 ' + this.files[0].name;
          }
        } else {
          area.classList.remove('has-files');
          const originalText = area.querySelector('.file-upload-text');
          if (area.closest('.attachment-upload')) {
            originalText.textContent = '添加附件';
          } else if (this.accept.includes('video')) {
            originalText.textContent = '添加视频';
          } else {
            originalText.textContent = '添加图片';
          }
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      
      if (currentStep === 1) {
        // 第一步：初次上报
        alert('初次上报提交成功！请继续在“后期补报”中完善后续处理信息。');
        
        // 更新时间轴
        const node1 = document.getElementById('node1');
        const node2 = document.getElementById('node2');
        const node3 = document.getElementById('node3');
        
        node1.classList.remove('status-active');
        node1.classList.add('status-done');
        node2.classList.remove('status-pending');
        node2.classList.add('status-done'); // 模拟自动进入审核通过状态
        
        node3.classList.remove('status-pending');
        node3.classList.add('status-active');
        
        // 展开后期补报
        followUpSection.style.display = 'block';
        followUpSection.scrollIntoView({ behavior: 'smooth' });
        
        // 修改按钮
        submitBtn.textContent = '提交结案';
        currentStep = 2;
      } else {
        // 第二步：后期补报
        alert('事故补报提交成功！该事故已闭环并归档。');
        
        const node3 = document.getElementById('node3');
        const node4 = document.getElementById('node4');
        
        node3.classList.remove('status-active');
        node3.classList.add('status-done');
        node4.classList.remove('status-pending');
        node4.classList.add('status-done');
        
        submitBtn.disabled = true;
        submitBtn.textContent = '已闭环归档';
        submitBtn.style.opacity = '0.6';
        
        setTimeout(() => {
          navigateTo('accident-emergency');
        }, 2000);
      }
    });

    const resetBtn = form.querySelector('.btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (confirm('确定要重置表单内容吗？所有已填写内容将丢失。')) {
          form.reset();
          const areas = form.querySelectorAll('.file-upload-area');
          areas.forEach(area => {
            area.classList.remove('has-files');
            const originalText = area.querySelector('.file-upload-text');
            if (area.closest('.attachment-upload')) {
              originalText.textContent = '添加附件';
            } else if (area.querySelector('.file-input').accept.includes('video')) {
              originalText.textContent = '添加视频';
            } else {
              originalText.textContent = '添加图片';
            }
          });
          
          // 重置状态
          currentStep = 1;
          followUpSection.style.display = 'none';
          submitBtn.textContent = '提交上报';
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          
          // 重置时间轴
          document.querySelectorAll('.timeline-item').forEach((item, idx) => {
            item.classList.remove('status-done', 'status-active');
            if (idx === 0) item.classList.add('status-active');
            else item.classList.add('status-pending');
          });
        }
      });
    }
  }

  function initDualPreventionHazardTab() {
    var hazardReportList = [];
    var hazardIndex = 100000;
    var provincesData = [];
    var centersData = [];
    var hazardDeleteMode = false;
    var selectedHazardIds = {};

    function dbToFrontend(row) {
      var regionParts = [row.area, row.province, row.center].filter(Boolean);
      return {
        id: row.id,
        category: row.category || '',
        second: row.content || '',
        otherDesc: '',
        desc: row.description || '',
        region: regionParts.join(' / '),
        time: row.report_time ? String(row.report_time).replace('T', ' ').substring(0, 16) : '',
        status: row.status || '待稽核',
        imageBefore: row.photo_before ? [row.photo_before] : [],
        imageAfter: row.photo_after ? [row.photo_after] : [],
        closedLoop: !!row.is_closed,
        source: row.source_type === 'self_check' ? 'self-check' : (row.source_type === 'security_audit' ? 'security-audit' : (row.source_type === 'special' ? 'special-audit' : undefined)),
        rectifyDesc: row.rectify_description || '',
        rectifyTime: row.rectify_time ? String(row.rectify_time).replace('T', ' ').substring(0, 16) : '',
        rectifyPerson: row.rectifier || ''
      };
    }

    function loadHazardsFromAPI() {
      apiGet('/api/hazards').then(function (rows) {
        hazardReportList = rows.map(dbToFrontend);
        if (hazardReportList.length > 0) {
          hazardIndex = Math.max.apply(null, hazardReportList.map(function(r) { return r.id; })) + 1;
        }
        try { renderHazardRows(); } catch(e) { console.warn('renderHazardRows error:', e); }
        try { renderSelfcheckRows(); } catch(e) { console.warn('renderSelfcheckRows error:', e); }
        try { renderSecurityAuditRows(); } catch(e) { console.warn('renderSecurityAuditRows error:', e); }
        try { renderSpecialAuditRows(); } catch(e) { console.warn('renderSpecialAuditRows error:', e); }
      }).catch(function (err) {
        console.error('从API加载隐患数据失败:', err);
      });
    }

    var subNav = mainContent.querySelector('.hazard-sub-tab-nav');
    var panels = {
      report: document.getElementById('hazardSubPanelReport'),
      selfcheck: document.getElementById('hazardSubPanelSelfcheck'),
      audit: document.getElementById('hazardSubPanelAudit'),
      special: document.getElementById('hazardSubPanelSpecial'),
      remind: document.getElementById('hazardSubPanelRemind')
    };
    if (subNav) {
      subNav.addEventListener('click', function (e) {
        var tab = e.target.closest('.tab-item[data-hazard-sub]');
        if (!tab) return;
        var key = tab.dataset.hazardSub;
        subNav.querySelectorAll('.tab-item').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        Object.keys(panels).forEach(function (k) {
          var el = panels[k];
          if (el) el.style.display = k === key ? '' : 'none';
        });
      });
    }

    var overlay = document.getElementById('hazardReportModalOverlay');
    var addBtn = document.getElementById('hazardReportAddBtn');
    var closeBtn = document.getElementById('hazardReportModalClose');
    var cancelBtn = document.getElementById('hazardReportModalCancel');
    var submitBtn = document.getElementById('hazardReportSubmitBtn');
    var hintEl = document.getElementById('hazardReportFormHint');
    var categoryEl = document.getElementById('hazardFormCategory');
    var secondEl = document.getElementById('hazardFormSecond');
    var otherWrap = document.getElementById('hazardFormOtherWrap');
    var otherDescEl = document.getElementById('hazardFormOtherDesc');
    var descEl = document.getElementById('hazardFormDesc');
    var tbody = document.getElementById('hazardReportTbody');
    var searchInput = document.getElementById('hazardSearchInput');
    var filterCategory = document.getElementById('hazardFilterCategory');
    var filterStatus = document.getElementById('hazardFilterStatus');
    var filterArea = document.getElementById('hazardFilterArea');
    var filterProvince = document.getElementById('hazardFilterProvince');
    var filterCenter = document.getElementById('hazardFilterCenter');
    var deleteToggleBtn = document.getElementById('hazardDeleteToggleBtn');
    var selectAllCheckbox = document.getElementById('hazardSelectAll');
    var hazardReportTable = document.getElementById('hazardReportTable');
    var selfcheckFilterCategory = document.getElementById('selfcheckFilterCategory');
    var selfcheckFilterStatus = document.getElementById('selfcheckFilterStatus');
    var selfcheckFilterArea = document.getElementById('selfcheckFilterArea');
    var selfcheckFilterProvince = document.getElementById('selfcheckFilterProvince');
    var selfcheckFilterCenter = document.getElementById('selfcheckFilterCenter');
    var selfcheckSearchInput = document.getElementById('selfcheckSearchInput');

    function fillFilterLocationOptions() {
      // Manual Hazard Filters
      fillFilterProvinces(filterArea, filterProvince, filterCenter);
      fillFilterCenters(filterProvince, filterCenter, filterArea);
      // Self-check Filters
      fillFilterProvinces(selfcheckFilterArea, selfcheckFilterProvince, selfcheckFilterCenter);
      fillFilterCenters(selfcheckFilterProvince, selfcheckFilterCenter, selfcheckFilterArea);
    }

    function fillFilterProvinces(areaEl, provEl, centerEl) {
      if (!provEl) return;
      var areaVal = areaEl ? areaEl.value : '';
      var current = provEl.value;
      provEl.innerHTML = '<option value="">全部</option>';
      var filtered = areaVal ? provincesData.filter(function(p) { return p.northSouth === areaVal; }) : provincesData;
      filtered.forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        provEl.appendChild(opt);
      });
      var exists = Array.prototype.some.call(provEl.options, function(o) { return o.value === current; });
      if (exists) provEl.value = current;
      else provEl.value = '';
    }

    function fillFilterCenters(provEl, centerEl, areaEl) {
      if (!centerEl) return;
      var provName = provEl ? provEl.value : '';
      var areaVal = areaEl ? areaEl.value : '';
      var current = centerEl.value;
      centerEl.innerHTML = '<option value="">全部</option>';
      
      var filtered = [];
      if (provName) {
        var province = provincesData.find(function(p) { return p.name === provName; });
        if (province) filtered = centersData.filter(function(c) { return c.provinceCode === province.code; });
      } else if (areaVal) {
        var areaProvinceCodes = provincesData.filter(function(p) { return p.northSouth === areaVal; }).map(function(p) { return p.code; });
        filtered = centersData.filter(function(c) { return areaProvinceCodes.indexOf(c.provinceCode) !== -1; });
      } else {
        filtered = centersData;
      }

      filtered.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.shortName || c.name;
        opt.textContent = c.shortName || c.name;
        centerEl.appendChild(opt);
      });

      var exists = Array.prototype.some.call(centerEl.options, function(o) { return o.value === current; });
      if (exists) centerEl.value = current;
      else centerEl.value = '';
    }
    function fillHazardSecondOptions(category) {
      var listContainer = document.getElementById('hazardFormSecondList');
      var changeBtn = document.getElementById('hazardSecondChangeBtn');
      var guide = document.getElementById('hazardSecondGuide');
      if (!listContainer || !secondEl) return;
      
      listContainer.classList.remove('single-mode');
      listContainer.innerHTML = '';
      if (changeBtn) changeBtn.style.display = 'none';
      if (guide) guide.style.display = '';
      
      secondEl.value = '';
      secondEl.dispatchEvent(new Event('change'));
      
      if (!category || !HAZARD_CATEGORY_CONTENT[category]) return;
      
      HAZARD_CATEGORY_CONTENT[category].forEach(function (text) {
        var item = document.createElement('div');
        item.className = 'hazard-second-item';
        item.textContent = text;
        item.onclick = function () {
          listContainer.querySelectorAll('.hazard-second-item').forEach(function (el) { el.classList.remove('active'); });
          item.classList.add('active');
          listContainer.classList.add('single-mode');
          if (changeBtn) changeBtn.style.display = '';
          if (guide) guide.style.display = 'none';
          
          secondEl.value = text;
          secondEl.dispatchEvent(new Event('change'));
        };
        listContainer.appendChild(item);
      });

      if (changeBtn) {
        changeBtn.onclick = function(e) {
          e.preventDefault();
          listContainer.classList.remove('single-mode');
          listContainer.querySelectorAll('.hazard-second-item').forEach(function (el) { el.classList.remove('active'); });
          changeBtn.style.display = 'none';
          if (guide) guide.style.display = '';
          secondEl.value = '';
          secondEl.dispatchEvent(new Event('change'));
        };
      }
    }

    function populateHazardCategorySelects() {
      var filterSel = document.getElementById('hazardFilterCategory');
      var formSel = document.getElementById('hazardFormCategory');
      if (filterSel) {
        filterSel.innerHTML = '<option value="">全部</option>';
        HAZARD_CATEGORY_LIST.forEach(function (c) {
          var opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          filterSel.appendChild(opt);
        });
      }
      if (selfcheckFilterCategory) {
        selfcheckFilterCategory.innerHTML = '<option value="">全部</option>';
        HAZARD_CATEGORY_LIST.forEach(function (c) {
          var opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          selfcheckFilterCategory.appendChild(opt);
        });
      }
      if (formSel) {
        formSel.innerHTML = '<option value="">请选择</option>';
        HAZARD_CATEGORY_LIST.forEach(function (c) {
          var opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          formSel.appendChild(opt);
        });
      }
    }
    populateHazardCategorySelects();

    function showHint(msg) { if (hintEl) hintEl.textContent = msg || ''; }



    function fillProvincesByNorthSouth(northSouthVal) {
      var sel = document.getElementById('hazardFormProvince');
      if (!sel) return;
      sel.innerHTML = '<option value="">请选择</option>';
      document.getElementById('hazardFormCenter').innerHTML = '<option value="">请选择</option>';
      if (!northSouthVal || !provincesData.length) return;
      provincesData.filter(function (p) { return p.northSouth === northSouthVal; }).forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p.code;
        opt.textContent = p.name;
        opt.dataset.name = p.name;
        sel.appendChild(opt);
      });
    }

    function fillCentersByProvince(provinceCode) {
      var sel = document.getElementById('hazardFormCenter');
      if (!sel) return;
      sel.innerHTML = '<option value="">请选择</option>';
      if (!provinceCode || !centersData.length) return;
      centersData.filter(function (c) { return c.provinceCode === provinceCode; }).forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = c.shortName || c.name;
        opt.dataset.name = c.name;
        opt.dataset.shortName = c.shortName || c.name;
        sel.appendChild(opt);
      });
    }

    function openModal() {
      if (categoryEl) categoryEl.value = '';
      fillHazardSecondOptions('');
      if (secondEl) {
        secondEl.value = '';
        secondEl.dispatchEvent(new Event('change'));
      }
      if (otherDescEl) otherDescEl.value = '';
      if (descEl) descEl.value = '';
      if (otherWrap) otherWrap.style.display = 'none';
      var nsEl = document.getElementById('hazardFormNorthSouth');
      var provEl = document.getElementById('hazardFormProvince');
      var centerEl = document.getElementById('hazardFormCenter');
      if (nsEl) nsEl.value = '';
      if (provEl) provEl.innerHTML = '<option value="">请选择</option>';
      if (centerEl) centerEl.innerHTML = '<option value="">请选择</option>';
      var timeEl = document.getElementById('hazardFormTime');
      if (timeEl) {
        var now = new Date();
        var nowStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + 'T' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        timeEl.value = nowStr;
        timeEl.max = nowStr;
      }
      var fileEl = document.getElementById('hazardFormFile');
      var fileText = document.getElementById('hazardFormFileText');
      if (fileEl) fileEl.value = '';
      if (fileText) fileText.textContent = '点击或拖拽上传';
      var descLabel = document.getElementById('hazardFormDescLabel');
      if (descLabel) descLabel.classList.remove('required');
      showHint('');
      if (overlay) overlay.style.display = 'flex';
    }
    function closeModal() {
      if (overlay) overlay.style.display = 'none';
    }

    if (secondEl) {
      secondEl.addEventListener('change', function () {
        if (otherWrap) otherWrap.style.display = (secondEl.value === '其他') ? '' : 'none';
        if (otherDescEl && secondEl.value !== '其他') otherDescEl.value = '';
      });
    }
    if (categoryEl) {
      categoryEl.addEventListener('change', function () {
        fillHazardSecondOptions(categoryEl.value);
        if (otherWrap) otherWrap.style.display = 'none';
        if (otherDescEl) otherDescEl.value = '';
        var descLabel = document.getElementById('hazardFormDescLabel');
        if (descLabel) {
          if (categoryEl.value === '其他') { descLabel.classList.add('required'); }
          else { descLabel.classList.remove('required'); }
        }
      });
    }


    (function loadLocationData() {
      if (typeof window.LOCATION_PROVINCES !== 'undefined' && typeof window.LOCATION_CENTERS !== 'undefined') {
        provincesData = window.LOCATION_PROVINCES;
        centersData = window.LOCATION_CENTERS;
        fillFilterLocationOptions();
        populateHazardCategorySelects();
        renderSelfcheckRows();
        return;
      }
      Promise.all([
        fetch('data/provinces.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
        fetch('data/centers.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
      ]).then(function (arr) {
        provincesData = arr[0] || [];
        centersData = arr[1] || [];
        fillFilterLocationOptions();
        populateHazardCategorySelects();
        renderSelfcheckRows();
      });
    })();

    var nsSelect = document.getElementById('hazardFormNorthSouth');
    var provSelect = document.getElementById('hazardFormProvince');
    var centerSelect = document.getElementById('hazardFormCenter');
    if (nsSelect) nsSelect.addEventListener('change', function () { fillProvincesByNorthSouth(this.value); });
    if (provSelect) provSelect.addEventListener('change', function () { fillCentersByProvince(this.value); });

    var fileArea = document.getElementById('hazardFormFileArea');
    var fileInput = document.getElementById('hazardFormFile');
    var fileTextEl = document.getElementById('hazardFormFileText');
    if (fileArea && fileInput && fileTextEl) {
      fileArea.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var n = this.files ? this.files.length : 0;
        fileTextEl.textContent = n ? '已选 ' + n + ' 个文件' : '点击或拖拽上传';
      });
    }

    if (addBtn) addBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
      });
    }

    function applyHazardFilters() { renderHazardRows(); }
    if (searchInput) searchInput.addEventListener('input', applyHazardFilters);
    if (filterCategory) filterCategory.addEventListener('change', applyHazardFilters);
    if (filterStatus) filterStatus.addEventListener('change', applyHazardFilters);
    if (filterArea) {
      filterArea.addEventListener('change', function() {
        fillFilterProvinces(filterArea, filterProvince, filterCenter);
        fillFilterCenters(filterProvince, filterCenter, filterArea);
        applyHazardFilters();
      });
    }
    if (filterProvince) {
      filterProvince.addEventListener('change', function() {
        fillFilterCenters(filterProvince, filterCenter, filterArea);
        applyHazardFilters();
      });
    }
    if (filterCenter) filterCenter.addEventListener('change', applyHazardFilters);

    function bindReportFilters(prefix, renderFn) {
      ['Category', 'Status', 'Area', 'Province', 'Center'].forEach(function(key) {
        var el = document.getElementById(prefix + key);
        if (el) el.addEventListener('change', renderFn);
      });
    }
    bindReportFilters('selfcheckFilter', renderSelfcheckRows);
    bindReportFilters('securityAuditFilter', renderSecurityAuditRows);
    bindReportFilters('specialAuditFilter', renderSpecialAuditRows);
    
    if (selfcheckSearchInput) selfcheckSearchInput.addEventListener('input', renderSelfcheckRows);
    var saSearchInput = document.getElementById('securityAuditSearchInput');
    if (saSearchInput) saSearchInput.addEventListener('input', renderSecurityAuditRows);
    var spSearchInput = document.getElementById('specialAuditSearchInput');
    if (spSearchInput) spSearchInput.addEventListener('input', renderSpecialAuditRows);

    function readFilesAsDataUrls(files, callback) {
      var list = [];
      var n = files ? files.length : 0;
      if (n === 0) { callback(list); return; }
      var done = 0;
      for (var i = 0; i < n; i++) {
        (function (file) {
          if (!file.type || file.type.indexOf('image/') !== 0) { done++; if (done === n) callback(list); return; }
          var fr = new FileReader();
          fr.onload = function () { list.push(fr.result); done++; if (done === n) callback(list); };
          fr.readAsDataURL(file);
        })(files[i]);
      }
    }

    function getFilteredHazardList() {
      var keyword = (searchInput && searchInput.value ? searchInput.value.trim() : '').toLowerCase();
      var categoryVal = filterCategory ? filterCategory.value.trim() : '';
      var statusVal = filterStatus ? filterStatus.value.trim() : '';
      var areaVal = filterArea ? filterArea.value.trim() : '';
      var provinceVal = filterProvince ? filterProvince.value.trim() : '';
      var centerVal = filterCenter ? filterCenter.value.trim() : '';
      return hazardReportList.filter(function (r) {
        if (r.source === 'self-check') return false;
        if (categoryVal && r.category !== categoryVal) return false;
        if (statusVal && (r.status || '待稽核') !== statusVal) return false;
        var regionParts = (r.region || '').split(/\s*\/\s*/);
        var area = (regionParts[0] || '').trim();
        var province = (regionParts[1] || '').trim();
        var center = (regionParts[2] || '').trim();
        if (areaVal && area !== areaVal) return false;
        if (provinceVal && province !== provinceVal) return false;
        if (centerVal && center !== centerVal) return false;
        if (!keyword) return true;
        var region = (r.region || '').toLowerCase();
        var desc = (r.desc || '').toLowerCase();
        var cat = (r.category || '').toLowerCase();
        var content = (r.second === '其他' ? (r.otherDesc || '') : (r.second || '')).toLowerCase();
        return region.indexOf(keyword) !== -1 || desc.indexOf(keyword) !== -1 || cat.indexOf(keyword) !== -1 || content.indexOf(keyword) !== -1;
      });
    }

    function getFilteredSelfcheckList() {
      var keyword = (selfcheckSearchInput && selfcheckSearchInput.value ? selfcheckSearchInput.value.trim() : '').toLowerCase();
      var categoryVal = selfcheckFilterCategory ? selfcheckFilterCategory.value.trim() : '';
      var statusVal = selfcheckFilterStatus ? selfcheckFilterStatus.value.trim() : '';
      var areaVal = selfcheckFilterArea ? selfcheckFilterArea.value.trim() : '';
      var provinceVal = selfcheckFilterProvince ? selfcheckFilterProvince.value.trim() : '';
      var centerVal = selfcheckFilterCenter ? selfcheckFilterCenter.value.trim() : '';
      return hazardReportList.filter(function (r) {
        if (r.source !== 'self-check') return false;
        if (categoryVal && r.category !== categoryVal) return false;
        if (statusVal && (r.status || '待稽核') !== statusVal) return false;
        var regionParts = (r.region || '').split(/\s*\/\s*/);
        var area = (regionParts[0] || '').trim();
        var province = (regionParts[1] || '').trim();
        var center = (regionParts[2] || '').trim();
        if (areaVal && area !== areaVal) return false;
        if (provinceVal && province !== provinceVal) return false;
        if (centerVal && center !== centerVal) return false;
        if (!keyword) return true;
        var region = (r.region || '').toLowerCase();
        var desc = (r.desc || '').toLowerCase();
        var cat = (r.category || '').toLowerCase();
        var content = (r.second === '其他' ? (r.otherDesc || '') : (r.second || '')).toLowerCase();
        return region.indexOf(keyword) !== -1 || desc.indexOf(keyword) !== -1 || cat.indexOf(keyword) !== -1 || content.indexOf(keyword) !== -1;
      });
    }

    function getFilteredSecurityAuditList() {
      var searchEl = document.getElementById('securityAuditSearchInput');
      var keyword = (searchEl && searchEl.value ? searchEl.value.trim() : '').toLowerCase();
      var catEl = document.getElementById('securityAuditFilterCategory');
      var statusEl = document.getElementById('securityAuditFilterStatus');
      var areaEl = document.getElementById('securityAuditFilterArea');
      var provEl = document.getElementById('securityAuditFilterProvince');
      var centEl = document.getElementById('securityAuditFilterCenter');
      var categoryVal = catEl ? catEl.value.trim() : '';
      var statusVal = statusEl ? statusEl.value.trim() : '';
      var areaVal = areaEl ? areaEl.value.trim() : '';
      var provinceVal = provEl ? provEl.value.trim() : '';
      var centerVal = centEl ? centEl.value.trim() : '';
      return hazardReportList.filter(function (r) {
        if (r.source !== 'security-audit') return false;
        if (categoryVal && r.category !== categoryVal) return false;
        if (statusVal && (r.status || '待稽核') !== statusVal) return false;
        var regionParts = (r.region || '').split(/\s*\/\s*/);
        var area = (regionParts[0] || '').trim();
        var province = (regionParts[1] || '').trim();
        var center = (regionParts[2] || '').trim();
        if (areaVal && area !== areaVal) return false;
        if (provinceVal && province !== provinceVal) return false;
        if (centerVal && center !== centerVal) return false;
        if (!keyword) return true;
        var region = (r.region || '').toLowerCase();
        var desc = (r.desc || '').toLowerCase();
        var cat = (r.category || '').toLowerCase();
        var content = (r.second === '其他' ? (r.otherDesc || '') : (r.second || '')).toLowerCase();
        return region.indexOf(keyword) !== -1 || desc.indexOf(keyword) !== -1 || cat.indexOf(keyword) !== -1 || content.indexOf(keyword) !== -1;
      });
    }

    function getFilteredSpecialAuditList() {
      var searchEl = document.getElementById('specialAuditSearchInput');
      var keyword = (searchEl && searchEl.value ? searchEl.value.trim() : '').toLowerCase();
      var catEl = document.getElementById('specialAuditFilterCategory');
      var statusEl = document.getElementById('specialAuditFilterStatus');
      var areaEl = document.getElementById('specialAuditFilterArea');
      var provEl = document.getElementById('specialAuditFilterProvince');
      var centEl = document.getElementById('specialAuditFilterCenter');
      var categoryVal = catEl ? catEl.value.trim() : '';
      var statusVal = statusEl ? statusEl.value.trim() : '';
      var areaVal = areaEl ? areaEl.value.trim() : '';
      var provinceVal = provEl ? provEl.value.trim() : '';
      var centerVal = centEl ? centEl.value.trim() : '';
      return hazardReportList.filter(function (r) {
        if (r.source !== 'special-audit') return false;
        if (categoryVal && r.category !== categoryVal) return false;
        if (statusVal && (r.status || '待稽核') !== statusVal) return false;
        var regionParts = (r.region || '').split(/\s*\/\s*/);
        var area = (regionParts[0] || '').trim();
        var province = (regionParts[1] || '').trim();
        var center = (regionParts[2] || '').trim();
        if (areaVal && area !== areaVal) return false;
        if (provinceVal && province !== provinceVal) return false;
        if (centerVal && center !== centerVal) return false;
        if (!keyword) return true;
        var region = (r.region || '').toLowerCase();
        var desc = (r.desc || '').toLowerCase();
        var cat = (r.category || '').toLowerCase();
        var content = (r.second === '其他' ? (r.otherDesc || '') : (r.second || '')).toLowerCase();
        return region.indexOf(keyword) !== -1 || desc.indexOf(keyword) !== -1 || cat.indexOf(keyword) !== -1 || content.indexOf(keyword) !== -1;
      });
    }

    function renderHazardRows() {
      if (!tbody) return;
      var filtered = getFilteredHazardList();
      var filteredIds = filtered.map(function (item) { return item.id; });
      var validSelected = {};
      Object.keys(selectedHazardIds).forEach(function (idStr) {
        var idNum = parseInt(idStr, 10);
        if (filteredIds.indexOf(idNum) !== -1) validSelected[idNum] = true;
      });
      selectedHazardIds = validSelected;
      if (!filtered.length) {
        var hasData = hazardReportList.some(function(r) { return r.source !== 'self-check'; });
        tbody.innerHTML = '<tr><td colspan="16" style="text-align:center;color:var(--text-secondary);padding:24px;">' + (hasData ? '无匹配结果，请调整搜索或筛选条件' : '暂无数据，可点击「新增隐患上报」提交') + '</td></tr>';
        updateDeleteModeUI();
        return;
      }
      tbody.innerHTML = buildRowsHtml(filtered, {
        selectable: true,
        deleteMode: hazardDeleteMode,
        selectedIds: selectedHazardIds
      });
      updateDeleteModeUI();
    }

    function renderSelfcheckRows() {
      renderRowsBySource('selfcheckReportsTbody', getFilteredSelfcheckList(), 'self-check', '暂无自查自纠数据');
    }

    function renderSecurityAuditRows() {
      renderRowsBySource('securityAuditReportsTbody', getFilteredSecurityAuditList(), 'security-audit', '暂无安全稽核数据');
    }

    function renderSpecialAuditRows() {
      renderRowsBySource('specialAuditReportsTbody', getFilteredSpecialAuditList(), 'special-audit', '暂无专项稽查数据');
    }

    function renderRowsBySource(tbodyId, filtered, source, emptyMsg) {
      var tbody = document.getElementById(tbodyId);
      if (!tbody) return;
      if (!filtered.length) {
        var hasData = hazardReportList.some(function (r) { return r.source === source; });
        tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;color:var(--text-secondary);padding:24px;">' + (hasData ? '无匹配结果' : emptyMsg) + '</td></tr>';
        return;
      }
      tbody.innerHTML = buildRowsHtml(filtered);
    }

    function buildRowsHtml(list, opts) {
      var options = opts || {};
      var selectable = !!options.selectable;
      var deleteMode = !!options.deleteMode;
      var selectedIds = options.selectedIds || {};
      return list.map(function (r) {
        var beforeList = r.imageBefore || [];
        var afterList = r.imageAfter || [];
        var closed = !!r.closedLoop;
        var regionParts = (r.region || '').split(/\s*\/\s*/);
        var area = regionParts[0] || '-';
        var province = regionParts[1] || '-';
        var center = regionParts[2] || '-';
        var beforeHtml = beforeList.length ? ('<div class="hazard-cell-imgs">' + beforeList.slice(0, 2).map(function (src) { return '<img src="' + src + '" alt="整改前" class="hazard-thumb"/>'; }).join('') + (beforeList.length > 2 ? '<span class="hazard-thumb-more">+' + (beforeList.length - 2) + '</span>' : '') + '</div>') : '-';
        var afterHtml = afterList.length ? ('<div class="hazard-cell-imgs">' + afterList.slice(0, 2).map(function (src) { return '<img src="' + src + '" alt="整改后" class="hazard-thumb"/>'; }).join('') + (afterList.length > 2 ? '<span class="hazard-thumb-more">+' + (afterList.length - 2) + '</span>' : '') + '</div>') : '<span class="text-muted">未上传</span>';
        var closedText = closed ? '<span class="risk-badge success">是</span>' : '<span class="risk-badge gray">否</span>';
        var opLabel = closed ? '查看' : '处理';
        var content = r.second === '其他' ? (r.otherDesc || '-') : (r.second || '-');
        var contentShort = content.length > 30 ? content.substring(0, 30) + '...' : content;
        var descLong = r.desc || '-';
        var descShort = descLong.length > 40 ? descLong.substring(0, 40) + '...' : descLong;
        var rectifyTime = r.rectifyTime || '-';
        var rectifyDesc = r.rectifyDesc || '-';
        var rectifyDescShort = rectifyDesc.length > 20 ? rectifyDesc.substring(0, 20) + '...' : rectifyDesc;
        var rectifyPerson = r.rectifyPerson || '-';
        var checked = selectedIds[r.id] ? ' checked' : '';
        var selectCell = selectable ? ('<td class="hazard-select-col"><input type="checkbox" class="hazard-row-check" data-id="' + r.id + '"' + checked + (deleteMode ? '' : ' disabled') + '></td>') : '';
        return '<tr data-id="' + r.id + '">' +
          selectCell +
          '<td>' + (r.time ? r.time.replace('T', ' ') : '-') + '</td>' +
          '<td>' + area + '</td><td>' + province + '</td><td>' + center + '</td>' +
          '<td>' + (r.category || '-') + '</td>' +
          '<td title="' + content + '">' + contentShort + '</td>' +
          '<td>' + beforeHtml + '</td>' +
          '<td title="' + descLong + '">' + descShort + '</td>' +
          '<td>' + rectifyTime + '</td><td>' + afterHtml + '</td><td title="' + rectifyDesc + '">' + rectifyDescShort + '</td>' +
          '<td><span class="risk-badge ' + (closed ? 'green' : 'orange') + '">' + (r.status || '待稽核') + '</span></td>' +
          '<td>' + rectifyPerson + '</td>' +
          '<td><button type="button" class="btn btn-outline btn-sm hazard-op-btn" data-id="' + r.id + '">' + opLabel + '</button></td>' +
          '<td>' + closedText + '</td></tr>';
      }).join('');
    }

    function getSelectedCount() {
      return Object.keys(selectedHazardIds).length;
    }

    function updateDeleteModeUI() {
      if (hazardReportTable) {
        hazardReportTable.classList.toggle('delete-mode', hazardDeleteMode);
      }
      if (deleteToggleBtn) {
        var count = getSelectedCount();
        deleteToggleBtn.textContent = hazardDeleteMode ? ('确认删除' + (count ? '(' + count + ')' : '')) : '删除';
        deleteToggleBtn.classList.toggle('hazard-delete-btn--active', hazardDeleteMode);
      }
      if (selectAllCheckbox) {
        if (!hazardDeleteMode) {
          selectAllCheckbox.checked = false;
          return;
        }
        var filteredIds = getFilteredHazardList().map(function (item) { return item.id; });
        if (!filteredIds.length) {
          selectAllCheckbox.checked = false;
          return;
        }
        selectAllCheckbox.checked = filteredIds.every(function (id) { return !!selectedHazardIds[id]; });
      }
    }

    function toggleHazardDeleteMode() {
      if (!hazardDeleteMode) {
        hazardDeleteMode = true;
        selectedHazardIds = {};
        renderHazardRows();
        return;
      }
      var ids = Object.keys(selectedHazardIds).map(function (id) { return parseInt(id, 10); });
      if (!ids.length) {
        hazardDeleteMode = false;
        renderHazardRows();
        return;
      }
      if (!window.confirm('确认删除已勾选的 ' + ids.length + ' 条隐患记录吗？')) return;

      Promise.all(ids.map(function (id) {
        return apiDelete('/api/hazards/' + id).then(function () {
          return { ok: true, id: id };
        }).catch(function (err) {
          // 与后端幂等删除保持一致：404 视为记录已不存在，也从前端列表移除
          if (err && /HTTP 404/.test(String(err.message || ''))) {
            return { ok: true, id: id, alreadyDeleted: true };
          }
          return { ok: false, id: id };
        });
      })).then(function (results) {
        var successIds = [];
        var failedIds = [];
        results.forEach(function (result) {
          if (result && result.ok) successIds.push(result.id);
          else failedIds.push(result.id);
        });
        if (successIds.length) {
          hazardReportList = hazardReportList.filter(function (row) {
            return successIds.indexOf(row.id) === -1;
          });
        }
        hazardDeleteMode = false;
        selectedHazardIds = {};
        renderHazardRows();
        if (failedIds.length) {
          alert('已删除 ' + successIds.length + ' 条，' + failedIds.length + ' 条删除失败。');
          return;
        }
        alert('已成功删除 ' + successIds.length + ' 条隐患记录。');
      });
    }

    var exportReportBtn = document.getElementById('hazardReportExportBtn');
    if (exportReportBtn) {
      exportReportBtn.addEventListener('click', function () {
        exportToCsv(getFilteredHazardList(), '隐患上报列表.csv');
      });
    }
    var selfcheckExportBtn = document.getElementById('selfcheckExportBtn');
    if (selfcheckExportBtn) {
      selfcheckExportBtn.addEventListener('click', function () {
        exportToCsv(getFilteredSelfcheckList(), '自查自纠报告列表.csv');
      });
    }
    var saExportBtn = document.getElementById('securityAuditExportBtn');
    if (saExportBtn) {
      saExportBtn.addEventListener('click', function () {
        exportToCsv(getFilteredSecurityAuditList(), '安全稽核报告列表.csv');
      });
    }
    var spExportBtn = document.getElementById('specialAuditExportBtn');
    if (spExportBtn) {
      spExportBtn.addEventListener('click', function () {
        exportToCsv(getFilteredSpecialAuditList(), '专项稽查报告列表.csv');
      });
    }
    if (deleteToggleBtn) {
      deleteToggleBtn.addEventListener('click', toggleHazardDeleteMode);
    }
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', function () {
        if (!hazardDeleteMode) return;
        var filteredIds = getFilteredHazardList().map(function (item) { return item.id; });
        if (this.checked) {
          filteredIds.forEach(function (id) { selectedHazardIds[id] = true; });
        } else {
          filteredIds.forEach(function (id) { delete selectedHazardIds[id]; });
        }
        renderHazardRows();
      });
    }

    function exportToCsv(filtered, filename) {
      function csvEscape(val) {
        var s = String(val == null ? '' : val);
        var normalized = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        return '"' + normalized.replace(/"/g, '""') + '"';
      }
      var headers = ['上报时间', '所属片区', '所属省区', '所属中心', '隐患类别', '隐患内容', '整改前照片张数', '具体问题描述', '整改时间', '整改后照片张数', '整改描述', '整改状态', '整改人', '是否闭环'];
      var lines = [];
      lines.push(headers.map(csvEscape).join(','));
      filtered.forEach(function (r) {
        var regionParts = (r.region || '').split(/\s*\/\s*/);
        var area = (regionParts[0] || '').trim() || '-';
        var province = (regionParts[1] || '').trim() || '-';
        var center = (regionParts[2] || '').trim() || '-';
        var content = r.second === '其他' ? (r.otherDesc || '-') : (r.second || '-');
        var beforeN = (r.imageBefore && r.imageBefore.length) ? String(r.imageBefore.length) : '0';
        var afterN = (r.imageAfter && r.imageAfter.length) ? String(r.imageAfter.length) : '0';
        var row = [
          r.time ? String(r.time).replace('T', ' ') : '-',
          area,
          province,
          center,
          r.category || '-',
          content,
          beforeN,
          r.desc || '-',
          r.rectifyTime || '-',
          afterN,
          r.rectifyDesc || '-',
          r.status || '待稽核',
          r.rectifyPerson || '-',
          r.closedLoop ? '是' : '否'
        ];
        lines.push(row.map(csvEscape).join(','));
      });
      var csv = '\ufeff' + lines.join('\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    if (submitBtn && tbody) {
      submitBtn.addEventListener('click', function () {
        var category = categoryEl ? categoryEl.value.trim() : '';
        var second = secondEl ? secondEl.value : '';
        var otherDesc = otherDescEl ? otherDescEl.value.trim() : '';
        var desc = descEl ? descEl.value.trim() : '';
        if (!category) { showHint('请选择隐患类别'); return; }
        if (!second) { showHint('请选择二级隐患描述'); return; }
        if (category === '其他' && !desc) { showHint('请填写具体问题描述'); return; }
        if (second === '其他' && !otherDesc) { showHint('选择「其他」时请填写自填隐患描述'); return; }
        var nsEl = document.getElementById('hazardFormNorthSouth');
        var provEl = document.getElementById('hazardFormProvince');
        var centerEl = document.getElementById('hazardFormCenter');
        var nsText = nsEl && nsEl.options[nsEl.selectedIndex] ? nsEl.options[nsEl.selectedIndex].text : '';
        var provText = provEl && provEl.options[provEl.selectedIndex] ? provEl.options[provEl.selectedIndex].dataset.name || provEl.options[provEl.selectedIndex].text : '';
        var centerText = centerEl && centerEl.options[centerEl.selectedIndex] ? centerEl.options[centerEl.selectedIndex].dataset.shortName || centerEl.options[centerEl.selectedIndex].text : '';
        var regionParts = [nsText, provText, centerText].filter(Boolean);
        var region = regionParts.length ? regionParts.join(' / ') : '';
        var fileInput = document.getElementById('hazardFormFile');
        var files = fileInput && fileInput.files ? fileInput.files : [];
        var timeInput = document.getElementById('hazardFormTime');
        var timeVal = timeInput ? timeInput.value : '';
        if (timeVal) {
          var selectedTime = new Date(timeVal).getTime();
          var nowTime = new Date().getTime();
          if (selectedTime > nowTime) {
            showHint('发现时间不能选择未来时间');
            return;
          }
        }
        readFilesAsDataUrls(files, function (imageBefore) {
          showHint('');
          var timeVal2 = document.getElementById('hazardFormTime') ? document.getElementById('hazardFormTime').value || new Date().toISOString().slice(0, 16) : '';
          var regionParts2 = region.split(/\s*\/\s*/);
          var formData = new FormData();
          formData.append('area', (regionParts2[0] || '').trim());
          formData.append('province', (regionParts2[1] || '').trim());
          formData.append('center', (regionParts2[2] || '').trim());
          formData.append('category', category);
          formData.append('content', second);
          formData.append('description', desc || otherDesc);
          formData.append('source_type', 'manual');
          if (files && files.length) formData.append('photo_before', files[0]);
          apiPostForm('/api/hazards/report', formData).then(function (result) {
            hazardReportList.push({
              id: result.id,
              category: category,
              second: second,
              otherDesc: otherDesc,
              desc: desc,
              region: region,
              time: result.report_time ? String(result.report_time).replace('T', ' ').substring(0, 16) : timeVal2,
              status: '待稽核',
              imageBefore: result.photo_before ? [result.photo_before] : (imageBefore || []),
              imageAfter: [],
              closedLoop: false
            });
            renderHazardRows();
            closeModal();
          }).catch(function (err) {
            console.error('API保存失败:', err);
            hazardIndex += 1;
            hazardReportList.push({
              id: hazardIndex,
              category: category,
              second: second,
              otherDesc: otherDesc,
              desc: desc,
              region: region,
              time: timeVal2,
              status: '待稽核',
              imageBefore: imageBefore || [],
              imageAfter: [],
              closedLoop: false
            });
            renderHazardRows();
            closeModal();
          });
        });
      });
    }

    var detailOverlay = document.getElementById('hazardDetailModalOverlay');
    var detailCloseBtn = document.getElementById('hazardDetailModalClose');
    var detailCancelBtn = document.getElementById('hazardDetailModalCancel');
    var detailCloseLoopBtn = document.getElementById('hazardDetailCloseLoopBtn');
    var detailInfoEl = document.getElementById('hazardDetailInfo');
    var detailBeforeImgs = document.getElementById('hazardDetailBeforeImgs');
    var detailAfterImgs = document.getElementById('hazardDetailAfterImgs');
    var detailAfterUpload = document.getElementById('hazardDetailAfterUpload');
    var detailAfterFile = document.getElementById('hazardDetailAfterFile');
    var detailAfterFileText = document.getElementById('hazardDetailAfterFileText');
    var detailHintEl = document.getElementById('hazardDetailFormHint');
    var detailRectifyDescEl = document.getElementById('hazardDetailRectifyDesc');
    var currentDetailId = null;
    var pendingAfterUrls = [];
    var pendingAfterFiles = [];

    var detailOnlyCloseBtn = document.getElementById('hazardDetailOnlyCloseBtn');
    var detailAfterSection = document.getElementById('hazardDetailAfterSection');

    function openDetailModal(id) {
      var r = hazardReportList.filter(function (x) { return x.id === id; })[0];
      if (!r) return;
      currentDetailId = id;
      pendingAfterUrls = (r.imageAfter && r.imageAfter.length) ? r.imageAfter.slice() : [];
      pendingAfterFiles = [];
      if (detailInfoEl) {
        detailInfoEl.innerHTML = '<div class="hazard-detail-row"><span class="label">隐患类别</span><span>' + (r.category || '-') + '</span></div>' +
          '<div class="hazard-detail-row"><span class="label">具体问题描述</span><span>' + (r.desc || '-') + '</span></div>' +
          '<div class="hazard-detail-row"><span class="label">发生地点</span><span>' + (r.region || '-') + '</span></div>' +
          '<div class="hazard-detail-row"><span class="label">状态</span><span>' + r.status + '</span></div>';
      }
      if (detailBeforeImgs) {
        if (r.imageBefore && r.imageBefore.length) {
          detailBeforeImgs.innerHTML = r.imageBefore.map(function (src) { return '<img src="' + src + '" alt="整改前" class="hazard-detail-img"/>'; }).join('');
        } else { detailBeforeImgs.innerHTML = '<span class="text-muted">暂无</span>'; }
      }
      if (detailAfterImgs) detailAfterImgs.innerHTML = pendingAfterUrls.map(function (src) { return '<img src="' + src + '" alt="整改后" class="hazard-detail-img"/>'; }).join('');
      if (detailAfterFile) detailAfterFile.value = '';
      if (detailAfterFileText) detailAfterFileText.textContent = pendingAfterUrls.length ? '已选 ' + pendingAfterUrls.length + ' 张，可继续添加' : '点击上传整改后照片';
      if (detailHintEl) detailHintEl.textContent = '';
      if (detailCloseLoopBtn) detailCloseLoopBtn.style.display = r.closedLoop ? 'none' : '';
      if (detailOnlyCloseBtn) detailOnlyCloseBtn.style.display = r.closedLoop ? '' : 'none';
      if (detailAfterUpload) detailAfterUpload.style.display = r.closedLoop ? 'none' : 'flex';
      if (detailRectifyDescEl) {
        detailRectifyDescEl.value = r.rectifyDesc || '';
        detailRectifyDescEl.readOnly = !!r.closedLoop;
        detailRectifyDescEl.style.background = r.closedLoop ? 'var(--bg-body)' : 'var(--bg-white)';
      }
      if (detailOverlay) detailOverlay.style.display = 'flex';
    }

    function closeDetailModal() {
      currentDetailId = null;
      pendingAfterUrls = [];
      pendingAfterFiles = [];
      if (detailOverlay) detailOverlay.style.display = 'none';
    }

    if (detailAfterUpload && detailAfterFile) {
      detailAfterUpload.addEventListener('click', function () { detailAfterFile.click(); });
      detailAfterFile.addEventListener('change', function () {
        var files = this.files;
        if (!files || !files.length) return;
        pendingAfterFiles = pendingAfterFiles.concat(Array.prototype.slice.call(files));
        readFilesAsDataUrls(files, function (urls) {
          pendingAfterUrls = pendingAfterUrls.concat(urls);
          if (detailAfterImgs) detailAfterImgs.innerHTML = pendingAfterUrls.map(function (src) { return '<img src="' + src + '" alt="整改后" class="hazard-detail-img"/>'; }).join('');
          if (detailAfterFileText) detailAfterFileText.textContent = '已选 ' + pendingAfterUrls.length + ' 张';
        });
      });
    }

    if (detailCloseLoopBtn) {
      detailCloseLoopBtn.addEventListener('click', function () {
        if (!currentDetailId) return;
        var r = hazardReportList.filter(function (x) { return x.id === currentDetailId; })[0];
        if (!r) return;
        if (!r.closedLoop && (!pendingAfterUrls || !pendingAfterUrls.length)) {
          if (detailHintEl) detailHintEl.textContent = '请上传整改后照片后再确认闭环';
          return;
        }
        var rectDesc = detailRectifyDescEl ? detailRectifyDescEl.value.trim() : '';
        if (!r.closedLoop && !rectDesc) {
          if (detailHintEl) detailHintEl.textContent = '请填写整改描述';
          return;
        }
        r.imageAfter = pendingAfterUrls.slice();
        r.rectifyDesc = rectDesc;
        r.rectifyTime = new Date().toISOString().replace('T', ' ').substring(0, 16);
        r.rectifyPerson = '管理员';
        r.closedLoop = true;
        r.status = '验收通过-关闭';
        if (detailHintEl) detailHintEl.textContent = '';

        var rectifyFormData = new FormData();
        rectifyFormData.append('rectify_description', rectDesc);
        rectifyFormData.append('rectifier', '管理员');
        if (pendingAfterFiles.length) rectifyFormData.append('photo_after', pendingAfterFiles[0]);
        apiPostForm('/api/hazards/' + r.id + '/rectify', rectifyFormData).then(function (result) {
          if (result && result.photo_after) {
            r.imageAfter = [result.photo_after];
          }
          if (result && result.rectify_time) {
            r.rectifyTime = String(result.rectify_time).replace('T', ' ').substring(0, 16);
          }
          return apiPatch('/api/hazards/' + r.id + '/close', {
            acceptanceResult: '验收通过'
          });
        }).catch(function (err) {
          console.warn('闭环同步API失败:', err);
        });

        renderHazardRows();
        closeDetailModal();
      });
    }

    if (detailCloseBtn) detailCloseBtn.addEventListener('click', closeDetailModal);
    if (detailCancelBtn) detailCancelBtn.addEventListener('click', closeDetailModal);
    if (detailOnlyCloseBtn) detailOnlyCloseBtn.addEventListener('click', closeDetailModal);
    if (detailOverlay) detailOverlay.addEventListener('click', function (e) { if (e.target === detailOverlay) closeDetailModal(); });

    tbody.addEventListener('click', function (e) {
      if (e.target.closest('.hazard-row-check')) return;
      var btn = e.target.closest('.hazard-op-btn');
      if (!btn) return;
      var id = parseInt(btn.dataset.id, 10);
      if (id) openDetailModal(id);
    });
    tbody.addEventListener('change', function (e) {
      var checkbox = e.target.closest('.hazard-row-check');
      if (!checkbox || !hazardDeleteMode) return;
      var id = parseInt(checkbox.dataset.id, 10);
      if (!id) return;
      if (checkbox.checked) selectedHazardIds[id] = true;
      else delete selectedHazardIds[id];
      updateDeleteModeUI();
    });
    var selfTbody = document.getElementById('selfcheckReportsTbody');
    if (selfTbody) {
      selfTbody.addEventListener('click', function (e) {
        var btn = e.target.closest('.hazard-op-btn');
        if (!btn) return;
        var id = parseInt(btn.dataset.id, 10);
        if (id) openDetailModal(id);
      });
    }

    loadSelfcheckTasks();
    loadSecurityAuditTasks();
    renderSelfcheckRows();
    initSelfCheckTaskUpload();
    initSelfCheckTaskDispatch();
    initSecurityAuditTaskUpload();
    initSecurityAuditTaskDispatch();

    function loadSelfcheckTasks() {
      var tbody = document.getElementById('selfcheckTaskTbody');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:30px;">加载中...</td></tr>';
      
      apiGet('/api/tasks?type=自查自纠').then(function(tasks) {
        if (!tasks || tasks.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:30px;">暂无数据</td></tr>';
          return;
        }
        tbody.innerHTML = '';
        tasks.forEach(function(task) {
          var tr = document.createElement('tr');
          var targetDesc = task.target_area || '全网';
          if (task.target_province) {
            targetDesc += ' - ' + task.target_province;
            if (task.target_center) {
              targetDesc += ' - ' + task.target_center;
            }
          }
          
          var dispatchTime = task.dispatch_time ? String(task.dispatch_time).replace('T', ' ').substring(0, 16) : '';
          var deadline = task.deadline ? String(task.deadline).replace('T', ' ').substring(0, 16) : '';
          
          tr.innerHTML = '<td>' + task.title + ' <span class="selfcheck-target-suffix">' + targetDesc + '</span></td>' +
                         '<td>' + dispatchTime + '</td>' +
                         '<td>' + deadline + '</td>' +
                         '<td><a href="javascript:void(0)" class="file-link">' + (task.template_file || '-') + '</a></td>' +
                         '<td><span class="risk-badge blue">' + task.status + '</span></td>' +
                         '<td><span style="color:var(--primary);font-weight:600;">' + (task.completion_rate || 0) + '%</span></td>' +
                         '<td><button type="button" class="btn btn-outline btn-sm selfcheck-remind-btn">提醒完成</button></td>';
          tbody.appendChild(tr);
        });
      }).catch(function(err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--danger);padding:30px;">加载失败</td></tr>';
      });
    }

    function initSelfCheckTaskUpload() {
      var selfcheckTaskUploadBtn = document.getElementById('selfcheckTaskUploadBtn');
      var selfcheckTaskFileInput = document.getElementById('selfcheckTaskFileInput');
      if (!selfcheckTaskUploadBtn || !selfcheckTaskFileInput) return;

      selfcheckTaskUploadBtn.addEventListener('click', function () {
        selfcheckTaskFileInput.click();
      });

      selfcheckTaskFileInput.addEventListener('change', function () {
        var files = this.files;
        if (!files || !files.length) return;
        var file = files[0];
        
        var formData = new FormData();
        formData.append('template_file', file);
        
        var uploadBtnText = selfcheckTaskUploadBtn.innerHTML;
        selfcheckTaskUploadBtn.innerHTML = '上传中...';
        selfcheckTaskUploadBtn.disabled = true;

        apiPostForm('/api/checklists', formData).then(function(res) {
          alert('检查表「' + file.name + '」上传成功！现在可以点击「下发任务」进行分发。');
          selfcheckTaskFileInput.value = '';
        }).catch(function(err) {
          alert('上传失败: ' + err.message);
        }).finally(function() {
          selfcheckTaskUploadBtn.innerHTML = uploadBtnText;
          selfcheckTaskUploadBtn.disabled = false;
        });
      });
    }

    function initSelfCheckTaskDispatch() {
      var dispatchBtn = document.getElementById('selfcheckTaskDispatchBtn');
      var modal = document.getElementById('selfcheckTaskDispatchModalOverlay');
      var closeBtn = document.getElementById('selfcheckDispatchModalClose');
      var cancelBtn = document.getElementById('selfcheckDispatchCancel');
      var submitBtn = document.getElementById('selfcheckDispatchSubmit');
      
      var nameInput = document.getElementById('selfcheckDispatchName');
      var checklistSelect = document.getElementById('selfcheckDispatchChecklist');
      var areaSelect = document.getElementById('selfcheckDispatchArea');
      var provSelect = document.getElementById('selfcheckDispatchProvince');
      var centerSelect = document.getElementById('selfcheckDispatchCenter');
      var deadlineInput = document.getElementById('selfcheckDispatchDeadline');
      var hintEl = document.getElementById('selfcheckDispatchHint');

      if (!dispatchBtn || !modal) return;

      function updateChecklistOptions() {
        if (!checklistSelect) return;
        checklistSelect.innerHTML = '<option value="">加载中...</option>';
        apiGet('/api/checklists').then(function(list) {
          checklistSelect.innerHTML = '<option value="">请选择检查表</option>';
          if (!list || list.length === 0) {
            checklistSelect.innerHTML = '<option value="">请先上传检查表</option>';
            return;
          }
          list.forEach(function(item) {
            var opt = document.createElement('option');
            opt.value = item.filename;
            opt.textContent = item.filename;
            checklistSelect.appendChild(opt);
          });
        });
      }

      function fillProvinces(area) {
        if (!provSelect) return;
        provSelect.innerHTML = '<option value="">全部</option>';
        centerSelect.innerHTML = '<option value="">全部</option>';
        if (!area) return;
        var filtered = provincesData.filter(function(p) { return p.northSouth === area; });
        filtered.forEach(function(p) {
          var opt = document.createElement('option');
          opt.value = p.code;
          opt.textContent = p.name;
          provSelect.appendChild(opt);
        });
      }

      function fillCenters(prov) {
        if (!centerSelect) return;
        centerSelect.innerHTML = '<option value="">全部</option>';
        if (!prov) return;
        var filtered = centersData.filter(function(c) { return c.provinceCode === prov; });
        filtered.forEach(function(c) {
          var opt = document.createElement('option');
          opt.value = c.code;
          opt.textContent = c.shortName || c.name;
          centerSelect.appendChild(opt);
        });
      }

      if (areaSelect) areaSelect.addEventListener('change', function() { fillProvinces(this.value); });
      if (provSelect) provSelect.addEventListener('change', function() { fillCenters(this.value); });

      dispatchBtn.addEventListener('click', function() {
        updateChecklistOptions();
        if (nameInput) {
          var now = new Date();
          function getWeekNumber(d) {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
          }
          nameInput.value = now.getFullYear() + '年第' + getWeekNumber(now) + '周中心自查自纠';
        }
        if (deadlineInput) {
          var d = new Date();
          d.setDate(d.getDate() + 7);
          deadlineInput.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + 'T18:00';
        }
        if (hintEl) hintEl.textContent = '';
        modal.style.display = 'flex';
      });

      function closeModal() { modal.style.display = 'none'; }
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', function(e) { if(e.target === modal) closeModal(); });

      submitBtn.addEventListener('click', function() {
        var name = nameInput.value.trim();
        var checklist = checklistSelect.value;
        var deadline = deadlineInput.value;
        
        if (!name || !checklist || !deadline) {
          if (hintEl) hintEl.textContent = '请完整填写必填项（名称、检查表、截止日期）';
          return;
        }

        var targetArea = areaSelect ? areaSelect.value : '';
        var targetProvince = '';
        var targetCenter = '';
        if (provSelect && provSelect.value) {
          targetProvince = provSelect.options[provSelect.selectedIndex].text;
          if (centerSelect && centerSelect.value) {
            targetCenter = centerSelect.options[centerSelect.selectedIndex].text;
          }
        }

        var btnText = submitBtn.textContent;
        submitBtn.textContent = '提交中...';
        submitBtn.disabled = true;

        apiPost('/api/tasks/dispatch', {
          type: '自查自纠',
          title: name,
          deadline: deadline.replace('T', ' '),
          template_file: checklist,
          target_area: targetArea,
          target_province: targetProvince,
          target_center: targetCenter
        }).then(function(res) {
          alert('任务下发成功！');
          closeModal();
          loadSelfcheckTasks();
        }).catch(function(err) {
          if (hintEl) hintEl.textContent = '下发失败: ' + err.message;
        }).finally(function() {
          submitBtn.textContent = btnText;
          submitBtn.disabled = false;
        });
      });
    }

    initSecurityAuditTaskUpload();

    function loadSecurityAuditTasks() {
      var tbody = document.getElementById('securityAuditTaskTbody');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:30px;">加载中...</td></tr>';
      
      apiGet('/api/tasks?type=安全稽核').then(function(tasks) {
        if (!tasks || tasks.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:30px;">暂无数据</td></tr>';
          return;
        }
        tbody.innerHTML = '';
        tasks.forEach(function(task) {
          var tr = document.createElement('tr');
          
          var targetDesc = task.target_area || '全网';
          if (task.target_province) targetDesc += ' - ' + task.target_province;
          if (task.target_center) targetDesc += ' - ' + task.target_center;
          
          var executorDesc = task.executor_area || '总部';
          if (task.executor_province) executorDesc += ' - ' + task.executor_province;
          if (task.executor_center) executorDesc += ' - ' + task.executor_center;
          
          var dispatchTime = task.dispatch_time ? String(task.dispatch_time).replace('T', ' ').substring(0, 16) : '';
          var deadline = task.deadline ? String(task.deadline).replace('T', ' ').substring(0, 16) : '';
          
          tr.innerHTML = '<td>' + task.title + ' <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;"><span style="color:var(--success);">' + executorDesc + '</span> → <span style="color:var(--primary);">' + targetDesc + '</span></div></td>' +
                         '<td>' + dispatchTime + '</td>' +
                         '<td>' + deadline + '</td>' +
                         '<td><a href="javascript:void(0)" class="file-link">' + (task.template_file || '-') + '</a></td>' +
                         '<td><span class="risk-badge blue">' + task.status + '</span></td>' +
                         '<td><span style="color:var(--primary);font-weight:600;">' + (task.completion_rate || 0) + '%</span></td>' +
                         '<td><button type="button" class="btn btn-outline btn-sm security-audit-remind-btn">提醒完成</button></td>';
          tbody.appendChild(tr);
        });
      }).catch(function(err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--danger);padding:30px;">加载失败</td></tr>';
      });
    }

    function initSecurityAuditTaskUpload() {
      var uploadBtn = document.getElementById('securityAuditTaskUploadBtn');
      var fileInput = document.getElementById('securityAuditTaskFileInput');
      if (!uploadBtn || !fileInput) return;

      uploadBtn.addEventListener('click', function () {
        fileInput.click();
      });

      fileInput.addEventListener('change', function () {
        var files = this.files;
        if (!files || !files.length) return;
        var file = files[0];
        
        var formData = new FormData();
        formData.append('template_file', file);
        formData.append('type', 'security-audit');
        
        var uploadBtnText = uploadBtn.innerHTML;
        uploadBtn.innerHTML = '上传中...';
        uploadBtn.disabled = true;

        apiPostForm('/api/checklists', formData).then(function(res) {
          alert('稽核表「' + file.name + '」上传成功！现在可以点击「下发任务」进行分发。');
          fileInput.value = '';
        }).catch(function(err) {
          alert('上传失败: ' + err.message);
        }).finally(function() {
          uploadBtn.innerHTML = uploadBtnText;
          uploadBtn.disabled = false;
        });
      });

      var tbody = document.getElementById('securityAuditTaskTbody');
      if (tbody) {
        tbody.addEventListener('click', function (e) {
          if (e.target.classList.contains('security-audit-remind-btn')) {
            alert('提醒已发送！已通过钉钉和系统通知督促相关负责人。');
          }
        });
      }
    }

    function initSecurityAuditTaskDispatch() {
      var dispatchBtn = document.getElementById('securityAuditTaskDispatchBtn');
      var modal = document.getElementById('securityAuditTaskDispatchModalOverlay');
      var closeBtn = document.getElementById('securityAuditDispatchModalClose');
      var cancelBtn = document.getElementById('securityAuditDispatchCancel');
      var submitBtn = document.getElementById('securityAuditDispatchSubmit');
      
      var nameInput = document.getElementById('securityAuditDispatchName');
      var checklistSelect = document.getElementById('securityAuditDispatchChecklist');
      var deadlineInput = document.getElementById('securityAuditDispatchDeadline');
      var hintEl = document.getElementById('securityAuditDispatchHint');

      // Target selection elements
      var targetAreaSelect = document.getElementById('securityAuditDispatchTargetArea');
      var targetProvSelect = document.getElementById('securityAuditDispatchTargetProvince');
      var targetCenterSelect = document.getElementById('securityAuditDispatchTargetCenter');

      // Executor selection elements
      var executorAreaSelect = document.getElementById('securityAuditDispatchExecutorArea');
      var executorProvSelect = document.getElementById('securityAuditDispatchExecutorProvince');

      if (!dispatchBtn || !modal) return;

      function updateChecklistOptions() {
        if (!checklistSelect) return;
        checklistSelect.innerHTML = '<option value="">加载中...</option>';
        apiGet('/api/checklists?type=security-audit').then(function(list) {
          checklistSelect.innerHTML = '<option value="">请选择稽核表</option>';
          if (!list || list.length === 0) {
            checklistSelect.innerHTML = '<option value="">请先上传稽核表</option>';
            return;
          }
          list.forEach(function(item) {
            var opt = document.createElement('option');
            opt.value = item.filename;
            opt.textContent = item.filename;
            checklistSelect.appendChild(opt);
          });
        });
      }

      function fillProvinces(area, provSelect, centerSelect) {
        if (!provSelect) return;
        provSelect.innerHTML = '<option value="">全部</option>';
        if (centerSelect) centerSelect.innerHTML = '<option value="">全部</option>';
        if (!area || area === '总部') return;
        var filtered = provincesData.filter(function(p) { return p.northSouth === area; });
        filtered.forEach(function(p) {
          var opt = document.createElement('option');
          opt.value = p.code;
          opt.textContent = p.name;
          provSelect.appendChild(opt);
        });
      }

      function fillCenters(prov, centerSelect) {
        if (!centerSelect) return;
        centerSelect.innerHTML = '<option value="">全部</option>';
        if (!prov) return;
        var filtered = centersData.filter(function(c) { return c.provinceCode === prov; });
        filtered.forEach(function(c) {
          var opt = document.createElement('option');
          opt.value = c.code;
          opt.textContent = c.shortName || c.name;
          centerSelect.appendChild(opt);
        });
      }

      if (targetAreaSelect) targetAreaSelect.addEventListener('change', function() { fillProvinces(this.value, targetProvSelect, targetCenterSelect); });
      if (targetProvSelect) targetProvSelect.addEventListener('change', function() { fillCenters(this.value, targetCenterSelect); });
      
      if (executorAreaSelect) executorAreaSelect.addEventListener('change', function() { fillProvinces(this.value, executorProvSelect); });

      dispatchBtn.addEventListener('click', function() {
        updateChecklistOptions();
        if (nameInput) {
          var now = new Date();
          var q = Math.floor(now.getMonth() / 3) + 1;
          nameInput.value = now.getFullYear() + '年第' + q + '季度安全稽核';
        }
        if (deadlineInput) {
          var d = new Date();
          var q = Math.floor(d.getMonth() / 3) + 1;
          var deadlineMonth = q * 3;
          var lastDay = new Date(d.getFullYear(), deadlineMonth, 0).getDate();
          deadlineInput.value = d.getFullYear() + '-' + String(deadlineMonth).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0') + 'T18:00';
        }
        if (hintEl) hintEl.textContent = '';
        modal.style.display = 'flex';
      });

      function closeModal() { modal.style.display = 'none'; }
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', function(e) { if(e.target === modal) closeModal(); });

      submitBtn.addEventListener('click', function() {
        var name = nameInput.value.trim();
        var checklist = checklistSelect.value;
        var deadline = deadlineInput.value;
        
        if (!name || !checklist || !deadline) {
          if (hintEl) hintEl.textContent = '请完整填写必填项（名称、稽核表、截止日期）';
          return;
        }

        var targetArea = targetAreaSelect ? targetAreaSelect.value : '';
        var targetProvince = '';
        var targetCenter = '';
        if (targetProvSelect && targetProvSelect.value) {
          targetProvince = targetProvSelect.options[targetProvSelect.selectedIndex].text;
          if (targetCenterSelect && targetCenterSelect.value) {
            targetCenter = targetCenterSelect.options[targetCenterSelect.selectedIndex].text;
          }
        }

        var executorArea = executorAreaSelect ? executorAreaSelect.value : '总部';
        var executorProvince = '';
        if (executorProvSelect && executorProvSelect.value) {
          executorProvince = executorProvSelect.options[executorProvSelect.selectedIndex].text;
        }

        var btnText = submitBtn.textContent;
        submitBtn.textContent = '提交中...';
        submitBtn.disabled = true;

        apiPost('/api/tasks/dispatch', {
          type: '安全稽核',
          title: name,
          deadline: deadline.replace('T', ' '),
          template_file: checklist,
          target_area: targetArea,
          target_province: targetProvince,
          target_center: targetCenter,
          executor_area: executorArea,
          executor_province: executorProvince
        }).then(function(res) {
          alert('稽核任务下发成功！');
          closeModal();
          loadSecurityAuditTasks();
        }).catch(function(err) {
          if (hintEl) hintEl.textContent = '下发失败: ' + err.message;
        }).finally(function() {
          submitBtn.textContent = btnText;
          submitBtn.disabled = false;
        });
      });
    }

    initSpecialAuditTaskUpload();

    function initSpecialAuditTaskUpload() {
      var uploadBtn = document.getElementById('specialAuditTaskUploadBtn');
      var fileInput = document.getElementById('specialAuditTaskFileInput');
      var tbody = document.getElementById('specialAuditTaskTbody');

      if (!uploadBtn || !fileInput || !tbody) return;

      uploadBtn.addEventListener('click', function () {
        fileInput.click();
      });

      tbody.addEventListener('click', function (e) {
        if (e.target.classList.contains('special-audit-remind-btn')) {
          alert('提醒已发送！已通过钉钉和系统通知督促相关负责人。');
        }
      });

      fileInput.addEventListener('change', function () {
        var files = this.files;
        if (!files || !files.length) return;
        
        var file = files[0];
        var now = new Date();
        var timeStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        
        // Calculate deadline (irregular - default T+15)
        var deadlineDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
        var deadlineStr = deadlineDate.getFullYear() + '-' + String(deadlineDate.getMonth() + 1).padStart(2, '0') + '-' + String(deadlineDate.getDate()).padStart(2, '0') + ' 18:00';

        var taskName = '专项稽查-' + file.name.split('.')[0];
        
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + taskName + '</td>' +
                       '<td>' + timeStr + '</td>' +
                       '<td>' + deadlineStr + '</td>' +
                       '<td><a href="javascript:void(0)" class="file-link">' + file.name + '</a></td>' +
                       '<td><span class="risk-badge blue">进行中</span></td>' +
                       '<td><span style="color:var(--primary);font-weight:600;">0%</span></td>' +
                       '<td><button type="button" class="btn btn-outline btn-sm special-audit-remind-btn">提醒完成</button></td>';
        
        // Remove empty state if exists
        if (tbody.querySelector('td[colspan]')) {
          tbody.innerHTML = '';
        }

        tbody.insertBefore(tr, tbody.firstChild);
        this.value = '';
        alert('专项稽查任务下发成功！');
      });
    }

    renderSelfcheckRows();
    renderSecurityAuditRows();
    renderSpecialAuditRows();

    loadHazardsFromAPI();
  }

  // ============ 转运中心风险分级表：风险上报工作流（总部评审） ============
  function initDualPreventionRiskReportWorkflow() {
    const reportBtn = document.getElementById('riskTierReportBtn');
    const tbodyEl = document.getElementById('riskTierTbody');
    const pendingTbody = document.getElementById('riskTierPendingTbody');
    const pendingEmpty = document.getElementById('riskTierPendingEmpty');
    const pendingTableWrap = document.getElementById('riskTierPendingTableWrap');
    const pendingCount = document.getElementById('riskTierPendingCount');
    const modalOverlay = document.getElementById('riskTierReportModalOverlay');
    const cancelBtn = document.getElementById('riskTierReportCancelBtn');
    const cancelBtn2 = document.getElementById('riskTierReportCancelBtn2');
    const submitBtn = document.getElementById('riskTierReportSubmitBtn');
    const reviewOverlay = document.getElementById('riskTierReviewModalOverlay');
    const reviewCloseBtn = document.getElementById('riskTierReviewCloseBtn');
    const reviewCancelBtn = document.getElementById('riskTierReviewCancelBtn');
    const reviewApproveBtn = document.getElementById('riskTierReviewApproveBtn');
    const reviewRejectBtn = document.getElementById('riskTierReviewRejectBtn');

    if (!reportBtn || !tbodyEl || !pendingTbody || !pendingEmpty || !pendingTableWrap || !pendingCount || !modalOverlay || !cancelBtn || !cancelBtn2 || !submitBtn || !reviewOverlay || !reviewCloseBtn || !reviewCancelBtn || !reviewApproveBtn || !reviewRejectBtn) {
      return;
    }

    const riskPointEl = document.getElementById('riskTierReportRiskPoint');
    const riskAreaEl = document.getElementById('riskTierReportRiskArea');
    const domainEl = document.getElementById('riskTierReportDomain');
    const controlMeasuresEl = document.getElementById('riskTierReportControlMeasures');
    const hintEl = document.getElementById('riskTierReportFormHint');

    if (!riskPointEl || !riskAreaEl || !controlMeasuresEl || !hintEl) {
      return;
    }

    const reviewRiskPointEl = document.getElementById('riskTierReviewRiskPoint');
    const reviewRiskAreaEl = document.getElementById('riskTierReviewRiskArea');
    const reviewControlMeasuresEl = document.getElementById('riskTierReviewControlMeasures');
    const reviewLEl = document.getElementById('riskTierReviewL');
    const reviewEEl = document.getElementById('riskTierReviewE');
    const reviewCEl = document.getElementById('riskTierReviewC');
    const reviewDEl = document.getElementById('riskTierReviewD');
    const reviewRiskBadgeEl = document.getElementById('riskTierReviewRiskBadge');
    const reviewHintEl = document.getElementById('riskTierReviewHint');
    const reviewRejectReasonEl = document.getElementById('riskTierReviewRejectReason');

    if (!reviewRiskPointEl || !reviewRiskAreaEl || !reviewControlMeasuresEl || !reviewLEl || !reviewEEl || !reviewCEl || !reviewDEl || !reviewRiskBadgeEl || !reviewHintEl || !reviewRejectReasonEl) {
      return;
    }

    let approvedRows = [];
    let pendingReports = [];
    let reviewActiveReportId = null;

    function showModal() {
      modalOverlay.style.display = 'flex';
      resetForm();
      hintEl.textContent = '';
    }

    function hideModal() {
      modalOverlay.style.display = 'none';
    }

    function resetForm() {
      if (domainEl) domainEl.selectedIndex = 0;
      if (riskPointEl) riskPointEl.value = '';
      if (riskAreaEl) riskAreaEl.value = '';
      if (controlMeasuresEl) controlMeasuresEl.value = '';
    }

    function nextSeq() {
      let maxSeq = 0;
      approvedRows.forEach(function (r) {
        const n = parseFloat(String(r.seq || '').trim());
        if (!isNaN(n)) maxSeq = Math.max(maxSeq, n);
      });
      return String(maxSeq + 1);
    }

    function numVal(inputEl) {
      const v = String(inputEl.value || '').trim();
      if (!v) return NaN;
      return parseFloat(v);
    }

    function showReview(report) {
      reviewActiveReportId = report.id;
      reviewOverlay.style.display = 'flex';
      reviewRiskPointEl.value = report.riskPoint || '';
      reviewRiskAreaEl.value = report.riskArea || '';
      reviewControlMeasuresEl.value = report.controlMeasures || '';
      reviewLEl.value = '';
      reviewEEl.value = '';
      reviewCEl.value = '';
      reviewDEl.value = '';
      reviewRiskBadgeEl.innerHTML = '--';
      reviewRejectReasonEl.value = '';
      reviewHintEl.textContent = '';
    }

    function hideReview() {
      reviewOverlay.style.display = 'none';
      reviewActiveReportId = null;
    }

    function computeReviewDAndRisk() {
      const L = numVal(reviewLEl);
      const E = numVal(reviewEEl);
      const C = numVal(reviewCEl);

      if (isNaN(L) || isNaN(E) || isNaN(C)) {
        reviewDEl.value = '';
        reviewRiskBadgeEl.innerHTML = '--';
        return;
      }

      const D = L * E * C;
      reviewDEl.value = String(D);
      const riskLevelText = guessRiskLevelByD(D);
      reviewRiskBadgeEl.innerHTML = getRiskBadgeHTML(riskLevelText);
    }

    function renderPending() {
      pendingCount.textContent = '待评审 ' + pendingReports.length + ' 条';
      if (pendingReports.length === 0) {
        pendingEmpty.style.display = 'block';
        pendingTableWrap.style.display = 'none';
        pendingTbody.innerHTML = '';
        return;
      }

      pendingEmpty.style.display = 'none';
      pendingTableWrap.style.display = 'block';
      pendingTbody.innerHTML = pendingReports.map(function (r) {
        return '' +
          '<tr data-report-id="' + escapeHtml(r.id) + '">' +
          '<td>' + escapeHtml(r.riskPoint) + '</td>' +
          '<td>' + escapeHtml(r.riskArea || '') + '</td>' +
          '<td>' + nl2br(escapeHtml(r.controlMeasures || '')) + '</td>' +
          '<td>' +
          '<button type="button" class="btn btn-primary risk-action-btn risk-approve-btn" data-report-id="' + escapeHtml(r.id) + '">评审</button>' +
          '<button type="button" class="btn btn-outline risk-action-btn risk-reject-btn" data-report-id="' + escapeHtml(r.id) + '" style="margin-left:8px;">驳回</button>' +
          '</td>' +
          '</tr>';
      }).join('');
    }

    function upsertApprovedRow(row) {
      const seqText = String(row.seq || '').trim();
      if (!seqText) return;

      const idx = approvedRows.findIndex(function (r) {
        return String(r.seq || '').trim() === seqText;
      });

      if (idx >= 0) {
        approvedRows[idx] = row;
      } else {
        approvedRows.push(row);
      }

      approvedRows.sort(function (a, b) {
        const ai = parseFloat(a.seq);
        const bi = parseFloat(b.seq);
        if (isNaN(ai) || isNaN(bi)) return 0;
        return ai - bi;
      });

      tbodyEl.innerHTML = buildRiskTierTbodyHTML(approvedRows);
    }

    pendingTbody.addEventListener('click', function (e) {
      const approveBtn = e.target.closest('.risk-approve-btn');
      const rejectBtn = e.target.closest('.risk-reject-btn');
      if (!approveBtn && !rejectBtn) return;
      const reportId = (approveBtn || rejectBtn).dataset.reportId;
      if (!reportId) return;

      const report = pendingReports.find(function (r) { return r.id === reportId; });
      if (!report) return;

      if (approveBtn) {
        showReview(report);
        return;
      }

      // 驳回也走评审页，要求填写驳回理由
      showReview(report);
    });

    ['input', 'change'].forEach(function (evt) {
      reviewLEl.addEventListener(evt, computeReviewDAndRisk);
      reviewEEl.addEventListener(evt, computeReviewDAndRisk);
      reviewCEl.addEventListener(evt, computeReviewDAndRisk);
    });

    reviewCloseBtn.addEventListener('click', hideReview);
    reviewCancelBtn.addEventListener('click', hideReview);
    reviewOverlay.addEventListener('click', function (e) {
      if (e.target === reviewOverlay) hideReview();
    });

    reviewApproveBtn.addEventListener('click', function () {
      if (!reviewActiveReportId) return;
      const report = pendingReports.find(function (r) { return r.id === reviewActiveReportId; });
      if (!report) return;

      const L = numVal(reviewLEl);
      const E = numVal(reviewEEl);
      const C = numVal(reviewCEl);
      if (isNaN(L) || isNaN(E) || isNaN(C)) {
        reviewHintEl.textContent = '请填写 L / E / C（数字），系统将自动计算 D 并生成风险分级';
        return;
      }

      const D = L * E * C;
      const riskLevelText = guessRiskLevelByD(D);

      apiPatch('/api/risks/' + report.id + '/review', {
        l_value: L,
        e_value: E,
        c_value: C,
        risk_level: riskLevelText,
        status: '已评审'
      }).then(function () {
        if(window.loadDualPreventionRisks) window.loadDualPreventionRisks();
      }).catch(function (err) {
        console.warn('风险评审同步API失败:', err);
      });

      pendingReports = pendingReports.filter(function (r) { return r.id !== reviewActiveReportId; });
      renderPending();
      hideReview();
    });

    reviewRejectBtn.addEventListener('click', function () {
      if (!reviewActiveReportId) return;
      const reason = String(reviewRejectReasonEl.value || '').trim();
      if (!reason) {
        reviewHintEl.textContent = '请填写驳回理由后再驳回';
        return;
      }

      const report = pendingReports.find(function (r) { return r.id === reviewActiveReportId; });
      if (report) {
        apiPatch('/api/risks/' + report.id + '/review', {
          l_value: 0,
          e_value: 0,
          c_value: 0,
          risk_level: '',
          status: '已驳回',
          reject_reason: reason
        }).catch(function (err) {
          console.warn('风险驳回同步API失败:', err);
        });
      }

      pendingReports = pendingReports.filter(function (r) { return r.id !== reviewActiveReportId; });
      renderPending();
      hideReview();
    });

    reportBtn.addEventListener('click', function () {
      showModal();
    });

    cancelBtn.addEventListener('click', function () { hideModal(); });
    cancelBtn2.addEventListener('click', function () { hideModal(); });
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) hideModal();
    });

    submitBtn.addEventListener('click', function () {
      const riskPointText = String(riskPointEl.value || '').trim().replace(/\r\n/g, '\n');
      const riskAreaText = String(riskAreaEl.value || '').trim();
      const controlMeasuresText = String(controlMeasuresEl.value || '').trim().replace(/\r\n/g, '\n');

      if (!riskPointText || !riskAreaText) {
        hintEl.textContent = '请完整填写：风险区域、风险描述';
        return;
      }

      const domainText = domainEl ? String(domainEl.value || '').trim() : '转运中心';

      apiPost('/api/risks', {
        domain: domainText,
        risk_area: riskAreaText,
        risk_point: riskPointText,
        control_measures: controlMeasuresText
      }).then(function (result) {
        pendingReports.push({
          id: String(result.id),
          riskPoint: riskPointText,
          riskArea: riskAreaText,
          controlMeasures: controlMeasuresText
        });
        renderPending();
        hideModal();
      }).catch(function (err) {
        console.error('风险上报API失败:', err);
        pendingReports.push({
          id: 'RP_' + Date.now() + '_' + Math.random().toString(16).slice(2),
          riskPoint: riskPointText,
          riskArea: riskAreaText,
          controlMeasures: controlMeasuresText
        });
        renderPending();
        hideModal();
      });
    });

    apiGet('/api/risks?status=待评审').then(function (rows) {
      rows.forEach(function (r) {
        pendingReports.push({
          id: String(r.id),
          riskPoint: r.risk_point || '',
          hazardFactors: r.hazard_factors || '',
          accidentType: r.accident_type || ''
        });
      });
      renderPending();
    }).catch(function () {
      renderPending();
    });
    const tabNav = document.getElementById('riskDomainTabNav');
    if (tabNav) {
      tabNav.addEventListener('click', function (e) {
        if (!e.target.classList.contains('tab-item')) return;
        tabNav.querySelectorAll('.tab-item').forEach(function (el) { el.classList.remove('active'); });
        e.target.classList.add('active');
        const reportDomainSelect = document.getElementById('riskTierReportDomain');
        if (reportDomainSelect) {
          Array.from(reportDomainSelect.options).forEach((opt, idx) => {
            if (opt.value === e.target.dataset.domain) reportDomainSelect.selectedIndex = idx;
          });
        }
        if (window.loadDualPreventionRisks) window.loadDualPreventionRisks();
      });
    }

    window.loadDualPreventionRisks = function () {
      apiGet('/api/risks').then(function (rows) {
        const tbody1 = document.getElementById('riskTierTbody');
        if (!tbody1) return;

        const activeTab = document.querySelector('#riskDomainTabNav .tab-item.active');
        const activeDomain = activeTab ? activeTab.dataset.domain : '转运中心';

        let html1 = '';
        let count = 0;
        let redCount = 0;
        let orangeCount = 0;
        let yellowCount = 0;
        let blueCount = 0;

        rows.forEach(function (r, i) {
          if ((r.domain || '转运中心') !== activeDomain) return;

          count++;
          const L = (r.l_value || 0).toString();
          const E = (r.e_value || 0).toString();
          const C = (r.c_value || 0).toString();
          const D = (r.d_value || 0).toString();

          const rp = escapeHtml(r.risk_point || '');
          const hf = nl2br(escapeHtml(r.hazard_factors || ''));
          const descHtml = '<div style="font-weight:600;margin-bottom:4px;">' + rp + '</div><div style="color:var(--text-secondary);font-size:13px;line-height:1.4;">' + hf + '</div>';

          const rl = escapeHtml(r.risk_level || '');

          let badgeClass = 'blue';
          if (rl === '重大风险' || rl === '重大' || rl === '红色') {
            badgeClass = 'red';
            redCount++;
          } else if (rl === '较大风险' || rl === '较大' || rl === '橙色') {
            badgeClass = 'orange';
            orangeCount++;
          } else if (rl === '一般风险' || rl === '一般' || rl === '黄色') {
            badgeClass = 'yellow';
            yellowCount++;
          } else if (rl === '低风险' || rl === '低' || rl === '蓝色') {
            badgeClass = 'blue';
            blueCount++;
          }
          
          html1 += '<tr>' +
            '<td>' + count + '</td>' +
            '<td>' + escapeHtml(r.risk_area || '-') + '</td>' +
            '<td>' + descHtml + '</td>' +
            '<td>' + L + '</td>' +
            '<td>' + E + '</td>' +
            '<td>' + C + '</td>' +
            '<td>' + D + '</td>' +
            '<td><span class="risk-badge ' + badgeClass + '">' + rl + '</span></td>' +
            '<td>' + escapeHtml(r.control_level || '') + '</td>' +
            '<td>' + nl2br(escapeHtml(r.control_measures || '')) + '</td>' +
            '</tr>';
        });

        if (!html1) html1 = '<tr><td colspan="10" style="text-align:center;">暂无数据</td></tr>';

        tbody1.innerHTML = html1;

        // Update top stats
        const elRed = document.getElementById('statCountRed');
        const elOrange = document.getElementById('statCountOrange');
        const elYellow = document.getElementById('statCountYellow');
        const elBlue = document.getElementById('statCountBlue');
        if (elRed) elRed.textContent = redCount;
        if (elOrange) elOrange.textContent = orangeCount;
        if (elYellow) elYellow.textContent = yellowCount;
        if (elBlue) elBlue.textContent = blueCount;

        // Populate area and control level filters
        const areas = new Set();
        const controlLevels = new Set();
        rows.forEach(function (r) {
          if ((r.domain || '转运中心') === activeDomain) {
            if (r.risk_area) areas.add(r.risk_area);
            if (r.control_level) controlLevels.add(r.control_level);
          }
        });

        const areaSelect = document.getElementById('riskTierAreaSelect');
        const controlLevelSelect = document.getElementById('riskTierControlLevelSelect');
        if (areaSelect) {
          const currentArea = areaSelect.value;
          areaSelect.innerHTML = '<option>全部</option>';
          Array.from(areas).sort().forEach(function (a) {
            const opt = document.createElement('option');
            opt.textContent = a;
            areaSelect.appendChild(opt);
          });
          areaSelect.value = Array.from(areaSelect.options).some(function (o) { return o.value === currentArea; }) ? currentArea : '全部';
        }
        if (controlLevelSelect) {
          const currentCtrl = controlLevelSelect.value;
          controlLevelSelect.innerHTML = '<option>全部</option>';
          Array.from(controlLevels).sort().forEach(function (c) {
            const opt = document.createElement('option');
            opt.textContent = c;
            controlLevelSelect.appendChild(opt);
          });
          controlLevelSelect.value = Array.from(controlLevelSelect.options).some(function (o) { return o.value === currentCtrl; }) ? currentCtrl : '全部';
        }

        const search1 = document.getElementById('riskTierSearchInput');
        if (search1) search1.dispatchEvent(new Event('input'));
      }).catch(console.error);
    };

    window.loadDualPreventionRisks();
  }

  // ============ 转运中心风险评估分级表：搜索 + 分页 ============
  function initDualPreventionRiskTierTablePager() {
    const searchInput = document.getElementById('riskTierSearchInput');
    const riskLevelSelect = document.getElementById('riskTierRiskLevelSelect');
    const areaSelect = document.getElementById('riskTierAreaSelect');
    const controlLevelSelect = document.getElementById('riskTierControlLevelSelect');
    const tbodyEl = document.getElementById('riskTierTbody');
    const totalCountEl = document.getElementById('riskTierTotalCount');
    const paginationBtnsWrap = document.getElementById('riskTierPaginationBtns');
    const paginationEl = paginationBtnsWrap && paginationBtnsWrap.closest ? paginationBtnsWrap.closest('.table-pagination') : null;

    if (!searchInput || !riskLevelSelect || !areaSelect || !controlLevelSelect || !tbodyEl || !totalCountEl || !paginationBtnsWrap || !paginationEl) return;

    const PAGE_SIZE = 5;
    let currentPage = 1;
    let searchTimer = null;

    function normalizeText(s) {
      return String(s == null ? '' : s).trim().toLowerCase();
    }

    function getRiskLevelTextFromTr(tr) {
      const tds = tr.querySelectorAll('td');
      if (!tds || tds.length < 9) return '';
      return String(tds[6].textContent || '').trim();
    }

    function getRowKeywordTextFromTr(tr) {
      const tds = tr.querySelectorAll('td');
      if (!tds || tds.length < 9) return '';
      const riskDesc = String(tds[1].textContent || '');
      const riskLevel = String(tds[6].textContent || '');
      const controlMeasures = String(tds[8].textContent || '');
      return (riskDesc + ' ' + riskLevel + ' ' + controlMeasures).toLowerCase();
    }

    function matchesRow(tr, keyword, levelFilter, areaFilter, ctrlFilter) {
      const tds = tr.querySelectorAll('td');
      if (!tds || tds.length < 9) return false;

      // 风险区域 (Index 1), 风险等级 (Index 7), 管控层级 (Index 8)
      const areaText = String(tds[1].textContent || '').trim();
      const levelText = String(tds[7].textContent || '').trim();
      const ctrlText = String(tds[8].textContent || '').trim();

      // 1. 风险等级过滤
      if (levelFilter && levelFilter !== '全部') {
        const levelMap = {
          '红色': ['重大风险', '重大', '红色'],
          '橙色': ['较大风险', '较大', '橙色'],
          '黄色': ['一般风险', '一般', '黄色'],
          '蓝色': ['低风险', '低', '蓝色']
        };
        const allowed = levelMap[levelFilter] || [levelFilter];
        let match = false;
        for (const a of allowed) {
          if (levelText.indexOf(a) !== -1) { match = true; break; }
        }
        if (!match) return false;
      }

      // 2. 风险区域过滤
      if (areaFilter && areaFilter !== '全部') {
        if (areaText !== areaFilter) return false;
      }

      // 3. 管控层级过滤
      if (ctrlFilter && ctrlFilter !== '全部') {
        if (ctrlText !== ctrlFilter) return false;
      }

      // 4. 关键字过滤
      if (keyword) {
        // 搜索：风险描述(2) + 区域(1) + 等级(7) + 管控措施(9)
        const hay = (String(tds[2].textContent || '') + ' ' + areaText + ' ' + levelText + ' ' + String(tds[9].textContent || '')).toLowerCase();
        if (hay.indexOf(keyword) === -1) return false;
      }

      return true;
    }

    function getPaginationModel(page, totalPages) {
      const pages = new Set([1, totalPages]);
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let p = start; p <= end; p++) pages.add(p);

      if (page <= 3 && totalPages >= 4) {
        pages.add(2);
        pages.add(3);
        pages.add(4);
      }
      if (page >= totalPages - 2 && totalPages >= 4) {
        pages.add(totalPages - 1);
        pages.add(totalPages - 2);
        pages.add(totalPages - 3);
      }

      return Array.from(pages)
        .filter(function (p) { return p >= 1 && p <= totalPages; })
        .sort(function (a, b) { return a - b; });
    }

    function renderPagination(totalPages, filteredCount) {
      if (filteredCount === 0) {
        paginationEl.style.display = 'none';
        paginationBtnsWrap.innerHTML = '';
        return;
      }

      if (totalPages <= 1) {
        paginationEl.style.display = 'none';
        paginationBtnsWrap.innerHTML = '';
        return;
      }

      paginationEl.style.display = 'flex';

      const pages = getPaginationModel(currentPage, totalPages);
      let html = '';

      function addPageBtn(label, page, isActive) {
        html += '<button type="button" class="pagination-btn' + (isActive ? ' active' : '') + '"' +
          ' data-page="' + page + '">' + escapeHtml(label) + '</button>';
      }

      function addDisabledBtn(label) {
        html += '<button type="button" class="pagination-btn" style="pointer-events:none;opacity:0.6;" aria-hidden="true">' +
          escapeHtml(label) +
          '</button>';
      }

      if (currentPage > 1) {
        html += '<button type="button" class="pagination-btn" data-page="' + (currentPage - 1) + '">&lt;</button>';
      } else {
        addDisabledBtn('<');
      }

      let prev = null;
      pages.forEach(function (p) {
        if (prev !== null && p - prev > 1) {
          html += '<button type="button" class="pagination-btn" style="pointer-events:none;opacity:0.6;" aria-hidden="true">...</button>';
        }
        addPageBtn(String(p), p, p === currentPage);
        prev = p;
      });

      if (currentPage < totalPages) {
        html += '<button type="button" class="pagination-btn" data-page="' + (currentPage + 1) + '">&gt;</button>';
      } else {
        addDisabledBtn('>');
      }

      paginationBtnsWrap.innerHTML = html;
    }

    function apply() {
      const rowEls = Array.from(tbodyEl.querySelectorAll('tr'));
      if (rowEls.length === 0) {
        totalCountEl.textContent = '共 0 条记录';
        renderPagination(1, 0);
        return;
      }

      const keyword = normalizeText(searchInput.value);
      const levelFilter = riskLevelSelect.value;
      const areaFilter = areaSelect.value;
      const ctrlFilter = controlLevelSelect.value;

      const matchingRows = [];
      rowEls.forEach(function (tr) {
        if (matchesRow(tr, keyword, levelFilter, areaFilter, ctrlFilter)) matchingRows.push(tr);
      });

      totalCountEl.textContent = '共 ' + matchingRows.length + ' 条记录';

      if (matchingRows.length === 0) {
        rowEls.forEach(function (tr) { tr.style.display = 'none'; });
        renderPagination(1, 0);
        return;
      }

      const totalPages = Math.ceil(matchingRows.length / PAGE_SIZE);
      currentPage = Math.min(Math.max(currentPage, 1), totalPages);

      rowEls.forEach(function (tr) { tr.style.display = 'none'; });

      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const pageRows = matchingRows.slice(startIndex, startIndex + PAGE_SIZE);
      pageRows.forEach(function (tr) { tr.style.display = 'table-row'; });

      renderPagination(totalPages, matchingRows.length);
    }

    function scheduleApplyResetPage() {
      currentPage = 1;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        apply();
      }, 300);
    }

    searchInput.addEventListener("input", scheduleApplyResetPage);
    [riskLevelSelect, areaSelect, controlLevelSelect].forEach(function (sel) {
      if (sel) {
        sel.addEventListener("change", function () {
          currentPage = 1;
          apply();
        });
      }
    });
    paginationBtnsWrap.addEventListener('click', function (e) {
      const btn = e.target.closest('button.pagination-btn');
      if (!btn) return;
      const pageText = btn.dataset.page;
      const nextPage = parseInt(pageText, 10);
      if (!isNaN(nextPage) && nextPage >= 1) {
        currentPage = nextPage;
        apply();
      }
    });

    // 导出报表（CSV）：导出当前搜索/筛选条件下匹配的全部行
    const exportBtn = document.getElementById('riskTierExportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        const rowEls = Array.from(tbodyEl.querySelectorAll('tr'));
        const keyword = normalizeText(searchInput.value);
        const levelFilter = riskLevelSelect.value;
        const areaFilter = areaSelect.value;
        const ctrlFilter = controlLevelSelect.value;

        const matchingRows = [];
        rowEls.forEach(function (tr) {
          if (matchesRow(tr, keyword, levelFilter, areaFilter, ctrlFilter)) matchingRows.push(tr);
        });

        function tdToText(tdEl) {
          // 把 <br> 转为换行，移除其它标签
          return String(tdEl && tdEl.innerHTML ? tdEl.innerHTML : '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .trim();
        }

        function csvEscape(val) {
          const s = String(val == null ? '' : val);
          // 统一换行符，避免浏览器/系统差异导致 CSV 格式错乱
          const normalized = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          return '"' + normalized.replace(/"/g, '""') + '"';
        }

        const headers = ['序号', '风险点', '危险因素', '可能发生事故类型', 'L', 'E', 'C', 'D', '危险性程度'];
        const csvLines = [];
        csvLines.push(headers.map(csvEscape).join(','));

        matchingRows.forEach(function (tr) {
          const tds = tr.querySelectorAll('td');
          if (!tds || tds.length < 9) return;
          const row = [
            tdToText(tds[0]),
            tdToText(tds[1]),
            tdToText(tds[2]),
            tdToText(tds[3]),
            tdToText(tds[4]),
            tdToText(tds[5]),
            tdToText(tds[6]),
            tdToText(tds[7]),
            tdToText(tds[8])
          ];
          csvLines.push(row.map(csvEscape).join(','));
        });

        const activeTab = document.querySelector('#riskDomainTabNav .tab-item.active');
        const activeDomain = activeTab ? activeTab.dataset.domain : '转运中心';

        const csv = csvLines.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeDomain + '风险评估分级表.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    }

    // tbody 内容会在“评审通过”时被整块替换，这里用 MutationObserver 自动重新应用过滤分页视图
    const observer = new MutationObserver(function () {
      // 不要重置页码：保持用户当前页位置
      apply();
    });
    observer.observe(tbodyEl, { childList: true });

    apply();
  }

  // ============ 转运中心风险辨识管控清单：简单分页 ============
  function initDualPreventionRiskControlSimplePager() {
    const searchInput = document.getElementById('riskControlSearchInput');
    const riskLevelSelect = document.getElementById('riskControlRiskLevelSelect');
    const exportBtn = document.getElementById('riskControlExportBtn');
    const tbodyEl = document.getElementById('riskControlTbody');
    const totalCountEl = document.getElementById('riskControlTotalCount');
    const paginationBtnsWrap = document.getElementById('riskControlPaginationBtns');
    const paginationEl = paginationBtnsWrap && paginationBtnsWrap.closest ? paginationBtnsWrap.closest('.table-pagination') : null;

    if (!searchInput || !riskLevelSelect || !tbodyEl || !totalCountEl || !paginationBtnsWrap || !paginationEl) return;

    const PAGE_SIZE = 5;
    let currentPage = 1;
    let searchTimer = null;

    function getRows() {
      return Array.from(tbodyEl.querySelectorAll('tr'));
    }

    function normalizeText(s) {
      return String(s == null ? '' : s).trim().toLowerCase();
    }

    function getRiskLevelTextFromTr(tr) {
      const tds = tr.querySelectorAll('td');
      if (!tds || tds.length < 4) return '';
      return String(tds[3].textContent || '').trim();
    }

    function getRowKeywordTextFromTr(tr) {
      const tds = tr.querySelectorAll('td');
      if (!tds || tds.length < 8) return '';
      const parts = [
        tds[1], // 风险点
        tds[2], // 可能发生事故类型
        tds[4], // 控制措施
        tds[5], // 应急措施
        tds[6], // 管控层级
        tds[7]  // 责任人/联系方式
      ].map(function (el) { return String(el && el.textContent ? el.textContent : ''); });
      return normalizeText(parts.join(' '));
    }

    function matchesRow(tr, keyword, levelFilter) {
      const riskLevelText = getRiskLevelTextFromTr(tr);
      if (levelFilter && levelFilter !== '全部') {
        if (String(riskLevelText || '').indexOf(levelFilter) === -1) return false;
      }
      if (keyword) {
        const hay = getRowKeywordTextFromTr(tr);
        if (hay.indexOf(keyword) === -1) return false;
      }
      return true;
    }

    function escapeHtml(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function getPaginationModel(page, totalPages) {
      const pages = new Set([1, totalPages]);
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let p = start; p <= end; p++) pages.add(p);

      if (page <= 3 && totalPages >= 4) {
        pages.add(2); pages.add(3); pages.add(4);
      }
      if (page >= totalPages - 2 && totalPages >= 4) {
        pages.add(totalPages - 1);
        pages.add(totalPages - 2);
        pages.add(totalPages - 3);
      }

      return Array.from(pages)
        .filter(function (p) { return p >= 1 && p <= totalPages; })
        .sort(function (a, b) { return a - b; });
    }

    function renderPagination(totalPages) {
      if (totalPages <= 1) {
        paginationEl.style.display = 'none';
        paginationBtnsWrap.innerHTML = '';
        return;
      }

      paginationEl.style.display = 'flex';
      const pages = getPaginationModel(currentPage, totalPages);
      let html = '';

      function addPageBtn(label, page, isActive) {
        html += '<button type="button" class="pagination-btn' + (isActive ? ' active' : '') + '"' +
          ' data-page="' + page + '">' + escapeHtml(label) + '</button>';
      }

      function addEllipsis() {
        html += '<button type="button" class="pagination-btn" style="pointer-events:none;opacity:0.6;" aria-hidden="true">...</button>';
      }

      // prev
      if (currentPage > 1) {
        html += '<button type="button" class="pagination-btn" data-page="' + (currentPage - 1) + '">&lt;</button>';
      } else {
        html += '<button type="button" class="pagination-btn" style="pointer-events:none;opacity:0.6;" aria-hidden="true">&lt;</button>';
      }

      // page list
      let prev = null;
      pages.forEach(function (p) {
        if (prev !== null && p - prev > 1) addEllipsis();
        addPageBtn(String(p), p, p === currentPage);
        prev = p;
      });

      // next
      if (currentPage < totalPages) {
        html += '<button type="button" class="pagination-btn" data-page="' + (currentPage + 1) + '">&gt;</button>';
      } else {
        html += '<button type="button" class="pagination-btn" style="pointer-events:none;opacity:0.6;" aria-hidden="true">&gt;</button>';
      }

      paginationBtnsWrap.innerHTML = html;
    }

    function apply() {
      const rows = getRows();
      const keyword = normalizeText(searchInput.value);
      const levelFilter = riskLevelSelect.value;

      const matchingRows = [];
      rows.forEach(function (tr) {
        if (matchesRow(tr, keyword, levelFilter)) matchingRows.push(tr);
      });

      totalCountEl.textContent = '共 ' + matchingRows.length + ' 条记录';

      rows.forEach(function (tr) { tr.style.display = 'none'; });

      const totalPages = Math.ceil(matchingRows.length / PAGE_SIZE) || 1;
      currentPage = Math.min(Math.max(currentPage, 1), totalPages);

      if (matchingRows.length > 0) {
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const pageRows = matchingRows.slice(startIndex, startIndex + PAGE_SIZE);
        pageRows.forEach(function (tr) { tr.style.display = 'table-row'; });
      }

      renderPagination(totalPages);
    }

    function scheduleApplyResetPage() {
      currentPage = 1;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        apply();
      }, 300);
    }

    searchInput.addEventListener('input', scheduleApplyResetPage);
    riskLevelSelect.addEventListener('change', function () {
      currentPage = 1;
      apply();
    });

    paginationBtnsWrap.addEventListener('click', function (e) {
      const btn = e.target.closest('button.pagination-btn');
      if (!btn) return;
      const pageText = btn.dataset.page;
      const nextPage = parseInt(pageText, 10);
      if (!isNaN(nextPage)) {
        currentPage = nextPage;
        apply();
      }
    });

    // 导出报表（CSV）：导出当前搜索/筛选条件下匹配的全部行
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        const rows = getRows();
        const keyword = normalizeText(searchInput.value);
        const levelFilter = riskLevelSelect.value;

        const matchingRows = [];
        rows.forEach(function (tr) {
          if (matchesRow(tr, keyword, levelFilter)) matchingRows.push(tr);
        });

        function tdToText(tdEl) {
          return String(tdEl && tdEl.innerHTML ? tdEl.innerHTML : '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .trim();
        }

        function csvEscape(val) {
          const s = String(val == null ? '' : val);
          const normalized = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          return '"' + normalized.replace(/"/g, '""') + '"';
        }

        const headers = ['序号', '风险点', '可能发生事故类型', '风险等级', '控制措施', '应急措施', '管控层级', '责任人/联系方式'];
        const csvLines = [];
        csvLines.push(headers.map(csvEscape).join(','));

        matchingRows.forEach(function (tr) {
          const tds = tr.querySelectorAll('td');
          if (!tds || tds.length < 8) return;
          const row = [
            tdToText(tds[0]),
            tdToText(tds[1]),
            tdToText(tds[2]),
            tdToText(tds[3]),
            tdToText(tds[4]),
            tdToText(tds[5]),
            tdToText(tds[6]),
            tdToText(tds[7])
          ];
          csvLines.push(row.map(csvEscape).join(','));
        });

        const activeTab = document.querySelector('#riskDomainTabNav .tab-item.active');
        const activeDomain = activeTab ? activeTab.dataset.domain : '转运中心';

        const csv = csvLines.join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeDomain + '风险辨识管控清单.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    }

    // 后续如果 tbody 行被追加/替换，自动重新应用过滤分页视图
    const observer = new MutationObserver(function () {
      apply();
    });
    observer.observe(tbodyEl, { childList: true });

    apply();
  }

  // ============ 风险分级管控表：分页 + 搜索 ============
  function initDualPreventionRiskControlTable() {
    const searchInput = document.getElementById('riskControlSearchInput');
    const riskLevelSelect = document.getElementById('riskControlRiskLevelSelect');
    const statusSelect = document.getElementById('riskControlStatusSelect');
    const tbodyEl = document.getElementById('riskControlTbody');
    const totalCountEl = document.getElementById('riskControlTotalCount');
    const paginationEl = document.getElementById('riskControlPaginationBtns')?.closest('.table-pagination');
    const paginationBtnsWrap = document.getElementById('riskControlPaginationBtns');

    if (!searchInput || !riskLevelSelect || !statusSelect || !tbodyEl || !totalCountEl || !paginationBtnsWrap || !paginationEl) {
      return;
    }

    const PAGE_SIZE = 5;
    let currentPage = 1;

    // 允许外部在运行时注入数据（例如后续接入接口或本地缓存）
    // 数据格式建议：
    // { riskNo, riskPointName, area/location, riskLevel, controlMeasures, owner/responsible, status }
    let allRows = Array.isArray(window.__riskControlRows) ? window.__riskControlRows : [];

    function rowValue(row, keys) {
      if (!row) return '';
      for (let i = 0; i < keys.length; i++) {
        const v = row[keys[i]];
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
      }
      return '';
    }

    function normalizeText(s) {
      return String(s == null ? '' : s).trim().toLowerCase();
    }

    function getRiskLevelBadgeHTML(levelText) {
      const t = String(levelText == null ? '' : levelText).trim();
      if (!t) return '--';
      if (t.indexOf('重大') !== -1 || t.indexOf('红') !== -1) return '<span class="status-badge danger">' + escapeHtml(t) + '</span>';
      if (t.indexOf('较大') !== -1 || t.indexOf('橙') !== -1) return '<span class="status-badge warning">' + escapeHtml(t) + '</span>';
      if (t.indexOf('一般') !== -1 || t.indexOf('黄') !== -1) return '<span class="status-badge info">' + escapeHtml(t) + '</span>';
      if (t.indexOf('低') !== -1 || t.indexOf('蓝') !== -1) return '<span class="status-badge success">' + escapeHtml(t) + '</span>';
      return '<span class="status-badge info">' + escapeHtml(t) + '</span>';
    }

    function getStatusBadgeHTML(statusText) {
      const t = String(statusText == null ? '' : statusText).trim();
      if (!t) return '--';
      if (t.indexOf('管控中') !== -1) return '<span class="status-badge warning">' + escapeHtml(t) + '</span>';
      if (t.indexOf('已整改') !== -1) return '<span class="status-badge success">' + escapeHtml(t) + '</span>';
      if (t.indexOf('待复查') !== -1) return '<span class="status-badge info">' + escapeHtml(t) + '</span>';
      return '<span class="status-badge info">' + escapeHtml(t) + '</span>';
    }

    function buildRowHTML(r) {
      const riskNo = rowValue(r, ['riskNo', 'riskId', 'risk编号', '风险编号', 'id']);
      const riskPointName = rowValue(r, ['riskPointName', 'riskPoint', 'risk点名称', '风险点名称', '风险点']);
      const area = rowValue(r, ['area', 'location', 'region', '所在区域', '区域']);
      const riskLevelText = rowValue(r, ['riskLevel', 'riskGrade', 'risk等级', '风险等级']);
      const controlMeasures = rowValue(r, ['controlMeasures', 'control', 'measures', '管控措施']);
      const owner = rowValue(r, ['owner', 'responsible', 'responsiblePerson', '责任人', '负责人']);
      const statusText = rowValue(r, ['status', 'state', 'riskStatus', '状态']);

      return '' +
        '<tr>' +
        '<td>' + escapeHtml(riskNo) + '</td>' +
        '<td>' + escapeHtml(riskPointName) + '</td>' +
        '<td>' + escapeHtml(area) + '</td>' +
        '<td>' + getRiskLevelBadgeHTML(riskLevelText) + '</td>' +
        '<td>' + escapeHtml(controlMeasures) + '</td>' +
        '<td>' + escapeHtml(owner) + '</td>' +
        '<td>' + getStatusBadgeHTML(statusText) + '</td>' +
        '</tr>';
    }

    function applyFilters() {
      const keyword = normalizeText(searchInput.value);
      const levelFilter = riskLevelSelect.value;
      const statusFilter = statusSelect.value;

      return allRows.filter(function (r) {
        const riskPointName = rowValue(r, ['riskPointName', 'riskPoint', '风险点名称', '风险点']);
        const riskNo = rowValue(r, ['riskNo', 'riskId', '风险编号', 'id']);
        const area = rowValue(r, ['area', 'location', 'region', '所在区域']);
        const riskLevelText = rowValue(r, ['riskLevel', 'riskGrade', '风险等级']);
        const controlMeasures = rowValue(r, ['controlMeasures', 'control', 'measures', '管控措施']);
        const owner = rowValue(r, ['owner', 'responsible', 'responsiblePerson', '责任人']);
        const statusText = rowValue(r, ['status', 'state', 'riskStatus', '状态']);

        if (levelFilter && levelFilter !== '全部') {
          if (String(riskLevelText || '').indexOf(levelFilter) === -1) return false;
        }

        if (statusFilter && statusFilter !== '全部') {
          if (String(statusText || '').indexOf(statusFilter) === -1) return false;
        }

        if (keyword) {
          const hay = normalizeText([
            riskNo,
            riskPointName,
            area,
            riskLevelText,
            controlMeasures,
            owner,
            statusText
          ].join(' '));
          if (hay.indexOf(keyword) === -1) return false;
        }

        return true;
      });
    }

    function getPaginationModel(page, totalPages) {
      // 精简分页：首尾 + 当前页及其相邻页
      const pages = new Set([1, totalPages]);
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let p = start; p <= end; p++) pages.add(p);

      // 当前页靠近开头时，补齐前几页
      if (page <= 3 && totalPages >= 4) {
        pages.add(2);
        pages.add(3);
        pages.add(4);
      }
      // 当前页靠近结尾时，补齐后几页
      if (page >= totalPages - 2 && totalPages >= 4) {
        pages.add(totalPages - 1);
        pages.add(totalPages - 2);
        pages.add(totalPages - 3);
      }

      return Array.from(pages).filter(function (p) { return p >= 1 && p <= totalPages; }).sort(function (a, b) { return a - b; });
    }

    function renderPagination(totalPages, filteredCount) {
      if (filteredCount === 0) {
        paginationEl.style.display = 'none';
        paginationBtnsWrap.innerHTML = '';
        return;
      }
      paginationEl.style.display = 'flex';

      const pages = getPaginationModel(currentPage, totalPages);
      let html = '';

      function addPageBtn(label, page, isActive) {
        html += '<button type="button" class="pagination-btn' + (isActive ? ' active' : '') + '"' +
          ' data-page="' + page + '">' + escapeHtml(label) + '</button>';
      }

      function addEllipsis() {
        html += '<button type="button" class="pagination-btn" style="pointer-events:none;opacity:0.6;" aria-hidden="true">...</button>';
      }

      // prev
      if (currentPage > 1) {
        html += '<button type="button" class="pagination-btn" data-page="' + (currentPage - 1) + '">&lt;</button>';
      } else {
        html += '<button type="button" class="pagination-btn" style="pointer-events:none;opacity:0.6;" aria-hidden="true">&lt;</button>';
      }

      let prev = null;
      pages.forEach(function (p) {
        if (prev !== null && p - prev > 1) addEllipsis();
        addPageBtn(String(p), p, p === currentPage);
        prev = p;
      });

      // next
      if (currentPage < totalPages) {
        html += '<button type="button" class="pagination-btn" data-page="' + (currentPage + 1) + '">&gt;</button>';
      } else {
        html += '<button type="button" class="pagination-btn" style="pointer-events:none;opacity:0.6;" aria-hidden="true">&gt;</button>';
      }

      paginationBtnsWrap.innerHTML = html;
    }

    function render() {
      const filteredRows = applyFilters();
      const filteredCount = filteredRows.length;
      totalCountEl.textContent = '共 ' + filteredCount + ' 条记录';

      if (filteredCount === 0) {
        tbodyEl.innerHTML =
          '<tr>' +
          '<td colspan="7" style="padding:40px 20px;color:var(--text-secondary);text-align:center;">暂无数据</td>' +
          '</tr>';
        renderPagination(1, 0);
        return;
      }

      const totalPages = Math.ceil(filteredCount / PAGE_SIZE);
      currentPage = Math.min(Math.max(currentPage, 1), totalPages);

      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const pageRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE);

      tbodyEl.innerHTML = pageRows.map(buildRowHTML).join('');
      renderPagination(totalPages, filteredCount);
    }

    let searchTimer = null;
    function scheduleRender() {
      currentPage = 1;
      render();
    }

    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        scheduleRender();
      }, 300);
    });

    riskLevelSelect.addEventListener('change', function () { scheduleRender(); });
    statusSelect.addEventListener('change', function () { scheduleRender(); });

    paginationBtnsWrap.addEventListener('click', function (e) {
      const btn = e.target.closest('button.pagination-btn');
      if (!btn) return;
      const pageText = btn.dataset.page;
      const nextPage = parseInt(pageText, 10);
      if (!isNaN(nextPage) && nextPage >= 1) {
        currentPage = nextPage;
        render();
      }
    });

    // 暴露给外部注入/刷新数据
    window.setRiskControlRows = function (rows) {
      allRows = Array.isArray(rows) ? rows : [];
      currentPage = 1;
      render();
    };

    render();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function nl2br(value) {
    return escapeHtml(value).replace(/\n/g, '<br>');
  }

  function guessRiskLevelByD(d) {
    // 兼容 Excel 只提供 D 的情况；阈值如与实际公司口径不一致，请以表内“危险性程度”为准
    const num = parseFloat(d);
    if (isNaN(num)) return '';
    if (num > 320) return '重大风险';
    if (num > 160) return '较大风险';
    if (num > 70) return '一般风险';
    return '低风险';
  }

  function getRiskBadgeHTML(levelText) {
    const t = String(levelText || '').trim();
    if (!t) return '--';
    if (t.indexOf('重大') !== -1 || t.indexOf('红') !== -1) return '<span class="risk-badge red">' + escapeHtml(t) + '</span>';
    if (t.indexOf('较大') !== -1 || t.indexOf('橙') !== -1) return '<span class="risk-badge orange">' + escapeHtml(t) + '</span>';
    if (t.indexOf('一般') !== -1 || t.indexOf('黄') !== -1) return '<span class="risk-badge yellow">' + escapeHtml(t) + '</span>';
    if (t.indexOf('低') !== -1 || t.indexOf('蓝') !== -1) return '<span class="risk-badge blue">' + escapeHtml(t) + '</span>';
    return '<span class="risk-badge blue">' + escapeHtml(t) + '</span>';
  }

  function buildRiskTierTbodyHTML(rows) {
    return rows.map(function (r) {
      return '' +
        '<tr data-seq="' + escapeHtml(r.seq) + '">' +
        '<td>' + escapeHtml(r.seq) + '</td>' +
        '<td>' + escapeHtml(r.riskPoint) + '</td>' +
        '<td>' + nl2br(r.hazardFactors) + '</td>' +
        '<td>' + nl2br(r.accidentType) + '</td>' +
        '<td>' + escapeHtml(r.L) + '</td>' +
        '<td>' + escapeHtml(r.E) + '</td>' +
        '<td>' + escapeHtml(r.C) + '</td>' +
        '<td>' + escapeHtml(r.D) + '</td>' +
        '<td>' + getRiskBadgeHTML(r.riskLevelText) + '</td>' +
        '</tr>';
    }).join('');
  }

  function parseRiskTierRowsFromExcel(file) {
    // 支持：表头 + 数据；解析后返回结构化 rows
    const reader = new FileReader();
    const buffer = file.arrayBuffer ? file.arrayBuffer() : null;
    // 为兼容不同浏览器：用 Promise 包装
    return buffer ? buffer.then(function (ab) { return parseRiskTierRowsFromArrayBuffer(ab, file); }) : new Promise(function (resolve, reject) {
      reader.onload = function (e) {
        try {
          const ab = e.target.result;
          const rows = parseRiskTierRowsFromArrayBuffer(ab, file);
          resolve(rows);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  function parseRiskTierRowsFromArrayBuffer(ab) {
    const workbook = XLSX.read(ab, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) return [];

    const arrayRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!arrayRows || arrayRows.length < 2) return [];

    // 以第一行作为表头（Excel 通常都包含表头）
    const headers = arrayRows[0].map(function (h) { return normalizeHeaderKey(h); });
    const headerRowRaw = arrayRows[0].map(function (h) { return String(h == null ? '' : h); }).join('');
    const headerLooksValid = /风险点|危险因素|危险性程度|可能发生|事故类型|序/.test(headerRowRaw);
    const startRow = headerLooksValid ? 1 : 0;

    function idxOfHeader(pred) {
      for (let i = 0; i < headers.length; i++) {
        const hk = headers[i];
        if (pred(hk)) return i;
      }
      return -1;
    }

    const idxSeq = idxOfHeader(function (k) { return k.indexOf('序') !== -1 && k.indexOf('号') !== -1; });
    const idxRiskPoint = idxOfHeader(function (k) { return k.indexOf('风险点') !== -1; });
    const idxHazardFactors = idxOfHeader(function (k) { return k.indexOf('危险因素') !== -1; });
    const idxAccidentType = idxOfHeader(function (k) { return k.indexOf('可能发生') !== -1 || k.indexOf('事故类型') !== -1; });
    const idxL = idxOfHeader(function (k) { return k === 'L'; });
    const idxE = idxOfHeader(function (k) { return k === 'E'; });
    const idxC = idxOfHeader(function (k) { return k === 'C'; });
    const idxD = idxOfHeader(function (k) { return k === 'D' || k.indexOf('危险值') !== -1; });
    const idxRiskLevelText = idxOfHeader(function (k) { return k.indexOf('危险性程度') !== -1 || k.indexOf('风险等级') !== -1 || k.indexOf('危险程度') !== -1 || (k.indexOf('风险') !== -1); });

    // 若表头未命中，则直接尝试按固定列顺序：序号/风险点/危险因素/可能发生事故类型/L/E/C/D/危险性程度
    const fixedOrder = idxSeq === -1 || idxRiskPoint === -1 || idxHazardFactors === -1 || idxAccidentType === -1;
    const getByIndex = function (row, index) {
      const v = index >= 0 ? row[index] : '';
      return v == null ? '' : v;
    };

    const rows = [];
    for (let r = startRow; r < arrayRows.length; r++) {
      const row = arrayRows[r];
      if (!row || row.length === 0) continue;

      const seq = fixedOrder ? getByIndex(row, 0) : getByIndex(row, idxSeq);
      const riskPoint = fixedOrder ? getByIndex(row, 1) : getByIndex(row, idxRiskPoint);
      const hazardFactors = fixedOrder ? getByIndex(row, 2) : getByIndex(row, idxHazardFactors);
      const accidentType = fixedOrder ? getByIndex(row, 3) : getByIndex(row, idxAccidentType);
      const L = fixedOrder ? getByIndex(row, 4) : getByIndex(row, idxL);
      const E = fixedOrder ? getByIndex(row, 5) : getByIndex(row, idxE);
      const C = fixedOrder ? getByIndex(row, 6) : getByIndex(row, idxC);
      let D = fixedOrder ? getByIndex(row, 7) : getByIndex(row, idxD);
      let riskLevelText = fixedOrder ? getByIndex(row, 8) : getByIndex(row, idxRiskLevelText);

      // 清洗字符串与换行
      const seqText = String(seq || '').trim();
      const riskPointText = String(riskPoint || '').trim();
      if (!seqText && !riskPointText) continue;

      const hazardFactorsText = String(hazardFactors || '').replace(/\r\n/g, '\n');
      const accidentTypeText = String(accidentType || '').replace(/\r\n/g, '\n');

      const Lnum = parseFloat(L);
      const Enum = parseFloat(E);
      const Cnum = parseFloat(C);
      const Dnum = parseFloat(D);

      if ((riskLevelText == null || String(riskLevelText).trim() === '') && !isNaN(Dnum)) {
        riskLevelText = guessRiskLevelByD(Dnum);
      }

      if ((D == null || String(D).trim() === '') && !isNaN(Lnum) && !isNaN(Enum) && !isNaN(Cnum)) {
        D = String(Lnum * Enum * Cnum);
      }

      rows.push({
        seq: seqText,
        riskPoint: riskPointText,
        hazardFactors: hazardFactorsText,
        accidentType: accidentTypeText,
        L: String(L || ''),
        E: String(E || ''),
        C: String(C || ''),
        D: String(D || ''),
        riskLevelText: String(riskLevelText || '').trim()
      });
    }

    return rows;
  }

  // ============ 事故与应急管理 ============
  function renderAccidentEmergency() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">事故与应急管理</div>' +
            '<div class="page-desc">事故上报、调查统计与应急预案管理</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-primary">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
              '事故上报' +
            '</button>' +
            '<button class="btn btn-outline">预案管理</button>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav" id="accidentEmergencyTabNav">' +
          '<div class="tab-item active" data-tab="accident">事故管理</div>' +
          '<div class="tab-item" data-tab="emergency">应急预案</div>' +
          '<div class="tab-item" data-tab="drill">演练记录</div>' +
          '<div class="tab-item" data-tab="warning">预警中心</div>' +
        '</div>' +

        '<div id="accidentPanel" class="accident-emergency-panel">' +
          '<div class="feature-grid">' +
            buildFeatureCard('事故上报', '快速上报安全事故，支持拍照取证与定位', 'var(--danger-light)', 'var(--danger)', '本月上报 2 起', 'accident-report') +
            buildFeatureCard('事故调查', '事故原因分析、责任认定与整改跟踪', 'var(--warning-light)', 'var(--warning)', '进行中 1 项') +
            buildFeatureCard('事故统计', '多维度事故数据统计与趋势分析', 'var(--info-light)', 'var(--info)', '累计 23 起') +
          '</div>' +
        '</div>' +

        '<div id="emergencyPanel" class="accident-emergency-panel" style="display:none;">' +
          '<div class="feature-grid">' +
            buildFeatureCard('应急预案', '各类应急预案编制、审核与发布管理', 'var(--primary-light)', 'var(--primary)', '生效预案 15 个') +
            buildFeatureCard('应急处置', '应急响应流程指导与资源调度协调', 'var(--danger-light)', 'var(--danger)', '本月处置 1 次') +
          '</div>' +
        '</div>' +

        '<div id="drillPanel" class="accident-emergency-panel" style="display:none;">' +
          '<div class="feature-grid">' +
            buildFeatureCard('应急演练', '演练计划制定、执行记录与效果评估', 'var(--success-light)', 'var(--success)', '本季度 3 次') +
          '</div>' +
        '</div>' +

        '<div id="warningPanel" class="accident-emergency-panel" style="display:none;">' +
          '<div class="feature-grid">' +
            buildFeatureCard('天气预警', '气象灾害预警信息推送与应对措施', 'var(--warning-light)', 'var(--warning)', '当前预警 1 条') +
            buildFeatureCard('车辆预警', '车辆安全状态监控与异常预警', 'var(--info-light)', 'var(--info)', '异常车辆 0 辆') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============ 人员安全管理 ============
  function renderPersonnel() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">人员安全管理</div>' +
            '<div class="page-desc">人员档案、特种作业人员与外来人员管理</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-primary">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
              '添加人员' +
            '</button>' +
            '<button class="btn btn-outline">批量导入</button>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav">' +
          '<div class="tab-item active">人员档案</div>' +
          '<div class="tab-item">特种作业人员</div>' +
          '<div class="tab-item">外来人员管理</div>' +
        '</div>' +

        '<div class="stats-row">' +
          buildStatCard('在岗人员', '1,286', '今日出勤率 96.2%', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>', 'blue') +
          buildStatCard('特种作业人员', '89', '资质有效 85 人', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l8 4v6c0 5.25-3.5 10-8 11-4.5-1-8-5.75-8-11V6l8-4z"/></svg>', 'green') +
          buildStatCard('证书即将到期', '4', '近30天内到期', 'down',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', 'orange') +
          buildStatCard('外来人员（今日）', '23', '审批通过 21 人', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>', 'red') +
        '</div>' +

        '<div class="data-table-wrapper">' +
          '<div class="table-toolbar">' +
            '<div class="table-toolbar-left">' +
              '<div class="table-filter">' +
                '<span>部门：</span>' +
                '<select><option>全部</option><option>分拨中心</option><option>转运中心</option><option>网点</option></select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>岗位类型：</span>' +
                '<select><option>全部</option><option>操作岗</option><option>管理岗</option><option>特种作业</option></select>' +
              '</div>' +
            '</div>' +
            '<div class="table-search">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
              '<input type="text" placeholder="搜索姓名、工号...">' +
            '</div>' +
          '</div>' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th>工号</th><th>姓名</th><th>部门</th><th>岗位</th><th>培训状态</th><th>证书情况</th><th>操作</th>' +
            '</tr></thead>' +
            '<tbody>' +
              '<tr><td>ST-10021</td><td>刘洋</td><td>华东分拨中心</td><td>叉车操作员</td><td><span class="status-badge success">已完成</span></td><td><span class="status-badge success">有效</span></td><td><span class="feature-link">查看</span></td></tr>' +
              '<tr><td>ST-10035</td><td>周磊</td><td>华南转运中心</td><td>电工</td><td><span class="status-badge success">已完成</span></td><td><span class="status-badge warning">即将到期</span></td><td><span class="feature-link">查看</span></td></tr>' +
              '<tr><td>ST-10042</td><td>吴芳</td><td>西南分拨中心</td><td>安全主管</td><td><span class="status-badge success">已完成</span></td><td><span class="status-badge success">有效</span></td><td><span class="feature-link">查看</span></td></tr>' +
              '<tr><td>ST-10058</td><td>陈建</td><td>华北转运中心</td><td>装卸工</td><td><span class="status-badge warning">进行中</span></td><td>--</td><td><span class="feature-link">查看</span></td></tr>' +
              '<tr><td>ST-10076</td><td>杨帆</td><td>华东分拨中心</td><td>焊接工</td><td><span class="status-badge success">已完成</span></td><td><span class="status-badge danger">已过期</span></td><td><span class="feature-link">查看</span></td></tr>' +
            '</tbody>' +
          '</table>' +
          '<div class="table-pagination">' +
            '<span>共 1,286 条记录</span>' +
            '<div class="pagination-btns">' +
              '<button class="pagination-btn">&lt;</button>' +
              '<button class="pagination-btn active">1</button>' +
              '<button class="pagination-btn">2</button>' +
              '<button class="pagination-btn">3</button>' +
              '<button class="pagination-btn">...</button>' +
              '<button class="pagination-btn">129</button>' +
              '<button class="pagination-btn">&gt;</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============ 场地与设施管理 ============
  function renderFacility() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">场地与设施管理</div>' +
            '<div class="page-desc">场地信息、设备设施安全与区域划分管理</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-primary">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
              '新增场地' +
            '</button>' +
            '<button class="btn btn-outline">设备台账</button>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav">' +
          '<div class="tab-item active">场地信息</div>' +
          '<div class="tab-item">设备设施安全</div>' +
          '<div class="tab-item">区域划分</div>' +
        '</div>' +

        '<div class="feature-grid">' +
          buildFeatureCard('场地信息台账', '全面记录各场地基础信息、面积、用途及安全设施配置', 'var(--primary-light)', 'var(--primary)', '已录入 42 个场地') +
          buildFeatureCard('设备设施清单', '设备资产登记、维保计划与安全状态实时监控', 'var(--info-light)', 'var(--info)', '设备总量 856 台') +
          buildFeatureCard('设备巡检记录', '定期巡检任务管理与异常报修追踪', 'var(--warning-light)', 'var(--warning)', '待巡检 12 项') +
          buildFeatureCard('区域安全划分', '作业区、仓储区、通行区等功能区域安全等级划分', 'var(--success-light)', 'var(--success)', '已划分 186 个区域') +
          buildFeatureCard('消防设施管理', '消防器材台账、检查记录与到期提醒', 'var(--danger-light)', 'var(--danger)', '消防器材 2,340 件') +
          buildFeatureCard('维保计划', '设备维护保养计划制定与执行跟踪', 'var(--primary-light)', 'var(--primary)', '本月计划 28 项') +
        '</div>' +
      '</div>';
  }

  // ============ 园区综合管理 ============
  function renderPark() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">园区综合管理</div>' +
            '<div class="page-desc">园区运营安全、多场地协同与安防联动</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-outline">园区总览</button>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav">' +
          '<div class="tab-item active">园区运营安全</div>' +
          '<div class="tab-item">多场地协同</div>' +
          '<div class="tab-item">安防联动</div>' +
        '</div>' +

        '<div class="feature-grid">' +
          buildFeatureCard('园区安全概览', '实时展示园区整体安全运营状态与关键指标', 'var(--primary-light)', 'var(--primary)', '接入园区 8 个') +
          buildFeatureCard('运营安全监控', '园区日常运营安全监控、巡逻与事件管理', 'var(--info-light)', 'var(--info)', '今日事件 3 条') +
          buildFeatureCard('多场地协同', '跨场地安全信息共享与协同处置', 'var(--success-light)', 'var(--success)', '协同场地 42 个') +
          buildFeatureCard('安防系统联动', '视频监控、门禁、报警等安防系统统一管理', 'var(--danger-light)', 'var(--danger)', '设备在线率 99.2%') +
          buildFeatureCard('出入口管理', '车辆与人员出入园区登记与管控', 'var(--warning-light)', 'var(--warning)', '今日进出 1,286 次') +
          buildFeatureCard('环境安全监测', '温湿度、烟感、气体检测等环境传感器数据', 'var(--info-light)', 'var(--info)', '传感器 320 个') +
        '</div>' +
      '</div>';
  }

  // ============ 寄递安全管理 ============
  function renderDeliverySafety() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">寄递安全管理</div>' +
            '<div class="page-desc">寄递物品安全检查、实名登记与危险品识别</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-primary">安全检查</button>' +
            '<button class="btn btn-outline">导出数据</button>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav">' +
          '<div class="tab-item active">安全检查</div>' +
          '<div class="tab-item">实名登记</div>' +
          '<div class="tab-item">危险品识别</div>' +
        '</div>' +

        '<div class="stats-row">' +
          buildStatCard('今日检查量', '12,580', '较昨日 +320', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20"/></svg>', 'blue') +
          buildStatCard('实名登记率', '99.8%', '目标 100%', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>', 'green') +
          buildStatCard('异常物品拦截', '3', '本周累计拦截', 'down',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>', 'orange') +
          buildStatCard('危险品识别', '0', '今日未检出', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>', 'red') +
        '</div>' +

        '<div class="data-table-wrapper">' +
          '<div class="table-toolbar">' +
            '<div class="table-toolbar-left">' +
              '<div class="table-filter">' +
                '<span>检查结果：</span>' +
                '<select><option>全部</option><option>正常</option><option>异常</option><option>拦截</option></select>' +
              '</div>' +
            '</div>' +
            '<div class="table-search">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
              '<input type="text" placeholder="搜索运单号...">' +
            '</div>' +
          '</div>' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th>运单号</th><th>寄件人</th><th>收件地</th><th>检查方式</th><th>检查结果</th><th>检查时间</th>' +
            '</tr></thead>' +
            '<tbody>' +
              '<tr><td>STO20260318001</td><td>张*明</td><td>上海市浦东新区</td><td>X光机检</td><td><span class="status-badge success">正常</span></td><td>2026-03-18 09:15</td></tr>' +
              '<tr><td>STO20260318002</td><td>李*华</td><td>北京市朝阳区</td><td>X光机检</td><td><span class="status-badge success">正常</span></td><td>2026-03-18 09:12</td></tr>' +
              '<tr><td>STO20260318003</td><td>王*</td><td>广州市天河区</td><td>人工开箱</td><td><span class="status-badge warning">异常</span></td><td>2026-03-18 09:08</td></tr>' +
              '<tr><td>STO20260318004</td><td>赵*</td><td>成都市武侯区</td><td>X光机检</td><td><span class="status-badge success">正常</span></td><td>2026-03-18 09:05</td></tr>' +
            '</tbody>' +
          '</table>' +
          '<div class="table-pagination">' +
            '<span>共 12,580 条记录</span>' +
            '<div class="pagination-btns">' +
              '<button class="pagination-btn">&lt;</button>' +
              '<button class="pagination-btn active">1</button>' +
              '<button class="pagination-btn">2</button>' +
              '<button class="pagination-btn">3</button>' +
              '<button class="pagination-btn">...</button>' +
              '<button class="pagination-btn">1258</button>' +
              '<button class="pagination-btn">&gt;</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============ 培训与宣教 ============
  function renderTraining() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">培训与宣教</div>' +
            '<div class="page-desc">安全培训课程管理、宣传资料与考试考核</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-primary">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
              '创建培训' +
            '</button>' +
            '<button class="btn btn-outline">发布考试</button>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav">' +
          '<div class="tab-item active">安全培训</div>' +
          '<div class="tab-item">宣传资料</div>' +
          '<div class="tab-item">考试考核</div>' +
        '</div>' +

        '<div class="stats-row">' +
          buildStatCard('进行中培训', '5', '本月新增 3 场', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>', 'blue') +
          buildStatCard('已完成培训', '28', '本年度累计', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', 'green') +
          buildStatCard('培训覆盖率', '87.5%', '目标 95%', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>', 'orange') +
          buildStatCard('考试通过率', '93.2%', '较上月 +1.8%', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>', 'green') +
        '</div>' +

        '<div class="feature-grid">' +
          buildFeatureCard('培训课程库', '安全培训课程分类管理，支持在线学习与线下签到', 'var(--primary-light)', 'var(--primary)', '课程总量 86 门') +
          buildFeatureCard('培训计划', '年度、季度培训计划制定与执行追踪', 'var(--info-light)', 'var(--info)', '本年度 12 期') +
          buildFeatureCard('学习记录', '员工个人学习进度追踪与学时统计', 'var(--success-light)', 'var(--success)', '人均学时 24h') +
          buildFeatureCard('宣传资料库', '安全标语、海报、视频等宣教材料统一管理', 'var(--warning-light)', 'var(--warning)', '资料 256 份') +
          buildFeatureCard('在线考试', '安全知识在线考试系统，自动阅卷与成绩管理', 'var(--danger-light)', 'var(--danger)', '本月考试 3 场') +
          buildFeatureCard('证书管理', '培训合格证书生成与查询', 'var(--primary-light)', 'var(--primary)', '已发放 892 张') +
        '</div>' +
      '</div>';
  }

  // ============ 数据与分析中心 ============
  function renderDataCenter() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">数据与分析中心</div>' +
            '<div class="page-desc">统计报表、风险趋势分析与KPI考核</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-outline">生成报表</button>' +
            '<button class="btn btn-outline">导出数据</button>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav">' +
          '<div class="tab-item active">统计报表</div>' +
          '<div class="tab-item">风险趋势</div>' +
          '<div class="tab-item">KPI考核</div>' +
        '</div>' +

        '<div class="feature-grid">' +
          buildFeatureCard('安全综合报表', '安全管理各项指标综合统计与展示', 'var(--primary-light)', 'var(--primary)', '本月已生成 8 份') +
          buildFeatureCard('隐患统计分析', '隐患类型分布、整改趋势与区域对比分析', 'var(--warning-light)', 'var(--warning)', '本月隐患 12 项') +
          buildFeatureCard('事故趋势分析', '事故发生趋势、类型占比与同比环比分析', 'var(--danger-light)', 'var(--danger)', '同比下降 15%') +
          buildFeatureCard('风险热力图', '基于地理位置的风险分布热力图展示', 'var(--info-light)', 'var(--info)', '覆盖 42 个场地') +
          buildFeatureCard('培训数据统计', '培训完成率、考试通过率等多维数据分析', 'var(--success-light)', 'var(--success)', '整体达标 87.5%') +
          buildFeatureCard('KPI考核看板', '安全KPI指标设定、跟踪与考核结果展示', 'var(--primary-light)', 'var(--primary)', 'Q1达标率 91%') +
        '</div>' +
      '</div>';
  }

  // ============ 制度与文档管理 ============
  function renderDocument() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">制度与文档管理</div>' +
            '<div class="page-desc">制度文件、操作规程与法规标准管理</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-primary">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
              '上传文档' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav">' +
          '<div class="tab-item active">制度文件</div>' +
          '<div class="tab-item">操作规程</div>' +
          '<div class="tab-item">法规标准</div>' +
        '</div>' +

        '<div class="data-table-wrapper">' +
          '<div class="table-toolbar">' +
            '<div class="table-toolbar-left">' +
              '<div class="table-filter">' +
                '<span>文档类型：</span>' +
                '<select><option>全部</option><option>制度文件</option><option>操作规程</option><option>法规标准</option></select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>状态：</span>' +
                '<select><option>全部</option><option>生效中</option><option>待审核</option><option>已废止</option></select>' +
              '</div>' +
            '</div>' +
            '<div class="table-search">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
              '<input type="text" placeholder="搜索文档标题...">' +
            '</div>' +
          '</div>' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th>文档编号</th><th>文档标题</th><th>类型</th><th>版本</th><th>发布日期</th><th>状态</th><th>操作</th>' +
            '</tr></thead>' +
            '<tbody>' +
              '<tr><td>DOC-001</td><td>申通快递安全生产管理制度</td><td>制度文件</td><td>V3.2</td><td>2026-01-15</td><td><span class="status-badge success">生效中</span></td><td><span class="feature-link">查看</span></td></tr>' +
              '<tr><td>DOC-002</td><td>分拨中心安全操作规程</td><td>操作规程</td><td>V2.1</td><td>2026-02-20</td><td><span class="status-badge success">生效中</span></td><td><span class="feature-link">查看</span></td></tr>' +
              '<tr><td>DOC-003</td><td>叉车作业安全操作规范</td><td>操作规程</td><td>V1.5</td><td>2025-12-10</td><td><span class="status-badge success">生效中</span></td><td><span class="feature-link">查看</span></td></tr>' +
              '<tr><td>DOC-004</td><td>危险化学品寄递管理规定</td><td>法规标准</td><td>V2.0</td><td>2026-03-01</td><td><span class="status-badge info">待审核</span></td><td><span class="feature-link">查看</span></td></tr>' +
              '<tr><td>DOC-005</td><td>应急救援预案（综合版）</td><td>制度文件</td><td>V4.0</td><td>2026-01-08</td><td><span class="status-badge success">生效中</span></td><td><span class="feature-link">查看</span></td></tr>' +
            '</tbody>' +
          '</table>' +
          '<div class="table-pagination">' +
            '<span>共 128 条记录</span>' +
            '<div class="pagination-btns">' +
              '<button class="pagination-btn">&lt;</button>' +
              '<button class="pagination-btn active">1</button>' +
              '<button class="pagination-btn">2</button>' +
              '<button class="pagination-btn">3</button>' +
              '<button class="pagination-btn">...</button>' +
              '<button class="pagination-btn">13</button>' +
              '<button class="pagination-btn">&gt;</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============ 系统与权限管理 ============
  function renderSystem() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">系统与权限管理</div>' +
            '<div class="page-desc">用户权限配置、组织架构与日志审计</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-primary">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
              '新增用户' +
            '</button>' +
            '<button class="btn btn-outline">角色管理</button>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav">' +
          '<div class="tab-item active">用户权限</div>' +
          '<div class="tab-item">组织架构</div>' +
          '<div class="tab-item">日志审计</div>' +
        '</div>' +

        '<div class="stats-row">' +
          buildStatCard('系统用户', '186', '活跃用户 142', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>', 'blue') +
          buildStatCard('角色数量', '8', '含 3 个自定义角色', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l8 4v6c0 5.25-3.5 10-8 11-4.5-1-8-5.75-8-11V6l8-4z"/></svg>', 'green') +
          buildStatCard('部门/网点', '42', '多级组织架构', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="9" width="7" height="12" rx="1"/><rect x="14" y="4" width="7" height="17" rx="1"/></svg>', 'orange') +
          buildStatCard('今日操作日志', '1,523', '异常操作 0 条', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', 'red') +
        '</div>' +

        '<div class="data-table-wrapper">' +
          '<div class="table-toolbar">' +
            '<div class="table-toolbar-left">' +
              '<div class="table-filter">' +
                '<span>角色：</span>' +
                '<select><option>全部</option><option>超级管理员</option><option>安全主管</option><option>操作员</option><option>审计员</option></select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>状态：</span>' +
                '<select><option>全部</option><option>启用</option><option>禁用</option></select>' +
              '</div>' +
            '</div>' +
            '<div class="table-search">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
              '<input type="text" placeholder="搜索用户名...">' +
            '</div>' +
          '</div>' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th>用户名</th><th>姓名</th><th>所属部门</th><th>角色</th><th>最后登录</th><th>状态</th><th>操作</th>' +
            '</tr></thead>' +
            '<tbody>' +
              '<tr><td>admin</td><td>系统管理员</td><td>信息技术部</td><td>超级管理员</td><td>2026-03-18 08:30</td><td><span class="status-badge success">启用</span></td><td><span class="feature-link">编辑</span></td></tr>' +
              '<tr><td>zhangwei</td><td>张伟</td><td>华东分拨中心</td><td>安全主管</td><td>2026-03-18 09:15</td><td><span class="status-badge success">启用</span></td><td><span class="feature-link">编辑</span></td></tr>' +
              '<tr><td>liming</td><td>李明</td><td>华南转运中心</td><td>安全主管</td><td>2026-03-17 17:45</td><td><span class="status-badge success">启用</span></td><td><span class="feature-link">编辑</span></td></tr>' +
              '<tr><td>wangqiang</td><td>王强</td><td>西南分拨中心</td><td>操作员</td><td>2026-03-18 08:50</td><td><span class="status-badge success">启用</span></td><td><span class="feature-link">编辑</span></td></tr>' +
              '<tr><td>liutest</td><td>刘测试</td><td>信息技术部</td><td>审计员</td><td>2026-03-10 14:20</td><td><span class="status-badge warning">禁用</span></td><td><span class="feature-link">编辑</span></td></tr>' +
            '</tbody>' +
          '</table>' +
          '<div class="table-pagination">' +
            '<span>共 186 条记录</span>' +
            '<div class="pagination-btns">' +
              '<button class="pagination-btn">&lt;</button>' +
              '<button class="pagination-btn active">1</button>' +
              '<button class="pagination-btn">2</button>' +
              '<button class="pagination-btn">3</button>' +
              '<button class="pagination-btn">...</button>' +
              '<button class="pagination-btn">19</button>' +
              '<button class="pagination-btn">&gt;</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============ 构建辅助函数 ============
  function buildStatCard(label, value, colorClass, valueId) {
    const idAttr = valueId ? ' id="' + valueId + '"' : '';
    return '' +
      '<div class="stat-card ' + colorClass + '">' +
        '<div class="stat-info">' +
          '<div class="stat-label">' + label + '</div>' +
          '<div class="stat-value"' + idAttr + '>' + value + '</div>' +
        '</div>' +
      '</div>';
  }

  function buildQuickAction(label, bgColor, iconColor, iconSvg, page) {
    return '' +
      '<div class="quick-action-item" data-page="' + page + '">' +
        '<div class="quick-action-icon" style="background:' + bgColor + ';color:' + iconColor + '">' + iconSvg + '</div>' +
        '<span class="quick-action-label">' + label + '</span>' +
      '</div>';
  }

  function buildTodoItem(level, text, time) {
    return '' +
      '<li class="todo-item">' +
        '<div class="todo-left">' +
          '<span class="todo-dot ' + level + '"></span>' +
          '<span class="todo-text">' + text + '</span>' +
        '</div>' +
        '<span class="todo-time">' + time + '</span>' +
      '</li>';
  }

  function buildNoticeItem(type, typeLabel, title, time) {
    return '' +
      '<li class="notice-item">' +
        '<div class="notice-type ' + type + '">' + typeLabel + '</div>' +
        '<div class="notice-content">' +
          '<div class="notice-title">' + title + '</div>' +
          '<div class="notice-time">' + time + '</div>' +
        '</div>' +
      '</li>';
  }

  function buildModuleCard(page, title, desc, tags, bgColor, iconColor) {
    var tagHtml = '';
    tags.forEach(function (tag) {
      tagHtml += '<span class="module-tag">' + tag + '</span>';
    });
    return '' +
      '<div class="module-card" data-page="' + page + '">' +
        '<div class="module-card-header">' +
          '<div class="module-card-icon" style="background:' + bgColor + ';color:' + iconColor + '">' +
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l8 4v6c0 5.25-3.5 10-8 11-4.5-1-8-5.75-8-11V6l8-4z"/></svg>' +
          '</div>' +
          '<div class="module-card-title">' + title + '</div>' +
        '</div>' +
        '<div class="module-card-desc">' + desc + '</div>' +
        '<div class="module-card-tags">' + tagHtml + '</div>' +
      '</div>';
  }

  function renderAccidentReport() {
    const today = new Date().toISOString().split('T')[0];
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">事故上报</div>' +
            '<div class="page-desc">STO事故上报 - 请大家仔细填写，谢谢合作</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-outline" onclick="window.history.back()">返回</button>' +
          '</div>' +
        '</div>' +

        '<div class="report-form-layout">' +
          '<div class="form-main-content">' +
            '<form id="accidentReportForm" class="premium-form">' +
              '<div class="form-section">' +
                '<div class="section-header">基础信息</div>' +
                '<div class="form-grid">' +
                  '<div class="form-field span-1">' +
                    '<label class="form-label required">1. 伤者</label>' +
                    '<input type="text" class="form-input" placeholder="事故主体人员姓名/工号（没有填写“无”）" required>' +
                  '</div>' +
                  '<div class="form-field span-1">' +
                    '<label class="form-label required">2. 所属单位（省+转运中心名称）</label>' +
                    '<input type="text" class="form-input" placeholder="xx省区xx转运中心" required>' +
                  '</div>' +
                  '<div class="form-field span-1">' +
                    '<label class="form-label required">3. 事故日期</label>' +
                    '<input type="date" class="form-input" value="' + today + '" required>' +
                  '</div>' +
                  '<div class="form-field span-2">' +
                    '<label class="form-label required">4. 事故经过</label>' +
                    '<textarea class="form-textarea" rows="4" placeholder="【时间+事故类型+事故概况+受伤部位】1月1日，xx转运中心发生1起设备夹伤事故。13: 14 出港操作人员张三进行北京流向分拣作业时，手被卷入接缝处，导致4只手指受伤。" required></textarea>' +
                  '</div>' +
                  '<div class="form-field span-2">' +
                    '<label class="form-label required">5. 损失预估</label>' +
                    '<textarea class="form-textarea" rows="2" placeholder="人员医疗/设备损失预估" required></textarea>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              '<div class="form-section">' +
                '<div class="section-header">现场证据</div>' +
                '<div class="form-grid">' +
                  '<div class="form-field span-1">' +
                    '<label class="form-label">6. 事故现场图片</label>' +
                    '<div class="file-upload-area">' +
                      '<input type="file" multiple accept="image/*" class="file-input">' +
                      '<div class="file-upload-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>' +
                      '<div class="file-upload-text">添加图片</div>' +
                      '<div class="file-upload-hint">最多选择9张</div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="form-field span-1">' +
                    '<label class="form-label">7. 事故现场视频</label>' +
                    '<div class="file-upload-area">' +
                      '<input type="file" multiple accept="video/*" class="file-input">' +
                      '<div class="file-upload-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></div>' +
                      '<div class="file-upload-text">添加视频</div>' +
                      '<div class="file-upload-hint">支持 mp4, mov 等格式</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="form-hint" style="margin-top:12px; color:var(--text-tertiary); font-size:12px;">' +
                  '以上内容需在事故发生后第一时间上报，事故发生后1周内上报“四不放过”报告' +
                '</div>' +
              '</div>' +

              '<div id="followUpSection" class="form-section" style="display: none">' +
                '<div class="section-header">后期补报</div>' +
                '<div class="form-grid">' +
                  '<div class="form-field span-2">' +
                    '<label class="form-label">8. 四不放过处置</label>' +
                    '<div class="file-upload-area attachment-upload">' +
                      '<input type="file" class="file-input">' +
                      '<div class="file-upload-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></div>' +
                      '<div class="file-upload-content">' +
                        '<div class="file-upload-text">添加附件</div>' +
                        '<div class="file-upload-hint">只有发起人可以查看提交的文件</div>' +
                      '</div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="form-field span-1">' +
                    '<label class="form-label">9. 恢复上班时间（后续补报）</label>' +
                    '<input type="date" class="form-input">' +
                  '</div>' +
                  '<div class="form-field span-1">' +
                    '<label class="form-label">10. 实际费用（后续补报）</label>' +
                    '<input type="number" class="form-input" placeholder="请输入费用金额">' +
                  '</div>' +
                '</div>' +
              '</div>' +

              '<div class="form-footer">' +
                '<button type="button" class="btn btn-outline btn-reset">重置表单</button>' +
                '<button type="submit" class="btn btn-primary" id="submitAccidentBtn">提交上报</button>' +
              '</div>' +
            '</form>' +
          '</div>' +
          '<div class="form-side-content">' +
            '<div class="timeline-card">' +
              '<div class="section-header" style="border-left:none; padding-left:0;">事故进展</div>' +
              '<div class="timeline" id="accidentTimeline">' +
                '<div class="timeline-item status-active" id="node1">' +
                  '<div class="timeline-node">1</div>' +
                  '<div class="timeline-content">' +
                    '<div class="timeline-title">初次上报</div>' +
                    '<div class="timeline-desc">填写事故基础信息与现场证据</div>' +
                  '</div>' +
                '</div>' +
                '<div class="timeline-item status-pending" id="node2">' +
                  '<div class="timeline-node">2</div>' +
                  '<div class="timeline-content">' +
                    '<div class="timeline-title">平台审核</div>' +
                    '<div class="timeline-desc">安全管理部门审核上报内容</div>' +
                  '</div>' +
                '</div>' +
                '<div class="timeline-item status-pending" id="node3">' +
                  '<div class="timeline-node">3</div>' +
                  '<div class="timeline-content">' +
                    '<div class="timeline-title">后期补报</div>' +
                    '<div class="timeline-desc">上传处理结果与实际费用</div>' +
                  '</div>' +
                '</div>' +
                '<div class="timeline-item status-pending" id="node4">' +
                  '<div class="timeline-node">4</div>' +
                  '<div class="timeline-content">' +
                    '<div class="timeline-title">归档完成</div>' +
                    '<div class="timeline-desc">事故档案已闭环入库</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function buildFeatureCard(title, desc, bgColor, iconColor, stat, page) {
    const dataPage = page ? ' data-page="' + page + '"' : '';
    return '' +
      '<div class="feature-card"' + dataPage + '>' +
        '<div class="feature-card-header">' +
          '<div class="feature-card-icon" style="background:' + bgColor + ';color:' + iconColor + '">' +
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l8 4v6c0 5.25-3.5 10-8 11-4.5-1-8-5.75-8-11V6l8-4z"/></svg>' +
          '</div>' +
          '<div class="feature-card-title">' + title + '</div>' +
        '</div>' +
        '<div class="feature-card-desc">' + desc + '</div>' +
        '<div class="feature-card-footer">' +
          '<span class="feature-stat">' + stat + '</span>' +
          '<span class="feature-link">进入 &rarr;</span>' +
        '</div>' +
      '</div>';
  }

  // ============ 启动 ============
  init();
})();
