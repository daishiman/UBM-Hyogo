# Phase 5: 実装（matrix 文書作成 = diff check）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 5 / 実装 |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 5 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 5 の判断結果を `outputs/phase-05/implementation-plan.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `outputs/phase-05/implementation-plan.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 5 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 統合テスト連携

- docs-only / NON_VISUAL のため、この Phase では新規自動テストを追加しない。
- 実行可能な正本は `apps/web/playwright/tests/full-smoke.spec.ts` と `apps/web/playwright/tests/visual/*.spec.ts`、証跡は `outputs/phase-05/implementation-plan.md` に集約する。

## 詳細

> `implementation_mode = "verify_existing"`。本 Phase は code 実装ではなく `SMOKE-COVERAGE-MATRIX.md` 作成 + diff check に置き換える。

## 1. 新規作成ファイル

| パス | 種別 | 用途 |
|------|------|------|
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` | new | 主成果物（17 URL smoke + 2 component surfaces × 5 軸 matrix） |

## 2. 編集ファイル

| パス | 種別 | 用途 |
|------|------|------|
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md` | edit（任意） | "Coverage Matrix への参照" を 1 行追加 |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md` | reference only | SSOT。本 task では編集しない |

## 3. matrix 行の生成ルール（決定論）

1. `apps/web/playwright/tests/full-smoke.spec.ts` の `ROUTES[]` から path / auth / landmark を抽出
2. task-18 §0.6 §1.1 と突合（task-18 仕様書を source of truth とする）
3. 各 route に 5 軸（status / DOM / token / a11y / interaction）のセルを記述
4. 共通 3（error / not-found / loading）は Phase 2 §3 の戦略を採用
5. 4 visual baseline は `playwright/tests/visual/*.spec.ts` の存在から自動マーキング
6. 既存 spec への逆引きは matrix section 9 で tabular に記載

## 4. matrix 本体（Phase 5 アウトライン → 実体は SMOKE-COVERAGE-MATRIX.md）

Phase 5 では以下を順に実施:

1. SMOKE-COVERAGE-MATRIX.md を `outputs/phase-05/SMOKE-COVERAGE-MATRIX.draft.md` に下書き
2. Phase 4 の T1〜T7 check で integrity を確認
3. 確定版を `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` に作成
4. `git diff` で「matrix 新規追加 + SCOPE.md への参照 1 行」以外の変更がないことを確認

## 5. diff check（実装相当）

```bash
git diff --name-only dev...HEAD | sort
# 期待:
#   docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/index.md
#   docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json
#   docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/phase-01..13.md
#   docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/outputs/...
#   docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md
```

`apps/`, `scripts/`, `.github/`, `packages/` 配下に変更がないことを確認。

## 6. 完了条件

- [ ] SMOKE-COVERAGE-MATRIX.md が 19 surface 行 × 5 軸 + visual / spec の列を満たす
- [ ] 既存 4 visual baseline が baseline 名でマーキング、残り 15 surfaces が `-`
- [ ] `error.tsx` / `loading.tsx` に observability 戦略 or `N/A-runtime-observation` が記載
- [ ] CI gate job 名 3 本（task-18 由来）への参照 section が存在
- [ ] `apps/` / `scripts/` / `.github/` への code 変更ゼロ（diff check）
