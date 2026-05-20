# Unassigned Task Detection — UT-07C-FU-001

## 本タスク完了時点で残るフォローアップ候補

| # | 候補 | 緊急度 | 起票推奨 |
| --- | --- | --- | --- |
| 1 | attendance 一括 **削除** API | 中 | 別 issue。本タスク非含む |
| 2 | server 側 multipart/form-data parse 経路（10k 行クラス対応） | 低 | 必要時 |
| 3 | preview 行の最大表示件数 / paging（500 行 × DOM 描画） | 低 | UX 観点で後続検討 |
| 4 | papaparse の SECURITY advisory チェック自動化 | 低 | 既存 dependency update / security scanning 運用で監視。新規 workflow は作らない |

## 自動検出ヒューリスティック

- `TODO` / `FIXME` コメント混入: 新規ファイル全件 grep → 0 件
- spec 内 `[未実装]` / `[後続]`: 設計時点で out-of-scope に切り出した項目以外なし
- 既存 spec の `01-api-schema.md` / `api-endpoints.md` / `11-admin-management.md` への反映済み: 本フェーズで実施
- Phase 11 VISUAL screenshot: S1〜S4 captured

## 判定

緊急の未割当タスクなし。候補 #1〜#3 は本タスクの add-only / 500-row MVP スコープ外であり、現行運用を破綻させないため未タスク化しない。#4 は既存の依存更新・security scanning 運用で拾う対象で、本タスク固有の追加 Issue は作らない。
