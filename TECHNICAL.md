# Technical Documentation

## Architecture Overview

The paintbot is designed as a modular system with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                          Main (index.ts)                        │
│                    Orchestrates all components                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼─────┐   ┌────▼──────┐
    │  Board  │    │  Images  │   │  Tokens   │
    │  State  │    │  Loader  │   │  Manager  │
    └────┬────┘    └────┬─────┘   └────┬──────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                    ┌────▼─────┐
                    │  Pixel   │
                    │  Queue   │
                    └────┬─────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼─────┐   ┌────▼──────┐
    │ WebSocket│    │ Painter  │   │  Logger   │
    │ Handler  │    │  Logic   │   │  Stats    │
    └─────────┘    └──────────┘   └───────────┘
```

## Core Components

### 1. Board (`board.ts`)

**Purpose**: Maintains the current state of the paintboard.

**Key Features**:
- Stores board state as a Uint8Array (600x1000x3 = 1.8MB)
- Fetches initial state via HTTP API
- Updates from WebSocket messages
- Efficient pixel get/set operations
- Color comparison utilities

**Memory Layout**:
```
Pixel at (x, y):
  offset = (y * 1000 + x) * 3
  R = state[offset]
  G = state[offset + 1]
  B = state[offset + 2]
```

### 2. Image Loader (`image-loader.ts`)

**Purpose**: Loads and processes images using Sharp.

**Key Features**:
- Loads PNG images from filesystem
- Extracts pixel data in RGB format
- Handles images with different channel counts (RGB/RGBA)
- Sorts images by priority
- Maps image coordinates to board coordinates

**Image Data Structure**:
```typescript
{
  pixels: Uint8Array,    // Raw pixel data
  width: number,         // Image width
  height: number,        // Image height
  channels: number,      // 3 for RGB, 4 for RGBA
  offsetX: number,       // Board X position
  offsetY: number,       // Board Y position
  priority: number       // Drawing priority (1 = highest)
}
```

### 3. Token Manager (`token-manager.ts`)

**Purpose**: Manages authentication tokens for painting.

**Key Features**:
- Acquires tokens via POST /api/auth/gettoken
- Tracks cooldown per token (25ms)
- Monitors token health (error counts)
- Automatically deactivates invalid tokens
- Returns available tokens based on cooldown

**Token Lifecycle**:
```
Acquire → Active → [Paint] → Cooldown → Active
                      ↓
                  [Error] → Inactive (5+ errors)
```

### 4. WebSocket Handler (`websocket.ts`)

**Purpose**: Manages WebSocket connection and protocol.

**Key Features**:
- Handles sticky packet unpacking
- Automatic heartbeat responses
- Paint result callbacks
- Batch packet sending (every 20ms)
- Automatic reconnection
- Real-time board updates

**Protocol Flow**:
```
Server → 0xFC (Ping)
Client → 0xFB (Pong)

Server → 0xFA (Paint Message) → Update Board
Server → 0xFF (Paint Result) → Trigger Callback

Client → 0xFE (Paint Operation) → Send Batch
```

**Packet Structure**:
```
Paint Operation (31 bytes):
[0xFE][X:2][Y:2][R:1][G:1][B:1][UID:3][Token:16][ID:4]
       │    │    │   │   │    │      │         │
       │    │    │   │   │    │      │         └─ Paint ID (Uint32 LE)
       │    │    │   │   │    │      └─────────── Token UUID (16 bytes)
       │    │    │   │   │    └────────────────── UID (Uint24 LE)
       │    │    │   │   └─────────────────────── RGB color
       │    │    │   └─────────────────────────── Y coordinate (Uint16 LE)
       │    │    └─────────────────────────────── X coordinate (Uint16 LE)
       └──────────────────────────────────────── Opcode
```

### 5. Pixel Queue (`pixel-queue.ts`)

**Purpose**: Priority-based queue of pixels to paint.

**Key Features**:
- Priority-based ordering (lower number = higher priority)
- Handles overlapping images (higher priority wins)
- Prevents duplicate pixels in queue
- Multiple drawing modes (random, diffusion, sequential)
- Periodic verification and rebuilding
- Efficient pixel tracking with Set

**Queue Management**:
```
Build Queue:
  For each image (sorted by priority):
    For each pixel in image:
      If board color ≠ target color:
        If pixel not in higher priority image:
          Add to queue

Get Next Task:
  1. Sort by priority
  2. Apply draw mode (random/diffusion/sequential)
  3. Return task
  4. Remove from queue
```

### 6. Painter (`painter.ts`)

**Purpose**: Main painting orchestration.

**Key Features**:
- Batch painting every 20ms (50 Hz)
- Matches available tokens with queued pixels
- Handles paint results (success/failure)
- Re-queues failed pixels
- Periodic queue rebuilding (every 30s)
- Efficient packet batching

**Painting Loop**:
```
Every 20ms:
  1. Get available token
  2. Get next pixel from queue
  3. Verify pixel still needs painting
  4. Create paint packet
  5. Add to batch
  6. Repeat until no tokens or no pixels
  7. Flush batch to WebSocket
```

**Result Handling**:
```
Success (0xEF):
  - Update board state
  - Remove from queue

Cooldown (0xEE):
  - Re-queue pixel
  - Token already marked as used

Invalid Token (0xED):
  - Deactivate token
  - Re-queue pixel

Other Errors:
  - Increment error count
  - Re-queue pixel
  - Deactivate after 5 errors
```

### 7. Logger (`logger.ts`)

**Purpose**: Real-time statistics and monitoring.

**Key Features**:
- Per-token statistics
- Overall efficiency tracking
- Success/failure rates
- Queue size monitoring
- Periodic logging (configurable interval)

**Metrics**:
- Total painted attempts
- Success count and rate
- Failure count (by type)
- Cooldown count
- Overall efficiency (px/s)
- Per-token efficiency
- Queue size

## Performance Optimizations

### 1. Memory Efficiency

- **Uint8Array for board state**: 1.8MB instead of 5.4MB (using objects)
- **Set for pixel tracking**: O(1) lookups to prevent duplicates
- **Batch packet sending**: Reduces WebSocket overhead

### 2. CPU Efficiency

- **Priority-based sorting**: Only when needed, not on every pixel
- **Lazy queue rebuilding**: Only when colors don't match
- **Efficient pixel indexing**: Direct array access, no iteration

### 3. Network Efficiency

- **Sticky packets**: Batch multiple paint operations
- **Send interval**: 20ms (50 Hz) optimal for rate limits
- **Immediate heartbeat**: Prevents disconnections

### 4. Scalability

- **Token-based concurrency**: Scales linearly with token count
- **Priority system**: Prevents token conflicts
- **Periodic rebuilding**: Maintains accuracy over time

## Key Algorithms

### Priority Resolution

When multiple images overlap at the same position:

```typescript
function resolvePixel(x: number, y: number): RGB {
  for (const image of sortedByPriority(images)) {
    if (image.contains(x, y)) {
      return image.getColor(x, y);
    }
  }
  return boardColor(x, y);
}
```

### Efficiency Calculation

```typescript
efficiency = successCount / (currentTime - startTime)
// Target: 33+ px/s per token
// With 25ms cooldown: theoretical max = 40 px/s
// Achievable with good network: 33-38 px/s
```

### Token Selection

```typescript
function getAvailableToken(): Token | null {
  const now = Date.now();
  for (const token of tokens) {
    if (token.active && now - token.lastPaintTime >= 25) {
      return token;
    }
  }
  return null;
}
```

## Error Handling

### Token Errors
- 5+ errors → automatic deactivation
- Invalid token → immediate deactivation
- Cooldown → re-queue pixel

### WebSocket Errors
- Connection lost → automatic reconnection (5 attempts)
- Heartbeat timeout → reconnect
- Protocol violation → log and continue

### Image Loading Errors
- Invalid image → throw error and exit
- Missing file → throw error and exit

## Rate Limiting

**API Limits**:
- 256 packets/second per WebSocket
- 3 connections per IP
- 25ms cooldown per token

**Our Implementation**:
- 50 batches/second = 50 packets/second (well under limit)
- 1 connection per bot instance
- Strict cooldown tracking

## Testing Strategy

### Unit Tests (if needed)
- Board pixel operations
- Queue priority resolution
- Token cooldown tracking
- Packet creation

### Integration Tests (if needed)
- Image loading
- Config parsing
- WebSocket connection

### Manual Testing
- Run with sample config
- Monitor statistics
- Verify images appear correctly
- Check efficiency targets

## Future Enhancements

Possible improvements:
1. Multiple WebSocket connections (up to 3)
2. Diffusion from image center
3. Edge detection for faster painting
4. Dynamic priority adjustment
5. Token refresh/rotation
6. Performance profiling
7. Database for persistence
8. Web UI for monitoring
