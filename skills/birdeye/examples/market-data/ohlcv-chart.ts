/**
 * Example: Fetch historical OHLCV candles
 * Run with: npx ts-node examples/market-data/ohlcv-chart.ts
 */

import { BirdeyeClient } from '../../templates/birdeye-client';

async function run() {
    const apiKey = process.env.BIRDEYE_API_KEY;
    if (!apiKey) {
        console.error("Please export BIRDEYE_API_KEY.");
        process.exit(1);
    }

    const client = BirdeyeClient.createWithConfig({ apiKey, chain: 'solana' });
    const WSOL = 'So11111111111111111111111111111111111111112';

    console.log(`Fetching 1Day OHLCV Candles for WSOL...`);
    
    // Timeframes can be: 1m, 3m, 5m, 15m, 30m, 1H, 2H, 4H, 6H, 8H, 12H, 1D, 3D, 1W, 1M
    try {
        // We use a custom fetch here because ohlcv falls under a different base url path on the API
        // in some versions, but standard is /defi/ohlcv. Let's demonstrate dynamic fetch
        const res = await fetch(`https://public-api.birdeye.so/defi/ohlcv?address=${WSOL}&type=1D`, {
            headers: {
                'X-API-KEY': apiKey,
                'x-chain': 'solana',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        const json = await res.json();
        
        if (json.data && json.data.items) {
            console.log(`Successfully fetched ${json.data.items.length} candles.`);
            console.log("Most recent candle:", json.data.items[json.data.items.length - 1]);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
