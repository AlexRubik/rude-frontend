import { PublicKey } from "@solana/web3.js";
import { Adrena } from "./adrena";
import { IdlAccounts } from "@coral-xyz/anchor";

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

export type AllStakingStats = {
  byDurationByAmount: {
      [staking_type in ('ADX' | 'ALP')]: {
          liquid: number;
          totalLocked: number;
          locked: {
              [lockedDurationInDays: string]: {
                  total: number;
                  [wallet: string]: number;
              };
          };
      };
  };

  byRemainingTime: {
      [staking_type in ('ADX' | 'ALP')]: {
          stake: string;
          endTime: number;
          tokenAmount: number;
      }[]
  },
};
type Accounts = IdlAccounts<Adrena>;
export type UserStaking = Accounts["userStaking"];

export type UserStakingExtended = {
  pubkey: PublicKey;
} & UserStaking;