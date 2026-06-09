# Unassigned Task Detection（member-data-source-precedence-and-profile-session-fix）

> current（本サイクルで起票すべき未タスク）と baseline（真の OOS = 別タスク/将来）を分離する。
> CONST_007（先送り禁止）: 本ワークフローの全 Lane は 1 実装サイクル内で完了するスコープであり、
> Lane の一部を「将来タスク化」して縮小することは禁止。baseline は元々スコープ外の独立案件のみ記録する。

## Current（本サイクルで起票すべき未タスク）

**0 件。**

根拠:
- Phase 1-3 の設計ゲートで Lane A-E はすべて 1 実装サイクル内で完了するスコープに収めた（Phase 3 §3 でコスト不均衡項目
  = 別 provenance テーブル / 汎用 alias 機構を初期スコープから除外済み）。
- Phase 10 相当の MINOR は本 spec 作成では新規発生なし（設計確定済み・残論点 R-1..R-5 はすべて Phase 3 §5 で「決定」済み）。
- 残論点はいずれも「決定」で閉じており、未決でブロックする項目なし（Phase 3 §5）。
- implemented_local_runtime_pending のため実装 TODO / skip は存在しない（コード未着手）。

## Baseline（真の OOS = 別タスク / 将来・本サイクルでは起票しない）

| ID | 項目 | 区分 | 起票しない理由 |
|----|------|------|----------------|
| **OOS-1** | 汎用 alias / questionId 駆動の label 解決機構（実ラベル変更耐性の恒久化） | 将来改善 | 不変条件 #1 配慮として Phase 2 §2.5 / Phase 3 §3 で YAGNI 判断。実ラベル直接是正 + 既存 `schema_diff_queue`/alias 範囲で本タスクは充足。新機構導入は別 WF（コスト高・本サイクル価値に不要） |
| **OOS-2** | enum 値正規化（zone/status）の検索 UI 側整形・全項目の正規化辞書 | 別タスク | 本タスクは「`response_fields` への書込が成立する（AC-1）」最小範囲で zone/status のみ正規化。検索/フィルタ UI の値ドメイン整形は既存 WF `members-search-filter-ux-and-api-fix`（MEMORY 記録）に委ねる（R-3 決定） |
| **OOS-3** | `/me` を会員未登録時に 404 / `MEMBER_UNREGISTERED` で返す外形契約変更 | 将来検討 | Phase 2 §5.2 / Phase 3 R-1 で「`/me` 外形契約（MeSessionResponse shape）を変えない最小変更」を採用。`MEMBER_SESSION_404` web 分岐は将来の 404 化に備えた防御コードとして用意済み。契約変更は別 WF |
| **OOS-4** | D1 down migration 機構（`member_field_overrides` DROP / 列削除の正式 rollback） | 将来整備 | D1 に down migration 機構が無いため、rollback は手動 SQL（Phase 13 §5 に記述）。正式な down migration framework は本タスクのスコープ外（既存 migration も同様に down 無し） |
| **OOS-5** | admin field editor の bulk 編集 / 一括 override（複数会員横断） | 将来 UI 統合 | 本タスクは member 単位の `PUT /admin/member-fields/:memberId`（部分更新可）。複数会員横断の bulk override は YAGNI（既存 bulk tag 機構とは別系統・現要件に無い） |

## 判定

- current 起票必要 = **0 件**。
- baseline は元々独立案件（別 WF / 将来 / 契約変更）であり、本サイクルの Lane 縮小ではない（CONST_007 違反なし）。
- いずれも `related_issue=null` の本 WF からの逆引き起票は不要（投機的 baseline 起票は行わない）。
