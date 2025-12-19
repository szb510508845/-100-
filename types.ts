
export enum GameMode {
  MENU = 'MENU',
  CLASSIC = 'CLASSIC',
  INFINITE = 'INFINITE',
  PVP = 'PVP',
  BOSS = 'BOSS',
  GAME_OVER = 'GAME_OVER'
}

export enum PlatformType {
  NORMAL = 'NORMAL',
  SPIKE = 'SPIKE',
  MOVING = 'MOVING',
  BREAKABLE = 'BREAKABLE',
  CONVEYOR = 'CONVEYOR'
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  isCharging: boolean;
  chargePower: number;
  facingRight: boolean;
  skin: string;
  invincible: boolean;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  visited: boolean;
  direction?: number; // 1 or -1 for moving
  speed?: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface GameState {
  score: number; // Depth/Floor
  highScore: number;
  coins: number;
  revivesUsed: number;
  items: {
    revive: number;
    magnet: boolean;
    slowMo: boolean;
    shield: boolean;
  };
}
