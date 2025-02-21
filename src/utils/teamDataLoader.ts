import * as XLSX from 'xlsx';
import { Match } from './types/match';
import { fetchMultipleFromGithub } from './githubLoader';

// GitHub'daki veri dosyalarının listesi
const DATA_FILES = [
  'data/2003-2004.xls',
  'data/2004-2005.xls',
  'data/2005-2006.xls',
  'data/2006-2007.xls',
  'data/2007-2008.xls',
  'data/2008-2009.xls',
  'data/2009-2010.xls',
  'data/2010-2011.xls',
  'data/2011-2012.xls',
  'data/2012-2013.xls',
  'data/2013-2014.xls',
  'data/2014-2015.xls',
  'data/2015-2016.xls',
  'data/2016-2017.xls',
  'data/2017-2018.xlsx',
  'data/2018-2019.xlsx',
  'data/2019-2020.xlsx',
  'data/2020-2021.xlsx',
  'data/2021-2022.xlsx',
  'data/2022-2023.xlsx',
  'data/2023-2024.xlsx',
  'data/2024-2025.xlsx',
  'data/uefacompetitionresults1.xlsx'

];

export async function loadMatchData(): Promise<Match[]> {
  try {
    console.log('Loading match data from GitHub...');
    const buffers = await fetchMultipleFromGithub(DATA_FILES);
    
    const allMatches: Match[] = [];
    
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      console.log(`Processing file: ${DATA_FILES[i]}`);
      
      try {
        const workbook = XLSX.read(buffer);
        
        // Her sayfayı işle
        for (const sheetName of workbook.SheetNames) {
          console.log(`Processing sheet: ${sheetName}`);
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          allMatches.push(...(jsonData as Match[]));
        }
      } catch (xlsxError) {
        console.error(`Error processing Excel file ${DATA_FILES[i]}:`, xlsxError);
        throw new Error(`Excel processing failed for ${DATA_FILES[i]}: ${xlsxError.message}`);
      }
    }
    
    if (allMatches.length === 0) {
      throw new Error('No match data found in the Excel files');
    }
    
    console.log('Match data loaded successfully:', allMatches.length, 'matches found');
    return allMatches;
  } catch (error) {
    console.error('Error loading match data:', error);
    throw error;
  }
} 