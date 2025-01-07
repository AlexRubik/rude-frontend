import type { NextApiRequest, NextApiResponse } from 'next';
import { getLast24HourProtocolApys } from '../../db';

type ApiResponse = {
  success: boolean;
  data?: {
    protocol_name: string;
    tokens: {
      token_ticker: string;
      avg_apy: number;
    }[];
  }[];
  lastUpdateTime?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { protocols, lastUpdateTime } = await getLast24HourProtocolApys();
    res.status(200).json({ 
      success: true, 
      data: protocols,
      lastUpdateTime 
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch protocol APYs' 
    });
  }
}