import { PaintTask, ImageData, BOARD_WIDTH, BOARD_HEIGHT } from './types';
import { Board } from './board';
import { ImageLoader } from './image-loader';

export class PixelQueue {
  private queue: PaintTask[] = [];
  private images: ImageData[] = [];
  private board: Board;
  private imageLoader: ImageLoader;
  private pixelSet = new Set<string>(); // Track pixels in queue to avoid duplicates

  constructor(board: Board, imageLoader: ImageLoader) {
    this.board = board;
    this.imageLoader = imageLoader;
  }

  setImages(images: ImageData[]): void {
    this.images = images;
    this.rebuildQueue();
  }

  rebuildQueue(): void {
    this.queue = [];
    this.pixelSet.clear();
    
    // Process images in priority order (already sorted)
    for (const image of this.images) {
      this.addImagePixels(image);
    }
    
    console.log(`Queue rebuilt: ${this.queue.length} pixels need painting`);
  }

  private addImagePixels(image: ImageData): void {
    // Create a priority map to track which pixels should be painted at each position
    // Higher priority (lower number) wins
    const priorityMap = new Map<string, { task: PaintTask; priority: number }>();

    // First pass: determine which pixels from this image should be added
    for (let imgY = 0; imgY < image.height; imgY++) {
      for (let imgX = 0; imgX < image.width; imgX++) {
        const boardX = image.offsetX + imgX;
        const boardY = image.offsetY + imgY;

        // Skip if out of bounds
        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY < 0 || boardY >= BOARD_HEIGHT) {
          continue;
        }

        const targetColor = this.imageLoader.getPixelColor(image, imgX, imgY);
        if (!targetColor) continue;

        const currentColor = this.board.getPixel(boardX, boardY);
        
        // Only queue if color doesn't match
        if (!this.board.colorsMatch(currentColor, targetColor)) {
          const key = `${boardX},${boardY}`;
          const existing = priorityMap.get(key);
          
          // Only add if this is higher priority or not yet in map
          if (!existing || image.priority < existing.priority) {
            priorityMap.set(key, {
              task: {
                x: boardX,
                y: boardY,
                r: targetColor.r,
                g: targetColor.g,
                b: targetColor.b,
                priority: image.priority,
              },
              priority: image.priority,
            });
          }
        }
      }
    }

    // Second pass: add to queue if not already there or if higher priority
    for (const [key, { task }] of priorityMap) {
      if (!this.pixelSet.has(key)) {
        this.queue.push(task);
        this.pixelSet.add(key);
      }
    }
  }

  getNextTask(drawMode: 'random' | 'diffusion' | 'sequential'): PaintTask | null {
    if (this.queue.length === 0) {
      return null;
    }

    // Always prioritize by priority first, then apply draw mode
    // Sort by priority (lower number = higher priority)
    this.queue.sort((a, b) => a.priority - b.priority);

    let index = 0;
    
    if (drawMode === 'random') {
      // Pick randomly from highest priority tasks
      const highestPriority = this.queue[0].priority;
      const highPriorityTasks = this.queue.filter(t => t.priority === highestPriority);
      if (highPriorityTasks.length > 0) {
        const randomTask = highPriorityTasks[Math.floor(Math.random() * highPriorityTasks.length)];
        index = this.queue.indexOf(randomTask);
      }
    } else if (drawMode === 'diffusion') {
      // For diffusion, pick from center of image
      // This is simplified - just pick from highest priority
      index = 0;
    } else {
      // Sequential: just take first (already sorted by priority)
      index = 0;
    }

    const task = this.queue[index];
    this.queue.splice(index, 1);
    const key = `${task.x},${task.y}`;
    this.pixelSet.delete(key);
    
    return task;
  }

  addTask(task: PaintTask): void {
    const key = `${task.x},${task.y}`;
    if (!this.pixelSet.has(key)) {
      this.queue.push(task);
      this.pixelSet.add(key);
    }
  }

  removeTask(x: number, y: number): void {
    const key = `${x},${y}`;
    this.pixelSet.delete(key);
    this.queue = this.queue.filter(t => !(t.x === x && t.y === y));
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  // Verify and update queue based on current board state
  verifyQueue(): void {
    const newQueue: PaintTask[] = [];
    
    for (const task of this.queue) {
      const currentColor = this.board.getPixel(task.x, task.y);
      const targetColor = { r: task.r, g: task.g, b: task.b };
      
      if (!this.board.colorsMatch(currentColor, targetColor)) {
        newQueue.push(task);
      } else {
        const key = `${task.x},${task.y}`;
        this.pixelSet.delete(key);
      }
    }
    
    this.queue = newQueue;
  }
}
