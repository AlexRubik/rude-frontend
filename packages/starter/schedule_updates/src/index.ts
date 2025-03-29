require('dotenv').config();
import { Pool } from 'pg';
import { Connection, PublicKey } from '@solana/web3.js'


export interface AtaRecord {
    pubkey_ata: string;
    pubkey: string;
    ata: string;
    created_at: number | null;
    updated_at: number | null;
    daily_starting_bal: number | null;
    weekly_starting_bal: number | null;
    monthly_starting_bal: number | null;
    decimals: number | null;
    mint_address: string | null;
    mint_name: string | null;
    current_bal?: number | null;
    difference?: number | null;

}

const pool = new Pool({
  user: 'postgres.tffrohjlnezcnllivjlo',
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  database: 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: 5432,
});

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');


export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  

  export async function getAllAtaRecords(): Promise<AtaRecord[]> {

  const { rows } = await pool.query<AtaRecord>('SELECT pubkey, ata FROM atas');
  console.log(rows);
  return rows;
}

export async function updateAllDailyStartingBals(): Promise<void> {

    const allAtaRecords = await getAllAtaRecords();

    for (const record of allAtaRecords) {

    console.log(record.ata);

            const ataPk = new PublicKey(record.ata);
            const tokenObj = await connection.getTokenAccountBalance(ataPk, 'confirmed');
            const tokenBal = tokenObj?.value.uiAmount;
            await delay(700);


    const query = `UPDATE atas SET daily_starting_bal = ${tokenBal}, updated_at = ${Date.now()}
    WHERE pubkey = '${record.pubkey}' AND 
    ata = '${record.ata}'
    
    `;
  await pool.query(query);
    }
}

async function main() {
    await updateAllDailyStartingBals();
}
main()