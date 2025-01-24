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

export interface ProtocolApy {
  protocol_name: string;
  tokens: {
    token_ticker: string;
    avg_24h_apy: number;
    avg_7d_apy: number;
    avg_30d_apy: number;
    latest_apy: number;
    latest_update_time: number;
  }[];
}

export interface ApyResponse {
  protocols: ProtocolApy[];
  lastUpdateTime: number;
}

export async function getProtocolApys() {
  const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);

  const query = `
    WITH latest_time AS (
      SELECT MAX(unix_timestamp) as last_update 
      FROM lending_apys
    )
    SELECT 
      h.protocol_name,
      h.token_ticker,
      (
        SELECT apy
        FROM lending_apys l
        WHERE l.protocol_name = h.protocol_name 
        AND l.token_ticker = h.token_ticker 
        ORDER BY l.unix_timestamp DESC
        LIMIT 1
      ) as latest_apy,
      (
        SELECT unix_timestamp
        FROM lending_apys l
        WHERE l.protocol_name = h.protocol_name 
        AND l.token_ticker = h.token_ticker 
        ORDER BY l.unix_timestamp DESC
        LIMIT 1
      ) as latest_update_time,
      (
        SELECT AVG(apy)
        FROM lending_apys l
        WHERE l.protocol_name = h.protocol_name 
        AND l.token_ticker = h.token_ticker 
        AND l.unix_timestamp >= $1
      ) as avg_24h_apy,
      (
        SELECT AVG(apy)
        FROM lending_apys l
        WHERE l.protocol_name = h.protocol_name 
        AND l.token_ticker = h.token_ticker 
        AND l.unix_timestamp >= $2
      ) as avg_7d_apy,
      (
        SELECT AVG(apy)
        FROM lending_apys l
        WHERE l.protocol_name = h.protocol_name 
        AND l.token_ticker = h.token_ticker 
        AND l.unix_timestamp >= $3
      ) as avg_30d_apy,
      (SELECT last_update FROM latest_time) as last_update_time
    FROM lending_apys h
    WHERE h.unix_timestamp >= $3
    GROUP BY h.protocol_name, h.token_ticker
    ORDER BY h.protocol_name, h.token_ticker
  `;

  try {
    const { rows } = await pool.query(query, [oneDayAgo, sevenDaysAgo, thirtyDaysAgo]);
    
    const protocolMap = new Map<string, ProtocolApy>();
    let lastUpdateTime = 0;
    
    rows.forEach(row => {
      lastUpdateTime = row.last_update_time;
      
      if (!protocolMap.has(row.protocol_name)) {
        protocolMap.set(row.protocol_name, {
          protocol_name: row.protocol_name,
          tokens: []
        });
      }
      
      protocolMap.get(row.protocol_name)?.tokens.push({
        token_ticker: row.token_ticker,
        avg_24h_apy: Number(row.avg_24h_apy),
        avg_7d_apy: Number(row.avg_7d_apy),
        avg_30d_apy: Number(row.avg_30d_apy),
        latest_apy: Number(row.latest_apy),
        latest_update_time: Number(row.latest_update_time)
      });
    });

    return {
      protocols: Array.from(protocolMap.values()),
      lastUpdateTime
    };
  } catch (err) {
    console.error('Error fetching protocol APYs:', err);
    return {
      protocols: [],
      lastUpdateTime: 0
    };
  }
}

export interface LpPosition {
  position_mint_address: string;
  starting_usd_value: number;
  closing_usd_value: number | null;
  pnl_usd: number;
  pnl_percentage: number;
  lower_boundary: number;
  upper_boundary: number;
  entry_price: number;
  closing_price: number | null;
  position_start_time: number;
  position_end_time: number | null;
}

export async function getInactiveLpPositions(pubkey: string): Promise<LpPosition[]> {
  const query = `
    SELECT 
      position_mint_address,
      CAST(starting_usd_value AS FLOAT) as starting_usd_value,
      CAST(closing_usd_value AS FLOAT) as closing_usd_value,
      CAST(COALESCE(closing_usd_value, 0) - starting_usd_value AS FLOAT) as pnl_usd,
      CAST(
        CASE 
          WHEN starting_usd_value > 0 
          THEN ((COALESCE(closing_usd_value, 0) - starting_usd_value) / starting_usd_value) * 100
          ELSE 0 
        END 
      AS FLOAT) as pnl_percentage,
      CAST(lower_boundary AS FLOAT) as lower_boundary,
      CAST(upper_boundary AS FLOAT) as upper_boundary,
      CAST(entry_price AS FLOAT) as entry_price,
      CAST(closing_price AS FLOAT) as closing_price,
      position_start_time,
      position_end_time
    FROM lp_positions
    WHERE pubkey = $1 
    AND is_active = false
    ORDER BY position_start_time DESC
  `;

  try {
    const { rows } = await pool.query<LpPosition>(query, [pubkey]);
    return rows.map(row => ({
      ...row,
      starting_usd_value: Number(row.starting_usd_value),
      closing_usd_value: row.closing_usd_value ? Number(row.closing_usd_value) : null,
      pnl_usd: Number(row.pnl_usd),
      pnl_percentage: Number(row.pnl_percentage),
      lower_boundary: Number(row.lower_boundary),
      upper_boundary: Number(row.upper_boundary),
      entry_price: Number(row.entry_price),
      closing_price: row.closing_price ? Number(row.closing_price) : null,
      position_start_time: Number(row.position_start_time),
      position_end_time: row.position_end_time ? Number(row.position_end_time) : null
    }));
  } catch (err) {
    console.error('Error fetching inactive LP positions:', err);
    throw err;
  }
}

export async function getUniquePubkeysWithLpPositions(): Promise<string[]> {
  const query = `
    SELECT DISTINCT pubkey 
    FROM lp_positions 
    WHERE pubkey IS NOT NULL 
    ORDER BY pubkey
  `;

  try {
    const { rows } = await pool.query<{ pubkey: string }>(query);
    return rows.map(row => row.pubkey);
  } catch (err) {
    console.error('Error fetching unique pubkeys:', err);
    throw err;
  }
}