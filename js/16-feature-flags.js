/* =========================================================
   js/16-feature-flags.js
   内测功能开关（功能隔离层）
   【新增】整份文件为本轮新增
   【命名】沿用项目规则：取 js/ 目录现有最大编号 +1 = 16

   目的：
   1. 把「内测功能」统一登记在这里，界面入口 / 脚本能力 / 任务记账都读同一份开关；
   2. VIP 任务体系一律不接入内测功能（好友系统、查询天气工具），
      避免内测 bug 影响正式的任务与星光值结算；
   3. 侧边栏简易天气属于正式功能，不受这里控制。
   ========================================================= */

(() => {
  /* 开关清单：id -> { label, defaultOn, legacyKey }
     legacyKey：兼容既有的 localStorage 开关，保证老用户状态不丢
     【修改】20261117：面包气象台（含侧边天气卡片）已转正式功能，
     删除 beta_weather_query_tool 开关，这里只剩好友系统一个内测能力。 */
  const FLAGS = {
    beta_friend_system: {
      label: '好友系统（内测）',
      defaultOn: false,
      legacyKey: 'bb-show-beta'
    }
  };

  const KEY_PREFIX = 'bb-flag-';

  function getFlag(id) {
    const conf = FLAGS[id];
    if (!conf) return false;

    /* 1. 独立开关优先 */
    const own = localStorage.getItem(KEY_PREFIX + id);
    if (own === 'true') return true;
    if (own === 'false') return false;

    /* 2. 回落旧的统一测试开关（保持既有行为） */
    if (conf.legacyKey) {
      const legacy = localStorage.getItem(conf.legacyKey);
      if (legacy === 'true') return true;
      if (legacy === 'false') return false;
    }
    return conf.defaultOn;
  }

  function setFlag(id, on) {
    if (!FLAGS[id]) return false;
    localStorage.setItem(KEY_PREFIX + id, on ? 'true' : 'false');
    document.dispatchEvent(new CustomEvent('featureFlagChanged', { detail: { id, on: !!on } }));
    return true;
  }

  function list() {
    return Object.keys(FLAGS).map(id => ({ id, label: FLAGS[id].label, on: getFlag(id) }));
  }

  window.BB_FEATURES = { FLAGS, getFlag, setFlag, list, isEnabled: getFlag };
})();
