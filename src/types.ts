export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Pixel extends Position, RGB {}

export interface ImageConfig {
  path: string;
  x: number;
  y: number;
  priority: number;
}

export interface Account {
  uid: number;
  access_key: string;
}

export interface Settings {
  draw_mode: 'random' | 'diffusion' | 'sequential';
  log_interval: number;
}

export interface Config {
  images: ImageConfig[];
  accounts: Account[];
  settings: Settings;
}

export interface TokenInfo {
  uid: number;
  token: string;
  lastPaintTime: number;
  cooldown: number;
  active: boolean;
  errorCount: number;
}

export interface ImageData {
  pixels: Uint8Array;
  width: number;
  height: number;
  channels: number;
  offsetX: number;
  offsetY: number;
  priority: number;
}

export interface PaintTask {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  priority: number;
}

export interface Stats {
  totalPainted: number;
  successCount: number;
  failureCount: number;
  cooldownCount: number;
  queueSize: number;
  efficiency: number; // pixels per second
  tokenStats: Map<number, TokenStats>;
}

export interface TokenStats {
  uid: number;
  painted: number;
  success: number;
  failure: number;
  cooldown: number;
  efficiency: number;
}

export const BOARD_WIDTH = 1000;
export const BOARD_HEIGHT = 600;
export const COOLDOWN_MS = 25;
export const TARGET_EFFICIENCY = 33; // px/s per token

// WebSocket opcodes
export const OPCODE = {
  HEARTBEAT_PING: 0xfc,
  HEARTBEAT_PONG: 0xfb,
  PAINT_MESSAGE: 0xfa,
  PAINT_RESULT: 0xff,
  PAINT_OPERATION: 0xfe,
} as const;

// Status codes
export const STATUS_CODE = {
  SUCCESS: 0xef,
  COOLDOWN: 0xee,
  INVALID_TOKEN: 0xed,
  BAD_REQUEST: 0xec,
  NO_PERMISSION: 0xeb,
  SERVER_ERROR: 0xea,
} as const;
