import { AtaRecord } from "./types";

export async function fetchAtaRecords(pubkey: string | undefined): Promise<AtaRecord[]> {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pubkey }),
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
  
      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error('Error fetching ATA records:', error);
      return [];
    }
  }


  interface InsertAtaResponse {
    message?: string;
    error?: string;
  }
  
  export async function insertNewAtaRecord(newAtaRecord: AtaRecord): Promise<InsertAtaResponse> {
    try {
      const response = await fetch('/api/insertNewAtaRecord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAtaRecord),
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
  
      const data: InsertAtaResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error inserting new ATA record:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }