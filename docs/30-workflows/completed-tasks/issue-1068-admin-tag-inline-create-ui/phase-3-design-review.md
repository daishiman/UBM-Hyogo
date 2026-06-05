# Phase 3: 設計レビュー（ゲート）

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

Phase 4（テスト作成）へ進めるかを判定する。状態機械が閉じているか・責務分離が破綻しないか・2 失敗モードが UI で回収可能か・既存 issue-982 編集 UI への regression リスクを審査する。

## 4 条件評価（一次結論）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | OK | drawer 内で「tag 作成 → member 付与」が完結し「タグ管理へ」遷移が不要になる。管理者の操作コストを削減 |
| 実現性 | OK | `apps/api` 変更ゼロ。既存 `POST /admin/tags`（#1073）/ `assign` mutation（#982）/ `FormField` / `TagPill` / `useAdminMutation` の流用で初回完結 |
| 整合性 | OK | create（master write）と attach（junction write）の責務を状態機械で分離。付与は親 `assign` 再利用で issue-982 と一本化し二重化しない |
| 運用性 | OK | client validation + 409 回収 + 部分成功リトライで、重複作成・部分成功の失敗が操作を詰まらせない |

一次結論: **4 条件すべて充足。PASS 前提でレビュー観点を審査する。**

## レビュー観点と判定

| # | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| R1 | 状態機械の正常経路が閉じているか | PASS | `idle → form → submitting → idle`（201）が Phase 2 遷移詳細で確定。`onTagCreated` で親へ委譲後 fields クリア |
| R2 | 状態機械のエラー経路が閉じているか | PASS | 409 → `conflict`、400/例外 → `form`。`submitting` から漏れなく復帰（ロック解放経路テーブル） |
| R3 | 状態機械のキャンセル経路が閉じているか | PASS | `form → idle`（キャンセル）で fields / errors クリア |
| R4 | create と attach の責務分離が破綻しないか | PASS | create = `POST /admin/tags`（子）、attach = 親の既存 `assign` 再利用。子は付与を実行しない（`onTagCreated` 委譲） |
| R5 | 部分成功（201 後 attach 失敗）の回収 | PASS | 親 `createdPendingAttach` で作成済み tag を保持し、再 create せず attach のみリトライ。master 重複作成を回避 |
| R6 | conflict（409）の回収 | PASS | member tags 再取得 → 同 code 既存 tag を `available` に提示 → 既存 pill 選択で attach。重複 POST を発生させない |
| R7 | client validation の網羅 | PASS | code（空/regex/長さ）/ label（空/長さ）/ category（空/長さ）を server 規則と一致させ FormField error 化。server 400 は包括フォールバック |
| R8 | web invariant 準拠 | PASS | `useAdminMutation` 経由（#10）/ `FormField` 経由で生 `<input>` 増やさない（#9）/ OKLch token のみ（#5）/ `apps/api` 不変（#7） |
| R9 | issue-982 への regression リスク | PASS | 既存 `assign`/`unassign`/pill 編集ロジックを変更せず再利用。inline-create は補助ブロックとして additive。AC-5 / C-T7 で B-T1〜B-T8 green 維持を確認 |
| R10 | レイアウト衝突（AC-6） | PASS | inline-create 操作部品を pill 群と縦分離。Phase 11 で desktop/mobile screenshot 確認 |
| R11 | 1 PR サイクル完結（CONST_007） | PASS | task-A/B/C は同一 PR。先送りなし |

## 命名規則 vs 実装名の照合

| 設計名 | 既存衝突 | 判定 |
| --- | --- | --- |
| `MemberTagInlineCreate`（component） | なし（`MemberTagsEditor` と別物） | OK（`_members/` の `Member<対象><動詞>` 慣習に整合） |
| `createTag`（web client helper） | `assignMemberTag` / `fetchTagMaster` 等と別物 | OK（master write の動詞始まり） |
| `parseTagErrorCode` | なし | OK |
| `AdminTagCreateErrorCode`（型） | `AdminTagRef` と別物 | OK |
| `createdPendingAttach`（親 state） | `pendingTagId`（issue-982）と別物 | OK（attach 中ロックと作成保留を区別） |

## 残リスクと対策

| リスク | 対策 |
| --- | --- |
| create 201 → attach 失敗で tag が宙に浮く | `createdPendingAttach` 保持 + attach リトライ導線（C-T6）。master には残るため再 create はしない |
| conflict 後に同 code を再送信して 409 連発 | `conflict` state で再送信せず、既存 tag 選択へ誘導（C-T5）。重複 POST を構造的に防ぐ |
| client validation と server 規則の乖離 | 両者を同一規則（code regex / 長さ）で固定し、Phase 4 C-T3 で client ブロック、C-T4 で server 400 フォールバックを別々に検証 |
| 既存 drawer pill 編集の退化 | inline-create は additive。既存ロジック非改変。C-T7 で issue-982 B-T1〜B-T8 の green 維持を assert |
| drawer 幅で操作部品と pill が重なる | 縦分離レイアウト + Phase 11 desktop/mobile evidence（AC-6 / C-T 補助） |

## 判定

**APPROVED（PASS）— Phase 4 へ進行可。**

## gate 基準（Phase 4 進行条件）

- R1〜R11 全 PASS（達成）。
- 4 条件（価値性・実現性・整合性・運用性）すべて OK（達成）。
- 命名衝突なし（達成）。
- CONDITIONAL / FAIL の項目なし。

## 参照資料

- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/phase-2-design.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行タスク

- 本 Phase の記載内容（gate 基準）を実装時の進行判定として使用する。

## 成果物

- 本ファイル（4 条件一次結論 + R1〜R11 判定 + 残リスク + PASS 判定）

## 統合テスト連携

- 実装時は Phase 4 の focused tests と Phase 11 evidence ledger に接続する。

## 完了条件

- 4 条件評価が一次結論として先頭に記載されている
- R1〜R11 が判定付きで列挙され全 PASS である
- 状態機械の正常 / 異常 / キャンセル経路の閉性が審査されている
- 判定（PASS / CONDITIONAL / FAIL）が明示され、PASS の gate 基準が記載されている
