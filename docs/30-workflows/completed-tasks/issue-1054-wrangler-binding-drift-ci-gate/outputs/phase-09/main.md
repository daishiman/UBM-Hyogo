# Phase 9 成果物 — 品質保証

## 1. 目的

変更 5 ファイル（gate スクリプト / 回帰 spec / CI workflow / package.json / deployment-cloudflare.md）が満たすべき品質ゲート QG-1〜QG-7 を確定する。実行は実装サイクルで行い、本 Phase は合格条件・コマンド・期待出力の正本。

## 2. 品質ゲート QG-1〜QG-7

| # | ゲート | コマンド | 合格条件 |
| --- | --- | --- | --- |
| QG-1 | 型チェック | `mise exec -- pnpm typecheck` | error 0 |
| QG-2 | lint | `mise exec -- pnpm lint` | error 0 |
| QG-3 | 回帰 spec | `mise exec -- pnpm exec vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts` | TC-01〜TC-10 全 PASS（型欠落 / 棚卸し欠落 / 棚卸し Kind 不一致 / orphan を含む、ルート実行） |
| QG-4 | read-only grep gate | `grep -nE "writeFileSync\|writeFile\|appendFile\|fetch\(\|child_process\|execSync\|spawn" scripts/verify-wrangler-binding-drift.mjs` | ヒット 0 件（AC-7） |
| QG-5 | gate 自走 | `mise exec -- pnpm verify:wrangler-binding-drift` | 棚卸し追記後 exit 0 / 追記前 exit 1 |
| QG-6 | CI workflow 規約整合 | `verify-wrangler-binding-drift.yml` を `verify-design-tokens.yml` と突合 | permissions: contents read / Node24 / 3 解析対象 path トリガ / pnpm 実行 |
| QG-7 | 命名・配置規約 | 目視 + grep | 5 ファイル名 / package script / ログ接頭辞が Phase 1 命名規則と一致 |

## 3. read-only grep gate 詳細（QG-4・AC-7）

| 検出語 | 意味 | 期待 |
| --- | --- | --- |
| `writeFileSync` / `writeFile` / `appendFile` | ファイル書き込み | 0 件 |
| `fetch(` | ネットワークアクセス | 0 件 |
| `child_process` / `execSync` / `spawn` | サブプロセス起動 | 0 件 |

> gate は `readFileSync` + `console.*` + `process.exit` のみで完結する。1 件でもヒットすれば QG-4 fail（AC-7 違反）。

## 4. CI workflow 規約チェック（QG-6・AC-9）

| 項目 | 期待値 |
| --- | --- |
| top-level permissions | `contents: read` |
| Node セットアップ | Node 24 + pnpm |
| トリガ | `paths:` に `apps/api/wrangler.toml` / `apps/api/src/env.ts` / `**/deployment-cloudflare.md` |
| 実行ステップ | `pnpm install` → `pnpm verify:wrangler-binding-drift` |

## 5. 結論

QG-1〜QG-7 は AC-7（read-only）/ AC-8（回帰）/ AC-9（CI 規約）/ AC-10（gate green）を機械検証に写像する。実行は実装サイクル。合否は Phase 10 の GO/NO-GO 判定材料となる。
