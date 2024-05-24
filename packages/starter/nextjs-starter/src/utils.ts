import { Connection, PublicKey } from '@solana/web3.js';

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  

  export function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('default', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Use hour12: true if you want 12-hour format instead
    }).format(date);
}

export function getUTCTime(): string {
  const now = new Date();
  return now.getUTCHours().toString().padStart(2, '0') + ':' + 
         now.getUTCMinutes().toString().padStart(2, '0');
}

export async function getSolBalance(connection: Connection, pubkey: string | PublicKey): Promise<number> {
  if (typeof pubkey === 'string') {
      pubkey = new PublicKey(pubkey);
  }
  await delay(3000);
  const balance = await connection.getBalance(pubkey);
  
  return balance / 10 ** 9;
   
}

// function that takes a number and rounds it to 4 decimal places
export function roundToFourDecimals(num: number): number {
  return Math.round(num * 10000) / 10000;
}