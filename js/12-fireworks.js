/* =========================================================
   12-fireworks.js
   全主题专属色系（支持颜色适配开关）
   ========================================================= */

const fwCanvas = document.createElement('canvas');
fwCanvas.id = 'fireworks-canvas';
fwCanvas.style.position = 'fixed';
fwCanvas.style.inset = '0';
fwCanvas.style.zIndex = '0'; 
fwCanvas.style.pointerEvents = 'none'; 
document.body.appendChild(fwCanvas);

const fwCtx = fwCanvas.getContext('2d');

function resizeFwCanvas() {
  fwCanvas.width = window.innerWidth;
  fwCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeFwCanvas);
resizeFwCanvas();

const fireworks = [];
const particles = [];
const glows = [];
const textSparks = [];
/* 【新增】20261119：粒子总量保险丝，避免 emoji / 花簇烟花把页面拖死。 */
const MAX_ACTIVE_PARTICLES = 420;
const MAX_SHAPE_POINTS = 300;

function capShapePoints(points, max = MAX_SHAPE_POINTS) {
  if (!Array.isArray(points) || points.length <= max) return points;
  const stride = Math.ceil(points.length / max);
  return points.filter((_, index) => index % stride === 0);
} 

window.setFireworkLayer = function(isHigh) {
  fwCanvas.style.zIndex = isHigh ? '99999' : '0';
};

/* =========================================================
   【新增】特殊烟花：固定配色，不跟随主题色切换
   heart 爱心 / sakura 五瓣樱花 / star 五角星 / snowflake 雪花 / rainbow 彩虹
   galaxy 银河 / saturn 土星环 / diamond 钻石 / money 铜钱
   ========================================================= */
const SPECIAL_FIREWORK_STYLES = {
  heart: {
    palette: [[255, 74, 122], [255, 120, 160], [255, 180, 205], [255, 40, 90]],
    glow: '255, 90, 140', trail: 'rgb(255, 100, 150)', size: 2.2,
    /* 【新增】20261119：按类型决定是否二次爆炸；body 是补体积的普通火花数量。 */
    secondary: true, bodyCount: 42, jitter: 0.018
  },
  sakura: {
    /* 【新增】20261119：五瓣樱花烟花，固定粉红色系。 */
    palette: [[255, 183, 197], [255, 140, 170], [255, 210, 220], [250, 110, 150]],
    glow: '255, 170, 200', trail: 'rgb(255, 190, 210)', size: 2.0,
    secondary: false, bodyCount: 30, jitter: 0.012
  },
  money: {
    /* 【新增】20261119：外圆内方的铜钱烟花，固定金色。 */
    palette: [[255, 215, 0], [255, 236, 120], [255, 193, 7], [255, 248, 200]],
    glow: '255, 210, 80', trail: 'rgb(255, 220, 100)', size: 2.1,
    secondary: true, bodyCount: 38, jitter: 0.014
  },
  clover: {
    /* 【新增】20261119：三叶草烟花，固定草绿色。 */
    palette: [[92, 201, 120], [150, 230, 150], [56, 160, 88], [210, 245, 180]],
    glow: '110, 220, 130', trail: 'rgb(130, 225, 145)', size: 1.9,
    secondary: false, bodyCount: 28, jitter: 0.012
  },
  clover4: {
    /* 【新增】20261119：四叶草烟花，比三叶草更亮、更密。 */
    palette: [[110, 230, 140], [190, 255, 170], [70, 190, 110], [235, 255, 205]],
    glow: '130, 240, 150', trail: 'rgb(150, 240, 160)', size: 2.0,
    secondary: false, bodyCount: 32, jitter: 0.012
  },
  fruit: {
    /* 【新增】20261119：水果系列，每次随机一种水果轮廓。 */
    palette: [[255, 80, 90], [255, 180, 50], [255, 220, 80], [90, 200, 120], [170, 100, 220], [255, 140, 180]],
    glow: '255, 170, 120', trail: 'rgb(255, 185, 130)', size: 1.9,
    secondary: false, bodyCount: 30, jitter: 0.012
  },
  food: {
    /* 【新增】20261119：美食系列，每次随机一种食物轮廓。 */
    palette: [[255, 180, 70], [255, 120, 60], [255, 225, 130], [120, 200, 110], [220, 160, 90], [255, 240, 200]],
    glow: '255, 190, 110', trail: 'rgb(255, 205, 130)', size: 1.9,
    secondary: false, bodyCount: 30, jitter: 0.012
  },
  jellyfish: {
    /* 【新增】20261119：深海幽蓝的“水母烟花”，固定冰蓝 / 青蓝。 */
    palette: [[120, 235, 255], [70, 195, 245], [190, 250, 255], [45, 155, 220]],
    glow: '100, 220, 255', trail: 'rgb(120, 230, 255)', size: 1.9,
    secondary: false, bodyCount: 34, jitter: 0.014
  },
  honeycomb: {
    /* 【新增】20261119：蜂蜜工坊的蜂巢烟花，固定蜂蜜金。 */
    palette: [[255, 190, 45], [255, 225, 120], [235, 150, 25], [255, 245, 190]],
    glow: '255, 205, 90', trail: 'rgb(255, 215, 110)', size: 1.9,
    secondary: false, bodyCount: 30, jitter: 0.012
  },
  bee: {
    /* 【新增】20261119：蜜蜂烟花，黄黑配色 + 白色翅膀。 */
    palette: [[255, 210, 50], [55, 45, 35], [255, 245, 180], [255, 255, 255]],
    glow: '255, 220, 90', trail: 'rgb(255, 225, 120)', size: 1.8,
    secondary: false, bodyCount: 32, jitter: 0.012
  },
  star: {
    palette: [[255, 213, 74], [255, 179, 0], [255, 241, 118], [255, 196, 0]],
    glow: '255, 196, 60', trail: 'rgb(255, 200, 70)', size: 2.1,
    secondary: true, bodyCount: 46, jitter: 0.018
  },
  snowflake: {
    palette: [[255, 255, 255], [223, 244, 255], [179, 229, 252], [210, 245, 255]],
    glow: '210, 245, 255', trail: 'rgb(225, 248, 255)', size: 1.9,
    /* 雪花要保六向枝形，不加二次爆炸。 */
    secondary: false, bodyCount: 28, jitter: 0.012
  },
  rainbow: {
    palette: [[255, 59, 48], [255, 149, 0], [255, 204, 0], [52, 199, 89], [0, 199, 190], [0, 122, 255], [175, 82, 222]],
    glow: '255, 230, 180', trail: 'rgb(255, 240, 210)', size: 2.0,
    /* 彩虹要保弧线，不加二次爆炸。 */
    secondary: false, bodyCount: 26, jitter: 0.012
  },
  galaxy: {
    palette: [[142, 125, 255], [91, 140, 255], [199, 125, 255], [255, 255, 255], [88, 214, 255]],
    glow: '130, 150, 255', trail: 'rgb(150, 165, 255)', size: 1.8,
    /* 银河是松散星团，允许二次爆散。 */
    secondary: true, bodyCount: 52, jitter: 0.026
  },
  saturn: {
    palette: [[243, 209, 156], [224, 179, 106], [255, 241, 201], [201, 154, 82]],
    glow: '235, 195, 125', trail: 'rgb(235, 200, 140)', size: 2.0,
    /* 土星环要保椭圆轮廓，不加二次爆炸。 */
    secondary: false, bodyCount: 24, jitter: 0.012
  },
  diamond: {
    palette: [[255, 255, 255], [223, 246, 255], [159, 231, 255], [126, 200, 255]],
    glow: '190, 235, 255', trail: 'rgb(210, 245, 255)', size: 2.0,
    /* 钻石多切面适合再来一次小爆散。 */
    secondary: true, bodyCount: 38, jitter: 0.016
  },
  sun: {
    /* 【新增】20261119：盛夏海岸的太阳烟花，固定日光金。 */
    palette: [[255, 210, 60], [255, 240, 130], [255, 160, 40], [255, 255, 220]],
    glow: '255, 210, 80', trail: 'rgb(255, 225, 110)', size: 2.0,
    secondary: false, bodyCount: 34, jitter: 0.014
  },
  watermelon: {
    /* 【新增】20261119：盛夏海岸的西瓜烟花，固定红瓤绿皮。 */
    palette: [[255, 90, 100], [255, 140, 140], [80, 190, 100], [60, 120, 70], [40, 35, 35]],
    glow: '255, 120, 120', trail: 'rgb(255, 145, 145)', size: 1.8,
    secondary: false, bodyCount: 28, jitter: 0.012
  },
  wave: {
    /* 【新增】20261119：盛夏海岸的海浪烟花，固定青蓝。 */
    palette: [[80, 220, 255], [40, 160, 230], [170, 245, 255], [30, 110, 180]],
    glow: '90, 220, 255', trail: 'rgb(105, 225, 255)', size: 1.8,
    secondary: false, bodyCount: 26, jitter: 0.012
  },
  butterfly: {
    /* 【新增】20261119：春日花信的蝴蝶烟花，粉紫 + 暖黄。 */
    palette: [[255, 150, 200], [255, 210, 120], [180, 130, 255], [255, 255, 230]],
    glow: '255, 170, 210', trail: 'rgb(255, 190, 215)', size: 1.9,
    secondary: true, bodyCount: 32, jitter: 0.014
  },
  sprout: {
    /* 【新增】20261119：春日新芽，纯几何曲线 + 叶片，不用 emoji。 */
    palette: [[150, 235, 130], [95, 200, 110], [235, 255, 205], [255, 220, 130]],
    glow: '155, 235, 145', trail: 'rgb(175, 240, 165)', size: 1.8,
    secondary: false, bodyCount: 26, jitter: 0.012
  },
  leaf: {
    /* 【新增】20261119：春日叶片，叶脉用线段描出来。 */
    palette: [[120, 215, 115], [75, 180, 95], [205, 250, 165], [255, 230, 150]],
    glow: '125, 220, 130', trail: 'rgb(150, 230, 150)', size: 1.8,
    secondary: false, bodyCount: 24, jitter: 0.012
  },
  petal: {
    /* 【新增】20261119：春日花瓣，五片花瓣几何轮廓。 */
    palette: [[255, 180, 210], [255, 225, 235], [255, 145, 185], [255, 245, 180]],
    glow: '255, 185, 215', trail: 'rgb(255, 205, 225)', size: 1.8,
    secondary: false, bodyCount: 26, jitter: 0.012
  },
  vine: {
    /* 【新增】20261119：春日藤蔓，螺旋线 + 小叶片。 */
    palette: [[130, 220, 125], [90, 190, 105], [215, 250, 175], [255, 205, 120]],
    glow: '140, 225, 135', trail: 'rgb(165, 235, 160)', size: 1.7,
    secondary: false, bodyCount: 24, jitter: 0.012
  },
  seed: {
    /* 【新增】20261119：春日蒲公英种子，放射状冠毛 + 小种子。 */
    palette: [[255, 250, 220], [235, 245, 195], [255, 225, 150], [190, 240, 190]],
    glow: '255, 245, 200', trail: 'rgb(250, 250, 220)', size: 1.7,
    secondary: false, bodyCount: 22, jitter: 0.012
  }
};

/* 【新增】20261119：面包原野整套 emoji 烟花。
   把 emoji 画到离屏 canvas，再按像素采样成粒子，所以面包系列的 emoji 都能复用。 */
const BREAD_EMOJI_FIREWORKS = {
  bread: '🍞', croissant: '🥐', baguette: '🥖', bagel: '🥯', pretzel: '🥨',
  waffle: '🧇', sandwich: '🥪', donut: '🍩', pancake: '🥞', butter: '🧈',
  milk: '🥛', cupcake: '🧁', cake: '🍰', pie: '🥧', cookie: '🍪',
  chocolate: '🍫', candy: '🍬', lollipop: '🍭', pudding: '🍮', honey: '🍯',
  icecream: '🍦', shavedice: '🍧', icecreamBowl: '🍨'
};

/* 【新增】20261119：花语秘境的多种花烟花。 */
const FLOWER_EMOJI_FIREWORKS = {
  rose: '🌹', tulip: '🌷', sunflower: '🌻',
  lotus: '🪷', hydrangea: '🌺', dandelion: '🌼'
};

/* 为面包 / 花语两类 emoji 烟花批量生成固定配色样式。 */
Object.keys(BREAD_EMOJI_FIREWORKS).forEach((type) => {
  SPECIAL_FIREWORK_STYLES[type] = {
    palette: [
      [255, 205, 115], [255, 180, 80], [255, 235, 175],
      [225, 145, 60], [255, 245, 210]
    ],
    glow: '255, 200, 105', trail: 'rgb(255, 210, 125)',
    size: 1.9, secondary: false, bodyCount: 30, jitter: 0.012
  };
});

Object.keys(FLOWER_EMOJI_FIREWORKS).forEach((type, index) => {
  const palettes = [
    [[255, 120, 180], [255, 170, 210], [255, 225, 235], [220, 75, 140]],
    [[255, 170, 120], [255, 215, 150], [255, 245, 210], [235, 120, 80]],
    [[255, 205, 55], [250, 150, 40], [255, 240, 160], [215, 115, 35]],
    [[255, 150, 195], [255, 215, 235], [255, 245, 250], [230, 95, 155]],
    [[170, 205, 255], [215, 190, 255], [255, 210, 240], [120, 150, 235]],
    [[255, 245, 180], [255, 230, 120], [255, 255, 225], [230, 200, 90]]
  ];
  SPECIAL_FIREWORK_STYLES[type] = {
    palette: palettes[index % palettes.length],
    glow: '255, 210, 235', trail: 'rgb(255, 220, 240)',
    size: 1.9, secondary: false, bodyCount: 30, jitter: 0.012
  };
});

/* 【新增】20261119：秋季「秋日私语」的图案烟花。
   枫叶 / 橡果 / 南瓜 / 麦穗 / 丰收月 / 蘑菇。 */
const AUTUMN_EMOJI_FIREWORKS = {
  maple: '🍁', acorn: '🌰', pumpkin: '🎃',
  wheat: '🌾', harvestMoon: '🌕', mushroom: '🍄'
};

const AUTUMN_FIREWORK_PALETTES = {
  maple: [[255, 105, 55], [255, 155, 75], [255, 205, 110], [190, 55, 35]],
  acorn: [[205, 145, 80], [255, 205, 130], [150, 95, 50], [255, 235, 185]],
  pumpkin: [[255, 135, 35], [255, 185, 70], [235, 85, 30], [255, 225, 150]],
  wheat: [[255, 205, 80], [255, 230, 140], [215, 155, 45], [255, 245, 200]],
  harvestMoon: [[255, 240, 190], [255, 215, 130], [255, 250, 225], [235, 185, 90]],
  mushroom: [[235, 120, 75], [255, 180, 135], [255, 230, 200], [180, 90, 55]]
};

Object.keys(AUTUMN_EMOJI_FIREWORKS).forEach((type) => {
  SPECIAL_FIREWORK_STYLES[type] = {
    palette: AUTUMN_FIREWORK_PALETTES[type],
    glow: '255, 185, 105', trail: 'rgb(255, 195, 120)',
    size: 1.9, secondary: false, bodyCount: 30, jitter: 0.012
  };
});

const SPECIAL_FIREWORK_TYPES = Object.keys(SPECIAL_FIREWORK_STYLES);

/* 【新增】20261119：主题专属烟花映射。
   基础主题和它的 Plus / Max / Ultimate 共用同一组特殊烟花，
   但特殊烟花本身仍是固定配色，不跟随主题色。 */
const THEME_SPECIAL_FIREWORK_GROUPS = {
  default: [
    'bread', 'croissant', 'baguette', 'bagel', 'pretzel',
    'waffle', 'sandwich', 'donut', 'pancake', 'butter',
    'milk', 'cupcake', 'cake', 'pie', 'cookie',
    'chocolate', 'candy', 'lollipop', 'pudding', 'honey',
    'icecream', 'shavedice', 'icecreamBowl'
  ],
  spring: ['diamond', 'heart', 'snowflake', 'star', 'rainbow'],
  sakura: ['sakura', 'heart'],
  flower: ['heart', 'sakura', 'rose', 'tulip', 'sunflower', 'lotus', 'hydrangea', 'dandelion'],
  gold: ['star', 'money'],
  cyber: ['star'],
  forest: ['clover', 'clover4'],
  aurora: ['galaxy', 'star'],
  diamond: ['diamond'],
  fruit: ['fruit', 'rainbow'],
  food: ['food'],
  ocean: ['jellyfish'],
  honey: ['honeycomb', 'bee'],
  autumn: ['maple', 'acorn', 'pumpkin', 'wheat', 'harvestMoon', 'mushroom'],
  winter: ['snowflake'],
  springbloom: ['butterfly', 'sakura', 'heart', 'rainbow', 'sprout', 'leaf', 'petal', 'vine', 'seed'],
  summer: ['sun', 'watermelon', 'wave', 'rainbow'],
  blackgold: ['star', 'money'],
  /* 面包云暂时没有独立 key，先兼容几个常见写法；主题表里没有时不会生效。 */
  breadcloud: ['star'],
  'bread-cloud': ['star'],
  cloud: ['star']
};

/* 【新增】20261119：旧版普通烟花/物理烟花按主题档位保留。
   这些不是图案形状，而是柳火、双爆、二段爆、锦鲤、旋转、落叶等。 */
const THEME_LEGACY_FIREWORK_GROUPS = {
  spring: {
    plus: ['willow', 'double', 'two-stage', 'koi', 'spiral'],
    max: ['willow', 'double', 'two-stage', 'koi', 'spiral', 'twin-spark']
  },
  flower: {
    plus: ['willow', 'koi', 'spiral'],
    max: ['sakura-rain', 'bloom-burst', 'twin-spark', 'koi', 'double', 'two-stage', 'spiral']
  },
  autumn: {
    plus: ['willow', 'spiral', 'leaf-fall'],
    max: ['willow', 'double', 'two-stage', 'koi', 'spiral', 'leaf-fall'],
    ultimate: ['willow', 'double', 'two-stage', 'koi', 'spiral', 'leaf-fall', 'sakura-rain']
  },
  springbloom: {
    plus: ['willow', 'koi', 'spiral'],
    max: ['willow', 'koi', 'spiral', 'double', 'two-stage', 'sakura-rain'],
    ultimate: ['willow', 'koi', 'spiral', 'double', 'two-stage', 'sakura-rain', 'bloom-burst', 'twin-spark']
  },
  summer: {
    plus: ['willow', 'koi', 'spiral'],
    max: ['willow', 'koi', 'spiral', 'double', 'two-stage', 'twin-spark'],
    ultimate: ['willow', 'koi', 'spiral', 'double', 'two-stage', 'twin-spark', 'sakura-rain', 'bloom-burst']
  }
};

/* 【新增】20261119：所有 Plus 及以上主题通用的旧版烟花。
   柳火、锦鲤、花爆不再只挂在新春/花语/秋季，所有 Plus+ 主题都会混合发射。 */
const COMMON_PLUS_LEGACY_FIREWORKS = ['willow', 'koi', 'bloom-burst'];

function themeLegacyFireworkTypes(theme) {
  if (!theme) return [];
  const tier = themeTier(theme);
  if (tier === 'base') return [];
  const base = theme.replace(/-plus$/, '').replace(/-max$/, '').replace(/-ultimate$/, '');
  const group = THEME_LEGACY_FIREWORK_GROUPS[base];
  const specific = group && group[tier] ? group[tier] : [];
  /* 【修改】20261119：Plus 及以上统一加柳火 / 锦鲤 / 花爆；
     再去重，避免花语 Max 里 bloom-burst 重复出现。 */
  return Array.from(new Set([...COMMON_PLUS_LEGACY_FIREWORKS, ...specific]));
}

function pickThemeLegacyFirework(theme) {
  const types = themeLegacyFireworkTypes(theme);
  if (!types.length) return null;
  return types[Math.floor(Math.random() * types.length)];
}

/* 【新增】20261119：按主题档位解锁特殊烟花种类。
   Base 完全不放烟花；Plus 只开放一部分；Max 开放更多；
   只有 Ultimate 才开放整套。主题没有 Max / Ultimate 时，按它实际拥有的最高档处理。 */
function themeTier(theme) {
  if (!theme) return 'base';
  if (/-ultimate$/.test(theme)) return 'ultimate';
  if (/-max$/.test(theme)) return 'max';
  if (/-plus$/.test(theme)) return 'plus';
  return 'base';
}

function themeHasHigherTier(base) {
  if (typeof THEMES === 'undefined') return true;
  return !!(THEMES[base + '-max'] || THEMES[base + '-ultimate']);
}

function themeHasUltimate(base) {
  if (typeof THEMES === 'undefined') return false;
  return !!THEMES[base + '-ultimate'];
}

function limitSpecialTypesByTier(types, tier, base) {
  if (!types.length || tier === 'base') return [];
  // 没有 Max / Ultimate 的主题，Plus 就是它的最高档，不强行砍掉已有烟花。
  if (tier === 'plus' && !themeHasHigherTier(base)) return types.slice();
  // 没有 Ultimate 的主题，Max 就是最高档，直接开放整套。
  if (tier === 'max' && !themeHasUltimate(base)) return types.slice();
  const ratio = tier === 'plus' ? 0.50 : tier === 'max' ? 0.80 : 1.0;
  return types.slice(0, Math.max(1, Math.ceil(types.length * ratio)));
}

/* 【新增】20261119：烟花时段判断。
   night = 仅夜间模式；day = 仅白天模式；both = 都放。 */
function fireworkTimeAllowed() {
  try {
    const users = (typeof getUsersDB === 'function') ? getUsersDB() : null;
    const u = (currentUser && users) ? users[currentUser] : null;
    const mode = (u && u.fwTimeMode) ? u.fwTimeMode : 'both';
    if (mode !== 'night' && mode !== 'day') return true;
    const isDark = document.body.classList.contains('dark') ||
      (typeof theme !== 'undefined' && theme === 'dark');
    if (mode === 'night') return isDark;
    if (mode === 'day') return !isDark;
  } catch (e) { /* 读取失败时按都放处理 */ }
  return true;
}

function themeSpecialFireworkTypes(theme) {
  if (!theme) return [];
  const tier = themeTier(theme);
  const base = theme.replace(/-plus$/, '').replace(/-max$/, '').replace(/-ultimate$/, '');
  const full = THEME_SPECIAL_FIREWORK_GROUPS[base] || [];
  return limitSpecialTypesByTier(full, tier, base);
}

window.THEME_SPECIAL_FIREWORK_GROUPS = THEME_SPECIAL_FIREWORK_GROUPS;
window.getThemeSpecialFireworkTypes = themeSpecialFireworkTypes;
window.hasThemeSpecialFireworks = function(theme) {
  return themeSpecialFireworkTypes(theme).length > 0;
};

/* 【新增】20261119：每个主题的普通烟花色相。
   特殊烟花有自己的固定配色；普通烟花则用这里的主题专属颜色。 */
const THEME_FIREWORK_HUES = {
  default: [25, 30, 35, 40, 45],
  spring: [0, 45, 330, 300, 15],
  food: [15, 25, 35, 45, 10],
  fruit: [0, 90, 120, 60, 280],
  sakura: [320, 330, 340, 350],
  flower: [300, 320, 335, 350, 360],
  gold: [45, 50, 55, 60],
  cyber: [180, 120, 300, 330],
  forest: [90, 110, 130, 150],
  diamond: [260, 280, 300, 200, 220],
  aurora: [150, 170, 190, 280],
  ocean: [190, 210, 230, 160],
  blackgold: [40, 45, 50],
  honey: [35, 40, 45, 50],
  winter: [190, 200, 210, 220],
  springbloom: [310, 330, 120, 150, 190],
  summer: [185, 195, 200, 25, 350],
  breadcloud: [35, 40, 45, 200, 210],
  'bread-cloud': [35, 40, 45, 200, 210],
  cloud: [35, 40, 45, 200, 210]
};

function themeFireworkHues(theme) {
  if (!theme) return [];
  const base = theme.replace(/-plus$/, '').replace(/-max$/, '').replace(/-ultimate$/, '');
  return (THEME_FIREWORK_HUES[base] || []).slice();
}

window.THEME_FIREWORK_HUES = THEME_FIREWORK_HUES;
window.getThemeFireworkHues = themeFireworkHues;

/* 【新增】20261119：特殊烟花与主题的契合度权重。
   数值越高越优先；同主题内普通烟花只保留约 22% 权重。 */
const THEME_SPECIAL_FIREWORK_WEIGHTS = {
  default: {},
  spring: { heart: 3, diamond: 2, snowflake: 2, star: 2, rainbow: 2 },
  sakura: { heart: 2, sakura: 3 },
  flower: {
    heart: 3, sakura: 2,
    rose: 2, tulip: 2, sunflower: 2, lotus: 2, hydrangea: 2, dandelion: 2
  },
  gold: { star: 1, money: 4 },
  cyber: { star: 4 },
  forest: { clover: 3, clover4: 4 },
  aurora: { galaxy: 4, star: 1 },
  diamond: { diamond: 5 },
  fruit: { rainbow: 1, fruit: 5 },
  food: { food: 4 },
  ocean: { jellyfish: 4 },
  honey: { honeycomb: 3, bee: 3 },
  winter: { snowflake: 5 },
  springbloom: { butterfly: 4, sakura: 3, heart: 2, rainbow: 1, sprout: 3, leaf: 2, petal: 2, vine: 1, seed: 1 },
  summer: { sun: 4, watermelon: 3, wave: 3, rainbow: 1 },
  blackgold: { star: 1, money: 4 },
  breadcloud: { star: 4 },
  'bread-cloud': { star: 4 },
  cloud: { star: 4 }
};

function pickThemeSpecialFirework(theme) {
  const types = themeSpecialFireworkTypes(theme);
  if (!types.length) return null;
  const base = theme.replace(/-plus$/, '').replace(/-max$/, '').replace(/-ultimate$/, '');
  const weights = THEME_SPECIAL_FIREWORK_WEIGHTS[base] || {};
  const total = types.reduce((sum, type) => sum + Math.max(1, Number(weights[type]) || 1), 0);
  let cursor = Math.random() * total;
  for (const type of types) {
    cursor -= Math.max(1, Number(weights[type]) || 1);
    if (cursor <= 0) return type;
  }
  return types[types.length - 1];
}

window.THEME_SPECIAL_FIREWORK_WEIGHTS = THEME_SPECIAL_FIREWORK_WEIGHTS;
window.pickThemeSpecialFirework = pickThemeSpecialFirework;

function fireworkRgba(color, alpha) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function shapeRadius() {
  return Math.max(70, Math.min(150, Math.min(fwCanvas.width, fwCanvas.height) * 0.16));
}

function addShapePoint(points, x, y, color) {
  points.push({ x, y, color });
}

/* 【新增】20261119：通用圆形 / 椭圆 / 线段取样，供水果、美食、水母、蜜蜂等图案复用。 */
function addCirclePoints(points, cx, cy, radius, color, count = 24, startAngle = 0) {
  for (let i = 0; i < count; i++) {
    const angle = startAngle + i / count * Math.PI * 2;
    addShapePoint(points, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, color);
  }
}

function addEllipsePoints(points, cx, cy, rx, ry, color, count = 24, rotation = 0) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  for (let i = 0; i < count; i++) {
    const angle = i / count * Math.PI * 2;
    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry;
    addShapePoint(points, cx + x * cos - y * sin, cy + x * sin + y * cos, color);
  }
}

function addLinePoints(points, x1, y1, x2, y2, color, steps = 8) {
  addPolylinePoints(points, [{ x: x1, y: y1 }, { x: x2, y: y2 }], color, steps);
}

/* 【调整】20261119：中心只补少量“驻留点”，不做整片实心填充，避免中心糊成一团。 */
function addCoreFill(points, cx, cy, R, colors, count = 24, maxRadius = 0.45) {
  const sparseCount = Math.min(4, Math.max(2, Math.round(count * 0.15)));
  const sparseRadius = Math.min(maxRadius, 0.20);
  for (let i = 0; i < sparseCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = R * sparseRadius * Math.sqrt(Math.random());
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      color: colors[i % colors.length],
      core: true
    });
  }
}

/* 爱心：参数方程取样，内层再补一圈和少量填充点 */
function buildHeartPoints(cx, cy, R, palette) {
  const points = [];
  const unit = R / 17;
  const heart = (t, scale) => {
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x: cx + hx * unit * scale, y: cy + hy * unit * scale };
  };
  for (let i = 0; i < 90; i++) {
    const p = heart((i / 90) * Math.PI * 2, 1);
    addShapePoint(points, p.x, p.y, palette[i % palette.length]);
  }
  for (let i = 0; i < 42; i++) {
    const p = heart((i / 42) * Math.PI * 2, 0.55);
    addShapePoint(points, p.x, p.y, palette[(i + 1) % palette.length]);
  }
  for (let i = 0; i < 28; i++) {
    const p = heart(Math.random() * Math.PI * 2, 0.18 + Math.random() * 0.62);
    addShapePoint(points, p.x, p.y, palette[i % palette.length]);
  }
  return points;
}

/* 五角星：10 个顶点交替外/内半径，再取样每条边 */
function starVertices(cx, cy, radius, innerRatio = 0.45) {
  const vertices = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 === 0 ? radius : radius * innerRatio;
    vertices.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  return vertices;
}

function addPolylinePoints(points, vertices, color, steps) {
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      addShapePoint(points, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, color);
    }
  }
}

function buildStarPoints(cx, cy, R, palette) {
  const points = [];
  addPolylinePoints(points, starVertices(cx, cy, R, 0.45), palette[0], 9);
  addPolylinePoints(points, starVertices(cx, cy, R * 0.55, 0.45), palette[2], 5);
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * R * 0.35;
    addShapePoint(points, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, palette[1]);
  }
  addCoreFill(points, cx, cy, R, palette, 22, 0.38);
  return points;
}

/* 【调整】20261119：樱花改成“多朵花组成的花簇”。
   中间一朵大的，周围四朵小的；每片花瓣用圆润的弧线取样，并带樱花尖端的浅缺口。 */
function addSakuraFlower(points, fx, fy, fr, rotation, palette) {
  const petalCount = 5;
  const steps = 7;
  for (let petal = 0; petal < petalCount; petal++) {
    const baseAngle = rotation + petal * Math.PI * 2 / petalCount;
    const cos = Math.cos(baseAngle);
    const sin = Math.sin(baseAngle);
    const colorA = palette[(petal + 1) % palette.length];
    const colorB = palette[petal % palette.length];
    const push = (x, y, color) => {
      addShapePoint(points, fx + x * cos - y * sin, fy + x * sin + y * cos, color);
    };
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const x = (0.10 + u * 0.82) * fr;
      const width = fr * 0.27 * Math.sin(Math.PI * u) * (0.74 + 0.26 * Math.sqrt(u));
      push(x, width, colorA);
      push(x, -width, colorB);
      if (s % 2 === 0) push(x, width * 0.48, palette[2]);
    }
    // 花瓣尖端的小缺口，让形状更像樱花
    push(fr * 0.92, fr * 0.045, palette[2]);
    push(fr * 0.84, 0, palette[3]);
    push(fr * 0.92, -fr * 0.045, palette[2]);
  }
  // 花心：一小圈暖色花蕊
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2;
    addShapePoint(points, fx + Math.cos(angle) * fr * 0.09, fy + Math.sin(angle) * fr * 0.09, palette[2]);
  }
}

function buildSakuraPoints(cx, cy, R, palette) {
  const points = [];
  const flowers = [
    { x: 0, y: 0, r: 0.50, rot: -Math.PI / 2 },
    { x: -0.54, y: -0.28, r: 0.29, rot: -Math.PI / 2 + 0.34 },
    { x: 0.54, y: -0.28, r: 0.29, rot: -Math.PI / 2 - 0.34 },
    { x: -0.38, y: 0.44, r: 0.24, rot: -Math.PI / 2 + 0.62 },
    { x: 0.38, y: 0.44, r: 0.24, rot: -Math.PI / 2 - 0.62 }
  ];
  flowers.forEach((flower, index) => {
    addSakuraFlower(
      points,
      cx + flower.x * R,
      cy + flower.y * R,
      flower.r * R,
      flower.rot,
      [palette[index % palette.length], palette[(index + 1) % palette.length], palette[2], palette[3]]
    );
  });
  return points;
}

/* 【新增】20261119：金钱烟花。
   外圆内方的铜钱轮廓：外环 + 正方形钱眼 + 四个方向的短金线。 */
function buildMoneyPoints(cx, cy, R, palette) {
  const points = [];
  // 外圆
  for (let i = 0; i < 64; i++) {
    const angle = i / 64 * Math.PI * 2;
    addShapePoint(points, cx + Math.cos(angle) * R * 0.92, cy + Math.sin(angle) * R * 0.92, palette[i % 2 === 0 ? 0 : 1]);
  }
  // 正方形钱眼
  const hole = R * 0.30;
  addPolylinePoints(points, [
    { x: cx - hole, y: cy - hole },
    { x: cx + hole, y: cy - hole },
    { x: cx + hole, y: cy + hole },
    { x: cx - hole, y: cy + hole }
  ], palette[2], 8);
  // 四个方向的短金线，像铜钱外缘的光
  for (let k = 0; k < 4; k++) {
    const angle = k * Math.PI / 2;
    for (let s = 1; s <= 5; s++) {
      const r = R * (0.92 + s * 0.018);
      addShapePoint(points, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, palette[3]);
    }
  }
  /* 【新增】20261119：钱眼中心补一点金光，避免中心完全空着。 */
  addCoreFill(points, cx, cy, R, [palette[0], palette[3]], 10, 0.16);
  return points;
}

/* 【新增】20261119：三叶草 / 四叶草。
   每片叶子是一颗小爱心轮廓，绕中心旋转 120° 或 90°，最后补一根叶柄。 */
function buildCloverPoints(cx, cy, R, palette, leafCount) {
  const points = [];
  const unit = R / 32;
  for (let leaf = 0; leaf < leafCount; leaf++) {
    const baseAngle = -Math.PI / 2 + leaf * Math.PI * 2 / leafCount;
    const cos = Math.cos(baseAngle);
    const sin = Math.sin(baseAngle);
    for (let i = 0; i < 24; i++) {
      const t = i / 24 * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const localX = hx * unit * 0.86;
      const localY = hy * unit * 0.86;
      addShapePoint(points, cx + localX * cos - localY * sin, cy + localX * sin + localY * cos, palette[leaf % palette.length]);
    }
  }
  // 叶柄 + 中心小点
  addLinePoints(points, cx, cy + R * 0.18, cx, cy + R * 0.95, palette[2], 8);
  addCirclePoints(points, cx, cy, R * 0.10, palette[1], 14);
  addCoreFill(points, cx, cy, R, palette, 16, 0.20);
  return points;
}

/* 【新增】20261119：水果系列。
   每次随机选一种水果轮廓；目前 12 种：苹果 / 香蕉 / 葡萄 / 西瓜 / 草莓 / 樱桃 /
   桃子 / 菠萝 / 橙子 / 柠檬 / 梨 / 猕猴桃。 */
function buildFruitPoints(cx, cy, R, palette) {
  const points = [];
  const red = [255, 75, 95], green = [80, 205, 120], yellow = [255, 220, 80];
  const orange = [255, 155, 45], purple = [160, 95, 225], pink = [255, 150, 180];
  const brown = [145, 95, 45], black = [45, 40, 35], cream = [255, 245, 200];
  const blue = [80, 160, 225];
  const c = (x, y, r, color, n = 20) => addCirclePoints(points, cx + x * R, cy + y * R, r * R, color, n);
  const e = (x, y, rx, ry, color, rot = 0, n = 20) => addEllipsePoints(points, cx + x * R, cy + y * R, rx * R, ry * R, color, n, rot);
  const l = (x1, y1, x2, y2, color, n = 8) => addLinePoints(points, cx + x1 * R, cy + y1 * R, cx + x2 * R, cy + y2 * R, color, n);
  const variant = Math.floor(Math.random() * 12);

  if (variant === 0) { // 苹果
    c(0, 0.08, 0.55, red, 26); l(0, -0.35, 0, -0.78, brown); e(0.14, -0.62, 0.22, 0.10, green, -0.35);
  } else if (variant === 1) { // 香蕉
    const outer = [[-0.70, 0.15], [-0.50, -0.45], [0, -0.62], [0.45, -0.50], [0.65, -0.05]];
    const inner = [[0.50, 0.15], [0.20, -0.25], [-0.20, -0.28], [-0.50, 0.05]];
    addPolylinePoints(points, outer.map(v => ({ x: cx + v[0] * R, y: cy + v[1] * R })), yellow, 7);
    addPolylinePoints(points, inner.map(v => ({ x: cx + v[0] * R, y: cy + v[1] * R })), [255, 245, 150], 7);
    l(-0.70, 0.15, -0.50, 0.05, brown); l(0.65, -0.05, 0.50, 0.15, brown);
  } else if (variant === 2) { // 葡萄
    const grapes = [[0, -0.35], [-0.22, -0.18], [0.22, -0.18], [-0.30, 0.02], [0, 0.02], [0.30, 0.02], [-0.15, 0.22], [0.15, 0.22], [0, 0.42]];
    grapes.forEach((g, i) => c(g[0], g[1], 0.18, i % 2 ? purple : [190, 120, 245], 12));
    l(0, -0.52, 0.10, -0.82, green); e(0.24, -0.78, 0.20, 0.09, green, -0.3);
  } else if (variant === 3) { // 西瓜
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI + i / 24 * Math.PI;
      addShapePoint(points, cx + Math.cos(a) * R * 0.72, cy + Math.sin(a) * R * 0.55, green);
    }
    l(-0.72, 0, 0.72, 0, green, 16);
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI + i / 18 * Math.PI;
      addShapePoint(points, cx + Math.cos(a) * R * 0.60, cy + Math.sin(a) * R * 0.44, red);
    }
    for (let i = 0; i < 7; i++) {
      const a = 0.25 + i / 7 * 0.9;
      addShapePoint(points, cx + Math.cos(a) * R * 0.35, cy + Math.sin(a) * R * 0.22, black);
    }
  } else if (variant === 4) { // 草莓
    e(0, 0.08, 0.52, 0.62, red, 0, 24);
    for (let i = -2; i <= 2; i++) l(i * 0.16, -0.45, i * 0.22, -0.68, green, 4);
    for (let i = 0; i < 9; i++) c((i % 3 - 1) * 0.22, -0.15 + Math.floor(i / 3) * 0.20, 0.035, cream, 6);
  } else if (variant === 5) { // 樱桃
    c(-0.34, 0.22, 0.25, red, 18); c(0.30, 0.18, 0.25, [255, 110, 120], 18);
    l(-0.30, 0.02, -0.08, -0.62, brown); l(0.26, 0.00, 0.04, -0.62, brown);
    e(-0.02, -0.72, 0.22, 0.08, green, -0.2);
  } else if (variant === 6) { // 桃子
    c(0, 0.08, 0.55, pink, 24); l(0, -0.45, 0, 0.50, [255, 110, 140], 12);
    e(0.18, -0.62, 0.22, 0.09, green, -0.35);
  } else if (variant === 7) { // 菠萝
    e(0, 0.12, 0.50, 0.66, yellow, 0, 24);
    for (let i = -2; i <= 2; i++) {
      l(-0.55, -0.45 + i * 0.22, 0.55, 0.45 + i * 0.22, [230, 160, 30], 8);
      l(-0.55, 0.45 + i * 0.22, 0.55, -0.45 + i * 0.22, [230, 160, 30], 8);
    }
    for (let i = -2; i <= 2; i++) l(i * 0.14, -0.52, i * 0.24, -0.88, green, 6);
  } else if (variant === 8) { // 橙子
    c(0, 0.08, 0.55, orange, 26);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      l(0, 0.08, Math.cos(a) * 0.48, 0.08 + Math.sin(a) * 0.48, [255, 205, 80], 6);
    }
    e(0.16, -0.52, 0.20, 0.08, green, -0.3);
  } else if (variant === 9) { // 柠檬
    e(0, 0.08, 0.62, 0.36, yellow, 0.22, 26);
    l(-0.64, 0.05, -0.78, 0.10, [230, 190, 30]); l(0.64, 0.10, 0.78, 0.15, [230, 190, 30]);
    l(-0.40, -0.10, 0.40, 0.28, [255, 245, 140], 8);
  } else if (variant === 10) { // 梨
    c(0, 0.32, 0.46, [220, 225, 110], 22); c(0, -0.20, 0.30, [235, 235, 130], 18);
    l(0, -0.48, 0, -0.78, brown); e(0.16, -0.72, 0.18, 0.08, green, -0.3);
  } else { // 猕猴桃
    e(0, 0.08, 0.55, 0.42, green, 0, 24);
    e(0, 0.08, 0.22, 0.15, cream, 0, 14);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      addShapePoint(points, cx + Math.cos(a) * R * 0.33, cy + 0.08 * R + Math.sin(a) * R * 0.24, black);
    }
  }
  addCoreFill(points, cx, cy, R, [red, orange, yellow, green], 24, 0.34);
  return points;
}

/* 【新增】20261119：美食系列。
   目前 12 种：汉堡 / 披萨 / 薯条 / 鸡腿 / 甜甜圈 / 蛋糕 / 冰淇淋 /
   棒棒糖 / 曲奇 / 面包 / 热狗 / 纸杯蛋糕。 */
function buildFoodPoints(cx, cy, R, palette) {
  const points = [];
  const bun = [255, 190, 90], red = [220, 70, 60], green = [100, 200, 100];
  const yellow = [255, 220, 90], brown = [150, 95, 50], cream = [255, 245, 210];
  const pink = [255, 150, 180], white = [255, 255, 255];
  const c = (x, y, r, color, n = 20) => addCirclePoints(points, cx + x * R, cy + y * R, r * R, color, n);
  const e = (x, y, rx, ry, color, rot = 0, n = 20) => addEllipsePoints(points, cx + x * R, cy + y * R, rx * R, ry * R, color, n, rot);
  const l = (x1, y1, x2, y2, color, n = 8) => addLinePoints(points, cx + x1 * R, cy + y1 * R, cx + x2 * R, cy + y2 * R, color, n);
  const poly = (verts, color, n = 7) => addPolylinePoints(points, verts.map(v => ({ x: cx + v[0] * R, y: cy + v[1] * R })), color, n);
  const variant = Math.floor(Math.random() * 12);

  if (variant === 0) { // 汉堡
    e(0, -0.34, 0.62, 0.24, bun, 0, 20); l(-0.60, -0.08, 0.60, -0.08, green, 14);
    l(-0.55, 0.08, 0.55, 0.08, yellow, 14); l(-0.58, 0.22, 0.58, 0.22, red, 14);
    e(0, 0.40, 0.56, 0.14, bun, 0, 18);
  } else if (variant === 1) { // 披萨
    poly([[-0.58, 0.45], [0.58, 0.45], [0, -0.62]], yellow, 8);
    poly([[-0.58, 0.45], [0.58, 0.45]], brown, 10);
    c(-0.18, 0.12, 0.06, red, 8); c(0.20, 0.22, 0.06, red, 8); c(0.04, -0.10, 0.06, red, 8);
  } else if (variant === 2) { // 薯条
    poly([[-0.42, 0.35], [0.42, 0.35], [0.30, 0.78], [-0.30, 0.78]], red, 7);
    for (let i = 0; i < 6; i++) l(-0.30 + i * 0.12, 0.30, -0.26 + i * 0.12, -0.72 + (i % 2) * 0.08, yellow, 4);
  } else if (variant === 3) { // 鸡腿
    e(-0.10, 0.12, 0.36, 0.44, brown, -0.25, 20);
    l(0.20, 0.34, 0.58, -0.08, white, 8); c(0.62, -0.10, 0.10, cream, 8); c(0.50, -0.20, 0.10, cream, 8);
  } else if (variant === 4) { // 甜甜圈
    c(0, 0.05, 0.55, pink, 26); c(0, 0.05, 0.22, brown, 14);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      addShapePoint(points, cx + Math.cos(a) * R * 0.60, cy + 0.05 * R + Math.sin(a) * R * 0.60, [255, 245, 150]);
    }
  } else if (variant === 5) { // 蛋糕
    poly([[-0.50, 0.55], [0.50, 0.55], [0.38, -0.18], [-0.38, -0.18]], cream, 8);
    l(-0.55, 0.55, 0.55, 0.55, pink, 12); l(-0.40, 0.20, 0.40, 0.20, pink, 8);
    l(0, -0.20, 0, -0.58, yellow, 6); c(0, -0.66, 0.08, [255, 180, 50], 8);
  } else if (variant === 6) { // 冰淇淋
    poly([[-0.36, 0.15], [0.36, 0.15], [0, 0.78]], bun, 8);
    c(-0.18, -0.08, 0.28, pink, 16); c(0.18, -0.18, 0.28, cream, 16); c(0, -0.38, 0.24, [150, 220, 255], 14);
  } else if (variant === 7) { // 棒棒糖
    c(0, -0.18, 0.46, pink, 24); l(0, 0.28, 0, 0.86, white, 6);
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 4;
      addShapePoint(points, cx + Math.cos(a) * R * (0.10 + i * 0.018), cy - 0.18 * R + Math.sin(a) * R * (0.10 + i * 0.018), white);
    }
  } else if (variant === 8) { // 曲奇
    c(0, 0.05, 0.55, brown, 26);
    for (let i = 0; i < 7; i++) c((i % 3 - 1) * 0.24, -0.15 + Math.floor(i / 3) * 0.22, 0.07, [70, 45, 30], 6);
  } else if (variant === 9) { // 面包
    e(0, 0.05, 0.62, 0.38, bun, 0, 26);
    for (let i = -2; i <= 2; i++) l(-0.42, 0.18 + i * 0.10, 0.42, -0.10 + i * 0.10, brown, 6);
  } else if (variant === 10) { // 热狗
    e(0, 0.18, 0.62, 0.28, bun, 0, 20);
    l(-0.50, -0.05, 0.50, -0.05, red, 14); l(-0.50, 0.18, 0.50, 0.18, [200, 80, 45], 14);
    l(-0.30, -0.18, 0.30, -0.18, yellow, 14);
  } else { // 纸杯蛋糕
    poly([[-0.38, 0.20], [0.38, 0.20], [0.28, 0.72], [-0.28, 0.72]], [220, 160, 90], 8);
    e(0, 0.02, 0.46, 0.26, pink, 0, 20);
    c(0, -0.28, 0.10, red, 8); l(0, -0.36, 0, -0.58, green, 4);
  }
  addCoreFill(points, cx, cy, R, [bun, red, yellow, cream], 26, 0.38);
  return points;
}

/* 【新增】20261119：深海幽蓝的水母烟花。 */
function buildJellyfishPoints(cx, cy, R, palette) {
  const points = [];
  // 伞盖
  for (let i = 0; i <= 28; i++) {
    const a = Math.PI + i / 28 * Math.PI;
    addShapePoint(points, cx + Math.cos(a) * R * 0.56, cy + Math.sin(a) * R * 0.44 - R * 0.10, palette[i % 2 === 0 ? 0 : 1]);
  }
  // 伞盖底边
  addLinePoints(points, cx - R * 0.56, cy - R * 0.10, cx + R * 0.56, cy - R * 0.10, palette[2], 12);
  // 五条触手
  for (let t = 0; t < 5; t++) {
    const startX = (-0.44 + t * 0.22) * R;
    for (let s = 0; s <= 16; s++) {
      const u = s / 16;
      const wave = Math.sin(u * Math.PI * 3 + t) * R * 0.035;
      addShapePoint(points, cx + startX + wave, cy - R * 0.06 + u * R * 0.66, palette[(t + s) % palette.length]);
    }
  }
  addCoreFill(points, cx, cy - R * 0.10, R, palette, 16, 0.22);
  return points;
}

/* 【新增】20261119：蜂蜜工坊的蜂巢烟花，七格六边形。 */
function buildHoneycombPoints(cx, cy, R, palette) {
  const points = [];
  const cellR = R * 0.30;
  const cells = [[0, 0], [-0.52, -0.30], [0.52, -0.30], [-0.52, 0.30], [0.52, 0.30], [0, -0.60], [0, 0.60]];
  cells.forEach((cell, ci) => {
    const verts = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i / 6 * Math.PI * 2;
      verts.push({ x: cx + cell[0] * R + Math.cos(a) * cellR, y: cy + cell[1] * R + Math.sin(a) * cellR });
    }
    addPolylinePoints(points, verts, palette[ci % 2 ? 1 : 0], 5);
  });
  addCoreFill(points, cx, cy, R, palette, 20, 0.22);
  return points;
}

/* 【新增】20261119：蜜蜂烟花。 */
function buildBeePoints(cx, cy, R, palette) {
  const points = [];
  // 身体
  addEllipsePoints(points, cx, cy, R * 0.34, R * 0.52, palette[0], 22, 0.18);
  // 黑色条纹
  for (let i = -1; i <= 1; i++) {
    addLinePoints(points, cx - R * 0.30 + i * R * 0.04, cy + i * R * 0.18 - R * 0.22, cx + R * 0.30 + i * R * 0.04, cy + i * R * 0.18 + R * 0.20, palette[1], 7);
  }
  // 翅膀
  addEllipsePoints(points, cx - R * 0.28, cy - R * 0.34, R * 0.28, R * 0.14, palette[3], 14, -0.45);
  addEllipsePoints(points, cx + R * 0.28, cy - R * 0.34, R * 0.28, R * 0.14, palette[3], 14, 0.45);
  // 触角
  addLinePoints(points, cx - R * 0.12, cy - R * 0.48, cx - R * 0.26, cy - R * 0.78, palette[1], 6);
  addLinePoints(points, cx + R * 0.12, cy - R * 0.48, cx + R * 0.26, cy - R * 0.78, palette[1], 6);
  addCoreFill(points, cx, cy, R, palette, 22, 0.30);
  return points;
}

/* 雪花：六向主枝 + 两侧分叉 */
function buildSnowflakePoints(cx, cy, R, palette) {
  const points = [];
  for (let arm = 0; arm < 6; arm++) {
    const angle = -Math.PI / 2 + arm * Math.PI / 3;
    for (let s = 1; s <= 10; s++) {
      const r = R * s / 10;
      addShapePoint(points, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, palette[s % palette.length]);
    }
    for (const at of [0.35, 0.65]) {
      const originX = cx + Math.cos(angle) * R * at;
      const originY = cy + Math.sin(angle) * R * at;
      for (const side of [-Math.PI / 2.8, Math.PI / 2.8]) {
        const branchAngle = angle + side;
        for (let s = 1; s <= 4; s++) {
          const r = R * 0.28 * s / 4;
          addShapePoint(
            points,
            originX + Math.cos(branchAngle) * r,
            originY + Math.sin(branchAngle) * r,
            palette[(s + arm) % palette.length]
          );
        }
      }
    }
  }
  addCoreFill(points, cx, cy, R, palette, 20, 0.26);
  return points;
}

/* 彩虹：七条同心弧线，颜色按色带分配 */
function buildRainbowPoints(cx, cy, R, palette) {
  const points = [];
  const start = Math.PI * 1.12;
  const end = Math.PI * 1.88;
  for (let band = 0; band < 7; band++) {
    const radius = R * (0.45 + band / 6 * 0.55);
    for (let i = 0; i <= 20; i++) {
      const angle = start + (end - start) * i / 20;
      addShapePoint(points, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, palette[band]);
    }
  }
  /* 【新增】20261119：彩虹中心补一轮暖色太阳核心，避免正中间空洞。 */
  addCirclePoints(points, cx, cy, R * 0.20, palette[2], 18);
  addCoreFill(points, cx, cy, R, [palette[2], palette[3]], 34, 0.40);
  return points;
}

/* 银河：三条对数螺旋臂 + 中心亮核 */
function buildGalaxyPoints(cx, cy, R, palette) {
  const points = [];
  for (let arm = 0; arm < 3; arm++) {
    for (let i = 0; i < 45; i++) {
      const t = i / 44;
      const angle = t * Math.PI * 2.2 + arm * Math.PI * 2 / 3;
      const radius = R * (0.08 + t * 0.92);
      const jitter = (Math.random() - 0.5) * 10;
      addShapePoint(
        points,
        cx + Math.cos(angle) * radius + jitter,
        cy + Math.sin(angle) * radius * 0.78 + jitter * 0.6,
        palette[(i + arm) % palette.length]
      );
    }
  }
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * R * 0.22;
    addShapePoint(points, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, palette[3]);
  }
  return points;
}

/* 土星环：球体 + 倾斜椭圆环 */
function buildSaturnPoints(cx, cy, R, palette) {
  const points = [];
  for (let i = 0; i < 72; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = R * 0.52 * Math.sqrt(Math.random());
    addShapePoint(points, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, palette[i % palette.length]);
  }
  for (const ringScale of [0.82, 1]) {
    for (let i = 0; i < 42; i++) {
      const angle = i / 42 * Math.PI * 2;
      const dx = Math.cos(angle) * R * ringScale;
      const dy = Math.sin(angle) * R * 0.28 * ringScale;
      const tilt = -0.35;
      addShapePoint(
        points,
        cx + dx * Math.cos(tilt) - dy * Math.sin(tilt),
        cy + dx * Math.sin(tilt) + dy * Math.cos(tilt),
        palette[i % 2 === 0 ? 2 : 0]
      );
    }
  }
  return points;
}

/* 钻石：外轮廓 + 内部切面线 + 高光点 */
function buildDiamondPoints(cx, cy, R, palette) {
  const points = [];
  const vertices = [
    { x: cx, y: cy - R },
    { x: cx + R * 0.55, y: cy - R * 0.32 },
    { x: cx + R * 0.70, y: cy + R * 0.12 },
    { x: cx, y: cy + R * 0.82 },
    { x: cx - R * 0.70, y: cy + R * 0.12 },
    { x: cx - R * 0.55, y: cy - R * 0.32 }
  ];
  addPolylinePoints(points, vertices, palette[0], 9);
  const facetLines = [
    [vertices[0], vertices[3]],
    [vertices[1], vertices[4]],
    [vertices[2], vertices[5]],
    [vertices[1], vertices[5]],
    [vertices[0], vertices[4]],
    [vertices[0], vertices[2]]
  ];
  for (let i = 0; i < facetLines.length; i++) {
    const [a, b] = facetLines[i];
    addPolylinePoints(points, [a, b], palette[(i + 1) % palette.length], 5);
  }
  for (let i = 0; i < 12; i++) {
    addShapePoint(points, cx + (Math.random() - 0.5) * R * 0.9, cy + (Math.random() - 0.5) * R * 0.75, palette[3]);
  }
  addCoreFill(points, cx, cy, R, palette, 20, 0.40);
  return points;
}

/* 【新增】20261119：春季蝴蝶烟花，不用 emoji，直接用翅膀几何轮廓。 */
function buildButterflyPoints(cx, cy, R, palette) {
  const points = [];
  const wing = (side) => {
    addEllipsePoints(points, cx + side * R * 0.38, cy - R * 0.24, R * 0.46, R * 0.28, palette[0], 24, side * 0.38);
    addEllipsePoints(points, cx + side * R * 0.31, cy + R * 0.23, R * 0.34, R * 0.24, palette[2], 20, -side * 0.42);
    addEllipsePoints(points, cx + side * R * 0.34, cy - R * 0.20, R * 0.20, R * 0.13, palette[1], 12, side * 0.38);
  };
  wing(-1); wing(1);
  /* 身体 */
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    addShapePoint(points, cx, cy - R * 0.50 + R * 0.92 * t, palette[3]);
  }
  /* 触角 */
  addLinePoints(points, cx, cy - R * 0.48, cx - R * 0.20, cy - R * 0.78, palette[2], 7);
  addLinePoints(points, cx, cy - R * 0.48, cx + R * 0.20, cy - R * 0.78, palette[2], 7);
  addCoreFill(points, cx, cy, R, palette, 20, 0.34);
  return points;
}

/* 【新增】20261119：春日新芽，茎 + 两片叶子 + 顶端芽点，全部几何绘制。 */
function buildSproutPoints(cx, cy, R, palette) {
  const points = [];
  const stemSteps = 42;
  for (let i = 0; i <= stemSteps; i++) {
    const t = i / stemSteps;
    addShapePoint(points, cx + Math.sin(t * Math.PI * 1.7) * R * 0.07, cy + R * 0.74 - t * R * 1.42, palette[1]);
  }
  addEllipsePoints(points, cx - R * 0.30, cy + R * 0.18, R * 0.30, R * 0.13, palette[0], 20, -0.52);
  addEllipsePoints(points, cx + R * 0.30, cy - R * 0.10, R * 0.30, R * 0.13, palette[2], 20, 0.52);
  addCirclePoints(points, cx + R * 0.02, cy - R * 0.58, R * 0.14, palette[3], 16);
  addLinePoints(points, cx - R * 0.48, cy + R * 0.34, cx - R * 0.10, cy + R * 0.24, palette[2], 8);
  addLinePoints(points, cx + R * 0.48, cy + R * 0.06, cx + R * 0.12, cy - R * 0.02, palette[2], 8);
  addCirclePoints(points, cx, cy + R * 0.78, R * 0.30, palette[2], 18, Math.PI);
  addCoreFill(points, cx, cy, R, palette, 14, 0.24);
  return points;
}

/* 【新增】20261119：春日叶片，叶形轮廓 + 主脉 + 侧脉。 */
function buildLeafPoints(cx, cy, R, palette) {
  const points = [];
  const edge = [];
  const n = 52;
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2;
    edge.push({
      x: cx + Math.sin(t) * R * 0.58,
      y: cy - Math.cos(t) * R * 0.78 + Math.sin(t * 2) * R * 0.12
    });
  }
  addPolylinePoints(points, edge, palette[0], 3);
  addLinePoints(points, cx, cy - R * 0.84, cx, cy + R * 0.76, palette[1], 18);
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    const y = cy - R * 0.84 + t * R * 1.45;
    const half = Math.sin(t * Math.PI) * R * 0.42;
    addLinePoints(points, cx, y, cx - half, y + R * 0.14, palette[2], 8);
    addLinePoints(points, cx, y, cx + half, y + R * 0.14, palette[2], 8);
  }
  addCoreFill(points, cx, cy, R, palette, 12, 0.20);
  return points;
}

/* 【新增】20261119：春日花瓣，五片花瓣围绕一个小花心。 */
function buildPetalPoints(cx, cy, R, palette) {
  const points = [];
  for (let k = 0; k < 5; k++) {
    const angle = -Math.PI / 2 + k / 5 * Math.PI * 2;
    const px = cx + Math.cos(angle) * R * 0.38;
    const py = cy + Math.sin(angle) * R * 0.38;
    addEllipsePoints(points, px, py, R * 0.30, R * 0.17, palette[k % 3], 22, angle + Math.PI / 2);
    addEllipsePoints(points, px, py, R * 0.17, R * 0.09, palette[3], 10, angle + Math.PI / 2);
  }
  addCirclePoints(points, cx, cy, R * 0.16, palette[3], 18);
  addCirclePoints(points, cx, cy, R * 0.07, palette[1], 10);
  addCoreFill(points, cx, cy, R, palette, 16, 0.24);
  return points;
}

/* 【新增】20261119：春日藤蔓，螺旋茎 + 沿途小叶。 */
function buildVinePoints(cx, cy, R, palette) {
  const points = [];
  const steps = 76;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps * Math.PI * 3.4;
    const radius = R * (0.14 + 0.70 * (i / steps));
    addShapePoint(points, cx + Math.cos(t) * radius, cy + Math.sin(t) * radius * 0.82, i % 6 === 0 ? palette[2] : palette[1]);
    if (i % 12 === 6 && i < steps - 4) {
      const angle = t + Math.PI / 2;
      addEllipsePoints(points, cx + Math.cos(t) * radius, cy + Math.sin(t) * radius * 0.82,
        R * 0.14, R * 0.07, palette[0], 12, angle);
    }
  }
  addCirclePoints(points, cx + R * 0.72, cy + R * 0.10, R * 0.12, palette[3], 14);
  addCoreFill(points, cx, cy, R, palette, 10, 0.18);
  return points;
}

/* 【新增】20261119：春日蒲公英种子，放射冠毛 + 小种子。 */
function buildSeedPoints(cx, cy, R, palette) {
  const points = [];
  const tips = 12;
  for (let i = 0; i < tips; i++) {
    const angle = i / tips * Math.PI * 2 + (i % 2 ? 0.08 : 0);
    const sx = cx + Math.cos(angle) * R * 0.16;
    const sy = cy + Math.sin(angle) * R * 0.16;
    const ex = cx + Math.cos(angle) * R * 0.82;
    const ey = cy + Math.sin(angle) * R * 0.82;
    addLinePoints(points, sx, sy, ex, ey, palette[3], 8);
    for (let k = -2; k <= 2; k++) {
      const a = angle + k * 0.16;
      addLinePoints(points, ex, ey, ex + Math.cos(a) * R * 0.16, ey + Math.sin(a) * R * 0.16, palette[0], 3);
    }
    addShapePoint(points, sx, sy, palette[1]);
  }
  addCirclePoints(points, cx, cy, R * 0.18, palette[2], 16);
  addCoreFill(points, cx, cy, R, palette, 10, 0.18);
  return points;
}

/* 【新增】20261119：夏季太阳烟花，圆盘 + 放射光线。 */
function buildSunPoints(cx, cy, R, palette) {
  const points = [];
  addCirclePoints(points, cx, cy, R * 0.42, palette[0], 36);
  addCirclePoints(points, cx, cy, R * 0.62, palette[1], 30);
  for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2;
    const inner = R * 0.68;
    const outer = R * (i % 2 === 0 ? 1.0 : 0.86);
    addLinePoints(
      points,
      cx + Math.cos(angle) * inner,
      cy + Math.sin(angle) * inner,
      cx + Math.cos(angle) * outer,
      cy + Math.sin(angle) * outer,
      palette[i % palette.length],
      5
    );
  }
  addCoreFill(points, cx, cy, R, palette, 24, 0.38);
  return points;
}

/* 【新增】20261119：夏季西瓜烟花，红瓤绿皮 + 黑籽。 */
function buildWatermelonPoints(cx, cy, R, palette) {
  const points = [];
  const baseY = cy + R * 0.46;
  const r = R * 0.88;
  for (let layer = 0; layer < 3; layer++) {
    const rr = r - layer * R * 0.14;
    const color = layer === 0 ? palette[2] : layer === 1 ? palette[4] : palette[0];
    for (let i = 0; i <= 34; i++) {
      const angle = Math.PI + i / 34 * Math.PI;
      addShapePoint(points, cx + Math.cos(angle) * rr, baseY + Math.sin(angle) * rr, color);
    }
  }
  addLinePoints(points, cx - r, baseY, cx + r, baseY, palette[3], 22);
  for (let i = 0; i < 7; i++) {
    const x = cx - r * 0.55 + i * r * 0.18;
    const y = baseY - R * (0.22 + (i % 2) * 0.12);
    addShapePoint(points, x, y, palette[4]);
    addShapePoint(points, x + R * 0.03, y + R * 0.02, palette[4]);
  }
  return points;
}

/* 【新增】20261119：夏季海浪烟花，三条正弦浪线。 */
function buildWavePoints(cx, cy, R, palette) {
  const points = [];
  const waves = [
    { y: -R * 0.34, amp: R * 0.18, phase: 0, color: palette[0], count: 46 },
    { y: R * 0.02, amp: R * 0.22, phase: 0.8, color: palette[1], count: 52 },
    { y: R * 0.38, amp: R * 0.16, phase: 1.5, color: palette[2], count: 42 }
  ];
  waves.forEach((w) => {
    for (let i = 0; i < w.count; i++) {
      const t = i / (w.count - 1);
      const x = cx - R + t * R * 2;
      const y = cy + w.y + Math.sin(t * Math.PI * 3 + w.phase) * w.amp;
      addShapePoint(points, x, y, w.color);
    }
  });
  for (let i = 0; i < 12; i++) {
    addShapePoint(points, cx + (Math.random() - 0.5) * R * 1.6, cy + (Math.random() - 0.5) * R * 0.9, palette[3]);
  }
  return points;
}

/* 【新增】20261119：把任意 emoji 采样成烟花轮廓。
   面包原野和花语秘境都用这一套，不会因为新增 emoji 又要手写一个形状。 */
function buildEmojiPoints(cx, cy, R, palette, emoji) {
  const points = [];
  if (typeof document === 'undefined') {
    return buildCircleFallback(cx, cy, R, palette);
  }
  const size = 144;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return buildCircleFallback(cx, cy, R, palette);
  ctx.clearRect(0, 0, size, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(size * 0.92)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.fillText(emoji, size / 2, size / 2);
  const image = ctx.getImageData(0, 0, size, size).data;
  const step = 4;
  const scale = (R * 1.85) / size;
  for (let py = 0; py < size; py += step) {
    for (let px = 0; px < size; px += step) {
      const alpha = image[(py * size + px) * 4 + 3];
      if (alpha > 48) {
        addShapePoint(
          points,
          cx + (px - size / 2) * scale,
          cy + (py - size / 2) * scale,
          palette[(points.length + Math.floor(py / 12)) % palette.length]
        );
      }
    }
  }
  if (points.length < 40) return buildCircleFallback(cx, cy, R, palette);
  /* 单次 emoji 烟花最多 220 个形状点，防止 23 种面包 emoji 叠加时过载。 */
  return capShapePoints(points, 220);
}

function buildCircleFallback(cx, cy, R, palette) {
  const points = [];
  addCirclePoints(points, cx, cy, R * 0.72, palette[0], 36);
  addCoreFill(points, cx, cy, R, palette, 10, 0.24);
  return points;
}

function buildSpecialShapePoints(type, cx, cy) {
  const R = shapeRadius();
  const style = SPECIAL_FIREWORK_STYLES[type];
  const safeX = Math.max(R + 10, Math.min(fwCanvas.width - R - 10, cx));
  const safeY = Math.max(R + 10, Math.min(fwCanvas.height - R - 10, cy));
  if (BREAD_EMOJI_FIREWORKS[type]) {
    return buildEmojiPoints(safeX, safeY, R, style.palette, BREAD_EMOJI_FIREWORKS[type]);
  }
  if (FLOWER_EMOJI_FIREWORKS[type]) {
    return buildEmojiPoints(safeX, safeY, R, style.palette, FLOWER_EMOJI_FIREWORKS[type]);
  }
  if (AUTUMN_EMOJI_FIREWORKS[type]) {
    return buildEmojiPoints(safeX, safeY, R, style.palette, AUTUMN_EMOJI_FIREWORKS[type]);
  }
  if (type === 'heart') return buildHeartPoints(safeX, safeY, R, style.palette);
  if (type === 'star') return buildStarPoints(safeX, safeY, R, style.palette);
  if (type === 'sakura') return buildSakuraPoints(safeX, safeY, R, style.palette);
  if (type === 'money') return buildMoneyPoints(safeX, safeY, R, style.palette);
  if (type === 'clover') return buildCloverPoints(safeX, safeY, R, style.palette, 3);
  if (type === 'clover4') return buildCloverPoints(safeX, safeY, R, style.palette, 4);
  if (type === 'fruit') return buildFruitPoints(safeX, safeY, R, style.palette);
  if (type === 'food') return buildFoodPoints(safeX, safeY, R, style.palette);
  if (type === 'jellyfish') return buildJellyfishPoints(safeX, safeY, R, style.palette);
  if (type === 'honeycomb') return buildHoneycombPoints(safeX, safeY, R, style.palette);
  if (type === 'bee') return buildBeePoints(safeX, safeY, R, style.palette);
  if (type === 'snowflake') return buildSnowflakePoints(safeX, safeY, R, style.palette);
  if (type === 'rainbow') return buildRainbowPoints(safeX, safeY, R, style.palette);
  if (type === 'galaxy') return buildGalaxyPoints(safeX, safeY, R, style.palette);
  if (type === 'saturn') return buildSaturnPoints(safeX, safeY, R, style.palette);
  if (type === 'diamond') return buildDiamondPoints(safeX, safeY, R, style.palette);
  if (type === 'butterfly') return buildButterflyPoints(safeX, safeY, R, style.palette);
  if (type === 'sprout') return buildSproutPoints(safeX, safeY, R, style.palette);
  if (type === 'leaf') return buildLeafPoints(safeX, safeY, R, style.palette);
  if (type === 'petal') return buildPetalPoints(safeX, safeY, R, style.palette);
  if (type === 'vine') return buildVinePoints(safeX, safeY, R, style.palette);
  if (type === 'seed') return buildSeedPoints(safeX, safeY, R, style.palette);
  if (type === 'sun') return buildSunPoints(safeX, safeY, R, style.palette);
  if (type === 'watermelon') return buildWatermelonPoints(safeX, safeY, R, style.palette);
  if (type === 'wave') return buildWavePoints(safeX, safeY, R, style.palette);
  return [];
}

/* 【新增】20261119：只判断「新春大吉」的 spring，不误伤 springbloom（春日花信）。 */
function isSpringFestivalTheme(theme) {
  if (!theme) return false;
  const base = String(theme).replace(/-plus$/, '').replace(/-max$/, '').replace(/-ultimate$/, '');
  return base === 'spring';
}

class Firework {
  constructor(sx, sy, tx, ty, hue, isBg = false, type = 'normal') {
    this.x = sx; this.y = sy;
    this.sx = sx; this.sy = sy;
    this.tx = tx; this.ty = ty;
    this.distanceToTarget = Math.hypot(tx - sx, ty - sy);
    this.distanceTraveled = 0;
    this.coordinates = [];
    this.coordinateCount = 8;
    while (this.coordinateCount--) {
      this.coordinates.push([this.x, this.y]);
    }
    this.angle = Math.atan2(ty - sy, tx - sx);
    
    let currentUsersDB = getUsersDB();
    let speedMult = (currentUser && currentUsersDB[currentUser] && currentUsersDB[currentUser].fwSpeed) ? currentUsersDB[currentUser].fwSpeed : 1.0;
    /* 【修改】20261119：速度上限放宽到 25，但用幂函数压缩，避免烟花一帧飞到屏幕外。 */
    speedMult = Math.pow(Math.max(0.1, Number(speedMult) || 1), 0.6);
    
    let baseSpeed = (3 + Math.random() * 2) * speedMult; 
    this.speed = isBg ? baseSpeed * 0.7 : baseSpeed;
    this.acceleration = isBg ? 1.02 : 1.03; 
    this.brightness = Math.random() * 20 + 70;
    this.hue = hue;
    this.type = type; 
    this.hasSplit = false; 
    const specialStyle = SPECIAL_FIREWORK_STYLES[this.type];
    this.trailColor = specialStyle ? specialStyle.trail : null;
  }
  
  update(index) {
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);
    this.speed *= this.acceleration;
    let vx = Math.cos(this.angle) * this.speed;
    let vy = Math.sin(this.angle) * this.speed;
    this.distanceTraveled = Math.hypot(this.x - this.sx, this.y - this.sy);
    
    if (this.type === 'two-stage' && !this.hasSplit && this.distanceTraveled >= this.distanceToTarget * 0.5) {
      this.hasSplit = true;
      createExplosion(this.x, this.y, this.hue, 'small-burst');
    } else if (this.type === 'twin-spark' && !this.hasSplit && this.distanceTraveled >= this.distanceToTarget * 0.5) {
      this.hasSplit = true;
      createExplosion(this.x, this.y, this.hue, 'gold-spark');
    }

    if (this.distanceTraveled >= this.distanceToTarget) {
      if (SPECIAL_FIREWORK_STYLES[this.type]) {
        createShapeFirework(this.tx, this.ty, this.type);
      }
      else if (this.type === 'willow') createExplosion(this.tx, this.ty, this.hue, 'willow');
      else if (this.type === 'double') {
        createExplosion(this.tx, this.ty, this.hue, 'double-outer');
        setTimeout(() => createExplosion(this.tx, this.ty, this.hue, 'double-inner'), 300);
      } 
      else if (this.type === 'koi') createExplosion(this.tx, this.ty, this.hue, 'koi');
      /* 【新增】20261119：旋转风火 / 秋叶飘落，补回旧版没有的物理烟花。 */
      else if (this.type === 'spiral') createExplosion(this.tx, this.ty, this.hue, 'spiral');
      else if (this.type === 'leaf-fall') createExplosion(this.tx, this.ty, this.hue, 'leaf-fall');
      else if (this.type === 'text') createTextFirework(this.tx, this.ty);
      else if (this.type === 'sakura-rain') createExplosion(this.tx, this.ty, 0, 'sakura-rain');
      else if (this.type === 'bloom-burst') {
        createExplosion(this.tx, this.ty, 0, 'bloom-burst-outer');
        setTimeout(() => createExplosion(this.tx, this.ty, 0, 'bloom-burst-inner'), 300);
      }
      else if (this.type === 'twin-spark') {
        createExplosion(this.tx, this.ty, this.hue, 'normal');
        createTwinStream(this.tx, this.ty);
      }
      else {
        createExplosion(this.tx, this.ty, this.hue, 'normal');
      }
      
      if (isSpringFestivalTheme(currentTheme) && Math.random() < 0.5) {
        glows.push({ x: this.tx, y: this.ty, radius: 10, maxRadius: 300 + Math.random() * 150, alpha: 0.6, color: '255, 50, 50' });
      }
      
      fireworks.splice(index, 1);
    } else {
      this.x += vx; this.y += vy;
    }
  }
  
  draw() {
    fwCtx.beginPath();
    fwCtx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    fwCtx.lineTo(this.x, this.y);
    fwCtx.strokeStyle = this.trailColor || `hsl(${this.hue}, 100%, ${this.brightness}%)`;
    fwCtx.lineWidth = 2.5;
    fwCtx.stroke();
  }
}

class Particle {
  constructor(x, y, hue, type = 'normal') {
    this.x = x; this.y = y;
    this.coordinates = [];
    this.type = type;
    this.rgb = null;
    this.lineWidth = 1.5;
    
    let coordinateCount = 6;
    let speed = 0, friction = 1, gravity = 0, decay = 0.01, angle = 0;

    if (type === 'willow') {
      coordinateCount = 15;
      speed = Math.random() * 4 + 2;
      friction = 0.98; gravity = 0.12; decay = Math.random() * 0.005 + 0.005; angle = Math.random() * Math.PI * 2;
      this.hue = 325 + Math.random() * 15;
    } else if (type === 'firecracker') {
      coordinateCount = 3; speed = Math.random() * 20 + 10; gravity = 0.5; friction = 0.85; decay = 0.06;
      angle = -Math.PI/2 + (Math.random() - 0.5) * 2.5; 
    } else if (type === 'shape') {
      /* 【新增】20261119：特殊烟花主体不再停在图案上，
         而是用普通烟花的粒子物理：速度 / 摩擦 / 重力 / 衰减 / 拖尾。 */
      coordinateCount = 8;
      speed = 0; friction = 0.972; gravity = 0.018; decay = 0.006; angle = 0;
    } else if (type === 'koi') {
      coordinateCount = 3; speed = 2 + Math.random() * 2; friction = 1; gravity = 0; decay = Math.random() * 0.01 + 0.01; angle = Math.random() * Math.PI * 2;
      this.wave = Math.random() * Math.PI * 2; 
    } else if (type === 'sakura-rain') {
      coordinateCount = 12; speed = Math.random() * 4 + 2; friction = 0.96; gravity = 0.03; decay = Math.random() * 0.003 + 0.003; angle = Math.random() * Math.PI * 2;
      this.hue = 335 + Math.random() * 15; this.brightness = 85 + Math.random() * 15;
    } else if (type === 'bloom-burst-outer') {
      coordinateCount = 4; speed = Math.random() * 8 + 6; friction = 0.92; gravity = 0.08; decay = 0.02; angle = Math.random() * Math.PI * 2;
      this.hue = 320 + Math.random() * 15;
    } else if (type === 'bloom-burst-inner') {
      coordinateCount = 2; speed = Math.random() * 15 + 15; friction = 0.94; gravity = 0.02; decay = 0.015; angle = Math.random() * Math.PI * 2;
      this.hue = 340 + Math.random() * 15;
    } else if (type === 'gold-spark') {
      coordinateCount = 3; speed = Math.random() * 4 + 2; friction = 0.9; gravity = 0.1; decay = 0.04; angle = Math.random() * Math.PI * 2;
      this.hue = 320 + Math.random() * 20;
    } else if (type === 'twin-stream') {
      coordinateCount = 8; speed = Math.random() * 12 + 10; friction = 0.97; gravity = 0.25; decay = 0.01;
    } else if (type === 'spiral') {
      /* 【新增】20261119：旋转风火，粒子一边飞一边绕中心转。 */
      coordinateCount = 10;
      speed = 6 + Math.random() * 9;
      friction = 0.976; gravity = 0.025; decay = 0.010 + Math.random() * 0.006;
      angle = Math.random() * Math.PI * 2;
      this.spin = (Math.random() < 0.5 ? -1 : 1) * (0.012 + Math.random() * 0.022);
    } else if (type === 'leaf-fall') {
      /* 【新增】20261119：秋叶飘落，横向摆动 + 缓慢下坠。 */
      coordinateCount = 6;
      speed = 1.5 + Math.random() * 3.2;
      friction = 0.986; gravity = 0.055; decay = 0.006 + Math.random() * 0.004;
      angle = Math.random() * Math.PI * 2;
      this.sway = Math.random() * Math.PI * 2;
      this.spin = (Math.random() < 0.5 ? -1 : 1) * (0.008 + Math.random() * 0.012);
    } else {
      speed = Math.random() * 12 + 3; friction = 0.94; gravity = 0.15; decay = Math.random() * 0.015 + 0.015; angle = Math.random() * Math.PI * 2;
    }

    this.coordinateCount = coordinateCount;
    while (this.coordinateCount--) { this.coordinates.push([this.x, this.y]); }
    
    this.speed = speed; this.friction = friction; this.gravity = gravity; this.decay = decay; this.angle = angle;

    if (type !== 'sakura-rain' && type !== 'bloom-burst-outer' && type !== 'bloom-burst-inner' && type !== 'willow' && type !== 'gold-spark' && type !== 'shape') {
      this.hue = hue + (Math.random() * 30 - 15); this.brightness = Math.random() * 30 + 70;
    }
    if (type === 'shape') {
      this.hue = hue;
      this.brightness = 85 + Math.random() * 15;
    }
    
    this.alpha = 1; this.isSpark = Math.random() > 0.8;
  }
  
  update(index) {
    this.coordinates.pop(); this.coordinates.unshift([this.x, this.y]); this.speed *= this.friction;
    if (this.spin) this.angle += this.spin;
    
    if (this.type === 'koi') {
      this.wave += 0.1;
      this.x += Math.cos(this.angle) * this.speed + Math.cos(this.wave) * 2;
      this.y += Math.sin(this.angle) * this.speed + Math.sin(this.wave) * 2 + this.gravity;
    } else if (this.type === 'leaf-fall') {
      this.sway += 0.045;
      this.x += Math.cos(this.angle) * this.speed + Math.sin(this.sway) * 1.8;
      this.y += Math.sin(this.angle) * this.speed + this.gravity;
    } else {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed + this.gravity;
    }
    
    this.alpha -= this.decay;
    if (this.alpha <= this.decay) { particles.splice(index, 1); }
  }
  
  draw() {
    if (this.type === 'leaf-fall') {
      fwCtx.save();
      fwCtx.translate(this.x, this.y);
      fwCtx.rotate(this.angle);
      fwCtx.fillStyle = `hsla(${this.hue}, 90%, ${this.brightness}%, ${this.alpha})`;
      fwCtx.beginPath();
      fwCtx.ellipse(0, 0, 4.2, 1.9, 0, 0, Math.PI * 2);
      fwCtx.fill();
      fwCtx.restore();
      return;
    }
    fwCtx.beginPath();
    fwCtx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    fwCtx.lineTo(this.x, this.y);
    
    if (this.isSpark && Math.random() > 0.6) {
      fwCtx.strokeStyle = `rgba(255, 245, 250, ${this.alpha})`;
      fwCtx.lineWidth = this.lineWidth;
    } else if (this.rgb) {
      /* 【新增】20261119：特殊烟花使用固定颜色，不跟随主题。 */
      fwCtx.strokeStyle = fireworkRgba(this.rgb, this.alpha);
      fwCtx.lineWidth = this.lineWidth;
    } else {
      fwCtx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
      if (this.type === 'bloom-burst-inner') fwCtx.lineWidth = 0.8;
      else if (this.type === 'sakura-rain' || this.type === 'twin-stream') fwCtx.lineWidth = 2.5;
      else fwCtx.lineWidth = (this.type === 'firecracker' || this.type === 'willow') ? 2 : 1.5;
    }
    fwCtx.stroke();
  }
}

/* 【新增】20261119：文字烟花改成“独立短光条”拼字。
   每条火花只画一小段线，不再使用 strokeText 字体描边；
   每条有随机方向、长度、出现时间和抖动，最后隐约组成文字。 */
class TextSpark {
  constructor(cx, cy, tx, ty, angle, len, hue, delay) {
    this.cx = cx; this.cy = cy;
    this.tx = tx; this.ty = ty;
    this.angle = angle; this.len = len;
    /* 【修改】20261119：之前亮度 96%～100% 太接近白色，彩虹色会被冲淡；
       现在降到 70%～84%，颜色才真正显出来，同时保持亮线观感。 */
    this.hue = hue; this.brightness = 70 + Math.random() * 14;
    this.start = performance.now() + delay;
    this.duration = 650 + Math.random() * 650;
    this.hold = 1000 + Math.random() * 500;
    this.fade = 650;
    this.alpha = 0;
    this.phase = 'wait';
    this.x = cx; this.y = cy;
    this.prevX = cx; this.prevY = cy;
  }
  update(index) {
    const now = performance.now();
    if (now < this.start) return;
    const elapsed = now - this.start;

    if (elapsed < this.duration) {
      this.phase = 'fly';
      const t = elapsed / this.duration;
      const ease = 1 - Math.pow(1 - t, 3);
      this.prevX = this.x; this.prevY = this.y;
      this.x = this.cx + (this.tx - this.cx) * ease;
      this.y = this.cy + (this.ty - this.cy) * ease;
      this.alpha = Math.min(1, t * 4);
    } else if (elapsed < this.duration + this.hold) {
      this.phase = 'hold';
      this.x = this.tx; this.y = this.ty;
      this.alpha = 1;
    } else {
      this.phase = 'fade';
      const f = (elapsed - this.duration - this.hold) / this.fade;
      this.alpha = Math.max(0, 1 - f);
      this.y -= 0.16;
      if (f >= 1) textSparks.splice(index, 1);
    }
  }
  draw() {
    if (this.alpha <= 0) return;
    const ctx = fwCtx;
    ctx.beginPath();
    if (this.phase === 'fly') {
      /* 飞向目标时是一条短拖尾，像普通烟花粒子。 */
      ctx.moveTo(this.prevX, this.prevY);
      ctx.lineTo(this.x, this.y);
      ctx.lineWidth = 1.35;
    } else {
      /* 到位后只保留一小段独立线，不连成字体轮廓。 */
      const dx = Math.cos(this.angle) * this.len * 0.5;
      const dy = Math.sin(this.angle) * this.len * 0.5;
      ctx.moveTo(this.x - dx, this.y - dy);
      ctx.lineTo(this.x + dx, this.y + dy);
      ctx.lineWidth = 1.6;
    }
    ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
    ctx.stroke();
  }
}

class Lantern {
  constructor(x, y) {
    this.x = x; this.y = y; this.size = 12 + Math.random() * 8;
    this.speed = 0.6 + Math.random() * 0.8; this.sway = Math.random() * Math.PI * 2;
    this.alpha = 1; this.decay = 0.001;
  }
  update(index) {
    this.sway += 0.02; this.y -= this.speed; this.x += Math.sin(this.sway) * 1.5; this.alpha -= this.decay;
    if (this.y < -50 || this.alpha <= 0) particles.splice(index, 1);
  }
  draw() {
    const w = this.size; const h = this.size * 1.2;
    fwCtx.beginPath();
    fwCtx.moveTo(this.x - w/2, this.y - h/2); fwCtx.lineTo(this.x + w/2, this.y - h/2);
    fwCtx.lineTo(this.x + w*0.35, this.y + h/2); fwCtx.lineTo(this.x - w*0.35, this.y + h/2);
    fwCtx.closePath();
    let grad = fwCtx.createLinearGradient(this.x, this.y - h/2, this.x, this.y + h/2);
    grad.addColorStop(0, `rgba(255, 100, 0, ${this.alpha * 0.8})`);
    grad.addColorStop(0.5, `rgba(255, 200, 50, ${this.alpha})`);
    grad.addColorStop(1, `rgba(255, 150, 0, ${this.alpha * 0.8})`);
    fwCtx.fillStyle = grad; fwCtx.fill();
    fwCtx.strokeStyle = `rgba(150, 50, 0, ${this.alpha})`; fwCtx.lineWidth = 2; fwCtx.stroke();
    fwCtx.beginPath(); fwCtx.arc(this.x, this.y + h/2, w * 0.2, 0, Math.PI * 2);
    fwCtx.fillStyle = `rgba(255, 255, 200, ${this.alpha})`; fwCtx.fill();
  }
}

/* 【新增】20261119：特殊烟花改成“普通烟花物理 + 定向速度”。
   形状只决定每个粒子的初始角度和速度，不再让粒子飞到固定坐标后停住；
   粒子依旧有随机速度扰动、摩擦、重力、拖尾线段、二次爆散和闪烁火花。 */
function createShapeFirework(cx, cy, type) {
  const style = SPECIAL_FIREWORK_STYLES[type];
  if (!style) return;
  /* 根据当前活跃粒子数动态收紧形状点数，避免多枚烟花叠加时爆量。 */
  const availablePoints = Math.max(80, MAX_ACTIVE_PARTICLES - particles.length - (style.bodyCount || 30) - 10);
  const points = capShapePoints(buildSpecialShapePoints(type, cx, cy), Math.min(MAX_SHAPE_POINTS, availablePoints));
  if (!points.length) return;

  const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

  // 1) 形状定向粒子：角度按图案点计算，速度带随机扰动，之后完全交给物理。
  points.forEach((p, i) => {
    const color = p.color || style.palette[i % style.palette.length];
    const angle = Math.atan2(p.y - centerY, p.x - centerX);
    const distance = Math.hypot(p.x - centerX, p.y - centerY);
    const particle = new Particle(centerX, centerY, 0, 'shape');

    particle.rgb = color;
    /* 【调整】20261119：中心点只保留几个低速驻留点，不再整片铺满。 */
    if (p.core) {
      particle.angle = Math.random() * Math.PI * 2;
      particle.speed = 0.10 + Math.random() * 0.30;
      particle.friction = 0.994;
      particle.gravity = 0;
      particle.decay = 0.0022 + Math.random() * 0.0012;
      particle.lineWidth = 1.2 + Math.random() * 0.5;
      particle.alpha = 0.72;
      particle.isSpark = false;
      particles.push(particle);
      return;
    }
    /* 【调整】20261119：角度扰动收小，保证爱心/星星/雪花轮廓能认出来；
       速度仍保留随机扰动，所以不会变成死板点阵。 */
    particle.angle = angle + (Math.random() - 0.5) * (style.jitter || 0.018);
    particle.speed = Math.max(1.8, distance / 24) * (0.94 + Math.random() * 0.12);
    particle.friction = 0.970 + Math.random() * 0.004;
    particle.gravity = 0.010 + Math.random() * 0.012;
    particle.decay = 0.0045 + Math.random() * 0.002;
    particle.lineWidth = style.size;
    particle.isSpark = Math.random() > 0.90;
    particles.push(particle);
  });

  // 2) 正常爆散的“体积层”：只补少量随机火花，不能盖住主图案。
  for (let i = 0; i < (style.bodyCount || 30); i++) {
    const particle = new Particle(centerX, centerY, 0, 'normal');
    particle.rgb = style.palette[i % style.palette.length];
    particle.speed = 1.5 + Math.random() * 6;
    particle.friction = 0.94;
    particle.gravity = 0.05 + Math.random() * 0.06;
    particle.decay = 0.014 + Math.random() * 0.008;
    particle.lineWidth = 0.9 + Math.random() * 0.4;
    particle.alpha = 0.58;
    particle.isSpark = Math.random() > 0.55;
    particles.push(particle);
  }

  // 3) 二次爆散：只有配置了 secondary 的类型才炸第二圈。
  if (style.secondary) {
    setTimeout(() => {
      if (document.hidden) return;
      for (let i = 0; i < 55; i++) {
        const particle = new Particle(centerX, centerY, 0, 'normal');
        particle.rgb = style.palette[i % style.palette.length];
        particle.speed = 4 + Math.random() * 11;
        particle.friction = 0.942;
        particle.gravity = 0.05 + Math.random() * 0.05;
        particle.decay = 0.010 + Math.random() * 0.008;
        particle.lineWidth = 0.9 + Math.random() * 0.4;
        particle.alpha = 0.75;
        particle.isSpark = Math.random() > 0.45;
        particles.push(particle);
      }
      glows.push({
        x: centerX, y: centerY, radius: 8,
        maxRadius: shapeRadius() * 1.1,
        alpha: 0.5, color: style.glow
      });
    }, 520);
  }

  glows.push({
    x: centerX,
    y: centerY,
    radius: 10,
    maxRadius: shapeRadius() * 1.35,
    alpha: 0.8,
    color: style.glow
  });
}

function createExplosion(x, y, hue, mode) {
  let count = 150;
  if (mode === 'willow') { count = 100; } 
  else if (mode === 'small-burst') { count = 20; } 
  else if (mode === 'sakura-rain') { count = 120; }
  else if (mode === 'bloom-burst-outer') { count = 180; }
  else if (mode === 'bloom-burst-inner') { count = 100; }
  else if (mode === 'gold-spark') { count = 15; }
  else if (mode === 'koi') { count = 80; }
  else if (mode === 'spiral') { count = 120; }
  else if (mode === 'leaf-fall') { count = 100; }

  while (count--) {
    if (mode === 'willow') particles.push(new Particle(x, y, 0, 'willow'));
    else if (mode === 'koi') particles.push(new Particle(x, y, hue, 'koi'));
    else if (mode === 'spiral') particles.push(new Particle(x, y, hue, 'spiral'));
    else if (mode === 'leaf-fall') particles.push(new Particle(x, y, 25, 'leaf-fall'));
    else if (mode === 'sakura-rain') particles.push(new Particle(x, y, 0, 'sakura-rain'));
    else if (mode === 'bloom-burst-outer') particles.push(new Particle(x, y, 0, 'bloom-burst-outer'));
    else if (mode === 'bloom-burst-inner') particles.push(new Particle(x, y, 0, 'bloom-burst-inner'));
    else if (mode === 'gold-spark') particles.push(new Particle(x, y, 0, 'gold-spark'));
    else particles.push(new Particle(x, y, hue, 'normal'));
  }
}

function createTwinStream(x, y) {
  for (let i = 0; i < 40; i++) {
    let pLeft = new Particle(x, y, 0, 'twin-stream');
    pLeft.angle = Math.PI * 0.75 + (Math.random() - 0.5) * 0.15; 
    pLeft.hue = 315 + Math.random() * 15;
    pLeft.brightness = 90;
    particles.push(pLeft);

    let pRight = new Particle(x, y, 0, 'twin-stream');
    pRight.angle = Math.PI * 0.25 + (Math.random() - 0.5) * 0.15;
    pRight.hue = 340 + Math.random() * 15;
    pRight.brightness = 90;
    particles.push(pRight);
  }
}

function createTextFirework(cx, cy) {
  /* 【修改】20261119：11 月、12 月放文字烟花时，年份自动显示为下一年。
     getMonth() 是 0 基：10 = 11 月，11 = 12 月。 */
  const now = new Date();
  const displayYear = now.getFullYear() + (now.getMonth() >= 10 ? 1 : 0);
  const text = _loadT('fireworks.newYear', { year: displayYear });

  /* 【修改】20261119：不再用 strokeText 字体描边。
     把文字先画到离屏画布，采集成一堆点，再让每个点变成一条独立短光条；
     光条从中心炸向目标，最后隐约拼出文字。 */
  const offCanvas = document.createElement('canvas');
  const offCtx = offCanvas.getContext('2d');
  const font = 'bold 64px "Microsoft YaHei", "Segoe UI", sans-serif';
  offCtx.font = font;
  const textWidth = offCtx.measureText(text).width;
  offCanvas.width = Math.ceil(textWidth + 40);
  offCanvas.height = 120;
  offCtx.font = font;
  offCtx.fillStyle = '#fff';
  offCtx.textAlign = 'center';
  offCtx.textBaseline = 'middle';
  offCtx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);

  const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
  const alphaAt = (x, y) => {
    if (x < 0 || y < 0 || x >= offCanvas.width || y >= offCanvas.height) return false;
    return imgData[(y * offCanvas.width + x) * 4 + 3] > 128;
  };

  const maxWidth = fwCanvas.width * 0.66;
  const scale = Math.min(2.2, Math.max(0.6, maxWidth / offCanvas.width));
  const drawWidth = offCanvas.width * scale;
  const minX = drawWidth / 2 + 18;
  const maxX = fwCanvas.width - drawWidth / 2 - 18;
  const drawX = maxX > minX ? Math.min(Math.max(cx, minX), maxX) : fwCanvas.width / 2;
  const drawY = cy;

  const points = [];
  /* 【修改】20261119：采样间隔从 4 改成 3，让文字轮廓上的点更密，
     再配合下面的 maxSparks 提高短光条数量，远看清楚一些。 */
  for (let y = 0; y < offCanvas.height; y += 3) {
    for (let x = 0; x < offCanvas.width; x += 3) {
      if (!alphaAt(x, y)) continue;
      const h = alphaAt(x - 4, y) || alphaAt(x + 4, y);
      const v = alphaAt(x, y - 4) || alphaAt(x, y + 4);
      let angle;
      if (h && !v) angle = 0;
      else if (v && !h) angle = Math.PI / 2;
      else angle = Math.random() * Math.PI;
      /* 加一点随机偏转，避免每条线都像字体轮廓一样规整。 */
      angle += (Math.random() - 0.5) * 0.7;
      points.push({ x, y, angle });
    }
  }

  /* 【修改】20261119：短光条数量再翻一倍；颜色按文字横向位置做彩虹渐变，
     每条再加一点随机色相偏移，不再是一种颜色。 */
  const maxSparks = 1560;
  const stride = Math.max(1, Math.ceil(points.length / maxSparks));
  for (let i = 0; i < points.length; i += stride) {
    const p = points[i];
    const tx = drawX + (p.x - offCanvas.width / 2) * scale + (Math.random() - 0.5) * 3;
    const ty = drawY + (p.y - offCanvas.height / 2) * scale + (Math.random() - 0.5) * 3;
    const hue = (p.x / offCanvas.width * 330 + 15 + Math.random() * 45) % 360;
    textSparks.push(new TextSpark(
      drawX, drawY, tx, ty,
      p.angle,
      3 + Math.random() * 4,
      hue,
      Math.random() * 700
    ));
  }

  glows.push({ x: drawX, y: drawY, radius: 10, maxRadius: 360, alpha: 0.85, color: '255, 210, 140' });
}

function launchGatling() {
  const x = Math.random() * (fwCanvas.width * 0.6) + fwCanvas.width * 0.2; const y = fwCanvas.height - 10;
  let burst = 0;
  const timer = setInterval(() => {
    if (window.isRpPlaying || document.hidden) { clearInterval(timer); return; }
    for(let i=0; i<8; i++) particles.push(new Particle(x, y, 45, 'firecracker'));
    if (++burst > 20) clearInterval(timer);
  }, 50);
}

function launchGroundFirecracker() {
  const x = Math.random() * fwCanvas.width; const y = fwCanvas.height - 10;
  for(let i=0; i<20; i++) {
    setTimeout(() => {
      if (!window.isRpPlaying && !document.hidden) particles.push(new Particle(x + (Math.random()-0.5)*30, y, 0, 'firecracker'));
    }, i * 25);
  }
}

function launchKongmingLanterns() {
  const count = Math.floor(Math.random() * 4) + 5;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      if (!window.isRpPlaying && !document.hidden) particles.push(new Lantern(Math.random() * fwCanvas.width * 0.8 + fwCanvas.width * 0.1, fwCanvas.height + Math.random() * 50));
    }, i * 200); 
  }
}

function loop() {
  requestAnimationFrame(loop);
  fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
  fwCtx.globalCompositeOperation = 'lighter';
  
  let g = glows.length;
  while (g--) {
    let glow = glows[g];
    glow.radius += (glow.maxRadius - glow.radius) * 0.05;
    glow.alpha -= 0.015;
    if (glow.alpha <= 0) { glows.splice(g, 1); continue; }
    let grad = fwCtx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.radius);
    grad.addColorStop(0, `rgba(${glow.color}, ${glow.alpha})`);
    grad.addColorStop(1, `rgba(${glow.color}, 0)`);
    fwCtx.fillStyle = grad; fwCtx.beginPath(); fwCtx.arc(glow.x, glow.y, glow.radius, 0, Math.PI*2); fwCtx.fill();
  }

  let j = particles.length;
  while (j--) { particles[j].draw(); particles[j].update(j); }
  /* 兜底：无论谁直接 push 粒子，活跃粒子都不会超过上限。 */
  if (particles.length > MAX_ACTIVE_PARTICLES) {
    particles.splice(0, particles.length - MAX_ACTIVE_PARTICLES);
  }

  /* 【新增】20261119：文字烟花是独立短光条，不进入粒子数组，因此不受上面的粒子上限影响。 */
  let t = textSparks.length;
  while (t--) { textSparks[t].update(t); textSparks[t].draw(); }

  let i = fireworks.length;
  while (i--) { fireworks[i].draw(); fireworks[i].update(i); }
}
loop();

window.launchFirework = function(startX, startY, forcedType = null) {
  if (document.hidden) return; 
  /* 【新增】20261119：Base 主题只保留主题外观，不发射任何烟花；Plus 起才放。 */
  if (!forcedType && themeTier(currentTheme) === 'base') return;
  /* 【新增】20261119：时段过滤 + 活跃粒子保险丝。 */
  if (!forcedType && !fireworkTimeAllowed()) return;
  if (!forcedType && particles.length >= MAX_ACTIVE_PARTICLES) return;
  
  let sx, sy, tx, ty, isBg = false;
  if (startX !== undefined) {
     sx = startX; sy = fwCanvas.height; tx = startX; ty = startY; 
  } else {
     isBg = true; tx = Math.random() * fwCanvas.width;
     const leftBound = fwCanvas.width * 0.25; const rightBound = fwCanvas.width * 0.75;
     if (tx > leftBound && tx < rightBound) ty = fwCanvas.height * 0.10 + Math.random() * (fwCanvas.height * 0.15);
     else ty = fwCanvas.height * 0.10 + Math.random() * (fwCanvas.height * 0.60);
     sx = tx; sy = fwCanvas.height;
  }
  
  let hue = Math.floor(Math.random() * 360);
  let type = forcedType || 'normal';
  
  let currentUsersDB = getUsersDB();
  let useThemeColor = (currentUser && currentUsersDB[currentUser] && currentUsersDB[currentUser].fwThemeColor !== false);

  if (currentTheme && !forcedType && useThemeColor) {
      const baseTheme = currentTheme.replace('-plus', '').replace('-max', '').replace('-ultimate', '');
      
      if (baseTheme === 'default') {
          const hues = [25, 30, 35, 40, 45]; hue = hues[Math.floor(Math.random() * hues.length)];
      } else if (baseTheme === 'gold') {
          const hues = [45, 50, 55, 60]; hue = hues[Math.floor(Math.random() * hues.length)];
      } else if (baseTheme === 'diamond') {
          const hues = [260, 280, 300, 200, 220]; hue = hues[Math.floor(Math.random() * hues.length)];
      } else if (baseTheme === 'sakura') {
          const hues = [320, 330, 340, 350]; hue = hues[Math.floor(Math.random() * hues.length)];
      } else if (baseTheme === 'cyber') {
          const hues = [180, 120, 300, 330]; hue = hues[Math.floor(Math.random() * hues.length)];
      } else if (baseTheme === 'aurora') {
          const hues = [150, 170, 280, 190]; hue = hues[Math.floor(Math.random() * hues.length)];
      } else if (baseTheme === 'flame') {
          const hues = [0, 10, 20, 30]; hue = hues[Math.floor(Math.random() * hues.length)];
      } else if (baseTheme === 'blackgold') {
          const hues = [40, 45, 50]; hue = hues[Math.floor(Math.random() * hues.length)];
      } else if (baseTheme === 'forest') {
          const hues = [90, 110, 130, 150]; hue = hues[Math.floor(Math.random() * hues.length)];
      } else if (baseTheme === 'ocean') {
          const hues = [190, 210, 230, 160]; hue = hues[Math.floor(Math.random() * hues.length)];
      } else if (baseTheme === 'food') {
          const hues = [15, 25, 35, 45, 10]; hue = hues[Math.floor(Math.random() * hues.length)];
      } else if (baseTheme === 'fruit') {
          const hues = [0, 90, 120, 60, 280]; hue = hues[Math.floor(Math.random() * hues.length)];
      } else if (baseTheme === 'flower') {
          const flowerHues = [320, 325, 330, 335, 340, 350, 355, 360]; 
          hue = flowerHues[Math.floor(Math.random() * flowerHues.length)];
          if (currentTheme === 'flower-max') {
              const r = Math.random();
              if (r < 0.15) type = 'sakura-rain';
              else if (r < 0.30) type = 'bloom-burst';
              else if (r < 0.45) type = 'twin-spark';
              else if (r < 0.60) type = 'koi';
              else if (r < 0.75) type = 'double';
              else if (r < 0.90) type = 'two-stage';
          } else if (currentTheme === 'flower-plus') {
              if (Math.random() < 0.4) type = 'willow';
          }
      } else if (baseTheme === 'spring') {
          const springHues = [0, 45, 330, 300, 15]; 
          hue = springHues[Math.floor(Math.random() * springHues.length)];
          if (currentTheme.includes('plus') || currentTheme.includes('max')) {
              const r = Math.random();
              if (r < 0.25) type = 'willow';
              else if (r < 0.45) type = 'double';
              else if (r < 0.65) type = 'two-stage';
              else if (r < 0.85) type = 'koi';
          }
      } else if (baseTheme === 'winter') {
          /* 【新增】20261119：冬季 Plus / Max / Ultimate 只放雪花烟花。 */
          if (currentTheme.includes('plus') || currentTheme.includes('max') || currentTheme.includes('ultimate')) {
              type = 'snowflake';
          }
      } else if (baseTheme === 'autumn') {
          /* 【新增】20261119：秋季暖金色系，普通烟花与秋季图案共用。 */
          const autumnHues = [18, 24, 30, 36, 42, 48];
          hue = autumnHues[Math.floor(Math.random() * autumnHues.length)];
      }
  } else if (currentTheme && !forcedType && !useThemeColor) {
      if (currentTheme.includes('max') || currentTheme.includes('plus') || currentTheme.includes('ultimate')) {
          const r = Math.random();
          if (currentTheme.includes('flower')) {
              if (r < 0.15) type = 'sakura-rain';
              else if (r < 0.30) type = 'bloom-burst';
              else if (r < 0.45) type = 'twin-spark';
              else if (r < 0.60) type = 'koi';
          } else if (isSpringFestivalTheme(currentTheme)) {
              if (r < 0.25) type = 'willow';
              else if (r < 0.45) type = 'double';
              else if (r < 0.65) type = 'two-stage';
              else if (r < 0.85) type = 'koi';
          } else if (currentTheme.includes('winter')) {
              /* 【新增】20261119：关闭“跟随主题色”时，冬季 Plus+ 仍然是雪花烟花。 */
              type = 'snowflake';
          }
      }
  }

  // 【新增】20261119：即使主题色分支没命中，也强制冬季 Plus+ 使用雪花烟花。
  if (!forcedType && currentTheme && /^winter-(plus|max|ultimate)$/.test(currentTheme)) {
      type = 'snowflake';
  }

  /* 【新增】20261119：普通烟花也使用主题专属色相。
     特殊烟花保持自己的固定配色，普通烟花用 THEME_FIREWORK_HUES。 */
  if (!forcedType && useThemeColor) {
      const themeHues = themeFireworkHues(currentTheme);
      if (themeHues.length) {
          hue = themeHues[Math.floor(Math.random() * themeHues.length)];
      }
  }

  // 【新增】20261119：主题专属特殊烟花 + 旧版物理烟花 + 普通烟花混合发射。
  // 旧版柳火 / 双爆 / 二段爆 / 锦鲤 / 旋转等按约 45% 保留；
  // 特殊图案按约 43% 抽取；普通烟花只保留约 12%。
  if (!forcedType) {
      const mappedTypes = themeSpecialFireworkTypes(currentTheme);
      const legacyTypes = themeLegacyFireworkTypes(currentTheme);
      if (legacyTypes.length && Math.random() < 0.45) {
          type = pickThemeLegacyFirework(currentTheme) || type;
      } else if (mappedTypes.length) {
          if (Math.random() < 0.78) {
              type = pickThemeSpecialFirework(currentTheme) || type;
          } else {
              type = 'normal';
          }
      } else if (legacyTypes.length && Math.random() < 0.7) {
          type = pickThemeLegacyFirework(currentTheme) || type;
      }
  }

  fireworks.push(new Firework(sx, sy, tx, ty, hue, isBg, type));
};

/* 【新增】特殊烟花手动入口，便于主题/调试直接指定类型。
   例：launchSpecialFirework('heart')
   支持：heart / star / snowflake / rainbow / galaxy / saturn / diamond */
window.SPECIAL_FIREWORK_TYPES = SPECIAL_FIREWORK_TYPES.slice();
window.launchSpecialFirework = function(type, startX, startY) {
  if (!SPECIAL_FIREWORK_STYLES[type]) return false;
  if (typeof startX === 'number' && typeof startY === 'number') {
    window.launchFirework(startX, startY, type);
  } else {
    window.launchFirework(undefined, undefined, type);
  }
  return true;
};

setTimeout(() => {
    if (isSpringFestivalTheme(currentTheme) && fireworkTimeAllowed() && !document.hidden) {
        fireworks.push(new Firework(fwCanvas.width * 0.5, fwCanvas.height, fwCanvas.width * 0.5, fwCanvas.height * 0.2, 45, false, 'text'));
    }
}, 2000);

setInterval(() => {
  if (document.hidden || window.isRpPlaying) return;
  
  let currentUsersDB = getUsersDB();
  let freqMult = (currentUser && currentUsersDB[currentUser] && currentUsersDB[currentUser].fwFreq) ? currentUsersDB[currentUser].fwFreq : 1.0;

  const isSpring = currentTheme && /^spring-(plus|max)$/.test(currentTheme);
  const isFlowerPlus = currentTheme === 'flower-plus';
  const isFlowerMax = currentTheme === 'flower-max';
  const isOtherPlus = currentTheme && currentTheme.includes('-plus') && !isFlowerPlus;
  const isOtherMax = currentTheme && currentTheme.includes('-max') && !isFlowerMax;
  const isOtherUltimate = currentTheme && currentTheme.includes('-ultimate');
  const specialTypes = themeSpecialFireworkTypes(currentTheme);
  const hasSpecialTheme = specialTypes.length > 0;

  /* 【新增】20261119：有专属特殊烟花的主题（包括没有 Plus 后缀的基础版），
     也要进入发射循环；否则樱花漫舞基础版永远不会放爱心。 */
  if (isSpring || hasSpecialTheme || isOtherPlus || isFlowerPlus || isFlowerMax || isOtherMax || isOtherUltimate) {
    let baseFreq = 1;
    if (isOtherPlus || isFlowerPlus) baseFreq = 3;
    else if (isOtherMax || isFlowerMax || isOtherUltimate) baseFreq = 5;
    else if (hasSpecialTheme) baseFreq = 2;

    let finalFreq = Math.max(1, Math.floor(baseFreq * freqMult));
    /* 【新增】20261119：频率上限放宽到 25，但单轮最多 24 发，
       避免用户拉到 25 时瞬间生成上百个 Firework 导致掉帧。 */
    finalFreq = Math.min(24, finalFreq);

    for(let i=0; i<finalFreq; i++) {
      setTimeout(() => { 
        if (!window.isRpPlaying && !document.hidden) window.launchFirework(); 
      }, Math.random() * 1000);
    }

    if (isSpring) {
      if (Math.random() < 0.4) launchGroundFirecracker();
      if (currentTheme.includes('spring-plus') || currentTheme.includes('spring-max')) {
        if (Math.random() < 0.3) launchGatling();
        if (Math.random() < 0.4) launchKongmingLanterns(); 
      }
    }
  }
}, 1000);

setInterval(() => {
  if (isSpringFestivalTheme(currentTheme) && fireworkTimeAllowed() && !window.isRpPlaying && !document.hidden) {
    fireworks.push(new Firework(fwCanvas.width * 0.5, fwCanvas.height, fwCanvas.width * 0.5, fwCanvas.height * 0.2, 45, false, 'text'));
  }
}, 10000);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    fireworks.length = 0; particles.length = 0; glows.length = 0;
  }
});