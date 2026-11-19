/* =========================================================
   05-font-theme.js
   ========================================================= */

const PREVIEW_TEXT_ZH = `江畔花事
作者：deepeeek
序幕：江风起处，花事开场
闽江自西而来，绕过洪山，过了解放大桥，江面便渐渐开阔。流到福州城南时，江水已失却山间的那份急促，只余一派缓缓铺展的苍黄。南岸有一段江滩，被开辟成花海公园。它贴着江岸铺开，东起魁浦大桥方向，西至鼓山大桥以西，绵延数里。园区不大，却有四季轮换的花田，有湿地芦苇，有曲折的木栈道，还有一处临江而筑的观鸟屋。鼓山大桥恰从公园中段凌空跨过，灰白的桥塔与无数斜拉索，像一架巨琴，把江天与花田连在一起。江畔花事，便在这琴弦下拉开了序幕。
春·油菜花开时，江雾也亮了
立春过后，江风里的寒意渐渐软了。湿地的水先醒过来。那些藏在芦苇枯秆下的浅水，不再冰冷，开始映出天光。芦芽从腐叶间顶出，紫红的、尖尖的，像一支支蘸饱了春色的笔。木栈道的木板吸足了夜露，颜色变深，纹理像墨线勾过。栈道两边的泥滩上，江蓠和苔藓悄悄返青，细看，已有极小的绿色叶片铺成一片。`;

const BUILTIN_EN_FONTS = [
  { id: 'default', name: '默认英文字体', enName: 'Default English Font' },
  { id: 'round', name: '圆体/黑体', enName: 'Round / Sans' },
  { id: 'mono', name: '等宽字体', enName: 'Monospace' },
  { id: 'local-en-1', name: '📁 Aguarina Script' },
  { id: 'local-en-2', name: '📁 Cascadia' },
  { id: 'local-en-3', name: '📁 Dancing Script' },
  { id: 'local-en-4', name: '📁 Dancing Script Bold' }
];

const BUILTIN_ZH_FONTS = [
  { id: 'default', name: '默认中文字体', enName: 'Default Chinese Font' },
  { id: 'kai', name: '楷体', enName: 'KaiTi' },
  { id: 'song', name: '宋体', enName: 'SimSun' },
  { id: 'round', name: '圆体/黑体', enName: 'Round / Sans' },
  { id: 'mono', name: '等宽字体', enName: 'Monospace' },
  { id: 'local-zh-1', name: '📁 杨任东竹石体' },
  { id: 'local-zh-2', name: '📁 字魂告白情书体' },
  { id: 'local-zh-3', name: '📁 字魂焦绿猫体' },
  { id: 'local-zh-4', name: '📁 字魂开心消消乐体' },
  { id: 'local-zh-5', name: '📁 字魂甜豆体' },
  { id: 'local-zh-6', name: '📁 字魂夏日诗歌体' },
  { id: 'local-zh-7', name: '📁 字魂安酱 W5' },
  { id: 'local-zh-8', name: '📁 字魂阅宋' },
  { id: 'local-zh-9', name: '📁 字小魂初林体' },
  { id: 'local-zh-10', name: '📁 字小魂萌萌哒体' },
  { id: 'local-zh-11', name: '📁 字小魂胖胖体' },
  { id: 'local-zh-12', name: '📁 字小魂天真儿风体' },
  { id: 'local-zh-13', name: '📁 字小魂杨任东楷书' }
];

// ★ 核心修复：严格隔离中英文字体映射
function getFontFamily(id, u, type = '') {
  if (type === 'en') {
    // 英文映射：去掉了所有通用族（如 monospace）和中文字体，防止截胡
    if (id === 'default') return 'Arial, Helvetica';
    if (id === 'mono') return 'Consolas, "Courier New"';
    if (id === 'round') return 'Verdana, Arial';
    if (id === 'kai') return 'Georgia, "Times New Roman"';
    if (id === 'song') return '"Times New Roman", Times';
    
    if (id === 'local-en-1') return "'AguarinaScript'";
    if (id === 'local-en-2') return "'Cascadia'";
    if (id === 'local-en-3') return "'DancingScript'";
    if (id === 'local-en-4') return "'DancingScriptBold'";
  } 
  
  if (type === 'zh') {
    // 中文映射：这里才允许使用系统中文和通用族
    if (id === 'default') return '"PingFang SC", "Microsoft YaHei", sans-serif';
    if (id === 'kai') return '"KaiTi", "STKaiti", "楷体"';
    if (id === 'song') return '"SimSun", "Songti SC", "宋体"';
    if (id === 'round') return '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei"';
    if (id === 'mono') return '"Consolas", "Courier New", monospace';
    
    if (id === 'local-zh-1') return "'YangRenDong'";
    if (id === 'local-zh-2') return "'ZiHunGaoBai'";
    if (id === 'local-zh-3') return "'ZiHunJiaoLvMao'";
    if (id === 'local-zh-4') return "'ZiHunXiaoXiaoLe'";
    if (id === 'local-zh-5') return "'ZiHunTianDou'";
    if (id === 'local-zh-6') return "'ZiHunXiaRi'";
    if (id === 'local-zh-7') return "'ZiHunAnJiang'";
    if (id === 'local-zh-8') return "'ZiHunYueSong'";
    if (id === 'local-zh-9') return "'ZiXiaoHunChuLin'";
    if (id === 'local-zh-10') return "'ZiXiaoHunMengMengDa'";
    if (id === 'local-zh-11') return "'ZiXiaoHunPangPang'";
    if (id === 'local-zh-12') return "'ZiXiaoHunTianZhen'";
    if (id === 'local-zh-13') return "'ZiXiaoHunYangRenDong'";
  }

  // 自定义上传的处理
  if (id.startsWith('custom_')) {
    let f = u.customFonts ? u.customFonts.find(x => x.id === id) : null;
    return f ? `'${f.id}'` : 'sans-serif';
  }
  return '';
}

function applyFont(enFontId, zhFontId, u) {
  let oldStyle = document.getElementById('dynamic-font-style');
  if (oldStyle) oldStyle.remove();

  let styleContent = '';

  // 获取英文基础字体链
  let enFamily = getFontFamily(enFontId, u, 'en');
  if (enFontId && enFontId.startsWith('custom_')) {
    let f = u.customFonts ? u.customFonts.find(x => x.id === enFontId) : null;
    if (f) {
      styleContent += `@font-face { font-family: '${f.id}'; src: url('${f.data}'); }\n`;
      enFamily = `'${f.id}'`;
    }
  }

  // 获取中文基础字体链
  let zhFamily = getFontFamily(zhFontId, u, 'zh');
  if (zhFontId && zhFontId.startsWith('custom_')) {
    let f = u.customFonts ? u.customFonts.find(x => x.id === zhFontId) : null;
    if (f) {
      styleContent += `@font-face { font-family: '${f.id}'; src: url('${f.data}'); }\n`;
      zhFamily = `'${f.id}'`;
    }
  }

  // ★ 终极组合：英文排前，中文排后，全局兜底加上 sans-serif
  const fontStr = `${enFamily}, ${zhFamily}, sans-serif`;

  const style = document.createElement('style');
  style.id = 'dynamic-font-style';
  style.textContent = styleContent + `
    html, body, body *, h1, p, input, button {
      font-family: ${fontStr} !important;
    }
  `;
  document.head.appendChild(style);

  // 等待字体加载后，强制打补丁，保证覆盖彻底
  document.fonts.ready.then(() => {
    const allElements = document.querySelectorAll('body, body *:not(.font-item-sample):not(#enFontPreview):not(#zhFontPreview)');
    allElements.forEach(el => {
      el.style.setProperty('font-family', fontStr, 'important');
    });
  });
}

function applyTheme() {
  const body = document.body;

  /* 【新增】20261118：主题切换过渡。
     只在「切换」时给 body 挂 .theme-switching（首屏不播），
     强制一次 reflow 让浏览器记住旧配色，再换主题类，颜色就会柔和渐变。
     过渡规则写在 css/07-ui-tokens.css。 */
  const animate = !!window.__themeBooted;
  if (animate) {
    body.classList.add('is-theme-switching');
    void body.offsetWidth;
  }
  clearTimeout(window.__themeSwitchTimer);

  body.classList.remove('dark');
  Array.from(body.classList).forEach(c => {
    if (c.startsWith('theme-')) body.classList.remove(c);
  });
  
  if (theme === 'dark') body.classList.add('dark');
  
  if (currentTheme && currentTheme !== 'default') {
    // 提取基础主题名，让 flower-max、spring-max、winter-ultimate 都能自动适配基础配色
    let baseTheme = currentTheme.replace('-plus', '').replace('-max', '').replace('-ultimate', '');
    
    // 面包原野系列默认使用 :root 配色，不需要额外加 theme-default
    if (baseTheme !== 'default') {
      body.classList.add('theme-' + baseTheme);
    }

    /* 【新增】20261119：Plus / Max / Ultimate 档位额外挂一层类，
       让「蜂蜜工坊」「冬日雪境」这类主题可以按档位换更深一层的配色；
       其它主题没有对应样式，不受影响。 */
    if (currentTheme.endsWith('-plus')) body.classList.add('theme-tier-plus');
    else if (currentTheme.endsWith('-max')) body.classList.add('theme-tier-max');
    else if (currentTheme.endsWith('-ultimate')) body.classList.add('theme-tier-ultimate');
  }
  
  $('#btnTheme').textContent = theme === 'dark' ? '☀️' : '🌙';
  if (typeof refreshEmojiBackground === 'function') refreshEmojiBackground();
  else {
    $('#breadBg').innerHTML = '';
    for (let i = 0; i < 15; i++) {
      if (typeof spawnBread === 'function') spawnBread();
    }
  }

  /* 【新增】20261119：冬日雪境 Plus 以上同步真实雪层 */
  if (window.WinterFX && typeof window.WinterFX.sync === 'function') {
    try { window.WinterFX.sync(); } catch (err) { console.warn('[冬日雪境] 同步失败', err); }
  }

  /* 【新增】20261119：绿野仙踪 / 春日花信 / 盛夏海岸 / 秋日私语雨效同步。
     夏季由 RainFX 内部按概率决定是否触发雷阵雨。 */
  if (window.RainFX && typeof window.RainFX.sync === 'function') {
    try { window.RainFX.sync(); } catch (err) { console.warn('[雨效] 同步失败', err); }
  }

  /* 【修改】20261118：过渡延长到 0.8s，定时器同步延后到 900ms，
     避免背景渐变还在补间时过渡类就被撤掉。 */
  if (animate) {
    window.__themeSwitchTimer = setTimeout(() => {
      document.body.classList.remove('is-theme-switching');
    }, 900);
  }
  window.__themeBooted = true;
}

function updatePreviewBoxes() {
  if (!currentUser) return;
  const u = getUsersDB()[currentUser];
  const enFamily = getFontFamily(u.enFont, u, 'en');
  const zhFamily = getFontFamily(u.zhFont, u, 'zh');

  const enText = `0 1 2 3 4 5 6 7 8 9<br>
                  A B C D E F G H I J K L M N O P Q R S T U V W X Y Z<br>
                  a b c d e f g h i j k l m n o p q r s t u v w x y z`;
  
  $('#enFontPreview').innerHTML = enText;
  $('#enFontPreview').style.setProperty('font-family', enFamily, 'important');

  $('#zhFontPreview').innerText = PREVIEW_TEXT_ZH;
  $('#zhFontPreview').style.setProperty('font-family', zhFamily, 'important');
}

/* 【新增】字体名按当前语言显示；专有字体名（如“字魂xxx”）保持原样，只翻译通用描述名 */
function fontLabel(f) {
  const isEn = (typeof window.getLang === 'function') ? window.getLang() === 'en' : false;
  return (isEn && f.enName) ? f.enName : f.name;
}

function renderFontLists() {
  if (!currentUser) return;
  const users = getUsersDB(); const u = users[currentUser];
  
  const enSearch = ($('#enFontSearch').value || '').toLowerCase();
  const zhSearch = ($('#zhFontSearch').value || '').toLowerCase();

  const enList = $('#enFontList'); enList.innerHTML = '';
  const allEnFonts = [...BUILTIN_EN_FONTS, ...(u.customFonts || []).filter(f => f.type === 'en')];
  allEnFonts.filter(f => f.name.toLowerCase().includes(enSearch)).forEach(f => {
    const div = document.createElement('div');
    div.className = 'font-item' + (u.enFont === f.id ? ' active' : '');
    
    const family = getFontFamily(f.id, u, 'en');
    div.innerHTML = `<span class="font-item-name">${fontLabel(f)}</span><span class="font-item-sample" style="font-family:${family} !important;">Aa 123</span>`;
    
    if (f.id.startsWith('custom_')) {
      const del = document.createElement('span');
      del.innerHTML = '🗑️'; del.className = 'del-btn';
      del.onclick = (e) => {
        e.stopPropagation();
        showConfirmModal(_loadT('font.deleteTitle'), _loadT('font.deleteDesc', { name: f.name }), () => {
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          upU.customFonts = upU.customFonts.filter(x => x.id !== f.id);
          if (upU.enFont === f.id) upU.enFont = 'default';
          store.set('bb-users', upUsers);
          loadUserData(); renderFontLists(); updatePreviewBoxes();
          showToast(_loadT('font.deleted'), '🧹');
        });
      };
      div.appendChild(del);
    }

    div.onclick = () => {
      let upUsers = getUsersDB(); let upU = upUsers[currentUser];
      upU.enFont = f.id; store.set('bb-users', upUsers);
      applyFont(upU.enFont, upU.zhFont, upU);
      renderFontLists(); updatePreviewBoxes();
      showToast(_loadT('font.enSwitched'), '🖋️');
    };
    enList.appendChild(div);
  });

  const zhList = $('#zhFontList'); zhList.innerHTML = '';
  const allZhFonts = [...BUILTIN_ZH_FONTS, ...(u.customFonts || []).filter(f => f.type === 'zh')];
  allZhFonts.filter(f => f.name.toLowerCase().includes(zhSearch)).forEach(f => {
    const div = document.createElement('div');
    div.className = 'font-item' + (u.zhFont === f.id ? ' active' : '');
    
    const family = getFontFamily(f.id, u, 'zh');
    div.innerHTML = `<span class="font-item-name">${fontLabel(f)}</span><span class="font-item-sample" style="font-family:${family} !important;">江畔花事</span>`;
    
    if (f.id.startsWith('custom_')) {
      const del = document.createElement('span');
      del.innerHTML = '🗑️'; del.className = 'del-btn';
      del.onclick = (e) => {
        e.stopPropagation();
        showConfirmModal(_loadT('font.deleteTitle'), _loadT('font.deleteDesc', { name: f.name }), () => {
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          upU.customFonts = upU.customFonts.filter(x => x.id !== f.id);
          if (upU.zhFont === f.id) upU.zhFont = 'default';
          store.set('bb-users', upUsers);
          loadUserData(); renderFontLists(); updatePreviewBoxes();
          showToast(_loadT('font.deleted'), '🧹');
        });
      };
      div.appendChild(del);
    }

    div.onclick = () => {
      let upUsers = getUsersDB(); let upU = upUsers[currentUser];
      upU.zhFont = f.id; store.set('bb-users', upUsers);
      applyFont(upU.enFont, upU.zhFont, upU);
      renderFontLists(); updatePreviewBoxes();
      showToast(_loadT('font.zhSwitched'), '🖋️');
    };
    zhList.appendChild(div);
  });
}

$('#enFontSearch').oninput = renderFontLists;
$('#zhFontSearch').oninput = renderFontLists;

function handleFontUpload(files, type) {
  if (!files || files.length === 0) return;
  
  let validFiles = [];
  for (let i = 0; i < files.length; i++) {
    if (files[i].size > 100 * 1024 * 1024) {
      showToast(_loadT('font.tooLarge', { name: files[i].name }), '⚠️');
    } else {
      validFiles.push(files[i]);
    }
  }
  
  if (validFiles.length === 0) return;

  let readPromises = validFiles.map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        resolve({
          id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: file.name.replace(/\.[^/.]+$/, ""), 
          type: type,
          data: ev.target.result
        });
      };
      reader.readAsDataURL(file);
    });
  });

  showToast(_loadT('font.reading', { count: validFiles.length }), '⏳');

  Promise.all(readPromises).then(newFonts => {
    let users = getUsersDB(); let u = users[currentUser];
    if (!u.customFonts) u.customFonts = [];
    
    u.customFonts.push(...newFonts);
    
    const lastFont = newFonts[newFonts.length - 1];
    if (type === 'en') u.enFont = lastFont.id;
    else u.zhFont = lastFont.id;

    /* 【修正】20261119：store.set 返回 Promise，原来写成 if (store.set(...))
       永远为真，localStorage 配额失败时也会提示“上传成功”。
       改为按 Promise 的成功/失败分支处理。 */
    Promise.resolve(store.set('bb-users', users)).then(() => {
      applyFont(u.enFont, u.zhFont, u);
      renderFontLists(); 
      updatePreviewBoxes();
      showToast(_loadT('font.uploadSuccess', { count: newFonts.length }), '🎉');
    }).catch(() => {
      u.customFonts = u.customFonts.filter(f => !newFonts.some(nf => nf.id === f.id));
      showToast(_loadT('font.storageFull'), '❌');
    });
  }).catch(err => {
    showToast(_loadT('font.readFailed'), '❌');
  });
}

$('#btnUploadEnFont').onclick = () => { if (currentUser) $('#enFontUpload').click(); };
$('#enFontUpload').onchange = (e) => { handleFontUpload(e.target.files, 'en'); e.target.value = ''; };

$('#btnUploadZhFont').onclick = () => { if (currentUser) $('#zhFontUpload').click(); };
$('#zhFontUpload').onchange = (e) => { handleFontUpload(e.target.files, 'zh'); e.target.value = ''; };

$('#btnTheme').onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; store.set('bb-theme', theme); applyTheme(); };