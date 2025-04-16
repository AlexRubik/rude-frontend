import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as TOML from '@iarna/toml';
import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { IDL as ADRENA_IDL } from './adrena';
import BigNumber from 'bignumber.js';


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

export function nativeToUi(nb: BN, decimals: number): number {
  // stop displaying at hundred thousandth
  return new BigNumber(nb.toString()).shiftedBy(-decimals).toNumber();
}

export async function getAccumulatedRewards() {

  const adrenda_program_id = new PublicKey("13gDzEXCdocbj8iAiqrScGo47NiSuYENGsRqi3SEAwet");

  const lmTokenMint = PublicKey.findProgramAddressSync(
    [Buffer.from("lm_token_mint")],
    adrenda_program_id,
  )[0];

  const stakingPda = PublicKey.findProgramAddressSync(
    [Buffer.from("staking"), lmTokenMint.toBuffer()],
    adrenda_program_id,
  )[0];

  const stakingLmRewardVault = PublicKey.findProgramAddressSync(
    [Buffer.from("staking_reward_token_vault"), stakingPda.toBuffer()],
    adrenda_program_id,
  )[0];

  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');

  const usdcRewardsVaultBal = await connection.getTokenAccountBalance(stakingLmRewardVault);
  // log the pubkey string
  console.log(stakingLmRewardVault.toBase58());

  console.log(usdcRewardsVaultBal.value.uiAmount);
  return usdcRewardsVaultBal.value.uiAmount;

}


// export async function adrenaFetch() {
//   const DEFAULT_PERPS_USER = Keypair.fromSecretKey(
//     Uint8Array.from([
//       130, 82, 70, 109, 220, 141, 128, 34, 238, 5, 80, 156, 116, 150, 24, 45, 33,
//       132, 119, 244, 40, 40, 201, 182, 195, 179, 90, 172, 51, 27, 110, 208, 61,
//       23, 43, 217, 131, 209, 127, 113, 93, 139, 35, 156, 34, 16, 94, 236, 175,
//       232, 174, 79, 209, 223, 86, 131, 148, 188, 126, 217, 19, 248, 236, 107,
//     ]),
//   );

//   const connection = new Connection("https://api.mainnet-beta.solana.com");

//   const readOnlyProvider = new AnchorProvider(
//     connection,
//     new NodeWallet(DEFAULT_PERPS_USER),
//     {
//       commitment: "processed",
//       skipPreflight: true,
//     },
//   );

//   const adrenda_program_id = new PublicKey("13gDzEXCdocbj8iAiqrScGo47NiSuYENGsRqi3SEAwet");

//   const program = new Program(ADRENA_IDL, adrenda_program_id, readOnlyProvider);

//   const allStakingInit = await program.account.userStaking.all();

//   const allStaking = allStakingInit.map((staking) => ({
//     pubkey: staking.publicKey,
//     ...staking.account,
//   }));

//   const allStakingStats: AllStakingStats = {
//     byDurationByAmount: {
//         ADX: {
//             liquid: 0,
//             totalLocked: 0,
//             locked: {},
//         },
//         ALP: {
//             liquid: 0,
//             totalLocked: 0,
//             locked: {},
//         },
//     },
//     byRemainingTime: {
//         ADX: [],
//         ALP: [],
//     },
// };

// allStaking.forEach((staking: UserStakingExtended) => {
//     const stakingType = staking.stakingType === 1 ? 'ADX' : 'ALP';
//     const stakingDecimals = stakingType === 'ADX' ? 6 : 6;

//     // Handle the remaining time stats
//     {
//         staking.lockedStakes.forEach((lockedStake) => {
//             // Ignore non-locked stakes
//             if (lockedStake.endTime.isZero()) {
//                 return;
//             }

//             allStakingStats.byRemainingTime[stakingType].push({
//                 stake: staking.pubkey.toBase58(),
//                 endTime: lockedStake.endTime.toNumber(),
//                 tokenAmount: nativeToUi(lockedStake.amount, stakingDecimals),
//             });
//         });
//     }

//     // Handle the duration and amount stats
//     {
//         allStakingStats.byDurationByAmount[stakingType].liquid += nativeToUi(staking.liquidStake.amount, stakingDecimals);

//         staking.lockedStakes.forEach((lockedStake) => {
//             // Ignore non-locked stakes
//             if (lockedStake.endTime.isZero() || lockedStake.endTime.toNumber() < Date.now() / 1000) {
//                 return;
//             }

//             const lockedDurationInDays = lockedStake.lockDuration.toNumber() / 3600 / 24;

//             allStakingStats.byDurationByAmount[stakingType].locked[lockedDurationInDays] = allStakingStats.byDurationByAmount[stakingType].locked[lockedDurationInDays] || {
//                 total: 0,
//             };
//             allStakingStats.byDurationByAmount[stakingType].locked[lockedDurationInDays][staking.pubkey.toBase58()] = allStakingStats.byDurationByAmount[stakingType].locked[lockedDurationInDays][staking.pubkey.toBase58()] || 0;
//             const amount = nativeToUi(lockedStake.amount, stakingDecimals);

//             allStakingStats.byDurationByAmount[stakingType].locked[lockedDurationInDays].total += amount;
//             allStakingStats.byDurationByAmount[stakingType].totalLocked += amount;
//             allStakingStats.byDurationByAmount[stakingType].locked[lockedDurationInDays][staking.pubkey.toBase58()] += amount;
//         });
//     }
// });

// }



