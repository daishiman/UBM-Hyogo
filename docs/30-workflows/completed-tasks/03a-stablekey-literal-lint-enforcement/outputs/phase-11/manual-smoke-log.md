# Manual Smoke Log

Status: EXECUTED (enforced_dry_run / warning mode)
Date (UTC): 2026-05-01T13:19Z

| Command | Expected | Actual | Result |
| --- | --- | --- | --- |
| `node scripts/lint-stablekey-literal.mjs` | warning モード: 違反検出するが exit 0（CI block しない） | 147 violations 検出, exit 0 | PASS |
| `node scripts/lint-stablekey-literal.mjs --strict` | strict モード: 違反検出で exit 1 | 147 violations 検出, exit 1 | PASS |
| `node scripts/lint-boundaries.mjs && node scripts/lint-stablekey-literal.mjs` | lint chain は warning mode で exit 0 | exit 0 | PASS |
| `mise exec -- pnpm typecheck` | 全 workspace clean | apps/api / apps/web / packages/* clean | PASS |
| `mise exec -- pnpm vitest run scripts/lint-stablekey-literal.test.ts` | 7/7 PASS | 7/7 PASS (3.07s) | PASS |
| secret hygiene grep on evidence | 0 hits | token / cookie / authorization / bearer / set-cookie ヒット 0 | PASS |

## Test matrix トレース (Phase 4)

| Case | Expected | Actual |
| --- | --- | --- |
| allow-list module literal | PASS | supply module 違反 0 件 |
| application code stableKey literal | FAIL (strict) | apps/api/* で 147 件検出, strict で exit 1 |
| test file literal | PASS | `*.test.ts` 違反 0 件 |
| fixture literal | PASS | `__fixtures__/**` 違反 0 件 |
| seed literal | PASS | `migrations/seed/**` glob 設定済み |
| imported stableKey constant | PASS | `scripts/__fixtures__/stablekey-literal-lint/allowed.ts` で確認 |
| static template literal matching stableKey | FAIL (rule logic) | `edge.ts` の static template 抽出ロジック確認済み |
| non-stableKey dummy literal | PASS | `"fooBarBaz"` 検出 0 件 |

Reason screenshot is absent: `visualEvidence=NON_VISUAL`; this is a lint/CI gate.

## 補足

- 既存 apps/api 配下の 147 件は本タスク前から存在する legacy literal で、`spec_created → enforced_dry_run` 移行時の baseline。
- 完全な `enforced` (error mode) 昇格は、既存 literal の supply module 経由化リファクタを完了した後の別 wave。
- 本 evidence は Phase 13 PR 作成時のレビュー材料として `evidence/lint-clean-pass.txt` / `evidence/lint-violation-fail.txt` / `evidence/allow-list-snapshot.json` を参照する。
