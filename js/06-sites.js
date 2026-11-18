/* =========================================================
   06-sites.js
   ========================================================= */

const pad = n => String(n).padStart(2, '0');
let sortableInstance = null;
let editingSiteIndex = -1;

/* =========================================================
   【新增】面包篮容量 / 图标 / 计数器（20261117）
   容量数字来自 js/02-config.js 的 siteLimitOf()，是前端「预检 + 显示」用的；
   真正的裁决在服务端 rpc_upsert_sites（见 sql/20261117-rpc-upsert-sites.sql）。
   ========================================================= */

/* 当前用户的容量上限（游客 8 / 普通 50 / VIP·SVIP 按等级，见 SITE_LIMIT_BANDS） */
function siteLimitNow() {
  if (!currentUser) return SITE_LIMIT_GUEST;
  const u = (typeof currentUserRecord === 'function') ? currentUserRecord() : null;
  if (!u) return SITE_LIMIT_NORMAL;
  const type = (u.vipType || 'none');
  /* 【修改】20261118：面包等级（user_level）也会加容量，每满 10 级 +5（Lv60 时 +30） */
  return siteLimitOf(type, u.vipLevel || 1, u.userLevel || 1);
}

/* 面包篮标题右侧的 “已用 / 上限” 计数器；limit 可由服务端返回值覆盖 */
function updateSiteCounter(used, limit) {
  const el = document.getElementById('siteCounter');
  if (!el) return;
  const u = (used === undefined || used === null) ? sites.length : Number(used);
  const l = (limit === undefined || limit === null) ? siteLimitNow() : Number(limit);
  const unlimited = (!l || l >= SITE_HARD_CAP);
  el.textContent = unlimited
    ? _loadT('sites.counterUnlimited', { used: u })
    : _loadT('sites.counter', { used: u, limit: l });
  el.classList.toggle('is-full', !unlimited && u >= l);
  /* 「＋」卡片：满了就变灰提示，点了会引导扩容 */
  const addTile = document.querySelector('#sitesGrid .tile.add');
  if (addTile) addTile.classList.toggle('is-full', !unlimited && u >= l);
}

function siteDomainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

/* 图标两段回退：站点自己的 /favicon.ico → DuckDuckGo 图标代理 → 首字母色块
   【删除】20261117：面包篮卡片改回「只显示文字」。
   原因：24 个字的站点名 + 24px 图标位挤在同一张 90px 卡片里，长名字显示不全；
   侧边天气/百宝箱已转正式，这里不再需要靠图标提高辨识度，纯文字更整齐。
   函数体保留在下方注释里备查，需要恢复时说明一下即可。 */
/*
function mountSiteIcon(tile, s) { ... }
*/

/* =========================================================
   站点渲染
   ========================================================= */
function renderSites() {
  const grid = $('#sitesGrid');
  grid.innerHTML = '';

  sites.forEach((s, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile fade-in';
    tile.style.animationDelay = (i * 0.04) + 's';
    tile.style.cursor = 'pointer';

    tile.dataset.name = s.name;
    tile.dataset.url = s.url;
    tile.title = s.name;   // 【新增】名称放宽后可能被截断，悬停显示完整名称

    tile.innerHTML = `
      <span class="name"></span>
      <button class="edit" title="${_loadT('sites.editTooltip')}">✏️</button>
      <button class="del">✕</button>
    `;
    tile.querySelector('.name').textContent = s.name;   /* 【修改】20261117：去掉图标位，只显示文字 */

    tile.onclick = (e) => {
      if (tile.classList.contains('tile-drag') || grid.classList.contains('sortable-drag')) {
        e.preventDefault();
        return false;
      }
      window.open(s.url, '_blank');
    };

    tile.querySelector('.edit').onclick = e => {
      e.preventDefault(); e.stopPropagation();
      if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');

      editingSiteIndex = i;
      document.querySelector('#siteOverlay h3').textContent = (typeof window.t === 'function') ? window.t('modals.editSite') : '✏️ 编辑站点';
      $('#fName').value = s.name;
      $('#fUrl').value = s.url;
      openOverlay($('#siteOverlay'));
    };

    tile.querySelector('.del').onclick = e => {
      e.preventDefault(); e.stopPropagation();
      if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
      sites.splice(i, 1);
      store.set(`bb-sites_${currentUser}`, sites);
      renderSites();
    };

    grid.appendChild(tile);
  });

  const add = document.createElement('div');
  add.className = 'tile add fade-in';
  add.style.animationDelay = (sites.length * 0.04) + 's';
  add.innerHTML = `<span class="plus">＋</span><span class="name">${_loadT('sites.addLabel')}</span>`;
  add.onclick = () => {
    if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
    /* 【新增】容量预检：满了先引导扩容，不打开弹窗（服务端 RPC 还会再拦一次） */
    const cap = siteLimitNow();
    if (cap < SITE_HARD_CAP && sites.length >= cap) {
      return showToast(_loadT('sites.limitReached', { limit: cap }), '🧺');
    }
    editingSiteIndex = -1;
    document.querySelector('#siteOverlay h3').textContent = (typeof window.t === 'function') ? window.t('modals.addSite') : '🧺 添加站点';
    $('#fName').value = '';
    $('#fUrl').value = '';
    openOverlay($('#siteOverlay'));
  };
  grid.appendChild(add);

  initDragAndDrop();
  updateSiteCounter();   /* 【新增】渲染完刷新 “已用 / 上限” 计数 */
}

function initDragAndDrop() {
  if (typeof Sortable === 'undefined') return;

  const grid = $('#sitesGrid');
  if (sortableInstance) sortableInstance.destroy();

  sortableInstance = new Sortable(grid, {
    animation: 200,
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    ghostClass: "tile-ghost",
    chosenClass: "tile-chosen",
    dragClass: "tile-drag",
    filter: ".add, .edit, .del",
    preventOnFilter: false,
    delay: 100,
    delayOnTouchOnly: true,
    onEnd: function (evt) {
      if (!currentUser) return;

      const newSites = [];
      const tiles = grid.querySelectorAll('.tile:not(.add)');
      tiles.forEach(t => {
        const name = t.dataset.name;
        const url = t.dataset.url;
        if (name && url) newSites.push({ name, url });
      });

      sites = newSites;
      store.set(`bb-sites_${currentUser}`, sites);
      renderSites();
    }
  });
}

// ========== 站点保存逻辑 ==========
$('#btnSiteCancel').onclick = () => closeOverlay($('#siteOverlay'));
$('#btnSiteSave').onclick = () => {
  const name = $('#fName').value.trim();
  let url = $('#fUrl').value.trim();

  if (!name || !url) return showToast(_loadT('sites.nameUrlRequired'), '🥯');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  if (editingSiteIndex !== -1) {
    sites[editingSiteIndex] = { name, url };
    showToast(_loadT('sites.updated'), '✏️');
  } else {
    /* 【新增】容量预检（编辑已有站点不算新增，只拦新增） */
    const cap = siteLimitNow();
    if (cap < SITE_HARD_CAP && sites.length >= cap) {
      return showToast(_loadT('sites.limitReached', { limit: cap }), '🧺');
    }
    sites.push({ name, url });
    /* 【新增】20261118：新增面包篮计入面包等级「烘焙度」（每天最多 10 次） */
    try { if (window.UserLevel && typeof window.UserLevel.track === 'function') window.UserLevel.track('basketAdd'); } catch (e) { /* 忽略 */ }
  }

  store.set(`bb-sites_${currentUser}`, sites);
  renderSites();
  closeOverlay($('#siteOverlay'));

  $('#fName').value = '';
  $('#fUrl').value = '';
};

// ========== 搜索历史 ==========
function renderHistoryList() {
  const list = $('#historyList');
  list.innerHTML = '';
  if (!history || history.length === 0) {
    const noHistory = (typeof window.t === 'function') ? window.t('modals.noHistory') : '暂无搜索历史';
    list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">${noHistory}</div>`;
    return;
  }
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const groups = { today: [], yesterday: [], older: [] };

  history.forEach(item => {
    const t = item.t || 0;
    if (t >= todayStart) groups.today.push(item);
    else if (t >= yesterdayStart) groups.yesterday.push(item);
    else groups.older.push(item);
  });

  const addGroup = (title, items) => {
    if (items.length === 0) return;
    const titleEl = document.createElement('div');
    titleEl.className = 'history-group-title';
    titleEl.textContent = title;
    list.appendChild(titleEl);

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      const qText = document.createElement('span');
      qText.textContent = item.q;
      qText.style.wordBreak = 'break-all';
      el.appendChild(qText);
      el.onclick = () => {
        closeOverlay($('#historyOverlay'));
        $('#searchInput').value = item.q;
        doSearch();
      };
      list.appendChild(el);
    });
  };
  
  const tToday = (typeof window.t === 'function') ? window.t('modals.today') : '今天';
  const tYesterday = (typeof window.t === 'function') ? window.t('modals.yesterday') : '昨天';
  const tOlder = (typeof window.t === 'function') ? window.t('modals.older') : '更早';

  addGroup(tToday, groups.today);
  addGroup(tYesterday, groups.yesterday);
  addGroup(tOlder, groups.older);
}

function doSearch() {
  const q = $('#searchInput').value.trim();
  if (!q) return;
  let url = /^https?:\/\//i.test(q) ? q : ENGINES[engineKey].url + encodeURIComponent(q);
  if (currentUser) {
    history = [{ q: q, t: Date.now() }, ...history.filter(h => h.q !== q)];
    store.set(`bb-history_${currentUser}`, history);
  }
  window.open(url, '_blank'); $('#searchInput').select();

  /* 【新增】VIP 任务记账：完成一次搜索。
     VipTasks.track 内部自行判断「是否有效会员」，非会员 / 游客时直接忽略，不影响原有搜索行为 */
  try { if (window.VipTasks) window.VipTasks.track('search'); } catch (e) { /* 记账失败不影响搜索 */ }
}

$('#btnHistory').onclick = () => {
  if (!currentUser) return showToast(_loadT('sites.historyLoginRequired'), '🔒');
  /* 【修改】20261119：先开窗再渲染，渲染异常不再导致「点不开」 */
  openOverlay($('#historyOverlay'));
  try { renderHistoryList(); } catch (err) { console.warn('[历史记录] 渲染失败', err); }
};
$('#btnHistoryClose').onclick = () => closeOverlay($('#historyOverlay'));
$('#btnClearHistory').onclick = () => {
  history = [];
  store.set(`bb-history_${currentUser}`, history);
  renderHistoryList();
  showToast(_loadT('sites.historyCleared'), '🧹');
};

// ========== 搜索框 placeholder ==========
function updateSearchPlaceholder() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  
  // 【修改】统一走全局 _loadT，引擎名同样取自词表（engines.*），语言切换时由 languageChanged 重新渲染
  let engineName = (typeof window.t === 'function') ? window.t('engines.' + engineKey) : ENGINES[engineKey].name;
  input.placeholder = _loadT('home.searchPlaceholder', { engine: engineName });
}
document.addEventListener('languageChanged', () => {
  updateSearchPlaceholder();
  renderHistoryList();
  /* 【新增】切换语言后刷新面包篮计数器 / 导出提示（这两处是 JS 拼出来的文案，不在 data-i18n 里） */
  updateSiteCounter();
  const htmlBtn = $('#btnSiteExportHtml');
  if (htmlBtn) htmlBtn.title = _loadT('sites.exportHtmlTip');
});

// 搜索引擎下拉菜单
$('#engineBtn').onclick = e => {
  e.stopPropagation();
  if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
  $('#engineMenu').classList.toggle('show');
};

$('#engineMenu').onclick = e => {
  const item = e.target.closest('.engine-item');
  if (!item) return;
  engineKey = item.dataset.k;
  store.set('bb-engine', engineKey);
  $('#engineIcon').textContent = ENGINES[engineKey].icon;
  updateSearchPlaceholder();
  $('#engineMenu').classList.remove('show');
};

document.onclick = e => {
  if (!$('#searchWrap').contains(e.target)) {
    $('#engineMenu').classList.remove('show');
  }
};

$('#btnGo').onclick = doSearch;
$('#searchInput').onkeydown = e => {
  if (e.key === 'Enter') doSearch();
};

Object.entries(ENGINES).forEach(([k, v]) => {
  const d = document.createElement('div');
  d.className = 'engine-item';
  d.dataset.k = k;
  d.innerHTML = `<span>${v.icon}</span><span data-i18n="engines.${k}">${v.name}</span>`;
  $('#engineMenu').appendChild(d);
});

$('#engineIcon').textContent = ENGINES[engineKey].icon;
updateSearchPlaceholder();

/* =========================================================
   【新增】面包篮导入 / 导出（20261117）
   - 导入：只解析浏览器导出的 .html 书签（Netscape 格式），自动去重 + 按容量截断
   - 导出：JSON 备份（所有人）；.html 书签（VIP / SVIP 专属）
   - 容量仍由 siteLimitNow() 预检，服务端 rpc_upsert_sites 再兜底
   ========================================================= */

function bookmarkEscapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function normalizeSiteUrl(u) {
  try {
    const x = new URL(u);
    return (x.hostname.replace(/^www\./, '') + x.pathname.replace(/\/+$/, '')).toLowerCase();
  } catch (e) { return String(u || '').toLowerCase(); }
}
function isPaidMember() {
  const u = (typeof currentUserRecord === 'function') ? currentUserRecord() : null;
  return !!(u && u.vipType && u.vipType !== 'none');
}
function downloadTextFile(filename, text, mime) {
  const blob = new Blob([text], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function exportSitesJson() {
  if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
  downloadTextFile(`bread-basket-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify({ exportedAt: new Date().toISOString(), count: sites.length, sites }, null, 2),
    'application/json');
  showToast(_loadT('sites.exportJsonDone', { count: sites.length }), '📤');
}

function exportSitesHtml() {
  if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
  if (!isPaidMember()) return showToast(_loadT('sites.exportHtmlVipOnly'), '👑');
  const lines = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bread Basket</TITLE>',
    '<H1>Bread Basket</H1>',
    '<DL><p>'
  ];
  sites.forEach(s => {
    lines.push(`    <DT><A HREF="${bookmarkEscapeHtml(s.url)}">${bookmarkEscapeHtml(s.name)}</A>`);
  });
  lines.push('</DL><p>');
  downloadTextFile('bread-basket.html', lines.join('\n'), 'text/html');
  showToast(_loadT('sites.exportHtmlDone', { count: sites.length }), '📤');
}

function importBookmarksHtml(text) {
  if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
  let doc = null;
  try { doc = new DOMParser().parseFromString(text, 'text/html'); } catch (e) { doc = null; }
  if (!doc) return showToast(_loadT('sites.importFailed'), '🥯');

  const existing = new Set(sites.map(s => normalizeSiteUrl(s.url)));
  const incoming = [];
  Array.from(doc.querySelectorAll('a[href]')).forEach(a => {
    const url = (a.getAttribute('href') || '').trim();
    if (!/^https?:/i.test(url)) return;
    const key = normalizeSiteUrl(url);
    if (existing.has(key)) return;
    existing.add(key);
    const name = (a.textContent || '').trim().slice(0, 24) || siteDomainOf(url) || url;
    incoming.push({ name, url });
  });

  if (incoming.length === 0) return showToast(_loadT('sites.importNone'), '📭');

  const cap = siteLimitNow();
  const room = Math.max(0, cap - sites.length);
  const accepted = incoming.slice(0, room);

  if (accepted.length === 0) {
    return showToast(_loadT('sites.limitReached', { limit: cap }), '🧺');
  }

  sites = sites.concat(accepted);
  store.set(`bb-sites_${currentUser}`, sites);   /* 触发云端推送（RPC 可用则走服务端裁决） */
  renderSites();

  if (accepted.length < incoming.length) {
    showToast(_loadT('sites.importPartial', { added: accepted.length, skipped: incoming.length - accepted.length, limit: cap }), '📥');
  } else {
    showToast(_loadT('sites.importDone', { added: accepted.length }), '📥');
  }
}

$('#btnSiteImport').onclick = () => {
  if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
  const input = $('#siteImportFile');
  if (!input) return;
  input.value = '';
  input.click();
};
$('#siteImportFile').onchange = e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => importBookmarksHtml(String(reader.result || ''));
  reader.onerror = () => showToast(_loadT('sites.importFailed'), '🥯');
  reader.readAsText(file, 'utf-8');
};
$('#btnSiteExportJson').onclick = exportSitesJson;
$('#btnSiteExportHtml').onclick = exportSitesHtml;
$('#btnSiteExportHtml').title = _loadT('sites.exportHtmlTip');