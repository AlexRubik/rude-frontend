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

// Initialize cache and set up auto-refresh
if (typeof window === 'undefined') { // Only run on server side
  refreshCache(); // Initial cache fill
  setInterval(() => {
    const now = new Date();
    const minutes = now.getMinutes();
    if (minutes >= 1 && minutes <= 3) { // Refresh during minutes 1, 2, and 3 of each hour
      refreshCache();
    }
  }, 60000); // Check every minute
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!cachedData) {
    await refreshCache();
  }

  res.status(200).json(cachedData);
}