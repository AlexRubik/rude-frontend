import { Connection, PublicKey } from '@solana/web3.js';
import * as TOML from '@iarna/toml';

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

interface Pool {
  program: string;
  pool: string;
  validator_list: string;
}

interface SanctumLst {
  name: string;
  symbol: string;
  mint: string;
  decimals: number;
  token_program: string;
  logo_uri: string;
  pool: Pool;
}

interface TomlData {
  sanctum_lst_list: SanctumLst[];
}

export async function createUrlFromToml() {
  // Fetch the TOML file from the URL
  const url = 'https://raw.githubusercontent.com/igneous-labs/sanctum-lst-list/refs/heads/master/sanctum-lst-list.toml';
  const response = await fetch(url);
  const tomlText = await response.text();

  // Parse the TOML file
  // ts ignore here

  // @ts-ignore
  const data: TomlData = TOML.parse(tomlText) as TomlData;

  // Base API URL
  const baseUrl = 'https://sanctum-extra-api.ngrok.dev/v1/apy/latest';

  // Construct the URL with multiple lst parameters
  const lstParams = data.sanctum_lst_list.map(lst => `lst=${lst.mint}`).join('&');
  const fullUrl = `${baseUrl}?${lstParams}`;

  console.log('Generated URL:', fullUrl);
  return fullUrl;
}