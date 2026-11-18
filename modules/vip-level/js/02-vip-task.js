/* =========================================================
   modules/vip-level/js/02-vip-task.js
   VIP 任务体系：每日 / 每周 / 每月任务 + 独立签到
   【新增】整份文件为本轮新增

   设计约束（与需求一致）：
   1. 签到是「独立按钮」，不属于每日任务列表；
   2. 所有任务都基于当前线上已有功能（建议箱 / 搜索 / 主题商店 / 兑换页 / 个人主页 / 邮件 / 资料修改）；
   3. 内测功能（好友系统、查询天气工具）不接入任何任务，因此这里不出现相关事件；
   4. 每个任务在同一周期内只能领取一次，周期刷新后计数与领取状态一起重置。
   ========================================================= */

(() => {
  /* 签到每次奖励的星光值（需求未指定具体数值，这里作为提案集中管理，改这一处即可） */
  const CHECKIN_REWARD = 10;

  /* ---------- 任务表 ----------
     id      : 稳定标识（也用于领取记录，不随文案变化）
     cycle   : daily / weekly / monthly
     event   : 由 track() 记账的事件名
     need    : 本周期需要完成的次数
     reward  : 领取后获得的星光值（周/月任务数值为提案，可随时调整） */
  const TASKS = [
    /* 每日 7 条 */
    { id: 'd_suggest', cycle: 'daily',   event: 'suggest',     need: 1,  reward: 20 },
    { id: 'd_search',  cycle: 'daily',   event: 'search',      need: 5,  reward: 20 },
    { id: 'd_theme',   cycle: 'daily',   event: 'themeShop',   need: 1,  reward: 10 },
    { id: 'd_redeem',  cycle: 'daily',   event: 'redeemPage',  need: 1,  reward: 10 },
    { id: 'd_profile', cycle: 'daily',   event: 'profileView', need: 1,  reward: 10 },
    { id: 'd_mail',    cycle: 'daily',   event: 'mailView',    need: 1,  reward: 10 },
    { id: 'd_edit',    cycle: 'daily',   event: 'profileEdit', need: 1,  reward: 15 },

    /* 每周 5 条 */
    { id: 'w_suggest', cycle: 'weekly',  event: 'suggest',     need: 3,  reward: 80 },
    { id: 'w_search',  cycle: 'weekly',  event: 'search',      need: 20, reward: 80 },
    { id: 'w_redeem',  cycle: 'weekly',  event: 'redeemUse',   need: 1,  reward: 60 },
    { id: 'w_theme',   cycle: 'weekly',  event: 'themeShop',   need: 5,  reward: 60 },
    { id: 'w_edit',    cycle: 'weekly',  event: 'profileEdit', need: 2,  reward: 60 },

    /* 每月 4 条 */
    { id: 'm_checkin', cycle: 'monthly', event: 'checkin',     need: 20, reward: 200 },
    { id: 'm_suggest', cycle: 'monthly', event: 'suggest',     need: 10, reward: 200 },
    { id: 'm_search',  cycle: 'monthly', event: 'search',      need: 60, reward: 200 },
    { id: 'm_theme',   cycle: 'monthly', event: 'themeShop',   need: 12, reward: 150 }
  ];

  /* ---------- 生效的任务参数 ----------
     【新增】20261118：需要次数 / 奖励星光值优先读云端 vip_task_config
     （由 06-vip-config.js 拉取），表里没配或读取失败就用上面 TASKS 的默认值。
     这样在 Supabase 里改 need_count / reward_point 会真正生效，不再是摆设。 */
  function eff(t) {
    const c = (window.VipConfig && typeof window.VipConfig.task === 'function')
      ? window.VipConfig.task(t.id) : null;
    return {
      need: (c && Number(c.need) > 0) ? Number(c.need) : t.need,
      reward: (c && c.reward !== null && c.reward !== undefined && Number(c.reward) >= 0)
        ? Number(c.reward) : t.reward
    };
  }

  /* ---------- 周期标识 ---------- */
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function dailyKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
  function monthKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; }

  /* ISO 周：周一为一周起点，跨年也能对齐 */
  function weekKey(d) {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = (t.getDay() + 6) % 7;              // 周一=0
    t.setDate(t.getDate() - day + 3);              // 调到本周周四，避免跨年错周
    const firstThu = new Date(t.getFullYear(), 0, 4);
    const fDay = (firstThu.getDay() + 6) % 7;
    firstThu.setDate(4 - fDay + 3);
    const week = 1 + Math.round((t - firstThu) / (7 * 24 * 3600 * 1000));
    return `${t.getFullYear()}-W${pad2(week)}`;
  }

  function keyOfCycle(cycle, now) {
    const d = now || new Date();
    if (cycle === 'daily') return dailyKey(d);
    if (cycle === 'weekly') return weekKey(d);
    return monthKey(d);
  }

  /* ---------- 状态容器 ----------
     u.vipTaskState = {
       daily  : { key, counters:{event:次数}, claimed:{taskId:true} },
       weekly : { key, counters, claimed },
       monthly: { key, counters, claimed },
       checkin: { date, monthKey, monthCount }
     } */
  const CYCLES = ['daily', 'weekly', 'monthly'];

  function ensureTaskState(u) {
    if (!u.vipTaskState || typeof u.vipTaskState !== 'object') u.vipTaskState = {};
    const st = u.vipTaskState;
    const now = new Date();

    CYCLES.forEach(cycle => {
      const k = keyOfCycle(cycle, now);
      if (!st[cycle] || typeof st[cycle] !== 'object') st[cycle] = {};
      const box = st[cycle];
      if (box.key !== k) {
        /* 周期刷新：计数与领取状态一起重置 */
        box.key = k;
        box.counters = {};
        box.claimed = {};
      }
      if (!box.counters || typeof box.counters !== 'object') box.counters = {};
      if (!box.claimed || typeof box.claimed !== 'object') box.claimed = {};
    });

    if (!st.checkin || typeof st.checkin !== 'object') st.checkin = {};
    if (typeof st.checkin.date !== 'string') st.checkin.date = '';
    if (typeof st.checkin.monthKey !== 'string' || st.checkin.monthKey !== monthKey(now)) {
      st.checkin.monthKey = monthKey(now);
      st.checkin.monthCount = 0;
    }
    if (typeof st.checkin.monthCount !== 'number' || st.checkin.monthCount < 0) st.checkin.monthCount = 0;

    return st;
  }

  function rec() {
    if (typeof window.VIPCore === 'undefined') return null;
    return window.VIPCore.currentRecord();
  }

  function isMember(u) {
    if (!window.VIPCore) return false;
    const t = window.VIPCore.memberTypeOf(u);
    return t === 'vip' || t === 'svip';
  }

  function save(u) {
    const db = (typeof getUsersDB === 'function') ? getUsersDB() : null;
    if (!db || typeof currentUser === 'undefined' || !currentUser) return;
    db[currentUser] = u;
    store.set('bb-users', db);
  }

  /* ---------- 记账：某个任务相关动作发生了一次 ----------
     event 由各功能入口调用（搜索 / 打开主题商店 / 打开兑换页 / 查看主页 / 打开邮件 / 修改资料 / 提交建议 / 签到） */
  function track(event, n) {
    /* 【新增】20261118：先转发给面包等级（普通用户也记账），
       再走原 VIP 任务逻辑；两者互不影响，非会员在下面会被 return */
    try { if (window.UserLevel && typeof window.UserLevel.track === 'function') window.UserLevel.track(event); } catch (e) { /* 忽略 */ }

    const r = rec();
    if (!r) return false;
    const u = r.u;
    /* 任务体系只对有效会员开放；非会员、内测功能都不记账 */
    if (!isMember(u)) return false;

    const st = ensureTaskState(u);
    const inc = Math.max(1, Math.floor(Number(n) || 1));
    let changed = false;

    TASKS.forEach(task => {
      if (task.event !== event) return;
      const box = st[task.cycle];
      if (!box) return;
      box.counters[event] = (Number(box.counters[event]) || 0) + inc;
      changed = true;
    });

    if (!changed) return false;
    save(u);

    if (typeof window.VipUI !== 'undefined' && typeof window.VipUI.refreshIfOpen === 'function') {
      try { window.VipUI.refreshIfOpen(); } catch (e) { /* 渲染异常不影响记账 */ }
    }
    return true;
  }

  /* ---------- 会员基础每日积分（只与身份有关，与等级无关） ----------
     VIP 每天 +50，SVIP 每天 +100；同一天内升级身份只补差价，不重复发放。
     这部分属于「会员本身的权益」，不列进任务清单，打开面板/启动时自动到账。 */
  const BASE_DAILY = { vip: 50, svip: 100 };

  function baseDailyOf(memberType) {
    return BASE_DAILY[memberType] || 0;
  }

  function grantBaseDaily() {
    const r = rec();
    if (!r) return { ok: false, reason: 'no-user' };
    const u = r.u;
    const type = (window.VIPCore && window.VIPCore.memberTypeOf(u)) || 'none';
    if (type !== 'vip' && type !== 'svip') return { ok: false, reason: 'not-member' };

    const st = ensureTaskState(u);
    const today = dailyKey(new Date());
    if (!st.base || typeof st.base !== 'object') st.base = {};
    const amount = baseDailyOf(type);
    const alreadyToday = (st.base.date === today) ? (Number(st.base.amount) || 0) : 0;
    if (st.base.date === today && st.base.type === type) return { ok: false, reason: 'granted' };

    const gain = Math.max(0, amount - alreadyToday);
    if (gain <= 0) return { ok: false, reason: 'granted' };

    /* 先落盘发放状态，再 addStar（addStar 会重读并写回用户库） */
    st.base.date = today;
    st.base.type = type;
    st.base.amount = alreadyToday + gain;
    save(u);

    const res = window.VIPCore.addStar(gain, 'membership:' + type);
    if (!res || !res.ok) return { ok: false, reason: (res && res.reason) || 'add-failed' };

    if (typeof showToast === 'function') {
      const txt = (typeof _loadT === 'function')
        ? _loadT('vip.baseDailyToast', { n: gain })
        : ('会员每日星光值 +' + gain);
      showToast(txt, '🎁');
    }
    if (typeof window.VipUI !== 'undefined' && typeof window.VipUI.refreshIfOpen === 'function') {
      try { window.VipUI.refreshIfOpen(); } catch (e) { /* 忽略 */ }
    }
    return { ok: true, reward: gain };
  }

  /* ---------- 领取任务奖励 ---------- */
  function claimTask(taskId) {
    const r = rec();
    if (!r) return { ok: false, reason: 'no-user' };
    const u = r.u;
    if (!isMember(u)) return { ok: false, reason: 'not-member' };

    const task = TASKS.find(t => t.id === taskId);
    if (!task) return { ok: false, reason: 'not-found' };

    const st = ensureTaskState(u);
    const box = st[task.cycle];
    const p = eff(task);                       /* 【新增】云端配置优先 */
    const done = Math.min(p.need, Number(box.counters[task.event]) || 0);

    if (box.claimed[task.id]) return { ok: false, reason: 'claimed' };
    if (done < p.need) return { ok: false, reason: 'not-done' };

    const res = window.VIPCore.addStar(p.reward, 'task:' + task.id);
    if (!res || !res.ok) return { ok: false, reason: (res && res.reason) || 'add-failed' };

    /* addStar 内部会重新读一次用户记录并写盘，这里重新取最新对象再标记领取 */
    const r2 = rec();
    if (r2) {
      const st2 = ensureTaskState(r2.u);
      st2[task.cycle].claimed[task.id] = true;
      save(r2.u);
    }

    if (typeof window.VipUI !== 'undefined' && typeof window.VipUI.refreshIfOpen === 'function') {
      try { window.VipUI.refreshIfOpen(); } catch (e) { /* 忽略 */ }
    }
    return { ok: true, reward: p.reward };
  }

  /* ---------- 独立签到 ---------- */
  function checkin() {
    const r = rec();
    if (!r) return { ok: false, reason: 'no-user' };
    const u = r.u;
    if (!isMember(u)) return { ok: false, reason: 'not-member' };

    const st = ensureTaskState(u);
    const today = dailyKey(new Date());
    if (st.checkin.date === today) return { ok: false, reason: 'already' };

    st.checkin.date = today;
    st.checkin.monthCount += 1;
    /* 【修复】必须先把签到日期落盘，再调用 addStar：
       addStar 内部会重新从用户库读一份记录并写盘，如果这里只改内存不保存，
       签到状态会被 addStar 写回的那一份旧快照覆盖，导致「今天已签到」判断永远为假。 */
    save(u);

    const res = window.VIPCore.addStar(CHECKIN_REWARD, 'checkin');
    if (!res || !res.ok) return { ok: false, reason: (res && res.reason) || 'add-failed' };

    /* 签到同时计入「每月签到 20 次」的进度 */
    const r2 = rec();
    if (r2) {
      const st2 = ensureTaskState(r2.u);
      st2.monthly.counters.checkin = st2.checkin.monthCount;
      save(r2.u);
    }

    if (typeof window.VipUI !== 'undefined' && typeof window.VipUI.refreshIfOpen === 'function') {
      try { window.VipUI.refreshIfOpen(); } catch (e) { /* 忽略 */ }
    }
    return { ok: true, reward: CHECKIN_REWARD };
  }

  function checkedInToday(u) {
    const st = ensureTaskState(u);
    return st.checkin.date === dailyKey(new Date());
  }

  /* ---------- 供 UI 渲染的视图数据 ---------- */
  function getView(u) {
    if (!u) {
      const r = rec();
      if (!r) return { member: false, groups: [], checkin: { done: false, reward: CHECKIN_REWARD } };
      u = r.u;
    }
    const st = ensureTaskState(u);

    const groups = CYCLES.map(cycle => {
      const box = st[cycle];
      const items = TASKS
        .filter(t => !(window.VipConfig && typeof window.VipConfig.isDisabled === 'function' && window.VipConfig.isDisabled(t.id)))
        .filter(t => t.cycle === cycle).map(t => {
        const p = eff(t);                       /* 【新增】云端配置优先 */
        const progress = Math.min(p.need, Number(box.counters[t.event]) || 0);
        return {
          id: t.id,
          need: p.need,
          reward: p.reward,
          progress,
          done: progress >= p.need,
          claimed: !!box.claimed[t.id]
        };
      });
      return { cycle, items };
    });

    return {
      member: isMember(u),
      groups,
      checkin: { done: checkedInToday(u), reward: CHECKIN_REWARD, monthCount: st.checkin.monthCount }
    };
  }

  window.VipTasks = {
    TRACK_EVENTS: ['suggest', 'search', 'themeShop', 'redeemPage', 'redeemUse', 'profileView', 'mailView', 'profileEdit', 'checkin'],
    TASKS, CHECKIN_REWARD, BASE_DAILY,
    track, claimTask, checkin, getView,
    grantBaseDaily, baseDailyOf,
    ensureTaskState, checkedInToday, keyOfCycle
  };
})();
