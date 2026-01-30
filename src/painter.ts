import { Board } from './board';
import { TokenManager } from './token-manager';
import { WebSocketHandler } from './websocket';
import { PixelQueue } from './pixel-queue';
import { Logger } from './logger';
import { Settings, STATUS_CODE } from './types';

export class Painter {
  private board: Board;
  private tokenManager: TokenManager;
  private wsHandler: WebSocketHandler;
  private pixelQueue: PixelQueue;
  private logger: Logger;
  private settings: Settings;
  private running = false;
  private paintId = 0;
  private sendInterval: NodeJS.Timeout | null = null;
  private queueRebuildInterval: NodeJS.Timeout | null = null;

  constructor(
    board: Board,
    tokenManager: TokenManager,
    wsHandler: WebSocketHandler,
    pixelQueue: PixelQueue,
    logger: Logger,
    settings: Settings
  ) {
    this.board = board;
    this.tokenManager = tokenManager;
    this.wsHandler = wsHandler;
    this.pixelQueue = pixelQueue;
    this.logger = logger;
    this.settings = settings;
  }

  start(): void {
    if (this.running) {
      console.log('Painter already running');
      return;
    }

    this.running = true;
    console.log('Painter started');

    // Start sending packets every 20ms (50 times per second)
    this.sendInterval = setInterval(() => {
      this.sendBatch();
    }, 20);

    // Rebuild queue periodically to fix any drift (every 30 seconds)
    this.queueRebuildInterval = setInterval(() => {
      console.log('Rebuilding queue to ensure correctness...');
      this.pixelQueue.rebuildQueue();
    }, 30000);

    // Start the logger
    this.logger.start(this.settings.log_interval);
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
      this.sendInterval = null;
    }

    if (this.queueRebuildInterval) {
      clearInterval(this.queueRebuildInterval);
      this.queueRebuildInterval = null;
    }

    this.logger.stop();
    console.log('Painter stopped');
  }

  private sendBatch(): void {
    if (!this.wsHandler.isConnected()) {
      return;
    }

    // Try to send as many pixels as we have available tokens for
    let packetsSent = 0;
    const maxPacketsPerBatch = 50; // Stay well under 256/sec limit

    while (packetsSent < maxPacketsPerBatch) {
      const token = this.tokenManager.getAvailableToken();
      if (!token) {
        break; // No tokens available
      }

      const task = this.pixelQueue.getNextTask(this.settings.draw_mode);
      if (!task) {
        break; // No tasks in queue
      }

      // Double-check that the pixel still needs painting
      const currentColor = this.board.getPixel(task.x, task.y);
      const targetColor = { r: task.r, g: task.g, b: task.b };
      
      if (this.board.colorsMatch(currentColor, targetColor)) {
        // Already correct, skip
        continue;
      }

      // Create and queue the paint packet
      const id = this.getNextPaintId();
      const packet = this.wsHandler.createPaintPacket(
        token.uid,
        token.token,
        task.x,
        task.y,
        task.r,
        task.g,
        task.b,
        id,
        (success, statusCode) => {
          this.handlePaintResult(token.uid, task.x, task.y, targetColor, success, statusCode);
        }
      );

      this.wsHandler.appendData(packet);
      this.tokenManager.markTokenUsed(token.uid);
      packetsSent++;
    }

    // Flush all packets at once
    if (packetsSent > 0) {
      this.wsHandler.flushData();
    }

    // Update queue size in logger
    this.logger.updateQueueSize(this.pixelQueue.size());
  }

  private handlePaintResult(
    uid: number,
    x: number,
    y: number,
    targetColor: { r: number; g: number; b: number },
    success: boolean,
    statusCode: number
  ): void {
    this.logger.recordPaintAttempt(uid, success, statusCode);

    if (success) {
      // Update our board state optimistically
      this.board.setPixel(x, y, targetColor);
      // Remove from queue if present
      this.pixelQueue.removeTask(x, y);
    } else {
      // Handle different error cases
      switch (statusCode) {
        case STATUS_CODE.COOLDOWN:
          // Token still cooling down, re-queue the task
          this.pixelQueue.addTask({
            x,
            y,
            r: targetColor.r,
            g: targetColor.g,
            b: targetColor.b,
            priority: 1, // Use default priority
          });
          break;

        case STATUS_CODE.INVALID_TOKEN:
          this.tokenManager.markTokenInvalid(uid);
          // Re-queue the task for another token
          this.pixelQueue.addTask({
            x,
            y,
            r: targetColor.r,
            g: targetColor.g,
            b: targetColor.b,
            priority: 1,
          });
          break;

        case STATUS_CODE.BAD_REQUEST:
        case STATUS_CODE.NO_PERMISSION:
        case STATUS_CODE.SERVER_ERROR:
          this.tokenManager.markTokenError(uid);
          // Re-queue the task
          this.pixelQueue.addTask({
            x,
            y,
            r: targetColor.r,
            g: targetColor.g,
            b: targetColor.b,
            priority: 1,
          });
          break;
      }
    }
  }

  private getNextPaintId(): number {
    this.paintId = (this.paintId + 1) % 4294967296; // Uint32 max
    return this.paintId;
  }
}
