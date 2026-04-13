/**
 * Example: Find trending tokens on Solana by rank.
 *
 * sort_by valid values: 'rank' | 'volumeUSD' | 'liquidity'  (NOT 'volume24hUSD')
 * sort_by and sort_type are both required.
 *
 * Run: BIRDEYE_API_KEY=xxx npx ts-node examples/market-data/trending-tokens.ts
 */

import BirdeyeClient from '../../templates/birdeye-client';

async function run() {
    const client = BirdeyeClient.create('solana');

    console.log('Fetching top trending tokens on Solana...');

    try {
        const tokens = await client.market.getTrending('rank', 'asc', 10);

        console.log(`\nTop 10 Trending Tokens (by rank):`);
        tokens.forEach((token: any, index: number) => {
            console.log(`${index + 1}. ${token.symbol || 'Unknown'} (${token.address})`);
            console.log(`   Price:     $${token.price}`);
            console.log(`   Volume:    $${token.volumeUSD?.toLocaleString()}`);
            console.log(`   Liquidity: $${token.liquidity?.toLocaleString()}`);
            console.log('---');
        });
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

run();
