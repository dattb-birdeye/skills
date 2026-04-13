---
name: birdeye
description: Complete Birdeye API integration for real-time DeFi data across Solana and 9 other chains. Use for token prices, OHLCV charts, market discovery, on-chain trader intelligence, holder analysis, wallet portfolio & P&L, and WebSocket streams for live prices and whale alerts.
---

# Birdeye Data Skill

Birdeye is the primary real-time market-data layer for Solana AI agents — natively indexed
against on-chain state across 8M+ tokens and 500+ AMM pools with sub-10s freshness.

## Overview

Use this skill when users ask about:
- Token prices, charts, or fundamentals (mc, volume, liquidity, holder count)
- New or trending tokens (discovery, meme tokens, new listings)
- On-chain transaction history for a token or pair
- Who's buying/selling a token (top traders, gainers)
- Wallet portfolios, net worth, or P&L tracking
- Token security/rug risk checks
- Real-time price or whale alert streams (WebSocket)
- Pay-per-request without an API key (x402 / agent-native payments)

## Instructions

1. **Check for MCP**: If `birdeye-mcp` tools are available in the environment, use them directly.
2. **Auth**: Two modes:
   - **API key** (default): Base URL `https://public-api.birdeye.so`, load key from `BIRDEYE_API_KEY`.
   - **x402 pay-per-request** (no API key): Base URL `https://public-api.birdeye.so/x402`, pay USDC per call. Use when agent has a Solana wallet but no API key. See `resources/x402.md`.
3. **MANDATORY HEADERS** on every request:
   ```
   X-API-KEY: <key>
   x-chain: solana           ← do NOT put chain in the URL
   User-Agent: Mozilla/5.0   ← REQUIRED — missing this causes 403
   Accept: application/json
   ```
4. **Pick the right endpoint** using this decision table:

| User intent | Endpoint |
|---|---|
| Token price (current) | `GET /defi/price?address=` |
| Token price (multiple) | `GET /defi/multi_price?list_address=a,b,c` |
| Chart / OHLCV candles | `GET /defi/v3/ohlcv?address=&type=1H&time_from=<unix>&time_to=<unix>` |
| Token fundamentals (mc, vol, holders) | `GET /defi/token_overview?address=` |
| Token metadata (name, symbol, logo) | `GET /defi/v3/token/meta-data/single?address=` |
| Rug / honeypot check | `GET /defi/token_security?address=` |
| New listings | `GET /defi/v2/tokens/new_listing?limit=20` |
| Trending tokens | `GET /defi/token_trending?sort_by=rank&sort_type=asc&limit=20` |
| Meme tokens | `GET /defi/v3/token/meme/list?limit=20` ← NO sort_by (causes 400) |
| Search tokens or pairs | `GET /defi/v3/search?keyword=&chain=solana&target=token&sort_by=liquidity&sort_type=desc` |
| Liquidity pools for a token | `GET /defi/v2/markets?address=&time_frame=24h&sort_by=liquidity&sort_type=desc` |
| Pair stats | `GET /defi/v3/pair/overview/single?address=<PAIR>` |
| Token trade history | `GET /defi/v3/token/txs?address=&tx_type=swap&limit=50` |
| Top traders for a token | `GET /defi/v2/tokens/top_traders?address=&time_frame=24h&sort_by=volume&sort_type=desc` |
| Best on-chain traders | `GET /trader/gainers-losers?type=today&sort_by=PnL&sort_type=desc` |
| Token holder list | `GET /defi/v3/token/holder?address=&limit=100` |
| Holder concentration | `GET /holder/v1/distribution?token_address=` ← note: **token_address** param |
| Wallet balance / net worth | `GET /wallet/v2/current-net-worth?wallet=&sort_type=desc` ← sort_type required |
| Wallet P&L | `GET /wallet/v2/pnl/summary?wallet=` ← PRO tier only |
| Wallet transaction history | `GET /v1/wallet/tx_list?wallet=&limit=50` |
| Real-time price stream | WebSocket `SUBSCRIBE_PRICE` ← Business tier+ |
| Whale alerts | WebSocket `SUBSCRIBE_LARGE_TRADE_TXS` ← Business tier+ |

5. **Rate limits by tier**: Standard 1 rps · Lite 15 rps · Premium 50 rps · Business 100 rps. Wallet endpoints have an additional cap: **30 RPS / 150 RPM** per endpoint. Token List Scroll is only **2 RPS**.
6. **WebSocket** (Business tier+): `wss://public-api.birdeye.so/socket/{chain}?x-api-key=KEY` — chain in URL path, NOT header. Required headers: `Origin: ws://public-api.birdeye.so`, `Sec-WebSocket-Protocol: echo-protocol`.
7. **Need full param list for an endpoint?** → Read `resources/api-reference.md`
8. **Don't know which endpoint to use?** → Read `resources/intent-index.md` (keyword → endpoint)
9. **Need pagination (offset / cursor / time-based)?** → Read `resources/pagination.md`
10. **Need chain support per endpoint?** → Read `resources/supported-networks.md`
11. **Need WebSocket setup?** → Read `resources/websocket.md`
12. **Need x402 pay-per-request?** → Read `resources/x402.md`, then use `examples/x402/pay-per-request.ts`
13. **Need a working code example?** → Read the matching file in `examples/` (see Skill Structure below)

## Examples

```typescript
import BirdeyeClient from './templates/birdeye-client';
const client = BirdeyeClient.create('solana'); // reads BIRDEYE_API_KEY
```

### Token Overview

User: "What's the market cap and liquidity of [Token]?"

```typescript
const data = await client.token.getOverview(address);
// data.price, data.marketCap, data.fdv, data.liquidity, data.volume24h, data.holder
// data.priceChange1hPercent, data.priceChange24hPercent
```

### OHLCV Chart

User: "Show me the 1h chart for SOL"

```typescript
const now = Math.floor(Date.now() / 1000);
const data = await client.price.getOHLCV(WSOL, '1H', now - 86400, now);
// data.items[].unixTime, .open, .high, .low, .close, .volume
// NOTE: time_from and time_to are required — omitting them causes empty response
```

### Wallet P&L (PRO)

User: "Analyze profit/loss for wallet X"

```typescript
const data = await client.wallet.getPnL(walletAddress);
// data.summary.pnl.realized_profit_usd
// data.summary.counts.win_rate, .total_trade
// data.summary.cashflow_usd.total_invested
// ⚠️ PRO tier only — returns 403 on Standard/Lite
```

### Token Security Check

User: "Is this token safe? [address]"

```typescript
const data = await client.token.getSecurity(address);
// data.creatorPercentage > 0.20 → high rug risk
// data.mintable === true → inflation risk
// data.top10HolderPercent > 0.5 → concentration risk
```

### Wallet Portfolio

User: "Show portfolio for wallet X"

```typescript
const data = await client.wallet.getNetWorth(wallet);

// ⚠️ ACTUAL FIELD NAMES (snake_case, not camelCase):
//   data.total_value  → string  (NOT totalUsd)
//   item.amount       → number  (token balance — NOT balance)
//   item.value        → string  (USD value — NOT valueUsd) — coerce: Number(item.value)
//   item.price        → number  (NOT priceUsd)

const total = Number(data.total_value ?? 0);   // total_value, not totalUsd
console.log(`Total: $${total.toFixed(2)}`);

for (const item of data.items ?? []) {
    const bal = item.amount;                    // amount is already a number
    const val = Number(item.value ?? 0);        // value is a string — coerce
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
    console.log(`${item.symbol}: ${bal.toFixed(4)} = $${val.toFixed(2)} (${pct}%)`);
}
```

### Wallet Transaction History

User: "Show recent swaps for wallet X"

```typescript
const data = await client.wallet.getTxHistory(wallet, 50);

// ⚠️ ACTUAL FIELD SHAPES on /v1/wallet/tx_list:
//   tx.blockTime  → ISO string "2026-04-13T06:10:38+00:00"  (NOT a unix number)
//   tx.from / to  → plain wallet address string              (NOT objects with .symbol)
//   token info    → tx.balanceChange[].symbol / .amount

// Parse time correctly — blockTime is ISO string, NOT unix
const when = new Date(tx.blockTime).getTime();           // ✅
// const when = tx.blockTime * 1000;                     // ❌ NaN

// Token symbols come from balanceChange[], not from/to
const received = tx.balanceChange
    .filter((b: any) => b.amount > 0)
    .map((b: any) => `+${b.amount.toFixed(4)} ${b.symbol}`)
    .join(', ');
```

## Guidelines

- **DO** use correct field names from `/wallet/v2/current-net-worth` — API returns `data.total_value` (string), `item.amount` (number), `item.value` (string), `item.price` (number). Using camelCase aliases (`totalUsd`, `balance`, `valueUsd`) returns `undefined`.
- **DO** coerce `item.value` and `data.total_value` with `Number()` before arithmetic — they are strings. `item.amount` is already a number.
- **DO** parse `tx.blockTime` from `/v1/wallet/tx_list` with `new Date(tx.blockTime)` — it is an ISO string, not a unix timestamp. Using `tx.blockTime * 1000` produces `NaN`.
- **DO** read token symbols from `tx.balanceChange[].symbol` — `tx.from` and `tx.to` are plain wallet address strings, not objects with `.symbol`.
- **DO** always set `User-Agent: Mozilla/5.0` — absence causes 403.
- **DO** set `x-chain: solana` header (not in URL path).
- **DO** use `/defi/multi_price` for batch price checks — never loop `/defi/price`.
- **DO** use `token_address=` (not `address=`) for `/holder/v1/distribution`.
- **DON'T** pass `type=gainers` or `type=losers` to `/trader/gainers-losers` — they cause 400. Use `type=today`, `type=yesterday`, or `type=1W`.
- **DON'T** omit `sort_by`/`sort_type` from `/defi/v2/markets`, `/defi/v3/search`, `/trader/gainers-losers` — required on these endpoints.
- **DON'T** pass `sort_by` to `/defi/v3/token/meme/list` — not supported, causes 400. Only pass `limit`.
- **DON'T** use `v24hUSD` or `volume24h` as `sort_by` for `/defi/v3/token/list` — valid values: `liquidity`, `fdv`, `market_cap`, `holder`.
- **DON'T** call wallet endpoints faster than 150 RPM sustained (30 RPS burst) — these limits apply across all plans.
- **DON'T** call `/defi/v3/token/list/scroll` faster than 2 RPS — it has a uniquely low rate limit.
- **DON'T** expose `X-API-KEY` in agent responses.
- **DON'T** call PRO-only endpoints (`/wallet/v2/pnl/*`, `/smart-money/*`) without confirming tier.

## Common Errors

### 403 Forbidden
Cause: Missing or bot-flagged `User-Agent`.
Fix: `"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"`

### 401 Unauthorized
Cause: Missing or invalid `X-API-KEY`.
Fix: Load from `process.env.BIRDEYE_API_KEY`.

### 404 Not Found
Cause: Token doesn't exist on the specified chain.
Fix: Verify address and `x-chain` header value.

### 429 Too Many Requests
Cause: Rate limit exceeded. Global limit varies by tier (Standard 1 rps, Lite 15 rps, Premium 50 rps, Business 100 rps). Wallet endpoints have an additional per-endpoint cap: **30 RPS burst / 150 RPM sustained**.
Fix: Exponential backoff (1s → 2s → 4s → 8s → 16s cap). For wallet endpoints, space calls ≥500ms apart.

### 400 on `/holder/v1/distribution`
Cause: Passed `address=` instead of `token_address=`.
Fix: Use `?token_address=<address>`.

## Skill Structure

```
birdeye/
├── SKILL.md                              # This file — agent instructions & quick reference
├── docs/
│   └── troubleshooting.md               # Common errors, root causes, and fixes
├── resources/
│   ├── api-reference.md                 # Complete endpoint table with all params
│   ├── error-handling.md                # HTTP codes, retry pattern, rate limit table
│   ├── intent-index.md                  # Keyword → endpoint fast lookup for agents
│   ├── pagination.md                    # Offset, scroll, time-based, cursor patterns
│   ├── supported-networks.md            # x-chain values and per-endpoint chain support
│   └── websocket.md                     # WebSocket connection, channels, heartbeat
├── examples/
│   ├── holder-data/
│   │   └── holder-distribution.ts       # Top holders + concentration analysis
│   ├── market-data/
│   │   ├── meme-tokens.ts               # Meme leaderboard + security enrichment
│   │   ├── new-listings.ts              # New token listings
│   │   ├── ohlcv-chart.ts               # OHLCV candle data
│   │   └── trending-tokens.ts           # Trending tokens by rank
│   ├── pair-data/
│   │   └── pair-overview.ts             # Pair/pool stats
│   ├── price-ohlcv/
│   │   └── price-and-ohlcv.ts          # Price + chart in one flow
│   ├── token-data/
│   │   ├── token-overview.ts            # Full token fundamentals
│   │   └── token-security.ts            # Rug / honeypot check
│   ├── trader-intelligence/
│   │   ├── gainers-losers.ts            # Top on-chain traders by P&L
│   │   ├── smart-money.ts               # Smart money accumulation/distribution (PRO)
│   │   └── top-traders.ts               # Top traders per token
│   ├── transactions/
│   │   └── token-trades.ts              # Token trade history
│   ├── wallet-intelligence/
│   │   ├── wallet-pnl.ts                # Wallet P&L analysis (PRO)
│   │   ├── wallet-portfolio.ts          # Net worth + token balances
│   │   └── wallet-tx-history.ts         # Transaction history with swap detection
│   ├── websocket/
│   │   ├── live-price-stream.ts         # Real-time price via SUBSCRIBE_PRICE
│   │   └── whale-alert.ts               # Whale trades via SUBSCRIBE_LARGE_TRADE_TXS
│   └── x402/
│       └── pay-per-request.ts           # Pay-per-request with USDC (no API key)
└── templates/
    └── birdeye-client.ts                # Production-ready TypeScript client with sub-clients
```

## External docs (for humans)

- [Birdeye API Reference](https://docs.birdeye.so/reference)
- [Birdeye x402 docs](https://docs.birdeye.so/reference/x402)
- [Data Accessibility by Package Tier](https://docs.birdeye.so/docs/data-accessibility-by-packages)
- [Birdeye Developer Portal (API Keys)](https://bds.birdeye.so)
