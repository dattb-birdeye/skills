# Supported Networks

Birdeye's multi-chain support. Set the appropriate value in the `x-chain` header on every request.

---

## Supported Chains

| Chain | `x-chain` Value | Notes |
|---|---|---|
| Solana | `solana` | **Primary chain — full feature support** |
| Ethereum | `ethereum` | |
| BNB Smart Chain | `bsc` | |
| Base | `base` | |
| Arbitrum | `arbitrum` | |
| Optimism | `optimism` | |
| Polygon | `polygon` | |
| zkSync Era | `zksync` | |
| Sui | `sui` | |
| Tron | `tron` | |

---

## Endpoint Chain Restrictions

Not all endpoints are available on all chains.

| Endpoint | Chains Supported |
|---|---|
| `GET /defi/v3/ohlcv` | Solana, Ethereum, BSC, Base, Monad |
| `GET /wallet/v2/pnl/summary` | Solana, Base |
| `GET /wallet/v2/current-net-worth` | Solana, Base |
| `GET /wallet/v2/net-worth` | Solana only |
| `GET /defi/v2/tokens/top_traders` | Solana only |
| `GET /defi/token_security` | Solana only |
| `GET /trader/gainers-losers` | Solana only |
| `GET /defi/v3/token/meme/list` | Solana only |
| `GET /defi/v3/search` — `verify_token` filter | Solana only |
| `GET /defi/v3/search` — `markets` filter | Solana only |
| `GET /defi/v3/token/txs` — AMM source filter | Solana only |
| WebSocket channels | Solana primary |

---

## Setting the Chain

```typescript
const client = BirdeyeClient.createWithConfig({ apiKey, chain: 'base' });
```

> The chain is set in the **`x-chain` header**, never in the URL path.
> All chains share the same base URL: `https://public-api.birdeye.so`

---

## Checking Live Supported Chains

```bash
GET /defi/networks
```
