const $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};

let toastTimer;
function showToast(msg, icon = '🌸') {
  const t = $('#toast'); 
  if (!t) return;
  t.innerHTML = `<span>${icon}</span> ${msg}`; 
  t.classList.add('show');
  clearTimeout(toastTimer); 
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* 【修改】20261119：花事书房只加载「气质相符」的三套主题
   樱花漫舞 / 花语秘境 / 蜂蜜工坊（含各自的 Plus / Max 变体）。
   其它主题（美食、赛博、深海等）不在这里出现，避免和书房氛围冲突。 */
const THEMES = {
  sakura:          { name: '🌸 樱花漫舞', emojis: ['🌸','🌸','🦋'] },
  'sakura-plus':   { name: '🌸 樱花漫舞 Plus', emojis: ['🌸','🌸','🌺','💮','🪷','🦋'] },
  flower:          { name: '🌺 花语秘境', emojis: ['🌹','🌷','🌻','🌼'] },
  'flower-plus':   { name: '🌺 花语秘境 Plus', emojis: ['🌹','🌷','🌻','🌼','🌺','🌸','🪷','🦋'] },
  honey:           { name: '🍯 蜂蜜工坊', emojis: ['🍯','🍞','🥐','🧈','🥛','🌾'] },
  'honey-plus':    { name: '✨ 蜂蜜工坊 Plus', emojis: ['🍯','🍞','🥐','🧈','🥛','🌾','🍪','🥞','🍮'] },
  'honey-max':     { name: '👑 蜂蜜工坊 Max', emojis: ['🍯','🍞','🥐','🧈','🥛','🌾','🍪','🥞','🍮','🍫','🍰','🧁','🍩','✨'] }
};

let theme = store.get('read-theme', 'light');
let currentTheme = store.get('read-current-theme', 'sakura'); // 默认樱花
/* 老用户可能存着不在白名单里的主题（例如 food / ocean），进页面临时回落到樱花 */
if (!THEMES[currentTheme]) {
  currentTheme = 'sakura';
  store.set('read-current-theme', 'sakura');
}
let currentFont = store.get('read-font', 'default');

/* 【新增】20261119：读主站（Bread Explorer）当前登录用户的设置。
   同一个域名下 localStorage 共享：bb-current-user / bb-users 由主站写入。 */
function mainUser() {
  try {
    const name = store.get('bb-current-user', null);
    const users = store.get('bb-users', null);
    if (name && users && users[name]) return users[name];
  } catch (e) { /* 忽略 */ }
  return null;
}