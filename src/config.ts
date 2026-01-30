import * as fs from 'fs';
import * as YAML from 'yaml';
import { Config } from './types';

export function loadConfig(path: string): Config {
  const fileContents = fs.readFileSync(path, 'utf8');
  const config = YAML.parse(fileContents) as Config;
  
  // Validate config
  if (!config.images || config.images.length === 0) {
    throw new Error('No images configured');
  }
  
  if (!config.accounts || config.accounts.length === 0) {
    throw new Error('No accounts configured');
  }
  
  // Set defaults
  if (!config.settings) {
    config.settings = {
      draw_mode: 'random',
      log_interval: 5,
    };
  }
  
  return config;
}
