export interface Item {
    id: number;
    name: string;
  }

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