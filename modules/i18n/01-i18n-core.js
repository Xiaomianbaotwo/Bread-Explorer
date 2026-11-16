// modules/i18n/01-i18n-core.js —— 国际化内核：词条容器 / 取语言 / 应用翻译 / _loadT
// 【拆分自】原 js/16-i18n.js 的引擎部分，函数实现逐字保留
(() => {
  /* 若 i18next 本体没加载成功（例如 libs/ 没上传、CDN 被墙），
     直接退出，让 01-core.js 的占位 _loadT 继续兜底，避免整个文件抛异常连累后面的脚本。 */
  if (typeof i18next === 'undefined') {
    console.warn('⚠️ i18next 未加载，国际化已降级为占位模式');
    return;
  }
  const SUPPORTED_LANGS = ['zh', 'en'];
  const DEFAULT_LANG = 'zh';
  const STORAGE_KEY = 'bb-language';

  /* 【新增】词条容器：02~05 各模块文件往里挂自己的领域中英词条，
     06-i18n-init.js 再把 zh / en 整体交给 i18next */
  window.__BB_I18N = window.__BB_I18N || { zh: {}, en: {} };

  function getInitialLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    const browserLang = (navigator.language || '').slice(0, 2);
    if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;
    return DEFAULT_LANG;
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      // ★ 核心修复：强行屏蔽加载页的两个动态 ID，防止语言包覆盖进度条
      if (el.id === 'loadingPercent' || el.id === 'majorStageText') return;
      el.textContent = i18next.t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = i18next.t(el.getAttribute('data-i18n-title'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = i18next.t(el.getAttribute('data-i18n-placeholder'));
    });
    document.documentElement.lang = i18next.language;
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: i18next.language } }));
  }

  window.changeLanguage = function (lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    i18next.changeLanguage(lang, () => {
      localStorage.setItem(STORAGE_KEY, lang);
      applyTranslations();
      const sel = document.getElementById('langSelect');
      if (sel) sel.value = lang;
      /* 【新增】语言变更后把用户数据回传一次，settings.lang 会写进 bread_preferences，
         服务端定时任务（每日积分邮件等）据此决定用中文还是英文生成内容 */
      try {
        if (typeof currentUser !== 'undefined' && currentUser
            && typeof store !== 'undefined' && typeof getUsersDB === 'function') {
          store.set('bb-users', getUsersDB());
          store.set('bb-lang-synced', lang);  // 记录已同步的语言，loadUserData 里就不会重复写
        }
      } catch (e) { console.warn('[i18n] 语言偏好回传失败（不影响使用）', e); }
    });
  };

  /* 【新增】全局翻译入口 _loadT
     与 data-i18n 共用同一份 TRANSLATIONS，不引入第二套词表；
     支持 {{占位}} 插值：_loadT('redpacket.score', { count: 3 })
     词条缺失时回退中文，绝不把 "loading.ready" 这样的 key 直接显示给用户 */
  window._loadT = function (key, opts) {
    let txt = null;
    try { txt = i18next.t(key); } catch (e) { txt = null; }
    if (typeof txt !== 'string' || txt === '' || txt === key) {
      try { txt = i18next.t(key, { lng: DEFAULT_LANG }); } catch (e) { txt = null; }
    }
    if (typeof txt !== 'string' || txt === '') txt = key;
    if (opts) {
      for (const k in opts) {
        if (Object.prototype.hasOwnProperty.call(opts, k)) {
          txt = txt.split('{{' + k + '}}').join(String(opts[k]));
        }
      }
    }
    return txt;
  };

  window.t = (key, opts) => i18next.t(key, opts);
  window.getLang = () => i18next.language || DEFAULT_LANG;

  /* 【新增】供 06-i18n-init.js 复用的内部函数与常量 */
  window.__BB_I18N_CORE = { SUPPORTED_LANGS, DEFAULT_LANG, STORAGE_KEY, getInitialLang, applyTranslations };
})();
