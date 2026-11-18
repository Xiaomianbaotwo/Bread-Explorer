/* =========================================================
   modules/vip-level/js/06-vip-config.js
   【新增】20261118：让两张配置表真正生效

   背景：vip_task_config 与 vip_level_reward_config 早就建好了，但一直没有任何代码读它们
         —— 改表不改变任何规则，属于「空转的配置表」。
   本文件把这两张表接成真正的配置源：
     1. vip_task_config          → 任务名 / 说明（中英）/ 需要次数 / 奖励星光值
     2. vip_level_reward_config  → 等级礼包（Plus / Max 名额、每日额外积分、全套解锁、新春主题）

   容错原则：
     * 表不存在、没开读权限、断网 → 直接回落到代码里的默认值（02 / 04 里的硬编码），
       界面不会因为读配置失败而白屏或报错；
     * 读到的配置会缓存到 localStorage，下次开页面先用缓存渲染，再后台静默刷新。
   ========================================================= */

(() => {
  const CACHE_KEY = 'bb-vip-config-cache';
  const CACHE_TTL = 10 * 60 * 1000;   /* 10 分钟内不重复请求 */

  let taskRows = [];      /* vip_task_config 原始行 */
  let rewardRows = [];    /* vip_level_reward_config 原始行 */
  let taskMap = {};       /* task_id -> 行，便于 O(1) 取 */
  let rewardTable = null; /* 组装成 { vip: {lv: cfg}, svip: {lv: cfg} } */
  let loadedAt = 0;
  let loading = null;

  /* ---------- 缓存 ---------- */
  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') return null;
      return obj;
    } catch (e) { return null; }
  }

  function writeCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        at: Date.now(), tasks: taskRows, rewards: rewardRows
      }));
    } catch (e) { /* 忽略配额问题 */ }
  }

  /* ---------- 任务表 → Map ---------- */
  function indexTasks() {
    taskMap = {};
    taskRows.forEach(r => {
      if (!r || !r.task_id) return;
      taskMap[r.task_id] = r;          /* 停用的任务也保留，交给 isDisabled 判断 */
    });
  }

  /* 表里把 enabled 设成 false → 该任务在面板上隐藏 */
  function isDisabled(id) {
    const row = taskMap[id];
    return !!(row && row.enabled === false);
  }

  /* ---------- 奖励表 → REWARDS 结构 ----------
     每一行 = 某个身份某等级的一「封」邮件（一个等级可以拆成多行，用 part_index 排序） */
  function buildRewardTable() {
    const out = { vip: {}, svip: {} };
    let count = 0;

    rewardRows.forEach(r => {
      if (!r || r.enabled === false) return;
      const mt = (r.member_type === 'svip') ? 'svip' : 'vip';
      const lv = Number(r.level);
      if (!lv) return;

      const part = {};
      if (Number(r.plus_pick) > 0)  part.plusPick = Number(r.plus_pick);
      if (Number(r.max_pick) > 0)   part.maxPick = Number(r.max_pick);
      if (Number(r.daily_bonus) > 0) part.dailyBonus = Number(r.daily_bonus);
      if (r.all_base === true)      part.allBase = true;
      if (r.all_plus === true)      part.allPlus = true;
      if (r.all_max === true)       part.allMax = true;
      if (r.spring_theme === true)  part.springTheme = true;
      if (r.stage)                  part.stage = r.stage;
      if (r.label_zh || r.label_en) part.label = r.label_zh || r.label_en;

      /* 一行都没有实际内容就跳过，避免发出空邮件 */
      if (!Object.keys(part).length) return;

      if (!out[mt][lv]) out[mt][lv] = { _parts: [] };
      out[mt][lv]._parts.push({ idx: Number(r.part_index) || 0, part });
      count += 1;
    });

    /* 一个等级只有 1 封 → 直接用该封；多封 → 包成 mails 数组（和 04 里的结构保持一致） */
    ['vip', 'svip'].forEach(mt => {
      Object.keys(out[mt]).forEach(k => {
        const item = out[mt][k];
        item._parts.sort((a, b) => a.idx - b.idx);
        const parts = item._parts.map(p => p.part);
        out[mt][k] = (parts.length === 1) ? parts[0] : { mails: parts };
      });
    });

    rewardTable = count ? out : null;
    return rewardTable;
  }

  /* ---------- 对外：任务配置 ---------- */
  function task(id) {
    const row = taskMap[id];
    if (!row) return null;
    return {
      need: Number(row.need_count) > 0 ? Number(row.need_count) : null,
      reward: Number(row.reward_point) >= 0 ? Number(row.reward_point) : null,
      nameZh: row.task_name_zh || '',
      nameEn: row.task_name_en || '',
      descZh: row.task_desc_zh || '',
      descEn: row.task_desc_en || '',
      event: row.track_event || null
    };
  }

  /* 取任务文案（按当前语言，缺一边就回落到另一边） */
  function taskText(id, field) {
    const c = task(id);
    if (!c) return null;
    const lang = (typeof getLang === 'function') ? getLang() : 'zh';
    if (field === 'name') return (lang === 'en') ? (c.nameEn || c.nameZh) : (c.nameZh || c.nameEn);
    return (lang === 'en') ? (c.descEn || c.descZh) : (c.descZh || c.descEn);
  }

  /* ---------- 对外：奖励配置 ---------- */
  function rewards() { return rewardTable; }

  /* 某个身份某等级的一封/多封配置（没有就返回 null，交给代码默认值） */
  function rewardAt(memberType, level) {
    if (!rewardTable) return null;
    const mt = (memberType === 'svip') ? 'svip' : 'vip';
    return rewardTable[mt] && rewardTable[mt][level] ? rewardTable[mt][level] : null;
  }

  /* ---------- 加载 ---------- */
  function applyAll() {
    indexTasks();
    buildRewardTable();

    /* 通知其它模块：任务与礼包配置更新了 */
    if (typeof window.VipReward !== 'undefined' && typeof window.VipReward.applyConfig === 'function') {
      try { window.VipReward.applyConfig(rewardTable); } catch (e) { /* 忽略 */ }
    }
    if (typeof window.VipUI !== 'undefined' && typeof window.VipUI.refreshIfOpen === 'function') {
      try { window.VipUI.refreshIfOpen(); } catch (e) { /* 忽略 */ }
    }
    /* 【新增】20261118：面包等级任务配置更新后，通知面板重算 */
    if (typeof window.UserLevel !== 'undefined' && typeof window.UserLevel.refreshTasks === 'function') {
      try { window.UserLevel.refreshTasks(); } catch (e) { /* 忽略 */ }
    }
  }

  function load(force) {
    if (loading) return loading;
    if (!force && loadedAt && (Date.now() - loadedAt) < CACHE_TTL) return Promise.resolve(rewardTable);

    loading = Promise.all([
      sb.from('vip_task_config').select('*'),
      sb.from('vip_level_reward_config').select('*')
    ]).then(([t, r]) => {
      let ok = false;
      if (t && !t.error && Array.isArray(t.data) && t.data.length) {
        taskRows = t.data; ok = true;
      }
      if (r && !r.error && Array.isArray(r.data) && r.data.length) {
        rewardRows = r.data; ok = true;
      }
      if (!ok) {
        /* 两张表都读不到（未建表 / 无读权限）→ 保持默认值，只打一条日志 */
        console.warn('[VIP] 配置表读取失败，继续使用代码内默认值',
          (t && t.error && t.error.message), (r && r.error && r.error.message));
      }
      loadedAt = Date.now();
      if (ok) writeCache();
      applyAll();
      return rewardTable;
    }).catch(err => {
      console.warn('[VIP] 配置表请求异常，继续使用代码内默认值', err && err.message);
      return rewardTable;
    }).finally(() => { loading = null; });

    return loading;
  }

  /* ---------- 启动：先吃缓存，再后台刷新 ---------- */
  function boot() {
    const cache = readCache();
    if (cache) {
      if (Array.isArray(cache.tasks)) taskRows = cache.tasks;
      if (Array.isArray(cache.rewards)) rewardRows = cache.rewards;
      loadedAt = Number(cache.at) || 0;
      applyAll();
    }
    /* 缓存过期或没有缓存时立刻拉取；有缓存也静默刷新一次 */
    load(false);
  }

  window.VipConfig = {
    load, task, taskText, isDisabled, rewards, rewardAt,

    get loaded() { return !!loadedAt; },
    /* 调试用：清掉缓存重新拉 */
    clearCache() { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} loadedAt = 0; return load(true); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
