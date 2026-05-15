# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 10 / 最終レビュー |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 10 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 10 の判断結果を `outputs/phase-10/final-review.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `outputs/phase-10/final-review.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 10 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 統合テスト連携

- docs-only / NON_VISUAL のため、この Phase では新規自動テストを追加しない。
- 実行可能な正本は `apps/web/playwright/tests/full-smoke.spec.ts` と `apps/web/playwright/tests/visual/*.spec.ts`、証跡は `outputs/phase-10/final-review.md` に集約する。

## 詳細

## 1. 受入条件チェック（Phase 1 §8 から再掲）

| # | 受入条件 | 結果 |
|---|----------|------|
| 1 | SMOKE-COVERAGE-MATRIX.md が 17 URL smoke entries + 2 component surfaces すべてを行として含む | (Phase 5 完了時に確認) |
| 2 | 各行に 5 軸すべてのセルが埋まる（`N/A` 含む） | (Phase 7 確認) |
| 3 | 4 visual baseline との関係を明示する列を持つ | (Phase 2 §4 設計) |
| 4 | CI gate job 名を参照する section が存在 | (Phase 2 §1 section 2) |
| 5 | 既存 spec のファイルパス（正本）が各 route から逆引きできる | (Phase 2 §1 section 9) |

## 2. レビュー観点

### 整合性

- matrix の 19 surface 行が task-18 §1.1 と 1:1 で対応する
- not-found URL smoke と `error.tsx` / `loading.tsx` component surfaces が分離して明示される
- CI gate 3 job 名が `.github/workflows/playwright-smoke.yml` と完全一致

### 価値性

- 後続タスクが「未カバー軸 / 未採取 baseline」を一目で把握できる
- task-18 の CI gate が「何を守るか」が明文化される

### 未タスク化対象（Phase 12 で formalize）

1. **U1**: 残り 15 non-baseline surfaces の visual baseline 採取（task-18 §2.2 で MVP 後と明記済み、本タスクで matrix 上に列挙）
2. **U2**: `error.tsx` の Playwright observable trigger / fixture 整備
3. **U3**: `loading.tsx` の network throttle 観測戦略の標準化

## 3. blocker 判定

| 項目 | 判定 |
|------|------|
| MAJOR blocker | なし |
| MINOR | M1（error/loading observability）, M2（token runtime 観測 flaky） |
| Phase 11 進行 | **Go** |

## 4. unassigned-task 候補

上記 U1〜U3 を Phase 12 Task 12-4 で `outputs/phase-12/unassigned-task-detection.md` に登録する。
