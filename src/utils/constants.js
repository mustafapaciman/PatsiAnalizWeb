// DO NOT DELETE START - Core Application Constants
export const EXCEL_DATE_OFFSET = new Date(1899, 11, 30).getTime();
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Direct download link from football-data.co.uk
export const FIXTURES_URL = '/fixtures.csv';
// Local proxy will be running on port 8010
export const PROXY_URL = 'http://localhost:8010/proxy';
export const PROXY_FIXTURES_URL = `${PROXY_URL}${FIXTURES_URL}`;
// DO NOT DELETE END - Core Application Constants
