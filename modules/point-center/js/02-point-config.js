/* =========================================================
   modules/point-center/js/02-point-config.js
   积分中心 · 云端配置（可选）

   读 Supabase 的 point_task_config 表；表不存在 / 读不到时
   自动回落到 01-point-core.js 里的 P_DEFAULT_TASKS 与 P_CHECKIN。
   改任务难度只改表（need_count / reward_point / enabled），不用改前端。
   ========================================================= */

(() => {
  const CACHE_KEY = 'bb-point-config-cache';
  const CACHE_TTL = 10 * 60 * 1000;

  const state = { tasks: [], checkin: null, events: null, loadedAt: 0, loading: null };

  function rowsOf(data) { return Array.isArray(data) ? data.filter(r => r && r.task_id) : []; }

  function toTask(r) {
    return {
      id: String(r.task_id),
      /* 【修改】20261119：支持每月任务 */
      cycle: (r.task_cycle === 'monthly' || r.task_cycle === 'month') ? 'month'
        : ((r.task_cycle === 'week' || r.task_cycle === 'weekly') ? 'week' : 'day'),
      event: String(r.task_event || ''),
      need: Math.max(1, Number(r.need_count) || 1),
      points: Math.max(0, Number(r.reward_point) || 0),
      enabled: r.enabled !== false
    };
  }

  function apply(data) {
    const rows = rowsOf(data);
    if (!rows.length) return;
    /* 【新增】20261119：活动日行（task_id = event_calendar）
       task_event 写日期 CSV（2026-12-25,2026-12-31），need_count 写倍率（2 = 双倍） */
    const evRow = rows.find(r => String(r.task_id) === 'event_calendar');
    if (evRow) {
      const dates = String(evRow.task_event || '').split(/[,，\s]+/).filter(s => /^\d{4}-\d{2}-\d{2}$/.test(s));
      state.events = { dates, mult: Math.max(1, Number(evRow.need_count) || 2) };
    }
    /* 补签消耗行（task_id = makeup_card，reward_point = 一次要花的积分） */
    const mkRow = rows.find(r => String(r.task_id) === 'makeup_card');

    const tasks = rows.filter(r => {
      const id = String(r.task_id);
      return id.indexOf('checkin') < 0 && id !== 'event_calendar' && id !== 'makeup_card';
    }).map(toTask);
    const chk = rows.find(r => String(r.task_id).indexOf('checkin') >= 0);
    if (tasks.length) state.tasks = tasks;
    if (chk || mkRow) {
      const base = state.checkin || { points: P_CHECKIN.points, streak7: P_CHECKIN.streak7, streak30: P_CHECKIN.streak30, makeupCost: P_CHECKIN.makeupCost };
      state.checkin = {
        points: chk ? Math.max(0, Number(chk.reward_point) || P_CHECKIN.points) : base.points,
        streak7: chk ? Math.max(0, Number(chk.reward_point_7) || P_CHECKIN.streak7) : base.streak7,
        streak30: chk ? Math.max(0, Number(chk.reward_point_30) || P_CHECKIN.streak30) : base.streak30,
        makeupCost: mkRow ? Math.max(1, Number(mkRow.reward_point) || P_CHECKIN.makeupCost) : (base.makeupCost || P_CHECKIN.makeupCost)
      };
    }
  }

  function readCache() {
    try { return store.get(CACHE_KEY, null); } catch (e) { return null; }
  }
  function writeCache() {
    try {
      store.set(CACHE_KEY, { at: Date.now(), tasks: state.tasks, checkin: state.checkin, events: state.events });
    } catch (e) { /* 忽略 */ }
  }

  function load(force) {
    if (state.loading) return state.loading;
    if (!force && state.loadedAt && (Date.now() - state.loadedAt) < CACHE_TTL) return Promise.resolve();
    if (typeof sb === 'undefined' || !sb.from) return Promise.resolve();

    state.loading = sb.from('point_task_config').select('*')
      .then(res => {
        if (res && !res.error && Array.isArray(res.data) && res.data.length) {
          apply(res.data);
          state.loadedAt = Date.now();
          writeCache();
          try { if (window.PointCenter && window.PointCenter.refreshTasks) window.PointCenter.refreshTasks(); } catch (e) {}
        }
      })
      .catch(err => { console.warn('[积分中心] 配置表读取失败，使用默认值', err && err.message); })
      .finally(() => { state.loading = null; });
    return state.loading;
  }

  function boot() {
    const cache = readCache();
    if (cache) {
      if (Array.isArray(cache.tasks) && cache.tasks.length) state.tasks = cache.tasks;
      if (cache.checkin) state.checkin = cache.checkin;
      if (cache.events) state.events = cache.events;   /* 【新增】活动日历缓存 */
      state.loadedAt = Number(cache.at) || 0;
    }
    load(false);
  }

  window.PointConfig = {
    load,
    /* 【修改】20261119：云端没配每月任务时自动补内置每月任务，保证「每月任务」分组一定在 */
    tasks: () => {
      const base = state.tasks.length ? state.tasks : P_DEFAULT_TASKS;
      if (base.some(t => t.cycle === 'month')) return base;
      return base.concat(P_DEFAULT_TASKS.filter(t => t.cycle === 'month'));
    },
    checkin: () => state.checkin || P_CHECKIN,
    events: () => state.events || null,      /* 【新增】活动日：{ dates: [], mult } */
    boot
  };

  boot();
})();
