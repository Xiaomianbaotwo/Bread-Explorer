/* =========================================================
   07-mail.js
   邮件中心 (完美适配拆礼包：积分、主题、兑换码)
   ========================================================= */

async function syncEmailsToCloud(u) {
  try {
    await sb.rpc('update_user_emails', { p_emails: u.emails });
  } catch (e) {
    console.error("云端邮件状态同步失败:", e);
  }
}

function renderMails() {
  if (!currentUser) return;
  let users = getUsersDB(); let u = users[currentUser];
  if (!u.emails) u.emails = [];

  let hasChanged = false;
  u.emails.forEach(e => {
    if (!e.isRead) { e.isRead = true; hasChanged = true; }
  });
  
  if (hasChanged) {
    store.set('bb-users', users); 
    syncEmailsToCloud(u); 
  }
  updateUserUI();

  const _t = (key, fallback) => (typeof window.t === 'function') ? window.t('modals.' + key, { defaultValue: (fallback === undefined ? key : fallback) }) : fallback;

  /* 【新增】云端 SQL 生成的邮件会把中英文都带上（title/content + titleEn/contentEn），
     这里按当前界面语言取；老邮件没有英文字段时自动回落中文，显示效果不变。 */
  const mailText = (e, field) => {
    const isEn = (typeof window.getLang === 'function') ? window.getLang() === 'en' : false;
    const en = e[field + 'En'];
    if (isEn && en) return en;
    return e[field] || '';
  };

  const list = $('#mailList'); list.innerHTML = '';
  if (u.emails.length === 0) {
    list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">${_t('noMail', '暂时没有邮件哦～')}</div>`;
  } else {
    u.emails.sort((a, b) => b.date - a.date).forEach((e, idx) => {
      const item = document.createElement('div');
      item.className = 'mail-item';

      let attachHtml = '';
      /* 【新增】统一取出这封邮件里的兑换码列表：
         - 新格式 e.codes = [{ code, isUsed, failReason }]（一封邮件可带多个码）
         - 老格式 e.code 单码，自动包成一条，保持向后兼容 */
      const codeEntries = (Array.isArray(e.codes) && e.codes.length)
        ? e.codes
        : (e.code ? [{ code: e.code, isUsed: !!e.isUsed, failReason: e.failReason }] : []);
      
      if (e.type === 'friend_request') {
        const acceptTxt = _t('accept', '✅ 同意申请');
        const rejectTxt = _t('reject', '❌ 拒绝');
        attachHtml = `
          <div style="display:flex; justify-content:center; gap:10px; margin-top:10px;">
            <button class="btn primary btn-accept-friend" data-name="${e.sender_name}" data-mailid="${e.id}" ${e.isUsed ? 'disabled style="opacity:0.5;"' : ''}>${acceptTxt}</button>
            <button class="btn ghost btn-reject-friend" data-mailid="${e.id}" ${e.isUsed ? 'disabled style="opacity:0.5;"' : ''}>${rejectTxt}</button>
          </div>
        `;
      } 
      else if (e.type === 'gift_package') {
        const pkgTxt = _t('giftPackage', '🎁 神秘礼包');
        const openTxt = e.isClaimed ? _t('claimed', '✅ 已拆开') : _t('openNow', '📦 立即拆开');
        attachHtml = `
          <div style="background:linear-gradient(135deg, #ff9800, #e74c3c); padding:12px; border-radius:8px; font-size:16px; text-align:center; color:#fff; margin-top:10px; font-weight:bold;">
            ${pkgTxt}
          </div>
          <div style="display:flex; justify-content:center; margin-top:8px;">
            <button class="btn primary claim-gift-btn" data-idx="${idx}" ${e.isClaimed ? 'disabled style="opacity:0.5;"' : ''}>${openTxt}</button>
          </div>
        `;
      }
      else if (e.type === 'vip_reward') {
        /* 【新增】VIP 等级奖励邮件：带自选主题名额时给「立即领取」，纯每日积分奖励则标注自动生效 */
        const cfg = e.reward || {};
        const hasPicks = (Number(cfg.plusPick) > 0) || (Number(cfg.maxPick) > 0) || cfg.allPlus || cfg.allMax || cfg.allBase || cfg.springTheme;
        /* 【新增】拆封发放的第二封（Max 名额）：上一封没领就不能领 */
        const dep = (e.dependsOn && currentUser && getUsersDB()[currentUser])
          ? getUsersDB()[currentUser].emails.find(m => m.id === e.dependsOn) : null;
        const depLocked = !!(dep && !dep.isClaimed);
        if (hasPicks) {
          const btnTxt = e.isClaimed ? _loadT('vip.rewardClaimed') : (depLocked ? _loadT('vip.rewardNeedPrev') : _loadT('vip.rewardClaim'));
          attachHtml = `
            <div style="display:flex; justify-content:center; margin-top:10px;">
              <button class="btn primary vip-reward-btn" ${(e.isClaimed || depLocked) ? 'disabled style="opacity:0.5;"' : ''}>${btnTxt}</button>
            </div>
          `;
        } else {
          attachHtml = `<div style="font-size:12px;color:var(--ink-soft);margin-top:8px;text-align:center;">${_loadT('vip.rewardAuto')}</div>`;
        }
      }
      else if (codeEntries.length) {
        /* 【新增】一封邮件可携带多个兑换码（e.codes 数组），老的单个 e.code 自动包成一条，
           每种码各占一行、各自有「立即使用」按钮，互不影响。 */
        const rowHtml = codeEntries.map((c, ci) => {
          const used = !!c.isUsed;
          const btnTxt = used ? (c.failReason || _t('used', '❌ 已被使用')) : _t('useNow', '⚡ 立即使用');
          return `
            <div class="mail-code-box" data-ci="${ci}" style="background:var(--card); padding:8px; border-radius:6px; font-family:monospace; font-size:15px; text-align:center; letter-spacing:1px; color:var(--accent); margin-top:8px; border:1px dashed var(--card-border); cursor:pointer;">
              ${c.code}
            </div>
            <div style="display:flex; justify-content:center; margin-top:6px;">
              <button class="btn primary use-btn" data-ci="${ci}" data-code="${c.code}" ${used ? 'disabled style="opacity:0.5;"' : ''}>${btnTxt}</button>
            </div>
          `;
        }).join('');
        attachHtml = (codeEntries.length > 1
          ? `<div style="font-size:12px; color:var(--ink-soft); margin-top:8px;">${_loadT('mail.multiCodeHint', { n: codeEntries.length })}</div>`
          : '') + rowHtml;
      } 
      else if (e.points) {
        const claimTxt = e.isClaimed ? _t('claimedPoints', '✅ 已领取') : _t('claimPoints', '📥 领取积分');
        attachHtml = `
          <div style="background:var(--card); padding:8px; border-radius:6px; font-size:16px; text-align:center; color:var(--accent); margin-top:10px; border:1px dashed var(--card-border);">
            ${_loadT('mail.pointsAmount', { pts: e.points })}
          </div>
          <div style="display:flex; justify-content:center; margin-top:8px;">
            <button class="btn primary claim-btn" data-idx="${idx}" ${e.isClaimed ? 'disabled style="opacity:0.5;"' : ''}>${claimTxt}</button>
          </div>
        `;
      }

      let statusHtml = '';
      if (e.type === 'friend_request') {
        statusHtml = `<span style="color:${e.isUsed ? '#e74c3c' : '#27ae60'}">${e.isUsed ? _t('processed', '❌ 已处理') : _t('pending', '✅ 待处理')}</span>`;
      } else if (e.type === 'gift_package') {
        statusHtml = `<span style="color:${e.isClaimed ? '#e74c3c' : '#27ae60'}">${e.isClaimed ? _t('opened', '❌ 已拆开') : _t('unopened', '✅ 待拆开')}</span>`;
      } else if (codeEntries.length) {
        /* 【修改】多码邮件显示「已领取 x/y」的汇总状态 */
        const doneCount = codeEntries.filter(c => c.isUsed).length;
        const isAllDone = doneCount === codeEntries.length;
        statusHtml = `<span style="color:${isAllDone ? '#e74c3c' : '#27ae60'}">${_loadT('mail.codeClaimedCount', { done: doneCount, total: codeEntries.length })}</span>`;
      } else if (e.type === 'vip_reward') {
        /* 【新增】等级奖励邮件的领取状态 */
        statusHtml = `<span style="color:${e.isClaimed ? '#e74c3c' : '#27ae60'}">${e.isClaimed ? _loadT('vip.rewardClaimed') : _loadT('vip.rewardPending')}</span>`;
      }

      item.innerHTML = `
        <div class="mail-title">
          <span>${mailText(e, 'title')}</span>
          <span class="mail-date">${new Date(e.date).toLocaleDateString()}</span>
        </div>
        <div class="mail-content">
          <p>${mailText(e, 'content')}</p>
          ${attachHtml}
          <div class="mail-btns">
            ${statusHtml ? `<span style="font-size:12px; flex:1; align-self:center;">${statusHtml}</span>` : ''}
            <button class="btn ghost del-btn" style="color:#e74c3c; border-color:#e74c3c; padding:4px 10px; font-size:12px;">${_t('delete', '🗑 删除')}</button>
          </div>
        </div>
      `;

      item.querySelector('.mail-title').onclick = () => { item.classList.toggle('open'); };
      item.querySelector('.del-btn').onclick = (ev) => {
        ev.stopPropagation();
        showConfirmModal(_loadT('mail.deleteTitle'), _loadT('mail.deleteDesc'), async () => {
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          upU.emails = upU.emails.filter(m => m.id !== e.id);
          store.set('bb-users', upUsers);
          await syncEmailsToCloud(upU);
          renderMails();
        });
      };

      // 同意好友
      const btnAccept = item.querySelector('.btn-accept-friend');
      if (btnAccept) {
        btnAccept.onclick = async (ev) => {
          ev.stopPropagation();
          btnAccept.disabled = true; btnAccept.textContent = _loadT('mail.processing');
          if (typeof window.acceptFriendRequest === 'function') {
            await window.acceptFriendRequest(e.sender_name);
            let upUsers = getUsersDB(); let upU = upUsers[currentUser];
            const tm = upU.emails.find(m => m.id === e.id);
            if (tm) tm.isUsed = true;
            store.set('bb-users', upUsers); await syncEmailsToCloud(upU);
            renderMails();
          }
        };
      }

      // 拒绝好友
      const btnReject = item.querySelector('.btn-reject-friend');
      if (btnReject) {
        btnReject.onclick = async (ev) => {
          ev.stopPropagation();
          showToast(_loadT('mail.requestRejected'), '👋');
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          const tm = upU.emails.find(m => m.id === e.id);
          if (tm) tm.isUsed = true;
          store.set('bb-users', upUsers); await syncEmailsToCloud(upU);
          renderMails();
        };
      }

      // 拆礼包
      const giftBtn = item.querySelector('.claim-gift-btn');
      if (giftBtn && !e.isClaimed) {
        giftBtn.onclick = async (ev) => {
          ev.stopPropagation();
          giftBtn.disabled = true; giftBtn.textContent = _loadT('mail.opening');
          
          try {
            if (e.gift_type === 'code') {
               /* 【修改】改走统一兑换入口（优先 redeem_code_v4，失败回落老函数） */
               const { data, error } = await redeemCodeViaCloud(e.gift_value);
               if (error || !data.success) throw new Error(data?.msg || _loadT('mail.codeInvalid'));
               showToast(_loadT('mail.claimCodeSuccess'), '🎫');
            } else {
               const { data, error } = await sb.rpc('claim_friend_gift', { 
                 p_mail_id: e.id,
                 p_username: currentUser 
               });
               if (error || data === false) throw new Error(error?.message || _loadT('mail.openFailed'));
               
               if (e.gift_type === 'points') showToast(_loadT('mail.claimGiftPoints', { pts: e.gift_value }), '🪙');
               if (e.gift_type === 'item') showToast(_loadT('mail.unlockedTheme'), '🎨');
            }

            let upUsers = getUsersDB(); let upU = upUsers[currentUser];
            const tm = upU.emails.find(m => m.id === e.id); if (tm) tm.isClaimed = true;
            await store.set('bb-users', upUsers); 
            
            if (typeof syncFromCloud === 'function') await syncFromCloud();
            updateUserUI(); renderMails();
            
          } catch (err) {
            console.error(err);
            showToast(err.message || _loadT('mail.openFailed'), '❌');
            giftBtn.disabled = false; giftBtn.textContent = _loadT('modals.openNow');
          }
        };
      }

      /* 【新增】等级奖励：点「立即领取」打开主题选择器，选满名额后调用后端写库
         【新增】SVIP Lv10 的新春大吉是「一键领取、永久解锁」，不需要选主题、不需要兑换码 */
      const vipRewardBtn = item.querySelector('.vip-reward-btn');
      if (vipRewardBtn && !e.isClaimed) {
        vipRewardBtn.onclick = (ev) => {
          ev.stopPropagation();
          const cfgOnlySpring = (e.reward && e.reward.springTheme)
            && !(Number(e.reward.plusPick) > 0 || Number(e.reward.maxPick) > 0
                 || e.reward.allBase || e.reward.allPlus || e.reward.allMax);
          if (cfgOnlySpring) {
            showConfirmModal(
              _loadT('vip.springClaimTitle'),
              _loadT('vip.springClaimDesc'),
              async () => {
                const upUsers = getUsersDB(); const upU = upUsers[currentUser];
                if (!upU) return showToast(_loadT('common.loginRequired'), '🔒');
                if (!Array.isArray(upU.unlockedThemes)) upU.unlockedThemes = [];
                if (upU.unlockedThemes.indexOf('spring') < 0) upU.unlockedThemes.push('spring');
                const tm = upU.emails.find(m => m.id === e.id);
                if (tm) tm.isClaimed = true;
                store.set('bb-users', upUsers);
                try { await syncEmailsToCloud(upU); } catch (err) { /* 邮件同步失败不影响本地解锁 */ }
                loadUserData(); renderMails();
                showToast(_loadT('vip.springClaimed'), '🧧');
              },
              false,
              _loadT('vip.springClaimOk'),
              _loadT('vip.springClaimCancel')
            );
            return;
          }
          if (typeof window.VipReward === 'undefined' || typeof window.VipReward.openRewardPicker !== 'function') {
            return showToast(_loadT('vip.rewardClaimFail'), '❌');
          }
          window.VipReward.openRewardPicker(e, async (picked) => {
            let upUsers = getUsersDB(); let upU = upUsers[currentUser];
            const tm = upU.emails.find(m => m.id === e.id);
            if (tm) tm.isClaimed = true;
            store.set('bb-users', upUsers);
            await syncEmailsToCloud(upU);
            renderMails();
          });
        };
      }

      const claimBtn = item.querySelector('.claim-btn');
      if (claimBtn && !e.isClaimed) {
        claimBtn.onclick = async (ev) => {
          ev.stopPropagation(); claimBtn.disabled = true; claimBtn.textContent = _loadT('mail.claiming');
          const { data, error } = await sb.rpc('redeem_benefits', { p_type: 'points', p_amount: e.points, p_level: 0, p_theme: '', p_mail_id: e.id });
          if (error || data === false) { claimBtn.disabled = false; claimBtn.textContent = _loadT('modals.claimPoints'); return showToast(_loadT('mail.claimFailed'), '❌'); }
          showToast(_loadT('mail.claimPointsSuccess', { pts: e.points }), '🪙');
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          const tm = upU.emails.find(m => m.id === e.id); if (tm) tm.isClaimed = true;
          await store.set('bb-users', upUsers); updateUserUI(); renderMails();
        };
      }

      /* 【修改】多个兑换码：逐个绑定按钮，兑换成功后只把对应那一条标记为已用，
         其余码不受影响（老的单码邮件走的是同一条路径，行为不变）。 */
      const useBtns = item.querySelectorAll('.use-btn');
      useBtns.forEach(btn => {
        const ci = Number(btn.getAttribute('data-ci'));
        const entry = codeEntries[ci];
        if (!entry || entry.isUsed) return;
        btn.onclick = async (ev) => {
          ev.stopPropagation();
          btn.disabled = true; btn.textContent = _loadT('mail.processing');
          const { data, error } = await redeemCodeViaCloud(entry.code);
          if (error || !data || !data.success) {
            /* 【修改】后端返回 msgKey 时走中英词表，并用 msgKey 判断失败原因（中英都判断得准） */
            const rawMsg = (data && (data.msgKey && _loadT(data.msgKey) !== data.msgKey ? _loadT(data.msgKey) : data.msg)) || '';
            let finalFailText = _t('used', '❌ 已被使用');
            const expiredKeys = ['auth.codeExpired', 'auth.codeNotFound'];
            if ((data && expiredKeys.indexOf(data.msgKey) >= 0) || rawMsg.includes('过期') || rawMsg.includes('失效') || rawMsg.includes('不存在')) finalFailText = _t('usedOrExpired', '❌ 已失效');
            showToast(rawMsg || _loadT('mail.redeemFailed'), '❌');
            let upUsers = getUsersDB(); let upU = upUsers[currentUser];
            const tm = upU.emails.find(m => m.id === e.id);
            if (tm) {
              if (Array.isArray(tm.codes) && tm.codes[ci]) { tm.codes[ci].isUsed = true; tm.codes[ci].failReason = finalFailText; }
              else { tm.isUsed = true; tm.failReason = finalFailText; }
            }
            store.set('bb-users', upUsers); await syncEmailsToCloud(upU); renderMails();
            return;
          }
          showToast(data.type === 'theme' ? _loadT('auth.themeCodeSuccess') : _loadT('mail.claimSuccess'), data.type === 'theme' ? '🎨' : '🪙');
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          const tm = upU.emails.find(m => m.id === e.id);
          if (tm) {
            if (Array.isArray(tm.codes) && tm.codes[ci]) { tm.codes[ci].isUsed = true; tm.codes[ci].isClaimed = true; }
            else { tm.isUsed = true; tm.isClaimed = true; }
          }
          store.set('bb-users', upUsers); await syncEmailsToCloud(upU);
          if (typeof syncFromCloud === 'function') await syncFromCloud();
          updateUserUI(); renderMails();
        };
      });

      list.appendChild(item);
    });
  }
}

$('#btnMail').onclick = () => {
  if (!currentUser) return;
  renderMails();
  openOverlay($('#mailOverlay'));
  /* 【新增】VIP 任务记账：查看一封邮件（每日任务「打开邮件中心查看任意一封邮件」） */
  try { if (window.VipTasks) window.VipTasks.track('mailView'); } catch (e) { /* 记账失败不影响打开 */ }
};
$('#btnMailClose').onclick = () => closeOverlay($('#mailOverlay'));

$('#btnClaimAll').onclick = async () => {
  if (!currentUser) return;
  let users = getUsersDB(); let u = users[currentUser];
  let successCount = 0;
  showToast(_loadT('mail.autoRedeeming'), '⏳');
  for (let e of u.emails) {
    /* 【修改】一键领取：支持一封邮件里的多个兑换码，逐个兑换、逐个标记 */
    const entries = (Array.isArray(e.codes) && e.codes.length)
      ? e.codes
      : (e.code && !e.isUsed ? [{ code: e.code, isUsed: !!e.isUsed }] : []);
    for (const entry of entries) {
      if (!entry || entry.isUsed) continue;
      const { data, error } = await redeemCodeViaCloud(entry.code);
      if (!error && data && data.success) { entry.isUsed = true; entry.isClaimed = true; successCount++; }
      else {
        entry.isUsed = true; const m = data?.msg || '';
        entry.failReason = (m.includes('过期') || m.includes('不存在')) ? _loadT('modals.usedOrExpired') : _loadT('modals.used');
      }
    }
    /* 【修改】老的单码邮件（没有 e.codes 数组）要把临时条目的状态写回邮件本身，
       否则一键领取后按钮状态不会变。 */
    if (!Array.isArray(e.codes) && e.code && entries.length) {
      e.isUsed = entries[0].isUsed;
      if (entries[0].failReason) e.failReason = entries[0].failReason;
      if (entries[0].isClaimed) e.isClaimed = true;
    }
  }
  store.set('bb-users', users); await syncEmailsToCloud(u);
  showToast(successCount > 0 ? _loadT('mail.batchDone', { count: successCount }) : _loadT('mail.noAttachments'), '🎁');
  updateUserUI(); renderMails();
};

$('#btnDeleteAllMails').onclick = () => {
  if (!currentUser) return;
  let u = getUsersDB()[currentUser];
  if (!u.emails || u.emails.length === 0) return showToast(_loadT('mail.noMails'), '📭');
  showConfirmModal(_loadT('mail.clearAllTitle'), _loadT('mail.clearAllDesc'), async () => {
    let upUsers = getUsersDB(); upUsers[currentUser].emails = [];
    store.set('bb-users', upUsers); await syncEmailsToCloud(upUsers[currentUser]);
    updateUserUI(); renderMails();
  });
};