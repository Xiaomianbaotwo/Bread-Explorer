/* =========================================================
   friend/js/01-friends-core.js —— 好友模块入口
   【拆分自】原 js/friend-system/01-friends-core.js 的前半部分（状态 + initFriendsUI）
   ========================================================= */

window.currentChatFriend = null;

function initFriendsUI() {
  const logoArea = document.querySelector('.logo');
  /* 【修改】好友系统属于内测功能（存在较严重 bug）：开关统一由 js/16-feature-flags.js 的
     beta_friend_system 提供，旧键 bb-show-beta 作为兼容回落保留在开关内部。
     好友功能不接入任何 VIP 任务，避免内测问题影响星光值结算。 */
  const showBeta = (window.BB_FEATURES && typeof window.BB_FEATURES.getFlag === 'function')
    ? window.BB_FEATURES.getFlag('beta_friend_system')
    : (localStorage.getItem('bb-show-beta') === 'true');

  if (logoArea && !document.getElementById('btnFriendsEntry')) {
    
    // ★ 核心修复：改为垂直排列，并强制左对齐
    const btnWrapper = document.createElement('div');
    btnWrapper.style = "display: flex; flex-direction: column; align-items: flex-start; gap: 8px; margin-top: 8px;";

    // 统一的按钮样式（左右内边距一致，保证视觉大小一致）
    const commonBtnStyle = "display: inline-flex; align-items: center; justify-content: center; height: 32px; padding: 0 12px; border-radius: 10px; background: var(--card); border: 1px solid var(--card-border); color: var(--ink); font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; box-sizing: border-box;";

    // 1. 注入好友按钮
    const btn = document.createElement('div');
    btn.id = 'btnFriendsEntry';
    btn.style = commonBtnStyle + (showBeta ? '' : 'display: none;') + 'position: relative;';
    btn.innerHTML = `${_loadT('friend.title')} <span id="friendRequestDot" class="friend-request-dot" style="position:absolute; top:-4px; right:-4px; width:8px; height:8px; background:#e74c3c; border-radius:50%; display:none;"></span>`;
    
    // 2. 注入建议箱按钮
    const btnSuggest = document.createElement('div');
    btnSuggest.id = 'btnSuggestEntry';
    btnSuggest.style = commonBtnStyle;
    btnSuggest.innerHTML = `${_loadT('friend.suggestionBox')}`;
    
    btnWrapper.appendChild(btn);
    btnWrapper.appendChild(btnSuggest);

    const textContainer = logoArea.querySelector('div');
    if (textContainer) {
      textContainer.appendChild(btnWrapper);
    } else {
      logoArea.appendChild(btnWrapper);
    }
    
    btn.onclick = () => openFriendsModal();
    btnSuggest.onclick = () => {
      if (!currentUser) return showToast(_loadT('common.loginRequired'), '🔒');
      showInputModal(_loadT('friend.suggestTitle'), _loadT('friend.suggestDesc'), '', async (input) => {
        if (!input.trim()) return;
        showToast(_loadT('friend.sending'), '⏳');
        const { error } = await sb.rpc('send_suggestion', { p_sender_name: currentUser, p_content: input });
        if (error) return showToast(_loadT('friend.sendFailed'), '❌');
        showToast(_loadT('friend.suggestSent'), '🎉');
        /* 【新增】VIP 任务记账：提交一条建议（每日/每周/每月建议任务共用这一处）
           建议箱属于正式功能，可以参与任务；好友系统本身不参与任务 */
        try { if (window.VipTasks) window.VipTasks.track('suggest'); } catch (e) { /* 记账失败不影响提交 */ }
      });
    };
  }

  // 3. 注入好友大弹窗
  if (!document.getElementById('friendsOverlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'friendsOverlay';
    overlay.innerHTML = `
      <div class="friends-modal" style="position: relative;">
        <button id="btnCloseFriendsTop" style="position: absolute; top: 12px; right: 15px; background: transparent; border: none; font-size: 22px; color: var(--ink-soft); cursor: pointer; z-index: 100;">✕</button>
        
        <div class="friends-sidebar">
          <div class="friends-search-box">
            <input type="text" id="friendSearchInput" placeholder="${_loadT('friend.searchUserPlaceholder')}" autocomplete="off">
            <button id="btnSearchFriend" style="flex-shrink: 0; white-space: nowrap;">${_loadT('friend.searchBtn')}</button>
          </div>
          <div id="friendSearchResult" class="search-result-box" style="display:none;"></div>
          <div class="friends-list" id="friendsList">
            <div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">${_loadT('friend.loading')}</div>
          </div>
        </div>
        
        <div class="chat-area" id="chatArea">
          <div class="chat-empty" id="chatEmptyState">
            <div style="font-size:40px; margin-bottom:10px;">🍞</div>
            <div>${_loadT('friend.emptyState')}</div>
          </div>
          <div class="chat-header" id="chatHeader" style="display:none;">
            <span id="chatFriendName">${_loadT('friend.friendName')}</span>
            <button id="btnClearChat" title="${_loadT('friend.clearTooltip')}" style="margin-left:auto; background:transparent; border:none; color:#e74c3c; font-size:16px; cursor:pointer; margin-right: 15px; font-weight: bold;">🗑 ${_loadT('friend.clear')}</button>
            <button class="btn-close-chat" id="btnCloseFriends" style="background:transparent; border:none; color:var(--ink-soft); font-size:20px; cursor:pointer;">✕</button>
          </div>
          <div class="chat-messages" id="chatMessages" style="display:none;"></div>
          <div class="chat-input-area" id="chatInputArea" style="display:none;">
            <button class="btn-gift" id="btnOpenGift" title="${_loadT('friend.giftTooltip')}">🎁</button>
            <input type="text" id="chatInput" placeholder="${_loadT('friend.inputPlaceholder')}" autocomplete="off">
            <button class="btn-send" id="btnSendMessage">${_loadT('friend.send')}</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const closeModal = () => {
    document.getElementById('friendsOverlay').classList.remove('show');
    window.currentChatFriend = null; 
    if (typeof window.resetChatUI === 'function') window.resetChatUI();
  };
  
  document.getElementById('btnCloseFriendsTop').onclick = closeModal;
  document.getElementById('btnCloseFriends').onclick = closeModal;
  
  document.getElementById('btnClearChat').onclick = () => {
    if (typeof window.clearLocalChat === 'function') window.clearLocalChat();
  };

  const searchInput = document.getElementById('friendSearchInput');
  const btnSearch = document.getElementById('btnSearchFriend');
  btnSearch.onclick = () => doSearchUser();
  searchInput.onkeydown = (e) => { if (e.key === 'Enter') doSearchUser(); };
  
  if (typeof window.initChatSystem === 'function') window.initChatSystem();
  if (typeof window.initGiftSystem === 'function') window.initGiftSystem();
}

