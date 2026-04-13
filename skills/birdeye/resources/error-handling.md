# Error Handling

## HTTP status codes

| Code | Meaning | Likely cause | Fix |
|---|---|---|---|
| `400` | Bad request | Missing required param, wrong enum value, malformed address | Check required params in `api-reference.md` |
| `401` | Unauthorized | Missing or invalid `X-API-KEY` | Verify key is in `X-API-KEY` header (not `Authorization`) |
| `403` | Forbidden | Bot-flagged User-Agent OR feature requires higher plan tier | Set `User-Agent: Mozilla/5.0`; upgrade plan for WebSocket (Business+) / PnL/SmartMoney (PRO+) |
| `404` | Not found | Token/wallet not on this chain, wrong address format | Verify `x-chain` matches the address's chain |
| `429` | Rate limited | Exceeded tier global rps, or wallet 150 RPM / 30 RPS endpoint cap, or scroll 2 RPS | Exponential backoff (see below) |
| `500` | Server error | Transient Birdeye issue | Retry with backoff |
| `503` | Service unavailable | Maintenance or overload | Retry after delay |

## Response body structure

All Birdeye REST responses follow:

```json
{ "success": true, "data": { ... } }
```

On error:
```json
{ "success": false, "message": "Human-readable error", "statusCode": 400 }
```

**Always check `response.success === true` before accessing `response.data`.**

## Exponential backoff for 429 / 5xx

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 4
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);

    if (res.ok) return res;

    if (res.status === 429 || res.status >= 500) {
      if (attempt === maxRetries) throw new Error(`Failed after ${maxRetries} retries: ${res.status}`);
      const delay = Math.min(1000 * Math.pow(2, attempt), 16000); // 1s → 2s → 4s → 8s → 16s cap
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    // 4xx (except 429) are not retryable
    const body = await res.json().catch(() => ({}));
    throw new Error(`API error ${res.status}: ${(body as any).message || res.statusText}`);
  }
  throw new Error('Unreachable');
}
```

## Rate limits by tier

| Tier | Global limit | Wallet endpoints | Scroll endpoint |
|---|---|---|---|
| Standard | 1 RPS | 30 RPS / 150 RPM | 2 RPS |
| Lite/Starter | 15 RPS | 30 RPS / 150 RPM | 2 RPS |
| Premium | 50 RPS | 30 RPS / 150 RPM | 2 RPS |
| Business | 100 RPS | 30 RPS / 150 RPM | 2 RPS |
| Enterprise | Custom | Custom | 2 RPS |

> Wallet endpoints (`/wallet/v2/*`, `/v1/wallet/*`) have a **per-endpoint cap of 30 RPS burst / 150 RPM sustained**, on top of the tier's global limit. On Standard (1 RPS global), the wallet-specific cap is irrelevant — the global cap binds first.

```typescript
// Wallet sequencing — 150 RPM = 1 call per ~400ms sustained. Add buffer:
async function walletFetch(url: string, headers: HeadersInit): Promise<any> {
  const res = await fetch(url, { headers });
  await new Promise(r => setTimeout(r, 500)); // safe for 150 RPM cap
  if (!res.ok) throw new Error(`Wallet API error ${res.status}`);
  return res.json();
}
```

## Common mistakes by symptom

| Symptom | Cause | Fix |
|---|---|---|
| `403` on every request | Missing browser User-Agent | `"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"` |
| `success: false, message: "token not found"` | Wrong `x-chain` header | Set correct chain for the token's network |
| `400` on `/holder/v1/distribution` | Using `address=` param | Use `token_address=` param instead |
| `400` on `/defi/v3/token/meme/list` | Passing any `sort_by` value | `sort_by` is **not supported** on this endpoint — omit it entirely. Only pass `limit`. |
| `400` on `/trader/gainers-losers` | Passing `type=gainers` or `type=losers` | Use `yesterday`, `today`, or `1W` values instead |
| `400` on `/wallet/v2/current-net-worth` | Missing `sort_type` | `sort_type` is **required** on all `/wallet/v2/net-worth*` endpoints |
| Empty `data.items` on token search | No `keyword` with required sort params | For `/defi/v3/search`, `sort_by` and `sort_type` are required |
| Wallet endpoint returns empty or 403 | Wrong chain | Wallet APIs are Solana-only — set `x-chain: solana` |
| Swaps missing from wallet history | Using strict `mainAction === "swap"` filter | Also include `"buy"` and `"unknown"` — Raydium/Pump.fun routes show as `"unknown"` |
| Smart money 403 | Missing PRO tier | Smart money endpoints require PRO subscription |

## WebSocket errors

| Error | Cause | Fix |
|---|---|---|
| Connection refused / 403 | Wrong URL format or missing API key | Use `wss://public-api.birdeye.so/socket/{chain}?x-api-key=KEY` |
| No events received | Missing required headers | Add `Origin: ws://public-api.birdeye.so` and `Sec-WebSocket-Protocol: echo-protocol` |
| Subscription silently failing | Wrong message format for channel | `LARGE_TRADE_TXS`, `TOKEN_NEW_LISTING`, `NEW_PAIR` use top-level params (no `data` wrapper) |
| Connection drops | Ping timeout | Implement client-side heartbeat (see `resources/websocket.md`) |
| 403 on connect | Not on Business+ tier | WebSocket requires Business tier or higher |
