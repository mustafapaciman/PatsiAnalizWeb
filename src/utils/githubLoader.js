const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/mustafapaciman/patsipredictions/main';
export async function fetchFromGithub(path) {
    try {
        console.log(`Fetching from GitHub: ${path}`);
        const response = await fetch(`${GITHUB_RAW_URL}/${path}`, {
            headers: {
                'Accept': 'application/vnd.github.v3.raw'
            }
        });
        if (!response.ok) {
            console.error(`GitHub API Error: ${response.status} ${response.statusText}`);
            console.error('Full URL:', `${GITHUB_RAW_URL}/${path}`);
            throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        return await blob.arrayBuffer();
    }
    catch (error) {
        console.error('Error fetching from GitHub:', error);
        console.error('Full URL:', `${GITHUB_RAW_URL}/${path}`);
        throw error;
    }
}
export async function fetchMultipleFromGithub(paths) {
    return Promise.all(paths.map(path => fetchFromGithub(path)));
}
