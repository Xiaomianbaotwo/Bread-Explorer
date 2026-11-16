/* =========================================================
   modules/vip-level/js/03-vip-ui.js
   VIP 等级面板 UI：侧边入口 / 面板渲染 / 签到与任务交互
   【新增】整份文件为本轮新增

   面板从上到下固定顺序（与需求一致）：
   头像 → 到期时间+续费 → 等级/星光值进度条 → 独立签到按钮 → 每日/每周/每月任务 → 权益说明/奖励记录
   ========================================================= */

(() => {
  const ENTRY_ID = 'btnVipEntry';
  const OVERLAY_ID = 'vipOverlay';

  function T(key, opts) {
    if (typeof window._loadT === 'function') {
      const v = window._loadT(key, opts);
      if (v && v !== key) return v;
    }
    return key;
  }

  function fmt(key, opts) { return T(key, opts); }

  /* ---------- 侧边入口：放在「建议箱」按钮正下方 ---------- */
  function injectEntry() {
    const suggest = document.getElementById('btnSuggestEntry');
    const existing = document.getElementById(ENTRY_ID);

    /* 情况一：入口已经存在 —— 只在「建议箱后来才渲染出来」时把它挪到建议箱正下方，
       保证最终视觉顺序永远是 好友 → 建议箱 → VIP等级 */
    if (existing) {
      if (suggest && suggest.parentElement && existing.parentElement !== suggest.parentElement) {
        suggest.parentElement.appendChild(existing);
        const oldWrap = document.getElementById('vipEntryWrap');
        if (oldWrap && !oldWrap.children.length) oldWrap.remove();
      }
      return;
    }

    const btn = document.createElement('div');
    btn.id = ENTRY_ID;
    btn.style = "display: inline-flex; align-items: center; justify-content: center; height: 32px; padding: 0 12px; border-radius: 10px; background: var(--card); border: 1px solid var(--card-border); color: var(--ink); font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; box-sizing: border-box;";
    btn.textContent = T('vip.entry');
    btn.onclick = openPanel;

    if (suggest && suggest.parentElement) {
      /* 建议箱存在时，直接挂在它的同一个竖排容器末尾（视觉上即"正下方"） */
      suggest.parentElement.appendChild(btn);
      return;
    }

    /* 兜底：建议箱还没渲染出来（例如好友模块尚未初始化 / 测试开关关掉）时，
       自己在 logo 下方建一个竖排容器，等建议箱出现后再由上面的逻辑自动归位 */
    const logo = document.querySelector('.logo');
    if (!logo) return;
    const wrap = document.createElement('div');
    wrap.id = 'vipEntryWrap';
    wrap.style = "display: flex; flex-direction: column; align-items: flex-start; gap: 8px; margin-top: 8px;";
    wrap.appendChild(btn);
    const textBox = logo.querySelector('div');
    if (textBox) textBox.appendChild(wrap); else logo.appendChild(wrap);
  }

  /* ---------- 面板骨架 ---------- */
  function buildOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = `
      <div class="modal vip-panel">
        <div class="vip-panel-head">
          <div class="vip-panel-title" id="vipPanelTitle">${T('vip.title')}</div>
          <button class="vip-panel-close" id="vipPanelClose">✕</button>
        </div>
        <div class="vip-panel-body">
          <!-- 1. 头像 + 昵称 -->
          <div class="vip-user-row" id="vipUserRow"></div>

          <!-- 2. 会员到期时间 + 续费 -->
          <div class="vip-expire-row">
            <div class="vip-expire-text" id="vipExpireText"></div>
            <button class="vip-renew-btn" id="vipRenewBtn">${T('vip.renew')}</button>
          </div>

          <!-- 3. 等级 + 星光值进度条 -->
          <div class="vip-level-box">
            <div class="vip-level-head">
              <div class="vip-level-num" id="vipLevelNum"></div>
              <div class="vip-point-text" id="vipPointText"></div>
            </div>
            <div class="vip-bar-track">
              <div class="vip-bar-fill" id="vipBarFill"></div>
            </div>
            <div class="vip-bar-scale">
              <span id="vipScaleLeft"></span>
              <span id="vipScaleRight"></span>
            </div>
            <div class="vip-level-tip" id="vipLevelTip"></div>
          </div>

          <!-- 4. 独立签到按钮 -->
          <button class="vip-checkin-btn" id="vipCheckinBtn"></button>

          <!-- 5. 每日 / 每周 / 每月任务 -->
          <div id="vipTaskArea"></div>

          <!-- 6. 权益说明 / 奖励记录 -->
          <div class="vip-rights-box">
            <div class="vip-rights-title" id="vipRightsTitle">${T('vip.rightsTitle')}</div>
            <ul class="vip-rights-list" id="vipRightsList"></ul>
          </div>
          <div class="vip-log-box">
            <div class="vip-rights-title" id="vipLogTitle">${T('vip.logTitle')}</div>
            <div id="vipLogList"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('vipPanelClose').onclick = () => closeOverlay(overlay);

    document.getElementById('vipRenewBtn').onclick = () => {
      /* 续费直接跳到积分中心的会员档位，沿用既有购买流程 */
      closeOverlay(overlay);
      if (typeof openPointsShop === 'function') openPointsShop();
    };

    document.getElementById('vipCheckinBtn').onclick = () => {
      const res = (typeof window.VipTasks !== 'undefined') ? window.VipTasks.checkin() : { ok: false, reason: 'no-task' };
      if (res.ok) showToast(fmt('vip.checkinSuccess', { n: res.reward }), '⭐');
      else if (res.reason === 'already') showToast(T('vip.checkinDoneToast'), '📅');
      else if (res.reason === 'not-member') showToast(T('vip.notMemberTip'), '🔒');
      else showToast(T('vip.actionFailed'), '❌');
      render();
    };
  }

  /* ---------- 渲染 ---------- */
  function render() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    const db = getUsersDB();
    const u = db[currentUser];
    if (!u) return;

    if (!window.VIPCore) return;
    window.VIPCore.ensureState(u);
    /* 打开面板时结算一次身份切换（例如刚开通 SVIP，或会员到期变回 none） */
    window.VIPCore.syncIdentity(u);

    const status = checkVipStatus(u);
    const type = status.type;                       // none / vip / svip
    const snap = window.VIPCore.snapshot(u);

    /* 1. 头像 + 昵称 + 身份徽标 */
    const row = document.getElementById('vipUserRow');
    row.innerHTML = '';
    if (u.avatar) {
      const img = document.createElement('img');
      img.className = 'vip-avatar'; img.src = u.avatar; row.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'vip-avatar-ph';
      ph.textContent = (currentUser[0] || '?').toUpperCase();
      row.appendChild(ph);
    }
    const meta = document.createElement('div');
    meta.className = 'vip-user-meta';
    const badgeHtml = (type === 'svip') ? `<span class="vip-badge svip">SVIP</span>`
      : (type === 'vip') ? `<span class="vip-badge vip">VIP</span>` : '';
    meta.innerHTML = `<div class="vip-user-name">${currentUser}${badgeHtml}</div>`;
    row.appendChild(meta);

    /* 2. 到期时间 */
    const expireEl = document.getElementById('vipExpireText');
    if (type === 'none') {
      expireEl.textContent = T('vip.expireNone');
    } else if (u.vipExpire === 0) {
      expireEl.textContent = T('vip.permanent');
    } else {
      expireEl.textContent = T('vip.expireAt', { date: new Date(u.vipExpire).toLocaleDateString() });
    }

    /* 3. 等级 / 星光值进度条 */
    document.getElementById('vipLevelNum').innerHTML =
      `Lv.${snap.level}<small>${type === 'svip' ? 'SVIP' : 'VIP'}</small>`;

    let pointText, tipText;
    if (type === 'none') {
      pointText = T('vip.pointNone');
      tipText = T('vip.tipNone');
    } else if (snap.isMax) {
      pointText = T('vip.maxPoint', { point: snap.point });
      tipText = T('vip.tipMax');
    } else {
      pointText = T('vip.pointOf', { point: snap.point, cap: snap.cap });
      tipText = T('vip.tipToNext', { n: snap.toNext, next: snap.level + 1 });
    }
    document.getElementById('vipPointText').textContent = pointText;
    document.getElementById('vipLevelTip').textContent = tipText;

    const fill = document.getElementById('vipBarFill');
    const pct = snap.isMax ? 100 : Math.min(100, Math.round((snap.point / snap.cap) * 100));
    fill.style.width = pct + '%';
    fill.className = 'vip-bar-fill' + (type === 'svip' ? ' svip' : '');
    document.getElementById('vipScaleLeft').textContent = 'Lv.' + snap.level;
    document.getElementById('vipScaleRight').textContent = snap.isMax ? 'Lv.100' : 'Lv.' + (snap.level + 1);

    /* 4. 签到按钮 */
    const checkinBtn = document.getElementById('vipCheckinBtn');
    const checkedIn = window.VipTasks ? window.VipTasks.checkedInToday(u) : false;
    checkinBtn.disabled = checkedIn || type === 'none';
    checkinBtn.textContent = checkedIn
      ? T('vip.checkinDone', { n: window.VipTasks ? window.VipTasks.CHECKIN_REWARD : 0 })
      : T('vip.checkinBtn', { n: window.VipTasks ? window.VipTasks.CHECKIN_REWARD : 0 });

    /* 5. 任务区 */
    renderTasks(u);

    /* 6. 权益说明 + 奖励记录 */
    renderRights(u, snap, type);
    renderLog(u);
  }

  function renderTasks(u) {
    const area = document.getElementById('vipTaskArea');
    if (!area) return;
    area.innerHTML = '';
    if (!window.VipTasks) return;

    const view = window.VipTasks.getView(u);
    const cycleMeta = [
      { cycle: 'daily',   titleKey: 'vip.dailyTitle',   resetKey: 'vip.resetDaily' },
      { cycle: 'weekly',  titleKey: 'vip.weeklyTitle',  resetKey: 'vip.resetWeekly' },
      { cycle: 'monthly', titleKey: 'vip.monthlyTitle', resetKey: 'vip.resetMonthly' }
    ];

    cycleMeta.forEach(meta => {
      const group = view.groups.find(g => g.cycle === meta.cycle);
      if (!group) return;

      const sec = document.createElement('div');
      sec.className = 'vip-task-section';

      const head = document.createElement('div');
      head.className = 'vip-task-section-title';
      head.innerHTML = `<span>${T(meta.titleKey)}</span><span class="vip-task-reset-hint">${T(meta.resetKey)}</span>`;
      sec.appendChild(head);

      group.items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'vip-task-item' + (item.done ? ' done' : '');

        const main = document.createElement('div');
        main.className = 'vip-task-main';
        const name = T(`vip.tasks.${item.id}.name`);
        const desc = T(`vip.tasks.${item.id}.desc`);
        main.innerHTML = `
          <div class="vip-task-name">${name}</div>
          <div class="vip-task-sub">${desc}</div>
          <div class="vip-task-sub">${T('vip.progressFmt', { cur: item.progress, need: item.need })}</div>
        `;
        row.appendChild(main);

        const reward = document.createElement('div');
        reward.className = 'vip-task-reward';
        reward.textContent = '+' + item.reward;
        row.appendChild(reward);

        const btn = document.createElement('button');
        btn.className = 'vip-task-btn';
        if (item.claimed) {
          btn.classList.add('claimed');
          btn.textContent = T('vip.claimedTxt');
          btn.disabled = true;
        } else if (item.done) {
          btn.classList.add('can');
          btn.textContent = T('vip.claim');
          btn.onclick = () => {
            const res = window.VipTasks.claimTask(item.id);
            if (res.ok) showToast(fmt('vip.claimSuccess', { n: res.reward }), '⭐');
            else if (res.reason === 'not-member') showToast(T('vip.notMemberTip'), '🔒');
            else if (res.reason === 'claimed') showToast(T('vip.claimedToast'), '✅');
            else showToast(T('vip.actionFailed'), '❌');
            render();
          };
        } else {
          btn.textContent = T('vip.ongoing');
          btn.disabled = true;
        }
        row.appendChild(btn);

        sec.appendChild(row);
      });

      area.appendChild(sec);
    });
  }

  function renderRights(u, snap, type) {
    const listEl = document.getElementById('vipRightsList');
    if (!listEl || !window.VipReward) return;
    listEl.innerHTML = '';

    const rows = window.VipReward.rightsView(snap.level, type === 'none' ? 'vip' : type);
    rows.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r.text;
      if (r.active) li.className = 'now';
      listEl.appendChild(li);
    });

    /* 等级档位额外每日积分：取最高档，只展示一个数字 */
    const bonus = (type === 'none') ? 0 : window.VipReward.dailyBonusOf(snap.level, type);
    const bonusLine = document.createElement('li');
    bonusLine.textContent = bonus > 0
      ? T('vip.dailyBonusNow', { n: bonus })
      : T('vip.dailyBonusNone');
    if (bonus > 0) bonusLine.className = 'now';
    listEl.appendChild(bonusLine);
  }

  function renderLog(u) {
    const el = document.getElementById('vipLogList');
    if (!el || !window.VipReward) return;
    const rows = window.VipReward.logView(u, 10);
    el.innerHTML = '';
    if (!rows.length) {
      el.innerHTML = `<div class="vip-log-empty">${T('vip.logEmpty')}</div>`;
      return;
    }
    rows.forEach(r => {
      const item = document.createElement('div');
      item.className = 'vip-log-item';
      item.innerHTML = `<span>${r.text}</span><span class="vip-log-date">${new Date(r.date).toLocaleDateString()}</span>`;
      el.appendChild(item);
    });
  }

  /* ---------- 打开面板 ---------- */
  function openPanel() {
    if (typeof currentUser === 'undefined' || !currentUser) {
      return showToast(T('common.loginRequired'), '🔒');
    }
    const db = getUsersDB();
    const u = db[currentUser];
    if (!u) return showToast(T('common.loginRequired'), '🔒');

    const status = checkVipStatus(u);
    if (status.type === 'none') {
      /* 非会员点击：只提示，不打开面板 */
      return showToast(T('vip.notMemberTip'), '🔒');
    }

    buildOverlay();
    render();
    openOverlay(document.getElementById(OVERLAY_ID));
  }

  function refreshIfOpen() {
    const ov = document.getElementById(OVERLAY_ID);
    if (ov && ov.classList.contains('show')) render();
  }

  /* ---------- 初始化 ---------- */
  function init() {
    injectEntry();
    buildOverlay();
    /* 词表可能在加载页之后才就绪，入口文案这里再刷一次 */
    const btn = document.getElementById(ENTRY_ID);
    if (btn) btn.textContent = T('vip.entry');

    /* 【新增】好友模块的「建议箱」在本脚本之后才初始化（脚本顺序决定 DOMContentLoaded 回调顺序），
       所以这里补两次延迟归位：只要建议箱一出现，VIP 入口就自动挪到它正下方。 */
    setTimeout(injectEntry, 300);
    setTimeout(injectEntry, 1200);

    /* 【新增】会员基础每日积分自动到账（VIP +50 / SVIP +100，每天一次）
       等用户数据初始化完成再发，1.2s 与 4s 各尝试一次，避免首屏数据还没回拉就判定成非会员 */
    setTimeout(() => { try { if (window.VipTasks) window.VipTasks.grantBaseDaily(); } catch (e) { /* 忽略 */ } }, 1200);
    setTimeout(() => { try { if (window.VipTasks) window.VipTasks.grantBaseDaily(); } catch (e) { /* 忽略 */ } }, 4000);
  }

  document.addEventListener('DOMContentLoaded', init);
  /* 语言切换后同步入口与面板文案 */
  document.addEventListener('languageChanged', () => {
    const btn = document.getElementById(ENTRY_ID);
    if (btn) btn.textContent = T('vip.entry');
    const title = document.getElementById('vipPanelTitle');
    if (title) title.textContent = T('vip.title');
    /* 【新增】骨架里这几处文案是构建时写死的，语言切换后手动同步 */
    const renew = document.getElementById('vipRenewBtn');
    if (renew) renew.textContent = T('vip.renew');
    const rights = document.getElementById('vipRightsTitle');
    if (rights) rights.textContent = T('vip.rightsTitle');
    const logT = document.getElementById('vipLogTitle');
    if (logT) logT.textContent = T('vip.logTitle');
    refreshIfOpen();
  });

  window.VipUI = { openPanel, refreshIfOpen, render, injectEntry };
})();
