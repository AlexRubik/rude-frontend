// Assuming you have the necessary types, adjust if needed.
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAtaRecords } from "../../../lib/db";
import { AtaRecord } from '../../types';

// Define a type for your expected request body for better type-checking.
interface PostRequest extends NextApiRequest {
  body: {
    pubkey: string;
  };
}

// Define a response type for clearer type expectations and autocomplete in your response handling.
interface AtaRecordsResponse {
  items?: AtaRecord[]; // Replace 'any' with your actual item type for better type safety.
  error?: string;
}

export default async function handler(req: PostRequest, res: NextApiResponse<AtaRecordsResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed, must be post' });
  }

  try {
    // Here, I'm assuming that your getAtaRecords function needs a pubkey as an argument.
    // You will need to adjust the getAtaRecords function to accept the pubkey argument and use it accordingly.
    const pubkey = req.body.pubkey;
    if (!pubkey) {
      return res.status(400).json({ error: 'Pubkey is required' });
    }

    const items = await getAtaRecords(pubkey);
    res.status(200).json({ items });
  } catch (error) {
    console.error('Error fetching ATA records:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
