import { BOARD_WIDTH, BOARD_HEIGHT, RGB } from './types';

export class Board {
  private state: Uint8Array;

  constructor() {
    // RGB data: 600 height x 1000 width x 3 channels
    this.state = new Uint8Array(BOARD_HEIGHT * BOARD_WIDTH * 3);
  }

  async fetchInitialState(): Promise<void> {
    try {
      const response = await fetch('https://paintboard.luogu.me/api/paintboard/getboard');
      if (!response.ok) {
        throw new Error(`Failed to fetch board: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      this.state = new Uint8Array(arrayBuffer);
      console.log('Board state fetched successfully');
    } catch (error) {
      console.error('Error fetching board state:', error);
      throw error;
    }
  }

  getPixel(x: number, y: number): RGB {
    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) {
      throw new Error(`Pixel out of bounds: (${x}, ${y})`);
    }
    const offset = (y * BOARD_WIDTH + x) * 3;
    return {
      r: this.state[offset],
      g: this.state[offset + 1],
      b: this.state[offset + 2],
    };
  }

  setPixel(x: number, y: number, color: RGB): void {
    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) {
      return; // Silently ignore out of bounds
    }
    const offset = (y * BOARD_WIDTH + x) * 3;
    this.state[offset] = color.r;
    this.state[offset + 1] = color.g;
    this.state[offset + 2] = color.b;
  }

  colorsMatch(c1: RGB, c2: RGB): boolean {
    return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b;
  }
}
