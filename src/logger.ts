import { Stats, TokenStats } from './types';

export class Logger {
  private stats: Stats = {
    totalPainted: 0,
    successCount: 0,
    failureCount: 0,
    cooldownCount: 0,
    queueSize: 0,
    efficiency: 0,
    tokenStats: new Map(),
  };
  
  private startTime: number = Date.now();
  private lastLogTime: number = Date.now();
  private intervalId: NodeJS.Timeout | null = null;

  start(intervalSeconds: number): void {
    this.startTime = Date.now();
    this.lastLogTime = Date.now();
    
    this.intervalId = setInterval(() => {
      this.logStats();
    }, intervalSeconds * 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  recordPaintAttempt(uid: number, success: boolean, statusCode: number): void {
    this.stats.totalPainted++;
    
    if (success) {
      this.stats.successCount++;
    } else {
      this.stats.failureCount++;
      if (statusCode === 0xee) { // COOLDOWN
        this.stats.cooldownCount++;
      }
    }

    // Update per-token stats
    let tokenStat = this.stats.tokenStats.get(uid);
    if (!tokenStat) {
      tokenStat = {
        uid,
        painted: 0,
        success: 0,
        failure: 0,
        cooldown: 0,
        efficiency: 0,
      };
      this.stats.tokenStats.set(uid, tokenStat);
    }

    tokenStat.painted++;
    if (success) {
      tokenStat.success++;
    } else {
      tokenStat.failure++;
      if (statusCode === 0xee) {
        tokenStat.cooldown++;
      }
    }
  }

  updateQueueSize(size: number): void {
    this.stats.queueSize = size;
  }

  private logStats(): void {
    const now = Date.now();
    const totalElapsed = (now - this.startTime) / 1000; // seconds
    const periodElapsed = (now - this.lastLogTime) / 1000;
    
    // Calculate overall efficiency
    this.stats.efficiency = this.stats.successCount / totalElapsed;
    
    console.log('\n========================================');
    console.log('Paintbot Statistics');
    console.log('========================================');
    console.log(`Uptime: ${Math.floor(totalElapsed)}s`);
    console.log(`Queue Size: ${this.stats.queueSize}`);
    console.log(`Total Painted: ${this.stats.totalPainted}`);
    console.log(`Success: ${this.stats.successCount} (${((this.stats.successCount / this.stats.totalPainted) * 100 || 0).toFixed(1)}%)`);
    console.log(`Failure: ${this.stats.failureCount}`);
    console.log(`Cooldown: ${this.stats.cooldownCount}`);
    console.log(`Overall Efficiency: ${this.stats.efficiency.toFixed(2)} px/s`);
    
    // Per-token stats
    console.log('\nToken Statistics:');
    console.log('----------------------------------------');
    
    for (const tokenStat of this.stats.tokenStats.values()) {
      const tokenEfficiency = tokenStat.success / totalElapsed;
      tokenStat.efficiency = tokenEfficiency;
      
      const successRate = (tokenStat.success / tokenStat.painted * 100) || 0;
      console.log(`UID ${tokenStat.uid}:`);
      console.log(`  Painted: ${tokenStat.painted} | Success: ${tokenStat.success} (${successRate.toFixed(1)}%)`);
      console.log(`  Efficiency: ${tokenEfficiency.toFixed(2)} px/s`);
      console.log(`  Failures: ${tokenStat.failure} | Cooldowns: ${tokenStat.cooldown}`);
    }
    
    console.log('========================================\n');
    
    this.lastLogTime = now;
  }

  getStats(): Stats {
    return { ...this.stats };
  }
}
