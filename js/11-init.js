/* =========================================================
   11-init.js
   ========================================================= */

let is12Hour = localStorage.getItem('bb-clock-12h') === 'true';
/* 【新增】20261119：问候语 / 心情短句是否跟随当前主题词库。 */
let homeTextFollowTheme = false;
try { homeTextFollowTheme = localStorage.getItem('bb-home-text-follow-theme') === '1'; } catch (e) { /* 忽略 */ }

window.updateHomeTextFollowTheme = function(val) {
  const next = !!val;
  const changed = next !== homeTextFollowTheme;
  homeTextFollowTheme = next;
  try { localStorage.setItem('bb-home-text-follow-theme', homeTextFollowTheme ? '1' : '0'); } catch (e) { /* 忽略 */ }
  renderHomePair(true);
  /* 【修改】20261119：切换开关后按新间隔（15 / 25 秒）重新排下一次切换。 */
  if (changed && homePairStarted) {
    homePairNextAt = 0;
    scheduleNextHomePair();
  }
};

window.updateClockFormat = function(val) {
  is12Hour = val;
  localStorage.setItem('bb-clock-12h', val);
  tick();
};

function tick() {
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();
  let s = now.getSeconds();

  let timeHtml = '';

  if (is12Hour) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    timeHtml = `<span style="font-size: 0.4em; vertical-align: baseline; margin-right: 12px; font-weight: 800;">${ampm}</span>` 
               + pad(h) + '<span class="colon">:</span>' + pad(m) + '<span class="colon">:</span>' + pad(s);
  } else {
    timeHtml = pad(h) + '<span class="colon">:</span>' + pad(m) + '<span class="colon">:</span>' + pad(s);
  }

  $('#clock').innerHTML = timeHtml;

  // ===== 日期（按当前语言） =====
  const lang = (typeof window.getLang === 'function') ? window.getLang() : 'zh';
  const wdKey = 'date.weekdays.' + now.getDay();
  let dateStr;

  if (typeof window.t === 'function') {
    const y = now.getFullYear();
    const mo = now.getMonth() + 1;
    const d = now.getDate();
    const base = window.t('date.year', { y: y, m: mo, d: d });
    const wd = window.t(wdKey);

    if (lang === 'en') {
      dateStr = base + ' · ' + wd;
    } else if (lang === 'ja') {
      dateStr = base + '（' + wd + '）';
    } else {
      dateStr = base + ' · 星期' + wd;
    }
  } else {
    dateStr = now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 · 星期' + '日一二三四五六'[now.getDay()];
  }

  $('#dateLine').textContent = dateStr;

  // ===== 问候语 / 心情短句：按时间段 + 15 / 25 秒同步轮换 =====
  renderHomePair(false);
}

let homePairPeriod = '';
let homePairGreeting = -1;
let homePairQuote = -1;
/* 【修改】20261119：切换间隔按“是否跟随主题”区分。
   不勾选：15 秒；勾选：25 秒。取整到 5 秒整点的规则保持不变。 */
const HOME_PAIR_INTERVAL_DEFAULT = 15000;
const HOME_PAIR_INTERVAL_THEME = 25000;
function homePairInterval() {
  return homeTextFollowTheme ? HOME_PAIR_INTERVAL_THEME : HOME_PAIR_INTERVAL_DEFAULT;
}
const HOME_SWITCH_GUARD = 80;
const HOME_DELETE_STEP = 20;
const HOME_TYPE_STEP = 34;
const HOME_SWITCH_PAUSE = 90;
let homeAnimToken = 0;

function homePeriodForHour(hour) {
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 12) return 'forenoon';
  if (hour >= 12 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function homeLangCode() {
  try {
    if (typeof window.getLang === 'function') {
      const lang = window.getLang();
      if (lang) return String(lang).toLowerCase().startsWith('en') ? 'en' : 'zh';
    }
    const saved = localStorage.getItem('bb-language') || '';
    return saved.toLowerCase().startsWith('en') ? 'en' : 'zh';
  } catch (e) {
    return 'zh';
  }
}

function homeThemeBaseKey() {
  const raw = (typeof currentTheme === 'string' && currentTheme) ? currentTheme : (window.currentTheme || '');
  return String(raw).replace(/-plus$/, '').replace(/-max$/, '').replace(/-ultimate$/, '');
}

function homePool(period, type) {
  if (homeTextFollowTheme) {
    const lang = homeLangCode();
    const base = homeThemeBaseKey();
    const pack = window.BB_THEME_HOME_TEXT && window.BB_THEME_HOME_TEXT[lang] && window.BB_THEME_HOME_TEXT[lang][base];
    if (pack && pack[type] && Array.isArray(pack[type][period]) && pack[type][period].length) {
      return pack[type][period];
    }
  }
  const all = window.BB_HOME_TEXT;
  if (!all) return [];
  const lang = homeLangCode();
  const pack = all[lang] || all.zh;
  if (!pack || !pack[type] || !pack[type][period]) return [];
  return pack[type][period];
}

function pickHomeIndex(length, previous) {
  if (length <= 0) return -1;
  let index = Math.floor(Math.random() * length);
  if (length > 1 && index === previous) index = (index + 1) % length;
  return index;
}

function stripQuotePrefix(text) {
  const raw = text || '';
  return raw.startsWith('—— ') ? raw.slice(4) : raw;
}

function animateHomeTextPair(greetEl, quoteEl, greetingText, quoteText) {
  /* 【修改】20261119：不再打散成乱码。
     先像按退格键一样，从心情短句末尾删到问候语；
     再从问候语开头逐字打出，最后打心情短句。 */
  const token = ++homeAnimToken;
  const oldGreeting = greetEl ? Array.from(greetEl.textContent || '') : [];
  const oldQuote = quoteEl ? Array.from(stripQuotePrefix(quoteEl.textContent || '')) : [];
  const newGreeting = Array.from(greetingText);
  const newQuote = Array.from(quoteText);

  let quoteDeleteIndex = oldQuote.length;
  let greetingDeleteIndex = oldGreeting.length;
  let greetingTypeIndex = 0;
  let quoteTypeIndex = 0;

  const alive = () => token === homeAnimToken;

  function deleteQuote() {
    if (!alive()) return;
    if (quoteDeleteIndex > 0) {
      quoteDeleteIndex--;
      if (quoteEl) {
        quoteEl.textContent = quoteDeleteIndex > 0
          ? '—— ' + oldQuote.slice(0, quoteDeleteIndex).join('')
          : '';
      }
      setTimeout(deleteQuote, HOME_DELETE_STEP);
      return;
    }
    if (quoteEl) quoteEl.textContent = '';
    setTimeout(deleteGreeting, HOME_SWITCH_PAUSE);
  }

  function deleteGreeting() {
    if (!alive()) return;
    if (greetingDeleteIndex > 0) {
      greetingDeleteIndex--;
      if (greetEl) greetEl.textContent = oldGreeting.slice(0, greetingDeleteIndex).join('');
      setTimeout(deleteGreeting, HOME_DELETE_STEP);
      return;
    }
    setTimeout(typeGreeting, HOME_SWITCH_PAUSE);
  }

  function typeGreeting() {
    if (!alive()) return;
    if (greetingTypeIndex < newGreeting.length) {
      greetingTypeIndex++;
      if (greetEl) greetEl.textContent = newGreeting.slice(0, greetingTypeIndex).join('');
      setTimeout(typeGreeting, HOME_TYPE_STEP);
      return;
    }
    setTimeout(typeQuote, HOME_SWITCH_PAUSE);
  }

  function typeQuote() {
    if (!alive()) return;
    if (quoteTypeIndex < newQuote.length) {
      quoteTypeIndex++;
      if (quoteEl) quoteEl.textContent = '—— ' + newQuote.slice(0, quoteTypeIndex).join('');
      setTimeout(typeQuote, HOME_TYPE_STEP);
      return;
    }
    if (greetEl) greetEl.textContent = greetingText;
    if (quoteEl) quoteEl.textContent = '—— ' + quoteText;
  }

  deleteQuote();
}

function renderHomePair(force) {
  const period = homePeriodForHour(new Date().getHours());
  const periodChanged = period !== homePairPeriod;
  if (!force && !periodChanged) return;

  const greetings = homePool(period, 'greetings');
  const quotes = homePool(period, 'quotes');
  if (!greetings.length || !quotes.length) return;

  const greetingIndex = pickHomeIndex(greetings.length, homePairGreeting);
  const quoteIndex = pickHomeIndex(quotes.length, homePairQuote);
  homePairPeriod = period;
  homePairGreeting = greetingIndex;
  homePairQuote = quoteIndex;

  const greetEl = $('#greeting');
  const quoteEl = $('#quote');
  if (greetEl || quoteEl) {
    animateHomeTextPair(greetEl, quoteEl, greetings[greetingIndex], quotes[quoteIndex]);
  }
}

function rotateHomePair() {
  if (!document.hidden) renderHomePair(true);
}

/* 【新增】20261119：主动切换主题时，立刻换一组问候语 / 心情短句。
   无论从哪个主题换到哪个主题、是否同一系列，都重新抽一组；
   跟随主题关闭时也照样从通用词库里换一组。 */
window.refreshHomeTextForThemeChange = function() {
  renderHomePair(true);
  if (homePairStarted) {
    homePairNextAt = 0;
    scheduleNextHomePair();
  }
};

let homePairTimer = null;
let homePairNextAt = 0;
let homePairStarted = false;

function scheduleNextHomePair() {
  /* 【修改】20261119：进入页面后先取“当前时间 + 间隔”，
     再向后取到下一个 5 秒整点（只会推迟，不会提前）。
     不跟随主题时间隔 15 秒；跟随主题时间隔 25 秒。
     之后每次都在上一次切换时间的基础上加上当前间隔。 */
  if (homePairTimer) clearTimeout(homePairTimer);
  const now = Date.now();
  const interval = homePairInterval();

  if (!homePairNextAt) {
    homePairNextAt = Math.ceil((now + interval) / 5000) * 5000;
  } else {
    homePairNextAt += interval;
    /* 页面长时间挂起时，跳过已经错过的切换点，避免补动画。 */
    while (homePairNextAt <= now) homePairNextAt += interval;
  }

  /* 到点后再留 80ms，确保页面秒数已经显示成目标秒，避免看起来早 1 秒。 */
  const target = homePairNextAt + HOME_SWITCH_GUARD;
  homePairTimer = setTimeout(() => {
    rotateHomePair();
    scheduleNextHomePair();
  }, Math.max(0, target - now));
}

let tickTimer = null;

function scheduleNextTick() {
  /* 【修改】20261119：时钟刷新也对齐整秒，避免实际 35 秒时显示还是 34。 */
  if (tickTimer) clearTimeout(tickTimer);
  const now = Date.now();
  const next = Math.ceil((now + 1) / 1000) * 1000;
  tickTimer = setTimeout(() => {
    tick();
    scheduleNextTick();
  }, Math.max(0, next - now));
}

/* 【新增】20261119：切回网页 / 窗口重新获得焦点时，立即读取电脑当前时间并重排下一次刷新。
   浏览器会节流后台标签页的定时器，不这样做的话回来时会停在旧时间，直到刷新页面才恢复。 */
function syncClockNow() {
  tick();
  scheduleNextTick();
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncClockNow();
});
window.addEventListener('focus', syncClockNow);
/* 从浏览器前进/后退缓存恢复时，也可能停在旧时间。 */
window.addEventListener('pageshow', syncClockNow);

scheduleNextTick();
tick();
renderHomePair(false);

function startHomePairClock() {
  if (homePairStarted) return;
  const overlay = document.getElementById('loadingOverlay');
  if (overlay && overlay.style.display !== 'none' && overlay.classList.contains('show')) return;
  homePairStarted = true;
  homePairNextAt = 0;
  scheduleNextHomePair();
}

window.addEventListener('breadAppEntered', startHomePairClock);
/* 兜底：万一 loading 事件没发出来，也等遮罩真正消失后再开始计时。 */
const homeStartPoll = setInterval(() => {
  startHomePairClock();
  if (homePairStarted) clearInterval(homeStartPoll);
}, 1000);

document.addEventListener('languageChanged', () => {
  tick();
  renderHomePair(true);
});

function initQuote() {
  if (!homePairPeriod) renderHomePair(true);
}
initQuote();

function currentEmojiDirection(userRecord) {
  const raw = (() => {
    try {
      /* 【修改】20261119：优先使用内存缓存 / 小本地键，不再为了取方向读整份用户表 */
      if (window.__emojiDir && window.__emojiDir.user === currentUser && window.__emojiDir.dir) {
        return window.__emojiDir.dir;
      }
      const saved = store.get('bb-emoji-dir', null);
      if (saved && saved.user === currentUser && saved.dir) {
        window.__emojiDir = saved;
        return saved.dir;
      }
      if (userRecord) return userRecord.emojiDir || 'up';
      if (!currentUser) return 'up';
      const users = getUsersDB();
      const u = users[currentUser];
      return (u && u.emojiDir) ? u.emojiDir : 'up';
    } catch (e) { return 'up'; }
  })();
  const dirs = ['up', 'down', 'dr', 'dl', 'ur', 'ul'];
  if (raw === 'random') return dirs[Math.floor(Math.random() * dirs.length)];
  return dirs.indexOf(raw) >= 0 ? raw : 'up';
}

const EMOJI_BG_BASE_COUNT = 18;

/* 【新增】20261119：背景 Emoji 出现频率。
   只读一个极小的本地键，不碰 bb-users / 云端，避免调节时把主线程卡住。 */
function currentEmojiFrequency() {
  try {
    if (window.__emojiFreq && window.__emojiFreq.user === currentUser && Number.isFinite(window.__emojiFreq.freq)) {
      return Math.min(2, Math.max(0.5, window.__emojiFreq.freq));
    }
    const saved = store.get('bb-emoji-freq', null);
    if (saved && saved.user === currentUser && Number.isFinite(Number(saved.freq))) {
      window.__emojiFreq = { user: currentUser, freq: Number(saved.freq) };
      return Math.min(2, Math.max(0.5, Number(saved.freq)));
    }
  } catch (err) { /* 忽略本地读取失败 */ }
  return 1;
}

function emojiBgCount() {
  const freq = currentEmojiFrequency();
  return Math.max(6, Math.min(36, Math.round(EMOJI_BG_BASE_COUNT * freq)));
}
window.currentEmojiFrequency = currentEmojiFrequency;
window.emojiBgCount = emojiBgCount;

/* 【修改】20261119：方向切换只复用现有 emoji 改方向，不再做整表读写；
   只有换主题或调整出现频率时才整批重建。 */
function refreshEmojiBackground(directionOnly) {
  const bg = document.getElementById('breadBg');
  if (!bg) return;
  const token = (refreshEmojiBackground._token || 0) + 1;
  refreshEmojiBackground._token = token;
  requestAnimationFrame(() => {
    if (refreshEmojiBackground._token !== token) return;
    const existing = bg.querySelectorAll('.bread');
    const targetCount = emojiBgCount();
    if (directionOnly && existing.length) {
      existing.forEach(b => {
        const dir = currentEmojiDirection(null);
        applyBreadDirection(b, dir);
        const dur = 24 + Math.random() * 26;
        b.style.animationDuration = dur + 's';
        b.style.animationDelay = (-Math.random() * dur) + 's';
      });
      /* 如果旧背景少于目标数量，补足，避免看起来变稀 */
      for (let i = existing.length; i < targetCount; i++) spawnBread(null);
      return;
    }
    bg.innerHTML = '';
    for (let i = 0; i < targetCount; i++) spawnBread(null);
  });
}

function applyBreadDirection(b, dir) {
  ['up', 'down', 'dr', 'dl', 'ur', 'ul'].forEach(d => b.classList.remove('dir-' + d));
  b.classList.add('dir-' + dir);
  const rnd = (min, max) => Math.round(min + Math.random() * (max - min));
  const diag = (dir === 'dr' || dir === 'dl' || dir === 'ur' || dir === 'ul');
  if (diag) {
    /* 【修改】20261119：斜向不再让 15 个 emoji 从同一个点出发（那样会挤成一条线），
       改成从「进风边」随机散开：上边 / 左边 / 下边 / 右边各取一条边随机落点，
       这样每条轨迹互相平行但铺满整个背景。 */
    const fromTop = (dir === 'dr' || dir === 'dl');
    const fromBottom = (dir === 'ur' || dir === 'ul');
    const fromLeft = (dir === 'dr' || dir === 'ur');
    const fromRight = (dir === 'dl' || dir === 'ul');
    if (Math.random() < 0.5) {
      /* 从横向边进入：上边或下边 */
      b.style.left = rnd(-10, 110) + 'vw';
      b.style.top = fromTop ? '-12vh' : (fromBottom ? '112vh' : '0px');
    } else {
      /* 从纵向边进入：左边或右边 */
      b.style.left = fromLeft ? '-12vw' : (fromRight ? '112vw' : '0px');
      b.style.top = rnd(-10, 110) + 'vh';
    }
  } else if (dir === 'down') {
    b.style.left = Math.random() * 96 + 'vw';
    b.style.top = '0px';
  } else {
    b.style.left = Math.random() * 96 + 'vw';
    b.style.top = '0px';
  }
}

function spawnBread(userRecord) {
  const b = document.createElement('span'); b.className = 'bread';
  const dir = currentEmojiDirection(userRecord);
  applyBreadDirection(b, dir);
  b.style.fontSize = (18 + Math.random() * 32) + 'px';
  const dur = 24 + Math.random() * 26;
  b.style.animationDuration = dur + 's'; b.style.animationDelay = (-Math.random() * dur) + 's';
  b.style.setProperty('--op', (0.3 + Math.random() * 0.45).toFixed(2));
  const inner = document.createElement('i');
  const pool = THEMES[currentTheme] ? THEMES[currentTheme].emojis : ['🍞'];
  inner.textContent = pool[Math.floor(Math.random() * pool.length)];
  inner.style.animationDuration = (2.5 + Math.random() * 3) + 's'; inner.style.animationDelay = (-Math.random() * 3) + 's';
  b.appendChild(inner); b.onclick = e => popBread(b, e); $('#breadBg').appendChild(b);
}

function popBread(b, e) {
  for (let i = 0; i < 8; i++) {
    const c = document.createElement('span'); c.className = 'crumb';
    c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px';
    if (currentTheme === 'gold') c.style.background = '#f1c40f';
    else if (currentTheme === 'diamond') c.style.background = '#9b59b6';
    else if (currentTheme === 'sakura') c.style.background = '#ffb6c1';
    else if (currentTheme === 'cyber') c.style.background = '#00ff64';
    else if (currentTheme === 'flame') c.style.background = '#ff4500';
    else if (currentTheme === 'aurora') c.style.background = '#64ffda';
    else if (currentTheme === 'blackgold') c.style.background = '#e6c27a';
    else if (currentTheme === 'forest') c.style.background = '#00e676';
    else if (currentTheme === 'ocean') c.style.background = '#64ffda';
    else if (currentTheme.includes('food')) c.style.background = '#f76707';
    else if (currentTheme.includes('fruit')) c.style.background = '#20c997';
    else if (currentTheme.includes('winter')) c.style.background = '#bfe6ff';
    else c.style.background = '#e8933a';
    document.body.appendChild(c);
    const ang = Math.random() * Math.PI * 2, dist = 25 + Math.random() * 55;
    const tx = Math.cos(ang) * dist, ty = Math.sin(ang) * dist + 45;
    c.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(.4)`, opacity: 0 }], { duration: 550 + Math.random() * 350, easing: 'cubic-bezier(.2, .7, .3, 1)' }).onfinish = () => c.remove();
  }
  b.remove(); setTimeout(spawnBread, 2500);
}

let isSyncing = false;
/* 【修改】20261118：同步加「排队」标记。
   以前 finally 里要等 1.5 秒才解锁，这期间任何 syncFromCloud() 都会被静默丢弃
   （兑换码刚成功后调用的那次同步正好落在这个窗口里，就会出现「兑换了但界面没同步」）。
   现在改成：同步中再来请求 → 记一笔排队，本次结束后自动再跑一次。 */
let syncQueued = false;

window.syncFromCloud = async function() {
  if (isSyncing) { syncQueued = true; return; }
  isSyncing = true;
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { isSyncing = false; return; }

    const { data: assets, error: errAssets } = await sb.from('bread_assets').select('*').eq('user_id', user.id).maybeSingle();
    const { data: prefs, error: errPrefs } = await sb.from('bread_preferences').select('*').eq('user_id', user.id).maybeSingle();
    /* 【新增】20261117：城市 / 头像这些字段存在 bread_users，以前只写不读，顺带在这里拉一次 */
    const { data: dbUser } = await sb.from('bread_users').select('weather_city, weather_id, avatar').eq('user_id', user.id).maybeSingle();

    if (errAssets) throw errAssets;
    /* 【修改】20261118 P0：偏好读取失败时不要继续合并，
       否则 prefs 为空会让后续 store.set 用默认 settings 覆盖云端。 */
    if (errPrefs) throw errPrefs;

    /* 【新增】20261118 P0：先记录本次云端基线，后面的 store.set 只写变化列。 */
    if (assets) window.__bbSetAssetsBase(assets, user.id);
    if (prefs && prefs.settings) window.__bbSetPrefsBase(prefs.settings, user.id);

    let users = getUsersDB();
    let u = users[currentUser];
    if (!u) { isSyncing = false; return; }

    let hasDataChanged = false;
    let needRefreshMail = false;

    if (assets) {
      const cloudEmailsStr = JSON.stringify(assets.emails || []);
      const localEmailsStr = JSON.stringify(u.emails || []);

      /* 【修改】20261118 P0：只有「本地相对云端基线没变」的字段才采用云端值。
         本地刚操作过（例如刚加积分 / 刚买会员）的字段保留本地，等 store.set 推上去，
         避免同步请求把刚做的事回滚掉。 */
      const base = window.__bbGetAssetsBase(user.id);
      /* 【修改】20261118 P0：本地快照缺字段时按云端基线对待，不能把「缺」当成 0 / none 再推回云端。 */
      const hasVal = v => v !== undefined && v !== null;
      const localPoints = (hasVal(u.points) && isFinite(Number(u.points))) ? Number(u.points) : (base ? base.points : 0);
      const pendingPoints = base ? localPoints !== Number(base.points) : false;
      if (!pendingPoints && localPoints !== (Number(assets.points) || 0)) {
         u.points = Number(assets.points) || 0;
         hasDataChanged = true;
      }

      const localVipType = (hasVal(u.vipType) && u.vipType) ? u.vipType : (base ? base.vip_type : 'none');
      const cloudVipType = assets.vip_type || 'none';
      const pendingVipType = base ? (localVipType !== base.vip_type) : false;
      if (!pendingVipType && localVipType !== cloudVipType) {
         u.vipType = cloudVipType;
         hasDataChanged = true;
      }

      const localExpire = (hasVal(u.vipExpire) && isFinite(Number(u.vipExpire))) ? Number(u.vipExpire) : (base ? Number(base.vip_expire) || 0 : 0);
      const cloudExpire = Number(assets.vip_expire) || 0;
      const baseExpire = base ? (Number(base.vip_expire) || 0) : 0;
      const pendingExpire = base ? (localExpire !== baseExpire) : false;
      /* 【修改】20261118 P1：到期时间不再只增不减。
         本地相对基线没变化时，云端改成更早的到期时间（退款/到期/后台修正）也要采用；
         否则本地会保留旧的更晚到期时间，断网时还能继续用会员特权。 */
      if (!pendingExpire && cloudExpire !== localExpire) {
         u.vipExpire = cloudExpire;
         hasDataChanged = true;
      }

      /* 【新增】20261118 P0：主题解锁始终取「本地 + 云端」并集回填。
         以前这段被包在 points/vipType 变化的 if 里，纯主题奖励（vip_claim_reward）
         不会改变 points，于是本地 unlockedThemes 一直是领取前的旧数组，刷新就“消失”。 */
      const cloudThemes = Array.isArray(assets.unlocked_themes) ? assets.unlocked_themes : [];
      const localThemes = Array.isArray(u.unlockedThemes) ? u.unlockedThemes : (base ? base.unlocked_themes : []);

      /* 【新增】20261118 P0：把本地缺失的资产字段补成基线值，
         避免后续任何一次 store.set 把「缺字段」误写成 0 / 1 / []。 */
      if (!hasVal(u.points)) { u.points = localPoints; hasDataChanged = true; }
      if (!hasVal(u.vipType)) { u.vipType = localVipType; hasDataChanged = true; }
      if (!hasVal(u.vipExpire)) { u.vipExpire = localExpire; hasDataChanged = true; }
      if (!hasVal(u.vipLevel)) { u.vipLevel = base ? base.vip_level : 1; hasDataChanged = true; }
      if (!hasVal(u.vipPoint)) { u.vipPoint = base ? base.star_point : 0; hasDataChanged = true; }
      if (!Array.isArray(u.unlockedThemes)) { u.unlockedThemes = localThemes.slice(); hasDataChanged = true; }

      const mergedThemes = Array.from(new Set([...localThemes, ...cloudThemes]));
      if (window.__bbSameArray ? !window.__bbSameArray(mergedThemes, localThemes) : JSON.stringify(mergedThemes) !== JSON.stringify(localThemes)) {
         u.unlockedThemes = mergedThemes;
         hasDataChanged = true;
      }

      /* 本地有待推送的积分/会员状态时，标记一次，让本次 sync 末尾的 store.set 把本地值推上去。
         否则刚加的积分会被“只拉不推”的同步流程停在本地，下一次任意动作才落库。 */
      if (pendingPoints || pendingVipType) hasDataChanged = true;

      /* 【新增】20261117：本地等级夹到 1~100，避免出现 Lv180 这种越界值
         （越界会让服务端的等级校验和界面对不上） */
      const lvNow = Number(u.vipLevel);
      const hasLocalLv = hasVal(u.vipLevel) && isFinite(lvNow) && lvNow > 0;
      const clampedLv = hasLocalLv ? Math.min(100, Math.max(1, lvNow)) : (base ? base.vip_level : 1);
      if (hasLocalLv && clampedLv !== lvNow) { u.vipLevel = clampedLv; hasDataChanged = true; }

      /* 【修改】20261118：等级唯一来源统一为 bread_assets.vip_level。
         这一列有有效值就以它为准（服务端裁决读的也是它），只有它是空的才回落到 settings.vipLevel，
         彻底避免「两个地方各存一份、谁也不知道哪个对」的情况。
         【修改】20261118 P0：本地相对基线有变化（例如开发者面板刚改等级）时不拉低本地。 */
      if (typeof assets.vip_level === 'number' && assets.vip_level > 0) {
        const cloudLv = Math.min(100, Math.max(1, assets.vip_level));
        const baseLv = base ? (Number(base.vip_level) || 1) : 1;
        const pendingLv = base ? (clampedLv !== baseLv) : false;
        if (!pendingLv && cloudLv !== u.vipLevel) {
          u.vipLevel = cloudLv;
          hasDataChanged = true;
        }
      }

      /* 【新增】20261118：星光值也从 bread_assets.star_point 回填。
         星光值只增不减，取两边更大的那个，换设备不会掉值，
         本地刚攒但还没推上去的部分也不会被云端旧值盖掉。 */
      if (typeof assets.star_point === 'number' && assets.star_point > (Number(u.vipPoint) || 0)) {
        u.vipPoint = assets.star_point;
        hasDataChanged = true;
      }

      /* 【新增】20261118：面包等级（普通用户等级）以 bread_assets 为准。
         这一列由服务端 user_add_bake 写入，本地只做展示与兜底；
         换设备时直接采用云端值，避免本地旧值把等级压回去。 */
      if (typeof assets.user_level === 'number' && assets.user_level > 0) {
        const lv = Math.min(60, Math.max(1, assets.user_level));
        if (lv !== (Number(u.userLevel) || 1)) {
          u.userLevel = lv;
          hasDataChanged = true;
        }
      }
      if (typeof assets.user_bake === 'number' && assets.user_bake >= 0
          && assets.user_bake !== (Number(u.userBake) || 0)) {
        u.userBake = assets.user_bake;
        hasDataChanged = true;
      }

      if (cloudEmailsStr !== localEmailsStr) {
         /* 【修正】20261117：以前直接用云端 emails 覆盖本地，遇到「本地刚发/刚领的新邮件还没推上去」
            就会被云端旧数据抹掉（表现为「邮件没保存到云端 / 刷新就消失」）。
            改成按 id 取并集：本地独有的邮件保留，两边都有的以「已领」为准。 */
         const cloudList = Array.isArray(assets.emails) ? assets.emails : [];
         const localList = Array.isArray(u.emails) ? u.emails : [];
         const byId = new Map();
         cloudList.forEach(m => { if (m && m.id) byId.set(m.id, m); });
         localList.forEach(m => {
           if (!m || !m.id) return;
           const c = byId.get(m.id);
           if (!c) { byId.set(m.id, m); return; }
           if (m.isClaimed && !c.isClaimed) byId.set(m.id, Object.assign({}, c, { isClaimed: true }));
         });
         const merged = Array.from(byId.values()).sort((a, b) => (Number(a.date) || 0) - (Number(b.date) || 0));
         if (JSON.stringify(merged) !== JSON.stringify(localList)) {
           u.emails = merged;
           needRefreshMail = true;
           hasDataChanged = true;
         }
      }
    }

    if (dbUser) {
      /* 【新增】20261117：天气城市/头像回填（本地没有或与云端不同就以云端为准，换设备也能接上） */
      if (dbUser.weather_city && dbUser.weather_city !== u.weather_city) {
        u.weather_city = dbUser.weather_city;
        try { localStorage.setItem('bb-weather-city', dbUser.weather_city); } catch (e) {}
        hasDataChanged = true;
      }
      if (dbUser.weather_id && dbUser.weather_id !== u.weather_id) {
        u.weather_id = dbUser.weather_id;
        try { localStorage.setItem('bb-weather-id', dbUser.weather_id); } catch (e) {}
        hasDataChanged = true;
      }
      if (dbUser.avatar && dbUser.avatar !== u.avatar) {
        u.avatar = dbUser.avatar;
        hasDataChanged = true;
      }
    }

    if (prefs) {
      const cloudTheme = prefs.current_theme || 'default';
      if (u.currentTheme !== cloudTheme) {
        u.currentTheme = cloudTheme;
        currentTheme = cloudTheme;
        if (typeof applyTheme === 'function') applyTheme();
        hasDataChanged = true;
      }

      const cloudSites = prefs.sites || [];
      const localSites = store.get(`bb-sites_${currentUser}`, []);
      const sitesDirty = (typeof isSitesDirty === 'function') ? isSitesDirty() : false;

      /* 【新增】两端都有数据且不一致时，先给本地留一份带时间戳的备份，
         避免任何一边被静默覆盖后无法追回（用户可在 localStorage 里找回） */
      if (localSites.length > 0 && cloudSites.length > 0 && JSON.stringify(cloudSites) !== JSON.stringify(localSites)) {
        try { localStorage.setItem(`bb-sites_${currentUser}-bak-${Date.now()}`, JSON.stringify(localSites)); } catch (e) {}
      }

      if (cloudSites.length === 0 && localSites.length > 0) {
        store.set(`bb-sites_${currentUser}`, localSites);
      }
      else if (sitesDirty) {
        /* 【修改】本设备有「还没推上去」的改动 → 以本地为准补齐云端，
           这是修好 store.set 之后让跨设备真正生效的关键分支 */
        store.set(`bb-sites_${currentUser}`, localSites);
      }
      else if (JSON.stringify(cloudSites) !== JSON.stringify(localSites)) {
        localStorage.setItem(`bb-sites_${currentUser}`, JSON.stringify(cloudSites));
        if (typeof sites !== 'undefined') {
           sites = cloudSites;
           if (typeof renderSites === 'function') renderSites();
        }
        hasDataChanged = true;
      }

      /* 【新增】20261117：搜索历史回拉（以前只推不拉，换设备历史一片空白）。
         合并策略与面包篮一致：云端有就覆盖本地（先备份本地），云端空就把本地推上去。 */
      const cloudHist = Array.isArray(prefs.history) ? prefs.history : [];
      const localHist = store.get(`bb-history_${currentUser}`, []);
      if (cloudHist.length > 0) {
        if (JSON.stringify(cloudHist) !== JSON.stringify(localHist)) {
          if (Array.isArray(localHist) && localHist.length) {
            try { localStorage.setItem(`bb-history_${currentUser}-bak-${Date.now()}`, JSON.stringify(localHist)); } catch (e) {}
          }
          localStorage.setItem(`bb-history_${currentUser}`, JSON.stringify(cloudHist));
          if (typeof history !== 'undefined' && Array.isArray(history)) history = cloudHist;
          hasDataChanged = true;
        }
      } else if (Array.isArray(localHist) && localHist.length) {
        store.set(`bb-history_${currentUser}`, localHist);
      }

      const s = prefs.settings || {};
      u.enFont = s.enFont || 'default';
      u.zhFont = s.zhFont || 'default';
      u.fwSpeed = s.fwSpeed || 1.0;
      u.fwFreq = s.fwFreq || 1.0;
      u.fwThemeColor = s.fwThemeColor !== false;
      u.screenShake = s.screenShake !== false;
      u.customFonts = s.customFonts || [];

      /* 【新增】20261117：补上「只写不读」的偏好回拉 —— 12 小时制 / 天气时段 */
      if (typeof s.clock12h === 'boolean' && u.clock12h !== s.clock12h) {
        u.clock12h = s.clock12h;
        if (typeof window.updateClockFormat === 'function') window.updateClockFormat(u.clock12h);
        hasDataChanged = true;
      }
      if (typeof s.weatherRange === 'string' && s.weatherRange && u.weatherRange !== s.weatherRange) {
        u.weatherRange = s.weatherRange;
        hasDataChanged = true;
      }

      /* 【新增】20261117：红包 / 每日点数发放标记回拉。
         策略保守：日期取更晚的一份、发放标记只从 false 补成 true，
         避免多端来回覆盖导致重复发奖。 */
      if (typeof s.lastRpDate === 'string' && s.lastRpDate && (!u.lastRpDate || s.lastRpDate > u.lastRpDate)) u.lastRpDate = s.lastRpDate;
      if (typeof s.lastPointDate === 'string' && s.lastPointDate && (!u.lastPointDate || s.lastPointDate > u.lastPointDate)) u.lastPointDate = s.lastPointDate;
      if (typeof s.rpCount === 'number' && s.rpCount > (Number(u.rpCount) || 0)) u.rpCount = s.rpCount;
      ['day7Sent', 'day30Sent', 'springSent'].forEach(k => {
        if (s[k] === true && u[k] !== true) u[k] = true;
      });

      /* 【修改】20261118 P1：只有 bread_assets.vip_level 缺失时，settings.vipLevel 才参与合并。
         资产列有有效值时它就是唯一权威来源，不能被 settings 里的旧高等级反向顶上去。 */
      const hasAssetLevel = typeof assets.vip_level === 'number' && assets.vip_level > 0;
      if (!hasAssetLevel && (typeof s.vipLevel === 'number' || typeof s.vipPoint === 'number')) {
        const cloudLevel = Math.max(1, Number(s.vipLevel) || 1);
        const localLevel = Math.max(1, Number(u.vipLevel) || 1);
        if (cloudLevel > localLevel) {
          u.vipLevel = cloudLevel;
          u.vipPoint = Math.max(0, Number(s.vipPoint) || 0);
        } else if (cloudLevel === localLevel) {
          u.vipPoint = Math.max(Number(u.vipPoint) || 0, Number(s.vipPoint) || 0);
        }
      }
      if (typeof s.vipAppliedType === 'string') u.vipAppliedType = s.vipAppliedType;
      if (s.vipTaskState && typeof s.vipTaskState === 'object' && !Array.isArray(s.vipTaskState)) {
        /* 任务计数以本地为准（本地每次动作都会写盘并回传），云端只用于换设备后补齐历史领取记录 */
        if (!u.vipTaskState) u.vipTaskState = s.vipTaskState;
      }
      /* 【新增】20261118：积分兑星光的每日额度回填。同一天时取「两边更大的已兑值」，
         避免换设备后当天额度被重置（不同天直接以云端为准，等价于归零） */
      if (s.starExchange && typeof s.starExchange === 'object' && !Array.isArray(s.starExchange)) {
        const cloudSE = s.starExchange;
        const localSE = (u.starExchange && typeof u.starExchange === 'object') ? u.starExchange : {};
        if (cloudSE.date && (!localSE.date || cloudSE.date > localSE.date)) {
          u.starExchange = { date: cloudSE.date, star: Number(cloudSE.star) || 0, points: Number(cloudSE.points) || 0 };
          hasDataChanged = true;
        } else if (cloudSE.date && localSE.date === cloudSE.date
                   && (Number(cloudSE.star) || 0) > (Number(localSE.star) || 0)) {
          u.starExchange = { date: cloudSE.date, star: Number(cloudSE.star) || 0, points: Number(cloudSE.points) || 0 };
          hasDataChanged = true;
        }
      }
      if (Array.isArray(s.vipRewardSent) && !(Array.isArray(u.vipRewardSent) && u.vipRewardSent.length)) {
        u.vipRewardSent = s.vipRewardSent;
      }
      if (Array.isArray(s.vipRewardLog) && !(Array.isArray(u.vipRewardLog) && u.vipRewardLog.length)) {
        u.vipRewardLog = s.vipRewardLog;
      }
      /* 【新增】个性签名：本地为空时用云端补齐（换设备/清缓存后仍能看到） */
      if (typeof s.bio === 'string' && s.bio && !u.bio) u.bio = s.bio;
    }

    if (hasDataChanged) {
      /* 【修改】20261117：原来只写 localStorage，合并后的邮件/等级不会推回云端（换设备又看不到）。
         改用 store.set，本地落盘的同时触发 bread_users / bread_assets / bread_preferences 同步。 */
      try { store.set('bb-users', users); } catch (e) { localStorage.setItem('bb-users', JSON.stringify(users)); }
      if (typeof updateUserUI === 'function') updateUserUI();
      $('#pointsDisplay').textContent = u.points || 0;
    }

    if (needRefreshMail && $('#mailOverlay') && $('#mailOverlay').classList.contains('show')) {
      if (typeof renderMails === 'function') renderMails();
    }

  } catch (err) {
    console.error('❌ 实时同步拉取失败:', err);
  } finally {
    /* 【修改】20261118：不再固定等 1.5 秒；改为短节流 + 处理排队请求 */
    setTimeout(() => {
      isSyncing = false;
      if (syncQueued) { syncQueued = false; window.syncFromCloud(); }
    }, 250);
  }
};

let syncTimer = null;
function debouncedSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        window.syncFromCloud();
    }, 800);
}

async function initRealtime() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  sb.channel('realtime_assets')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bread_assets', filter: `user_id=eq.${user.id}` }, () => {
        debouncedSync();
    }).subscribe();

  sb.channel('realtime_prefs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bread_preferences', filter: `user_id=eq.${user.id}` }, () => {
        debouncedSync();
    }).subscribe();
}

setTimeout(initRealtime, 2000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && typeof currentUser !== 'undefined' && currentUser && window.isLoadedOnce) {
    if (typeof window.syncFromCloud === 'function') window.syncFromCloud();
  }
});