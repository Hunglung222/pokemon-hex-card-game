// forge-workshop.js — V70.5 最終規格 (standalone copy)

const ForgeWorkshop = ({ userData, setUserData, onBack }) => {
    const { useState, useEffect, useMemo } = React;

    const [hexCards, setHexCards] = useState({});
    const [tab, setTab] = useState('forge');
    const [selectedId, setSelectedId] = useState(null);
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('info');
    const [searchText, setSearchText] = useState('');
    const [filterRarity, setFilterRarity] = useState(0);
    const [filterType, setFilterType] = useState('');
    const [sortBy, setSortBy] = useState('rarity');
    const [sortDesc, setSortDesc] = useState(true);
    const [confirmUpgrade, setConfirmUpgrade] = useState(null);
    const [confirmForge, setConfirmForge] = useState(null);
    const [forgingAnim, setForgingAnim] = useState(null);
    const [confirmRecycle, setConfirmRecycle] = useState(null);

    const EDGES = [
        { label: '攻擊', icon: '⚔️',  color: 'text-red-400',    bg: 'bg-red-900/70',    border: 'border-red-500' },
        { label: 'HP',   icon: '❤️',  color: 'text-green-400',  bg: 'bg-green-900/70',  border: 'border-green-500' },
        { label: '特防', icon: '💎',  color: 'text-blue-400',   bg: 'bg-blue-900/70',   border: 'border-blue-500' },
        { label: '防禦', icon: '🛡️',  color: 'text-yellow-400', bg: 'bg-yellow-900/70', border: 'border-yellow-500' },
        { label: '速度', icon: '💨',  color: 'text-pink-400',   bg: 'bg-pink-900/70',   border: 'border-pink-500' },
        { label: '特攻', icon: '✨',  color: 'text-purple-400', bg: 'bg-purple-900/70', border: 'border-purple-500' },
    ];

    const TYPE_COLORS = {
        fire:'#ef4444', water:'#3b82f6', grass:'#22c55e', electric:'#eab308',
        psychic:'#a855f7', ice:'#67e8f9', dragon:'#7c3aed', dark:'#374151',
        fighting:'#b45309', normal:'#9ca3af', poison:'#86198f', ground:'#92400e',
        flying:'#7dd3fc', bug:'#65a30d', rock:'#78716c', ghost:'#6d28d9',
        steel:'#94a3b8', fairy:'#f9a8d4',
    };
    const TYPE_ZH = {
        fire:'火', water:'水', grass:'草', electric:'電', psychic:'超能力',
        ice:'冰', dragon:'龍', dark:'惡', fighting:'格鬥', normal:'一般',
        poison:'毒', ground:'地面', flying:'飛行', bug:'蟲', rock:'岩石',
        ghost:'幽靈', steel:'鋼', fairy:'妖精',
    };

    const FORGE_COST = { 1:10, 2:20, 3:30, 4:50, 5:80, 6:100 };
    const MAX_UPGRADES = 3;

    const SORT_OPTIONS = [
        { value:'rarity', label:'⭐ 星等' },
        { value:'total',  label:'💪 總和(BST)' },
        { value:'atk',    label:'⚔️ 攻擊',  idx:0 },
        { value:'hp',     label:'❤️ HP',    idx:1 },
        { value:'spd',    label:'💎 特防',  idx:2 },
        { value:'def',    label:'🛡️ 防禦',  idx:3 },
        { value:'spe',    label:'💨 速度',  idx:4 },
        { value:'spa',    label:'✨ 特攻',  idx:5 },
    ];
    const sortMetric = (stats, rarity) => {
        if (sortBy === 'rarity') return rarity || 1;
        if (sortBy === 'total') return (stats || []).reduce((s,v)=>s+(v||0),0);
        const opt = SORT_OPTIONS.find(o=>o.value===sortBy);
        return opt && opt.idx !== undefined ? (stats?.[opt.idx] || 0) : 0;
    };

    const scaleStat = (s) => Math.max(1, Math.min(10, Math.floor((s || 1) / 15)));

    const migrateHexCards = (cards) => {
        if (!cards || typeof cards !== 'object') return {};
        const completeness = (c) => {
            if (!c) return -1;
            let s = 0;
            if (Array.isArray(c.upgrades)) s += c.upgrades.reduce((a,b)=>a+(b||0),0);
            if (c.types && c.types.length) s += 5;
            return s;
        };
        const bestByid = {};
        Object.keys(cards).forEach(rawKey => {
            const c = cards[rawKey];
            if (!c) return;
            let realId = c.id != null ? parseInt(c.id) : parseInt(rawKey);
            if (Number.isNaN(realId)) return;
            const sc = completeness(c);
            if (!bestByid[realId] || sc > bestByid[realId]._sc) {
                bestByid[realId] = { ...c, id: realId, _sc: sc };
            }
        });
        const out = {};
        Object.keys(bestByid).forEach(id => {
            const c = bestByid[id];
            delete c._sc;
            const upgrades = Array.isArray(c.upgrades) ? c.upgrades : [0,0,0,0,0,0];
            const baseStats = calcStats(parseInt(id));
            const stats = baseStats.map((b, i) => Math.min(10, b + (upgrades[i] || 0)));
            out[String(id)] = { ...c, id: parseInt(id), baseStats, upgrades, stats };
        });
        return out;
    };

    useEffect(() => {
        const username = userData?.username;
        if (!username) return;
        const applyCards = (raw) => {
            const cleaned = migrateHexCards(raw || {});
            setHexCards(cleaned);
            try { localStorage.setItem('hexCards_' + username, JSON.stringify(cleaned)); } catch(e) {}
            const rawKeys = Object.keys(raw || {}).sort().join(',');
            const cleanedKeys = Object.keys(cleaned).sort().join(',');
            const keysChanged = rawKeys !== cleanedKeys;
            if (keysChanged && typeof db !== 'undefined' && db) {
                db.collection('users').doc(username).collection('hexCards').doc('collection')
                    .set({ cards: cleaned }).catch(e => console.warn('自癒寫回失敗', e));
            }
        };
        if (typeof window.loadHexCards === 'function') {
            window.loadHexCards(username)
                .then(cloud => applyCards(cloud || {}))
                .catch(() => {
                    try { applyCards(JSON.parse(localStorage.getItem('hexCards_' + username) || '{}')); }
                    catch(e) { setHexCards({}); }
                });
        } else {
            try { applyCards(JSON.parse(localStorage.getItem('hexCards_' + username) || '{}')); }
            catch(e) { setHexCards({}); }
        }
    }, [userData?.username]);

    const persistCards = (newCards) => {
        const username = userData?.username;
        if (!username) return;
        setHexCards(newCards);
        try { localStorage.setItem('hexCards_' + username, JSON.stringify(newCards)); } catch(e) {}
        if (typeof db !== 'undefined' && db) {
            db.collection('users').doc(username).collection('hexCards').doc('collection')
                .set({ cards: newCards }).catch(e => console.warn('同步失敗', e));
        }
    };

    const showMsg = (text, type) => {
        setMsg(text); setMsgType(type || 'info');
        if (type !== 'error') setTimeout(() => setMsg(''), 2500);
    };

    const adjustCoins = (delta) => {
        const newCoins = Math.max(0, (userData.coins || 0) + delta);
        setUserData({ ...userData, coins: newCoins });
    };

    const calcStats = (pokeId) => {
        const data = (window.POKEMON_BST_DICT || {})[pokeId];
        const conv = window.hbStatToEdge || scaleStat;
        if (data && typeof data === 'object' && data.hp !== undefined) {
            return [conv(data.atk), conv(data.hp), conv(data.spd),
                    conv(data.def), conv(data.spe), conv(data.spa)];
        }
        const rarity = window.getPokemonRarity ? window.getPokemonRarity(pokeId) : 1;
        const base = 2 + rarity * 1.3;
        return Array.from({length:6}, (_, i) => {
            const seed = ((pokeId*1009 + i*997) ^ (pokeId>>3)) & 0xFFFF;
            return Math.max(1, Math.min(10, Math.round(base + (seed%41)/10 - 2)));
        });
    };

    const getTypes = (pokeId) => {
        const data = (window.POKEMON_BST_DICT || {})[pokeId];
        if (data && data.types && Array.isArray(data.types)) return data.types;
        return [];
    };

    const collectedList = useMemo(() => {
        const ids = userData?.unlockedCards || [];
        const counts = {};
        ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        return Object.entries(counts).map(([id, count]) => {
            const pokeId = parseInt(id);
            const name = (window.getPokemonName && window.getPokemonName(pokeId)) || ('#'+pokeId);
            return { id: pokeId, name, count,
                rarity: window.getPokemonRarity ? window.getPokemonRarity(pokeId) : 1,
                types: getTypes(pokeId) };
        }).filter(Boolean).sort((a, b) => b.rarity - a.rarity || a.id - b.id);
    }, [userData?.unlockedCards]);

    const filteredList = useMemo(() => collectedList.filter(p => {
        const matchRarity = filterRarity === 0 || p.rarity === filterRarity;
        const matchSearch = !searchText || p.name.includes(searchText);
        const matchType = !filterType || (p.types || []).includes(filterType);
        return matchRarity && matchSearch && matchType;
    }).map(p => ({ ...p, _stats: calcStats(p.id) })),
    [collectedList, filterRarity, searchText, filterType]);

    const allForgeTypes = useMemo(() => {
        const s = new Set();
        collectedList.forEach(p => (p.types || []).forEach(t => s.add(t)));
        return [...s].sort();
    }, [collectedList]);

    const grouped = useMemo(() => {
        const g = {};
        filteredList.forEach(p => { if (!g[p.rarity]) g[p.rarity] = []; g[p.rarity].push(p); });
        Object.keys(g).forEach(r => {
            g[r].sort((a,b) => {
                const ma = sortMetric(a._stats, a.rarity);
                const mb = sortMetric(b._stats, b.rarity);
                if (ma !== mb) return sortDesc ? mb - ma : ma - mb;
                return a.id - b.id;
            });
        });
        return g;
    }, [filteredList, sortBy, sortDesc]);

    const rarityLabel = { 1:'★ 一星', 2:'★★ 二星', 3:'★★★ 三星', 4:'★★★★ 四星', 5:'★★★★★ 五星', 6:'★×6 傳說' };
    const rarityBg    = { 1:'bg-gray-700', 2:'bg-green-900', 3:'bg-blue-900', 4:'bg-purple-900', 5:'bg-orange-900', 6:'bg-yellow-900' };

    const handleForge = (pokemon) => {
        const cost = FORGE_COST[pokemon.rarity] || 20;
        if (hexCards[pokemon.id]) { showMsg(`⚠️ ${pokemon.name} 已鍛造！`, 'error'); return; }
        if ((userData.coins||0) < cost) { showMsg(`💰 幣不足！需 ${cost}，有 ${userData.coins||0}`, 'error'); return; }
        setConfirmForge({ pokemon, cost });
    };

    const doForge = () => {
        if (!confirmForge) return;
        const { pokemon, cost } = confirmForge;
        if ((userData.coins||0) < cost) {
            showMsg(`💰 幣不足！需 ${cost}`, 'error'); setConfirmForge(null); return;
        }
        const baseStats = calcStats(pokemon.id);
        const types = getTypes(pokemon.id);
        const newCardData = {
            id: pokemon.id, name: pokemon.name, rarity: pokemon.rarity, types,
            baseStats, stats: [...baseStats], upgrades: [0,0,0,0,0,0],
            totalUpgrades: 0, forgedAt: Date.now(),
        };
        const newCards = { ...hexCards, [pokemon.id]: newCardData };
        adjustCoins(-cost);
        persistCards(newCards);
        setConfirmForge(null);
        setForgingAnim({ card: newCardData, phase: 'hammer' });
        setTimeout(() => setForgingAnim(a => a ? { ...a, phase: 'reveal' } : null), 1300);
    };

    const finishForgeAnim = () => {
        const fa = forgingAnim;
        setForgingAnim(null);
        setSelectedId(null);
        setTab('collection');
        if (fa?.card) showMsg(`🎉 ${fa.card.name} 鍛造成功！`, 'success');
    };

    const upgradeCost = (currentVal) => (currentVal + 1) * 5;

    const requestUpgrade = (cardId, edgeIdx) => {
        const card = hexCards[cardId];
        if (!card) return;
        if ((card.upgrades[edgeIdx] || 0) >= MAX_UPGRADES) {
            showMsg(`此邊已達 3 次強化上限！`, 'error'); return;
        }
        const curVal = card.stats[edgeIdx];
        if (curVal >= 10) { showMsg(`${EDGES[edgeIdx].label} 已是 A（最大值）！`, 'error'); return; }
        const cost = upgradeCost(curVal);
        if ((userData.coins||0) < cost) { showMsg(`💰 幣不足！需要 ${cost} 幣`, 'error'); return; }
        setConfirmUpgrade({ cardId, edgeIdx, cost, fromVal: curVal, toVal: curVal + 1 });
    };

    const doUpgrade = () => {
        if (!confirmUpgrade) return;
        const { cardId, edgeIdx, cost } = confirmUpgrade;
        const card = hexCards[cardId];
        const base = card.baseStats || calcStats(parseInt(cardId));
        const newUpgrades = [...card.upgrades]; newUpgrades[edgeIdx]++;
        const newStats = base.map((b, i) => Math.min(10, b + (newUpgrades[i] || 0)));
        const newCards = { ...hexCards, [cardId]: { ...card, baseStats: base,
            stats: newStats, upgrades: newUpgrades,
            totalUpgrades: (card.totalUpgrades||0) + 1 }};
        adjustCoins(-cost);
        persistCards(newCards);
        showMsg(`✨ ${EDGES[edgeIdx].label} ${confirmUpgrade.fromVal}→${newStats[edgeIdx]>=10?'A':newStats[edgeIdx]}！`, 'success');
        setConfirmUpgrade(null);
    };

    const handleRecycle = (card) => {
        const baseCost = FORGE_COST[card.rarity] || 20;
        const base = card.baseStats || calcStats(card.id);
        const upgradeTotalCost = (card.upgrades||[]).reduce((sum, cnt, i) => {
            let c = 0;
            const baseVal = base[i] || 3;
            for (let j = 0; j < cnt; j++) c += (baseVal + j + 1) * 5;
            return sum + c;
        }, 0);
        const totalInvested = baseCost + upgradeTotalCost;
        const refund = Math.floor(totalInvested / 2);
        setConfirmRecycle({ card, totalInvested, refund });
    };

    const doRecycle = () => {
        if (!confirmRecycle) return;
        const { card, refund } = confirmRecycle;
        const newCards = { ...hexCards };
        delete newCards[card.id];
        delete newCards[String(card.id)];
        Object.keys(newCards).forEach(k => {
            const c = newCards[k];
            if (c && c.id != null && String(c.id) === String(card.id)) {
                delete newCards[k];
            }
        });
        adjustCoins(refund);
        persistCards(newCards);
        showMsg(`♻️ ${card.name} 已回收！退還 ${refund} 精靈幣`, 'success');
        setConfirmRecycle(null);
        setSelectedId(null);
    };

    const HexCard = ({ card, size = 'md' }) => {
        const isLg = size === 'lg';
        const W = isLg ? 200 : 112, H = isLg ? 222 : 124;
        const imgSize = isLg ? 100 : 55;
        const dotW = isLg ? 34 : 21;
        const dotFont = isLg ? 13 : 9;

        const edgePos = [
            { top: '18%', left: '71%' }, { top: '50%', left: '86%' },
            { top: '82%', left: '71%' }, { top: '82%', left: '29%' },
            { top: '50%', left: '14%' }, { top: '18%', left: '29%' },
        ];

        const rarityGrad = {
            1:['#9ca3af','#6b7280'], 2:['#4ade80','#15803d'], 3:['#60a5fa','#1d4ed8'],
            4:['#c084fc','#7e22ce'], 5:['#fb923c','#dc2626'], 6:['#fbbf24','#ec4899'],
        };
        const [c1, c2] = rarityGrad[card.rarity] || rarityGrad[1];

        const primaryType = card.types && card.types[0];
        const typeBorderColor = primaryType ? (TYPE_COLORS[primaryType] || '#6b7280') : null;

        return (
            <div className="relative" style={{ width: W, height: H }}>
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0">
                    <defs>
                        <linearGradient id={`fg${card.id}${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/>
                        </linearGradient>
                    </defs>
                    <polygon
                        points={`${W*.5},3 ${W-3},${H*.25} ${W-3},${H*.75} ${W*.5},${H-3} 3,${H*.75} 3,${H*.25}`}
                        fill={`url(#fg${card.id}${size})`}
                        stroke={typeBorderColor || 'rgba(255,255,255,0.3)'} strokeWidth={isLg?3:2}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{paddingBottom: H*0.17}}>
                    <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${card.id}.png`}
                        style={{width:imgSize, height:imgSize, objectFit:'contain'}}
                        onError={e=>{e.target.onerror=null;e.target.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${card.id}.png`;}}
                        alt=""/>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 text-white font-bold whitespace-nowrap z-10"
                    style={{bottom:4, fontSize:isLg?12:9, textShadow:'0 1px 3px rgba(0,0,0,0.9)'}}>
                    {card.name}
                </div>
                {edgePos.map((pos, i) => {
                    const val = card.stats[i];
                    const upCnt = card.upgrades?.[i] || 0;
                    return (
                        <div key={i} className="absolute flex items-center justify-center rounded-full z-10 font-black shadow-md"
                            style={{
                                width:dotW, height:dotW, top:pos.top, left:pos.left,
                                transform:'translate(-50%,-50%)',
                                background: val>=10?'#78350f': upCnt>0?'#1c1917':'rgba(0,0,0,0.88)',
                                border:`${isLg?2:1.5}px solid ${val>=10?'#fde047':upCnt>0?'#fde047':'rgba(255,255,255,0.8)'}`,
                                fontSize:dotFont, color: val>=10||upCnt>0?'#fde047':'white',
                            }}>
                            {val>=10?'A':val}
                        </div>
                    );
                })}
                {card.types && card.types.length > 0 && isLg && (
                    <div className="absolute top-2 left-2 z-20 flex flex-col gap-0.5">
                        {card.types.slice(0,2).map(t => (
                            <div key={t} className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{background: TYPE_COLORS[t]||'#6b7280', fontSize:10}}>
                                {TYPE_ZH[t]||t}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const FilterSortBar = ({ types, count }) => (
        <div className="bg-slate-900/60 rounded-xl p-2 mb-3 space-y-2 border border-slate-700">
            <input type="text" placeholder="🔍 搜尋名稱..." value={searchText}
                onChange={e=>setSearchText(e.target.value)}
                className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400"/>
            <div className="flex gap-1 flex-wrap">
                {[0,1,2,3,4,5,6].map(r=>(
                    <button key={r} onClick={()=>setFilterRarity(r)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold active:scale-95 ${filterRarity===r?'bg-amber-500 text-white':'bg-slate-700 text-slate-300'}`}>
                        {r===0?'全部':r===6?'6★':`${r}★`}
                    </button>
                ))}
            </div>
            <div className="flex gap-1.5 items-center">
                <select value={filterType} onChange={e=>setFilterType(e.target.value)}
                    className="bg-slate-800 text-white border border-slate-600 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-400 flex-1 min-w-0">
                    <option value="">🏷️ 全屬性</option>
                    {types.map(t=>(
                        <option key={t} value={t}>{TYPE_ZH[t]||t}</option>
                    ))}
                </select>
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                    className="bg-slate-800 text-white border border-slate-600 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-400 flex-1 min-w-0">
                    {SORT_OPTIONS.map(o=>(
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <button onClick={()=>setSortDesc(d=>!d)}
                    title={sortDesc?'目前：高→低':'目前：低→高'}
                    className="bg-slate-800 border border-slate-600 text-amber-300 rounded-lg px-2.5 py-1.5 text-sm font-black active:scale-95 flex-shrink-0">
                    {sortDesc?'⬇':'⬆'}
                </button>
            </div>
            {(filterType || filterRarity>0 || searchText) && (
                <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">符合 {count} 種</span>
                    <button onClick={()=>{setFilterType('');setFilterRarity(0);setSearchText('');}}
                        className="text-[11px] text-amber-300 underline active:scale-95">清除篩選</button>
                </div>
            )}
        </div>
    );

    const renderForgeTab = () => {
        if (collectedList.length === 0) return (
            <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">📭</div>
                <p>還沒收集到寶可夢！先去玩遊戲吧</p>
            </div>
        );
        const selected = selectedId ? collectedList.find(p => p.id === selectedId) : null;
        const STAT_LABELS=['攻','HP','特防','防','速','特攻'];
        return (
            <div>
                <FilterSortBar types={allForgeTypes} count={filteredList.length}/>
                {filteredList.length===0
                    ? <div className="text-center py-8 text-gray-400">找不到符合的寶可夢</div>
                    : Object.keys(grouped).sort((a,b)=>b-a).map(rarity=>(
                        <div key={rarity} className="mb-4">
                            <div className={`${rarityBg[rarity]} text-white text-xs font-bold px-3 py-1.5 rounded-t-xl`}>
                                {rarityLabel[rarity]} — {grouped[rarity].length} 種 · 鍛造費 {FORGE_COST[rarity]} 🪙
                            </div>
                            <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-2 rounded-b-xl">
                                {grouped[rarity].map(p=>{
                                    const forged=!!hexCards[p.id];
                                    const st=p._stats||calcStats(p.id);
                                    const total=st.reduce((s,v)=>s+v,0);
                                    return (
                                        <button key={p.id} onClick={()=>setSelectedId(selectedId===p.id?null:p.id)}
                                            className={`relative bg-slate-800 border-2 rounded-xl p-2 active:scale-95 ${
                                                selectedId===p.id?'border-yellow-400 ring-2 ring-yellow-300':
                                                forged?'border-green-600':'border-slate-600'}`}>
                                            {forged&&<div className="absolute top-1 right-1 text-xs z-10">✅</div>}
                                            {p.count>1&&<div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1 rounded-full z-10">×{p.count}</div>}
                                            <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`}
                                                style={{width:58,height:58,objectFit:'contain',margin:'0 auto',display:'block'}}
                                                onError={e=>{e.target.onerror=null;e.target.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;}}
                                                alt=""/>
                                            <div className="text-white text-[11px] font-bold truncate text-center mt-1">{p.name}</div>
                                            <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
                                                {p.types.slice(0,2).map(t=>(
                                                    <span key={t} className="text-white text-[9px] px-1 rounded-sm"
                                                        style={{background:TYPE_COLORS[t]||'#6b7280'}}>
                                                        {TYPE_ZH[t]||t}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-1 grid grid-cols-3 gap-px text-[8px] text-center">
                                                {st.map((v,i)=>(
                                                    <div key={i} className="bg-black/40 rounded px-0.5 py-px">
                                                        <span className="text-slate-400">{STAT_LABELS[i]}</span>
                                                        <span className={`font-black ml-0.5 ${v>=10?'text-yellow-300':v>=7?'text-green-300':'text-white'}`}>{v>=10?'A':v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-center text-[8px] text-amber-300 font-bold mt-0.5">總和 {total}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                }
                <div style={{height: selected ? 96 : 0}}/>
            </div>
        );
    };

    const renderCollection = () => {
        const allOwnTypes = [...new Set(Object.values(hexCards).flatMap(c=>c.types||[]))].sort();
        const cards = Object.values(hexCards)
            .filter(c => {
                if (filterRarity && (c.rarity||1)!==filterRarity) return false;
                if (searchText && !(c.name||'').includes(searchText)) return false;
                if (filterType && !(c.types||[]).includes(filterType)) return false;
                return true;
            })
            .sort((a,b)=>{
                const ma=sortMetric(a.stats, a.rarity);
                const mb=sortMetric(b.stats, b.rarity);
                if (ma!==mb) return sortDesc ? mb-ma : ma-mb;
                return a.id-b.id;
            });
        const totalCards = Object.keys(hexCards).length;
        if (totalCards===0) return (
            <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">🔨</div>
                <p>還沒有六角戰鬥卡！前往「鍛造」分頁打造</p>
            </div>
        );
        const selCard = selectedId ? hexCards[selectedId] : null;
        return (
            <div>
                <FilterSortBar types={allOwnTypes} count={cards.length}/>
                {selCard && (
                    <div className="sticky top-0 z-20 bg-purple-950/97 border-2 border-purple-500 rounded-2xl p-3 mb-3 shadow-2xl">
                        <div className="flex gap-3 items-start">
                            <div className="flex-shrink-0">
                                <HexCard card={selCard} size="lg"/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-purple-100 font-black text-base">{selCard.name}</span>
                                    <button onClick={()=>setSelectedId(null)} className="text-purple-300 text-2xl font-black leading-none px-1">✕</button>
                                </div>
                                <div className="flex items-center gap-1 flex-wrap mb-2">
                                    {(selCard.types||[]).map(t=>(
                                        <span key={t} className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                            style={{background:TYPE_COLORS[t]||'#6b7280'}}>
                                            {TYPE_ZH[t]||t}
                                        </span>
                                    ))}
                                    {(selCard.types||[]).length===0 && (
                                        <span className="text-gray-400 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700">無屬性資料</span>
                                    )}
                                </div>
                                <div className="text-purple-300 text-xs mb-2">費用 = 目標數值 × 5 · 每邊最多 3 次</div>
                                <div className="flex gap-2 items-center">
                                    <div className="text-purple-300 text-xs flex-1">👇 點下方數值格強化</div>
                                    <button onClick={()=>handleRecycle(selCard)}
                                        className="bg-red-900/80 hover:bg-red-800 border border-red-600 text-red-200 text-xs px-2 py-1 rounded-lg font-bold active:scale-95 flex items-center gap-1">
                                        ♻️ 回收（半價）
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {EDGES.map((edge,i)=>{
                                const val=selCard.stats[i];
                                const upCnt=selCard.upgrades[i]||0;
                                const edgeMaxed=upCnt>=MAX_UPGRADES;
                                const valMaxed=val>=10;
                                const disabled=edgeMaxed||valMaxed;
                                const cost=upgradeCost(val);
                                const canAfford=(userData.coins||0)>=cost;
                                return (
                                    <button key={i} onClick={()=>!disabled&&requestUpgrade(selCard.id,i)}
                                        disabled={disabled}
                                        className={`rounded-xl p-2 border-2 text-center active:scale-95 transition-all ${
                                            disabled?'opacity-40 cursor-not-allowed border-gray-600 bg-gray-800':
                                            canAfford?`${edge.bg} ${edge.border} cursor-pointer`:'bg-gray-800 border-gray-600 opacity-60'}`}>
                                        <div className="text-lg">{edge.icon}</div>
                                        <div className={`text-xs font-bold ${edge.color}`}>{edge.label}</div>
                                        <div className="text-white font-black text-lg">
                                            {valMaxed?'A':val}
                                            {!disabled&&<span className="text-xs text-gray-400"> →{val+1>=10?'A':val+1}</span>}
                                        </div>
                                        {!disabled&&<div className={`text-xs font-bold ${canAfford?'text-yellow-300':'text-red-400'}`}>{cost}🪙</div>}
                                        {valMaxed&&<div className="text-yellow-300 text-xs font-bold">MAX</div>}
                                        {edgeMaxed&&!valMaxed&&<div className="text-red-400 text-xs">已 3 次</div>}
                                        <div className="flex justify-center gap-0.5 mt-1">
                                            {Array.from({length:MAX_UPGRADES},(_,j)=>(
                                                <div key={j} style={{width:5,height:5,borderRadius:'50%',background:j<upCnt?'#facc15':'#374151'}}/>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                <div className="text-purple-300 text-xs text-center mb-2">🃏 顯示 {cards.length} / 共 {totalCards} 張 · 點卡片查看強化 · 點「回收」半價退幣</div>
                <div className="grid grid-cols-2 gap-3">
                    {cards.map(card=>(
                        <button key={card.id} onClick={()=>setSelectedId(selectedId===card.id?null:card.id)}
                            className={`bg-slate-800 border-2 rounded-xl p-3 flex flex-col items-center active:scale-95 ${
                                selectedId===card.id?'border-purple-400 ring-2 ring-purple-400':'border-slate-600'}`}>
                            <HexCard card={card} size="md"/>
                            <div className="text-white text-xs font-bold truncate w-full text-center mt-2">{card.name}</div>
                            <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                                {(card.types||[]).slice(0,2).map(t=>(
                                    <span key={t} className="text-white text-[9px] px-1 rounded-sm"
                                        style={{background:TYPE_COLORS[t]||'#6b7280'}}>
                                        {TYPE_ZH[t]||t}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-amber-950 to-slate-900 flex flex-col">
            <style>{`
                @keyframes forgeHammer{0%,100%{transform:rotate(-18deg) translateY(0)}50%{transform:rotate(10deg) translateY(8px)}}
                @keyframes forgeAnvilShake{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
                @keyframes forgeSpark{0%{transform:rotate(var(--ang)) translateY(0) scale(1);opacity:1}100%{transform:rotate(var(--ang)) translateY(-90px) scale(0);opacity:0}}
                @keyframes forgeReveal{0%{transform:scale(0.2) rotate(-180deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
                @keyframes forgePop{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}
            `}</style>
            {confirmUpgrade && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border-2 border-yellow-400 rounded-2xl p-5 max-w-xs w-full text-center">
                        <div className="text-3xl mb-2">⚡</div>
                        <div className="text-white font-black text-lg mb-1">確認強化？</div>
                        <div className="text-gray-300 text-sm mb-3">
                            {EDGES[confirmUpgrade.edgeIdx].icon} {EDGES[confirmUpgrade.edgeIdx].label}：
                            <span className="text-white font-bold">{confirmUpgrade.fromVal}</span>
                            {' → '}
                            <span className="text-yellow-300 font-black text-lg">{confirmUpgrade.toVal>=10?'A':confirmUpgrade.toVal}</span>
                        </div>
                        <div className="bg-yellow-900/40 border border-yellow-500 rounded-xl p-2 mb-4">
                            <div className="text-yellow-300 font-black text-xl">{confirmUpgrade.cost} 🪙</div>
                            <div className="text-yellow-200 text-xs">目標數值 {confirmUpgrade.toVal>=10?10:confirmUpgrade.toVal} × 5</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={()=>setConfirmUpgrade(null)} className="flex-1 bg-gray-600 text-white py-2 rounded-xl font-bold active:scale-95">取消</button>
                            <button onClick={doUpgrade} className="flex-1 bg-yellow-500 text-black py-2 rounded-xl font-black active:scale-95">確認強化</button>
                        </div>
                    </div>
                </div>
            )}

            {forgingAnim && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-hidden"
                     style={{background:'radial-gradient(circle at center, rgba(120,53,15,0.97), rgba(15,23,42,0.98))'}}>
                    {forgingAnim.phase==='hammer' && [...Array(12)].map((_,i)=>(
                        <div key={i} className="absolute rounded-full"
                            style={{
                                width:6, height:6, background:i%2?'#fbbf24':'#f97316',
                                left:'50%', top:'45%',
                                animation:`forgeSpark 0.9s ease-out ${(i*0.07)}s infinite`,
                                ['--ang']:`${i*30}deg`,
                            }}/>
                    ))}
                    <div className="text-center relative">
                        {forgingAnim.phase==='hammer' ? (
                            <>
                                <div className="text-7xl" style={{animation:'forgeHammer 0.55s ease-in-out infinite'}}>🔨</div>
                                <div className="text-6xl mt-2" style={{animation:'forgeAnvilShake 0.55s ease-in-out infinite'}}>⬡</div>
                                <div className="text-amber-200 font-black text-lg mt-4 tracking-widest">鍛造中…</div>
                                <div className="text-amber-300/70 text-sm mt-1">大木博士正在打造六角戰鬥卡</div>
                            </>
                        ) : (
                            <>
                                <div className="text-amber-300 font-black text-xl mb-3" style={{animation:'forgePop 0.5s ease-out'}}>✨ 鍛造完成！✨</div>
                                <div className="flex justify-center" style={{animation:'forgeReveal 0.6s cubic-bezier(0.34,1.56,0.64,1)'}}>
                                    <div style={{filter:'drop-shadow(0 0 24px rgba(251,191,36,0.9))'}}>
                                        <HexCard card={forgingAnim.card} size="lg"/>
                                    </div>
                                </div>
                                <div className="text-white font-black text-lg mt-3">{forgingAnim.card.name}</div>
                                <div className="text-amber-200 text-sm">{'⭐'.repeat(forgingAnim.card.rarity||1)}</div>
                                <button onClick={finishForgeAnim}
                                    className="mt-5 px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-2xl font-black text-lg active:scale-95 shadow-lg">
                                    收下卡牌 🎴
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {confirmForge && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border-2 border-amber-400 rounded-2xl p-5 max-w-xs w-full text-center">
                        <div className="text-3xl mb-2">🔨</div>
                        <div className="text-white font-black text-lg mb-1">確認鍛造？</div>
                        <div className="text-gray-300 text-sm mb-1">
                            將「<span className="text-amber-200 font-bold">{confirmForge.pokemon.name}</span>」
                            打造成六角戰鬥卡
                        </div>
                        <div className="text-amber-300 text-xs mb-3">
                            {'⭐'.repeat(confirmForge.pokemon.rarity)}
                        </div>
                        <div className="bg-amber-900/40 border border-amber-500 rounded-xl p-2 mb-2">
                            <div className="text-amber-300 font-black text-xl">{confirmForge.cost} 🪙</div>
                            <div className="text-amber-200 text-xs">
                                鍛造後剩餘：{(userData.coins||0) - confirmForge.cost} 🪙
                            </div>
                        </div>
                        <div className="text-gray-400 text-xs mb-4">
                            💡 鍛造後可在「我的卡牌」強化六邊數值
                        </div>
                        <div className="flex gap-2">
                            <button onClick={()=>setConfirmForge(null)}
                                className="flex-1 bg-gray-600 text-white py-2 rounded-xl font-bold active:scale-95">取消</button>
                            <button onClick={doForge}
                                className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-white py-2 rounded-xl font-black active:scale-95">
                                確認鍛造
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmRecycle && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border-2 border-red-500 rounded-2xl p-5 max-w-xs w-full text-center">
                        <div className="text-3xl mb-2">♻️</div>
                        <div className="text-white font-black text-lg mb-1">確認回收？</div>
                        <div className="text-gray-300 text-sm mb-3">
                            將「<span className="text-red-200 font-bold">{confirmRecycle.card.name}</span>」
                            回收給大木博士
                        </div>
                        <div className="bg-slate-900/60 border border-slate-600 rounded-xl p-2 mb-2 space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">累計投入</span>
                                <span className="text-gray-200 font-bold">{confirmRecycle.totalInvested} 🪙</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-red-300 font-bold">回收退還（半價）</span>
                                <span className="text-red-200 font-black">+{confirmRecycle.refund} 🪙</span>
                            </div>
                        </div>
                        <div className="bg-red-900/40 border border-red-500 rounded-xl p-2 mb-4">
                            <div className="text-red-300 text-xs font-bold">
                                ⚠️ 卡片將永久刪除，升級數值一併消失，無法復原！
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={()=>setConfirmRecycle(null)}
                                className="flex-1 bg-gray-600 text-white py-2 rounded-xl font-bold active:scale-95">取消</button>
                            <button onClick={doRecycle}
                                className="flex-1 bg-red-600 text-white py-2 rounded-xl font-black active:scale-95">
                                確認回收
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex items-center gap-3 p-4 bg-black/40 sticky top-0 z-30">
                <button onClick={onBack} className="bg-slate-700 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl active:scale-90">←</button>
                <div className="flex-1">
                    <div className="text-yellow-400 font-black text-lg">🔨 大木博士的鍛造工坊</div>
                    <div className="text-amber-300 text-sm">🪙 精靈幣：<span className="font-bold text-yellow-200">{userData?.coins||0}</span></div>
                </div>
            </div>
            {msg&&(
                <div className={`mx-4 mt-2 p-3 rounded-xl text-sm font-bold text-center border z-30 ${
                    msgType==='success'?'bg-green-900/80 text-green-200 border-green-500':
                    msgType==='error'?'bg-red-900/80 text-red-200 border-red-500':
                    'bg-blue-900/80 text-blue-200 border-blue-500'}`}>{msg}</div>
            )}
            <div className="flex mx-4 mt-3 bg-slate-800 rounded-xl p-1 gap-1 sticky z-20" style={{top:72}}>
                <button onClick={()=>{setTab('forge');setSelectedId(null);setFilterType('');setSortBy('rarity');setSortDesc(true);}}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm ${tab==='forge'?'bg-amber-600 text-white':'text-slate-400'}`}>
                    🔨 鍛造</button>
                <button onClick={()=>{setTab('collection');setSelectedId(null);setFilterType('');setSortBy('rarity');setSortDesc(true);}}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm ${tab==='collection'?'bg-purple-600 text-white':'text-slate-400'}`}>
                    🃏 我的卡牌（{Object.keys(hexCards).length}）</button>
            </div>
            <div className="flex-1 px-4 py-4 overflow-y-auto">
                {tab==='forge'?renderForgeTab():renderCollection()}
            </div>

            {tab==='forge' && selectedId && (() => {
                const sel = collectedList.find(p=>p.id===selectedId);
                if (!sel) return null;
                const cost = FORGE_COST[sel.rarity] || 20;
                const already = !!hexCards[sel.id];
                const poor = (userData.coins||0) < cost;
                return (
                    <div className="sticky bottom-0 z-30 bg-amber-950/97 border-t-2 border-amber-500 px-3 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-3">
                            <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${sel.id}.png`}
                                style={{width:44,height:44,objectFit:'contain'}} className="flex-shrink-0"
                                onError={e=>{e.target.onerror=null;e.target.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${sel.id}.png`;}}
                                alt=""/>
                            <div className="flex-1 min-w-0">
                                <div className="text-yellow-300 font-black text-sm truncate">{sel.name}</div>
                                <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-amber-200 text-[10px]">{'⭐'.repeat(sel.rarity)}</span>
                                    {sel.types.map(t=>(
                                        <span key={t} className="text-white text-[9px] font-bold px-1 rounded-full"
                                            style={{background:TYPE_COLORS[t]||'#6b7280'}}>{TYPE_ZH[t]||t}</span>
                                    ))}
                                    <span className="text-amber-200 text-[10px]">· 持有 {sel.count}</span>
                                </div>
                            </div>
                            {already ? (
                                <div className="bg-blue-900/60 text-blue-200 text-[11px] px-2 py-2 rounded-xl font-bold text-center flex-shrink-0">✅ 已鍛造<br/>去強化</div>
                            ) : poor ? (
                                <div className="bg-red-900/60 text-red-200 text-[11px] px-2 py-2 rounded-xl font-bold text-center flex-shrink-0">💰 幣不足<br/>需 {cost}</div>
                            ) : (
                                <button onClick={()=>handleForge(sel)}
                                    className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-4 py-2.5 rounded-xl font-black text-sm active:scale-95 flex-shrink-0">
                                    🔨 鍛造<br/>{cost} 🪙
                                </button>
                            )}
                            <button onClick={()=>setSelectedId(null)} className="text-amber-300 text-xl font-black leading-none px-1 flex-shrink-0">✕</button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

window.ForgeWorkshop = ForgeWorkshop;
