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
  id: number;
  position_mint_address: string;
  pubkey: string | null;
  pool_address: string;
  token_a_mint: string | null;
  token_b_mint: string | null;
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
  is_active: boolean | null;
  range_deviation_perc_as_decimal: number;
  starting_token_a_amount: number;
  starting_token_b_amount: number;
  ending_token_a_amount: number | null;
  ending_token_b_amount: number | null;
  session_id: string;
  session_start_time: number;
  session_end_time: number | null;
  session_start_token_a_balance_usd_value: number | null;
  session_start_token_b_balance_usd_value: number | null;
  session_end_token_a_balance_usd_value: number | null;
  session_end_token_b_balance_usd_value: number | null;
  strategy: number | null;
  take_profit_threshold: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export async function getInactiveLpPositions(pubkey: string): Promise<LpPosition[]> {
  const query = `
    SELECT 
      id,
      position_mint_address,
      pool_address,
      token_a_mint,
      token_b_mint,
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
      position_end_time,
      is_active,
      CAST(range_deviation_perc_as_decimal AS FLOAT) as range_deviation_perc_as_decimal,
      CAST(starting_token_a_amount AS FLOAT) as starting_token_a_amount,
      CAST(starting_token_b_amount AS FLOAT) as starting_token_b_amount,
      CAST(ending_token_a_amount AS FLOAT) as ending_token_a_amount,
      CAST(ending_token_b_amount AS FLOAT) as ending_token_b_amount,
      session_id,
      session_start_time,
      session_end_time,
      CAST(session_start_token_a_balance_usd_value AS FLOAT) as session_start_token_a_balance_usd_value,
      CAST(session_start_token_b_balance_usd_value AS FLOAT) as session_start_token_b_balance_usd_value,
      CAST(session_end_token_a_balance_usd_value AS FLOAT) as session_end_token_a_balance_usd_value,
      CAST(session_end_token_b_balance_usd_value AS FLOAT) as session_end_token_b_balance_usd_value,
      strategy,
      CAST(take_profit_threshold AS FLOAT) as take_profit_threshold,
      created_at,
      updated_at
    FROM lp_positions
    WHERE pubkey = $1 
    AND is_active = false
    ORDER BY position_start_time DESC
  `;

  try {
    const { rows } = await pool.query<LpPosition>(query, [pubkey]);
    return rows.map(row => ({
      ...row,
      id: Number(row.id),
      starting_usd_value: Number(row.starting_usd_value),
      closing_usd_value: row.closing_usd_value ? Number(row.closing_usd_value) : null,
      pnl_usd: Number(row.pnl_usd),
      pnl_percentage: Number(row.pnl_percentage),
      lower_boundary: Number(row.lower_boundary),
      upper_boundary: Number(row.upper_boundary),
      entry_price: Number(row.entry_price),
      closing_price: row.closing_price ? Number(row.closing_price) : null,
      position_start_time: Number(row.position_start_time),
      position_end_time: row.position_end_time ? Number(row.position_end_time) : null,
      range_deviation_perc_as_decimal: Number(row.range_deviation_perc_as_decimal),
      starting_token_a_amount: Number(row.starting_token_a_amount),
      starting_token_b_amount: Number(row.starting_token_b_amount),
      ending_token_a_amount: row.ending_token_a_amount ? Number(row.ending_token_a_amount) : null,
      ending_token_b_amount: row.ending_token_b_amount ? Number(row.ending_token_b_amount) : null,
      session_start_time: Number(row.session_start_time),
      session_end_time: row.session_end_time ? Number(row.session_end_time) : null,
      session_start_token_a_balance_usd_value: row.session_start_token_a_balance_usd_value ? Number(row.session_start_token_a_balance_usd_value) : null,
      session_start_token_b_balance_usd_value: row.session_start_token_b_balance_usd_value ? Number(row.session_start_token_b_balance_usd_value) : null,
      session_end_token_a_balance_usd_value: row.session_end_token_a_balance_usd_value ? Number(row.session_end_token_a_balance_usd_value) : null,
      session_end_token_b_balance_usd_value: row.session_end_token_b_balance_usd_value ? Number(row.session_end_token_b_balance_usd_value) : null,
      strategy: row.strategy ? Number(row.strategy) : null,
      take_profit_threshold: row.take_profit_threshold ? Number(row.take_profit_threshold) : null
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

export interface PerpPosition {
  id: number;
  position_mint_address: string;
  token: string;
  size: number;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  usdc_collateral_amount: number;
  position_start_time: number;
  position_end_time: number | null;
  drift_usdc_balance_at_start: number | null;
  drift_usdc_balance_at_end: number | null;
  is_active: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export async function getInactivePerpPositions(pubkey: string): Promise<PerpPosition[]> {
  const query = `
    SELECT 
      id,
      position_mint_address,
      token,
      CAST(size AS FLOAT) as size,
      CAST(entry_price AS FLOAT) as entry_price,
      CAST(exit_price AS FLOAT) as exit_price,
      CAST(pnl AS FLOAT) as pnl,
      CAST(usdc_collateral_amount AS FLOAT) as usdc_collateral_amount,
      position_start_time,
      position_end_time,
      CAST(drift_usdc_balance_at_start AS FLOAT) as drift_usdc_balance_at_start,
      CAST(drift_usdc_balance_at_end AS FLOAT) as drift_usdc_balance_at_end,
      is_active,
      created_at,
      updated_at
    FROM perp_positions
    WHERE position_mint_address = $1 
    AND is_active = false
    ORDER BY position_start_time DESC
  `;

  try {
    const { rows } = await pool.query<PerpPosition>(query, [pubkey]);
    return rows.map(row => ({
      ...row,
      id: Number(row.id),
      size: Number(row.size),
      entry_price: Number(row.entry_price),
      exit_price: row.exit_price ? Number(row.exit_price) : null,
      pnl: row.pnl ? Number(row.pnl) : null,
      usdc_collateral_amount: Number(row.usdc_collateral_amount),
      position_start_time: Number(row.position_start_time),
      position_end_time: row.position_end_time ? Number(row.position_end_time) : null,
      drift_usdc_balance_at_start: row.drift_usdc_balance_at_start ? Number(row.drift_usdc_balance_at_start) : null,
      drift_usdc_balance_at_end: row.drift_usdc_balance_at_end ? Number(row.drift_usdc_balance_at_end) : null
    }));
  } catch (err) {
    console.error('Error fetching inactive perp positions:', err);
    throw err;
  }
}

export interface JoinedPosition {
  // LP Position fields
  lp_id: number;
  lp_position_mint_address: string;
  lp_pubkey: string | null;
  lp_pool_address: string;
  lp_token_a_mint: string | null;
  lp_token_b_mint: string | null;
  lp_starting_usd_value: number;
  lp_closing_usd_value: number | null;
  lp_pnl_usd: number;
  lp_pnl_percentage: number;
  lp_lower_boundary: number;
  lp_upper_boundary: number;
  lp_entry_price: number;
  lp_closing_price: number | null;
  lp_position_start_time: number;
  lp_position_end_time: number | null;
  lp_is_active: boolean | null;
  lp_range_deviation_perc_as_decimal: number;
  lp_starting_token_a_amount: number;
  lp_starting_token_b_amount: number;
  lp_ending_token_a_amount: number | null;
  lp_ending_token_b_amount: number | null;
  lp_session_id: string;
  lp_session_start_time: number;
  lp_session_end_time: number | null;
  lp_session_start_token_a_balance_usd_value: number | null;
  lp_session_start_token_b_balance_usd_value: number | null;
  lp_session_end_token_a_balance_usd_value: number | null;
  lp_session_end_token_b_balance_usd_value: number | null;
  lp_strategy: number | null;
  lp_take_profit_threshold: number | null;
  lp_created_at: Date | null;
  lp_updated_at: Date | null;
  
  // Perp Position fields
  perp_id: number;
  perp_position_mint_address: string;
  perp_token: string;
  perp_size: number;
  perp_entry_price: number;
  perp_exit_price: number | null;
  perp_pnl: number | null;
  perp_usdc_collateral_amount: number;
  perp_position_start_time: number;
  perp_position_end_time: number | null;
  perp_drift_usdc_balance_at_start: number | null;
  perp_drift_usdc_balance_at_end: number | null;
  perp_is_active: boolean | null;
  perp_created_at: Date | null;
  perp_updated_at: Date | null;
}

export async function getJoinedPositions(pubkey: string): Promise<JoinedPosition[]> {
  const query = `
    SELECT 
      -- LP Position fields with lp_ prefix
      lp.id as lp_id,
      lp.position_mint_address as lp_position_mint_address,
      lp.pubkey as lp_pubkey,
      lp.pool_address as lp_pool_address,
      lp.token_a_mint as lp_token_a_mint,
      lp.token_b_mint as lp_token_b_mint,
      CAST(lp.starting_usd_value AS FLOAT) as lp_starting_usd_value,
      CAST(lp.closing_usd_value AS FLOAT) as lp_closing_usd_value,
      CAST(COALESCE(lp.closing_usd_value, 0) - lp.starting_usd_value AS FLOAT) as lp_pnl_usd,
      CAST(
        CASE 
          WHEN lp.starting_usd_value > 0 
          THEN ((COALESCE(lp.closing_usd_value, 0) - lp.starting_usd_value) / lp.starting_usd_value) * 100
          ELSE 0 
        END 
      AS FLOAT) as lp_pnl_percentage,
      CAST(lp.lower_boundary AS FLOAT) as lp_lower_boundary,
      CAST(lp.upper_boundary AS FLOAT) as lp_upper_boundary,
      CAST(lp.entry_price AS FLOAT) as lp_entry_price,
      CAST(lp.closing_price AS FLOAT) as lp_closing_price,
      lp.position_start_time as lp_position_start_time,
      lp.position_end_time as lp_position_end_time,
      lp.is_active as lp_is_active,
      CAST(lp.range_deviation_perc_as_decimal AS FLOAT) as lp_range_deviation_perc_as_decimal,
      CAST(lp.starting_token_a_amount AS FLOAT) as lp_starting_token_a_amount,
      CAST(lp.starting_token_b_amount AS FLOAT) as lp_starting_token_b_amount,
      CAST(lp.ending_token_a_amount AS FLOAT) as lp_ending_token_a_amount,
      CAST(lp.ending_token_b_amount AS FLOAT) as lp_ending_token_b_amount,
      lp.session_id as lp_session_id,
      lp.session_start_time as lp_session_start_time,
      lp.session_end_time as lp_session_end_time,
      CAST(lp.session_start_token_a_balance_usd_value AS FLOAT) as lp_session_start_token_a_balance_usd_value,
      CAST(lp.session_start_token_b_balance_usd_value AS FLOAT) as lp_session_start_token_b_balance_usd_value,
      CAST(lp.session_end_token_a_balance_usd_value AS FLOAT) as lp_session_end_token_a_balance_usd_value,
      CAST(lp.session_end_token_b_balance_usd_value AS FLOAT) as lp_session_end_token_b_balance_usd_value,
      lp.strategy as lp_strategy,
      CAST(lp.take_profit_threshold AS FLOAT) as lp_take_profit_threshold,
      lp.created_at as lp_created_at,
      lp.updated_at as lp_updated_at,
      
      -- Perp Position fields with perp_ prefix
      pp.id as perp_id,
      pp.position_mint_address as perp_position_mint_address,
      pp.token as perp_token,
      CAST(pp.size AS FLOAT) as perp_size,
      CAST(pp.entry_price AS FLOAT) as perp_entry_price,
      CAST(pp.exit_price AS FLOAT) as perp_exit_price,
      CAST(pp.pnl AS FLOAT) as perp_pnl,
      CAST(pp.usdc_collateral_amount AS FLOAT) as perp_usdc_collateral_amount,
      pp.position_start_time as perp_position_start_time,
      pp.position_end_time as perp_position_end_time,
      CAST(pp.drift_usdc_balance_at_start AS FLOAT) as perp_drift_usdc_balance_at_start,
      CAST(pp.drift_usdc_balance_at_end AS FLOAT) as perp_drift_usdc_balance_at_end,
      pp.is_active as perp_is_active,
      pp.created_at as perp_created_at,
      pp.updated_at as perp_updated_at
    FROM 
      lp_positions lp
    JOIN 
      perp_positions pp ON lp.position_mint_address = pp.position_mint_address
    WHERE 
      lp.pubkey = $1 
      AND lp.strategy = 2
    ORDER BY 
      lp.position_start_time DESC
  `;

  try {
    const { rows } = await pool.query(query, [pubkey]);
    
    return rows.map(row => ({
      // LP Position fields
      lp_id: Number(row.lp_id),
      lp_position_mint_address: row.lp_position_mint_address,
      lp_pubkey: row.lp_pubkey,
      lp_pool_address: row.lp_pool_address,
      lp_token_a_mint: row.lp_token_a_mint,
      lp_token_b_mint: row.lp_token_b_mint,
      lp_starting_usd_value: Number(row.lp_starting_usd_value),
      lp_closing_usd_value: row.lp_closing_usd_value ? Number(row.lp_closing_usd_value) : null,
      lp_pnl_usd: Number(row.lp_pnl_usd),
      lp_pnl_percentage: Number(row.lp_pnl_percentage),
      lp_lower_boundary: Number(row.lp_lower_boundary),
      lp_upper_boundary: Number(row.lp_upper_boundary),
      lp_entry_price: Number(row.lp_entry_price),
      lp_closing_price: row.lp_closing_price ? Number(row.lp_closing_price) : null,
      lp_position_start_time: Number(row.lp_position_start_time),
      lp_position_end_time: row.lp_position_end_time ? Number(row.lp_position_end_time) : null,
      lp_is_active: row.lp_is_active,
      lp_range_deviation_perc_as_decimal: Number(row.lp_range_deviation_perc_as_decimal),
      lp_starting_token_a_amount: Number(row.lp_starting_token_a_amount),
      lp_starting_token_b_amount: Number(row.lp_starting_token_b_amount),
      lp_ending_token_a_amount: row.lp_ending_token_a_amount ? Number(row.lp_ending_token_a_amount) : null,
      lp_ending_token_b_amount: row.lp_ending_token_b_amount ? Number(row.lp_ending_token_b_amount) : null,
      lp_session_id: row.lp_session_id,
      lp_session_start_time: Number(row.lp_session_start_time),
      lp_session_end_time: row.lp_session_end_time ? Number(row.lp_session_end_time) : null,
      lp_session_start_token_a_balance_usd_value: row.lp_session_start_token_a_balance_usd_value ? Number(row.lp_session_start_token_a_balance_usd_value) : null,
      lp_session_start_token_b_balance_usd_value: row.lp_session_start_token_b_balance_usd_value ? Number(row.lp_session_start_token_b_balance_usd_value) : null,
      lp_session_end_token_a_balance_usd_value: row.lp_session_end_token_a_balance_usd_value ? Number(row.lp_session_end_token_a_balance_usd_value) : null,
      lp_session_end_token_b_balance_usd_value: row.lp_session_end_token_b_balance_usd_value ? Number(row.lp_session_end_token_b_balance_usd_value) : null,
      lp_strategy: row.lp_strategy ? Number(row.lp_strategy) : null,
      lp_take_profit_threshold: row.lp_take_profit_threshold ? Number(row.lp_take_profit_threshold) : null,
      lp_created_at: row.lp_created_at,
      lp_updated_at: row.lp_updated_at,
      
      // Perp Position fields
      perp_id: Number(row.perp_id),
      perp_position_mint_address: row.perp_position_mint_address,
      perp_token: row.perp_token,
      perp_size: Number(row.perp_size),
      perp_entry_price: Number(row.perp_entry_price),
      perp_exit_price: row.perp_exit_price ? Number(row.perp_exit_price) : null,
      perp_pnl: row.perp_pnl ? Number(row.perp_pnl) : null,
      perp_usdc_collateral_amount: Number(row.perp_usdc_collateral_amount),
      perp_position_start_time: Number(row.perp_position_start_time),
      perp_position_end_time: row.perp_position_end_time ? Number(row.perp_position_end_time) : null,
      perp_drift_usdc_balance_at_start: row.perp_drift_usdc_balance_at_start ? Number(row.perp_drift_usdc_balance_at_start) : null,
      perp_drift_usdc_balance_at_end: row.perp_drift_usdc_balance_at_end ? Number(row.perp_drift_usdc_balance_at_end) : null,
      perp_is_active: row.perp_is_active,
      perp_created_at: row.perp_created_at,
      perp_updated_at: row.perp_updated_at
    }));
  } catch (err) {
    console.error('Error fetching joined positions:', err);
    throw err;
  }
}