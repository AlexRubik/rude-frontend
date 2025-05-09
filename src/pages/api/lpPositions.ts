import type { NextApiRequest, NextApiResponse } from 'next';
import { getInactiveLpPositions } from '../../db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { pubkey } = req.query;

  if (!pubkey || typeof pubkey !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing or invalid pubkey parameter' 
    });
  }

  try {
    const allPositions = await getInactiveLpPositions(pubkey);
    // Filter to only include positions with strategy = 1
    const positions = allPositions.filter(position => position.strategy === 1);
    
    res.status(200).json({ 
      success: true, 
      data: positions 
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch LP positions' 
    });
  }
} 