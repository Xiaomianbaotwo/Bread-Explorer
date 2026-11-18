/* =========================================================
   20-theme-home-text.js
   【统一版】20261119：18 个主题系列的问候语 / 心情短句
   - 每个时段独立成组，不是六个时段合计。
   - 每个系列按自己的 counts 生成；同一系列 Base / Plus / Max / Ultimate 共用。
   - 这是主题词库的唯一文件；通用词库仍在 19-home-text.js。
   ========================================================= */
(function buildThemeHomeTextUnified() {
  const periods = ['night', 'morning', 'forenoon', 'noon', 'afternoon', 'evening'];

  const timePrefix = {
  "zh": {
    "greet": {
      "night": [
        "夜深了，",
        "这个安静的夜里，"
      ],
      "morning": [
        "早安，",
        "清晨的光落下来，"
      ],
      "forenoon": [
        "上午好，",
        "忙了一阵，"
      ],
      "noon": [
        "午安，",
        "中午到了，"
      ],
      "afternoon": [
        "下午好，",
        "阳光斜下来，"
      ],
      "evening": [
        "晚上好，",
        "天色暗下来，"
      ]
    },
    "quote": {
      "night": [
        "夜里安静下来，",
        "一天快收尾的时候，"
      ],
      "morning": [
        "清晨还没完全亮起来，",
        "新的一天刚开头，"
      ],
      "forenoon": [
        "上午安静下来，",
        "忙里偷闲的时候，"
      ],
      "noon": [
        "午饭过后，",
        "中午安静下来，"
      ],
      "afternoon": [
        "下午的光慢下来，",
        "忙到一半的时候，"
      ],
      "evening": [
        "天色暗下来，",
        "一天快结束的时候，"
      ]
    }
  },
  "en": {
    "greet": {
      "night": [
        "Late at night,",
        "In this quiet night,"
      ],
      "morning": [
        "Good morning,",
        "Morning light falls,"
      ],
      "forenoon": [
        "Good forenoon,",
        "After a stretch of work,"
      ],
      "noon": [
        "Good noon,",
        "Noon has arrived,"
      ],
      "afternoon": [
        "Good afternoon,",
        "The sunlight slants down,"
      ],
      "evening": [
        "Good evening,",
        "The sky darkens,"
      ]
    },
    "quote": {
      "night": [
        "The night quiets down,",
        "As the day closes,"
      ],
      "morning": [
        "Before the morning is fully bright,",
        "A new day has just begun,"
      ],
      "forenoon": [
        "The morning quiets down,",
        "In a short break from work,"
      ],
      "noon": [
        "After lunch,",
        "At the quiet noon,"
      ],
      "afternoon": [
        "The afternoon light slows,",
        "Halfway through the work,"
      ],
      "evening": [
        "The sky darkens,",
        "As the day ends,"
      ]
    }
  }
};

  const seriesData = {
  "default": {
    "counts": {
      "greet": 50,
      "quote": 50
    },
    "zh": {
      "greetScenes": {
        "night": [
          "面包房已经打烊，",
          "最后一盘面包放凉了，",
          "烤箱的灯刚熄，",
          "操作台上还留着一层薄粉，",
          "装面包的纸袋叠在角落，"
        ],
        "morning": [
          "第一炉面包刚出炉，",
          "烤箱开始预热，",
          "面团在案板上醒着，",
          "清晨的麦香飘到门口，",
          "面包架还空着一半，"
        ],
        "forenoon": [
          "第二炉面包正在烤，",
          "柜台前刚送走一位客人，",
          "面包篮里添了新的一批，",
          "咖啡和麦香混在一起，",
          "烤盘上的黄油刚化开，"
        ],
        "noon": [
          "午饭时间，面包房稍微安静下来，",
          "柜台后的椅子还空着，",
          "刚出炉的吐司放在架子上，",
          "中午的光落在面包篮上，",
          "纸袋里还剩最后一块可颂，"
        ],
        "afternoon": [
          "下午的面包卖了一半，",
          "烤箱里又推进一盘，",
          "窗边的座位有人坐着，",
          "面包刀刚切过一条法棍，",
          "空气里有一点甜味，"
        ],
        "evening": [
          "最后一炉面包快好了，",
          "店里的灯比外面暖，",
          "面包架只剩下几袋，",
          "晚饭的香气和麦香混在一起，",
          "打烊前，烤箱还亮着，"
        ]
      },
      "quoteScenes": {
        "night": [
          "烤盘泡在水池里。",
          "案板上还留着一层薄粉。",
          "面包刀放在盘子边。",
          "厨房的灯还亮着。",
          "最后一炉面包刚出炉。"
        ],
        "morning": [
          "烤箱刚预热。",
          "面团在盆里醒着。",
          "面包架还空着一半。",
          "第一炉面包的香气到了门口。",
          "纸袋叠在柜台边。"
        ],
        "forenoon": [
          "第二炉面包进了烤箱。",
          "柜台上的面包篮刚添满。",
          "一杯咖啡放在窗边。",
          "烤盘上的黄油化了。",
          "面包刀刚切过吐司。"
        ],
        "noon": [
          "午饭后的面包房安静下来。",
          "吐司放在架子上放凉。",
          "面包篮里剩下一半。",
          "中午的光落在柜台上。",
          "纸袋里还有一块可颂。"
        ],
        "afternoon": [
          "下午的面包卖了一半。",
          "烤箱里又推进一盘。",
          "窗边有人慢慢吃着面包。",
          "法棍切好放在案板上。",
          "空气里有一点甜味。"
        ],
        "evening": [
          "最后一炉面包快好了。",
          "店里的灯比外面暖。",
          "面包架只剩下几袋。",
          "晚饭的香气飘进店里。",
          "打烊前，烤箱还亮着。"
        ]
      },
      "greetTails": [
        "愿刚出炉的麦香，替你把今天的疲惫放轻 🍞",
        "记得给自己留一口热面包和一点好心情 🥐",
        "愿你的日子像面团一样，慢慢发酵成喜欢的样子 🌾",
        "不管今天多忙，都别忘了好好吃饭 🥛",
        "愿烤箱的暖意，一直留在你身边 🧈",
        "愿今天的你，被一块松软的面包接住 🍞",
        "愿你有黄油般的柔光，也有脆壳般的好运 🧈",
        "愿麦香经过的地方，都留下一点安心 🌾",
        "今天就按自己的节奏，慢慢烤熟 🌡️",
        "愿你的胃口和心情，都刚刚好 🥐"
      ],
      "quoteTails": [
        "面包要慢慢发酵，日子也可以慢慢来。",
        "烤箱还温着，生活就还有下一炉香气。",
        "今天再普通，也值得配一块喜欢的面包。",
        "麦香不会说话，却能把人轻轻接住。",
        "把今天揉进面团里，明天会烤出新的形状。",
        "面团醒一醒，人也可以歇一歇。",
        "一片面包的幸福，不用很大。",
        "生活有时像面包，外面脆，里面软。",
        "慢慢烤，慢慢等，香味总会出来。",
        "今天烤得怎么样，明天再调整。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "the bakery has closed,",
          "the last tray of bread has cooled,",
          "the oven light has just gone out,",
          "a thin layer of flour remains on the counter,",
          "paper bags are stacked in the corner,"
        ],
        "morning": [
          "the first batch of bread has just come out,",
          "the oven is warming up,",
          "dough is resting on the counter,",
          "the morning bread scent reaches the door,",
          "the bread rack is still half empty,"
        ],
        "forenoon": [
          "the second batch is baking,",
          "a customer has just left the counter,",
          "the bread basket has been refilled,",
          "coffee and wheat scent mix in the air,",
          "the butter on the tray has just melted,"
        ],
        "noon": [
          "the bakery quiets down at lunch,",
          "the chair behind the counter is empty,",
          "fresh toast sits on the rack,",
          "the noon light falls on the bread basket,",
          "one last croissant is left in the paper bag,"
        ],
        "afternoon": [
          "half the afternoon bread is sold,",
          "another tray goes into the oven,",
          "someone is sitting by the window,",
          "the bread knife has just cut a baguette,",
          "there is a little sweetness in the air,"
        ],
        "evening": [
          "the last batch is almost ready,",
          "the shop light is warmer than the street,",
          "only a few bags are left on the rack,",
          "dinner scent and bread scent mix,",
          "before closing, the oven is still on,"
        ]
      },
      "quoteScenes": {
        "night": [
          "A tray is soaking in the sink.",
          "A thin layer of flour remains on the counter.",
          "The bread knife rests beside the plate.",
          "The kitchen light is still on.",
          "The last batch has just come out."
        ],
        "morning": [
          "The oven has just warmed up.",
          "Dough is resting in the bowl.",
          "The bread rack is still half empty.",
          "The first batch’s scent has reached the door.",
          "Paper bags are stacked by the counter."
        ],
        "forenoon": [
          "The second batch is in the oven.",
          "The bread basket has just been filled.",
          "A cup of coffee sits by the window.",
          "The butter on the tray has melted.",
          "The bread knife has just cut the toast."
        ],
        "noon": [
          "The bakery quiets down after lunch.",
          "Toast cools on the rack.",
          "Half the bread basket is left.",
          "The noon light falls on the counter.",
          "One croissant remains in the paper bag."
        ],
        "afternoon": [
          "Half the afternoon bread is sold.",
          "Another tray goes into the oven.",
          "Someone by the window is eating bread slowly.",
          "The baguette is cut on the board.",
          "There is a little sweetness in the air."
        ],
        "evening": [
          "The last batch is almost ready.",
          "The shop light is warmer than the street.",
          "Only a few bags are left on the rack.",
          "Dinner scent drifts into the shop.",
          "Before closing, the oven is still on."
        ]
      },
      "greetTails": [
        "may the scent of fresh bread soften today’s tiredness 🍞",
        "save yourself a warm loaf and a little good mood 🥐",
        "may your days rise slowly like dough, into the shape you like 🌾",
        "no matter how busy today is, do not forget to eat well 🥛",
        "may the warmth of the oven stay with you 🧈",
        "may you be caught by a soft loaf today 🍞",
        "may you have butter-soft light and crisp-shell luck 🧈",
        "may every place the wheat scent passes keep a little calm 🌾",
        "today, bake slowly at your own pace 🌡️",
        "may your appetite and mood both be just right 🥐"
      ],
      "quoteTails": [
        "Bread needs time to rise; so do days.",
        "The oven is still warm, so life has another batch of scent.",
        "Even an ordinary day deserves a loaf you like.",
        "Wheat scent cannot speak, but it can catch you gently.",
        "Knead today into the dough; tomorrow will bake a new shape.",
        "Let the dough rest; you can rest too.",
        "The happiness of one slice of bread does not have to be big.",
        "Life is sometimes like bread: crisp outside, soft inside.",
        "Bake slowly, wait slowly; the scent will come.",
        "However today baked, adjust tomorrow."
      ]
    }
  },
  "spring": {
    "counts": {
      "greet": 30,
      "quote": 30
    },
    "zh": {
      "greetScenes": {
        "night": [
          "红灯笼还亮在门口，",
          "年夜饭的碗筷刚收，",
          "窗外的鞭炮声远了，",
          "春联在灯下红得发亮，",
          "桌上的橘子还剩几个，"
        ],
        "morning": [
          "新年的第一缕光落在春联上，",
          "锅里还温着昨天的年糕，",
          "门口的红纸被风吹得轻轻响，",
          "拜年的消息一条条进来，",
          "家里的人还没都起床，"
        ],
        "forenoon": [
          "拜年的客人刚走，",
          "桌上的瓜子壳堆了一小堆，",
          "红灯笼在白天也亮着，",
          "厨房里开始准备下一顿饭，",
          "春联上的金粉在阳光里闪，"
        ],
        "noon": [
          "新年的午饭摆满一桌，",
          "团圆饭的热气还没散，",
          "橘子皮放在桌角，",
          "窗外的鞭炮又响了一阵，",
          "大家围坐着，碗里都是热的，"
        ],
        "afternoon": [
          "拜完年，屋里安静下来，",
          "茶几上还放着糖果，",
          "红灯笼的影子落在地上，",
          "新年的阳光照进客厅，",
          "有人开始收拾碗筷，"
        ],
        "evening": [
          "新年的灯一盏盏亮起来，",
          "晚饭的香气从厨房飘出，",
          "窗外的烟花偶尔响一声，",
          "红纸在夜里格外显眼，",
          "一家人又围坐在桌边，"
        ]
      },
      "quoteScenes": {
        "night": [
          "红灯笼在门口亮着。",
          "年夜饭的碗筷已经收好。",
          "窗外的鞭炮声远了。",
          "春联在灯下红得发亮。",
          "桌上的橘子还剩几个。"
        ],
        "morning": [
          "新年的第一缕光落在春联上。",
          "锅里的年糕还温着。",
          "门口的红纸被风吹响。",
          "拜年的消息一条条进来。",
          "家里的人还没都起床。"
        ],
        "forenoon": [
          "拜年的客人刚走。",
          "桌上的瓜子壳堆了一小堆。",
          "红灯笼在白天也亮着。",
          "厨房开始准备下一顿饭。",
          "春联上的金粉在阳光里闪。"
        ],
        "noon": [
          "新年的午饭摆满一桌。",
          "团圆饭的热气还没散。",
          "橘子皮放在桌角。",
          "窗外的鞭炮又响了一阵。",
          "大家围坐着，碗里都是热的。"
        ],
        "afternoon": [
          "拜完年，屋里安静下来。",
          "茶几上还放着糖果。",
          "红灯笼的影子落在地上。",
          "新年的阳光照进客厅。",
          "有人开始收拾碗筷。"
        ],
        "evening": [
          "新年的灯一盏盏亮起来。",
          "晚饭的香气从厨房飘出。",
          "窗外的烟花偶尔响一声。",
          "红纸在夜里格外显眼。",
          "一家人又围坐在桌边。"
        ]
      },
      "greetTails": [
        "愿新年的红灯笼，替你把好运一盏盏点亮 🏮",
        "愿你有热腾腾的团圆饭，也有说不完的好消息 🥟",
        "新的一年，愿你想做的事都顺顺利利 🧧",
        "愿爆竹声把旧年的烦恼都送远 🧨",
        "愿橘子甜、年糕香，日子一年比一年好 🍊",
        "愿家门口的春联，替你写下新年的好兆头 🧧",
        "愿你在新的一年里，走到哪里都有人惦记 🏮",
        "愿新年的第一声问候，先落在你身上 🥟",
        "愿旧年的疲惫留在门外，新年的喜气进门 🧨",
        "愿团圆桌上，永远有你的位置 🍊"
      ],
      "quoteTails": [
        "年味就有了形状。",
        "新的一年慢慢展开。",
        "回家的路就不远了。",
        "旧年的疲惫被留在门外。",
        "日子又有了新的盼头。",
        "团圆就有了理由。",
        "祝福一开口，年就到了。",
        "红火不必喧闹，暖就够了。",
        "新年的第一件事，是好好吃饭。",
        "旧岁已过，春天正在来。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "the red lanterns are still lit at the door,",
          "the reunion dinner dishes have just been cleared,",
          "the firecrackers outside have faded,",
          "the couplets glow red under the lamp,",
          "a few tangerines remain on the table,"
        ],
        "morning": [
          "the first light of the new year falls on the couplets,",
          "last night’s rice cakes are still warm in the pot,",
          "the red paper at the door rustles in the wind,",
          "new-year messages keep arriving,",
          "not everyone in the house is awake yet,"
        ],
        "forenoon": [
          "the New Year visitors have just left,",
          "a small pile of sunflower seeds sits on the table,",
          "the red lanterns are lit even in daylight,",
          "the kitchen is preparing the next meal,",
          "gold dust on the couplets shines in the sun,"
        ],
        "noon": [
          "the New Year lunch fills the table,",
          "the steam of the reunion meal has not gone,",
          "tangerine peel sits at the corner of the table,",
          "firecrackers sound outside again,",
          "everyone is seated with warm bowls,"
        ],
        "afternoon": [
          "after the visits, the house quiets down,",
          "candy is still on the tea table,",
          "the shadow of the red lantern falls on the floor,",
          "new-year sunlight enters the living room,",
          "someone starts clearing the dishes,"
        ],
        "evening": [
          "the New Year lamps come on one by one,",
          "dinner scent drifts from the kitchen,",
          "fireworks sound outside now and then,",
          "the red paper stands out in the dark,",
          "the family sits around the table again,"
        ]
      },
      "quoteScenes": {
        "night": [
          "The red lanterns are lit at the door.",
          "The reunion dinner dishes are cleared.",
          "The firecrackers outside have faded.",
          "The couplets glow red under the lamp.",
          "A few tangerines remain on the table."
        ],
        "morning": [
          "The first light of the new year falls on the couplets.",
          "The rice cakes in the pot are still warm.",
          "The red paper at the door rustles in the wind.",
          "New-year messages keep arriving.",
          "Not everyone in the house is awake yet."
        ],
        "forenoon": [
          "The New Year visitors have just left.",
          "A small pile of sunflower seeds sits on the table.",
          "The red lanterns are lit even in daylight.",
          "The kitchen is preparing the next meal.",
          "Gold dust on the couplets shines in the sun."
        ],
        "noon": [
          "The New Year lunch fills the table.",
          "The steam of the reunion meal has not gone.",
          "Tangerine peel sits at the corner of the table.",
          "Firecrackers sound outside again.",
          "Everyone is seated with warm bowls."
        ],
        "afternoon": [
          "After the visits, the house quiets down.",
          "Candy is still on the tea table.",
          "The shadow of the red lantern falls on the floor.",
          "New-year sunlight enters the living room.",
          "Someone starts clearing the dishes."
        ],
        "evening": [
          "The New Year lamps come on one by one.",
          "Dinner scent drifts from the kitchen.",
          "Fireworks sound outside now and then.",
          "The red paper stands out in the dark.",
          "The family sits around the table again."
        ]
      },
      "greetTails": [
        "may the red lanterns of the new year light up your good luck one by one 🏮",
        "may you have a warm reunion meal and endless good news 🥟",
        "in the new year, may everything you want to do go smoothly 🧧",
        "may the firecrackers send last year’s worries far away 🧨",
        "may tangerines be sweet, rice cakes fragrant, and each year better than the last 🍊",
        "may the couplets at your door write a good omen for the new year 🧧",
        "wherever you go in the new year, may someone keep you in mind 🏮",
        "may the first greeting of the new year land on you 🥟",
        "may last year’s tiredness stay outside and the new year’s joy come in 🧨",
        "may there always be a place for you at the reunion table 🍊"
      ],
      "quoteTails": [
        "the new year takes shape.",
        "the new year unfolds slowly.",
        "the way home is not far.",
        "last year’s tiredness stays outside the door.",
        "the days have a new hope again.",
        "reunion has a reason.",
        "once the blessing is spoken, the new year arrives.",
        "prosperity does not have to be loud; warmth is enough.",
        "the first thing in the new year is to eat well.",
        "the old year has passed; spring is on its way."
      ]
    }
  },
  "food": {
    "zh": {
      "greetScenes": {
        "night": [
          "厨房的灯还亮着，",
          "晚饭的碗筷刚收，",
          "锅里还温着一碗汤，",
          "餐桌上留着一点饭香，",
          "冰箱的灯在夜里亮着，"
        ],
        "morning": [
          "早餐刚端上桌，",
          "煎锅里的鸡蛋刚熟，",
          "烤箱里的面包片跳了起来，",
          "厨房里有饭香，",
          "桌上摆着热牛奶，"
        ],
        "forenoon": [
          "厨房里开始准备午饭，",
          "砧板上的菜刚切好，",
          "锅里的汤慢慢炖着，",
          "饭盒放在桌边，",
          "空气里有一点酱香，"
        ],
        "noon": [
          "午饭摆满一桌，",
          "碗里的汤还冒着热气，",
          "筷子刚放下，",
          "饭后水果放在桌边，",
          "中午的厨房安静了一点，"
        ],
        "afternoon": [
          "下午的点心刚出炉，",
          "桌上的茶和糕点摆在一起，",
          "厨房里飘着甜味，",
          "有人翻开菜单，",
          "锅里的水刚烧开，"
        ],
        "evening": [
          "晚饭的香气从厨房出来，",
          "一家人围坐在桌边，",
          "碗筷摆好，",
          "汤锅还在咕嘟，",
          "餐厅的灯亮起来，"
        ]
      },
      "quoteScenes": {
        "night": [
          "厨房的灯还亮着。",
          "晚饭的碗筷收好了。",
          "锅里温着一碗汤。",
          "餐桌上留着一点饭香。",
          "冰箱的灯在夜里亮着。"
        ],
        "morning": [
          "早餐刚端上桌。",
          "煎锅里的鸡蛋刚熟。",
          "烤箱里的面包片跳了起来。",
          "清晨的厨房有饭香。",
          "桌上摆着热牛奶。"
        ],
        "forenoon": [
          "厨房里准备午饭。",
          "砧板上的菜刚切好。",
          "锅里的汤慢慢炖着。",
          "饭盒放在桌边。",
          "空气里有一点酱香。"
        ],
        "noon": [
          "午饭摆满一桌。",
          "碗里的汤还冒着热气。",
          "筷子刚放下。",
          "饭后水果放在桌边。",
          "中午的厨房安静了一点。"
        ],
        "afternoon": [
          "下午的点心刚出炉。",
          "桌上的茶和糕点摆在一起。",
          "厨房里飘着甜味。",
          "有人翻开菜单。",
          "锅里的水刚烧开。"
        ],
        "evening": [
          "晚饭的香气从厨房出来。",
          "一家人围坐在桌边。",
          "碗筷摆好。",
          "汤锅还在咕嘟。",
          "餐厅的灯亮起来。"
        ]
      },
      "greetTails": [
        "愿今天的每一口，都热乎又合胃口 🍲",
        "记得好好吃饭，别让忙碌饿着自己 🍚",
        "愿你的餐桌上有喜欢的菜，也有想见的人 🍽️",
        "今天的味道，希望正好是你喜欢的 🍜",
        "愿一顿好饭，把疲惫慢慢熨平 🥢",
        "愿你有汤有菜，也有坐下来吃饭的时间 🍲",
        "愿今天的甜品，给生活加一点甜 🍰",
        "愿厨房里的香气，替你把心情调好 🍳",
        "愿你不必赶时间，可以慢慢吃完这顿饭 🥣",
        "愿今天的胃口和日子，都有滋有味 🌶️"
      ],
      "quoteTails": [
        "一顿饭的热气，就是生活最实在的样子。",
        "好吃的东西不用多，合胃口就好。",
        "厨房里有火，日子就有温度。",
        "慢慢吃，才尝得出今天的味道。",
        "餐桌上的灯，比什么安慰都管用。",
        "饭菜不必丰盛，热乎就够了。",
        "甜点是给辛苦一天的奖励。",
        "一碗汤，能把人从疲惫里捞出来。",
        "今天的味道，会留在明天的记忆里。",
        "好好吃饭，是对自己最直接的照顾。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "the kitchen light is still on,",
          "the dinner dishes have just been cleared,",
          "a bowl of soup is still warm on the stove,",
          "a little food scent remains at the table,",
          "the fridge light is on in the dark,"
        ],
        "morning": [
          "breakfast has just been put on the table,",
          "the egg in the pan has just set,",
          "the bread in the toaster has just popped up,",
          "the kitchen smells of food,",
          "warm milk sits on the table,"
        ],
        "forenoon": [
          "the kitchen is starting lunch,",
          "the vegetables are just cut on the board,",
          "soup is simmering on the stove,",
          "a lunch box sits by the table,",
          "there is a little sauce aroma in the air,"
        ],
        "noon": [
          "lunch fills the table,",
          "the soup in the bowl is still steaming,",
          "the chopsticks have just been set down,",
          "fruit sits by the table after the meal,",
          "the kitchen quiets down at noon,"
        ],
        "afternoon": [
          "the afternoon snacks have just come out,",
          "tea and cakes sit together on the table,",
          "a sweet scent drifts from the kitchen,",
          "someone opens the menu,",
          "the water in the pot has just boiled,"
        ],
        "evening": [
          "dinner scent comes from the kitchen,",
          "the family sits around the table,",
          "the bowls and chopsticks are set,",
          "the soup pot is still bubbling,",
          "the dining-room light is on,"
        ]
      },
      "quoteScenes": {
        "night": [
          "The kitchen light is still on.",
          "The dinner dishes are cleared.",
          "A bowl of soup is warm on the stove.",
          "A little food scent remains at the table.",
          "The fridge light is on in the dark."
        ],
        "morning": [
          "Breakfast has just been put on the table.",
          "The egg in the pan has just set.",
          "The bread in the toaster has just popped up.",
          "The morning kitchen smells of food.",
          "Warm milk sits on the table."
        ],
        "forenoon": [
          "The kitchen is starting lunch.",
          "The vegetables are just cut on the board.",
          "Soup is simmering on the stove.",
          "A lunch box sits by the table.",
          "There is a little sauce aroma in the air."
        ],
        "noon": [
          "Lunch fills the table.",
          "The soup in the bowl is still steaming.",
          "The chopsticks have just been set down.",
          "Fruit sits by the table after the meal.",
          "The kitchen quiets down at noon."
        ],
        "afternoon": [
          "The afternoon snacks have just come out.",
          "Tea and cakes sit together on the table.",
          "A sweet scent drifts from the kitchen.",
          "Someone opens the menu.",
          "The water in the pot has just boiled."
        ],
        "evening": [
          "Dinner scent comes from the kitchen.",
          "The family sits around the table.",
          "The bowls and chopsticks are set.",
          "The soup pot is still bubbling.",
          "The dining-room light is on."
        ]
      },
      "greetTails": [
        "may every bite today be warm and just right 🍲",
        "remember to eat well; do not let busyness starve you 🍚",
        "may your table have food you like and people you miss 🍽️",
        "may today’s flavor be exactly the one you love 🍜",
        "may a good meal slowly smooth out your tiredness 🥢",
        "may you have soup, dishes, and time to sit down and eat 🍲",
        "may today’s dessert add a little sweetness to life 🍰",
        "may the scent of the kitchen lift your mood 🍳",
        "may you not have to rush and can finish this meal slowly 🥣",
        "may your appetite and your day both be full of flavor 🌶️"
      ],
      "quoteTails": [
        "The steam of a meal is life at its most solid.",
        "Good food does not need to be much; it just needs to suit you.",
        "When the kitchen has fire, life has warmth.",
        "Eat slowly, and you can taste today.",
        "The lamp over the table comforts more than any words.",
        "A meal does not have to be lavish; warm is enough.",
        "Dessert is a reward for a hard day.",
        "A bowl of soup can pull a person out of tiredness.",
        "Today’s flavor will stay in tomorrow’s memory.",
        "Eating well is the most direct way to care for yourself."
      ]
    },
    "counts": {
      "greet": 50,
      "quote": 50
    }
  },
  "fruit": {
    "zh": {
      "greetScenes": {
        "night": [
          "桌上的果盘还剩下几颗，",
          "冰箱里放着切开的西瓜，",
          "果香淡淡的，",
          "一颗苹果放在窗边，",
          "果皮刚削在盘子里，"
        ],
        "morning": [
          "果盘刚摆好，",
          "桌上放着刚洗好的葡萄，",
          "切开的水果还带着露水，",
          "一杯果汁刚倒满，",
          "窗边的柠檬黄得发亮，"
        ],
        "forenoon": [
          "上午的水果切好了，",
          "盘子里摆着几颗草莓，",
          "果皮落在案板上，",
          "一杯果茶还温着，",
          "冰箱门刚打开，"
        ],
        "noon": [
          "午饭后的水果端上桌，",
          "西瓜切成了几块，",
          "葡萄洗好放在碗里，",
          "果盘里颜色很热闹，",
          "一颗橘子刚剥开，"
        ],
        "afternoon": [
          "下午的果茶刚泡好，",
          "桌上的芒果切了一半，",
          "果盘里剩下几颗樱桃，",
          "冰箱里的果汁冰着，",
          "窗外的阳光照在水果上，"
        ],
        "evening": [
          "晚饭后的果盘摆出来，",
          "西瓜只剩最后几块，",
          "葡萄一颗颗放在碗里，",
          "果皮收在盘子边，",
          "厨房里还有一点果香，"
        ]
      },
      "quoteScenes": {
        "night": [
          "果盘里还剩几颗水果。",
          "冰箱里放着切开的西瓜。",
          "果香淡淡的。",
          "一颗苹果放在窗边。",
          "果皮削在盘子里。"
        ],
        "morning": [
          "果盘刚摆好。",
          "桌上放着刚洗好的葡萄。",
          "切开的水果还带着露水。",
          "一杯果汁刚倒满。",
          "窗边的柠檬黄得发亮。"
        ],
        "forenoon": [
          "上午的水果切好了。",
          "盘子里摆着几颗草莓。",
          "果皮落在案板上。",
          "一杯果茶还温着。",
          "冰箱门刚打开。"
        ],
        "noon": [
          "午饭后的水果端上桌。",
          "西瓜切成了几块。",
          "葡萄洗好放在碗里。",
          "果盘里颜色很热闹。",
          "一颗橘子刚剥开。"
        ],
        "afternoon": [
          "下午的果茶刚泡好。",
          "桌上的芒果切了一半。",
          "果盘里剩下几颗樱桃。",
          "冰箱里的果汁冰着。",
          "阳光照在水果上。"
        ],
        "evening": [
          "晚饭后的果盘摆出来。",
          "西瓜只剩最后几块。",
          "葡萄一颗颗放在碗里。",
          "果皮收在盘子边。",
          "厨房里还有一点果香。"
        ]
      },
      "greetTails": [
        "愿今天的水果，甜得刚刚好 🍉",
        "记得给自己补一点水分和维C 🍊",
        "愿你的日子像果盘一样，颜色丰富 🍇",
        "愿最甜的那一口，正好落在你嘴里 🍓",
        "愿你有清凉的西瓜，也有甜甜的葡萄 🍉",
        "愿今天的果香，把心情染得轻快 🍋",
        "愿你不必削去太多，生活也有甜的部分 🍎",
        "愿一颗水果，替你补上今天的小确幸 🍒",
        "愿果盘里总有你喜欢的那一种 🍑",
        "愿今天的酸甜，都刚好合你的口味 🍍"
      ],
      "quoteTails": [
        "水果不必多贵，新鲜就很好。",
        "切开一颗水果，甜味就有了出口。",
        "果盘的颜色，是生活小小的热闹。",
        "西瓜最中间那一口，最甜。",
        "有些甜，要自己给自己。",
        "水果要慢慢吃，日子也要慢慢过。",
        "一颗橘子，也能剥出一点好心情。",
        "冰箱里有一点水果，心里就有一点底。",
        "酸甜都是味道，不用只挑甜的。",
        "今天的果香，会留到明天。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "a few fruits remain in the bowl,",
          "cut watermelon sits in the fridge,",
          "the fruit scent is faint,",
          "an apple sits by the window,",
          "peels have just been pared onto the plate,"
        ],
        "morning": [
          "the fruit bowl has just been set,",
          "freshly washed grapes sit on the table,",
          "cut fruit still carries dew,",
          "a glass of juice has just been filled,",
          "the lemon by the window is bright yellow,"
        ],
        "forenoon": [
          "the morning fruit is cut,",
          "a few strawberries sit on the plate,",
          "peels fall on the cutting board,",
          "a cup of fruit tea is still warm,",
          "the fridge door has just opened,"
        ],
        "noon": [
          "after-lunch fruit is put on the table,",
          "watermelon is cut into pieces,",
          "grapes are washed in a bowl,",
          "the fruit bowl is full of colors,",
          "an orange has just been peeled,"
        ],
        "afternoon": [
          "the afternoon fruit tea has just been brewed,",
          "half a mango is cut on the table,",
          "a few cherries remain in the bowl,",
          "juice is chilling in the fridge,",
          "sunlight falls on the fruit outside the window,"
        ],
        "evening": [
          "the after-dinner fruit bowl is out,",
          "only the last pieces of watermelon remain,",
          "grapes are placed one by one in a bowl,",
          "peels are gathered by the plate,",
          "a little fruit scent remains in the kitchen,"
        ]
      },
      "quoteScenes": {
        "night": [
          "A few fruits remain in the bowl.",
          "Cut watermelon sits in the fridge.",
          "The fruit scent is faint.",
          "An apple sits by the window.",
          "Peels are pared onto the plate."
        ],
        "morning": [
          "The fruit bowl has just been set.",
          "Freshly washed grapes sit on the table.",
          "Cut fruit still carries dew.",
          "A glass of juice has just been filled.",
          "The lemon by the window is bright yellow."
        ],
        "forenoon": [
          "The morning fruit is cut.",
          "A few strawberries sit on the plate.",
          "Peels fall on the cutting board.",
          "A cup of fruit tea is still warm.",
          "The fridge door has just opened."
        ],
        "noon": [
          "After-lunch fruit is put on the table.",
          "Watermelon is cut into pieces.",
          "Grapes are washed in a bowl.",
          "The fruit bowl is full of colors.",
          "An orange has just been peeled."
        ],
        "afternoon": [
          "The afternoon fruit tea has just been brewed.",
          "Half a mango is cut on the table.",
          "A few cherries remain in the bowl.",
          "Juice is chilling in the fridge.",
          "Sunlight falls on the fruit outside the window."
        ],
        "evening": [
          "The after-dinner fruit bowl is out.",
          "Only the last pieces of watermelon remain.",
          "Grapes are placed one by one in a bowl.",
          "Peels are gathered by the plate.",
          "A little fruit scent remains in the kitchen."
        ]
      },
      "greetTails": [
        "may today’s fruit be just sweet enough 🍉",
        "remember to replenish a little water and vitamin C 🍊",
        "may your days be as colorful as a fruit bowl 🍇",
        "may the sweetest bite land right in your mouth 🍓",
        "may you have cool watermelon and sweet grapes 🍉",
        "may today’s fruit scent brighten your mood 🍋",
        "you do not have to peel away too much; life has a sweet part too 🍎",
        "may one fruit make up today’s small happiness 🍒",
        "may the fruit bowl always hold the kind you like 🍑",
        "may today’s sweet and sour both suit your taste 🍍"
      ],
      "quoteTails": [
        "Fruit does not have to be expensive; fresh is good.",
        "Cut a fruit open, and its sweetness finds a way out.",
        "The colors of a fruit bowl are life’s small liveliness.",
        "The middle of the watermelon is the sweetest.",
        "Some sweetness has to be given to yourself.",
        "Fruit should be eaten slowly; days should be lived slowly.",
        "One orange can be peeled into a little good mood.",
        "A little fruit in the fridge gives the heart a little ground.",
        "Sweet and sour are both flavor; no need to pick only sweet.",
        "Today’s fruit scent will last until tomorrow."
      ]
    },
    "counts": {
      "greet": 50,
      "quote": 50
    }
  },
  "sakura": {
    "zh": {
      "greetScenes": {
        "night": [
          "樱花还开着，",
          "路灯照着花瓣，",
          "窗外的花枝轻轻晃，",
          "花瓣落在台阶上，",
          "院子里的樱花树安静下来，"
        ],
        "morning": [
          "樱花刚开，",
          "花瓣上还挂着露水，",
          "阳光落在花枝上，",
          "院子里飘着淡淡的花香，",
          "一阵风吹过，花瓣落了几片，"
        ],
        "forenoon": [
          "上午的樱花树很亮，",
          "花瓣在风里慢慢飘，",
          "树下落了一层粉白，",
          "有人抬头看花，",
          "花枝伸到窗前，"
        ],
        "noon": [
          "中午的阳光落在樱花上，",
          "花瓣被晒得有点软，",
          "树影短短地落在地上，",
          "院子里安静下来，",
          "一杯茶放在花树下，"
        ],
        "afternoon": [
          "下午的风吹起花瓣，",
          "花枝在光里轻轻摇，",
          "地上又落了一层花，",
          "樱花树下的影子变长，",
          "有人从花树下走过，"
        ],
        "evening": [
          "傍晚的樱花染上暖色，",
          "花瓣慢慢落在门口，",
          "院子里的灯亮起来，",
          "最后一缕光留在花枝上，",
          "夜风把花香送远，"
        ]
      },
      "quoteScenes": {
        "night": [
          "樱花还开着。",
          "路灯照着花瓣。",
          "窗外的花枝轻轻晃。",
          "花瓣落在台阶上。",
          "院子里的樱花树安静下来。"
        ],
        "morning": [
          "樱花刚开。",
          "花瓣上还挂着露水。",
          "阳光落在花枝上。",
          "院子里飘着淡淡的花香。",
          "一阵风吹过，花瓣落了几片。"
        ],
        "forenoon": [
          "上午的樱花树很亮。",
          "花瓣在风里慢慢飘。",
          "树下落了一层粉白。",
          "有人抬头看花。",
          "花枝伸到窗前。"
        ],
        "noon": [
          "中午的阳光落在樱花上。",
          "花瓣被晒得有点软。",
          "树影短短地落在地上。",
          "院子里安静下来。",
          "一杯茶放在花树下。"
        ],
        "afternoon": [
          "下午的风吹起花瓣。",
          "花枝在光里轻轻摇。",
          "地上又落了一层花。",
          "樱花树下的影子变长。",
          "有人从花树下走过。"
        ],
        "evening": [
          "傍晚的樱花染上暖色。",
          "花瓣慢慢落在门口。",
          "院子里的灯亮起来。",
          "最后一缕光留在花枝上。",
          "夜风把花香送远。"
        ]
      },
      "greetTails": [
        "愿樱花落在你肩上时，正好是好事发生的时候 🌸",
        "愿今天的风，把花瓣和好心情一起送来 🍃",
        "记得抬头看看，樱花只开这一阵 🌸",
        "愿你在花树下，遇见一点点浪漫 🌷",
        "愿花瓣铺成的路，走起来轻轻的 🦋",
        "愿今天的樱花，替你开出一小片温柔 💮",
        "愿你有时间看花，也有时间发呆 ☁️",
        "愿风吹过的时候，烦恼跟着花瓣走 🍃",
        "愿你在樱花漫舞的季节里，被温柔撞一下 🌸",
        "愿今天有一片花瓣，刚好落在你手心 🌸"
      ],
      "quoteTails": [
        "樱花不等人，想看的风景要趁早。",
        "花瓣落下来，春天就有了声音。",
        "一棵樱花开着，院子就软了。",
        "风一吹，花瓣就替人说了再见。",
        "樱花只开一阵，所以每一眼都算数。",
        "落在肩上的花瓣，不用急着拍掉。",
        "花树下站一会儿，时间会慢下来。",
        "粉色不一定是少女心，也可以是春天。",
        "花瓣铺在地上，也是一种盛开。",
        "今年的樱花，也会记得来过的人。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "the cherry blossoms are still open,",
          "the streetlight shines on the petals,",
          "the flowering branch outside sways gently,",
          "petals fall on the steps,",
          "the cherry tree in the yard quiets down,"
        ],
        "morning": [
          "the cherry blossoms have just opened,",
          "dew still hangs on the petals,",
          "sunlight falls on the flowering branch,",
          "a faint flower scent drifts in the yard,",
          "a gust of wind takes a few petals down,"
        ],
        "forenoon": [
          "the cherry tree is bright in the late morning,",
          "petals drift slowly in the wind,",
          "a layer of pink-white has fallen under the tree,",
          "someone looks up at the flowers,",
          "a flowering branch reaches the window,"
        ],
        "noon": [
          "the noon sun falls on the cherry blossoms,",
          "the petals soften in the heat,",
          "short tree shadows fall on the ground,",
          "the yard quiets down,",
          "a cup of tea sits under the cherry tree,"
        ],
        "afternoon": [
          "the afternoon wind lifts the petals,",
          "the flowering branch sways in the light,",
          "another layer of petals has fallen,",
          "the shadow under the cherry tree lengthens,",
          "someone walks under the cherry tree,"
        ],
        "evening": [
          "the cherry blossoms turn warm in the evening,",
          "petals fall slowly at the door,",
          "the yard lamp comes on,",
          "the last light stays on the branch,",
          "the night breeze carries the scent away,"
        ]
      },
      "quoteScenes": {
        "night": [
          "The cherry blossoms are still open.",
          "The streetlight shines on the petals.",
          "The flowering branch outside sways gently.",
          "Petals fall on the steps.",
          "The cherry tree in the yard quiets down."
        ],
        "morning": [
          "The cherry blossoms have just opened.",
          "Dew still hangs on the petals.",
          "Sunlight falls on the flowering branch.",
          "A faint flower scent drifts in the yard.",
          "A gust of wind takes a few petals down."
        ],
        "forenoon": [
          "The cherry tree is bright in the late morning.",
          "Petals drift slowly in the wind.",
          "A layer of pink-white has fallen under the tree.",
          "Someone looks up at the flowers.",
          "A flowering branch reaches the window."
        ],
        "noon": [
          "The noon sun falls on the cherry blossoms.",
          "The petals soften in the heat.",
          "Short tree shadows fall on the ground.",
          "The yard quiets down.",
          "A cup of tea sits under the cherry tree."
        ],
        "afternoon": [
          "The afternoon wind lifts the petals.",
          "The flowering branch sways in the light.",
          "Another layer of petals has fallen.",
          "The shadow under the cherry tree lengthens.",
          "Someone walks under the cherry tree."
        ],
        "evening": [
          "The cherry blossoms turn warm in the evening.",
          "Petals fall slowly at the door.",
          "The yard lamp comes on.",
          "The last light stays on the branch.",
          "The night breeze carries the scent away."
        ]
      },
      "greetTails": [
        "may good things happen just as a petal lands on your shoulder 🌸",
        "may today’s wind bring petals and a good mood together 🍃",
        "remember to look up; the cherry blossoms only last a while 🌸",
        "may you meet a little romance under the cherry tree 🌷",
        "may the road paved with petals feel light under your feet 🦋",
        "may today’s cherry blossoms open a small patch of tenderness for you 💮",
        "may you have time to see the flowers and time to daydream ☁️",
        "when the wind passes, may your worries go with the petals 🍃",
        "may you be gently met in this season of dancing cherry blossoms 🌸",
        "may one petal today land right in your palm 🌸"
      ],
      "quoteTails": [
        "Cherry blossoms do not wait; see the view while it lasts.",
        "When petals fall, spring finds its voice.",
        "With one cherry tree in bloom, the yard turns soft.",
        "One gust of wind, and the petals say goodbye for us.",
        "Cherry blossoms last only a while, so every glance counts.",
        "A petal on your shoulder does not need to be brushed off in a hurry.",
        "Stand under the tree for a while, and time slows down.",
        "Pink does not have to be girlish; it can simply be spring.",
        "Petals covering the ground are still a kind of blooming.",
        "This year’s cherry blossoms will remember the people who came."
      ]
    },
    "counts": {
      "greet": 50,
      "quote": 50
    }
  },
  "flower": {
    "zh": {
      "greetScenes": {
        "night": [
          "花园安静下来，",
          "花枝在灯下轻轻晃，",
          "花瓣合拢了一点，",
          "院子里的花香还没散，",
          "露水落在叶子上，"
        ],
        "morning": [
          "花园刚醒，",
          "花瓣上挂着露水，",
          "阳光落在花丛里，",
          "一朵花刚打开，",
          "院子里的鸟叫醒了花，"
        ],
        "forenoon": [
          "上午的花园很亮，",
          "蝴蝶停在花上，",
          "花枝在风里摇，",
          "新开的花又多了几朵，",
          "花香从院子飘到窗边，"
        ],
        "noon": [
          "中午的阳光落在花丛里，",
          "花瓣被晒得有点软，",
          "花影短短地落在地上，",
          "一杯水放在花盆边，",
          "花园里安静下来，"
        ],
        "afternoon": [
          "下午的光穿过花枝，",
          "花瓣落在泥土上，",
          "花园里有一只蜜蜂，",
          "花影慢慢拉长，",
          "风把花香送进屋里，"
        ],
        "evening": [
          "傍晚的花园染上暖色，",
          "花瓣慢慢合拢，",
          "院子里的灯亮起来，",
          "最后一缕光落在花上，",
          "晚风带着花香经过，"
        ]
      },
      "quoteScenes": {
        "night": [
          "花园里的灯还亮着。",
          "花枝在灯下轻轻晃。",
          "花瓣合拢了一点。",
          "院子里的花香还没散。",
          "露水落在叶子上。"
        ],
        "morning": [
          "花园刚醒。",
          "花瓣上挂着露水。",
          "阳光落在花丛里。",
          "一朵花刚打开。",
          "院子里的鸟叫醒了花。"
        ],
        "forenoon": [
          "上午的花园很亮。",
          "蝴蝶停在花上。",
          "花枝在风里摇。",
          "新开的花又多了几朵。",
          "花香从院子飘到窗边。"
        ],
        "noon": [
          "中午的阳光落在花丛里。",
          "花瓣被晒得有点软。",
          "花影短短地落在地上。",
          "一杯水放在花盆边。",
          "花园里安静下来。"
        ],
        "afternoon": [
          "光穿过花枝。",
          "花瓣落在泥土上。",
          "花园里有一只蜜蜂。",
          "花影慢慢拉长。",
          "风把花香送进屋里。"
        ],
        "evening": [
          "傍晚的花园染上暖色。",
          "花瓣慢慢合拢。",
          "院子里的灯亮起来。",
          "最后一缕光落在花上。",
          "晚风带着花香经过。"
        ]
      },
      "greetTails": [
        "愿今天有一朵花，替你把心情打开 🌸",
        "愿花香经过的地方，都留下一点温柔 🌷",
        "记得像花一样，按自己的节奏开 🌼",
        "愿你在花园里，遇见喜欢的那一朵 🌹",
        "愿花瓣落在手心时，正好接住一点好运 🍀",
        "愿今天的风，只吹来花香和好消息 🍃",
        "愿你有时间浇花，也有时间照顾自己 💧",
        "愿花丛里的蜜蜂，替你把日子酿甜 🐝",
        "愿你在花语里，听见自己想听的那句 🌺",
        "愿今天的花，开得刚好，你也刚好 🌷"
      ],
      "quoteTails": [
        "花有花语，人也有没说出口的话。",
        "一朵花开了，花园就有了中心。",
        "花瓣落下来，不是结束，是下一次开。",
        "花园不必很大，够坐一会儿就好。",
        "花开得慢，但从来不误季节。",
        "有花的地方，风也会轻一点。",
        "每一朵花，都有自己的时间。",
        "花香不争不抢，却留得最久。",
        "今天开的那朵，明天还会记得。",
        "花园里的安静，是花在说话。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "the garden quiets down,",
          "flower branches sway gently under the lamp,",
          "the petals have folded a little,",
          "the flower scent in the yard has not gone,",
          "dew falls on the leaves,"
        ],
        "morning": [
          "the garden has just woken,",
          "dew hangs on the petals,",
          "sunlight falls into the flower beds,",
          "one flower has just opened,",
          "birds in the yard wake the flowers,"
        ],
        "forenoon": [
          "the garden is bright in the late morning,",
          "a butterfly rests on a flower,",
          "flower branches sway in the wind,",
          "a few more flowers have opened,",
          "flower scent drifts from the yard to the window,"
        ],
        "noon": [
          "the noon sun falls into the flower beds,",
          "the petals soften in the heat,",
          "short flower shadows fall on the ground,",
          "a glass of water sits by the flowerpot,",
          "the garden quiets down,"
        ],
        "afternoon": [
          "afternoon light passes through the branches,",
          "petals fall onto the soil,",
          "a bee is in the garden,",
          "flower shadows slowly lengthen,",
          "the wind brings flower scent into the house,"
        ],
        "evening": [
          "the garden turns warm in the evening,",
          "petals slowly close,",
          "the yard lamp comes on,",
          "the last light falls on the flowers,",
          "the evening breeze passes with flower scent,"
        ]
      },
      "quoteScenes": {
        "night": [
          "The garden lamp is still on.",
          "Flower branches sway gently under the lamp.",
          "The petals have folded a little.",
          "The flower scent in the yard has not gone.",
          "Dew falls on the leaves."
        ],
        "morning": [
          "The garden has just woken.",
          "Dew hangs on the petals.",
          "Sunlight falls into the flower beds.",
          "One flower has just opened.",
          "Birds in the yard wake the flowers."
        ],
        "forenoon": [
          "The garden is bright in the late morning.",
          "A butterfly rests on a flower.",
          "Flower branches sway in the wind.",
          "A few more flowers have opened.",
          "Flower scent drifts from the yard to the window."
        ],
        "noon": [
          "The noon sun falls into the flower beds.",
          "The petals soften in the heat.",
          "Short flower shadows fall on the ground.",
          "A glass of water sits by the flowerpot.",
          "The garden quiets down."
        ],
        "afternoon": [
          "Light passes through the branches.",
          "Petals fall onto the soil.",
          "A bee is in the garden.",
          "Flower shadows slowly lengthen.",
          "The wind brings flower scent into the house."
        ],
        "evening": [
          "The garden turns warm in the evening.",
          "Petals slowly close.",
          "The yard lamp comes on.",
          "The last light falls on the flowers.",
          "The evening breeze passes with flower scent."
        ]
      },
      "greetTails": [
        "may one flower today open your mood 🌸",
        "may every place the flower scent passes keep a little tenderness 🌷",
        "remember to open at your own pace, like a flower 🌼",
        "may you meet the one you like in the garden 🌹",
        "may a petal in your palm catch a little good luck 🍀",
        "may today’s wind bring only flower scent and good news 🍃",
        "may you have time to water the flowers and care for yourself 💧",
        "may the bees in the garden sweeten your days 🐝",
        "may you hear the words you want in the language of flowers 🌺",
        "may today’s flowers open just right, and you too 🌷"
      ],
      "quoteTails": [
        "Flowers have a language; people also have unspoken words.",
        "When one flower opens, the garden finds its center.",
        "Petals falling is not an ending; it is the next opening.",
        "The garden does not have to be big; enough to sit in is fine.",
        "Flowers open slowly, but they never miss their season.",
        "Where there are flowers, the wind is gentler.",
        "Every flower has its own time.",
        "Flower scent does not compete, yet it stays the longest.",
        "The flower that opens today will remember tomorrow.",
        "The quiet in the garden is the flowers speaking."
      ]
    },
    "counts": {
      "greet": 50,
      "quote": 50
    }
  },
  "gold": {
    "counts": {
      "greet": 30,
      "quote": 30
    },
    "zh": {
      "greetScenes": {
        "night": [
          "金色吊灯还亮着，",
          "大厅里只剩一点暖光，",
          "铜色的钟摆慢慢走，",
          "酒杯放在桌边，",
          "金色的窗帘垂到地面，"
        ],
        "morning": [
          "清晨的光落在金色墙面上，",
          "铜钟刚敲过，",
          "大厅的地板被擦得发亮，",
          "金色的窗帘拉开了一半，",
          "桌上摆着刚烤好的点心，"
        ],
        "forenoon": [
          "上午的大厅很安静，",
          "金色吊灯在光里发亮，",
          "铜色的扶手被擦得干净，",
          "有人从长廊走过，",
          "留声机放着旧曲子，"
        ],
        "noon": [
          "中午的光落在金色桌面上，",
          "银器摆好，",
          "大厅里有一点饭菜香，",
          "铜钟的影子短短地落在地上，",
          "金色的椅背泛着暖光，"
        ],
        "afternoon": [
          "下午的光斜进大厅，",
          "金色的窗帘被风吹起，",
          "铜钟慢慢走，",
          "桌上的茶还温着，",
          "长廊里传来脚步声，"
        ],
        "evening": [
          "傍晚的大厅亮起灯，",
          "金色吊灯把光洒下来，",
          "铜钟的影子拉长，",
          "酒杯碰在一起，",
          "门外的天色暗了，"
        ]
      },
      "quoteScenes": {
        "night": [
          "金色吊灯还亮着。",
          "大厅里只剩一点暖光。",
          "铜色的钟摆慢慢走。",
          "酒杯放在桌边。",
          "金色的窗帘垂到地面。"
        ],
        "morning": [
          "清晨的光落在金色墙面上。",
          "铜钟刚敲过。",
          "大厅的地板被擦得发亮。",
          "金色的窗帘拉开了一半。",
          "桌上摆着刚烤好的点心。"
        ],
        "forenoon": [
          "上午的大厅很安静。",
          "金色吊灯在光里发亮。",
          "铜色的扶手被擦得干净。",
          "有人从长廊走过。",
          "留声机放着旧曲子。"
        ],
        "noon": [
          "中午的光落在金色桌面上。",
          "银器摆好。",
          "大厅里有一点饭菜香。",
          "铜钟的影子短短地落在地上。",
          "金色的椅背泛着暖光。"
        ],
        "afternoon": [
          "下午的光斜进大厅。",
          "金色的窗帘被风吹起。",
          "铜钟慢慢走。",
          "桌上的茶还温着。",
          "长廊里传来脚步声。"
        ],
        "evening": [
          "傍晚的大厅亮起灯。",
          "金色吊灯把光洒下来。",
          "铜钟的影子拉长。",
          "酒杯碰在一起。",
          "门外的天色暗了。"
        ]
      },
      "greetTails": [
        "愿你的日子有金光，也有安稳的暖意 ✨",
        "愿今天有一件小事，配得上你的认真 🥂",
        "愿金色落在你身上时，正好是值得纪念的时刻 🏆",
        "愿你不必追赶时代，也能活成自己的黄金年代 🌟",
        "愿大厅里的光，替你把疲惫照得轻一点 🕯️",
        "愿你的每一步，都走得体面又从容 👞"
      ],
      "quoteTails": [
        "金色会旧，光却可以一直留着。",
        "大厅再大，也要有一盏灯为你亮。",
        "铜钟走得慢，时间却从不迟到。",
        "体面不是给别人看的，是给自己的。",
        "旧曲子一响，黄金时代就回来了。",
        "真正的好日子，不一定要很响。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "the golden chandelier is still lit,",
          "only a little warm light remains in the hall,",
          "the brass pendulum moves slowly,",
          "a wine glass sits by the table,",
          "gold curtains fall to the floor,"
        ],
        "morning": [
          "morning light falls on the golden wall,",
          "the brass clock has just struck,",
          "the hall floor has just been polished,",
          "half the gold curtain is drawn open,",
          "freshly baked pastries sit on the table,"
        ],
        "forenoon": [
          "the hall is quiet in the late morning,",
          "the golden chandelier shines in the light,",
          "the brass handrail has just been wiped clean,",
          "someone walks down the long corridor,",
          "the gramophone plays an old tune,"
        ],
        "noon": [
          "noon light falls on the golden tabletop,",
          "the silverware is set,",
          "a little food scent fills the hall,",
          "the brass clock casts a short shadow,",
          "the gold chair backs glow warm,"
        ],
        "afternoon": [
          "afternoon light slants into the hall,",
          "the gold curtain lifts in the wind,",
          "the brass clock moves slowly,",
          "the tea on the table is still warm,",
          "footsteps come from the corridor,"
        ],
        "evening": [
          "the hall lights come on in the evening,",
          "the golden chandelier pours down light,",
          "the brass clock shadow lengthens,",
          "wine glasses touch,",
          "the sky outside has darkened,"
        ]
      },
      "quoteScenes": {
        "night": [
          "The golden chandelier is still lit.",
          "Only a little warm light remains in the hall.",
          "The brass pendulum moves slowly.",
          "A wine glass sits by the table.",
          "Gold curtains fall to the floor."
        ],
        "morning": [
          "Morning light falls on the golden wall.",
          "The brass clock has just struck.",
          "The hall floor has just been polished.",
          "Half the gold curtain is drawn open.",
          "Freshly baked pastries sit on the table."
        ],
        "forenoon": [
          "The hall is quiet in the late morning.",
          "The golden chandelier shines in the light.",
          "The brass handrail has just been wiped clean.",
          "Someone walks down the long corridor.",
          "The gramophone plays an old tune."
        ],
        "noon": [
          "Noon light falls on the golden tabletop.",
          "The silverware is set.",
          "A little food scent fills the hall.",
          "The brass clock casts a short shadow.",
          "The gold chair backs glow warm."
        ],
        "afternoon": [
          "Afternoon light slants into the hall.",
          "The gold curtain lifts in the wind.",
          "The brass clock moves slowly.",
          "The tea on the table is still warm.",
          "Footsteps come from the corridor."
        ],
        "evening": [
          "The hall lights come on in the evening.",
          "The golden chandelier pours down light.",
          "The brass clock shadow lengthens.",
          "Wine glasses touch.",
          "The sky outside has darkened."
        ]
      },
      "greetTails": [
        "may your days have gold light and steady warmth ✨",
        "may one small thing today be worthy of your care 🥂",
        "may the gold fall on you at a moment worth remembering 🏆",
        "you do not have to chase the era; you can live your own golden age 🌟",
        "may the light in the hall make your tiredness feel lighter 🕯️",
        "may every step you take be dignified and unhurried 👞"
      ],
      "quoteTails": [
        "Gold ages, but light can stay.",
        "No matter how big the hall, one lamp must burn for you.",
        "The brass clock is slow, but time is never late.",
        "Dignity is not for others; it is for yourself.",
        "When the old tune plays, the golden age returns.",
        "A truly good day does not have to be loud."
      ]
    }
  },
  "cyber": {
    "counts": {
      "greet": 30,
      "quote": 30
    },
    "zh": {
      "greetScenes": {
        "night": [
          "霓虹灯在窗外闪，",
          "巷子里的全息广告还亮着，",
          "屏幕的蓝光落在桌上，",
          "远处的飞行器划过夜空，",
          "街道的雨反射着霓虹，"
        ],
        "morning": [
          "清晨的霓虹还没熄，",
          "屏幕刚亮起来，",
          "楼下的自动门开合了一次，",
          "街角的广告换了一帧，",
          "城市还带着夜里的蓝光，"
        ],
        "forenoon": [
          "上午的街道开始喧闹，",
          "全息广告在楼间闪烁，",
          "屏幕上的数据一条条滚动，",
          "有人戴着耳机走过，",
          "高架上的车流不断，"
        ],
        "noon": [
          "中午的霓虹淡了一点，",
          "屏幕的光落在餐盒上，",
          "街角的机器人在清扫，",
          "楼顶的广告牌还在闪，",
          "城市的声音挤在一起，"
        ],
        "afternoon": [
          "下午的光被高楼切开，",
          "霓虹在阴影里先亮起来，",
          "屏幕上的警告闪了一下，",
          "街角有人调试设备，",
          "雨落在金属招牌上，"
        ],
        "evening": [
          "傍晚的霓虹一盏盏亮起，",
          "全息广告换了颜色，",
          "街道的车灯连成线，",
          "屏幕的蓝光映在玻璃上，",
          "城市进入夜里，"
        ]
      },
      "quoteScenes": {
        "night": [
          "霓虹灯在窗外闪。",
          "巷子里的全息广告还亮着。",
          "屏幕的蓝光落在桌上。",
          "远处的飞行器划过夜空。",
          "街道的雨反射着霓虹。"
        ],
        "morning": [
          "清晨的霓虹还没熄。",
          "屏幕刚亮起来。",
          "楼下的自动门开合了一次。",
          "街角的广告换了一帧。",
          "城市还带着夜里的蓝光。"
        ],
        "forenoon": [
          "上午的街道开始喧闹。",
          "全息广告在楼间闪烁。",
          "屏幕上的数据一条条滚动。",
          "有人戴着耳机走过。",
          "高架上的车流不断。"
        ],
        "noon": [
          "中午的霓虹淡了一点。",
          "屏幕的光落在餐盒上。",
          "街角的机器人正在清扫。",
          "楼顶的广告牌还在闪。",
          "城市的声音挤在一起。"
        ],
        "afternoon": [
          "下午的光被高楼切开。",
          "霓虹在阴影里先亮起来。",
          "屏幕上的警告闪了一下。",
          "街角有人调试设备。",
          "雨落在金属招牌上。"
        ],
        "evening": [
          "傍晚的霓虹一盏盏亮起。",
          "全息广告换了颜色。",
          "街道的车灯连成线。",
          "屏幕的蓝光映在玻璃上。",
          "城市进入夜里。"
        ]
      },
      "greetTails": [
        "愿城市再吵，也有一块安静留给你 🌃",
        "愿你的信号永远满格，方向永远清楚 📶",
        "愿霓虹亮起时，你正好走在想走的路上 🛣️",
        "愿今天的代码不出错，日子也不卡顿 💻",
        "愿你在钢铁和光里，保留一点自己的温度 🌆",
        "愿夜色越深，你越知道自己要去哪 🌌"
      ],
      "quoteTails": [
        "霓虹不会替人指路，方向要自己选。",
        "城市一直亮着，人却可以偶尔关掉屏幕。",
        "信号满格，不代表心里也满。",
        "钢铁森林里，也要留一盏自己的灯。",
        "雨落在霓虹上，城市就有了颜色。",
        "再快的网，也追不上一个想慢下来的人。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "neon flickers outside the window,",
          "the hologram ad in the alley is still lit,",
          "blue screen light falls on the desk,",
          "a distant aircraft crosses the night sky,",
          "rain on the street reflects the neon,"
        ],
        "morning": [
          "the morning neon has not gone out yet,",
          "the screen has just come on,",
          "the automatic door downstairs opens and closes once,",
          "the ad on the corner changes a frame,",
          "the city still carries last night’s blue light,"
        ],
        "forenoon": [
          "the street grows noisy in the late morning,",
          "holograms flicker between buildings,",
          "data scrolls line by line on the screen,",
          "someone walks past with headphones,",
          "traffic keeps flowing on the overpass,"
        ],
        "noon": [
          "the neon fades a little at noon,",
          "screen light falls on the lunch box,",
          "a robot is cleaning the corner,",
          "the rooftop billboard still flashes,",
          "city sounds crowd together,"
        ],
        "afternoon": [
          "afternoon light is cut by the towers,",
          "neon comes on first in the shadows,",
          "a warning blinks on the screen,",
          "someone is tuning equipment on the corner,",
          "rain falls on the metal sign,"
        ],
        "evening": [
          "neon comes on one by one in the evening,",
          "the hologram ad changes color,",
          "car lights on the street form a line,",
          "blue screen light reflects on the glass,",
          "the city enters the night,"
        ]
      },
      "quoteScenes": {
        "night": [
          "Neon flickers outside the window.",
          "The hologram ad in the alley is still lit.",
          "Blue screen light falls on the desk.",
          "A distant aircraft crosses the night sky.",
          "Rain on the street reflects the neon."
        ],
        "morning": [
          "The morning neon has not gone out yet.",
          "The screen has just come on.",
          "The automatic door downstairs opens and closes once.",
          "The ad on the corner changes a frame.",
          "The city still carries last night’s blue light."
        ],
        "forenoon": [
          "The street grows noisy in the late morning.",
          "Holograms flicker between buildings.",
          "Data scrolls line by line on the screen.",
          "Someone walks past with headphones.",
          "Traffic keeps flowing on the overpass."
        ],
        "noon": [
          "The neon fades a little at noon.",
          "Screen light falls on the lunch box.",
          "A robot is cleaning the corner.",
          "The rooftop billboard still flashes.",
          "City sounds crowd together."
        ],
        "afternoon": [
          "Afternoon light is cut by the towers.",
          "Neon comes on first in the shadows.",
          "A warning blinks on the screen.",
          "Someone is tuning equipment on the corner.",
          "Rain falls on the metal sign."
        ],
        "evening": [
          "Neon comes on one by one in the evening.",
          "The hologram ad changes color.",
          "Car lights on the street form a line.",
          "Blue screen light reflects on the glass.",
          "The city enters the night."
        ]
      },
      "greetTails": [
        "may the city be noisy, but still keep a quiet corner for you 🌃",
        "may your signal always be full and your direction always clear 📶",
        "may the neon light up just as you walk the road you want 🛣️",
        "may today’s code have no bugs and life no lag 💻",
        "may you keep a little of your own warmth among steel and light 🌆",
        "the deeper the night, the more you know where you are going 🌌"
      ],
      "quoteTails": [
        "Neon will not choose a direction for you.",
        "The city stays lit, but a person can turn off the screen now and then.",
        "A full signal does not mean a full heart.",
        "In a steel forest, keep a lamp of your own.",
        "Rain on neon gives the city its color.",
        "Even the fastest network cannot catch a person who wants to slow down."
      ]
    }
  },
  "forest": {
    "counts": {
      "greet": 30,
      "quote": 30
    },
    "zh": {
      "greetScenes": {
        "night": [
          "林子里的虫声还没停，",
          "月光落在树叶上，",
          "营地的小灯亮着，",
          "溪水在暗处流，",
          "树影把小路盖住，"
        ],
        "morning": [
          "清晨的林子刚亮，",
          "露水挂在叶尖，",
          "鸟叫从树梢传来，",
          "小路尽头有雾，",
          "阳光穿过树叶，"
        ],
        "forenoon": [
          "上午的林子里很静，",
          "溪水边有一串脚印，",
          "树叶被风吹得沙沙响，",
          "一只松鼠跳过树根，",
          "光落在苔藓上，"
        ],
        "noon": [
          "中午的林子有一点热，",
          "树荫把小路盖住，",
          "溪水边坐着一个人，",
          "蝴蝶在草叶间飞，",
          "远处传来鸟叫，"
        ],
        "afternoon": [
          "下午的光斜进林子，",
          "树叶的影子落在地上，",
          "小路上有落叶，",
          "溪水的声音更清楚了，",
          "营地升起了烟，"
        ],
        "evening": [
          "傍晚的林子暗下来，",
          "营地的小灯亮起，",
          "鸟叫渐渐停了，",
          "树影拉得很长，",
          "溪水还在流，"
        ]
      },
      "quoteScenes": {
        "night": [
          "林子里的虫声还没停。",
          "月光落在树叶上。",
          "营地的小灯亮着。",
          "溪水在暗处流。",
          "树影把小路盖住。"
        ],
        "morning": [
          "清晨的林子刚亮。",
          "露水挂在叶尖。",
          "鸟叫从树梢传来。",
          "小路尽头有雾。",
          "阳光穿过树叶。"
        ],
        "forenoon": [
          "上午的林子里很静。",
          "溪水边有一串脚印。",
          "树叶被风吹得沙沙响。",
          "一只松鼠跳过树根。",
          "光落在苔藓上。"
        ],
        "noon": [
          "中午的林子有一点热。",
          "树荫把小路盖住。",
          "溪水边坐着一个人。",
          "蝴蝶在草叶间飞。",
          "远处传来鸟叫。"
        ],
        "afternoon": [
          "下午的光斜进林子。",
          "树叶的影子落在地上。",
          "小路上有落叶。",
          "溪水的声音更清楚了。",
          "营地升起了烟。"
        ],
        "evening": [
          "傍晚的林子暗下来。",
          "营地的小灯亮起。",
          "鸟叫渐渐停了。",
          "树影拉得很长。",
          "溪水还在流。"
        ]
      },
      "greetTails": [
        "愿你在林子里，找到一条自己的小路 🌿",
        "愿树叶替你挡住喧嚣，溪水替你带走疲惫 💧",
        "愿今天有一点绿色，落在你的眼睛里 🍃",
        "愿你在树下站一会儿，心就慢慢静下来 🌳",
        "愿营地的小灯，替你把夜照亮 🏕️",
        "愿林间的风，只带来草木和好消息 🍂"
      ],
      "quoteTails": [
        "林子不急着说话，风会替它说。",
        "小路不必有人走过，草也会记得。",
        "树长得很慢，却从来没有停。",
        "溪水绕开石头，还是继续往前。",
        "林子里没有捷径，只有路。",
        "有树荫的地方，脚步会轻一点。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "the insects in the woods have not stopped,",
          "moonlight falls on the leaves,",
          "the small camp lamp is lit,",
          "the stream flows in the dark,",
          "tree shadows cover the path,"
        ],
        "morning": [
          "the woods have just brightened,",
          "dew hangs on the leaf tips,",
          "bird calls come from the treetops,",
          "mist sits at the end of the path,",
          "sunlight passes through the leaves,"
        ],
        "forenoon": [
          "the woods are quiet in the late morning,",
          "a line of footprints sits by the stream,",
          "leaves rustle in the wind,",
          "a squirrel leaps over a root,",
          "light falls on the moss,"
        ],
        "noon": [
          "the woods are a little warm at noon,",
          "shade covers the path,",
          "someone sits by the stream,",
          "butterflies fly among the grass,",
          "bird calls come from afar,"
        ],
        "afternoon": [
          "afternoon light slants into the woods,",
          "leaf shadows fall on the ground,",
          "fallen leaves lie on the path,",
          "the stream sounds clearer,",
          "smoke rises from the camp,"
        ],
        "evening": [
          "the woods darken in the evening,",
          "the camp lamp comes on,",
          "bird calls slowly stop,",
          "tree shadows stretch long,",
          "the stream still flows,"
        ]
      },
      "quoteScenes": {
        "night": [
          "The insects in the woods have not stopped.",
          "Moonlight falls on the leaves.",
          "The small camp lamp is lit.",
          "The stream flows in the dark.",
          "Tree shadows cover the path."
        ],
        "morning": [
          "The woods have just brightened.",
          "Dew hangs on the leaf tips.",
          "Bird calls come from the treetops.",
          "Mist sits at the end of the path.",
          "Sunlight passes through the leaves."
        ],
        "forenoon": [
          "The woods are quiet in the late morning.",
          "A line of footprints sits by the stream.",
          "Leaves rustle in the wind.",
          "A squirrel leaps over a root.",
          "Light falls on the moss."
        ],
        "noon": [
          "The woods are a little warm at noon.",
          "Shade covers the path.",
          "Someone sits by the stream.",
          "Butterflies fly among the grass.",
          "Bird calls come from afar."
        ],
        "afternoon": [
          "Afternoon light slants into the woods.",
          "Leaf shadows fall on the ground.",
          "Fallen leaves lie on the path.",
          "The stream sounds clearer.",
          "Smoke rises from the camp."
        ],
        "evening": [
          "The woods darken in the evening.",
          "The camp lamp comes on.",
          "Bird calls slowly stop.",
          "Tree shadows stretch long.",
          "The stream still flows."
        ]
      },
      "greetTails": [
        "may you find a path of your own in the woods 🌿",
        "may the leaves block the noise and the stream carry your tiredness away 💧",
        "may a little green today land in your eyes 🍃",
        "may you stand under a tree for a while and slowly quiet down 🌳",
        "may the small camp lamp light the night for you 🏕️",
        "may the forest wind bring only plants and good news 🍂"
      ],
      "quoteTails": [
        "The woods do not rush to speak; the wind speaks for them.",
        "A path does not need footprints; the grass remembers.",
        "Trees grow slowly, but they never stop.",
        "The stream goes around the stone and keeps moving forward.",
        "There are no shortcuts in the woods, only paths.",
        "Where there is shade, footsteps are lighter."
      ]
    }
  },
  "diamond": {
    "counts": {
      "greet": 30,
      "quote": 30
    },
    "zh": {
      "greetScenes": {
        "night": [
          "窗外的星子很亮，",
          "桌上的钻石切面反着光，",
          "夜色蓝得发深，",
          "一颗星落在玻璃上，",
          "房间的灯关了一半，"
        ],
        "morning": [
          "清晨的光穿过水晶，",
          "桌上的钻石闪了一下，",
          "窗外的天刚亮，",
          "一颗露水像小钻石，",
          "房间里有细碎的光，"
        ],
        "forenoon": [
          "上午的光落在切面上，",
          "水晶吊坠放在桌边，",
          "窗外的云很薄，",
          "钻石的影子落在纸上，",
          "空气里有一点冷光，"
        ],
        "noon": [
          "中午的光最亮，",
          "钻石切面把光分开，",
          "桌面上落着彩色的光点，",
          "窗外的天空很干净，",
          "一杯水放在水晶旁，"
        ],
        "afternoon": [
          "下午的光斜过来，",
          "钻石的反光落在墙上，",
          "窗外的云变厚了，",
          "桌上的首饰盒打开着，",
          "房间慢慢暗下来，"
        ],
        "evening": [
          "傍晚的第一颗星亮起，",
          "钻石在灯下闪，",
          "窗外的天变成深蓝，",
          "首饰盒合上了一半，",
          "房间的灯亮起来，"
        ]
      },
      "quoteScenes": {
        "night": [
          "窗外的星子很亮。",
          "桌上的钻石切面反着光。",
          "夜色蓝得发深。",
          "一颗星落在玻璃上。",
          "房间的灯关了一半。"
        ],
        "morning": [
          "清晨的光穿过水晶。",
          "桌上的钻石闪了一下。",
          "窗外的天刚亮。",
          "一颗露水像小钻石。",
          "房间里有细碎的光。"
        ],
        "forenoon": [
          "上午的光落在切面上。",
          "水晶吊坠放在桌边。",
          "窗外的云很薄。",
          "钻石的影子落在纸上。",
          "空气里有一点冷光。"
        ],
        "noon": [
          "中午的光最亮。",
          "钻石切面把光分开。",
          "桌面上落着彩色的光点。",
          "窗外的天空很干净。",
          "一杯水放在水晶旁。"
        ],
        "afternoon": [
          "下午的光斜过来。",
          "钻石的反光落在墙上。",
          "窗外的云变厚了。",
          "桌上的首饰盒打开着。",
          "房间慢慢暗下来。"
        ],
        "evening": [
          "傍晚的第一颗星亮起。",
          "钻石在灯下闪。",
          "窗外的天变成深蓝。",
          "首饰盒合上了一半。",
          "房间的灯亮起来。"
        ]
      },
      "greetTails": [
        "愿你的日子有星光，也有钻石般的硬度 ✨",
        "愿今天有一束光，正好落在你身上 💎",
        "愿你再普通，也记得自己会发光 🌟",
        "愿所有切面都朝向光，所有选择都朝向喜欢 💫",
        "愿星子落下来时，你正好抬头 🌌",
        "愿你的心像钻石，清澈又坚定 💎"
      ],
      "quoteTails": [
        "钻石的光，是切面一点点让出来的。",
        "星星不解释自己为什么亮。",
        "越深的夜，越看得见星。",
        "坚硬的东西，也可以很透亮。",
        "光不会只照一面，人也不必。",
        "有些闪，是熬过压力才有的。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "the stars outside are bright,",
          "the diamond facets on the desk catch the light,",
          "the night blue is deep,",
          "one star lands on the glass,",
          "half the room light is off,"
        ],
        "morning": [
          "morning light passes through the crystal,",
          "the diamond on the desk flashes once,",
          "the sky outside has just brightened,",
          "a drop of dew looks like a small diamond,",
          "fine light fills the room,"
        ],
        "forenoon": [
          "morning light falls on the facets,",
          "a crystal pendant sits by the desk,",
          "the clouds outside are thin,",
          "the diamond shadow falls on the paper,",
          "there is a little cold light in the air,"
        ],
        "noon": [
          "the noon light is brightest,",
          "the diamond facets split the light,",
          "colored light spots fall on the desk,",
          "the sky outside is very clear,",
          "a glass of water sits by the crystal,"
        ],
        "afternoon": [
          "afternoon light slants in,",
          "diamond reflections fall on the wall,",
          "the clouds outside have thickened,",
          "the jewelry box on the desk is open,",
          "the room slowly darkens,"
        ],
        "evening": [
          "the first star of the evening appears,",
          "the diamond shines under the lamp,",
          "the sky outside turns deep blue,",
          "the jewelry box is half closed,",
          "the room light comes on,"
        ]
      },
      "quoteScenes": {
        "night": [
          "The stars outside are bright.",
          "The diamond facets on the desk catch the light.",
          "The night blue is deep.",
          "One star lands on the glass.",
          "Half the room light is off."
        ],
        "morning": [
          "Morning light passes through the crystal.",
          "The diamond on the desk flashes once.",
          "The sky outside has just brightened.",
          "A drop of dew looks like a small diamond.",
          "Fine light fills the room."
        ],
        "forenoon": [
          "Morning light falls on the facets.",
          "A crystal pendant sits by the desk.",
          "The clouds outside are thin.",
          "The diamond shadow falls on the paper.",
          "There is a little cold light in the air."
        ],
        "noon": [
          "The noon light is brightest.",
          "The diamond facets split the light.",
          "Colored light spots fall on the desk.",
          "The sky outside is very clear.",
          "A glass of water sits by the crystal."
        ],
        "afternoon": [
          "Afternoon light slants in.",
          "Diamond reflections fall on the wall.",
          "The clouds outside have thickened.",
          "The jewelry box on the desk is open.",
          "The room slowly darkens."
        ],
        "evening": [
          "The first star of the evening appears.",
          "The diamond shines under the lamp.",
          "The sky outside turns deep blue.",
          "The jewelry box is half closed.",
          "The room light comes on."
        ]
      },
      "greetTails": [
        "may your days have starlight and a diamond’s hardness ✨",
        "may one beam of light today land right on you 💎",
        "however ordinary you feel, remember that you can shine 🌟",
        "may every facet face the light and every choice face what you love 💫",
        "may you look up just as the stars fall 🌌",
        "may your heart be like a diamond, clear and firm 💎"
      ],
      "quoteTails": [
        "A diamond’s light is given facet by facet.",
        "Stars do not explain why they shine.",
        "The deeper the night, the more stars you see.",
        "Hard things can be transparent too.",
        "Light does not shine on only one side, and neither must a person.",
        "Some shine comes only after pressure."
      ]
    }
  },
  "aurora": {
    "counts": {
      "greet": 30,
      "quote": 30
    },
    "zh": {
      "greetScenes": {
        "night": [
          "天边有一层绿光，",
          "雪地上映着极光的颜色，",
          "星子落在远山后面，",
          "夜风把云吹开，",
          "天空慢慢变成紫色，"
        ],
        "morning": [
          "清晨的极光淡了，",
          "雪地泛着蓝光，",
          "远山刚露出轮廓，",
          "天边还剩一点绿，",
          "帐篷外的风停了，"
        ],
        "forenoon": [
          "上午的天空很干净，",
          "雪地反射着白光，",
          "远山的影子很清楚，",
          "一只鸟从天空掠过，",
          "营地安静下来，"
        ],
        "noon": [
          "中午的雪地很亮，",
          "天空蓝得发深，",
          "远山的轮廓很清楚，",
          "帐篷边有一杯热水，",
          "风把雪吹成细线，"
        ],
        "afternoon": [
          "下午的天色开始变浅，",
          "雪地上有长长的影子，",
          "远山后面聚起云，",
          "营地升起炊烟，",
          "风带着雪粒走过，"
        ],
        "evening": [
          "傍晚的第一层极光出现，",
          "天空从蓝变成绿，",
          "雪地映着光，",
          "帐篷的灯亮起来，",
          "星子在极光后面闪，"
        ]
      },
      "quoteScenes": {
        "night": [
          "天边有一层绿光。",
          "雪地上映着极光的颜色。",
          "星子落在远山后面。",
          "夜风把云吹开。",
          "天空慢慢变成紫色。"
        ],
        "morning": [
          "清晨的极光淡了。",
          "雪地泛着蓝光。",
          "远山刚露出轮廓。",
          "天边还剩一点绿。",
          "帐篷外的风停了。"
        ],
        "forenoon": [
          "上午的天空很干净。",
          "雪地反射着白光。",
          "远山的影子很清楚。",
          "一只鸟从天空掠过。",
          "营地安静下来。"
        ],
        "noon": [
          "中午的雪地很亮。",
          "天空蓝得发深。",
          "远山的轮廓很清楚。",
          "帐篷边有一杯热水。",
          "风把雪吹成细线。"
        ],
        "afternoon": [
          "下午的天色开始变浅。",
          "雪地上有长长的影子。",
          "远山后面聚起云。",
          "营地升起炊烟。",
          "风带着雪粒走过。"
        ],
        "evening": [
          "傍晚的第一层极光出现。",
          "天空从蓝变成绿。",
          "雪地映着光。",
          "帐篷的灯亮起来。",
          "星子在极光后面闪。"
        ]
      },
      "greetTails": [
        "愿极光出现时，你正好抬头 🌌",
        "愿天空再冷，也有一层绿光为你亮 🌠",
        "愿你在雪地里，遇见不期而遇的奇迹 ✨",
        "愿今天的夜色，替你把心放宽一点 🌌",
        "愿远山和星光，都站在你这边 🏔️",
        "愿极光走过的天空，也留下你的愿望 💫"
      ],
      "quoteTails": [
        "极光不常来，所以等待也值得。",
        "最冷的地方，往往有最亮的夜。",
        "天空换了颜色，雪地就跟着亮。",
        "有些奇迹，只能抬头才看见。",
        "星子在极光后面，也没有熄灭。",
        "夜再长，天总会亮。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "a layer of green light sits on the horizon,",
          "the snow reflects the aurora colors,",
          "stars fall behind the distant mountains,",
          "the night wind parts the clouds,",
          "the sky slowly turns purple,"
        ],
        "morning": [
          "the morning aurora has faded,",
          "the snow glows blue,",
          "the distant mountains have just shown their outline,",
          "a little green remains on the horizon,",
          "the wind outside the tent has stopped,"
        ],
        "forenoon": [
          "the morning sky is very clear,",
          "the snow reflects white light,",
          "the mountain shadows are distinct,",
          "a bird skims across the sky,",
          "the camp quiets down,"
        ],
        "noon": [
          "the noon snow is bright,",
          "the sky is deep blue,",
          "the mountain outline is clear,",
          "a cup of hot water sits by the tent,",
          "the wind draws snow into fine lines,"
        ],
        "afternoon": [
          "the afternoon sky begins to pale,",
          "long shadows lie on the snow,",
          "clouds gather behind the mountains,",
          "cooking smoke rises from the camp,",
          "the wind passes with snow grains,"
        ],
        "evening": [
          "the first layer of aurora appears at dusk,",
          "the sky turns from blue to green,",
          "the snow reflects the light,",
          "the tent lamp comes on,",
          "stars shine behind the aurora,"
        ]
      },
      "quoteScenes": {
        "night": [
          "A layer of green light sits on the horizon.",
          "The snow reflects the aurora colors.",
          "Stars fall behind the distant mountains.",
          "The night wind parts the clouds.",
          "The sky slowly turns purple."
        ],
        "morning": [
          "The morning aurora has faded.",
          "The snow glows blue.",
          "The distant mountains have just shown their outline.",
          "A little green remains on the horizon.",
          "The wind outside the tent has stopped."
        ],
        "forenoon": [
          "The morning sky is very clear.",
          "The snow reflects white light.",
          "The mountain shadows are distinct.",
          "A bird skims across the sky.",
          "The camp quiets down."
        ],
        "noon": [
          "The noon snow is bright.",
          "The sky is deep blue.",
          "The mountain outline is clear.",
          "A cup of hot water sits by the tent.",
          "The wind draws snow into fine lines."
        ],
        "afternoon": [
          "The afternoon sky begins to pale.",
          "Long shadows lie on the snow.",
          "Clouds gather behind the mountains.",
          "Cooking smoke rises from the camp.",
          "The wind passes with snow grains."
        ],
        "evening": [
          "The first layer of aurora appears at dusk.",
          "The sky turns from blue to green.",
          "The snow reflects the light.",
          "The tent lamp comes on.",
          "Stars shine behind the aurora."
        ]
      },
      "greetTails": [
        "may you look up just as the aurora appears 🌌",
        "however cold the sky, may a layer of green light burn for you 🌠",
        "may you meet an unexpected miracle on the snow ✨",
        "may tonight’s sky widen your heart a little 🌌",
        "may the distant mountains and starlight stand on your side 🏔️",
        "may the sky the aurora crosses keep your wish too 💫"
      ],
      "quoteTails": [
        "The aurora does not come often, so waiting is worth it.",
        "The coldest places often have the brightest nights.",
        "When the sky changes color, the snow follows with light.",
        "Some miracles can only be seen by looking up.",
        "Stars behind the aurora have not gone out.",
        "However long the night, dawn always comes."
      ]
    }
  },
  "ocean": {
    "counts": {
      "greet": 30,
      "quote": 30
    },
    "zh": {
      "greetScenes": {
        "night": [
          "海面只剩一点月光，",
          "浪声一阵一阵，",
          "远处的灯塔亮着，",
          "潮水漫过礁石，",
          "沙滩上没有人，"
        ],
        "morning": [
          "清晨的海面很平，",
          "浪花刚碰到沙滩，",
          "海鸥从远处飞过，",
          "潮水退了一点，",
          "天边泛着白光，"
        ],
        "forenoon": [
          "上午的海风很轻，",
          "海面闪着碎光，",
          "沙滩上有几行脚印，",
          "一只小船停在远处，",
          "浪声一直没停，"
        ],
        "noon": [
          "中午的海面很亮，",
          "浪花被晒得发白，",
          "沙滩上的影子很短，",
          "有人撑起遮阳伞，",
          "远处的海很蓝，"
        ],
        "afternoon": [
          "下午的海风大了一点，",
          "浪一层层推向岸边，",
          "沙滩上的脚印被冲淡，",
          "小船在浪里晃，",
          "光落在水面上，"
        ],
        "evening": [
          "傍晚的海面染上暖色，",
          "浪声慢慢变轻，",
          "灯塔刚亮起来，",
          "沙滩上的人陆续离开，",
          "天边的云压得很低，"
        ]
      },
      "quoteScenes": {
        "night": [
          "海面只剩一点月光。",
          "浪声一阵一阵。",
          "远处的灯塔亮着。",
          "潮水漫过礁石。",
          "沙滩上没有人。"
        ],
        "morning": [
          "清晨的海面很平。",
          "浪花刚碰到沙滩。",
          "海鸥从远处飞过。",
          "潮水退了一点。",
          "天边泛着白光。"
        ],
        "forenoon": [
          "上午的海风很轻。",
          "海面闪着碎光。",
          "沙滩上有几行脚印。",
          "一只小船停在远处。",
          "浪声一直没停。"
        ],
        "noon": [
          "中午的海面很亮。",
          "浪花被晒得发白。",
          "沙滩上的影子很短。",
          "有人撑起遮阳伞。",
          "远处的海很蓝。"
        ],
        "afternoon": [
          "下午的海风大了一点。",
          "浪一层层推向岸边。",
          "沙滩上的脚印被冲淡。",
          "小船在浪里晃。",
          "光落在水面上。"
        ],
        "evening": [
          "傍晚的海面染上暖色。",
          "浪声慢慢变轻。",
          "灯塔刚亮起来。",
          "沙滩上的人陆续离开。",
          "天边的云压得很低。"
        ]
      },
      "greetTails": [
        "愿海浪替你带走烦恼，留下一点蓝 🌊",
        "愿你在深海边，有一块安静的岸 🐚",
        "愿今天的风，只吹来海盐和好消息 🌬️",
        "愿灯塔亮起时，你正好找到方向 🗼",
        "愿潮水退去后，沙滩上还留着你的脚印 👣",
        "愿海再深，也有一束光落下来 💙"
      ],
      "quoteTails": [
        "海不解释，只用浪声回答。",
        "潮水退去，沙滩才露出自己的样子。",
        "灯塔不追船，只站在原地亮。",
        "海风再大，也会停下来。",
        "蓝色不一定冷，也可以很深。",
        "海面平静时，底下也没有停。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "only a little moonlight remains on the sea,",
          "waves sound again and again,",
          "the lighthouse is lit in the distance,",
          "the tide washes over the rocks,",
          "no one is on the beach,"
        ],
        "morning": [
          "the morning sea is very flat,",
          "waves have just touched the sand,",
          "seagulls fly past in the distance,",
          "the tide has pulled back a little,",
          "white light glows on the horizon,"
        ],
        "forenoon": [
          "the morning sea wind is light,",
          "the sea surface glitters,",
          "several lines of footprints lie on the beach,",
          "a small boat rests in the distance,",
          "the waves have not stopped,"
        ],
        "noon": [
          "the noon sea is very bright,",
          "waves are bleached white by the sun,",
          "shadows on the beach are short,",
          "someone opens a sun umbrella,",
          "the distant sea is very blue,"
        ],
        "afternoon": [
          "the afternoon sea wind picks up a little,",
          "waves push toward the shore layer by layer,",
          "footprints on the beach are washed faint,",
          "the small boat rocks in the waves,",
          "light falls on the water,"
        ],
        "evening": [
          "the evening sea takes on warm colors,",
          "the waves slowly soften,",
          "the lighthouse has just come on,",
          "people leave the beach one by one,",
          "clouds press low on the horizon,"
        ]
      },
      "quoteScenes": {
        "night": [
          "Only a little moonlight remains on the sea.",
          "Waves sound again and again.",
          "The lighthouse is lit in the distance.",
          "The tide washes over the rocks.",
          "No one is on the beach."
        ],
        "morning": [
          "The morning sea is very flat.",
          "Waves have just touched the sand.",
          "Seagulls fly past in the distance.",
          "The tide has pulled back a little.",
          "White light glows on the horizon."
        ],
        "forenoon": [
          "The morning sea wind is light.",
          "The sea surface glitters.",
          "Several lines of footprints lie on the beach.",
          "A small boat rests in the distance.",
          "The waves have not stopped."
        ],
        "noon": [
          "The noon sea is very bright.",
          "Waves are bleached white by the sun.",
          "Shadows on the beach are short.",
          "Someone opens a sun umbrella.",
          "The distant sea is very blue."
        ],
        "afternoon": [
          "The afternoon sea wind picks up a little.",
          "Waves push toward the shore layer by layer.",
          "Footprints on the beach are washed faint.",
          "The small boat rocks in the waves.",
          "Light falls on the water."
        ],
        "evening": [
          "The evening sea takes on warm colors.",
          "The waves slowly soften.",
          "The lighthouse has just come on.",
          "People leave the beach one by one.",
          "Clouds press low on the horizon."
        ]
      },
      "greetTails": [
        "may the waves carry your worries away and leave a little blue 🌊",
        "may you have a quiet shore by the deep sea 🐚",
        "may today’s wind bring only sea salt and good news 🌬️",
        "may you find your direction just as the lighthouse comes on 🗼",
        "may your footprints still be on the beach after the tide pulls back 👣",
        "however deep the sea, may a beam of light still reach down 💙"
      ],
      "quoteTails": [
        "The sea does not explain; it answers with waves.",
        "When the tide pulls back, the beach shows its own shape.",
        "The lighthouse does not chase ships; it just stands and shines.",
        "However strong the sea wind, it will stop.",
        "Blue does not have to be cold; it can be deep.",
        "When the sea is calm, the depths have not stopped."
      ]
    }
  },
  "blackgold": {
    "counts": {
      "greet": 30,
      "quote": 30
    },
    "zh": {
      "greetScenes": {
        "night": [
          "黑色的桌面上有一道金光，",
          "夜里的灯只开了一盏，",
          "金色的线条在墙上延伸，",
          "窗外的城市暗下来，",
          "一杯酒放在桌边，"
        ],
        "morning": [
          "清晨的光落进黑色房间，",
          "金色的杯沿亮了一下，",
          "窗帘拉开一半，",
          "桌面上的金线很清楚，",
          "房间里很安静，"
        ],
        "forenoon": [
          "上午的房间光线很薄，",
          "黑色墙面上有一道金边，",
          "金色的摆件放在柜子上，",
          "有人从走廊经过，",
          "窗帘被风吹起一角，"
        ],
        "noon": [
          "中午的光落在黑色桌面上，",
          "金色的餐具摆好，",
          "房间里有一点暖光，",
          "窗外的声音远了，",
          "金色的影子落在地毯上，"
        ],
        "afternoon": [
          "下午的光斜进房间，",
          "黑色墙面把光压暗，",
          "金色的线条更亮了，",
          "桌上的茶还温着，",
          "走廊尽头有一盏小灯，"
        ],
        "evening": [
          "傍晚的房间亮起一盏灯，",
          "金色和黑色分不清边界，",
          "窗外的城市开始亮，",
          "酒杯放在桌边，",
          "房间慢慢沉进夜里，"
        ]
      },
      "quoteScenes": {
        "night": [
          "黑色的桌面上有一道金光。",
          "夜里的灯只开了一盏。",
          "金色的线条在墙上延伸。",
          "窗外的城市暗下来。",
          "一杯酒放在桌边。"
        ],
        "morning": [
          "清晨的光落进黑色房间。",
          "金色的杯沿亮了一下。",
          "窗帘拉开一半。",
          "桌面上的金线很清楚。",
          "房间里很安静。"
        ],
        "forenoon": [
          "上午的房间光线很薄。",
          "黑色墙面上有一道金边。",
          "金色的摆件放在柜子上。",
          "有人从走廊经过。",
          "窗帘被风吹起一角。"
        ],
        "noon": [
          "中午的光落在黑色桌面上。",
          "金色的餐具摆好。",
          "房间里有一点暖光。",
          "窗外的声音远了。",
          "金色的影子落在地毯上。"
        ],
        "afternoon": [
          "下午的光斜进房间。",
          "黑色墙面把光压暗。",
          "金色的线条更亮了。",
          "桌上的茶还温着。",
          "走廊尽头有一盏小灯。"
        ],
        "evening": [
          "傍晚的房间亮起一盏灯。",
          "金色和黑色分不清边界。",
          "窗外的城市开始亮。",
          "酒杯放在桌边。",
          "房间慢慢沉进夜里。"
        ]
      },
      "greetTails": [
        "愿黑夜再深，也有一道金光为你留着 ✨",
        "愿你不必耀眼，也能被看见 🖤",
        "愿今天的光，落在你最想被照亮的地方 🌙",
        "愿黑色替你藏起疲惫，金色替你留下体面 🥂",
        "愿你在暗处，也走得很稳 👞",
        "愿夜色沉下来时，你的心还是亮的 🕯️"
      ],
      "quoteTails": [
        "黑和金放在一起，才知道光有多贵。",
        "夜越暗，金色越清楚。",
        "低调不是没有光，只是不吵。",
        "有些体面，只在夜里才看得见。",
        "黑不会吞掉光，只会把它衬出来。",
        "真正亮的东西，不用喊。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "a streak of gold lies on the black table,",
          "only one lamp is on at night,",
          "gold lines stretch across the wall,",
          "the city outside darkens,",
          "a glass of wine sits by the table,"
        ],
        "morning": [
          "morning light falls into the black room,",
          "the gold rim of the cup flashes once,",
          "half the curtain is drawn open,",
          "the gold line on the desk is clear,",
          "the room is very quiet,"
        ],
        "forenoon": [
          "the room light is thin in the late morning,",
          "a gold edge runs along the black wall,",
          "a gold ornament sits on the cabinet,",
          "someone passes in the corridor,",
          "a corner of the curtain lifts in the wind,"
        ],
        "noon": [
          "noon light falls on the black tabletop,",
          "gold tableware is set,",
          "a little warm light fills the room,",
          "sounds outside have faded,",
          "a gold shadow falls on the carpet,"
        ],
        "afternoon": [
          "afternoon light slants into the room,",
          "the black wall presses the light down,",
          "gold lines grow brighter,",
          "the tea on the table is still warm,",
          "a small lamp burns at the end of the corridor,"
        ],
        "evening": [
          "one lamp comes on in the evening,",
          "gold and black lose their border,",
          "the city outside begins to light up,",
          "a wine glass sits by the table,",
          "the room slowly sinks into night,"
        ]
      },
      "quoteScenes": {
        "night": [
          "A streak of gold lies on the black table.",
          "Only one lamp is on at night.",
          "Gold lines stretch across the wall.",
          "The city outside darkens.",
          "A glass of wine sits by the table."
        ],
        "morning": [
          "Morning light falls into the black room.",
          "The gold rim of the cup flashes once.",
          "Half the curtain is drawn open.",
          "The gold line on the desk is clear.",
          "The room is very quiet."
        ],
        "forenoon": [
          "The room light is thin in the late morning.",
          "A gold edge runs along the black wall.",
          "A gold ornament sits on the cabinet.",
          "Someone passes in the corridor.",
          "A corner of the curtain lifts in the wind."
        ],
        "noon": [
          "Noon light falls on the black tabletop.",
          "Gold tableware is set.",
          "A little warm light fills the room.",
          "Sounds outside have faded.",
          "A gold shadow falls on the carpet."
        ],
        "afternoon": [
          "Afternoon light slants into the room.",
          "The black wall presses the light down.",
          "Gold lines grow brighter.",
          "The tea on the table is still warm.",
          "A small lamp burns at the end of the corridor."
        ],
        "evening": [
          "One lamp comes on in the evening.",
          "Gold and black lose their border.",
          "The city outside begins to light up.",
          "A wine glass sits by the table.",
          "The room slowly sinks into night."
        ]
      },
      "greetTails": [
        "however deep the night, may a streak of gold remain for you ✨",
        "may you be seen without having to dazzle 🖤",
        "may today’s light fall where you most want to be lit 🌙",
        "may black hide your tiredness and gold keep your dignity 🥂",
        "may you walk steadily even in the dark 👞",
        "as the night settles, may your heart stay bright 🕯️"
      ],
      "quoteTails": [
        "Only when black and gold sit together do you see how precious light is.",
        "The darker the night, the clearer the gold.",
        "Understatement is not a lack of light; it is simply quiet.",
        "Some dignity is visible only at night.",
        "Black does not swallow light; it sets it off.",
        "What truly shines does not need to shout."
      ]
    }
  },
  "honey": {
    "zh": {
      "greetScenes": {
        "night": [
          "蜂蜜罐的盖子还开着，",
          "厨房里留着一股甜香，",
          "桌上的蜂蜜水还温着，",
          "蜂巢的影子落在墙上，",
          "烤箱里还有一盘点心，"
        ],
        "morning": [
          "蜂蜜水刚冲好，",
          "面包上抹了一层蜂蜜，",
          "蜂巢放在窗边，",
          "厨房里飘着甜味，",
          "一杯温牛奶加了蜂蜜，"
        ],
        "forenoon": [
          "上午的蜂蜜茶刚泡好，",
          "桌上的蜂巢切了一小块，",
          "烤盘里的饼干刚出炉，",
          "蜂蜜罐放在手边，",
          "空气里有一点花香和甜味，"
        ],
        "noon": [
          "午饭后的蜂蜜水端上桌，",
          "一块蜂蜜蛋糕切好了，",
          "蜂巢放在盘子里，",
          "中午的厨房甜香还没散，",
          "一杯茶里加了一点蜜，"
        ],
        "afternoon": [
          "下午的蜂蜜点心刚出炉，",
          "桌上的蜂蜜茶还温着，",
          "蜂巢在阳光下透亮，",
          "烤箱里留着甜味，",
          "蜂蜜罐的勺子放在一边，"
        ],
        "evening": [
          "晚饭后的蜂蜜水倒好了，",
          "厨房里还有一点甜香，",
          "桌上的蜂巢收了一半，",
          "烤箱的灯刚熄，",
          "一杯热牛奶加了蜂蜜，"
        ]
      },
      "quoteScenes": {
        "night": [
          "蜂蜜罐的盖子还开着。",
          "厨房里留着一股甜香。",
          "桌上的蜂蜜水还温着。",
          "蜂巢的影子落在墙上。",
          "烤箱里还有一盘点心。"
        ],
        "morning": [
          "蜂蜜水刚冲好。",
          "面包上抹了一层蜂蜜。",
          "蜂巢放在窗边。",
          "厨房里飘着甜味。",
          "一杯温牛奶加了蜂蜜。"
        ],
        "forenoon": [
          "上午的蜂蜜茶刚泡好。",
          "桌上的蜂巢切了一小块。",
          "烤盘里的饼干刚出炉。",
          "蜂蜜罐放在手边。",
          "空气里有花香和甜味。"
        ],
        "noon": [
          "午饭后的蜂蜜水端上桌。",
          "一块蜂蜜蛋糕切好了。",
          "蜂巢放在盘子里。",
          "中午的厨房甜香还没散。",
          "一杯茶里加了一点蜜。"
        ],
        "afternoon": [
          "下午的蜂蜜点心刚出炉。",
          "桌上的蜂蜜茶还温着。",
          "蜂巢在阳光下透亮。",
          "烤箱里留着甜味。",
          "蜂蜜罐的勺子放在一边。"
        ],
        "evening": [
          "晚饭后的蜂蜜水倒好了。",
          "厨房里还有一点甜香。",
          "桌上的蜂巢收了一半。",
          "烤箱的灯刚熄。",
          "一杯热牛奶加了蜂蜜。"
        ]
      },
      "greetTails": [
        "愿你的日子像蜂蜜一样，慢慢甜起来 🍯",
        "记得给自己冲一杯温热的蜂蜜水 🥛",
        "愿今天的辛苦，被一点甜轻轻盖过去 🍰",
        "愿你有面包、有蜂蜜，也有一顿安稳的饭 🍞",
        "愿蜂巢里的甜，刚好够你今天用 🐝",
        "愿你的心情像蜂蜜一样，稠稠地暖着 🍯",
        "愿今天有一块蜂蜜点心，专门留给你 🍪",
        "愿花香和甜味，都在你身边绕一圈 🌼",
        "愿你不慌不忙，把今天慢慢酿成甜的 🐝",
        "愿你的生活有蜜，也有暖光 🍯"
      ],
      "quoteTails": [
        "蜂蜜要慢慢酿，日子也要慢慢甜。",
        "一勺蜂蜜，能把白水变得有滋味。",
        "蜂巢的甜，是很多次来回换来的。",
        "甜不用太多，一点点就够。",
        "面包抹上蜂蜜，早餐就有了仪式感。",
        "花开的时候，蜜蜂没有闲着。",
        "慢慢酿的东西，往往最香。",
        "今天苦一点，明天可以加一勺蜜。",
        "有甜的时候，记得尝出来。",
        "蜂蜜不会说话，却能把人哄好。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "the honey jar lid is still open,",
          "a sweet scent remains in the kitchen,",
          "honey water on the table is still warm,",
          "the honeycomb shadow falls on the wall,",
          "a plate of snacks is still in the oven,"
        ],
        "morning": [
          "honey water has just been made,",
          "honey is spread on the bread,",
          "a honeycomb sits by the window,",
          "a sweet scent drifts in the kitchen,",
          "honey has been added to warm milk,"
        ],
        "forenoon": [
          "morning honey tea has just been brewed,",
          "a small piece of honeycomb is cut on the table,",
          "cookies on the tray have just come out,",
          "the honey jar sits at hand,",
          "there is a little flower and honey scent in the air,"
        ],
        "noon": [
          "after-lunch honey water is on the table,",
          "a piece of honey cake is cut,",
          "honeycomb sits on the plate,",
          "the noon kitchen still smells sweet,",
          "a little honey has been added to the tea,"
        ],
        "afternoon": [
          "afternoon honey snacks have just come out,",
          "honey tea on the table is still warm,",
          "honeycomb is translucent in the sun,",
          "a sweet scent remains in the oven,",
          "the honey spoon rests to one side,"
        ],
        "evening": [
          "after-dinner honey water is poured,",
          "a little sweet scent remains in the kitchen,",
          "half the honeycomb is put away,",
          "the oven light has just gone out,",
          "honey has been added to warm milk,"
        ]
      },
      "quoteScenes": {
        "night": [
          "The honey jar lid is still open.",
          "A sweet scent remains in the kitchen.",
          "Honey water on the table is still warm.",
          "The honeycomb shadow falls on the wall.",
          "A plate of snacks is still in the oven."
        ],
        "morning": [
          "Honey water has just been made.",
          "Honey is spread on the bread.",
          "A honeycomb sits by the window.",
          "A sweet scent drifts in the kitchen.",
          "Honey has been added to warm milk."
        ],
        "forenoon": [
          "Morning honey tea has just been brewed.",
          "A small piece of honeycomb is cut on the table.",
          "Cookies on the tray have just come out.",
          "The honey jar sits at hand.",
          "There is a flower and honey scent in the air."
        ],
        "noon": [
          "After-lunch honey water is on the table.",
          "A piece of honey cake is cut.",
          "Honeycomb sits on the plate.",
          "The noon kitchen still smells sweet.",
          "A little honey has been added to the tea."
        ],
        "afternoon": [
          "Afternoon honey snacks have just come out.",
          "Honey tea on the table is still warm.",
          "Honeycomb is translucent in the sun.",
          "A sweet scent remains in the oven.",
          "The honey spoon rests to one side."
        ],
        "evening": [
          "After-dinner honey water is poured.",
          "A little sweet scent remains in the kitchen.",
          "Half the honeycomb is put away.",
          "The oven light has just gone out.",
          "Honey has been added to warm milk."
        ]
      },
      "greetTails": [
        "may your days sweeten slowly, like honey 🍯",
        "remember to make yourself a cup of warm honey water 🥛",
        "may a little sweetness gently cover today’s hard work 🍰",
        "may you have bread, honey, and a steady meal 🍞",
        "may the sweetness in the honeycomb be just enough for today 🐝",
        "may your mood stay warm and thick like honey 🍯",
        "may one honey snack today be saved just for you 🍪",
        "may flower scent and sweetness circle around you 🌼",
        "may you take your time and let today slowly turn sweet 🐝",
        "may your life have honey and warm light 🍯"
      ],
      "quoteTails": [
        "Honey is made slowly; days sweeten slowly too.",
        "One spoon of honey gives plain water flavor.",
        "The sweetness of honeycomb comes from many trips back and forth.",
        "Sweetness does not need much; a little is enough.",
        "Honey on bread gives breakfast a small ceremony.",
        "When flowers bloom, bees are not idle.",
        "Things made slowly are often the most fragrant.",
        "If today is bitter, tomorrow can take another spoon of honey.",
        "When there is sweetness, remember to taste it.",
        "Honey cannot speak, but it can coax a person."
      ]
    },
    "counts": {
      "greet": 50,
      "quote": 50
    }
  },
  "autumn": {
    "counts": {
      "greet": 40,
      "quote": 40
    },
    "zh": {
      "greetScenes": {
        "night": [
          "窗外的风把落叶吹到墙边，",
          "屋里的灯照着一杯热茶，",
          "栗子壳放在桌上，",
          "夜里的凉意从窗缝进来，",
          "院子里的树影轻轻晃，"
        ],
        "morning": [
          "清晨的雾还没散，",
          "地上的落叶被扫成一堆，",
          "窗台上放着一杯热茶，",
          "院子里的柿子红了一点，",
          "空气里有一点凉，"
        ],
        "forenoon": [
          "阳光把落叶照得发亮，",
          "风从半开的窗里进来，",
          "桌上的茶还温着，",
          "路边的银杏落了一地，",
          "有人把外套的领子竖起来，"
        ],
        "noon": [
          "中午的阳光落在枯叶上，",
          "饭后的茶刚倒好，",
          "院子里的风小了一点，",
          "窗外的树影短短地落着，",
          "桌边放着几个刚摘的柿子，"
        ],
        "afternoon": [
          "下午的风把叶子吹得沙沙响，",
          "阳光斜斜地照进屋里，",
          "茶已经续了第二杯，",
          "路边的落叶被踩出声音，",
          "远处的树梢空了一半，"
        ],
        "evening": [
          "天色暗下来，风更凉了，",
          "屋里的灯照着桌上的热汤，",
          "落叶堆在门口，",
          "远处的树影慢慢模糊，",
          "晚饭的香气混着秋夜的风，"
        ]
      },
      "quoteScenes": {
        "night": [
          "风把落叶吹到墙边。",
          "灯下放着一杯热茶。",
          "栗子壳留在桌上。",
          "夜里的凉意进了窗。",
          "院子里的树影轻轻晃。"
        ],
        "morning": [
          "清晨的雾还没散。",
          "落叶被扫成一堆。",
          "窗台上放着一杯热茶。",
          "院子里的柿子红了一点。",
          "空气里有一点凉。"
        ],
        "forenoon": [
          "阳光把落叶照得发亮。",
          "风从半开的窗里进来。",
          "桌上的茶还温着。",
          "路边的银杏落了一地。",
          "有人把外套领子竖起来。"
        ],
        "noon": [
          "中午的阳光落在枯叶上。",
          "饭后的茶刚倒好。",
          "院子里的风小了一点。",
          "窗外的树影短短地落着。",
          "桌边放着几个刚摘的柿子。"
        ],
        "afternoon": [
          "下午的风吹得叶子沙沙响。",
          "阳光斜斜地照进屋里。",
          "茶已经续了第二杯。",
          "路边的落叶被踩出声音。",
          "远处的树梢空了一半。"
        ],
        "evening": [
          "天色暗下来，风更凉了。",
          "灯照着桌上的热汤。",
          "落叶堆在门口。",
          "远处的树影慢慢模糊。",
          "晚饭的香气混着秋夜的风。"
        ]
      },
      "greetTails": [
        "愿一阵秋风，替你把烦躁吹散一些 🍂",
        "愿你有热茶、有栗子，也有一点点闲 🍵",
        "愿这个秋天，收成和你都刚刚好 🌾",
        "天凉了，记得添件外套，也记得照顾好自己 🧣",
        "愿落叶铺成柔软的路，你走得从容 🍁",
        "愿秋风只带走烦恼，留下你喜欢的东西 🍃",
        "愿你在秋天里，收获一点踏实的甜 🌰",
        "愿傍晚的凉意，不打扰你手里的热茶 🍵",
        "愿这个季节的金色，也落在你的肩上 ✨",
        "愿你有时间看落叶，也有时间好好吃饭 🍁"
      ],
      "quoteTails": [
        "秋天就有了形状。",
        "热茶就有了意义。",
        "日子就有了着落。",
        "时间也慢了下来。",
        "心也可以松一松。",
        "收获不必太满。",
        "风一凉，人就容易想起家。",
        "落叶也知道，该放手的时候要放手。",
        "秋天适合把脚步放轻。",
        "金色的季节，适合好好吃饭。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "the wind pushes fallen leaves against the wall,",
          "the lamp shines on a cup of hot tea,",
          "chestnut shells sit on the table,",
          "the night chill enters through the window gap,",
          "the tree shadows in the yard sway gently,"
        ],
        "morning": [
          "the morning mist has not lifted,",
          "fallen leaves are swept into a pile,",
          "a cup of hot tea sits on the windowsill,",
          "the persimmons in the yard have turned a little red,",
          "there is a chill in the air,"
        ],
        "forenoon": [
          "sunlight brightens the fallen leaves,",
          "wind comes through the half-open window,",
          "the tea on the table is still warm,",
          "ginkgo leaves cover the roadside,",
          "someone turns up a coat collar,"
        ],
        "noon": [
          "the noon sun falls on dry leaves,",
          "the after-meal tea has just been poured,",
          "the wind in the yard has died down a little,",
          "short tree shadows fall outside the window,",
          "a few freshly picked persimmons sit by the table,"
        ],
        "afternoon": [
          "the afternoon wind rustles the leaves,",
          "sunlight slants into the room,",
          "the tea has been refilled a second time,",
          "fallen leaves crunch under footsteps,",
          "half the distant treetops are bare,"
        ],
        "evening": [
          "the sky darkens and the wind turns cooler,",
          "the lamp shines on hot soup,",
          "fallen leaves gather at the door,",
          "the distant trees blur slowly,",
          "dinner scent mixes with the autumn night wind,"
        ]
      },
      "quoteScenes": {
        "night": [
          "The wind pushes leaves against the wall.",
          "A cup of hot tea sits under the lamp.",
          "Chestnut shells remain on the table.",
          "The night chill enters through the window.",
          "The tree shadows in the yard sway gently."
        ],
        "morning": [
          "The morning mist has not lifted.",
          "Fallen leaves are swept into a pile.",
          "A cup of hot tea sits on the windowsill.",
          "The persimmons in the yard have turned a little red.",
          "There is a chill in the air."
        ],
        "forenoon": [
          "Sunlight brightens the fallen leaves.",
          "Wind comes through the half-open window.",
          "The tea on the table is still warm.",
          "Ginkgo leaves cover the roadside.",
          "Someone turns up a coat collar."
        ],
        "noon": [
          "The noon sun falls on dry leaves.",
          "The after-meal tea has just been poured.",
          "The wind in the yard has died down a little.",
          "Short tree shadows fall outside the window.",
          "A few freshly picked persimmons sit by the table."
        ],
        "afternoon": [
          "The afternoon wind rustles the leaves.",
          "Sunlight slants into the room.",
          "The tea has been refilled a second time.",
          "Fallen leaves crunch under footsteps.",
          "Half the distant treetops are bare."
        ],
        "evening": [
          "The sky darkens and the wind turns cooler.",
          "The lamp shines on hot soup.",
          "Fallen leaves gather at the door.",
          "The distant trees blur slowly.",
          "Dinner scent mixes with the autumn night wind."
        ]
      },
      "greetTails": [
        "may a gust of autumn wind blow some of your restlessness away 🍂",
        "may you have hot tea, chestnuts, and a little leisure 🍵",
        "may this autumn’s harvest and you both be just right 🌾",
        "it is cooler now — add a coat and take care of yourself 🧣",
        "may fallen leaves pave a soft road and you walk at ease 🍁",
        "may the autumn wind take only your worries and leave what you love 🍃",
        "may you harvest a little solid sweetness this autumn 🌰",
        "may the evening chill not disturb the hot tea in your hand 🍵",
        "may this season’s gold rest on your shoulders too ✨",
        "may you have time for the leaves and time to eat well 🍁"
      ],
      "quoteTails": [
        "autumn takes shape.",
        "hot tea begins to mean something.",
        "the days find their footing.",
        "time slows down too.",
        "the heart can loosen a little.",
        "the harvest does not have to be full.",
        "when the wind cools, people think of home.",
        "leaves know when to let go.",
        "autumn is for lighter steps.",
        "the golden season is for eating well."
      ]
    }
  },
  "winter": {
    "counts": {
      "greet": 40,
      "quote": 40
    },
    "zh": {
      "greetScenes": {
        "night": [
          "窗玻璃上结了一层薄霜，",
          "屋里的暖气还开着，",
          "外面的雪落得很轻，",
          "路灯照着雪地，",
          "热汤在桌上冒着白气，"
        ],
        "morning": [
          "清晨的窗上全是霜花，",
          "外面的雪把路盖住了，",
          "屋里的灯刚亮，",
          "围巾和手套放在门口，",
          "热水壶刚烧开，"
        ],
        "forenoon": [
          "阳光照在雪地上，",
          "窗台上的霜化了一点，",
          "屋里的暖气烘着，",
          "外面有人踩着雪走过，",
          "桌上的热茶还冒着气，"
        ],
        "noon": [
          "中午的雪停了，",
          "屋檐下挂着几根冰凌，",
          "屋里的饭刚端上桌，",
          "窗外的雪地被光照亮，",
          "热汤的雾气糊了窗，"
        ],
        "afternoon": [
          "下午的雪又下起来，",
          "窗外的路很快白了，",
          "屋里的灯亮得早，",
          "热可可放在手边，",
          "屋檐上的雪积了一层，"
        ],
        "evening": [
          "天色暗得很早，",
          "窗外的雪还在下，",
          "屋里的灯显得格外暖，",
          "晚饭的热气从厨房出来，",
          "长夜刚刚开始，"
        ]
      },
      "quoteScenes": {
        "night": [
          "薄霜结在窗玻璃上。",
          "屋里的暖气还开着。",
          "雪在外面轻轻落。",
          "路灯照着雪地。",
          "热汤在桌上冒着白气。"
        ],
        "morning": [
          "清晨的窗上全是霜花。",
          "雪把路盖住了。",
          "屋里的灯刚亮。",
          "围巾和手套放在门口。",
          "热水壶刚烧开。"
        ],
        "forenoon": [
          "阳光照在雪地上。",
          "窗台上的霜化了一点。",
          "屋里的暖气烘着。",
          "外面有人踩着雪走过。",
          "桌上的热茶还冒着气。"
        ],
        "noon": [
          "中午的雪停了。",
          "屋檐下挂着冰凌。",
          "饭刚端上桌。",
          "窗外的雪地被光照亮。",
          "热汤的雾气糊了窗。"
        ],
        "afternoon": [
          "下午的雪又下起来。",
          "窗外的路很快白了。",
          "屋里的灯亮得早。",
          "热可可放在手边。",
          "屋檐上的雪积了一层。"
        ],
        "evening": [
          "天色暗得很早。",
          "窗外的雪还在下。",
          "屋里的灯显得格外暖。",
          "晚饭的热气从厨房出来。",
          "长夜刚刚开始。"
        ]
      },
      "greetTails": [
        "愿屋里的暖光，替你把寒意挡在门外 ❄️",
        "记得围好围巾，也记得给自己倒杯热的 🧣",
        "愿这个冬天，有人问你冷不冷，也有人陪你吃饭 ☕",
        "雪落得再慢，也总会积成一片安静 ⛄",
        "愿长夜有灯，冷天有热汤 🍲",
        "愿霜花只在窗上，不在你心里 ❄️",
        "愿你有厚外套、有热可可，也有好睡眠 🧦",
        "愿冬天的风，只吹来清清醒醒的好消息 🌬️",
        "愿雪停以后，路好走，心也轻一点 ⛄",
        "愿这个冬天不太冷，至少你身边有暖 🧣"
      ],
      "quoteTails": [
        "世界就安静了一半。",
        "屋里的灯就显得更暖。",
        "长夜就有了去处。",
        "清晨也轻了下来。",
        "心也可以慢慢收拢。",
        "冷天里，热汤最懂人。",
        "雪把声音藏起来，正好休息。",
        "冬天不催人，春天会来。",
        "围巾和热可可，都是冬天的好脾气。",
        "霜会化，路会开。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "thin frost covers the window glass,",
          "the heating is still on,",
          "snow falls softly outside,",
          "the streetlight shines on the snow,",
          "hot soup steams on the table,"
        ],
        "morning": [
          "frost flowers cover the morning window,",
          "snow has covered the road,",
          "the light inside has just come on,",
          "scarves and gloves wait by the door,",
          "the kettle has just boiled,"
        ],
        "forenoon": [
          "sunlight falls on the snow,",
          "the frost on the windowsill has melted a little,",
          "the heating warms the room,",
          "someone walks through the snow outside,",
          "hot tea still steams on the table,"
        ],
        "noon": [
          "the snow has stopped at noon,",
          "icicles hang from the eaves,",
          "the meal has just been set on the table,",
          "the snow outside is bright in the light,",
          "steam from the soup fogs the window,"
        ],
        "afternoon": [
          "snow starts again in the afternoon,",
          "the road outside turns white quickly,",
          "the light indoors comes on early,",
          "hot cocoa sits at hand,",
          "a layer of snow gathers on the eaves,"
        ],
        "evening": [
          "darkness comes early,",
          "snow is still falling outside,",
          "the light indoors looks especially warm,",
          "dinner steam comes from the kitchen,",
          "the long night has just begun,"
        ]
      },
      "quoteScenes": {
        "night": [
          "Thin frost covers the window glass.",
          "The heating is still on.",
          "Snow falls softly outside.",
          "The streetlight shines on the snow.",
          "Hot soup steams on the table."
        ],
        "morning": [
          "Frost flowers cover the morning window.",
          "Snow has covered the road.",
          "The light inside has just come on.",
          "Scarves and gloves wait by the door.",
          "The kettle has just boiled."
        ],
        "forenoon": [
          "Sunlight falls on the snow.",
          "The frost on the windowsill has melted a little.",
          "The heating warms the room.",
          "Someone walks through the snow outside.",
          "Hot tea still steams on the table."
        ],
        "noon": [
          "The snow has stopped at noon.",
          "Icicles hang from the eaves.",
          "The meal has just been set on the table.",
          "The snow outside is bright in the light.",
          "Steam from the soup fogs the window."
        ],
        "afternoon": [
          "Snow starts again in the afternoon.",
          "The road outside turns white quickly.",
          "The light indoors comes on early.",
          "Hot cocoa sits at hand.",
          "A layer of snow gathers on the eaves."
        ],
        "evening": [
          "Darkness comes early.",
          "Snow is still falling outside.",
          "The light indoors looks especially warm.",
          "Dinner steam comes from the kitchen.",
          "The long night has just begun."
        ]
      },
      "greetTails": [
        "may the warm light indoors keep the cold outside ❄️",
        "remember your scarf, and remember to pour yourself something hot 🧣",
        "may this winter bring someone who asks if you are cold and someone to eat with ☕",
        "however slowly snow falls, it will become a quiet layer ⛄",
        "may long nights have lamps and cold days have hot soup 🍲",
        "may the frost stay on the window, not in your heart ❄️",
        "may you have a thick coat, hot cocoa, and good sleep 🧦",
        "may the winter wind bring only clear, good news 🌬️",
        "when the snow stops, may the road be easy and the heart light ⛄",
        "may this winter not be too cold — at least there is warmth beside you 🧣"
      ],
      "quoteTails": [
        "half the world goes quiet.",
        "the lamp indoors looks warmer.",
        "the long night has somewhere to go.",
        "the morning feels lighter too.",
        "the heart can gather itself slowly.",
        "in cold weather, hot soup understands people best.",
        "snow hides the sound; it is a good time to rest.",
        "winter does not rush; spring will come.",
        "scarves and hot cocoa are winter’s good temper.",
        "frost will melt; the road will open."
      ]
    }
  },
  "springbloom": {
    "counts": {
      "greet": 40,
      "quote": 40
    },
    "zh": {
      "greetScenes": {
        "night": [
          "窗台的新芽在灯下泛绿，",
          "花枝的影子落在墙上，",
          "院子里的花合拢了花瓣，",
          "夜风带着一点花香，",
          "露水落在叶尖，"
        ],
        "morning": [
          "清晨的花瓣上还挂着露水，",
          "新芽从土里冒出来，",
          "阳光照在花枝上，",
          "院子里的鸟叫醒了花，",
          "窗台上的花刚开一朵，"
        ],
        "forenoon": [
          "上午的阳光把花瓣照透，",
          "蝴蝶停在花枝上，",
          "院子里的花又开了几朵，",
          "风吹过，花瓣轻轻摇，",
          "新芽的叶子舒展开来，"
        ],
        "noon": [
          "中午的阳光落在花丛里，",
          "花瓣被晒得有点软，",
          "院子里的影子短短的，",
          "一杯水放在花盆边，",
          "蝴蝶躲到叶子底下，"
        ],
        "afternoon": [
          "下午的光斜斜地穿过花枝，",
          "花瓣落在泥土上，",
          "院子里的风带着花香，",
          "新芽又长高了一点，",
          "花丛里有一只蜜蜂，"
        ],
        "evening": [
          "天色暗下来，花瓣慢慢合拢，",
          "院子里的灯照亮花枝，",
          "晚风把花香送到窗边，",
          "今天的最后一朵花开了，",
          "叶子上还留着一点夕阳，"
        ]
      },
      "quoteScenes": {
        "night": [
          "新芽在灯下泛绿。",
          "花枝的影子落在墙上。",
          "院子里的花合拢了花瓣。",
          "夜风带着一点花香。",
          "露水落在叶尖。"
        ],
        "morning": [
          "花瓣上还挂着露水。",
          "新芽从土里冒出来。",
          "阳光照在花枝上。",
          "院子里的鸟叫醒了花。",
          "窗台上的花刚开一朵。"
        ],
        "forenoon": [
          "阳光把花瓣照透。",
          "蝴蝶停在花枝上。",
          "院子里的花又开了几朵。",
          "风吹过，花瓣轻轻摇。",
          "新芽的叶子舒展开来。"
        ],
        "noon": [
          "阳光落在花丛里。",
          "花瓣被晒得有点软。",
          "院子里的影子短短的。",
          "一杯水放在花盆边。",
          "蝴蝶躲到叶子底下。"
        ],
        "afternoon": [
          "光斜斜地穿过花枝。",
          "花瓣落在泥土上。",
          "院子里的风带着花香。",
          "新芽又长高了一点。",
          "花丛里有一只蜜蜂。"
        ],
        "evening": [
          "天色暗下来，花瓣慢慢合拢。",
          "院子里的灯照亮花枝。",
          "晚风把花香送到窗边。",
          "今天的最后一朵花开了。",
          "叶子上还留着一点夕阳。"
        ]
      },
      "greetTails": [
        "愿新芽替你冒出头，好事一件件长出来 🌱",
        "愿春风把花香送到你手边 🌸",
        "记得像花一样，按自己的节奏慢慢开 🌷",
        "愿今天有一朵花，是专门为你开的 🦋",
        "春雨落下来时，愿你的心事也被洗轻 🍃",
        "愿你的日子有新绿，也有花开 🌿",
        "愿蝴蝶停下的地方，都有你的好心情 🦋",
        "愿你不急着盛开，也不怕慢慢来 🌱",
        "愿春风记得你的名字，也记得你的努力 🌸",
        "愿你在花开的季节里，被温柔对待 🌷"
      ],
      "quoteTails": [
        "春天就有了开头。",
        "花园就有了新的颜色。",
        "土地就多了一点养分。",
        "新绿就冒了出来。",
        "空气也轻了一点。",
        "花开有先后，你也不用急。",
        "春风记得每一颗种子。",
        "花瓣落下，也是春天的一部分。",
        "有花的地方，日子不会太硬。",
        "新芽先长根，再长叶。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "new shoots on the windowsill look green under the lamp,",
          "flower shadows fall on the wall,",
          "flowers in the yard have folded their petals,",
          "the night breeze carries a little scent,",
          "dew rests on the leaf tips,"
        ],
        "morning": [
          "dew still hangs on the morning petals,",
          "new shoots push out of the soil,",
          "sunlight falls on the flowering branches,",
          "birds in the yard wake the flowers,",
          "one flower has just opened on the windowsill,"
        ],
        "forenoon": [
          "the late-morning sun shines through the petals,",
          "a butterfly rests on the branch,",
          "a few more flowers have opened in the yard,",
          "the wind makes the petals sway,",
          "the leaves of the new shoots unfold,"
        ],
        "noon": [
          "the noon sun falls into the flower beds,",
          "the petals soften in the heat,",
          "the shadows in the yard are short,",
          "a glass of water sits by the flowerpot,",
          "a butterfly hides under a leaf,"
        ],
        "afternoon": [
          "afternoon light slants through the branches,",
          "petals fall onto the soil,",
          "the yard wind carries flower scent,",
          "the new shoots have grown a little taller,",
          "a bee is in the flower bed,"
        ],
        "evening": [
          "the sky darkens and the petals close,",
          "the yard lamp lights the branches,",
          "the evening breeze brings flower scent to the window,",
          "the last flower of the day has opened,",
          "a little sunset remains on the leaves,"
        ]
      },
      "quoteScenes": {
        "night": [
          "New shoots look green under the lamp.",
          "Flower shadows fall on the wall.",
          "Flowers in the yard have folded their petals.",
          "The night breeze carries a little scent.",
          "Dew rests on the leaf tips."
        ],
        "morning": [
          "Dew still hangs on the petals.",
          "New shoots push out of the soil.",
          "Sunlight falls on the flowering branches.",
          "Birds in the yard wake the flowers.",
          "One flower has just opened on the windowsill."
        ],
        "forenoon": [
          "Sunlight shines through the petals.",
          "A butterfly rests on the branch.",
          "A few more flowers have opened in the yard.",
          "The wind makes the petals sway.",
          "The leaves of the new shoots unfold."
        ],
        "noon": [
          "Sunlight falls into the flower beds.",
          "The petals soften in the heat.",
          "The shadows in the yard are short.",
          "A glass of water sits by the flowerpot.",
          "A butterfly hides under a leaf."
        ],
        "afternoon": [
          "Light slants through the branches.",
          "Petals fall onto the soil.",
          "The yard wind carries flower scent.",
          "The new shoots have grown a little taller.",
          "A bee is in the flower bed."
        ],
        "evening": [
          "The sky darkens and the petals close.",
          "The yard lamp lights the branches.",
          "The evening breeze brings flower scent to the window.",
          "The last flower of the day has opened.",
          "A little sunset remains on the leaves."
        ]
      },
      "greetTails": [
        "may new shoots rise for you and good things grow one by one 🌱",
        "may the spring breeze bring the scent of flowers to your hand 🌸",
        "remember to open at your own pace, like a flower 🌷",
        "may one flower today bloom especially for you 🦋",
        "when spring rain falls, may your worries be washed lighter 🍃",
        "may your days have new green and open flowers 🌿",
        "may every place a butterfly rests hold your good mood 🦋",
        "do not hurry to bloom, and do not fear going slowly 🌱",
        "may the spring wind remember your name and your effort 🌸",
        "may you be treated gently in this season of flowers 🌷"
      ],
      "quoteTails": [
        "spring has its beginning.",
        "the garden has a new color.",
        "the soil gains a little nourishment.",
        "new green comes out.",
        "the air feels a little lighter.",
        "flowers open in their own order; you do not have to hurry.",
        "the spring wind remembers every seed.",
        "fallen petals are part of spring too.",
        "where there are flowers, days are not too hard.",
        "new shoots grow roots before leaves."
      ]
    }
  },
  "summer": {
    "counts": {
      "greet": 40,
      "quote": 40
    },
    "zh": {
      "greetScenes": {
        "night": [
          "海风从窗边吹进来，",
          "白天的热气终于散了，",
          "远处的浪声一阵一阵，",
          "桌上的西瓜还剩几块，",
          "路灯下有人慢慢走过，"
        ],
        "morning": [
          "清晨的海面很亮，",
          "太阳还没把地面晒热，",
          "窗外的树影很长，",
          "桌上的水杯刚倒满，",
          "海边有一点凉风，"
        ],
        "forenoon": [
          "上午的太阳已经很晒，",
          "树荫落在门口，",
          "桌上的西瓜切好了，",
          "蝉鸣从树上传来，",
          "电扇慢慢转着，"
        ],
        "noon": [
          "中午的太阳停在头顶，",
          "饭后的人躲在树荫里，",
          "西瓜最凉的那一块刚切开，",
          "窗外的地面发亮，",
          "海风暂时停了，"
        ],
        "afternoon": [
          "下午的太阳还很足，",
          "蝉鸣把时间拉得很长，",
          "树荫下放着一把椅子，",
          "杯里的冰已经化了，",
          "远处的海面亮得刺眼，"
        ],
        "evening": [
          "傍晚的风终于凉下来，",
          "太阳落在海面上，",
          "浪声比白天清楚，",
          "桌上的西瓜只剩最后一块，",
          "路灯一盏盏亮起来，"
        ]
      },
      "quoteScenes": {
        "night": [
          "海风从窗边吹进来。",
          "白天的热气终于散了。",
          "远处的浪声一阵一阵。",
          "桌上的西瓜还剩几块。",
          "路灯下有人慢慢走过。"
        ],
        "morning": [
          "清晨的海面很亮。",
          "太阳还没把地面晒热。",
          "窗外的树影很长。",
          "桌上的水杯刚倒满。",
          "海边有一点凉风。"
        ],
        "forenoon": [
          "上午的太阳已经很晒。",
          "树荫落在门口。",
          "桌上的西瓜切好了。",
          "蝉鸣从树上传来。",
          "电扇慢慢转着。"
        ],
        "noon": [
          "中午的太阳停在头顶。",
          "饭后的人躲在树荫里。",
          "西瓜最凉的那一块刚切开。",
          "窗外的地面发亮。",
          "海风暂时停了。"
        ],
        "afternoon": [
          "下午的太阳还很足。",
          "蝉鸣把时间拉得很长。",
          "树荫下放着一把椅子。",
          "杯里的冰已经化了。",
          "远处的海面亮得刺眼。"
        ],
        "evening": [
          "傍晚的风终于凉下来。",
          "太阳落在海面上。",
          "浪声比白天清楚。",
          "桌上的西瓜只剩最后一块。",
          "路灯一盏盏亮起来。"
        ]
      },
      "greetTails": [
        "愿海风替你降温，愿今天有一点清凉 🌊",
        "记得补水，也记得给自己留一片树荫 🍉",
        "愿西瓜最甜的那一口，刚好留给你 🍉",
        "太阳很大，你可以慢慢走 ☀️",
        "愿傍晚的浪声，把一天的燥热带走 🐚",
        "愿你有冰饮、有海风，也有一张舒服的椅子 🧊",
        "愿夏天的光，只晒暖你，不晒烦你 ☀️",
        "愿你在蝉鸣里，也能找到一点安静 🌿",
        "愿今天的热，被一场晚风轻轻化解 🌊",
        "愿海边和树荫，都离你不远 🐚"
      ],
      "quoteTails": [
        "夏天就亮了起来。",
        "岸边就安静下来。",
        "夏天就到了最甜的地方。",
        "时间也慢了下来。",
        "海还在轻轻响。",
        "热归热，傍晚总会来。",
        "海风一吹，心事就散一点。",
        "西瓜要冰，日子要慢。",
        "蝉鸣很吵，但夏天就是这样。",
        "太阳落下，海还亮着。"
      ]
    },
    "en": {
      "greetScenes": {
        "night": [
          "the sea breeze comes through the window,",
          "the heat of the day has finally gone,",
          "waves sound in the distance,",
          "a few slices of watermelon remain on the table,",
          "someone walks slowly under the streetlight,"
        ],
        "morning": [
          "the morning sea is bright,",
          "the sun has not yet heated the ground,",
          "the tree shadows outside are long,",
          "the glass on the table has just been filled,",
          "there is a little cool wind by the sea,"
        ],
        "forenoon": [
          "the late-morning sun is already strong,",
          "shade falls at the doorway,",
          "the watermelon on the table is cut,",
          "cicadas sound from the trees,",
          "the fan turns slowly,"
        ],
        "noon": [
          "the noon sun stands overhead,",
          "after lunch people hide in the shade,",
          "the coolest slice of watermelon has just been cut,",
          "the ground outside is bright,",
          "the sea breeze has stopped for now,"
        ],
        "afternoon": [
          "the afternoon sun is still strong,",
          "cicadas stretch the time,",
          "a chair sits in the shade,",
          "the ice in the glass has melted,",
          "the distant sea is dazzling,"
        ],
        "evening": [
          "the evening wind finally cools,",
          "the sun falls onto the sea,",
          "waves sound clearer than in the day,",
          "only the last slice of watermelon is left,",
          "streetlights come on one by one,"
        ]
      },
      "quoteScenes": {
        "night": [
          "The sea breeze comes through the window.",
          "The heat of the day has finally gone.",
          "Waves sound in the distance.",
          "A few slices of watermelon remain on the table.",
          "Someone walks slowly under the streetlight."
        ],
        "morning": [
          "The morning sea is bright.",
          "The sun has not yet heated the ground.",
          "The tree shadows outside are long.",
          "The glass on the table has just been filled.",
          "There is a little cool wind by the sea."
        ],
        "forenoon": [
          "The late-morning sun is already strong.",
          "Shade falls at the doorway.",
          "The watermelon on the table is cut.",
          "Cicadas sound from the trees.",
          "The fan turns slowly."
        ],
        "noon": [
          "The noon sun stands overhead.",
          "After lunch people hide in the shade.",
          "The coolest slice of watermelon has just been cut.",
          "The ground outside is bright.",
          "The sea breeze has stopped for now."
        ],
        "afternoon": [
          "The afternoon sun is still strong.",
          "Cicadas stretch the time.",
          "A chair sits in the shade.",
          "The ice in the glass has melted.",
          "The distant sea is dazzling."
        ],
        "evening": [
          "The evening wind finally cools.",
          "The sun falls onto the sea.",
          "Waves sound clearer than in the day.",
          "Only the last slice of watermelon is left.",
          "Streetlights come on one by one."
        ]
      },
      "greetTails": [
        "may the sea breeze cool you and bring a little freshness today 🌊",
        "remember water, and save yourself a patch of shade 🍉",
        "may the sweetest bite of watermelon be saved for you 🍉",
        "the sun is strong; you can walk slowly ☀️",
        "may the sound of evening waves carry away the day’s heat 🐚",
        "may you have a cold drink, a sea breeze, and a comfortable chair 🧊",
        "may summer light only warm you, never annoy you ☀️",
        "may you find a little quiet among the cicadas 🌿",
        "may an evening breeze soften today’s heat 🌊",
        "may the sea and the shade never be far from you 🐚"
      ],
      "quoteTails": [
        "summer lights up.",
        "the shore quiets down.",
        "summer reaches its sweetest place.",
        "time slows down too.",
        "the sea is still softly sounding.",
        "hot as it is, evening always comes.",
        "one sea breeze and worries scatter a little.",
        "watermelon should be cold; days should be slow.",
        "cicadas are loud, but that is summer.",
        "after the sun sets, the sea still shines."
      ]
    }
  }
};

  function buildLines(prefixes, scenes, tails, count, space) {
    const out = [];
    for (let t = 0; t < tails.length && out.length < count; t++) {
      for (let s = 0; s < scenes.length && out.length < count; s++) {
        const p = (t + s) % prefixes.length;
        out.push(space ? prefixes[p] + ' ' + scenes[s] + ' ' + tails[t] : prefixes[p] + scenes[s] + tails[t]);
      }
    }
    return out;
  }

  const zh = {};
  const en = {};
  Object.keys(seriesData).forEach((series) => {
    const data = seriesData[series];
    const zhGreetings = {};
    const zhQuotes = {};
    const enGreetings = {};
    const enQuotes = {};
    periods.forEach((period) => {
      zhGreetings[period] = buildLines(
        timePrefix.zh.greet[period], data.zh.greetScenes[period], data.zh.greetTails, data.counts.greet, false
      );
      zhQuotes[period] = buildLines(
        timePrefix.zh.quote[period], data.zh.quoteScenes[period], data.zh.quoteTails, data.counts.quote, false
      );
      enGreetings[period] = buildLines(
        timePrefix.en.greet[period], data.en.greetScenes[period], data.en.greetTails, data.counts.greet, true
      );
      enQuotes[period] = buildLines(
        timePrefix.en.quote[period], data.en.quoteScenes[period], data.en.quoteTails, data.counts.quote, true
      );
    });
    zh[series] = { greetings: zhGreetings, quotes: zhQuotes };
    en[series] = { greetings: enGreetings, quotes: enQuotes };
  });
  window.BB_THEME_HOME_TEXT = { zh, en };
})();
