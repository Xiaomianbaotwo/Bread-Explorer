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

// 只保留樱花两个主题
const THEMES = {
  sakura:          { name: '🌸 樱花漫舞', emojis: ['🌸','🌸','🦋'] },
  'sakura-plus':   { name: '🌸 樱花漫舞 Plus', emojis: ['🌸','🌸','🌺','💮','🪷','🦋'] }
};

let theme = store.get('read-theme', 'light');
let currentTheme = store.get('read-current-theme', 'sakura'); // 默认樱花
let currentFont = store.get('read-font', 'default');