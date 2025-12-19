
import React, { useState, useEffect } from 'react';
import { GameLoop } from './components/GameLoop';
import { Button } from './components/Button';
import { GameMode, GameState } from './types';
import { Trophy, Skull, Zap, Shield, Users, Lock, Flame, Heart, RefreshCcw, Star, Maximize, Minimize, Pause, Play, Gift, Settings, Music, Volume2, X, Shirt } from 'lucide-react';
import { initAudio, startMusic, stopMusic, playFailSound, playWinSound, setMusicEnabled, setSfxEnabled, playSkinVoice } from './audio';
import { SKINS } from './constants';

// Mock Data
const LEADERBOARD = [
  { name: "猛男一号", floor: 420 },
  { name: "健身达人", floor: 350 },
  { name: "不练腿", floor: 105 },
  { name: "小黑子", floor: 99 },
  { name: "只因你太美", floor: 88 },
  { name: "菜就多练", floor: 66 },
  { name: "路人甲", floor: 50 },
  { name: "测试员", floor: 42 },
];

const Confetti = () => {
  const colors = ['#ef4444', '#eab308', '#3b82f6', '#22c55e', '#ec4899', '#a855f7'];
  const pieces = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[60]">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute w-3 h-3 animate-fall opacity-0"
          style={{
            backgroundColor: p.color,
            left: `${p.left}%`,
            top: '-5%',
            animation: `fall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    highScore: 88,
    coins: 120,
    revivesUsed: 0,
    items: { revive: 3, magnet: false, slowMo: false, shield: false }
  });
  const [lastDeathReason, setLastDeathReason] = useState("");
  const [showDaily, setShowDaily] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSkins, setShowSkins] = useState(false);
  const [currentSkin, setCurrentSkin] = useState(SKINS[0].id);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReviving, setIsReviving] = useState(false);
  
  const [audioSettings, setAudioSettings] = useState({ music: true, sfx: true });

  useEffect(() => {
    const timer = setTimeout(() => setShowDaily(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleBlur = () => {
      if (mode !== GameMode.MENU && mode !== GameMode.GAME_OVER) {
        setIsPaused(true);
        if (audioSettings.music) stopMusic();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (mode !== GameMode.MENU && mode !== GameMode.GAME_OVER) {
          setIsPaused(prev => {
            const newState = !prev;
            if (newState) stopMusic();
            else if (audioSettings.music) startMusic();
            return newState;
          });
        }
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [mode, audioSettings.music]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.error(e));
    } else {
      document.exitFullscreen();
    }
  };

  const toggleMusicSetting = () => {
    const newVal = !audioSettings.music;
    setAudioSettings(prev => ({ ...prev, music: newVal }));
    setMusicEnabled(newVal);
  };

  const toggleSfxSetting = () => {
    const newVal = !audioSettings.sfx;
    setAudioSettings(prev => ({ ...prev, sfx: newVal }));
    setSfxEnabled(newVal);
  };

  const startGame = (selectedMode: GameMode) => {
    initAudio();
    if (audioSettings.music) startMusic();
    setShowConfetti(false);
    setIsPaused(false);
    setIsReviving(false);
    
    setMode(selectedMode);
    setGameState(prev => ({ ...prev, score: 0, revivesUsed: 0 }));
  };

  const handleGameOver = (finalScore: number, reason: string) => {
    stopMusic();
    setGameState(prev => ({ 
      ...prev, 
      score: finalScore,
      highScore: Math.max(prev.highScore, finalScore),
      coins: prev.coins + Math.floor(finalScore / 2)
    }));
    setLastDeathReason(reason);
    setMode(GameMode.GAME_OVER);

    if (finalScore >= 100 || reason.includes("击败BOSS")) {
      playWinSound();
      setShowConfetti(true);
    } else {
      playFailSound();
      setShowConfetti(false);
    }
  };

  const claimDaily = () => {
    initAudio();
    setGameState(prev => ({ 
      ...prev, 
      items: { ...prev.items, revive: prev.items.revive + 3 },
      coins: prev.coins + 50
    }));
    setShowDaily(false);
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-between h-full p-6 animate-fade-in bg-gray-900/90 backdrop-blur-sm z-10 absolute inset-0 text-center">
      <div className="absolute top-4 left-4 flex gap-2">
        <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-lg border border-gray-700" title="设置">
          <Settings className="w-6 h-6" />
        </button>
        <button onClick={() => setShowSkins(true)} className="p-2 text-yellow-400 hover:text-white transition-colors bg-gray-800 rounded-lg border border-gray-700 relative" title="皮肤">
          <Shirt className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black"></div>
        </button>
      </div>

      <div className="absolute top-4 right-4">
        <button onClick={toggleFullscreen} className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-lg border border-gray-700" title="全屏切换">
          {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
        </button>
      </div>

      <div className="mt-10 animate-bounce">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-yellow-500 neon-text leading-tight" style={{ fontFamily: "'Press Start 2P', cursive" }}>
          真男人<br/>下100层
        </h1>
        <div className="mt-4 text-cyan-400 text-sm tracking-widest font-bold">挑战百层深渊</div>
      </div>

      <div className="flex gap-4 bg-black/50 p-3 rounded-lg border border-gray-700">
         <div className="flex flex-col items-center px-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="text-xs mt-1 text-gray-300">最高: {gameState.highScore}层</span>
         </div>
         <div className="w-px bg-gray-700"></div>
         <div className="flex flex-col items-center px-2">
            <div className="text-yellow-400 font-bold">$ {gameState.coins}</div>
            <span className="text-xs text-gray-300">金币</span>
         </div>
      </div>

      <div className="relative w-full max-w-xs my-4">
        <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-30 animate-pulse"></div>
        <Button size="lg" onClick={() => startGame(GameMode.CLASSIC)} pulse={true} className="w-full h-20 text-2xl tracking-wider shadow-lg">
          开始挑战
        </Button>
        <p className="text-[10px] text-gray-500 mt-2">0.5秒极速开局</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-4">
        <Button size="sm" variant="secondary" onClick={() => startGame(GameMode.INFINITE)} className="flex flex-col items-center py-3">
          <Zap className="w-4 h-4 mb-1 text-yellow-400" />
          <span>无尽挑战</span>
        </Button>
         <Button size="sm" variant="secondary" onClick={() => setShowLeaderboard(true)} className="flex flex-col items-center py-3">
           <Trophy className="w-4 h-4 mb-1 text-blue-400" />
           <span>排行榜</span>
        </Button>
        <Button size="sm" variant="danger" onClick={() => startGame(GameMode.BOSS)} className="col-span-2 flex flex-col items-center py-3 relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-600/20 group-hover:bg-red-600/40 transition-colors animate-pulse"></div>
          <Skull className="w-4 h-4 mb-1 text-white animate-bounce" />
          <span className="text-white font-black drop-shadow-md">BOSS战 (地狱难度)</span>
        </Button>
      </div>

      <div className="w-full max-w-xs bg-gray-800/80 rounded-lg p-3 text-left text-xs border border-gray-700 opacity-70">
        <div className="flex justify-between mb-1 text-gray-400 font-bold">
          <span>当前第一</span>
        </div>
        <div className="flex justify-between py-1">
            <span className="text-yellow-400">1. {LEADERBOARD[0].name}</span>
            <span>{LEADERBOARD[0].floor}层</span>
        </div>
      </div>
    </div>
  );

  const renderPaused = () => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border-4 border-yellow-500 rounded-xl p-8 text-center shadow-2xl max-w-xs w-full">
        <Pause className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-white mb-6">已暂停</h2>
        <div className="space-y-4">
          <Button variant="success" className="w-full flex items-center justify-center gap-2" onClick={() => { setIsPaused(false); if (audioSettings.music) startMusic(); }}>
            <Play className="w-4 h-4 fill-current" /> 继续游戏
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => { setIsPaused(false); setMode(GameMode.MENU); stopMusic(); }}>
            返回主菜单
          </Button>
        </div>
      </div>
    </div>
  );

  const renderGameOver = () => {
    const isVictory = gameState.score >= 100 || lastDeathReason.includes("击败BOSS");
    const canRevive = gameState.items.revive > 0 && gameState.revivesUsed < 3 && mode !== GameMode.BOSS;
    
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center animate-fade-in">
        {isVictory ? (
           <div className="mb-4 relative">
             <Star className="w-24 h-24 text-yellow-400 animate-spin-slow" />
             <Star className="w-12 h-12 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
           </div>
        ) : (
           <Skull className="w-20 h-20 text-red-600 animate-bounce mb-4" />
        )}

         <h2 className={`text-3xl font-bold mb-2 ${isVictory ? 'text-yellow-400' : 'text-red-500'}`}>
            {isVictory ? '传说达成！' : '挑战失败'}
         </h2>
         <p className="text-gray-400 text-sm mb-6 uppercase tracking-widest">{isVictory ? '伟大的胜利！' : lastDeathReason}</p>
         
         <div className={`bg-gray-800 p-6 rounded-xl border-2 ${isVictory ? 'border-yellow-500' : 'border-gray-700'} mb-8 w-full max-w-xs`}>
            <div className="text-gray-400 text-xs">最终层数</div>
            <div className="text-5xl font-black text-white my-2">{gameState.score}层</div>
            <div className="text-green-400 text-xs">获得 +{Math.floor(gameState.score/2)} 金币</div>
         </div>
  
         <div className="space-y-4 w-full max-w-xs">
           {!isVictory && mode !== GameMode.BOSS && (
             <Button variant="success" disabled={!canRevive} className={`w-full flex items-center justify-center gap-2 ${!canRevive ? 'opacity-50 grayscale cursor-not-allowed' : ''}`} onClick={() => {
                if (!canRevive) return;
                setGameState(prev => ({ ...prev, items: {...prev.items, revive: prev.items.revive - 1}, revivesUsed: prev.revivesUsed + 1 }));
                setIsReviving(true);
                if (audioSettings.music) startMusic();
                setMode(GameMode.CLASSIC); 
                setShowConfetti(false);
              }}>
               <Heart className="w-4 h-4 fill-current" /> 复活 (剩余 {3 - gameState.revivesUsed})
             </Button>
           )}
           
           <Button variant="primary" className="w-full flex items-center justify-center gap-2" onClick={() => startGame(mode === GameMode.GAME_OVER ? GameMode.CLASSIC : mode)}>
             <RefreshCcw className="w-4 h-4" /> 再来一次
           </Button>
  
           <Button variant="secondary" className="w-full" onClick={() => { setShowConfetti(false); setMode(GameMode.MENU); }}>
             主菜单
           </Button>
         </div>
      </div>
    );
  };

  const renderDailyModal = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-gray-800 border-4 border-indigo-500 rounded-2xl p-6 w-full max-w-xs text-center animate-bounce-in relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={() => setShowDaily(false)}>
           <X className="w-6 h-6"/>
        </button>
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase border-2 border-white flex items-center gap-1">
          <Gift className="w-3 h-3"/> 每日礼包
        </div>
        <h3 className="text-xl font-bold mt-4 text-white">欢迎回来!</h3>
        <p className="text-gray-400 text-xs mb-6">收下这些补给，继续战斗！</p>
        <div className="flex justify-center gap-4 mb-6">
          <div className="bg-gray-900 p-3 rounded border border-gray-700 flex flex-col items-center w-24">
            <Heart className="text-red-500 w-8 h-8 mb-1" />
            <span className="text-xs font-bold">x3 复活心</span>
          </div>
          <div className="bg-gray-900 p-3 rounded border border-gray-700 flex flex-col items-center w-24">
            <div className="text-yellow-400 w-8 h-8 mb-1 text-2xl font-bold">$</div>
            <span className="text-xs font-bold">50 金币</span>
          </div>
        </div>
        <Button variant="success" className="w-full" onClick={claimDaily}>立即领取</Button>
      </div>
    </div>
  );

  const renderLeaderboardModal = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
       <div className="bg-gray-800 border-4 border-blue-500 rounded-2xl p-6 w-full max-w-xs text-center relative max-h-[80vh] flex flex-col">
          <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={() => setShowLeaderboard(false)}>
            <X className="w-6 h-6"/>
          </button>
          <h3 className="text-xl font-bold mb-4 text-blue-400 flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6"/> 排行榜
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
             <table className="w-full text-left text-sm">
                <thead>
                   <tr className="text-gray-500 border-b border-gray-700">
                      <th className="pb-2">排名</th>
                      <th className="pb-2">玩家</th>
                      <th className="pb-2 text-right">层数</th>
                   </tr>
                </thead>
                <tbody>
                   {LEADERBOARD.map((p, i) => {
                      let rankColor = 'text-white';
                      if(i === 0) rankColor = 'text-yellow-400';
                      if(i === 1) rankColor = 'text-gray-300';
                      if(i === 2) rankColor = 'text-orange-400';
                      return (
                        <tr key={i} className="border-b border-gray-700/50 last:border-0">
                           <td className={`py-3 font-bold ${rankColor}`}>#{i+1}</td>
                           <td className="py-3 text-gray-200">{p.name}</td>
                           <td className="py-3 text-right font-mono text-cyan-400">{p.floor}</td>
                        </tr>
                      )
                   })}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  const renderSettingsModal = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-gray-800 border-4 border-gray-500 rounded-2xl p-6 w-full max-w-xs text-center relative">
         <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={() => setShowSettings(false)}>
            <X className="w-6 h-6"/>
         </button>
         <h3 className="text-xl font-bold mb-8 text-white flex items-center justify-center gap-2">
           <Settings className="w-6 h-6"/> 游戏设置
         </h3>
         <div className="space-y-6">
            <div className="flex items-center justify-between bg-gray-900 p-4 rounded-lg border border-gray-700">
               <div className="flex items-center gap-3">
                  <Music className="w-6 h-6 text-purple-400" />
                  <span className="font-bold">背景音乐</span>
               </div>
               <button onClick={toggleMusicSetting} className={`w-12 h-6 rounded-full relative transition-colors ${audioSettings.music ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${audioSettings.music ? 'left-7' : 'left-1'}`}></div>
               </button>
            </div>
            <div className="flex items-center justify-between bg-gray-900 p-4 rounded-lg border border-gray-700">
               <div className="flex items-center gap-3">
                  <Volume2 className="w-6 h-6 text-blue-400" />
                  <span className="font-bold">游戏音效</span>
               </div>
               <button onClick={toggleSfxSetting} className={`w-12 h-6 rounded-full relative transition-colors ${audioSettings.sfx ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${audioSettings.sfx ? 'left-7' : 'left-1'}`}></div>
               </button>
            </div>
         </div>
         <div className="mt-8 text-xs text-gray-500">Version 1.3.0</div>
      </div>
    </div>
  );

  const renderSkinSelector = () => (
     <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="bg-gray-800 border-4 border-yellow-500 rounded-2xl p-6 w-full max-w-xs text-center relative flex flex-col max-h-[85vh]">
         <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={() => setShowSkins(false)}>
            <X className="w-6 h-6"/>
         </button>
         <h3 className="text-xl font-bold mb-4 text-yellow-400 flex items-center justify-center gap-2">
           <Shirt className="w-6 h-6"/> 选择皮肤
         </h3>
         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
            {SKINS.map(skin => {
                const isSelected = currentSkin === skin.id;
                return (
                    <div key={skin.id} className={`p-3 rounded-lg border-2 flex items-center gap-4 transition-all cursor-pointer ${isSelected ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'}`} onClick={() => { setCurrentSkin(skin.id); initAudio(); if(skin.quote) playSkinVoice(skin.quote, skin.id); }}>
                        <div className="w-12 h-12 rounded border-2 border-white/20 shadow-lg relative flex items-center justify-center overflow-hidden" style={{backgroundColor: skin.color}}>
                            {skin.id === 'superman' && <div className="absolute w-6 h-6 bg-red-600 rotate-45 transform"></div>}
                            {skin.id === 'prime' && <div className="absolute w-full h-1/2 bottom-0 bg-blue-700"></div>}
                            {skin.id === 'bumblebee' && <div className="absolute w-2 h-full bg-black/50"></div>}
                            {skin.id === 'classic' && <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_5px_#4ade80]"></div>}
                        </div>
                        <div className="flex-1 text-left">
                            <div className={`font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{skin.name}</div>
                            <div className="text-[10px] text-gray-500">{skin.desc}</div>
                        </div>
                        {isSelected && <div className="text-yellow-400"><Star className="w-4 h-4 fill-current"/></div>}
                    </div>
                );
            })}
         </div>
         <div className="mt-4">
             <Button variant="success" className="w-full" onClick={() => setShowSkins(false)}>确定选择</Button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen max-w-md mx-auto overflow-hidden bg-slate-900 shadow-2xl select-none font-sans">
      {showConfetti && <Confetti />}
      {(mode !== GameMode.MENU) && (
        <GameLoop 
          mode={mode} 
          onGameOver={handleGameOver} 
          setScore={(s) => setGameState(prev => ({...prev, score: s}))}
          gameState={gameState}
          isPaused={isPaused || mode === GameMode.GAME_OVER}
          selectedSkin={currentSkin}
          isReviving={isReviving}
        />
      )}
      {isPaused && mode !== GameMode.MENU && mode !== GameMode.GAME_OVER && renderPaused()}
      {!isPaused && (mode !== GameMode.MENU && mode !== GameMode.GAME_OVER) && (
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none z-20">
           <div className="flex flex-col gap-1">
             <div className="bg-black/50 backdrop-blur text-white px-3 py-1 rounded border border-gray-600 flex items-center gap-2">
               <span className="text-xs text-gray-400">当前层数</span>
               <span className="text-xl font-bold text-cyan-400">{gameState.score}F</span>
             </div>
             {mode === GameMode.CLASSIC && (
               <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden mt-1">
                 <div className="bg-cyan-500 h-full transition-all duration-500" style={{width: `${Math.min(100, (gameState.score/100)*100)}%`}}></div>
               </div>
             )}
           </div>
           <div className="flex gap-2 pointer-events-auto">
              <button onClick={() => setIsPaused(true)} className="p-2 bg-black/50 rounded-full border border-gray-600 hover:bg-gray-800 text-white">
                 <Pause className="w-4 h-4" />
              </button>
              {gameState.items.shield && <Shield className="w-6 h-6 text-blue-500 animate-pulse" />}
           </div>
        </div>
      )}
      {!isPaused && mode === GameMode.CLASSIC && gameState.score === 0 && (
        <div className="absolute top-1/4 left-0 right-0 text-center pointer-events-none animate-pulse z-10">
          <p className="text-white text-shadow-md text-sm mb-2 font-bold">按住 中间键 蓄力</p>
          <div className="w-32 h-2 bg-gray-700 mx-auto rounded-full overflow-hidden border border-white">
             <div className="bg-green-500 h-full animate-ping-slow w-1/2"></div>
          </div>
          <p className="text-white text-shadow-md text-sm mt-2 font-bold">松开 起跳</p>
        </div>
      )}
      {mode === GameMode.MENU && renderMenu()}
      {mode === GameMode.GAME_OVER && renderGameOver()}
      {showDaily && mode === GameMode.MENU && renderDailyModal()}
      {showLeaderboard && renderLeaderboardModal()}
      {showSettings && renderSettingsModal()}
      {showSkins && renderSkinSelector()}
    </div>
  );
};

export default App;
