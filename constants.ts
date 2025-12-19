




export const GRAVITY = 0.5;
export const FRICTION = 0.85;
export const MAX_CHARGE = 25;
export const JUMP_FORCE_MULTIPLIER = 0.8;
export const CANVAS_WIDTH = 400; // Virtual width for logic
export const CANVAS_HEIGHT = 800; // Virtual height
export const PLAYER_SIZE = 32;
export const PLATFORM_HEIGHT = 16;

export const COLORS = {
  NEON_PINK: '#ff00de',
  NEON_CYAN: '#00ffff',
  NEON_GREEN: '#00ff00',
  NEON_YELLOW: '#ffff00',
  DARK_BG: '#111827',
  SPIKE_RED: '#ef4444',
};

export const BACKGROUND_COLORS = [
  '#111827', // 0-99: Default Dark Gray
  '#2e1065', // 100-199: Deep Purple
  '#172554', // 200-299: Deep Blue
  '#022c22', // 300-399: Deep Green
  '#450a0a', // 400-499: Deep Red
  '#4a044e', // 500-599: Deep Magenta
  '#1c1917', // 600+: Warm Dark
];

export const SKINS = [
  { id: 'classic', name: '机甲小宝', color: '#94a3b8', desc: '经典型号', quote: '小宝出击，萌翻全场！' },
  { id: 'superman', name: '钢铁超人', color: '#3b82f6', desc: '红色披风', quote: '正义降临，无敌钢铁！' },
  { id: 'prime', name: '柱子哥', color: '#ef4444', desc: '领袖气质', quote: '柱间无敌，守护到底！' },
  { id: 'bumblebee', name: '小黄蜂', color: '#eab308', desc: '速度与激情', quote: '嗡嗡冲锋，sting你哦！' },
];

export const INITIAL_ITEMS = {
  revive: 1,
  magnet: false,
  slowMo: false,
  shield: false,
};
