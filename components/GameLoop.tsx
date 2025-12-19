
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameMode, PlatformType, Player, Platform, Particle, GameState } from '../types';
import { GRAVITY, FRICTION, MAX_CHARGE, JUMP_FORCE_MULTIPLIER, CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, COLORS, PLATFORM_HEIGHT, BACKGROUND_COLORS } from '../constants';
import { playJumpSound, playLandSound, playWhooshSound, playFailSound } from '../audio';
import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

interface GameLoopProps {
  mode: GameMode;
  onGameOver: (score: number, reason: string) => void;
  setScore: (score: number) => void;
  gameState: GameState;
  isPaused: boolean;
  selectedSkin: string;
  isReviving: boolean;
}

export const GameLoop: React.FC<GameLoopProps> = ({ mode, onGameOver, setScore, gameState, isPaused, selectedSkin, isReviving }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const prevModeRef = useRef<GameMode>(mode);
  const wasGroundedRef = useRef<boolean>(false);
  const prevVyRef = useRef<number>(0);
  
  const keysRef = useRef<{ [key: string]: boolean }>({});
  
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2,
    y: 100,
    vx: 0,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    isGrounded: false,
    isCharging: false,
    chargePower: 0,
    facingRight: true,
    skin: selectedSkin,
    invincible: false,
  });
  
  const platformsRef = useRef<Platform[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const cameraYRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const invincibleTimerRef = useRef<number>(0);
  
  // Boss state
  const bossRef = useRef({
    health: 100,
    maxHealth: 100,
    x: CANVAS_WIDTH / 2,
    y: -200, // Starts off screen
    targetX: CANVAS_WIDTH / 2,
    attackTimer: 0,
    phase: 1,
  });

  const initGame = useCallback(() => {
    playerRef.current = {
      x: CANVAS_WIDTH / 2,
      y: 100,
      vx: 0,
      vy: 0,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      isGrounded: false,
      isCharging: false,
      chargePower: 0,
      facingRight: true,
      skin: selectedSkin,
      invincible: false,
    };
    cameraYRef.current = 0;
    scoreRef.current = 0;
    wasGroundedRef.current = false;
    prevVyRef.current = 0;
    invincibleTimerRef.current = 0;
    projectilesRef.current = [];
    
    // Boss Reset
    bossRef.current = {
      health: 100,
      maxHealth: 100,
      x: CANVAS_WIDTH / 2,
      y: -200,
      targetX: CANVAS_WIDTH / 2,
      attackTimer: 0,
      phase: 1,
    };

    const initialPlatforms: Platform[] = [];
    initialPlatforms.push({
      id: 'start',
      x: CANVAS_WIDTH / 2 - 100,
      y: 200,
      width: 200,
      height: PLATFORM_HEIGHT,
      type: PlatformType.NORMAL,
      visited: true,
    });

    for (let i = 1; i < 10; i++) {
      generatePlatform(initialPlatforms, i * 150 + 200);
    }
    platformsRef.current = initialPlatforms;
    particlesRef.current = [];
  }, [selectedSkin, mode]);

  const revivePlayer = useCallback(() => {
    playerRef.current = {
      ...playerRef.current,
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE/2,
      y: cameraYRef.current + 50,
      vx: 0,
      vy: 0,
      isGrounded: false,
      isCharging: false,
      chargePower: 0,
      invincible: true,
      skin: selectedSkin
    };
    invincibleTimerRef.current = Date.now() + 2000;
  }, [selectedSkin]);

  const generatePlatform = (currentPlatforms: Platform[], yPos: number) => {
    let width = Math.max(60, 150 - (scoreRef.current * 0.5));
    if (mode === GameMode.BOSS) width = Math.max(45, 100 - (scoreRef.current * 0.8)); // Harder platforms in Boss mode
    
    const x = Math.random() * (CANVAS_WIDTH - width);
    let type = PlatformType.NORMAL;
    const lastPlat = currentPlatforms[currentPlatforms.length - 1];
    const isLastSafe = lastPlat && lastPlat.type !== PlatformType.SPIKE && lastPlat.type !== PlatformType.BREAKABLE;

    if (scoreRef.current > 20 && Math.random() > 0.6) type = PlatformType.MOVING;
    if (isLastSafe) {
        if (scoreRef.current > 30 && Math.random() > 0.7) type = PlatformType.SPIKE;
        if (scoreRef.current > 50 && Math.random() > 0.8) type = PlatformType.BREAKABLE;
    }

    currentPlatforms.push({
      id: Math.random().toString(36).substr(2, 9),
      x,
      y: yPos,
      width,
      height: PLATFORM_HEIGHT,
      type,
      visited: false,
      speed: type === PlatformType.MOVING ? (Math.random() > 0.5 ? 3 : -3) : 0,
      direction: 1
    });
  };

  const createParticles = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random(),
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const spawnBossProjectile = (x: number, y: number, tx: number, ty: number) => {
    const angle = Math.atan2(ty - y, tx - x);
    const speed = 4 + (bossRef.current.phase * 2);
    projectilesRef.current.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 8
    });
  };

  const startJump = () => {
    if (playerRef.current.isGrounded) {
      playerRef.current.isCharging = true;
      playerRef.current.chargePower = 0;
    }
  };

  const endJump = () => {
    if (playerRef.current.isCharging) {
      playerRef.current.isCharging = false;
      let dir = 0;
      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) dir = -1;
      else if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) dir = 1;
      else dir = playerRef.current.facingRight ? 1 : -1;
      playJumpSound();
      playerRef.current.vy = -Math.max(10, playerRef.current.chargePower * 0.8);
      playerRef.current.vx = dir * (4 + playerRef.current.chargePower * 0.3);
      playerRef.current.isGrounded = false;
      playerRef.current.y -= 5;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      keysRef.current[e.code] = true;
      if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) startJump();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isPaused) return;
      keysRef.current[e.code] = false;
      if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) endJump();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPaused]);

  const update = useCallback(() => {
    if (isPaused) return;

    const player = playerRef.current;
    const platforms = platformsRef.current;
    const boss = bossRef.current;
    
    if (player.invincible && Date.now() > invincibleTimerRef.current) {
        player.invincible = false;
    }

    // --- MOVEMENT ---
    if (player.isGrounded && !player.isCharging) {
      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) { player.vx -= 0.8; player.facingRight = false; }
      if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) { player.vx += 0.8; player.facingRight = true; }
    }
    if (!player.isGrounded) {
      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) player.vx -= 0.3;
      if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) player.vx += 0.3;
      if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) player.vy += 1.0;
    }

    if (player.isCharging) {
      if (player.chargePower < MAX_CHARGE) player.chargePower += 0.5;
    } else {
      player.vy += GRAVITY;
      player.vx *= FRICTION;
    }

    if (!player.isGrounded && player.vy > 1.0 && prevVyRef.current <= 1.0) playWhooshSound();
    prevVyRef.current = player.vy;

    player.x += player.vx;
    player.y += player.vy;

    if (player.x < 0) { player.x = 0; player.vx *= -1; }
    if (player.x + player.width > CANVAS_WIDTH) { player.x = CANVAS_WIDTH - player.width; player.vx *= -1; }

    // --- BOSS LOGIC ---
    if (mode === GameMode.BOSS) {
        // Move boss to camera
        const bossTargetY = cameraYRef.current + 80;
        boss.y += (bossTargetY - boss.y) * 0.05;
        
        // Horizontal chasing
        if (Math.abs(boss.x - player.x) > 20) {
            boss.x += (player.x - boss.x) * 0.02;
        }

        // Attacks
        boss.attackTimer++;
        const attackInterval = boss.phase === 1 ? 120 : 60;
        if (boss.attackTimer > attackInterval) {
            boss.attackTimer = 0;
            spawnBossProjectile(boss.x, boss.y, player.x + player.width/2, player.y + player.height/2);
            if (boss.phase === 2) {
                 spawnBossProjectile(boss.x, boss.y, player.x + player.width/2 - 50, player.y + player.height/2);
                 spawnBossProjectile(boss.x, boss.y, player.x + player.width/2 + 50, player.y + player.height/2);
            }
        }

        // Projectile collisions
        projectilesRef.current.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            if (
                !player.invincible &&
                p.x + p.size > player.x && p.x - p.size < player.x + player.width &&
                p.y + p.size > player.y && p.y - p.size < player.y + player.height
            ) {
                onGameOver(scoreRef.current, "被BOSS击中!");
                return;
            }
            if (p.y > cameraYRef.current + CANVAS_HEIGHT + 100) projectilesRef.current.splice(i, 1);
        });

        // Damaging boss
        // In Boss mode, every 5 floors damages the boss
        // handled in the platform visit logic below
    }

    // --- PLATFORM COLLISIONS ---
    let onPlatform = false;
    if (player.vy > 0) {
      for (const plat of platforms) {
        if (
          player.y + player.height >= plat.y &&
          player.y + player.height <= plat.y + plat.height + 25 &&
          player.x + player.width > plat.x &&
          player.x < plat.x + plat.width
        ) {
          if (plat.type === PlatformType.SPIKE && !player.invincible && !gameState.items.shield) {
             if (mode === GameMode.INFINITE) {
                 player.vy = -5;
                 createParticles(player.x, player.y, COLORS.SPIKE_RED, 5);
             } else {
                 onGameOver(scoreRef.current, "惨遭穿刺!");
                 createParticles(player.x, player.y, COLORS.SPIKE_RED, 20);
                 return;
             }
          }

          player.y = plat.y - player.height;
          player.vy = 0;
          player.isGrounded = true;
          onPlatform = true;

          if (plat.type === PlatformType.MOVING) player.x += plat.speed!;

          if (!plat.visited) {
            plat.visited = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            
            // Damage boss logic
            if (mode === GameMode.BOSS) {
                boss.health -= 2;
                if (boss.health <= 50) boss.phase = 2;
                if (boss.health <= 0) {
                    onGameOver(scoreRef.current, "奇迹！击败了深渊领主！");
                    return;
                }
                createParticles(boss.x, boss.y, '#f87171', 3);
            }

            let particleColor = COLORS.NEON_GREEN;
            if (player.skin === 'classic') particleColor = '#94a3b8';
            else if (player.skin === 'superman') particleColor = '#ef4444';
            else if (player.skin === 'prime') particleColor = '#60a5fa';
            else if (player.skin === 'bumblebee') particleColor = '#facc15';

            createParticles(player.x + player.width/2, player.y + player.height, particleColor, 5);
          }
          break;
        }
      }
    }

    if (!onPlatform) player.isGrounded = false;
    else if (!wasGroundedRef.current) playLandSound();
    wasGroundedRef.current = onPlatform;

    platforms.forEach(plat => {
      if (plat.type === PlatformType.MOVING) {
        plat.x += plat.speed!;
        if (plat.x <= 0 || plat.x + plat.width >= CANVAS_WIDTH) plat.speed! *= -1;
      }
    });

    const targetCamY = player.y - 300;
    if (targetCamY > cameraYRef.current) cameraYRef.current += (targetCamY - cameraYRef.current) * 0.15;

    // Auto Scroll
    const rawSpeed = (mode === GameMode.BOSS ? 1.5 : 0.8) + (scoreRef.current * 0.015);
    const scrollSpeed = Math.min(rawSpeed, mode === GameMode.BOSS ? 4.5 : 3.5);
    cameraYRef.current += scrollSpeed;
    
    if (player.y < cameraYRef.current - 10) {
       if (mode === GameMode.INFINITE) {
           player.y = cameraYRef.current + 10;
           player.vy = Math.max(0, player.vy);
       } else if (!player.invincible) {
           onGameOver(scoreRef.current, "被天花板压碎了!");
           return;
       }
    }

    const lastPlat = platforms[platforms.length - 1];
    if (lastPlat && lastPlat.y < cameraYRef.current + CANVAS_HEIGHT + 200) generatePlatform(platforms, lastPlat.y + (80 + Math.random() * 120));
    if (platforms.length > 0 && platforms[0].y < cameraYRef.current - 200) platforms.shift();
    
    particlesRef.current.forEach((p, index) => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.02;
      if (p.life <= 0) particlesRef.current.splice(index, 1);
    });

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [isPaused, mode, gameState.items.shield, onGameOver, setScore]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgIndex = Math.floor(scoreRef.current / 100) % BACKGROUND_COLORS.length;
    ctx.fillStyle = mode === GameMode.BOSS ? '#110000' : BACKGROUND_COLORS[bgIndex];
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(0, -cameraYRef.current);

    // --- TECH PATTERN ---
    const gridSize = 60;
    const startY = Math.floor(cameraYRef.current / gridSize) * gridSize - gridSize;
    const endY = cameraYRef.current + CANVAS_HEIGHT + gridSize;
    ctx.lineWidth = 1;
    for (let y = startY; y < endY; y += gridSize) {
        for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
             const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
             const rand = seed - Math.floor(seed);
             ctx.strokeStyle = mode === GameMode.BOSS ? 'rgba(255, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)';
             ctx.strokeRect(x, y, gridSize, gridSize);
             if (rand > 0.96) { ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'; ctx.fillRect(x + 4, y + 4, gridSize - 8, gridSize - 8); }
        }
    }

    // --- DRAW BOSS ---
    if (mode === GameMode.BOSS) {
        const boss = bossRef.current;
        ctx.save();
        ctx.translate(boss.x, boss.y);
        
        // Glow
        ctx.shadowBlur = 30;
        ctx.shadowColor = boss.phase === 2 ? '#ef4444' : '#f87171';
        
        // Boss Body (Skull-like machine)
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Red Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = boss.phase === 2 ? '#ff0000' : '#fca5a5';
        ctx.beginPath();
        ctx.arc(0, 0, 8 + Math.sin(Date.now() / 100) * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Metal details
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.strokeRect(-20, -20, 40, 40);
        
        ctx.restore();

        // Projectiles
        projectilesRef.current.forEach(p => {
            ctx.fillStyle = '#ff4444';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff4444';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.shadowBlur = 0;
    }

    // Spikes
    const spikeY = cameraYRef.current;
    ctx.fillStyle = COLORS.SPIKE_RED;
    ctx.beginPath();
    for(let i = 0; i <= CANVAS_WIDTH; i += 20) {
       ctx.moveTo(i, spikeY - 20); ctx.lineTo(i + 10, spikeY + 20); ctx.lineTo(i + 20, spikeY - 20);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = COLORS.SPIKE_RED; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;

    platformsRef.current.forEach(plat => {
      if (plat.type === PlatformType.SPIKE) {
        ctx.fillStyle = COLORS.SPIKE_RED;
        ctx.beginPath();
        ctx.moveTo(plat.x, plat.y + plat.height);
        for(let i=0; i<plat.width; i+=10) { ctx.lineTo(plat.x + i + 5, plat.y); ctx.lineTo(plat.x + i + 10, plat.y + plat.height); }
        ctx.fill();
      } else {
        ctx.fillStyle = plat.visited ? COLORS.NEON_PINK : COLORS.NEON_CYAN;
        ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle; ctx.fillRect(plat.x, plat.y, plat.width, plat.height); ctx.shadowBlur = 0;
        if (plat.type === PlatformType.MOVING) { ctx.fillStyle = '#fff'; ctx.fillRect(plat.x + 5, plat.y + 5, plat.width - 10, 2); }
      }
    });

    particlesRef.current.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; });

    const player = playerRef.current;
    if (!player.invincible || Math.floor(Date.now() / 100) % 2 !== 0) drawPlayer(ctx, player);

    ctx.restore();

    // UI Overlays
    if (player.isCharging) {
      ctx.save();
      ctx.translate(0, -cameraYRef.current);
      const barWidth = 40;
      ctx.fillStyle = '#333'; ctx.fillRect(player.x + player.width/2 - 20, player.y - 20, barWidth, 4);
      ctx.fillStyle = COLORS.NEON_GREEN; ctx.fillRect(player.x + player.width/2 - 20, player.y - 20, (player.chargePower / MAX_CHARGE) * barWidth, 4);
      ctx.restore();
    }

    if (mode === GameMode.BOSS) {
        // Boss Health Bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(50, 20, CANVAS_WIDTH - 100, 10);
        ctx.fillStyle = '#ef4444';
        const healthPercent = bossRef.current.health / bossRef.current.maxHealth;
        ctx.fillRect(50, 20, (CANVAS_WIDTH - 100) * healthPercent, 10);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(50, 20, CANVAS_WIDTH - 100, 10);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('DEEP ABYSS GUARDIAN', 50, 15);
    }
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    if (player.isCharging) { const scale = 1 - (player.chargePower / MAX_CHARGE) * 0.3; ctx.scale(1 + (1-scale), scale); }
    const skin = player.skin;
    if (skin === 'superman') { ctx.fillStyle = '#ef4444'; ctx.beginPath(); if (player.facingRight) { ctx.moveTo(-player.width/2, -player.height/2 + 5); ctx.lineTo(-player.width/2 - 10, player.height/2 + 5 + (player.vy * -1)); ctx.lineTo(player.width/2, -player.height/2 + 5); } else { ctx.moveTo(player.width/2, -player.height/2 + 5); ctx.lineTo(player.width/2 + 10, player.height/2 + 5 + (player.vy * -1)); ctx.lineTo(-player.width/2, -player.height/2 + 5); } ctx.fill(); }
    if (skin === 'superman') ctx.fillStyle = '#3b82f6'; else if (skin === 'prime') ctx.fillStyle = '#ef4444'; else if (skin === 'bumblebee') ctx.fillStyle = '#facc15'; else ctx.fillStyle = '#475569';
    ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);
    if (skin === 'prime') { ctx.fillStyle = '#1d4ed8'; ctx.fillRect(-player.width/2, 0, player.width, player.height/2); ctx.fillStyle = '#60a5fa'; ctx.fillRect(-player.width/2 + 4, -8, player.width/2 - 6, 8); ctx.fillRect(2, -8, player.width/2 - 6, 8); } else if (skin === 'bumblebee') { ctx.fillStyle = '#000000'; ctx.fillRect(-4, -player.height/2, 8, player.height); }
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.strokeRect(-player.width/2 + 2, -player.height/2 + 2, player.width - 4, player.height - 4);
    if (skin === 'prime') { ctx.fillStyle = '#94a3b8'; ctx.fillRect(-player.width/2 + 4, 4, player.width - 8, player.height/2 - 8); } else if (skin === 'superman') { ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.lineTo(-6, 0); ctx.fill(); ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px sans-serif'; ctx.fillText('S', -3, 4); } else { ctx.fillStyle = '#0f172a'; ctx.fillRect(-player.width/2 + 4, -player.height/2 + 4, player.width - 8, player.height/2 - 4); }
    let eyeColor = COLORS.NEON_GREEN;
    if (player.isCharging) eyeColor = COLORS.SPIKE_RED; else if (skin === 'superman') eyeColor = '#ef4444'; else if (skin === 'prime' || skin === 'bumblebee') eyeColor = '#3b82f6';
    ctx.fillStyle = eyeColor;
    const eyeY = skin === 'classic' ? -player.height/2 + 8 : -4;
    if (player.facingRight) { ctx.fillRect(2, eyeY, 8, 4); ctx.fillRect(-8, eyeY, 8, 4); } else { ctx.fillRect(0, eyeY, 8, 4); ctx.fillRect(-10, eyeY, 8, 4); }
    if (skin === 'classic') { ctx.beginPath(); ctx.moveTo(0, -player.height/2); ctx.lineTo(0, -player.height/2 - 5); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(0, -player.height/2 - 5, 2, 0, Math.PI * 2); ctx.fillStyle = player.isCharging ? COLORS.SPIKE_RED : COLORS.NEON_CYAN; ctx.fill(); } else if (skin === 'bumblebee') { ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(-10, -player.height/2); ctx.lineTo(-12, -player.height/2 - 4); ctx.lineTo(-8, -player.height/2); ctx.fill(); ctx.beginPath(); ctx.moveTo(10, -player.height/2); ctx.lineTo(12, -player.height/2 - 4); ctx.lineTo(8, -player.height/2); ctx.fill(); }
    ctx.restore();
  };

  useEffect(() => { initGame(); }, [initGame, mode]);
  useEffect(() => {
    if (prevModeRef.current === GameMode.GAME_OVER && mode !== GameMode.GAME_OVER) {
        if (isReviving) revivePlayer(); else initGame();
    }
    prevModeRef.current = mode;
  }, [mode, initGame, revivePlayer, isReviving]);

  useEffect(() => {
    if (!isPaused) requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPaused, update]);

  const handleBtnDown = (key: string) => (e: React.SyntheticEvent) => { e.preventDefault(); if(key === 'Jump') startJump(); else keysRef.current[key] = true; };
  const handleBtnUp = (key: string) => (e: React.SyntheticEvent) => { e.preventDefault(); if(key === 'Jump') endJump(); else keysRef.current[key] = false; };

  return (
    <div className="relative w-full h-full">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-contain bg-gray-900 touch-none" />
        <div className="absolute bottom-6 left-0 right-0 flex justify-between items-end px-6 pb-2 pointer-events-none select-none">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 active:bg-white/30 flex items-center justify-center pointer-events-auto touch-manipulation transition-colors shadow-lg" onMouseDown={handleBtnDown('ArrowLeft')} onMouseUp={handleBtnUp('ArrowLeft')} onMouseLeave={handleBtnUp('ArrowLeft')} onTouchStart={handleBtnDown('ArrowLeft')} onTouchEnd={handleBtnUp('ArrowLeft')}>
                <ArrowLeft className="w-8 h-8 text-white/90" />
            </div>
             <div className="w-24 h-24 rounded-3xl bg-yellow-500/20 backdrop-blur-sm border-4 border-yellow-500/40 active:bg-yellow-500/40 active:scale-95 flex items-center justify-center pointer-events-auto touch-manipulation transition-all mx-4 shadow-xl" onMouseDown={handleBtnDown('Jump')} onMouseUp={handleBtnUp('Jump')} onMouseLeave={handleBtnUp('Jump')} onTouchStart={handleBtnDown('Jump')} onTouchEnd={handleBtnUp('Jump')}>
                <div className="flex flex-col items-center gap-1">
                    <ArrowUp className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
                    <span className="text-[10px] font-bold text-yellow-200 uppercase tracking-widest">蓄力</span>
                </div>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 active:bg-white/30 flex items-center justify-center pointer-events-auto touch-manipulation transition-colors shadow-lg" onMouseDown={handleBtnDown('ArrowRight')} onMouseUp={handleBtnUp('ArrowRight')} onMouseLeave={handleBtnUp('ArrowRight')} onTouchStart={handleBtnDown('ArrowRight')} onTouchEnd={handleBtnUp('ArrowRight')}>
                <ArrowRight className="w-8 h-8 text-white/90" />
            </div>
        </div>
    </div>
  );
};
