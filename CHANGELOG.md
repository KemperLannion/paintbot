# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-30

### Added
- Initial release of Paintbot for LGS Paintboard 2026
- Multi-token management with automatic token acquisition
- Priority-based image system for multiple overlapping images
- Three drawing modes: random, diffusion, and sequential
- Real-time board state synchronization via WebSocket
- Efficient pixel queue with duplicate prevention
- Comprehensive logging and statistics system
- Per-token efficiency tracking (target: 33+ px/s)
- Automatic reconnection on WebSocket disconnect
- Batch packet sending for optimal network performance
- Smart queue rebuilding to maintain accuracy over time
- Configuration via YAML file
- Support for PNG images with Sharp library
- Detailed technical documentation
- Usage examples and troubleshooting guide
- Graceful shutdown handling

### Features
- **Board State Management**: 1.8MB efficient Uint8Array storage
- **Token Management**: Automatic cooldown tracking (25ms per token)
- **WebSocket Protocol**: Full sticky packet support with heartbeat handling
- **Priority System**: Prevents token conflicts on overlapping images
- **Performance**: No slowdown over time, maintains 33+ px/s per token
- **Error Handling**: Automatic token deactivation after 5 errors
- **Monitoring**: Real-time statistics every N seconds (configurable)

### Technical Details
- TypeScript/Node.js implementation
- WebSocket connection with automatic reconnection
- Batch sending every 20ms (50 Hz)
- Little-endian byte order for all numbers
- Support for up to 256 packets/second per connection
- Priority-based pixel queue with O(1) duplicate detection
- Efficient color comparison and board updates
- Periodic queue verification (every 30 seconds)

### Documentation
- README.md: User guide and quick start
- TECHNICAL.md: Architecture and implementation details
- EXAMPLES.md: Configuration examples and usage patterns
- CONTRIBUTING.md: Development guide
- LICENSE: MIT License

[1.0.0]: https://github.com/KemperLannion/paintbot/releases/tag/v1.0.0
