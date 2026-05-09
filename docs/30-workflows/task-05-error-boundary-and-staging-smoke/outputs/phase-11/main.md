# Phase 11: 手動 smoke / 実測 evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 11 |
| task | task-05-error-boundary-and-staging-smoke |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

この Phase で task-05 の実装仕様、検証条件、または close-out 条件を固定する。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-11/main.md`

## 統合テスト連携

`apps/web/tests/e2e/staging-smoke.spec.ts` は `staging-smoke-checklist.md` の 19 routes を正本として実装サイクルで接続する。

## evidence canonical path

repo root から実行し、`docs/30-workflows/task-05-error-boundary-and-staging-smoke/outputs/phase-11/evidence/` 配下に以下を配置する。`tee outputs/...` の相対配置は禁止。

| file | 取得方法 |
| --- | --- |
| `typecheck.log` | `mise exec -- pnpm typecheck 2>&1 \| tee outputs/phase-11/evidence/typecheck.log` |
| `lint.log` | `mise exec -- pnpm lint 2>&1 \| tee outputs/phase-11/evidence/lint.log` |
| `test.log` | `mise exec -- pnpm --filter @ubm-hyogo/web test app/__tests__/error.test.tsx 2>&1 \| tee outputs/phase-11/evidence/test.log` |
| `build.log` | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee outputs/phase-11/evidence/build.log` |
| `grep-gate.log` | Phase 9 §grep gate の 3 コマンドを連結し記録 |
| `coverage.txt` | `pnpm --filter @ubm-hyogo/web test --coverage` |
| `e2e-staging.log` | `ENABLE_STAGING_SMOKE_FIXTURE=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/e2e/staging-smoke.spec.ts --project=staging-smoke 2>&1 \| tee docs/30-workflows/task-05-error-boundary-and-staging-smoke/outputs/phase-11/evidence/e2e-staging.log` |
| `e2e-skip-count.txt` | `rg -n 'test\.describe\.skip\|test\.skip\(true\|it\.skip' apps/web/tests/e2e/staging-smoke.spec.ts > .../e2e-skip-count.txt; test ! -s .../e2e-skip-count.txt` |
| `runner-version.txt` | `pnpm --filter @ubm-hyogo/web exec playwright --version` |
| `coverage/e2e/coverage-summary.json` | E2E coverage summary。total と task-touched modules の `lines.pct >= 80` |
| `playwright-report/` | Playwright HTML report ディレクトリ |
| `sentry-screenshot.png` | Sentry dashboard で `error.boundary.caught` event を表示したスクリーンショット |
| `error-boundary-screenshot.png` | staging で error boundary 画面を撮影 |
| `not-found-screenshot.png` | staging `/__nonexistent__` の画面 |
| `loading-screenshot.png`（任意） | DevTools network throttle で loading 表示中の画面 |

## staging smoke 実行手順

```bash
# 1. staging へ deploy（task-02/03/04 完了 + 本 task の差分が含まれた状態）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# 2. 環境変数を 1Password から injection（実値は op:// 参照）
export STAGING_BASE_URL=$(op read "op://UBM/staging-hyogo/web_base_url")
export STAGING_MEMBER_FIXTURE_ID=fixture-1
export STAGING_AUTH_BEARER=$(op read "op://UBM/staging/smoke_bearer")  # 任意
export ENABLE_STAGING_SMOKE_FIXTURE=1

# 3. smoke 実行
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/e2e/staging-smoke.spec.ts --project=staging-smoke
```

## 期待 evidence

- 19 routes すべてが許容ステータス内
- 404 page が `ページが見つかりません` テキスト含む
- error boundary fixture で `role="alert"` element と `エラーID` テキストが visible
- Sentry dashboard に browser boundary event と server test event が別経路で届いている

## 状態語彙

- `outputs/phase-11/main.md` の status は次のいずれかで close-out する:
  - `local PASS 5 点 + staging smoke PASS` → `completed` 候補（本 task は VISUAL_ON_EXECUTION のため staging smoke 実測まで完遂が条件）
  - `local PASS のみで runtime 未取得` → `IMPLEMENTED_LOCAL_RUNTIME_PENDING`（合算 PASS 表記禁止）

## 完了条件

- [ ] evidence 14 種類が canonical path に配置
- [ ] runtime 取得済みであれば `outputs/phase-11/main.md` に「19 routes / 5 状態 / 許容ステータス内」を表で記録
- [ ] runtime 未取得なら `IMPLEMENTED_LOCAL_RUNTIME_PENDING` 状態と再取得計画を明記
- [ ] `e2e-skip-count.txt` は 0 件を示す
- [ ] `coverage/e2e/coverage-summary.json` は lines pct 80% 以上を示す
