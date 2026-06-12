# Phase 12: 未タスク検出

## メタ情報
正本: `outputs/phase-12/unassigned-task-detection.md` / 上位 SSOT: `../../_shared-context.md`

| 項目 | 値 |
|------|------|
| taskType | NON_VISUAL |
| workflow_state | `implemented_local_evidence_captured` |

## 目的
本ワークフローのスコープ内で発生する未タスクを current / baseline に分離して検出し、baseline の `deferred_pending_root_cause`（真因確定後の本格修正）が既存 Issue #1189-1192 と重複しないかを確認して統合先を明記する（FB CANCEL-004-2）。

---

## 1. current 未タスク（本サイクルで完結すべき残件）

**current 未タスク: 0 件。**

本ワークフローのスコープ（観測性強化 + localhost fail-closed）は T01〜T04（phase-5）で 1 サイクル完結する設計であり、スコープ内に未割当の残件はない。観測性強化（ログ拡張）・fail-closed（throw 経路）・diagnose echo 拡張はすべて本サイクルのタスクに割り当て済み。

> current 0 件であることを明記する（0 件回避のための形式記録ではなく、実際にスコープ内残件が無いことの確認結果）。

## 2. baseline 未タスク（スコープ外・真因確定後に着手）

真因の本格修正は staging 実機で真因（C1/C2/C3）が確定するまで方針を決められないため、本サイクルでは着手せず baseline の `deferred_pending_root_cause` として記録する（CONST_007 例外①: 合意未済の仕様分岐・先送りではない）。

| ID | 内容 | 区分 | 着手条件 |
|----|------|------|----------|
| B-1 | 410（`member_status.is_deleted=1`）の本格対応（復帰導線 or 明示誘導） | `deferred_pending_root_cause` | Phase 11 MT-D で C1（410）が真因確定したとき |
| B-2 | `/me` 5xx の根治（session-resolver / API worker / D1）= `apps/api` 改変を要する | `deferred_pending_root_cause` | Phase 11 MT-D で C2（5xx）が真因確定したとき |
| B-3 | transport デプロイ齟齬の運用是正（旧 bundle 残存 / service-binding 未応答） | `deferred_pending_root_cause` | Phase 11 MT-D で C3（transport 失敗）が真因確定したとき |
| B-4 | 管理者アカウントの `/profile` 専用 UX（管理者が member identity/status を持たない場合） | `deferred_pending_root_cause` | 真因が管理者アカウント固有と判明したとき |

## 3. 関連タスク差分確認（既存 Issue #1189-1192 との重複チェック）

本ワークフローの前身 `profile-session-fetch-failure-investigation` が、同じ deferred 本格修正を Issue 化済み（すべて OPEN・`status:unassigned`）。本タスクの baseline 未タスク（B-1〜B-4）はこれらと **同一論点**であり、新規起票せず既存 Issue に統合する。

| 本タスク baseline | 既存 Issue | 状態 / ラベル | 重複判定 | 統合先 |
|-------------------|-----------|---------------|----------|--------|
| B-1（410 本格対応） | **#1189** `[profile-session FU C-1] 410 (is_deleted member) の本格対応（復帰 or 明示誘導）` | OPEN / `priority:low`,`status:unassigned`,`type:feature`,`area:api`,`area:web` | 重複（同一論点） | **#1189 に統合**（新規起票しない） |
| B-2（5xx 根治） | **#1190** `[profile-session FU C-2] /me 5xx の根治（session-resolver / API worker / D1）` | OPEN / `priority:medium`,`status:unassigned`,`type:bugfix`,`area:api` | 重複（同一論点） | **#1190 に統合**（新規起票しない） |
| B-3（transport 運用是正） | **#1191** `[profile-session FU C-3] transport デプロイ齟齬の運用是正（旧 bundle 残存）` | OPEN / `priority:low`,`status:unassigned`,`area:api`,`type:followup` | 重複（同一論点） | **#1191 に統合**（新規起票しない） |
| B-4（管理者 /profile UX） | **#1192** `[profile-session FU C-4] 管理者アカウントの /profile 専用 UX` | OPEN / `priority:low`,`status:unassigned`,`type:improvement`,`area:web` | 重複（同一論点） | **#1192 に統合**（新規起票しない） |

### 統合の根拠と差分

- 本タスクは前身調査の真因仮説（C1/C2/C3）を**実機ログで一意確定できる観測性**を与える側であり、本格修正そのものは行わない。したがって本格修正の追跡先は前身が起票済みの #1189-1192 が正本。
- 唯一の差分は「真因確定の根拠」が前身では `/me` HTTP status の DevTools 観測・D1 read-only だったのに対し、本タスクでは `server_fetch_failed` ログの `{transportKind, baseHost, status}` 実機観測（MT-A〜MT-D）が加わる点。真因確定後に対応する Issue（#1189-1192 のいずれか）へ「本タスクの実機ログで確定」と根拠を追記する形で統合する（実 Issue 編集は user-gated）。
- **新規 Issue の起票は不要。** 既存 4 Issue が C1〜C4 を網羅し OPEN・`status:unassigned` で生存しているため、重複起票は避ける。

## 4. 起票方針（implemented_local_evidence_captured）

| 項目 | 値 |
|------|------|
| current 未タスク起票 | なし（current 0 件） |
| baseline 未タスク起票 | なし（既存 #1189-1192 に統合・新規起票しない） |
| 実施タイミング | 真因確定後（Phase 11 MT-D）に該当 Issue へ根拠追記（user-gated） |

## 完了条件
- [x] current 未タスク（0 件）を明記した。
- [x] baseline 未タスク（B-1〜B-4・`deferred_pending_root_cause`）を記録した。
- [x] 関連タスク差分確認セクションで既存 #1189-1192 との重複をチェックし、統合先を明記した（新規起票しない）。

## 成果物
- `outputs/phase-12/unassigned-task-detection.md`（本ファイル）

## 参照資料
- `../../_shared-context.md` §10（スコープ外）
- 既存 Issue #1189 / #1190 / #1191 / #1192（`profile-session-fetch-failure-investigation` 由来）
- `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/unassigned-task/*.md`

## 統合テスト連携
真因確定（Phase 11 MT-D で C1/C2/C3）後、対応 Issue（#1189-1192）へ実機ログ根拠を追記して本格修正の方針決定に引き継ぐ（user-gated）。
