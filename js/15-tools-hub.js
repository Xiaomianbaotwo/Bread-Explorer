/* =========================================================
   15-tools-hub.js
   面包百宝箱 - 工具注册中心与统一入口 (新网页跳转版)
   ========================================================= */

// 工具注册中心（以后加了新工具，直接在数组里加对象就行）
const TOOL_REGISTRY = [
  {
    id: 'weather-information-fetch',
    name: '面包气象台',
    nameKey: 'tools.weatherName',
    icon: '🌤️',
    desc: '和风天气 API 查询与调试',
    descKey: 'tools.weatherDesc',
    url: './additional_content/weather_information_fetch/index.html',
    requireBeta: true 
  },
  /* 【新增】花事书房：独立小站，正式功能，不依赖 Beta 开关 */
  {
    id: 'bread-article-appreciation',
    name: '花事书房',
    nameKey: 'tools.articleName',
    icon: '🌸',
    desc: '沉浸式花事阅读 · 古文专栏',
    descKey: 'tools.articleDesc',
    url: './bread-article-appreciation/index.html'
  }
];

function initToolbox() {
  const btnToolbox = document.getElementById('btnToolbox');
  const toolboxOverlay = document.getElementById('toolboxOverlay');
  const btnClose = document.getElementById('btnToolboxClose');
  const grid = document.getElementById('toolboxGrid');

  if (!btnToolbox || !toolboxOverlay) return;

  /* 【新增】BETA 功能隔离：查询天气工具属于内测能力，统一读 js/16-feature-flags.js 的
     beta_weather_query_tool 开关；旧键 bb-show-beta 由开关内部兼容，行为不变。
     该内测工具不接入任何 VIP 任务（侧边栏简易天气是正式功能，另算）。 */
  const betaOn = () => (window.BB_FEATURES && typeof window.BB_FEATURES.getFlag === 'function')
    ? window.BB_FEATURES.getFlag('beta_weather_query_tool')
    : (localStorage.getItem('bb-show-beta') === 'true');

  /* 【修改】入口可见性：Beta 开关打开，或注册表里存在非 Beta 工具，两者满足其一就显示。
     花事书房是正式工具，不能被 Beta 开关挡住；只有「纯 Beta 工具」时才需要靠开关露出入口。 */
  const hasNonBetaTool = () => TOOL_REGISTRY.some(tool => !tool.requireBeta);
  const syncToolboxVisibility = () => {
    btnToolbox.style.display = (betaOn() || hasNonBetaTool()) ? 'flex' : 'none';
  };
  syncToolboxVisibility();

  // 渲染工具卡片
  function renderTools() {
    grid.innerHTML = '';
    const showBeta = betaOn();

    TOOL_REGISTRY.forEach(tool => {
      // 如果工具要求测试模式，但用户没开，就不显示
      if (tool.requireBeta && !showBeta) return;

      const card = document.createElement('div');
      card.style.cssText = "background: var(--card); border: 1px solid var(--card-border); border-radius: 16px; padding: 20px 16px; cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);";
      
      card.onmouseover = () => { 
        card.style.transform = 'translateY(-4px) scale(1.02)'; 
        card.style.borderColor = 'var(--accent)'; 
        card.style.boxShadow = 'var(--shadow)'; 
      };
      card.onmouseout = () => { 
        card.style.transform = 'none'; 
        card.style.borderColor = 'var(--card-border)'; 
        card.style.boxShadow = 'none'; 
      };

      card.innerHTML = `
        <div style="font-size: 36px; margin-bottom: 12px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));">${tool.icon}</div>
        <div style="font-size: 15px; font-weight: 800; color: var(--ink); margin-bottom: 6px;">${tool.nameKey ? _loadT(tool.nameKey) : tool.name}</div>
        <div style="font-size: 12px; color: var(--ink-soft); line-height: 1.4;">${tool.descKey ? _loadT(tool.descKey) : tool.desc}</div>
      `;

      card.onclick = () => {
        // 关闭弹窗，并在新标签页打开工具
        toolboxOverlay.classList.remove('show');
        document.body.classList.remove('modal-open');
        window.open(tool.url, '_blank');
      };
      grid.appendChild(card);
    });
  }

  // 点击右上角入口
  btnToolbox.onclick = () => {
    if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
    renderTools();
    toolboxOverlay.classList.add('show');
    document.body.classList.add('modal-open');
  };

  // 关闭弹窗
  btnClose.onclick = () => {
    toolboxOverlay.classList.remove('show');
    document.body.classList.remove('modal-open');
  };

  // 监听测试功能开关的切换
  const betaToggle = document.getElementById('showBetaToggle');
  if (betaToggle) {
    betaToggle.addEventListener('change', () => {
      /* 【修改】Beta 开关只影响 Beta 工具卡片，不再直接决定入口按钮的显隐；
         统一走 syncToolboxVisibility，避免覆盖「存在非 Beta 工具」这条判断。 */
      syncToolboxVisibility();
    });
  }
}

document.addEventListener('DOMContentLoaded', initToolbox);