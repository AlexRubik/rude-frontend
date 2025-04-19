import type { NextApiRequest, NextApiResponse } from 'next';
import { readAdrenaAccount, AdrenaAccountData } from '../../server-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdrenaAccountData | { error: string }>
) {
  try {
    // Use the default account address for ADX staking
    const accountAddress = '5Feq2MKbimA44dqgFHLWr7h77xAqY9cet5zn9eMCj78p';
    
    // Allow overriding the account address via query parameter
    if (req.query.address && typeof req.query.address === 'string') {
      const accountData = await readAdrenaAccount(req.query.address);
      return res.status(200).json(accountData);
    }
    
    // Read the account data using the default address
    const accountData = await readAdrenaAccount(accountAddress);
    
    // Return the data
    return res.status(200).json(accountData);
  } catch (error) {
    console.error('Error in API route:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
