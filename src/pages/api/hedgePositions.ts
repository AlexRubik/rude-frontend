import type { NextApiRequest, NextApiResponse } from 'next';
import { getJoinedPositions, JoinedPosition } from '../../db';

interface HedgePosition extends Omit<JoinedPosition, 'perp_pnl' | 'lp_pnl_usd'> {
  perp_pnl: number | null;
  lp_pnl_usd: number;
  total_pnl: number;
  total_starting_value: number;
  total_pnl_percentage: number;
}

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
    const joinedPositions = await getJoinedPositions(pubkey);
    
    // Filter positions to only include those with end times for both LP and perp
    const filteredPositions = joinedPositions.filter(position => 
      position.lp_position_end_time !== null && 
      position.perp_position_end_time !== null
    );
    
    // Calculate total PNL for each position
    const hedgePositions: HedgePosition[] = filteredPositions.map(position => {
      const perpPnl = position.perp_pnl || 0;
      const lpPnl = position.lp_pnl_usd;
      const totalPnl = perpPnl + lpPnl;
      const totalStartingValue = position.lp_starting_usd_value + position.perp_usdc_collateral_amount;
      
      // Calculate total PNL percentage
      const totalPnlPercentage = totalStartingValue > 0 
        ? (totalPnl / totalStartingValue) * 100 
        : 0;
      
      return {
        ...position,
        total_pnl: totalPnl,
        total_starting_value: totalStartingValue,
        total_pnl_percentage: totalPnlPercentage
      };
    });

    // Calculate aggregated PNL across all positions
    const aggregatedTotalPnl = hedgePositions.reduce((sum, position) => sum + position.total_pnl, 0);
    const aggregatedPerpPnl = hedgePositions.reduce((sum, position) => sum + (position.perp_pnl || 0), 0);
    const aggregatedLpPnl = hedgePositions.reduce((sum, position) => sum + position.lp_pnl_usd, 0);

    res.status(200).json({ 
      success: true, 
      data: hedgePositions,
      aggregated: {
        total_pnl: aggregatedTotalPnl,
        perp_pnl: aggregatedPerpPnl,
        lp_pnl: aggregatedLpPnl
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch hedge positions' 
    });
  }
}
