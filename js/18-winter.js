/* =========================================================
   18-winter.js
   【新增】20261119：冬日雪境专用雪效
   - 只有 winter-plus / winter-max / winter-ultimate 启用
   - 每个自然日前端抽取一次：25% 下雪，75% 不下雪
   - 可调速度 / 风力 / 风向 / 雪花频率，并支持强制预览
   - 用 Canvas 画真实雪花，不使用 emoji 代替雪花
   ========================================================= */
(function () {
  const DEFAULT = { speed: 1, wind: 0.5, dir: 'right', density: 1, force: false };
  let canvas = null;
  let ctx = null;
  let raf = 0;
  let running = false;
  let flakes = [];
  let lastTs = 0;
  let settings = { ...DEFAULT };

  function getUser() {
    try {
      if (!currentUser) return null;
      const users = getUsersDB();
      return users[currentUser] || null;
    } catch (e) { return null; }
  }

  function isWinterFx() {
    return /^winter-(plus|max|ultimate)$/.test(currentTheme || '');
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function refreshDaily(u) {
    const day = todayKey();
    if (u.winterSnowDay !== day) {
      u.winterSnowDay = day;
      u.winterSnowActive = Math.random() < 0.25;
      try {
        const users = getUsersDB();
        users[currentUser] = u;
        store.set('bb-users', users, { skipCloud: true });
      } catch (e) { /* 本地存储失败不阻断雪效 */ }
    }
  }

  function readSettings(u) {
    const clamp = (v, min, max, fallback) => {
      const n = Number(v);
      return isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
    };
    settings.speed = clamp(u.winterSnowSpeed, 0.2, 25, DEFAULT.speed);
    settings.wind = clamp(u.winterSnowWind, 0, 25, DEFAULT.wind);
    settings.density = clamp(u.winterSnowDensity, 0.2, 25, DEFAULT.density);
    settings.dir = u.winterSnowDir === 'left' ? 'left' : 'right';
    settings.force = !!u.winterSnowForce;
  }

  function shouldSnow(u) {
    if (!u) return false;
    if (u.winterSnowForce) return true;
    refreshDaily(u);
    return !!u.winterSnowActive;
  }

  function resize() {
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'snowLayer';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function makeFlake(w, h, fromTop) {
    return {
      x: Math.random() * w,
      y: fromTop ? (-10 - Math.random() * 40) : (Math.random() * h),
      r: 0.7 + Math.random() * 2.8,
      vy: 18 + Math.random() * 70,
      sway: 0.5 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.32 + Math.random() * 0.55
    };
  }

  function seed() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    /* 【修改】20261119：密度上限放宽到 25，但用平方根压缩并设 700 粒上限，避免卡顿。 */
    const densityScale = Math.pow(settings.density, 0.5);
    const count = Math.max(20, Math.min(700, Math.round(130 * densityScale)));
    flakes = [];
    for (let i = 0; i < count; i++) flakes.push(makeFlake(w, h, false));
  }

  function frame(ts) {
    if (!running || !ctx) return;
    const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016);
    lastTs = ts;
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    const dirSign = settings.dir === 'left' ? -1 : 1;
    /* 【修改】20261119：速度 / 风力上限放宽到 25，但用幂函数压缩，避免雪花瞬移。 */
    const speedScale = Math.pow(settings.speed, 0.4);
    const windPx = Math.min(900, 42 * Math.pow(settings.wind, 0.8));

    for (const f of flakes) {
      f.phase += dt * 0.9;
      f.y += f.vy * speedScale * dt;
      f.x += (dirSign * windPx + Math.sin(f.phase) * f.sway * 9) * speedScale * dt;

      if (f.y > h + 12 || f.x < -24 || f.x > w + 24) {
        const nf = makeFlake(w, h, true);
        f.x = nf.x;
        f.y = nf.y;
        f.r = nf.r;
        f.vy = nf.vy;
        f.sway = nf.sway;
        f.phase = nf.phase;
        f.alpha = nf.alpha;
      }

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 251, 255, ${f.alpha})`;
      ctx.fill();
    }

    raf = requestAnimationFrame(frame);
  }

  function start() {
    ensureCanvas();
    if (running) {
      const densityScale = Math.pow(settings.density, 0.5);
      const target = Math.max(20, Math.min(700, Math.round(130 * densityScale)));
      if (flakes.length !== target) seed();
      return;
    }
    seed();
    running = true;
    lastTs = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    lastTs = 0;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    flakes = [];
    if (canvas) {
      canvas.remove();
      canvas = null;
      ctx = null;
    }
  }

  function stateText(u) {
    const el = document.getElementById('winterSnowState');
    if (!el) return;
    if (!isWinterFx()) { el.textContent = ''; return; }
    let key = 'modals.winterSnowOff';
    if (u && u.winterSnowForce) key = 'modals.winterSnowPreview';
    else if (u && u.winterSnowActive) key = 'modals.winterSnowOn';
    if (typeof _loadT === 'function') {
      el.textContent = _loadT(key);
    } else {
      el.textContent = key === 'modals.winterSnowOn' ? '今日有雪：雪效已开启'
        : key === 'modals.winterSnowPreview' ? '强制预览中：雪效已开启'
        : '今日无雪：25% 概率下雪，可开启「强制下雪」预览';
    }
  }

  function sync() {
    const u = getUser();
    if (!u || !isWinterFx()) { stateText(u); stop(); return; }
    readSettings(u);
    const snow = shouldSnow(u);
    stateText(u);
    if (snow) start();
    else stop();
  }

  /* 设置项变更：立即更新本地用户配置并重开雪效 */
  document.addEventListener('change', (e) => {
    const id = e.target && e.target.id;
    if (!id || ['winterSnowSpeed', 'winterSnowWind', 'winterSnowDir', 'winterSnowDensity', 'winterSnowForce'].indexOf(id) < 0) return;
    const users = getUsersDB();
    const u = users[currentUser];
    if (!u) return;
    if (id === 'winterSnowSpeed') u.winterSnowSpeed = Math.max(0.2, Math.min(25, Number(e.target.value) || 1));
    if (id === 'winterSnowWind') u.winterSnowWind = Math.max(0, Math.min(25, Number(e.target.value) || 0.5));
    if (id === 'winterSnowDir') u.winterSnowDir = e.target.value === 'left' ? 'left' : 'right';
    if (id === 'winterSnowDensity') u.winterSnowDensity = Math.max(0.2, Math.min(25, Number(e.target.value) || 1));
    if (id === 'winterSnowForce') u.winterSnowForce = !!e.target.checked;
    /* 【修改】20261119：雪效参数只写 preferences.settings，避免整行资产写入 */
    store.set('bb-users', users, { prefsOnly: true });
    sync();
  });

  window.WinterFX = { sync, refresh: sync, start, stop };
  setTimeout(sync, 0);
  window.addEventListener('load', sync);
})();
