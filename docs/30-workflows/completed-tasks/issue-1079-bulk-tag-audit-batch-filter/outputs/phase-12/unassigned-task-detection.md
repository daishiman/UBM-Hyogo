# Unassigned task detection — issue-1079-bulk-tag-audit-batch-filter

> workflow_state=`implemented_local_evidence_captured`。0 件でも出力必須。
> current（本タスクで検出した残課題）と baseline（元タスク仕様書のスコープ外として最初から切り離した関心）を分離する。

## 1. current（本タスクで検出した残課題）

| ID | 残課題 | 判定 |
| --- | --- | --- |
| — | （検出なし） | **0 件** |

- 本タスクのスコープ（AC-1..5）は Task A/B/C に漏れなくマップされ、各 AC に検証可能な記述がある（Phase 1/2 参照）。
- 実装後に TODO / skip / 設計の穴は検出されなかった。AC-5（full scan 方針）は Phase 2 §3 と `api-endpoints.md` の方針明記で充足し、新規残課題を生まない。

## 2. baseline（元タスク仕様書のスコープ外・別関心）

元タスク仕様書（Phase 1 / Phase 2 スコープ）で**最初からスコープ外**として切り離した関心。
本タスクサイクルでは完了させず、将来の別タスク化候補として記録する。

| ID | baseline 候補 | 別タスク化の理由 | トリガ条件 |
| --- | --- | --- | --- |
| B-1 | **audit_log の batchId index 最適化**（generated column / `correlation_id` 列 + index migration） | schema 変更を伴う別関心。親 #1036 が「軽量 batchId 方針（schema 変更なし）」を採択済みで、index 化は migration を伴う。AC-5 は「制限または index 方針の**明記**」のみを要求し、schema 変更自体は要求しない（本タスク scope 外）。 | 将来 audit 行数が増え `json_extract` の full scan コストが運用問題化した場合に、別タスクとして generated column（`batchId` 抽出列）+ index、または `correlation_id` 列 + index migration を検討する。 |
| B-2 | 単一 endpoint（`POST /:memberId/tags` 等）への batchId 付与 | 現状 `after: { tagId, source }` で batchId 無し。bulk のみが batchId を持つ。単一 write への batchId 付与は write 側（#1036 非対象）の別関心。 | 単一 write も一括相関に含めたい運用要求が出た場合。 |

> B-1 の補足: `json_extract(after_json, '$.batchId')` は JSON 列に index が無く full scan になるが、
> 本タスクは (a) keyset cursor + LIMIT、(b) UUID v4 の sparse 性、(c) from/to・action 併用誘導で走査範囲を
> bound する緩和策で釣り合わせる（AC-5 充足）。schema 化はこの緩和策が運用上不足した時点で初めて起票する
> 方針であり、今回サイクルでは完了させない（YAGNI・親 #1036 軽量方針との整合）。

## 3. 関連タスク差分確認（親 / 兄弟との重複チェック）

| 関連タスク | スコープ | 本タスクとの重複 |
| --- | --- | --- |
| `issue-1036-bulk-member-tag-assign`（親 / #1036） | bulk tag write 実装・batchId 生成・埋め込み・audit 記録 | **重複なし**。親は write 側（生成・埋め込み）、本タスクは read 側（検索・表示・copy）。本タスクは write を変更しない。 |
| `task-issue-1036-followup-001`（兄弟 / #1077） | bulk tag UI の staging 認証付き visual baseline 取得 | **重複なし**。followup-001 は `/admin/members` の picker visual、本タスクは `/admin/audit` の batchId 導線。 |
| `task-issue-1036-followup-002`（兄弟 / #1078） | BulkActionBar 大規模 tag catalog の picker UX | **重複なし**。followup-002 は picker の検索/折りたたみ UX、本タスクは audit の検索/表示。 |

- 本タスク（followup-003 / #1079）は親 #1036 の audit 相関を read 側で活用する独立スコープであり、親・兄弟いずれとも機能重複しない。
- B-1（index 最適化）は親 #1036 の軽量方針との整合上、別タスク化が適切（親に巻き戻さない）。

## 4. 検出サマリ

| 区分 | 件数 |
| --- | --- |
| current（新規残課題） | 0 |
| baseline（スコープ外・別タスク化候補） | 2（B-1 index 最適化 / B-2 単一 write batchId 付与） |
| 新規 Issue 起票 | 0（起票は user-gated） |

- 新規 Issue 起票・unassigned-task ファイル化は user-gated（本ファイルでは候補記録のみ）。
- baseline 候補のうち AC-5 に直結する B-1 を最優先の将来タスク候補として明記した。
