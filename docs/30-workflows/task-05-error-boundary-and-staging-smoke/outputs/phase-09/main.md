# Phase 9: 品質保証（local PASS 5 点セット）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 9 |
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

- `outputs/phase-09/main.md`

## 統合テスト連携

`apps/web/tests/e2e/staging-smoke.spec.ts` は `staging-smoke-checklist.md` の 19 routes を正本として実装サイクルで接続する。

## local PASS 5 点

| # | gate | コマンド | evidence path |
| --- | --- | --- | --- |
| 1 | typecheck | `mise exec -- pnpm typecheck` | `outputs/phase-11/evidence/typecheck.log` |
| 2 | lint | `mise exec -- pnpm lint` | `outputs/phase-11/evidence/lint.log` |
| 3 | unit test | `mise exec -- pnpm --filter @ubm-hyogo/web test app/__tests__/error.test.tsx` | `outputs/phase-11/evidence/test.log` |
| 4 | build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | `outputs/phase-11/evidence/build.log` |
| 5 | grep gate（HEX 直書き / `process.env` 直参照） | `outputs/phase-11/evidence/grep-gate.log` 参照（下記） |

### grep gate 仕様

```bash
# HEX 直書き禁止
! rg -n '#[0-9a-fA-F]{3,8}' apps/web/app/{error,global-error,not-found,loading}.tsx

# process.env 直参照（NODE_ENV のみ許可）
rg -n 'process\.env\.' apps/web/app/{error,global-error,not-found,loading}.tsx \
  | rg -v 'NODE_ENV' \
  | (! grep . )

# logger 経由化（Sentry 直叩き禁止）
! rg -n 'from "@sentry/' apps/web/app/{error,global-error,not-found,loading}.tsx

# staging fixture は明示フラグのみで制御。NODE_ENV guard 禁止
! rg -n 'NODE_ENV.*__smoke__|__smoke__.*NODE_ENV|__broken__' apps/web/app apps/web/tests/e2e

# skip 禁止
! rg -n 'test\\.describe\\.skip|test\\.skip\\(true|it\\.skip' apps/web/tests/e2e/staging-smoke.spec.ts
```

3 項目すべて exit 0 を期待。

## 単体テストカバレッジ

- `error.tsx` Statement / Branch ≥ 90%
- 他 3 ファイルは Statement ≥ 80%

`pnpm --filter @ubm-hyogo/web test --coverage` 結果を `outputs/phase-11/evidence/coverage.txt` に保存。

## staging smoke の暫定実行（オプション）

local からは staging URL が解決できないため、Phase 11 で正式実行する。Phase 9 では smoke spec の `--list` だけ確認:

```bash
ENABLE_STAGING_SMOKE_FIXTURE=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/e2e/staging-smoke.spec.ts --project=staging-smoke --list
```

## 完了条件

- [ ] local PASS 5 点（typecheck / lint / test / build / grep-gate）が全て exit 0
- [ ] coverage 目標達成
- [ ] staging smoke spec が `--list` で checklist 正本 19 routes を列挙する
- [ ] `coverage/e2e/coverage-summary.json` の lines pct が 80% 以上
