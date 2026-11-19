/* =========================================================
   05-init.js
   面包 AI 子站启动入口
   ========================================================= */
(function () {
  'use strict';
  function start() {
    if (window.BAI && typeof window.BAI.boot === 'function') {
      window.BAI.boot();
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
