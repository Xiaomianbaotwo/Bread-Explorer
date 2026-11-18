/* =========================================================
   15-tools-hub.js
   面包百宝箱 - 工具注册中心与统一入口 (新网页跳转版)
   ========================================================= */

// 工具注册中心（以后加了新工具，直接在数组里加对象就行）
const TOOL_REGISTRY = [
  /* 【修改】20261117：面包气象台由内测转为正式功能，移除 requireBeta 标记，
     入口与卡片不再受 Beta 开关控制（开关本身保留给其它内测能力使用） */
  {
    id: 'weather-information-fetch',
    name: '面包气象台',
    nameKey: 'tools.weatherName',
    icon: '🌤️',
    desc: '和风天气 API 查询与调试',
    descKey: 'tools.weatherDesc',
    url: './additional_content/weather_information_fetch/index.html'
  },
  /* 【新增】花事书房：独立小站，正式功能，不依赖 Beta 开关
     【新增】20261119：加入门禁 —— VIP / SVIP 直接可进，普通用户需面包等级 Lv30 */
  {
    id: 'bread-article-appreciation',
    name: '花事书房',
    nameKey: 'tools.articleName',
    icon: '🌸',
    desc: '沉浸式花事阅读 · 古文专栏',
    descKey: 'tools.articleDesc',
    url: './bread-article-appreciation/index.html',
    minBreadLevel: 30
  }
];

/* ---------- 门禁判断：会员身份 或 面包等级 ---------- */
function toolMemberType() {
  try {
    if (typeof currentUser === 'undefined' || !currentUser) return 'none';
    const db = (typeof getUsersDB === 'function') ? getUsersDB() : null;
    const u = db && db[currentUser];
    if (!u) return 'none';
    if (typeof checkVipStatus === 'function') {
      const st = checkVipStatus(u);
      return (st && st.type) ? st.type : 'none';
    }
    return u.vipType || 'none';
  } catch (e) { return 'none'; }
}

function toolBreadLevel() {
  try {
    if (window.UserLevel && typeof window.UserLevel.getView === 'function') {
      const v = window.UserLevel.getView();
      if (v && Number(v.level) > 0) return Number(v.level);
    }
  } catch (e) { /* 忽略 */ }
  try {
    const u = (typeof getUsersDB === 'function') && currentUser ? getUsersDB()[currentUser] : null;
    return Math.max(1, Number(u && u.userLevel) || 1);
  } catch (e) { return 1; }
}

/* 返回 null 表示可进入；返回字符串表示不能进入的原因 */
function toolLockReason(tool) {
  if (!tool || !tool.minBreadLevel) return null;
  if (toolMemberType() !== 'none') return null;                 /* VIP / SVIP 直接放行 */
  if (toolBreadLevel() >= tool.minBreadLevel) return null;      /* 面包等级达标 */
  return _loadT('tools.needBreadLevel', '需要面包等级 Lv{{level}} 或 VIP / SVIP 才能进入')
    .replace('{{level}}', String(tool.minBreadLevel));
}

function initToolbox() {
  const btnToolbox = document.getElementById('btnToolbox');
  const toolboxOverlay = document.getElementById('toolboxOverlay');
  const btnClose = document.getElementById('btnToolboxClose');
  const grid = document.getElementById('toolboxGrid');

  if (!btnToolbox || !toolboxOverlay) return;

  /* 【新增】BETA 功能隔离：查询天气工具属于内测能力，统一读 js/16-feature-flags.js 的
     beta_weather_query_tool 开关；旧键 bb-show-beta 由开关内部兼容，行为不变。
     该内测工具不接入任何 VIP 任务（侧边栏简易天气是正式功能，另算）。 */
  /* 【修改】20261117：百宝箱整体转正式版。
     入口恒显示（不再看 Beta 开关），注册表里的工具一律视为正式功能。 */
  const syncToolboxVisibility = () => { btnToolbox.style.display = 'flex'; };
  syncToolboxVisibility();

  // 渲染工具卡片
  function renderTools() {
    grid.innerHTML = '';

    TOOL_REGISTRY.forEach(tool => {
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

      const locked = toolLockReason(tool);   /* null = 可进入；字符串 = 不能进入的原因 */

      card.innerHTML = `
        <div style="position:relative;font-size:36px;margin-bottom:12px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.1));">
          ${tool.icon}
          ${locked ? '<span style="position:absolute;right:-8px;top:-6px;font-size:14px;">🔒</span>' : ''}
        </div>
        <div style="font-size:15px;font-weight:800;color:var(--ink);margin-bottom:6px;">${tool.nameKey ? _loadT(tool.nameKey) : tool.name}</div>
        <div style="font-size:12px;color:var(--ink-soft);line-height:1.4;">${tool.descKey ? _loadT(tool.descKey) : tool.desc}</div>
        ${locked ? `<div style="margin-top:8px;font-size:11.5px;color:#c0392b;line-height:1.35;">${locked}</div>` : ''}
      `;

      card.onclick = () => {
        /* 【新增】20261119：带门禁的工具先判权限，未达标不关弹窗、直接提示 */
        const reason = toolLockReason(tool);
        if (reason) return showToast(reason, '🔒');
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

  /* 【修改】20261117：工具中心已无内测工具，Beta 开关不再影响本模块任何显隐。
     旧监听保留成空壳只会误导后来维护者，这里直接移除；
     #showBetaToggle 仍由 js/16-feature-flags.js 控制好友系统等其它内测能力。 */
}

document.addEventListener('DOMContentLoaded', initToolbox);