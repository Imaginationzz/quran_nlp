import fs from 'fs';
import path from 'path';

// Store the promise to ensure we only load once even if called concurrently
let loadPromise = null;
const GLOBAL_CACHE_KEY = 'quranDataCache';

export async function getQuranData() {
    // 1. Check if already cached in globalThis (persists across HMR)
    if (globalThis[GLOBAL_CACHE_KEY]) {
        return globalThis[GLOBAL_CACHE_KEY];
    }

    // 2. If load is already in progress, return the existing promise
    if (loadPromise) {
        return loadPromise;
    }

    // 3. Start the loading process
    loadPromise = (async () => {
        const DATA_PATH = path.join(process.cwd(), 'data/processed/quran-data.json');
        console.log(`🚀 [DATA-LOADER] Starting FIRST LOAD from: ${DATA_PATH}`);

        try {
            const fileContent = fs.readFileSync(DATA_PATH, 'utf8');
            const data = JSON.parse(fileContent);

            // Cache it globally in development to survive HMR
            if (process.env.NODE_ENV !== 'production') {
                globalThis[GLOBAL_CACHE_KEY] = data;
            }

            console.log('✅ [DATA-LOADER] Load Successful.');
            return data;
        } catch (err) {
            console.error('❌ [DATA-LOADER] Load Failed:', err);
            loadPromise = null; // Allow retry on failure
            throw err;
        }
    })();

    return loadPromise;
}
