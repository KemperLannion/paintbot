# Contributing to Paintbot

Thank you for your interest in contributing to Paintbot!

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/paintbot.git
   cd paintbot
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## Project Structure

See [TECHNICAL.md](TECHNICAL.md) for detailed architecture documentation.

```
├── src/                      # TypeScript source files
│   ├── index.ts             # Main entry point
│   ├── types.ts             # Type definitions
│   ├── config.ts            # Configuration loader
│   ├── board.ts             # Board state management
│   ├── image-loader.ts      # Image loading
│   ├── token-manager.ts     # Token management
│   ├── websocket.ts         # WebSocket handler
│   ├── pixel-queue.ts       # Priority queue
│   ├── painter.ts           # Main painting logic
│   ├── logger.ts            # Statistics logging
│   └── draw-strategies/     # Drawing modes
├── dist/                     # Compiled JavaScript (generated)
├── config.example.yaml       # Example configuration
├── README.md                # User documentation
├── TECHNICAL.md             # Technical documentation
├── EXAMPLES.md              # Usage examples
└── package.json             # Dependencies and scripts
```

## Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the `src/` directory

3. Build and test:
   ```bash
   npm run build
   ```

4. Commit your changes:
   ```bash
   git commit -am "Description of changes"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request

## Code Style

- Use TypeScript strict mode
- Follow existing code formatting
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Use meaningful variable names

## Testing

Currently, the project relies on manual testing:

1. Create a test configuration
2. Run the bot: `npm start test-config.yaml`
3. Verify functionality

Future: Add automated tests for core components.

## Areas for Contribution

### High Priority
- [ ] Automated testing suite
- [ ] Better error recovery
- [ ] Token refresh mechanism
- [ ] Performance profiling

### Medium Priority
- [ ] Multiple WebSocket connections
- [ ] Enhanced diffusion algorithm
- [ ] Edge detection for faster painting
- [ ] Configuration validation

### Low Priority
- [ ] Web UI for monitoring
- [ ] Database persistence
- [ ] Docker support
- [ ] CI/CD pipeline

## Pull Request Process

1. Update documentation if needed
2. Ensure code builds without errors
3. Test your changes manually
4. Update CHANGELOG.md (if exists)
5. Submit PR with clear description

## Bug Reports

When reporting bugs, include:
- Node.js version
- Operating system
- Full error message
- Configuration (sanitized)
- Steps to reproduce

## Feature Requests

When requesting features:
- Describe the use case
- Explain expected behavior
- Consider performance impact
- Suggest implementation approach

## Questions?

Open an issue for questions or discussions.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).
