/**
 * 申盾智能安全平台 - 前端应用
 */

(function () {
  'use strict';

  // ============ 页面配置 ============
  const PAGE_CONFIG = {
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

  // ============ DOM 元素 ============
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarNav = document.getElementById('sidebarNav');
  const mainContent = document.getElementById('mainContent');
  const breadcrumb = document.getElementById('breadcrumb');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

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
      html += '<span class="breadcrumb-item' + (isLast ? ' active' : '') + '">' + item + '</span>';
    });
    breadcrumb.innerHTML = html;
  }

  // ============ 页面渲染 ============
  function renderPage(page) {
    mainContent.scrollTop = 0;
    switch (page) {
      case 'dashboard': mainContent.innerHTML = renderDashboard(); break;
      case 'dual-prevention': mainContent.innerHTML = renderDualPrevention(); break;
      case 'accident-emergency': mainContent.innerHTML = renderAccidentEmergency(); break;
      case 'personnel': mainContent.innerHTML = renderPersonnel(); break;
      case 'facility': mainContent.innerHTML = renderFacility(); break;
      case 'park': mainContent.innerHTML = renderPark(); break;
      case 'delivery-safety': mainContent.innerHTML = renderDeliverySafety(); break;
      case 'training': mainContent.innerHTML = renderTraining(); break;
      case 'data-center': mainContent.innerHTML = renderDataCenter(); break;
      case 'document': mainContent.innerHTML = renderDocument(); break;
      case 'system': mainContent.innerHTML = renderSystem(); break;
      default: mainContent.innerHTML = renderDashboard();
    }
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
          '<div class="page-actions">' +
            '<button class="btn btn-primary">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
              '新增隐患' +
            '</button>' +
            '<button class="btn btn-outline">导出报表</button>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav">' +
          '<div class="tab-item active">风险分级管控</div>' +
          '<div class="tab-item">隐患排查治理</div>' +
        '</div>' +

        '<div class="stats-row">' +
          buildStatCard('重大风险', '2', '较上月持平', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>', 'red') +
          buildStatCard('较大风险', '8', '较上月 -2', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>', 'orange') +
          buildStatCard('一般风险', '35', '较上月 +5', 'down',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>', 'blue') +
          buildStatCard('低风险', '126', '风险总量 171', 'up',
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', 'green') +
        '</div>' +

        '<div class="data-table-wrapper">' +
          '<div class="table-toolbar">' +
            '<div class="table-toolbar-left">' +
              '<div class="table-filter">' +
                '<span>风险等级：</span>' +
                '<select><option>全部</option><option>重大</option><option>较大</option><option>一般</option><option>低</option></select>' +
              '</div>' +
              '<div class="table-filter">' +
                '<span>状态：</span>' +
                '<select><option>全部</option><option>管控中</option><option>已整改</option><option>待复查</option></select>' +
              '</div>' +
            '</div>' +
            '<div class="table-search">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
              '<input type="text" placeholder="搜索风险点...">' +
            '</div>' +
          '</div>' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th>风险编号</th><th>风险点名称</th><th>所在区域</th><th>风险等级</th><th>管控措施</th><th>责任人</th><th>状态</th>' +
            '</tr></thead>' +
            '<tbody>' +
              '<tr><td>RF-2026-001</td><td>分拨中心消防通道堵塞</td><td>华东分拨中心</td><td><span class="status-badge danger">重大</span></td><td>每日巡查，限期整改</td><td>张伟</td><td><span class="status-badge warning">管控中</span></td></tr>' +
              '<tr><td>RF-2026-002</td><td>装卸平台防护栏缺失</td><td>华南转运中心</td><td><span class="status-badge danger">重大</span></td><td>临时围挡，采购安装</td><td>李明</td><td><span class="status-badge warning">管控中</span></td></tr>' +
              '<tr><td>RF-2026-003</td><td>配电房防潮措施不足</td><td>西南分拨中心</td><td><span class="status-badge warning">较大</span></td><td>加装除湿设备</td><td>王强</td><td><span class="status-badge success">已整改</span></td></tr>' +
              '<tr><td>RF-2026-004</td><td>叉车通行区域标线磨损</td><td>华北转运中心</td><td><span class="status-badge info">一般</span></td><td>重新划线</td><td>赵刚</td><td><span class="status-badge success">已整改</span></td></tr>' +
              '<tr><td>RF-2026-005</td><td>监控盲区（B区仓库东侧）</td><td>华东分拨中心</td><td><span class="status-badge info">一般</span></td><td>增设摄像头</td><td>陈亮</td><td><span class="status-badge warning">管控中</span></td></tr>' +
            '</tbody>' +
          '</table>' +
          '<div class="table-pagination">' +
            '<span>共 171 条记录</span>' +
            '<div class="pagination-btns">' +
              '<button class="pagination-btn">&lt;</button>' +
              '<button class="pagination-btn active">1</button>' +
              '<button class="pagination-btn">2</button>' +
              '<button class="pagination-btn">3</button>' +
              '<button class="pagination-btn">...</button>' +
              '<button class="pagination-btn">18</button>' +
              '<button class="pagination-btn">&gt;</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
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

        '<div class="tab-nav">' +
          '<div class="tab-item active">事故管理</div>' +
          '<div class="tab-item">应急预案</div>' +
          '<div class="tab-item">演练记录</div>' +
          '<div class="tab-item">预警中心</div>' +
        '</div>' +

        '<div class="feature-grid">' +
          buildFeatureCard('事故上报', '快速上报安全事故，支持拍照取证与定位', 'var(--danger-light)', 'var(--danger)', '本月上报 2 起') +
          buildFeatureCard('事故调查', '事故原因分析、责任认定与整改跟踪', 'var(--warning-light)', 'var(--warning)', '进行中 1 项') +
          buildFeatureCard('事故统计', '多维度事故数据统计与趋势分析', 'var(--info-light)', 'var(--info)', '累计 23 起') +
          buildFeatureCard('应急预案', '各类应急预案编制、审核与发布管理', 'var(--primary-light)', 'var(--primary)', '生效预案 15 个') +
          buildFeatureCard('应急演练', '演练计划制定、执行记录与效果评估', 'var(--success-light)', 'var(--success)', '本季度 3 次') +
          buildFeatureCard('天气预警', '气象灾害预警信息推送与应对措施', 'var(--warning-light)', 'var(--warning)', '当前预警 1 条') +
          buildFeatureCard('车辆预警', '车辆安全状态监控与异常预警', 'var(--info-light)', 'var(--info)', '异常车辆 0 辆') +
          buildFeatureCard('应急处置', '应急响应流程指导与资源调度协调', 'var(--danger-light)', 'var(--danger)', '本月处置 1 次') +
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
  function buildStatCard(label, value, change, direction, iconSvg, colorClass) {
    return '' +
      '<div class="stat-card">' +
        '<div class="stat-info">' +
          '<div class="stat-label">' + label + '</div>' +
          '<div class="stat-value">' + value + '</div>' +
          '<div class="stat-change ' + direction + '">' + change + '</div>' +
        '</div>' +
        '<div class="stat-icon ' + colorClass + '">' + iconSvg + '</div>' +
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

  function buildFeatureCard(title, desc, bgColor, iconColor, stat) {
    return '' +
      '<div class="feature-card">' +
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
