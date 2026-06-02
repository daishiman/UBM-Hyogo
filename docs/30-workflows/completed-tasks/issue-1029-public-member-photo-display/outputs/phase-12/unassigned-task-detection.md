# 未割当タスク検出: issue-1029 public member photo display

> **[実装区分: 実装仕様書]**。本 workflow は `implemented_local_runtime_pending`（実コード配線・ローカル focused test・local visual evidence 完了、staging/R2 実 URL capture は user-gated）。current 新規未タスクは **0 件**。baseline（既存分離タスク）と分離記録する。

---

## ソース別確認

| ソース | 確認内容 | 結果 |
|-------|---------|------|
| 元タスク スコープ外 | index.md §1「含まない」項目 | self-upload / transcode / 写真専用 consent カラム / Google Form schema 変更 = いずれも既存分離 or 不変条件由来（baseline）。current 新規 0 件 |
| Phase 10 MINOR | 最終レビューでの MINOR 指摘 | local implementation review 後の current 新規未タスク 0 件 |
| Phase 11 | 手動テスト未割当事項 | local screenshot 3 PNG は取得済み。staging/R2 実 URL capture は Gate-C user-gated external ops。未タスク 0 件 |
| TODO / FIXME | 本 workflow が生む実コード TODO | scoped touched-file scan で TODO/FIXME 追加 0 件。根拠: `outputs/phase-11/evidence/todo-skip-scan.log` |
| describe.skip / test.skip / it.skip | スキップテスト | scoped touched-file scan で skip 追加 0 件。根拠: `outputs/phase-11/evidence/todo-skip-scan.log` |

## baseline（既存分離・本 task の先送りではない）

| 項目 | 分離先 | 根拠 |
|------|--------|------|
| member self-photo upload | `task-issue-983-followup-001-member-self-photo-upload` | #983 invariant で別タスク分離済み |
| member photo transcode/resize | `task-issue-983-followup-003-member-photo-transcode-resize` | #983 invariant で別タスク分離済み |

> 上記は CONST_007 の例外条件（独立した別スコープ / 不変条件との矛盾）に該当する既存分離。本 task の先送りではない。

## current（本 task で新規発生した gap）

- **新規未タスク: 0 件**。

本 task のスコープ（schema optional photoUrl + batch helper + route presign 配線 + UI Avatar src）は CONST_007 の 1 本実装サイクルで完了する単一スコープに収まっており、本サイクルで新規に分離が必要な gap は発生していない。

### 本実装サイクルで baseline 候補になり得る将来課題（現時点では未タスク化しない）

以下は既存 upstream / external runtime 境界であり、本 task の current 新規未タスクとしては起票しない。

| 候補 | 顕在化条件 | 既存分離との重複可否 |
|------|-----------|---------------------|
| list thumbnail / 縮小配信 | list での全 avatar 同時表示で R2 read コストが許容を超えた場合 | #983-followup-003（transcode/resize）と重複可能性 → 重複起票しない |
| photoUrl の Cache-Control 最適化 | presigned URL の TTL 300s と browser cache の運用調整が必要になった場合 | 新規（既存分離と重複なし） |

## 関連タスク差分確認（[FB-CANCEL-004-2] 重複起票防止）

- list thumbnail / 縮小配信は **#983-followup-003（transcode/resize）に包含され得る**ため、本 task からは新規起票しない。本実装サイクルで followup-003 と重複しないことを確認した上でのみ候補化する。
- self-upload は #983-followup-001 が既に担当。本 task からの起票はしない。
- 写真公開 consent カラム新設はユーザー確定方針（既存 gate 流用・D1 schema 不変）により恒久的に「実施しない」。未タスク化しない。
