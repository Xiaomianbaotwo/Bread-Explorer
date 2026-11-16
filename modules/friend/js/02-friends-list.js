/* =========================================================
   friend/js/02-friends-list.js —— 好友列表 / 搜索 / 好友申请
   【拆分自】原 js/friend-system/01-friends-core.js 的后半部分（逐字保留）
   ========================================================= */

async function openFriendsModal() {
  document.getElementById('friendsOverlay').classList.add('show');
  await loadFriendsList();
  updateFriendRequestDot();
}

async function loadFriendsList() {
  const listEl = document.getElementById('friendsList');
  listEl.innerHTML = `<div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">${_loadT('friend.loading')}</div>`;
  
  try {
    const { data: friendsData, error: err1 } = await sb
      .from('bread_friends')
      .select('friend_name, friend_avatar, is_starred')
      .eq('user_name', currentUser);

    if (err1) throw err1;

    if (!friendsData || friendsData.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">${_loadT('friend.noFriends')}</div>`;
      return;
    }

    friendsData.sort((a, b) => (b.is_starred === true ? 1 : 0) - (a.is_starred === true ? 1 : 0));

    listEl.innerHTML = '';
    friendsData.forEach(uInfo => {
      const el = document.createElement('div');
      el.className = 'friend-item';
      el.style = "display:flex; align-items:center;";
      
      const starIcon = uInfo.is_starred ? '🩷' : '🤍';
      
      el.innerHTML = `
        <img src="${uInfo.friend_avatar || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23e8933a%22/><text x=%2250%22 y=%2255%22 font-size=%2250%22 text-anchor=%22middle%22 fill=%22white%22>${uInfo.friend_name[0].toUpperCase()}</text></svg>'}" alt="avatar">
        <div class="friend-info">
          <div class="friend-name">${uInfo.friend_name}</div>
        </div>
        <div class="star-btn" data-name="${uInfo.friend_name}" style="cursor:pointer; font-size:16px; padding:4px; margin-left:auto;">${starIcon}</div>
      `;
      
      el.querySelector('.friend-info').onclick = () => {
        document.querySelectorAll('.friend-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
        window.currentChatFriend = { username: uInfo.friend_name, avatar: uInfo.friend_avatar };
        if (typeof window.switchChatWindow === 'function') {
          window.switchChatWindow(window.currentChatFriend);
        }
      };

      el.querySelector('.star-btn').onclick = async (e) => {
        e.stopPropagation();
        const isStarred = !uInfo.is_starred;
        await sb.from('bread_friends')
          .update({ is_starred: isStarred })
          .eq('user_name', currentUser)
          .eq('friend_name', uInfo.friend_name);
        await loadFriendsList();
      };

      listEl.appendChild(el);
    });

  } catch (err) {
    console.error('加载好友失败', err);
    listEl.innerHTML = `<div style="text-align:center; padding:20px; color:#e74c3c; font-size:13px; word-break:break-all;">${_loadT('friend.loadFailed', { msg: err.message })}</div>`;
  }
}

async function doSearchUser() {
  const keyword = document.getElementById('friendSearchInput').value.trim();
  const resultBox = document.getElementById('friendSearchResult');
  
  if (!keyword) return;
  resultBox.style.display = 'block';
  resultBox.innerHTML = `<div style="font-size:12px; color:var(--ink-soft);">${_loadT('friend.searching')}</div>`;

  try {
    const { data, error } = await sb.rpc('search_user_v1', { p_keyword: keyword });
    if (error) throw error;

    if (!data || data.length === 0) {
      resultBox.innerHTML = `<div style="font-size:12px; color:#e74c3c;">${_loadT('friend.userNotFound')}</div>`;
      return;
    }

    resultBox.innerHTML = '';
    data.forEach(userInfo => {
      if (userInfo.username === currentUser) return;

      const el = document.createElement('div');
      el.className = 'search-result-item';
      el.innerHTML = `
        <img src="${userInfo.avatar || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%238e44ad%22/><text x=%2250%22 y=%2255%22 font-size=%2250%22 text-anchor=%22middle%22 fill=%22white%22>${userInfo.username[0].toUpperCase()}</text></svg>'}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
        <div style="font-size:13px; font-weight:600;">${userInfo.username}</div>
        <button class="btn-send-req" data-name="${userInfo.username}">${_loadT('friend.addFriend')}</button>
      `;
      resultBox.appendChild(el);
    });

    resultBox.querySelectorAll('.btn-send-req').forEach(btn => {
      btn.onclick = async () => {
        const targetName = btn.dataset.name;
        btn.disabled = true; btn.textContent = _loadT('friend.adding');

        try {
          const { error } = await sb.rpc('send_friend_request', { p_receiver_name: targetName, p_sender_name: currentUser });
          if (error) throw error;
          showToast(_loadT('friend.requestSent'), '📧');
          btn.textContent = _loadT('friend.requestSentShort');
          resultBox.style.display = 'none';
          document.getElementById('friendSearchInput').value = '';
        } catch (err) { showToast(_loadT('friend.sendFailed'), '❌'); btn.disabled = false; btn.textContent = _loadT('friend.addFriend'); }
      };
    });
  } catch (err) { resultBox.innerHTML = `<div style="font-size:12px; color:#e74c3c;">${_loadT('friend.searchFailed')}</div>`; }
}

window.acceptFriendRequest = async function(senderName) {
  try {
    const { error } = await sb.rpc('accept_friend_request', { p_my_name: currentUser, p_friend_name: senderName });
    if (error) throw error;
    showToast(_loadT('friend.becameFriends', { name: senderName }), '🎉');
    if (document.getElementById('friendsOverlay').classList.contains('show')) await loadFriendsList();
  } catch (err) { showToast(_loadT('friend.actionFailed'), '❌'); }
};

async function updateFriendRequestDot() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  const { data, error } = await sb.from('bread_assets').select('emails').eq('user_id', user.id).maybeSingle();
  if (!error && data && data.emails) {
    const hasPending = data.emails.some(e => e.type === 'friend_request' && !e.isUsed);
    const dot = document.getElementById('friendRequestDot');
    if (dot) dot.style.display = hasPending ? 'block' : 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initFriendsUI();
  setTimeout(updateFriendRequestDot, 3000);

  // ★ 核心：监听用户中心里的“内测开关”
  const betaToggle = document.getElementById('showBetaToggle');
  if (betaToggle) {
    betaToggle.checked = localStorage.getItem('bb-show-beta') === 'true';
    betaToggle.onchange = (e) => {
      const isChecked = e.target.checked;
      localStorage.setItem('bb-show-beta', isChecked);
      
      const btn = document.getElementById('btnFriendsEntry');
      if (btn) btn.style.display = isChecked ? 'inline-flex' : 'none';
      
      if (!isChecked) {
        const overlay = document.getElementById('friendsOverlay');
        if (overlay && overlay.classList.contains('show')) {
          overlay.classList.remove('show');
        }
      }
    };
  }
});