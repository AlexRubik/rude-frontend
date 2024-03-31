// lib/db.ts
import { Pool } from 'pg';
import { AtaRecord } from './types';


const pool = new Pool({
  user: 'postgres.tffrohjlnezcnllivjlo',
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  database: 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: 5432,
});

export async function getAtaRecords(pubkey?: string): Promise<AtaRecord[]> {
    if (pubkey === undefined) {
        return [];
    }
  const { rows } = await pool.query<AtaRecord>('SELECT * FROM atas WHERE pubkey = $1', [pubkey]);
  return rows;
}

// check if pubkey + ata pair exists in db
export async function checkIfAtaRecordExists(pubkey: string, ata: string): Promise<boolean> {
  const { rows } = await pool.query<AtaRecord>('SELECT * FROM atas WHERE pubkey = $1 AND ata = $2', [pubkey, ata]);
  return rows.length > 0;
}

// add pubkey + ata pair to db if it doesn't exist
export async function addAtaRecordToDb(
    pubkey_ata: string,
    pubkey: string,
    ata: string,
    created_at: number | null,
    updated_at: number | null,
    daily_starting_bal: number | null,
    weekly_starting_bal: number | null,
    monthly_starting_bal: number | null,
    decimals: number | null,
    mint_address: string | null,
    mint_name: string | null,
): Promise<void> {
    const queryText = `
        INSERT INTO atas 
            (
                pubkey_ata, 
                pubkey, 
                ata, 
                created_at, 
                updated_at, 
                daily_starting_bal, 
                weekly_starting_bal, 
                monthly_starting_bal, 
                decimals, 
                mint_address, 
                mint_name
            ) 
        VALUES 
            (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            )`;

    const now = Date.now();
    const values: (string | number | null)[] = [
        pubkey_ata,
        pubkey,
        ata,
        created_at ?? now,
        updated_at ?? now,
        daily_starting_bal,
        weekly_starting_bal,
        monthly_starting_bal,
        decimals,
        mint_address,
        mint_name,
    ];

    try {
        // @ts-ignore
        const result = await pool.query(queryText, values);
        console.log(result);
    } catch (err) {
        console.error('Error executing addAtaRecordToDb:', err);
    }
}





// update daily_starting_bal for pubkey + ata pair
export async function updateDailyStartingBal(pubkey: string, ata: string, dailyStartingBal: number): Promise<void> {

    const query = `UPDATE atas SET daily_starting_bal = ${dailyStartingBal} 
    WHERE pubkey = ${pubkey} AND 
    ata = ${ata} AND
    updated_at = ${Date.now()}
    `;
  await pool.query(query);
}

// update weekly_starting_bal for pubkey + ata pair
export async function updateWeeklyStartingBal(pubkey: string, ata: string, weeklyStartingBal: number): Promise<void> {
    const query = `UPDATE atas SET weekly_starting_bal = ${weeklyStartingBal}
    WHERE pubkey = ${pubkey} AND
    ata = ${ata} AND
    updated_at = ${Date.now()}
    `;
    await pool.query(query);
}

// update monthly_starting_bal for pubkey + ata pair
export async function updateMonthlyStartingBal(pubkey: string, ata: string, monthlyStartingBal: number): Promise<void> {
    const query = `UPDATE atas SET monthly_starting_bal = ${monthlyStartingBal}
    WHERE pubkey = ${pubkey} AND
    ata = ${ata} AND
    updated_at = ${Date.now()}
    `;
    await pool.query(query);
}