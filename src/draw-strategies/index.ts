export type DrawMode = 'random' | 'diffusion' | 'sequential';

export interface DrawStrategy {
  name: DrawMode;
  selectPixel(pixels: any[]): any;
}
