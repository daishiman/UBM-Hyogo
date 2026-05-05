# Phase 10: 設計レビュー記録

[実装区分: 実装仕様書]

## メタ情報

| Phase | 10 / 13 |
| --- | --- |
| 前 Phase | 9 |
| 次 Phase | 11（NON_VISUAL evidence） |
| 状態 | completed |

## 目的

Phase 1-9 の決定事項を後続レビュアー（または将来の本人）が読み返した際に **当時の判断根拠** を 1 ファイルから辿れるようにする。

## 記録項目

| 節 | 内容 |
| --- | --- |
| 決定 | D-1〜D-7 を採択した最終理由 |
| 代替案却下 | `_design/` を新設せず 03a / 03b 配下に置く案を却下した理由（→ workflow 横断 governance であるため） |
| リスク | owner 表が陳腐化しても気づかない可能性。緩和策 = 後続 sync 系タスクの Phase 4 で必ず本表を確認 |
| 開放残課題 | 未割当 #7（schema 集約）の起票責務、既存 03a / 03b 文中の「主担当 / サブ担当」語彙統一 |

## 成果物

- `outputs/phase-10/design-review-record.md`

## 完了条件

- 上記 4 節すべて埋まっている
- 開放残課題が Phase 12 の未タスク検出レポートに引き継がれる

## 実行タスク

- [x] 本 Phase の責務に対応する成果物を作成または更新する
- [x] code / NON_VISUAL の分類と owner 表 governance の整合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` | 対象仕様書 |
| owner 表 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | owner / co-owner 正本 |

## 統合テスト連携

- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`
