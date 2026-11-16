// modules/i18n/06-i18n-init.js —— 把词条交给 i18next，并绑定语言选择器
// 【拆分自】原 js/16-i18n.js 的 i18next.init 段与 DOMContentLoaded 绑定，逐字保留
(() => {
  if (typeof i18next === 'undefined') return;
  const CORE = window.__BB_I18N_CORE || {};
  const DEFAULT_LANG = CORE.DEFAULT_LANG || 'zh';
  const getInitialLang = CORE.getInitialLang || (() => DEFAULT_LANG);
  const applyTranslations = CORE.applyTranslations || (() => {});

  /* 【新增】把 02~05 分模块挂好的中英词条合成 i18next 需要的 resources 结构 */
  const parts = window.__BB_I18N || { zh: {}, en: {} };
  const TRANSLATIONS = { zh: { translation: parts.zh }, en: { translation: parts.en } };

  i18next.init({
    lng: getInitialLang(),
    fallbackLng: DEFAULT_LANG,
    resources: TRANSLATIONS,
    /* 【修复】initImmediate:false 让词典在本脚本执行时「同步」装配完成。
       默认值 true 会把装配推迟到下一个 setTimeout，导致 14-loading.js
       （排在后面执行）一上来调 _loadT 时词条还没装好，
       屏幕上会冒出 loading.loadedPercent / loading.guestMode 这类 key 串。 */
    initImmediate: false
  }, () => {
    window.__i18nReady = true;   // 【新增】给加载页 / 其它模块判断词典是否就绪
    applyTranslations();
    /* 【新增】加载页首帧的三个数字/阶段文案不在 [data-i18n] 覆盖范围内
       （它们由 14-loading.js 佯装进度时逐帧改写，applyTranslations 里的 skip 是为了防止被覆盖）。
       这里只做一次“初始化写法”，让英文界面在第一帧就不出现中文，之后仍由 14-loading 接管。 */
    if (i18next.language === 'en') {
      const pEl = document.getElementById('loadingPercent');
      const tEl = document.getElementById('loadingTimeLeft');
      const sEl = document.getElementById('majorStageText');
      try {
        if (pEl) pEl.textContent = i18next.t('loading.loadedPercent', { percent: 0 });
        if (tEl) tEl.textContent = i18next.t('loading.remainingTime', { sec: '18.0' });
        if (sEl) sEl.textContent = i18next.t('loading.currentStage', { stage: i18next.t('loading.stagePrepare') });
      } catch (e) {}
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('langSelect');
    if (sel) {
      sel.value = i18next.language || getInitialLang();
      sel.addEventListener('change', (e) => { window.changeLanguage(e.target.value); });
    }
  });
})();
