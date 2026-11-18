/* =========================================================
   modules/bread-level/js/02-bread-config.js
   【新增】20261119：面包等级的云端配置读取（独立于 VIP 模块）

   数据源只有一张表：public.bread_task_config
     - 8 个任务（daily / weekly）
     - 1 个每日签到行（task_id = bread_checkin，reward_bake 就是签到烘焙度）

   为什么独立成一坨：
     面包等级和 VIP 是两套体系，配置表也分开（vip_task_config / bread_task_config），
     读取逻辑就跟着分开放，避免「改面包配置还要翻 VIP 的代码」。

   容错：
     表不存在 / 没读权限 / 断网 → 返回 null，调用方回落到代码里的默认任务；
     读到就缓存 localStorage，先渲染缓存再静默刷新。
   ========================================================= */

(() => {
  const CACHE_KEY = 'bb-bread-config-cache';
  const CACHE_TTL = 10 * 60 * 1000;   /* 10 分钟 */

  let rows = [];
  let loadedAt = 0;
  let loading = null;

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !Array.isArray(obj.rows)) return null;
      return obj;
    } catch (e) { return null; }
  }

  function writeCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rows: rows }));
    } catch (e) { /* 忽略配额 */ }
  }

  /* ---------- 任务列表：字段对齐 01-user-level.js 里的 DEFAULT_TASKS ---------- */
  function tasks() {
    const list = rows.filter(r => r && r.task_id);
    if (!list.length) return null;

    const out = [];
    list.forEach(r => {
      if (!r.task_id) return;
      if (r.task_id === 'bread_checkin') return;      /* 签到单独处理 */
      if (r.enabled === false) return;
      const need = Number(r.need_count);
      const bake = Number(r.reward_bake);
      if (!(need > 0) || !(bake > 0)) return;
      out.push({
        id: r.task_id,
        /* 表里用 daily / weekly / monthly，前端内部用 day / week / month
           【修改】20261119：新增每月任务（monthly 映射为 month） */
        cycle: (r.task_cycle === 'monthly' || r.task_cycle === 'month') ? 'month'
          : ((r.task_cycle === 'weekly' || r.task_cycle === 'week') ? 'week' : 'day'),
        event: r.track_event || null,
        need: need,
        bake: bake,
        nameZh: r.task_name_zh || '',
        nameEn: r.task_name_en || '',
        enabled: true
      });
    });
    return out.length ? out : null;
  }

  /* ---------- 每日签到：reward_bake = 每次签到的烘焙度 ---------- */
  function checkin() {
    const row = rows.find(r => r && r.task_id === 'bread_checkin');
    if (!row) return null;
    return {
      bake: Number(row.reward_bake) > 0 ? Number(row.reward_bake) : 0,
      enabled: row.enabled !== false
    };
  }

  /* ---------- 任务文案：表里填了就用表里的，没填回落到 i18n ---------- */
  function taskText(id, field) {
    const row = rows.find(r => r && r.task_id === id);
    if (!row) return null;
    const lang = (typeof getLang === 'function') ? getLang() : 'zh';
    if (field === 'name') {
      return (lang === 'en') ? (row.task_name_en || row.task_name_zh) : (row.task_name_zh || row.task_name_en);
    }
    return (lang === 'en') ? (row.task_desc_en || row.task_desc_zh) : (row.task_desc_zh || row.task_desc_en);
  }

  /* ---------- 拉取 ---------- */
  function load(force) {
    if (typeof sb === 'undefined' || !sb) return Promise.resolve(null);
    if (loading) return loading;
    if (!force && loadedAt && (Date.now() - loadedAt) < CACHE_TTL) return Promise.resolve(rows);

    loading = sb.from('bread_task_config').select('*')
      .then(({ data, error }) => {
        if (!error && Array.isArray(data) && data.length) {
          rows = data;
          loadedAt = Date.now();
          writeCache();
          try {
            if (window.UserLevel && typeof window.UserLevel.refreshTasks === 'function') window.UserLevel.refreshTasks();
          } catch (e) { /* 忽略 */ }
        } else if (error) {
          console.warn('[BreadLevel] 配置表读取失败，使用代码内默认值', error.message);
        }
        return rows;
      })
      .catch(err => {
        console.warn('[BreadLevel] 配置请求异常，使用代码内默认值', err && err.message);
        return rows;
      })
      .finally(() => { loading = null; });

    return loading;
  }

  function boot() {
    const cache = readCache();
    if (cache) {
      rows = cache.rows;
      loadedAt = Number(cache.at) || 0;
      try {
        if (window.UserLevel && typeof window.UserLevel.refreshTasks === 'function') window.UserLevel.refreshTasks();
      } catch (e) { /* 忽略 */ }
    }
    load(false);
  }

  window.BreadConfig = {
    load,
    tasks,
    taskText,
    checkin,
    get rows() { return rows; },
    get loaded() { return !!loadedAt; }
  };

  boot();
})();
