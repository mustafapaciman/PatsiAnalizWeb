import { PROXY_FIXTURES_URL } from './constants';

export async function downloadFixtures(): Promise<Blob | null> {
  try {
    const response = await fetch(PROXY_FIXTURES_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading fixtures:', error);
    return null;
  }
}

export function saveFixtureFile(blob: Blob): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fixtures.xlsx';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}