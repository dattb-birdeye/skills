/**
 * Meme Token Discovery — Birdeye /defi/v3/token/meme/list
 *
 * Fetches the live meme token leaderboard (pump.fun, bonding curves, etc.)
 * and enriches with security data to surface safe high-momentum memes.
 *
 * Run: BIRDEYE_API_KEY=xxx npx ts-node examples/market-data/meme-tokens.ts
 *
 * NOTE: Do NOT pass sort_by — any value causes a 400 response.
 * Supported chains: solana, bsc, monad.
 */

const BASE = 'https://public-api.birdeye.so';

function headers(apiKey: string) {
  return {
    'X-API-KEY': apiKey,
    'x-chain': 'solana',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'application/json',
  };
}

interface MemeToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  volume24h: number;
  marketCap: number;
  priceChange24h: number;
  graduationProgress?: number; // pump.fun progress to graduation
  logoURI?: string;
}

async function getMemeList(apiKey: string, limit = 20): Promise<MemeToken[]> {
  // ⚠️ Do NOT pass sort_by — any value causes 400 "invalid sort_by parameter"
  const url = `${BASE}/defi/v3/token/meme/list?limit=${limit}`;
  const res = await fetch(url, { headers: headers(apiKey) });
  const json = await res.json() as any;
  if (!json.success) throw new Error(`Meme list failed: ${json.message}`);
  return json.data?.items ?? [];
}

async function getMemeDetail(apiKey: string, address: string): Promise<any> {
  const url = `${BASE}/defi/v3/token/meme/detail/single?address=${address}`;
  const res = await fetch(url, { headers: headers(apiKey) });
  const json = await res.json() as any;
  if (!json.success) throw new Error(`Meme detail failed: ${json.message}`);
  return json.data;
}

async function getTokenSecurity(apiKey: string, address: string): Promise<any> {
  const url = `${BASE}/defi/token_security?address=${address}`;
  const res = await fetch(url, { headers: headers(apiKey) });
  const json = await res.json() as any;
  return json.data;
}

function riskLevel(security: any): string {
  if (!security) return 'unknown';
  if (security.mintable || security.freezeable) return '🔴 HIGH';
  if ((security.creatorPercentage ?? 0) > 0.2) return '🟡 MEDIUM';
  if ((security.top10HolderPercent ?? 0) > 0.5) return '🟡 MEDIUM';
  return '🟢 LOW';
}

async function run() {
  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) { console.error('Set BIRDEYE_API_KEY env var.'); process.exit(1); }

  console.log('Fetching meme token leaderboard...\n');
  const tokens = await getMemeList(apiKey, 20);

  console.log(`Top ${tokens.length} meme tokens:\n`);
  console.log('─'.repeat(90));

  for (const token of tokens.slice(0, 10)) {
    // Get security data for top 10
    const security = await getTokenSecurity(apiKey, token.address).catch(() => null);
    const risk = riskLevel(security);

    const price = token.price?.toFixed(8) ?? 'N/A';
    const vol = token.volume24h
      ? `$${(token.volume24h / 1000).toFixed(1)}k`
      : 'N/A';
    const change = token.priceChange24h
      ? `${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(1)}%`
      : 'N/A';

    console.log(`${token.symbol.padEnd(12)} | Price: $${price} | 24h Vol: ${vol} | Change: ${change} | Risk: ${risk}`);
    console.log(`  ${token.address}`);
  }

  console.log('\nFor real-time meme token discovery, use WebSocket SUBSCRIBE_MEME channel.');
}

run().catch(console.error);
