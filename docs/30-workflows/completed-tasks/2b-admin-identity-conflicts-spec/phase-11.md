# Phase 11 — Evidence（NON_VISUAL 縮約テンプレ）

> visualEvidence=NON_VISUAL のため screenshot は対象外。Phase 11 縮約テンプレを適用。

## 1. evidence canonical path

実コード生成後、まず `mkdir -p outputs/phase-11/evidence` を実行し、以下を `outputs/phase-11/evidence/` に保存する:

| # | path | 内容 | 取得コマンド |
|---|------|------|-------------|
| 1 | `outputs/phase-11/evidence/typecheck.log` | typecheck 出力 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 \| tee outputs/phase-11/evidence/typecheck.log` |
| 2 | `outputs/phase-11/evidence/lint.log` | lint 出力 | `mise exec -- pnpm lint 2>&1 \| tee outputs/phase-11/evidence/lint.log` |
| 3 | `outputs/phase-11/evidence/e2e-run.log` | Playwright 実行ログ | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-identity-conflicts.spec.ts 2>&1 \| tee outputs/phase-11/evidence/e2e-run.log` |
| 4 | `outputs/phase-11/evidence/e2e-skip-count.txt` | skip 件数 | `grep -c "test\.skip\|test\.fixme" apps/web/playwright/tests/admin-identity-conflicts.spec.ts > outputs/phase-11/evidence/e2e-skip-count.txt`（期待値 `0`） |
| 5 | `outputs/phase-11/evidence/grep-gate.log` | drift gate 結果 | Phase 10 §5 のコマンドを順次実行・tee |
| 6 | `outputs/phase-11/evidence/build.log` | build 出力 | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee outputs/phase-11/evidence/build.log` |
| 7 | `outputs/phase-11/evidence/runner-version.txt` | runner 版 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright --version > outputs/phase-11/evidence/runner-version.txt` |

## 2. 状態語彙

| ステータス | 条件 |
|-----------|------|
| `spec_created` | 仕様書のみ作成済み、実コード未生成 |
| `runtime_pending` | 本 workflow の現在状態。実コード生成済み、local chromium evidence 取得済み、firefox / webkit / staging / CI runtime は未取得 |
| `completed` | 上記 evidence 7 件すべて取得 + 6 PASS / 0 skip 確認 |

> ⚠️ runtime CI 実行前に `completed` を付けない。`PASS` 単独表記禁止。

## 3. boundary state

実コード生成 + ローカル PASS 5 点（typecheck / lint / e2e / build / grep gate）取得時点では:

→ `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

CI runtime（GitHub Actions Playwright job）PASS 取得後に `completed` へ昇格。

## 4. 評価項目

- [ ] typecheck.log 終了コード 0
- [ ] lint.log 終了コード 0
- [ ] e2e-run.log で `6 passed, 0 skipped, 0 failed`
- [ ] e2e-skip-count.txt が `0`
- [ ] build.log 終了コード 0
- [ ] grep-gate.log で全 4 パターン 0 hit
- [ ] `wc -l` が 200-240 範囲内
