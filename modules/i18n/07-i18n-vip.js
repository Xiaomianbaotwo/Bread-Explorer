// modules/i18n/07-i18n-vip.js —— 中英双语词条：VIP 等级成长体系（星光值 point）
// 【新增】本轮新增文件，编号 = modules/i18n 现有最大编号 06 + 1
// 约定：中英放在同一个文件里成对出现；VIP 体系专属「星光值」，与系统的「积分」严格区分
(() => {
  window.__BB_I18N = window.__BB_I18N || { zh: {}, en: {} };

  /* ---------- 中文 ---------- */
  window.__BB_I18N.zh['vip'] = {
    entry: "🎖️ VIP等级",
    title: "🎖️ VIP 等级成长",

    expireAt: "到期时间：{{date}}",
    permanent: "永久有效",
    expireNone: "当前未开通会员",
    renew: "续费",

    pointNone: "开通会员后开始累积星光值",
    tipNone: "非会员无法累积星光值，等级与进度会原样保留",
    pointOf: "星光值 {{point}} / {{cap}}",
    maxPoint: "星光值 {{point}}（已满级）",
    tipToNext: "距离 Lv.{{next}} 还差 {{n}} 星光值",
    tipMax: "已达最高等级 Lv.100；多余星光值按 1:3 自动转积分",

    checkinBtn: "📅 签到领取 {{n}} 星光值",
    checkinDone: "📅 今日已签到（+{{n}} 星光值）",
    checkinSuccess: "签到成功，获得 {{n}} 星光值",
    checkinDoneToast: "今天已经签到过了，明天再来～",

    dailyTitle: "每日任务",
    weeklyTitle: "每周任务",
    monthlyTitle: "每月任务",
    resetDaily: "每日 0 点刷新",
    resetWeekly: "每周一 0 点刷新",
    resetMonthly: "每月 1 号 0 点刷新",

    progressFmt: "进度 {{cur}} / {{need}}",
    claim: "领取",
    claimedTxt: "已领取",
    ongoing: "进行中",
    claimSuccess: "领取成功，获得 {{n}} 星光值",
    claimSuccessOverflow: "领取成功，获得 {{n}} 星光值；已满级，溢出部分自动转为 {{points}} 积分",
    claimedToast: "该任务本周期已经领取过了",
    actionFailed: "操作失败，请稍后重试",
    notMemberTip: "您不是VIP，请开通VIP后再尝试此功能",

    rightsTitle: "等级权益说明",
    exchangeTitle: "积分兑星光值",
    exchangeQuota: "今日已兑 {{used}} / {{cap}} 星光",
    exchangeTip: "基础汇率 {{rate}} 积分 = 1 星光值，档位越大越划算；今日还可兑换 {{remain}} 星光（现有 {{points}} 积分）",
    exchangeNone: "开通 VIP / SVIP 后才能用积分兑换星光值",
    exchangeOk: "已兑换 {{star}} 星光值，当前进度 {{point}} / {{cap}}",
    exchangeLevelUp: "已兑换 {{star}} 星光值，恭喜升到 Lv{{level}}！",
    exchangeNoPoints: "积分不足，还差 {{need}} 积分",
    exchangeDailyCap: "超出今日兑换上限，今日还剩 {{remain}} 星光可兑",
    exchangeFail: "兑换失败，请稍后重试",
    logTitle: "奖励记录",
    logEmpty: "还没有等级奖励记录，升级到 Lv.25 以上开始解锁",
    dailyBonusNow: "当前等级档位额外每日积分：+{{n}}（高等级自动继承，只取最高档）",
    dailyBonusNone: "当前等级暂无额外每日积分档位（Lv.60 起解锁）",

    /* 等级奖励邮件 / 选主题 */
    rewardClaim: "🎁 立即领取",
    rewardClaimed: "✅ 已领取",
    rewardPending: "🎁 待领取",
    rewardAuto: "该奖励属于持续性权益，已自动生效，无需领取",
    rewardPickTitle: "🎁 选择等级奖励主题",
    rewardPickDesc: "本档奖励最多可自选 {{n}} 个主题，至少选 1 个即可确认解锁（Max 版本需先拥有同主题 Plus）",
    rewardPickCount: "已选 {{cur}} / {{need}}",
    rewardPickCountAll: "已选 {{cur}} 个（全套解锁不限名额）",
    rewardConfirm: "确认领取",
    rewardSuccess: "已解锁 {{n}} 个主题",
    rewardPickLimit: "已达到本档自选名额上限",
    rewardLevelNotReached: "这份奖励需要 Lv{{need}}，你当前 Lv{{cur}}，先把等级升上去再来领",
    rewardNeedBackend: "后端尚未部署等级奖励函数，请先在 Supabase 执行 20261115-vip-level-system.sql",
    rewardClaimFail: "领取失败，请稍后重试",
    rewardOwned: "已拥有",
    rewardNeedPlus: "需先拥有同主题 Plus",
    rewardNeedPrev: "🔒 先领取上一封 Plus 邮件",
    rewardAllPlus: "一键选满全部 Plus",
    rewardAllMax: "一键选满全部 Max",
    /* 会员基础每日积分（与等级无关） */
    baseDailyToast: "会员每日星光值 +{{n}}",

    /* 【新增】SVIP Lv10 新春大吉礼包（本轮新增） */
    springClaimTitle: "领取新春大吉主题",
    springClaimDesc: "确认领取「🧧 新春大吉」基础版？领取后永久解锁，会员到期也不会收回。",
    springClaimOk: "领取",
    springClaimCancel: "手滑了",
    springClaimed: "🧧 新春大吉已永久解锁",

    tasks: {
      d_suggest: { name: "提交一条建议或 BUG 反馈", desc: "使用侧边「建议箱」提交 1 条建议或问题反馈，提交完成即计数" },
      d_search:  { name: "完成 5 次搜索", desc: "在首页搜索框累计完成 5 次搜索，按天累计" },
      d_theme:   { name: "浏览主题商店", desc: "打开一次主题商店（积分中心内），进入即计数" },
      d_redeem:  { name: "查看兑换特权页面", desc: "从用户中心打开一次「兑换码」页面，进入即计数" },
      d_profile: { name: "查看个人主页", desc: "打开一次自己的个人主页（右上角头像 / 用户中心）" },
      d_mail:    { name: "查看一封邮件", desc: "打开邮件中心并查看任意一封邮件" },
      d_edit:    { name: "修改一次个人资料", desc: "更换头像、修改昵称或编辑个性签名，任意一项即可。个性签名：个人资料中一段 80 字以内的自我介绍，保存后展示在个人主页" },

      w_suggest: { name: "本周累计提交 3 条建议", desc: "本周内累计提交 3 条建议或 BUG 反馈" },
      w_search:  { name: "本周累计搜索 20 次", desc: "本周内累计完成 20 次搜索" },
      w_redeem:  { name: "本周使用一个兑换码", desc: "本周内成功兑换任意一个兑换码即计数" },
      w_theme:   { name: "本周浏览主题商店 5 次", desc: "本周内累计打开主题商店 5 次" },
      w_edit:    { name: "本周修改 2 次个人资料", desc: "本周内累计修改头像 / 昵称 / 个性签名合计 2 次" },

      m_checkin: { name: "当月签到 20 次", desc: "本月在本面板累计签到 20 次（每天最多 1 次）" },
      m_suggest: { name: "当月提交 10 条建议", desc: "本月累计提交 10 条建议或 BUG 反馈" },
      m_search:  { name: "当月搜索 60 次", desc: "本月累计完成 60 次搜索" },
      m_theme:   { name: "当月浏览主题商店 12 次", desc: "本月累计打开主题商店 12 次" }
    }
  };

  /* ---------- English ---------- */
  window.__BB_I18N.en['vip'] = {
    entry: "🎖️ VIP Level",
    title: "🎖️ VIP Level & Growth",

    expireAt: "Expires: {{date}}",
    permanent: "Lifetime membership",
    expireNone: "No active membership",
    renew: "Renew",

    pointNone: "Starlight starts accumulating after joining",
    tipNone: "Non-members cannot gain Starlight; level and progress are kept",
    pointOf: "Starlight {{point}} / {{cap}}",
    maxPoint: "Starlight {{point}} (max level)",
    tipToNext: "{{n}} Starlight to Lv.{{next}}",
    tipMax: "Max level Lv.100 reached; excess Starlight auto-converts to points (1:3)",

    checkinBtn: "📅 Check in for {{n}} Starlight",
    checkinDone: "📅 Checked in today (+{{n}} Starlight)",
    checkinSuccess: "Check-in successful, +{{n}} Starlight",
    checkinDoneToast: "Already checked in today, come back tomorrow~",

    dailyTitle: "Daily Tasks",
    weeklyTitle: "Weekly Tasks",
    monthlyTitle: "Monthly Tasks",
    resetDaily: "Resets at 00:00 daily",
    resetWeekly: "Resets Monday 00:00",
    resetMonthly: "Resets on the 1st at 00:00",

    progressFmt: "Progress {{cur}} / {{need}}",
    claim: "Claim",
    claimedTxt: "Claimed",
    ongoing: "In progress",
    claimSuccess: "Claimed, +{{n}} Starlight",
    claimSuccessOverflow: "Claimed, +{{n}} Starlight; max level, overflow converted to {{points}} points",
    claimedToast: "This task is already claimed for this period",
    actionFailed: "Action failed, please try again later",
    notMemberTip: "You are not a VIP. Please subscribe to VIP before using this feature",

    rightsTitle: "Level Perks",
    exchangeTitle: "Points → Star Value",
    exchangeQuota: "Converted today: {{used}} / {{cap}} stars",
    exchangeTip: "Base rate {{rate}} points = 1 star; bigger packs are cheaper. {{remain}} stars left today ({{points}} points available)",
    exchangeNone: "VIP / SVIP is required to exchange points for star value",
    exchangeOk: "Converted {{star}} stars. Progress {{point}} / {{cap}}",
    exchangeLevelUp: "Converted {{star}} stars — you reached Lv{{level}}!",
    exchangeNoPoints: "Not enough points, {{need}} more needed",
    exchangeDailyCap: "Daily limit exceeded. {{remain}} stars can still be converted today",
    exchangeFail: "Exchange failed, please try again later",
    logTitle: "Reward History",
    logEmpty: "No level rewards yet — they start at Lv.25",
    dailyBonusNow: "Extra daily points from this level: +{{n}} (highest tier only, lower tiers inherited)",
    dailyBonusNone: "No extra daily points at this level yet (starts at Lv.60)",

    /* Reward mail / theme picker */
    rewardClaim: "🎁 Claim now",
    rewardClaimed: "✅ Claimed",
    rewardPending: "🎁 Unclaimed",
    rewardAuto: "This reward is a continuous perk and applies automatically",
    rewardPickTitle: "🎁 Choose your level reward themes",
    rewardPickDesc: "This tier lets you pick up to {{n}} theme(s). Pick at least 1 to confirm. Max editions require the matching Plus first.",
    rewardPickCount: "Selected {{cur}} / {{need}}",
    rewardPickCountAll: "{{cur}} selected (full-set tier has no cap)",
    rewardConfirm: "Confirm",
    rewardSuccess: "{{n}} theme(s) unlocked",
    rewardPickLimit: "You have reached this tier's pick limit",
    rewardLevelNotReached: "This reward needs Lv{{need}}; you are Lv{{cur}}. Level up first, then claim.",
    rewardNeedBackend: "Backend function missing — run 20261115-vip-level-system.sql in Supabase first",
    rewardClaimFail: "Claim failed, please try again later",
    rewardOwned: "Owned",
    rewardNeedPlus: "Requires the matching Plus first",
    rewardNeedPrev: "🔒 Claim the Plus mail first",
    rewardAllPlus: "Select all Plus",
    rewardAllMax: "Select all Max",
    /* Membership base daily star points (level-independent) */
    baseDailyToast: "Membership daily star points +{{n}}",

    /* SVIP Lv10 Spring Fortune gift */
    springClaimTitle: "Claim Spring Fortune theme",
    springClaimDesc: "Claim the base edition of “🧧 Spring Fortune”? It unlocks permanently and stays even after membership expires.",
    springClaimOk: "Claim",
    springClaimCancel: "Not now",
    springClaimed: "🧧 Spring Fortune unlocked permanently",

    tasks: {
      d_suggest: { name: "Submit one suggestion or bug report", desc: "Send 1 suggestion or bug report from the Suggestion Box on the side panel" },
      d_search:  { name: "Complete 5 searches", desc: "Finish 5 searches in the home search box, counted per day" },
      d_theme:   { name: "Browse the theme shop", desc: "Open the theme shop inside the Points Center once" },
      d_redeem:  { name: "Open the redeem page", desc: "Open the Redeem page from the User Center once" },
      d_profile: { name: "Visit your profile", desc: "Open your own profile once (avatar at top-right or the User Center)" },
      d_mail:    { name: "Read one mail", desc: "Open the Mail Center and view any single mail" },
      d_edit:    { name: "Edit your profile once", desc: "Change the avatar, nickname or personal signature — any one counts. Personal signature: a short self-introduction (max 80 characters) in your profile, shown on your profile page" },

      w_suggest: { name: "Submit 3 suggestions this week", desc: "Submit 3 suggestions or bug reports within the week" },
      w_search:  { name: "20 searches this week", desc: "Complete 20 searches within the week" },
      w_redeem:  { name: "Redeem a code this week", desc: "Successfully redeem any code within the week" },
      w_theme:   { name: "Browse the theme shop 5 times this week", desc: "Open the theme shop 5 times within the week" },
      w_edit:    { name: "Edit your profile twice this week", desc: "Change avatar / nickname / signature 2 times within the week" },

      m_checkin: { name: "Check in 20 times this month", desc: "Check in on this panel 20 times within the month (once per day)" },
      m_suggest: { name: "Submit 10 suggestions this month", desc: "Submit 10 suggestions or bug reports within the month" },
      m_search:  { name: "60 searches this month", desc: "Complete 60 searches within the month" },
      m_theme:   { name: "Browse the theme shop 12 times this month", desc: "Open the theme shop 12 times within the month" }
    }
  };

})();
