import { loadConfig } from './config';
import { Board } from './board';
import { ImageLoader } from './image-loader';
import { TokenManager } from './token-manager';
import { WebSocketHandler } from './websocket';
import { PixelQueue } from './pixel-queue';
import { Logger } from './logger';
import { Painter } from './painter';

async function main() {
  console.log('Starting Paintbot for LGS Paintboard 2026...\n');

  try {
    // Load configuration
    const configPath = process.argv[2] || 'config.yaml';
    console.log(`Loading configuration from ${configPath}...`);
    const config = loadConfig(configPath);
    console.log(`Loaded ${config.images.length} images and ${config.accounts.length} accounts\n`);

    // Initialize board
    console.log('Fetching initial board state...');
    const board = new Board();
    await board.fetchInitialState();
    console.log('Board state loaded\n');

    // Load images
    console.log('Loading images...');
    const imageLoader = new ImageLoader();
    const images = await imageLoader.loadAllImages(config.images);
    console.log(`Loaded ${images.length} images\n`);

    // Acquire tokens
    console.log('Acquiring tokens...');
    const tokenManager = new TokenManager();
    await tokenManager.acquireTokens(config.accounts);
    console.log(`Active tokens: ${tokenManager.getActiveTokenCount()}\n`);

    // Initialize WebSocket
    console.log('Connecting to WebSocket...');
    const wsHandler = new WebSocketHandler(board);
    await wsHandler.connect();
    console.log('WebSocket connected\n');

    // Initialize pixel queue
    console.log('Building pixel queue...');
    const pixelQueue = new PixelQueue(board, imageLoader);
    pixelQueue.setImages(images);
    console.log(`Queue initialized with ${pixelQueue.size()} pixels\n`);

    // Initialize logger
    const logger = new Logger();

    // Initialize painter
    const painter = new Painter(
      board,
      tokenManager,
      wsHandler,
      pixelQueue,
      logger,
      config.settings
    );

    // Start painting
    console.log('Starting painter...\n');
    painter.start();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down gracefully...');
      painter.stop();
      wsHandler.close();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\nShutting down gracefully...');
      painter.stop();
      wsHandler.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
