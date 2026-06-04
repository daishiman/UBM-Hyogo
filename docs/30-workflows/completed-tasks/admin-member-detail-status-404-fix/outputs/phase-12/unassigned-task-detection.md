# 未タスク検出

> **[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]** — 0 件でも必須出力。current（本サイクルで処理すべき）と baseline（既存・対象外）を分離する。

## サマリ

| 区分 | 件数 | 備考 |
|------|------|------|
| current（本サイクル必須未タスク） | **0** | F-1〜F-5 で本 404 問題は完結（CONST_007 単一サイクル） |
| baseline（将来層・本サイクル分離） | **2** | MINOR-FUT-1 / MINOR-FUT-2（Issue 起票候補・ユーザーゲート） |

---

## current: 本サイクルで処理すべき未タスク（0 件）

本 workflow のスコープ（admin 会員詳細・status の 404 解消）は F-1〜F-5（耐性化 + 予防 + backfill）で完結する。AC-1〜AC-8 を満たす実装仕様が確定済みで、追加で本サイクルに取り込むべき必須未タスクは **0 件**。

- 詳細の degraded view（AC-1/2）・route 404 境界（AC-3/4）・ingest 予防（AC-5）・migration backfill（AC-6）・非回帰（AC-7）・apps/web diff 0（AC-8）は全て F-1〜F-5 + テストで網羅。
- 取りこぼした分岐・未カバー経路は検出されなかった。

## baseline: 将来層として分離する候補（2 件・本サイクル対象外）

Phase 10 §10.3 の MINOR を未タスク化候補として記録する。**本サイクルでは着手しない**（過剰スコープ）。

| ID | 候補 | 分離理由（本サイクル対象外の根拠） | 実施時期 | 実施場所 | 推奨優先度 |
|----|------|-----------------------------------|---------|---------|-----------|
| MINOR-FUT-1 | member 作成経路の統一 | `upsertMember`（ingest）と admin 直接作成など複数経路が member_status 生成タイミングを各々持つ。経路の単一化はアーキテクチャ再設計を伴い、本 404 修正の範囲を超える独立した大規模スコープ（CONST_007 例外1）。本タスクは `ensureMemberStatusRow` 予防で再発を止めるに留める | 将来 | 別 Issue / backlog | low（small） |
| MINOR-FUT-2 | `member_status.member_id` への FK 制約導入 | DB レベルで orphan を構造的に禁止する根本策。既存データの整合・migration リスク・SQLite FK pragma 運用の検討が必要で、backfill とは独立の判断を要する独立大規模スコープ（CONST_007 例外1）。本タスクは backfill + ensure で実害を解消する範囲に限定 | 将来 | 別 Issue / backlog | low（medium） |

> 上記 2 件の GitHub Issue 起票は **ユーザーゲート**（本 workflow では起票しない）。起票時は本表の分離理由・優先度をそのまま Issue 本文へ引き継ぐ。

## 関連タスク差分確認（重複起票チェック）

起票前に既存タスク・Issue との重複が無いことを確認する。

| 確認対象 | 結果 | 備考 |
|---------|------|------|
| 既存 workflow（30-workflows）に member 作成経路統一 / member_status FK 制約のタスク | 検出なし | 本 404 修正が初出。重複なし |
| 直前コミット（#1031 / #1029 / #1084 / #1083 / #1074） | 無関係 | photo / OG 関連で本件・MINOR と重複なし |
| 本 404 修正の F-1〜F-5 と MINOR-FUT-1/2 の重複 | なし | F-4 ingest 予防は「ensure 呼び出し追加」、MINOR-FUT-1 は「経路統一の再設計」で別関心 |

> 起票時は `gh issue list` で member_status / FK / 作成経路 のキーワード重複を再確認し、重複が無ければ起票する（ユーザーゲート）。`create_issue.js` はラベルを付けないため、起票後 `gh issue view --json labels` で確認し空なら `--add-label` する（Feedback: create_issue label not applied）。
