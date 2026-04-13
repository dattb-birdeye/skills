/**
 * Smart Money Signals — Birdeye GET /smart-money/v1/token/list
 *
 * Identifies tokens being accumulated or distributed by Birdeye-classified
 * "smart money" wallets (historically profitable, high-capital traders).
 *
 * Run: BIRDEYE_API_KEY=xxx npx ts-node examples/trader-intelligence/smart-money.ts
 *
 * ⚠️ Requires PRO tier or higher.
 * ⚠️ Solana only.
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

interface SmartMoneyToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  netFlow: number;       // net USD flow from smart money (+ = accumulation, - = distribution)
  buyVolume: number;
  sellVolume: number;
  uniqueBuyers: number;
  uniqueSellers: number;
}

// Accumulation signal: sort by net_flow descending (smart money buying)
async function getSmartMoneyAccumulation(apiKey: string, limit = 20): Promise<SmartMoneyToken[]> {
  const params = new URLSearchParams({
    sort_by: 'net_flow',
    sort_type: 'desc',
    limit: String(limit),
    offset: '0',
  });
  const url = `${BASE}/smart-money/v1/token/list?${params}`;
  const res = await fetch(url, { headers: headers(apiKey) });
  const json = await res.json() as any;
  if (!json.success) throw new Error(`Smart money API failed: ${json.message}`);
  return json.data?.items ?? [];
}

// Distribution signal: sort by net_flow ascending (smart money selling)
async function getSmartMoneyDistribution(apiKey: string, limit = 10): Promise<SmartMoneyToken[]> {
  const params = new URLSearchParams({
    sort_by: 'net_flow',
    sort_type: 'asc',
    limit: String(limit),
    offset: '0',
  });
  const url = `${BASE}/smart-money/v1/token/list?${params}`;
  const res = await fetch(url, { headers: headers(apiKey) });
  const json = await res.json() as any;
  if (!json.success) throw new Error(`Smart money API failed: ${json.message}`);
  return json.data?.items ?? [];
}

function formatUSD(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

async function run() {
  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) { console.error('Set BIRDEYE_API_KEY env var.'); process.exit(1); }

  console.log('=== Smart Money Accumulation (top buys) ===\n');
  const accumulating = await getSmartMoneyAccumulation(apiKey, 10);
  for (const t of accumulating) {
    console.log(
      `🟢 ${(t.symbol ?? t.address.slice(0, 8)).padEnd(12)} ` +
      `| Net flow: ${formatUSD(t.netFlow)} ` +
      `| Buyers: ${t.uniqueBuyers} wallets ` +
      `| Buy vol: ${formatUSD(t.buyVolume)}`
    );
  }

  console.log('\n=== Smart Money Distribution (top sells) ===\n');
  const distributing = await getSmartMoneyDistribution(apiKey, 10);
  for (const t of distributing) {
    console.log(
      `🔴 ${(t.symbol ?? t.address.slice(0, 8)).padEnd(12)} ` +
      `| Net flow: ${formatUSD(t.netFlow)} ` +
      `| Sellers: ${t.uniqueSellers} wallets ` +
      `| Sell vol: ${formatUSD(t.sellVolume)}`
    );
  }

  console.log('\nCombine with birdeye-market-data for price/volume context.');
  console.log('Combine with birdeye-holder-analysis for concentration risk.');
}

run().catch(console.error);
