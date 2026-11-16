/* =========================================================
   11-init.js
   ========================================================= */

let is12Hour = localStorage.getItem('bb-clock-12h') === 'true';

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

  // ===== 问候语（按当前语言） =====
  const hGreet = now.getHours();
  let greetKey = 'home.greetNight';
  if (hGreet >= 5 && hGreet < 9) greetKey = 'home.greetMorning';
  else if (hGreet < 12) greetKey = 'home.greetForenoon';
  else if (hGreet < 14) greetKey = 'home.greetNoon';
  else if (hGreet < 18) greetKey = 'home.greetAfternoon';
  else if (hGreet < 22) greetKey = 'home.greetEvening';

  $('#greeting').textContent = (typeof window.t === 'function') ? window.t(greetKey) : '';
}

setInterval(tick, 1000);
tick();

document.addEventListener('languageChanged', () => {
  tick();
  // 语言切换时更新名言
  if (typeof initQuote === 'function') initQuote();
});

function initQuote() {
  const q = $('#quote');
  if (!q) return;

  let QUOTES = [
    '面包会有的，牛奶也会有的。', '每一个不曾起舞的日子，都是对生命的辜负。', '生活明朗，万物可爱。', '慢一点也没关系，只要在往前走。', '今天也要好好吃饭呀 🍞', '愿你所求皆如愿，所行化坦途。', '心动不如行动，行动不如马上。', '别慌，月亮也正在大海某处迷茫。', '愿你眼里有光，心中有暖，脚下有路。', '把日子过成自己喜欢的样子。'
  ];

  if (typeof window.t === 'function') {
    const transQuotes = window.t('home.quotes', { returnObjects: true });
    if (Array.isArray(transQuotes) && transQuotes.length > 0) {
      QUOTES = transQuotes;
    }
  }

  q.textContent = '—— ' + QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
initQuote();

function spawnBread() {
  const b = document.createElement('span'); b.className = 'bread';
  b.style.left = Math.random() * 96 + 'vw';
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
    else c.style.background = '#e8933a';
    document.body.appendChild(c);
    const ang = Math.random() * Math.PI * 2, dist = 25 + Math.random() * 55;
    const tx = Math.cos(ang) * dist, ty = Math.sin(ang) * dist + 45;
    c.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(.4)`, opacity: 0 }], { duration: 550 + Math.random() * 350, easing: 'cubic-bezier(.2, .7, .3, 1)' }).onfinish = () => c.remove();
  }
  b.remove(); setTimeout(spawnBread, 2500);
}

let isSyncing = false;

window.syncFromCloud = async function() {
  if (isSyncing || !currentUser) return;
  isSyncing = true;
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { isSyncing = false; return; }

    const { data: assets, error: errAssets } = await sb.from('bread_assets').select('*').eq('user_id', user.id).maybeSingle();
    const { data: prefs, error: errPrefs } = await sb.from('bread_preferences').select('*').eq('user_id', user.id).maybeSingle();

    if (errAssets) throw errAssets;

    let users = getUsersDB();
    let u = users[currentUser];
    if (!u) { isSyncing = false; return; }

    let hasDataChanged = false;
    let needRefreshMail = false;

    if (assets) {
      const cloudEmailsStr = JSON.stringify(assets.emails || []);
      const localEmailsStr = JSON.stringify(u.emails || []);

      if (u.points !== (assets.points || 0) || u.vipType !== (assets.vip_type || 'none')) {
         u.points = assets.points || 0;
         u.vipType = assets.vip_type || 'none';
         u.vipExpire = assets.vip_expire || 0;
         u.unlockedThemes = assets.unlocked_themes || [];
         hasDataChanged = true;
      }

      if (cloudEmailsStr !== localEmailsStr) {
         u.emails = assets.emails || [];
         needRefreshMail = true;
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

      if (cloudSites.length === 0 && localSites.length > 0) {
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

      const s = prefs.settings || {};
      u.enFont = s.enFont || 'default';
      u.zhFont = s.zhFont || 'default';
      u.fwSpeed = s.fwSpeed || 1.0;
      u.fwFreq = s.fwFreq || 1.0;
      u.fwThemeColor = s.fwThemeColor !== false;
      u.screenShake = s.screenShake !== false;
      u.customFonts = s.customFonts || [];

      /* 【新增】拉回云端保存的 VIP 等级 / 星光值 / 任务状态（settings 是 jsonb，无需建表）
         取「较大者」的合并策略：等级取 max，星光值取本地更大的一份，避免多端互相覆盖降级。 */
      if (typeof s.vipLevel === 'number' || typeof s.vipPoint === 'number') {
        const cloudLevel = Math.max(1, Number(s.vipLevel) || 1);
        const localLevel = Math.max(1, Number(u.vipLevel) || 1);
        if (cloudLevel > localLevel) {
          u.vipLevel = cloudLevel;
          u.vipPoint = Math.max(0, Number(s.vipPoint) || 0);
        } else if (cloudLevel === localLevel) {
          u.vipPoint = Math.max(Number(u.vipPoint) || 0, Number(s.vipPoint) || 0);
        }
        if (typeof s.vipAppliedType === 'string') u.vipAppliedType = s.vipAppliedType;
      }
      if (s.vipTaskState && typeof s.vipTaskState === 'object' && !Array.isArray(s.vipTaskState)) {
        /* 任务计数以本地为准（本地每次动作都会写盘并回传），云端只用于换设备后补齐历史领取记录 */
        if (!u.vipTaskState) u.vipTaskState = s.vipTaskState;
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
      localStorage.setItem('bb-users', JSON.stringify(users));
      if (typeof updateUserUI === 'function') updateUserUI();
      $('#pointsDisplay').textContent = u.points || 0;
    }

    if (needRefreshMail && $('#mailOverlay') && $('#mailOverlay').classList.contains('show')) {
      if (typeof renderMails === 'function') renderMails();
    }

  } catch (err) {
    console.error('❌ 实时同步拉取失败:', err);
  } finally {
    setTimeout(() => { isSyncing = false; }, 1500);
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