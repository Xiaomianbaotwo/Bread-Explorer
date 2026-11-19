/* =========================================================
   21-rain.js
   【新增】20261119：雨效（绿野仙踪 / 春日花信 / 盛夏海岸 / 秋日私语）
   - 每个自然日前端抽取一次：25% 下雨，75% 不下雨
   - 可调速度 / 风力 / 风向 / 雨滴频率，并支持强制预览
   - 盛夏海岸下雨时 50% 概率进入雷阵雨：一道或两道闪电 + 雷声音效
   - 网页声音开关统一控制雨声 / 雷声；白天闪电增加深色描边与更强的冷色闪光
   - 雨线用 Canvas 绘制，不使用 emoji 代替雨滴
   - 设置写入 bread_preferences.settings，日抽签状态只放本地
   ========================================================= */
(function () {
  const STYLE = {
    forest: {
      lightColor: '42, 92, 78', darkColor: '176, 238, 214',
      lightAlpha: 0.52, darkAlpha: 0.40, speed: 1.0, density: 1.05, len: 1.0
    },
    spring: {
      lightColor: '48, 88, 132', darkColor: '184, 222, 255',
      lightAlpha: 0.50, darkAlpha: 0.38, speed: 0.95, density: 1.0, len: 0.95
    },
    summer: {
      lightColor: '34, 92, 124', darkColor: '172, 235, 255',
      lightAlpha: 0.55, darkAlpha: 0.42, speed: 1.12, density: 1.18, len: 1.08
    },
    autumn: {
      lightColor: '74, 92, 116', darkColor: '204, 220, 242',
      lightAlpha: 0.52, darkAlpha: 0.37, speed: 0.96, density: 0.98, len: 0.96
    }
  };

  const DEFAULT = { speed: 1, wind: 0.5, dir: 'right', density: 1, force: false, sound: true };
  const MAX_DROPS = 420;
  const MAX_SPLASHES = 48;
  const MAX_WIND_PX = 900;

  /* 【新增】20261119：雷声音效配置。
     替换自己的音效有两种方式：
       1) 直接覆盖 assets/audio/thunder.mp3（推荐，文件名不变）；
       2) 改 THUNDER_AUDIO_SRC 指向新文件。
     换文件后把 ?v= 后面的版本号改一下，避免浏览器继续用旧缓存。 */
  /* 【修改】20261119：允许子站覆盖音频路径。
     主站仍使用 assets/audio/...；bread-ai 子站会通过 window.__BB_RAIN_*__ 指回 ../assets/audio/...。 */
  const THUNDER_AUDIO_SRC = window.__BB_RAIN_THUNDER_SRC__ || 'assets/audio/thunder.mp3?v=20261119-thunder1';
  const THUNDER_VOLUME = 0.55;

  /* 【新增】20261119：雨声环境音。开关打开且正在下雨时循环播放。 */
  const RAIN_AUDIO_SRC = window.__BB_RAIN_AUDIO_SRC__ || 'assets/audio/rain-loop.mp3?v=20261119-rain1';
  const RAIN_VOLUME = 0.22;

  let canvas = null;
  let ctx = null;
  let raf = 0;
  let running = false;
  let family = null;
  let drops = [];
  let splashes = [];
  let lastTs = 0;
  let settings = { ...DEFAULT };

  let thunder = false;
  let bolts = [];
  let nextBoltAt = 0;
  let secondStrikeAt = 0;
  let flash = 0;
  let thunderAudio = null;
  let rainAudio = null;
  let soundGestureBound = false;

  function clamp(v, min, max, fallback) {
    const n = Number(v);
    return isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }

  function getUser() {
    try {
      if (!currentUser) return null;
      const users = getUsersDB();
      return users[currentUser] || null;
    } catch (e) { return null; }
  }

  function persistLocal() {
    try {
      if (!currentUser) return;
      const users = getUsersDB();
      store.set('bb-users', users, { skipCloud: true });
    } catch (e) { /* 本地存储失败不阻断雨效 */ }
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function refreshDaily(u) {
    if (!u) return true;
    const day = todayKey();
    if (u.rainDay !== day) {
      u.rainDay = day;
      u.rainActive = Math.random() < 0.25;
      persistLocal();
    }
    return !!u.rainActive;
  }

  function readSettings(u) {
    if (!u) {
      settings = { ...DEFAULT };
      return;
    }
    settings.speed = clamp(u.rainSpeed, 0.2, 25, DEFAULT.speed);
    settings.wind = clamp(u.rainWind, 0, 25, DEFAULT.wind);
    settings.density = clamp(u.rainDensity, 0.2, 25, DEFAULT.density);
    settings.dir = u.rainDir === 'left' ? 'left' : 'right';
    settings.force = !!u.rainForce;
    /* 【修改】20261119：声音开关默认开启，保留原来的雷声体验；用户可随时关掉。 */
    settings.sound = u.rainSound === undefined ? DEFAULT.sound : !!u.rainSound;
  }

  function shouldRain(u) {
    if (!u) return true;
    if (settings.force) return true;
    return refreshDaily(u);
  }

  function detectFamily() {
    const key = currentTheme || '';
    /* 【修改】20261119：雨效只对 Plus / Max / Ultimate 开放；基础版不触发。 */
    if (!/-(plus|max|ultimate)$/.test(key)) return null;
    if (/^forest-(plus|max|ultimate)$/.test(key)) return 'forest';
    let meta = null;
    try { meta = (typeof THEMES !== 'undefined' && THEMES) ? THEMES[key] : null; } catch (e) { meta = null; }
    if (meta && (meta.season === 'spring' || meta.season === 'summer' || meta.season === 'autumn')) {
      return meta.season;
    }
    return null;
  }

  function styleNow() {
    return STYLE[family] || STYLE.summer;
  }

  function tierMult() {
    const key = currentTheme || '';
    if (key.endsWith('-ultimate')) return 1.3;
    if (key.endsWith('-max')) return 1.15;
    if (key.endsWith('-plus')) return 1.0;
    return 0.85;
  }

  function isDark() {
    return !!(document.body && document.body.classList.contains('dark'));
  }

  function densityScale() {
    // 【性能保护】滑块到 25 时不是线性 25 倍，而是约 5 倍，再配合数量上限。
    return Math.pow(settings.density, 0.5);
  }

  function speedScale() {
    // 【性能保护】避免 25 倍速度让雨线一帧穿过屏幕、看起来像闪烁。
    return Math.pow(settings.speed, 0.45);
  }

  function windPixels() {
    return Math.min(MAX_WIND_PX, 140 * Math.pow(Math.max(0, settings.wind), 0.8));
  }

  function dropCount() {
    const w = window.innerWidth;
    const base = (70 + w / 26) * styleNow().density * tierMult() * densityScale();
    return Math.max(35, Math.min(MAX_DROPS, Math.round(base)));
  }

  function resize() {
    if (!canvas) return;
    const dpr = Math.min(1.75, window.devicePixelRatio || 1);
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
    canvas.id = 'rainLayer';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function makeDrop(w, h, fromTop) {
    const style = styleNow();
    const vy = (520 + Math.random() * 360) * style.speed * speedScale();
    const windPx = windPixels();
    const dirSign = settings.dir === 'left' ? -1 : 1;
    return {
      x: Math.random() * w,
      y: fromTop ? (-10 - Math.random() * h * 0.3) : (Math.random() * h),
      vy,
      vx: dirSign * (Math.random() * 70 + windPx),
      len: (8 + Math.random() * 18) * style.len,
      alpha: 0.34 + Math.random() * 0.30
    };
  }

  function seedDrops() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const count = dropCount();
    drops = [];
    for (let i = 0; i < count; i++) drops.push(makeDrop(w, h, false));
    splashes = [];
  }

  function resetDrop(d, w, h) {
    const nd = makeDrop(w, h, true);
    d.x = nd.x;
    d.y = nd.y;
    d.vy = nd.vy;
    d.vx = nd.vx;
    d.len = nd.len;
    d.alpha = nd.alpha;
  }

  function addSplash(x) {
    if (splashes.length >= MAX_SPLASHES) return;
    splashes.push({
      x,
      life: 0.38,
      max: 0.38,
      r: 2 + Math.random() * 4
    });
  }

  function makeBolt(w, h) {
    const points = [];
    const startX = 18 + Math.random() * (w - 36);
    const startY = -24;
    const endY = h * (0.38 + Math.random() * 0.42);
    let x = startX;
    const segs = 9 + Math.floor(Math.random() * 5);
    for (let i = 0; i <= segs; i++) {
      const p = i / segs;
      const y = startY + (endY - startY) * p;
      if (i > 0) {
        x += (Math.random() - 0.5) * (w * 0.055);
        x = Math.max(8, Math.min(w - 8, x));
      }
      points.push([x, y]);
    }
    return { points, life: 0.30, max: 0.30, width: 1.4 + Math.random() * 2.0 };
  }

  function ensureRainAudio() {
    if (!rainAudio) {
      rainAudio = new Audio(RAIN_AUDIO_SRC);
      rainAudio.preload = 'auto';
      rainAudio.loop = true;
      rainAudio.volume = RAIN_VOLUME;
    }
    return rainAudio;
  }

  function bindSoundGesture() {
    /* 【新增】20261119：浏览器自动播放策略会拦截未交互页面的音频。
       用户第一次点击/触摸页面后，再尝试启动雨声；只绑定一次。 */
    if (soundGestureBound) return;
    soundGestureBound = true;
    const retry = () => {
      soundGestureBound = false;
      if (settings.sound && running) startRainSound();
    };
    document.addEventListener('pointerdown', retry, { once: true, passive: true });
  }

  function startRainSound() {
    if (!settings.sound || document.hidden || !running) return;
    try {
      const a = ensureRainAudio();
      if (!a.paused) return;
      const p = a.play();
      if (p && typeof p.catch === 'function') p.catch(() => bindSoundGesture());
    } catch (e) { bindSoundGesture(); }
  }

  function stopRainSound() {
    if (!rainAudio || rainAudio.paused) return;
    try { rainAudio.pause(); } catch (e) { /* 忽略音频停止失败 */ }
  }

  function stopThunderSound() {
    if (!thunderAudio) return;
    try {
      thunderAudio.pause();
      thunderAudio.currentTime = 0;
    } catch (e) { /* 忽略音频停止失败 */ }
  }

  function applySoundState() {
    if (settings.sound && running) {
      startRainSound();
    } else {
      stopRainSound();
      stopThunderSound();
    }
  }

  function playThunder() {
    if (!settings.sound || document.hidden) return;
    try {
      if (!thunderAudio) {
        thunderAudio = new Audio(THUNDER_AUDIO_SRC);
        thunderAudio.preload = 'auto';
        thunderAudio.volume = THUNDER_VOLUME;
      }
      thunderAudio.currentTime = 0;
      const p = thunderAudio.play();
      if (p && typeof p.catch === 'function') p.catch(() => { bindSoundGesture(); });
    } catch (e) { /* 音效不可用时保留视觉闪电 */ }
  }

  function triggerLightning(w, h, now) {
    bolts.push(makeBolt(w, h));
    /* 【修改】20261119：白天背景亮，闪电整体压暗/描边后再提亮；
       因此白天的全屏闪光也要比夜间更强，否则几乎看不出来。 */
    flash = Math.max(flash, isDark() ? 0.20 : 0.46);
    playThunder();
    // 【新增】有时一道、有时两道：第一道之后 220~600ms 可能再补一道。
    if (Math.random() < 0.45) secondStrikeAt = now + 220 + Math.random() * 380;
    // 【修改】20261119：雷阵雨内的闪电间隔缩短一些，让“雷多一点”。
    nextBoltAt = now + 2800 + Math.random() * 3200;
  }

  function traceBolt(b) {
    ctx.beginPath();
    ctx.moveTo(b.points[0][0], b.points[0][1]);
    for (let i = 1; i < b.points.length; i++) ctx.lineTo(b.points[i][0], b.points[i][1]);
  }

  function drawBolts(now, dt, w, h) {
    if (!thunder) return;

    if (!nextBoltAt) nextBoltAt = now + 2500 + Math.random() * 2500;
    if (now >= nextBoltAt) triggerLightning(w, h, now);

    if (secondStrikeAt && now >= secondStrikeAt) {
      secondStrikeAt = 0;
      bolts.push(makeBolt(w, h));
      /* 【修改】20261119：第二道闪电在白天也要更明显。 */
      flash = Math.max(flash, isDark() ? 0.16 : 0.34);
    }

    const dark = isDark();
    for (const b of bolts) {
      b.life -= dt;
      const alpha = Math.max(0, b.life / b.max);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (!dark) {
        /* 【修改】20261119：白天闪电不够明显。
           先画一层深蓝粗描边，让白色闪电在浅色背景上有轮廓；
           再画暖白高亮核心，并加大阴影光晕。 */
        ctx.strokeStyle = `rgba(18, 46, 88, ${alpha * 0.88})`;
        ctx.lineWidth = b.width + 4.2;
        ctx.shadowColor = 'rgba(12, 30, 62, 0.40)';
        ctx.shadowBlur = 10;
        traceBolt(b);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 238, ${Math.min(1, alpha * 1.25)})`;
        ctx.lineWidth = Math.max(1.2, b.width * 0.9);
        ctx.shadowColor = 'rgba(255, 250, 220, 0.95)';
        ctx.shadowBlur = 24;
        traceBolt(b);
        ctx.stroke();
      } else {
        ctx.strokeStyle = `rgba(215, 240, 255, ${alpha * 0.95})`;
        ctx.shadowColor = 'rgba(150, 210, 255, 0.85)';
        ctx.shadowBlur = 18;
        ctx.lineWidth = b.width;
        traceBolt(b);
        ctx.stroke();
      }
      ctx.restore();
    }
    bolts = bolts.filter(b => b.life > 0);

    if (flash > 0) {
      /* 【修改】20261119：白天闪光改成更明显的冷蓝白，夜间保持原来的柔和蓝光。 */
      ctx.fillStyle = dark
        ? `rgba(205, 230, 255, ${flash * 0.55})`
        : `rgba(142, 182, 255, ${flash * 0.62})`;
      ctx.fillRect(0, 0, w, h);
      flash -= dt * 1.25;
      if (flash < 0) flash = 0;
    }
  }

  function frame(ts) {
    if (!running || !ctx) return;
    const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016);
    lastTs = ts;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const style = styleNow();
    const dark = isDark();
    const color = dark ? style.darkColor : style.lightColor;
    const alphaBase = dark ? style.darkAlpha : style.lightAlpha;

    ctx.clearRect(0, 0, w, h);
    const target = dropCount();
    if (drops.length !== target) {
      seedDrops();
    }

    ctx.lineCap = 'round';
    for (const d of drops) {
      const oldY = d.y;
      d.y += d.vy * dt;
      d.x += d.vx * dt;

      if (d.y > h + 8 || d.x < -30 || d.x > w + 30) {
        if (oldY <= h) addSplash(Math.max(0, Math.min(w, d.x)));
        resetDrop(d, w, h);
        continue;
      }

      const mag = Math.hypot(d.vx, d.vy) || 1;
      const tailX = d.x - (d.vx / mag) * d.len;
      const tailY = d.y - (d.vy / mag) * d.len;
      ctx.strokeStyle = `rgba(${color}, ${Math.min(0.82, d.alpha * alphaBase * 1.9)})`;
      ctx.lineWidth = dark ? 1.15 : 1.45;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
    }

    for (const s of splashes) {
      s.life -= dt;
      const a = Math.max(0, s.life / s.max);
      ctx.strokeStyle = `rgba(${color}, ${a * (dark ? 0.45 : 0.58)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(s.x, h - 3, s.r * (1.4 - a * 0.4), s.r * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    splashes = splashes.filter(s => s.life > 0);

    drawBolts(ts, dt, w, h);

    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!family) family = detectFamily();
    if (!family) return;
    ensureCanvas();
    if (running) {
      if (drops.length !== dropCount()) seedDrops();
      return;
    }
    seedDrops();
    running = true;
    lastTs = 0;
    flash = 0;
    bolts = [];
    nextBoltAt = 0;
    secondStrikeAt = 0;
    startRainSound();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    lastTs = 0;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    drops = [];
    splashes = [];
    bolts = [];
    flash = 0;
    nextBoltAt = 0;
    secondStrikeAt = 0;
    stopRainSound();
    stopThunderSound();
    if (canvas) {
      canvas.remove();
      canvas = null;
      ctx = null;
    }
  }

  function stateText(u, active) {
    const el = document.getElementById('rainState');
    if (!el) return;
    if (!family) { el.textContent = ''; return; }
    let key = 'modals.rainStateOff';
    if (u && settings.force) key = 'modals.rainStatePreview';
    else if (u && active) key = 'modals.rainStateOn';
    else if (!u) key = 'modals.rainStateOn';
    if (typeof _loadT === 'function') {
      el.textContent = _loadT(key);
    } else {
      el.textContent = key === 'modals.rainStateOn' ? '今日有雨：雨效已开启'
        : key === 'modals.rainStatePreview' ? '强制预览中：雨效已开启'
        : '今日无雨：25% 概率下雨，可开启「强制下雨」预览';
    }
  }

  function sync(force) {
    const nextFamily = detectFamily();
    if (!nextFamily) {
      family = null;
      stop();
      const el = document.getElementById('rainState');
      if (el) el.textContent = '';
      return;
    }

    const u = getUser();
    readSettings(u);
    const changed = family !== nextFamily;
    family = nextFamily;
    const active = shouldRain(u);

    if (!active) {
      stop();
      stateText(u, false);
      return;
    }

    if (changed) {
      if (running) stop();
      thunder = (nextFamily === 'summer' && Math.random() < 0.5);
      start();
    } else if (!running) {
      // 从停止状态重新开雨时，夏季也重新抽一次 50% 雷阵雨。
      thunder = (nextFamily === 'summer' && Math.random() < 0.5);
      start();
    } else if (force) {
      // 只重排雨滴，不重开画布；雷阵雨状态保持不变。
      if (nextFamily !== 'summer') thunder = false;
      seedDrops();
      bolts = [];
      nextBoltAt = 0;
      secondStrikeAt = 0;
      flash = 0;
    }

    stateText(u, true);
    /* 【新增】20261119：主题中心打开 / 主题切换后，按最新开关恢复或停止声音。 */
    applySoundState();
  }

  /* 设置项变更：写本地 + 云端 preferences.settings，并立即应用 */
  document.addEventListener('change', (e) => {
    const id = e.target && e.target.id;
    if (!id || ['rainSpeed', 'rainWind', 'rainDir', 'rainDensity', 'rainForce', 'rainSound'].indexOf(id) < 0) return;
    if (!currentUser) return;
    const users = getUsersDB();
    const u = users[currentUser];
    if (!u) return;

    if (id === 'rainSpeed') u.rainSpeed = clamp(e.target.value, 0.2, 25, 1);
    if (id === 'rainWind') u.rainWind = clamp(e.target.value, 0, 25, 0.5);
    if (id === 'rainDir') u.rainDir = e.target.value === 'left' ? 'left' : 'right';
    if (id === 'rainDensity') u.rainDensity = clamp(e.target.value, 0.2, 25, 1);
    if (id === 'rainSound') u.rainSound = !!e.target.checked;
    if (id === 'rainForce') {
      u.rainForce = !!e.target.checked;
      /* 【修改】20261119：手动关闭强制下雨时，同时结束“今天的自动雨”。
         否则今日抽签结果仍是 rainActive=true，关掉开关后雨还会继续下。
         明天换日后 refreshDaily 会重新抽签。 */
      if (!u.rainForce) u.rainActive = false;
    }

    if (id === 'rainSpeed' || id === 'rainWind' || id === 'rainDensity') {
      const prop = id === 'rainSpeed' ? 'rainSpeed' : id === 'rainWind' ? 'rainWind' : 'rainDensity';
      e.target.value = Number(u[prop]).toFixed(1);
    }

    /* 【修改】20261119：雨效参数只写 preferences.settings，避免整行资产写入 */
    store.set('bb-users', users, { prefsOnly: true });

    /* 声音开关只影响音频，不重排雨滴/闪电；其它设置仍走 sync(true)。 */
    if (id === 'rainSound') {
      settings.sound = u.rainSound;
      applySoundState();
      return;
    }
    sync(true);
  });

  /* 【新增】20261119：页面隐藏时暂停雨声/雷声，回来后按开关恢复雨声。 */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopRainSound();
      stopThunderSound();
    } else if (settings.sound && running) {
      startRainSound();
    }
  });

  window.RainFX = { sync, refresh: sync, start, stop, isActive: () => running };
  setTimeout(sync, 0);
  window.addEventListener('load', sync);
})();
