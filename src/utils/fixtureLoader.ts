import * as XLSX from 'xlsx';
import { PROXY_FIXTURES_URL } from './constants';
import { Match } from './types/match';

export async function loadFixtures(): Promise<Match[]> {
  try {
    console.log('Loading fixtures...');
    const urlWithTimestamp = `${PROXY_FIXTURES_URL}?t=${Date.now()}`;
    console.log('Fetching from URL:', urlWithTimestamp);
    
    const response = await fetch(urlWithTimestamp);

    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Response received, processing data...');
    const text = await response.text();
    
    // CSV'yi XLSX formatına çevir
    const workbook = XLSX.read(text, { type: 'string' });
    
    const fixtures: Match[] = [];
    
    // Process all sheets
    for (const sheetName of workbook.SheetNames) {
      console.log('Processing sheet:', sheetName);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Debug için tarih formatını kontrol et
      console.log('Sample data:', jsonData[0]);
      
      fixtures.push(...(jsonData as Match[]));
    }
    
    console.log('Fixtures loaded successfully:', fixtures.length, 'matches found');
    return fixtures;
  } catch (error) {
    console.error('Detailed error loading fixtures:', error);
    throw error;
  }
}