// hex-battle.js — Standalone playable version
// Supports free battle + towerConfig mode

const HB_DIRS = [
  {dx:1, dy:-1}, {dx:1, dy:0}, {dx:0, dy:1},
  {dx:-1, dy:1}, {dx:-1, dy:0}, {dx:0, dy:-1}
];

const BOARD_LAYOUTS = {
  7:  [{q:0,r:0},{q:1,r:-1},{q:1,r:0},{q:0,r:1},{q:-1,r:1},{q:-1,r:0},{q:0,r:-1}],
  10: [{q:0,r:0},{q:1,r:-1},{q:1,r:0},{q:0,r:1},{q:-1,r:1},{q:-1,r:0},{q:0,r:-1},{q:2,r:-1},{q:-2,r:1},{q:1,r:1}],
  19: (() => {
    const cells = [];
    for (let q=-2; q<=2; q++) for (let r=-2; r<=2; r++) {
      if (Math.abs(q+r) <= 2) cells.push({q,r});
    }
    return cells;
  })()
};

const makeCard = (id) => {
  const name = (window.getPokemonName && window.getPokemonName(id)) || ('#'+id);
  const rarity = (window.getPokemonRarity && window.getPokemonRarity(id)) || 2;
  const data = (window.POKEMON_BST_DICT || {})[id] || {};
  const conv = window.hbStatToEdge || (s => Math.max(1, Math.min(10, Math.floor((s||50)/15))));
  let stats;
  if (data.hp !== undefined) {
    stats = [conv(data.atk), conv(data.hp), conv(data.spd), conv(data.def), conv(data.spe), conv(data.spa)];
  } else {
    const base = 2 + rarity * 1.2;
    stats = Array.from({length:6}, (_,i) => Math.max(1, Math.min(10, Math.round(base + ((id*1009+i*997)&0xF)/5 - 1))));
  }
  return {
    id, name, rarity,
    types: data.types || [],
    baseStats: [...stats],
    stats: [...stats],
    upgrades: [0,0,0,0,0,0]
  };
};

const HexBattle = ({ userData, setUserData, onBack, towerConfig, onTowerReport, onTowerComplete }) => {
  const { useState, useEffect, useRef } = React;

  const isTower = !!towerConfig;
  const boardSize = isTower ? (towerConfig.board || 7) : 7;
  const layout = BOARD_LAYOUTS[boardSize] || BOARD_LAYOUTS[7];
  const rules = isTower ? (towerConfig.rules || {same:true, plus:true}) : {same:true, plus:true};
  const spLimit = isTower ? (towerConfig.sp || 2) : 2;
  const centerBonus = isTower ? (towerConfig.center || 1) : 1;

  const [phase, setPhase] = useState(isTower ? 'loading' : 'menu');
  const [playerHand, setPlayerHand] = useState([]);
  const [aiHand, setAiHand] = useState([]);
  const [board, setBoard] = useState({});
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [spLeft, setSpLeft] = useState(spLimit);
  const [turn, setTurn] = useState('p1');
  const [winner, setWinner] = useState(null);
  const [score, setScore] = useState({p1:0, ai:0});
  const [message, setMessage] = useState('');
  const [availableCards, setAvailableCards] = useState([]);
  const [pickSel, setPickSel] = useState([]);

  useEffect(() => {
    const load = async () => {
      const username = userData?.username || 'local_player';
      let cards = {};
      try {
        if (window.loadHexCards) cards = await window.loadHexCards(username);
        else cards = JSON.parse(localStorage.getItem('hexCards_' + username) || '{}');
      } catch(e) {}
      let list = Object.values(cards || {});
      if (list.length === 0) {
        const starters = [1,4,7,25,16,13,74,63,10,19,21,41];
        starters.forEach(id => { cards[id] = makeCard(id); });
        try { localStorage.setItem('hexCards_' + username, JSON.stringify(cards)); } catch(e){}
        list = Object.values(cards);
      }
      setAvailableCards(list);

      if (isTower) {
        // auto deck for tower
        const handSize = boardSize === 7 ? 5 : boardSize === 10 ? 6 : 8;
        let pool = list;
        if (towerConfig.starMax) pool = pool.filter(c => (c.rarity||2) <= towerConfig.starMax);
        if (towerConfig.starMin) pool = pool.filter(c => (c.rarity||2) >= towerConfig.starMin);
        if (towerConfig.typeLock) pool = pool.filter(c => (c.types||[]).includes(towerConfig.typeLock));
        if (pool.length < 3) pool = list;
        const shuffled = [...pool].sort(() => Math.random()-0.5).slice(0, Math.min(handSize, pool.length));
        if (shuffled.length > 0) {
          startWithDeck(shuffled.map(c => c.id), list);
        } else {
          setPhase('menu');
        }
      }
    };
    load();
  }, [userData?.username]);

  const startWithDeck = (selectedIds, cardList) => {
    const source = cardList || availableCards;
    const hand = selectedIds.map(id => {
      const found = source.find(c => c.id === id);
      return found ? {...found, stats:[...found.stats]} : makeCard(id);
    });
    const aiIds = [];
    const pool = (window.STAR_POOL && window.STAR_POOL[3]) || [25,1,4,7,16,13,74];
    while (aiIds.length < hand.length) {
      const id = pool[Math.floor(Math.random()*pool.length)];
      if (!aiIds.includes(id)) aiIds.push(id);
    }
    const aiH = aiIds.map(id => makeCard(id));

    setPlayerHand(hand);
    setAiHand(aiH);
    setBoard({});
    setSpLeft(spLimit);
    setTurn('p1');
    setWinner(null);
    setScore({p1:0, ai:0});
    setPhase('play');
    setMessage('你的回合，選擇一張卡放到棋盤上');
  };

  const cellKey = (q,r) => q+','+r;

  const getNeighbors = (q,r) => HB_DIRS.map((d,i) => ({q: q+d.dx, r: r+d.dy, dir: i}));

  const placeCard = (q, r, card, owner) => {
    const key = cellKey(q,r);
    if (board[key]) return {ok:false, board};

    let stats = [...card.stats];
    const newBoard = {...board, [key]: {owner, card: {...card, stats}}};

    const neighbors = getNeighbors(q,r);
    let sameHits = [];
    let plusSums = [];

    neighbors.forEach(n => {
      const nKey = cellKey(n.q, n.r);
      const neighbor = newBoard[nKey];
      if (!neighbor || neighbor.owner === owner) return;

      const myEdge = stats[n.dir];
      const oppEdge = neighbor.card.stats[(n.dir + 3) % 6];

      if (myEdge > oppEdge) {
        newBoard[nKey] = {...neighbor, owner};
      } else if (rules.same && myEdge === oppEdge) {
        sameHits.push(nKey);
      }
      plusSums.push(myEdge + oppEdge);
    });

    if (rules.same && sameHits.length >= 2) {
      sameHits.forEach(k => {
        if (newBoard[k] && newBoard[k].owner !== owner) {
          newBoard[k] = {...newBoard[k], owner};
        }
      });
      setMessage('SAME 觸發！');
    }

    if (rules.plus) {
      const cnt = {};
      plusSums.forEach(s => cnt[s] = (cnt[s]||0)+1);
      if (Object.values(cnt).some(c => c >= 2)) {
        neighbors.forEach(n => {
          const nKey = cellKey(n.q, n.r);
          if (newBoard[nKey] && newBoard[nKey].owner !== owner) {
            newBoard[nKey] = {...newBoard[nKey], owner};
          }
        });
        setMessage(m => (m ? m+' + ' : '') + 'PLUS 觸發！');
      }
    }

    return {ok:true, board: newBoard};
  };

  const calcScores = (b) => {
    let p1 = 0, ai = 0;
    Object.values(b).forEach(cell => {
      if (cell.owner === 'p1') p1++;
      else ai++;
    });
    const center = b[cellKey(0,0)];
    if (center) {
      if (center.owner === 'p1') p1 += (centerBonus - 1);
      else ai += (centerBonus - 1);
    }
    return {p1, ai};
  };

  const checkEnd = (b, pHand, aHand) => {
    const empty = layout.filter(c => !b[cellKey(c.q,c.r)]).length;
    if (empty === 0 || (pHand.length === 0 && aHand.length === 0)) {
      const sc = calcScores(b);
      setScore(sc);
      let w = 'tie';
      if (sc.p1 > sc.ai) w = 'p1';
      else if (sc.ai > sc.p1) w = 'ai';
      setWinner(w);
      setPhase('over');
      if (isTower && onTowerReport) onTowerReport(w, sc.p1, sc.ai);
      return true;
    }
    return false;
  };

  const handlePlace = (q, r) => {
    if (turn !== 'p1' || selectedCardIdx === null || phase !== 'play') return;
    const card = playerHand[selectedCardIdx];
    if (!card) return;
    const res = placeCard(q, r, card, 'p1');
    if (!res.ok) return;

    setBoard(res.board);
    const newHand = playerHand.filter((_,i) => i !== selectedCardIdx);
    setPlayerHand(newHand);
    setSelectedCardIdx(null);

    if (checkEnd(res.board, newHand, aiHand)) return;

    setTurn('ai');
    setMessage('對手思考中...');
    setTimeout(() => {
      // AI move
      const emptyCells = layout.filter(c => !res.board[cellKey(c.q,c.r)]);
      if (emptyCells.length === 0 || aiHand.length === 0) {
        checkEnd(res.board, newHand, aiHand);
        return;
      }
      let bestIdx = 0, bestScore = -1;
      aiHand.forEach((c,i) => {
        const total = c.stats.reduce((a,b)=>a+b,0);
        if (total > bestScore) { bestScore = total; bestIdx = i; }
      });
      const aiCard = aiHand[bestIdx];
      const cell = emptyCells[Math.floor(Math.random()*emptyCells.length)];
      const aiRes = placeCard(cell.q, cell.r, aiCard, 'ai');
      // note: placeCard uses current board state, but we already updated, so need careful
      // for simplicity re-apply on latest
      setBoard(prev => {
        const finalBoard = {...prev};
        // re-do AI place on current
        const key = cellKey(cell.q, cell.r);
        if (!finalBoard[key]) {
          finalBoard[key] = {owner:'ai', card: {...aiCard, stats:[...aiCard.stats]}};
          // simple flip for AI
          getNeighbors(cell.q, cell.r).forEach(n => {
            const nKey = cellKey(n.q, n.r);
            const nei = finalBoard[nKey];
            if (nei && nei.owner === 'p1') {
              const myE = aiCard.stats[n.dir];
              const opE = nei.card.stats[(n.dir+3)%6];
              if (myE > opE) finalBoard[nKey] = {...nei, owner:'ai'};
            }
          });
        }
        const newAiHand = aiHand.filter((_,i)=>i!==bestIdx);
        setAiHand(newAiHand);
        if (!checkEnd(finalBoard, newHand, newAiHand)) {
          setTurn('p1');
          setMessage('你的回合');
        }
        return finalBoard;
      });
    }, 800);
  };

  // RENDER
  if (phase === 'loading') {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold">載入中...</div>;
  }

  if (phase === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-slate-900 flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">⬡</div>
        <h1 className="text-2xl font-black text-white mb-6">自由對戰</h1>
        <button onClick={() => setPhase('pick')}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95">
          開始對戰
        </button>
        <button onClick={onBack} className="mt-6 text-slate-400 font-bold">返回主選單</button>
      </div>
    );
  }

  if (phase === 'pick') {
    const handSize = 5;
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setPhase('menu')} className="px-3 py-1.5 bg-slate-700 text-white rounded-xl font-bold">←</button>
            <h2 className="text-white font-black text-lg">選擇 {handSize} 張卡出戰</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4 max-h-[60vh] overflow-y-auto">
            {availableCards.map(c => {
              const chosen = pickSel.includes(c.id);
              return (
                <button key={c.id} onClick={() => {
                  if (chosen) setPickSel(pickSel.filter(id => id !== c.id));
                  else if (pickSel.length < handSize) setPickSel([...pickSel, c.id]);
                }}
                  className={`p-2 rounded-xl border-2 ${chosen ? 'border-yellow-400 bg-yellow-900/40' : 'border-slate-600 bg-slate-800'}`}>
                  <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${c.id}.png`}
                    className="w-14 h-14 mx-auto object-contain"
                    onError={e=>{e.target.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${c.id}.png`}}/>
                  <div className="text-white text-xs font-bold text-center truncate">{c.name}</div>
                  <div className="text-yellow-400 text-[10px] text-center">{'★'.repeat(Math.min(c.rarity||1,5))}</div>
                </button>
              );
            })}
          </div>
          <button disabled={pickSel.length !== handSize}
            onClick={() => startWithDeck(pickSel)}
            className={`w-full py-3 rounded-2xl font-black text-white ${
              pickSel.length === handSize ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-slate-700 opacity-50'}`}>
            確認出戰 ({pickSel.length}/{handSize})
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'over') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">{winner==='p1'?'🏆':winner==='ai'?'😢':'🤝'}</div>
        <div className="text-2xl font-black text-white mb-2">
          {winner==='p1'?'勝利！':winner==='ai'?'敗北...':'平手'}
        </div>
        <div className="text-lg text-slate-300 mb-6">你 {score.p1} : {score.ai} 對手</div>
        {isTower ? (
          <button onClick={() => onTowerComplete && onTowerComplete()}
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-3 rounded-2xl font-black">
            繼續闖關
          </button>
        ) : (
          <>
            <button onClick={() => { setPhase('menu'); setPickSel([]); }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-black mb-3">
              再來一局
            </button>
            <button onClick={onBack} className="text-slate-400 font-bold">返回主選單</button>
          </>
        )}
      </div>
    );
  }

  // PLAY
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950 flex flex-col">
      <div className="flex items-center justify-between p-3 bg-black/40">
        <button onClick={onBack} className="px-3 py-1.5 bg-slate-700 text-white rounded-xl text-sm font-bold">←</button>
        <div className="text-white font-black text-sm">
          {isTower ? `第 ${towerConfig.lv} 關 · ${towerConfig.name}` : '自由對戰'}
        </div>
        <div className="text-amber-300 text-xs font-bold">SP {spLeft}</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        <div className="relative" style={{width: 340, height: 340}}>
          {layout.map(cell => {
            const key = cellKey(cell.q, cell.r);
            const data = board[key];
            const x = 170 + cell.q * 54 + cell.r * 27;
            const y = 170 + cell.r * 47;
            return (
              <div key={key}
                onClick={() => !data && turn==='p1' && selectedCardIdx!==null && handlePlace(cell.q, cell.r)}
                className={`absolute w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all
                  ${data ? (data.owner==='p1'?'bg-blue-600 border-blue-300 shadow-lg':'bg-red-600 border-red-300 shadow-lg') :
                    (turn==='p1'&&selectedCardIdx!==null ? 'bg-slate-700/80 border-yellow-400/70 hover:bg-yellow-600/30 cursor-pointer' : 'bg-slate-800/50 border-slate-600')}`}
                style={{left: x-28, top: y-28}}>
                {data ? (
                  <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.card.id}.png`}
                    className="w-10 h-10 object-contain"
                    onError={e=>{e.target.style.display='none'}} alt=""/>
                ) : <span className="text-slate-500 text-sm">⬡</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3 bg-black/50">
        <div className="text-center text-slate-300 text-xs mb-2 h-4">{message}</div>
        <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
          {playerHand.map((c, i) => (
            <button key={i} onClick={() => turn==='p1' && setSelectedCardIdx(i)}
              className={`flex-shrink-0 w-16 p-1 rounded-xl border-2 transition-all ${
                selectedCardIdx===i ? 'border-yellow-400 bg-yellow-900/50 scale-105' : 'border-slate-600 bg-slate-800'}`}>
              <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${c.id}.png`}
                className="w-12 h-12 mx-auto object-contain"
                onError={e=>{e.target.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${c.id}.png`}} alt=""/>
              <div className="text-white text-[9px] font-bold text-center truncate">{c.name}</div>
            </button>
          ))}
          {playerHand.length === 0 && <div className="text-slate-500 text-sm">手牌已出完</div>}
        </div>
      </div>
    </div>
  );
};

window.HexBattle = HexBattle;
