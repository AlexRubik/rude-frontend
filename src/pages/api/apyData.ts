import type { NextApiRequest, NextApiResponse } from 'next';
import { getProtocolApys } from '../../db';

let cachedData: any = null;
let lastFetch = 0;

async function refreshCache() {
  try {
    const { protocols, lastUpdateTime } = await getProtocolApys();
    cachedData = { 
      success: true, 
      data: protocols,
      lastUpdateTime 
    };
    lastFetch = Date.now();
    console.log('Cache refreshed at:', new Date().toISOString());
  } catch (error) {
    console.error('Cache refresh failed:', error);
  }
}

function shouldRefreshCache() {
  if (!cachedData || !cachedData.lastUpdateTime) return true;
  
  const now = Math.floor(Date.now() / 1000); // Convert to unix seconds
  const minutesSinceLastUpdate = (now - cachedData.lastUpdateTime) / 60;
  console.log('Minutes since last update:', Math.floor(minutesSinceLastUpdate));
  
  return minutesSinceLastUpdate > 61;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { protocols, lastUpdateTime } = await getProtocolApys();
    
    // Debug logging
    console.log('Raw protocol data:', JSON.stringify(protocols, null, 2));
    
    // Check for zero APYs
    protocols.forEach(protocol => {
      protocol.tokens.forEach(token => {
        if (token.latest_apy === 0) {
          console.log(`Zero latest_apy found for ${protocol.protocol_name} - ${token.token_ticker}`);
        }
      });
    });

    cachedData = { 
      success: true, 
      data: protocols,
      lastUpdateTime 
    };

    res.status(200).json(cachedData);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch protocol APYs' 
    });
  }
}