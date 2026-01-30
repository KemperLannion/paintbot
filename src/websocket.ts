import WebSocket from 'ws';
import { OPCODE, STATUS_CODE } from './types';
import { Board } from './board';

export class WebSocketHandler {
  private ws: WebSocket | null = null;
  private board: Board;
  private chunks: Uint8Array[] = [];
  private totalSize = 0;
  private paintCallbacks = new Map<number, (success: boolean, statusCode: number) => void>();
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(board: Board) {
    this.board = board;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = 'wss://paintboard.luogu.me/api/paintboard/ws';
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.on('open', () => {
        console.log('WebSocket connection established');
        this.connected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.ws.on('message', (data: ArrayBuffer) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error.message);
      });

      this.ws.on('close', (code, reason) => {
        console.log(`WebSocket closed (${code}: ${reason.toString()})`);
        this.connected = false;
        this.handleDisconnect();
      });

      // Timeout if connection takes too long
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  }

  private handleMessage(buffer: ArrayBuffer): void {
    const dataView = new DataView(buffer);
    let offset = 0;

    while (offset < buffer.byteLength) {
      const opcode = dataView.getUint8(offset);
      offset += 1;

      switch (opcode) {
        case OPCODE.HEARTBEAT_PING:
          // Respond immediately with pong
          this.sendHeartbeat();
          break;

        case OPCODE.PAINT_MESSAGE:
          // Someone else painted
          const x = dataView.getUint16(offset, true);
          const y = dataView.getUint16(offset + 2, true);
          const r = dataView.getUint8(offset + 4);
          const g = dataView.getUint8(offset + 5);
          const b = dataView.getUint8(offset + 6);
          offset += 7;
          
          // Update board state
          this.board.setPixel(x, y, { r, g, b });
          break;

        case OPCODE.PAINT_RESULT:
          const paintId = dataView.getUint32(offset, true);
          const statusCode = dataView.getUint8(offset + 4);
          offset += 5;
          
          // Call the callback if registered
          const callback = this.paintCallbacks.get(paintId);
          if (callback) {
            callback(statusCode === STATUS_CODE.SUCCESS, statusCode);
            this.paintCallbacks.delete(paintId);
          }
          break;

        default:
          console.log(`Unknown opcode: 0x${opcode.toString(16)}`);
          return; // Stop processing to avoid corruption
      }
    }
  }

  private sendHeartbeat(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(new Uint8Array([OPCODE.HEARTBEAT_PONG]));
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect().catch(err => {
          console.error('Reconnection failed:', err);
        });
      }, 5000);
    }
  }

  appendData(paintData: Uint8Array): void {
    this.chunks.push(paintData);
    this.totalSize += paintData.length;
  }

  flushData(): void {
    if (this.chunks.length === 0 || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const result = new Uint8Array(this.totalSize);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    this.ws.send(result);
    this.totalSize = 0;
    this.chunks = [];
  }

  createPaintPacket(
    uid: number,
    token: string,
    x: number,
    y: number,
    r: number,
    g: number,
    b: number,
    paintId: number,
    callback?: (success: boolean, statusCode: number) => void
  ): Uint8Array {
    // Register callback if provided
    if (callback) {
      this.paintCallbacks.set(paintId, callback);
    }

    // Convert token UUID string to bytes
    const tokenBytes = new Uint8Array(16);
    const tokenHex = token.replace(/-/g, '');
    for (let i = 0; i < 16; i++) {
      tokenBytes[i] = parseInt(tokenHex.substr(i * 2, 2), 16);
    }

    // Create paint packet (31 bytes total)
    const packet = new Uint8Array(31);
    const view = new DataView(packet.buffer);
    
    let offset = 0;
    view.setUint8(offset++, OPCODE.PAINT_OPERATION); // opcode
    view.setUint16(offset, x, true); offset += 2;     // x coordinate
    view.setUint16(offset, y, true); offset += 2;     // y coordinate
    view.setUint8(offset++, r);                       // R
    view.setUint8(offset++, g);                       // G
    view.setUint8(offset++, b);                       // B
    
    // UID as 3 bytes (Uint24)
    view.setUint8(offset++, uid & 0xff);
    view.setUint8(offset++, (uid >> 8) & 0xff);
    view.setUint8(offset++, (uid >> 16) & 0xff);
    
    // Token UUID (16 bytes)
    packet.set(tokenBytes, offset);
    offset += 16;
    
    // Paint ID (4 bytes)
    view.setUint32(offset, paintId, true);

    return packet;
  }

  isConnected(): boolean {
    return this.connected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}
