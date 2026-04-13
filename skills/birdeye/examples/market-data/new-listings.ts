/**
 * New Token Listings — Birdeye /defi/v2/tokens/new_listing
 * Fetches recently listed tokens on Solana for early-entry alpha.
 *
 * Run: BIRDEYE_API_KEY=xxx npx ts-node examples/market-data/new-listings.ts
 */

import { BirdeyeClient } from '../../templates/birdeye-client';

async function run() {
    const apiKey = process.env.BIRDEYE_API_KEY;
    if (!apiKey) { console.error('Set BIRDEYE_API_KEY env var.'); process.exit(1); }

    const client = BirdeyeClient.createWithConfig({ apiKey, chain: 'solana' });

    console.log('Fetching new token listings...');

    try {
        const data = await client.market.getNewListings(20);
        const tokens = data?.items ?? (Array.isArray(data) ? data : []);
        const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;

        console.log(`\nNew Listings (last 20):`);
        tokens.forEach((token: any) => {
            const isRecent = token.listingTime > oneHourAgo;
            const time = new Date((token.listingTime || token.listing_time) * 1000).toISOString();
            console.log(`${isRecent ? '🆕' : '  '} ${token.symbol || '???'} (${token.address})`);
            console.log(`   Listed:    ${time}`);
            console.log(`   Price:     $${token.price?.toFixed(8) ?? 'N/A'}`);
            console.log(`   Liquidity: $${token.liquidity?.toLocaleString() ?? 'N/A'}`);
        });
    } catch (e: any) {
        console.error('[Error]', e.message);
    }
}

run();
