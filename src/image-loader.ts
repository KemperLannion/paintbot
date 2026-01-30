import sharp from 'sharp';
import { ImageData, ImageConfig, BOARD_WIDTH, BOARD_HEIGHT } from './types';

export class ImageLoader {
  async loadImage(config: ImageConfig): Promise<ImageData> {
    const image = sharp(config.path);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error(`Failed to get image dimensions for ${config.path}`);
    }

    const { width, height, channels } = metadata;
    
    // Get raw pixel data
    const pixels = await image.raw().toBuffer();

    return {
      pixels,
      width,
      height,
      channels: channels || 3,
      offsetX: config.x,
      offsetY: config.y,
      priority: config.priority,
    };
  }

  async loadAllImages(configs: ImageConfig[]): Promise<ImageData[]> {
    const images: ImageData[] = [];
    
    for (const config of configs) {
      try {
        const imageData = await this.loadImage(config);
        images.push(imageData);
        console.log(`Loaded image: ${config.path} (${imageData.width}x${imageData.height}, priority: ${config.priority})`);
      } catch (error) {
        console.error(`Failed to load image ${config.path}:`, error);
        throw error;
      }
    }

    // Sort by priority (lower number = higher priority)
    images.sort((a, b) => a.priority - b.priority);
    
    return images;
  }

  getPixelColor(imageData: ImageData, imageX: number, imageY: number): { r: number; g: number; b: number } | null {
    if (imageX < 0 || imageX >= imageData.width || imageY < 0 || imageY >= imageData.height) {
      return null;
    }

    const offset = (imageY * imageData.width + imageX) * imageData.channels;
    return {
      r: imageData.pixels[offset],
      g: imageData.pixels[offset + 1],
      b: imageData.pixels[offset + 2],
    };
  }
}
