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

export type SanctumApyData = {
  apys: Record<string, number>;
  errs?: Record<string, { message: string | null; code: string }>;
};

export async function fetchSanctumApys(): Promise<SanctumApyData> {
  try {
    const sanctumUrl = await createUrlFromToml();
    const response = await fetch(sanctumUrl);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data: SanctumApyData = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Sanctum APYs:', error);
    throw error;
  }
}

export type Top5ApyResult = {
  averageApy: number;
  protocols: string[];
};

export function calculateTop5Average(apys: Record<string, number>): Top5ApyResult {
  // Convert the record to array of [protocol, apy] pairs
  const apyEntries = Object.entries(apys);
  
  // Sort by APY in descending order
  const sortedApys = apyEntries.sort(([, a], [, b]) => b - a);
  
  // Get top 5 entries
  const top5 = sortedApys.slice(0, 5);
  
  // Calculate average
  const sum = top5.reduce((acc, [, apy]) => acc + apy, 0);
  const average = top5.length > 0 ? sum / top5.length : 0;
  
  return {
    averageApy: roundToFourDecimals(average),
    protocols: top5.map(([protocol]) => protocol)
  };
}

interface LstMeta {
  Categories: string;
  "Feature ID": string;
  "First bullet point": string;
  "Launch Date": string;
  "Main value proposition": string;
  "Mint address": string;
  "Mint logo URL": string;
  "Mint name": string;
  "Mint symbol": string;
  "One-liner": string;
  Program: string;
  "Sanctum Automated": string;
  "Second bullet point": string;
  Status: string;
  "TG group link": string;
  "Third bullet point": string;
  Twitter: string;
  "Vote account": string;
  Website: string;
}

interface LstData {
  apy: number;
  apyPastEpoch: number;
  tvl: number;
  holders: number;
  meta: LstMeta;
}

export interface Lst {
  mint: string;
  tokenProgram: string;
  name: string;
  symbol: string;
  logoUri: string;
  decimals: number;
  solValue: number;
  pool: Record<string, unknown>;
  data: LstData;
}

export interface LstResponse {
  lsts: Lst[];
  page: number;
  total: number;
}

export async function fetchLstData(): Promise<LstResponse> {
  try {
    const response = await fetch('https://lst-indexer-api.sanctum.so/lsts?page=0&sortBy=apy&order=desc&category=&search=&limit=50');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching LST data:', error);
    throw error;
  }
}

