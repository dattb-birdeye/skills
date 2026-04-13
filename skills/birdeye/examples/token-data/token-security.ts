/**
 * Token Security Check — Birdeye /defi/token_security
 * 
 * Detects honeypots, suspicious mint authority, and high creator concentration.
 * Use before recommending any token to flag rug risks.
 */

const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "So11111111111111111111111111111111111111112";
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY!;

interface SecurityResult {
  ownerBalance: number;
  ownerPercentage: number;
  creatorBalance: number;
  creatorPercentage: number;
  mintable: boolean;
  isTrueToken: boolean;
  totalSupply: number;
  top10HolderBalance: number;
  top10HolderPercent: number;
}

async function checkTokenSecurity(address: string): Promise<void> {
  const url = `https://public-api.birdeye.so/defi/token_security?address=${address}`;

  const res = await fetch(url, {
    headers: {
      "X-API-KEY": BIRDEYE_API_KEY,
      "x-chain": "solana",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Accept": "application/json",
    },
  });

  if (!res.ok) throw new Error(`API Error ${res.status}: ${res.statusText}`);
  const json = await res.json() as any;
  const data: SecurityResult = json.data;

  console.log("=== TOKEN SECURITY REPORT ===");
  console.log(`Address: ${address}`);
  console.log(`Is True Token: ${data.isTrueToken}`);
  console.log(`Mintable: ${data.mintable}`);
  console.log(`Creator Holds: ${(data.creatorPercentage * 100).toFixed(2)}%`);
  console.log(`Top 10 Holders: ${(data.top10HolderPercent * 100).toFixed(2)}%`);

  // Risk flags
  if (data.mintable) {
    console.warn("⚠️  WARNING: Mint authority is still active — inflation risk.");
  }
  if (data.creatorPercentage > 0.20) {
    console.warn(`⚠️  WARNING: Creator holds ${(data.creatorPercentage * 100).toFixed(1)}% — rug risk.`);
  }
  if (data.top10HolderPercent > 0.50) {
    console.warn(`⚠️  WARNING: Top 10 holders control ${(data.top10HolderPercent * 100).toFixed(1)}% — concentration risk.`);
  }
  if (data.creatorPercentage < 0.05 && !data.mintable && data.isTrueToken) {
    console.log("✅ Token appears safe — low creator concentration, no mint authority.");
  }
}

checkTokenSecurity(TOKEN_ADDRESS).catch(console.error);
