import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as TOML from '@iarna/toml';
import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { IDL as ADRENA_IDL } from './adrena';
import BigNumber from 'bignumber.js';
import { AllStakingStats, UserStakingExtended } from './types';
import fetch from 'node-fetch';

// Define interfaces for the return data structure
export interface StakingRound {
    startTime: string;
    endTime: string;
    rate: string;
    totalStake: string;
    totalClaim: string;
    lmRate: string;
    lmTotalStake: string;
    lmTotalClaim: string;
  }
  
  // Interface for price data
  interface PriceData {
    success: boolean;
    data: {
      adx: {
        price: string;
        price_timestamp: string;
      };
      alp: {
        price: string;
        price_timestamp: string;
      };
    };
  }
  
  export interface StakingAccountSummary {
    stakingType: string;
    lockedTokens: string;
    liquidTokens: string;
    totalStaked: string;
    stakedTokenMint: string;
    resolvedRewardTokenAmount: string;
    resolvedStakedTokenAmount: string;
    resolvedLmRewardTokenAmount: string;
    resolvedLmStakedTokenAmount: string;
    currentStakingRound: {
      startTime: string;
      endTime: string;
      rate: string;
      totalStake: string;
      totalClaim: string;
      lmRate: string;
      lmTotalStake: string;
      lmTotalClaim: string;
    };
    usdcRewardVaultBalance: string;
    pendingUsdcRewards: string;
    totalSupply: string;
    percentageStaked: string;
    // Add price and USD values
    tokenPrice: string;
    priceTimestamp: string;
    lockedTokensUsd: string;
    liquidTokensUsd: string;
    totalStakedUsd: string;
    totalSupplyUsd: string;
    fullData: Record<string, any>;
  }
  
  export interface AccountBasicInfo {
    address: string;
    owner: string;
    lamports: number;
    solBalance: number;
  }
  
  export interface AdrenaAccountData {
    basicInfo: AccountBasicInfo;
    accountType: string;
    availableAccountTypes: string[];
    processedAccount: Record<string, any>;
    summary: StakingAccountSummary | null;
  }
  
  // Helper function to get token account balance
  async function getTokenAccountBalance(connection: Connection, tokenAccountAddress: string): Promise<string> {
    try {
      const publicKey = new PublicKey(tokenAccountAddress);
      const tokenAccountInfo = await connection.getTokenAccountBalance(publicKey);
      
      if (tokenAccountInfo && tokenAccountInfo.value) {
        const amount = tokenAccountInfo.value.amount;
        const decimals = tokenAccountInfo.value.decimals;
        const formattedAmount = new BigNumber(amount).shiftedBy(-decimals).toFormat();
        return formattedAmount;
      }
      
      return "0";
    } catch (error) {
      console.error(`Error fetching token balance for ${tokenAccountAddress}:`, error);
      return "Error fetching balance";
    }
  }
  
  // Helper function to get token supply
  async function getTokenSupply(connection: Connection, mintAddress: string): Promise<string> {
    try {
      const publicKey = new PublicKey(mintAddress);
      const supply = await connection.getTokenSupply(publicKey);
      
      if (supply && supply.value) {
        const amount = supply.value.amount;
        const decimals = supply.value.decimals;
        const formattedAmount = new BigNumber(amount).shiftedBy(-decimals).toFormat();
        return formattedAmount;
      }
      
      return "0";
    } catch (error) {
      console.error(`Error fetching token supply for ${mintAddress}:`, error);
      return "Error fetching supply";
    }
  }
  
  // Helper function to fetch token prices
  async function fetchTokenPrices(): Promise<PriceData | null> {
    try {
      const response = await fetch('https://datapi.adrena.xyz/last-price');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json() as PriceData;
      return data;
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return null;
    }
  }
  
  // Helper function to calculate USD value
  function calculateUsdValue(tokenAmount: string, tokenPrice: string): string {
    try {
      const amount = new BigNumber(tokenAmount.replace(/,/g, ''));
      const price = new BigNumber(tokenPrice);
      const usdValue = amount.multipliedBy(price);
      return `$${usdValue.toFormat(2)}`;
    } catch (error) {
      console.error('Error calculating USD value:', error);
      return 'Error calculating';
    }
  }
  
  // Modify the existing function to use fallback RPC
  export async function readAdrenaAccount(accountAddress: string): Promise<AdrenaAccountData> {
    // Define RPC URLs
    const primaryRpcUrl = 'https://api.mainnet-beta.solana.com';
    const fallbackRpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/demo';
    
    // Track which RPC we're using
    let usingFallbackRpc = false;
    
    async function attemptConnection(rpcUrl: string): Promise<Connection> {
      return new Connection(rpcUrl, 'confirmed');
    }
    
    try {
      // Try to connect using primary RPC
      let connection: Connection;
      try {
        console.log('Attempting to connect using primary RPC...');
        connection = await attemptConnection(primaryRpcUrl);
        
        // Test the connection with a simple request
        await connection.getLatestBlockhash();
        console.log('Successfully connected to primary RPC');
      } catch (error) {
        console.warn('Error connecting to primary RPC:', error);
        console.log('Falling back to alternative RPC URL...');
        
        // If primary fails, try fallback
        connection = await attemptConnection(fallbackRpcUrl);
        
        // Test the fallback connection
        await connection.getLatestBlockhash();
        console.log('Successfully connected to fallback RPC');
        usingFallbackRpc = true;
      }
      
      // Create a dummy wallet for read-only operations
      const dummyWallet = new NodeWallet(Keypair.generate());
      
      // Create a provider
      const provider = new AnchorProvider(
        connection,
        dummyWallet,
        { commitment: 'confirmed' }
      );
      
      // Create PublicKey from the address
      const pubkey = new PublicKey(accountAddress);
      
      // Get the account info first to determine the owner
      const accountInfo = await connection.getAccountInfo(pubkey);
      
      if (!accountInfo) {
        throw new Error('Account not found');
      }
      
      console.log('=== Account Basic Info ===');
      console.log(`Address: ${accountAddress}`);
      console.log(`Owner: ${accountInfo.owner.toString()}`);
      console.log(`Lamports: ${accountInfo.lamports} (${accountInfo.lamports / 10**9} SOL)`);
      console.log(`Using ${usingFallbackRpc ? 'fallback' : 'primary'} RPC`);
      
      // Create the program instance using the account owner as program ID
      const programId = new PublicKey("13gDzEXCdocbj8iAiqrScGo47NiSuYENGsRqi3SEAwet"); // Adrena program ID
      const program = new Program(ADRENA_IDL, programId, provider);
      
      // Get all account types from the IDL
      const accountTypes = ADRENA_IDL.accounts.map(acc => acc.name);
      console.log('Available account types:', accountTypes);
      
      // Try to decode with each account type
      let decodedAccount = null;
      let accountType = '';
      
      for (const type of accountTypes) {
        try {
          decodedAccount = program.coder.accounts.decode(type, accountInfo.data);
          accountType = type;
          break;
        } catch (e) {
          // Continue trying other types
        }
      }
      
      if (!decodedAccount) {
        throw new Error('Could not decode account data');
      }
      
      console.log(`\n=== Decoded Account (${accountType}) ===`);
      
      // Helper function to convert hex strings to readable values
      const processValue = (value: any, key: string): any => {
        // If it's a BN or looks like a hex string that could be a number
        if (value instanceof BN || (typeof value === 'string' && /^[0-9a-f]+$/i.test(value))) {
          // Convert to BN if it's a string
          const bnValue = value instanceof BN ? value : new BN(value, 16);
          
          // Check if it might be a timestamp
          if (key.toLowerCase().includes('time') && bnValue.toNumber() > 1600000000 && bnValue.toNumber() < 2000000000) {
            return new Date(bnValue.toNumber() * 1000).toISOString();
          }
          
          // Check if it might be a token amount (based on field name)
          if (key.toLowerCase().includes('amount') || 
              key.toLowerCase().includes('tokens') || 
              key.toLowerCase().includes('stake') || 
              key.toLowerCase().includes('claim')) {
            // Assume 6 decimals for token amounts
            const decimals = 6;
            return `${bnValue.toString(10)} (${new BigNumber(bnValue.toString()).shiftedBy(-decimals).toFormat()} tokens)`;
          }
          
          // Default to decimal representation
          return bnValue.toString(10);
        }
        
        // If it's an array, process each element
        if (Array.isArray(value)) {
          return value.map(v => processValue(v, key));
        }
        
        // If it's an object, process each property
        if (typeof value === 'object' && value !== null) {
          const processed: Record<string, any> = {};
          Object.entries(value).forEach(([k, v]) => {
            processed[k] = processValue(v, k);
          });
          return processed;
        }
        
        // Return as is for other types
        return value;
      };
      
      // Process the decoded account
      const processedAccount: Record<string, any> = {};
      Object.entries(decodedAccount).forEach(([key, value]) => {
        processedAccount[key] = processValue(value, key);
      });
      
      // Print each field:value pair
      console.log('\nField : Value');
      console.log('------------------');
      Object.entries(processedAccount).forEach(([key, value]) => {
        console.log(`${key}: ${JSON.stringify(value, null, 2)}`);
      });
      
      // Create summary for staking accounts
      let summary: StakingAccountSummary | null = null;
      
      if (accountType === 'staking') {
        console.log('\n=== Staking Account Summary ===');
        const stakingType = decodedAccount.stakingType === 1 ? 'ADX' : 'ALP';
        console.log(`Staking Type: ${stakingType}`);
        
        // Convert token amounts to human-readable format
        const stakedTokenDecimals = decodedAccount.stakedTokenDecimals;
        const nbLockedTokens = new BigNumber(decodedAccount.nbLockedTokens.toString()).shiftedBy(-stakedTokenDecimals);
        const nbLiquidTokens = new BigNumber(decodedAccount.nbLiquidTokens.toString()).shiftedBy(-stakedTokenDecimals);
        const totalStaked = nbLockedTokens.plus(nbLiquidTokens);
        
        console.log(`Locked Tokens: ${nbLockedTokens.toFormat()} ${stakingType}`);
        console.log(`Liquid Tokens: ${nbLiquidTokens.toFormat()} ${stakingType}`);
        console.log(`Total Staked: ${totalStaked.toFormat()} ${stakingType}`);
        
        // Show token mint
        const mintAddress = new PublicKey(decodedAccount.stakedTokenMint).toString();
        console.log(`Staked Token Mint: ${mintAddress}`);
        
        // Fetch total supply of the token
        const totalSupply = await getTokenSupply(connection, mintAddress);
        console.log(`Total Supply: ${totalSupply} ${stakingType}`);
        
        // Calculate percentage staked
        let percentageStaked = "0%";
        try {
          const totalSupplyBN = new BigNumber(totalSupply.replace(/,/g, ''));
          if (!totalSupplyBN.isZero()) {
            const percentage = totalStaked.dividedBy(totalSupplyBN).multipliedBy(100);
            percentageStaked = percentage.toFixed(2) + "%";
          }
          console.log(`Percentage Staked: ${percentageStaked}`);
        } catch (error) {
          console.error('Error calculating percentage staked:', error);
          percentageStaked = "Error calculating";
        }
        
        // Fetch USDC reward vault balance
        const usdcRewardVaultAddress = "A3UJxhPtieUr1mjgJhJaTPqDReDaB2H9q7hzs2icrUeS";
        const usdcRewardVaultBalance = await getTokenAccountBalance(connection, usdcRewardVaultAddress);
        console.log(`USDC Reward Vault Balance: ${usdcRewardVaultBalance} USDC`);
        
        // Calculate pending USDC rewards
        let pendingUsdcRewards = "0";
        try {
          // Extract the numeric value from resolvedRewardTokenAmount
          const resolvedRewardMatch = processedAccount.resolvedRewardTokenAmount.match(/\(([\d,\.]+)/);
          const resolvedRewardAmount = resolvedRewardMatch ? 
            resolvedRewardMatch[1].replace(/,/g, '') : 
            "0";
          
          // Convert to BigNumber for precise calculation
          const vaultBalance = new BigNumber(usdcRewardVaultBalance.replace(/,/g, ''));
          const resolvedReward = new BigNumber(resolvedRewardAmount);
          
          // Calculate pending rewards (vault balance - resolved rewards)
          if (vaultBalance.isGreaterThan(resolvedReward)) {
            pendingUsdcRewards = vaultBalance.minus(resolvedReward).toFormat();
          }
          
          console.log(`Pending USDC Rewards: ${pendingUsdcRewards} USDC`);
        } catch (error) {
          console.error('Error calculating pending USDC rewards:', error);
          pendingUsdcRewards = "Error calculating";
        }
        
        // Fetch token prices
        const priceData = await fetchTokenPrices();
        let tokenPrice = "0";
        let priceTimestamp = "";
        
        if (priceData && priceData.success) {
          // Get the appropriate token price based on staking type
          if (stakingType === 'ADX') {
            tokenPrice = priceData.data.adx.price;
            priceTimestamp = priceData.data.adx.price_timestamp;
          } else if (stakingType === 'ALP') {
            tokenPrice = priceData.data.alp.price;
            priceTimestamp = priceData.data.alp.price_timestamp;
          }
          console.log(`${stakingType} Price: $${tokenPrice} (as of ${priceTimestamp})`);
        }
        
        // Calculate USD values
        const lockedTokensUsd = calculateUsdValue(nbLockedTokens.toFormat(6), tokenPrice);
        const liquidTokensUsd = calculateUsdValue(nbLiquidTokens.toFormat(6), tokenPrice);
        const totalStakedUsd = calculateUsdValue(totalStaked.toFormat(6), tokenPrice);
        const totalSupplyUsd = calculateUsdValue(totalSupply.replace(/,/g, ''), tokenPrice);
        
        console.log(`Locked Tokens USD: ${lockedTokensUsd}`);
        console.log(`Liquid Tokens USD: ${liquidTokensUsd}`);
        console.log(`Total Staked USD: ${totalStakedUsd}`);
        console.log(`Total Supply USD: ${totalSupplyUsd}`);
        
        // Extract the important fields from processedAccount
        summary = {
          stakingType,
          lockedTokens: nbLockedTokens.toFormat(),
          liquidTokens: nbLiquidTokens.toFormat(),
          totalStaked: totalStaked.toFormat(),
          stakedTokenMint: mintAddress,
          resolvedRewardTokenAmount: processedAccount.resolvedRewardTokenAmount,
          resolvedStakedTokenAmount: processedAccount.resolvedStakedTokenAmount,
          resolvedLmRewardTokenAmount: processedAccount.resolvedLmRewardTokenAmount,
          resolvedLmStakedTokenAmount: processedAccount.resolvedLmStakedTokenAmount,
          currentStakingRound: {
            startTime: processedAccount.currentStakingRound.startTime,
            endTime: processedAccount.currentStakingRound.endTime,
            rate: processedAccount.currentStakingRound.rate,
            totalStake: processedAccount.currentStakingRound.totalStake,
            totalClaim: processedAccount.currentStakingRound.totalClaim,
            lmRate: processedAccount.currentStakingRound.lmRate,
            lmTotalStake: processedAccount.currentStakingRound.lmTotalStake,
            lmTotalClaim: processedAccount.currentStakingRound.lmTotalClaim
          },
          usdcRewardVaultBalance: usdcRewardVaultBalance,
          pendingUsdcRewards: pendingUsdcRewards,
          totalSupply: totalSupply,
          percentageStaked: percentageStaked,
          // Add price and USD values to summary
          tokenPrice: `$${tokenPrice}`,
          priceTimestamp: priceTimestamp,
          lockedTokensUsd: lockedTokensUsd,
          liquidTokensUsd: liquidTokensUsd,
          totalStakedUsd: totalStakedUsd,
          totalSupplyUsd: totalSupplyUsd,
          fullData: processedAccount
        };
      }
      // Return the structured data
      return {
        basicInfo: {
          address: accountAddress,
          owner: accountInfo.owner.toString(),
          lamports: accountInfo.lamports,
          solBalance: accountInfo.lamports / LAMPORTS_PER_SOL
        },
        accountType,
        availableAccountTypes: accountTypes,
        processedAccount,
        summary
      };
      
    } catch (error) {
      console.error('Error reading account:', error);
      
      // If we haven't tried the fallback yet and the error might be connection-related
      if (!usingFallbackRpc && isConnectionError(error)) {
        console.log('Connection error detected, retrying with fallback RPC...');
        usingFallbackRpc = true;
        
        try {
          // Create a new connection with the fallback URL
          const connection = new Connection(fallbackRpcUrl, 'confirmed');
          
          // ... repeat the rest of the function with the new connection
          // This would be a lot of duplicate code, so in practice you might
          // want to refactor the function to avoid this duplication
          
          // For now, we'll just throw the error to keep this example simpler
          throw error;
        } catch (fallbackError) {
          console.error('Error with fallback RPC:', fallbackError);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }
  
  // Helper function to determine if an error is likely connection-related
  function isConnectionError(error: any): boolean {
    if (!error) return false;
    
    const errorString = error.toString().toLowerCase();
    const message = error.message ? error.message.toLowerCase() : '';
    
    // Check for common connection error patterns
    return (
      errorString.includes('network') ||
      errorString.includes('connection') ||
      errorString.includes('timeout') ||
      errorString.includes('econnrefused') ||
      errorString.includes('econnreset') ||
      errorString.includes('socket') ||
      message.includes('failed to fetch') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout')
    );
  }
  
  // // Call the function with your account address
  // readAdrenaAccount('5Feq2MKbimA44dqgFHLWr7h77xAqY9cet5zn9eMCj78p');