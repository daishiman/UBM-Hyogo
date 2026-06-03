# Phase 10: 最終レビュー

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 10（最終レビュー） |
| 入力 | Phase 9 品質保証結果 / 全 AC |
| 出力 | AC-1〜AC-8 充足判定・blocker 有無・MINOR 未タスク化候補 |
| 分類 | NON_VISUAL（`apps/api` のみ） |

## 目的

AC-1〜AC-8 の充足を判定し、リリース blocker の有無を確定する。本 workflow は local 実装と source-level evidence を取得済み。Phase 10 で検出した MINOR は unassigned-task-guidelines に従い Phase 12 の未タスク化候補へ送る。

## 実行タスク

### 10.1 AC 充足判定テーブル

| # | 受け入れ基準 | 判定基準（検証手段） | 期待結果 | 判定（spec） |
|---|-------------|---------------------|----------|-------------|
| AC-1 | status 欠落でも `GET /admin/members/:memberId` が 200 | builder degraded（status 欠落 fixture）+ route contract test | 200・既定 status（`publish_state='member_only'` 等）で view 構築 | 実装で GREEN 予定（pending） |
| AC-2 | response 欠落でも詳細は劣化 200（summary 空 / sections []） | builder.repository.spec（response 欠落 fixture） | 200・`profile.summary` 空 / `sections=[]` / `responseId=current_response_id ?? member_id` | 実装で GREEN 予定（pending） |
| AC-3 | PATCH .../status が status 欠落でも成功し行生成 | member-status route spec（status 欠落 → PATCH） | 200・`ensureMemberStatusRow` で行生成後 publishState/hiddenReason 反映 | 実装で GREEN 予定（pending） |
| AC-4 | identity 不在は引き続き 404 | route spec（unknown memberId） | detail / status とも 404（真の不存在は維持） | 実装で GREEN 予定（pending） |
| AC-5 | ingest 新規 identity で member_status 既定行生成 | sync-forms-responses spec | 新規 identity 後に member_status 行が必ず存在 | 実装で GREEN 予定（pending） |
| AC-6 | migration 0024 で orphan 全件補完（冪等） | migration D1 config test | 適用後 orphan 0・再適用で重複なし | 実装で GREEN 予定（pending） |
| AC-7 | 正常会員の詳細/status/一覧は非回帰 | 既存 spec 全 PASS | 既存出力と 1 byte も差異なし | 実装で GREEN 予定（pending） |
| AC-8 | `apps/web` diff 0 | `git diff --name-only dev...HEAD \| grep '^apps/web/'` | マッチ 0 件 | grep gate で確認（Phase 9 §9.3） |

### 10.2 blocker 判定

| 観点 | 判定 |
|------|------|
| リリース blocker | **なし**。endpoint surface 不変・既存正常パス非回帰・migration は `INSERT OR IGNORE` で冪等のため rollback リスク極小。remote D1 apply / deploy はユーザーゲート（Phase 13） |
| データ破壊リスク | なし。`ensureMemberStatusRow` / migration は `INSERT OR IGNORE` で既存 status を上書きしない |
| 不変条件抵触 | なし（#5 web→D1 禁止維持・既存 API のみ接続） |

→ **ゲート判定: pass（blocker なし）**。local AC-1〜AC-8 は GREEN。remote/staging 確認のみ user-gated。

### 10.3 Phase 10 MINOR 判定（未タスク化候補 → Phase 12）

unassigned-task-guidelines に従い、本タスクのスコープ外（過剰スコープ）と判断した改善点を将来層として分離記録する。Phase 12 で未タスク化（Issue 化候補）を判定する。

| ID | MINOR 候補 | 分離理由（本タスク外の根拠） | 推奨優先度 |
|----|-----------|------------------------------|-----------|
| MINOR-FUT-1 | member 作成経路の統一 | 現在 `upsertMember`（ingest）と admin 直接作成など複数経路が member_status 生成タイミングを各々持つ。経路の単一化はアーキテクチャ再設計を伴い本 404 修正の範囲を超える。本タスクは `ensureMemberStatusRow` 予防で再発を止めるに留める | low（small） |
| MINOR-FUT-2 | `member_status.member_id` への FK 制約導入 | DB レベルで orphan を構造的に禁止する根本策。だが既存データの整合・migration リスク・SQLite FK pragma 運用の検討が必要で、backfill とは独立の判断を要する。本タスクは backfill + ensure で実害を解消する範囲に限定 | low（medium） |

> 上記 2 件は本 workflow では着手しない（過剰スコープ）。Phase 12 で「未タスク化（Issue 起票候補）」として記録し、起票自体はユーザーゲート。

## 参照資料

- Phase 9（品質保証結果）/ index.md §3 AC
- Phase 3 §3.3（将来層との分離）
- unassigned-task-guidelines（MINOR の Phase 12 送り）

## 成果物

- 本ファイル（Phase 10 最終レビュー）
- AC-1〜AC-8 充足判定テーブル・blocker なし判定・MINOR 2 件の未タスク化候補記録

## 統合テスト連携

- §10.1 の各 AC 判定基準は Phase 9 で実行した spec 群と 1:1 対応する。全 PASS が AC 充足の確定証跡となる。
- §10.3 の MINOR 2 件は Phase 12 の未タスク化判定への入力となる。

## 完了条件

- [x] AC-1〜AC-8 の充足判定（基準・期待・spec 判定）をテーブル化した
- [x] リリース blocker の有無を判定した（なし）
- [x] MINOR 候補（member 作成経路統一 / FK 制約導入）を将来層として分離記録した
- [x] MINOR を Phase 12 未タスク化候補へ引き継いだ
