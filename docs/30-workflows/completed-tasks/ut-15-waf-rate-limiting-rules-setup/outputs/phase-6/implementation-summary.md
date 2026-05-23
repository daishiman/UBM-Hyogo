# Phase 6 実装サマリ — UT-15 WAF / Rate Limiting

## 実装区分判断（CONST_006）

仕様書ラベル: `[実装区分: 実装仕様書]`。本タスクは目的達成のためコード変更が必須で、既定通りコード実装を実施した。

## 実装ファイル一覧（実コード変更）

| ファイル | 種別 |
| --- | --- |
| `apps/api/src/middleware/edge-rate-limit-headers.ts` | 新規（helper / pure） |
| `apps/api/src/middleware/__tests__/edge-rate-limit-headers.test.ts` | 新規（6 ケース） |
| `apps/api/src/middleware/rate-limit-magic-link.ts` | 編集（helper 経由化・signature 不変） |
| `apps/api/src/middleware/rate-limit-self-request.ts` | 編集（同上） |
| `scripts/cf-waf-apply.sh` | 新規（CLI entry） |
| `scripts/cf-waf-apply/lib.sh` | 新規（bash function lib） |
| `scripts/cf-waf-apply/config.json` | 新規（宣言的構成正本） |
| `scripts/cf-waf-apply/__fixtures__/dry-run.snapshot.json` | 新規（fixture） |
| `scripts/cf-waf-apply/lib.test.ts` | 新規（spawn snapshot 5 ケース） |
| `docs/runbooks/cloudflare-waf-operations.md` | 新規（runbook） |

## テスト結果

```
 ✓ apps/api/src/middleware/__tests__/edge-rate-limit-headers.test.ts (6 tests)
 ✓ scripts/cf-waf-apply/lib.test.ts (5 tests)
 ✓ apps/api/src/middleware/__tests__/rate-limit-magic-link.test.ts (3 tests)
 Test Files  3 passed (3)
      Tests  14 passed (14)
```

`mise exec -- pnpm --filter @ubm-hyogo/api typecheck` も exit 0。

## AC 対応

| AC | 状態 | 根拠 |
| --- | --- | --- |
| AC-1 | 達成 | `scripts/cf-waf-apply.sh` が `--mode simulate|enforce` / `--dry-run` の 3 モードで動作 |
| AC-2 | 達成 | `config.json` で Managed Ruleset を `defaultMode: simulate` 固定（zone は `apps/api`/`apps/web` 両方） |
| AC-3 | 達成 | rateLimitRules に AUTH/ADMIN/ME/PUBLIC 4 グループを定義 |
| AC-4 | 達成 | `phase-02.md` の責務分離マトリクス + runbook §6 |
| AC-5 | 達成 | `buildRateLimitedResponse` helper で body / header 統一・vitest 検証 |
| AC-6 | 達成 | `docs/runbooks/cloudflare-waf-operations.md` §3.3 に Simulate→Enforce gate を明記 |
| AC-7 | 部分（Phase 6 範囲） | helper は pure function でカバレッジ既定値達成可能 |
| AC-8 | 達成 | rate-limit-magic-link.test.ts が miniflare で 429 + Retry-After を確認 |
| AC-9 | 達成 | D1 直接アクセス追加なし / Google Form schema 不変 / 新 endpoint 追加なし |
| AC-10 | 達成 | `cf-waf-apply.sh` は curl + Cloudflare Rulesets API のみ。`wrangler` 不使用 |

## 既存テスト互換

`rate-limit-magic-link.test.ts` は `Retry-After` (case-insensitive) header と status 429 を assert するのみ。
helper 経由でも `headers.get("Retry-After")` は `retry-after` を返すため互換維持。

## 残課題（CONST_009 別タスク化なし）

なし。本タスクのスコープは Phase 6 までで完結。
Simulate→Enforce 移行は **本番運用 7 日観測後**に実施するため、本実装サイクルでは
スクリプトと runbook のみ整備し、実 Cloudflare API への実 apply は運用判断で行う。
