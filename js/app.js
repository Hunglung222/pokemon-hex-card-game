// app.js — 獨立六角卡牌遊戲入口
const { useState, useEffect } = React;

const DEFAULT_USER = {
    username: 'local_player',
    nickname: '訓練家',
    isGuest: false,
    coins: 500,
    unlockedCards: [1,4,7,25,16,13,74,63,10,19,21,41,54,60],
    cardDates: {},
    favPokemon: 25,
    hexWins: 0
};

const App = () => {
    const [userData, setUserData] = useState(() => {
        try {
            const saved = localStorage.getItem('hexGameUser');
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return { ...DEFAULT_USER };
    });
    const [screen, setScreen] = useState('menu');

    useEffect(() => {
        try {
            localStorage.setItem('hexGameUser', JSON.stringify(userData));
        } catch(e) {}
    }, [userData]);

    // 同步 username 給其他模組使用
    useEffect(() => {
        if (userData?.username) {
            // 確保有基本解鎖卡
            if (!userData.unlockedCards || userData.unlockedCards.length < 5) {
                setUserData(prev => ({
                    ...prev,
                    unlockedCards: [...new Set([...(prev.unlockedCards||[]), ...DEFAULT_USER.unlockedCards])]
                }));
            }
        }
    }, []);

    if (screen === 'hex_battle') {
        return <window.HexBattle
            userData={userData}
            setUserData={setUserData}
            onBack={() => setScreen('menu')}
        />;
    }
    if (screen === 'hex_challenge') {
        return <window.HexChallengeScreen
            userData={userData}
            setUserData={setUserData}
            onBack={() => setScreen('menu')}
        />;
    }
    if (screen === 'forge') {
        return <window.ForgeWorkshop
            userData={userData}
            setUserData={setUserData}
            onBack={() => setScreen('menu')}
        />;
    }

    // 主選單
    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-6">
            <div className="text-7xl mb-4">⬡</div>
            <h1 className="text-3xl font-black text-white mb-1 text-center">寶可夢六角蜂巢卡牌</h1>
            <p className="text-purple-300 text-sm mb-8 text-center">FF8 風格 · SAME / PLUS / COMBO</p>

            <div className="bg-yellow-500/20 border border-yellow-500 rounded-full px-5 py-2 flex items-center gap-2 mb-8">
                <span className="text-yellow-300 text-lg">🪙</span>
                <span className="text-yellow-200 font-black text-lg">{userData.coins || 0}</span>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-4">
                <button onClick={() => setScreen('hex_battle')}
                    className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white w-full py-5 rounded-2xl text-xl font-black shadow-lg active:scale-95 flex justify-center items-center gap-3">
                    <span>⬡ 自由對戰</span>
                </button>
                <button onClick={() => setScreen('hex_challenge')}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-white w-full py-5 rounded-2xl text-xl font-black shadow-lg active:scale-95 flex justify-center items-center gap-3">
                    <span>🗼 闖關塔 (30關)</span>
                </button>
                <button onClick={() => setScreen('forge')}
                    className="bg-gradient-to-r from-yellow-600 to-amber-700 text-white w-full py-5 rounded-2xl text-xl font-black shadow-lg active:scale-95 flex justify-center items-center gap-3">
                    <span>🔨 鍛造工坊</span>
                </button>
            </div>

            <div className="mt-10 text-center text-slate-400 text-xs">
                <div>獨立版本 · 來自寶可夢學習宇宙</div>
                <div className="mt-1 font-mono">{window.APP_VERSION || 'V1.0'}</div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
