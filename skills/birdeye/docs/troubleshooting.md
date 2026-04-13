# Troubleshooting Guide

Common issues when building with Birdeye's API — verified against live API responses.

---

## 1. `403 Forbidden` on every request

**Cause**: Birdeye blocks common bot User-Agents (`node-fetch`, `python-requests`, `axios` defaults).
**Fix**: Explicitly set a browser-like `User-Agent`.

```typescript
const headers = {
  "X-API-KEY": process.env.BIRDEYE_API_KEY,
  "x-chain": "solana",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", // CRITICAL
  "Accept": "application/json"
};
```

---

## 2. Wallet history missing swaps

**Cause**: Complex DeFi routes (Raydium, Pump.fun, Jupiter aggregated) classify as `mainAction: "unknown"`.
**Fix**: Don't filter strictly on `"swap"`. A real buy typically has:
1. `mainAction` is `"swap"`, `"buy"`, or `"unknown"`
2. `balanceChange` is positive (`> 0`)
3. Token is an altcoin/memecoin (not SOL or USDC)

```typescript
const swaps = txs.items.filter((tx: any) =>
  ['swap', 'buy', 'unknown'].includes(tx.mainAction)
);
```

---

## 3. `429 Too Many Requests`

**Cause**: Exceeded rate limits. Especially common with wallet APIs.
**Fix**: Exponential backoff; for wallet endpoints, space calls ~500ms apart to stay under the 150 RPM sustained cap.

```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 4): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    if (res.status === 429 || res.status >= 500) {
      if (attempt === maxRetries) throw new Error(`Failed after ${maxRetries} retries: ${res.status}`);
      const delay = Math.min(1000 * Math.pow(2, attempt), 16000); // 1s → 2s → 4s → 8s → 16s cap
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(`API error ${res.status}: ${(body as any).message || res.statusText}`);
  }
  throw new Error('Unreachable');
}

// Wallet endpoints: 150 RPM sustained = 1 call per ~400ms. 500ms adds a safe buffer.
async function walletFetch(url: string, headers: HeadersInit): Promise<any> {
  const res = await fetch(url, { headers });
  await new Promise(r => setTimeout(r, 500)); // safe for 150 RPM cap
  if (!res.ok) throw new Error(`Wallet API error ${res.status}`);
  return res.json();
}
```

> **Wallet API rate limits** (per-endpoint): **30 RPS burst / 150 RPM sustained** across all plans, on top of the global tier cap. On Standard (1 RPS global), the tier limit binds first. On Business (100 RPS global), sequence wallet calls to stay under 150 RPM.
>
> **Token List Scroll** (`/defi/v3/token/list/scroll`): only **2 RPS** — add a 500ms delay between scroll calls.
>
> **Global tier limits**: Standard 1 rps · Lite 15 rps · Premium 50 rps · Business 100 rps.

---

## 4. Wrong network — `404` or empty data

**Cause**: Birdeye defaults to Solana if `x-chain` is not set.
**Fix**: Set `x-chain` header. Do **not** change the base URL.

```typescript
headers['x-chain'] = 'base'; // or: "ethereum" | "arbitrum" | "bsc" | "solana"
```

Supported chains: `solana`, `ethereum`, `bsc`, `base`, `arbitrum`, `optimism`, `polygon`, `zksync`, `sui`, `tron`

---

## 5. PRO-only endpoints returning `403`

**Cause**: Endpoint requires PRO or higher subscription.
**Fix**: Verify tier at [bds.birdeye.so](https://bds.birdeye.so). PRO-gated endpoints:
- `GET /wallet/v2/pnl/summary` — P&L summary
- `GET /wallet/v2/pnl` — P&L full detail
- `GET /wallet/v2/pnl/details` — P&L per-token breakdown
- `GET /wallet/v2/pnl/multiple` — P&L batch wallets
- `GET /smart-money/v1/token/list` — Smart money signals

---

## 6. `400` from `/holder/v1/distribution`

**Cause**: Using `address=` instead of the required `token_address=` param.
**Fix**:
```bash
# Wrong:
GET /holder/v1/distribution?address=So111...
# Correct:
GET /holder/v1/distribution?token_address=So111...
```

---

## 7. `/trader/gainers-losers` returns `"type invalid format"`

**Cause**: Using `"gainers"` or `"losers"` as the `type` value — these are NOT valid enum values.
**Fix**: Use `type=today`, `type=yesterday`, or `type=1W`. All three params (`type`, `sort_by`, `sort_type`) are required. Note: there is no `time_frame` param on this endpoint.

```typescript
// Wrong — causes 400 (invalid type value):
GET /trader/gainers-losers?type=gainers&sort_by=PnL

// Wrong — causes 400 (missing required params):
GET /trader/gainers-losers?sort_by=PnL&time_frame=24h

// Correct:
GET /trader/gainers-losers?type=today&sort_by=PnL&sort_type=desc&limit=10
```

---

## 8. Batch / "multiple" endpoints returning `403`

**Cause**: Most batch endpoints require Business tier or higher.
**Fix**: On Standard/Lite, loop single-address endpoints with rate limiting.

> Per Birdeye docs: "The LITE/STARTER package can only access the multiple price API; all other 'multiple' APIs are not accessible."

---

## 9. WebSocket disconnects or fails to authenticate

**Requires Business tier+.** Chain goes in the **URL path**, not a header. Required connection headers: `Origin` and `Sec-WebSocket-Protocol`.

```typescript
import WebSocket from 'ws';

const chain = 'solana'; // replace with target chain
const ws = new WebSocket(
  `wss://public-api.birdeye.so/socket/${chain}?x-api-key=${API_KEY}`,
  {
    headers: {
      'Origin': 'ws://public-api.birdeye.so',
      'Sec-WebSocket-Protocol': 'echo-protocol',
    },
  } as any
);

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE_PRICE',
    data: { address: 'So11111111111111111111111111111111111111112', currency: 'usd', type: '1H' }
  }));
});
```

**Note**: `SUBSCRIBE_LARGE_TRADE_TXS`, `SUBSCRIBE_TOKEN_NEW_LISTING`, `SUBSCRIBE_NEW_PAIR` use params at the **top level** (no `data` wrapper):
```json
{ "type": "SUBSCRIBE_LARGE_TRADE_TXS", "min_volume": 10000 }
```

Available channels: `SUBSCRIBE_PRICE` · `SUBSCRIBE_TXS` · `SUBSCRIBE_BASE_QUOTE_PRICE` · `SUBSCRIBE_TOKEN_NEW_LISTING` · `SUBSCRIBE_NEW_PAIR` · `SUBSCRIBE_LARGE_TRADE_TXS` · `SUBSCRIBE_WALLET_TXS` · `SUBSCRIBE_TOKEN_STATS` · `SUBSCRIBE_MEME`

---

## 10. `/defi/v3/token/meme/list` returns `400` with sort_by

**Cause**: The `sort_by` param is not supported by this endpoint.
**Fix**: Omit `sort_by`. Results return by recent meme activity by default.

```bash
# Wrong:
GET /defi/v3/token/meme/list?sort_by=volume24hUSD

# Correct:
GET /defi/v3/token/meme/list?limit=20
```

---

## 11. Check remaining API credits

```typescript
const credits = await client.getCredits();
console.log(credits); // total credits, used, reset_at
```

Use proactively to avoid unexpected suspension on metered tiers.
