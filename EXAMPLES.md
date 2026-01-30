# Usage Examples

## Quick Start

### 1. Installation

```bash
git clone <repository-url>
cd paintbot
npm install
npm run build
```

### 2. Create Configuration

Create a `config.yaml` file:

```yaml
images:
  - path: "logo.png"
    x: 400
    y: 250
    priority: 1

accounts:
  - uid: 123456
    access_key: "your-access-key-here"

settings:
  draw_mode: "random"
  log_interval: 5
```

### 3. Run the Bot

```bash
npm start
```

## Configuration Examples

### Single Image, Single Token

```yaml
images:
  - path: "heart.png"
    x: 450
    y: 275
    priority: 1

accounts:
  - uid: 123456
    access_key: "abc123xyz"

settings:
  draw_mode: "sequential"
  log_interval: 10
```

### Multiple Images with Priorities

```yaml
images:
  # Logo gets highest priority - all tokens work on this first
  - path: "logo.png"
    x: 400
    y: 250
    priority: 1
  
  # Banner gets second priority - tokens switch here when logo is done
  - path: "banner.png"
    x: 200
    y: 50
    priority: 2
  
  # Background gets lowest priority - painted last
  - path: "background.png"
    x: 0
    y: 0
    priority: 3

accounts:
  - uid: 123456
    access_key: "key1"
  - uid: 234567
    access_key: "key2"
  - uid: 345678
    access_key: "key3"

settings:
  draw_mode: "random"
  log_interval: 5
```

### Many Tokens for Fast Painting

```yaml
images:
  - path: "artwork.png"
    x: 100
    y: 100
    priority: 1

accounts:
  - uid: 111111
    access_key: "key01"
  - uid: 222222
    access_key: "key02"
  - uid: 333333
    access_key: "key03"
  - uid: 444444
    access_key: "key04"
  - uid: 555555
    access_key: "key05"
  - uid: 666666
    access_key: "key06"
  - uid: 777777
    access_key: "key07"
  - uid: 888888
    access_key: "key08"
  - uid: 999999
    access_key: "key09"
  - uid: 101010
    access_key: "key10"

settings:
  draw_mode: "diffusion"
  log_interval: 3
```

### Overlapping Images

When images overlap, higher priority (lower number) wins:

```yaml
images:
  # Logo will overwrite the background where they overlap
  - path: "logo.png"
    x: 400
    y: 250
    priority: 1
  
  # Background fills the rest
  - path: "background.png"
    x: 350
    y: 200
    priority: 2

accounts:
  - uid: 123456
    access_key: "key1"

settings:
  draw_mode: "random"
  log_interval: 5
```

Result: All tokens work on logo first. Once logo pixels are correct, tokens move to background pixels that don't conflict with logo.

## Drawing Modes

### Random Mode

```yaml
settings:
  draw_mode: "random"
```

Picks pixels randomly from the highest priority tasks. Good for:
- Distributed painting
- Avoiding patterns
- General purpose use

### Sequential Mode

```yaml
settings:
  draw_mode: "sequential"
```

Paints pixels in order (left-to-right, top-to-bottom). Good for:
- Predictable progress
- Debugging
- Watching the image appear systematically

### Diffusion Mode

```yaml
settings:
  draw_mode: "diffusion"
```

Starts from center and spreads outward. Good for:
- Logos and centered images
- Seeing the core image first
- Artistic effect

## Understanding Priority

Priority determines **which image gets all the tokens**:

```yaml
images:
  - path: "important.png"
    x: 400
    y: 250
    priority: 1  # ALL tokens work on this first
  
  - path: "less-important.png"
    x: 100
    y: 100
    priority: 2  # Tokens only work on this when priority 1 is done
```

**How it works**:
1. Bot builds queue with all pixels that need painting
2. Queue is sorted by priority
3. Tokens always pick from highest priority available
4. When high priority image is complete, tokens automatically cascade to next priority

**Overlapping behavior**:
```
Position (400, 250):
  Image A (priority 1): RED
  Image B (priority 2): BLUE
  
Result: Pixel painted RED (priority 1 wins)
Token will never paint this pixel BLUE
```

## Statistics Interpretation

Example output:

```
========================================
Paintbot Statistics
========================================
Uptime: 120s                    # Bot has been running for 2 minutes
Queue Size: 15234               # 15,234 pixels still need painting
Total Painted: 4567             # 4,567 paint attempts made
Success: 4321 (94.6%)           # 4,321 successful (good rate!)
Failure: 246                    # 246 failed attempts
Cooldown: 123                   # 123 failures due to cooldown
Overall Efficiency: 36.01 px/s  # 36.01 pixels/second (exceeds target!)

Token Statistics:
----------------------------------------
UID 123456:
  Painted: 2345                 # This token made 2,345 attempts
  Success: 2234 (95.3%)         # 2,234 successful (healthy token)
  Efficiency: 18.62 px/s        # 18.62 pixels/second for this token
  Failures: 111                 # 111 failed attempts
  Cooldowns: 67                 # 67 failures were cooldown issues
```

**Good indicators**:
- Success rate > 90%
- Efficiency > 33 px/s per token
- Low failure count
- Cooldown count ≈ failure count (most failures are just timing)

**Bad indicators**:
- Success rate < 80% → Check network or tokens
- Efficiency < 30 px/s → Too many tokens or network issues
- High non-cooldown failures → Token or server problems

## Command Line Usage

```bash
# Use default config.yaml
npm start

# Use custom config file
npm start my-config.yaml

# Use custom config in different directory
npm start /path/to/config.yaml
```

## Image Preparation

### Recommended Format
- PNG format
- RGB or RGBA color space
- Any size (bot handles bounds checking)

### Size Considerations

Board is 1000x600 pixels:
```
(0,0) ──────────────────── (999,0)
  │                            │
  │      Available Space       │
  │       1000 x 600           │
  │                            │
(0,599) ────────────────── (999,599)
```

### Positioning Examples

```yaml
# Top-left corner
x: 0
y: 0

# Centered (for 200x100 image)
x: 400  # (1000 - 200) / 2
y: 250  # (600 - 100) / 2

# Bottom-right corner (for 200x100 image)
x: 800  # 1000 - 200
y: 500  # 600 - 100

# Out of bounds (bot will crop automatically)
x: 900   # Some pixels will be off-screen
y: 550   # Some pixels will be off-screen
```

## Troubleshooting

### Bot connects but doesn't paint

**Check**:
1. Are tokens acquired? Look for "Token acquired for UID..." messages
2. Is queue populated? Check "Queue Size" in statistics
3. Are images loaded? Look for "Loaded image: ..." messages

**Solutions**:
- Verify access keys are correct
- Check image paths are valid
- Ensure images have pixels that differ from board

### Low efficiency

**Causes**:
- Too many tokens for network capacity
- Poor network connection
- Tokens in cooldown

**Solutions**:
- Reduce number of tokens
- Check network latency
- Increase log_interval to reduce console overhead

### Tokens getting deactivated

**Causes**:
- Invalid access keys
- UID doesn't match access key
- Rate limiting

**Solutions**:
- Verify access key and UID pairs
- Ensure not running multiple instances with same keys
- Check not exceeding 256 packets/second

### Image not appearing correctly

**Causes**:
- Wrong coordinates (off-screen)
- Image priority conflict
- Corrupted image file

**Solutions**:
- Verify x, y coordinates are within 0-999, 0-599
- Check priority settings for overlaps
- Test image opens in image viewer

## Performance Tuning

### Maximize Speed

```yaml
# Use many tokens (10+)
accounts:
  - uid: 1
    access_key: "key1"
  # ... add 9 more

# Use random mode for parallelism
settings:
  draw_mode: "random"
  log_interval: 10  # Less frequent logging
```

### Minimize Network Impact

```yaml
# Use fewer tokens (1-3)
accounts:
  - uid: 1
    access_key: "key1"

# Use sequential mode
settings:
  draw_mode: "sequential"
  log_interval: 30  # Very infrequent logging
```

### Balance Speed and Stability

```yaml
# Use 3-5 tokens
accounts:
  - uid: 1
    access_key: "key1"
  - uid: 2
    access_key: "key2"
  - uid: 3
    access_key: "key3"

# Use random mode
settings:
  draw_mode: "random"
  log_interval: 5
```

## Advanced Usage

### Maintaining an Image

After initial draw, bot continues to monitor and fix any pixels that get changed:

```yaml
images:
  - path: "protected-image.png"
    x: 400
    y: 250
    priority: 1

settings:
  draw_mode: "random"
  log_interval: 5
```

Bot will:
1. Draw the image initially
2. Continue monitoring via WebSocket
3. Re-queue any pixels that get changed
4. Maintain image integrity indefinitely

### Multiple Bot Instances

You can run multiple instances with different configs:

```bash
# Terminal 1 - Bot for logo
npm start config-logo.yaml

# Terminal 2 - Bot for banner
npm start config-banner.yaml
```

**Important**: 
- Each instance uses 1 WebSocket connection
- Max 3 connections per IP
- Don't use same tokens across instances

### Graceful Shutdown

Press Ctrl+C to stop:

```
^C
Shutting down gracefully...
Painter stopped
WebSocket closed
```

Bot will:
1. Stop painting
2. Close WebSocket
3. Log final statistics
4. Exit cleanly
