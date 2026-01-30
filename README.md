# Paintbot for LGS Paintboard 2026

A high-performance paintboard bot that efficiently draws multiple images on the LGS Paintboard 2026 using priority-based token management.

## Features

- **Multi-Token Management**: Supports hundreds of access keys with automatic token acquisition
- **Priority-Based Image System**: Multiple images with individual priorities, tokens cascade from high to low priority
- **Drawing Modes**: Random, Diffusion, and Sequential drawing strategies
- **Real-Time Board Sync**: WebSocket integration for live board state updates
- **Performance Optimized**: Maintains 33+ px/s efficiency per token, no slowdown over time
- **Smart Queue Management**: Prevents tokens from overwriting each other's work
- **Detailed Logging**: Real-time statistics including efficiency, queue size, and per-token performance

## Requirements

- Node.js 18+ 
- npm or yarn

## Installation

```bash
npm install
```

## Configuration

Create a `config.yaml` file based on `config.example.yaml`:

```yaml
images:
  - path: "image1.png"
    x: 100
    y: 200
    priority: 1  # Highest priority (lower number = higher priority)
  - path: "image2.png"
    x: 300
    y: 400
    priority: 2

accounts:
  - uid: 123456
    access_key: "your-access-key-here"
  - uid: 789012
    access_key: "another-access-key-here"

settings:
  draw_mode: "random"  # Options: random, diffusion, sequential
  log_interval: 5      # Log statistics every N seconds
```

### Configuration Options

- **images**: List of images to draw
  - `path`: Path to the image file (PNG supported)
  - `x`, `y`: Position on the board (board is 1000x600)
  - `priority`: Lower number = higher priority

- **accounts**: List of Luogu accounts with access keys
  - `uid`: Luogu user ID
  - `access_key`: Your AccessKey for the paintboard

- **settings**:
  - `draw_mode`: How pixels are selected (`random`, `diffusion`, or `sequential`)
  - `log_interval`: How often to print statistics (in seconds)

## Usage

1. Build the project:
```bash
npm run build
```

2. Run the bot:
```bash
npm start
```

Or specify a custom config file:
```bash
npm start config.yaml
```

For development:
```bash
npm run dev
```

## How It Works

### Priority System

- Images are processed in priority order (1 = highest, 2 = lower, etc.)
- All tokens work on the highest priority image first
- When high-priority image is complete, tokens automatically cascade to next priority
- Overlapping pixels are resolved by priority (higher priority image wins)
- Prevents "self-attacking" by checking board state before painting

### Token Management

- Tokens are acquired automatically from the API
- 25ms cooldown per token (supports 40 px/s theoretical max)
- Target efficiency: 33+ px/s per token
- Invalid tokens are automatically deactivated
- Cooldown tracking prevents rate limiting

### WebSocket Protocol

- Sticky packet mechanism for optimal performance
- Batch sending every 20ms (50 batches/second, well under 256/sec limit)
- Immediate heartbeat responses
- Real-time board updates from other users
- Automatic reconnection on disconnect

### Performance Features

- Efficient board state storage (Uint8Array)
- Smart queue management (no duplicates, priority-based)
- Memory-efficient pixel tracking
- Periodic queue rebuilding to fix drift
- Optimized packet batching

## Statistics

The bot provides detailed real-time statistics:

```
========================================
Paintbot Statistics
========================================
Uptime: 120s
Queue Size: 15234
Total Painted: 4567
Success: 4321 (94.6%)
Failure: 246
Cooldown: 123
Overall Efficiency: 36.01 px/s

Token Statistics:
----------------------------------------
UID 123456:
  Painted: 2345 | Success: 2234 (95.3%)
  Efficiency: 18.62 px/s
  Failures: 111 | Cooldowns: 67
UID 789012:
  Painted: 2222 | Success: 2087 (93.9%)
  Efficiency: 17.39 px/s
  Failures: 135 | Cooldowns: 56
========================================
```

## API Documentation

The bot uses the LGS Paintboard 2026 API:

- **Base URL**: `https://paintboard.luogu.me`
- **WebSocket**: `wss://paintboard.luogu.me/api/paintboard/ws`
- **Board Size**: 1000x600 pixels
- **Rate Limits**: 256 packets/second per connection, 3 connections per IP

See the `docs` file for complete API documentation.

## Project Structure

```
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Configuration loader
│   ├── types.ts              # TypeScript type definitions
│   ├── board.ts              # Board state management
│   ├── image-loader.ts       # Image loading with Sharp
│   ├── token-manager.ts      # Token acquisition and management
│   ├── websocket.ts          # WebSocket connection handler
│   ├── pixel-queue.ts        # Priority-based pixel queue
│   ├── painter.ts            # Main painting logic
│   ├── logger.ts             # Statistics and logging
│   └── draw-strategies/      # Drawing mode implementations
├── config.example.yaml       # Example configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### Bot is not painting
- Check that tokens are being acquired successfully
- Verify WebSocket connection is established
- Ensure images are in correct format and location
- Check board coordinates are within bounds (0-999 x, 0-599 y)

### Low efficiency
- Increase number of tokens/accounts
- Check network latency to paintboard server
- Verify cooldown tracking is working correctly
- Review failure logs for issues

### Tokens getting deactivated
- Verify access keys are correct
- Check that UIDs match access keys
- Ensure rate limits are not being exceeded
- Look for invalid token errors in logs

## License

MIT
