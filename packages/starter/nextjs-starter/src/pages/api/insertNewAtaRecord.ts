// pages/api/data/insertNewAtaRecord.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { addAtaRecordToDb } from '../../../lib/db';
import { AtaRecord } from '../../types';


interface ApiResponse {
  message?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method === 'POST') {
    const {
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
      mint_name,
    } = req.body as AtaRecord;

    try {
      await addAtaRecordToDb(
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
      );
      res.status(201).json({ message: 'ATA record added successfully.' });
    } catch (error) {
      console.error('Error adding ATA record:', error);
      res.status(500).json({ error: 'Failed to add ATA record.' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
