/**
 * 申盾智能安全平台 - 前端应用
 */

(function () {
  'use strict';

  var currentHazardSource = { title: '隐患上报', subTab: 'report' };
  var provincesData = [];
  var centersData = [];
  var hazardReportList = [];
  var hazardIndex = 100000;
  var loadHazardsFromAPI = function () { };

  function fetchLocationsData() {
    if (provincesData.length > 0) return Promise.resolve();
    if (typeof window.LOCATION_PROVINCES !== 'undefined') {
      provincesData = window.LOCATION_PROVINCES;
      centersData = window.LOCATION_CENTERS;
      return Promise.resolve();
    }
    return Promise.all([
      fetch('data/provinces.json').then(function(r) { return r.ok ? r.json() : []; }),
      fetch('data/centers.json').then(function(r) { return r.ok ? r.json() : []; })
    ]).then(function(arr) {
      provincesData = arr[0] || [];
      centersData = arr[1] || [];
    });
  }

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
      // 对应后端：self_check, security_audit, special
      // 对应前端查询：self-check, security-audit, special-audit
      source: row.source_type === 'self_check' ? 'self-check' : (row.source_type === 'security_audit' ? 'security-audit' : (row.source_type === 'special' ? 'special-audit' : 'manual')),
      rectifyDesc: row.rectify_description || '',
      rectifyTime: row.rectify_time ? String(row.rectify_time).replace('T', ' ').substring(0, 16) : '',
      rectifyPerson: row.rectifier || ''
    };
  }

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
    'accident-investigation': {
      title: '事故调查',
      breadcrumb: ['首页', '核心业务', '事故与应急管理', '事故调查']
    },
    'emergency-plan': {
      title: '应急预案',
      breadcrumb: ['首页', '核心业务', '事故与应急管理', '应急预案']
    },
    'emergency-drill': {
      title: '应急演练',
      breadcrumb: ['首页', '核心业务', '事故与应急管理', '应急演练']
    },
    personnel: {
      title: '人员安全管理',
      breadcrumb: ['首页', '基础要素', '人员安全管理']
    },
    facility: {
      title: '场地与设施管理',
      breadcrumb: ['首页', '基础要素', '场地与设施管理']
    },
    'facility-site-ledger': {
      title: '场地信息台账',
      breadcrumb: ['首页', '基础要素', '场地与设施管理', '场地信息台账']
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
      title: '申安学堂',
      breadcrumb: ['首页', '培训与文化', '申安学堂']
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
    },
    'accident-statistics': {
      title: '事故统计',
      breadcrumb: ['首页', '核心业务', '事故与应急管理', '事故统计']
    },
    'training-course-library': {
      title: '培训课程库',
      breadcrumb: ['首页', '培训与文化', '申安学堂', '培训课程库']
    },
    'create-course': {
      title: '创建课程',
      breadcrumb: ['首页', '培训与文化', '申安学堂', '培训课程库', '创建课程']
    },
    'publicity-materials-library': {
      title: '宣传资料库',
      breadcrumb: ['首页', '培训与文化', '申安学堂', '宣传资料库']
    },
    'upload-materials': {
      title: '上传资料',
      breadcrumb: ['首页', '培训与文化', '申安学堂', '宣传资料库', '上传资料']
    },
    'training-plan': {
      title: '培训计划',
      breadcrumb: ['首页', '培训与文化', '申安学堂', '培训计划']
    },
	    'training-plan-create': {
	      title: '创建培训计划',
	      breadcrumb: ['首页', '培训与文化', '申安学堂', '培训计划', '创建培训计划']
	    },
	    'training-plan-edit': {
	      title: '编辑培训计划',
	      breadcrumb: ['首页', '培训与文化', '申安学堂', '培训计划', '编辑培训计划']
	    },
	    'training-plan-detail': {
	      title: '培训计划详情',
	      breadcrumb: ['首页', '培训与文化', '申安学堂', '培训计划', '培训计划详情']
	    },
	    'online-exam': {
	      title: '在线考试',
	      breadcrumb: ['首页', '培训与文化', '申安学堂', '在线考试']
	    },
    'three-education': {
      title: '三级教育',
      breadcrumb: ['首页', '培训与文化', '申安学堂', '三级教育']
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
    '事故调查': 'accident-investigation',
    '人员安全管理': 'personnel',
    '场地与设施管理': 'facility',
    '场地信息台账': 'facility-site-ledger',
    '园区综合管理': 'park',
    '寄递安全管理': 'delivery-safety',
    '申安学堂': 'training',
    '数据与分析中心': 'data-center',
    '制度与文档管理': 'document',
    '系统与权限管理': 'system',
    '培训课程库': 'training-course-library',
    '创建课程': 'create-course',
    '宣传资料库': 'publicity-materials-library',
    '上传资料': 'upload-materials',
	    '培训计划': 'training-plan',
	    '创建培训计划': 'training-plan-create',
	    '编辑培训计划': 'training-plan-edit',
	    '培训计划详情': 'training-plan-detail',
	    '在线考试': 'online-exam',
	    '三级教育': 'three-education'
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
        return;
      }

      // Support in-page navigation buttons/links (e.g. "Back" actions)
      const anyNavTarget = e.target.closest('[data-page]');
      if (anyNavTarget && anyNavTarget.dataset && anyNavTarget.dataset.page) {
        navigateTo(anyNavTarget.dataset.page);
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
      case 'emergency-plan':
        mainContent.innerHTML = renderEmergencyPlanPage();
        initEmergencyPlanPage();
        break;
      case 'emergency-drill':
        mainContent.innerHTML = renderEmergencyDrillPage();
        initEmergencyDrillPage();
        break;
      case 'personnel': mainContent.innerHTML = renderPersonnel(); break;
      case 'facility': mainContent.innerHTML = renderFacility(); break;
      case 'facility-site-ledger':
        mainContent.innerHTML = renderFacilitySiteLedger();
        initFacilitySiteLedger();
        break;
      case 'park': mainContent.innerHTML = renderPark(); break;
      case 'delivery-safety': mainContent.innerHTML = renderDeliverySafety(); break;
      case 'accident-report':
        mainContent.innerHTML = renderAccidentReport();
        initAccidentReport();
        break;
      case 'accident-investigation':
        mainContent.innerHTML = renderAccidentInvestigationPage();
        initAccidentInvestigationPage();
        break;
      case 'training':
        mainContent.innerHTML = renderTraining();
        initTraining();
        break;
      case 'training-course-library':
        mainContent.innerHTML = renderTrainingCourseLibrary();
        initTrainingCourseLibrary();
        break;
      case 'create-course':
        mainContent.innerHTML = renderCreateCoursePage();
        initCreateCoursePage();
        break;
      case 'publicity-materials-library':
        mainContent.innerHTML = renderPublicityMaterialsLibrary();
        initPublicityMaterialsLibrary();
        break;
      case 'upload-materials':
        mainContent.innerHTML = renderUploadMaterialsPage();
        initUploadMaterialsPage();
        break;
      case 'training-plan':
        mainContent.innerHTML = renderTrainingPlan();
        initTrainingPlan();
        break;
      case 'training-plan-create':
        mainContent.innerHTML = renderCreateTrainingPlanPage();
        initCreateTrainingPlanPage();
        break;
      case 'training-plan-edit':
        mainContent.innerHTML = renderEditTrainingPlanPage();
        initEditTrainingPlanPage();
        break;
      case 'training-plan-detail':
        mainContent.innerHTML = renderTrainingPlanDetailPage();
        initTrainingPlanDetailPage();
        break;
      case 'online-exam':
        mainContent.innerHTML = renderOnlineExam();
        initOnlineExam();
        break;
      case 'three-education':
        mainContent.innerHTML = renderThreeEducation();
        initThreeEducation();
        break;
      case 'data-center': mainContent.innerHTML = renderDataCenter(); break;
      case 'document': mainContent.innerHTML = renderDocument(); break;
      case 'system': mainContent.innerHTML = renderSystem(); break;
      case 'hazard-report-page': mainContent.innerHTML = renderHazardReportPage(); break;
      case 'accident-statistics':
        mainContent.innerHTML = renderAccidentStatistics();
        initAccidentStatistics();
        break;
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
        buildModuleCard('training', '申安学堂', '安全培训课程管理，宣传资料分发及在线考试考核系统。',
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
                '<th class="lec-col">L</th>' +
                '<th class="lec-col">E</th>' +
                '<th class="lec-col">C</th>' +
                '<th class="lec-col">D</th>' +
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
                '<button class="btn btn-primary" id="selfcheckHazardReportBtn" type="button" style="margin-right: 8px;">' +
                  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></svg>' +
                  '隐患上报' +
                '</button>' +
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
                '<button class="btn btn-primary" id="securityAuditHazardReportBtn" type="button" style="margin-right: 8px;">' +
                  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></svg>' +
                  '隐患上报' +
                '</button>' +
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
                '<button class="btn btn-primary" id="specialInspectionHazardReportBtn" type="button" style="margin-right: 8px;">' +
                  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></svg>' +
                  '隐患上报' +
                '</button>' +
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
    var hazardDeleteMode = false;
    var selectedHazardIds = {};

    loadHazardsFromAPI = function() {
      apiGet('/api/hazards').then(function (rows) {
        hazardReportList = rows.map(dbToFrontend);
        if (hazardReportList.length > 0) {
          hazardIndex = Math.max.apply(null, hazardReportList.map(function(r) { return r.id; })) + 1;
        }
        // 触发各级版块渲染
        if (typeof renderHazardRows === 'function') try { renderHazardRows(); } catch(e) { console.warn('renderHazardRows error:', e); }
        if (typeof renderSelfcheckRows === 'function') try { renderSelfcheckRows(); } catch(e) { console.warn('renderSelfcheckRows error:', e); }
        if (typeof renderSecurityAuditRows === 'function') try { renderSecurityAuditRows(); } catch(e) { console.warn('renderSecurityAuditRows error:', e); }
        if (typeof renderSpecialAuditRows === 'function') try { renderSpecialAuditRows(); } catch(e) { console.warn('renderSpecialAuditRows error:', e); }
      }).catch(function (err) {
        console.error('从API加载隐患数据失败:', err);
      });
    };
    
    loadHazardsFromAPI(); // 执行初始加载项

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

    var selfcheckHazardReportBtn = document.getElementById('selfcheckHazardReportBtn');
    var securityAuditHazardReportBtn = document.getElementById('securityAuditHazardReportBtn');
    var specialInspectionHazardReportBtn = document.getElementById('specialInspectionHazardReportBtn');
    var addBtn = document.getElementById('hazardReportAddBtn');

    var handleHazardReportClick = function (title, subTab) {
      currentHazardSource = { title: title, subTab: subTab };
      renderPage('hazard-report-page');
      if (typeof initHazardReportPage === 'function') initHazardReportPage();
    };

    if (selfcheckHazardReportBtn) selfcheckHazardReportBtn.onclick = function() { handleHazardReportClick('自查自纠', 'selfcheck'); };
    if (securityAuditHazardReportBtn) securityAuditHazardReportBtn.onclick = function() { handleHazardReportClick('安全稽核', 'audit'); };
    if (specialInspectionHazardReportBtn) specialInspectionHazardReportBtn.onclick = function() { handleHazardReportClick('专项稽查', 'special'); };
    if (addBtn) addBtn.onclick = function() { handleHazardReportClick('隐患上报', 'report'); };

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

      // Accident Statistics Filters (List)
      var accArea = document.getElementById('accAreaSelect');
      var accProv = document.getElementById('accProvinceSelect');
      var accCenter = document.getElementById('accCenterSelect');
      if (accArea && accProv) {
          fillFilterProvinces(accArea, accProv, accCenter);
          fillFilterCenters(accProv, accCenter, accArea);
      }

      // Accident Statistics Filters (Analysis)
      var aaArea = document.getElementById('accAnalysisAreaSelect');
      var aaProv = document.getElementById('accAnalysisProvinceSelect');
      var aaCenter = document.getElementById('accAnalysisCenterSelect');
      if (aaArea && aaProv) {
          fillFilterProvinces(aaArea, aaProv, aaCenter);
          fillFilterCenters(aaProv, aaCenter, aaArea);
      }
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


    function loadLocationData() {
      fetchLocationsData().then(function() {
        fillFilterLocationOptions();
        populateHazardCategorySelects();
        renderSelfcheckRows();
      });
    }
    loadLocationData();

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
            '<td class="lec-col">' + L + '</td>' +
            '<td class="lec-col">' + E + '</td>' +
            '<td class="lec-col">' + C + '</td>' +
            '<td class="lec-col">' + D + '</td>' +
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
            '<button class="btn btn-outline" data-page="emergency-plan">预案管理</button>' +
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
            buildFeatureCard('事故调查', '事故原因分析、责任认定与整改跟踪', 'var(--warning-light)', 'var(--warning)', '进行中 1 项', 'accident-investigation') +
            buildFeatureCard('事故统计', '多维度事故数据统计与趋势分析', 'var(--info-light)', 'var(--info)', '累计 23 起', 'accident-statistics') +
          '</div>' +
        '</div>' +

        '<div id="emergencyPanel" class="accident-emergency-panel" style="display:none;">' +
          '<div class="feature-grid">' +
            buildFeatureCard('应急预案', '各类应急预案编制、审核与发布管理', 'var(--primary-light)', 'var(--primary)', '生效预案 15 个', 'emergency-plan') +
            buildFeatureCard('应急处置', '应急响应流程指导与资源调度协调', 'var(--danger-light)', 'var(--danger)', '本月处置 1 次') +
          '</div>' +
        '</div>' +

        '<div id="drillPanel" class="accident-emergency-panel" style="display:none;">' +
          '<div class="feature-grid">' +
            buildFeatureCard('应急演练', '演练计划制定、执行记录与效果评估', 'var(--success-light)', 'var(--success)', '本季度 3 次', 'emergency-drill') +
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

  // ============ 应急预案（轻量版） ============
  function renderEmergencyPlanPage() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">应急预案</div>' +
            '<div class="page-desc">轻量化预案台账：检索、版本、状态与快速维护</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-outline" data-page="accident-emergency">返回</button>' +
            '<button class="btn btn-primary" id="epCreateBtn" type="button">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
              '新建预案' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div class="stats-row" style="margin-bottom:16px;" id="epKpiRow">' +
          buildStatCard('生效预案', '-', 'green', 'epKpiActive') +
          buildStatCard('草稿', '-', 'orange', 'epKpiDraft') +
          buildStatCard('待审核', '-', 'blue', 'epKpiReview') +
          buildStatCard('停用', '-', 'red', 'epKpiDisabled') +
        '</div>' +

        '<div class="data-table-wrapper">' +
          '<div class="table-toolbar">' +
            '<div class="table-toolbar-left">' +
              '<div class="table-filter">' +
                '<span>状态：</span>' +
                '<select id="epStatusFilter">' +
                  '<option value="">全部</option>' +
                  '<option value="生效">生效</option>' +
                  '<option value="草稿">草稿</option>' +
                  '<option value="待审核">待审核</option>' +
                  '<option value="停用">停用</option>' +
                '</select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>类别：</span>' +
                '<select id="epTypeFilter">' +
                  '<option value="">全部</option>' +
                  '<option value="火灾爆炸">火灾爆炸</option>' +
                  '<option value="极端天气">极端天气</option>' +
                  '<option value="交通事故">交通事故</option>' +
                  '<option value="公共卫生">公共卫生</option>' +
                  '<option value="综合">综合</option>' +
                '</select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>等级：</span>' +
                '<select id="epLevelFilter">' +
                  '<option value="">全部</option>' +
                  '<option value="Ⅰ级">Ⅰ级</option>' +
                  '<option value="Ⅱ级">Ⅱ级</option>' +
                  '<option value="Ⅲ级">Ⅲ级</option>' +
                  '<option value="Ⅳ级">Ⅳ级</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="table-search" style="min-width: 260px;">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
              '<input type="text" id="epSearchInput" placeholder="搜索预案名称/版本/范围...">' +
            '</div>' +
          '</div>' +
          '<div class="data-table-scroll">' +
            '<table class="data-table" id="epTable">' +
              '<thead><tr>' +
                '<th style="width:84px;">编号</th>' +
                '<th>预案名称</th>' +
                '<th style="width:110px;">类别</th>' +
                '<th style="width:90px;">等级</th>' +
                '<th>适用范围</th>' +
                '<th style="width:90px;">版本</th>' +
                '<th style="width:100px;">状态</th>' +
                '<th style="width:150px;">更新日期</th>' +
                '<th style="width:220px;">操作</th>' +
              '</tr></thead>' +
              '<tbody id="epTbody">' +
                '<tr><td colspan="9" style="padding: 24px; color: var(--text-tertiary); text-align:center;">加载中...</td></tr>' +
              '</tbody>' +
            '</table>' +
          '</div>' +
          '<div class="table-pagination" style="border-top: 1px solid var(--border);">' +
            '<span id="epTotalText">共 0 条记录</span>' +
            '<div class="pagination-btns" id="epPager"></div>' +
          '</div>' +
        '</div>' +

        // 新建/编辑弹窗
        '<div class="modal-overlay" id="epEditModalOverlay" style="display:none;">' +
          '<div class="modal" style="max-width: 760px;">' +
            '<div class="modal-header">' +
              '<div class="modal-title" id="epEditModalTitle">新建预案</div>' +
              '<button class="modal-close" id="epEditModalClose">' +
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
              '</button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<div class="form-grid">' +
                '<div class="form-field span-2">' +
                  '<label class="form-label required">预案名称</label>' +
                  '<input id="epFormName" type="text" placeholder="例如：转运中心火灾应急预案">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label required">类别</label>' +
                  '<select id="epFormType">' +
                    '<option value="火灾爆炸">火灾爆炸</option>' +
                    '<option value="极端天气">极端天气</option>' +
                    '<option value="交通事故">交通事故</option>' +
                    '<option value="公共卫生">公共卫生</option>' +
                    '<option value="综合">综合</option>' +
                  '</select>' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label required">等级</label>' +
                  '<select id="epFormLevel">' +
                    '<option value="Ⅲ级">Ⅲ级</option>' +
                    '<option value="Ⅱ级">Ⅱ级</option>' +
                    '<option value="Ⅰ级">Ⅰ级</option>' +
                    '<option value="Ⅳ级">Ⅳ级</option>' +
                  '</select>' +
                '</div>' +
                '<div class="form-field span-2">' +
                  '<label class="form-label required">适用范围</label>' +
                  '<input id="epFormScope" type="text" placeholder="例如：华东区域 / 上海青浦转运中心">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label">版本</label>' +
                  '<input id="epFormVersion" type="text" placeholder="v1.0">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label required">状态</label>' +
                  '<select id="epFormStatus">' +
                    '<option value="草稿">草稿</option>' +
                    '<option value="待审核">待审核</option>' +
                    '<option value="生效">生效</option>' +
                    '<option value="停用">停用</option>' +
                  '</select>' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label">责任人</label>' +
                  '<input id="epFormOwner" type="text" placeholder="例如：安全主管">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label">生效日期</label>' +
                  '<input id="epFormEffectiveAt" type="date">' +
                '</div>' +
                '<div class="form-field span-2">' +
                  '<label class="form-label">备注</label>' +
                  '<textarea id="epFormRemark" rows="3" placeholder="可填写关键联系方式、重点动作卡等说明"></textarea>' +
                '</div>' +
                '<div class="form-field span-2">' +
                  '<label class="form-label">预案文件</label>' +
                  '<input id="epFormFile" type="file" style="padding: 10px 12px;" />' +
                  '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:6px;">' +
                    '<div id="epFormFileInfo" style="font-size:12px; color: var(--text-tertiary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">未选择文件</div>' +
                    '<button class="btn btn-outline btn-sm" id="epFormFileClear" type="button" style="display:none;">清除</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<input id="epFormId" type="hidden" value="">' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button class="btn btn-outline" id="epEditModalCancel" type="button">取消</button>' +
              '<button class="btn btn-primary" id="epEditModalSave" type="button">保存</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // 详情弹窗
        '<div class="modal-overlay" id="epDetailModalOverlay" style="display:none;">' +
          '<div class="modal" style="max-width: 760px;">' +
            '<div class="modal-header">' +
              '<div class="modal-title">预案详情</div>' +
              '<button class="modal-close" id="epDetailModalClose">' +
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
              '</button>' +
            '</div>' +
            '<div class="modal-body" id="epDetailBody">' +
              '<div style="color: var(--text-tertiary); text-align:center; padding: 20px 0;">加载中...</div>' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button class="btn btn-outline" id="epDetailModalOk" type="button">关闭</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============ 应急演练（轻量版） ============
  function renderEmergencyDrillPage() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">应急演练</div>' +
            '<div class="page-desc">轻量化演练台账：计划、执行、复盘与资料留存</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-outline" data-page="accident-emergency">返回</button>' +
            '<button class="btn btn-primary" id="edCreateBtn" type="button">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
              '新建演练' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div class="stats-row" style="margin-bottom:16px;" id="edKpiRow">' +
          buildStatCard('本季度演练', '-', 'green', 'edKpiQuarter') +
          buildStatCard('已完成', '-', 'blue', 'edKpiDone') +
          buildStatCard('待执行', '-', 'orange', 'edKpiTodo') +
          buildStatCard('逾期', '-', 'red', 'edKpiOverdue') +
        '</div>' +

        '<div class="data-table-wrapper">' +
          '<div class="table-toolbar">' +
            '<div class="table-toolbar-left">' +
              '<div class="table-filter">' +
                '<span>状态：</span>' +
                '<select id="edStatusFilter">' +
                  '<option value="">全部</option>' +
                  '<option value="计划中">计划中</option>' +
                  '<option value="进行中">进行中</option>' +
                  '<option value="已完成">已完成</option>' +
                  '<option value="取消">取消</option>' +
                '</select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>类型：</span>' +
                '<select id="edTypeFilter">' +
                  '<option value="">全部</option>' +
                  '<option value="桌面推演">桌面推演</option>' +
                  '<option value="实战演练">实战演练</option>' +
                  '<option value="专项演练">专项演练</option>' +
                  '<option value="综合演练">综合演练</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="table-search" style="min-width: 260px;">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
              '<input type="text" id="edSearchInput" placeholder="搜索演练名称/编号/预案/范围...">' +
            '</div>' +
          '</div>' +
          '<div class="data-table-scroll">' +
            '<table class="data-table" id="edTable">' +
              '<thead><tr>' +
                '<th style="width:96px;">编号</th>' +
                '<th>演练名称</th>' +
                '<th style="width:110px;">类型</th>' +
                '<th style="width:180px;">关联预案</th>' +
                '<th style="width:110px;">计划日期</th>' +
                '<th style="width:110px;">状态</th>' +
                '<th style="width:90px;">评分</th>' +
                '<th style="width:150px;">更新日期</th>' +
                '<th style="width:260px;">操作</th>' +
              '</tr></thead>' +
              '<tbody id="edTbody">' +
                '<tr><td colspan="9" style="padding: 24px; color: var(--text-tertiary); text-align:center;">加载中...</td></tr>' +
              '</tbody>' +
            '</table>' +
          '</div>' +
          '<div class="table-pagination" style="border-top: 1px solid var(--border);">' +
            '<span id="edTotalText">共 0 条记录</span>' +
            '<div class="pagination-btns" id="edPager"></div>' +
          '</div>' +
        '</div>' +

        // 新建/编辑弹窗
        '<div class="modal-overlay" id="edEditModalOverlay" style="display:none;">' +
          '<div class="modal" style="max-width: 820px;">' +
            '<div class="modal-header">' +
              '<div class="modal-title" id="edEditModalTitle">新建演练</div>' +
              '<button class="modal-close" id="edEditModalClose">' +
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
              '</button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<div class="form-grid">' +
                '<div class="form-field span-2">' +
                  '<label class="form-label required">演练名称</label>' +
                  '<input id="edFormName" type="text" placeholder="例如：转运中心火灾应急演练（夜班）">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label required">类型</label>' +
                  '<select id="edFormType">' +
                    '<option value="桌面推演">桌面推演</option>' +
                    '<option value="实战演练">实战演练</option>' +
                    '<option value="专项演练">专项演练</option>' +
                    '<option value="综合演练">综合演练</option>' +
                  '</select>' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label">关联预案</label>' +
                  '<select id="edFormPlanId">' +
                    '<option value="">不关联</option>' +
                  '</select>' +
                '</div>' +
                '<div class="form-field span-2">' +
                  '<label class="form-label">演练范围/地点</label>' +
                  '<input id="edFormScope" type="text" placeholder="例如：华东区域 / 上海青浦转运中心">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label required">计划日期</label>' +
                  '<input id="edFormPlannedAt" type="date">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label">实施日期</label>' +
                  '<input id="edFormExecutedAt" type="date">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label required">状态</label>' +
                  '<select id="edFormStatus">' +
                    '<option value="计划中">计划中</option>' +
                    '<option value="进行中">进行中</option>' +
                    '<option value="已完成">已完成</option>' +
                    '<option value="取消">取消</option>' +
                  '</select>' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label">评分</label>' +
                  '<input id="edFormScore" type="number" min="0" max="100" placeholder="0-100">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label">负责人</label>' +
                  '<input id="edFormOwner" type="text" placeholder="例如：应急专员">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label">参与人员</label>' +
                  '<input id="edFormParticipants" type="text" placeholder="例如：安保/叉车/班组长等">' +
                '</div>' +
                '<div class="form-field span-2">' +
                  '<label class="form-label">复盘要点/改进措施</label>' +
                  '<textarea id="edFormReview" rows="3" placeholder="关键问题、整改措施、责任与期限等"></textarea>' +
                '</div>' +
                '<div class="form-field span-2">' +
                  '<label class="form-label">演练资料</label>' +
                  '<input id="edFormFile" type="file" style="padding: 10px 12px;" />' +
                  '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:6px;">' +
                    '<div id="edFormFileInfo" style="font-size:12px; color: var(--text-tertiary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">未选择文件</div>' +
                    '<button class="btn btn-outline btn-sm" id="edFormFileClear" type="button" style="display:none;">清除</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<input id="edFormId" type="hidden" value="">' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button class="btn btn-outline" id="edEditModalCancel" type="button">取消</button>' +
              '<button class="btn btn-primary" id="edEditModalSave" type="button">保存</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // 详情弹窗
        '<div class="modal-overlay" id="edDetailModalOverlay" style="display:none;">' +
          '<div class="modal" style="max-width: 820px;">' +
            '<div class="modal-header">' +
              '<div class="modal-title">演练详情</div>' +
              '<button class="modal-close" id="edDetailModalClose">' +
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
              '</button>' +
            '</div>' +
            '<div class="modal-body" id="edDetailBody">' +
              '<div style="color: var(--text-tertiary); text-align:center; padding: 20px 0;">加载中...</div>' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button class="btn btn-outline" id="edDetailModalOk" type="button">关闭</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============ 事故调查（轻量版） ============
  function renderAccidentInvestigationPage() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">事故调查</div>' +
            '<div class="page-desc">轻量化调查台账：根因分析、责任认定、整改闭环与资料留痕</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-outline" data-page="accident-emergency">返回</button>' +
            '<button class="btn btn-primary" id="aiCreateBtn" type="button">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
              '新建调查' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div class="stats-row" style="margin-bottom:16px;" id="aiKpiRow">' +
          buildStatCard('进行中', '-', 'orange', 'aiKpiOpen') +
          buildStatCard('待复核', '-', 'blue', 'aiKpiReview') +
          buildStatCard('已结案', '-', 'green', 'aiKpiClosed') +
          buildStatCard('超期', '-', 'red', 'aiKpiOverdue') +
        '</div>' +

        '<div class="data-table-wrapper">' +
          '<div class="table-toolbar">' +
            '<div class="table-toolbar-left">' +
              '<div class="table-filter">' +
                '<span>状态：</span>' +
                '<select id="aiStatusFilter">' +
                  '<option value="">全部</option>' +
                  '<option value="调查中">调查中</option>' +
                  '<option value="待复核">待复核</option>' +
                  '<option value="已结案">已结案</option>' +
                  '<option value="已挂起">已挂起</option>' +
                '</select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>等级：</span>' +
                '<select id="aiLevelFilter">' +
                  '<option value="">全部</option>' +
                  '<option value="一般">一般</option>' +
                  '<option value="较大">较大</option>' +
                  '<option value="重大">重大</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="table-search" style="min-width: 280px;">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
              '<input type="text" id="aiSearchInput" placeholder="搜索调查主题/编号/责任单位/事故类型...">' +
            '</div>' +
          '</div>' +
          '<div class="data-table-scroll">' +
            '<table class="data-table" id="aiTable">' +
              '<thead><tr>' +
                '<th style="width:92px;">编号</th>' +
                '<th>调查主题</th>' +
                '<th style="width:110px;">事故类型</th>' +
                '<th style="width:120px;">责任单位</th>' +
                '<th style="width:100px;">状态</th>' +
                '<th style="width:110px;">截止日期</th>' +
                '<th style="width:150px;">更新日期</th>' +
                '<th style="width:260px;">操作</th>' +
              '</tr></thead>' +
              '<tbody id="aiTbody">' +
                '<tr><td colspan="8" style="padding: 24px; color: var(--text-tertiary); text-align:center;">加载中...</td></tr>' +
              '</tbody>' +
            '</table>' +
          '</div>' +
          '<div class="table-pagination" style="border-top: 1px solid var(--border);">' +
            '<span id="aiTotalText">共 0 条记录</span>' +
            '<div class="pagination-btns" id="aiPager"></div>' +
          '</div>' +
        '</div>' +

        '<div class="modal-overlay" id="aiEditModalOverlay" style="display:none;">' +
          '<div class="modal" style="max-width: 860px;">' +
            '<div class="modal-header">' +
              '<div class="modal-title" id="aiEditModalTitle">新建调查</div>' +
              '<button class="modal-close" id="aiEditModalClose">' +
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
              '</button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<div class="form-grid">' +
                '<div class="form-field span-2">' +
                  '<label class="form-label required">调查主题</label>' +
                  '<input id="aiFormTitle" type="text" placeholder="例如：上海青浦转运中心叉车刮碰事故调查">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label required">事故类型</label>' +
                  '<select id="aiFormCategory">' +
                    '<option value="人员伤害">人员伤害</option>' +
                    '<option value="设备事故">设备事故</option>' +
                    '<option value="车辆事故">车辆事故</option>' +
                    '<option value="消防事件">消防事件</option>' +
                    '<option value="其他">其他</option>' +
                  '</select>' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label required">事故等级</label>' +
                  '<select id="aiFormLevel">' +
                    '<option value="一般">一般</option>' +
                    '<option value="较大">较大</option>' +
                    '<option value="重大">重大</option>' +
                  '</select>' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label">责任单位</label>' +
                  '<input id="aiFormDept" type="text" placeholder="例如：上海青浦转运中心">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label">调查负责人</label>' +
                  '<input id="aiFormOwner" type="text" placeholder="例如：安全经理">' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label required">状态</label>' +
                  '<select id="aiFormStatus">' +
                    '<option value="调查中">调查中</option>' +
                    '<option value="待复核">待复核</option>' +
                    '<option value="已结案">已结案</option>' +
                    '<option value="已挂起">已挂起</option>' +
                  '</select>' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label">截止日期</label>' +
                  '<input id="aiFormDueDate" type="date">' +
                '</div>' +
                '<div class="form-field span-2">' +
                  '<label class="form-label">事故经过</label>' +
                  '<textarea id="aiFormSummary" rows="3" placeholder="简要记录事故经过、时间、地点和关键人员"></textarea>' +
                '</div>' +
                '<div class="form-field span-2">' +
                  '<label class="form-label">原因分析</label>' +
                  '<textarea id="aiFormCause" rows="3" placeholder="可填写直接原因、间接原因、管理原因等"></textarea>' +
                '</div>' +
                '<div class="form-field span-2">' +
                  '<label class="form-label">责任认定</label>' +
                  '<textarea id="aiFormResponsibility" rows="3" placeholder="可填写主体责任、管理责任及处理建议"></textarea>' +
                '</div>' +
                '<div class="form-field span-2">' +
                  '<label class="form-label">整改措施</label>' +
                  '<textarea id="aiFormAction" rows="3" placeholder="例如：设备加装防护、重新培训、限时整改等"></textarea>' +
                '</div>' +
                '<div class="form-field span-2">' +
                  '<label class="form-label">调查附件</label>' +
                  '<input id="aiFormFile" type="file" style="padding: 10px 12px;" />' +
                  '<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:6px;">' +
                    '<div id="aiFormFileInfo" style="font-size:12px; color: var(--text-tertiary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">未选择文件</div>' +
                    '<button class="btn btn-outline btn-sm" id="aiFormFileClear" type="button" style="display:none;">清除</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<input id="aiFormId" type="hidden" value="">' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button class="btn btn-outline" id="aiEditModalCancel" type="button">取消</button>' +
              '<button class="btn btn-primary" id="aiEditModalSave" type="button">保存</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="modal-overlay" id="aiDetailModalOverlay" style="display:none;">' +
          '<div class="modal" style="max-width: 860px;">' +
            '<div class="modal-header">' +
              '<div class="modal-title">调查详情</div>' +
              '<button class="modal-close" id="aiDetailModalClose">' +
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
              '</button>' +
            '</div>' +
            '<div class="modal-body" id="aiDetailBody">' +
              '<div style="color: var(--text-tertiary); text-align:center; padding: 20px 0;">加载中...</div>' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button class="btn btn-outline" id="aiDetailModalOk" type="button">关闭</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function initEmergencyPlanPage() {
    var STORE_KEY = 'sd_emergency_plans_v1';
    var pageSize = 8;
    var currentPage = 1;
    var allRows = [];

    var tbody = document.getElementById('epTbody');
    var pager = document.getElementById('epPager');
    var totalText = document.getElementById('epTotalText');

    var statusFilter = document.getElementById('epStatusFilter');
    var typeFilter = document.getElementById('epTypeFilter');
    var levelFilter = document.getElementById('epLevelFilter');
    var searchInput = document.getElementById('epSearchInput');

    var createBtn = document.getElementById('epCreateBtn');

    var editOverlay = document.getElementById('epEditModalOverlay');
    var editTitle = document.getElementById('epEditModalTitle');
    var editClose = document.getElementById('epEditModalClose');
    var editCancel = document.getElementById('epEditModalCancel');
    var editSave = document.getElementById('epEditModalSave');

    var formId = document.getElementById('epFormId');
    var formName = document.getElementById('epFormName');
    var formType = document.getElementById('epFormType');
    var formLevel = document.getElementById('epFormLevel');
    var formScope = document.getElementById('epFormScope');
    var formVersion = document.getElementById('epFormVersion');
    var formStatus = document.getElementById('epFormStatus');
    var formOwner = document.getElementById('epFormOwner');
    var formEffectiveAt = document.getElementById('epFormEffectiveAt');
    var formRemark = document.getElementById('epFormRemark');
    var formFile = document.getElementById('epFormFile');
    var formFileInfo = document.getElementById('epFormFileInfo');
    var formFileClear = document.getElementById('epFormFileClear');

    var detailOverlay = document.getElementById('epDetailModalOverlay');
    var detailBody = document.getElementById('epDetailBody');
    var detailClose = document.getElementById('epDetailModalClose');
    var detailOk = document.getElementById('epDetailModalOk');

    var pendingFileMeta = null; // { name, type, size, dataUrl, uploadedAt }
    var keepExistingFile = null;
    var fileReading = false;

    function safeJsonParse(text) {
      try { return JSON.parse(text); } catch (e) { return null; }
    }

    function pad2(n) { return String(n).padStart(2, '0'); }

    function humanFileSize(bytes) {
      if (!bytes && bytes !== 0) return '-';
      var n = Number(bytes);
      if (isNaN(n) || n < 0) return '-';
      if (n < 1024) return n + ' B';
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
      if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
      return (n / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    function setFileInfoText(text) {
      if (formFileInfo) formFileInfo.textContent = text || '';
    }

    function setFileClearVisible(visible) {
      if (!formFileClear) return;
      formFileClear.style.display = visible ? 'inline-flex' : 'none';
    }

    function resetFileState() {
      pendingFileMeta = null;
      keepExistingFile = null;
      fileReading = false;
      if (formFile) formFile.value = '';
      setFileInfoText('未选择文件');
      setFileClearVisible(false);
    }

    function formatTime(ts) {
      if (!ts) return '-';
      try {
        var d = new Date(ts);
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
      } catch (e) {
        return '-';
      }
    }

    function getSeedRows() {
      var now = Date.now();
      return [
        { id: 'EP-202601-001', name: '转运中心火灾应急预案', type: '火灾爆炸', level: 'Ⅱ级', scope: '华东区域 / 上海青浦转运中心', version: 'v1.2', status: '生效', owner: '安全主管', effectiveAt: '2026-01-15', remark: '重点：夜班值守、疏散集合点、消防水源', updatedAt: now - 86400000 * 12 },
        { id: 'EP-202602-002', name: '强对流天气应急预案', type: '极端天气', level: 'Ⅲ级', scope: '华中区域 / 多中心通用', version: 'v1.0', status: '生效', owner: '应急专员', effectiveAt: '2026-02-06', remark: '关注雷暴大风、短时强降雨', updatedAt: now - 86400000 * 8 },
        { id: 'EP-202603-003', name: '车辆事故应急预案（干线）', type: '交通事故', level: 'Ⅲ级', scope: '干线运输 / 全国通用', version: 'v1.1', status: '待审核', owner: '运输经理', effectiveAt: '', remark: '事故上报链路、现场处置与联络机制', updatedAt: now - 86400000 * 5 },
        { id: 'EP-202603-004', name: '公共卫生突发事件应急预案', type: '公共卫生', level: 'Ⅳ级', scope: '办公区 / 现场作业区', version: 'v1.0', status: '草稿', owner: '行政', effectiveAt: '', remark: '隔离区、消杀、人员健康监测', updatedAt: now - 86400000 * 3 },
        { id: 'EP-202512-005', name: '综合应急预案（公司级）', type: '综合', level: 'Ⅰ级', scope: '公司级 / 全区域', version: 'v2.0', status: '生效', owner: '安委办', effectiveAt: '2025-12-20', remark: '统一指挥体系与信息报送口径', updatedAt: now - 86400000 * 40 },
        { id: 'EP-202411-006', name: '仓储区火灾应急预案（旧版）', type: '火灾爆炸', level: 'Ⅲ级', scope: '华南区域 / 广州花都转运中心', version: 'v0.9', status: '停用', owner: '安全员', effectiveAt: '2024-11-02', remark: '已被新版替代', updatedAt: now - 86400000 * 120 }
      ];
    }

    function loadRows() {
      var raw = localStorage.getItem(STORE_KEY);
      var parsed = raw ? safeJsonParse(raw) : null;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        allRows = getSeedRows();
        localStorage.setItem(STORE_KEY, JSON.stringify(allRows));
        return;
      }
      allRows = parsed;
    }

    function saveRows() {
      localStorage.setItem(STORE_KEY, JSON.stringify(allRows));
    }

    function statusBadge(status) {
      var cls = 'status-badge info';
      if (status === '生效') cls = 'status-badge success';
      else if (status === '草稿') cls = 'status-badge warning';
      else if (status === '待审核') cls = 'status-badge info';
      else if (status === '停用') cls = 'status-badge danger';
      return '<span class="' + cls + '">' + escapeHtml(status) + '</span>';
    }

    function calcCounts(rows) {
      var counts = { '生效': 0, '草稿': 0, '待审核': 0, '停用': 0 };
      rows.forEach(function (r) {
        if (counts.hasOwnProperty(r.status)) counts[r.status] += 1;
      });
      return counts;
    }

    function updateKpis(counts) {
      var a = document.getElementById('epKpiActive');
      var d = document.getElementById('epKpiDraft');
      var r = document.getElementById('epKpiReview');
      var x = document.getElementById('epKpiDisabled');
      if (a) a.textContent = String(counts['生效'] || 0);
      if (d) d.textContent = String(counts['草稿'] || 0);
      if (r) r.textContent = String(counts['待审核'] || 0);
      if (x) x.textContent = String(counts['停用'] || 0);
    }

    function getFilters() {
      var s = (statusFilter && statusFilter.value) ? statusFilter.value : '';
      var t = (typeFilter && typeFilter.value) ? typeFilter.value : '';
      var l = (levelFilter && levelFilter.value) ? levelFilter.value : '';
      var q = (searchInput && searchInput.value) ? String(searchInput.value).trim().toLowerCase() : '';
      return { status: s, type: t, level: l, q: q };
    }

    function matches(row, f) {
      if (f.status && row.status !== f.status) return false;
      if (f.type && row.type !== f.type) return false;
      if (f.level && row.level !== f.level) return false;
      if (f.q) {
        var hay = [row.id, row.name, row.scope, row.version, row.owner].join(' ').toLowerCase();
        if (hay.indexOf(f.q) === -1) return false;
      }
      return true;
    }

    function renderPager(total) {
      if (!pager) return;
      var totalPages = Math.max(1, Math.ceil(total / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      var html = '';
      function btn(label, page, active, disabled) {
        return '<button class="pagination-btn' + (active ? ' active' : '') + '" data-page="' + page + '" ' + (disabled ? 'disabled' : '') + '>' + label + '</button>';
      }
      html += btn('&lt;', currentPage - 1, false, currentPage <= 1);
      var start = Math.max(1, currentPage - 2);
      var end = Math.min(totalPages, start + 4);
      start = Math.max(1, end - 4);
      for (var p = start; p <= end; p++) html += btn(String(p), p, p === currentPage, false);
      html += btn('&gt;', currentPage + 1, false, currentPage >= totalPages);
      pager.innerHTML = html;
    }

    function renderTable() {
      loadRows();
      var f = getFilters();
      var filtered = allRows.filter(function (r) { return matches(r, f); });
      var total = filtered.length;
      var counts = calcCounts(allRows);
      updateKpis(counts);

      if (totalText) totalText.textContent = '共 ' + total + ' 条记录';
      renderPager(total);

      var startIdx = (currentPage - 1) * pageSize;
      var pageRows = filtered.slice(startIdx, startIdx + pageSize);
      if (!tbody) return;

      if (pageRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="padding: 24px; color: var(--text-tertiary); text-align:center;">暂无数据</td></tr>';
        return;
      }

      tbody.innerHTML = pageRows.map(function (r) {
        var canDownload = !!(r && r.file && r.file.dataUrl);
        return '' +
          '<tr data-id="' + escapeHtml(r.id) + '">' +
            '<td>' + escapeHtml(r.id) + '</td>' +
            '<td style="min-width:220px;">' + escapeHtml(r.name) + '</td>' +
            '<td>' + escapeHtml(r.type) + '</td>' +
            '<td>' + escapeHtml(r.level) + '</td>' +
            '<td style="min-width:240px;">' + escapeHtml(r.scope) + '</td>' +
            '<td>' + escapeHtml(r.version || '-') + '</td>' +
            '<td>' + statusBadge(r.status) + '</td>' +
            '<td>' + escapeHtml(formatTime(r.updatedAt)) + '</td>' +
            '<td style="white-space:nowrap;">' +
              '<button class="btn btn-outline btn-sm" type="button" data-action="view">查看</button>' +
              '<button class="btn btn-outline btn-sm" type="button" data-action="edit" style="margin-left:6px;">编辑</button>' +
              '<button class="btn btn-outline btn-sm" type="button" data-action="download" style="margin-left:6px;" ' + (canDownload ? '' : 'disabled') + '>下载</button>' +
              '<button class="btn btn-outline btn-sm" type="button" data-action="delete" style="margin-left:6px;">删除</button>' +
            '</td>' +
          '</tr>';
      }).join('');
    }

    function openEditModal(mode, row) {
      if (!editOverlay) return;
      editTitle.textContent = mode === 'edit' ? '编辑预案' : '新建预案';
      formId.value = row ? (row.id || '') : '';
      formName.value = row ? (row.name || '') : '';
      formType.value = row ? (row.type || '火灾爆炸') : '火灾爆炸';
      formLevel.value = row ? (row.level || 'Ⅲ级') : 'Ⅲ级';
      formScope.value = row ? (row.scope || '') : '';
      formVersion.value = row ? (row.version || '') : 'v1.0';
      formStatus.value = row ? (row.status || '草稿') : '草稿';
      formOwner.value = row ? (row.owner || '') : '';
      formEffectiveAt.value = row ? (row.effectiveAt || '') : '';
      formRemark.value = row ? (row.remark || '') : '';
      pendingFileMeta = null;
      keepExistingFile = (row && row.file) ? row.file : null;
      fileReading = false;
      if (formFile) formFile.value = '';
      if (keepExistingFile && keepExistingFile.name) {
        setFileInfoText('已上传：' + keepExistingFile.name + (keepExistingFile.size ? ('（' + humanFileSize(keepExistingFile.size) + '）') : ''));
        setFileClearVisible(true);
      } else {
        setFileInfoText('未选择文件');
        setFileClearVisible(false);
      }
      editOverlay.style.display = 'flex';
      setTimeout(function () { try { formName.focus(); } catch (e) {} }, 0);
    }

    function closeEditModal() {
      if (editOverlay) editOverlay.style.display = 'none';
    }

    function openDetailModal(row) {
      if (!detailOverlay || !detailBody) return;
      var html = '' +
        '<div class="panel" style="margin:0;">' +
          '<div class="panel-body">' +
            '<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">' +
              '<div>' +
                '<div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">' + escapeHtml(row.name) + '</div>' +
                '<div style="font-size:12.5px;color:var(--text-tertiary);">编号：' + escapeHtml(row.id) + ' · 版本：' + escapeHtml(row.version || '-') + '</div>' +
              '</div>' +
              '<div>' + statusBadge(row.status) + '</div>' +
            '</div>' +
            '<div style="margin-top:14px;" class="form-grid">' +
              '<div class="form-field"><div class="form-label">类别</div><div>' + escapeHtml(row.type) + '</div></div>' +
              '<div class="form-field"><div class="form-label">等级</div><div>' + escapeHtml(row.level) + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">适用范围</div><div>' + escapeHtml(row.scope) + '</div></div>' +
              '<div class="form-field"><div class="form-label">责任人</div><div>' + escapeHtml(row.owner || '-') + '</div></div>' +
              '<div class="form-field"><div class="form-label">生效日期</div><div>' + escapeHtml(row.effectiveAt || '-') + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">备注</div><div style="white-space:pre-wrap; color: var(--text-secondary);">' + escapeHtml(row.remark || '-') + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">最近更新</div><div>' + escapeHtml(formatTime(row.updatedAt)) + '</div></div>' +
            '</div>' +
          '</div>' +
        '</div>';
      detailBody.innerHTML = html;
      detailOverlay.style.display = 'flex';
    }

    function closeDetailModal() {
      if (detailOverlay) detailOverlay.style.display = 'none';
    }

    function ensureRequired() {
      if (!String(formName.value || '').trim()) return '请填写预案名称';
      if (!String(formScope.value || '').trim()) return '请填写适用范围';
      return '';
    }

    function makeId() {
      var d = new Date();
      var y = d.getFullYear();
      var m = pad2(d.getMonth() + 1);
      var suffix = String(Math.floor(Math.random() * 900) + 100);
      return 'EP-' + y + m + '-' + suffix;
    }

    function saveForm() {
      var err = ensureRequired();
      if (err) { alert(err); return; }
      if (fileReading) { alert('文件读取中，请稍候再保存'); return; }
      loadRows();
      var id = String(formId.value || '').trim();
      var now = Date.now();
      var fileToSave = pendingFileMeta ? pendingFileMeta : keepExistingFile;
      var payload = {
        id: id || makeId(),
        name: String(formName.value || '').trim(),
        type: String(formType.value || '').trim(),
        level: String(formLevel.value || '').trim(),
        scope: String(formScope.value || '').trim(),
        version: String(formVersion.value || '').trim(),
        status: String(formStatus.value || '').trim(),
        owner: String(formOwner.value || '').trim(),
        effectiveAt: String(formEffectiveAt.value || '').trim(),
        remark: String(formRemark.value || '').trim(),
        file: fileToSave || null,
        updatedAt: now
      };
      var idx = allRows.findIndex(function (r) { return String(r.id) === String(payload.id); });
      if (idx >= 0) allRows[idx] = payload;
      else allRows.unshift(payload);
      saveRows();
      closeEditModal();
      renderTable();
    }

    function handleTableAction(action, id) {
      loadRows();
      var row = allRows.find(function (r) { return String(r.id) === String(id); });
      if (!row) return;
      if (action === 'view') openDetailModal(row);
      else if (action === 'edit') openEditModal('edit', row);
      else if (action === 'download') {
        if (!row.file || !row.file.dataUrl) { alert('该预案未上传文件'); return; }
        var a = document.createElement('a');
        a.href = row.file.dataUrl;
        a.download = row.file.name || (row.name ? (row.name + '.file') : '预案文件');
        a.style.display = 'none';
        document.body.appendChild(a);
        try { a.click(); } finally { setTimeout(function () { try { document.body.removeChild(a); } catch (e) {} }, 0); }
      }
      else if (action === 'delete') {
        if (!confirm('确认删除：' + row.name + ' ?')) return;
        allRows = allRows.filter(function (r) { return String(r.id) !== String(id); });
        saveRows();
        renderTable();
      }
    }

    // 事件绑定
    if (createBtn) createBtn.addEventListener('click', function () { openEditModal('add', null); });
    [statusFilter, typeFilter, levelFilter].forEach(function (el) {
      if (!el) return;
      el.addEventListener('change', function () { currentPage = 1; renderTable(); });
    });
    if (searchInput) {
      var timer = null;
      searchInput.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { currentPage = 1; renderTable(); }, 150);
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { currentPage = 1; renderTable(); }
      });
    }
    if (pager) {
      pager.addEventListener('click', function (e) {
        var btn = e.target.closest('button.pagination-btn');
        if (!btn || btn.disabled) return;
        var p = parseInt(btn.dataset.page, 10);
        if (!isNaN(p) && p >= 1) {
          currentPage = p;
          renderTable();
        }
      });
    }
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-action]');
        if (!btn) return;
        var tr = e.target.closest('tr[data-id]');
        if (!tr) return;
        var id = tr.getAttribute('data-id');
        var action = btn.getAttribute('data-action');
        handleTableAction(action, id);
      });
    }

    if (editClose) editClose.addEventListener('click', closeEditModal);
    if (editCancel) editCancel.addEventListener('click', closeEditModal);
    if (editOverlay) editOverlay.addEventListener('click', function (e) { if (e.target === editOverlay) closeEditModal(); });
    if (editSave) editSave.addEventListener('click', saveForm);
    if (formFile) {
      formFile.addEventListener('change', function () {
        var f = (formFile.files && formFile.files[0]) ? formFile.files[0] : null;
        if (!f) {
          pendingFileMeta = null;
          fileReading = false;
          if (keepExistingFile && keepExistingFile.name) {
            setFileInfoText('已上传：' + keepExistingFile.name + (keepExistingFile.size ? ('（' + humanFileSize(keepExistingFile.size) + '）') : ''));
            setFileClearVisible(true);
          } else {
            setFileInfoText('未选择文件');
            setFileClearVisible(false);
          }
          return;
        }
        fileReading = true;
        pendingFileMeta = null;
        setFileInfoText('读取中：' + f.name);
        setFileClearVisible(true);
        var reader = new FileReader();
        reader.onload = function () {
          fileReading = false;
          keepExistingFile = null;
          pendingFileMeta = {
            name: f.name,
            type: f.type || 'application/octet-stream',
            size: f.size,
            dataUrl: reader.result,
            uploadedAt: Date.now()
          };
          setFileInfoText('已选择：' + f.name + '（' + humanFileSize(f.size) + '）');
        };
        reader.onerror = function () {
          fileReading = false;
          pendingFileMeta = null;
          alert('文件读取失败，请重试');
          if (formFile) formFile.value = '';
          if (keepExistingFile && keepExistingFile.name) {
            setFileInfoText('已上传：' + keepExistingFile.name + (keepExistingFile.size ? ('（' + humanFileSize(keepExistingFile.size) + '）') : ''));
            setFileClearVisible(true);
          } else {
            setFileInfoText('未选择文件');
            setFileClearVisible(false);
          }
        };
        try { reader.readAsDataURL(f); } catch (e) {
          fileReading = false;
          pendingFileMeta = null;
          alert('文件读取失败，请重试');
          if (formFile) formFile.value = '';
          setFileInfoText('未选择文件');
          setFileClearVisible(false);
        }
      });
    }
    if (formFileClear) {
      formFileClear.addEventListener('click', function () {
        pendingFileMeta = null;
        keepExistingFile = null;
        fileReading = false;
        if (formFile) formFile.value = '';
        setFileInfoText('未选择文件');
        setFileClearVisible(false);
      });
    }

    if (detailClose) detailClose.addEventListener('click', closeDetailModal);
    if (detailOk) detailOk.addEventListener('click', closeDetailModal);
    if (detailOverlay) detailOverlay.addEventListener('click', function (e) { if (e.target === detailOverlay) closeDetailModal(); });

    // 首次渲染
    renderTable();
  }

  function initEmergencyDrillPage() {
    var STORE_KEY = 'sd_emergency_drills_v1';
    var PLAN_STORE_KEY = 'sd_emergency_plans_v1';
    var pageSize = 8;
    var currentPage = 1;
    var allRows = [];

    var createBtn = document.getElementById('edCreateBtn');
    var statusFilter = document.getElementById('edStatusFilter');
    var typeFilter = document.getElementById('edTypeFilter');
    var searchInput = document.getElementById('edSearchInput');

    var tbody = document.getElementById('edTbody');
    var pager = document.getElementById('edPager');
    var totalText = document.getElementById('edTotalText');

    var editOverlay = document.getElementById('edEditModalOverlay');
    var editTitle = document.getElementById('edEditModalTitle');
    var editClose = document.getElementById('edEditModalClose');
    var editCancel = document.getElementById('edEditModalCancel');
    var editSave = document.getElementById('edEditModalSave');

    var formId = document.getElementById('edFormId');
    var formName = document.getElementById('edFormName');
    var formType = document.getElementById('edFormType');
    var formPlanId = document.getElementById('edFormPlanId');
    var formScope = document.getElementById('edFormScope');
    var formPlannedAt = document.getElementById('edFormPlannedAt');
    var formExecutedAt = document.getElementById('edFormExecutedAt');
    var formStatus = document.getElementById('edFormStatus');
    var formScore = document.getElementById('edFormScore');
    var formOwner = document.getElementById('edFormOwner');
    var formParticipants = document.getElementById('edFormParticipants');
    var formReview = document.getElementById('edFormReview');
    var formFile = document.getElementById('edFormFile');
    var formFileInfo = document.getElementById('edFormFileInfo');
    var formFileClear = document.getElementById('edFormFileClear');

    var detailOverlay = document.getElementById('edDetailModalOverlay');
    var detailBody = document.getElementById('edDetailBody');
    var detailClose = document.getElementById('edDetailModalClose');
    var detailOk = document.getElementById('edDetailModalOk');

    var pendingFileMeta = null; // { name, type, size, dataUrl, uploadedAt }
    var keepExistingFile = null;
    var fileReading = false;

    function safeJsonParse(text) {
      try { return JSON.parse(text); } catch (e) { return null; }
    }

    function pad2(n) { return String(n).padStart(2, '0'); }

    function formatTime(ts) {
      if (!ts) return '-';
      try {
        var d = new Date(ts);
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
      } catch (e) {
        return '-';
      }
    }

    function ymdToDate(ymd) {
      if (!ymd) return null;
      var s = String(ymd).trim();
      if (!s) return null;
      var d = new Date(s + 'T00:00:00');
      if (isNaN(d.getTime())) return null;
      return d;
    }

    function humanFileSize(bytes) {
      if (!bytes && bytes !== 0) return '-';
      var n = Number(bytes);
      if (isNaN(n) || n < 0) return '-';
      if (n < 1024) return n + ' B';
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
      if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
      return (n / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    function setFileInfoText(text) {
      if (formFileInfo) formFileInfo.textContent = text || '';
    }

    function setFileClearVisible(visible) {
      if (!formFileClear) return;
      formFileClear.style.display = visible ? 'inline-flex' : 'none';
    }

    function resetFileState() {
      pendingFileMeta = null;
      keepExistingFile = null;
      fileReading = false;
      if (formFile) formFile.value = '';
      setFileInfoText('未选择文件');
      setFileClearVisible(false);
    }

    function getSeedRows() {
      var now = Date.now();
      var today = new Date();
      var y = today.getFullYear();
      var m = pad2(today.getMonth() + 1);
      var d = pad2(today.getDate());
      var todayYmd = y + '-' + m + '-' + d;
      var lastWeek = new Date(today.getTime() - 86400000 * 7);
      var nextWeek = new Date(today.getTime() + 86400000 * 7);
      function fmtDate(dt) { return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate()); }
      return [
        { id: 'ED-' + y + m + '-001', name: '转运中心火灾应急演练（夜班）', type: '实战演练', planId: '', planName: '转运中心火灾应急预案', scope: '上海青浦转运中心', plannedAt: fmtDate(nextWeek), executedAt: '', status: '计划中', score: '', owner: '应急专员', participants: '安保/叉车/班组长', review: '', file: null, updatedAt: now - 86400000 * 2 },
        { id: 'ED-' + y + m + '-002', name: '强对流天气桌面推演', type: '桌面推演', planId: '', planName: '强对流天气应急预案', scope: '华中区域 / 多中心通用', plannedAt: todayYmd, executedAt: todayYmd, status: '已完成', score: '88', owner: '应急专员', participants: '运营/安全/值班长', review: '优化预警阈值与停运口径，补齐通讯录。', file: null, updatedAt: now - 86400000 * 1 },
        { id: 'ED-' + y + m + '-003', name: '车辆事故专项演练（干线）', type: '专项演练', planId: '', planName: '车辆事故应急预案（干线）', scope: '干线运输 / 全国通用', plannedAt: fmtDate(lastWeek), executedAt: '', status: '计划中', score: '', owner: '运输经理', participants: '调度/司机/客服', review: '', file: null, updatedAt: now - 86400000 * 5 }
      ];
    }

    function loadRows() {
      var raw = localStorage.getItem(STORE_KEY);
      var parsed = raw ? safeJsonParse(raw) : null;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        allRows = getSeedRows();
        localStorage.setItem(STORE_KEY, JSON.stringify(allRows));
        return;
      }
      allRows = parsed;
    }

    function saveRows() {
      localStorage.setItem(STORE_KEY, JSON.stringify(allRows));
    }

    function statusBadge(status) {
      var cls = 'status-badge info';
      if (status === '已完成') cls = 'status-badge success';
      else if (status === '计划中') cls = 'status-badge warning';
      else if (status === '进行中') cls = 'status-badge info';
      else if (status === '取消') cls = 'status-badge danger';
      return '<span class="' + cls + '">' + escapeHtml(status) + '</span>';
    }

    function refreshPlanOptions(selectedId) {
      if (!formPlanId) return;
      var raw = localStorage.getItem(PLAN_STORE_KEY);
      var parsed = raw ? safeJsonParse(raw) : null;
      var plans = Array.isArray(parsed) ? parsed : [];
      var opts = '<option value="">不关联</option>';
      plans.forEach(function (p) {
        if (!p || !p.id) return;
        var label = String(p.name || p.id);
        var ver = p.version ? (' · ' + p.version) : '';
        opts += '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(label + ver) + '</option>';
      });
      formPlanId.innerHTML = opts;
      if (selectedId) formPlanId.value = String(selectedId);
    }

    function getQuarterRange(date) {
      var d = date instanceof Date ? date : new Date();
      var y = d.getFullYear();
      var qStartMonth = Math.floor(d.getMonth() / 3) * 3;
      var start = new Date(y, qStartMonth, 1);
      var end = new Date(y, qStartMonth + 3, 0);
      return { start: start, end: end };
    }

    function updateKpis(rows) {
      var kQuarter = document.getElementById('edKpiQuarter');
      var kDone = document.getElementById('edKpiDone');
      var kTodo = document.getElementById('edKpiTodo');
      var kOverdue = document.getElementById('edKpiOverdue');

      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var qr = getQuarterRange(today);

      var quarterTotal = 0;
      var done = 0;
      var todo = 0;
      var overdue = 0;

      rows.forEach(function (r) {
        if (!r) return;
        if (String(r.status) === '已完成') done += 1;
        if (String(r.status) === '计划中') todo += 1;
        var p = ymdToDate(r.plannedAt);
        if (p && p >= qr.start && p <= qr.end) quarterTotal += 1;
        if (String(r.status) === '计划中' && p && p < today) overdue += 1;
      });

      if (kQuarter) kQuarter.textContent = String(quarterTotal);
      if (kDone) kDone.textContent = String(done);
      if (kTodo) kTodo.textContent = String(todo);
      if (kOverdue) kOverdue.textContent = String(overdue);
    }

    function getFilters() {
      var s = (statusFilter && statusFilter.value) ? statusFilter.value : '';
      var t = (typeFilter && typeFilter.value) ? typeFilter.value : '';
      var q = (searchInput && searchInput.value) ? String(searchInput.value).trim().toLowerCase() : '';
      return { status: s, type: t, q: q };
    }

    function matches(row, f) {
      if (f.status && String(row.status) !== f.status) return false;
      if (f.type && String(row.type) !== f.type) return false;
      if (f.q) {
        var hay = [row.id, row.name, row.scope, row.planName, row.owner, row.participants].join(' ').toLowerCase();
        if (hay.indexOf(f.q) === -1) return false;
      }
      return true;
    }

    function renderPager(total) {
      if (!pager) return;
      var totalPages = Math.max(1, Math.ceil(total / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      var html = '';
      function btn(label, page, active, disabled) {
        return '<button class="pagination-btn' + (active ? ' active' : '') + '" data-page="' + page + '" ' + (disabled ? 'disabled' : '') + '>' + label + '</button>';
      }
      html += btn('&lt;', currentPage - 1, false, currentPage <= 1);
      var start = Math.max(1, currentPage - 2);
      var end = Math.min(totalPages, start + 4);
      start = Math.max(1, end - 4);
      for (var p = start; p <= end; p++) html += btn(String(p), p, p === currentPage, false);
      html += btn('&gt;', currentPage + 1, false, currentPage >= totalPages);
      pager.innerHTML = html;
    }

    function renderTable() {
      loadRows();
      updateKpis(allRows);
      var f = getFilters();
      var filtered = allRows.filter(function (r) { return matches(r, f); });
      var total = filtered.length;
      if (totalText) totalText.textContent = '共 ' + total + ' 条记录';
      renderPager(total);

      var startIdx = (currentPage - 1) * pageSize;
      var pageRows = filtered.slice(startIdx, startIdx + pageSize);
      if (!tbody) return;
      if (pageRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="padding: 24px; color: var(--text-tertiary); text-align:center;">暂无数据</td></tr>';
        return;
      }

      tbody.innerHTML = pageRows.map(function (r) {
        var hasFile = !!(r && r.file && r.file.dataUrl);
        var scoreText = (r.score == null || String(r.score).trim() === '') ? '-' : String(r.score).trim();
        return '' +
          '<tr data-id="' + escapeHtml(r.id) + '">' +
            '<td>' + escapeHtml(r.id) + '</td>' +
            '<td style="min-width:220px;">' + escapeHtml(r.name) + '</td>' +
            '<td>' + escapeHtml(r.type || '-') + '</td>' +
            '<td style="min-width:180px;">' + escapeHtml(r.planName || '-') + '</td>' +
            '<td>' + escapeHtml(r.plannedAt || '-') + '</td>' +
            '<td>' + statusBadge(r.status) + '</td>' +
            '<td>' + escapeHtml(scoreText) + '</td>' +
            '<td>' + escapeHtml(formatTime(r.updatedAt)) + '</td>' +
            '<td style="white-space:nowrap;">' +
              '<button class="btn btn-outline btn-sm" type="button" data-action="view">查看</button>' +
              '<button class="btn btn-outline btn-sm" type="button" data-action="edit" style="margin-left:6px;">编辑</button>' +
              '<button class="btn btn-outline btn-sm" type="button" data-action="download" style="margin-left:6px;" ' + (hasFile ? '' : 'disabled') + '>下载</button>' +
              '<button class="btn btn-outline btn-sm" type="button" data-action="delete" style="margin-left:6px;">删除</button>' +
            '</td>' +
          '</tr>';
      }).join('');
    }

    function openEditModal(mode, row) {
      if (!editOverlay) return;
      editTitle.textContent = mode === 'edit' ? '编辑演练' : '新建演练';

      refreshPlanOptions(row ? row.planId : '');

      formId.value = row ? (row.id || '') : '';
      formName.value = row ? (row.name || '') : '';
      formType.value = row ? (row.type || '桌面推演') : '桌面推演';
      formScope.value = row ? (row.scope || '') : '';
      formPlannedAt.value = row ? (row.plannedAt || '') : '';
      formExecutedAt.value = row ? (row.executedAt || '') : '';
      formStatus.value = row ? (row.status || '计划中') : '计划中';
      formScore.value = row ? (row.score || '') : '';
      formOwner.value = row ? (row.owner || '') : '';
      formParticipants.value = row ? (row.participants || '') : '';
      formReview.value = row ? (row.review || '') : '';

      pendingFileMeta = null;
      keepExistingFile = (row && row.file) ? row.file : null;
      fileReading = false;
      if (formFile) formFile.value = '';
      if (keepExistingFile && keepExistingFile.name) {
        setFileInfoText('已上传：' + keepExistingFile.name + (keepExistingFile.size ? ('（' + humanFileSize(keepExistingFile.size) + '）') : ''));
        setFileClearVisible(true);
      } else {
        setFileInfoText('未选择文件');
        setFileClearVisible(false);
      }

      editOverlay.style.display = 'flex';
      setTimeout(function () { try { formName.focus(); } catch (e) {} }, 0);
    }

    function closeEditModal() {
      if (editOverlay) editOverlay.style.display = 'none';
      resetFileState();
    }

    function openDetailModal(row) {
      if (!detailOverlay || !detailBody) return;
      var fileLine = '-';
      if (row.file && row.file.name && row.file.dataUrl) {
        fileLine = '<button class="btn btn-outline btn-sm" type="button" data-action="download" data-id="' + escapeHtml(row.id) + '">下载：' + escapeHtml(row.file.name) + '</button>';
      }
      var scoreText = (row.score == null || String(row.score).trim() === '') ? '-' : String(row.score).trim();
      var html = '' +
        '<div class="panel" style="margin:0;">' +
          '<div class="panel-body">' +
            '<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">' +
              '<div>' +
                '<div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">' + escapeHtml(row.name) + '</div>' +
                '<div style="font-size:12.5px;color:var(--text-tertiary);">编号：' + escapeHtml(row.id) + ' · 类型：' + escapeHtml(row.type || '-') + '</div>' +
              '</div>' +
              '<div>' + statusBadge(row.status) + '</div>' +
            '</div>' +
            '<div style="margin-top:14px;" class="form-grid">' +
              '<div class="form-field"><div class="form-label">关联预案</div><div>' + escapeHtml(row.planName || '-') + '</div></div>' +
              '<div class="form-field"><div class="form-label">评分</div><div>' + escapeHtml(scoreText) + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">演练范围/地点</div><div>' + escapeHtml(row.scope || '-') + '</div></div>' +
              '<div class="form-field"><div class="form-label">计划日期</div><div>' + escapeHtml(row.plannedAt || '-') + '</div></div>' +
              '<div class="form-field"><div class="form-label">实施日期</div><div>' + escapeHtml(row.executedAt || '-') + '</div></div>' +
              '<div class="form-field"><div class="form-label">负责人</div><div>' + escapeHtml(row.owner || '-') + '</div></div>' +
              '<div class="form-field"><div class="form-label">参与人员</div><div>' + escapeHtml(row.participants || '-') + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">复盘要点/改进措施</div><div style="white-space:pre-wrap; color: var(--text-secondary);">' + escapeHtml(row.review || '-') + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">演练资料</div><div>' + fileLine + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">最近更新</div><div>' + escapeHtml(formatTime(row.updatedAt)) + '</div></div>' +
            '</div>' +
          '</div>' +
        '</div>';
      detailBody.innerHTML = html;
      detailOverlay.style.display = 'flex';
    }

    function closeDetailModal() {
      if (detailOverlay) detailOverlay.style.display = 'none';
    }

    function ensureRequired() {
      if (!String(formName.value || '').trim()) return '请填写演练名称';
      if (!String(formPlannedAt.value || '').trim()) return '请选择计划日期';
      return '';
    }

    function makeId() {
      var d = new Date();
      var y = d.getFullYear();
      var m = pad2(d.getMonth() + 1);
      var suffix = String(Math.floor(Math.random() * 900) + 100);
      return 'ED-' + y + m + '-' + suffix;
    }

    function pickPlan(planId) {
      if (!planId) return { planId: '', planName: '' };
      var raw = localStorage.getItem(PLAN_STORE_KEY);
      var parsed = raw ? safeJsonParse(raw) : null;
      var plans = Array.isArray(parsed) ? parsed : [];
      var p = plans.find(function (x) { return x && String(x.id) === String(planId); });
      if (!p) return { planId: String(planId), planName: '' };
      return { planId: String(p.id), planName: String(p.name || p.id) };
    }

    function saveForm() {
      var err = ensureRequired();
      if (err) { alert(err); return; }
      if (fileReading) { alert('文件读取中，请稍候再保存'); return; }

      loadRows();
      var id = String(formId.value || '').trim();
      var now = Date.now();
      var fileToSave = pendingFileMeta ? pendingFileMeta : keepExistingFile;
      var planSel = pickPlan(formPlanId ? formPlanId.value : '');
      var scoreRaw = String(formScore.value || '').trim();
      var scoreVal = scoreRaw;
      if (scoreRaw !== '') {
        var num = parseInt(scoreRaw, 10);
        if (isNaN(num) || num < 0 || num > 100) { alert('评分需为 0-100'); return; }
        scoreVal = String(num);
      }

      var payload = {
        id: id || makeId(),
        name: String(formName.value || '').trim(),
        type: String(formType.value || '').trim(),
        planId: String(planSel.planId || ''),
        planName: String(planSel.planName || ''),
        scope: String(formScope.value || '').trim(),
        plannedAt: String(formPlannedAt.value || '').trim(),
        executedAt: String(formExecutedAt.value || '').trim(),
        status: String(formStatus.value || '').trim(),
        score: scoreVal,
        owner: String(formOwner.value || '').trim(),
        participants: String(formParticipants.value || '').trim(),
        review: String(formReview.value || '').trim(),
        file: fileToSave || null,
        updatedAt: now
      };

      var idx = allRows.findIndex(function (r) { return String(r.id) === String(payload.id); });
      if (idx >= 0) allRows[idx] = payload;
      else allRows.unshift(payload);
      saveRows();
      closeEditModal();
      renderTable();
    }

    function downloadRowFile(row) {
      if (!row || !row.file || !row.file.dataUrl) { alert('该演练未上传资料'); return; }
      var a = document.createElement('a');
      a.href = row.file.dataUrl;
      a.download = row.file.name || (row.name ? (row.name + '.file') : '演练资料');
      a.style.display = 'none';
      document.body.appendChild(a);
      try { a.click(); } finally { setTimeout(function () { try { document.body.removeChild(a); } catch (e) {} }, 0); }
    }

    function handleTableAction(action, id) {
      loadRows();
      var row = allRows.find(function (r) { return String(r.id) === String(id); });
      if (!row) return;
      if (action === 'view') openDetailModal(row);
      else if (action === 'edit') openEditModal('edit', row);
      else if (action === 'download') downloadRowFile(row);
      else if (action === 'delete') {
        if (!confirm('确认删除：' + row.name + ' ?')) return;
        allRows = allRows.filter(function (r) { return String(r.id) !== String(id); });
        saveRows();
        renderTable();
      }
    }

    // 事件绑定
    if (createBtn) createBtn.addEventListener('click', function () { openEditModal('add', null); });
    [statusFilter, typeFilter].forEach(function (el) {
      if (!el) return;
      el.addEventListener('change', function () { currentPage = 1; renderTable(); });
    });
    if (searchInput) {
      var timer = null;
      searchInput.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { currentPage = 1; renderTable(); }, 150);
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { currentPage = 1; renderTable(); }
      });
    }
    if (pager) {
      pager.addEventListener('click', function (e) {
        var btn = e.target.closest('button.pagination-btn');
        if (!btn || btn.disabled) return;
        var p = parseInt(btn.dataset.page, 10);
        if (!isNaN(p) && p >= 1) {
          currentPage = p;
          renderTable();
        }
      });
    }
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-action]');
        if (!btn) return;
        var tr = e.target.closest('tr[data-id]');
        if (!tr) return;
        var id = tr.getAttribute('data-id');
        var action = btn.getAttribute('data-action');
        handleTableAction(action, id);
      });
    }
    if (detailBody) {
      detailBody.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-action="download"][data-id]');
        if (!btn) return;
        var id = btn.getAttribute('data-id');
        handleTableAction('download', id);
      });
    }

    if (editClose) editClose.addEventListener('click', closeEditModal);
    if (editCancel) editCancel.addEventListener('click', closeEditModal);
    if (editOverlay) editOverlay.addEventListener('click', function (e) { if (e.target === editOverlay) closeEditModal(); });
    if (editSave) editSave.addEventListener('click', saveForm);

    if (formFile) {
      formFile.addEventListener('change', function () {
        var f = (formFile.files && formFile.files[0]) ? formFile.files[0] : null;
        if (!f) {
          pendingFileMeta = null;
          fileReading = false;
          if (keepExistingFile && keepExistingFile.name) {
            setFileInfoText('已上传：' + keepExistingFile.name + (keepExistingFile.size ? ('（' + humanFileSize(keepExistingFile.size) + '）') : ''));
            setFileClearVisible(true);
          } else {
            setFileInfoText('未选择文件');
            setFileClearVisible(false);
          }
          return;
        }
        fileReading = true;
        pendingFileMeta = null;
        setFileInfoText('读取中：' + f.name);
        setFileClearVisible(true);
        var reader = new FileReader();
        reader.onload = function () {
          fileReading = false;
          keepExistingFile = null;
          pendingFileMeta = {
            name: f.name,
            type: f.type || 'application/octet-stream',
            size: f.size,
            dataUrl: reader.result,
            uploadedAt: Date.now()
          };
          setFileInfoText('已选择：' + f.name + '（' + humanFileSize(f.size) + '）');
        };
        reader.onerror = function () {
          fileReading = false;
          pendingFileMeta = null;
          alert('文件读取失败，请重试');
          if (formFile) formFile.value = '';
          if (keepExistingFile && keepExistingFile.name) {
            setFileInfoText('已上传：' + keepExistingFile.name + (keepExistingFile.size ? ('（' + humanFileSize(keepExistingFile.size) + '）') : ''));
            setFileClearVisible(true);
          } else {
            setFileInfoText('未选择文件');
            setFileClearVisible(false);
          }
        };
        try { reader.readAsDataURL(f); } catch (e) {
          fileReading = false;
          pendingFileMeta = null;
          alert('文件读取失败，请重试');
          if (formFile) formFile.value = '';
          setFileInfoText('未选择文件');
          setFileClearVisible(false);
        }
      });
    }
    if (formFileClear) {
      formFileClear.addEventListener('click', function () {
        pendingFileMeta = null;
        keepExistingFile = null;
        fileReading = false;
        if (formFile) formFile.value = '';
        setFileInfoText('未选择文件');
        setFileClearVisible(false);
      });
    }

    if (detailClose) detailClose.addEventListener('click', closeDetailModal);
    if (detailOk) detailOk.addEventListener('click', closeDetailModal);
    if (detailOverlay) detailOverlay.addEventListener('click', function (e) { if (e.target === detailOverlay) closeDetailModal(); });

    // 首次渲染
    renderTable();
  }

  function initAccidentInvestigationPage() {
    var STORE_KEY = 'sd_accident_investigations_v1';
    var pageSize = 8;
    var currentPage = 1;
    var allRows = [];

    var createBtn = document.getElementById('aiCreateBtn');
    var statusFilter = document.getElementById('aiStatusFilter');
    var levelFilter = document.getElementById('aiLevelFilter');
    var searchInput = document.getElementById('aiSearchInput');
    var tbody = document.getElementById('aiTbody');
    var pager = document.getElementById('aiPager');
    var totalText = document.getElementById('aiTotalText');

    var editOverlay = document.getElementById('aiEditModalOverlay');
    var editTitle = document.getElementById('aiEditModalTitle');
    var editClose = document.getElementById('aiEditModalClose');
    var editCancel = document.getElementById('aiEditModalCancel');
    var editSave = document.getElementById('aiEditModalSave');

    var formId = document.getElementById('aiFormId');
    var formTitle = document.getElementById('aiFormTitle');
    var formCategory = document.getElementById('aiFormCategory');
    var formLevel = document.getElementById('aiFormLevel');
    var formDept = document.getElementById('aiFormDept');
    var formOwner = document.getElementById('aiFormOwner');
    var formStatus = document.getElementById('aiFormStatus');
    var formDueDate = document.getElementById('aiFormDueDate');
    var formSummary = document.getElementById('aiFormSummary');
    var formCause = document.getElementById('aiFormCause');
    var formResponsibility = document.getElementById('aiFormResponsibility');
    var formAction = document.getElementById('aiFormAction');
    var formFile = document.getElementById('aiFormFile');
    var formFileInfo = document.getElementById('aiFormFileInfo');
    var formFileClear = document.getElementById('aiFormFileClear');

    var detailOverlay = document.getElementById('aiDetailModalOverlay');
    var detailBody = document.getElementById('aiDetailBody');
    var detailClose = document.getElementById('aiDetailModalClose');
    var detailOk = document.getElementById('aiDetailModalOk');

    var pendingFileMeta = null;
    var keepExistingFile = null;
    var fileReading = false;

    function safeJsonParse(text) {
      try { return JSON.parse(text); } catch (e) { return null; }
    }

    function pad2(n) { return String(n).padStart(2, '0'); }

    function formatTime(ts) {
      if (!ts) return '-';
      try {
        var d = new Date(ts);
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
      } catch (e) {
        return '-';
      }
    }

    function ymdToDate(ymd) {
      if (!ymd) return null;
      var d = new Date(String(ymd) + 'T00:00:00');
      if (isNaN(d.getTime())) return null;
      return d;
    }

    function humanFileSize(bytes) {
      if (!bytes && bytes !== 0) return '-';
      var n = Number(bytes);
      if (isNaN(n) || n < 0) return '-';
      if (n < 1024) return n + ' B';
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
      if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
      return (n / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    function setFileInfoText(text) {
      if (formFileInfo) formFileInfo.textContent = text || '';
    }

    function setFileClearVisible(visible) {
      if (formFileClear) formFileClear.style.display = visible ? 'inline-flex' : 'none';
    }

    function resetFileState() {
      pendingFileMeta = null;
      keepExistingFile = null;
      fileReading = false;
      if (formFile) formFile.value = '';
      setFileInfoText('未选择文件');
      setFileClearVisible(false);
    }

    function getSeedRows() {
      var now = Date.now();
      var today = new Date();
      function offset(days) {
        var d = new Date(today.getTime() + days * 86400000);
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
      }
      return [
        {
          id: 'AI-202604-001',
          title: '青浦转运中心叉车刮碰事故调查',
          category: '设备事故',
          level: '一般',
          dept: '上海青浦转运中心',
          owner: '安全经理',
          status: '调查中',
          dueDate: offset(3),
          summary: '夜班叉车转弯时与护栏刮碰，造成轻微设备损坏。',
          cause: '现场照度不足，叉车司机转弯未充分观察。',
          responsibility: '属现场管理与当班司机双重责任。',
          action: '补充反光标识，优化夜班巡检并组织再培训。',
          file: null,
          updatedAt: now - 86400000 * 2
        },
        {
          id: 'AI-202604-002',
          title: '干线车辆追尾事故责任复核',
          category: '车辆事故',
          level: '较大',
          dept: '干线运输中心',
          owner: '运输安全专员',
          status: '待复核',
          dueDate: offset(1),
          summary: '高速路段追尾，司机轻伤，车辆受损。',
          cause: '疲劳驾驶风险识别不足，跟车距离控制不当。',
          responsibility: '驾驶员直接责任，排班审核存在管理责任。',
          action: '压降连续驾驶时长，复盘班次排布并开展专项培训。',
          file: null,
          updatedAt: now - 86400000
        },
        {
          id: 'AI-202603-003',
          title: '仓储区烟感误报事件结案调查',
          category: '消防事件',
          level: '一般',
          dept: '广州花都转运中心',
          owner: '消防主管',
          status: '已结案',
          dueDate: offset(-5),
          summary: '烟感受粉尘干扰触发误报，无人员伤亡。',
          cause: '设备维护不到位，仓储扬尘控制不足。',
          responsibility: '设备维保单位与现场管理均有改进空间。',
          action: '完成清洗校准，新增月度保养与粉尘管控检查。',
          file: null,
          updatedAt: now - 86400000 * 6
        }
      ];
    }

    function loadRows() {
      var raw = localStorage.getItem(STORE_KEY);
      var parsed = raw ? safeJsonParse(raw) : null;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        allRows = getSeedRows();
        localStorage.setItem(STORE_KEY, JSON.stringify(allRows));
        return;
      }
      allRows = parsed;
    }

    function saveRows() {
      localStorage.setItem(STORE_KEY, JSON.stringify(allRows));
    }

    function statusBadge(status) {
      var cls = 'status-badge info';
      if (status === '调查中') cls = 'status-badge warning';
      else if (status === '待复核') cls = 'status-badge info';
      else if (status === '已结案') cls = 'status-badge success';
      else if (status === '已挂起') cls = 'status-badge danger';
      return '<span class="' + cls + '">' + escapeHtml(status || '-') + '</span>';
    }

    function updateKpis(rows) {
      var openEl = document.getElementById('aiKpiOpen');
      var reviewEl = document.getElementById('aiKpiReview');
      var closedEl = document.getElementById('aiKpiClosed');
      var overdueEl = document.getElementById('aiKpiOverdue');
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var counts = { open: 0, review: 0, closed: 0, overdue: 0 };

      rows.forEach(function (row) {
        if (row.status === '调查中') counts.open += 1;
        if (row.status === '待复核') counts.review += 1;
        if (row.status === '已结案') counts.closed += 1;
        var dueDate = ymdToDate(row.dueDate);
        if (dueDate && dueDate < today && row.status !== '已结案') counts.overdue += 1;
      });

      if (openEl) openEl.textContent = String(counts.open);
      if (reviewEl) reviewEl.textContent = String(counts.review);
      if (closedEl) closedEl.textContent = String(counts.closed);
      if (overdueEl) overdueEl.textContent = String(counts.overdue);
    }

    function getFilters() {
      var s = statusFilter && statusFilter.value ? statusFilter.value : '';
      var l = levelFilter && levelFilter.value ? levelFilter.value : '';
      var q = searchInput && searchInput.value ? String(searchInput.value).trim().toLowerCase() : '';
      return { status: s, level: l, q: q };
    }

    function matches(row, filters) {
      if (filters.status && row.status !== filters.status) return false;
      if (filters.level && row.level !== filters.level) return false;
      if (filters.q) {
        var hay = [row.id, row.title, row.dept, row.category, row.owner].join(' ').toLowerCase();
        if (hay.indexOf(filters.q) === -1) return false;
      }
      return true;
    }

    function renderPager(total) {
      if (!pager) return;
      var totalPages = Math.max(1, Math.ceil(total / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      var html = '';

      function btn(label, page, active, disabled) {
        return '<button class="pagination-btn' + (active ? ' active' : '') + '" data-page="' + page + '" ' + (disabled ? 'disabled' : '') + '>' + label + '</button>';
      }

      html += btn('&lt;', currentPage - 1, false, currentPage <= 1);
      var start = Math.max(1, currentPage - 2);
      var end = Math.min(totalPages, start + 4);
      start = Math.max(1, end - 4);
      for (var p = start; p <= end; p++) html += btn(String(p), p, p === currentPage, false);
      html += btn('&gt;', currentPage + 1, false, currentPage >= totalPages);
      pager.innerHTML = html;
    }

    function renderTable() {
      loadRows();
      updateKpis(allRows);
      var filters = getFilters();
      var filtered = allRows.filter(function (row) { return matches(row, filters); });
      var total = filtered.length;
      if (totalText) totalText.textContent = '共 ' + total + ' 条记录';
      renderPager(total);

      var startIdx = (currentPage - 1) * pageSize;
      var pageRows = filtered.slice(startIdx, startIdx + pageSize);
      if (!tbody) return;
      if (pageRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="padding:24px; color: var(--text-tertiary); text-align:center;">暂无数据</td></tr>';
        return;
      }

      tbody.innerHTML = pageRows.map(function (row) {
        var canDownload = !!(row.file && row.file.dataUrl);
        return '' +
          '<tr data-id="' + escapeHtml(row.id) + '">' +
            '<td>' + escapeHtml(row.id) + '</td>' +
            '<td style="min-width:240px;">' + escapeHtml(row.title) + '</td>' +
            '<td>' + escapeHtml(row.category || '-') + '</td>' +
            '<td>' + escapeHtml(row.dept || '-') + '</td>' +
            '<td>' + statusBadge(row.status) + '</td>' +
            '<td>' + escapeHtml(row.dueDate || '-') + '</td>' +
            '<td>' + escapeHtml(formatTime(row.updatedAt)) + '</td>' +
            '<td style="white-space:nowrap;">' +
              '<button class="btn btn-outline btn-sm" type="button" data-action="view">查看</button>' +
              '<button class="btn btn-outline btn-sm" type="button" data-action="edit" style="margin-left:6px;">编辑</button>' +
              '<button class="btn btn-outline btn-sm" type="button" data-action="download" style="margin-left:6px;" ' + (canDownload ? '' : 'disabled') + '>下载</button>' +
              '<button class="btn btn-outline btn-sm" type="button" data-action="delete" style="margin-left:6px;">删除</button>' +
            '</td>' +
          '</tr>';
      }).join('');
    }

    function openEditModal(mode, row) {
      if (!editOverlay) return;
      editTitle.textContent = mode === 'edit' ? '编辑调查' : '新建调查';
      formId.value = row ? row.id || '' : '';
      formTitle.value = row ? row.title || '' : '';
      formCategory.value = row ? row.category || '人员伤害' : '人员伤害';
      formLevel.value = row ? row.level || '一般' : '一般';
      formDept.value = row ? row.dept || '' : '';
      formOwner.value = row ? row.owner || '' : '';
      formStatus.value = row ? row.status || '调查中' : '调查中';
      formDueDate.value = row ? row.dueDate || '' : '';
      formSummary.value = row ? row.summary || '' : '';
      formCause.value = row ? row.cause || '' : '';
      formResponsibility.value = row ? row.responsibility || '' : '';
      formAction.value = row ? row.action || '' : '';

      pendingFileMeta = null;
      keepExistingFile = row && row.file ? row.file : null;
      fileReading = false;
      if (formFile) formFile.value = '';
      if (keepExistingFile && keepExistingFile.name) {
        setFileInfoText('已上传：' + keepExistingFile.name + (keepExistingFile.size ? ('（' + humanFileSize(keepExistingFile.size) + '）') : ''));
        setFileClearVisible(true);
      } else {
        setFileInfoText('未选择文件');
        setFileClearVisible(false);
      }

      editOverlay.style.display = 'flex';
      setTimeout(function () { try { formTitle.focus(); } catch (e) {} }, 0);
    }

    function closeEditModal() {
      if (editOverlay) editOverlay.style.display = 'none';
      resetFileState();
    }

    function openDetailModal(row) {
      if (!detailOverlay || !detailBody) return;
      var fileHtml = '-';
      if (row.file && row.file.name && row.file.dataUrl) {
        fileHtml = '<button class="btn btn-outline btn-sm" type="button" data-action="download" data-id="' + escapeHtml(row.id) + '">下载：' + escapeHtml(row.file.name) + '</button>';
      }
      detailBody.innerHTML = '' +
        '<div class="panel" style="margin:0;">' +
          '<div class="panel-body">' +
            '<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">' +
              '<div>' +
                '<div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">' + escapeHtml(row.title) + '</div>' +
                '<div style="font-size:12.5px;color:var(--text-tertiary);">编号：' + escapeHtml(row.id) + ' · 调查负责人：' + escapeHtml(row.owner || '-') + '</div>' +
              '</div>' +
              '<div>' + statusBadge(row.status) + '</div>' +
            '</div>' +
            '<div style="margin-top:14px;" class="form-grid">' +
              '<div class="form-field"><div class="form-label">事故类型</div><div>' + escapeHtml(row.category || '-') + '</div></div>' +
              '<div class="form-field"><div class="form-label">事故等级</div><div>' + escapeHtml(row.level || '-') + '</div></div>' +
              '<div class="form-field"><div class="form-label">责任单位</div><div>' + escapeHtml(row.dept || '-') + '</div></div>' +
              '<div class="form-field"><div class="form-label">截止日期</div><div>' + escapeHtml(row.dueDate || '-') + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">事故经过</div><div style="white-space:pre-wrap; color: var(--text-secondary);">' + escapeHtml(row.summary || '-') + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">原因分析</div><div style="white-space:pre-wrap; color: var(--text-secondary);">' + escapeHtml(row.cause || '-') + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">责任认定</div><div style="white-space:pre-wrap; color: var(--text-secondary);">' + escapeHtml(row.responsibility || '-') + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">整改措施</div><div style="white-space:pre-wrap; color: var(--text-secondary);">' + escapeHtml(row.action || '-') + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">调查附件</div><div>' + fileHtml + '</div></div>' +
              '<div class="form-field span-2"><div class="form-label">最近更新</div><div>' + escapeHtml(formatTime(row.updatedAt)) + '</div></div>' +
            '</div>' +
          '</div>' +
        '</div>';
      detailOverlay.style.display = 'flex';
    }

    function closeDetailModal() {
      if (detailOverlay) detailOverlay.style.display = 'none';
    }

    function ensureRequired() {
      if (!String(formTitle.value || '').trim()) return '请填写调查主题';
      return '';
    }

    function makeId() {
      var d = new Date();
      return 'AI-' + d.getFullYear() + pad2(d.getMonth() + 1) + '-' + String(Math.floor(Math.random() * 900) + 100);
    }

    function saveForm() {
      var err = ensureRequired();
      if (err) { alert(err); return; }
      if (fileReading) { alert('文件读取中，请稍候再保存'); return; }

      loadRows();
      var id = String(formId.value || '').trim();
      var payload = {
        id: id || makeId(),
        title: String(formTitle.value || '').trim(),
        category: String(formCategory.value || '').trim(),
        level: String(formLevel.value || '').trim(),
        dept: String(formDept.value || '').trim(),
        owner: String(formOwner.value || '').trim(),
        status: String(formStatus.value || '').trim(),
        dueDate: String(formDueDate.value || '').trim(),
        summary: String(formSummary.value || '').trim(),
        cause: String(formCause.value || '').trim(),
        responsibility: String(formResponsibility.value || '').trim(),
        action: String(formAction.value || '').trim(),
        file: pendingFileMeta ? pendingFileMeta : keepExistingFile,
        updatedAt: Date.now()
      };

      var idx = allRows.findIndex(function (row) { return String(row.id) === String(payload.id); });
      if (idx >= 0) allRows[idx] = payload;
      else allRows.unshift(payload);
      saveRows();
      closeEditModal();
      renderTable();
    }

    function downloadRowFile(row) {
      if (!row || !row.file || !row.file.dataUrl) { alert('该调查未上传附件'); return; }
      var a = document.createElement('a');
      a.href = row.file.dataUrl;
      a.download = row.file.name || (row.title ? (row.title + '.file') : '调查附件');
      a.style.display = 'none';
      document.body.appendChild(a);
      try { a.click(); } finally { setTimeout(function () { try { document.body.removeChild(a); } catch (e) {} }, 0); }
    }

    function handleTableAction(action, id) {
      loadRows();
      var row = allRows.find(function (item) { return String(item.id) === String(id); });
      if (!row) return;
      if (action === 'view') openDetailModal(row);
      else if (action === 'edit') openEditModal('edit', row);
      else if (action === 'download') downloadRowFile(row);
      else if (action === 'delete') {
        if (!confirm('确认删除：' + row.title + ' ?')) return;
        allRows = allRows.filter(function (item) { return String(item.id) !== String(id); });
        saveRows();
        renderTable();
      }
    }

    if (createBtn) createBtn.addEventListener('click', function () { openEditModal('add', null); });
    [statusFilter, levelFilter].forEach(function (el) {
      if (!el) return;
      el.addEventListener('change', function () { currentPage = 1; renderTable(); });
    });
    if (searchInput) {
      var timer = null;
      searchInput.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { currentPage = 1; renderTable(); }, 150);
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { currentPage = 1; renderTable(); }
      });
    }
    if (pager) {
      pager.addEventListener('click', function (e) {
        var btn = e.target.closest('button.pagination-btn');
        if (!btn || btn.disabled) return;
        var p = parseInt(btn.dataset.page, 10);
        if (!isNaN(p) && p >= 1) {
          currentPage = p;
          renderTable();
        }
      });
    }
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-action]');
        if (!btn) return;
        var tr = e.target.closest('tr[data-id]');
        if (!tr) return;
        handleTableAction(btn.getAttribute('data-action'), tr.getAttribute('data-id'));
      });
    }
    if (detailBody) {
      detailBody.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-action="download"][data-id]');
        if (!btn) return;
        handleTableAction('download', btn.getAttribute('data-id'));
      });
    }

    if (editClose) editClose.addEventListener('click', closeEditModal);
    if (editCancel) editCancel.addEventListener('click', closeEditModal);
    if (editOverlay) editOverlay.addEventListener('click', function (e) { if (e.target === editOverlay) closeEditModal(); });
    if (editSave) editSave.addEventListener('click', saveForm);

    if (formFile) {
      formFile.addEventListener('change', function () {
        var file = formFile.files && formFile.files[0] ? formFile.files[0] : null;
        if (!file) {
          pendingFileMeta = null;
          fileReading = false;
          if (keepExistingFile && keepExistingFile.name) {
            setFileInfoText('已上传：' + keepExistingFile.name + (keepExistingFile.size ? ('（' + humanFileSize(keepExistingFile.size) + '）') : ''));
            setFileClearVisible(true);
          } else {
            setFileInfoText('未选择文件');
            setFileClearVisible(false);
          }
          return;
        }

        fileReading = true;
        pendingFileMeta = null;
        setFileInfoText('读取中：' + file.name);
        setFileClearVisible(true);
        var reader = new FileReader();
        reader.onload = function () {
          fileReading = false;
          keepExistingFile = null;
          pendingFileMeta = {
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl: reader.result,
            uploadedAt: Date.now()
          };
          setFileInfoText('已选择：' + file.name + '（' + humanFileSize(file.size) + '）');
        };
        reader.onerror = function () {
          fileReading = false;
          pendingFileMeta = null;
          if (formFile) formFile.value = '';
          alert('文件读取失败，请重试');
          setFileInfoText('未选择文件');
          setFileClearVisible(false);
        };
        try { reader.readAsDataURL(file); } catch (e) {
          fileReading = false;
          pendingFileMeta = null;
          if (formFile) formFile.value = '';
          alert('文件读取失败，请重试');
          setFileInfoText('未选择文件');
          setFileClearVisible(false);
        }
      });
    }

    if (formFileClear) {
      formFileClear.addEventListener('click', function () {
        resetFileState();
      });
    }

    if (detailClose) detailClose.addEventListener('click', closeDetailModal);
    if (detailOk) detailOk.addEventListener('click', closeDetailModal);
    if (detailOverlay) detailOverlay.addEventListener('click', function (e) { if (e.target === detailOverlay) closeDetailModal(); });

    renderTable();
  }

  function renderAccidentStatistics() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">事故统计分析</div>' +
            '<div class="page-desc">多维度事故数据钻取与安全趋势研判</div>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav mb-24" id="accidentStatsTabNav">' +
          '<div class="tab-item active" data-tab="analysis">事故分析</div>' +
          '<div class="tab-item" data-tab="list">事故统计</div>' +
        '</div>' +

        '<div id="accidentAnalysisPanel">' +
          // 分析页筛选
          '<div class="panel" style="margin-bottom:20px;">' +
            '<div class="panel-body" style="padding: 12px 20px;">' + // 收窄内边距
              '<div class="filter-row" style="margin-bottom:0;">' + // 紧凑布局
                '<div class="filter-item">' +
                  '<label class="filter-label">年份</label>' +
                  '<select class="filter-select" id="accAnalysisYearSelect"><option>2025年</option><option>2026年</option></select>' +
                '</div>' +
                '<div class="filter-item">' +
                  '<label class="filter-label">月份</label>' +
                  '<select class="filter-select" id="accAnalysisMonthSelect"><option>全部</option><option>1月</option><option>2月</option><option>3月</option><option>4月</option><option>5月</option><option>6月</option><option>7月</option><option>8月</option><option>9月</option><option>10月</option><option>11月</option><option>12月</option></select>' +
                '</div>' +
                '<div class="filter-item">' +
                  '<label class="filter-label">南北部</label>' +
                  '<select class="filter-select" id="accAnalysisAreaSelect">' +
                    '<option value="">全部</option>' +
                    '<option value="北部">北部区域</option>' +
                    '<option value="南部">南部区域</option>' +
                    '<option value="中部">中部区域</option>' +
                  '</select>' +
                '</div>' +
                '<div class="filter-item">' +
                  '<label class="filter-label">省区</label>' +
                  '<select class="filter-select" id="accAnalysisProvinceSelect"><option value="">全部</option></select>' +
                '</div>' +
                '<div class="filter-item">' +
                  '<label class="filter-label">中心</label>' +
                  '<select class="filter-select" id="accAnalysisCenterSelect"><option value="">全部</option></select>' +
                '</div>' +
                '<div class="filter-actions" style="margin-left:auto; display:flex; gap:8px; align-items:flex-end; padding-bottom:5px;">' +
                  '<button class="filter-btn filter-btn-primary" id="accAnalysisSearchBtn" style="height:32px;padding:0 16px;border-radius:4px;display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">' +
                    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
                    '查询' +
                  '</button>' +
                  '<button class="filter-btn filter-btn-outline" id="accAnalysisResetBtn" style="height:32px;padding:0 16px;border-radius:4px;display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">' +
                    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>' +
                    '重置' +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          
          // 核心统计指标
          '<div class="stats-row" style="margin-bottom:20px;" id="accAnalysisMetrics">' +
            buildStatCard('年度总事故起数', '0', '正在分析...', 'stable', 
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>', 'blue') +
            buildStatCard('当前月发生', '0', '同比计算中', 'stable', 
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>', 'orange') +
            buildStatCard('千万工时事故率', '0.00', '优于行业均值', 'up', 
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>', 'green') +
            buildStatCard('重大事故起数', '0', '安全稳定运行中', 'stable', 
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>', 'red') +
          '</div>' +

          // 第一行：月度趋势面积图（全宽）
          '<div class="panel" style="margin-bottom:20px;">' +
            '<div class="panel-header">' +
              '<div class="panel-title">📈 事故月度变化趋势</div>' +
            '</div>' +
            '<div class="panel-body">' +
              '<div id="accAnalysisTrendChart" style="min-height:240px;">' +
                '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary)">加载中...</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // 第二行：事故类型 TOP5 + 区域排行 TOP3
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">' +
            '<div class="panel">' +
              '<div class="panel-header">' +
                '<div class="panel-title">📊 事故类型 TOP 5</div>' +
              '</div>' +
              '<div class="panel-body">' +
                '<div id="accAnalysisTypeDist" style="min-height:220px;">' +
                  '<div style="text-align:center;padding:20px;color:var(--text-tertiary)">加载中...</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="panel">' +
              '<div class="panel-header">' +
                '<div class="panel-title">🏆 事故高发区域 TOP 3</div>' +
              '</div>' +
              '<div class="panel-body">' +
                '<div id="accAnalysisRegionTop" style="min-height:220px;">' +
                  '<div style="text-align:center;padding:20px;color:var(--text-tertiary)">加载中...</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' + // End Analysis Panel

        '<div id="accidentListPanel" style="display:none;">' +
          // 列表搜索
          '<div class="panel mb-16">' +
            '<div class="panel-body">' +
              '<div class="filter-row">' +
                '<div class="filter-item">' +
                  '<label class="filter-label">年份</label>' +
                  '<select class="filter-select" id="accYearSelect"><option>全部</option><option>2026年</option><option>2025年</option></select>' +
                '</div>' +
                '<div class="filter-item">' +
                  '<label class="filter-label">月份</label>' +
                  '<select class="filter-select" id="accMonthSelect"><option>全部</option><option>1月</option><option>2月</option><option>3月</option><option>4月</option><option>5月</option><option>6月</option><option>7月</option><option>8月</option><option>9月</option><option>10月</option><option>11月</option><option>12月</option></select>' +
                '</div>' +
                '<div class="filter-item">' +
                  '<label class="filter-label">南北部</label>' +
                  '<select class="filter-select" id="accAreaSelect">' +
                    '<option value="">全部</option>' +
                    '<option value="北部">北部区域</option>' +
                    '<option value="南部">南部区域</option>' +
                    '<option value="中部">中部区域</option>' +
                  '</select>' +
                '</div>' +
                '<div class="filter-item">' +
                  '<label class="filter-label">省区</label>' +
                  '<select class="filter-select" id="accProvinceSelect"><option value="">全部</option></select>' +
                '</div>' +
                '<div class="filter-item">' +
                  '<label class="filter-label">中心</label>' +
                  '<select class="filter-select" id="accCenterSelect"><option value="">全部</option></select>' +
                '</div>' +
                '<div class="filter-item">' +
                  '<label class="filter-label">事故类型</label>' +
                  '<select class="filter-select" id="accTypeSelect"><option>全部</option><option>交通运输</option><option>机械伤害</option><option>高处坠落</option><option>触电伤害</option><option>其他</option></select>' +
                '</div>' +
                '<div class="filter-actions">' +
                  '<button class="filter-btn filter-btn-primary" id="accSearchBtn">' +
                    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
                    '查询' +
                  '</button>' +
                  '<button class="filter-btn filter-btn-outline" id="accResetBtn">' +
                    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>' +
                    '重置' +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // 列表内容
          '<div class="panel">' +
            '<div class="panel-header">' +
              '<div class="panel-title">事故清单</div>' +
            '</div>' +
            '<div class="panel-body p-0">' +
	              '<div class="data-table-scroll">' +
	                '<table class="data-table accident-stats-table" id="accidentListTable">' +
	                  '<thead>' +
	                    '<tr>' +
	                      '<th style="width:60px">序号</th>' +
	                      '<th style="width:90px">姓名</th>' +
	                      '<th class="accident-unit-col" style="width:220px;max-width:220px;">所属单位</th>' +
	                      '<th class="accident-province-col" style="width:140px">省区</th>' +
	                      '<th style="width:220px">事故名称</th>' +
	                      '<th style="width:120px">出险日期</th>' +
	                      '<th style="width:70px">月份</th>' +
	                      '<th style="width:80px">操作</th>' +
	                    '</tr>' +
	                  '</thead>' +
	                  '<tbody id="accidentTableBody">' +
                    // 数据将由 loadAccidentList 方法动态渲染
                    '<tr><td colspan="8" style="text-align: center; padding: 20px;">加载中...</td></tr>' +
                  '</tbody>' +
                '</table>' +
              '</div>' +
              '<div id="accidentPagination" class="pagination-wrapper" style="padding: 16px; display: flex; justify-content: flex-end; align-items: center; gap: 8px; border-top: 1px solid var(--border-light);"></div>' +
            '</div>' +
          '</div>' +
          '</div>' +
        '</div>' + // End List Panel
        
        // 事故详情 Modal
        '<div class="modal-overlay" id="accidentDetailModalOverlay" style="display:none;">' +
          '<div class="modal modal-accident-detail" role="dialog" style="max-width:640px;">' +
            '<div class="modal-header"><div class="modal-title">事故详情</div><button class="modal-close" type="button" title="关闭" onclick="document.getElementById(\'accidentDetailModalOverlay\').style.display=\'none\'">×</button></div>' +
            '<div class="modal-body">' +
              '<div class="hazard-detail-info" id="accidentDetailInfo"></div>' +
              '<div class="hazard-detail-images" style="margin-top:16px;">' +
                '<div class="hazard-detail-section"><div class="form-label" style="font-weight:600;margin-bottom:8px;">事故附件</div><div style="color:var(--text-tertiary);font-size:13px;padding:12px;background:#f9fafb;border-radius:4px;border:1px dashed #e5e7eb;text-align:center;">历史记录暂无附件</div></div>' +
              '</div>' +
              '<div class="hazard-detail-section" style="margin-top:16px;">' +
                '<div class="form-label" style="font-weight:600;margin-bottom:8px;">闭环情况</div>' +
                '<div style="color:var(--text-secondary);font-size:13px;padding:12px;background:#f9fafb;border-radius:4px;"><span class="status-indicator status-active" style="margin-bottom:8px;display:inline-block;">已结案</span><br>本条事故来源于外部历史数据归档，已完成业务闭环。</div>' +
              '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button class="btn btn-outline" type="button" onclick="document.getElementById(\'accidentDetailModalOverlay\').style.display=\'none\'">关闭详情</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        
      '</div>';
  }

  // === 面积趋势图 ===
  function buildAreaChart(data, labels) {
    var max = Math.max.apply(null, data.concat([1]));
    var padL = 50, padR = 30, padT = 50, padB = 40; 
    var totalW = 1200, totalH = 400; 
    var chartW = totalW - padL - padR;
    var chartH = totalH - padT - padB;
    var step = chartW / (data.length - 1);

    // 构造坐标
    var pts = [];
    data.forEach(function(v, i) {
      var x = padL + i * step;
      var y = padT + chartH - (v / max) * chartH;
      pts.push({x: x, y: y, v: v});
    });

    var linePoints = pts.map(function(p) { return p.x + ',' + p.y; }).join(' ');
    var areaPoints = padL + ',' + (padT + chartH) + ' ' + linePoints + ' ' + (padL + chartW) + ',' + (padT + chartH);

    // 坐标轴与网格线
    var gridLines = '';
    for (var g = 0; g <= 4; g++) {
      var gy = padT + (chartH / 4) * g;
      var gVal = Math.round(max - (max / 4) * g);
      gridLines += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (padL + chartW) + '" y2="' + gy + '" stroke="#eee" stroke-width="1" stroke-dasharray="4,4" />';
      gridLines += '<text x="' + (padL - 12) + '" y="' + (gy + 5) + '" fill="#999" font-size="14" text-anchor="end">' + gVal + '</text>';
    }

    // X轴 刻度/月份
    var xLabelsHtml = labels.map(function(l, i) {
      var px = padL + i * step;
      return '<text x="' + px + '" y="' + (totalH - 10) + '" fill="#999" font-size="14" text-anchor="middle">' + l + '</text>';
    }).join('');

    // 圆点 + 数值标签
    var dotsHtml = pts.map(function(p) {
      return '<circle cx="' + p.x + '" cy="' + p.y + '" r="6" fill="#4f7df9" stroke="white" stroke-width="2.5" />' +
             '<text x="' + p.x + '" y="' + (p.y - 14) + '" fill="#333" font-size="16" text-anchor="middle" font-weight="600">' + (p.v || '') + '</text>';
    }).join('');

    var svg = '<svg viewBox="0 0 ' + totalW + ' ' + totalH + '" preserveAspectRatio="none" style="width:100%; height:100%;">' +
      '<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#4f7df9" stop-opacity="0.3"/>' +
        '<stop offset="100%" stop-color="#4f7df9" stop-opacity="0.05"/>' +
      '</linearGradient></defs>' +
      gridLines +
      xLabelsHtml +
      '<polygon points="' + areaPoints + '" fill="url(#areaGrad)" />' +
      '<polyline points="' + linePoints + '" fill="none" stroke="#4f7df9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
      dotsHtml +
    '</svg>';

    return '<div style="position:relative; height:350px; padding: 10px 0;">' + svg + '</div>';
  }

  // === 水平柱状图 (事故类型 TOP) ===
  function buildHorizontalBarChart(items, total) {
    if (!items || items.length === 0) {
      return '<div style="text-align:center;padding:30px;color:var(--text-tertiary)">暂无分类数据</div>';
    }
    var max = items[0].value || 1;
    var colors = ['#4f7df9', '#36b37e', '#ff9f43', '#ff6b6b', '#a855f7'];
    var html = '';
    items.forEach(function(item, idx) {
      var pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      var barW = ((item.value / max) * 100).toFixed(0);
      var color = colors[idx] || '#999';
      html +=
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">' +
          '<div style="width:70px;font-size:13px;color:var(--text-secondary);text-align:right;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + item.label + '">' + item.label + '</div>' +
          '<div style="flex:1;height:28px;background:#f5f6fa;border-radius:6px;overflow:hidden;position:relative;">' +
            '<div style="height:100%;width:' + barW + '%;background:linear-gradient(90deg,' + color + ',' + color + 'cc);border-radius:6px;transition:width .6s ease;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;">' +
              '<span style="font-size:12px;font-weight:600;color:white;">' + item.value + '</span>' +
            '</div>' +
          '</div>' +
          '<div style="width:48px;font-size:13px;font-weight:600;color:' + color + ';text-align:right;">' + pct + '%</div>' +
        '</div>';
    });
    return '<div style="padding:4px 0;">' + html + '</div>';
  }

  function refreshAccidentAnalysis() {
    const metricsContainer = document.getElementById('accAnalysisMetrics');
    const trendContainer = document.getElementById('accAnalysisTrendChart');
    const typeDistContainer = document.getElementById('accAnalysisTypeDist');
    const regionTopContainer = document.getElementById('accAnalysisRegionTop');

    var year = document.getElementById('accAnalysisYearSelect')?.value || '2025';
    var month = document.getElementById('accAnalysisMonthSelect')?.value || '';
    var area = document.getElementById('accAnalysisAreaSelect')?.value || '';
    var province = document.getElementById('accAnalysisProvinceSelect')?.value || '';
    var center = document.getElementById('accAnalysisCenterSelect')?.value || '';

    var queryParams = new URLSearchParams({
        year: year,
        month: month,
        area: area,
        province: province,
        center: center
    });

    fetch('/api/accidents/stats?' + queryParams.toString())
      .then(res => res.json())
      .then(res => {
        if (res.code === 200) {
          const d = res.data;
          // 1. Metrics
          if (metricsContainer) {
            metricsContainer.innerHTML = 
              buildStatCard('年度总事故起数', d.totalYearly, '同比基准分析中', 'stable', '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>', 'blue') +
              buildStatCard('当前月发生', d.totalMonthly, '环比实时监测', 'stable', '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>', 'orange') +
              buildStatCard('千万工时事故率', '0.38', '优于行业同期', 'up', '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>', 'green') +
              buildStatCard('重大事故起数', '0', '连续稳产运行', 'stable', '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>', 'red');
          }

          // 2. Trend Chart (Mixed Bar + Line)
          if (trendContainer) {
            const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
            trendContainer.innerHTML = buildAreaChart(d.monthlyTrend, months);
          }

          // 3. Type Dist (horizontal bar chart)
          if (typeDistContainer) {
            typeDistContainer.innerHTML = buildHorizontalBarChart(d.typeDist, d.totalYearly);
          }

          // 4. Region Top
          if (regionTopContainer) {
            regionTopContainer.innerHTML = d.regionalTop.map((item, idx) => {
              const colors = ["var(--danger)", "var(--warning)", "var(--info)"];
              return buildTopItem(idx + 1, item.label, item.count + "起", item.percent + "%", colors[idx] || 'var(--primary)');
            }).join('') || '<div style="text-align:center; padding:20px; color:var(--text-tertiary)">该年份暂无区域数据</div>';
          }
        }
      });
  }

  function buildDistItem(label, percent, color) {
    return '' +
      '<div class="dist-item">' +
        '<div class="dist-info">' +
          '<span class="dist-label">' + label + '</span>' +
          '<span class="dist-percent">' + percent + '%</span>' +
        '</div>' +
        '<div class="dist-progress-bg">' +
          '<div class="dist-progress-fill" style="width: ' + percent + '%; background: ' + color + '"></div>' +
        '</div>' +
      '</div>';
  }

  function buildTopItem(rank, name, count, ratio, color) {
    return '' +
      '<div class="top-row">' +
        '<div class="top-rank" style="background: ' + color + '">' + rank + '</div>' +
        '<div class="top-name">' + name + '</div>' +
        '<div class="top-count">' + count + '</div>' +
        '<div class="top-ratio">' + ratio + '</div>' +
      '</div>';
  }

    let currentAccidentPage = 1;
    function loadAccidentList(page = 1) {
      var tbody = document.getElementById('accidentTableBody');
      var pagination = document.getElementById('accidentPagination');
      if (!tbody) return;
      
      currentAccidentPage = page;
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">加载中...</td></tr>';
      
      var year = document.getElementById('accYearSelect')?.value || '';
      var month = document.getElementById('accMonthSelect')?.value || '';
      var area = document.getElementById('accAreaSelect')?.value || '';
      var province = document.getElementById('accProvinceSelect')?.value || '';
      var center = document.getElementById('accCenterSelect')?.value || '';
      var type = document.getElementById('accTypeSelect')?.value || '';
      
      var queryParams = new URLSearchParams({
        page: page,
        limit: 20,
        year: year,
        month: month,
        area: area,
        province: province,
        center: center,
        type: type
      });
      
      fetch('/api/accidents?' + queryParams.toString())
        .then(res => res.json())
        .then(res => {
          if (res.code === 200 && res.data) {
            if (res.data.length === 0) {
              tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--text-tertiary);">暂无数据</td></tr>';
              if (pagination) pagination.innerHTML = '';
              return;
            }
            
            var html = '';
            window._currentAccidents = res.data; // Store for detail modal
	            res.data.forEach(function(item, index) {
              var dateStr = '-';
              if (item.accident_date && typeof item.accident_date === 'string') {
                  dateStr = item.accident_date.substring(0, 10);
              } else if (item.accident_date) {
                  dateStr = new Date(item.accident_date).toISOString().substring(0, 10);
              }
              // 构建事故名称：默认使用事故详细类型 (如果有)，或者使用受伤部位和详细类型拼接。
              var accidentName = item.accident_type || '安全事故';
              if (item.injured_part && item.injured_part !== '-' && item.accident_type && item.accident_type !== '-') {
                  accidentName = item.injured_part + item.accident_type;
              }
              if (accidentName.length > 20) {
                  accidentName = accidentName.substring(0, 20) + '...';
              }
              
              var monthStr = item.month || '-';
              if (monthStr !== '-' && !monthStr.includes('月')) monthStr += '月';

	              // 计算逻辑序号：(当前页-1) * 每页限额 + 当前行索引 + 1
	              var displayIndex = (res.pagination.page - 1) * res.pagination.limit + index + 1;

	              html += '<tr>' +
	                '<td>' + displayIndex + '</td>' +
	                '<td>' + escapeHtml(item.person_name || '-') + '</td>' +
	                '<td class="accident-unit-col" title="' + escapeHtml(item.unit || '-') + '">' + escapeHtml(item.unit || '-') + '</td>' +
	                '<td class="accident-province-col" title="' + escapeHtml(item.province || '-') + '">' + escapeHtml(item.province || '-') + '</td>' +
	                '<td><span class="badge badge-info">' + accidentName + '</span></td>' +
	                '<td style="white-space: nowrap;">' + dateStr + '</td>' +
	                '<td>' + escapeHtml(monthStr) + '</td>' +
	                '<td><span class="panel-link" onclick="window._showAccidentDetail(' + item.id + ')">详情</span></td>' +
	              '</tr>';
	            });
            tbody.innerHTML = html;
            
            // 渲染分页组件
            if (pagination && res.pagination) {
              var btnPrev = '<button class="btn btn-outline btn-sm" ' + (res.pagination.page <= 1 ? 'disabled' : '') + ' onclick="window._fetchAccidentsPage(' + (res.pagination.page - 1) + ')">上一页</button>';
              var btnNext = '<button class="btn btn-outline btn-sm" ' + (res.pagination.page >= res.pagination.totalPages ? 'disabled' : '') + ' onclick="window._fetchAccidentsPage(' + (res.pagination.page + 1) + ')">下一页</button>';
              
              pagination.innerHTML = 
                '<div style="font-size: 13px; color: var(--text-secondary);">共 ' + res.pagination.total + ' 条数据，当前第 ' + res.pagination.page + ' / ' + res.pagination.totalPages + ' 页</div>' +
                '<div style="display: flex; gap: 8px;">' + btnPrev + btnNext + '</div>';
            }
          }
        })
        .catch(function(err) {
          console.error(err);
          tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--danger);">加载失败</td></tr>';
        });
    }

    // 暴露给分页按钮调用
    window._fetchAccidentsPage = function(page) {
      loadAccidentList(page);
    };

    window._showAccidentDetail = function(id) {
       var arr = window._currentAccidents || [];
       var item = arr.find(function(a) { return a.id === id; });
       if(!item) return;
       var dOverlay = document.getElementById('accidentDetailModalOverlay');
       var dInfo = document.getElementById('accidentDetailInfo');
       if(!dOverlay || !dInfo) return;
       
       var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;line-height:1.5;">' +
         '<div><span style="color:var(--text-secondary)">序号：</span>'+(item.serial_number || item.id)+'</div>' +
         '<div><span style="color:var(--text-secondary)">姓名：</span>'+(item.person_name || '-')+'</div>' +
         '<div><span style="color:var(--text-secondary)">所属单位：</span>'+(item.unit || '-')+'</div>' +
         '<div><span style="color:var(--text-secondary)">省区：</span>'+(item.province || '-')+'</div>' +
         '<div><span style="color:var(--text-secondary)">事故名称：</span>'+(item.injured_part || '')+(item.accident_type || '-')+'</div>' +
         '<div><span style="color:var(--text-secondary)">出险日期：</span>'+(item.accident_date ? new Date(item.accident_date).toISOString().substring(0,10) : '-')+'</div>' +
         '<div><span style="color:var(--text-secondary)">月份：</span>'+(item.month || '-')+'月</div>' +
         '<div style="grid-column:1/3;margin-top:8px;"><div style="color:var(--text-secondary);margin-bottom:4px;">出险情况说明：</div><div style="padding:10px;background:var(--bg-light);border-radius:4px;">'+(item.description || '-')+'</div></div>' +
       '</div>';
       
       dInfo.innerHTML = html;
       dOverlay.style.display = 'flex';
    };

    function initAccidentStatistics() {
      var tabNav = document.getElementById('accidentStatsTabNav');
      var analysisPanel = document.getElementById('accidentAnalysisPanel');
      var listPanel = document.getElementById('accidentListPanel');
      
      if (tabNav && analysisPanel && listPanel) {
      tabNav.addEventListener('click', function(e) {
        var tab = e.target.closest('.tab-item');
        if (!tab) return;
        
        var key = tab.dataset.tab;
        tabNav.querySelectorAll('.tab-item').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        
        analysisPanel.style.display = key === 'analysis' ? '' : 'none';
        listPanel.style.display = key === 'list' ? '' : 'none';
        
        if (key === 'analysis') {
            refreshAccidentAnalysis();
        } else if (key === 'list') {
            loadAccidentList(currentAccidentPage);
        }
      });

      // 初始化分析页筛选逻辑
      var aaYear = document.getElementById('accAnalysisYearSelect');
      var aaMonth = document.getElementById('accAnalysisMonthSelect');
      var aaArea = document.getElementById('accAnalysisAreaSelect');
      var aaProvince = document.getElementById('accAnalysisProvinceSelect');
      var aaCenter = document.getElementById('accAnalysisCenterSelect');

      // 初始化分析页筛选查询/重置逻辑
      var aaSearchBtn = document.getElementById('accAnalysisSearchBtn');
      var aaResetBtn = document.getElementById('accAnalysisResetBtn');

      if (aaSearchBtn) {
        aaSearchBtn.addEventListener('click', function() {
          refreshAccidentAnalysis();
        });
      }

      if (aaResetBtn) {
        aaResetBtn.addEventListener('click', function() {
          if (aaYear) aaYear.value = '2025年';
          if (aaMonth) aaMonth.value = '全部';
          if (aaArea) aaArea.value = '';
          
          // 级联重置
          if (aaArea && aaProvince) {
            fillFilterProvinces(aaArea, aaProvince, aaCenter);
            // 等待级联填充后再重置下一级（简单方案是直接清空）
            setTimeout(function() {
               if (aaProvince) aaProvince.value = '';
               fillFilterCenters(aaProvince, aaCenter, aaArea);
               setTimeout(function() {
                 if (aaCenter) aaCenter.value = '';
                 refreshAccidentAnalysis();
               }, 50);
            }, 50);
          } else {
            refreshAccidentAnalysis();
          }
        });
      }

      fetchLocationsData().then(function() {
        if (aaArea && aaProvince) {
          fillFilterProvinces(aaArea, aaProvince, aaCenter);
          fillFilterCenters(aaProvince, aaCenter, aaArea);
        }
        if (accAreaSelect && accProvinceSelect && accCenterSelect) {
          fillFilterProvinces(accAreaSelect, accProvinceSelect, accCenterSelect);
          fillFilterCenters(accProvinceSelect, accCenterSelect, accAreaSelect);
        }
      });

      // 分析页级联逻辑
      if (aaArea) {
        aaArea.addEventListener('change', function() {
          fillFilterProvinces(aaArea, aaProvince, aaCenter);
        });
      }
      if (aaProvince) {
        aaProvince.addEventListener('change', function() {
          fillFilterCenters(this, aaCenter, aaArea);
        });
      }
      
      // 默认加载分析数据
      refreshAccidentAnalysis();
      
      // 初始化位置联动
      var accAreaSelect = document.getElementById('accAreaSelect');
      var accProvinceSelect = document.getElementById('accProvinceSelect');
      var accCenterSelect = document.getElementById('accCenterSelect');
      
      if (accAreaSelect && accProvinceSelect && accCenterSelect) {
        accAreaSelect.addEventListener('change', function() {
          fillFilterProvinces(accAreaSelect, accProvinceSelect, accCenterSelect);
        });
        
        accProvinceSelect.addEventListener('change', function() {
          fillFilterCenters(accProvinceSelect, accCenterSelect, accAreaSelect);
        });
      }
      
      // 查询与重置按钮
      var accSearchBtn = document.getElementById('accSearchBtn');
      var accResetBtn = document.getElementById('accResetBtn');
      
      if (accSearchBtn) {
        accSearchBtn.addEventListener('click', function() {
          loadAccidentList(1);
        });
      }
      
      if (accResetBtn) {
        accResetBtn.addEventListener('click', function() {
          var filters = document.querySelectorAll('#accidentListPanel .filter-select');
          filters.forEach(function(f) { f.value = f.options[0].value; });
          if (accProvinceSelect) accProvinceSelect.innerHTML = '<option value="">全部</option>';
          if (accCenterSelect) accCenterSelect.innerHTML = '<option value="">全部</option>';
        });
      }
    }
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
            '<button class="btn btn-primary" data-page="facility-site-ledger">' +
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
          buildFeatureCard('场地信息台账', '全面记录各场地基础信息、面积、用途及安全设施配置', 'var(--primary-light)', 'var(--primary)', '进入台账管理', 'facility-site-ledger') +
          buildFeatureCard('设备设施清单', '设备资产登记、维保计划与安全状态实时监控', 'var(--info-light)', 'var(--info)', '设备总量 856 台') +
          buildFeatureCard('设备巡检记录', '定期巡检任务管理与异常报修追踪', 'var(--warning-light)', 'var(--warning)', '待巡检 12 项') +
          buildFeatureCard('区域安全划分', '作业区、仓储区、通行区等功能区域安全等级划分', 'var(--success-light)', 'var(--success)', '已划分 186 个区域') +
          buildFeatureCard('消防设施管理', '消防器材台账、检查记录与到期提醒', 'var(--danger-light)', 'var(--danger)', '消防器材 2,340 件') +
          buildFeatureCard('维保计划', '设备维护保养计划制定与执行跟踪', 'var(--primary-light)', 'var(--primary)', '本月计划 28 项') +
        '</div>' +
      '</div>';
  }

  // ============ 场地信息台账 ============
  function renderFacilitySiteLedger() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">场地信息台账</div>' +
            '<div class="page-desc">基于公司通讯录统一维护省区/中心场地信息，支持导入、查询、编辑与导出</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-outline" data-page="facility">返回</button>' +
            '<button class="btn btn-outline" id="siteLedgerExportBtn" type="button">导出 CSV</button>' +
            '<button class="btn btn-outline" id="siteLedgerImportBtn" type="button">从通讯录导入</button>' +
            '<button class="btn btn-primary" id="siteLedgerAddBtn" type="button">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
              '新增场地' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div class="data-table-wrapper">' +
          '<div class="table-toolbar">' +
            '<div class="table-toolbar-left">' +
              '<div class="table-filter">' +
                '<span>省区：</span>' +
                '<select id="siteLedgerProvinceSelect"><option value="">全部</option></select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>分区：</span>' +
                '<select id="siteLedgerPartitionSelect"><option value="">全部</option></select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>中心：</span>' +
                '<select id="siteLedgerCenterSelect"><option value="">全部</option></select>' +
              '</div>' +
              '<button class="btn btn-outline" id="siteLedgerResetBtn" type="button">重置</button>' +
            '</div>' +
            '<div class="table-search">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
              '<input id="siteLedgerSearchInput" type="text" placeholder="搜索省区/中心/负责人/电话/地址...">' +
            '</div>' +
          '</div>' +

          '<table class="data-table">' +
            '<thead><tr>' +
              '<th style="width:90px;">省区编码</th>' +
              '<th style="width:150px;">省区名称</th>' +
              '<th style="width:100px;">分区</th>' +
              '<th style="width:110px;">运营负责人</th>' +
              '<th style="width:90px;">中心编码</th>' +
              '<th style="width:180px;">中心名称</th>' +
              '<th style="width:90px;">级别</th>' +
              '<th style="width:90px;">属性</th>' +
              '<th style="width:90px;">负责人</th>' +
              '<th style="width:120px;">电话</th>' +
              '<th>地址</th>' +
              '<th style="width:140px;">操作</th>' +
            '</tr></thead>' +
            '<tbody id="siteLedgerTbody"></tbody>' +
          '</table>' +

          '<div class="table-pagination" style="justify-content:space-between;">' +
            '<span id="siteLedgerTotalText">共 0 条记录</span>' +
            '<div class="pagination-btns" id="siteLedgerPager"></div>' +
          '</div>' +
        '</div>' +

        '<div class="modal-overlay" id="siteLedgerEditModalOverlay" style="display:none;">' +
          '<div class="modal" role="dialog" aria-modal="true" style="max-width:860px;">' +
            '<div class="modal-header">' +
              '<div class="modal-title" id="siteLedgerEditModalTitle">新增场地</div>' +
              '<button class="modal-close" id="siteLedgerEditModalClose" type="button" title="关闭">×</button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<input type="hidden" id="siteLedgerEditingId" value="">' +
              '<div class="form-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">' +
                '<div class="form-field"><label class="form-label">省区编码</label><input id="slProvinceCode" class="form-control" type="text" placeholder="如 P01"></div>' +
                '<div class="form-field"><label class="form-label">省区名称</label><input id="slProvinceName" class="form-control" type="text" placeholder="如 上海省公司"></div>' +
                '<div class="form-field"><label class="form-label">分区名称</label><input id="slPartitionName" class="form-control" type="text" placeholder="如 上海"></div>' +
                '<div class="form-field"><label class="form-label">运营负责人</label><input id="slOperationManager" class="form-control" type="text" placeholder="如 刘辉"></div>' +
                '<div class="form-field"><label class="form-label required">中心编码</label><input id="slCenterCode" class="form-control" type="text" placeholder="如 C001"></div>' +
                '<div class="form-field"><label class="form-label required">中心名称</label><input id="slCenterName" class="form-control" type="text" placeholder="如 上海转运中心"></div>' +
                '<div class="form-field"><label class="form-label">中心简称</label><input id="slCenterShortName" class="form-control" type="text" placeholder="如 上海"></div>' +
                '<div class="form-field"><label class="form-label">类型</label><input id="slSiteType" class="form-control" type="text" placeholder="如 中心"></div>' +
                '<div class="form-field"><label class="form-label">级别</label><input id="slSiteLevel" class="form-control" type="text" placeholder="如 一级"></div>' +
                '<div class="form-field"><label class="form-label">属性</label><input id="slSiteAttribute" class="form-control" type="text" placeholder="如 直属"></div>' +
                '<div class="form-field"><label class="form-label">负责人</label><input id="slManager" class="form-control" type="text" placeholder="如 余昕"></div>' +
                '<div class="form-field"><label class="form-label">电话</label><input id="slPhone" class="form-control" type="text" placeholder="负责人电话"></div>' +
                '<div class="form-field"><label class="form-label">面积(㎡)</label><input id="slAreaM2" class="form-control" type="number" step="0.01" placeholder="可选"></div>' +
                '<div class="form-field"><label class="form-label">用途</label><input id="slUsageDesc" class="form-control" type="text" placeholder="如 分拨/仓储/办公"></div>' +
                '<div class="form-field span-3" style="grid-column: span 3;"><label class="form-label">地址</label><textarea id="slAddress" class="form-control" rows="3" placeholder="场地详细地址"></textarea></div>' +
                '<div class="form-field span-3" style="grid-column: span 3;"><label class="form-label">安全设施配置</label><textarea id="slSafetyFacilities" class="form-control" rows="2" placeholder="可填写主要安全设施/消防/监控等"></textarea></div>' +
                '<div class="form-field span-3" style="grid-column: span 3;"><label class="form-label">备注</label><textarea id="slRemark" class="form-control" rows="2" placeholder="其他补充信息"></textarea></div>' +
              '</div>' +
              '<div class="modal-hint" id="siteLedgerEditHint" style="margin-top:10px;color:var(--text-secondary);font-size:13px;"></div>' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button class="btn btn-outline" id="siteLedgerEditCancelBtn" type="button">取消</button>' +
              '<button class="btn btn-primary" id="siteLedgerEditSaveBtn" type="button">保存</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function initFacilitySiteLedger() {
    let currentPage = 1;
    const pageSize = 10;
    let currentRows = [];
    let loading = false;

    const provinceSelect = document.getElementById('siteLedgerProvinceSelect');
    const partitionSelect = document.getElementById('siteLedgerPartitionSelect');
    const centerSelect = document.getElementById('siteLedgerCenterSelect');
    const searchInput = document.getElementById('siteLedgerSearchInput');
    const resetBtn = document.getElementById('siteLedgerResetBtn');
    const tbody = document.getElementById('siteLedgerTbody');
    const totalText = document.getElementById('siteLedgerTotalText');
    const pager = document.getElementById('siteLedgerPager');
    const addBtn = document.getElementById('siteLedgerAddBtn');
    const importBtn = document.getElementById('siteLedgerImportBtn');
    const exportBtn = document.getElementById('siteLedgerExportBtn');

    const modalOverlay = document.getElementById('siteLedgerEditModalOverlay');
    const modalTitle = document.getElementById('siteLedgerEditModalTitle');
    const modalClose = document.getElementById('siteLedgerEditModalClose');
    const modalCancel = document.getElementById('siteLedgerEditCancelBtn');
    const modalSave = document.getElementById('siteLedgerEditSaveBtn');
    const modalHint = document.getElementById('siteLedgerEditHint');

    const fieldIds = {
      id: 'siteLedgerEditingId',
      province_code: 'slProvinceCode',
      province_name: 'slProvinceName',
      partition_name: 'slPartitionName',
      operation_manager: 'slOperationManager',
      center_code: 'slCenterCode',
      center_name: 'slCenterName',
      center_short_name: 'slCenterShortName',
      site_type: 'slSiteType',
      site_level: 'slSiteLevel',
      site_attribute: 'slSiteAttribute',
      manager: 'slManager',
      phone: 'slPhone',
      address: 'slAddress',
      area_m2: 'slAreaM2',
      usage_desc: 'slUsageDesc',
      safety_facilities: 'slSafetyFacilities',
      remark: 'slRemark'
    };

    function setLoading(next) {
      loading = !!next;
      if (importBtn) importBtn.disabled = loading;
      if (modalSave) modalSave.disabled = loading;
    }

    function openModal(mode, row) {
      modalHint.textContent = '';
      const editingIdEl = document.getElementById(fieldIds.id);
      if (mode === 'edit') {
        modalTitle.textContent = '编辑场地';
        editingIdEl.value = String(row.id || '');
      } else {
        modalTitle.textContent = '新增场地';
        editingIdEl.value = '';
      }

      Object.keys(fieldIds).forEach(function (key) {
        if (key === 'id') return;
        const el = document.getElementById(fieldIds[key]);
        if (!el) return;
        let v = (row && row[key] != null) ? row[key] : '';
        if (key === 'area_m2') v = (v === null || v === undefined) ? '' : String(v);
        el.value = String(v);
      });

      modalOverlay.style.display = 'flex';
    }

    function closeModal() {
      modalOverlay.style.display = 'none';
    }

    function buildQuery() {
      const params = [];
      const keyword = (searchInput.value || '').trim();
      const provinceName = provinceSelect.value || '';
      const partitionName = partitionSelect.value || '';
      const centerName = centerSelect.value || '';

      if (keyword) params.push('keyword=' + encodeURIComponent(keyword));
      if (provinceName) params.push('provinceName=' + encodeURIComponent(provinceName));
      if (partitionName) params.push('partitionName=' + encodeURIComponent(partitionName));
      if (centerName) params.push('centerName=' + encodeURIComponent(centerName));

      params.push('page=' + encodeURIComponent(String(currentPage)));
      params.push('pageSize=' + encodeURIComponent(String(pageSize)));
      return params.length ? ('?' + params.join('&')) : '';
    }

    function renderTable(rows) {
      if (!Array.isArray(rows) || !rows.length) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;color:var(--text-secondary);padding:22px;">暂无数据</td></tr>';
        return;
      }

      tbody.innerHTML = rows.map(function (r) {
        const addr = String(r.address || '');
        const addrSafe = escapeHtml(addr);
        const addrTitle = escapeHtml(addr.replace(/\n/g, ' '));
        return '' +
          '<tr data-id="' + escapeHtml(r.id) + '">' +
            '<td>' + escapeHtml(r.province_code || '') + '</td>' +
            '<td>' + escapeHtml(r.province_name || '') + '</td>' +
            '<td>' + escapeHtml(r.partition_name || '') + '</td>' +
            '<td>' + escapeHtml(r.operation_manager || '') + '</td>' +
            '<td>' + escapeHtml(r.center_code || '') + '</td>' +
            '<td>' + escapeHtml(r.center_name || '') + '</td>' +
            '<td>' + escapeHtml(r.site_level || '') + '</td>' +
            '<td>' + escapeHtml(r.site_attribute || '') + '</td>' +
            '<td>' + escapeHtml(r.manager || '') + '</td>' +
            '<td>' + escapeHtml(r.phone || '') + '</td>' +
            '<td style="max-width:360px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + addrTitle + '">' + addrSafe + '</td>' +
            '<td>' +
              '<button class="btn btn-outline btn-sm" data-action="edit" type="button" style="padding:6px 10px;margin-right:8px;">编辑</button>' +
              '<button class="btn btn-outline btn-sm" data-action="delete" type="button" style="padding:6px 10px;color:var(--danger);border-color:rgba(244,63,94,.35);">删除</button>' +
            '</td>' +
          '</tr>';
      }).join('');
    }

    function renderPager(total) {
      totalText.textContent = '共 ' + total + ' 条记录';
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;

      const btns = [];
      const pushBtn = function (label, page, active, disabled) {
        btns.push(
          '<button class="pagination-btn' + (active ? ' active' : '') + '" data-page="' + page + '" ' + (disabled ? 'disabled' : '') + '>' + label + '</button>'
        );
      };

      pushBtn('&lt;', String(Math.max(1, currentPage - 1)), false, currentPage <= 1);

      const windowSize = 7;
      let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
      let end = Math.min(totalPages, start + windowSize - 1);
      start = Math.max(1, end - windowSize + 1);

      if (start > 1) {
        pushBtn('1', '1', currentPage === 1, false);
        if (start > 2) pushBtn('...', String(Math.max(1, start - 1)), false, false);
      }

      for (let p = start; p <= end; p++) {
        pushBtn(String(p), String(p), p === currentPage, false);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pushBtn('...', String(Math.min(totalPages, end + 1)), false, false);
        pushBtn(String(totalPages), String(totalPages), currentPage === totalPages, false);
      }

      pushBtn('&gt;', String(Math.min(totalPages, currentPage + 1)), false, currentPage >= totalPages);
      pager.innerHTML = btns.join('');
    }

    function refreshCenterOptions() {
      const provinceName = provinceSelect.value || '';
      let centers = centersData || [];
      if (provinceName) centers = centers.filter(function (c) { return c && c.provinceName === provinceName; });
      const names = centers.map(function (c) { return c.name; }).filter(Boolean);
      const unique = Array.from(new Set(names));
      centerSelect.innerHTML = '<option value="">全部</option>' + unique.map(function (n) {
        return '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + '</option>';
      }).join('');
    }

    function refreshPartitionOptions() {
      const provinceName = provinceSelect.value || '';
      let provs = provincesData || [];
      if (provinceName) provs = provs.filter(function (p) { return p && p.name === provinceName; });
      const parts = provs.map(function (p) { return p.partitionName; }).filter(Boolean);
      const unique = Array.from(new Set(parts));
      partitionSelect.innerHTML = '<option value="">全部</option>' + unique.map(function (n) {
        return '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + '</option>';
      }).join('');
    }

    function refreshProvinceOptions() {
      const names = (provincesData || []).map(function (p) { return p.name; }).filter(Boolean);
      const unique = Array.from(new Set(names));
      provinceSelect.innerHTML = '<option value="">全部</option>' + unique.map(function (n) {
        return '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + '</option>';
      }).join('');
    }

    function load() {
      if (loading) return;
      setLoading(true);
      apiGet('/api/site-ledger' + buildQuery()).then(function (resp) {
        currentRows = resp && Array.isArray(resp.rows) ? resp.rows : [];
        renderTable(currentRows);
        renderPager(Number(resp && resp.total ? resp.total : 0));
      }).catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;color:var(--danger);padding:22px;">加载失败：' + escapeHtml(err.message) + '</td></tr>';
        pager.innerHTML = '';
        totalText.textContent = '加载失败';
      }).finally(function () {
        setLoading(false);
      });
    }

    function collectFormBody() {
      const body = {};
      Object.keys(fieldIds).forEach(function (key) {
        if (key === 'id') return;
        const el = document.getElementById(fieldIds[key]);
        if (!el) return;
        body[key] = el.value;
      });
      return body;
    }

    function validateForm(body) {
      if (!String(body.center_code || '').trim() || !String(body.center_name || '').trim()) {
        modalHint.style.color = 'var(--danger)';
        modalHint.textContent = '请填写中心编码与中心名称（必填）。';
        return false;
      }
      return true;
    }

    function saveForm() {
      if (loading) return;
      modalHint.textContent = '';
      const editingId = (document.getElementById(fieldIds.id).value || '').trim();
      const body = collectFormBody();
      if (!validateForm(body)) return;

      setLoading(true);
      const req = editingId ? apiPatch('/api/site-ledger/' + encodeURIComponent(editingId), body) : apiPost('/api/site-ledger', body);
      req.then(function () {
        closeModal();
        load();
        alert(editingId ? '更新成功' : '新增成功');
      }).catch(function (err) {
        modalHint.style.color = 'var(--danger)';
        modalHint.textContent = '保存失败：' + err.message;
      }).finally(function () {
        setLoading(false);
      });
    }

    function exportCsv() {
      if (!currentRows.length) {
        alert('当前无数据可导出。');
        return;
      }
      const headers = ['省区编码', '省区名称', '分区名称', '运营负责人', '中心编码', '中心名称', '中心简称', '类型', '级别', '属性', '负责人', '电话', '地址', '面积(㎡)', '用途', '安全设施配置', '备注'];
      const lines = [headers.join(',')];
      currentRows.forEach(function (r) {
        const values = [
          r.province_code, r.province_name, r.partition_name, r.operation_manager,
          r.center_code, r.center_name, r.center_short_name, r.site_type, r.site_level, r.site_attribute,
          r.manager, r.phone, r.address,
          r.area_m2, r.usage_desc, r.safety_facilities, r.remark
        ].map(function (v) {
          const s = String(v == null ? '' : v);
          const escaped = s.replace(/\"/g, '""');
          return /[",\n]/.test(escaped) ? '"' + escaped + '"' : escaped;
        });
        lines.push(values.join(','));
      });
      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      a.download = '场地信息台账_' + y + m + d + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    tbody.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      const id = tr.getAttribute('data-id');
      const row = currentRows.find(function (r) { return String(r.id) === String(id); });
      if (!row) return;
      const action = btn.getAttribute('data-action');

      if (action === 'edit') {
        openModal('edit', row);
        return;
      }

      if (action === 'delete') {
        const name = row.center_name || row.center_code || '';
        if (!confirm('确认删除：' + name + ' ?')) return;
        setLoading(true);
        apiDelete('/api/site-ledger/' + encodeURIComponent(String(id))).then(function () {
          alert('删除成功');
          load();
        }).catch(function (err) {
          alert('删除失败：' + err.message);
        }).finally(function () {
          setLoading(false);
        });
      }
    });

    pager.addEventListener('click', function (e) {
      const btn = e.target.closest('button.pagination-btn');
      if (!btn || btn.disabled) return;
      const p = parseInt(btn.dataset.page, 10);
      if (!isNaN(p) && p >= 1) {
        currentPage = p;
        load();
      }
    });

    addBtn.addEventListener('click', function () {
      openModal('add', null);
    });

    importBtn.addEventListener('click', function () {
      if (!confirm('将从本地 `data/provinces_centers.csv` 导入/覆盖通讯录数据（按中心编码更新）。继续？')) return;
      setLoading(true);
      apiPost('/api/site-ledger/import/provinces-centers', {}).then(function (resp) {
        const msg = (resp && resp.message) ? resp.message : '导入完成';
        alert(msg + '：共 ' + (resp.total || 0) + ' 行，新增 ' + (resp.inserted || 0) + '，更新 ' + (resp.updated || 0) + '，跳过 ' + (resp.skipped || 0));
        currentPage = 1;
        load();
      }).catch(function (err) {
        alert('导入失败：' + err.message);
      }).finally(function () {
        setLoading(false);
      });
    });

    exportBtn.addEventListener('click', exportCsv);

    resetBtn.addEventListener('click', function () {
      provinceSelect.value = '';
      partitionSelect.value = '';
      centerSelect.value = '';
      searchInput.value = '';
      currentPage = 1;
      refreshPartitionOptions();
      refreshCenterOptions();
      load();
    });

    provinceSelect.addEventListener('change', function () {
      currentPage = 1;
      refreshPartitionOptions();
      refreshCenterOptions();
      load();
    });
    partitionSelect.addEventListener('change', function () {
      currentPage = 1;
      load();
    });
    centerSelect.addEventListener('change', function () {
      currentPage = 1;
      load();
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        currentPage = 1;
        load();
      }
    });

    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
    modalSave.addEventListener('click', saveForm);

    fetchLocationsData().then(function () {
      refreshProvinceOptions();
      refreshPartitionOptions();
      refreshCenterOptions();
      load();
    }).catch(function () {
      // 即便主数据加载失败，也允许直接按关键字查询
      load();
    });
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

  // ============ 申安学堂 ============
  function renderTrainingFeatureCards(activeTab) {
    const featureCardMap = {
      'safety-training':
        buildFeatureCard('培训课程库', '课程分级管理，支持在线学习与线下签到', 'var(--primary-light)', 'var(--primary)', '课程 86 门', 'training-course-library') +
        buildFeatureCard('培训计划', '计划制定与执行追踪', 'var(--info-light)', 'var(--info)', '本年 12 期', 'training-plan') +
        buildFeatureCard('三级教育', '三级闭环管理，扫码签到与补录', 'var(--success-light)', 'var(--success)', '闭环 81.6%', 'three-education'),
      'publicity-materials':
        buildFeatureCard('宣传资料库', '宣教资料统一管理与分发', 'var(--warning-light)', 'var(--warning)', '资料 256 份', 'publicity-materials-library'),
      'exam-assessment':
        buildFeatureCard('在线考试', '在线组卷与成绩管理', 'var(--danger-light)', 'var(--danger)', '本月 3 场', 'online-exam') +
        buildFeatureCard('证书管理', '证书生成与查询', 'var(--primary-light)', 'var(--primary)', '已发放 892 张')
    };

    return featureCardMap[activeTab] || featureCardMap['safety-training'];
  }

  function renderThreeEducationPanel() {
    const activeTab = 'template-management';
    return '' +
      '<section class="three-education-panel three-education-panel-compact" style="margin-top:0;">' +
        '<div class="tab-nav three-education-tabs" data-three-education-tabs>' +
          '<div class="tab-item active" data-three-education-tab="template-management">模板管理</div>' +
          '<div class="tab-item" data-three-education-tab="onboarding-training">入职培训</div>' +
          '<div class="tab-item" data-three-education-tab="record-query">记录查询</div>' +
        '</div>' +
        '<div class="three-education-tab-body" id="threeEducationTabBody">' +
          renderThreeEducationTabBody(activeTab) +
        '</div>' +
      '</section>';
  }

  function renderThreeEducationTabBody(activeTab) {
    const tabMap = {
      'template-management': renderThreeEducationTemplateManagement(),
      'onboarding-training': renderThreeEducationOnboardingTraining(),
      'record-query': renderThreeEducationRecordQuery()
    };
    return tabMap[activeTab] || tabMap['template-management'];
  }

  function getThreeEducationStoredAssets() {
    try {
      var raw = localStorage.getItem('threeEducationAssets_v1');
      var parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) {
      return [];
    }
  }

  function saveThreeEducationStoredAssets(assets) {
    try {
      localStorage.setItem('threeEducationAssets_v1', JSON.stringify(Array.isArray(assets) ? assets : []));
    } catch (e) { }
  }

  function ensureThreeEducationSeedAssets() {
    var existing = getThreeEducationStoredAssets();
    if (existing && existing.length) return;
    var now = Date.now();
    var seed = [
      { id: 'seed_company_courseware_1', type: 'courseware', level: 'company', title: '公司安全红线与制度宣贯课件', desc: '制度、红线、全员履责要点', version: 'v1.0', updatedAt: now - 86400000 * 20 },
      { id: 'seed_company_courseware_2', type: 'courseware', level: 'company', title: '全员安全责任与履职要点', desc: '履责清单与典型案例', version: 'v1.0', updatedAt: now - 86400000 * 18 },
      { id: 'seed_company_courseware_3', type: 'courseware', level: 'company', title: '事故警示教育（公司级）', desc: '典型事故案例复盘', version: 'v1.0', updatedAt: now - 86400000 * 12 },
      { id: 'seed_company_courseware_4', type: 'courseware', level: 'company', title: '消防基础与应急疏散', desc: '消防器材与疏散要点', version: 'v1.0', updatedAt: now - 86400000 * 10 },
      { id: 'seed_company_courseware_5', type: 'courseware', level: 'company', title: '个人防护与劳保用品规范', desc: 'PPE 选用与佩戴', version: 'v1.0', updatedAt: now - 86400000 * 7 },
      { id: 'seed_center_template_1', type: 'template', level: 'center', title: '转运中心级入职教育签到表模板', desc: '含二维码签到与补录字段', version: 'v1.0', updatedAt: now - 86400000 * 15 },
      { id: 'seed_center_template_2', type: 'template', level: 'center', title: '设备操作安全考核模板', desc: '叉车/输送设备安全题库模板', version: 'v1.0', updatedAt: now - 86400000 * 13 },
      { id: 'seed_center_template_3', type: 'template', level: 'center', title: '特殊作业安全告知书模板', desc: '动火/高处/有限空间', version: 'v1.0', updatedAt: now - 86400000 * 9 },
      { id: 'seed_center_template_4', type: 'template', level: 'center', title: '场地风险辨识清单模板', desc: '区域风险与控制措施', version: 'v1.0', updatedAt: now - 86400000 * 6 },
      { id: 'seed_center_template_5', type: 'template', level: 'center', title: '应急演练记录模板', desc: '演练流程与照片留痕', version: 'v1.0', updatedAt: now - 86400000 * 5 },
      { id: 'seed_center_template_6', type: 'template', level: 'center', title: '新员工三级教育考核试卷模板', desc: '选择/判断/简答', version: 'v1.0', updatedAt: now - 86400000 * 4 },
      { id: 'seed_center_template_7', type: 'template', level: 'center', title: '班前会安全交底模板（中心）', desc: '当班风险与注意事项', version: 'v1.0', updatedAt: now - 86400000 * 3 },
      { id: 'seed_team_template_1', type: 'template', level: 'team', title: '班组级岗位 SOP 考核模板', desc: '岗位操作标准与考核', version: 'v1.0', updatedAt: now - 86400000 * 11 },
      { id: 'seed_team_template_2', type: 'template', level: 'team', title: '班前交底记录模板（班组）', desc: '交底要点与签字', version: 'v1.0', updatedAt: now - 86400000 * 8 },
      { id: 'seed_team_template_3', type: 'template', level: 'team', title: '应急动作卡确认单模板', desc: '关键应急动作确认', version: 'v1.0', updatedAt: now - 86400000 * 6 },
      { id: 'seed_team_template_4', type: 'template', level: 'team', title: '劳保发放与佩戴检查表模板', desc: '班组现场抽查', version: 'v1.0', updatedAt: now - 86400000 * 5 },
      { id: 'seed_team_template_5', type: 'template', level: 'team', title: '新员工班组带教记录模板', desc: '师徒带教与评价', version: 'v1.0', updatedAt: now - 86400000 * 4 },
      { id: 'seed_team_template_6', type: 'template', level: 'team', title: '班组级安全教育试题模板', desc: '岗位风险与防护', version: 'v1.0', updatedAt: now - 86400000 * 2 }
    ];
    saveThreeEducationStoredAssets(seed);
  }

  function formatThreeEducationDate(ts) {
    if (!ts) return '-';
    try {
      var d = new Date(ts);
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      var hh = String(d.getHours()).padStart(2, '0');
      var mm = String(d.getMinutes()).padStart(2, '0');
      return y + '-' + m + '-' + day + ' ' + hh + ':' + mm;
    } catch (e) {
      return '-';
    }
  }

  function getThreeEducationLevelLabel(level) {
    if (level === 'company') return '公司级';
    if (level === 'center') return '中心级';
    if (level === 'team') return '班组级';
    return '未知';
  }

  function getThreeEducationTypeLabel(type) {
    if (type === 'courseware') return '课件';
    if (type === 'template') return '考核模板';
    return '未知';
  }

  // ============ QR Code (轻量版，固定 Version 4 / EC Level L / Mask 0) ============
  // 说明：用于生成较短 URL（建议使用 /ot/:token 形式），适配本项目“入职培训”二维码展示与下载。
  function renderThreeEduQr(canvas, text, outSize) {
    var input = String(text || '');
    if (!input) throw new Error('empty');
    var modules = makeQrV4LMask0(input);
    drawQrToCanvas(canvas, modules, outSize || 220);
  }

  function utf8Bytes(str) {
    try {
      if (window.TextEncoder) return Array.from(new TextEncoder().encode(str));
    } catch (e) { }
    // fallback
    var s = unescape(encodeURIComponent(str));
    var bytes = [];
    for (var i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i) & 0xff);
    return bytes;
  }

  function makeQrV4LMask0(text) {
    // Version 4: 33x33, Level L: data cw=80, ecc cw=20, total cw=100.
    var bytes = utf8Bytes(text);
    // Byte-mode capacity (v4-L) ~ 78 bytes (after overhead)
    if (bytes.length > 78) throw new Error('内容过长，建议使用更短域名/路径');

    var dataCw = makeV4LDataCodewords(bytes);
    var eccCw = reedSolomonCompute(dataCw, 20);
    var codewords = dataCw.concat(eccCw);

    var size = 33;
    var modules = [];
    var isFunc = [];
    for (var r = 0; r < size; r++) {
      modules[r] = [];
      isFunc[r] = [];
      for (var c = 0; c < size; c++) { modules[r][c] = null; isFunc[r][c] = false; }
    }

    function setFunc(r, c, val) {
      if (r < 0 || c < 0 || r >= size || c >= size) return;
      modules[r][c] = !!val;
      isFunc[r][c] = true;
    }

    function addFinder(r0, c0) {
      for (var r = -1; r <= 7; r++) {
        for (var c = -1; c <= 7; c++) {
          var rr = r0 + r;
          var cc = c0 + c;
          if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
          var isBorder = (r === -1 || r === 7 || c === -1 || c === 7);
          var isDark = (r >= 0 && r <= 6 && c >= 0 && c <= 6 &&
            (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)));
          setFunc(rr, cc, !isBorder && isDark);
        }
      }
    }

    function addTiming() {
      for (var i = 8; i < size - 8; i++) {
        var bit = (i % 2 === 0);
        if (!isFunc[6][i]) setFunc(6, i, bit);
        if (!isFunc[i][6]) setFunc(i, 6, bit);
      }
    }

    function addAlignment(centerR, centerC) {
      for (var r = -2; r <= 2; r++) {
        for (var c = -2; c <= 2; c++) {
          var rr = centerR + r;
          var cc = centerC + c;
          var isDark = (Math.max(Math.abs(r), Math.abs(c)) !== 1);
          setFunc(rr, cc, isDark);
        }
      }
    }

    // patterns
    addFinder(0, 0);
    addFinder(0, size - 7);
    addFinder(size - 7, 0);
    addTiming();
    // alignment (v4: positions [6,26], only (26,26) applicable)
    addAlignment(26, 26);

    // reserve format info areas
    for (var i = 0; i < 9; i++) {
      if (i !== 6) { setFunc(8, i, false); setFunc(i, 8, false); }
    }
    for (var j = 0; j < 8; j++) setFunc(8, size - 1 - j, false);
    for (var k = 0; k < 7; k++) setFunc(size - 1 - k, 8, false);
    // dark module (fixed)
    setFunc(size - 8, 8, true);

    // place data bits
    var bitLen = codewords.length * 8;
    var bitIndex = 0;
    var upward = true;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (var rowStep = 0; rowStep < size; rowStep++) {
        var r = upward ? (size - 1 - rowStep) : rowStep;
        for (var ccOff = 0; ccOff < 2; ccOff++) {
          var c = col - ccOff;
          if (modules[r][c] !== null) continue;
          var bit = false;
          if (bitIndex < bitLen) {
            var b = codewords[(bitIndex / 8) | 0];
            bit = (((b >>> (7 - (bitIndex & 7))) & 1) === 1);
          }
          bitIndex++;
          // mask 0
          if (((r + c) & 1) === 0) bit = !bit;
          modules[r][c] = bit;
        }
      }
      upward = !upward;
    }

    // setup format info (Level L=01, mask=000)
    var format = makeFormatInfoBits(1, 0);
    for (var t = 0; t < 15; t++) {
      var bit2 = ((format >>> t) & 1) === 1;
      // vertical: col 8
      var vr = (t < 6) ? t : (t < 8 ? t + 1 : size - 15 + t);
      setFunc(vr, 8, bit2);
      // horizontal: row 8
      var hc = (t < 8) ? (size - 1 - t) : (14 - t);
      setFunc(8, hc, bit2);
    }

    // fill remaining nulls with light modules
    for (var rr = 0; rr < size; rr++) {
      for (var cc = 0; cc < size; cc++) {
        if (modules[rr][cc] === null) modules[rr][cc] = false;
      }
    }
    return modules;
  }

  function makeV4LDataCodewords(bytes) {
    var dataCodewords = 80;
    var bits = [];
    function pushBits(val, len) {
      for (var i = len - 1; i >= 0; i--) bits.push(((val >>> i) & 1) === 1);
    }
    // mode indicator: byte mode = 0100
    pushBits(0x4, 4);
    pushBits(bytes.length, 8);
    for (var i = 0; i < bytes.length; i++) pushBits(bytes[i], 8);
    // terminator up to 4 zeros
    var maxBits = dataCodewords * 8;
    for (var t = 0; t < 4 && bits.length < maxBits; t++) bits.push(false);
    // pad to byte boundary
    while (bits.length % 8 !== 0) bits.push(false);
    // codewords
    var cw = [];
    for (var b = 0; b < bits.length; b += 8) {
      var v = 0;
      for (var k = 0; k < 8; k++) v = (v << 1) | (bits[b + k] ? 1 : 0);
      cw.push(v);
    }
    // pad bytes 0xEC, 0x11
    var pads = [0xEC, 0x11];
    var pi = 0;
    while (cw.length < dataCodewords) {
      cw.push(pads[pi & 1]);
      pi++;
    }
    return cw;
  }

  function gfTables() {
    var exp = new Array(512);
    var log = new Array(256);
    var x = 1;
    for (var i = 0; i < 255; i++) {
      exp[i] = x;
      log[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) exp[j] = exp[j - 255];
    log[0] = 0;
    return { exp: exp, log: log };
  }

  function gfMul(a, b, tab) {
    if (a === 0 || b === 0) return 0;
    return tab.exp[tab.log[a] + tab.log[b]];
  }

  function polyMul(p, q, tab) {
    var res = new Array(p.length + q.length - 1);
    for (var i = 0; i < res.length; i++) res[i] = 0;
    for (var i2 = 0; i2 < p.length; i2++) {
      for (var j = 0; j < q.length; j++) {
        res[i2 + j] ^= gfMul(p[i2], q[j], tab);
      }
    }
    return res;
  }

  function rsGeneratorPoly(deg, tab) {
    var poly = [1];
    for (var i = 0; i < deg; i++) {
      poly = polyMul(poly, [1, tab.exp[i]], tab);
    }
    return poly;
  }

  function reedSolomonCompute(data, eccLen) {
    var tab = gfTables();
    var gen = rsGeneratorPoly(eccLen, tab); // length eccLen+1
    var ecc = new Array(eccLen);
    for (var i = 0; i < eccLen; i++) ecc[i] = 0;

    for (var d = 0; d < data.length; d++) {
      var factor = data[d] ^ ecc[0];
      for (var e = 0; e < eccLen - 1; e++) ecc[e] = ecc[e + 1];
      ecc[eccLen - 1] = 0;
      for (var j = 0; j < eccLen; j++) {
        ecc[j] ^= gfMul(gen[j + 1], factor, tab);
      }
    }
    return ecc;
  }

  function bchDigit(data) {
    var digit = 0;
    while (data !== 0) { digit++; data >>>= 1; }
    return digit;
  }

  function makeFormatInfoBits(eclBits, mask) {
    var data = ((eclBits & 0x3) << 3) | (mask & 0x7);
    var d = data << 10;
    var g = 0x537; // 10100110111
    while (bchDigit(d) - bchDigit(g) >= 0) {
      d ^= (g << (bchDigit(d) - bchDigit(g)));
    }
    var bits = ((data << 10) | d) ^ 0x5412;
    return bits & 0x7fff;
  }

  function drawQrToCanvas(canvas, modules, outSize) {
    var ctx = canvas.getContext('2d');
    var size = modules.length;
    var quiet = 4;
    var full = size + quiet * 2;
    var scale = Math.floor(outSize / full);
    if (scale < 1) scale = 1;
    var actual = full * scale;
    canvas.width = actual;
    canvas.height = actual;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, actual, actual);
    ctx.fillStyle = '#000';
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (modules[r][c]) {
          ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
        }
      }
    }
  }

  function getThreeEducationCounts(assets) {
    var counts = {
      company: { courseware: 0, template: 0 },
      center: { courseware: 0, template: 0 },
      team: { courseware: 0, template: 0 }
    };
    (assets || []).forEach(function (a) {
      if (!a || !counts[a.level] || !counts[a.level][a.type]) return;
      counts[a.level][a.type] += 1;
    });
    return counts;
  }

  function renderThreeEducationTemplateManagement() {
    ensureThreeEducationSeedAssets();
    return '' +
      '<div class="three-education-card">' +
        '<div class="three-education-card-header">' +
          '<div>' +
            '<div class="section-title no-marker">模板与课件管理</div>' +
            '<div class="three-education-subtitle">安全员维护入职教育的培训课件与考核模板；支持新建、导入、上传与下载留痕。</div>' +
          '</div>' +
          '<div class="three-education-card-actions">' +
            '<button class="btn btn-primary btn-sm" type="button" id="threeEduNewTemplateBtn">新建模板</button>' +
            '<button class="btn btn-outline btn-sm" type="button" id="threeEduImportAssetsBtn">导入模板</button>' +
            '<button class="btn btn-outline btn-sm" type="button" id="threeEduUploadCoursewareBtn">上传课件</button>' +
            '<button class="btn btn-outline btn-sm" type="button" id="threeEduExportAssetsBtn">下载模板/课件清单</button>' +
          '</div>' +
        '</div>' +
        '<div class="data-table-wrapper" style="margin-top:18px;">' +
          '<div class="table-toolbar">' +
            '<div class="table-toolbar-left">' +
              '<div class="table-filter">' +
                '<span>级别：</span>' +
                '<select id="threeEduAssetLevelFilter">' +
                  '<option value=\"\">全部</option>' +
                  '<option value=\"company\">公司级</option>' +
                  '<option value=\"center\">中心级</option>' +
                  '<option value=\"team\">班组级</option>' +
                '</select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>类型：</span>' +
                '<select id="threeEduAssetTypeFilter">' +
                  '<option value=\"\">全部</option>' +
                  '<option value=\"courseware\">课件</option>' +
                  '<option value=\"template\">考核模板</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="table-search">' +
              '<svg viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"M21 21l-4.35-4.35\"/></svg>' +
              '<input type="text" id="threeEduAssetSearchInput" placeholder="搜索名称 / 说明...">' +
            '</div>' +
          '</div>' +
        '<table class="data-table three-education-assets-table" id="threeEduAssetsTable">' +
            '<thead><tr>' +
              '<th>名称</th><th>级别</th><th>类型</th><th>版本</th><th>更新时间</th><th>附件</th><th>操作</th>' +
            '</tr></thead>' +
            '<tbody id="threeEduAssetsTbody"></tbody>' +
          '</table>' +
          '<div class="table-pagination">' +
            '<span id="threeEduAssetsCount">共 0 条记录</span>' +
            '<div class="pagination-btns" id="threeEduAssetsPager"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderThreeEducationOnboardingTraining() {
    return '' +
      '<div class="three-education-card">' +
        '<div class="three-education-card-header">' +
          '<div>' +
            '<div class="section-title no-marker">入职培训组织</div>' +
            '<div class="three-education-subtitle">新建培训场次时选择课件与考核模板；创建后生成二维码供员工扫码签到（手机端答题待开发）。</div>' +
          '</div>' +
          '<div class="three-education-card-actions three-edu-onb-actions">' +
            '<button class="btn btn-primary" type="button" id="threeEduNewOnboardingTrainingBtn">新建培训场次</button>' +
            '<button class="btn btn-outline" type="button" id="threeEduRefreshOnboardingTrainingBtn">刷新</button>' +
          '</div>' +
        '</div>' +
        '<div class="data-table-wrapper" style="margin-top:0;">' +
          '<div class="table-toolbar">' +
            '<div class="table-toolbar-left"></div>' +
          '</div>' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th>场次</th><th>时间</th><th>地点</th><th>课件</th><th>考核模板</th><th>二维码有效期</th><th>签到</th><th>存档</th><th>操作</th>' +
            '</tr></thead>' +
            '<tbody id="threeEduOnboardingTrainingTbody"></tbody>' +
          '</table>' +
          '<div class="table-pagination" style="justify-content:space-between;">' +
            '<span id="threeEduOnboardingTrainingCount">共 0 条记录</span>' +
            '<div class="pagination-btns" id="threeEduOnbPager"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderThreeEducationRecordQuery() {
    return '' +
      '<div class="three-education-card">' +
        '<div class="three-education-card-header">' +
          '<div>' +
            '<div class="section-title no-marker">记录查询</div>' +
            '<div class="three-education-subtitle">按员工/中心/时间快速检索三级完成情况，支持导出。</div>' +
          '</div>' +
          '<div class="three-education-search">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
            '<input type="text" id="threeEduRecordQuerySearch" placeholder="搜索姓名 / 工号...">' +
          '</div>' +
        '</div>' +
        '<table class="three-education-status-table three-education-status-table-compact">' +
          '<thead><tr><th>员工</th><th>培训时间</th><th>公司级</th><th>中心级</th><th>班组级</th><th>状态</th><th>详情</th></tr></thead>' +
          '<tbody id="threeEduRecordQueryTbody"></tbody>' +
        '</table>' +
        '<div class="three-education-status-actions">' +
          '<button class="btn btn-outline btn-sm" type="button" id="threeEduRecordQueryExportBtn">导出记录</button>' +
        '</div>' +
      '</div>';
  }

  function initThreeEducation() {
    const tabNav = document.querySelector('.tab-nav[data-three-education-tabs]');
    const body = document.getElementById('threeEducationTabBody');
    if (!tabNav || !body) return;

    tabNav.addEventListener('click', function (e) {
      const tab = e.target.closest('.tab-item[data-three-education-tab]');
      if (!tab) return;

      tabNav.querySelectorAll('.tab-item[data-three-education-tab]').forEach(function (item) {
        item.classList.remove('active');
      });
      tab.classList.add('active');

      const key = tab.dataset.threeEducationTab;
      body.innerHTML = renderThreeEducationTabBody(key);
      if (key === 'template-management') initThreeEducationTemplateManagement();
      if (key === 'onboarding-training') initThreeEducationOnboardingTraining();
      if (key === 'record-query') initThreeEducationRecordQuery();
    });

    initThreeEducationTemplateManagement();
  }

  function initThreeEducationRecordQuery() {
    var tbody = document.getElementById('threeEduRecordQueryTbody');
    var searchInput = document.getElementById('threeEduRecordQuerySearch');
    var exportBtn = document.getElementById('threeEduRecordQueryExportBtn');
    if (!tbody) return;

    function esc(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatDt(val) {
      if (!val) return '-';
      try {
        var d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        return y + '-' + m + '-' + day + ' ' + hh + ':' + mm;
      } catch (e) {
        return String(val);
      }
    }

    function badge(text) {
      var t = String(text || '');
      // simple mapping
      var cls = 'wait';
      if (t === '已完成' || t === '线上完成' || t === '线下补录') cls = 'done';
      else if (t === '待签到' || t === '待考核') cls = 'pending';
      else if (t === '进行中') cls = 'progress';
      else if (t === '未闭环') cls = 'open';
      else if (t === '已闭环') cls = 'success';
      return '<span class="mini-badge ' + cls + '">' + esc(t || '-') + '</span>';
    }

    function seedRows() {
      return [
        {
          id: 'u1',
          name: '王磊',
          employeeNo: 'STO001',
          trainingTime: '2026-04-16 11:17:00',
          company: '已完成',
          center: '已完成',
          team: '待签到',
          status: '未闭环',
          detail: {
            summary: '班组级待完成；可补录纸质考核照片。',
            photos: []
          }
        },
        {
          id: 'u2',
          name: '刘芳',
          employeeNo: 'STO002',
          trainingTime: '2026-04-15 15:30:00',
          company: '线上完成',
          center: '线下补录',
          team: '已完成',
          status: '已闭环',
          detail: {
            summary: '中心级线下补录；照片存档待接入按人维度。',
            photos: []
          }
        },
        {
          id: 'u3',
          name: '赵强',
          employeeNo: 'STO003',
          trainingTime: '2026-04-10 09:00:00',
          company: '已完成',
          center: '进行中',
          team: '未开始',
          status: '未闭环',
          detail: {
            summary: '中心级进行中；班组级未开始。',
            photos: []
          }
        }
      ];
    }

    var rows = seedRows();
    var current = rows.slice();

    function render(list) {
      current = Array.isArray(list) ? list.slice() : [];
      if (!current.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:16px 0;">暂无记录</td></tr>';
        return;
      }
      tbody.innerHTML = current.map(function (r) {
        return '' +
          '<tr data-id="' + esc(r.id) + '">' +
            '<td style="font-weight:700;">' + esc(r.name || '-') + '<div style="margin-top:4px;font-size:12px;color:var(--text-tertiary);font-family:monospace;">' + esc(r.employeeNo || '-') + '</div></td>' +
            '<td style="font-family:monospace;">' + esc(formatDt(r.trainingTime)) + '</td>' +
            '<td>' + badge(r.company) + '</td>' +
            '<td>' + badge(r.center) + '</td>' +
            '<td>' + badge(r.team) + '</td>' +
            '<td>' + badge(r.status) + '</td>' +
            '<td><button class="btn btn-outline btn-sm" type="button" data-three-edu-record-action="detail">查看</button></td>' +
          '</tr>';
      }).join('');
    }

    function ensureDetailModal() {
      if (document.getElementById('threeEduRecordDetailModalOverlay')) return;
      document.body.insertAdjacentHTML('beforeend', '' +
        '<div class="modal-overlay" id="threeEduRecordDetailModalOverlay" style="display:none;">' +
          '<div class="modal modal-hazard-detail" role="dialog" aria-modal="true" style="max-width:860px;">' +
            '<div class="modal-header">' +
              '<div class="modal-title">员工三级教育详情</div>' +
              '<button class="modal-close" type="button" data-close>×</button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<div class="hazard-detail-info" id="threeEduRecordDetailInfo"></div>' +
              '<div class="hazard-detail-section">' +
                '<div class="form-label">考试/考核照片（示例占位）</div>' +
                '<div class="hazard-imgs-row" id="threeEduRecordDetailPhotos"></div>' +
                '<div class="text-muted" style="margin-top:8px;line-height:1.6;">当前为轻量版：按“员工维度”的成绩/照片存档接口待接入；可先在“入职培训”场次维度上传纸质考核照片进行归档。</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>');

      var overlay = document.getElementById('threeEduRecordDetailModalOverlay');
      if (overlay) {
        overlay.addEventListener('click', function (e) {
          if (e.target === overlay) overlay.style.display = 'none';
        });
        overlay.querySelectorAll('[data-close]').forEach(function (btn) {
          btn.addEventListener('click', function () { overlay.style.display = 'none'; });
        });
      }
    }

    function openDetail(row) {
      ensureDetailModal();
      var infoEl = document.getElementById('threeEduRecordDetailInfo');
      var photosEl = document.getElementById('threeEduRecordDetailPhotos');
      if (infoEl) {
        infoEl.innerHTML = '' +
          '<div class="hazard-detail-row"><div class="label">员工</div><div>' + esc(row.name || '-') + '</div></div>' +
          '<div class="hazard-detail-row"><div class="label">工号</div><div style="font-family:monospace;">' + esc(row.employeeNo || '-') + '</div></div>' +
          '<div class="hazard-detail-row"><div class="label">培训时间</div><div style="font-family:monospace;">' + esc(formatDt(row.trainingTime)) + '</div></div>' +
          '<div class="hazard-detail-row"><div class="label">公司级</div><div>' + badge(row.company) + '</div></div>' +
          '<div class="hazard-detail-row"><div class="label">中心级</div><div>' + badge(row.center) + '</div></div>' +
          '<div class="hazard-detail-row"><div class="label">班组级</div><div>' + badge(row.team) + '</div></div>' +
          '<div class="hazard-detail-row"><div class="label">备注</div><div>' + esc(row.detail && row.detail.summary ? row.detail.summary : '-') + '</div></div>';
      }
      if (photosEl) {
        var list = row.detail && Array.isArray(row.detail.photos) ? row.detail.photos : [];
        if (!list.length) photosEl.innerHTML = '<div class="text-muted">暂无照片</div>';
        else {
          photosEl.innerHTML = list.map(function (src) {
            return '<a href="' + esc(src) + '" target="_blank" rel="noopener"><img class="hazard-detail-img" src="' + esc(src) + '" alt="photo"></a>';
          }).join('');
        }
      }
      var overlay = document.getElementById('threeEduRecordDetailModalOverlay');
      if (overlay) overlay.style.display = 'flex';
    }

    function applySearch() {
      var term = searchInput ? String(searchInput.value || '').trim().toLowerCase() : '';
      if (!term) { render(rows); return; }
      render(rows.filter(function (r) {
        var hay = (String(r.name || '') + ' ' + String(r.employeeNo || '')).toLowerCase();
        return hay.indexOf(term) > -1;
      }));
    }

    render(rows);
    if (searchInput) searchInput.addEventListener('input', applySearch);
    if (exportBtn) exportBtn.addEventListener('click', function () {
      try {
        var blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json;charset=utf-8' });
        var stamp = new Date();
        var name = '三级教育-记录查询-' + stamp.getFullYear() + String(stamp.getMonth() + 1).padStart(2, '0') + String(stamp.getDate()).padStart(2, '0') + '.json';
        downloadBlob(blob, name);
      } catch (e) {
        alert('导出失败：' + (e && e.message ? e.message : '未知错误'));
      }
    });

    tbody.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('button[data-three-edu-record-action]') : null;
      if (!btn) return;
      var tr = btn.closest('tr[data-id]');
      if (!tr) return;
      var id = String(tr.dataset.id || '');
      var row = null;
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i].id) === id) { row = rows[i]; break; }
      }
      if (!row) return;
      if (btn.dataset.threeEduRecordAction === 'detail') openDetail(row);
    });
  }

  function initThreeEducationOnboardingTraining() {
    ensureThreeEducationSeedAssets();

    var newBtn = document.getElementById('threeEduNewOnboardingTrainingBtn');
    var refreshBtn = document.getElementById('threeEduRefreshOnboardingTrainingBtn');
    var tbody = document.getElementById('threeEduOnboardingTrainingTbody');
    var countEl = document.getElementById('threeEduOnboardingTrainingCount');
    var pagerEl = document.getElementById('threeEduOnbPager');
    if (!tbody) return;

    function esc(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatDt(val) {
      if (!val) return '-';
      try {
        var d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        return y + '-' + m + '-' + day + ' ' + hh + ':' + mm;
      } catch (e) {
        return String(val);
      }
    }

    function toMySqlDatetime(localVal) {
      if (!localVal) return null;
      var s = String(localVal).trim();
      if (!s) return null;
      // datetime-local returns "YYYY-MM-DDTHH:mm"
      if (s.indexOf('T') > -1) s = s.replace('T', ' ');
      if (s.length === 16) s = s + ':00';
      return s;
    }

    function getAssets() {
      var list = getThreeEducationStoredAssets();
      return Array.isArray(list) ? list.slice() : [];
    }

    function pickAssetById(assetId) {
      var assets = getAssets();
      for (var i = 0; i < assets.length; i++) {
        if (assets[i] && String(assets[i].id) === String(assetId)) return assets[i];
      }
      return null;
    }

    function ensureModals() {
      if (!document.getElementById('threeEduOnboardingModalOverlay')) {
        document.body.insertAdjacentHTML('beforeend', '' +
          '<div class="modal-overlay" id="threeEduOnboardingModalOverlay" style="display:none;">' +
            '<div class="modal" role="dialog" aria-modal="true" style="max-width:720px;">' +
              '<div class="modal-header">' +
                '<div class="modal-title">新建入职培训场次</div>' +
                '<button class="modal-close" type="button" data-close>×</button>' +
              '</div>' +
              '<div class="modal-body">' +
                '<div class="form-grid" style="grid-template-columns:1fr 1fr;">' +
                  '<div class="form-group" style="grid-column:1/3;">' +
                    '<label class="form-label">场次名称<span style="color:var(--danger);"> *</span></label>' +
                    '<input class="form-input" id="threeEduOnbTitle" placeholder="例如：2026年4月入职培训（夜班）">' +
                  '</div>' +
                  '<div class="form-group">' +
                    '<label class="form-label">开始时间</label>' +
                    '<input class="form-input" id="threeEduOnbStart" type="datetime-local">' +
                  '</div>' +
                  '<div class="form-group">' +
                    '<label class="form-label">结束时间</label>' +
                    '<input class="form-input" id="threeEduOnbEnd" type="datetime-local">' +
                  '</div>' +
                  '<div class="form-group" style="grid-column:1/3;">' +
                    '<label class="form-label">地点</label>' +
                    '<input class="form-input" id="threeEduOnbLocation" placeholder="例如：分拣场地会议室">' +
                  '</div>' +
                  '<div class="form-group">' +
                    '<label class="form-label">预计参训人数</label>' +
                    '<input class="form-input" id="threeEduOnbExpected" type="number" min="0" value="0">' +
                  '</div>' +
                  '<div class="form-group">' +
                    '<label class="form-label">课件</label>' +
                    '<select class="form-input" id="threeEduOnbCourseware"></select>' +
                  '</div>' +
                  '<div class="form-group" style="grid-column:1/3;">' +
                    '<label class="form-label">考核模板</label>' +
                    '<select class="form-input" id="threeEduOnbTemplate"></select>' +
                  '</div>' +
                '</div>' +
                '<div class="text-muted" style="margin-top:10px;line-height:1.6;">' +
                  '说明：二维码默认 2 小时有效；如无法手机扫码，可打印试卷线下考核后拍照上传存档。' +
                '</div>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button class="btn btn-outline" type="button" data-close>取消</button>' +
                '<button class="btn btn-primary" type="button" id="threeEduOnbSaveBtn">创建并生成二维码</button>' +
              '</div>' +
            '</div>' +
          '</div>');
      }

      if (!document.getElementById('threeEduOnbQrModalOverlay')) {
        document.body.insertAdjacentHTML('beforeend', '' +
          '<div class="modal-overlay" id="threeEduOnbQrModalOverlay" style="display:none;">' +
            '<div class="modal" role="dialog" aria-modal="true" style="max-width:640px;">' +
              '<div class="modal-header">' +
                '<div class="modal-title">签到二维码</div>' +
                '<button class="modal-close" type="button" data-close>×</button>' +
              '</div>' +
              '<div class="modal-body">' +
                '<div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">' +
                  '<div id="threeEduOnbQrWrap" style="width:220px;height:220px;border:1px solid var(--border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;background:#fff;"></div>' +
                  '<div style="flex:1;min-width:240px;">' +
                    '<div class="text-muted" id="threeEduOnbQrInfo" style="line-height:1.7;"></div>' +
                    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">' +
                      '<button class="btn btn-outline btn-sm" type="button" id="threeEduOnbCopyLinkBtn">复制链接</button>' +
                      '<button class="btn btn-outline btn-sm" type="button" id="threeEduOnbDownloadQrBtn">下载二维码</button>' +
                      '<button class="btn btn-primary btn-sm" type="button" id="threeEduOnbRegenQrBtn">重新生成（2小时）</button>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>');
      }

      if (!document.getElementById('threeEduOnbArchiveModalOverlay')) {
        document.body.insertAdjacentHTML('beforeend', '' +
          '<div class="modal-overlay" id="threeEduOnbArchiveModalOverlay" style="display:none;">' +
            '<div class="modal" role="dialog" aria-modal="true" style="max-width:620px;">' +
              '<div class="modal-header">' +
                '<div class="modal-title">上传考核存档</div>' +
                '<button class="modal-close" type="button" data-close>×</button>' +
              '</div>' +
              '<div class="modal-body">' +
                '<div class="form-group">' +
                  '<label class="form-label">拍照/选择图片（最多 12 张）</label>' +
                  '<input class="form-input" id="threeEduOnbArchiveFiles" type="file" accept="image/*" multiple>' +
                '</div>' +
                '<div class="text-muted" style="line-height:1.6;">建议：每张照片尽量清晰包含姓名、工号、成绩/签字等信息。</div>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button class="btn btn-outline" type="button" data-close>取消</button>' +
                '<button class="btn btn-primary" type="button" id="threeEduOnbArchiveUploadBtn">上传</button>' +
              '</div>' +
            '</div>' +
          '</div>');
      }

      if (!document.getElementById('threeEduOnbDetailModalOverlay')) {
        document.body.insertAdjacentHTML('beforeend', '' +
          '<div class="modal-overlay" id="threeEduOnbDetailModalOverlay" style="display:none;">' +
            '<div class="modal modal-hazard-detail" role="dialog" aria-modal="true" style="max-width:860px;">' +
              '<div class="modal-header">' +
                '<div class="modal-title">场次详情</div>' +
                '<button class="modal-close" type="button" data-close>×</button>' +
              '</div>' +
              '<div class="modal-body">' +
                '<div class="hazard-detail-info" id="threeEduOnbDetailInfo"></div>' +
                '<div class="hazard-detail-section">' +
                  '<div class="form-label">拍照存档</div>' +
                  '<div class="hazard-imgs-row" id="threeEduOnbDetailArchives"></div>' +
                '</div>' +
                '<div class="hazard-detail-section">' +
                  '<div class="form-label">签到记录（最多展示 200 条）</div>' +
                  '<div class="data-table-wrapper" style="margin-top:8px;">' +
                    '<table class="data-table" style="margin:0;">' +
                      '<thead><tr><th>姓名</th><th>工号</th><th>手机号</th><th>时间</th></tr></thead>' +
                      '<tbody id="threeEduOnbDetailAttendance"></tbody>' +
                    '</table>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>');
      }

      // bind close handlers once
      document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
        if (!overlay || overlay.dataset.closeBound) return;
        overlay.dataset.closeBound = '1';
        overlay.addEventListener('click', function (e) {
          if (e.target === overlay) overlay.style.display = 'none';
        });
        overlay.querySelectorAll('[data-close]').forEach(function (btn) {
          btn.addEventListener('click', function () { overlay.style.display = 'none'; });
        });
      });
    }

    function openOverlay(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.display = 'flex';
    }

    function closeOverlay(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.display = 'none';
    }

    function copyText(txt) {
      var text = String(txt || '');
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          alert('已复制');
        }).catch(function () {
          fallbackCopy(text);
        });
        return;
      }
      fallbackCopy(text);
    }

    function fallbackCopy(text) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        ta.remove();
        alert('已复制');
      } catch (e) {
        alert('复制失败，请手动复制链接。');
      }
    }

    function fetchJson(url, opts) {
      return fetch(url, opts).then(function (r) {
        return r.json().catch(function () { return null; }).then(function (data) {
          if (!r.ok) {
            var msg = data && (data.error || data.message) ? (data.error || data.message) : (r.status + ' ' + r.statusText);
            throw new Error(msg);
          }
          return data;
        });
      });
    }

    var cachedRows = [];
    var totalCount = 0;
    var pageSize = 10;
    var currentPage = 1;
    var activeTrainingForQr = null;
    var activeTrainingForArchive = null;

    function renderPager() {
      if (!pagerEl) return;
      pagerEl.innerHTML = '';
      var pages = totalCount ? Math.ceil(totalCount / pageSize) : 0;
      if (!pages || pages <= 1) return;

      if (currentPage < 1) currentPage = 1;
      if (currentPage > pages) currentPage = pages;

      function btn(page, label, active, disabled) {
        var cls = 'pagination-btn' + (active ? ' active' : '');
        var dis = disabled ? ' disabled' : '';
        return '<button class="' + cls + '" type="button" data-page="' + page + '"' + dis + '>' + label + '</button>';
      }
      function ellipsis() {
        return '<button class="pagination-btn" type="button" disabled>...</button>';
      }

      var html = '';
      html += btn('prev', '&lt;', false, currentPage === 1);
      if (pages <= 7) {
        for (var p = 1; p <= pages; p++) html += btn(String(p), String(p), p === currentPage, false);
      } else {
        html += btn('1', '1', currentPage === 1, false);
        var start = Math.max(2, currentPage - 2);
        var end = Math.min(pages - 1, currentPage + 2);
        if (start > 2) html += ellipsis();
        for (var i = start; i <= end; i++) html += btn(String(i), String(i), i === currentPage, false);
        if (end < pages - 1) html += ellipsis();
        html += btn(String(pages), String(pages), currentPage === pages, false);
      }
      html += btn('next', '&gt;', false, currentPage === pages);
      pagerEl.innerHTML = html;
    }

    function renderTable(rows) {
      cachedRows = Array.isArray(rows) ? rows.slice() : [];
      var shown = cachedRows;
      tbody.innerHTML = (shown || []).map(function (r) {
        var coursewareTitle = r.courseware_asset && r.courseware_asset.title ? r.courseware_asset.title : '-';
        var templateTitle = r.assessment_template_asset && r.assessment_template_asset.title ? r.assessment_template_asset.title : '-';
        var timeText = (r.start_time || r.end_time) ? (formatDt(r.start_time) + ' ~ ' + formatDt(r.end_time)) : '-';
        var expText = r.qr_expires_at ? formatDt(r.qr_expires_at) : '-';
        var attendanceCount = r.attendance_count == null ? '-' : String(r.attendance_count);
        var archiveCount = r.archive_count == null ? '-' : String(r.archive_count);

        return '' +
          '<tr data-id="' + esc(r.id) + '">' +
            '<td style="font-weight:700;">' + esc(r.title || '-') + '</td>' +
            '<td>' + esc(timeText) + '</td>' +
            '<td>' + esc(r.location || '-') + '</td>' +
            '<td>' + esc(coursewareTitle) + '</td>' +
            '<td>' + esc(templateTitle) + '</td>' +
            '<td>' + esc(expText) + '</td>' +
            '<td>' + esc(attendanceCount) + '</td>' +
            '<td>' + esc(archiveCount) + '</td>' +
            '<td>' +
              '<button class="btn btn-outline btn-sm" type="button" data-onb-action="qr">二维码</button>' +
              '<button class="btn btn-outline btn-sm" type="button" data-onb-action="print">打印试卷</button>' +
              '<button class="btn btn-outline btn-sm" type="button" data-onb-action="archive">上传存档</button>' +
              '<button class="btn btn-outline btn-sm" type="button" data-onb-action="detail">详情</button>' +
            '</td>' +
          '</tr>';
      }).join('');

      if (countEl) countEl.textContent = '共 ' + String(totalCount || 0) + ' 条记录，第 ' + String(currentPage) + '/' + String(Math.max(1, Math.ceil((totalCount || 0) / pageSize))) + ' 页';
      if (!shown || !shown.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-tertiary);padding:18px 0;">暂无场次，请先新建培训场次</td></tr>';
      }
      renderPager();
    }

    function load() {
      if (refreshBtn) refreshBtn.disabled = true;
      var url = '/api/onboarding-trainings?page=' + encodeURIComponent(currentPage) + '&pageSize=' + encodeURIComponent(pageSize);
      fetchJson(url).then(function (resp) {
        if (refreshBtn) refreshBtn.disabled = false;
        totalCount = resp && typeof resp.total === 'number' ? resp.total : 0;
        var items = resp && Array.isArray(resp.items) ? resp.items : [];
        renderTable(items);
      }).catch(function (err) {
        if (refreshBtn) refreshBtn.disabled = false;
        alert('加载失败：' + (err && err.message ? err.message : '未知错误'));
      });
    }

    function openCreateModal() {
      ensureModals();
      var assets = getAssets();
      var coursewares = assets.filter(function (a) { return a && a.type === 'courseware'; });
      var templates = assets.filter(function (a) { return a && a.type === 'template'; });

      var coursewareSel = document.getElementById('threeEduOnbCourseware');
      var templateSel = document.getElementById('threeEduOnbTemplate');
      if (coursewareSel) {
        coursewareSel.innerHTML = '<option value=\"\">不选择</option>' + coursewares.map(function (a) {
          return '<option value=\"' + esc(a.id) + '\">' + esc((a.title || '-') + '（' + getThreeEducationLevelLabel(a.level) + '）') + '</option>';
        }).join('');
      }
      if (templateSel) {
        templateSel.innerHTML = '<option value=\"\">不选择</option>' + templates.map(function (a) {
          return '<option value=\"' + esc(a.id) + '\">' + esc((a.title || '-') + '（' + getThreeEducationLevelLabel(a.level) + '）') + '</option>';
        }).join('');
      }

      // reset fields
      var titleEl = document.getElementById('threeEduOnbTitle');
      var startEl = document.getElementById('threeEduOnbStart');
      var endEl = document.getElementById('threeEduOnbEnd');
      var locEl = document.getElementById('threeEduOnbLocation');
      var expectedEl = document.getElementById('threeEduOnbExpected');
      if (titleEl) titleEl.value = '';
      if (startEl) startEl.value = '';
      if (endEl) endEl.value = '';
      if (locEl) locEl.value = '';
      if (expectedEl) expectedEl.value = '0';

      var saveBtn = document.getElementById('threeEduOnbSaveBtn');
      if (saveBtn && !saveBtn.dataset.bound) {
        saveBtn.dataset.bound = '1';
        saveBtn.addEventListener('click', function () {
          var title = titleEl ? String(titleEl.value || '').trim() : '';
          if (!title) { alert('请填写场次名称'); return; }

          var payload = {
            title: title,
            location: locEl ? String(locEl.value || '').trim() : '',
            start_time: toMySqlDatetime(startEl ? startEl.value : ''),
            end_time: toMySqlDatetime(endEl ? endEl.value : ''),
            expected_participants: expectedEl ? parseInt(expectedEl.value || '0', 10) || 0 : 0
          };

          var cwId = coursewareSel ? String(coursewareSel.value || '').trim() : '';
          var tpId = templateSel ? String(templateSel.value || '').trim() : '';
          if (cwId) payload.courseware_asset = pickAssetById(cwId);
          if (tpId) payload.assessment_template_asset = pickAssetById(tpId);

          saveBtn.disabled = true;
          fetchJson('/api/onboarding-trainings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).then(function (created) {
            saveBtn.disabled = false;
            closeOverlay('threeEduOnboardingModalOverlay');
            load();
            if (created && created.id && created.qr_token) {
              activeTrainingForQr = { id: created.id, title: payload.title, qr_token: created.qr_token, qr_expires_at: created.qr_expires_at };
              openQrModal(activeTrainingForQr);
            }
          }).catch(function (err) {
            saveBtn.disabled = false;
            alert('创建失败：' + (err && err.message ? err.message : '未知错误'));
          });
        });
      }

      openOverlay('threeEduOnboardingModalOverlay');
    }

    function getJoinUrl(token) {
      var t = String(token || '').trim();
      if (!t) return '';
      return location.origin + '/ot/' + encodeURIComponent(t);
    }

    function renderQrInto(el, text) {
      if (!el) return;
      el.innerHTML = '';
      try {
        var canvas = document.createElement('canvas');
        canvas.width = 220;
        canvas.height = 220;
        el.appendChild(canvas);
        // renderThreeEduQr is defined later; fallback to text if not available
        if (typeof renderThreeEduQr === 'function') {
          renderThreeEduQr(canvas, text, 220);
        } else {
          el.textContent = '二维码渲染器未加载';
        }
        el.dataset.qrCanvas = '1';
      } catch (e) {
        el.textContent = '二维码生成失败';
      }
    }

    function downloadCanvasPng(canvas, filename) {
      try {
        var url = canvas.toDataURL('image/png');
        var a = document.createElement('a');
        a.href = url;
        a.download = filename || 'qrcode.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) {
        alert('下载失败：' + (e && e.message ? e.message : '未知错误'));
      }
    }

    function openQrModal(row) {
      ensureModals();
      activeTrainingForQr = row;

      var wrap = document.getElementById('threeEduOnbQrWrap');
      var info = document.getElementById('threeEduOnbQrInfo');
      var copyBtn = document.getElementById('threeEduOnbCopyLinkBtn');
      var dlBtn = document.getElementById('threeEduOnbDownloadQrBtn');
      var regenBtn = document.getElementById('threeEduOnbRegenQrBtn');

      var joinUrl = getJoinUrl(row && row.qr_token);
      renderQrInto(wrap, joinUrl);

      if (info) {
        info.innerHTML = '' +
          '<div style="font-weight:700;color:var(--text-primary);margin-bottom:6px;">' + esc(row && row.title ? row.title : '入职培训') + '</div>' +
          '<div>链接：<span style="font-family:monospace;word-break:break-all;">' + esc(joinUrl) + '</span></div>' +
          '<div>有效期至：' + esc(row && row.qr_expires_at ? formatDt(row.qr_expires_at) : '-') + '</div>' +
          '<div class="text-muted" style="margin-top:6px;">扫码后可签到；手机端答题功能待开发。</div>';
      }

      if (copyBtn && !copyBtn.dataset.bound) {
        copyBtn.dataset.bound = '1';
        copyBtn.addEventListener('click', function () {
          var url = getJoinUrl(activeTrainingForQr && activeTrainingForQr.qr_token);
          copyText(url);
        });
      }
      if (dlBtn && !dlBtn.dataset.bound) {
        dlBtn.dataset.bound = '1';
        dlBtn.addEventListener('click', function () {
          var w = document.getElementById('threeEduOnbQrWrap');
          var canvas = w ? w.querySelector('canvas') : null;
          if (!canvas) { alert('未生成二维码'); return; }
          var name = '入职培训二维码_' + String((activeTrainingForQr && activeTrainingForQr.id) || '') + '.png';
          downloadCanvasPng(canvas, name);
        });
      }
      if (regenBtn && !regenBtn.dataset.bound) {
        regenBtn.dataset.bound = '1';
        regenBtn.addEventListener('click', function () {
          if (!activeTrainingForQr || !activeTrainingForQr.id) return;
          regenBtn.disabled = true;
          fetchJson('/api/onboarding-trainings/' + encodeURIComponent(activeTrainingForQr.id) + '/qr', { method: 'POST' })
            .then(function (data) {
              regenBtn.disabled = false;
              activeTrainingForQr.qr_token = data.qr_token;
              activeTrainingForQr.qr_expires_at = data.qr_expires_at;
              openQrModal(activeTrainingForQr);
              load();
            })
            .catch(function (err) {
              regenBtn.disabled = false;
              alert('生成失败：' + (err && err.message ? err.message : '未知错误'));
            });
        });
      }

      openOverlay('threeEduOnbQrModalOverlay');
    }

    function openArchiveModal(row) {
      ensureModals();
      activeTrainingForArchive = row;
      var filesEl = document.getElementById('threeEduOnbArchiveFiles');
      if (filesEl) filesEl.value = '';

      var uploadBtn = document.getElementById('threeEduOnbArchiveUploadBtn');
      if (uploadBtn && !uploadBtn.dataset.bound) {
        uploadBtn.dataset.bound = '1';
        uploadBtn.addEventListener('click', function () {
          if (!activeTrainingForArchive || !activeTrainingForArchive.id) return;
          var files = filesEl ? filesEl.files : null;
          if (!files || !files.length) { alert('请选择照片'); return; }
          if (files.length > 12) { alert('最多上传 12 张'); return; }

          var fd = new FormData();
          for (var i = 0; i < files.length; i++) fd.append('files', files[i]);

          uploadBtn.disabled = true;
          fetch('/api/onboarding-trainings/' + encodeURIComponent(activeTrainingForArchive.id) + '/archives', {
            method: 'POST',
            body: fd
          }).then(function (r) {
            return r.json().catch(function () { return null; }).then(function (data) {
              if (!r.ok) throw new Error(data && (data.error || data.message) ? (data.error || data.message) : '上传失败');
              return data;
            });
          }).then(function () {
            uploadBtn.disabled = false;
            closeOverlay('threeEduOnbArchiveModalOverlay');
            load();
            alert('上传成功');
          }).catch(function (err) {
            uploadBtn.disabled = false;
            alert('上传失败：' + (err && err.message ? err.message : '未知错误'));
          });
        });
      }

      openOverlay('threeEduOnbArchiveModalOverlay');
    }

    function openDetailModal(row) {
      ensureModals();
      fetchJson('/api/onboarding-trainings/' + encodeURIComponent(row.id)).then(function (detail) {
        var infoEl = document.getElementById('threeEduOnbDetailInfo');
        var archivesEl = document.getElementById('threeEduOnbDetailArchives');
        var attendanceEl = document.getElementById('threeEduOnbDetailAttendance');

        var cwTitle = detail.courseware_asset && detail.courseware_asset.title ? detail.courseware_asset.title : '-';
        var tpTitle = detail.assessment_template_asset && detail.assessment_template_asset.title ? detail.assessment_template_asset.title : '-';
        var joinUrl = getJoinUrl(detail.qr_token);

        if (infoEl) {
          infoEl.innerHTML = '' +
            '<div class="hazard-detail-row"><div class="label">场次</div><div>' + esc(detail.title || '-') + '</div></div>' +
            '<div class="hazard-detail-row"><div class="label">时间</div><div>' + esc((detail.start_time || detail.end_time) ? (formatDt(detail.start_time) + ' ~ ' + formatDt(detail.end_time)) : '-') + '</div></div>' +
            '<div class="hazard-detail-row"><div class="label">地点</div><div>' + esc(detail.location || '-') + '</div></div>' +
            '<div class="hazard-detail-row"><div class="label">课件</div><div>' + esc(cwTitle) + '</div></div>' +
            '<div class="hazard-detail-row"><div class="label">考核模板</div><div>' + esc(tpTitle) + '</div></div>' +
            '<div class="hazard-detail-row"><div class="label">二维码</div><div style="font-family:monospace;word-break:break-all;">' + esc(joinUrl) + '</div></div>';
        }

        if (archivesEl) {
          var list = Array.isArray(detail.archives) ? detail.archives : [];
          if (!list.length) {
            archivesEl.innerHTML = '<div class="text-muted">暂无存档照片</div>';
          } else {
            archivesEl.innerHTML = list.map(function (a) {
              var src = a && a.file_path ? String(a.file_path) : '';
              if (!src) return '';
              return '<a href="' + esc(src) + '" target="_blank" rel="noopener"><img class="hazard-detail-img" src="' + esc(src) + '" alt="archive"></a>';
            }).join('');
          }
        }

        if (attendanceEl) {
          var alist = Array.isArray(detail.attendance) ? detail.attendance : [];
          if (!alist.length) {
            attendanceEl.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-tertiary);padding:12px 0;">暂无签到记录</td></tr>';
          } else {
            attendanceEl.innerHTML = alist.map(function (a) {
              return '' +
                '<tr>' +
                  '<td>' + esc(a.name || '-') + '</td>' +
                  '<td>' + esc(a.employee_no || '-') + '</td>' +
                  '<td>' + esc(a.phone || '-') + '</td>' +
                  '<td>' + esc(formatDt(a.checked_in_at)) + '</td>' +
                '</tr>';
            }).join('');
          }
        }

        openOverlay('threeEduOnbDetailModalOverlay');
      }).catch(function (err) {
        alert('加载详情失败：' + (err && err.message ? err.message : '未知错误'));
      });
    }

    function openTemplateBlobOrPrint(asset) {
      var a = asset || {};
      if (a && a.fileId) {
        threeEduDbGetFileBlob(a.fileId).then(function (row) {
          if (!row || !row.blob) { alert('未找到模板附件，请重新上传。'); return; }
          try {
            var url = URL.createObjectURL(row.blob);
            window.open(url, '_blank');
            setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
          } catch (e) {
            alert('打开失败：' + (e && e.message ? e.message : '未知错误'));
          }
        }).catch(function (err) {
          alert('读取附件失败：' + (err && err.message ? err.message : '未知错误'));
        });
        return;
      }

      var w = window.open('', '_blank');
      if (!w) { alert('被浏览器拦截，请允许弹窗后重试。'); return; }
      var title = a && a.title ? String(a.title) : '考核试卷';
      w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + esc(title) + '</title></head>' +
        '<body style="font-family:Arial,Helvetica,sans-serif;padding:24px;">' +
        '<h2 style="margin:0 0 10px;">' + esc(title) + '</h2>' +
        '<div style="color:#666;margin-bottom:16px;">（模板未上传附件，已生成可打印占位页；请按实际模板补充题目/内容）</div>' +
        '<div style="margin-bottom:10px;">姓名：__________ 工号：__________ 岗位：__________</div>' +
        '<div style="margin-bottom:10px;">一、选择题（共 ____ 题）</div>' +
        '<div style="margin-bottom:10px;">二、判断题（共 ____ 题）</div>' +
        '<div style="margin-bottom:10px;">三、简答题（共 ____ 题）</div>' +
        '<div style="margin-top:24px;">成绩：__________ 监考/安全员签字：__________</div>' +
        '<script>setTimeout(function(){window.print();}, 300);</script>' +
        '</body></html>');
      w.document.close();
    }

    // IndexedDB file blob getter (shared with模板管理)
    function threeEduDbGetFileBlob(fileId) {
      return new Promise(function (resolve, reject) {
        if (!window.indexedDB) { reject(new Error('IndexedDB not supported')); return; }
        var req = indexedDB.open('threeEducationAssetsDb_v1', 1);
        req.onupgradeneeded = function () {
          var db = req.result;
          if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
        };
        req.onsuccess = function () {
          var db = req.result;
          var tx = db.transaction('files', 'readonly');
          var store = tx.objectStore('files');
          var getReq = store.get(fileId);
          getReq.onsuccess = function () { db.close(); resolve(getReq.result || null); };
          getReq.onerror = function () { db.close(); reject(getReq.error || new Error('get failed')); };
        };
        req.onerror = function () { reject(req.error || new Error('open db failed')); };
      });
    }

    function handleTableClick(e) {
      var btn = e.target && e.target.closest ? e.target.closest('button[data-onb-action]') : null;
      if (!btn) return;
      var tr = btn.closest('tr[data-id]');
      if (!tr) return;
      var id = tr.dataset.id;
      var row = null;
      for (var i = 0; i < cachedRows.length; i++) {
        if (String(cachedRows[i].id) === String(id)) { row = cachedRows[i]; break; }
      }
      if (!row) return;
      var action = btn.dataset.onbAction;

      if (action === 'qr') { openQrModal(row); return; }
      if (action === 'archive') { openArchiveModal(row); return; }
      if (action === 'detail') { openDetailModal(row); return; }
      if (action === 'print') {
        var asset = row.assessment_template_asset;
        openTemplateBlobOrPrint(asset);
        return;
      }
    }

    ensureModals();
    if (newBtn) newBtn.addEventListener('click', openCreateModal);
    if (refreshBtn) refreshBtn.addEventListener('click', function () { currentPage = 1; load(); });
    tbody.addEventListener('click', handleTableClick);
    if (pagerEl) {
      pagerEl.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('button.pagination-btn[data-page]') : null;
        if (!b || b.disabled) return;
        var page = String(b.dataset.page || '');
        var pages = totalCount ? Math.ceil(totalCount / pageSize) : 0;
        if (page === 'prev') currentPage = Math.max(1, currentPage - 1);
        else if (page === 'next') currentPage = Math.min(pages || 1, currentPage + 1);
        else {
          var n = parseInt(page, 10);
          if (!isNaN(n)) currentPage = n;
        }
        load();
      });
    }

    load();
  }

  function initThreeEducationTemplateManagement() {
    var newTemplateBtn = document.getElementById('threeEduNewTemplateBtn');
    var importBtn = document.getElementById('threeEduImportAssetsBtn');
    var uploadCoursewareBtn = document.getElementById('threeEduUploadCoursewareBtn');
    var exportBtn = document.getElementById('threeEduExportAssetsBtn');
    var levelFilter = document.getElementById('threeEduAssetLevelFilter');
    var typeFilter = document.getElementById('threeEduAssetTypeFilter');
    var searchInput = document.getElementById('threeEduAssetSearchInput');
    var tbody = document.getElementById('threeEduAssetsTbody');
    var countEl = document.getElementById('threeEduAssetsCount');
    var pagerEl = document.getElementById('threeEduAssetsPager');

    if (!tbody) return;

    var pageSize = 10;
    var currentPage = 1;

    function openThreeEduDb() {
      return new Promise(function (resolve, reject) {
        if (!window.indexedDB) { reject(new Error('IndexedDB not supported')); return; }
        var req = indexedDB.open('threeEducationAssetsDb_v1', 1);
        req.onupgradeneeded = function () {
          var db = req.result;
          if (!db.objectStoreNames.contains('files')) {
            db.createObjectStore('files', { keyPath: 'id' });
          }
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error || new Error('open db failed')); };
      });
    }

    function dbPutFile(fileId, file) {
      return openThreeEduDb().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction('files', 'readwrite');
          tx.oncomplete = function () { db.close(); resolve(); };
          tx.onerror = function () { db.close(); reject(tx.error || new Error('tx failed')); };
          tx.objectStore('files').put({
            id: fileId,
            name: file && file.name ? file.name : '附件',
            type: file && file.type ? file.type : '',
            blob: file,
            updatedAt: Date.now()
          });
        });
      });
    }

    function dbGetFile(fileId) {
      return openThreeEduDb().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction('files', 'readonly');
          var req = tx.objectStore('files').get(fileId);
          req.onsuccess = function () { db.close(); resolve(req.result || null); };
          req.onerror = function () { db.close(); reject(req.error || new Error('get failed')); };
        });
      });
    }

    function dbDeleteFile(fileId) {
      return openThreeEduDb().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction('files', 'readwrite');
          var req = tx.objectStore('files').delete(fileId);
          tx.oncomplete = function () { db.close(); resolve(); };
          tx.onerror = function () { db.close(); reject(tx.error || new Error('delete failed')); };
          req.onerror = function () { };
        });
      });
    }

    function downloadBlob(blob, filename) {
      try {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      } catch (e) {
        alert('下载失败：' + (e && e.message ? e.message : '未知错误'));
      }
    }

    function getAssets() {
      ensureThreeEducationSeedAssets();
      var list = getThreeEducationStoredAssets();
      return Array.isArray(list) ? list.slice() : [];
    }

    function saveAssets(list) {
      saveThreeEducationStoredAssets(list);
    }

    function applyFilters(assets) {
      var level = levelFilter ? String(levelFilter.value || '').trim() : '';
      var type = typeFilter ? String(typeFilter.value || '').trim() : '';
      var term = searchInput ? String(searchInput.value || '').trim().toLowerCase() : '';

      return (assets || []).filter(function (a) {
        if (!a) return false;
        if (level && a.level !== level) return false;
        if (type && a.type !== type) return false;
        if (term) {
          var hay = (String(a.title || '') + ' ' + String(a.desc || '')).toLowerCase();
          if (hay.indexOf(term) < 0) return false;
        }
        return true;
      }).sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    }

    function renderPager(totalCount) {
      if (!pagerEl) return;
      var totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;
      if (!totalPages || totalPages <= 1) {
        pagerEl.innerHTML = '';
        return;
      }

      if (currentPage < 1) currentPage = 1;
      if (currentPage > totalPages) currentPage = totalPages;

      function btn(page, label, active, disabled) {
        var cls = 'pagination-btn' + (active ? ' active' : '');
        var dis = disabled ? ' disabled' : '';
        return '<button class="' + cls + '" type="button" data-page="' + page + '"' + dis + '>' + label + '</button>';
      }
      function ellipsis() {
        return '<button class="pagination-btn" type="button" disabled>...</button>';
      }

      var html = '';
      html += btn('prev', '&lt;', false, currentPage === 1);

      if (totalPages <= 7) {
        for (var p = 1; p <= totalPages; p++) {
          html += btn(String(p), String(p), p === currentPage, false);
        }
      } else {
        html += btn('1', '1', currentPage === 1, false);

        var start = Math.max(2, currentPage - 2);
        var end = Math.min(totalPages - 1, currentPage + 2);

        if (start > 2) html += ellipsis();
        for (var i = start; i <= end; i++) {
          html += btn(String(i), String(i), i === currentPage, false);
        }
        if (end < totalPages - 1) html += ellipsis();

        html += btn(String(totalPages), String(totalPages), currentPage === totalPages, false);
      }

      html += btn('next', '&gt;', false, currentPage === totalPages);
      pagerEl.innerHTML = html;
    }

    function renderTable() {
      var assets = getAssets();
      var shown = applyFilters(assets);

      var totalCount = shown.length;
      var totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;
      if (currentPage < 1) currentPage = 1;
      if (currentPage > totalPages) currentPage = totalPages;

      var startIndex = (currentPage - 1) * pageSize;
      var pageItems = shown.slice(startIndex, startIndex + pageSize);

      tbody.innerHTML = pageItems.map(function (a) {
        var hasFile = !!(a && a.fileId);
        var fileName = a && a.fileName ? String(a.fileName) : '-';
        var downloadDisabled = hasFile ? '' : ' disabled';
        var downloadTitle = hasFile ? '' : ' title="未上传附件"';
        var exportBtnHtml = (a.type === 'template')
          ? '<button class="btn btn-outline btn-sm" type="button" data-three-edu-action="export" data-id="' + a.id + '">导出</button>'
          : '';
        return '' +
          '<tr data-id="' + a.id + '">' +
            '<td style="font-weight:700;">' + String(a.title || '-') + '<div style="margin-top:4px;font-size:12px;color:var(--text-tertiary);line-height:1.4;">' + String(a.desc || '') + '</div></td>' +
            '<td>' + getThreeEducationLevelLabel(a.level) + '</td>' +
            '<td>' + getThreeEducationTypeLabel(a.type) + '</td>' +
            '<td>' + String(a.version || '-') + '</td>' +
            '<td style="font-family:monospace;">' + formatThreeEducationDate(a.updatedAt) + '</td>' +
            '<td>' + fileName + '</td>' +
            '<td>' +
              '<button class="btn btn-outline btn-sm"' + downloadDisabled + downloadTitle + ' type="button" data-three-edu-action="download" data-id="' + a.id + '">下载</button>' +
              exportBtnHtml +
              '<button class="btn btn-outline btn-sm" type="button" data-three-edu-action="delete" data-id="' + a.id + '">删除</button>' +
            '</td>' +
          '</tr>';
      }).join('');

      if (countEl) {
        if (!totalCount) countEl.textContent = '共 0 条记录';
        else countEl.textContent = '共 ' + totalCount + ' 条记录，第 ' + currentPage + '/' + totalPages + ' 页';
      }
      renderPager(totalCount);
    }

    function ensureAssetModal() {
      if (document.getElementById('threeEduAssetModalOverlay')) return;
      document.body.insertAdjacentHTML('beforeend', '' +
        '<div class="modal-overlay" id="threeEduAssetModalOverlay" style="display:none;">' +
          '<div class="modal" role="dialog" aria-modal="true" style="max-width:680px;">' +
            '<div class="modal-header">' +
              '<div class="modal-title" id="threeEduAssetModalTitle">新建</div>' +
              '<button class="modal-close" type="button" id="threeEduAssetModalCloseBtn">×</button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<form id="threeEduAssetModalForm">' +
                '<div class="form-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">' +
                  '<div class="form-group">' +
                    '<label class="required">级别</label>' +
                    '<select class="form-control" id="threeEduAssetLevelSelect" required>' +
                      '<option value=\"\">请选择</option>' +
                      '<option value=\"company\">公司级</option>' +
                      '<option value=\"center\">中心级</option>' +
                      '<option value=\"team\">班组级</option>' +
                    '</select>' +
                  '</div>' +
                  '<div class="form-group">' +
                    '<label>版本</label>' +
                    '<input class="form-control" id="threeEduAssetVersionInput" placeholder="例如：v1.0">' +
                  '</div>' +
                  '<div class="form-group full-width">' +
                    '<label class="required" id="threeEduAssetNameLabel">名称</label>' +
                    '<input class="form-control" id="threeEduAssetTitleInput" maxlength="60" required placeholder="请输入名称">' +
                  '</div>' +
                  '<div class="form-group full-width">' +
                    '<label>说明</label>' +
                    '<textarea class="form-control" id="threeEduAssetDescInput" rows="3" maxlength="200" placeholder="可选：适用范围、考核要点、课件内容摘要..."></textarea>' +
                  '</div>' +
                  '<div class="form-group full-width">' +
                    '<label id="threeEduAssetFileLabel">上传附件（可选）</label>' +
                    '<input class="form-control" type="file" id="threeEduAssetFileInput">' +
                    '<div class="form-help" id="threeEduAssetFileHelp">支持课件/模板文件；上传后可在列表中下载。</div>' +
                  '</div>' +
                '</div>' +
                '<input type="hidden" id="threeEduAssetTypeHidden" value="template">' +
              '</form>' +
            '</div>' +
            '<div class="modal-footer" style="display:flex;gap:10px;justify-content:flex-end;">' +
              '<button class="btn btn-outline" type="button" id="threeEduAssetModalCancelBtn">取消</button>' +
              '<button class="btn btn-primary" type="button" id="threeEduAssetModalSaveBtn">保存</button>' +
            '</div>' +
          '</div>' +
        '</div>');

      var overlay = document.getElementById('threeEduAssetModalOverlay');
      var closeBtn = document.getElementById('threeEduAssetModalCloseBtn');
      var cancelBtn = document.getElementById('threeEduAssetModalCancelBtn');
      function close() { if (overlay) overlay.style.display = 'none'; }
      if (closeBtn) closeBtn.addEventListener('click', close);
      if (cancelBtn) cancelBtn.addEventListener('click', close);
      if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }

    function openAssetModal(type) {
      ensureAssetModal();
      var overlay = document.getElementById('threeEduAssetModalOverlay');
      var titleEl = document.getElementById('threeEduAssetModalTitle');
      var levelSel = document.getElementById('threeEduAssetLevelSelect');
      var versionInput = document.getElementById('threeEduAssetVersionInput');
      var titleInput = document.getElementById('threeEduAssetTitleInput');
      var descInput = document.getElementById('threeEduAssetDescInput');
      var fileLabel = document.getElementById('threeEduAssetFileLabel');
      var fileHelp = document.getElementById('threeEduAssetFileHelp');
      var fileInput = document.getElementById('threeEduAssetFileInput');
      var typeHidden = document.getElementById('threeEduAssetTypeHidden');
      if (typeHidden) typeHidden.value = type === 'courseware' ? 'courseware' : 'template';

      if (titleEl) titleEl.textContent = (type === 'courseware') ? '上传课件' : '新建模板';
      if (levelSel) levelSel.value = (levelFilter && levelFilter.value) ? levelFilter.value : '';
      if (versionInput) versionInput.value = 'v1.0';
      if (titleInput) titleInput.value = '';
      if (descInput) descInput.value = '';
      if (fileInput) fileInput.value = '';

      if (fileLabel) fileLabel.textContent = (type === 'courseware') ? '上传课件附件（必填）' : '上传模板附件（可选）';
      if (fileHelp) fileHelp.textContent = (type === 'courseware')
        ? '建议上传 PDF/PPT/视频等课件文件。'
        : '可选：上传试卷/签到表/告知书等模板文件。';

      if (overlay) overlay.style.display = 'flex';
    }

    function addAssetFromModal() {
      var levelSel = document.getElementById('threeEduAssetLevelSelect');
      var versionInput = document.getElementById('threeEduAssetVersionInput');
      var titleInput = document.getElementById('threeEduAssetTitleInput');
      var descInput = document.getElementById('threeEduAssetDescInput');
      var fileInput = document.getElementById('threeEduAssetFileInput');
      var typeHidden = document.getElementById('threeEduAssetTypeHidden');
      var overlay = document.getElementById('threeEduAssetModalOverlay');

      var type = typeHidden ? String(typeHidden.value || '').trim() : 'template';
      var level = levelSel ? String(levelSel.value || '').trim() : '';
      var titleVal = titleInput ? String(titleInput.value || '').trim() : '';
      var descVal = descInput ? String(descInput.value || '').trim() : '';
      var versionVal = versionInput ? String(versionInput.value || '').trim() : '';
      var file = (fileInput && fileInput.files && fileInput.files[0]) ? fileInput.files[0] : null;

      if (!level) { alert('请选择级别。'); return; }
      if (!titleVal) { alert('请填写名称。'); return; }
      if (type === 'courseware' && !file) { alert('请上传课件附件。'); return; }

      var id = 'threeEdu_' + Date.now() + '_' + Math.random().toString(16).slice(2, 8);
      var fileId = file ? id : '';
      var record = {
        id: id,
        type: type === 'courseware' ? 'courseware' : 'template',
        level: level,
        title: titleVal,
        desc: descVal,
        version: versionVal || 'v1.0',
        fileId: fileId || '',
        fileName: file ? file.name : '',
        fileMime: file ? (file.type || '') : '',
        updatedAt: Date.now()
      };

      var assets = getAssets();
      function finish() {
        assets.unshift(record);
        saveAssets(assets);
        if (overlay) overlay.style.display = 'none';
        renderTable();
      }

      if (!file) { finish(); return; }

      dbPutFile(fileId, file).then(function () {
        finish();
      }).catch(function (e) {
        alert('附件保存失败：' + (e && e.message ? e.message : '未知错误'));
      });
    }

    function exportAssetsList() {
      var assets = getAssets();
      var payload = {
        version: 1,
        exportedAt: Date.now(),
        assets: assets
      };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      var d = new Date();
      var stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') +
        '-' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
      downloadBlob(blob, '三级教育-模板课件清单-' + stamp + '.json');
    }

    function importAssetsFile(file) {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(String(reader.result || ''));
          var list = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.assets) ? parsed.assets : []);
          if (!Array.isArray(list) || !list.length) { alert('未识别到可导入的数据。'); return; }

          var existing = getAssets();
          var existingIds = new Set(existing.map(function (a) { return a && a.id ? String(a.id) : ''; }).filter(Boolean));
          var imported = [];
          list.forEach(function (a) {
            if (!a) return;
            var level = a.level;
            var type = a.type;
            if (['company', 'center', 'team'].indexOf(level) < 0) return;
            if (['courseware', 'template'].indexOf(type) < 0) return;
            var id = String(a.id || '');
            if (!id || existingIds.has(id)) id = 'threeEdu_' + Date.now() + '_' + Math.random().toString(16).slice(2, 8);
            existingIds.add(id);
            imported.push({
              id: id,
              type: type,
              level: level,
              title: String(a.title || '').trim() || '未命名',
              desc: String(a.desc || '').trim(),
              version: String(a.version || '').trim() || 'v1.0',
              fileId: String(a.fileId || '').trim(),
              fileName: String(a.fileName || '').trim(),
              fileMime: String(a.fileMime || '').trim(),
              updatedAt: Date.now()
            });
          });

          if (!imported.length) { alert('导入失败：数据格式不正确。'); return; }
          var merged = imported.concat(existing);
          saveAssets(merged);
          renderTable();
          alert('已导入 ' + imported.length + ' 条记录。');
        } catch (e) {
          alert('导入失败：' + (e && e.message ? e.message : '文件格式错误'));
        }
      };
      reader.onerror = function () { alert('读取文件失败。'); };
      reader.readAsText(file, 'utf-8');
    }

    function triggerImport() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.addEventListener('change', function () {
        var f = input.files && input.files[0] ? input.files[0] : null;
        importAssetsFile(f);
      });
      input.click();
    }

    function handleTableClick(e) {
      var btn = e.target && e.target.closest ? e.target.closest('button[data-three-edu-action]') : null;
      if (!btn) return;
      var action = String(btn.dataset.threeEduAction || '');
      var id = String(btn.dataset.id || '');
      if (!id) return;

      var assets = getAssets();
      var idx = assets.findIndex(function (a) { return a && String(a.id) === id; });
      if (idx < 0) return;
      var asset = assets[idx];

      if (action === 'delete') {
        if (!confirm('确认删除“' + String(asset.title || '') + '”？')) return;
        assets.splice(idx, 1);
        saveAssets(assets);
        if (asset && asset.fileId) {
          dbDeleteFile(asset.fileId).then(function () { renderTable(); }).catch(function () { renderTable(); });
        } else {
          renderTable();
        }
        return;
      }

      if (action === 'export') {
        var blob = new Blob([JSON.stringify(asset, null, 2)], { type: 'application/json;charset=utf-8' });
        var safeName = String(asset.title || '模板').replace(/[\\\\/:*?\"<>|]/g, '_');
        downloadBlob(blob, safeName + '.json');
        return;
      }

      if (action === 'download') {
        if (!asset.fileId) return;
        btn.disabled = true;
        dbGetFile(asset.fileId).then(function (row) {
          btn.disabled = false;
          if (!row || !row.blob) { alert('未找到附件，请重新上传。'); return; }
          downloadBlob(row.blob, row.name || asset.fileName || '附件');
        }).catch(function (err) {
          btn.disabled = false;
          alert('下载失败：' + (err && err.message ? err.message : '未知错误'));
        });
        return;
      }
    }

    var saveBtn = document.getElementById('threeEduAssetModalSaveBtn');
    if (saveBtn && !saveBtn.dataset.bound) {
      saveBtn.dataset.bound = '1';
      saveBtn.addEventListener('click', addAssetFromModal);
    }

    if (newTemplateBtn) newTemplateBtn.addEventListener('click', function () { openAssetModal('template'); });
    if (uploadCoursewareBtn) uploadCoursewareBtn.addEventListener('click', function () { openAssetModal('courseware'); });
    if (importBtn) importBtn.addEventListener('click', triggerImport);
    if (exportBtn) exportBtn.addEventListener('click', exportAssetsList);

    function resetAndRender() {
      currentPage = 1;
      renderTable();
    }

    if (levelFilter) levelFilter.addEventListener('change', resetAndRender);
    if (typeFilter) typeFilter.addEventListener('change', resetAndRender);
    if (searchInput) searchInput.addEventListener('input', resetAndRender);

    tbody.addEventListener('click', handleTableClick);
    if (pagerEl) {
      pagerEl.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('button.pagination-btn[data-page]') : null;
        if (!btn || btn.disabled) return;
        var page = String(btn.dataset.page || '');
        if (!page) return;
        if (page === 'prev') currentPage = Math.max(1, currentPage - 1);
        else if (page === 'next') currentPage = currentPage + 1;
        else {
          var n = parseInt(page, 10);
          if (!isNaN(n)) currentPage = n;
        }
        renderTable();
      });
    }
    renderTable();
  }

  function renderTraining() {
    const activeTab = 'safety-training';

    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">申安学堂</div>' +
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

        '<div class="tab-nav">' +
          '<div class="tab-item active" data-training-tab="safety-training">安全培训</div>' +
          '<div class="tab-item" data-training-tab="publicity-materials">宣传资料</div>' +
          '<div class="tab-item" data-training-tab="exam-assessment">考试考核</div>' +
        '</div>' +

        '<div class="feature-grid" id="trainingFeatureGrid">' +
          renderTrainingFeatureCards(activeTab) +
        '</div>' +
      '</div>';
  }

  function initTraining() {
    const tabNav = document.querySelector('.tab-nav');
    const featureGrid = document.getElementById('trainingFeatureGrid');
    if (!tabNav || !featureGrid) return;

    tabNav.addEventListener('click', function (e) {
      const tab = e.target.closest('.tab-item[data-training-tab]');
      if (!tab) return;

      tabNav.querySelectorAll('.tab-item[data-training-tab]').forEach(function (item) {
        item.classList.remove('active');
      });
      tab.classList.add('active');
      featureGrid.innerHTML = renderTrainingFeatureCards(tab.dataset.trainingTab);
    });
  }

  // ============ 三级教育 ============
  function renderThreeEducation() {
    return '' +
      '<div class="sub-page">' +
        '<div class="page-header">' +
          '<div>' +
            '<div class="page-title">三级教育</div>' +
            '<div class="page-desc">公司级、转运中心级、班组级安全教育全流程数字化管理</div>' +
          '</div>' +
          '<div class="page-actions">' +
            '<button class="btn btn-outline" data-page="training">返回申安学堂</button>' +
          '</div>' +
        '</div>' +
        renderThreeEducationPanel() +
      '</div>';
  }

  // ============ 培训课程库 ============
  function getBaseCourseLibraryCourses() {
    return [
      { id: 1, title: '新员工入职安全第一课', category: '通用安全', type: 'online', duration: '45分钟', thumb: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&q=80' },
      { id: 2, title: '有限空间作业安全技术规范', category: '专项安全', type: 'online', duration: '120分钟', thumb: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=80' },
      { id: 3, title: '消防设施器材使用与实操演练', category: '消防安全', type: 'offline', duration: '4课时', thumb: 'https://images.unsplash.com/photo-1599833719482-600fed77017b?auto=format&fit=crop&w=400&q=80' },
      { id: 4, title: '危化品包装与运输安全要求', category: '专项安全', type: 'online', duration: '90分钟', thumb: 'https://images.unsplash.com/photo-1586528116311-ad86d6263012?auto=format&fit=crop&w=400&q=80' },
      { id: 5, title: '急救常识：心肺复苏(CPR)', category: '应急救援', type: 'online', duration: '30分钟', thumb: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80' },
      { id: 6, title: '叉车驾驶员岗位安全操作规程', category: '设备安全', type: 'offline', duration: '8课时', thumb: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=400&q=80' },
      { id: 7, title: '劳动防护用品(PPE)选配指南', category: '个人防护', type: 'online', duration: '20分钟', thumb: 'https://images.unsplash.com/photo-1590402444582-43d16d655f9f?auto=format&fit=crop&w=400&q=80' },
      { id: 8, title: '转运中心作业场所风险辨识', category: '风险管控', type: 'online', duration: '60分钟', thumb: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=400&q=80' }
    ];
  }

  function getCourseLibraryStorageKey() {
    return 'sd_course_library_custom_v1';
  }

  function safeJsonParse(text, fallback) {
    try { return JSON.parse(text); } catch (e) { return fallback; }
  }

  function loadCustomCourses() {
    const raw = localStorage.getItem(getCourseLibraryStorageKey());
    const list = safeJsonParse(raw, []);
    return Array.isArray(list) ? list : [];
  }

  function saveCustomCourses(list) {
    localStorage.setItem(getCourseLibraryStorageKey(), JSON.stringify(list || []));
  }

  function pickCourseThumbByCategory(category) {
    const map = {
      '通用安全': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&q=80',
      '专项安全': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=80',
      '消防安全': 'https://images.unsplash.com/photo-1599833719482-600fed77017b?auto=format&fit=crop&w=400&q=80',
      '应急救援': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80',
      '设备安全': 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=400&q=80',
      '个人防护': 'https://images.unsplash.com/photo-1590402444582-43d16d655f9f?auto=format&fit=crop&w=400&q=80',
      '风险管控': 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=400&q=80'
    };
    return map[category] || map['通用安全'];
  }

  function addCustomCourse(course) {
    const list = loadCustomCourses();
    list.unshift(course);
    // 控制体积，避免 localStorage 过大
    saveCustomCourses(list.slice(0, 200));
  }

  function getMergedCourseLibraryCourses(baseCourses) {
    const custom = loadCustomCourses();
    // 自定义课程优先展示
    return custom.concat(baseCourses || []);
  }

  function renderTrainingCourseLibrary() {
    const courses = getMergedCourseLibraryCourses(getBaseCourseLibraryCourses());

    let coursesHtml = '';
    courses.forEach(course => {
      coursesHtml += `
        <div class="course-card" data-category="${course.category}" data-type="${course.type}">
          <div class="course-thumb">
            <div class="course-type-badge ${course.type}">${course.type === 'online' ? '在线学习' : '线下培训'}</div>
            <img src="${course.thumb}" alt="${course.title}">
          </div>
          <div class="course-content">
            <div class="course-meta">
              <span class="course-category">${course.category}</span>
              <span class="course-duration">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${course.duration}
              </span>
            </div>
            <div class="course-title" title="${course.title}">${course.title}</div>
          </div>
        </div>
      `;
    });

    return `
      <div class="sub-page course-library">
        <div class="page-header">
          <div>
            <div class="page-title">培训课程库</div>
            <div class="page-desc">全集团安全培训课程资源，支持按需学习与管理</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" data-page="create-course">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              创建课程
            </button>
          </div>
        </div>

        <div class="course-stats">
          <div class="course-stat-card">
            <div class="course-stat-label">已上线课程</div>
            <div class="course-stat-value">${courses.length} 门</div>
          </div>
          <div class="course-stat-card">
            <div class="course-stat-label">本月必修</div>
            <div class="course-stat-value">4 门</div>
          </div>
          <div class="course-stat-card">
            <div class="course-stat-label">已完成学习</div>
            <div class="course-stat-value">12 门</div>
          </div>
          <div class="course-stat-card">
            <div class="course-stat-label">累计学分</div>
            <div class="course-stat-value">24.5</div>
          </div>
        </div>

        <div class="course-toolbar">
          <div class="course-toolbar-left">
            <div class="course-search-wrap">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" class="course-search-input" id="courseSearchInput" placeholder="搜索课程名称...">
            </div>
            <div class="course-filter-group">
              <select class="course-filter-select" id="courseCategoryFilter">
                <option value="all">所有类别</option>
                <option value="通用安全">通用安全</option>
                <option value="专项安全">专项安全</option>
                <option value="消防安全">消防安全</option>
                <option value="应急救援">应急救援</option>
                <option value="设备安全">设备安全</option>
                <option value="个人防护">个人防护</option>
                <option value="风险管控">风险管控</option>
              </select>
              <select class="course-filter-select" id="courseTypeFilter">
                <option value="all">所有方式</option>
                <option value="online">在线学习</option>
                <option value="offline">线下培训</option>
              </select>
            </div>
          </div>
        </div>

        <div class="course-grid" id="courseGrid">
          ${coursesHtml}
        </div>
      </div>
    `;
  }

  function initTrainingCourseLibrary() {
    const searchInput = document.getElementById('courseSearchInput');
    const categoryFilter = document.getElementById('courseCategoryFilter');
    const typeFilter = document.getElementById('courseTypeFilter');
    const courseCards = document.querySelectorAll('.course-card');

    function filterCourses() {
      const searchTerm = searchInput.value.toLowerCase();
      const category = categoryFilter.value;
      const type = typeFilter.value;

      courseCards.forEach(card => {
        const title = card.querySelector('.course-title').textContent.toLowerCase();
        const cardCategory = card.dataset.category;
        const cardType = card.dataset.type;

        const matchesSearch = title.includes(searchTerm);
        const matchesCategory = category === 'all' || cardCategory === category;
        const matchesType = type === 'all' || cardType === type;

        if (matchesSearch && matchesCategory && matchesType) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    if (searchInput) searchInput.addEventListener('input', filterCourses);
    if (categoryFilter) categoryFilter.addEventListener('change', filterCourses);
    if (typeFilter) typeFilter.addEventListener('change', filterCourses);
  }

  // ============ 创建课程 ============
  function renderCreateCoursePage() {
    return `
      <div class="sub-page course-create">
        <div class="page-header">
          <div>
            <div class="page-title">创建课程</div>
            <div class="page-desc">上传课程资源并完善基础信息，保存后在课程库统一管理</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" id="backToCourseLibraryBtn">返回课程库</button>
            <button class="btn btn-primary" id="submitCourseTopBtn">保存课程</button>
          </div>
        </div>

        <div class="course-create-card">
          <form id="createCourseForm" class="course-create-form">
            <div class="form-grid">
              <div class="form-group full-width">
                <label class="required">课程标题</label>
                <input type="text" id="courseTitleInput" class="form-control" placeholder="例如：新员工入职安全第一课">
              </div>

              <div class="form-group">
                <label class="required">课程类别</label>
                <select id="courseCategorySelect" class="form-control">
                  <option value="">请选择类别</option>
                  <option value="通用安全">通用安全</option>
                  <option value="专项安全">专项安全</option>
                  <option value="消防安全">消防安全</option>
                  <option value="应急救援">应急救援</option>
                  <option value="设备安全">设备安全</option>
                  <option value="风险管控">风险管控</option>
                </select>
              </div>

              <div class="form-group">
                <label class="required">资源格式</label>
                <select id="courseTypeSelect" class="form-control">
                  <option value="">请选择格式</option>
                  <option value="video">视频</option>
                  <option value="pdf">PDF / 文档</option>
                  <option value="ppt">PPT 课件</option>
                  <option value="package">压缩包</option>
                </select>
              </div>

              <div class="form-group">
                <label>时长</label>
                <input type="text" id="courseDurationInput" class="form-control" placeholder="例如：45分钟 / 2课时">
              </div>

              <div class="form-group">
                <label>备注</label>
                <input type="text" id="courseRemarkInput" class="form-control" placeholder="可选：适用对象、版本等">
              </div>

              <div class="form-group full-width">
                <label class="required">上传课程资源</label>
                <div class="course-upload-row">
                  <label class="course-upload-drop" for="courseFileInput">
                    <div class="course-upload-inner">
                      <div class="course-upload-icon">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </div>
                      <div class="course-upload-text">
                        <strong>点击选择文件</strong>
                        <span id="courseAcceptHint">支持 MP4、PDF、PPT、ZIP 等常见格式</span>
                      </div>
                    </div>
                    <input type="file" id="courseFileInput" class="course-upload-input">
                  </label>

                  <div class="course-upload-preview" id="courseFilePreview"></div>
                </div>
                <div class="course-upload-meta">
                  <span>已选文件大小：<strong id="courseSelectedFileSize">--</strong></span>
                </div>
              </div>
            </div>

            <div class="course-create-footer">
              <button type="button" class="btn btn-outline" id="saveCourseDraftBtn">保存草稿</button>
              <button type="submit" class="btn btn-primary">保存课程</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function initCreateCoursePage() {
    const form = document.getElementById('createCourseForm');
    const titleInput = document.getElementById('courseTitleInput');
    const categorySelect = document.getElementById('courseCategorySelect');
    const typeSelect = document.getElementById('courseTypeSelect');
    const durationInput = document.getElementById('courseDurationInput');
    const remarkInput = document.getElementById('courseRemarkInput');
    const fileInput = document.getElementById('courseFileInput');
    const filePreview = document.getElementById('courseFilePreview');
    const acceptHint = document.getElementById('courseAcceptHint');
    const selectedFileSize = document.getElementById('courseSelectedFileSize');
    const topSubmitBtn = document.getElementById('submitCourseTopBtn');
    const backBtn = document.getElementById('backToCourseLibraryBtn');
    const saveDraftBtn = document.getElementById('saveCourseDraftBtn');

    function formatFileSize(size) {
      if (!size && size !== 0) return '--';
      if (size < 1024) return size + ' B';
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
      if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
      return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    function getTypeMeta(type) {
      const map = {
        video: { accept: 'video/*,.mp4,.mov,.avi,.mkv', hint: '支持 MP4、MOV、AVI、MKV 等视频格式' },
        pdf: { accept: '.pdf,.doc,.docx', hint: '支持 PDF、Word 文档格式' },
        ppt: { accept: '.ppt,.pptx,.pdf', hint: '支持 PPT、PPTX、PDF 课件格式' },
        package: { accept: '.zip,.rar,.7z', hint: '支持 ZIP、RAR、7Z 压缩包格式' }
      };
      return map[type] || { accept: '', hint: '支持 MP4、PDF、PPT、ZIP 等常见格式' };
    }

    function renderFilePreview(file) {
      if (!file) {
        filePreview.innerHTML = `
          <div class="course-upload-empty">
            <div class="course-upload-empty-title">未选择文件</div>
            <div class="course-upload-empty-desc">选择后将展示文件名称与大小摘要。</div>
          </div>
        `;
        selectedFileSize.textContent = '--';
        return;
      }

      filePreview.innerHTML = `
        <div class="course-upload-file">
          <div class="course-upload-file-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="course-upload-file-info">
            <strong title="${file.name}">${file.name}</strong>
            <span>${file.type || '未知格式'} · ${formatFileSize(file.size)}</span>
          </div>
          <button type="button" class="course-upload-remove" id="removeCourseFileBtn">移除</button>
        </div>
      `;
      selectedFileSize.textContent = formatFileSize(file.size);

      const removeBtn = document.getElementById('removeCourseFileBtn');
      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          fileInput.value = '';
          renderFilePreview(null);
        });
      }
    }

    function updateTypeMeta() {
      const meta = getTypeMeta(typeSelect.value);
      acceptHint.textContent = meta.hint;
      if (meta.accept) fileInput.setAttribute('accept', meta.accept);
      else fileInput.removeAttribute('accept');
    }

    function validateForm() {
      if (!titleInput.value.trim() || !categorySelect.value || !typeSelect.value || !fileInput.files.length) {
        alert('请填写课程标题、类别、资源格式，并上传课程文件。');
        return false;
      }
      return true;
    }

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        navigateTo('training-course-library');
      });
    }

    if (topSubmitBtn) {
      topSubmitBtn.addEventListener('click', function () {
        if (form) form.requestSubmit();
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', updateTypeMeta);
      updateTypeMeta();
    }

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        renderFilePreview(fileInput.files[0]);
      });
    }

    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', function () {
        const draftTitle = titleInput.value.trim() || '未命名课程';
        alert('草稿已保存：' + draftTitle);
      });
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validateForm()) return;
        const title = titleInput.value.trim();
        const category = categorySelect.value;
        const type = typeSelect.value;
        const duration = durationInput.value.trim();
        const remark = remarkInput.value.trim();

        // 轻量化前端保存：仅保存元信息与文件名（不存真实文件内容）
        const file = fileInput.files[0];
        addCustomCourse({
          id: Date.now(),
          title: title,
          category: category,
          // 课程库目前按“在线/线下”筛选，这里默认归为在线资源
          type: 'online',
          duration: duration || '--',
          thumb: pickCourseThumbByCategory(category),
          resource_format: type,
          resource_name: file ? file.name : '',
          resource_size: file ? file.size : 0,
          remark: remark,
          created_at: new Date().toISOString()
        });

        alert('课程《' + title + '》已保存并加入课程库。');
        navigateTo('training-course-library');
      });
    }

    renderFilePreview(null);
  }

  // ============ 宣传资料库 ============
  function renderPublicityMaterialsLibrary() {
    const materials = [
      { id: 1, title: '叉车安全操作"十不准"', type: 'poster', category: '设备安全', date: '2026-03-15', thumb: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=400&q=80' },
      { id: 2, title: '分拨中心消防安全演示视频', type: 'video', category: '消防安全', date: '2026-03-10', thumb: 'https://images.unsplash.com/photo-1599833719482-600fed77017b?auto=format&fit=crop&w=400&q=100' },
      { id: 3, title: '有限空间作业典型事故案例分析', type: 'video', category: '案例教育', date: '2026-03-05', thumb: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=80' },
      { id: 4, title: '员工安全手册(2026精简版)', type: 'pdf', category: '通用安全', date: '2026-02-28', thumb: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' },
      { id: 5, title: '夏季防高温中暑安全提示海报', type: 'poster', category: '通用安全', date: '2026-03-20', thumb: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80' },
      { id: 6, title: '交通事故应急处置标准化程序', type: 'pdf', category: '交通安全', date: '2026-03-12', thumb: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80' },
      { id: 7, title: '安全警戒线与警示标识使用规范', type: 'poster', category: '场所管理', date: '2026-01-15', thumb: 'https://images.unsplash.com/photo-1590402444582-43d16d655f9f?auto=format&fit=crop&w=400&q=80' },
      { id: 8, title: '新修订安全生产法在线宣讲', type: 'video', category: '法规标准', date: '2026-02-10', thumb: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=400&q=80' }
    ];

    let gridHtml = '';
    materials.forEach(item => {
      const typeLabel = item.type === 'video' ? '视频' : (item.type === 'poster' ? '海报' : '文档');
      const typeClass = item.type === 'poster' ? 'tag-image' : `tag-${item.type}`;
      const isVideo = item.type === 'video';

      const overlayIcon = isVideo
        ? '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
        : '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/><circle cx="12" cy="12" r="3"/></svg>';

      gridHtml += `
        <div class="material-card type-${item.type}" data-type="${item.type}" data-category="${item.category}">
          <div class="material-thumb">
            <img src="${item.thumb}" alt="${item.title}">
            <div class="media-overlay">
              <div class="play-button">${overlayIcon}</div>
            </div>
          </div>
          <div class="material-content">
            <div class="material-title" title="${item.title}">${item.title}</div>
            <div class="material-info">
              <span class="material-type-tag ${typeClass}">${typeLabel}</span>
              <span>${item.date}</span>
            </div>
          </div>
          <div class="material-actions">
            <button class="material-action-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>预览</button>
            <button class="material-action-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>下载</button>
          </div>
        </div>
      `;
    });

    return `
      <div class="sub-page">
        <div class="page-header">
          <div>
            <div class="page-title">宣传资料库</div>
            <div class="page-desc">安全海报、宣教视频、手册指南等数字化资源中心</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" id="goUploadMaterialBtn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              上传资料
            </button>
          </div>
        </div>

        <div class="course-stats">
          <div class="course-stat-card">
            <div class="course-stat-label">资料总数</div>
            <div class="course-stat-value">256 份</div>
          </div>
          <div class="course-stat-card">
            <div class="course-stat-label">累计下载</div>
            <div class="course-stat-value">1,892 次</div>
          </div>
          <div class="course-stat-card">
            <div class="course-stat-label">本月新增</div>
            <div class="course-stat-value">12 份</div>
          </div>
          <div class="course-stat-card">
            <div class="course-stat-label">热门推荐</div>
            <div class="course-stat-value">消防安全</div>
          </div>
        </div>

        <div class="course-toolbar">
          <div class="course-toolbar-left">
            <div class="course-search-wrap">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" class="course-search-input" id="materialSearchInput" placeholder="搜索资料名称...">
            </div>
            <div class="course-filter-group">
              <select class="course-filter-select" id="materialTypeFilter">
                <option value="all">所有格式</option>
                <option value="poster">海报 (Image)</option>
                <option value="video">视频 (Video)</option>
                <option value="pdf">文档 (PDF)</option>
              </select>
              <select class="course-filter-select" id="materialCategoryFilter">
                <option value="all">所有类别</option>
                <option value="通用安全">通用安全</option>
                <option value="消防安全">消防安全</option>
                <option value="设备安全">设备安全</option>
                <option value="交通安全">交通安全</option>
              </select>
            </div>
          </div>
        </div>

        <div class="material-grid" id="materialGrid">
          ${gridHtml}
        </div>
      </div>
    `;
  }

  function initPublicityMaterialsLibrary() {
    const searchInput = document.getElementById('materialSearchInput');
    const typeFilter = document.getElementById('materialTypeFilter');
    const categoryFilter = document.getElementById('materialCategoryFilter');
    const cards = document.querySelectorAll('.material-card');
    const uploadBtn = document.getElementById('goUploadMaterialBtn');

    function filterMaterials() {
      const searchTerm = searchInput.value.toLowerCase();
      const type = typeFilter.value;
      const category = categoryFilter.value;

      cards.forEach(card => {
        const title = card.querySelector('.material-title').textContent.toLowerCase();
        const cardType = card.dataset.type;
        const cardCategory = card.dataset.category;

        const matchesSearch = title.includes(searchTerm);
        const matchesType = type === 'all' || cardType === type;
        const matchesCategory = category === 'all' || cardCategory === category;

        if (matchesSearch && matchesType && matchesCategory) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    if (searchInput) searchInput.addEventListener('input', filterMaterials);
    if (typeFilter) typeFilter.addEventListener('change', filterMaterials);
    if (categoryFilter) categoryFilter.addEventListener('change', filterMaterials);
    if (uploadBtn) uploadBtn.addEventListener('click', function () {
      navigateTo('upload-materials');
    });
  }

  function renderUploadMaterialsPage() {
    return `
      <div class="sub-page upload-materials-page">
        <div class="page-header">
          <div>
            <div class="page-title">上传资料</div>
            <div class="page-desc">统一上传海报、视频、手册和宣教材料，完成分类、封面与发布配置</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" type="button" id="backToMaterialsBtn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
              返回资料库
            </button>
            <button class="btn btn-primary" type="button" id="submitMaterialTopBtn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
              提交发布
            </button>
          </div>
        </div>

        <div class="upload-hero-card">
          <div class="upload-hero-main">
            <span class="upload-hero-badge">宣传资料库 · 新增资源</span>
            <h3>让每份安全资料都有清晰归档、统一封面和可追溯版本</h3>
            <p>支持视频、海报、PDF 手册、压缩包课件上传。上传后可进入资料库检索、预览和下载。</p>
          </div>
          <div class="upload-hero-metrics">
            <div class="upload-metric-card">
              <span>建议封面比例</span>
              <strong>16:9 / 3:4</strong>
            </div>
            <div class="upload-metric-card">
              <span>推荐单文件大小</span>
              <strong>500MB 内</strong>
            </div>
            <div class="upload-metric-card">
              <span>必填项</span>
              <strong>4 项</strong>
            </div>
          </div>
        </div>

        <div class="upload-layout">
          <form class="upload-form-shell" id="uploadMaterialForm">
            <div class="upload-section-card">
              <div class="upload-section-head">
                <div>
                  <div class="section-title">基础信息</div>
                  <div class="upload-section-desc">先补齐资料名称、格式、分类与适用范围，方便资料库统一检索。</div>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-field span-2">
                  <label class="form-label required" for="materialTitleInput">资料标题</label>
                  <input class="form-control" id="materialTitleInput" name="title" type="text" maxlength="60" placeholder="例如：2026年全国消防宣传月标准宣导视频">
                </div>
                <div class="form-field">
                  <label class="form-label required" for="materialTypeSelect">资料格式</label>
                  <select class="form-control" id="materialTypeSelect" name="type">
                    <option value="">请选择资料格式</option>
                    <option value="video">视频资料</option>
                    <option value="poster">海报图片</option>
                    <option value="pdf">PDF / 手册</option>
                    <option value="package">压缩包 / 课件</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="form-label required" for="materialCategorySelect">资料类别</label>
                  <select class="form-control" id="materialCategorySelect" name="category">
                    <option value="">请选择资料类别</option>
                    <option value="消防安全">消防安全</option>
                    <option value="设备安全">设备安全</option>
                    <option value="案例教育">案例教育</option>
                    <option value="法规标准">法规标准</option>
                    <option value="通用安全">通用安全</option>
                    <option value="交通安全">交通安全</option>
                    <option value="场所管理">场所管理</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="form-label" for="materialSourceInput">资料来源</label>
                  <input class="form-control" id="materialSourceInput" name="source" type="text" placeholder="例如：安全管理部 / 外部培训供应商">
                </div>
                <div class="form-field">
                  <label class="form-label" for="materialScopeSelect">适用范围</label>
                  <select class="form-control" id="materialScopeSelect" name="scope">
                    <option value="全网通用">全网通用</option>
                    <option value="直营网点">直营网点</option>
                    <option value="转运中心">转运中心</option>
                    <option value="驾驶员队伍">驾驶员队伍</option>
                    <option value="仓储与分拨">仓储与分拨</option>
                  </select>
                </div>
                <div class="form-field span-2">
                  <label class="form-label" for="materialSummaryInput">资料简介</label>
                  <textarea class="form-control" id="materialSummaryInput" name="summary" rows="4" placeholder="请简要说明资料内容、使用场景、重点宣导对象和注意事项。"></textarea>
                </div>
              </div>
            </div>

            <div class="upload-section-card">
              <div class="upload-section-head">
                <div>
                  <div class="section-title">文件上传</div>
                  <div class="upload-section-desc">上传主文件和可选封面图，系统将用于资料预览卡片展示。</div>
                </div>
              </div>
              <div class="upload-drop-grid">
                <label class="upload-dropzone upload-dropzone-main" for="materialFileInput" id="materialFileDropzone">
                  <input class="file-input" id="materialFileInput" type="file">
                  <div class="upload-drop-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div class="upload-drop-title">上传主资料文件</div>
                  <div class="upload-drop-subtitle" id="materialAcceptHint">支持 MP4、JPG/PNG、PDF、ZIP 等常见格式</div>
                  <div class="upload-drop-note">点击选择文件，或直接拖拽到此区域</div>
                </label>

                <label class="upload-dropzone upload-dropzone-cover" for="materialCoverInput" id="materialCoverDropzone">
                  <input class="file-input" id="materialCoverInput" type="file" accept="image/*">
                  <div class="upload-drop-icon subtle">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                  <div class="upload-drop-title">上传封面图</div>
                  <div class="upload-drop-subtitle">建议尺寸 1280 × 720，提升资料卡片视觉效果</div>
                </label>
              </div>

              <div class="upload-preview-panel">
                <div class="upload-preview-card">
                  <div class="upload-preview-label">主文件</div>
                  <div class="upload-preview-file" id="materialFilePreview">
                    <div class="empty-state">
                      <div class="empty-state-icon">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <div class="empty-state-title">尚未选择文件</div>
                      <div class="empty-state-desc">上传后可查看文件名称、类型与大小摘要。</div>
                    </div>
                  </div>
                </div>
                <div class="upload-preview-card">
                  <div class="upload-preview-label">封面预览</div>
                  <div class="upload-cover-preview" id="materialCoverPreview">
                    <div class="upload-cover-placeholder">
                      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
                      <span>封面图将在这里预览</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="upload-section-card">
              <div class="upload-section-head">
                <div>
                  <div class="section-title">标签与发布设置</div>
                  <div class="upload-section-desc">用关键词增强搜索命中率，并确定上架状态与版本说明。</div>
                </div>
              </div>

              <div class="upload-tag-picker">
                <button class="upload-tag-chip" type="button" data-tag="消防宣传">消防宣传</button>
                <button class="upload-tag-chip" type="button" data-tag="新员工培训">新员工培训</button>
                <button class="upload-tag-chip" type="button" data-tag="事故案例">事故案例</button>
                <button class="upload-tag-chip" type="button" data-tag="班前宣导">班前宣导</button>
                <button class="upload-tag-chip" type="button" data-tag="季度活动">季度活动</button>
                <button class="upload-tag-chip" type="button" data-tag="法规更新">法规更新</button>
              </div>

              <div class="form-grid" style="margin-top: 20px;">
                <div class="form-field span-2">
                  <label class="form-label" for="materialTagsInput">自定义标签</label>
                  <input class="form-control" id="materialTagsInput" name="tags" type="text" placeholder="多个标签请用顿号、逗号或空格分隔">
                </div>
                <div class="form-field">
                  <label class="form-label" for="materialStatusSelect">发布状态</label>
                  <select class="form-control" id="materialStatusSelect" name="status">
                    <option value="published">立即发布</option>
                    <option value="draft">保存为草稿</option>
                    <option value="review">提交审核</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="form-label" for="materialVersionInput">版本号</label>
                  <input class="form-control" id="materialVersionInput" name="version" type="text" value="V1.0">
                </div>
                <div class="form-field span-2">
                  <label class="form-label" for="materialRemarkInput">版本说明 / 备注</label>
                  <textarea class="form-control" id="materialRemarkInput" name="remark" rows="3" placeholder="例如：替换旧版消防演示视频片头，补充仓内灭火器点检章节。"></textarea>
                </div>
              </div>
            </div>

            <div class="form-footer upload-form-footer">
              <button class="btn btn-outline" type="reset" id="resetUploadFormBtn">重置表单</button>
              <button class="btn btn-outline" type="button" id="saveMaterialDraftBtn">保存草稿</button>
              <button class="btn btn-primary" type="submit">确认上传</button>
            </div>
          </form>

          <aside class="upload-sidebar">
            <div class="upload-side-card">
              <div class="upload-side-title">发布清单</div>
              <div class="upload-checklist">
                <div class="upload-check-item"><span>1</span><p>填写资料标题、格式和分类</p></div>
                <div class="upload-check-item"><span>2</span><p>上传主文件，并确认文件大小与格式</p></div>
                <div class="upload-check-item"><span>3</span><p>补充简介、标签和版本说明</p></div>
                <div class="upload-check-item"><span>4</span><p>选择发布状态后提交</p></div>
              </div>
            </div>

            <div class="upload-side-card emphasis">
              <div class="upload-side-title">实时摘要</div>
              <div class="upload-summary-list">
                <div class="upload-summary-item">
                  <span>当前格式</span>
                  <strong id="selectedTypeLabel">未选择</strong>
                </div>
                <div class="upload-summary-item">
                  <span>已选标签</span>
                  <strong id="selectedTagCount">0 个</strong>
                </div>
                <div class="upload-summary-item">
                  <span>主文件大小</span>
                  <strong id="selectedFileSize">--</strong>
                </div>
                <div class="upload-summary-item">
                  <span>发布方式</span>
                  <strong id="selectedStatusLabel">立即发布</strong>
                </div>
              </div>
            </div>

            <div class="upload-side-card">
              <div class="upload-side-title">上传建议</div>
              <ul class="upload-tip-list">
                <li>视频资料建议补充封面图，方便资料库卡片展示。</li>
                <li>资料标题尽量包含场景和主题，例如“消防”“有限空间”“驾驶员”。</li>
                <li>如为制度修订版，请在备注中标明替换范围与生效时间。</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    `;
  }

  function initUploadMaterialsPage() {
    const form = document.getElementById('uploadMaterialForm');
    const titleInput = document.getElementById('materialTitleInput');
    const typeSelect = document.getElementById('materialTypeSelect');
    const categorySelect = document.getElementById('materialCategorySelect');
    const statusSelect = document.getElementById('materialStatusSelect');
    const fileInput = document.getElementById('materialFileInput');
    const coverInput = document.getElementById('materialCoverInput');
    const tagsInput = document.getElementById('materialTagsInput');
    const filePreview = document.getElementById('materialFilePreview');
    const coverPreview = document.getElementById('materialCoverPreview');
    const acceptHint = document.getElementById('materialAcceptHint');
    const selectedTypeLabel = document.getElementById('selectedTypeLabel');
    const selectedTagCount = document.getElementById('selectedTagCount');
    const selectedFileSize = document.getElementById('selectedFileSize');
    const selectedStatusLabel = document.getElementById('selectedStatusLabel');
    const topSubmitBtn = document.getElementById('submitMaterialTopBtn');
    const backBtn = document.getElementById('backToMaterialsBtn');
    const saveDraftBtn = document.getElementById('saveMaterialDraftBtn');
    const resetBtn = document.getElementById('resetUploadFormBtn');
    const chips = document.querySelectorAll('.upload-tag-chip');

    let selectedTags = [];

    function formatFileSize(size) {
      if (!size && size !== 0) return '--';
      if (size < 1024) return size + ' B';
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
      if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
      return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    function getMaterialTypeMeta(type) {
      const map = {
        video: { label: '视频资料', accept: 'video/*,.mp4,.mov,.avi,.mkv', hint: '支持 MP4、MOV、AVI、MKV 等视频格式' },
        poster: { label: '海报图片', accept: 'image/*,.jpg,.jpeg,.png,.webp', hint: '支持 JPG、PNG、WEBP 等图片格式' },
        pdf: { label: 'PDF / 手册', accept: '.pdf,.doc,.docx', hint: '支持 PDF、Word 手册等文档格式' },
        package: { label: '压缩包 / 课件', accept: '.zip,.rar,.7z,.ppt,.pptx', hint: '支持 ZIP、RAR、PPT 课件等打包资料' }
      };
      return map[type] || { label: '未选择', accept: '', hint: '支持 MP4、JPG/PNG、PDF、ZIP 等常见格式' };
    }

    function renderFilePreview(file) {
      if (!file) {
        filePreview.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div class="empty-state-title">尚未选择文件</div>
            <div class="empty-state-desc">上传后可查看文件名称、类型与大小摘要。</div>
          </div>
        `;
        selectedFileSize.textContent = '--';
        return;
      }

      filePreview.innerHTML = `
        <div class="upload-file-meta">
          <div class="upload-file-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="upload-file-info">
            <strong title="${file.name}">${file.name}</strong>
            <span>${file.type || '未知格式'} · ${formatFileSize(file.size)}</span>
          </div>
        </div>
      `;
      selectedFileSize.textContent = formatFileSize(file.size);
    }

    function renderCoverPreview(file) {
      if (!file) {
        coverPreview.innerHTML = `
          <div class="upload-cover-placeholder">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
            <span>封面图将在这里预览</span>
          </div>
        `;
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        coverPreview.innerHTML = '<img src="' + e.target.result + '" alt="封面预览">';
      };
      reader.readAsDataURL(file);
    }

    function updateTagCount() {
      const customTags = (tagsInput.value || '')
        .split(/[、，,\s]+/)
        .map(function (item) { return item.trim(); })
        .filter(Boolean);
      const merged = selectedTags.concat(customTags.filter(function (tag) {
        return selectedTags.indexOf(tag) === -1;
      }));
      selectedTagCount.textContent = merged.length + ' 个';
    }

    function updateTypeMeta() {
      const meta = getMaterialTypeMeta(typeSelect.value);
      selectedTypeLabel.textContent = meta.label;
      acceptHint.textContent = meta.hint;
      if (meta.accept) {
        fileInput.setAttribute('accept', meta.accept);
      } else {
        fileInput.removeAttribute('accept');
      }
    }

    function updateStatusLabel() {
      const label = statusSelect.options[statusSelect.selectedIndex] ? statusSelect.options[statusSelect.selectedIndex].text : '立即发布';
      selectedStatusLabel.textContent = label;
    }

    function validateForm() {
      if (!titleInput.value.trim() || !typeSelect.value || !categorySelect.value || !fileInput.files.length) {
        alert('请先完整填写资料标题、资料格式、资料类别，并上传主资料文件。');
        return false;
      }
      return true;
    }

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        navigateTo('publicity-materials-library');
      });
    }

    if (topSubmitBtn) {
      topSubmitBtn.addEventListener('click', function () {
        form.requestSubmit();
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', updateTypeMeta);
      updateTypeMeta();
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', updateStatusLabel);
      updateStatusLabel();
    }

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        renderFilePreview(fileInput.files[0]);
      });
    }

    if (coverInput) {
      coverInput.addEventListener('change', function () {
        renderCoverPreview(coverInput.files[0]);
      });
    }

    if (tagsInput) {
      tagsInput.addEventListener('input', updateTagCount);
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        const tag = chip.dataset.tag;
        const active = chip.classList.toggle('active');
        if (active) {
          selectedTags.push(tag);
        } else {
          selectedTags = selectedTags.filter(function (item) { return item !== tag; });
        }
        updateTagCount();
      });
    });

    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', function () {
        const draftTitle = titleInput.value.trim() || '未命名资料';
        alert('草稿已保存：' + draftTitle);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        selectedTags = [];
        chips.forEach(function (chip) { chip.classList.remove('active'); });
        window.setTimeout(function () {
          renderFilePreview(null);
          renderCoverPreview(null);
          updateTypeMeta();
          updateStatusLabel();
          updateTagCount();
        }, 0);
      });
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validateForm()) return;
        const statusText = statusSelect.options[statusSelect.selectedIndex].text;
        alert('资料《' + titleInput.value.trim() + '》已提交，当前处理方式：' + statusText + '。');
        navigateTo('publicity-materials-library');
      });
    }

    renderFilePreview(null);
    renderCoverPreview(null);
    updateTagCount();
  }

	  // ============ 培训计划 ============
	  function getTrainingPlanStorageKey() {
	    return 'sd_training_plan_custom_v1';
	  }

	  function getTrainingPlanDeletedKey() {
	    return 'sd_training_plan_deleted_v1';
	  }

	  function getTrainingPlanSelectedIdKey() {
	    return 'sd_training_plan_selected_id_v1';
	  }

	  function setSelectedTrainingPlanId(id) {
	    try { sessionStorage.setItem(getTrainingPlanSelectedIdKey(), String(id || '')); } catch (e) {}
	  }

	  function getSelectedTrainingPlanId() {
	    try { return sessionStorage.getItem(getTrainingPlanSelectedIdKey()) || ''; } catch (e) { return ''; }
	  }

	  function clearSelectedTrainingPlanId() {
	    try { sessionStorage.removeItem(getTrainingPlanSelectedIdKey()); } catch (e) {}
	  }

	  function loadDeletedTrainingPlanIds() {
	    const raw = localStorage.getItem(getTrainingPlanDeletedKey());
	    const list = safeJsonParse(raw, []);
	    const arr = Array.isArray(list) ? list : [];
	    const set = new Set();
	    arr.forEach(function (id) {
	      const n = Number(id);
	      if (!Number.isNaN(n)) set.add(n);
	    });
	    return set;
	  }

	  function saveDeletedTrainingPlanIds(idSet) {
	    const arr = Array.from(idSet || []);
	    localStorage.setItem(getTrainingPlanDeletedKey(), JSON.stringify(arr));
	  }

	  function getBaseTrainingPlans() {
	    return [
	      { id: 1, name: '2026年度全员消防安全知识大轮训', category: '消防安全', period: '2026-03 至 2026-06', target: '全体员工', status: 'ongoing', progress: 65 },
	      { id: 2, name: '转运中心特种设备操作人员取证培训', category: '设备安全', period: '2026-04 至 2026-05', target: '特种设备操作工', status: 'planned', progress: 0 },
	      { id: 3, name: '第一季度新员工入职安全教育', category: '通用安全', period: '2026-01 至 2026-03', target: 'Q1入职员工', status: 'completed', progress: 100 },
	      { id: 4, name: '有限空间作业外包人员安全进场培训', category: '专项安全', period: '2026-04-10 至 2026-04-12', target: '施工单位人员', status: 'planned', progress: 0 },
	      { id: 5, name: '全网网点负责人安全管理能力提升班', category: '管理层培训', period: '2026-02 至 2026-04', target: '各网点负责人', status: 'ongoing', progress: 85 },
	      { id: 6, name: '危险化学品包装与装卸现场实操演练', category: '专项安全', period: '2026-03-20', target: '分拣区一线员工', status: 'completed', progress: 100 },
	      { id: 7, name: '春季百日安全无事故劳动竞赛宣贯', category: '安全教育', period: '2026-03 至 2026-05', target: '全网驾驶员', status: 'ongoing', progress: 40 },
	      { id: 8, name: '应急救援预案演练：火灾与疏散', category: '应急响应', period: '2026-06-15', target: '园区办公楼人员', status: 'delayed', progress: 10 }
	    ];
	  }

	  function mergeTrainingPlans(customPlans, basePlans, deletedIds) {
	    const deleted = deletedIds || new Set();
	    const custom = Array.isArray(customPlans) ? customPlans : [];
	    const base = Array.isArray(basePlans) ? basePlans : [];
	    const result = [];
	    const seen = new Set();
	    custom.forEach(function (plan) {
	      const id = plan && plan.id != null ? Number(plan.id) : NaN;
	      if (Number.isNaN(id) || deleted.has(id) || seen.has(id)) return;
	      seen.add(id);
	      result.push(plan);
	    });
	    base.forEach(function (plan) {
	      const id = plan && plan.id != null ? Number(plan.id) : NaN;
	      if (Number.isNaN(id) || deleted.has(id) || seen.has(id)) return;
	      seen.add(id);
	      result.push(plan);
	    });
	    return result;
	  }

	  function loadAllTrainingPlans() {
	    const deletedIds = loadDeletedTrainingPlanIds();
	    return mergeTrainingPlans(loadCustomTrainingPlans(), getBaseTrainingPlans(), deletedIds);
	  }

	  function getTrainingPlanById(id) {
	    const n = Number(id);
	    if (Number.isNaN(n)) return null;
	    const list = loadAllTrainingPlans();
	    for (var i = 0; i < list.length; i++) {
	      if (Number(list[i] && list[i].id) === n) return list[i];
	    }
	    return null;
	  }

	  function upsertCustomTrainingPlan(nextPlan) {
	    if (!nextPlan || nextPlan.id == null) return;
	    const id = Number(nextPlan.id);
	    if (Number.isNaN(id)) return;
	    const list = loadCustomTrainingPlans();
	    var replaced = false;
	    const next = Object.assign({}, nextPlan, { id: id });
	    const updated = list.map(function (item) {
	      const itemId = Number(item && item.id);
	      if (!Number.isNaN(itemId) && itemId === id) {
	        replaced = true;
	        return next;
	      }
	      return item;
	    });
	    if (!replaced) updated.unshift(next);
	    saveCustomTrainingPlans(updated.slice(0, 200));
	    // 如果之前被删除过，编辑/下发会恢复
	    const deleted = loadDeletedTrainingPlanIds();
	    if (deleted.has(id)) {
	      deleted.delete(id);
	      saveDeletedTrainingPlanIds(deleted);
	    }
	  }

	  function deleteTrainingPlanById(id) {
	    const n = Number(id);
	    if (Number.isNaN(n)) return;
	    const list = loadCustomTrainingPlans().filter(function (item) {
	      return Number(item && item.id) !== n;
	    });
	    saveCustomTrainingPlans(list);
	    const deleted = loadDeletedTrainingPlanIds();
	    deleted.add(n);
	    saveDeletedTrainingPlanIds(deleted);
	  }

	  function loadCustomTrainingPlans() {
	    const raw = localStorage.getItem(getTrainingPlanStorageKey());
	    const list = safeJsonParse(raw, []);
	    return Array.isArray(list) ? list : [];
	  }

  function saveCustomTrainingPlans(list) {
    localStorage.setItem(getTrainingPlanStorageKey(), JSON.stringify(list || []));
  }

  function addCustomTrainingPlan(plan) {
    const list = loadCustomTrainingPlans();
    list.unshift(plan);
    saveCustomTrainingPlans(list.slice(0, 200));
  }

	  function renderTrainingPlan() {
	    const plans = loadAllTrainingPlans();
	    const totalCount = plans.length;
	    const ongoingCount = plans.filter(function (p) { return p && p.status === 'ongoing'; }).length;
	    const completedCount = plans.filter(function (p) { return p && p.status === 'completed'; }).length;
	    const avgProgress = totalCount ? Math.round(plans.reduce(function (sum, p) { return sum + (Number(p.progress) || 0); }, 0) / totalCount) : 0;

    let rowHtml = '';
    plans.forEach(plan => {
      const statusLabel = {
        planned: '计划中',
        ongoing: '进行中',
        completed: '已完成',
        delayed: '已延期'
      };
      
	      rowHtml += `
	        <tr data-id="${String(plan.id)}" data-status="${escapeHtml(plan.status)}" data-name="${escapeHtml(plan.name)}">
	          <td>
	            <div class="plan-name-cell">
	              <span style="font-weight: 600;">${escapeHtml(plan.name)}</span>
	              <span class="plan-category">${escapeHtml(plan.category)}</span>
	            </div>
	          </td>
	          <td>${escapeHtml(plan.period)}</td>
	          <td>
	            <div class="plan-target-cell" title="${escapeHtml(plan.target)}">${escapeHtml(plan.target)}</div>
	          </td>
          <td>
            <div class="plan-progress-wrap">
              <div class="plan-progress-mini">
                <div class="plan-progress-fill" style="width: ${plan.progress}%"></div>
              </div>
              <span style="font-size: 12px; color: var(--text-secondary); min-width: 30px;">${plan.progress}%</span>
            </div>
	          </td>
	          <td>
	            <span class="status-badge status-${plan.status}">${statusLabel[plan.status]}</span>
	          </td>
	          <td>
	            <div class="plan-action-btns">
	              <button class="btn-icon dispatch-btn" title="${plan.status === 'planned' ? '下发任务' : '仅计划中可下发'}" ${plan.status === 'planned' ? '' : 'disabled'}>
	                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
	              </button>
	              <button class="btn-icon edit-btn" title="编辑">
	                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
	              </button>
	              <button class="btn-icon detail-btn" title="查看详情">
	                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
	              </button>
	              <button class="btn-icon btn-danger delete-btn" title="删除">
	                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
	              </button>
	            </div>
	          </td>
	        </tr>
	      `;
	    });

    return `
      <div class="sub-page">
        <div class="page-header">
          <div>
            <div class="page-title">培训计划</div>
            <div class="page-desc">年度与季度安全培训任务清单，实时追踪执行进度</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" type="button" data-page="training-plan-create">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              创建计划
            </button>
            <button class="btn btn-outline">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              导出报表
            </button>
          </div>
        </div>

        <div class="course-stats">
          <div class="course-stat-card">
            <div class="course-stat-label">计划总数</div>
            <div class="course-stat-value">${totalCount} 期</div>
          </div>
          <div class="course-stat-card">
            <div class="course-stat-label">执行中</div>
            <div class="course-stat-value">${ongoingCount} 期</div>
          </div>
          <div class="course-stat-card">
            <div class="course-stat-label">已完成计</div>
            <div class="course-stat-value">${completedCount} 期</div>
          </div>
          <div class="course-stat-card">
            <div class="course-stat-label">整体进度</div>
            <div class="course-stat-value">${avgProgress}%</div>
          </div>
        </div>

        <div class="course-toolbar">
          <div class="course-toolbar-left">
            <div class="course-search-wrap">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" class="course-search-input" id="planSearchInput" placeholder="搜索计划名称...">
            </div>
            <div class="course-filter-group">
              <select class="course-filter-select" id="planYearFilter">
                <option value="2026">2026年</option>
                <option value="2025">2025年</option>
              </select>
              <select class="course-filter-select" id="planStatusFilter">
                <option value="all">所有状态</option>
                <option value="planned">计划中</option>
                <option value="ongoing">进行中</option>
                <option value="completed">已完成</option>
                <option value="delayed">已延期</option>
              </select>
            </div>
          </div>
        </div>

        <div class="plan-table-container">
          <table class="plan-table">
            <thead>
              <tr>
                <th>计划名称</th>
                <th>计划周期</th>
                <th>目标对象</th>
                <th>执行进度</th>
                <th>当前状态</th>
                <th>管理操作</th>
              </tr>
            </thead>
            <tbody id="planTableBody">
              ${rowHtml}
            </tbody>
          </table>
        </div>
      </div>

	      <!-- 下发任务确认弹窗 -->
	      <div class="modal-overlay" id="dispatchPlanModalOverlay" style="display:none;">
	        <div class="modal modal-dispatch-plan">
	          <div class="modal-header modal-header--accent">
	            <div class="modal-header-left">
	              <div class="modal-title">下发培训任务</div>
	              <div class="modal-subtitle">确认下发范围后，将通知对应范围内负责人开始筹备</div>
	            </div>
	            <button class="modal-close" type="button" onclick="document.getElementById('dispatchPlanModalOverlay').style.display='none'">×</button>
	          </div>
	          <div class="modal-body">
	            <div class="dispatch-plan-layout">
	              <div class="dispatch-card">
	                <div class="dispatch-card-title">计划信息</div>
	                <div class="dispatch-summary">
	                  <div class="dispatch-item"><label>计划名称</label><span id="dispatchPlanName">-</span></div>
	                  <div class="dispatch-item"><label>计划周期</label><span id="dispatchPlanPeriod">-</span></div>
	                  <div class="dispatch-item dispatch-item--target"><label>拟受众</label><span id="dispatchPlanTarget">-</span></div>
	                </div>
	              </div>
	
	              <div class="dispatch-card">
	                <div class="dispatch-card-title">下发范围</div>
	                <div class="form-group">
	                  <label>南/中/北部（可选筛选）</label>
	                  <select class="form-control" id="dispatchRegionSelect">
	                    <option value="">全网</option>
	                    <option value="南部">南部</option>
	                    <option value="中部">中部</option>
	                    <option value="北部">北部</option>
	                  </select>
	                  <div class="form-help">如需精细下发，可先选择南北部，再选择省区/中心（均可多选）。</div>
	                </div>
	
	                <div class="dispatch-scope-grid">
	                  <div class="form-group">
	                    <label>省区（可多选）</label>
	                    <select class="form-control" id="dispatchProvinceSelect" multiple size="8" disabled></select>
	                  </div>
	                  <div class="form-group">
	                    <label>中心（可多选）</label>
	                    <select class="form-control" id="dispatchCenterSelect" multiple size="8" disabled></select>
	                  </div>
	                </div>
	              </div>
	            </div>
	
	            <div class="dispatch-confirm-tip">
	              确认下发该计划吗？下发后，系统将通知对应范围内的负责人开始筹备。
	            </div>
	          </div>
	          <div class="modal-footer">
	            <button class="btn btn-outline" type="button" onclick="document.getElementById('dispatchPlanModalOverlay').style.display='none'">暂不下发</button>
	            <button class="btn btn-primary" id="confirmDispatchBtn">确认下发</button>
	          </div>
	        </div>
	      </div>

	      <!-- 删除确认弹窗 -->
	      <div class="modal-overlay" id="deletePlanModalOverlay" style="display:none;">
	        <div class="modal" style="max-width: 520px;">
	          <div class="modal-header modal-header--accent">
	            <div class="modal-header-left">
	              <div class="modal-title">删除培训计划</div>
	              <div class="modal-subtitle">删除后将从列表移除（可重新创建），请谨慎操作</div>
	            </div>
	            <button class="modal-close" type="button" onclick="document.getElementById('deletePlanModalOverlay').style.display='none'">×</button>
	          </div>
	          <div class="modal-body">
	            <div class="dispatch-confirm-tip" style="margin-top:0;">
	              你将删除计划：<span id="deletePlanName" style="font-weight:700;color:var(--text-primary);">-</span>
	            </div>
	            <p style="margin-top: 12px; font-size: 13px; color: var(--text-secondary); line-height: 1.7;">
	              此操作不会影响历史统计报表展示（示例数据除外），但该计划将不再出现在当前列表中。
	            </p>
	          </div>
	          <div class="modal-footer">
	            <button class="btn btn-outline" type="button" onclick="document.getElementById('deletePlanModalOverlay').style.display='none'">取消</button>
	            <button class="btn btn-primary" id="confirmDeletePlanBtn" style="background: var(--danger); border-color: var(--danger);">确认删除</button>
	          </div>
	        </div>
	      </div>
	    `;
	  }

  function initTrainingPlan() {
    const searchInput = document.getElementById('planSearchInput');
    const statusFilter = document.getElementById('planStatusFilter');
    const tableBody = document.getElementById('planTableBody');
    const rows = tableBody.querySelectorAll('tr');

    function filterPlans() {
      const searchTerm = searchInput.value.toLowerCase();
      const status = statusFilter.value;

      rows.forEach(row => {
        const name = row.dataset.name.toLowerCase();
        const rowStatus = row.dataset.status;

        const matchesSearch = name.includes(searchTerm);
        const matchesStatus = status === 'all' || rowStatus === status;

        if (matchesSearch && matchesStatus) {
          row.style.display = 'table-row';
        } else {
          row.style.display = 'none';
        }
      });
    }

    if (searchInput) searchInput.addEventListener('input', filterPlans);
    if (statusFilter) statusFilter.addEventListener('change', filterPlans);

    // --- 创建计划逻辑 ---
    const createBtn = document.querySelector('.page-actions .btn-primary');
    const createModal = document.getElementById('createPlanModalOverlay');
    const createForm = document.getElementById('createPlanForm');
    const regionSelect = document.getElementById('planRegionSelect');
    const provinceSelect = document.getElementById('planProvinceSelect');
    const centerSelect = document.getElementById('planCenterSelect');
    const coursesSelect = document.getElementById('planCoursesSelect');

    const REGION_SCOPE_MAP = {
      '南部': {
        '广东': ['广州中心', '深圳中心'],
        '福建': ['福州中心', '厦门中心'],
        '广西': ['南宁中心']
      },
      '中部': {
        '湖北': ['武汉中心', '襄阳中心'],
        '湖南': ['长沙中心'],
        '河南': ['郑州中心']
      },
      '北部': {
        '北京': ['北京中心'],
        '河北': ['石家庄中心'],
        '辽宁': ['沈阳中心', '大连中心']
      }
    };

    function getSelectedValues(selectEl) {
      if (!selectEl) return [];
      return Array.from(selectEl.selectedOptions || []).map(function (opt) { return opt.value; }).filter(Boolean);
    }

    function setSelectOptions(selectEl, options, placeholder) {
      if (!selectEl) return;
      const current = new Set(getSelectedValues(selectEl));
      let html = '';
      if (placeholder) {
        html += '<option value="">' + placeholder + '</option>';
      }
      (options || []).forEach(function (opt) {
        const selected = current.has(opt) ? ' selected' : '';
        html += '<option value="' + opt + '"' + selected + '>' + opt + '</option>';
      });
      selectEl.innerHTML = html;
    }

    function updateProvinceAndCenterOptions() {
      if (!regionSelect || !provinceSelect || !centerSelect) return;
      const region = regionSelect.value;
      const map = REGION_SCOPE_MAP[region] || {};
      const provinces = Object.keys(map);
      setSelectOptions(provinceSelect, provinces);

      const selectedProvinces = getSelectedValues(provinceSelect);
      const unionCenters = [];
      selectedProvinces.forEach(function (p) {
        (map[p] || []).forEach(function (c) {
          if (unionCenters.indexOf(c) === -1) unionCenters.push(c);
        });
      });

      // 若未选省区，默认展示该区域下全部中心，方便直接多选
      if (!selectedProvinces.length) {
        provinces.forEach(function (p) {
          (map[p] || []).forEach(function (c) {
            if (unionCenters.indexOf(c) === -1) unionCenters.push(c);
          });
        });
      }
      setSelectOptions(centerSelect, unionCenters);
    }

    function updateCoursesOptions() {
      if (!coursesSelect) return;
      const courses = getMergedCourseLibraryCourses(getBaseCourseLibraryCourses());
      const titles = new Map();
      courses.forEach(function (c) {
        if (!c || !c.title) return;
        // value 使用 id，展示 title（去重）
        if (!titles.has(String(c.id))) titles.set(String(c.id), c.title);
      });
      const entries = Array.from(titles.entries()).map(function (pair) { return { id: pair[0], title: pair[1] }; });
      entries.sort(function (a, b) { return (a.title || '').localeCompare(b.title || ''); });
      coursesSelect.innerHTML = entries.map(function (item) {
        return '<option value="' + item.id + '">' + item.title + '</option>';
      }).join('');
    }

    if (createBtn && createModal) {
      createBtn.addEventListener('click', () => {
        createModal.style.display = 'flex';
        updateCoursesOptions();
        updateProvinceAndCenterOptions();
      });
    }

    if (regionSelect) {
      regionSelect.addEventListener('change', function () {
        // 切换区域时清空省区/中心选择，避免残留
        if (provinceSelect) provinceSelect.selectedIndex = -1;
        if (centerSelect) centerSelect.selectedIndex = -1;
        updateProvinceAndCenterOptions();
      });
    }

    if (provinceSelect) {
      provinceSelect.addEventListener('change', function () {
        if (centerSelect) centerSelect.selectedIndex = -1;
        updateProvinceAndCenterOptions();
      });
    }

    if (createForm) {
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(createForm);
        const name = (formData.get('name') || '').toString();
        const category = (formData.get('category') || '').toString();
        const region = (formData.get('region') || '').toString();
        const startDate = (formData.get('startDate') || '').toString();
        const endDate = (formData.get('endDate') || '').toString();

        const provinces = getSelectedValues(provinceSelect);
        const centers = getSelectedValues(centerSelect);
        const selectedCourseIds = getSelectedValues(coursesSelect);

        if (!region) {
          alert('请选择目标对象范围（南部/中部/北部）。');
          return;
        }
        if (!startDate || !endDate) {
          alert('请选择开始日期与结束日期。');
          return;
        }
        if (!selectedCourseIds.length) {
          alert('请选择需要学习的课程（可多选）。');
          return;
        }

        const period = `${startDate} 至 ${endDate}`;

        const scopeParts = [];
        scopeParts.push(region);
        if (provinces.length) scopeParts.push('省区:' + provinces.join('、'));
        if (centers.length) scopeParts.push('中心:' + centers.join('、'));
        const target = scopeParts.join(' / ');

        // 动态添加一行
	        const newRow = document.createElement('tr');
	        const rowId = Date.now();
	        newRow.dataset.id = String(rowId);
	        newRow.dataset.status = 'planned';
	        newRow.dataset.name = name;
	        newRow.innerHTML = `
          <td>
            <div class="plan-name-cell">
              <span style="font-weight: 600;">${name}</span>
              <span class="plan-category">${category}</span>
            </div>
          </td>
          <td>${period}</td>
          <td><div class="plan-target-cell" title="${escapeHtml(target)}">${escapeHtml(target)}</div></td>
          <td>
            <div class="plan-progress-wrap">
              <div class="plan-progress-mini">
                <div class="plan-progress-fill" style="width: 0%"></div>
              </div>
              <span style="font-size: 12px; color: var(--text-secondary); min-width: 30px;">0%</span>
            </div>
          </td>
          <td>
            <span class="status-badge status-planned">计划中</span>
          </td>
	          <td>
	            <div class="plan-action-btns">
	              <button class="btn-icon dispatch-btn" title="下发任务">
	                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
	              </button>
	              <button class="btn-icon edit-btn" title="编辑"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
	              <button class="btn-icon detail-btn" title="查看详情"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
	              <button class="btn-icon btn-danger delete-btn" title="删除"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
	            </div>
	          </td>
	        `;
        tableBody.insertBefore(newRow, tableBody.firstChild);
        
        // 重置并隐藏
        createForm.reset();
        createModal.style.display = 'none';
        
        // 更新统计 (模拟)
        const totalStat = document.querySelector('.course-stat-card:nth-child(1) .course-stat-value');
        if (totalStat) {
          const currentVal = parseInt(totalStat.textContent);
          totalStat.textContent = (currentVal + 1) + ' 期';
        }

        // 重新绑定“下发”事件（针对新行）
        bindRowEvent(newRow);
      });
    }

	    // --- 下发任务逻辑 ---
	    const dispatchModal = document.getElementById('dispatchPlanModalOverlay');
	    const confirmDispatchBtn = document.getElementById('confirmDispatchBtn');
    const dispatchRegionSelect = document.getElementById('dispatchRegionSelect');
	    const dispatchProvinceSelect = document.getElementById('dispatchProvinceSelect');
	    const dispatchCenterSelect = document.getElementById('dispatchCenterSelect');
	    let currentRowToDispatch = null;

	    // --- 删除逻辑 ---
	    const deleteModal = document.getElementById('deletePlanModalOverlay');
	    const confirmDeleteBtn = document.getElementById('confirmDeletePlanBtn');
	    const deletePlanNameEl = document.getElementById('deletePlanName');
	    let currentRowToDelete = null;

    function normalizeProvinceDisplayName(name) {
      return String(name || '').replace(/(省公司|大区)$/g, '');
    }

    function getCenterDisplayName(center) {
      const shortName = center && center.shortName ? String(center.shortName) : '';
      if (shortName) return shortName + '中心';
      const full = String((center && center.name) || '');
      if (!full) return '';
      if (full.indexOf('转运中心') >= 0) return full.replace('转运中心', '中心');
      if (full.indexOf('中心') >= 0) return full;
      return full + '中心';
    }

    function getSelectedValues(selectEl) {
      if (!selectEl) return [];
      return Array.from(selectEl.selectedOptions || []).map(function (opt) { return opt.value; }).filter(Boolean);
    }

    function getSelectedLabels(selectEl) {
      if (!selectEl) return [];
      return Array.from(selectEl.selectedOptions || []).map(function (opt) { return opt.textContent; }).filter(Boolean);
    }

    function setSelectOptions(selectEl, items, selectedValues) {
      if (!selectEl) return;
      const current = new Set(Array.isArray(selectedValues) ? selectedValues : getSelectedValues(selectEl));
      selectEl.innerHTML = (items || []).map(function (item) {
        const selected = current.has(item.value) ? ' selected' : '';
        return '<option value="' + item.value + '"' + selected + '>' + escapeHtml(item.label) + '</option>';
      }).join('');
    }

    function enableClickMultiSelect(selectEl) {
      if (!selectEl || !selectEl.multiple) return;
      selectEl.addEventListener('mousedown', function (e) {
        const target = e && e.target;
        if (!target || target.tagName !== 'OPTION') return;
        e.preventDefault();
        target.selected = !target.selected;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    function resetDispatchScopeFilters() {
      if (dispatchRegionSelect) dispatchRegionSelect.value = '';
      if (dispatchProvinceSelect) {
        dispatchProvinceSelect.innerHTML = '';
        dispatchProvinceSelect.disabled = true;
      }
      if (dispatchCenterSelect) {
        dispatchCenterSelect.innerHTML = '';
        dispatchCenterSelect.disabled = true;
      }
    }

    function updateDispatchProvinceAndCenterOptions(nextProvinceCodes, nextCenterCodes) {
      if (!dispatchRegionSelect || !dispatchProvinceSelect || !dispatchCenterSelect) return;

      const region = String(dispatchRegionSelect.value || '').trim();
      if (!region) {
        resetDispatchScopeFilters();
        return;
      }

      const provinces = (provincesData || []).filter(function (p) { return p && p.northSouth === region; });
      const provinceItems = provinces.map(function (p) {
        return { value: p.code, label: normalizeProvinceDisplayName(p.name) };
      });
      provinceItems.sort(function (a, b) { return (a.label || '').localeCompare(b.label || ''); });

      dispatchProvinceSelect.disabled = false;
      setSelectOptions(dispatchProvinceSelect, provinceItems, nextProvinceCodes);

      const selectedProvinceCodes = new Set(Array.isArray(nextProvinceCodes) ? nextProvinceCodes : getSelectedValues(dispatchProvinceSelect));
      const allowedProvinceCodes = new Set(provinces.map(function (p) { return p.code; }));

      const centerCandidates = (centersData || []).filter(function (c) { return c && allowedProvinceCodes.has(c.provinceCode); });
      const centers = selectedProvinceCodes.size
        ? centerCandidates.filter(function (c) { return selectedProvinceCodes.has(c.provinceCode); })
        : centerCandidates;

      const centerItems = centers.map(function (c) {
        return { value: c.code, label: getCenterDisplayName(c) };
      });
      centerItems.sort(function (a, b) { return (a.label || '').localeCompare(b.label || ''); });

      dispatchCenterSelect.disabled = !centerItems.length;
      setSelectOptions(dispatchCenterSelect, centerItems, nextCenterCodes);
    }

    // 初次加载主数据（省区/中心）
    if (dispatchRegionSelect || dispatchProvinceSelect || dispatchCenterSelect) {
      fetchLocationsData().then(function () {
        resetDispatchScopeFilters();
      }).catch(function () {
        resetDispatchScopeFilters();
      });
    }

    if (dispatchRegionSelect) {
      dispatchRegionSelect.addEventListener('change', function () {
        updateDispatchProvinceAndCenterOptions([], []);
      });
    }

    if (dispatchProvinceSelect) {
      dispatchProvinceSelect.addEventListener('change', function () {
        const provinceCodes = getSelectedValues(dispatchProvinceSelect);
        const centerCodes = getSelectedValues(dispatchCenterSelect);
        updateDispatchProvinceAndCenterOptions(provinceCodes, centerCodes);
      });
      enableClickMultiSelect(dispatchProvinceSelect);
    }

    if (dispatchCenterSelect) {
      enableClickMultiSelect(dispatchCenterSelect);
    }

	    function bindRowEvent(row) {
	      const dispatchBtn = row.querySelector('.dispatch-btn');
	      if (dispatchBtn) {
	        dispatchBtn.addEventListener('click', () => {
	          if (dispatchBtn.disabled) return;
	          currentRowToDispatch = row;
	          document.getElementById('dispatchPlanName').textContent = row.dataset.name;
	          document.getElementById('dispatchPlanPeriod').textContent = row.cells[1].textContent;
	          document.getElementById('dispatchPlanTarget').textContent = row.cells[2].textContent;

          // 重置下发范围筛选
          resetDispatchScopeFilters();
          
	          dispatchModal.style.display = 'flex';
	        });
	      }

	      const editBtn = row.querySelector('.edit-btn');
	      if (editBtn) {
	        editBtn.addEventListener('click', function () {
	          setSelectedTrainingPlanId(row.dataset.id || '');
	          navigateTo('training-plan-edit');
	        });
	      }

	      const detailBtn = row.querySelector('.detail-btn');
	      if (detailBtn) {
	        detailBtn.addEventListener('click', function () {
	          setSelectedTrainingPlanId(row.dataset.id || '');
	          navigateTo('training-plan-detail');
	        });
	      }

	      const deleteBtn = row.querySelector('.delete-btn');
	      if (deleteBtn) {
	        deleteBtn.addEventListener('click', function () {
	          currentRowToDelete = row;
	          if (deletePlanNameEl) deletePlanNameEl.textContent = row.dataset.name || '-';
	          if (deleteModal) deleteModal.style.display = 'flex';
	        });
	      }
	    }

    rows.forEach(bindRowEvent);

	    if (confirmDispatchBtn) {
	      confirmDispatchBtn.addEventListener('click', () => {
	        if (!currentRowToDispatch) return;

        // 读取下发范围筛选（南北部/省区/中心）
        const region = String((dispatchRegionSelect && dispatchRegionSelect.value) || '').trim();
        const provinces = getSelectedLabels(dispatchProvinceSelect);
        const centers = getSelectedLabels(dispatchCenterSelect);
        const scopeParts = [];
        if (region) scopeParts.push(region);
        if (provinces.length) scopeParts.push('省区:' + provinces.join('、'));
        if (centers.length) scopeParts.push('中心:' + centers.join('、'));
        const dispatchTarget = scopeParts.length ? scopeParts.join(' / ') : '全网';

        // 回写目标对象展示（列表 + 弹窗摘要）
        const targetCell = currentRowToDispatch.cells && currentRowToDispatch.cells[2];
        if (targetCell) {
          const targetDiv = targetCell.querySelector('.plan-target-cell');
          if (targetDiv) {
            targetDiv.textContent = dispatchTarget;
            targetDiv.title = dispatchTarget;
          } else {
            targetCell.textContent = dispatchTarget;
          }
        }
        const targetSpan = document.getElementById('dispatchPlanTarget');
        if (targetSpan) targetSpan.textContent = dispatchTarget;
        currentRowToDispatch.dataset.target = dispatchTarget;

	        // 更新状态标签
	        const statusBadge = currentRowToDispatch.querySelector('.status-badge');
	        statusBadge.className = 'status-badge status-ongoing';
	        statusBadge.textContent = '进行中';
	        currentRowToDispatch.dataset.status = 'ongoing';

        // 更新进度 (模拟)
        const progressFill = currentRowToDispatch.querySelector('.plan-progress-fill');
        const progressText = currentRowToDispatch.querySelector('.plan-progress-wrap span');
        if (progressFill && progressText) {
          progressFill.style.width = '5%';
          progressText.textContent = '5%';
        }

	        // 移除下发按钮
	        const dispatchBtn = currentRowToDispatch.querySelector('.dispatch-btn');
	        if (dispatchBtn) {
	          dispatchBtn.disabled = true;
	          dispatchBtn.title = '仅计划中可下发';
	        }

	        // 隐藏弹窗
	        dispatchModal.style.display = 'none';

	        // 持久化（覆盖保存）
	        const planId = currentRowToDispatch.dataset.id;
	        const planName = currentRowToDispatch.dataset.name || (currentRowToDispatch.cells[0] && currentRowToDispatch.cells[0].textContent) || '';
	        const planPeriod = (currentRowToDispatch.cells[1] && currentRowToDispatch.cells[1].textContent) || '';
	        const planCategoryNode = currentRowToDispatch.querySelector('.plan-category');
	        const planCategory = planCategoryNode ? planCategoryNode.textContent : '';
	        const progressVal = progressText ? Number(String(progressText.textContent || '').replace('%', '')) : 0;
	        upsertCustomTrainingPlan({
	          id: Number(planId),
	          name: planName,
	          category: planCategory,
	          period: planPeriod,
	          target: dispatchTarget,
	          status: 'ongoing',
	          progress: Number.isNaN(progressVal) ? 0 : progressVal
	        });

	        currentRowToDispatch = null;

        // 更新统计 (模拟)
        const ongoingStat = document.querySelector('.course-stat-card:nth-child(2) .course-stat-value');
        if (ongoingStat) {
          const currentVal = parseInt(ongoingStat.textContent);
          ongoingStat.textContent = (currentVal + 1) + ' 期';
        }
	      });
	    }

	    if (confirmDeleteBtn) {
	      confirmDeleteBtn.addEventListener('click', function () {
	        if (!currentRowToDelete) return;
	        const id = currentRowToDelete.dataset.id;
	        deleteTrainingPlanById(id);
	        if (deleteModal) deleteModal.style.display = 'none';
	        currentRowToDelete = null;
	        navigateTo('training-plan');
	      });
	    }

	    // 点击蒙层关闭
	    [createModal, dispatchModal, deleteModal].forEach(m => {
	      if (m) m.addEventListener('click', (e) => { if(e.target === m) m.style.display = 'none'; });
	    });
  }

  function renderCreateTrainingPlanPage() {
    return `
      <div class="sub-page training-plan-create">
        <div class="page-header">
          <div>
            <div class="page-title">创建培训计划</div>
            <div class="page-desc">独立页面创建年度/季度培训任务；下发时可按南北部、省区与中心范围筛选下发对象</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" type="button" id="backToTrainingPlanBtn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
              返回列表
            </button>
            <button class="btn btn-primary" type="button" id="submitTrainingPlanTopBtn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
              创建计划
            </button>
          </div>
        </div>

        <div class="course-create-card">
          <form id="createTrainingPlanPageForm" class="course-create-form">
            <div class="modal-hint">请填写计划基础信息；南北部、省区、中心在“下发培训任务”时按《公司同学录分布》主数据联动筛选。</div>

            <div class="form-grid">
              <div class="form-group full-width">
                <label class="required">培训计划名称</label>
                <input type="text" class="form-control" id="trainingPlanNameInput" name="name" maxlength="60" placeholder="例如：2026年Q2消防演练" required>
              </div>

              <div class="form-group">
                <label class="required">培训类别</label>
                <select class="form-control" id="trainingPlanCategorySelect" name="category" required>
                  <option value="">请选择类别</option>
                  <option value="消防安全">消防安全</option>
                  <option value="设备安全">设备安全</option>
                  <option value="专项安全">专项安全</option>
                  <option value="通用安全">通用安全</option>
                  <option value="应急响应">应急响应</option>
                </select>
              </div>

              <div class="form-group">
                <label class="required">开始日期</label>
                <input type="date" class="form-control" id="trainingPlanStartDateInput" name="startDate" required>
              </div>

              <div class="form-group">
                <label class="required">结束日期</label>
                <input type="date" class="form-control" id="trainingPlanEndDateInput" name="endDate" required>
              </div>

              <div class="form-group full-width">
                <label>目标对象</label>
                <div class="dispatch-scope-grid">
                  <div class="form-group">
                    <label>南/中/北部（可选筛选）</label>
                    <select class="form-control" id="trainingPlanTargetRegionSelect">
                      <option value="">全网</option>
                      <option value="南部">南部</option>
                      <option value="中部">中部</option>
                      <option value="北部">北部</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>省区（可多选）</label>
                    <select class="form-control" id="trainingPlanTargetProvinceSelect" multiple size="8" disabled></select>
                  </div>
                  <div class="form-group">
                    <label>中心（可多选）</label>
                    <select class="form-control" id="trainingPlanTargetCenterSelect" multiple size="8" disabled></select>
                  </div>
                </div>
                <div class="form-help">不选择则默认“全网”。如需精细下发，可先选择南北部，再选择省区/中心（均可多选）。</div>
                <input type="hidden" id="trainingPlanTargetInput" name="target" value="全网">
              </div>

              <div class="form-group full-width">
                <label class="required">需要学习的课程（下拉可多选）</label>
                <div class="multi-select" id="trainingPlanCoursesMulti">
                  <button type="button" class="form-control multi-select-trigger" id="trainingPlanCoursesTrigger" aria-haspopup="listbox" aria-expanded="false">
                    <span class="multi-select-trigger-text" id="trainingPlanCoursesTriggerText">请选择课程（可多选）</span>
                    <span class="multi-select-trigger-count" id="trainingPlanCoursesTriggerCount">0</span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div class="multi-select-panel" id="trainingPlanCoursesPanel" style="display:none;">
                    <div class="multi-select-search">
                      <input type="text" class="form-control" id="trainingPlanCoursesSearchInput" placeholder="搜索课程名称...">
                    </div>
                    <div class="multi-select-options" id="trainingPlanCoursesOptions" role="listbox" aria-multiselectable="true"></div>
                    <div class="multi-select-footer">
                      <button type="button" class="multi-select-clear" id="trainingPlanCoursesClearBtn">清空已选</button>
                      <span class="multi-select-hint">课程来自“课程库”（包含你新建并保存的课程）</span>
                    </div>
                  </div>
                  <input type="hidden" id="trainingPlanCourseIdsInput" name="courseIds" value="">
                </div>
              </div>

              <div class="form-group full-width">
                <label>备注</label>
                <textarea class="form-control" id="trainingPlanRemarkInput" name="desc" rows="3" placeholder="可选：学习要求、考核方式、提醒频次等..."></textarea>
              </div>
            </div>

            <div class="course-create-footer">
              <button type="button" class="btn btn-outline" id="cancelTrainingPlanBtn">取消</button>
              <button type="submit" class="btn btn-primary">创建计划</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

	  function initCreateTrainingPlanPage() {
	    const form = document.getElementById('createTrainingPlanPageForm');
    const nameInput = document.getElementById('trainingPlanNameInput');
    const categorySelect = document.getElementById('trainingPlanCategorySelect');
    const startDateInput = document.getElementById('trainingPlanStartDateInput');
    const endDateInput = document.getElementById('trainingPlanEndDateInput');
    const targetRegionSelect = document.getElementById('trainingPlanTargetRegionSelect');
    const targetProvinceSelect = document.getElementById('trainingPlanTargetProvinceSelect');
    const targetCenterSelect = document.getElementById('trainingPlanTargetCenterSelect');
    const targetInput = document.getElementById('trainingPlanTargetInput');

    const topSubmitBtn = document.getElementById('submitTrainingPlanTopBtn');
    const backBtn = document.getElementById('backToTrainingPlanBtn');
    const cancelBtn = document.getElementById('cancelTrainingPlanBtn');

    const trigger = document.getElementById('trainingPlanCoursesTrigger');
    const triggerText = document.getElementById('trainingPlanCoursesTriggerText');
    const triggerCount = document.getElementById('trainingPlanCoursesTriggerCount');
    const panel = document.getElementById('trainingPlanCoursesPanel');
    const searchInput = document.getElementById('trainingPlanCoursesSearchInput');
    const optionsEl = document.getElementById('trainingPlanCoursesOptions');
    const clearBtn = document.getElementById('trainingPlanCoursesClearBtn');
    const hiddenCourseIdsInput = document.getElementById('trainingPlanCourseIdsInput');

    if (backBtn) backBtn.addEventListener('click', function () { navigateTo('training-plan'); });
    if (cancelBtn) cancelBtn.addEventListener('click', function () { navigateTo('training-plan'); });
    if (topSubmitBtn && form) topSubmitBtn.addEventListener('click', function () { form.requestSubmit(); });

    function getCourseEntries() {
      const courses = getMergedCourseLibraryCourses(getBaseCourseLibraryCourses());
      const byId = new Map();
      courses.forEach(function (c) {
        if (!c || !c.title) return;
        const id = String(c.id);
        if (!byId.has(id)) byId.set(id, { id: id, title: c.title, category: c.category || '' });
      });
      const entries = Array.from(byId.values());
      entries.sort(function (a, b) { return (a.title || '').localeCompare(b.title || ''); });
      return entries;
    }

    const selectedCourseIds = new Set();
    let courseEntriesCache = [];

    function syncCoursesHiddenInput() {
      if (hiddenCourseIdsInput) hiddenCourseIdsInput.value = Array.from(selectedCourseIds).join(',');
    }

    function updateCoursesTrigger() {
      const selectedCount = selectedCourseIds.size;
      if (triggerCount) triggerCount.textContent = String(selectedCount);
      if (!triggerText) return;
      if (!selectedCount) {
        triggerText.textContent = '请选择课程（可多选）';
        return;
      }
      const titles = [];
      courseEntriesCache.forEach(function (item) {
        if (selectedCourseIds.has(String(item.id))) titles.push(item.title);
      });
      const shown = titles.slice(0, 2);
      triggerText.textContent = shown.join('、') + (selectedCount > 2 ? (' 等' + selectedCount + '门') : '');
    }

    function renderCourseOptions() {
      if (!optionsEl) return;
      courseEntriesCache = getCourseEntries();
      optionsEl.innerHTML = courseEntriesCache.map(function (item) {
        const checked = selectedCourseIds.has(String(item.id)) ? ' checked' : '';
        const safeTitle = String(item.title || '');
        const safeCategory = String(item.category || '');
        return `
          <label class="multi-select-option" data-title="${safeTitle.toLowerCase()}">
            <input type="checkbox" value="${item.id}"${checked}>
            <span class="multi-select-option-title">${safeTitle}</span>
            ${safeCategory ? `<span class="multi-select-option-meta">${safeCategory}</span>` : ''}
          </label>
        `;
      }).join('');
      updateCoursesTrigger();
      syncCoursesHiddenInput();
    }

    function openCoursesPanel() {
      if (!panel || !trigger) return;
      panel.style.display = 'block';
      trigger.setAttribute('aria-expanded', 'true');
      if (searchInput) searchInput.focus();
    }

    function closeCoursesPanel() {
      if (!panel || !trigger) return;
      panel.style.display = 'none';
      trigger.setAttribute('aria-expanded', 'false');
      if (searchInput) searchInput.value = '';
      if (optionsEl) {
        Array.from(optionsEl.querySelectorAll('.multi-select-option')).forEach(function (node) {
          node.style.display = '';
        });
      }
    }

    function toggleCoursesPanel() {
      if (!panel) return;
      if (panel.style.display === 'none' || !panel.style.display) openCoursesPanel();
      else closeCoursesPanel();
    }

    if (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        toggleCoursesPanel();
      });
    }

    if (optionsEl) {
      optionsEl.addEventListener('change', function (e) {
        const checkbox = e.target && e.target.closest ? e.target.closest('input[type="checkbox"]') : null;
        if (!checkbox) return;
        const val = String(checkbox.value || '');
        if (!val) return;
        if (checkbox.checked) selectedCourseIds.add(val);
        else selectedCourseIds.delete(val);
        updateCoursesTrigger();
        syncCoursesHiddenInput();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        const term = String(searchInput.value || '').trim().toLowerCase();
        const nodes = optionsEl ? Array.from(optionsEl.querySelectorAll('.multi-select-option')) : [];
        nodes.forEach(function (node) {
          const title = String(node.dataset.title || '');
          node.style.display = (!term || title.indexOf(term) >= 0) ? '' : 'none';
        });
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        selectedCourseIds.clear();
        if (optionsEl) {
          Array.from(optionsEl.querySelectorAll('input[type="checkbox"]')).forEach(function (cb) { cb.checked = false; });
        }
        updateCoursesTrigger();
        syncCoursesHiddenInput();
      });
    }

    document.addEventListener('click', function (e) {
      if (!panel || !trigger) return;
      const target = e.target;
      const inside = (target && target.closest) ? target.closest('#trainingPlanCoursesMulti') : null;
      if (!inside && panel.style.display === 'block') closeCoursesPanel();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeCoursesPanel();
    });
    renderCourseOptions();

    // 目标对象：全网 / 南北部 + 省区/中心（多选）
    function normalizeProvinceDisplayName(name) {
      return String(name || '').replace(/(省公司|大区)$/g, '');
    }

    function getCenterDisplayName(center) {
      const shortName = center && center.shortName ? String(center.shortName) : '';
      if (shortName) return shortName + '中心';
      const full = String((center && center.name) || '');
      if (!full) return '';
      if (full.indexOf('转运中心') >= 0) return full.replace('转运中心', '中心');
      if (full.indexOf('中心') >= 0) return full;
      return full + '中心';
    }

    function getSelectedValues(selectEl) {
      if (!selectEl) return [];
      return Array.from(selectEl.selectedOptions || []).map(function (opt) { return opt.value; }).filter(Boolean);
    }

    function getSelectedLabels(selectEl) {
      if (!selectEl) return [];
      return Array.from(selectEl.selectedOptions || []).map(function (opt) { return opt.textContent; }).filter(Boolean);
    }

    function setSelectOptions(selectEl, items, selectedValues) {
      if (!selectEl) return;
      const current = new Set(Array.isArray(selectedValues) ? selectedValues : getSelectedValues(selectEl));
      selectEl.innerHTML = (items || []).map(function (item) {
        const selected = current.has(item.value) ? ' selected' : '';
        return '<option value="' + item.value + '"' + selected + '>' + escapeHtml(item.label) + '</option>';
      }).join('');
    }

    function enableClickMultiSelect(selectEl) {
      if (!selectEl || !selectEl.multiple) return;
      selectEl.addEventListener('mousedown', function (e) {
        const target = e && e.target;
        if (!target || target.tagName !== 'OPTION') return;
        e.preventDefault();
        target.selected = !target.selected;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    function resetTargetScopeFilters() {
      if (targetRegionSelect) targetRegionSelect.value = '';
      if (targetProvinceSelect) {
        targetProvinceSelect.innerHTML = '';
        targetProvinceSelect.disabled = true;
      }
      if (targetCenterSelect) {
        targetCenterSelect.innerHTML = '';
        targetCenterSelect.disabled = true;
      }
      syncTargetHiddenInput();
    }

    function updateTargetProvinceAndCenterOptions(nextProvinceCodes, nextCenterCodes) {
      if (!targetRegionSelect || !targetProvinceSelect || !targetCenterSelect) return;
      const region = String(targetRegionSelect.value || '').trim();
      if (!region) {
        resetTargetScopeFilters();
        return;
      }

      const provinces = (provincesData || []).filter(function (p) { return p && p.northSouth === region; });
      const provinceItems = provinces.map(function (p) {
        return { value: p.code, label: normalizeProvinceDisplayName(p.name) };
      });
      provinceItems.sort(function (a, b) { return (a.label || '').localeCompare(b.label || ''); });

      targetProvinceSelect.disabled = false;
      setSelectOptions(targetProvinceSelect, provinceItems, nextProvinceCodes);

      const selectedProvinceCodes = new Set(Array.isArray(nextProvinceCodes) ? nextProvinceCodes : getSelectedValues(targetProvinceSelect));
      const allowedProvinceCodes = new Set(provinces.map(function (p) { return p.code; }));

      const centerCandidates = (centersData || []).filter(function (c) { return c && allowedProvinceCodes.has(c.provinceCode); });
      const centers = selectedProvinceCodes.size
        ? centerCandidates.filter(function (c) { return selectedProvinceCodes.has(c.provinceCode); })
        : centerCandidates;

      const centerItems = centers.map(function (c) {
        return { value: c.code, label: getCenterDisplayName(c) };
      });
      centerItems.sort(function (a, b) { return (a.label || '').localeCompare(b.label || ''); });

      targetCenterSelect.disabled = !centerItems.length;
      setSelectOptions(targetCenterSelect, centerItems, nextCenterCodes);
      syncTargetHiddenInput();
    }

    function syncTargetHiddenInput() {
      if (!targetInput) return;
      const region = targetRegionSelect ? String(targetRegionSelect.value || '').trim() : '';
      if (!region) {
        targetInput.value = '全网';
        return;
      }
      const provLabels = getSelectedLabels(targetProvinceSelect);
      const centerLabels = getSelectedLabels(targetCenterSelect);
      let text = region;
      if (provLabels.length) text += ' 省区:' + provLabels.join('、');
      if (centerLabels.length) text += ' 中心:' + centerLabels.join('、');
      targetInput.value = text || '全网';
    }

    if (targetRegionSelect || targetProvinceSelect || targetCenterSelect) {
      fetchLocationsData().then(function () {
        resetTargetScopeFilters();
      }).catch(function () {
        resetTargetScopeFilters();
      });
    }

    if (targetRegionSelect) {
      targetRegionSelect.addEventListener('change', function () {
        updateTargetProvinceAndCenterOptions([], []);
      });
    }
    if (targetProvinceSelect) {
      targetProvinceSelect.addEventListener('change', function () {
        const provinceCodes = getSelectedValues(targetProvinceSelect);
        const centerCodes = getSelectedValues(targetCenterSelect);
        updateTargetProvinceAndCenterOptions(provinceCodes, centerCodes);
      });
      enableClickMultiSelect(targetProvinceSelect);
    }
    if (targetCenterSelect) {
      targetCenterSelect.addEventListener('change', function () {
        syncTargetHiddenInput();
      });
      enableClickMultiSelect(targetCenterSelect);
    }

    function validateForm() {
      const name = String((nameInput && nameInput.value) || '').trim();
      const category = String((categorySelect && categorySelect.value) || '').trim();
      const startDate = String((startDateInput && startDateInput.value) || '').trim();
      const endDate = String((endDateInput && endDateInput.value) || '').trim();

      if (!name) { alert('请填写培训计划名称。'); return false; }
      if (!category) { alert('请选择培训类别。'); return false; }
      if (!startDate || !endDate) { alert('请选择开始日期与结束日期。'); return false; }
      if (startDate && endDate && startDate > endDate) { alert('开始日期不能晚于结束日期。'); return false; }
      if (!selectedCourseIds.size) { alert('请选择需要学习的课程（可多选）。'); return false; }
      return true;
    }

	    if (form) {
	      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validateForm()) return;

        const name = String(nameInput.value || '').trim();
        const category = String(categorySelect.value || '').trim();
        const startDate = String(startDateInput.value || '').trim();
        const endDate = String(endDateInput.value || '').trim();

        const period = startDate + ' 至 ' + endDate;
        const target = String((targetInput && targetInput.value) || '').trim() || '全网';
        const targetRegion = targetRegionSelect ? String(targetRegionSelect.value || '').trim() : '';
        const targetProvinceCodes = targetRegion ? getSelectedValues(targetProvinceSelect) : [];
        const targetCenterCodes = targetRegion ? getSelectedValues(targetCenterSelect) : [];

        addCustomTrainingPlan({
          id: Date.now(),
          name: name,
          category: category,
          period: period,
          target: target,
          targetRegion: targetRegion,
          targetProvinceCodes: targetProvinceCodes,
          targetCenterCodes: targetCenterCodes,
          status: 'planned',
          progress: 0,
          courseIds: Array.from(selectedCourseIds)
        });

        alert('已创建培训计划：' + name);
	        navigateTo('training-plan');
	      });
	    }
	  }

	  function parseTrainingPlanPeriodToDateInputs(period) {
	    const raw = String(period || '').trim();
	    if (!raw) return { start: '', end: '' };

	    var startPart = raw;
	    var endPart = raw;
	    if (raw.indexOf('至') >= 0) {
	      const parts = raw.split('至').map(function (s) { return String(s || '').trim(); }).filter(Boolean);
	      startPart = parts[0] || '';
	      endPart = parts[1] || parts[0] || '';
	    }

	    function normalize(part, isEnd) {
	      const s = String(part || '').trim();
	      if (!s) return '';
	      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
	      if (/^\d{4}-\d{2}$/.test(s)) {
	        const bits = s.split('-');
	        const y = Number(bits[0]);
	        const m = Number(bits[1]);
	        if (Number.isNaN(y) || Number.isNaN(m)) return '';
	        if (!isEnd) return s + '-01';
	        const last = new Date(y, m, 0).getDate();
	        const dd = String(last).padStart(2, '0');
	        return bits[0] + '-' + bits[1] + '-' + dd;
	      }
	      return '';
	    }

	    const start = normalize(startPart, false);
	    const end = normalize(endPart, true) || start;
	    return { start: start, end: end };
	  }

		  function renderEditTrainingPlanPage() {
		    const id = getSelectedTrainingPlanId();
		    const plan = getTrainingPlanById(id);
		    if (!plan) {
	      return `
	        <div class="sub-page">
	          <div class="page-header">
	            <div>
	              <div class="page-title">编辑培训计划</div>
	              <div class="page-desc">未找到要编辑的计划，请从列表重新进入</div>
	            </div>
	            <div class="page-actions">
	              <button class="btn btn-outline" type="button" data-page="training-plan">
	                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
	                返回列表
	              </button>
	            </div>
	          </div>
	        </div>
	      `;
	    }

		    const dates = parseTrainingPlanPeriodToDateInputs(plan.period);
		    const target = plan.target != null ? String(plan.target) : '全网';
		    const progress = plan.progress != null ? Number(plan.progress) : 0;

		    return `
		      <div class="sub-page training-plan-edit">
	        <div class="page-header">
	          <div>
	            <div class="page-title">编辑培训计划</div>
	            <div class="page-desc">修改计划基础信息、课程配置与进度状态</div>
	          </div>
	          <div class="page-actions">
	            <button class="btn btn-outline" type="button" id="backToTrainingPlanFromEditBtn">
	              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
	              返回列表
	            </button>
	            <button class="btn btn-primary" type="button" id="submitTrainingPlanEditTopBtn">
	              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
	              保存修改
	            </button>
	          </div>
	        </div>

		        <div class="course-create-card">
		          <form id="editTrainingPlanPageForm" class="course-create-form" data-id="${escapeHtml(String(plan.id))}">
		            <div class="modal-hint">提示：目标对象可在此选择并调整；也可在“下发培训任务”时再进一步确认与细化。</div>

		            <div class="form-grid">
		              <div class="form-group full-width">
		                <label class="required">培训计划名称</label>
		                <input type="text" class="form-control" id="trainingPlanEditNameInput" name="name" maxlength="60" value="${escapeHtml(String(plan.name || ''))}" required>
		              </div>

	              <div class="form-group">
	                <label class="required">培训类别</label>
	                <select class="form-control" id="trainingPlanEditCategorySelect" name="category" required>
	                  <option value="">请选择类别</option>
	                  <option value="消防安全">消防安全</option>
	                  <option value="设备安全">设备安全</option>
	                  <option value="专项安全">专项安全</option>
	                  <option value="通用安全">通用安全</option>
	                  <option value="应急响应">应急响应</option>
	                  <option value="管理层培训">管理层培训</option>
	                  <option value="安全教育">安全教育</option>
	                </select>
	              </div>

	              <div class="form-group">
	                <label class="required">开始日期</label>
	                <input type="date" class="form-control" id="trainingPlanEditStartDateInput" name="startDate" value="${escapeHtml(dates.start)}" required>
	              </div>

	              <div class="form-group">
	                <label class="required">结束日期</label>
	                <input type="date" class="form-control" id="trainingPlanEditEndDateInput" name="endDate" value="${escapeHtml(dates.end)}" required>
	              </div>

		              <div class="form-group full-width">
		                <label>目标对象</label>
		                <div class="dispatch-scope-grid">
		                  <div class="form-group">
		                    <label>南/中/北部（可选筛选）</label>
		                    <select class="form-control" id="trainingPlanEditTargetRegionSelect">
		                      <option value="">全网</option>
		                      <option value="南部">南部</option>
		                      <option value="中部">中部</option>
		                      <option value="北部">北部</option>
		                    </select>
		                  </div>
		                  <div class="form-group">
		                    <label>省区（可多选）</label>
		                    <select class="form-control" id="trainingPlanEditTargetProvinceSelect" multiple size="8" disabled></select>
		                  </div>
		                  <div class="form-group">
		                    <label>中心（可多选）</label>
		                    <select class="form-control" id="trainingPlanEditTargetCenterSelect" multiple size="8" disabled></select>
		                  </div>
		                </div>
		                <div class="form-help">不选择则默认“全网”。如需精细下发，可先选择南北部，再选择省区/中心（均可多选）。</div>
		                <input type="hidden" id="trainingPlanEditTargetInput" name="target" value="${escapeHtml(target)}">
		              </div>

		              <div class="form-group">
		                <label>当前状态</label>
		                <select class="form-control" id="trainingPlanEditStatusSelect" name="status">
	                  <option value="planned">计划中</option>
	                  <option value="ongoing">进行中</option>
	                  <option value="completed">已完成</option>
	                  <option value="delayed">已延期</option>
	                </select>
	              </div>

	              <div class="form-group">
	                <label>执行进度（0-100）</label>
	                <input type="number" class="form-control" id="trainingPlanEditProgressInput" name="progress" min="0" max="100" step="1" value="${Number.isFinite(progress) ? progress : 0}">
	              </div>

	              <div class="form-group full-width">
	                <label>需要学习的课程（可多选）</label>
	                <div class="multi-select" id="trainingPlanEditCoursesMulti">
	                  <button type="button" class="form-control multi-select-trigger" id="trainingPlanEditCoursesTrigger" aria-haspopup="listbox" aria-expanded="false">
	                    <span class="multi-select-trigger-text" id="trainingPlanEditCoursesTriggerText">请选择课程（可多选）</span>
	                    <span class="multi-select-trigger-count" id="trainingPlanEditCoursesTriggerCount">0</span>
	                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
	                  </button>
	                  <div class="multi-select-panel" id="trainingPlanEditCoursesPanel" style="display:none;">
	                    <div class="multi-select-search">
	                      <input type="text" class="form-control" id="trainingPlanEditCoursesSearchInput" placeholder="搜索课程名称...">
	                    </div>
	                    <div class="multi-select-options" id="trainingPlanEditCoursesOptions" role="listbox" aria-multiselectable="true"></div>
	                    <div class="multi-select-footer">
	                      <button type="button" class="multi-select-clear" id="trainingPlanEditCoursesClearBtn">清空已选</button>
	                      <span class="multi-select-hint">课程来自“课程库”（包含你新建并保存的课程）</span>
	                    </div>
	                  </div>
	                  <input type="hidden" id="trainingPlanEditCourseIdsInput" name="courseIds" value="">
	                </div>
	              </div>
	            </div>

	            <div class="course-create-footer">
	              <button type="button" class="btn btn-outline" id="cancelTrainingPlanEditBtn">取消</button>
	              <button type="submit" class="btn btn-primary">保存修改</button>
	            </div>
	          </form>
	        </div>
	      </div>
	    `;
	  }

		  function initEditTrainingPlanPage() {
		    const form = document.getElementById('editTrainingPlanPageForm');
		    const backBtn = document.getElementById('backToTrainingPlanFromEditBtn');
		    const cancelBtn = document.getElementById('cancelTrainingPlanEditBtn');
	    const topSubmitBtn = document.getElementById('submitTrainingPlanEditTopBtn');
	    if (backBtn) backBtn.addEventListener('click', function () { navigateTo('training-plan'); });
	    if (cancelBtn) cancelBtn.addEventListener('click', function () { navigateTo('training-plan'); });
	    if (topSubmitBtn && form) topSubmitBtn.addEventListener('click', function () { form.requestSubmit(); });
	    if (!form) return;

	    const id = form.dataset.id;
	    const plan = getTrainingPlanById(id) || {};

	    const nameInput = document.getElementById('trainingPlanEditNameInput');
	    const categorySelect = document.getElementById('trainingPlanEditCategorySelect');
		    const startDateInput = document.getElementById('trainingPlanEditStartDateInput');
		    const endDateInput = document.getElementById('trainingPlanEditEndDateInput');
		    const targetInput = document.getElementById('trainingPlanEditTargetInput');
		    const statusSelect = document.getElementById('trainingPlanEditStatusSelect');
		    const progressInput = document.getElementById('trainingPlanEditProgressInput');

		    if (categorySelect) categorySelect.value = String(plan.category || '');
		    if (statusSelect) statusSelect.value = String(plan.status || 'planned');

		    // 目标对象：全网 / 南北部 + 省区/中心（多选）
		    const targetRegionSelect = document.getElementById('trainingPlanEditTargetRegionSelect');
		    const targetProvinceSelect = document.getElementById('trainingPlanEditTargetProvinceSelect');
		    const targetCenterSelect = document.getElementById('trainingPlanEditTargetCenterSelect');

		    function normalizeProvinceDisplayName(name) {
		      return String(name || '').replace(/(省公司|大区)$/g, '');
		    }

		    function getCenterDisplayName(center) {
		      const shortName = center && center.shortName ? String(center.shortName) : '';
		      if (shortName) return shortName + '中心';
		      const full = String((center && center.name) || '');
		      if (!full) return '';
		      if (full.indexOf('转运中心') >= 0) return full.replace('转运中心', '中心');
		      if (full.indexOf('中心') >= 0) return full;
		      return full + '中心';
		    }

		    function getSelectedValues(selectEl) {
		      if (!selectEl) return [];
		      return Array.from(selectEl.selectedOptions || []).map(function (opt) { return opt.value; }).filter(Boolean);
		    }

		    function getSelectedLabels(selectEl) {
		      if (!selectEl) return [];
		      return Array.from(selectEl.selectedOptions || []).map(function (opt) { return opt.textContent; }).filter(Boolean);
		    }

		    function setSelectOptions(selectEl, items, selectedValues) {
		      if (!selectEl) return;
		      const current = new Set(Array.isArray(selectedValues) ? selectedValues : getSelectedValues(selectEl));
		      selectEl.innerHTML = (items || []).map(function (item) {
		        const selected = current.has(item.value) ? ' selected' : '';
		        return '<option value="' + item.value + '"' + selected + '>' + escapeHtml(item.label) + '</option>';
		      }).join('');
		    }

		    function enableClickMultiSelect(selectEl) {
		      if (!selectEl || !selectEl.multiple) return;
		      selectEl.addEventListener('mousedown', function (e) {
		        const target = e && e.target;
		        if (!target || target.tagName !== 'OPTION') return;
		        e.preventDefault();
		        target.selected = !target.selected;
		        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
		      });
		    }

		    function parseTargetScopeFromText(text) {
		      const raw = String(text || '').trim();
		      if (!raw || raw === '全网') return { region: '', provinces: [], centers: [] };
		      const region = (raw.indexOf('南部') === 0) ? '南部' : ((raw.indexOf('中部') === 0) ? '中部' : ((raw.indexOf('北部') === 0) ? '北部' : ''));

		      let provincesText = '';
		      let centersText = '';
		      if (raw.indexOf('省区:') >= 0) {
		        provincesText = raw.split('省区:')[1] || '';
		        if (provincesText.indexOf('中心:') >= 0) provincesText = provincesText.split('中心:')[0] || '';
		      }
		      if (raw.indexOf('中心:') >= 0) {
		        centersText = raw.split('中心:')[1] || '';
		      }
		      const provinces = String(provincesText || '').split(/[、，,\\s]+/g).map(function (s) { return String(s || '').trim(); }).filter(Boolean);
		      const centers = String(centersText || '').split(/[、，,\\s]+/g).map(function (s) { return String(s || '').trim(); }).filter(Boolean);
		      return { region: region, provinces: provinces, centers: centers };
		    }

		    function mapProvinceLabelsToCodes(labels) {
		      const out = [];
		      (labels || []).forEach(function (label) {
		        const name = String(label || '').trim();
		        if (!name) return;
		        const province = (provincesData || []).find(function (p) {
		          return p && normalizeProvinceDisplayName(p.name) === name;
		        });
		        if (province && province.code) out.push(province.code);
		      });
		      return out;
		    }

		    function mapCenterLabelsToCodes(labels) {
		      const out = [];
		      (labels || []).forEach(function (label) {
		        const name = String(label || '').trim();
		        if (!name) return;
		        const center = (centersData || []).find(function (c) {
		          return c && (getCenterDisplayName(c) === name || String(c.name || '').trim() === name);
		        });
		        if (center && center.code) out.push(center.code);
		      });
		      return out;
		    }

		    function getInitialTargetScope() {
		      const region = plan && plan.targetRegion ? String(plan.targetRegion || '').trim() : '';
		      const provinceCodes = Array.isArray(plan && plan.targetProvinceCodes) ? plan.targetProvinceCodes.map(function (x) { return String(x); }).filter(Boolean) : [];
		      const centerCodes = Array.isArray(plan && plan.targetCenterCodes) ? plan.targetCenterCodes.map(function (x) { return String(x); }).filter(Boolean) : [];
		      if (region || provinceCodes.length || centerCodes.length) {
		        return { region: region, provinceCodes: provinceCodes, centerCodes: centerCodes };
		      }
		      const parsed = parseTargetScopeFromText(plan && plan.target);
		      return {
		        region: parsed.region,
		        provinceCodes: mapProvinceLabelsToCodes(parsed.provinces),
		        centerCodes: mapCenterLabelsToCodes(parsed.centers)
		      };
		    }

		    function syncTargetHiddenInput() {
		      if (!targetInput) return;
		      const region = targetRegionSelect ? String(targetRegionSelect.value || '').trim() : '';
		      if (!region) {
		        targetInput.value = '全网';
		        return;
		      }
		      const provLabels = getSelectedLabels(targetProvinceSelect);
		      const centerLabels = getSelectedLabels(targetCenterSelect);
		      let text = region;
		      if (provLabels.length) text += ' 省区:' + provLabels.join('、');
		      if (centerLabels.length) text += ' 中心:' + centerLabels.join('、');
		      targetInput.value = text || '全网';
		    }

		    function resetTargetScopeFilters() {
		      if (targetProvinceSelect) {
		        targetProvinceSelect.innerHTML = '';
		        targetProvinceSelect.disabled = true;
		      }
		      if (targetCenterSelect) {
		        targetCenterSelect.innerHTML = '';
		        targetCenterSelect.disabled = true;
		      }
		      syncTargetHiddenInput();
		    }

		    function updateTargetProvinceAndCenterOptions(nextProvinceCodes, nextCenterCodes) {
		      if (!targetRegionSelect || !targetProvinceSelect || !targetCenterSelect) return;
		      const region = String(targetRegionSelect.value || '').trim();
		      if (!region) {
		        resetTargetScopeFilters();
		        return;
		      }

		      const provinces = (provincesData || []).filter(function (p) { return p && p.northSouth === region; });
		      const provinceItems = provinces.map(function (p) {
		        return { value: p.code, label: normalizeProvinceDisplayName(p.name) };
		      });
		      provinceItems.sort(function (a, b) { return (a.label || '').localeCompare(b.label || ''); });

		      targetProvinceSelect.disabled = false;
		      setSelectOptions(targetProvinceSelect, provinceItems, nextProvinceCodes);

		      const selectedProvinceCodes = new Set(Array.isArray(nextProvinceCodes) ? nextProvinceCodes : getSelectedValues(targetProvinceSelect));
		      const allowedProvinceCodes = new Set(provinces.map(function (p) { return p.code; }));

		      const centerCandidates = (centersData || []).filter(function (c) { return c && allowedProvinceCodes.has(c.provinceCode); });
		      const centers = selectedProvinceCodes.size
		        ? centerCandidates.filter(function (c) { return selectedProvinceCodes.has(c.provinceCode); })
		        : centerCandidates;

		      const centerItems = centers.map(function (c) {
		        return { value: c.code, label: getCenterDisplayName(c) };
		      });
		      centerItems.sort(function (a, b) { return (a.label || '').localeCompare(b.label || ''); });

		      targetCenterSelect.disabled = !centerItems.length;
		      setSelectOptions(targetCenterSelect, centerItems, nextCenterCodes);
		      syncTargetHiddenInput();
		    }

		    if (targetRegionSelect || targetProvinceSelect || targetCenterSelect) {
		      fetchLocationsData().then(function () {
		        const init = getInitialTargetScope();
		        if (targetRegionSelect) targetRegionSelect.value = init.region || '';
		        updateTargetProvinceAndCenterOptions(init.provinceCodes, init.centerCodes);
		        syncTargetHiddenInput();
		      }).catch(function () {
		        resetTargetScopeFilters();
		      });
		    }

		    if (targetRegionSelect) {
		      targetRegionSelect.addEventListener('change', function () {
		        updateTargetProvinceAndCenterOptions([], []);
		      });
		    }
		    if (targetProvinceSelect) {
		      targetProvinceSelect.addEventListener('change', function () {
		        const provinceCodes = getSelectedValues(targetProvinceSelect);
		        const centerCodes = getSelectedValues(targetCenterSelect);
		        updateTargetProvinceAndCenterOptions(provinceCodes, centerCodes);
		      });
		      enableClickMultiSelect(targetProvinceSelect);
		    }
		    if (targetCenterSelect) {
		      targetCenterSelect.addEventListener('change', function () {
		        syncTargetHiddenInput();
		      });
		      enableClickMultiSelect(targetCenterSelect);
		    }

		    const trigger = document.getElementById('trainingPlanEditCoursesTrigger');
		    const triggerText = document.getElementById('trainingPlanEditCoursesTriggerText');
		    const triggerCount = document.getElementById('trainingPlanEditCoursesTriggerCount');
		    const panel = document.getElementById('trainingPlanEditCoursesPanel');
	    const searchInput = document.getElementById('trainingPlanEditCoursesSearchInput');
	    const optionsEl = document.getElementById('trainingPlanEditCoursesOptions');
	    const clearBtn = document.getElementById('trainingPlanEditCoursesClearBtn');
	    const hiddenCourseIdsInput = document.getElementById('trainingPlanEditCourseIdsInput');

	    function getCourseEntries() {
	      const courses = getMergedCourseLibraryCourses(getBaseCourseLibraryCourses());
	      const byId = new Map();
	      courses.forEach(function (c) {
	        if (!c || !c.title) return;
	        const cid = String(c.id);
	        if (!byId.has(cid)) byId.set(cid, { id: cid, title: c.title, category: c.category || '' });
	      });
	      const entries = Array.from(byId.values());
	      entries.sort(function (a, b) { return (a.title || '').localeCompare(b.title || ''); });
	      return entries;
	    }

	    const selectedCourseIds = new Set();
	    (plan.courseIds || []).forEach(function (cid) {
	      const s = String(cid);
	      if (s) selectedCourseIds.add(s);
	    });
	    let courseEntriesCache = [];

	    function syncHidden() {
	      if (hiddenCourseIdsInput) hiddenCourseIdsInput.value = Array.from(selectedCourseIds).join(',');
	    }

	    function updateTrigger() {
	      const selectedCount = selectedCourseIds.size;
	      if (triggerCount) triggerCount.textContent = String(selectedCount);
	      if (!triggerText) return;
	      if (!selectedCount) {
	        triggerText.textContent = '请选择课程（可多选）';
	        return;
	      }
	      const titles = [];
	      courseEntriesCache.forEach(function (item) {
	        if (selectedCourseIds.has(String(item.id))) titles.push(item.title);
	      });
	      const shown = titles.slice(0, 2);
	      triggerText.textContent = shown.join('、') + (selectedCount > 2 ? (' 等' + selectedCount + '门') : '');
	    }

	    function renderOptions() {
	      if (!optionsEl) return;
	      courseEntriesCache = getCourseEntries();
	      optionsEl.innerHTML = courseEntriesCache.map(function (item) {
	        const checked = selectedCourseIds.has(String(item.id)) ? ' checked' : '';
	        const safeTitle = String(item.title || '');
	        const safeCategory = String(item.category || '');
	        return `
	          <label class="multi-select-option" data-title="${safeTitle.toLowerCase()}">
	            <input type="checkbox" value="${item.id}"${checked}>
	            <span class="multi-select-option-title">${safeTitle}</span>
	            ${safeCategory ? `<span class="multi-select-option-meta">${safeCategory}</span>` : ''}
	          </label>
	        `;
	      }).join('');
	      updateTrigger();
	      syncHidden();
	    }

	    function openPanel() {
	      if (!panel || !trigger) return;
	      panel.style.display = 'block';
	      trigger.setAttribute('aria-expanded', 'true');
	      if (searchInput) searchInput.focus();
	    }

	    function closePanel() {
	      if (!panel || !trigger) return;
	      panel.style.display = 'none';
	      trigger.setAttribute('aria-expanded', 'false');
	      if (searchInput) searchInput.value = '';
	      if (optionsEl) {
	        Array.from(optionsEl.querySelectorAll('.multi-select-option')).forEach(function (node) {
	          node.style.display = '';
	        });
	      }
	    }

	    function togglePanel() {
	      if (!panel) return;
	      if (panel.style.display === 'none' || !panel.style.display) openPanel();
	      else closePanel();
	    }

	    if (trigger) {
	      trigger.addEventListener('click', function (e) {
	        e.preventDefault();
	        togglePanel();
	      });
	    }

	    if (optionsEl) {
	      optionsEl.addEventListener('change', function (e) {
	        const checkbox = e.target && e.target.closest ? e.target.closest('input[type="checkbox"]') : null;
	        if (!checkbox) return;
	        const val = String(checkbox.value || '');
	        if (!val) return;
	        if (checkbox.checked) selectedCourseIds.add(val);
	        else selectedCourseIds.delete(val);
	        updateTrigger();
	        syncHidden();
	      });
	    }

	    if (searchInput) {
	      searchInput.addEventListener('input', function () {
	        const term = String(searchInput.value || '').trim().toLowerCase();
	        const nodes = optionsEl ? Array.from(optionsEl.querySelectorAll('.multi-select-option')) : [];
	        nodes.forEach(function (node) {
	          const title = String(node.dataset.title || '');
	          node.style.display = (!term || title.indexOf(term) >= 0) ? '' : 'none';
	        });
	      });
	    }

	    if (clearBtn) {
	      clearBtn.addEventListener('click', function () {
	        selectedCourseIds.clear();
	        if (optionsEl) {
	          Array.from(optionsEl.querySelectorAll('input[type="checkbox"]')).forEach(function (cb) { cb.checked = false; });
	        }
	        updateTrigger();
	        syncHidden();
	      });
	    }

	    document.addEventListener('click', function (e) {
	      if (!panel || !trigger) return;
	      const target = e.target;
	      const inside = (target && target.closest) ? target.closest('#trainingPlanEditCoursesMulti') : null;
	      if (!inside && panel.style.display === 'block') closePanel();
	    });

		    document.addEventListener('keydown', function (e) {
		      if (e.key === 'Escape') {
		        closePanel();
		        // 目标对象无弹层，仅关闭课程选择面板
		      }
		    });

		    renderOptions();

		    function validateForm() {
		      const name = String((nameInput && nameInput.value) || '').trim();
		      const category = String((categorySelect && categorySelect.value) || '').trim();
		      const startDate = String((startDateInput && startDateInput.value) || '').trim();
	      const endDate = String((endDateInput && endDateInput.value) || '').trim();
	      const progress = Number((progressInput && progressInput.value) || 0);
	      if (!name) { alert('请填写培训计划名称。'); return false; }
	      if (!category) { alert('请选择培训类别。'); return false; }
	      if (!startDate || !endDate) { alert('请选择开始日期与结束日期。'); return false; }
	      if (startDate && endDate && startDate > endDate) { alert('开始日期不能晚于结束日期。'); return false; }
	      if (!Number.isFinite(progress) || progress < 0 || progress > 100) { alert('执行进度需为 0-100 的数字。'); return false; }
	      return true;
	    }

	    form.addEventListener('submit', function (e) {
	      e.preventDefault();
	      if (!validateForm()) return;
	      const name = String(nameInput.value || '').trim();
	      const category = String(categorySelect.value || '').trim();
	      const startDate = String(startDateInput.value || '').trim();
	      const endDate = String(endDateInput.value || '').trim();
	      const target = String((targetInput && targetInput.value) || '').trim() || '全网';
	      const targetRegion = targetRegionSelect ? String(targetRegionSelect.value || '').trim() : '';
	      const targetProvinceCodes = targetRegion ? getSelectedValues(targetProvinceSelect) : [];
	      const targetCenterCodes = targetRegion ? getSelectedValues(targetCenterSelect) : [];
	      const status = String((statusSelect && statusSelect.value) || 'planned');
	      const progress = Number((progressInput && progressInput.value) || 0);
	      const period = startDate + ' 至 ' + endDate;
	      upsertCustomTrainingPlan({
	        id: Number(id),
	        name: name,
	        category: category,
	        period: period,
	        target: target,
	        targetRegion: targetRegion,
	        targetProvinceCodes: targetProvinceCodes,
	        targetCenterCodes: targetCenterCodes,
	        status: status,
	        progress: Number.isFinite(progress) ? progress : 0,
	        courseIds: Array.from(selectedCourseIds)
	      });
	      alert('已保存修改：' + name);
	      navigateTo('training-plan-detail');
	    });

		    updateTrigger();
		    syncHidden();
		    syncTargetHiddenInput();
		  }

	  function renderTrainingPlanDetailPage() {
	    const id = getSelectedTrainingPlanId();
	    const plan = getTrainingPlanById(id);
	    if (!plan) {
	      return `
	        <div class="sub-page">
	          <div class="page-header">
	            <div>
	              <div class="page-title">培训计划详情</div>
	              <div class="page-desc">未找到该计划，请从列表重新进入</div>
	            </div>
	            <div class="page-actions">
	              <button class="btn btn-outline" type="button" data-page="training-plan">
	                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
	                返回列表
	              </button>
	            </div>
	          </div>
	        </div>
	      `;
	    }

	    const statusLabel = { planned: '计划中', ongoing: '进行中', completed: '已完成', delayed: '已延期' };
	    const courses = getMergedCourseLibraryCourses(getBaseCourseLibraryCourses());
	    const courseIdSet = new Set((plan.courseIds || []).map(function (x) { return Number(x); }).filter(function (x) { return !Number.isNaN(x); }));
	    const chosenCourses = courses.filter(function (c) { return courseIdSet.has(Number(c && c.id)); });
	    const courseListHtml = chosenCourses.length
	      ? chosenCourses.map(function (c) { return '<li>' + escapeHtml(c.title) + '<span class="plan-detail-sub"> · ' + escapeHtml(c.category) + '</span></li>'; }).join('')
	      : '<li class="plan-detail-empty">未配置课程（可在“编辑”中补充）</li>';

	    return `
	      <div class="sub-page training-plan-detail">
	        <div class="page-header">
	          <div>
	            <div class="page-title">培训计划详情</div>
	            <div class="page-desc">${escapeHtml(String(plan.name || ''))}</div>
	          </div>
	          <div class="page-actions">
	            <button class="btn btn-outline" type="button" id="backToTrainingPlanFromDetailBtn">
	              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
	              返回列表
	            </button>
	            <button class="btn btn-primary" type="button" id="editTrainingPlanFromDetailBtn">
	              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
	              编辑
	            </button>
	          </div>
	        </div>

	        <div class="plan-detail-grid">
	          <div class="plan-detail-card">
	            <div class="plan-detail-title">基础信息</div>
	            <div class="plan-detail-kv">
	              <div class="k">计划名称</div><div class="v">${escapeHtml(String(plan.name || ''))}</div>
	              <div class="k">培训类别</div><div class="v">${escapeHtml(String(plan.category || '-'))}</div>
	              <div class="k">计划周期</div><div class="v">${escapeHtml(String(plan.period || '-'))}</div>
	              <div class="k">目标对象</div><div class="v">${escapeHtml(String(plan.target || '全网'))}</div>
	            </div>
	          </div>

	          <div class="plan-detail-card">
	            <div class="plan-detail-title">执行状态</div>
	            <div class="plan-detail-metrics">
	              <div class="metric">
	                <div class="metric-label">当前状态</div>
	                <div class="metric-value"><span class="status-badge status-${escapeHtml(String(plan.status || 'planned'))}">${statusLabel[plan.status] || '计划中'}</span></div>
	              </div>
	              <div class="metric">
	                <div class="metric-label">执行进度</div>
	                <div class="metric-value">${Number(plan.progress) || 0}%</div>
	              </div>
	            </div>
	            <div class="plan-progress-mini" style="margin-top: 10px;">
	              <div class="plan-progress-fill" style="width: ${Number(plan.progress) || 0}%"></div>
	            </div>
	          </div>

	          <div class="plan-detail-card plan-detail-card-span2">
	            <div class="plan-detail-title">课程配置</div>
	            <ul class="plan-detail-course-list">${courseListHtml}</ul>
	          </div>
	        </div>
	      </div>
	    `;
	  }

	  function initTrainingPlanDetailPage() {
	    const backBtn = document.getElementById('backToTrainingPlanFromDetailBtn');
	    const editBtn = document.getElementById('editTrainingPlanFromDetailBtn');
	    if (backBtn) backBtn.addEventListener('click', function () { navigateTo('training-plan'); });
	    if (editBtn) editBtn.addEventListener('click', function () { navigateTo('training-plan-edit'); });
	  }

	  // ============ 在线考试 ============
	  function renderOnlineExam() {
	    const activeExams = [
      { id: 1, title: '2026年第一季度全员安全知识月度测评', category: '通用安全', duration: '30分钟', questions: 25, passing: 80, deadline: '2026-04-30' },
      { id: 2, title: '特种设备操作人员岗位安全技术考核', category: '设备安全', duration: '60分钟', questions: 50, passing: 85, deadline: '2026-04-20' },
      { id: 3, title: '转运中心消防疏散与应急响应知识测试', category: '应急响应', duration: '45分钟', questions: 40, passing: 90, deadline: '2026-05-15' }
    ];

    const history = [
      { id: 101, title: '春季百日安全劳动竞赛选拔赛', date: '2026-03-20', score: 96, result: 'pass' },
      { id: 102, title: '新员工入职安全培训结业考试', date: '2026-03-05', score: 88, result: 'pass' },
      { id: 103, title: '危化品包装操作规范日常测验', date: '2026-02-15', score: 72, result: 'fail' }
    ];

    let examCardsHtml = '';
    activeExams.forEach(exam => {
      examCardsHtml += `
        <div class="exam-card">
          <div class="exam-title">${exam.title}</div>
          <div class="exam-meta">
            <div class="exam-meta-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              时长: ${exam.duration}
            </div>
            <div class="exam-meta-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              题数: ${exam.questions}
            </div>
            <div class="exam-meta-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              及格: ${exam.passing}分
            </div>
            <div class="exam-meta-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              截止: ${exam.deadline}
            </div>
          </div>
          <div class="exam-footer">
            <span style="font-size: 12px; color: var(--text-tertiary);">剩余次数: 2/3</span>
            <button class="btn btn-primary btn-sm">立即参加</button>
          </div>
        </div>
      `;
    });

    let historyTableRows = '';
    history.forEach(item => {
      const resultLabel = item.result === 'pass' ? '及格' : '不合格';
      const resultClass = item.result === 'pass' ? 'score-pass' : 'score-fail';
      
      historyTableRows += `
        <tr>
          <td>${item.title}</td>
          <td>${item.date}</td>
          <td><span style="font-weight: 600; font-family: monospace;">${item.score}</span> / 100</td>
          <td><span class="score-badge ${resultClass}">${resultLabel}</span></td>
          <td><a href="#" style="color: var(--primary); font-size: 13px;">查看答卷</a></td>
        </tr>
      `;
    });

    return `
      <div class="sub-page">
        <div class="page-header">
          <div>
            <div class="page-title">在线考试</div>
            <div class="page-desc">全网安全知识测评系统，支持自主练习与定期考核</div>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              我的错题集
            </button>
          </div>
        </div>

        <div class="course-stats">
          <div class="course-stat-card">
            <div class="course-stat-label">待参加考试</div>
            <div class="course-stat-value">3 场</div>
          </div>
          <div class="course-stat-card">
            <div class="course-stat-label">已完成次数</div>
            <div class="course-stat-value">12 次</div>
          </div>
          <div class="course-stat-card">
            <div class="course-stat-label">平均分数</div>
            <div class="course-stat-value">92.5</div>
          </div>
          <div class="course-stat-card">
            <div class="course-stat-label">全网排名</div>
            <div class="course-stat-value">Top 5%</div>
          </div>
        </div>

        <div class="section-title">可用考试</div>
        <div class="exam-grid">
          ${examCardsHtml}
        </div>

        <div class="history-section">
          <div class="section-title">考试历史</div>
          <table class="exam-history-table">
            <thead>
              <tr>
                <th>考试名称</th>
                <th>参与时间</th>
                <th>考试得分</th>
                <th>考核结果</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${historyTableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function initOnlineExam() {
    // 逻辑初始化，例如平滑滚动或异步加载更多历史记录
    console.log('Online Exam initialized');
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


  // ============ 隐患上报专用页 (Premium) ============
  function renderHazardReportPage() {
    var fullTitle = (currentHazardSource.title || '隐患上报') + ' · 闭环共治';
    return `
      <div class="hazard-report-page">
        <div class="report-hero">
          <div class="report-back-btn" id="reportBackBtn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            返回列表
          </div>
          <h1 class="report-title">${fullTitle}</h1>
          <p class="report-subtitle">通过及时发现并上报安全隐患，您正在为构建更安全的作业环境贡献力量。</p>
        </div>

        <div class="report-container">
          <div class="report-form-card">
            <div class="form-section">
              <h2 class="form-section-title">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                基本信息
              </h2>
              <div class="report-grid">
                <div class="report-field">
                  <label class="required">隐患类别</label>
                  <select id="reportFormCategory" class="report-select">
                    <option value="">请选择类别</option>
                  </select>
                </div>
                <div class="report-field">
                  <label>发现时间</label>
                  <input type="datetime-local" id="reportFormTime" class="report-input">
                </div>
                <div class="report-field report-span-2" id="reportFormSecondWrap">
                  <label>二级隐患描述 <span id="reportSecondGuide" style="font-size: 11px; font-weight: 400; color: var(--text-tertiary); margin-left: 8px;">(根据类别自动加载内容)</span></label>
                  <div id="reportFormSecondList" class="report-second-list">
                    <div style="color: var(--text-tertiary); font-style: italic; font-size: 13px; padding: 20px 0;">请先选择隐患类别...</div>
                  </div>
                  <input type="hidden" id="reportFormSecond" value="">
                </div>
                <div class="report-field report-span-2">
                  <label class="required">具体问题描述</label>
                  <textarea id="reportFormDesc" class="report-textarea" rows="4" placeholder="请详细描述隐患的具体情况、具体位置及可能的风险..."></textarea>
                </div>
              </div>
            </div>

            <div class="form-section" style="margin-top: 32px;">
              <h2 class="form-section-title">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                所属位置
              </h2>
              <div class="report-grid">
                <div class="report-field">
                  <label>南北部</label>
                  <select id="reportFormNorthSouth" class="report-select">
                    <option value="">全部</option>
                    <option value="北部">北部</option>
                    <option value="南部">南部</option>
                    <option value="中部">中部</option>
                  </select>
                </div>
                <div class="report-field">
                  <label>所属省区</label>
                  <select id="reportFormProvince" class="report-select">
                    <option value="">请选择</option>
                  </select>
                </div>
                <div class="report-field report-span-2">
                  <label>所属中心</label>
                  <select id="reportFormCenter" class="report-select">
                    <option value="">请选择</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="report-sidebar-card">
            <div class="report-form-card" style="padding: 24px;">
              <h2 class="form-section-title">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                紧急程度
              </h2>
              <div class="report-level-selector" id="reportLevelSelector">
                <div class="level-item low active" data-level="一般">一般</div>
                <div class="level-item mid" data-level="重大">重大</div>
                <div class="level-item high" data-level="特大">特大</div>
              </div>
              <p style="font-size: 11px; color: var(--text-tertiary); margin-top: 12px;">注：特大隐患将同步发送短信提醒相关负责人。</p>
            </div>

            <div class="report-form-card" style="padding: 24px;">
              <h2 class="form-section-title">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                现场图片
              </h2>
              <div class="report-upload-zone" id="reportUploadZone">
                <svg viewBox="0 0 24 24" class="upload-icon" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <div style="font-size: 14px; font-weight: 500;">点击或拖拽上传照片</div>
                <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">支持 PNG, JPG (最大 10MB)</div>
                <input type="file" id="reportFileInput" style="display:none;" multiple accept="image/*">
              </div>
              <div id="reportPreviewArea" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;"></div>
            </div>

            <button class="btn btn-primary btn-xl" id="reportSubmitBtn" style="width: 100%; justify-content: center; box-shadow: 0 10px 15px -3px rgba(26, 92, 255, 0.4);">
              提交上报
            </button>
            <button class="btn btn-outline" id="reportCancelBtn" style="width: 100%; justify-content: center; margin-top: 12px;">
              取消返回
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function initHazardReportPage() {
    var categoryEl = document.getElementById('reportFormCategory');
    var timeEl = document.getElementById('reportFormTime');
    var nsEl = document.getElementById('reportFormNorthSouth');
    var provEl = document.getElementById('reportFormProvince');
    var centerEl = document.getElementById('reportFormCenter');
    var submitBtn = document.getElementById('reportSubmitBtn');
    var levelItems = document.querySelectorAll('.level-item');
    var uploadZone = document.getElementById('reportUploadZone');
    var fileInput = document.getElementById('reportFileInput');
    var previewArea = document.getElementById('reportPreviewArea');
    var backBtn = document.getElementById('reportBackBtn');
    var cancelBtn = document.getElementById('reportCancelBtn');
    
    if (backBtn) backBtn.onclick = returnToHazardList;
    if (cancelBtn) cancelBtn.onclick = returnToHazardList;

    // 初始化时间
    if (timeEl) {
      var now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      timeEl.value = now.toISOString().slice(0, 16);
    }

    // 初始化类别
    if (categoryEl && typeof HAZARD_CATEGORY_CONTENT === 'object') {
      Object.keys(HAZARD_CATEGORY_CONTENT).forEach(function(cat) {
        var opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categoryEl.appendChild(opt);
      });

      categoryEl.addEventListener('change', function() {
        fillReportSecondOptions(categoryEl.value);
      });
    }

    function fillReportSecondOptions(category) {
      var listContainer = document.getElementById('reportFormSecondList');
      var secondInput = document.getElementById('reportFormSecond');
      var guide = document.getElementById('reportSecondGuide');
      if (!listContainer || !secondInput) return;
      
      listContainer.innerHTML = '';
      secondInput.value = '';
      if (guide) guide.textContent = '(点击卡片选择对应内容)';
      
      if (!category || !HAZARD_CATEGORY_CONTENT[category]) {
        listContainer.innerHTML = '<div style="color: var(--text-tertiary); font-style: italic; font-size: 13px; padding: 20px 0;">请先选择隐患类别...</div>';
        return;
      }
      
      HAZARD_CATEGORY_CONTENT[category].forEach(function (text) {
        var item = document.createElement('div');
        item.className = 'report-second-item';
        item.textContent = text;
        item.onclick = function () {
          listContainer.querySelectorAll('.report-second-item').forEach(function (el) { el.classList.remove('active'); });
          item.classList.add('active');
          secondInput.value = text;
        };
        listContainer.appendChild(item);
      });
    }

    // 初始化联动
    if (nsEl && provEl && centerEl) {
      fillFilterProvinces(nsEl, provEl, centerEl);
      fillFilterCenters(provEl, centerEl, nsEl);

      nsEl.addEventListener('change', function() {
        fillFilterProvinces(nsEl, provEl, centerEl);
        fillFilterCenters(provEl, centerEl, nsEl);
      });
      provEl.addEventListener('change', function() {
        fillFilterCenters(provEl, centerEl, nsEl);
      });
    }

    // 紧急程度选择
    levelItems.forEach(function(item) {
      item.onclick = function() {
        levelItems.forEach(function(el) { el.classList.remove('active'); });
        item.classList.add('active');
      };
    });

    // 文件上传预览
    if (uploadZone && fileInput) {
      uploadZone.onclick = function() { fileInput.click(); };
      fileInput.onchange = function() {
        previewArea.innerHTML = '';
        Array.from(fileInput.files).forEach(function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = '64px';
            img.style.height = '64px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px';
            img.style.border = '1px solid var(--border)';
            previewArea.appendChild(img);
          };
          reader.readAsDataURL(file);
        });
      };
    }

    // 提交逻辑
    if (submitBtn) {
      submitBtn.onclick = function() {
        var cat = categoryEl.value;
        var second = document.getElementById('reportFormSecond').value;
        var desc = document.getElementById('reportFormDesc').value;
        var ns = nsEl.value;
        var prov = provEl.value;
        var center = centerEl.value;
        
        if (!cat || !desc) {
          alert('请完整填写关键信息（隐患类别与描述）');
          return;
        }

        // 整理提交数据
        var formData = new FormData();
        formData.append('category', cat);
        formData.append('content', second || '');
        formData.append('description', desc);
        formData.append('area', ns);
        formData.append('province', prov);
        formData.append('center', center);
        
        // 映射 source_type
        var subTab = currentHazardSource.subTab || 'report';
        var sourceType = 'manual';
        if (subTab === 'selfcheck') sourceType = 'self_check';
        else if (subTab === 'audit') sourceType = 'security_audit';
        else if (subTab === 'special') sourceType = 'special';
        formData.append('source_type', sourceType);

        // 如果有图片，添加第一张图片 (后端目前只支持 photo_before 单张)
        if (fileInput && fileInput.files.length > 0) {
          formData.append('photo_before', fileInput.files[0]);
        }
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> 正在提交...';
        
        apiPostForm('/api/hazards/report', formData).then(function(res) {
          alert('隐患上报成功！感谢参与安全治理。');
          // 重新加载数据以刷新列表
          if (typeof loadHazardsFromAPI === 'function') {
            loadHazardsFromAPI();
          }
          returnToHazardList();
        }).catch(function(err) {
          console.error('上报失败:', err);
          alert('提交过程中出现错误，请检查网络后重试。');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '提交上报';
        });
      };
    }
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

  function returnToHazardList() {
    if (typeof navigateTo === 'function') {
      navigateTo('dual-prevention');
    } else {
      renderPage('dual-prevention');
    }
    
    // 跳转到对应的子标签页
    var targetTab = currentHazardSource.subTab || 'report';
    
    // 延迟以确保 renderPage 和 init 逻辑执行完成
    setTimeout(function() {
        // 1. 先切换到大类的“隐患排查治理” (data-dp-tab="hazard")
        var dpTab = document.querySelector('.tab-item[data-dp-tab="hazard"]');
        if (dpTab) {
            dpTab.click();
            
            // 2. 再切换到对应的子分类 (data-hazard-sub)
            setTimeout(function() {
                var subTab = document.querySelector('.tab-item[data-hazard-sub="' + targetTab + '"]');
                if (subTab) subTab.click();
            }, 100);
        }
    }, 150);
  }

  // ============ 启动 ============
  init();
})();
