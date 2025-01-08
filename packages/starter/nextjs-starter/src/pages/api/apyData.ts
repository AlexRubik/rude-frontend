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

    // check if protocols is empty
    if (protocols.length === 0) {
      console.log('Protocols array is empty after refresh');

    }
    // check if lastUpdateTime is null or undefined
    if (lastUpdateTime === null || lastUpdateTime === undefined) {
      console.log('Last update time is null or undefined after refresh');
    }

    lastFetch = Date.now();
    console.log('Cache refreshed at:', new Date().toISOString());
  } catch (error) {
    console.error('Cache refresh failed:', error);
  }
}

// Initialize cache and set up auto-refresh
if (typeof window === 'undefined') { // Only run on server side
  console.log('Initializing cache...');
  refreshCache(); // Initial cache fill
  setInterval(() => {
    console.log('Checking if it is time to refresh the cache...');
    const now = new Date();
    const minutes = now.getMinutes();
    if (minutes >= 1 && minutes <= 3) { // Refresh during minutes 1, 2, and 3 of each hour
      console.log('Refreshing cache because it is 1-3 minutes past the hour');
      refreshCache();
    }
  }, 60000); // Check every minute
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    console.log('Method not allowed');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!cachedData) {
    console.log('Cache is empty, refreshing...');
    await refreshCache();
  }
  // sending the cached data to the client
  console.log('Sending cached data to client');
  res.status(200).json(cachedData);
}