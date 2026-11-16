/* =========================================================
   06-sites.js
   ========================================================= */

const pad = n => String(n).padStart(2, '0');
let sortableInstance = null;
let editingSiteIndex = -1;

// ========== 站点渲染 ==========
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
    tile.querySelector('.name').textContent = s.name;

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
    editingSiteIndex = -1;
    document.querySelector('#siteOverlay h3').textContent = (typeof window.t === 'function') ? window.t('modals.addSite') : '🧺 添加站点';
    $('#fName').value = '';
    $('#fUrl').value = '';
    openOverlay($('#siteOverlay'));
  };
  grid.appendChild(add);

  initDragAndDrop();
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
    sites.push({ name, url });
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
  renderHistoryList();
  openOverlay($('#historyOverlay'));
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
  renderHistoryList(); // 语言切换时刷新历史列表的分组
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