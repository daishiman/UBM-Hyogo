# Phase 12: 未タスク検出

## メタ情報
正本: `outputs/phase-12/unassigned-task-detection.md` / 上位 SSOT: `../../_shared-context.md`

| 項目 | 値 |
|------|------|
| taskType | `implementation` |
| workflow_state | `implemented_local_evidence_captured` |

## 目的
本ワークフローのスコープ内で発生する未タスクを current / baseline に分離して検出し、既存 Issue #1189〜#1192（`profile-session-fetch-failure-investigation` 由来）との関係を確認して重複起票を防ぐ。

---

## 1. current 未タスク（本サイクルで完結すべき残件）

**current 未タスク: 0 件。**

本ワークフローのスコープ（F-1〜F-3 の解消 = T01〜T04）は CONST_007 に従い後続実装プロンプト 1 サイクルで完結する設計であり、スコープ内に未割当の残件はない。fail-soft 統一（T01）・`UBM-5001` 分類（T02）・契約テスト（T03）・Issue 最適化草稿（T04）はすべて Phase 5 のタスク仕様に割り当て済みで、先送り分割をしていない。

> current 0 件であることを明記する（0 件回避のための形式記録ではなく、実際にスコープ内残件が無いことの確認結果。同サイクル解消不能な外部依存も存在しない）。

## 2. baseline（既存 Issue #1189〜#1192 との関係・新規起票なし）

前身 WF `profile-session-fetch-failure-investigation` 由来の 4 Issue が C-1〜C-4 系の deferred 論点を保持している。本 WF の対象は **#1190 のみ**であり、他 3 件は別責務として現状維持する。

| Issue | タイトル（要旨） | 本 WF との関係 | 扱い |
|-------|------------------|----------------|------|
| **#1190** | `[profile-session FU C-2] /me 5xx の根治（session-resolver / API worker / D1）` | **本 WF の対象**。起票時ブロッカー `deferred_pending_root_cause`（真因 H4 確定待ち）は Phase 1 静的監査（P1-P8 経路マップ）で解消し、F-1〜F-3 として現行コードに再定義した。最適化コメント草稿 = `issue-1190-comment-draft.md`（投稿は user-gated） | 本 WF（T01-T04）で解決。Issue mutation は user-gated（AC-10） |
| #1189 | `[profile-session FU C-1] 410 (is_deleted member) の本格対応（復帰 or 明示誘導）` | 別責務（H3 系・410 復帰運用）。本 WF は 410 挙動に触れない（status 体系不変・AC-4） | 現状維持（本 WF から変更・統合なし） |
| #1191 | `[profile-session FU C-3] transport デプロイ齟齬の運用是正（旧 bundle 残存）` | 別責務（H5 系）。`profile-session-staging-transport-recovery` WF（apps/web / env 層・別ブランチ）の管轄で、本 WF と編集領域非重複 | 現状維持（本 WF から変更・統合なし） |
| #1192 | `[profile-session FU C-4] 管理者アカウントの /profile 専用 UX` | 別責務（apps/web UX）。本 WF は apps/web 非接触（AC-6） | 現状維持（本 WF から変更・統合なし） |

### 検出時のみ記録する横展開候補（起票しない）

SSOT §8 のとおり、`/me` 以外の route（admin / public）にも P1-P4 と同型の「D1 例外が汎用 `UBM-5000` に丸まる」構造が存在し得るが、本 Issue（#1190 = `/me` 系）の責務外である。同サイクル解消不能な外部依存ではなく「別 Issue の責務になり得る将来候補」のため、原則（検出時のみ記録・起票せず）に従いここに記録のみ行う。実際に横展開する場合は `/me` での T01-T03 の実装・運用実績を前例として別途起票する。

## 3. 起票方針（implemented_local_evidence_captured）

| 項目 | 値 |
|------|------|
| current 未タスク起票 | なし（current 0 件） |
| baseline 未タスク起票 | **なし（新規 Issue 起票なし）**。#1190 は本 WF が解決対象、#1189/#1191/#1192 は既存のまま別責務 |
| Issue #1190 への反映 | 草稿（`issue-1190-comment-draft.md`）作成済み。投稿・ラベル変更・close は user-gated（Phase 13 G3） |

## 完了条件
- [x] current 未タスク（0 件・CONST_007 で全タスク完結）を明記した。
- [x] baseline として既存 Issue #1189〜#1192 との関係（#1190 が本 WF の対象・他は別責務）を表で記録した。
- [x] 新規 Issue 起票なしを明記した（横展開候補は記録のみ）。

## 成果物
- `outputs/phase-12/unassigned-task-detection.md`（本ファイル）

## 参照資料
- `../../_shared-context.md` §1（再定義）/ §8（スコープ外）
- 既存 Issue #1189 / #1190 / #1191 / #1192（`profile-session-fetch-failure-investigation` 由来）
- `issue-1190-comment-draft.md`（T04 草稿）

## 統合テスト連携
本サイクル（T01-T03）完了後、`issue-1190-comment-draft.md` を user-gated で #1190 へ投稿し、本 WF の成果（経路マップ・F-1〜F-3 解消・契約テスト）を Issue 側へ反映する。#1189/#1191/#1192 には影響しない。
