// ══════════════════════════════════════════════════════════════
// hex-tower.js — 蜂巢挑戰 / 闖關塔模組  (V74.9) standalone
// ══════════════════════════════════════════════════════════════

const HEX_TOWER_LEVELS = [
    { lv:1,  name:'初心試煉', zone:'g', board:7,  ai:'easy',   rules:{same:false,plus:false}, terrain:0,      sp:0, center:1,
      desc:'歡迎踏入蜂巢！這一關沒有特殊規則，只有最基本的數值對決。把卡片放到棋盤上，比相鄰邊的數字大就能翻轉對方的卡，佔領最多格子就贏！先試試手感吧。' },
    { lv:2,  name:'邊的對決', zone:'g', board:7,  ai:'easy',   rules:{same:false,plus:false}, terrain:0,      sp:0, center:1,
      desc:'一張卡有六條邊，每條邊對應一個數值。放在不同位置，就有不同的邊會互相比較。想想看：怎麼擺放才能讓自己的高數值邊，剛好面對對方的弱邊？' },
    { lv:3,  name:'場地初現', zone:'g', board:7,  ai:'easy',   rules:{same:false,plus:false}, terrain:1,      sp:0, center:1,
      desc:'棋盤上出現了屬性格！把同屬性的卡放在屬性格上，六條邊的數值全部 +1；如果放上去的卡屬性被該格剋制，六條邊則全部 -1；其他屬性放上去不加也不減。屬性格是讓弱卡逆轉的好機會！' },
    { lv:4,  name:'屬性之力', zone:'g', board:7,  ai:'easy',   rules:{same:false,plus:false}, terrain:2,      sp:0, center:1,
      desc:'這次有兩個屬性不同的屬性格！同屬性落格全邊 +1，被剋屬性落格全邊 -1，其他屬性不受影響。選卡時注意手中的屬性，讓自己的牌踩在有利的格子上，同時阻止對手踩你的弱格——搶先布局才是關鍵！' },
    { lv:5,  name:'SAME 登場', zone:'g', board:7, ai:'normal', rules:{same:true, plus:false}, terrain:2,      sp:1, center:1,
      desc:'SAME 規則正式啟動！當你放下一張卡，如果它有兩條以上的邊，數值「完全相同」於相鄰對手的邊，就會觸發 SAME，一次翻轉所有符合的卡！記住：同側的邊要一模一樣才算。' },
    { lv:6,  name:'PLUS 登場', zone:'g', board:7, ai:'normal', rules:{same:true, plus:true},  terrain:2,      sp:1, center:1,
      desc:'PLUS 規則加入了！當你放下一張卡，如果有兩組「你的邊 + 對手的邊」加起來總和相同，就能觸發 PLUS，同樣一次翻轉多張！SAME 和 PLUS 都算，命中任一個就能大翻盤！' },
    { lv:7,  name:'SP 解放',   zone:'g', board:7, ai:'normal', rules:{same:true, plus:true},  terrain:2,      sp:2, center:1,
      desc:'SP 能量登場！每場最多可使用 2 次 SP 技能，讓一張卡的所有邊數值暫時 +2，大幅提升翻牌機會。SP 要留著在關鍵時刻出手，亂用只是浪費！' },
    { lv:8,  name:'啟蒙畢業', zone:'g', board:7,  ai:'normal', rules:{same:true, plus:true},  terrain:2,      sp:2, center:1,
      desc:'規則啟蒙的最終考驗！對手雖然是普通 AI，但它已經懂得計算翻牌、搶佔有利場地。把你學到的一切：數值對比、SAME/PLUS 連鎖、SP 時機、場地加成，全部發揮出來，正式畢業！' },
    { lv:9,  name:'進入蜂巢', zone:'y', board:10, ai:'normal', rules:{same:true, plus:true},  terrain:2,      sp:1, center:2,
      desc:'棋盤擴大到 10 格！更大的戰場意味著更多的布局空間與變數。中央格的佔分獎勵提升了，但搶中央也要小心四面受敵。如何在攻守之間找到平衡？從這一關開始，真正的策略對決開始了。' },
    { lv:10, name:'中央爭奪', zone:'y', board:10, ai:'normal', rules:{same:true, plus:true},  terrain:2,      sp:2, center:3,
      desc:'中央格的佔分獎勵高達 3 分！這一關雙方都知道中央的價值，一定會全力爭搶。你需要決定：是先搶中央建立優勢，還是先用高數值卡穩住側翼再反包？中央的戰鬥牽動全局！' },
    { lv:11, name:'小寶可夢盃', zone:'y', board:10, ai:'normal', rules:{same:true,plus:true}, terrain:3,      sp:2, center:2, starMax:3,
      desc:'本關限用 1～3 星的卡牌！傳說和精英卡通通不能上場，只有普通的小夥伴們能參賽。但小卡片也有大智慧——數值雖低，只要善用 SAME/PLUS 連鎖和場地加成，照樣能以弱勝強！' },
    { lv:12, name:'烈焰道館', zone:'y', board:10, ai:'normal', rules:{same:true, plus:true},  terrain:3,      sp:2, center:2, typeLock:'fire',
      desc:'火屬性限定！整個道館都燃燒著烈焰，只有火系寶可夢才能入場。趁現在把你的噴火龍、烈焰馬、火焰鳥都找出來組一副純火牌組！屬性格也多是火屬性，是火系卡的主場。' },
    { lv:13, name:'碧波道館', zone:'y', board:10, ai:'normal', rules:{same:true, plus:true},  terrain:3,      sp:2, center:2, typeLock:'water',
      desc:'水屬性限定！海浪翻滾，只有水系寶可夢能踏入這片棋盤。選出你最強的水系卡牌，在蔚藍的場地上展開對決。水的力量既能防守也能攻擊，冷靜判斷才能制勝！' },
    { lv:14, name:'場地大亂鬥', zone:'y', board:10, ai:'normal', rules:{same:true,plus:true}, terrain:'full', sp:2, center:2,
      desc:'每一格都是屬性格！整個棋盤鋪滿各種屬性，同屬性落格全邊 +1、被剋屬性落格全邊 -1、其他屬性不影響。這一關拼的是「屬性覆蓋面廣的牌組」——帶多種屬性的混合牌組能同時踩好格、避開壞格，在這裡最強！' },
    { lv:15, name:'無 SP 試煉', zone:'y', board:10, ai:'normal', rules:{same:true,plus:true}, terrain:3,      sp:0, center:2,
      desc:'本關 SP 歸零！一般的 2 邊 SAME／PLUS 因為沒有 SP 可扣而無法使用。但別忘了高級技巧——一次湊滿 3 邊以上的 SAME／PLUS 是「免費觸發」，不需要 SP！這一關就是要逼你學會用 3 邊的精準佈局來翻盤。把高數值的卡放在最能連線的位置吧！' },
    { lv:16, name:'SAME 大師', zone:'y', board:10, ai:'hard',   rules:{same:true, plus:true}, terrain:3,      sp:2, center:2,
      desc:'對手是困難 AI！它會主動預測你的邊數值，故意把卡放到讓你的 SAME 效果打不到它的位置。要擊敗這種對手，就要讓你的牌組邊值「多樣化」，讓 AI 無法同時防住所有角度！' },
    { lv:17, name:'草原道館', zone:'y', board:10, ai:'normal', rules:{same:true, plus:true},  terrain:3,      sp:2, center:2, typeLock:'grass',
      desc:'草屬性限定！翠綠的大地，只有草系寶可夢才能踏足。妙蛙種子、葉子精靈、結草兒……把你手中的草系卡全帶上！草屬性場地遍布，主場優勢讓你的卡片更加強悍。' },
    { lv:18, name:'精英之路', zone:'y', board:10, ai:'hard',   rules:{same:true, plus:true},  terrain:4,      sp:2, center:2,
      desc:'通往大師區的門檻！困難 AI + 4 個屬性格，對手會同時考慮翻牌數量和場地搶奪。要過這一關，需要一副「攻守均衡」的牌組——有高攻的卡用來翻牌，有寬面值的卡用來 SAME。' },
    { lv:19, name:'雙星限定', zone:'y', board:10, ai:'normal', rules:{same:true, plus:true},  terrain:3,      sp:2, center:2, starMin:2, starMax:4,
      desc:'限用 2～4 星的卡牌！最弱的 1 星和最強的 5～6 星都不能用，比拼的是中段卡牌的運用能力。這個星等範圍的卡往往數值「偏均衡」，更適合觸發 SAME/PLUS！' },
    { lv:20, name:'蜂巢精英', zone:'y', board:10, ai:'hard',   rules:{same:true, plus:true},  terrain:3,      sp:2, center:3,
      desc:'策略養成的最終考驗！中央格高達 3 分加成，困難 AI 會以中央為核心展開攻勢。你必須在搶中央、防翻牌、觸發連鎖之間做出最佳判斷。通過這關，才有資格挑戰大師考驗！' },
    { lv:21, name:'巨型蜂巢', zone:'r', board:19, ai:'normal', rules:{same:true, plus:true},  terrain:6,      sp:4, center:3,
      desc:'歡迎來到 19 格的巨型戰場！這是完整的蜂巢棋盤，格子足足是前兩區的兩倍。更多的空間代表更長的手牌需求、更複雜的局面計算。適應這個棋盤的節奏，是通過大師區的第一步。' },
    { lv:22, name:'電光道館', zone:'r', board:19, ai:'normal', rules:{same:true, plus:true},  terrain:6,      sp:4, center:3, typeLock:'electric',
      desc:'電屬性限定！閃電鳥、雷吉洛克、皮卡丘……召集你所有的電系精英！在 19 格的巨型棋盤上，6 個屬性格都帶電，電系卡片在這裡如魚得水。讓電流貫穿整個棋盤！' },
    { lv:23, name:'中央霸權', zone:'r', board:19, ai:'hard',   rules:{same:true, plus:true},  terrain:6,      sp:4, center:5,
      desc:'中央格分值高達 5 分！在 19 格的大棋盤上，中央只有一個，卻能決定勝負走向。困難 AI 會傾盡全力守住中央。這一關考驗你的「奇兵突破」能力——看似讓對手得中央，卻用連鎖翻牌反轉乾坤。' },
    { lv:24, name:'場地煉獄', zone:'r', board:19, ai:'hard',   rules:{same:true, plus:true},  terrain:'full', sp:4, center:3,
      desc:'19 格全部是屬性格！每個落點都有屬性加減：同屬性全邊 +1、被剋屬性全邊 -1、其他屬性不影響。困難 AI 擅長精確計算每格增益，你的牌組屬性種類越多，踩好格避壞格的機會就越大！' },
    { lv:25, name:'無 SP 巨戰', zone:'r', board:19, ai:'hard',  rules:{same:true,plus:true},  terrain:6,      sp:0, center:3,
      desc:'禁止 SP！在 19 格的大棋盤上，困難 AI 也沒有 SP 可用，但它的計算能力依舊可怕。這是最純粹的數值與位置之戰——帶上你最強、邊值最高的卡牌，用真實力量碾壓對手！' },
    { lv:26, name:'龍之試煉', zone:'r', board:19, ai:'hard',   rules:{same:true, plus:true},  terrain:6,      sp:4, center:3, typeLock:'dragon',
      desc:'龍屬性限定！龍之試煉只允許最驕傲的龍系寶可夢參戰。洛奇亞、龍捲雲、各種龍系精英，組成一支純龍牌組挑戰困難 AI！龍系卡往往數值極高，SAME/PLUS 的觸發更加致命。' },
    { lv:27, name:'三星天險', zone:'r', board:19, ai:'hard',   rules:{same:true, plus:true},  terrain:6,      sp:4, center:3, starMin:3, starMax:5,
      desc:'限用 3～5 星的卡牌！最弱和最強的都不能上，只有中高階卡片才能參戰。困難 AI 和你用相同星等範圍，拼的是組牌眼光——哪些 3 到 5 星的卡數值最均衡、最能觸發連鎖？' },
    { lv:28, name:'蜂巢之王', zone:'r', board:19, ai:'hard',   rules:{same:true, plus:true},  terrain:6,      sp:4, center:3,
      desc:'通往巔峰的最後障礙之一！困難 AI 在這裡展現最高水平的攻守一體戰術，任何破綻都會被抓住。帶上你最精心打造的牌組，用最精準的布局，向蜂巢之王發起挑戰！' },
    { lv:29, name:'究極挑戰', zone:'r', board:19, ai:'hard',   rules:{same:true, plus:true},  terrain:'full',sp:6, center:4,
      desc:'全場地 + SP 上限 6 + 中央 4 分！這是最混亂、最高強度的對決環境。每一格都有屬性，SP 技能可以釋放 6 次，中央的價值極高。沒有完美的策略，只有在混亂中保持冷靜的人才能勝出。' },
    { lv:30, name:'蜂巢傳說', zone:'r', board:19, ai:'hard',   rules:{same:true, plus:true},  terrain:'full',sp:6, center:5,
      desc:'這是最終關卡——蜂巢傳說！全場地、SP 上限 6、中央高達 5 分的加成。打敗最強的 AI，你就是這座蜂巢塔的真正傳說。通關獎勵：5 星卡片一張，以及屬於你的傳奇稱號。準備好了嗎？' },
];

const HEX_TOWER_STARTER_DECK = [1, 4, 7, 25, 16, 13, 74, 63];

const HEX_ZONE_STYLE = {
    g: { label:'🟢 規則啟蒙', color:'#4a9d5f', bg:'from-green-50 to-emerald-50',  border:'border-green-300' },
    y: { label:'🟡 策略養成', color:'#e8a13a', bg:'from-amber-50 to-yellow-50',   border:'border-amber-300' },
    r: { label:'🔴 大師考驗', color:'#d44d6e', bg:'from-rose-50 to-pink-50',      border:'border-rose-300' },
};

const HEX_AI_LABEL = {
    easy:   { text:'簡單', color:'#4a9d5f', bg:'#d1fae5' },
    normal: { text:'普通', color:'#c17a25', bg:'#fef9c3' },
    hard:   { text:'困難', color:'#d44d6e', bg:'#ffe4e6' },
};

const HEX_TOWER_REWARDS = {
    1:  { coins: 34,  starMin:1, starMax:3, weights:[0.75,0.20,0.05] },
    2:  { coins: 38,  starMin:1, starMax:3, weights:[0.65,0.25,0.10] },
    3:  { coins: 42,  starMin:1, starMax:3, weights:[0.55,0.30,0.15] },
    4:  { coins: 46,  starMin:1, starMax:3, weights:[0.45,0.35,0.20] },
    5:  { coins: 50,  starMin:1, starMax:3, weights:[0.35,0.40,0.25] },
    6:  { coins: 54,  starMin:1, starMax:3, weights:[0.25,0.45,0.30] },
    7:  { coins: 58,  starMin:1, starMax:3, weights:[0.15,0.45,0.40] },
    8:  { coins: 62,  starMin:1, starMax:3, weights:[0.10,0.40,0.50] },
    9:  { coins: 66,  starMin:2, starMax:4, weights:[0.65,0.25,0.10] },
    10: { coins: 72,  starMin:2, starMax:4, weights:[0.55,0.30,0.15] },
    11: { coins: 78,  starMin:2, starMax:4, weights:[0.45,0.35,0.20] },
    12: { coins: 84,  starMin:2, starMax:4, weights:[0.38,0.37,0.25] },
    13: { coins: 90,  starMin:2, starMax:4, weights:[0.30,0.40,0.30] },
    14: { coins: 96,  starMin:2, starMax:4, weights:[0.25,0.40,0.35] },
    15: { coins: 102, starMin:2, starMax:4, weights:[0.20,0.40,0.40] },
    16: { coins: 108, starMin:2, starMax:4, weights:[0.15,0.38,0.47] },
    17: { coins: 114, starMin:2, starMax:4, weights:[0.12,0.35,0.53] },
    18: { coins: 120, starMin:2, starMax:4, weights:[0.10,0.30,0.60] },
    19: { coins: 126, starMin:2, starMax:4, weights:[0.08,0.27,0.65] },
    20: { coins: 132, starMin:2, starMax:4, weights:[0.05,0.25,0.70] },
    21: { coins: 135, starMin:3, starMax:5, weights:[0.60,0.30,0.10] },
    22: { coins: 150, starMin:3, starMax:5, weights:[0.50,0.35,0.15] },
    23: { coins: 165, starMin:3, starMax:5, weights:[0.40,0.38,0.22] },
    24: { coins: 180, starMin:3, starMax:5, weights:[0.30,0.40,0.30] },
    25: { coins: 195, starMin:3, starMax:5, weights:[0.20,0.40,0.40] },
    26: { coins: 210, starMin:4, starMax:6, weights:[0.45,0.38,0.17] },
    27: { coins: 225, starMin:4, starMax:6, weights:[0.35,0.38,0.27] },
    28: { coins: 240, starMin:4, starMax:6, weights:[0.25,0.38,0.37] },
    29: { coins: 255, starMin:4, starMax:6, weights:[0.15,0.35,0.50] },
    30: { coins: 400, starMin:6, starMax:6, weights:[1.0] },
};
const hexTowerReward = (lv) => HEX_TOWER_REWARDS[lv] || HEX_TOWER_REWARDS[1];

const pickTowerRewardCard = (reward) => {
    if (!window.STAR_POOL) return 25;
    const { starMin, starMax, weights } = reward;
    const r = Math.random();
    let acc = 0, pickedStar = starMin;
    for (let i = 0; i < weights.length; i++) {
        acc += weights[i];
        if (r <= acc) { pickedStar = starMin + i; break; }
    }
    pickedStar = Math.max(1, Math.min(6, pickedStar));
    let pool = window.STAR_POOL[pickedStar] || [];
    let s = pickedStar;
    while ((!pool || pool.length === 0) && s > 1) { s--; pool = window.STAR_POOL[s] || []; }
    if (!pool || pool.length === 0) return 25;
    return pool[Math.floor(Math.random() * pool.length)];
};

const towerProgressKey = (username) => 'hexTowerProgress_' + username;
const loadTowerProgress = (username) => {
    if (!username) return {};
    try {
        const raw = localStorage.getItem(towerProgressKey(username));
        return raw ? (JSON.parse(raw) || {}) : {};
    } catch(e) { return {}; }
};
const saveTowerProgress = (username, progress) => {
    if (!username) return;
    try { localStorage.setItem(towerProgressKey(username), JSON.stringify(progress)); } catch(e) {}
};

const userAlreadyHasTowerStarterCards = async (username) => {
    if (!username) return false;
    try {
        const cards = typeof window.loadHexCards === 'function'
            ? await window.loadHexCards(username)
            : JSON.parse(localStorage.getItem('hexCards_' + username) || '{}');
        return HEX_TOWER_STARTER_DECK.some(id => !!(cards || {})[id]);
    } catch(e) {
        try {
            const cards = JSON.parse(localStorage.getItem('hexCards_' + username) || '{}');
            return HEX_TOWER_STARTER_DECK.some(id => !!cards[id]);
        } catch(_) { return false; }
    }
};

const HEX_TYPE_LABEL = {
    fire:'火', water:'水', grass:'草', electric:'電', dragon:'龍',
    ice:'冰', rock:'岩石', ground:'地面', flying:'飛行', bug:'蟲',
    poison:'毒', psychic:'超能力', fighting:'格鬥', ghost:'幽靈',
    dark:'惡', steel:'鋼', fairy:'妖精', normal:'一般',
};

const HexChallengeScreen = ({ userData, setUserData, onBack }) => {
    const { useState } = React;
    const [sub, setSub] = useState('hub');

    if (sub === 'tower') {
        return <HexTowerScreen userData={userData} setUserData={setUserData} onBack={() => setSub('hub')} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-100 to-purple-100 p-4">
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-6 pt-2">
                    <button onClick={onBack}
                        className="px-4 py-2 bg-white rounded-xl font-black text-gray-600 shadow-sm active:scale-95">
                        返回
                    </button>
                    <h1 className="text-2xl font-black text-indigo-700">⬡ 蜂巢挑戰</h1>
                </div>

                <p className="text-sm text-gray-500 font-bold mb-5 px-1">
                    選擇你的挑戰模式 ── 用自己鍛造的六角卡牌，挑戰各種關卡！
                </p>

                <button onClick={() => setSub('tower')}
                    className="w-full bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 mb-4
                               shadow-lg active:scale-[0.98] transition-transform text-left">
                    <div className="text-5xl mb-2">🗼</div>
                    <div className="text-2xl font-black text-white">闖關塔</div>
                    <div className="text-sm text-amber-50 font-bold mt-1">
                        30 道關卡層層挑戰，規則由淺入深，爬上塔頂成為蜂巢傳說！
                    </div>
                </button>

                <div className="w-full bg-white/60 rounded-3xl p-6 border-2 border-dashed border-gray-300 text-center">
                    <div className="text-4xl mb-1 opacity-40">✨</div>
                    <div className="text-base font-black text-gray-400">更多挑戰模式</div>
                    <div className="text-xs text-gray-400 font-bold mt-1">敬請期待</div>
                </div>
            </div>
        </div>
    );
};

const HexTowerScreen = ({ userData, setUserData, onBack }) => {
    const { useState, useEffect, useMemo, useRef } = React;
    const username = userData?.username;

    const [progress, setProgress] = useState(() => loadTowerProgress(username));
    const [activeLevel, setActiveLevel] = useState(null);
    const [previewLevel, setPreviewLevel] = useState(null);
    const [rewardPopup, setRewardPopup] = useState(null);
    const [starterPhase, setStarterPhase] = useState(null);
    const [starterFlipped, setStarterFlipped] = useState([]);

    useEffect(() => {
        setStarterPhase(null);
        setStarterFlipped([]);
        let cancelled = false;
        if (!username || userData?.isGuest) {
            setProgress(loadTowerProgress(username));
            return () => { cancelled = true; };
        }
        (async () => {
            let nextProgress = loadTowerProgress(username) || {};
            if (!nextProgress._starterCeremonyDone && await userAlreadyHasTowerStarterCards(username)) {
                nextProgress = { ...nextProgress, _starterGiven: true, _starterCeremonyDone: true };
                saveTowerProgress(username, nextProgress);
            }
            if (cancelled) return;
            setProgress(nextProgress);
            if (!nextProgress._starterCeremonyDone) {
                setTimeout(() => { if (!cancelled) setStarterPhase('pack'); }, 400);
            }
        })();
        return () => { cancelled = true; };
    }, [username, userData?.isGuest]);

    const grantStarterCards = () => {
        const conv = window.hbStatToEdge;
        let hexCards = {};
        try { hexCards = JSON.parse(localStorage.getItem('hexCards_' + username) || '{}') || {}; } catch(e) {}
        HEX_TOWER_STARTER_DECK.forEach(id => {
            if (hexCards[id]) return;
            const data = (window.POKEMON_BST_DICT || {})[id];
            let baseStats;
            if (data && data.hp !== undefined && conv) {
                baseStats = [conv(data.atk),conv(data.hp),conv(data.spd),conv(data.def),conv(data.spe),conv(data.spa)];
            } else {
                baseStats = [3,3,3,3,3,3];
            }
            hexCards[id] = {
                id, name: (window.getPokemonName && window.getPokemonName(id)) || ('#'+id),
                rarity: (window.getPokemonRarity && window.getPokemonRarity(id)) || 2,
                types: (data && data.types) || [],
                baseStats, stats: [...baseStats], upgrades: [0,0,0,0,0,0],
                totalUpgrades: 0, forgedAt: Date.now(), fromStarter: true,
            };
        });
        try { localStorage.setItem('hexCards_' + username, JSON.stringify(hexCards)); } catch(e) {}
        setUserData(prevUser => {
            const ownedSet = new Set((prevUser.unlockedCards || []).map(String));
            const toAdd = HEX_TOWER_STARTER_DECK.filter(id => !ownedSet.has(String(id)));
            if (toAdd.length === 0) return prevUser;
            const newUnlocked = [...(prevUser.unlockedCards || []), ...toAdd];
            return { ...prevUser, unlockedCards: newUnlocked };
        });
        setProgress(prevProg => {
            const np = { ...prevProg, _starterGiven: true, _starterCeremonyDone: true };
            saveTowerProgress(username, np);
            return np;
        });
    };

    const pendingPopupRef = useRef(null);
    const handleReport = (lv, winner, score, aiScore) => {
        const won  = winner === 'p1';
        const tied = winner === 'tie';
        const isFirstClear = won && !(progress[lv]?.cleared);

        const calcStars = (p1sc, aisc) => {
            if (!won) return 0;
            const me = p1sc || 0, op = aisc || 0;
            const lead = me - op;
            const total = me + op;
            if (op <= 0) return 3;
            if (lead >= op || op <= total / 4) return 3;
            if (lead >= 3 || lead >= op / 2) return 2;
            return 1;
        };
        const earnedStars = calcStars(score, aiScore);

        setProgress(prevProg => {
            const rec = prevProg[lv] || {};
            const merged = {
                ...rec,
                attempts: (rec.attempts || 0) + 1,
                wins:     (rec.wins   || 0) + (won  ? 1 : 0),
                losses:   (rec.losses || 0) + (!won && !tied ? 1 : 0),
                draws:    (rec.draws  || 0) + (tied ? 1 : 0),
            };
            if (won) {
                merged.cleared   = true;
                merged.bestScore = Math.max(rec.bestScore || 0, score || 0);
                merged.bestStars = Math.max(rec.bestStars || 0, earnedStars);
            }
            const np = { ...prevProg, [lv]: merged };
            saveTowerProgress(username, np);
            return np;
        });

        if (!won) {
            pendingPopupRef.current = { type: tied ? 'draw' : 'lose', lv, winner };
            return;
        }

        const reward = hexTowerReward(lv);
        if (isFirstClear) {
            const cardId = pickTowerRewardCard(reward);
            const isNewCard = !((userData?.unlockedCards) || []).map(String).includes(String(cardId));
            setUserData(prevUser => {
                const newUnlocked  = [...(prevUser.unlockedCards || []), cardId];
                return {
                    ...prevUser,
                    coins: (prevUser.coins || 0) + reward.coins,
                    unlockedCards: newUnlocked,
                };
            });
            pendingPopupRef.current = { type: 'first', lv, winner, coins: reward.coins, cardId, stars: earnedStars, isNew: isNewCard };
        } else {
            const rec0 = progress[lv] || {};
            const finalAttempts = (rec0.attempts || 0) + 1;
            const finalWins     = (rec0.wins || 0) + 1;
            const winRate = finalAttempts > 0 ? finalWins / finalAttempts : 0;
            const discountRate = winRate < 0.5 ? 0.4 : winRate < 0.8 ? 0.3 : 0.2;
            const replayCoins  = Math.max(1, Math.floor(reward.coins * discountRate));
            setUserData(prevUser => ({
                ...prevUser,
                coins: (prevUser.coins || 0) + replayCoins
            }));
            pendingPopupRef.current = {
                type: 'replay', lv, winner,
                coins: replayCoins, discountPct: Math.round(discountRate * 100), stars: earnedStars,
            };
        }
    };

    const handleComplete = () => {
        setActiveLevel(null);
        if (pendingPopupRef.current) {
            setRewardPopup(pendingPopupRef.current);
            pendingPopupRef.current = null;
        }
    };

    const clearedCount = useMemo(
        () => HEX_TOWER_LEVELS.filter(l => progress[l.lv]?.cleared).length,
        [progress]
    );

    const totalStars = useMemo(
        () => HEX_TOWER_LEVELS.reduce((s, l) => s + (progress[l.lv]?.bestStars || 0), 0),
        [progress]
    );
    const maxStars = HEX_TOWER_LEVELS.length * 3;

    const MERCY_ATTEMPTS = 3;
    const BOSS_LEVELS = [8, 20, 30];
    const isBossLevel = (lv) => BOSS_LEVELS.includes(lv);

    const isUnlocked = (lv) => {
        if (lv === 1) return true;
        const prev = progress[lv - 1] || {};
        if (prev.cleared) return true;
        if (isBossLevel(lv - 1)) return false;
        if ((prev.attempts || 0) < MERCY_ATTEMPTS) return false;
        const prevPrev = progress[lv - 2] || {};
        if (lv - 1 === 1) return true;
        return !!prevPrev.cleared;
    };

    const currentLevelLv = useMemo(() => {
        let highestUnlocked = 1;
        for (let i = 1; i <= HEX_TOWER_LEVELS.length; i++) {
            if (isUnlocked(i)) highestUnlocked = i; else break;
        }
        if (progress[highestUnlocked]?.cleared && highestUnlocked === HEX_TOWER_LEVELS.length) {
            return HEX_TOWER_LEVELS.length;
        }
        return highestUnlocked;
    }, [progress]);

    if (activeLevel) {
        const currentLv = activeLevel.lv;
        return <window.HexBattle
            userData={userData}
            setUserData={setUserData}
            onBack={() => setActiveLevel(null)}
            towerConfig={activeLevel}
            onTowerReport={(winner, score, aiScore) => handleReport(currentLv, winner, score, aiScore)}
            onTowerComplete={() => handleComplete()}
        />;
    }

    if (previewLevel) {
        const l = previewLevel;
        const zoneStyle = HEX_ZONE_STYLE[l.zone];
        const aiInfo = HEX_AI_LABEL[l.ai] || HEX_AI_LABEL.normal;
        const reward = hexTowerReward(l.lv);
        const done = progress[l.lv]?.cleared;

        const ruleTags = [];
        if (l.rules?.same) ruleTags.push({ icon:'⚡', text:'SAME', color:'#7c3aed' });
        if (l.rules?.plus) ruleTags.push({ icon:'➕', text:'PLUS', color:'#2563eb' });
        if (l.rules?.same || l.rules?.plus) ruleTags.push({ icon:'🔗', text:'COMBO', color:'#059669' });
        if (l.sp > 0) ruleTags.push({ icon:'✨', text:`SP ×${l.sp}`, color:'#d97706' });
        if (l.center > 1) ruleTags.push({ icon:'👑', text:`中央 +${l.center}`, color:'#c2410c' });
        const terrainText = l.terrain === 'full' ? '全屬性格' : l.terrain === 0 ? '無屬性格' : `屬性格 ${l.terrain} 格`;

        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-100 to-indigo-100">
                <div className="flex items-center gap-3 p-4 bg-white/80 sticky top-0 z-10 shadow-sm">
                    <button onClick={() => setPreviewLevel(null)}
                        className="px-4 py-2 bg-slate-100 rounded-xl font-black text-gray-600 active:scale-95">
                        ← 返回
                    </button>
                    <div className="flex-1">
                        <div className="text-xs font-black" style={{ color: zoneStyle.color }}>{zoneStyle.label}</div>
                        <div className="text-base font-black text-gray-700">第 {l.lv} 關 · {l.name}</div>
                    </div>
                    {done && <span className="text-2xl" title="已通關">⭐</span>}
                </div>

                <div className="max-w-md mx-auto p-4 space-y-3">
                    <div className={`bg-gradient-to-br ${zoneStyle.bg} border-2 ${zoneStyle.border} rounded-3xl p-5 shadow-sm`}>
                        <div className="text-4xl font-black text-center" style={{ color: zoneStyle.color }}>
                            第 {l.lv} 關
                        </div>
                        <div className="text-2xl font-black text-gray-800 text-center mt-1 mb-3">
                            {l.name}
                        </div>
                        <div className="flex justify-center gap-2 flex-wrap">
                            <span className="text-sm font-black px-3 py-1 rounded-full"
                                  style={{ background: aiInfo.bg, color: aiInfo.color }}>
                                AI {aiInfo.text}
                            </span>
                            <span className="text-sm font-black px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                                ⬡ {l.board} 格棋盤
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="text-xs font-black text-gray-400 mb-2">📖 關卡說明</div>
                        <p className="text-sm text-gray-700 leading-relaxed font-bold">{l.desc}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="text-xs font-black text-gray-400 mb-2">⚙️ 本關規則</div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {ruleTags.length > 0 ? ruleTags.map((t,i) => (
                                <span key={i} className="text-xs font-black px-2.5 py-1 rounded-full text-white"
                                      style={{ background: t.color }}>
                                    {t.icon} {t.text}
                                </span>
                            )) : (
                                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">基礎數值對決（無特殊規則）</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 font-bold">🗺️ 屬性格：</span>
                            <span className="text-xs font-black text-indigo-700">{terrainText}</span>
                        </div>
                        {(l.starMin || l.starMax || l.typeLock) && (
                            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-orange-100">
                                <span className="text-xs font-black text-orange-600">⚠️ 限制：</span>
                                {(l.starMin || l.starMax) && (
                                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                        ⭐ {l.starMin||1}～{l.starMax||6} 星
                                    </span>
                                )}
                                {l.typeLock && (
                                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                        {HEX_TYPE_LABEL[l.typeLock]||l.typeLock} 屬性限定
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        {!done ? (
                            <>
                                <div className="text-xs font-black text-gray-400 mb-2">🎁 首次通關獎勵</div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xl">🪙</span>
                                        <span className="text-lg font-black text-yellow-600">{reward.coins}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xl">🃏</span>
                                        <span className="text-sm font-black text-indigo-700">
                                            {'★'.repeat(reward.starMin)}～{'★'.repeat(reward.starMax)} 隨機卡片 ×1
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-xs font-black text-gray-400">🔄 重打可獲得部分金幣</div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setPreviewLevel(null);
                            setActiveLevel(l);
                        }}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-2xl
                                   font-black text-lg shadow-lg active:scale-[0.98] transition-transform">
                        ⚔️ 開始挑戰！
                    </button>
                    <div className="h-4" />
                </div>
            </div>
        );
    }

    return (
      <>
        <div className="fixed inset-0 flex flex-col" style={{background:'linear-gradient(to bottom,#1e1b4b 0%,#312e81 18%,#7f1d1d 50%,#78350f 78%,#14532d 100%)'}}>
            <div className="flex-shrink-0 px-3 pt-3 pb-2 bg-black/30 backdrop-blur-sm">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <button onClick={onBack}
                            className="px-3 py-1.5 bg-white/90 rounded-xl font-black text-gray-700 shadow active:scale-95 text-sm">
                            ← 返回
                        </button>
                        <h1 className="text-xl font-black text-amber-300 drop-shadow flex-1">🗼 闖關塔</h1>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black">
                        <span className="text-amber-300">⭐ {totalStars}/{maxStars}</span>
                        <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden relative">
                            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                                 style={{ width: `${clearedCount / HEX_TOWER_LEVELS.length * 100}%` }} />
                        </div>
                        <span className="text-white">{clearedCount}/{HEX_TOWER_LEVELS.length}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <div className="max-w-md mx-auto px-3 py-6 flex flex-col items-stretch gap-0">
                    <div className="self-center text-center mb-1">
                        <div className="text-4xl">{clearedCount >= HEX_TOWER_LEVELS.length ? '🌟' : '☁️'}</div>
                        <div className="text-amber-200/90 text-xs font-black mt-1">
                            {clearedCount >= HEX_TOWER_LEVELS.length ? '蜂巢塔 · 塔頂！' : '塔頂 · 大師之巔'}
                        </div>
                    </div>
                    {[...HEX_TOWER_LEVELS].reverse().map(l => {
                        const rec = progress[l.lv] || {};
                        const done = rec.cleared;
                        const stars = rec.bestStars || 0;
                        const unlocked = isUnlocked(l.lv);
                        const isCurrent = l.lv === currentLevelLv;
                        const isBoss = l.lv === 8 || l.lv === 20 || l.lv === 30;
                        const isTop = l.lv === 30;
                        const isFirst = l.lv === 1;
                        const zs = HEX_ZONE_STYLE[l.zone];
                        const side = l.lv % 2 === 1 ? 'left' : 'right';

                        let floorCls, floorStyle = {};
                        if (!unlocked) {
                            floorCls = 'bg-slate-800/70 border-slate-600 opacity-60';
                        } else if (done) {
                            floorCls = 'bg-gradient-to-br from-white to-amber-50 border-amber-300';
                        } else {
                            floorCls = 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-400';
                            floorStyle = { animation: 'hexTowerPulse 1.6s ease-in-out infinite', boxShadow: '0 0 18px rgba(251,191,36,0.7)' };
                        }

                        const widthCls = isBoss ? 'w-full' : 'w-[78%]';
                        const alignCls = isBoss ? 'self-center' : (side === 'left' ? 'self-start' : 'self-end');

                        return (
                            <div key={l.lv} className={`relative flex flex-col items-center ${isBoss?'py-2':'py-1.5'}`} style={{ width: '100%' }}>
                                <button
                                    onClick={() => { if (unlocked) setPreviewLevel(l); }}
                                    disabled={!unlocked}
                                    className={`${widthCls} ${alignCls} border-2 rounded-2xl px-3 py-2.5 text-left transition-transform relative ${floorCls} ${unlocked?'active:scale-95 cursor-pointer':'cursor-not-allowed'} ${isBoss?'ring-2 ring-purple-400/60':''}`}
                                    style={floorStyle}>
                                    {isTop && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl">👑</div>}
                                    <div className="flex items-center gap-2">
                                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow ${
                                            !unlocked ? 'bg-slate-600 text-slate-300'
                                            : isBoss ? 'bg-purple-600 text-white'
                                            : 'text-white'}`}
                                            style={!unlocked||isBoss?{}:{ background: zs.color }}>
                                            {!unlocked ? '🔒' : l.lv}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-black leading-tight ${isBoss?'text-purple-700 text-base':'text-gray-800 text-sm'} ${!unlocked?'!text-slate-400':''}`}>
                                                {isBoss && '👑 '}{unlocked ? l.name : '？？？'}
                                            </div>
                                            <div className={`text-[10px] font-bold mt-0.5 ${!unlocked?'text-slate-500':'text-gray-500'}`}>
                                                第 {l.lv} 關 · {l.board} 格
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            {done ? (
                                                <div className="text-sm leading-none tracking-tighter">
                                                    {'⭐'.repeat(stars)}<span className="text-gray-300">{'☆'.repeat(3-stars)}</span>
                                                </div>
                                            ) : isCurrent && unlocked ? (
                                                <span className="text-[10px] font-black text-white bg-orange-500 rounded-full px-2 py-0.5 whitespace-nowrap">挑戰中</span>
                                            ) : !unlocked ? (
                                                <span className="text-[10px] font-black text-slate-400">未解鎖</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </button>
                                {!isFirst && (
                                    <div className="w-1.5 h-4 rounded-full mt-0.5"
                                         style={{ background: unlocked ? 'rgba(251,191,36,0.6)' : 'rgba(148,163,184,0.3)' }} />
                                )}
                            </div>
                        );
                    })}
                    <div className="self-center mt-2 text-center">
                        <div className="text-4xl">🏛️</div>
                        <div className="text-amber-200/80 text-xs font-black mt-1">蜂巢塔 · 起點</div>
                    </div>
                </div>
            </div>
        </div>

        <style>{`@keyframes hexTowerPulse{0%,100%{box-shadow:0 0 12px rgba(251,191,36,0.5)}50%{box-shadow:0 0 22px rgba(251,191,36,0.9)}}`}</style>

        {starterPhase && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                 style={{background:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)'}}>
                {starterPhase === 'pack' && (
                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="text-4xl font-black text-amber-300 drop-shadow-lg">⬡ 闖關塔</div>
                        <div className="text-white font-black text-xl leading-snug px-2">
                            歡迎挑戰<br/><span className="text-amber-300">六角蜂巢卡牌對戰</span>！
                        </div>
                        <div className="text-slate-300 text-sm px-4 leading-relaxed">
                            踏上這座蜂巢塔，用自己的卡牌挑戰 30 關！<br/>先獻上一份新手禮，祝你旗開得勝 🎉
                        </div>
                        <div onClick={()=>{ setStarterPhase('cards'); setStarterFlipped([]); }}
                            className="cursor-pointer select-none"
                            style={{animation:'starterPackShake 0.6s ease-in-out infinite'}}>
                            <div className="relative w-40 h-52 rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-2"
                                 style={{background:'linear-gradient(145deg,#f59e0b,#d97706,#92400e)', border:'3px solid #fcd34d',
                                         boxShadow:'0 0 30px rgba(251,191,36,0.6)'}}>
                                <div className="text-6xl">⬡</div>
                                <div className="text-white font-black text-base">新手卡牌包</div>
                                <div className="text-amber-200 text-xs font-bold">× 8 張</div>
                            </div>
                        </div>
                        <div className="text-amber-300 text-sm font-black animate-pulse">👆 點擊卡包開啟！</div>
                        <style>{`@keyframes starterPackShake{0%,100%{transform:rotate(-3deg) scale(1)}25%{transform:rotate(3deg) scale(1.04)}50%{transform:rotate(-2deg) scale(1.02)}75%{transform:rotate(2deg) scale(1.05)}}`}</style>
                    </div>
                )}
                {starterPhase === 'cards' && (()=>{
                    const allFlipped = starterFlipped.length === HEX_TOWER_STARTER_DECK.length;
                    return (
                        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                            <div className="text-amber-300 font-black text-xl">✨ 新手卡牌包</div>
                            <div className="text-slate-300 text-sm">
                                {allFlipped ? '全部解鎖！卡牌已加入你的六角卡庫 🎉' : `點擊卡片逐一翻開（${starterFlipped.length}/${HEX_TOWER_STARTER_DECK.length}）`}
                            </div>
                            <div className="grid grid-cols-4 gap-2 w-full px-2">
                                {HEX_TOWER_STARTER_DECK.map((id, idx) => {
                                    const flipped = starterFlipped.includes(idx);
                                    const name  = (window.getPokemonName && window.getPokemonName(id)) || ('#'+id);
                                    const rar   = (window.getPokemonRarity && window.getPokemonRarity(id)) || 2;
                                    return (
                                        <div key={idx} onClick={()=>{ if (!flipped) setStarterFlipped(prev=>[...prev, idx]); }}
                                            className="relative cursor-pointer select-none">
                                            {!flipped ? (
                                                <div className="w-full aspect-[3/4] rounded-xl flex flex-col items-center justify-center gap-1"
                                                     style={{background:'linear-gradient(145deg,#312e81,#4338ca)', border:'2px solid #6366f1'}}>
                                                    <div className="text-2xl">⬡</div>
                                                    <div className="text-indigo-300 text-[9px] font-black">點擊翻開</div>
                                                </div>
                                            ) : (
                                                <div className="w-full aspect-[3/4] rounded-xl flex flex-col items-center justify-center gap-0.5 overflow-hidden"
                                                     style={{background:'linear-gradient(145deg,#1e293b,#0f172a)', border:'2px solid #f59e0b'}}>
                                                    <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
                                                        onError={e=>{e.target.onerror=null;e.target.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;}}
                                                        alt={name} className="w-14 h-14 object-contain"/>
                                                    <div className="text-white text-[9px] font-black text-center leading-tight px-0.5">{name}</div>
                                                    <div className="text-yellow-400 text-[8px]">{'★'.repeat(Math.min(rar,6))}</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {allFlipped ? (
                                <button onClick={()=>{ grantStarterCards(); setStarterPhase(null); }}
                                    className="w-full mt-2 py-3 rounded-2xl font-black text-white text-lg active:scale-95 bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg">
                                    🗼 開始挑戰！
                                </button>
                            ) : (
                                <div className="text-slate-500 text-xs">翻開所有卡片才能繼續</div>
                            )}
                        </div>
                    );
                })()}
            </div>
        )}

        {rewardPopup && (() => {
            const rp = rewardPopup;
            const lvObj = HEX_TOWER_LEVELS.find(l => l.lv === rp.lv) || {};
            const isWin  = rp.winner === 'p1';
            const isTie  = rp.winner === 'tie';
            const head = isWin
                ? { icon:'🏆', title:'通關成功！', bg:'from-amber-400 to-orange-500' }
                : isTie
                ? { icon:'🤝', title:'平手！', bg:'from-blue-400 to-indigo-500' }
                : { icon:'😢', title:'挑戰失敗', bg:'from-rose-400 to-red-500' };
            return (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-5">
                    <div className="bg-white rounded-3xl max-w-xs w-full overflow-hidden shadow-2xl">
                        <div className={`bg-gradient-to-r ${head.bg} px-5 py-4 text-center`}>
                            <div className="text-5xl mb-1">{head.icon}</div>
                            <div className="text-white font-black text-xl">{head.title}</div>
                            <div className="text-white/90 text-xs font-bold mt-0.5">第 {rp.lv} 關 · {lvObj.name || ''}</div>
                            {isWin && rp.stars > 0 && (
                                <div className="mt-2 text-3xl tracking-widest leading-none">
                                    {'⭐'.repeat(rp.stars)}<span className="opacity-40">{'☆'.repeat(3 - rp.stars)}</span>
                                </div>
                            )}
                        </div>
                        <div className="p-5 text-center">
                            {rp.type === 'first' && (
                                <>
                                    <div className="text-xs font-black text-gray-400 mb-2">🎁 首次通關獎勵</div>
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <span className="text-3xl">🪙</span>
                                        <span className="text-3xl font-black text-yellow-600">+{rp.coins}</span>
                                    </div>
                                    {rp.cardId && (
                                        <div className="bg-indigo-50 rounded-2xl p-3 flex items-center justify-center gap-2">
                                            <img alt="" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${rp.cardId}.png`}
                                                onError={e=>{e.target.onerror=null;e.target.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${rp.cardId}.png`;}}
                                                className="w-14 h-14 object-contain"/>
                                            <div className="text-left">
                                                <div className="text-cyan-600 font-black text-sm">{rp.isNew ? '📖 圖鑑新卡片！' : '🎴 獲得卡片'}</div>
                                                <div className="text-indigo-700 font-black">{(window.getPokemonName && window.getPokemonName(rp.cardId)) || ('#'+rp.cardId)}</div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            {rp.type === 'replay' && (
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <span className="text-3xl">🪙</span>
                                    <span className="text-3xl font-black text-yellow-600">+{rp.coins}</span>
                                </div>
                            )}
                            {(rp.type === 'lose' || rp.type === 'draw') && (
                                <div className="text-sm font-bold text-gray-500 mb-1">再接再厲！調整一下牌組和擺放策略 💪</div>
                            )}
                            <button onClick={()=>setRewardPopup(null)}
                                className="w-full mt-3 py-3 rounded-2xl font-black text-white active:scale-95 bg-gradient-to-r from-purple-500 to-indigo-600">
                                回闖關塔
                            </button>
                        </div>
                    </div>
                </div>
            );
        })()}
      </>
    );
};

window.HexChallengeScreen = HexChallengeScreen;
window.HEX_TOWER_LEVELS = HEX_TOWER_LEVELS;
