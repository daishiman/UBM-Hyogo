# Phase 9 確定事項サマリ — 品質保証（QA）

コミット前にローカルで実行する QA gate と PASS 基準を確定。`mise exec --` 経由で Node 24 / pnpm 10 を保証。

## ローカル実行結果（2026-05-23 実装時）

| # | gate | 結果 |
|---|---|---|
| G-1 | typecheck | ✅ exit 0（6 workspace 全 Done） |
| G-2 | lint | ✅ exit 0（dependency-cruiser 0 violations / stablekey OK / eslint OK） |
| G-3 | mint parity unit | ✅ 8 tests passed（T-A1〜T-A8） |
| G-4 | shell reason unit | ✅ T-4-6/7/8 PASS（500/401/403 reason 分類）+ 既存 T-4-1〜5 回帰なし |
| G-5/G-6/G-7 | actionlint | ⏸ local `actionlint` command not found。workflow permissions/token/step 順序は構造レビュー済み、remote/CI 環境で再実行対象 |
| G-8 | shellcheck | ✅ 新規 smoke スクリプトに指摘 0（coverage-guard.sh の既存 SC2295 info は変更由来でなく CI shellcheck 対象外） |
| G-9 | redaction / secret 非露出 | ✅ mint helper は `appendFileSync` のみで JWT を console 出力しない / workflow は mint→mask→export を 1 step に閉じる / `test:workflow-secrets` PASS |

## QA gate 一覧（PASS 基準）

| # | gate | コマンド | PASS 基準 |
|---|---|---|---|
| G-1 | typecheck | `mise exec -- pnpm typecheck` | exit 0。`.mts` の型・`@ubm-hyogo/shared` import 解決 |
| G-2 | lint | `mise exec -- pnpm lint`（失敗時 `--fix`） | exit 0、残違反 0。新規 `.mts`/`.spec.ts` 対象 |
| G-3 | mint parity unit | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | admin=isAdmin:true / me=isAdmin:false が verifySessionJwt 通過、欠落 env で exit 2（AC-2/AC-4） |
| G-4 | shell reason unit | Phase 6 の `classify_failure_reason` unit | 401→token-invalid-or-expired / 403→not-admin / 500→secret-binding-missing、既存 reason 回帰なし |
| G-5 | actionlint(ci.yml) | `actionlint .github/workflows/ci.yml` | exit 0。permissions 構文・step 順序 valid |
| G-6 | actionlint(smoke) | `actionlint .github/workflows/runtime-smoke-staging.yml` | exit 0。mint step / fallback if valid |
| G-7 | permissions 突合 | actionlint + grep（§3） | top-level `contents: read` で既存 job が縮退しない（R-6） |
| G-8 | shellcheck | `shellcheck` で 2 本の `.sh` | exit 0 / baseline 同等、新規 warning 0 |
| G-9 | redaction grep gate | §4 grep 群 | JWT/鍵/secret 実値の出力経路 0 件、`::add-mask::` 構造あり |

## actionlint + permissions 突合（R-6 必須引き継ぎ）

- ci.yml の job は typecheck/lint/coverage 系のみで write 操作（push/release/deploy/PR comment）を含まない → `contents: read` で十分。
- artifact upload/download は専用 API で `contents` write を要さない（縮退影響なし）。
- write を要する job があれば job 個別 `permissions:` を保持し top-level に依存させない（本タスク時点では非該当）。
- `runtime-smoke-staging.yml` の既存 `contents: read`（L15-16）と表現を一貫化。

## redaction grep gate（secret 非露出）

- C-1: helper が JWT を console echo しない（出力は GITHUB_OUTPUT/GITHUB_ENV のみ）。
- C-2: workflow が mint→mask→export を同一 step に閉じる（レース不在・R-1）。
- C-3: runner reason は redact 済み body の `.error` 種別のみ、bearer log なし。
- C-4: runbook は op 参照 + 手順のみ、実値 0 件。
- C-5: 仕様書全体に secret/JWT/鍵 0 件。

## 実行順序

install → typecheck → lint → mint parity → shell unit → actionlint → permissions 突合 → shellcheck → redaction grep。FAIL 時は該当 Phase へ差し戻し再実行。

## 結論

QA gate と PASS 基準確定。R-6 の actionlint + 突合を必須チェックとして組込み。Phase 10（最終レビュー）へ進む。
