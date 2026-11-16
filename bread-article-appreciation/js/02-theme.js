function applyTheme() {
  const body = document.body;
  body.classList.remove('dark');
  Array.from(body.classList).forEach(c => {
    if (c.startsWith('theme-')) body.classList.remove(c);
  });
  
  if (theme === 'dark') body.classList.add('dark');
  
  if (currentTheme && currentTheme !== 'default') {
    let baseTheme = currentTheme.replace('-plus', '');
    body.classList.add('theme-' + baseTheme);
  }
  
  $('#btnTheme').textContent = theme === 'dark' ? '☀️' : '🌙';
  $('#petalBg').innerHTML = '';
  for (let i = 0; i < 15; i++) spawnPetal();
}

function spawnPetal() {
  const b = document.createElement('span'); b.className = 'petal';
  b.style.left = Math.random() * 96 + 'vw';
  b.style.fontSize = (18 + Math.random() * 32) + 'px';
  const dur = 24 + Math.random() * 26;
  b.style.animationDuration = dur + 's'; b.style.animationDelay = (-Math.random() * dur) + 's';
  b.style.setProperty('--op', (0.3 + Math.random() * 0.45).toFixed(2));
  const inner = document.createElement('i');
  const pool = THEMES[currentTheme] ? THEMES[currentTheme].emojis : ['🌸'];
  inner.textContent = pool[Math.floor(Math.random() * pool.length)];
  inner.style.animationDuration = (2.5 + Math.random() * 3) + 's'; inner.style.animationDelay = (-Math.random() * 3) + 's';
  b.appendChild(inner); 
  b.onclick = e => popPetal(b, e); 
  $('#petalBg').appendChild(b);
}

function popPetal(b, e) {
  for (let i = 0; i < 8; i++) {
    const c = document.createElement('span'); 
    c.style.position = 'fixed'; c.style.width = '8px'; c.style.height = '8px'; c.style.borderRadius = '50%';
    c.style.background = 'var(--accent)'; c.style.zIndex = '99'; c.style.pointerEvents = 'none';
    c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px';
    document.body.appendChild(c);
    const ang = Math.random() * Math.PI * 2, dist = 25 + Math.random() * 55;
    const tx = Math.cos(ang) * dist, ty = Math.sin(ang) * dist + 45;
    c.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(.4)`, opacity: 0 }], { duration: 550 + Math.random() * 350, easing: 'cubic-bezier(.2, .7, .3, 1)' }).onfinish = () => c.remove();
  }
  b.remove(); setTimeout(spawnPetal, 2500);
}

$('#btnTheme').onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; store.set('read-theme', theme); applyTheme(); };

$('#btnThemeSelect').onclick = () => {
  const grid = $('#themeGrid'); grid.innerHTML = '';
  Object.entries(THEMES).forEach(([key, t]) => {
    const b = document.createElement('button');
    b.className = 'theme-btn' + (currentTheme === key ? ' active' : '');
    b.textContent = t.name;
    b.onclick = () => {
      currentTheme = key; store.set('read-current-theme', key);
      applyTheme(); $('#themeOverlay').classList.remove('show'); 
      showToast('主题已切换', '🎨');
    };
    grid.appendChild(b);
  });
  $('#themeOverlay').classList.add('show');
};
$('#btnThemeClose').onclick = () => $('#themeOverlay').classList.remove('show');

// 字体控制
function applyFont(fontId) {
  let family = '"PingFang SC", "Microsoft YaHei", sans-serif';
  if (fontId === 'kai') family = '"KaiTi", "STKaiti", "楷体", serif';
  if (fontId === 'song') family = '"SimSun", "Songti SC", "宋体", serif';
  if (fontId === 'round') family = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei"';
  if (fontId === 'mono') family = '"Consolas", "Courier New", monospace';
  document.body.style.fontFamily = family;
  $('#articleContent').style.fontFamily = family;
}

$('#btnFontSelect').onclick = () => {
  const fonts = [
    { id: 'default', name: '默认系统字体' },
    { id: 'song', name: '宋体 (传统阅读)' },
    { id: 'kai', name: '楷体 (书法韵味)' },
    { id: 'round', name: '黑体 (现代简约)' }
  ];
  const list = $('#zhFontList'); list.innerHTML = '';
  fonts.forEach(f => {
    const div = document.createElement('div');
    div.className = 'font-item' + (currentFont === f.id ? ' active' : '');
    div.textContent = f.name;
    div.onclick = () => {
      currentFont = f.id; store.set('read-font', f.id);
      applyFont(f.id); $('#btnFontSelect').click(); // 重新渲染列表
      showToast('字体已切换', '🔤');
    };
    list.appendChild(div);
  });
  $('#zhFontPreview').style.fontFamily = $('#articleContent').style.fontFamily || document.body.style.fontFamily;
  $('#fontOverlay').classList.add('show');
};
$('#btnFontClose').onclick = () => $('#fontOverlay').classList.remove('show');