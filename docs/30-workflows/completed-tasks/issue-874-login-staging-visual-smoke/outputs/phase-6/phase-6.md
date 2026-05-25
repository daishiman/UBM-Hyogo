**[実装区分: 実装仕様書]**

# Phase 6: テスト拡充 / fail path / regression guard

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `runtime_pending` |
| 入力 | Phase 4 / Phase 5 |

## 1. fail path テスト

| ID | シナリオ | コマンド | 期待 |
|---|---|---|---|
| FP-01 | staging URL が 404 を返す | `bash scripts/run-login-staging-smoke.sh https://invalid.example` | playwright が `goto failed` で fail、exit ≠ 0、stderr に対象 URL を含む |
| FP-02 | `PLAYWRIGHT_EVIDENCE_DIR` が読み取り専用 | `chmod 555 outputs/phase-11/staging-screenshots && bash scripts/run-login-staging-smoke.sh "$STAGING_URL"; chmod 755 outputs/phase-11/staging-screenshots` | mkdir / 書込 fail で exit ≠ 0 |
| FP-03 | `mise` 未インストール | `PATH="/usr/bin:/bin" bash scripts/run-login-staging-smoke.sh "$STAGING_URL"` | `mise: command not found` でscript が exit ≠ 0 |
| FP-04 | shellcheck SC2086 注入 | quoting なし版をローカルで作って `shellcheck` | 必ず finding を出す（hardening 確認） |
| FP-05 | cold start | warm-up なしで実行 | timeout fail → warm-up 後再実行で PASS（再現性ある運用手順を確認） |

## 2. regression guard

| ID | シナリオ | コマンド | 期待 |
|---|---|---|---|
| RG-01 | local 既定値 path が変わっていない | `mise exec -- pnpm exec playwright test playwright/tests/login-smoke.spec.ts --grep 'renders LoginCard\|captures mobile input' --reporter=line --list` | 対象 7 test の出力先が親 workflow 配下 |
| RG-02 | local 実行で staging path に PNG が漏れ出ない | `find docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots -name '*.png' -newer /tmp/marker` | 0 件（local 実行直後） |
| RG-03 | `playwright.config.ts` 改変なし | `git diff dev -- apps/web/playwright.config.ts` | 空 diff |
| RG-04 | spec の state assertion が無改変 | `git diff dev -- apps/web/playwright/tests/login-smoke.spec.ts` | `EVIDENCE_DIR` 周辺のみ差分 |
| RG-05 | `wrangler` 直接呼び出しの紛れ込みなし | `rg -n '^\s*wrangler ' scripts/run-login-staging-smoke.sh` | 0 件 |

## 3. 補助コマンド

| 目的 | コマンド |
|---|---|
| evidence 7 PNG の名前一致 | `comm -3 <(ls outputs/phase-11/staging-screenshots/ \| sort) <(printf '%s\n' login-deleted.png login-error.png login-input-mobile.png login-input.png login-rules-declined.png login-sent.png login-unregistered.png \| sort)` で空 |
| evidence 合計サイズ | `du -sh outputs/phase-11/staging-screenshots/` ≤ 3.5MB |
| `verify-pr-ready.sh` 部分実行 | `bash scripts/verify-pr-ready.sh` (Phase 11 後) |
| spec gate | `mise exec -- pnpm gate-metadata:validate` / `mise exec -- pnpm verify:phase12-compliance` |

## 4. 既存 CI gate への影響確認

| gate | 影響 | 対応 |
|---|---|---|
| `verify-design-tokens` | 無関係（spec 改修と shell helper のみ） | 通過 |
| `verify-test-suffix` | 無関係（新規 `.spec.ts` 追加なし） | 通過 |
| `verify-indexes-up-to-date` | aiworkflow-requirements indexes に topic 1 行追記される可能性あり | Phase 5 §10 で `pnpm indexes:rebuild` を必須化 |
| `verify-gate-metadata` / `verify:phase12-compliance` | 本 workflow の artifacts.json / phase-12 compliance file が必要 | Phase 12 で strict 2 files (`phase-12.md` + `phase12-task-spec-compliance-check.md`) を配置 |
| `verify-pr-ready.sh` | 上記 gate の総合 wrapper | Phase 11 後 / commit 前に実行 |

## 5. Phase 6 完了条件

- [x] fail path 5 件を列挙
- [x] regression guard 5 件を列挙
- [x] 補助コマンド suite を確定
- [x] 既存 CI gate への影響と対応を確定

## 6. 次 Phase への引き継ぎ

Phase 7 では本 Phase の fail / regression test を踏まえ、coverage 範囲を `apps/web/playwright/tests/login-smoke.spec.ts` の env-override 行と `scripts/run-login-staging-smoke.sh` 全体に局所明示する（広域 `apps/web/**` 指定回避）。
