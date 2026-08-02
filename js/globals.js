// globals.js - Standalone Hex Card Game essentials (trimmed from original)
window.APP_VERSION = 'V1.0-standalone';

// Firebase (optional, falls back to localStorage)
const firebaseConfig = { apiKey: "AIzaSyDGifdSPISRZoO-FKPNlwm1v9i5e5u5XII", authDomain: "pokemon-7dec7.firebaseapp.com", projectId: "pokemon-7dec7", storageBucket: "pokemon-7dec7.firebasestorage.app", messagingSenderId: "560877276751", appId: "1:560877276751:web:0a62597b1e859af4ea643a", measurementId: "G-MPZYGFRJBN" };
let db = null; let isCloudMode = false;
try { if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); } db = firebase.firestore(); isCloudMode = true; console.log("Firebase connected"); } catch (e) { console.warn("Firebase offline, using localStorage"); isCloudMode = false; }

window.fireConfetti = () => { try { const count = 200; const defaults = { origin: { y: 0.7 } }; function fire(particleRatio, opts) { confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * particleRatio) })); } fire(0.25, { spread: 26, startVelocity: 55 }); fire(0.2, { spread: 60 }); fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 }); fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 }); fire(0.1, { spread: 120, startVelocity: 45 }); } catch(e){} };

window._sharedAudioCtx = null;
window.getAudioCtx = () => { try { if (!window._sharedAudioCtx || window._sharedAudioCtx.state === 'closed') { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; window._sharedAudioCtx = new AC(); } if (window._sharedAudioCtx.state === 'suspended') window._sharedAudioCtx.resume(); return window._sharedAudioCtx; } catch(e) { return null; } };
window.playSound = (type) => { const ctx = window.getAudioCtx(); if (!ctx) return; const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); const now = ctx.currentTime; if (type === 'win' || type === 'legendary') { [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'triangle'; o.frequency.value = freq; g.gain.setValueAtTime(0.05, now + i*0.1); g.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 0.8); o.start(now + i*0.1); o.stop(now + i*0.1 + 0.8); }); } };

// Minimal Pokemon name map (common ones + starters)
window._pokemonNameMap = {1:"妙蛙種子",2:"妙蛙草",3:"妙蛙花",4:"小火龍",5:"火恐龍",6:"噴火龍",7:"傑尼龜",8:"卡咪龜",9:"水箭龜",10:"綠毛蟲",13:"獨角蟲",16:"波波",19:"小拉達",21:"烈雀",25:"皮卡丘",26:"雷丘",41:"超音蝠",54:"可達鴨",60:"蚊香蝌蚪",63:"凱西",74:"小拳石",129:"鯉魚王",133:"伊布",150:"超夢",151:"夢幻",152:"菊草葉",155:"火球鼠",158:"小鋸鱷",252:"木守宮",255:"火稚雞",258:"水躍魚",387:"草苗龜",390:"小火焰猴",393:"波加曼"};
window.getPokemonName = (id) => window._pokemonNameMap[id] || window._pokemonNameMap[String(id)] || ('#' + id);

window.LEGENDARY_LIST = [144,145,146,150,243,244,245,249,250,377,378,379,380,381,382,383,384,480,481,482,483,484,485,486,487,488,638,639,640,641,642,643,644,645,646,716,717,718,772,773,785,786,787,788,789,790,791,792,800,888,889,890,891,892,894,895,896,897,898,905,1001,1002,1003,1004,1007,1008,1014,1015,1016,1017,1024];
window.MYTHICAL_LIST = [151,251,385,386,489,490,491,492,493,494,647,648,649,719,720,721,801,802,807,808,809,893,1025];
window.VIP_LEGENDARY_MYTHICAL = [...window.LEGENDARY_LIST, ...window.MYTHICAL_LIST];

window.POKEMON_BST_DICT = JSON.parse(localStorage.getItem('poke_bst_dict') || '{}');

window.getPokemonRarity = (id) => {
    if (window.VIP_LEGENDARY_MYTHICAL.includes(id)) return 6;
    let bst = 0;
    const dictData = window.POKEMON_BST_DICT[id];
    if (typeof dictData === 'object' && dictData !== null) bst = dictData.bst || 0;
    else bst = dictData || 0;
    if (bst === 0) return 2;
    if (bst >= 500) return 5;
    if (bst >= 420) return 4;
    if (bst >= 320) return 3;
    if (bst >= 200) return 2;
    return 1;
};

window.STAR_POOL = {
    1: [10,13,191,265,280,298,401,746,824,872],
    2: [1,4,7,11,14,16,19,21,23,25,27,29,32,37,39,41,46,48,50,52,56,60,63,66,69,74,79,84,90,92,116,129,132,147,152,155,158],
    3: [2,5,8,12,15,17,20,26,30,33,35,43,44,47,54,58,61,64,67,70,72,75,77,81,83,86,88,93,95,96,98,100,102,104,108,109,111,118,120,133,137],
    4: [18,22,24,28,36,40,42,45,49,51,53,57,71,76,80,82,85,87,97,99,101,105,106,107,110,112,113,114,115,117,119,122,124,125,126,128,139,141,148],
    5: [3,6,9,31,34,38,55,59,62,65,68,73,78,89,91,94,103,121,123,127,130,131,134,135,136,142,143,149,154,157,160,169,181,186,196,197,208,212,213,214],
    6: [144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386]
};

window.getStaticStar = function(id) {
    if (!window._idToStar) {
        window._idToStar = {};
        for (let s = 1; s <= 6; s++) (window.STAR_POOL[s] || []).forEach(pid => { window._idToStar[pid] = s; });
    }
    return window._idToStar[id] || window._idToStar[Number(id)] || 2;
};

window.pickCardByStarRange = function(minStar, maxStar) {
    let lo = Math.max(1, Math.min(5, minStar || 1));
    let hi = Math.max(lo, Math.min(5, maxStar || lo));
    const star = lo + Math.floor(Math.random() * (hi - lo + 1));
    let pool = window.STAR_POOL[star] || [];
    let s = star;
    while ((!pool || pool.length === 0) && s > 1) { s--; pool = window.STAR_POOL[s] || []; }
    if (!pool || pool.length === 0) return 25;
    return pool[Math.floor(Math.random() * pool.length)];
};

window.HB_STAT_THRESHOLDS = [40, 46, 56, 61, 69, 76, 86, 96, 111];
window.hbStatToEdge = function(statVal) {
    const v = statVal || 0;
    const th = window.HB_STAT_THRESHOLDS;
    for (let i = 0; i < th.length; i++) if (v < th[i]) return i + 1;
    return 10;
};

window.DEFAULT_HEX_CONFIG = {
    7:  { sameEdges:2, plusEdges:2, spLimit:1, terrainCount:2, centerBonus:1 },
    10: { sameEdges:2, plusEdges:2, spLimit:2, terrainCount:3, centerBonus:2 },
    19: { sameEdges:2, plusEdges:2, spLimit:4, terrainCount:6, centerBonus:3 },
    global: { dynamicCenter: false, spRefundOnCenter: true }
};

window._mergeHexConfig = function(cfg) {
    const def = window.DEFAULT_HEX_CONFIG;
    const safe = (cfg && typeof cfg === 'object') ? cfg : {};
    const merged = {};
    [7, 10, 19].forEach(size => { merged[size] = { ...def[size], ...(safe[size] || {}) }; });
    merged.global = { ...def.global, ...(safe.global || {}) };
    return merged;
};

window.loadHexConfig = async function() {
    const LOCAL_KEY = 'hexBattleConfig_global';
    let localCfg = null;
    try { localCfg = JSON.parse(localStorage.getItem(LOCAL_KEY)); } catch(e) {}
    if (!db) return window._mergeHexConfig(localCfg);
    try {
        const doc = await Promise.race([db.collection('system').doc('hexBattleConfig').get(), new Promise((_,rej) => setTimeout(()=>rej(new Error('timeout')),3000))]);
        if (doc.exists) {
            const cfg = window._mergeHexConfig(doc.data());
            localStorage.setItem(LOCAL_KEY, JSON.stringify(cfg));
            return cfg;
        }
    } catch(e) {}
    return window._mergeHexConfig(localCfg);
};

window.loadHexCards = async function(uid) {
    if (!uid) return {};
    const localKey = 'hexCards_' + uid;
    let localCards = {};
    try { localCards = JSON.parse(localStorage.getItem(localKey) || '{}') || {}; } catch(e) {}
    if (!db || !isCloudMode) return localCards;
    try {
        const doc = await Promise.race([db.collection('users').doc(uid).collection('hexCards').doc('collection').get(), new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),4000))]);
        if (doc.exists) {
            const cloud = doc.data().cards || {};
            localStorage.setItem(localKey, JSON.stringify(cloud));
            return cloud;
        }
    } catch(e) {}
    return localCards;
};

window.saveHexCards = async function(uid, cards) {
    try { localStorage.setItem('hexCards_'+uid, JSON.stringify(cards)); } catch(e) {}
    if (db && isCloudMode) {
        try { await db.collection('users').doc(uid).collection('hexCards').doc('collection').set({ cards }); } catch(e) {}
    }
};

console.log('✅ Standalone Hex globals loaded');
