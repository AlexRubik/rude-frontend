import type { NextApiRequest, NextApiResponse } from 'next';
import { getLast24HourProtocolApys } from '../../db';

let cachedData: any = null;
let lastFetch = 0;

async function refreshCache() {
  try {
    const { protocols, lastUpdateTime } = await getLast24HourProtocolApys();
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
    console.log('Method not allowed');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!cachedData || shouldRefreshCache()) {
    console.log('Refreshing cache because:', !cachedData ? 'cache is empty' : 'last update was over 61 minutes ago');
    await refreshCache();
  }

  console.log('Sending cached data to client');
  res.status(200).json(cachedData);
}