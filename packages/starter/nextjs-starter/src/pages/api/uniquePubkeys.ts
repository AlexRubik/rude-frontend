import type { NextApiRequest, NextApiResponse } from 'next';
import { getUniquePubkeysWithLpPositions } from '../../db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const pubkeys = await getUniquePubkeysWithLpPositions();
    res.status(200).json({ 
      success: true, 
      data: pubkeys 
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch unique pubkeys' 
    });
  }
} 