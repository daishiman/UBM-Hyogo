# Phase 10: 最終レビュー

## 1. 受入条件チェック（Phase 1 §8 から再掲）

| # | 受入条件 | 結果 |
|---|----------|------|
| 1 | SMOKE-COVERAGE-MATRIX.md が 19 routes すべてを行として含む | (Phase 5 完了時に確認) |
| 2 | 各行に 5 軸すべてのセルが埋まる（`N/A` 含む） | (Phase 7 確認) |
| 3 | 4 visual baseline との関係を明示する列を持つ | (Phase 2 §4 設計) |
| 4 | CI gate job 名を参照する section が存在 | (Phase 2 §1 section 2) |
| 5 | 既存 spec のファイルパス（正本）が各 route から逆引きできる | (Phase 2 §1 section 9) |

## 2. レビュー観点

### 整合性

- matrix の 19 行が task-18 §1.1 と 1:1 で対応する
- 共通 3 routes（error/not-found/loading）が React component path として明示される
- CI gate 3 job 名が `.github/workflows/playwright-smoke.yml` と完全一致

### 価値性

- 後続タスクが「未カバー軸 / 未採取 baseline」を一目で把握できる
- task-18 の CI gate が「何を守るか」が明文化される

### 未タスク化対象（Phase 12 で formalize）

1. **U1**: 残り 15 routes の visual baseline 採取（task-18 §2.2 で MVP 後と明記済み、本タスクで matrix 上に列挙）
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
