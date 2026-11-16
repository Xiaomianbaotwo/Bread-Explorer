/* =========================================================
   02-config.js
   ========================================================= */

const THEMES = {
  default:         { name: '🍞 面包原野', enName: '🍞 Bread Plains', emojis: ['🍞','🥐','🥖','🥯','🥨','🧇','🥪','🍩'], level: 0 },
  'default-plus':  { name: '✨ 面包原野 Plus', enName: '✨ Bread Plains Plus', emojis: ['🍞','🥐','🥖','🥯','🥨','🧇','🥪','🍩','🥞','🧈','🥛','🧁','🍰','🥧'], level: 0, cost: 15000 },
  'default-max':   { name: '👑 面包原野 Max', enName: '👑 Bread Plains Max', emojis: ['🍞','🥐','🥖','🥯','🥨','🧇','🥪','🍩','🥞','🧈','🥛','🧁','🍰','🥧','🍪','🍫','🍬','🍭','🍮','🍯','🍦','🍧','🍨'], level: 0, cost: 30000 },
  spring:          { name: '🧧 新春大吉', enName: '🧧 Spring Fortune', emojis: ['🧧','🏮','🧨','🐉','🥟','🍊'], level: 0, isSpring: true },
  'spring-plus':   { name: '✨ 新春大吉 Plus', enName: '✨ Spring Fortune Plus', emojis: ['🧧','🏮','🧨','🐉','🥟','🍊','🍬','🍭'], level: 0, isSpring: true, cost: 15000 },
  'spring-max':    { name: '👑 新春大吉 Max', enName: '👑 Spring Fortune Max', emojis: ['🧧','🏮','🧨','🐉','🥟','🍊','🍬','🍭','🍫','🧁','🍩','🍪'], level: 0, isSpring: true, cost: 30000 },
  food:            { name: '🍔 美食天堂', enName: '🍔 Food Paradise', emojis: ['🍔','🍕','🍟','🍗'], level: 0 },
  'food-plus':     { name: '✨ 美食天堂 Plus', enName: '✨ Food Paradise Plus', emojis: ['🍔','🍕','🍟','🍗','🌭','🌮','🍣','🍜'], level: 0, cost: 15000 },
  'food-max':      { name: '👑 美食天堂 Max', enName: '👑 Food Paradise Max', emojis: ['🍔','🍕','🍟','🍗','🌭','🌮','🍣','🍜','🍝','🍤','🍩','🍦','🍰','🍫','🍬','🍿','🥟','🍱','🥗','🥪','🥙','🥘','🍲','🍛','🍚','🍙','🍘','🍥','🍡','🍧','🍨','🧁','🍮','🍭','🍪','🌰','🥜'], level: 0, cost: 30000 },
  fruit:           { name: '🍎 水果圣地', enName: '🍎 Fruit Haven', emojis: ['🍎','🍌','🍇','🍉'], level: 0 },
  'fruit-plus':    { name: '✨ 水果圣地 Plus', enName: '✨ Fruit Haven Plus', emojis: ['🍎','🍌','🍇','🍉','🍓','🍒','🍑','🍍'], level: 0, cost: 15000 },
  'fruit-max':     { name: '👑 水果圣地 Max', enName: '👑 Fruit Haven Max', emojis: ['🍎','🍌','🍇','🍉','🍓','🍒','🍑','🍍','🥭','🍊','🍋','🍐','🥝','🫐','🥥','🥑','🍅','🍆','🥕','🌽','🥦','🍄'], level: 0, cost: 30000 },
  sakura:          { name: '🌸 樱花漫舞', enName: '🌸 Sakura Dance', emojis: ['🌸','🌸','🦋'], level: 2, cost: 1500 },
  'sakura-plus':   { name: '✨ 樱花漫舞 Plus', enName: '✨ Sakura Dance Plus', emojis: ['🌸','🌸','🦋','🍃','💮'], level: 2, cost: 15000 },
  'sakura-max':    { name: '👑 樱花漫舞 Max', enName: '👑 Sakura Dance Max', emojis: ['🌸','🌸','🦋','🍃','💮','🌺','🌷','🌹','🏵️'], level: 2, cost: 30000 },
  flower:          { name: '🌺 花语秘境', enName: '🌺 Secret Garden', emojis: ['🌹','🌷','🌻'], level: 0, cost: 5000 },
  'flower-plus':   { name: '✨ 花语秘境 Plus', enName: '✨ Secret Garden Plus', emojis: ['🌹','🌷','🌻','🌼','🌺'], level: 0, cost: 15000 },
  'flower-max':    { name: '👑 花语秘境 Max', enName: '👑 Secret Garden Max', emojis: ['🌹','🌷','🌻','🌼','🌺','🌸','🪷','🏵️','🦋'], level: 0, cost: 30000 },
  gold:            { name: '🪙 黄金时代', enName: '🪙 Golden Age', emojis: ['🪙','💰','💴','🪙'], level: 1 },
  'gold-plus':     { name: '✨ 黄金时代 Plus', enName: '✨ Golden Age Plus', emojis: ['🪙','💰','💴','🪙'], level: 1, cost: 15000 },
  cyber:           { name: '⚡ 赛博朋克', enName: '⚡ Cyberpunk', emojis: ['⚡','💻','🟢','⚡'], level: 1 },
  'cyber-plus':    { name: '✨ 赛博朋克 Plus', enName: '✨ Cyberpunk Plus', emojis: ['⚡','💻','🟢','⚡'], level: 1, cost: 15000 },
  forest:          { name: '🌿 绿野仙踪', enName: '🌿 Emerald Woods', emojis: ['🌿','🍀','🌱','🦋'], level: 1 },
  'forest-plus':   { name: '✨ 绿野仙踪 Plus', enName: '✨ Emerald Woods Plus', emojis: ['🌿','🍀','🌱','🦋'], level: 1, cost: 15000 },
  diamond:         { name: '💎 钻石星辰', enName: '💎 Diamond Stars', emojis: ['💎','💠','✨'], level: 2, cost: 1500 },
  'diamond-plus':  { name: '✨ 钻石星辰 Plus', enName: '✨ Diamond Stars Plus', emojis: ['💎','💠','✨'], level: 2, cost: 15000 },
  aurora:          { name: '🌌 极光幻境', enName: '🌌 Aurora Dream', emojis: ['✨','🌌','🌟'], level: 2, cost: 5000 },
  'aurora-plus':   { name: '✨ 极光幻境 Plus', enName: '✨ Aurora Dream Plus', emojis: ['✨','🌌','🌟'], level: 2, cost: 15000 },
  ocean:           { name: '🌊 深海幽蓝', enName: '🌊 Deep Ocean', emojis: ['🌊','🐬','🫧','🔱'], level: 2, cost: 1500 },
  'ocean-plus':    { name: '✨ 深海幽蓝 Plus', enName: '✨ Deep Ocean Plus', emojis: ['🌊','🐬','🫧','🔱'], level: 2, cost: 15000 },
  blackgold:       { name: '👑 暗夜黑金', enName: '👑 Black Gold', emojis: ['👑','♠️','🪙'], level: 2, cost: 1500 },
  'blackgold-plus':{ name: '✨ 暗夜黑金 Plus', enName: '✨ Black Gold Plus', emojis: ['👑','♠️','🪙'], level: 2, cost: 15000 }
};

const SHOP_THEMES = ['diamond', 'sakura', 'ocean', 'blackgold'];

/* =========================================================
   【新增】主题解锁档位规则（本轮新增，唯一权威来源）
   - 普通用户：面包原野 / 美食天堂 / 水果圣地（基础版免费）
   - VIP：再加 樱花漫舞 / 黄金时代 / 绿野仙踪（基础版）
   - SVIP：再加 钻石星辰 / 深海幽蓝 / 暗夜黑金 / 赛博朋克（基础版）
   - 新春大吉：只能靠 SVIP Lv10 的礼包邮件领取，不进档位、不用兑换码
   - 档位自带的主题「会员期内可用」，到期自动锁回；等级与星光值不回收，续费即恢复
   - Plus / Max、以及未列出档位的花语秘境、极光幻境：一律积分购买或等级奖励发放
   ========================================================= */
const TIER_BASE_THEMES = {
  none: ['default', 'food', 'fruit'],
  vip:  ['default', 'food', 'fruit', 'sakura', 'gold', 'forest'],
  svip: ['default', 'food', 'fruit', 'sakura', 'gold', 'forest', 'diamond', 'ocean', 'blackgold', 'cyber']
};

/* 新春大吉：SVIP 达到 Lv10 时由等级礼包邮件发放（配置在 modules/vip-level/js/04-vip-mail-reward.js 的 REWARDS.svip[10]） */

/* 只能靠会员档位获得的基础主题：不参与积分购买 */
const TIER_ONLY_THEMES = ['sakura', 'gold', 'forest', 'diamond', 'ocean', 'blackgold', 'cyber'];

/* 档位自带（只看会员身份，不写进账号） */
function themeTierOwned(key, u, status) {
  const t = THEMES[key];
  if (!t) return false;
  if (key.endsWith('-plus') || key.endsWith('-max')) return false;
  if (t.isSpring) return false;                 // 新春大吉只能靠 Lv10 邮件
  const type = (status && status.type) ? status.type : 'none';
  const list = TIER_BASE_THEMES[type] || TIER_BASE_THEMES.none;
  return list.indexOf(key) >= 0;
}

/* 主题当前是否可用：个人已解锁（购买 / 等级奖励 / Lv10 邮件）优先，其次看会员档位 */
function themeIsOwned(key, u, status) {
  if (u && Array.isArray(u.unlockedThemes) && u.unlockedThemes.indexOf(key) >= 0) return true;
  return themeTierOwned(key, u, status);
}

/* 【新增】主题名按当前语言显示：英文环境用 enName，缺省回退中文原名 */
function themeLabel(t) {
  if (!t) return '';
  const isEn = (typeof window.getLang === 'function') ? window.getLang() === 'en' : false;
  return (isEn && t.enName) ? t.enName : t.name;
}
window.themeLabel = themeLabel;

/* 【新增】VIP/SVIP 档位标签按语言显示 */
/* 【修正】云端 vip_vip_prices / vip_svip_prices 的行里没有 enLabel，只有中文 label，
   所以英文环境下这类行会退回中文。这里加一层"按 days 换算"的兜底，保证云端价格也显示英文。 */
function planLabel(item) {
  if (!item) return '';
  const isEn = (typeof window.getLang === 'function') ? window.getLang() === 'en' : false;
  if (!isEn) return item.label || '';
  if (item.enLabel) return item.enLabel;
  const days = item.days;
  const map = { 1: '1 Day', 7: '7 Days', 30: '1 Month', 90: '1 Quarter', 365: '1 Year' };
  if (map[days]) return map[days];
  if (days) return days + ' Days';
  return item.label || '';
}
window.planLabel = planLabel;

const ENGINES = {
  quark:    { icon: '☁️', name: '夸克', url: 'https://quark.sm.cn/s?q=' },
  bing:     { icon: '🌏', name: '必应', url: 'https://www.bing.com/search?q=' },
  google:   { icon: '🎈', name: 'Google', url: 'https://www.google.com/search?q=' },
  deepseek: { icon: '🐋', name: 'DeepSeek (对话)', url: 'https://chat.deepseek.com/?autosend=1&q=' },
  bili:     { icon: '📺', name: 'B站', url: 'https://search.bilibili.com/all?keyword=' },
  github:   { icon: '🐙', name: 'GitHub', url: 'https://github.com/search?q=' }
};

const DEFAULT_SITES = [
  { name: '哔哩哔哩', url: 'https://www.bilibili.com' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'DeepSeek', url: 'https://www.deepseek.com' },
  { name: 'DeepSeek API', url: 'https://platform.deepseek.com' },
  { name: '豆包', url: 'https://www.doubao.com' },
  { name: 'Google', url: 'https://www.google.com' },
  { name: '微软账户', url: 'https://account.microsoft.com' },
  { name: '千问 API', url: 'https://dashscope.console.aliyun.com' }
];

const SHOP_ITEMS = [
  { label: '1 天', enLabel: '1 Day', days: 1, base: 500 },
  { label: '7 天', enLabel: '7 Days', days: 7, base: 3000 },
  { label: '1 个月', enLabel: '1 Month', days: 30, base: 12000 },
  { label: '1 季度', enLabel: '1 Quarter', days: 90, base: 34000 },
  { label: '1 年', enLabel: '1 Year', days: 365, base: 120000 }
];

window.cloudSettings = {
  vip_vip_prices: SHOP_ITEMS,
  vip_svip_prices: SHOP_ITEMS.map(i => ({ ...i, base: i.base * 3 })),
  theme_prices: {},
  redpacket_config: {
    normal_prob: 0.60, normal_value: 1, gold_prob: 0.25, gold_value: 3,
    star_prob: 0.08, star_value: 5, diamond_prob: 0.07, diamond_value: 10,
    event_multiplier: 2.0, event_start: "2026-11-08", event_end: "2026-11-18"
  }
};

async function loadCloudSettings() {
  try {
    const [resVip, resTheme, resRp] = await Promise.all([
      sb.from('bread_vip_prices').select('*'),
      sb.from('bread_theme_prices').select('*'),
      sb.from('bread_redpacket_config').select('*')
    ]);

    if (resVip.data) {
      // ★ 核心修改：统一过滤 type 为 'vip' 和 'svip'
      window.cloudSettings.vip_vip_prices = resVip.data.filter(i => i.type === 'vip').map(i => ({ days: i.days, base: i.price, label: i.label }));
      window.cloudSettings.vip_svip_prices = resVip.data.filter(i => i.type === 'svip').map(i => ({ days: i.days, base: i.price, label: i.label }));
    }

    if (resTheme.data) {
      const tObj = {};
      resTheme.data.forEach(i => { tObj[i.theme_key] = i.price; });
      window.cloudSettings.theme_prices = tObj;
    }

    if (resRp.data) {
      const rpObj = {};
      resRp.data.forEach(i => {
        const val = isNaN(Number(i.config_value)) ? i.config_value : Number(i.config_value);
        rpObj[i.config_key] = val;
      });
      window.cloudSettings.redpacket_config = rpObj;
    }
    console.log('✅ 成功从云端加载最新定价与概率配置');
  } catch (e) {
    console.warn('⚠️ 云端配置拉取失败，使用本地保底配置', e);
  }
}

setTimeout(loadCloudSettings, 1000);

let currentHour = new Date().getHours();
let defaultTheme = (currentHour >= 7 && currentHour < 18) ? 'light' : 'dark';
let currentUser = store.get('bb-current-user', null);
let theme = store.get('bb-theme', defaultTheme);
let engineKey = store.get('bb-engine', 'quark');
if (!ENGINES[engineKey]) engineKey = 'quark';
let sites = [], history = [], currentTheme = 'default';