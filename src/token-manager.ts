import { Account, TokenInfo, COOLDOWN_MS } from './types';

export class TokenManager {
  private tokens: Map<number, TokenInfo> = new Map();

  async acquireTokens(accounts: Account[]): Promise<void> {
    console.log(`Acquiring tokens for ${accounts.length} accounts...`);
    
    for (const account of accounts) {
      try {
        const token = await this.getToken(account.uid, account.access_key);
        this.tokens.set(account.uid, {
          uid: account.uid,
          token,
          lastPaintTime: 0,
          cooldown: COOLDOWN_MS,
          active: true,
          errorCount: 0,
        });
        console.log(`Token acquired for UID ${account.uid}`);
      } catch (error) {
        console.error(`Failed to acquire token for UID ${account.uid}:`, error);
      }
    }
    
    if (this.tokens.size === 0) {
      throw new Error('Failed to acquire any tokens');
    }
    
    console.log(`Successfully acquired ${this.tokens.size} tokens`);
  }

  private async getToken(uid: number, accessKey: string): Promise<string> {
    const response = await fetch('https://paintboard.luogu.me/api/auth/gettoken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        access_key: accessKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as { token?: string; errorType?: string };
    
    if (data.errorType) {
      throw new Error(`Token acquisition failed: ${data.errorType}`);
    }

    if (!data.token) {
      throw new Error('No token in response');
    }

    return data.token;
  }

  getAvailableToken(): TokenInfo | null {
    const now = Date.now();
    
    for (const token of this.tokens.values()) {
      if (!token.active) continue;
      
      const timeSinceLastPaint = now - token.lastPaintTime;
      if (timeSinceLastPaint >= token.cooldown) {
        return token;
      }
    }
    
    return null;
  }

  markTokenUsed(uid: number): void {
    const token = this.tokens.get(uid);
    if (token) {
      token.lastPaintTime = Date.now();
    }
  }

  markTokenError(uid: number): void {
    const token = this.tokens.get(uid);
    if (token) {
      token.errorCount++;
      if (token.errorCount >= 5) {
        token.active = false;
        console.error(`Token ${uid} deactivated due to too many errors`);
      }
    }
  }

  markTokenInvalid(uid: number): void {
    const token = this.tokens.get(uid);
    if (token) {
      token.active = false;
      console.error(`Token ${uid} marked as invalid`);
    }
  }

  getActiveTokenCount(): number {
    return Array.from(this.tokens.values()).filter(t => t.active).length;
  }

  getAllTokens(): TokenInfo[] {
    return Array.from(this.tokens.values());
  }
}
