// interaction.js 情緒引擎-情緒轉譯器參數

import * as THREE from 'three';

// 建立情緒光譜對應表
const EMOTION_MAP = {
    // --- 正面情緒系列：明亮、遼闊、溫暖 ---
    '快樂': { v: 0.8,  a: 0.6,  hue: 55,  s: 18, range: 450 }, // 亮黃色
    '幸福': { v: 0.5,  a: 0.3,  hue: 45,  s: 16, range: 400 }, // 暖橘黃
    '開心': { v: 0.8,  a: 0.5,  hue: 60,  s: 15, range: 420 }, // 金黃色
    '暖暖的': { v: 0.7, a: 0.1,  hue: 40,  s: 14, range: 380 }, // 柔和橘
    '期待': { v: 0.6,  a: 0.5,  hue: 35,  s: 16, range: 500 }, // 琥珀色
    '興奮': { v: 0.9,  a: 0.9,  hue: 25,  s: 22, range: 650 }, // 亮橘色
    '激動': { v: 0.8,  a: 1.5,  hue: 30,  s: 25, range: 800 }, // 鮮橘色
    '振奮': { v: 1.0,  a: 1.2,  hue: 200, s: 24, range: 750 }, // 亮青白
    '大笑': { v: 1.0,  a: 0.9,  hue: 50,  s: 26, range: 850 }, // 亮金黃
    '驚喜': { v: 0.8,  a: 0.8,  hue: 45,  s: 20, range: 600 }, // 鵝黃色
    '勇氣': { v: 0.9,  a: 0.7,  hue: 190, s: 20, range: 550 }, // 亮青色

    // --- 溫柔/深層情緒系列：柔和、紫色調、流動感 ---
    '喜歡': { v: 0.9,  a: 0.5,  hue: 340, s: 18, range: 400 }, // 玫瑰粉
    '愛':   { v: 0.9,  a: 0.2,  hue: 350, s: 20, range: 450 }, // 玫瑰紅
    '可愛': { v: 0.8,  a: 0.4,  hue: 330, s: 15, range: 350 }, // 淺粉色
    '溫暖': { v: 0.9,  a: 0.1,  hue: 35,  s: 16, range: 380 }, // 暖琥珀
    '平靜': { v: 0.5,  a: -0.2, hue: 40,  s: 12, range: 350 }, // 暖琥珀色
    '思念': { v: 0.2,  a: -0.3, hue: 280, s: 10, range: 500 }, // 淡紫色
    '想念': { v: 0.3,  a: -0.1, hue: 300, s: 12, range: 480 }, // 粉紫色

    // --- 負面/低能量系列：坍縮、幽暗、窒息感 ---
    '難過': { v: -0.8, a: -0.4, hue: 230, s: 8,  range: 280 }, // 靛藍色
    '悲傷': { v: -1.0, a: -0.6, hue: 250, s: 6,  range: 200 }, // 深藍色
    '失落': { v: -1.5, a: -0.3, hue: 280, s: 9,  range: 320 }, // 灰紫色
    '憂鬱': { v: -1.2, a: -0.7, hue: 260, s: 5,  range: 150 }, // 深紫色
    '孤獨': { v: -0.8, a: -0.8, hue: 210, s: 4,  range: 120 }, // 冰藍色
    '迷茫': { v: -0.2, a: -0.1, hue: 190, s: 11, range: 700 }, // 青灰色
    '失望': { v: -1.5, a: -0.5, hue: 200, s: 10, range: 300 }, // 灰藍色
    '哀傷': { v: -1.5, a: -0.5, hue: 245, s: 7,  range: 220 }, // 深靛藍
    '遺憾': { v: -0.4, a: -0.2, hue: 210, s: 10, range: 350 }, // 褪色藍
    '無助': { v: -1.8, a: -0.5, hue: 210, s: 6,  range: 180 }, // 淺灰藍
    '委屈': { v: -1.2, a: -1.8, hue: 200, s: 12, range: 250 }, // 水藍色
    '絕望': { v: -3.0, a: -2.5, hue: 280, s: 3,  range: 80  }, // 極深紫黑

    // --- 高能量/不安/負向系列：劇烈、混亂、爆裂感 ---
    '生氣': { v: -1.5, a: 0.9,  hue: 15,  s: 25, range: 550 }, // 橘紅色
    '憤怒': { v: -0.2, a: 1.0,  hue: 0,   s: 35, range: 750 }, // 正紅色
    '崩潰': { v: -1.0, a: 1.1,  hue: 320, s: 45, range: 950 }, // 深紫紅
    '痛苦': { v: -0.5, a: 0.8,  hue: 300, s: 18, range: 450 }, // 濁紫色
    '恐懼': { v: -0.9, a: 0.8,  hue: 120, s: 12, range: 200 }, // 深綠色
    '緊張': { v: -1.2, a: 0.7,  hue: 140, s: 14, range: 300 }, // 黃綠色
    '擔心': { v: -0.4, a: 0.4,  hue: 170, s: 12, range: 350 }, // 暗青色
    '驚嚇': { v: -1.1, a: 1.2,  hue: 130, s: 50, range: 1000}, // 螢光白綠
    '恐怖': { v: -0.9, a: 0.9,  hue: 280, s: 15, range: 300 }, // 深紫黑
    '焦慮': { v: -0.5, a: 1.8, hue: 130, s: 25, range: 300 }, // 螢光綠
    '慌張': { v: -0.3, a: 1.0,  hue: 45,  s: 18, range: 600 }, // 混亂黃
    '害怕': { v: -0.8, a: -0.8, hue: 110, s: 10, range: 220 }, // 冷綠色
    '驚訝': { v: 1.3,  a: 0.9,  hue: 180, s: 30, range: 700 }, // 亮青色
    '討厭': { v: -1.0, a: 0.4,  hue: 20,  s: 20, range: 500 }, // 混濁紅褐
    '噁心': { v: -0.9, a: 0.2,  hue: 80,  s: 28, range: 400 }  // 濁黃綠
    // 可以繼續增加...
    // v (Valence, 情緒「正向」或「負向」) 
    // a (Arousal, 情緒的「強度」或「神經興奮程度」 
    // hue (色相 hue: 0：紅色 - 憤怒/生氣 hue: 50：黃色/暖色 - 快樂/幸福 hue: 240：純藍色 - 難過/憂鬱)
};


export function handleInteraction(text) {
    if (!text) return null;

    // 宣告變數 (這步沒做就會報 ReferenceError)
    let matchedKey = null; 

    // 尋找匹配的情緒 key (例如：text 裡有沒有包含 "幸福")
    // 假設妳的 EMOTION_MAP 定義在同一個檔案上方
    for (const key in EMOTION_MAP) {
        if (text.includes(key)) {
            matchedKey = key;
            break; 
        }
    }

    // 如果沒匹配到任何情緒，回傳空值
    if (!matchedKey) return null;
    const emotion = EMOTION_MAP[matchedKey];// 取得對應參數

    // 數量：v 越小數量越少，但最少維持 40 顆粒子
    const finalCount = Math.max(40, 250 + (emotion.v * 120));

    // 速度：能量 a 的絕對值越大，流動越快
    const finalSpeed = 0.5 + (Math.abs(emotion.a) * 1.5);

    // 回傳所有視覺參數
    return {
    h: emotion.hue,
    a: emotion.a,
    v: emotion.v,
    s: emotion.s, // 傳遞粒子大小
    range: emotion.range, // 傳遞空間範圍
    speedFactor: finalSpeed,
    newCount: finalCount
    }
}
