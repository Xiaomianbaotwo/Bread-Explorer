/* =========================================================
   modules/bread-level/js/04-bread-ui.js
   面包等级 · 界面（侧栏入口 / 面板 / 渲染 / 初始化）

   面板结构照抄 VIP 面板的组件类，保证观感一致；
   入口按钮直接继承 VIP 入口的样式，保证大小与间距相同。
   ========================================================= */
  /* ---------- 入口按钮（直接继承 VIP 按钮的样式，保证大小完全一致） ---------- */
  function injectEntry() {
    if (document.getElementById(ENTRY_ID)) return;

    const vip = document.getElementById('btnVipEntry');
    const suggest = document.getElementById('btnSuggestEntry');
    const ref = vip || suggest;
    if (!ref || !ref.parentElement) return;

    const btn = document.createElement('div');
    btn.id = ENTRY_ID;
    /* 【修改】20261118：样式直接抄 VIP 入口按钮的 className + style，
       这样高度、内边距、圆角、字号、边框与「好友 / 建议箱 / VIP等级」完全一致 */
    btn.className = ref.className;
    btn.style.cssText = ref.style.cssText;
    btn.textContent = T('bread.entry');
    btn.onclick = openPanel;

    const parent = ref.parentElement;
    parent.appendChild(btn);

    /* 位置校正：只要面包等级跑到 VIP 上面，就改成插到 VIP 前面（column-reverse 下即"下方"） */
    fixOrder(ref, btn);
  }

  /* 把面包等级按钮纠正到 VIP 入口的紧邻下方（兼容 column 与 column-reverse 两种排版） */
  function fixOrder(ref, btn) {
    try {
      if (!ref || !btn || !ref.parentElement) return;
      if (btn.parentElement !== ref.parentElement) ref.parentElement.appendChild(btn);
      const a = btn.getBoundingClientRect();
      const b = ref.getBoundingClientRect();
      if (a.top && b.top && a.top < b.top) ref.parentElement.insertBefore(btn, ref);
    } catch (e) { /* 忽略 */ }
  }

  /* ---------- 面板（结构照抄 VIP 面板） ---------- */
  function buildOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = `
      <div class="modal vip-panel">
        <div class="vip-panel-head">
          <div class="vip-panel-title">${T('bread.panelTitle')}</div>
          <button class="vip-panel-close" id="breadClose">✕</button>
        </div>
        <div class="vip-panel-body">

          <!-- 0. 头像 + 昵称 + 身份徽标（同 VIP 面板第一行） -->
          <div class="vip-user-row" id="breadUserRow"></div>

          <!-- 1. 等级 + 烘焙度进度（同 VIP 的 vip-level-box） -->
          <div class="vip-level-box">
            <div class="vip-level-head">
              <div class="vip-level-num" id="breadLevelNum"></div>
              <div class="vip-point-text" id="breadPointText"></div>
            </div>
            <div class="vip-bar-track"><div class="vip-bar-fill" id="breadBarFill"></div></div>
            <div class="vip-bar-scale">
              <span id="breadScaleLeft"></span>
              <span id="breadScaleRight"></span>
            </div>
            <div class="vip-level-tip" id="breadLevelTip"></div>
          </div>

          <!-- 2. 每日签到（同 VIP 的独立签到按钮） -->
          <button class="vip-checkin-btn" id="breadCheckinBtn"></button>

          <!-- 3. 积分 → 烘焙度 兑换（同 VIP 的积分兑星光面板） -->
          <div class="vip-exchange-box" id="breadExchangeBox"></div>

          <!-- 4. 任务区（同 VIP 的 vip-task-group） -->
          <div id="breadTaskArea"></div>

          <!-- 5. 权益说明（同 VIP 的 vip-rights-box） -->
          <div class="vip-rights-box">
            <div class="vip-rights-title">${T('bread.perksTitle')}</div>
            <ul class="vip-rights-list" id="breadPerks"></ul>
          </div>

        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('breadClose').onclick = () => closeOverlay(overlay);
    document.getElementById('breadCheckinBtn').onclick = checkin;
    overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(overlay); });
  }

  function closeOverlay(overlay) {
    overlay.classList.remove('show');
    setTimeout(() => { if (!overlay.classList.contains('show')) overlay.style.display = 'none'; }, 180);
  }

  function openPanel() {
    buildOverlay();
    const overlay = document.getElementById(OVERLAY_ID);
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
    renderAll();
  }

  function refreshPanel() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay || overlay.style.display === 'none') return;
    renderAll();
  }

  function renderAll() {
    const v = getView();
    if (!v) return;

    /* 等级数字 + 称号 */
    document.getElementById('breadLevelNum').innerHTML =
      `Lv.${v.level}<small>${v.title || T('bread.title0')}</small>`;

    /* 右侧烘焙度 */
    document.getElementById('breadPointText').textContent =
      v.isMax ? T('bread.maxPoint', { n: v.bake }) : T('bread.bakeProgress', { cur: v.bake, cap: v.cap });

    /* 进度条 */
    const barFill = document.getElementById('breadBarFill');
    const pct = v.isMax ? 100 : v.percent;
    barFill.style.width = pct + '%';
    /* 【新增】20261118：0% 不显示小圆点，避免看起来像「卡住的一条白缝」 */
    barFill.classList.toggle('empty', pct <= 0);

    document.getElementById('breadScaleLeft').textContent = 'Lv.' + v.level;
    document.getElementById('breadScaleRight').textContent = v.isMax ? 'Lv.' + MAX_LEVEL : 'Lv.' + (v.level + 1);

    document.getElementById('breadLevelTip').textContent =
      v.isMax ? T('bread.maxed') : T('bread.nextNeed', { n: v.need });

    /* 签到按钮 */
    const btn = document.getElementById('breadCheckinBtn');
    btn.disabled = v.checkedIn;
    btn.textContent = v.checkedIn
      ? T('bread.checkinDone', { n: v.checkinBake })
      : T('bread.checkinBtn', { n: v.checkinBake });

    renderUserRow();
    renderTasks(v);
    renderExchange(v);
    renderPerks(v);
  }

  /* 头像 + 昵称 + VIP/SVIP 徽标（与 VIP 面板完全同一套类） */
  function renderUserRow() {
    const row = document.getElementById('breadUserRow');
    if (!row) return;
    const r = rec();
    if (!r) { row.innerHTML = ''; return; }
    const u = r.u;
    const name = (typeof currentUser === 'string' && currentUser) ? currentUser : '';
    const type = (u.vipType === 'svip' || u.vipType === 'vip') ? u.vipType : 'none';

    row.innerHTML = '';
    if (u.avatar) {
      const img = document.createElement('img');
      img.className = 'vip-avatar';
      img.src = u.avatar;
      row.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'vip-avatar-ph';
      ph.textContent = (name[0] || '?').toUpperCase();
      row.appendChild(ph);
    }

    const meta = document.createElement('div');
    meta.className = 'vip-user-meta';
    const badge = type === 'svip' ? '<span class="vip-badge svip">SVIP</span>'
      : type === 'vip' ? '<span class="vip-badge vip">VIP</span>' : '';
    meta.innerHTML = `<div class="vip-user-name">${name}${badge}</div>`;
    row.appendChild(meta);
  }

  /* 积分兑烘焙度：复用 VIP 的 exchange-head / exchange-tip / exchange-grid / exchange-item */
  function renderExchange(v) {
    const box = document.getElementById('breadExchangeBox');
    if (!box) return;
    const r = rec();
    if (!r) { box.innerHTML = ''; return; }
    const u = r.u;
    const points = Number(u.points) || 0;

    box.innerHTML = `
      <div class="vip-exchange-head">
        <span>${T('bread.exchangeTitle')}</span>
        <span class="vip-exchange-quota">${T('bread.exchangePoints', { points: points })}</span>
      </div>
      <div class="vip-exchange-tip">${T('bread.exchangeTip')}</div>
      <div class="vip-exchange-grid">
        ${EXCHANGE_PKGS.map(p => `
          <button class="vip-exchange-item" data-pkg="${p.id}" ${points < p.cost ? 'disabled' : ''}
                  title="${p.cost} ${T('bread.pointsUnit')} → ${p.bake} ${T('bread.bakeUnit')}">
            <span class="ve-star">+${p.bake} 🍞</span>
            <span class="ve-cost">${p.cost} 🪙</span>
          </button>`).join('')}
      </div>
    `;

    box.querySelectorAll('[data-pkg]').forEach(btn => {
      btn.onclick = () => {
        const res = exchange(btn.getAttribute('data-pkg'));
        if (res && res.ok === false) {
          if (typeof showToast === 'function') {
            showToast(res.reason === 'no-points'
              ? T('bread.exchangeNoPoints', { need: res.need })
              : T('bread.exchangeFail'), '⚠️');
          }
          renderAll();
        }
      };
    });
  }

  /* 任务区：完全照 VIP 任务区的结构（vip-task-section / vip-task-item / vip-task-reward /
     vip-task-btn，含 can / claimed 两种状态），不再自造卡片和进度条 */
  function renderTasks(v) {
    const area = document.getElementById('breadTaskArea');
    if (!area) return;

    const groups = [
      { cycle: 'day',  titleKey: 'bread.taskDay',  resetKey: 'bread.resetDay' },
      { cycle: 'week', titleKey: 'bread.taskWeek', resetKey: 'bread.resetWeek' },
      /* 【新增】20261119：每月任务（每月 1 号刷新） */
      { cycle: 'month', titleKey: 'bread.taskMonth', resetKey: 'bread.resetMonth' }
    ];

    area.innerHTML = groups.map(g => {
      const items = v.tasks.filter(x => x.cycle === g.cycle);
      if (!items.length) return '';

      const rows = items.map(task => {
        const done = task.done >= task.need;
        const btn = task.claimed
          ? `<button class="vip-task-btn claimed" disabled>${T('bread.claimed')}</button>`
          : done
            ? `<button class="vip-task-btn can" data-claim="${task.id}">${T('bread.claim')}</button>`
            : `<button class="vip-task-btn" disabled>${T('bread.ongoing')}</button>`;
        return `
          <div class="vip-task-item${done ? ' done' : ''}">
            <div class="vip-task-main">
              <div class="vip-task-name">${taskName(task.id)}</div>
              <div class="vip-task-sub">${T('bread.taskReach', { n: task.need, bake: task.bake })}</div>
              <div class="vip-task-sub">${T('bread.progressFmt', { cur: task.done, need: task.need })}</div>
            </div>
            <div class="vip-task-reward">+${task.bake} ${T('bread.bakeUnit')}</div>
            ${btn}
          </div>`;
      }).join('');

      return `<div class="vip-task-section">
          <div class="vip-task-section-title">
            <span>${T(g.titleKey)}</span>
            <span class="vip-task-reset-hint">${T(g.resetKey)}</span>
          </div>
          ${rows}
        </div>`;
    }).join('');

    area.querySelectorAll('[data-claim]').forEach(b => {
      b.onclick = () => claim(b.getAttribute('data-claim'));
    });
  }

  /* 权益区：与 VIP「权益说明」同一套列表样式 */
  function renderPerks(v) {
    const ul = document.getElementById('breadPerks');
    if (!ul) return;

    const rows = [
      `<li><span>${T('bread.perkCapacity')}</span><strong>+${v.basketBonus}</strong></li>`,
      `<li><span>${T('bread.perkDaily')}</span><strong>+${v.dailyPoints}</strong></li>`,
      `<li><span>${T('bread.perkSpeed')}</span><strong>${speedFactor(v.level)} ms</strong></li>`,
      `<li><span>${T('bread.perkRoom')}</span><strong>${T('bread.roomLv30')}</strong></li>`,
      `<li><span>${T('bread.tokens', { n: v.tokens })}</span>${
        v.tokens > 0 ? `<button class="vip-task-btn vip-task-btn-ready" id="breadTokenBtn">${T('bread.pickTheme')}</button>`
                     : `<strong class="bread-mut">${T('bread.tokensHint')}</strong>`
      }</li>`
    ];
    ul.innerHTML = rows.join('');

    const tbtn = document.getElementById('breadTokenBtn');
    if (tbtn) tbtn.onclick = pickTokenTheme;
  }

  function pickTokenTheme() {
    const opts = tokenThemeOptions();
    if (!opts.length) {
      if (typeof showToast === 'function') showToast(T('bread.tokenEmpty'), '🎨');
      return;
    }

    const old = document.getElementById('breadTokenPick');
    if (old) old.remove();

    const wrap = document.createElement('div');
    wrap.id = 'breadTokenPick';
    wrap.className = 'bread-token-pick';
    wrap.innerHTML = `<div class="bread-token-tip">${T('bread.tokenPickTip')}</div>` +
      opts.map(o => `<div class="bread-token-item" data-key="${o.key}">
          <span>${o.name}</span><span class="bread-perk-mut">${o.cost} ${T('bread.pointsUnit')}</span>
        </div>`).join('');

    document.getElementById('breadPerks').parentNode.appendChild(wrap);
    wrap.querySelectorAll('.bread-token-item').forEach(item => {
      item.onclick = () => useToken(item.getAttribute('data-key'));
    });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    [300, 1200, 2500, 4000].forEach(ms => setTimeout(injectEntry, ms));

    /* 侧边栏是动态渲染的：VIP 入口可能后出现，位置也可能被别的模块改动，
       这里持续校正几秒，确保面包等级始终紧贴 VIP 下方 */
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      const vip = document.getElementById('btnVipEntry');
      const btn = document.getElementById(ENTRY_ID);
      if (vip && btn) fixOrder(vip, btn);
      if (!btn) injectEntry();
      if (n >= 12) clearInterval(timer);
    }, 500);

    setTimeout(grantDailyPoints, 2500);
    document.addEventListener('languageChanged', () => { try { refreshPanel(); } catch (e) {} });
  }


  /* ---------- 任务完成小红点【新增】20261119 ----------
     面包任务 / VIP 任务只要有一条「已完成但没领取」，就在对应侧栏入口
     右上角显示一个红点；全部领完自动消失。 */
  function ensureBadge(btn) {
    if (!btn) return null;
    let dot = document.getElementById(btn.id + '-dot');
    if (!dot) {
      dot = document.createElement('span');
      dot.id = btn.id + '-dot';
      dot.className = 'bb-badge';
      if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
      btn.appendChild(dot);
    }
    return dot;
  }

  function setBadge(btn, on) {
    if (!btn) return;
    const dot = ensureBadge(btn);
    if (dot) dot.style.display = on ? 'block' : 'none';
  }

  function breadHasClaimable(v) {
    if (!v || !Array.isArray(v.tasks)) return false;
    return v.tasks.some(t => t.done >= t.need && !t.claimed);
  }

  function vipHasClaimable(u) {
    try {
      if (!window.VipTasks || typeof window.VipTasks.getView !== 'function') return false;
      const vv = window.VipTasks.getView(u);
      if (!vv || !Array.isArray(vv.groups)) return false;
      return vv.groups.some(g => Array.isArray(g.items) && g.items.some(i => i.done && !i.claimed));
    } catch (e) { return false; }
  }

  function refreshBadges() {
    try {
      const r = rec();
      if (!r) return;
      const u = r.u;
      /* 顺带补一次解锁检查：老号已经到 Lv40/60 但还没解锁主题的，进页面就补发 */
      if (window.BreadMail && typeof window.BreadMail.checkAndSave === 'function') {
        window.BreadMail.checkAndSave(u);
      }
      setBadge(document.getElementById(ENTRY_ID), breadHasClaimable(getView(u)));
      setBadge(document.getElementById('btnVipEntry'), vipHasClaimable(u));
    } catch (e) { /* 忽略 */ }
  }

  window.refreshTaskBadges = refreshBadges;

  window.UserLevel = {
    MAX_LEVEL, TASKS: DEFAULT_TASKS,
    needOf, capOf, basketBonus, dailyPointBonus, titleOf,
    getView, track, claim, checkin, checkedInToday,
    addBake: (n) => { const r = rec(); if (!r) return; return doAdd(r.u, n, 'dev').then((res) => { if (res && res.ok) { save(r.u); refreshPanel(); } return res; }); },
    openPanel, speedFactor,
    refreshTasks() { try { refreshPanel(); } catch (e) {} },
    tasks: tasksNow,
    get level() { const r = rec(); return r ? (Number(r.userLevel) || 1) : 1; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  /* 【新增】20261119：小红点轮询（1500ms 一次，开销可忽略） */
  setTimeout(refreshBadges, 800);
  setInterval(() => { try { refreshBadges(); } catch (e) {} }, 1500);
