# Birdeye API Reference

Complete endpoint reference for AI Agents. Every path below is **live-tested** with the real API.

**Base URL:** `https://public-api.birdeye.so`

**Required headers on every request:**
```http
X-API-KEY: <YOUR_API_KEY>
x-chain: solana        # or: ethereum, bsc, base, arbitrum, optimism, polygon, zksync, sui, tron
User-Agent: Mozilla/5.0
Accept: application/json
```
Missing `User-Agent` → **403**. Missing `X-API-KEY` → **401**. Wrong `x-chain` → empty data.

---

## 1. Price & OHLCV

| Intent | Endpoint | Tier |
|---|---|---|
| Single token latest price | `GET /defi/price?address=` | Standard+ |
| Multiple token prices (batch) | `GET /defi/multi_price?list_address=a,b,c` or `POST /defi/multi_price` (body: `{"list_address":"a,b,c"}`) | Standard+ |
| Price + Volume (single) | `GET /defi/price_volume/single?address=` | Standard+ |
| Price + Volume (multiple) | `GET /defi/price_volume/multi` | Business+ |
| Historical price at a single unix timestamp | `GET /defi/historical_price_unix?address=&unixtime=<unix>` | Standard+ |
| OHLCV candles (V3 — preferred) | `GET /defi/v3/ohlcv?address=&type=1H` | Standard+ |
| OHLCV candles (V1 — legacy) | `GET /defi/ohlcv?address=&type=1D` | Standard+ |
| OHLCV for a pair (V3) | `GET /defi/v3/ohlcv/pair?address=<PAIR>&type=1H` | Standard+ |
| OHLCV base/quote | `GET /defi/ohlcv/base_quote?base_address=&quote_address=&type=` | Standard+ |
| Historical price by time range | `GET /defi/history_price?address=&address_type=token&type=1H&time_from=<unix>&time_to=<unix>` | Standard+ |
| Price stats (% change, high/low) — single | `GET /defi/v3/price/stats/single?address=` | Standard+ |
| Price stats — batch | `POST /defi/v3/price/stats/multiple` (body: `{"list_address":["..."]}`) | Business+ |

**OHLCV `type` values:**
`1s` `15s` `30s` (V3 only) · `1m` `3m` `5m` `15m` `30m` · `1H` `2H` `4H` `6H` `8H` `12H` · `1D` `3D` `1W` `1M`

---

## 2. Token Data

| Intent | Endpoint | Tier |
|---|---|---|
| Full overview (price, mc, fdv, liquidity, volume, holders, priceChange*) | `GET /defi/token_overview?address=` | Standard+ |
| Metadata (name, symbol, decimals, logo, extensions) | `GET /defi/v3/token/meta-data/single?address=` | Standard+ |
| Metadata — batch | `GET /defi/v3/token/meta-data/multiple` | Business+ |
| Market data (price, mc, FDV) | `GET /defi/v3/token/market-data?address=` | Standard+ |
| Market data — batch | `GET /defi/v3/token/market-data/multiple` | Business+ |
| Trade data (volume, trade count) — single | `GET /defi/v3/token/trade-data/single?address=` | Standard+ |
| Trade data — batch | `GET /defi/v3/token/trade-data/multiple` (query: `list_address=a,b`) | Business+ |
| Security check (mint authority, creator %, honeypot) | `GET /defi/token_security?address=` | Standard+ |
| Creation info (creator, timestamp) | `GET /defi/token_creation_info?address=` | Standard+ |
| Exit liquidity risk score — single | `GET /defi/v3/token/exit-liquidity?address=` | Standard+ |
| Exit liquidity risk score — batch | `GET /defi/v3/token/exit-liquidity/multiple?list_address=a,b` | Standard+ |
| Paginated token list V3 | `GET /defi/v3/token/list?sort_by=liquidity&sort_type=desc&offset=0&limit=50` | Standard+ |
| Token list V3 (cursor-based) | `GET /defi/v3/token/list/scroll?sort_by=liquidity&sort_type=desc` | Standard+ |
| Token list V1 (legacy) | `GET /defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=50&min_liquidity=100` | Standard+ |
| Mint/burn transactions | `GET /defi/v3/token/mint-burn-txs?address=&sort_by=block_time&sort_type=desc&type=all` | Standard+ |

**`/defi/v3/token/list` `sort_by` valid values (live-tested):** `liquidity` · `fdv` · `market_cap` · `holder` — `v24hUSD`, `volume24h`, `price` all return 400.

**`/defi/tokenlist` (V1 legacy) `sort_by`:** `v24hUSD` · `liquidity` — this endpoint is the ONLY one where `v24hUSD` is valid. Use V3 for new code.

**⚠️ `/defi/v3/token/meme/list` does NOT support `sort_by`** — any value returns 400. Omit it; only pass `limit`.

---

## 3. Market Discovery & Alpha

| Intent | Endpoint | Tier |
|---|---|---|
| Trending tokens | `GET /defi/token_trending?sort_by=rank&sort_type=asc&limit=20` | Standard+ |
| New listings | `GET /defi/v2/tokens/new_listing?limit=20` | Standard+ |
| Meme token leaderboard | `GET /defi/v3/token/meme/list?limit=20` | Standard+ |
| Meme token detail | `GET /defi/v3/token/meme/detail/single?address=` | Standard+ |
| Smart Money signals | `GET /smart-money/v1/token/list` | PRO Only |
| Search tokens / pairs | `GET /defi/v3/search?keyword=BONK&chain=solana&target=token&sort_by=liquidity&sort_type=desc&limit=20` | Standard+ |
| Supported chains | `GET /defi/networks` | Standard+ |

**`/defi/token_trending` `sort_by` values:** `rank` · `volumeUSD` · `liquidity` (NOT `volume24hUSD`)

**`/defi/v3/search` required params:** `sort_by`, `sort_type`. Optional: `keyword`, `chain` (same value as x-chain header), `target` (`token`/`market`/`all`), `search_by` (`combination`/`address`/`name`/`symbol`), `verify_token`, `markets`, `limit`, `offset`

---

## 4. Pair & Market Data

| Intent | Endpoint | Tier |
|---|---|---|
| All markets for a token | `GET /defi/v2/markets?address=&time_frame=24h&sort_by=liquidity&sort_type=desc` | Standard+ |
| Pair stats (single) | `GET /defi/v3/pair/overview/single?address=<PAIR_ADDRESS>` | Standard+ |
| Pair stats (batch) | `GET /defi/v3/pair/overview/multiple` | Business+ |

---

## 5. Transactions

| Intent | Endpoint | Tier |
|---|---|---|
| Token trades — V3 (preferred) | `GET /defi/v3/token/txs?address=&tx_type=swap&limit=50` | Standard+ |
| Token trades — V1 (legacy) | `GET /defi/txs/token?address=&offset=0&limit=20` | Standard+ |
| Token trades by volume | `GET /defi/v3/token/txs-by-volume?token_address=&volume_type=usd&sort_type=desc` | Standard+ |
| Token trades seek by time | `GET /defi/txs/token/seek_by_time?address=&before_time=<unix>` | Standard+ |
| Pair trades | `GET /defi/txs/pair?address=<PAIR>&limit=50` | Standard+ |
| Pair trades seek by time | `GET /defi/txs/pair/seek_by_time?address=<PAIR>&before_time=<unix>` | Standard+ |
| Trader txs seek by time | `GET /trader/txs/seek_by_time?address=&before_time=<unix>` | Standard+ |
| Recent DeFi transactions | `GET /defi/v3/txs/recent` | Standard+ |
| All DeFi transactions | `GET /defi/v3/txs` | Standard+ |
| Latest indexed block | `GET /defi/v3/txs/latest-block` | Standard+ |
| Token transfer history | `POST /token/v1/transfer` (body: `{"token_address":"...","limit":100}`) | Standard+ |
| Token transfer count | `POST /token/v1/transfer/total` (body: `{"token_address":"..."}`) | Standard+ |
| Wallet transfer history | `POST /wallet/v2/transfer` (body: `{"wallet":"...","limit":100}`) | Standard+ |
| Wallet transfer count | `POST /wallet/v2/transfer/total` (body: `{"wallet":"..."}`) | Standard+ |

**`/defi/v3/token/txs` `tx_type` values:** `swap` · `buy` · `sell` · `add` · `remove` · `all`

---

## 6. Trader Intelligence

| Intent | Endpoint | Tier |
|---|---|---|
| Top traders for a token | `GET /defi/v2/tokens/top_traders?address=&time_frame=24h&sort_by=volume&sort_type=desc&limit=10` | Standard+ |
| Top gainers on-chain | `GET /trader/gainers-losers?type=today&sort_by=PnL&sort_type=desc&limit=10` | Standard+ |
| All-time trade stats — single | `GET /defi/v3/all-time/trades/single?address=&time_frame=24h` | Standard+ |
| All-time trade stats — batch | `POST /defi/v3/all-time/trades/multiple` (query: `time_frame=24h&list_address=a,b`) | Business+ |

**`top_traders` `time_frame`:** `30m` · `1h` · `2h` · `4h` · `6h` · `8h` · `12h` · `24h` — `sort_type` is required.

**`gainers-losers` `type` values:** `today` · `yesterday` · `1W` — all three params (`type`, `sort_by`, `sort_type`) are required. `sort_by` only accepts `PnL`. Using `'gainers'`/`'losers'` as type value causes 400.

**`all-time/trades/single` required params:** `address` + `time_frame` (e.g. `24h`, `1W`, `1M`). Omitting `time_frame` causes empty response.

---

## 7. Holder Data

| Intent | Endpoint | Tier |
|---|---|---|
| Paginated holder list | `GET /defi/v3/token/holder?address=&limit=100` | Standard+ |
| Holder concentration distribution | `GET /holder/v1/distribution?token_address=` | Standard+ |
| Batch holder balance check | `POST /token/v1/holder/batch` (body: `{"wallets":["..."],"token_address":"..."}`) | Business+ |

**⚠️ `/holder/v1/distribution` uses `token_address=` param — NOT `address=`** (confirmed: `address` returns 400).

**Distribution response shape:**
```json
{
  "token_address": "...",
  "summary": { "wallet_count": 10, "total_holding": "7414414.1", "percent_of_supply": 1.18 },
  "holders": [{ "wallet": "...", "holding": "4314420.6", "percent_of_supply": 0.69 }]
}
```

---

## 8. Wallet Intelligence

| Intent | Endpoint | Tier |
|---|---|---|
| Current net worth + token list | `GET /wallet/v2/current-net-worth?wallet=&sort_type=desc` | Standard+ |
| Historical net worth chart | `GET /wallet/v2/net-worth?wallet=&sort_type=desc&type=1H&count=7&direction=back` | Standard+ |
| Net worth at point-in-time | `GET /wallet/v2/net-worth-details?wallet=&sort_type=desc` | Standard+ |
| Net worth batch (multiple wallets) | `POST /wallet/v2/net-worth-summary/multiple` (body: `{"wallets":["..."]}`) | Business+ |
| Token balance list | `GET /v1/wallet/token_list?wallet=` | Standard+ |
| Token balance V1 (single token) | `GET /v1/wallet/token_balance?wallet=&token_address=` | Standard+ |
| Token balance V2 (single token) | `GET /wallet/v2/token-balance?wallet=&token_address=` | Standard+ |
| Token balance V2 (batch wallets) | `POST /wallet/v2/token-balance` (body: `{"wallet":"...","token_addresses":["..."]}`) | Business+ |
| Balance change over time | `GET /wallet/v2/balance-change?address=&time_from=&time_to=` | Standard+ |
| P&L summary | `GET /wallet/v2/pnl/summary?wallet=&duration=all` | PRO Only |
| P&L per token (GET) | `GET /wallet/v2/pnl?wallet=&token_addresses=addr1,addr2` | PRO Only |
| P&L per token (POST, with filters) | `POST /wallet/v2/pnl/details` (body: `{"wallet":"...","token_addresses":["..."],"duration":"all","sort_by":"last_trade","sort_type":"desc"}`) | PRO Only |
| P&L across wallets for one token | `GET /wallet/v2/pnl/multiple?token_address=&wallets=addr1,addr2` | PRO Only |
| Transaction history V1 | `GET /v1/wallet/tx_list?wallet=&limit=50` | Standard+ |
| Transaction history V2 | `GET /wallet/tx_list?wallet=` | Standard+ |
| First funded transaction | `POST /wallet/v2/tx/first-funded` (body: `{"wallets":["..."]}`) | Standard+ |
| Simulate transaction | `POST /v1/wallet/simulate` | Standard+ |
| Supported chains | `GET /v1/wallet/list_supported_chain` | Standard+ |

**⚠️ Wallet APIs:** Per-endpoint cap of **30 RPS burst / 150 RPM sustained** across all packages. Also subject to the tier's global rps limit (Standard: 1 rps, Lite: 15 rps, Premium: 50 rps, Business: 100 rps). Sequence calls; avoid parallelizing wallet requests.

**`sort_type` required** on all `/wallet/v2/net-worth*` endpoints — omitting it causes 400.

**`/wallet/v2/net-worth` optional params:** `type` (interval: `1H`·`1D`·`1W`), `count` (number of data points), `direction` (`back`/`forward`), `time` (ISO datetime anchor).

**`/wallet/v2/pnl/multiple` params:** `token_address` (single token) + `wallets` (comma-separated wallet addresses in query string).

**P&L summary response shape:**
```json
{
  "summary": {
    "counts": { "total_buy": 0, "total_sell": 0, "total_trade": 0, "win_rate": 0 },
    "cashflow_usd": { "total_invested": 0, "total_sold": 0 },
    "pnl": { "realized_profit_usd": 0, "realized_profit_percent": 0 }
  }
}
```
`duration` values: `all` · `90d` · `30d` · `7d` · `24h`

**GOTCHA:** `/v1/wallet/tx_list` — many real swaps on Raydium/Pump.fun return `mainAction: "unknown"`.
Filter by `balanceChange > 0` instead of strictly matching `mainAction === "swap"`.

---

## 9. Utility

| Intent | Endpoint | Tier |
|---|---|---|
| Remaining API credits | `GET /utils/v1/credits` | All |

---

## 10. WebSocket (Real-Time)

**Requires Business tier+.**  
**URL:** `wss://public-api.birdeye.so/socket/{chain}?x-api-key=YOUR_KEY` — chain in URL path, NOT a header.  
**Required connection headers:** `Origin: ws://public-api.birdeye.so` · `Sec-WebSocket-Protocol: echo-protocol`

| Channel | Trigger | CU/byte | Data wrapper |
|---|---|---|---|
| `SUBSCRIBE_PRICE` | Real-time OHLCV candle updates for a token | 0.003 | `data: {}` |
| `SUBSCRIBE_TXS` | Live swap/trade feed for a token | 0.0004 | `data: {}` |
| `SUBSCRIBE_BASE_QUOTE_PRICE` | Real-time price for a specific pair | 0.003 | `data: {}` |
| `SUBSCRIBE_TOKEN_NEW_LISTING` | Fires when a new token is listed | 0.08 | **top-level** |
| `SUBSCRIBE_NEW_PAIR` | Fires when a new liquidity pair is created | 0.05 | **top-level** |
| `SUBSCRIBE_LARGE_TRADE_TXS` | Whale alert — trades above a size threshold | 0.006 | **top-level** |
| `SUBSCRIBE_WALLET_TXS` | Live transaction feed for a monitored wallet | 0.004 | `data: {}` |
| `SUBSCRIBE_TOKEN_STATS` | Periodic stat updates per token | 0.005 | `data: {}` |
| `SUBSCRIBE_MEME` | Live meme token discovery feed | varies | `data: {}` |

```typescript
import WebSocket from 'ws';

const ws = new WebSocket(
  `wss://public-api.birdeye.so/socket/solana?x-api-key=${API_KEY}`,
  { headers: { 'Origin': 'ws://public-api.birdeye.so', 'Sec-WebSocket-Protocol': 'echo-protocol' } } as any
);
ws.on('open', () => ws.send(JSON.stringify({
  type: 'SUBSCRIBE_PRICE',
  data: { address: 'So11111111111111111111111111111111111111112', currency: 'usd', type: '1H' }
})));
ws.on('message', (raw) => console.log(JSON.parse(raw.toString())));

// Channels WITHOUT data wrapper (params at top level):
// { "type": "SUBSCRIBE_LARGE_TRADE_TXS", "min_volume": 10000, "max_volume": 100000 }
// { "type": "SUBSCRIBE_TOKEN_NEW_LISTING", "min_liquidity": 1000 }
```

See `resources/websocket.md` for full connection setup, heartbeat, reconnect strategy, and per-channel formats.

---

## Common Token Addresses (Solana)

| Token | Address |
|---|---|
| WSOL | `So11111111111111111111111111111111111111112` |
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| USDT | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` |
| BONK | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` |
| WIF | `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm` |
| JUP | `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN` |

Full interactive reference: https://docs.birdeye.so/reference
