/* =========================================================
   modules/point-center/js/04-point-ui.js
   积分中心 · 界面（侧栏入口 / 面板 / 渲染 / 初始化）

   入口按钮排在「面包等级」下面，样式直接继承 VIP 入口，
   保证高度、间距、圆角与「建议箱 / VIP等级 / 面包等级」完全一致。
   面板结构复用 VIP 面板的组件类（vip-panel / vip-user-row /
   vip-checkin-btn / vip-task-item）。
   ========================================================= */

(() => {
  /* 【新增】20261119：月历当前浏览的月份偏移（0 = 本月） */
  let calOffset = 0;
  /* 【新增】20261119：签到提醒开关的本地键（20:00 后没签到就弹一次通知） */
  const REMIND_KEY = 'bb-point-remind';
  const REMIND_HOUR = 20;
  function remindOn() {
    try { return localStorage.getItem(REMIND_KEY) === '1'; } catch (e) { return false; }
  }
  function maybeRemind() {
    if (!remindOn()) return;
    try {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      if (new Date().getHours() < REMIND_HOUR) return;
      const v = window.PointCenterTasks.getView();
      if (!v || v.checkedIn) return;
      const r = pRec(); if (!r) return;
      const s = pState(r.u);
      const today = pDayKey();
      if (s.remindDate === today) return;
      s.remindDate = today; pSave(r.u);
      new Notification(pT('point.remindTitle'), { body: pT('point.remindBody'), tag: 'bb-point-remind' });
    } catch (e) { /* 通知失败不影响页面 */ }
  }

  /* ---------- 入口按钮 ---------- */
  function injectEntry() {
    if (document.getElementById(POINT_ENTRY_ID)) return;
    const bread = document.getElementById('btnBreadEntry');
    const ref = bread || document.getElementById('btnVipEntry');
    if (!ref || !ref.parentElement) return;

    const btn = document.createElement('div');
    btn.id = POINT_ENTRY_ID;
    btn.className = ref.className;
    btn.style.cssText = ref.style.cssText;
    btn.textContent = pT('point.entry');
    btn.onclick = openPanel;

    const parent = ref.parentElement;
    if (bread && bread.parentElement === parent) {
      /* 紧跟在面包等级后面插入 */
      if (bread.nextSibling) parent.insertBefore(btn, bread.nextSibling);
      else parent.appendChild(btn);
    } else {
      parent.appendChild(btn);
    }
    fixOrder();
  }

  /* 位置校正：积分中心必须排在面包等级下方（兼容 column / column-reverse 两种排版） */
  function fixOrder() {
    try {
      const bread = document.getElementById('btnBreadEntry');
      const btn = document.getElementById(POINT_ENTRY_ID);
      if (!bread || !btn || !bread.parentElement) return;
      if (btn.parentElement !== bread.parentElement) bread.parentElement.appendChild(btn);
      const a = btn.getBoundingClientRect();
      const b = bread.getBoundingClientRect();
      if (a.top && b.top && a.top < b.top) bread.parentElement.insertBefore(btn, bread.nextSibling);
    } catch (e) { /* 忽略 */ }
  }

  /* ---------- 面板 ---------- */
  function buildOverlay() {
    if (document.getElementById(POINT_OVERLAY_ID)) return;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = POINT_OVERLAY_ID;
    overlay.innerHTML = `
      <div class="modal vip-panel">
        <div class="vip-panel-head">
          <div class="vip-panel-title">${pT('point.panelTitle')}</div>
          <button class="vip-panel-close" id="pointClose">✕</button>
        </div>
        <div class="vip-panel-body">

          <!-- 0. 头像 + 昵称 + 身份徽标 -->
          <div class="vip-user-row" id="pointUserRow"></div>

          <!-- 1. 当前积分 -->
          <div class="vip-level-box pc-point-box">
            <div class="vip-level-head">
              <div class="vip-level-num">${pT('point.pointsLabel')}</div>
              <div class="vip-point-text" id="pointPointsNum">0</div>
            </div>
            <div class="pc-point-tip" id="pointPointsTip"></div>
          </div>

          <!-- 2. 每日签到（发积分） -->
          <button class="vip-checkin-btn" id="pointCheckinBtn"></button>

          <!-- 2.5 签到月历（【新增】20261119，放在签到下面） -->
          <div class="pc-calendar" id="pointCalendar"></div>

          <!-- 3. 任务区 -->
          <div id="pointTaskArea"></div>

          <!-- 4. 去商城花积分 -->
          <button class="vip-checkin-btn pc-shop-btn" id="pointShopBtn"></button>

        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('pointClose').onclick = () => closeOverlay(overlay);
    document.getElementById('pointCheckinBtn').onclick = () => {
      const res = window.PointCenterTasks.checkin();
      if (res && !res.ok && res.reason === 'checked') {
        if (typeof showToast === 'function') showToast(pT('point.checkinDoneToday'), '🪙');
      }
      renderAll();
    };

    document.getElementById('pointShopBtn').onclick = () => {
      closeOverlay(overlay);
      if (typeof window.openPointsShop === 'function') window.openPointsShop();
      else {
        const b = document.getElementById('btnPoints');
        if (b) b.click();
      }
    };
    overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(overlay); });
  }

  function closeOverlay(overlay) {
    overlay.classList.remove('show');
    setTimeout(() => { if (!overlay.classList.contains('show')) overlay.style.display = 'none'; }, 180);
  }

  function openPanel() {
    buildOverlay();
    const overlay = document.getElementById(POINT_OVERLAY_ID);
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.classList.add('show');
    document.body.classList.add('modal-open');
    renderAll();
  }

  function renderAll() {
    renderUserRow();
    renderPoints();
    renderCheckin();
    renderCalendar();
    renderTasks();
  }

  /* 头像行（与面包等级同一套写法） */
  function renderUserRow() {
    const row = document.getElementById('pointUserRow');
    if (!row) return;
    const r = pRec();
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

  function renderPoints() {
    const num = document.getElementById('pointPointsNum');
    const tip = document.getElementById('pointPointsTip');
    const r = pRec();
    const points = r ? (Number(r.u.points) || 0) : 0;
    if (num) num.textContent = points;
    if (tip) tip.textContent = pT('point.pointsTip', { points });
  }

  function renderCheckin() {
    const btn = document.getElementById('pointCheckinBtn');
    if (!btn) return;
    const v = window.PointCenterTasks.getView();
    const cfg = (window.PointConfig && window.PointConfig.checkin) ? window.PointConfig.checkin() : P_CHECKIN;
    if (!v) { btn.textContent = pT('point.needLogin'); btn.disabled = true; return; }
    /* 【修改】20261119：签过之后要真的禁用（之前只改文字，按钮还是橙色、还能点） */
    btn.disabled = v.checkedIn;
    btn.textContent = v.checkedIn
      ? pT('point.checkinDone', { n: cfg.points, streak: v.streak })
      : pT('point.checkinBtn', { n: cfg.points, streak: v.streak });
  }

  /* 【新增】20261119：签到月历（在签到按钮下面）
     功能：本月打点 / 7·30 天节点 / 活动日 / 生日标记 / 点日期看明细 /
           悬停气泡 / 月度全勤奖 / 七天连胜宝箱 / 活动日倒计时 / 签到提醒 / 上月战绩 */
  function renderCalendar() {
    const box = document.getElementById('pointCalendar');
    if (!box) return;
    const v = window.PointCenterTasks.getView();
    if (!v) { box.innerHTML = ''; return; }

    const base = new Date();
    const view = new Date(base.getFullYear(), base.getMonth() + calOffset, 1);
    const y = view.getFullYear(), m = view.getMonth();
    const first = (new Date(y, m, 1).getDay() + 6) % 7;         /* 周一开头 */
    const days = new Date(y, m + 1, 0).getDate();
    const todayKey = pDayKey();
    const hist = v.hist || [];
    const log = v.log || {};
    const runs = (window.PointCenterTasks.runsOf ? window.PointCenterTasks.runsOf(hist) : {});
    const ev = (window.PointConfig && window.PointConfig.events && window.PointConfig.events()) || { dates: [], mult: 2 };
    const bday = v.birthday ? String(v.birthday).slice(5) : '';
    /* 【新增】20261118：拆出年 / 月 / 日，供三个输入框回填（年为空时不显示 0000） */
    const _bd = String(v.birthday || '').split('-');
    const bdY = (_bd[0] && _bd[0] !== '0000') ? _bd[0] : '';
    const bdM = _bd[1] || '';
    const bdD = _bd[2] || '';

    /* 活动日倒计时 */
    let countdown = '';
    const evDates = (ev.dates || []).slice().sort();
    const nextEv = evDates.find(d => d >= todayKey);
    if (nextEv) {
      const diff = Math.round((new Date(nextEv + 'T00:00:00') - new Date(todayKey + 'T00:00:00')) / 86400000);
      countdown = pT('point.calCountdown', { n: diff, date: nextEv.slice(5) });
    }

    let cells = '';
    for (let i = 0; i < first; i++) cells += '<div class="pc-cal-cell is-empty"></div>';
    for (let d = 1; d <= days; d++) {
      const key = `${y}-${pPad2(m + 1)}-${pPad2(d)}`;
      const on = hist.indexOf(key) >= 0;
      const isToday = key === todayKey;
      const isEvent = (ev.dates || []).indexOf(key) >= 0;
      const isBday = !!bday && key.slice(5) === bday;
      const flag = (on && runs[key] && (runs[key] % 7 === 0 || runs[key] % 30 === 0)) ? runs[key] : 0;
      const chestReady = on && runs[key] && runs[key] % 7 === 0 && !(v.chest && v.chest[key]);
      cells += `<div class="pc-cal-cell${on ? ' is-on' : ''}${isToday ? ' is-today' : ''}${isEvent ? ' is-event' : ''}${isBday ? ' is-bday' : ''}" data-date="${key}">`
        + `<span>${d}</span>${flag ? `<b class="pc-cal-flag">${flag}</b>` : ''}`
        + `${isBday ? '<i class="pc-cal-bday">🎂</i>' : ''}`
        + `${isEvent ? '<i class="pc-cal-gift">🎁</i>' : ''}`
        + `${chestReady ? '<i class="pc-cal-chest">📦</i>' : ''}</div>`;
    }

    const prefix = `${y}-${pPad2(m + 1)}-`;
    const monthOn = hist.filter(k => k.indexOf(prefix) === 0).length;
    const monthPts = Object.keys(log).filter(k => k.indexOf(prefix) === 0)
      .reduce((sum, k) => sum + (Number(log[k].pts) || 0), 0);
    const monthCount = hist.filter(k => k.indexOf(v.fullMonth + '-') === 0).length;
    const WK = pT('point.calWeekday').split(',');
    const title = pT('point.calMonth', { y, m: m + 1 });

    /* 可开的连胜宝箱 */
    const chestList = Object.keys(runs).filter(k => runs[k] % 7 === 0 && k <= todayKey && !(v.chest && v.chest[k])).sort();
    const chestReady = chestList.length > 0;
    const fullReady = (calOffset === 0) && !v.fullClaimed && monthCount >= v.fullNeed;

    box.innerHTML = `
      <div class="pc-cal-head">
        <button class="pc-cal-nav" id="pcCalPrev">‹</button>
        <div class="pc-cal-title">${title}</div>
        <button class="pc-cal-nav" id="pcCalNext" ${calOffset >= 0 ? 'disabled' : ''}>›</button>
      </div>
      <div class="pc-cal-week">${WK.map(w => `<span>${w}</span>`).join('')}</div>
      <div class="pc-cal-grid">${cells}</div>
      <div class="pc-cal-tip" id="pcCalTip"></div>
      <div class="pc-cal-foot">${calOffset === 0
        ? pT('point.calFoot', { n: monthOn, streak: v.streak })
        : pT('point.calFootPast', { n: monthOn, pts: monthPts })}</div>
      ${countdown ? `<div class="pc-cal-countdown">${countdown}</div>` : ''}
      ${(ev.dates || []).length ? `<div class="pc-cal-event-tip">${pT('point.calEventTip', { mult: ev.mult || 2 })}</div>` : ''}

      <div class="pc-cal-detail" id="pcCalDetail">${pT('point.calDetailHint')}</div>

      <div class="pc-heat">
        <div class="pc-heat-title">${pT('point.heatTitle')}</div>
        <div class="pc-heat-grid">${heatCells(v.act || {})}</div>
      </div>

      <div class="pc-cal-tools">
        <div class="pc-cal-tool-row">
          <span>${pT('point.fullProgress', { cur: monthCount, need: v.fullNeed })}</span>
          ${v.fullClaimed
            ? `<span class="pc-cal-tag">${pT('point.fullClaimed')}</span>`
            : (fullReady
              ? `<button class="pc-cal-mini-btn can" id="pcFullBtn">${pT('point.fullClaim', { n: v.fullAward })}</button>`
              : `<span class="pc-cal-tag">${pT('point.fullLocked', { need: v.fullNeed })}</span>`)}
        </div>
        <div class="pc-cal-tool-row">
          <span>${pT('point.chestLabel')}</span>
          ${chestReady
            ? `<button class="pc-cal-mini-btn can" id="pcChestBtn">${pT('point.chestBtn')}</button>`
            : `<span class="pc-cal-tag">${pT('point.chestNone')}</span>`}
        </div>
        <div class="pc-cal-tool-row">
          <label class="pc-cal-label">${pT('point.birthdayLabel')}</label>
          <!-- 【修改】20261118：改成手动输入「年 / 月 / 日」三个格子；
               年只做记录（可留空），判定生日只取月和日（MM-DD）。 -->
          <span class="pc-bd-box">
            <input class="pc-cal-date pc-bd-year" type="number" id="pcBirthYear" min="1900" max="2100" placeholder="${pT('point.birthYear')}" value="${bdY || ''}">
            <input class="pc-cal-date pc-bd-num" type="number" id="pcBirthMonth" min="1" max="12" placeholder="${pT('point.birthMonth')}" value="${bdM || ''}">
            <input class="pc-cal-date pc-bd-num" type="number" id="pcBirthDay" min="1" max="31" placeholder="${pT('point.birthDay')}" value="${bdD || ''}">
          </span>
        </div>
        <div class="pc-bd-hint">${pT('point.birthdayHint')}</div>
        <div class="pc-cal-tool-row">
          <span>${pT('point.remindLabel')}</span>
          <button class="pc-cal-mini-btn${remindOn() ? ' can' : ''}" id="pcRemindBtn">${remindOn() ? pT('point.remindOff') : pT('point.remindOn')}</button>
        </div>
      </div>

      ${v.canMakeup ? `<button class="pc-makeup-btn" id="pcMakeupBtn">${pT('point.makeupBtn', { cost: v.makeupCost })}</button>` : ''}
    `;

    /* 翻月 */
    const prev = document.getElementById('pcCalPrev');
    const next = document.getElementById('pcCalNext');
    if (prev) prev.onclick = () => { calOffset -= 1; renderCalendar(); };
    if (next) next.onclick = () => { if (calOffset < 0) { calOffset += 1; renderCalendar(); } };

    /* 点日期看明细 + 悬停气泡 */
    const detail = document.getElementById('pcCalDetail');
    const tip = document.getElementById('pcCalTip');
    box.querySelectorAll('.pc-cal-cell[data-date]').forEach(cell => {
      const key = cell.getAttribute('data-date');
      const rec = log[key] || {};
      const text = pT('point.calDetailLine', {
        date: key.slice(5),
        ck: rec.ck ? '✓' : '—',
        tasks: Number(rec.tasks) || 0,
        pts: Number(rec.pts) || 0
      });
      cell.onclick = () => { if (detail) detail.textContent = text; };
      cell.onmouseenter = () => {
        if (!tip) return;
        tip.textContent = text;
        tip.style.display = 'block';
        const boxRect = box.getBoundingClientRect();
        const r = cell.getBoundingClientRect();
        tip.style.left = Math.max(6, Math.min(boxRect.width - 150, r.left - boxRect.left - 40)) + 'px';
        tip.style.top = (r.top - boxRect.top - 30) + 'px';
      };
      cell.onmouseleave = () => { if (tip) tip.style.display = 'none'; };
    });

    /* 全勤奖 / 宝箱 / 生日 / 提醒 */
    const fullBtn = document.getElementById('pcFullBtn');
    if (fullBtn) fullBtn.onclick = () => {
      const res = window.PointCenterTasks.claimFull();
      if (res && res.ok) renderAll(); else if (typeof showToast === 'function') showToast(pT('point.fullLocked', { need: v.fullNeed }), '🪙');
    };

    const chestBtn = document.getElementById('pcChestBtn');
    if (chestBtn) chestBtn.onclick = () => { window.PointCenterTasks.claimChest(); renderAll(); };

    /* 【修改】20261118：生日改成手动输入 年/月/日（年可留空，只记录出生年；
       双倍判定只看 MM-DD，和年份无关） */
    const by = document.getElementById('pcBirthYear');
    const bm = document.getElementById('pcBirthMonth');
    const bdDay = document.getElementById('pcBirthDay');
    const saveBirthday = () => {
      const r = pRec(); if (!r) return;
      const yy = (by && by.value || '').trim();
      const mm = parseInt(bm && bm.value, 10);
      const dd = parseInt(bdDay && bdDay.value, 10);

      /* 月和日都空 → 清空生日 */
      if (!mm && !dd) {
        r.u.birthday = '';
        pSave(r.u);
        renderCalendar();
        return;
      }
      if (!(mm >= 1 && mm <= 12) || !(dd >= 1 && dd <= 31)) {
        if (typeof showToast === 'function') showToast(pT('point.birthdayInvalid'), '⚠️');
        return;
      }
      const yStr = /^\d{4}$/.test(yy) ? yy : '0000';   /* 年留空就存 0000，只占位不参与判定 */
      r.u.birthday = `${yStr}-${pPad2(mm)}-${pPad2(dd)}`;
      pSave(r.u);
      if (typeof showToast === 'function') showToast(pT('point.birthdaySaved'), '🎂');
      renderCalendar();
    };
    [by, bm, bdDay].forEach(el => { if (el) el.onchange = saveBirthday; });

    const rb = document.getElementById('pcRemindBtn');
    if (rb) rb.onclick = async () => {
      if (remindOn()) { localStorage.setItem(REMIND_KEY, '0'); renderCalendar(); return; }
      try {
        if (typeof Notification !== 'undefined') {
          const st = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
          if (st !== 'granted') { if (typeof showToast === 'function') showToast(pT('point.remindDenied'), '🔔'); return; }
        }
      } catch (e) { /* 忽略 */ }
      localStorage.setItem(REMIND_KEY, '1');
      renderCalendar();
      if (typeof showToast === 'function') showToast(pT('point.remindOnToast'), '🔔');
    };

    const mk = document.getElementById('pcMakeupBtn');
    if (mk) mk.onclick = () => {
      const res = window.PointCenterTasks.makeup();
      if (res && res.ok) renderAll();
      else if (res && res.reason === 'not-enough' && typeof showToast === 'function') showToast(pT('point.makeupNoPoints'), '🪙');
    };
  }
  /* 【新增】20261119：近 30 天活跃热力图（每天签到 / 领任务都算一次活跃） */
  function heatCells(act) {
    let html = '';
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = pDayKey(d);
      const n = Number(act[key]) || 0;
      const lv = n >= 3 ? 3 : n;             /* 0 / 1 / 2 / 3 档颜色 */
      html += `<div class="pc-heat-cell lv${lv}" title="${key} · ${n}"></div>`;
    }
    return html;
  }

  function renderTasks() {
    const area = document.getElementById('pointTaskArea');
    if (!area) return;
    const v = window.PointCenterTasks.getView();
    if (!v) { area.innerHTML = ''; return; }

    const GROUP = [
      { cycle: 'day', title: pT('point.taskDay'), reset: pT('point.resetDay') },
      { cycle: 'week', title: pT('point.taskWeek'), reset: pT('point.resetWeek') },
      { cycle: 'month', title: pT('point.taskMonth'), reset: pT('point.resetMonth') }   /* 【新增】20261119：每月任务 */
    ];

    /* 【修改】20261119：改成和面包等级任务完全同一套结构
       （vip-task-section / vip-task-section-title / vip-task-item / vip-task-sub），
       之前用的 vip-task-group / vip-task-bar 这套类在样式里根本不存在，
       所以显示出来没有卡片、没有进度条，格式是散的。 */
    area.innerHTML = GROUP.map(g => {
      const items = v.tasks.filter(t => t.cycle === g.cycle);
      if (!items.length) return '';

      const rows = items.map(t => {
        const done = t.done >= t.need;
        const btn = t.claimed
          ? `<button class="vip-task-btn claimed" disabled>${pT('point.claimed')}</button>`
          : done
            ? `<button class="vip-task-btn can" data-claim="${t.id}">${pT('point.claim')}</button>`
            : `<button class="vip-task-btn" disabled>${pT('point.ongoing')}</button>`;
        return `
          <div class="vip-task-item${done ? ' done' : ''}">
            <div class="vip-task-main">
              <div class="vip-task-name">${pT('point.task_' + t.id, { n: t.need })}</div>
              <div class="vip-task-sub">${pT('point.taskReach', { n: t.need, pts: t.points })}</div>
              <div class="vip-task-sub">${pT('point.progressFmt', { cur: t.done, need: t.need })}</div>
            </div>
            <div class="vip-task-reward">+${t.points} ${pT('point.pointsUnit')}</div>
            ${btn}
          </div>`;
      }).join('');

      return `<div class="vip-task-section">
          <div class="vip-task-section-title">
            <span>${g.title}</span>
            <span class="vip-task-reset-hint">${g.reset}</span>
          </div>
          ${rows}
        </div>`;
    }).join('');

    area.querySelectorAll('[data-claim]').forEach(b => {
      b.onclick = () => {
        const res = window.PointCenterTasks.claim(b.getAttribute('data-claim'));
        if (res && res.ok) renderAll();
      };
    });
  }
  function refresh() {
    const overlay = document.getElementById(POINT_OVERLAY_ID);
    if (overlay && overlay.classList.contains('show')) renderAll();
    const el = document.getElementById('pointsDisplay');
    const r = pRec();
    if (el && r) el.textContent = Number(r.u.points) || 0;
    const entry = document.getElementById(POINT_ENTRY_ID);
    if (entry) entry.textContent = pT('point.entry');   /* 切换语言时同步入口文案 */
  }

  function init() {
    injectEntry();
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      injectEntry();
      fixOrder();
      if (n >= 12) clearInterval(timer);
    }, 500);
    document.addEventListener('languageChanged', () => { try { refresh(); } catch (e) {} });
    /* 【新增】20261119：签到提醒定时检查（每分钟一次，只在 20:00 后触发一次） */
    setInterval(maybeRemind, 60000);
    setTimeout(maybeRemind, 3000);
  }

  window.PointCenter = { openPanel, refresh, refreshTasks: refresh, getView: () => window.PointCenterTasks.getView() };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
