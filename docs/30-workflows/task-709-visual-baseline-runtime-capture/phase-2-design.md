[実装区分: 実装仕様書]

# Phase 2: 設計

## 目的

Phase 1 の DoD を満たすための具体的な手順・コマンド・差分を確定する。

## 1. baseline 取得手順（CI 経由）

```
[trigger]
  gh workflow run playwright-visual-baseline-update.yml --ref <feature-branch>
    --field reason='task-709 initial baseline capture'
[CI]
  1. checkout
  2. setup-project (Node 24 / pnpm 10)
  3. playwright install --with-deps chromium
  4. pnpm --filter @ubm-hyogo/web build
  5. playwright test --update-snapshots
     --project=visual-full-chromium-desktop
     --project=visual-full-chromium-tablet
     --project=visual-full-chromium-mobile
  6. peter-evans/create-pull-request action が
     apps/web/playwright/tests/visual-full/** の diff を baseline-update PR として作成
[ローカル]
  - user approval marker を `outputs/phase-11/evidence/user-approval-marker.md` に記録した後、生成された baseline-update PR を本タスクブランチに `git fetch origin pull/<BASELINE_PR>/head:baseline-update-tmp` + `git merge --no-ff baseline-update-tmp` で取り込む
```

> ローカル `--update-snapshots` 実行は **行わない**。macOS / Linux のレンダラ差で baseline drift が発生し、CI で必ず fail するため。

## 2. workflow 編集差分

### 2.1 `playwright-visual-full.yml`

**before** (現状):
```yaml
  # MVP-PAUSE 2026-05-15: PR trigger を一時停止。
  # 復活方法: 下の pull_request ブロックの行頭 `# ` を全て削除する。
  # 残っている workflow_dispatch / push / schedule は引き続き有効。
  workflow_dispatch:
  # pull_request:
  # paths:
  # - 'apps/web/src/**'
  # - 'apps/web/playwright.config.ts'
  # - 'apps/web/playwright/tests/visual-full/**'
  # - 'apps/web/playwright/fixtures/**'
  # - 'apps/web/src/styles/tokens.css'
  # - '.github/workflows/playwright-visual-full.yml'
  #
```

**after**:
```yaml
  workflow_dispatch:
  pull_request:
    paths:
      - 'apps/web/src/**'
      - 'apps/web/playwright.config.ts'
      - 'apps/web/playwright/tests/visual-full/**'
      - 'apps/web/playwright/fixtures/**'
      - 'apps/web/src/styles/tokens.css'
      - '.github/workflows/playwright-visual-full.yml'
```

> baseline 存在チェック step（`compgen -G ...`）はそのまま維持。万一 baseline が空でも PR が unblock される safety net として有効。

## 3. matrix 更新差分

`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`:

- Coverage Matrix 表 #1..#17 の `Visual baseline` 列の `-` を slug（例 `full-visual:root` または該当 fixture slug 参照）に更新
- Axis Totals: `Visual baseline 4/19` → `17/19`、Notes に "17 URL routes baselined; error.tsx / loading.tsx remain component-only" 追記
- Future Candidates の "Full visual regression baseline for remaining non-baseline surfaces" 行を削除（task-709 で解消）

## 3.1 user-gated checkpoint

次の操作はユーザー明示承認後のみ実行する。

| 操作 | gate | evidence |
|------|------|----------|
| `gh workflow run playwright-visual-baseline-update.yml` | GitHub environment `visual-baseline-approval` + user instruction | `outputs/phase-11/evidence/user-approval-marker.md` |
| baseline-update PR の merge 取り込み | user instruction | `outputs/phase-11/evidence/baseline-import-log.md` |
| commit / push / PR 作成 | user instruction | Phase 13 |

承認前の本 workflow state は `CONTRACT_READY_IMPLEMENTATION_PENDING` とし、runtime capture 後に `implemented_local_evidence_captured` または `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` へ昇格する。

## 4. 関数・型・モジュール

新規追加なし。既存 `VISUAL_ROUTES`, `full-visual.spec.ts` がそのまま動作する。

`EXPECTED_VISUAL_ROUTE_COUNT = 17` 不変。

## 5. 入出力・副作用

| アクション | 入力 | 出力 | 副作用 |
|-----------|------|------|--------|
| `playwright-visual-baseline-update` 実行 | feature branch ref | baseline-update PR | base branch に baseline PNG が追加される |
| `playwright-visual-full.yml` 編集 | yaml diff | merged workflow | PR ごとに visual-full 3 viewport job が走る |
| matrix 更新 | text diff | updated md | 監査上の整合性回復 |

## 6. エラーハンドリング

| 事象 | 対応 |
|------|------|
| `--update-snapshots` 実行中に flaky route がある | 該当 route だけ retry。3 連続 fail なら `mask` 追加候補として Phase 6 に escalation |
| 51 件揃わない（一部 fail） | fail した route の HTML / png diff を artifact から取得し、根本原因を Phase 8 で対処 |
| baseline 取得後の 2 連続 run で diff が出る | 動的要素（time / data-visual-mask）の追加 mask 候補とし、Phase 6 で fixture 更新 |
| MVP-PAUSE 解除後に PR で long-time (>15min) | concurrency group が既に設定済み (`visual-full-${{ github.ref }}`) のため許容 |

## 7. 検証コマンド

```bash
# workflow 編集後のローカル yaml 構文確認
yq '.on' .github/workflows/playwright-visual-full.yml

# fixture 整合
grep -c "slug:" apps/web/playwright/fixtures/visual-routes.ts   # 期待: 17
ls apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/ | wc -l   # 期待: 51

# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 8. 成果物

- 本ファイル `phase-2-design.md`
