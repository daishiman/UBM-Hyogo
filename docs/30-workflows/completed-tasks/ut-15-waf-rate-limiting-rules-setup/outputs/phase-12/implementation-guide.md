# Implementation Guide

## Part 1: 中学生レベルの説明

学校の入口に先生が立っていて、危ない持ち物や一度に押し寄せる人を先に止める場面を考える。教室の中で先生が注意する前に、入口で大きな混雑を防げれば、中の授業は止まりにくくなる。

UT-15 の WAF / Rate Limiting はこれと同じ考え方で、アプリの中に届く前に Cloudflare の入口で危ないアクセスや短時間の大量アクセスを見つける。まずは「本当に止めてもよいか」を観察するモードで始め、間違って普通の利用者を止めないことを確認してから、本当に止めるモードへ移す。

| 用語 | 日常語の言い換え |
| --- | --- |
| WAF | 入口で危ないものを見つける見張り |
| Rate Limiting | 短い時間に多すぎる入場を止める人数制限 |
| Simulate | 止めずに記録だけする練習モード |
| Enforce | 実際に止める本番モード |
| 429 | 「今は多すぎるので少し待って」の合図 |
| Cloudflare zone | どの入口を守るかを示す場所 |

## Part 2: 技術者向け実装契約

### Scope

- Add declarative WAF / Rate Limiting configuration under `scripts/cf-waf-apply/`.
- Add `scripts/cf-waf-apply.sh` as a `scripts/cf.sh`-compatible wrapper.
- Keep app-layer rate-limit middleware signatures stable.
- Add `edge-rate-limit-headers.ts` to keep edge/app-layer 429 response headers and body vocabulary stable.

### Interface Contract

```ts
export interface RateLimitedResponseInput {
  readonly retryAfterSec: number;
  readonly reason: "edge" | "app";
}

export interface RateLimitResponseBody {
  readonly error: "rate_limited";
  readonly retryAfterSec: number;
  readonly reason: "edge" | "app";
}
```

### Required Commands

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run apps/api/src/middleware/__tests__/edge-rate-limit-headers.test.ts scripts/cf-waf-apply/lib.test.ts --root=. --config=vitest.config.ts
CF_WAF_SKIP_TOKEN_CHECK=1 bash scripts/cf-waf-apply.sh --dry-run --mode simulate
bash scripts/coverage-guard.sh
```

### Error Handling

| Failure | Required behavior |
| --- | --- |
| Missing token | exit 11 before Cloudflare mutation |
| Invalid config | exit 12 with redacted validation error |
| API error | exit 13 with endpoint and Cloudflare request id only |
| Dry-run diff | exit 14 in CI-safe diff mode |

### User Gate

Cloudflare apply, production Enforce, commit, push, and PR creation require explicit user approval. `Refs #18` is used because Issue #18 is already closed.
