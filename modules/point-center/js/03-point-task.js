/* =========================================================
   modules/point-center/js/03-point-task.js
   积分中心 · 任务 / 签到 / 连续签到

   进度直接复用「面包等级」已经记好的行为计数器（open / search /
   basketAdd / profileView / themeShop / redeemUse / suggest），
   所以不用为积分任务再单独埋一遍点。
   ========================================================= */

(() => {
  /* 前一天的 key（用于判断连续签到） */
  function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return pDayKey(d);
  }

  /* 【修改】20261119：支持每月任务 */
  function cycleKey(cycle) {
    if (cycle === 'month') return pMonthKey();
    return cycle === 'week' ? pWeekKey() : pDayKey();
  }
  function boxOfView(s, cycle) { return cycle === 'month' ? s.m : (cycle === 'week' ? s.w : s.d); }

  /* 读面包等级记的计数器（周期对不上就当作 0） */
  function countOf(u, cycle, event) {
    const bs = (u && u.breadState) || {};
    const box = cycle === 'month' ? bs.m : (cycle === 'week' ? bs.w : bs.d);
    if (!box || !box.c) return 0;
    if (box.key !== cycleKey(cycle)) return 0;
    return Number(box.c[event]) || 0;
  }

  /* 【新增】20261119：活动日倍率（日期由云端 point_task_config 的 event_calendar 行给） */
  function eventMult(dateKey) {
    try {
      const ev = (window.PointConfig && window.PointConfig.events) ? window.PointConfig.events() : null;
      if (!ev || !Array.isArray(ev.dates)) return 1;
      return ev.dates.indexOf(dateKey) >= 0 ? (ev.mult || 2) : 1;
    } catch (e) { return 1; }
  }

  function tasksNow() {
    const cfg = (window.PointConfig && window.PointConfig.tasks) ? window.PointConfig.tasks() : P_DEFAULT_TASKS;
    return cfg.filter(t => t.enabled !== false && t.event);
  }

  function getView(u) {
    u = u || (pRec() && pRec().u);
    if (!u) return null;
    const cfg = (window.PointConfig && window.PointConfig.checkin) ? window.PointConfig.checkin() : P_CHECKIN;
    const s = pState(u);
    const today = pDayKey();

    return {
      points: Number(u.points) || 0,
      checkedIn: s.last === today,
      streak: Number(s.streak) || 0,
      checkinPoints: cfg.points,
      hist: Array.isArray(s.hist) ? s.hist.slice() : [],   /* 【新增】签到历史，日历渲染用 */
      act: (s.act && typeof s.act === 'object') ? Object.assign({}, s.act) : {},   /* 【新增】热力图数据 */
      /* 【新增】20261119：日历扩展用数据 */
      log: (s.log && typeof s.log === 'object') ? Object.assign({}, s.log) : {},
      chest: (s.chest && typeof s.chest === 'object') ? Object.assign({}, s.chest) : {},
      birthday: u.birthday || '',
      fullMonth: pMonthKey(),
      fullCount: (Array.isArray(s.hist) ? s.hist : []).filter(k => k.indexOf(pMonthKey() + '-') === 0).length,
      fullNeed: cfg.fullNeed || 28,
      fullAward: cfg.fullAward || 300,
      fullClaimed: !!(s.full && s.full[pMonthKey()]),
      makeupCost: cfg.makeupCost || 50,
      /* 【新增】20261119：能不能补签（昨天漏签、而且今天还没签过） */
      canMakeup: (s.last !== today && s.last !== yesterdayKey() && (Number(u.points) || 0) >= (cfg.makeupCost || 50)),
      tasks: tasksNow().map(t => {
        const done = Math.min(t.need, countOf(u, t.cycle, t.event));
        const box = boxOfView(s, t.cycle);
        return {
          id: t.id, cycle: t.cycle, need: t.need, points: t.points,
          done, claimed: !!box.cl[t.id]
        };
      })
    };
  }

  function toast(msg, icon) {
    if (typeof showToast === 'function') showToast(msg, icon || '🪙');
  }

  /* 领取任务积分 */
  function claim(taskId) {
    const r = pRec();
    if (!r) return { ok: false, reason: 'no-user' };
    const u = r.u;
    const s = pState(u);
    const task = tasksNow().find(t => t.id === taskId);
    if (!task) return { ok: false, reason: 'bad-task' };

    const box = boxOfView(s, task.cycle);   /* 【修改】20261119：支持每月任务 */
    if (box.cl[taskId]) return { ok: false, reason: 'claimed' };
    const done = countOf(u, task.cycle, task.event);
    if (done < task.need) return { ok: false, reason: 'not-done' };

    box.cl[taskId] = true;
    const mult = eventMult(pDayKey());
    const gain = Math.round(task.points * mult);
    const total = pAddPoints(u, gain, 'point_task', task.id);
    /* 【新增】20261119：活动热力图计数 */
    if (!s.act) s.act = {};
    s.act[pDayKey()] = (Number(s.act[pDayKey()]) || 0) + 1;
    pSave(u);
    toast(pT('point.taskClaimed', { n: task.points, total: total }));
    try { if (window.PointCenter && window.PointCenter.refresh) window.PointCenter.refresh(); } catch (e) {}
    return { ok: true, points: task.points, total };
  }

  /* 每日签到（发积分，不是烘焙度） */
  function checkin() {
    const r = pRec();
    if (!r) return { ok: false, reason: 'no-user' };
    const u = r.u;
    const s = pState(u);
    const cfg = (window.PointConfig && window.PointConfig.checkin) ? window.PointConfig.checkin() : P_CHECKIN;
    const today = pDayKey();
    if (s.last === today) return { ok: false, reason: 'checked' };

    /* 连续判定：昨天签过就 +1，否则从 1 重新开始 */
    s.streak = (s.last === yesterdayKey()) ? (Number(s.streak) || 0) + 1 : 1;
    s.last = today;
    s.dailyDate = today;
    /* 【新增】20261119：记录今天签过（日历打点），保留最近 90 天 */
    if (!Array.isArray(s.hist)) s.hist = [];
  /* 【新增】20261119：每天的活动次数（签到 / 领任务都 +1），给热力图用 */
  if (!s.act || typeof s.act !== 'object') s.act = {};
  /* 【新增】20261119：每天明细（签到 / 任务数 / 当日积分），点日期看详情用 */
  if (!s.log || typeof s.log !== 'object') s.log = {};
  /* 【新增】20261119：七连胜宝箱领取记录 { 日期: 金额 } */
  if (!s.chest || typeof s.chest !== 'object') s.chest = {};
  /* 【新增】20261119：月度全勤奖领取记录 { 月份: true } */
  if (!s.full || typeof s.full !== 'object') s.full = {};
    if (s.hist.indexOf(today) < 0) s.hist.push(today);
    if (s.hist.length > 90) s.hist = s.hist.slice(-90);

    let gain = Math.round(cfg.points * eventMult(today));   /* 【新增】20261119：活动日双倍 */
    /* 【新增】20261119：生日当天签到双倍 */
    if (u.birthday && String(u.birthday).slice(5) === today.slice(5)) gain *= 2;
    let extra = 0;
    if (s.streak > 0 && s.streak % 7 === 0) extra += cfg.streak7;
    if (s.streak > 0 && s.streak % 30 === 0) extra += cfg.streak30;
    if (extra > 0) gain += extra;

    /* 【新增】20261119：热力图计数 */
    if (!s.act) s.act = {};
    s.act[today] = (Number(s.act[today]) || 0) + 1;
    logDay(u, today, 'ck', gain);          /* 【新增】20261119：当天明细 */
    const total = pAddPoints(u, gain, 'checkin', today);
    toast(pT('point.checkinOk', { n: gain, streak: s.streak, total: total }));
    try { if (window.PointCenter && window.PointCenter.refresh) window.PointCenter.refresh(); } catch (e) {}
    return { ok: true, points: gain, streak: s.streak, total };
  }

  /* 【新增】20261119：补签卡 —— 花积分补昨天的签到
     规则：只有「昨天漏签、今天还没签」时可用；补上后连续天数 +1，
     再把 last 指到昨天，今天照常签到能继续连。 */
  function makeup() {
    const r = pRec();
    if (!r) return { ok: false, reason: 'no-user' };
    const u = r.u;
    const s = pState(u);
    const cfg = (window.PointConfig && window.PointConfig.checkin) ? window.PointConfig.checkin() : P_CHECKIN;
    const cost = cfg.makeupCost || 50;
    const today = pDayKey();
    const y = yesterdayKey();

    if (s.last === today) return { ok: false, reason: 'checked-today' };
    if (s.last === y) return { ok: false, reason: 'no-gap' };
    if ((Number(u.points) || 0) < cost) return { ok: false, reason: 'not-enough' };

    /* 【修改】20261118 P3：补签扣分改走 apply_points，服务端校验余额/额度。 */
    const total = pAddPoints(u, -cost, 'makeup', y);
    s.streak = (Number(s.streak) || 0) + 1;
    s.last = y;
    if (!Array.isArray(s.hist)) s.hist = [];
    if (s.hist.indexOf(y) < 0) s.hist.push(y);
    if (!s.act) s.act = {};
    s.act[y] = (Number(s.act[y]) || 0) + 1;
    pSave(u);

    toast(pT('point.makeupOk', { cost, streak: s.streak }));
    try { if (window.PointCenter && window.PointCenter.refresh) window.PointCenter.refresh(); } catch (e) {}
    return { ok: true, cost, streak: s.streak };
  }

  /* 【新增】20261119：签到历史里每一天属于连续第几天 */
  function runsOf(hist) {
    const out = {};
    const sorted = (hist || []).slice().sort();
    let run = 0, prev = '';
    sorted.forEach(k => {
      const expect = prev ? pDayKey(new Date(new Date(prev + 'T00:00:00').getTime() + 86400000)) : '';
      run = (prev && k === expect) ? run + 1 : 1;
      out[k] = run;
      prev = k;
    });
    return out;
  }

  /* 【新增】20261119：七天连胜宝箱（每个连续第 7 天可开一次，随机 30~80 积分） */
  function claimChest() {
    const r = pRec();
    if (!r) return { ok: false, reason: 'no-user' };
    const u = r.u;
    const s = pState(u);
    const runs = runsOf(s.hist || []);
    const today = pDayKey();
    const ready = Object.keys(runs).filter(k => runs[k] % 7 === 0 && k <= today && !s.chest[k]).sort();
    if (!ready.length) return { ok: false, reason: 'none' };
    const key = ready[ready.length - 1];
    const amt = 30 + Math.floor(Math.random() * 51);   /* 30~80 */
    s.chest[key] = amt;
    /* 当天明细里也记一笔 */
    logDay(u, today, 'tasks', 0);
    const total = pAddPoints(u, amt, 'chest', key);
    if (typeof showToast === 'function') toast(pT('point.chestOk', { n: amt, total }));
    try { if (window.PointCenter && window.PointCenter.refresh) window.PointCenter.refresh(); } catch (e) {}
    return { ok: true, points: amt, total, date: key };
  }

  /* 【新增】20261119：月度全勤奖（当月签满 28 天，每月一次） */
  function claimFull() {
    const r = pRec();
    if (!r) return { ok: false, reason: 'no-user' };
    const u = r.u;
    const s = pState(u);
    const cfg = (window.PointConfig && window.PointConfig.checkin) ? window.PointConfig.checkin() : P_CHECKIN;
    const mk = pMonthKey();
    if (s.full && s.full[mk]) return { ok: false, reason: 'claimed' };
    const need = cfg.fullNeed || 28;
    const count = (s.hist || []).filter(k => k.indexOf(mk + '-') === 0).length;
    if (count < need) return { ok: false, reason: 'not-full', count, need };

    s.full[mk] = true;
    const award = cfg.fullAward || 300;
    const total = pAddPoints(u, award, 'full', mk);
    if (typeof showToast === 'function') toast(pT('point.fullOk', { n: award, total }));
    try { if (window.PointCenter && window.PointCenter.refresh) window.PointCenter.refresh(); } catch (e) {}
    return { ok: true, points: award, total };
  }

  /* 给外部模块用：面包任务完成时顺手发一点积分 */
  function reward(action, amount, ref) {
    const r = pRec();
    if (!r) return 0;
    /* 【修改】20261118 P3：ref 用来让服务端按任务/周期做幂等，防止重复领取。 */
    return pAddPoints(r.u, amount, 'bread_task', ref || action);
  }

  window.PointCenterTasks = { tasksNow, getView, claim, checkin, reward, countOf, makeup, eventMult, runsOf, claimChest, claimFull };
})();
