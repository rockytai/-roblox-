import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameMode, 
  Player, 
  QuestionType, 
  Question, 
  InputMode, 
  DuelType 
} from './types';
import { AVATARS, QUESTION_TYPES, RPG_LEVEL_CONFIG } from './constants';
import { soundService } from './services/soundService';
import { generateQuestion } from './services/mathService';
import { RobloxAvatar } from './components/RobloxAvatar';
import { Keypad, ChoicePad, FeedbackOverlay } from './components/InputControls';

export default function App() {
  // --- State ---
  const [mode, setMode] = useState<GameMode>('HOME');
  
  // Players
  const [p1, setP1] = useState<Player>({ name: '勇士1', avatar: AVATARS[0], score: 0, wins: 0, feedback: null });
  const [p2, setP2] = useState<Player>({ name: '勇士2', avatar: AVATARS[1], score: 0, wins: 0, isCpu: false, feedback: null });
  
  // Settings & Progress
  const [selectedTopic, setSelectedTopic] = useState<QuestionType | null>(null);
  const [topicProgress, setTopicProgress] = useState<Record<string, number>>({});
  const [duelInputMode, setDuelInputMode] = useState<InputMode>('CHOICE');
  const [duelGameMode, setDuelGameMode] = useState<DuelType>('RACE');
  const [rpgInputMode, setRpgInputMode] = useState<InputMode>('KEYPAD');

  // Gameplay
  const [rpgLevel, setRpgLevel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showRpgRules, setShowRpgRules] = useState(false);
  const [rpgQ, setRpgQ] = useState<Question | null>(null);
  const [rpgInput, setRpgInput] = useState('');
  
  // Duel Gameplay
  const [sharedDuelQ, setSharedDuelQ] = useState<Question | null>(null);
  const [p1Input, setP1Input] = useState('');
  const [p2Input, setP2Input] = useState('');

  // Refs
  const timerRef = useRef<number | null>(null);
  const cpuRef = useRef<number | null>(null);

  // --- Helpers ---
  const stopAllTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (cpuRef.current) clearTimeout(cpuRef.current);
  }, []);

  const goHome = useCallback(() => {
    stopAllTimers();
    setMode('HOME');
  }, [stopAllTimers]);

  const startTimer = useCallback((onEnd: () => void) => {
    stopAllTimers();
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopAllTimers();
          onEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopAllTimers]);

  // --- RPG Logic ---
  const startRpgLevel = (levelIdx: number) => {
    if (!selectedTopic) return;
    setRpgLevel(levelIdx);
    setP1(prev => ({ ...prev, score: 0, feedback: null }));
    setRpgQ(generateQuestion(selectedTopic.id, rpgInputMode === 'CHOICE'));
    setRpgInput('');
    
    const config = RPG_LEVEL_CONFIG[levelIdx] || RPG_LEVEL_CONFIG[4];
    setTimeLeft(config.time);
    
    setMode('RPG_PLAYING');
    setShowRpgRules(false);
    startTimer(() => setMode('RPG_RESULT'));
  };

  const handleRpgCorrect = () => {
    soundService.play('attack');
    setP1(prev => ({ ...prev, score: prev.score + 1, feedback: 'correct' }));
    setTimeout(() => setP1(prev => ({ ...prev, feedback: null })), 500);

    if (p1.score + 1 >= (RPG_LEVEL_CONFIG[rpgLevel]?.pass || 8)) {
      stopAllTimers();
      soundService.play('win');
      setTopicProgress(prev => {
        const currentMax = prev[selectedTopic!.id] || 0;
        const newlyPassed = rpgLevel + 1;
        return newlyPassed > currentMax ? { ...prev, [selectedTopic!.id]: newlyPassed } : prev;
      });
      setTimeout(() => setMode('RPG_RESULT'), 800);
    } else {
      setRpgQ(generateQuestion(selectedTopic!.id, rpgInputMode === 'CHOICE'));
    }
  };

  const handleRpgWrong = () => {
    soundService.play('hit');
    setP1(prev => ({ ...prev, feedback: 'wrong' }));
    setTimeout(() => setP1(prev => ({ ...prev, feedback: null })), 500);
  };

  const checkRpgAnswer = (val?: number) => {
    if (!rpgQ) return;
    const answer = val !== undefined ? val : parseInt(rpgInput);
    
    if (answer === rpgQ.ans) {
      handleRpgCorrect();
    } else {
      handleRpgWrong();
    }
    setRpgInput('');
  };

  // --- Duel Logic ---
  const scheduleCpuAnswer = useCallback(() => {
    if (cpuRef.current) clearTimeout(cpuRef.current);
    const delay = Math.random() * 3000 + 2000;
    cpuRef.current = window.setTimeout(() => {
        const isCorrect = Math.random() > 0.2;
        if (isCorrect) handleDuelPoint(2);
        else handleDuelWrong(2);
    }, delay);
  }, []); // Remove dependency on specific state to avoid loops, pass needed data if required or rely on refs if complex

  const startDuel = (topic: QuestionType) => {
    setSelectedTopic(topic);
    setP1(prev => ({ ...prev, score: 0, feedback: null }));
    setP2(prev => ({ ...prev, score: 0, feedback: null }));
    setSharedDuelQ(generateQuestion(topic.id, duelInputMode === 'CHOICE'));
    setP1Input('');
    setP2Input('');

    if (duelGameMode === 'TIME') {
      setTimeLeft(60);
      startTimer(() => setMode('DUEL_RESULT'));
    } else {
      setTimeLeft(0);
    }

    setMode('DUEL_PLAYING');
    if (p2.isCpu) scheduleCpuAnswer();
  };

  const handleDuelPoint = (playerNum: 1 | 2) => {
    soundService.play('attack');
    const setPlayer = playerNum === 1 ? setP1 : setP2;
    setPlayer(prev => ({ ...prev, score: prev.score + 1, feedback: 'correct' }));
    setTimeout(() => setPlayer(prev => ({ ...prev, feedback: null })), 800);

    // Check Win Condition for RACE
    let newScore = 0;
    if (playerNum === 1) newScore = p1.score + 1;
    else newScore = p2.score + 1;

    if (duelGameMode === 'RACE' && newScore >= 10) {
      stopAllTimers();
      soundService.play('win');
      if (playerNum === 1) setP1(prev => ({...prev, wins: prev.wins + 1}));
      else setP2(prev => ({...prev, wins: prev.wins + 1}));
      setTimeout(() => setMode('DUEL_RESULT'), 800);
      return;
    }

    // Next Question
    setP1Input('');
    setP2Input('');
    setSharedDuelQ(generateQuestion(selectedTopic!.id, duelInputMode === 'CHOICE'));
    if (p2.isCpu) scheduleCpuAnswer();
  };

  const handleDuelWrong = (playerNum: 1 | 2) => {
    soundService.play('hit');
    const setPlayer = playerNum === 1 ? setP1 : setP2;
    setPlayer(prev => ({ ...prev, score: Math.max(0, prev.score - 1), feedback: 'wrong' }));
    setTimeout(() => setPlayer(prev => ({ ...prev, feedback: null })), 800);
    
    if (playerNum === 1) setP1Input('');
    else {
      setP2Input('');
      if (p2.isCpu) scheduleCpuAnswer();
    }
  };

  const handleDuelInput = (playerNum: 1 | 2, val: number | string) => {
    if (!sharedDuelQ) return;
    
    // Direct Choice
    if (typeof val === 'number' && duelInputMode === 'CHOICE') {
      if (val === sharedDuelQ.ans) handleDuelPoint(playerNum);
      else handleDuelWrong(playerNum);
      return;
    }

    // Keypad Input
    if (typeof val === 'number') {
       const strVal = val.toString();
       if (playerNum === 1) {
         const next = p1Input.length < 3 ? p1Input + strVal : p1Input;
         setP1Input(next);
         if (parseInt(next) === sharedDuelQ.ans) handleDuelPoint(1);
       } else {
         const next = p2Input.length < 3 ? p2Input + strVal : p2Input;
         setP2Input(next);
         if (parseInt(next) === sharedDuelQ.ans) handleDuelPoint(2);
       }
    }
  };

  // Keyboard support for RPG
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (mode === 'RPG_PLAYING' && rpgInputMode === 'KEYPAD') {
        if (/[0-9]/.test(e.key)) setRpgInput(prev => prev.length < 3 ? prev + e.key : prev);
        if (e.key === 'Backspace') setRpgInput(prev => prev.slice(0, -1));
        if (e.key === 'Enter') checkRpgAnswer();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, rpgInputMode, rpgInput, rpgQ]); // Add necessary deps

  // --- Render Components ---

  const AvatarSelector = ({ player, setPlayer, label, allowCpu = false }: { player: Player, setPlayer: React.Dispatch<React.SetStateAction<Player>>, label: string, allowCpu?: boolean }) => (
    <div className="bg-slate-800 p-4 rounded-xl border-2 border-slate-600 mb-4 w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-yellow-400 font-bold text-sm">{label}</label>
        {allowCpu && (
          <button 
            onClick={() => setPlayer(p => ({...p, isCpu: !p.isCpu}))} 
            className={`text-xs px-3 py-1.5 rounded font-bold transition-colors ${player.isCpu ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
          >
            {player.isCpu ? '🤖 CPU' : '👤 HUMAN'}
          </button>
        )}
      </div>
      {!player.isCpu ? (
        <>
          <input 
            type="text" 
            value={player.name} 
            onChange={(e) => setPlayer(p => ({...p, name: e.target.value}))}
            className="w-full bg-slate-900 text-white px-3 py-2 rounded mb-3 border border-slate-700 text-sm focus:border-yellow-500 outline-none transition-colors"
            maxLength={8}
          />
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {AVATARS.map(av => (
              <div 
                key={av.id} 
                onClick={() => { soundService.play('click'); setPlayer(p => ({...p, avatar: av})); }} 
                className={`p-1.5 rounded-lg cursor-pointer border-2 transition-all hover:bg-slate-700 ${player.avatar.id === av.id ? 'border-yellow-400 bg-slate-700 ring-2 ring-yellow-400/30' : 'border-transparent'}`}
              >
                <RobloxAvatar avatar={av} size="sm" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-4 text-4xl animate-pulse">🤖</div>
      )}
    </div>
  );

  // --- Screens ---

  if (mode === 'HOME') {
    return (
      <div className="dungeon-bg w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-10 animate-float-up">
          <h1 className="text-4xl md:text-6xl text-yellow-400 font-bold drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] pixel-font leading-tight">
            Math RPG<br/>
            <span className="text-2xl md:text-3xl text-white font-sans">Roblox Adventure</span>
          </h1>
        </div>
        <div className="space-y-4 w-full max-w-sm px-4">
          <button 
            onClick={() => { soundService.play('click'); setMode('SETUP_RPG'); }} 
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-4 rounded-xl font-bold pixel-btn text-lg md:text-xl flex items-center justify-center gap-3"
          >
            <span>🏰</span> 冒险闯关 (Solo)
          </button>
          <button 
            onClick={() => { soundService.play('click'); setMode('SETUP_DUEL'); }} 
            className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white py-4 rounded-xl font-bold pixel-btn text-lg md:text-xl flex items-center justify-center gap-3"
          >
            <span>⚔️</span> 双人对决 (PVP)
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'SETUP_RPG') {
    return (
      <div className="dungeon-bg w-full h-full flex flex-col p-4 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto pb-12">
          <button onClick={goHome} className="text-gray-400 hover:text-white mb-4 flex items-center gap-1 font-bold">⬅ BACK</button>
          <h2 className="text-2xl mb-6 font-bold text-center">创建你的英雄</h2>
          
          <AvatarSelector player={p1} setPlayer={setP1} label="冒险家" />
          
          <div className="bg-slate-800 p-4 rounded-xl border-2 border-slate-600 mb-6">
            <label className="text-yellow-400 font-bold text-sm block mb-3">输入方式</label>
            <div className="flex gap-3">
              <button onClick={() => setRpgInputMode('KEYPAD')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${rpgInputMode === 'KEYPAD' ? 'bg-blue-600 ring-2 ring-white shadow-lg' : 'bg-slate-700 hover:bg-slate-600'}`}>⌨️ 键盘</button>
              <button onClick={() => setRpgInputMode('CHOICE')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${rpgInputMode === 'CHOICE' ? 'bg-purple-600 ring-2 ring-white shadow-lg' : 'bg-slate-700 hover:bg-slate-600'}`}>🔘 选择</button>
            </div>
          </div>

          <h3 className="text-xl mb-4 font-bold text-center">选择关卡</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(QUESTION_TYPES).map(t => {
              const stars = topicProgress[t.id] || 0;
              return (
                <button 
                  key={t.id} 
                  onClick={() => {
                    setSelectedTopic(t);
                    setShowRpgRules(true);
                    soundService.play('click');
                  }} 
                  className={`${t.color} p-4 rounded-xl text-left shadow-lg active:scale-95 transition-transform flex flex-col relative overflow-hidden group`}
                >
                  <div className="absolute top-0 right-0 p-2 opacity-20 text-4xl group-hover:scale-110 transition-transform">{t.icon}</div>
                  <span className="font-bold text-sm z-10 relative">{t.name}</span>
                  <div className="flex text-yellow-300 text-[10px] space-x-0.5 mt-2 z-10 relative">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < stars ? "opacity-100" : "opacity-30"}>⭐</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {showRpgRules && selectedTopic && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-pop-in" onClick={() => setShowRpgRules(false)}>
            <div className="bg-slate-800 border-4 border-yellow-500 rounded-xl p-6 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl text-yellow-400 font-bold mb-6 pixel-font">📜 规则</h3>
              <div className="text-left text-sm space-y-4 text-gray-300 mb-8 font-mono bg-black/20 p-4 rounded-lg">
                <p>1. 共 <span className="text-yellow-400 font-bold">5个关卡</span></p>
                <p>2. 限时内答对 <span className="text-green-400 font-bold">8题</span> 晋级</p>
                <p>3. 错误会扣除时间!</p>
              </div>
              <button 
                onClick={() => { soundService.play('click'); startRpgLevel(0); }} 
                className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold pixel-btn text-lg"
              >
                开始冒险!
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'SETUP_DUEL') {
    return (
      <div className="dungeon-bg w-full h-full flex flex-col p-4 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto pb-12">
          <button onClick={goHome} className="text-gray-400 hover:text-white mb-4 flex items-center gap-1 font-bold">⬅ BACK</button>
          <h2 className="text-2xl mb-6 font-bold text-center">竞技场登记</h2>
          
          <AvatarSelector player={p1} setPlayer={setP1} label="玩家 1 (Top)" />
          <AvatarSelector player={p2} setPlayer={setP2} label="玩家 2 (Bottom)" allowCpu={true} />
          
          <div className="bg-slate-800 p-4 rounded-xl border-2 border-slate-600 mb-4">
            <label className="text-yellow-400 font-bold text-sm block mb-3">比赛模式</label>
            <div className="flex gap-3">
              <button onClick={() => setDuelGameMode('TIME')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${duelGameMode === 'TIME' ? 'bg-orange-600 ring-2 ring-white' : 'bg-slate-700'}`}>⚡ 极速60秒</button>
              <button onClick={() => setDuelGameMode('RACE')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${duelGameMode === 'RACE' ? 'bg-indigo-600 ring-2 ring-white' : 'bg-slate-700'}`}>🏆 抢十大战</button>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border-2 border-slate-600 mb-6">
            <label className="text-yellow-400 font-bold text-sm block mb-3">输入方式</label>
            <div className="flex gap-3">
              <button onClick={() => setDuelInputMode('KEYPAD')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${duelInputMode === 'KEYPAD' ? 'bg-blue-600 ring-2 ring-white' : 'bg-slate-700'}`}>⌨️ 键盘</button>
              <button onClick={() => setDuelInputMode('CHOICE')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${duelInputMode === 'CHOICE' ? 'bg-purple-600 ring-2 ring-white' : 'bg-slate-700'}`}>🔘 选择</button>
            </div>
          </div>

          <h3 className="text-xl mb-4 font-bold text-center">选择竞技项目</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(QUESTION_TYPES).map(t => (
              <button 
                key={t.id} 
                onClick={() => { soundService.play('click'); startDuel(t); }} 
                className={`${t.color} p-4 rounded-xl text-left shadow-lg active:scale-95 transition-transform flex items-center font-bold text-sm`}
              >
                <span className="mr-2 text-xl">{t.icon}</span> {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'RPG_PLAYING' && rpgQ && selectedTopic) {
    return (
      <div className="dungeon-bg w-full h-full flex flex-col p-4 relative overflow-hidden">
        <button onClick={goHome} className="absolute top-4 left-4 z-50 bg-gray-700/80 px-4 py-2 rounded-lg text-xs border border-white/20 hover:bg-red-500/80 transition font-bold">🏳️ 撤退</button>
        
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-800/90 backdrop-blur border border-slate-600 p-3 rounded-xl mb-6 pl-20 shadow-lg max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <RobloxAvatar avatar={p1.avatar} size="sm" />
            <div>
              <div className="font-bold text-sm">{p1.name}</div>
              <div className="text-xs text-yellow-400 font-mono">Score: {p1.score}</div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className={`text-3xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</div>
            <div className="text-xs text-blue-300 font-bold uppercase tracking-wider">Level {rpgLevel + 1} / 5</div>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {p1.feedback && <FeedbackOverlay type={p1.feedback} />}
          
          <div className="animate-bounce text-6xl mb-6 filter drop-shadow-lg">{selectedTopic.icon}</div>
          <div className="text-slate-400 mb-8 font-bold tracking-widest uppercase text-sm">Target: {selectedTopic.name} BOSS</div>
          
          <div className="bg-slate-700/80 backdrop-blur p-8 rounded-3xl w-full max-w-sm text-center border-4 border-slate-500 mb-8 shadow-2xl">
            <div className="text-5xl font-mono font-bold flex justify-center gap-4 items-center">
              <span>{rpgQ.n1}</span>
              <span className="text-blue-400">{rpgQ.operator}</span>
              <span>{rpgQ.n2}</span>
              <span>=</span>
              <span className="text-yellow-400 border-b-4 border-yellow-400 min-w-[60px] inline-block">{rpgInput || '?'}</span>
            </div>
          </div>

          {rpgInputMode === 'KEYPAD' ? (
            <>
              <div className="text-gray-500 text-xs mb-4 font-bold uppercase tracking-widest">Type Answer</div>
              <Keypad 
                onInput={(n) => setRpgInput(prev => prev.length < 3 ? prev + n : prev)} 
                onDelete={() => setRpgInput(s => s.slice(0, -1))} 
              />
              <button 
                onClick={() => checkRpgAnswer()} 
                className="mt-6 bg-green-500 hover:bg-green-400 text-white px-10 py-4 rounded-xl font-bold pixel-btn w-full max-w-[220px]"
              >
                ATTACK
              </button>
            </>
          ) : (
            <ChoicePad options={rpgQ.options || []} onSelect={checkRpgAnswer} colorClass="bg-blue-600 border-blue-800" />
          )}
        </div>
      </div>
    );
  }

  if (mode === 'DUEL_PLAYING' && sharedDuelQ) {
    return (
      <div className="dungeon-bg w-full h-full flex flex-col relative overflow-hidden">
        <button onClick={goHome} className="absolute top-2 left-2 z-50 bg-gray-700/80 px-3 py-1 rounded text-[10px] border border-white/20 hover:bg-red-500/80 transition font-bold">🏳️ EXIT</button>
        
        {/* Floating Question (Center) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-full max-w-xs pointer-events-none">
          {/* P1 Rotated View */}
          <div className="bg-slate-800 border-4 border-yellow-500 rounded-xl p-4 text-center shadow-2xl mb-12 rotate-180 opacity-95">
            <div className="text-4xl font-mono font-bold text-white flex justify-center items-center gap-2">
              {sharedDuelQ.n1} <span className="text-blue-400">{sharedDuelQ.operator}</span> {sharedDuelQ.n2} = ?
            </div>
          </div>
          {/* P2 Normal View */}
          <div className="bg-slate-800 border-4 border-yellow-500 rounded-xl p-4 text-center shadow-2xl mt-12 opacity-95">
            <div className="text-4xl font-mono font-bold text-white flex justify-center items-center gap-2">
              {sharedDuelQ.n1} <span className="text-blue-400">{sharedDuelQ.operator}</span> {sharedDuelQ.n2} = ?
            </div>
          </div>
        </div>

        {/* Player 1 Area (Top) */}
        <div className={`flex-1 relative flex flex-col items-center justify-start pt-4 transition-colors duration-300 border-b-2 border-slate-600 ${p1.feedback === 'correct' ? 'bg-green-900/40' : p1.feedback === 'wrong' ? 'bg-red-900/40' : 'bg-slate-800/40'}`}>
           {p1.feedback && <FeedbackOverlay type={p1.feedback} />}
           
           {/* P1 Stats */}
           <div className="absolute top-4 right-4 flex items-center gap-3">
              <div className="flex flex-col items-end">
                  <span className="text-xs text-yellow-500 font-bold">Wins: {p1.wins}</span>
                  <span className="font-bold text-sm">{p1.name}</span>
              </div>
              <RobloxAvatar avatar={p1.avatar} size="sm" />
              <div className="text-4xl text-blue-400 font-bold font-mono min-w-[40px] text-center">{p1.score}</div>
           </div>

           {/* P1 Controls (Rotated) */}
           <div className="mt-16 rotate-180 scale-90 md:scale-100 origin-center">
             {duelInputMode === 'KEYPAD' ? (
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-mono text-yellow-400 mb-4 h-12 border-b-4 border-blue-500 min-w-[100px] text-center">{p1Input}</div>
                  <Keypad onInput={(n) => handleDuelInput(1, n)} onDelete={() => setP1Input(s => s.slice(0, -1))} />
                </div>
             ) : (
                <ChoicePad options={sharedDuelQ.options || []} onSelect={(val) => handleDuelInput(1, val)} colorClass="bg-blue-600 border-blue-800" />
             )}
           </div>
        </div>

        {/* Center Bar */}
        <div className="h-10 bg-black flex items-center justify-center z-30 font-bold font-mono text-yellow-400 border-y border-slate-600 shadow-xl">
          {duelGameMode === 'TIME' ? `⏳ TIME: ${timeLeft}s` : `🏆 GOAL: 10 PTS`}
        </div>

        {/* Player 2 Area (Bottom) */}
        <div className={`flex-1 relative flex flex-col items-center justify-end pb-4 transition-colors duration-300 ${p2.feedback === 'correct' ? 'bg-green-900/40' : p2.feedback === 'wrong' ? 'bg-red-900/40' : 'bg-slate-900/40'}`}>
          {p2.feedback && <FeedbackOverlay type={p2.feedback} />}
          
          {/* P2 Stats */}
          <div className="absolute bottom-4 right-4 flex items-center gap-3 flex-row-reverse">
             <div className="flex flex-col items-end">
                 <span className="text-xs text-yellow-500 font-bold">Wins: {p2.wins}</span>
                 <span className="font-bold text-sm">{p2.name}</span>
             </div>
             {p2.isCpu ? <span className="text-2xl bg-slate-700 p-1 rounded">🤖</span> : <RobloxAvatar avatar={p2.avatar} size="sm" />}
             <div className="text-4xl text-red-400 font-bold font-mono min-w-[40px] text-center">{p2.score}</div>
          </div>

          {/* P2 Controls */}
          <div className="mb-16 scale-90 md:scale-100 origin-center w-full flex justify-center">
             {p2.isCpu ? (
               <div className="flex flex-col items-center opacity-60">
                 <div className="text-6xl animate-bounce">🤖</div>
                 <div className="text-sm text-gray-400 mt-2 font-mono animate-pulse">CALCULATING...</div>
               </div>
             ) : (
                duelInputMode === 'KEYPAD' ? (
                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-mono text-yellow-400 mb-4 h-12 border-b-4 border-red-500 min-w-[100px] text-center">{p2Input}</div>
                    <Keypad onInput={(n) => handleDuelInput(2, n)} onDelete={() => setP2Input(s => s.slice(0, -1))} />
                  </div>
                ) : (
                  <ChoicePad options={sharedDuelQ.options || []} onSelect={(val) => handleDuelInput(2, val)} colorClass="bg-red-600 border-red-800" />
                )
             )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'RPG_RESULT' || mode === 'DUEL_RESULT') {
    const isDuel = mode === 'DUEL_RESULT';
    let title = 'Game Over';
    let subTitle = '';
    
    if (isDuel) {
      if (p1.score === p2.score) {
        title = 'Draw!';
        subTitle = '平分秋色';
      } else {
        const winner = p1.score > p2.score ? p1 : p2;
        title = 'Winner!';
        subTitle = `${winner.name} 获胜`;
      }
    } else {
      const isPass = p1.score >= (RPG_LEVEL_CONFIG[rpgLevel]?.pass || 8);
      title = isPass ? 'Success!' : 'Failed';
      subTitle = isPass ? '挑战成功' : '再接再厉';
    }

    return (
      <div className="dungeon-bg w-full h-full flex flex-col items-center justify-center p-6 text-center animate-pop-in">
        <h1 className="text-5xl text-yellow-400 mb-2 font-bold pixel-font">{title}</h1>
        <p className="text-xl text-gray-400 mb-8">{subTitle}</p>
        
        <div className="bg-slate-800 p-8 rounded-2xl border-4 border-slate-600 w-full max-w-md mb-8 shadow-2xl">
          <div className="flex justify-around items-end">
            <div className="flex flex-col items-center">
              <div className="mb-2 transform scale-125"><RobloxAvatar avatar={p1.avatar} /></div>
              <div className="mt-2 font-bold text-lg">{p1.name}</div>
              <div className="text-xs text-yellow-500 font-bold mt-1">👑 {p1.wins} Wins</div>
              <div className="text-4xl text-green-400 font-mono font-bold mt-2">{p1.score}</div>
            </div>
            
            {isDuel && (
              <>
                <div className="text-3xl font-bold text-gray-600 mb-8 italic">VS</div>
                <div className="flex flex-col items-center">
                  <div className="mb-2 transform scale-125">
                     {p2.isCpu ? <span className="text-5xl">🤖</span> : <RobloxAvatar avatar={p2.avatar} />}
                  </div>
                  <div className="mt-2 font-bold text-lg">{p2.name}</div>
                  <div className="text-xs text-yellow-500 font-bold mt-1">👑 {p2.wins} Wins</div>
                  <div className="text-4xl text-red-400 font-mono font-bold mt-2">{p2.score}</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button 
            onClick={() => { soundService.play('click'); goHome(); }} 
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-4 px-6 rounded-xl font-bold pixel-btn text-lg"
          >
            🏠 MENU
          </button>
          <button 
            onClick={() => {
              soundService.play('click');
              if (isDuel) {
                if (selectedTopic) startDuel(selectedTopic);
              } else {
                 const isPass = p1.score >= (RPG_LEVEL_CONFIG[rpgLevel]?.pass || 8);
                 if (isPass && rpgLevel < 4) {
                   startRpgLevel(rpgLevel + 1);
                 } else if (isPass) {
                   goHome(); // Completed all levels
                 } else {
                   startRpgLevel(rpgLevel); // Retry
                 }
              }
            }} 
            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 px-6 rounded-xl font-bold pixel-btn text-lg"
          >
            {isDuel ? '🔄 REMATCH' : (p1.score >= (RPG_LEVEL_CONFIG[rpgLevel]?.pass || 8) ? (rpgLevel < 4 ? '⏩ NEXT LEVEL' : '🎉 FINISH') : '🔄 RETRY')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}