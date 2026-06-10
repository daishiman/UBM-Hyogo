# Phase 12: 未タスク検出（unassigned-task-detection）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_evidence_captured |

## 目的

元タスク仕様書のスコープ外事項、Phase 3/10 の MINOR 指摘、Phase 11 計画事項、コードコメント TODO を確認し、本サイクルで起票すべき未タスクを検出する。0 件でも出力する。current（本サイクルで完結）と baseline（既存・技術的理由で本サイクル対象外）を分離する。

## 検出ソースと結果

### 1. 元タスク仕様書のスコープ外（index.md「既知のスコープ外」）

| 事象 | 候補化 | 起票判定 |
| --- | --- | --- |
| `[Sentry] Sentry.init() in a browser extension` 警告 | 候補外 | ブラウザ拡張バンドル由来・自社外。既存 `sentry-extension-noise-filter` で対応済み観点・起票しない |
| `member_tags.source` への DB CHECK 制約追加 | baseline 候補 | schema/migration 変更は不変条件で禁止。値の正本是正はコード層（`normalizeTagSource`）で吸収。migration 別タスク（下記 baseline B-2） |
| `MemberTagsEditor` 子コンポーネントの個別エラー回復強化 | baseline 候補 | 詳細 fetch（ドロワー本体）の回復で症状を解消。子の tags fetch は成功時のみマウントされ本不具合の経路ではない（下記 baseline B-1） |
| seed データの source 値そのものの是正 | 候補外 | コード側 fail-soft 吸収を正本とする方針（ユーザー承認）。seed 書き換えは不採用・起票しない |

### 2. Phase 3/10 の MINOR 指摘

| 指摘 | 検出 |
| --- | --- |
| Phase 3/10 MINOR | 0 件（4 条件 PASS・Lane A / Lane B は関心分離済・代替案は不採用理由確定済） |

### 3. Phase 11 計画事項

Phase 11 は implemented_local_evidence_captured のため focused Vitest は実行済み、staging runtime screenshot は user-gated（計画のみ）。本 wave で実行由来の新規発見は無い。

| 発見 | 検出 |
| --- | --- |
| Phase 11 計画由来の新規発見 | 0 件（実行は実装サイクル / user-gated） |

### 4. コードコメント TODO

対象実装ファイル（4 ファイル編集 + 3 spec 新規）に本タスク由来の新規 TODO/FIXME を残さない方針。既存 TODO の検出は無い。

| TODO | 検出 |
| --- | --- |
| 新規 TODO/FIXME | 0 件 |

## current / baseline 分離

| 区分 | 内容 |
| --- | --- |
| current（本サイクルで完結） | Lane A（`normalizeTagSource` 新設 + `TagSourceZ` `.catch("manual")` + `builder.ts` 357/429 置換 + 回帰テスト）/ Lane B（`MemberDrawer` 再試行導線 + テスト）。先送り・別 PR・バックログ送りは無し。**新規未タスク: 0 件** |
| baseline（既存・技術的理由で本サイクル対象外） | 下表 B-1 / B-2。今回サイクルの先送りではなく、index.md「既知のスコープ外」と整合する技術的なスコープ外 |

### baseline 候補（起票しない・本経路外 / 不変条件抵触のためスコープ外）

| ID | 内容 | 本サイクル対象外の技術的理由 | 対応先 |
| --- | --- | --- | --- |
| B-1 | `MemberTagsEditor` 子 fetch の個別 retry 強化 | 子 `MemberTagsEditor` は詳細 fetch 成功時の `MemberDrawerBody` 内でのみマウントされ、本不具合（詳細 fetch 500）の経路では走らない。本サイクルの回復対象はドロワー本体の詳細 fetch であり、子の個別回復は別関心（MINOR・本経路外） | 将来の UI 堅牢化タスク（別ワークフロー）。`createdPendingAttach` の attach retry は既存実装済みのため tags 取得 fetch の retry のみが残課題 |
| B-2 | `member_tags.source` への DB CHECK 制約追加 | D1 schema 変更・migration 追加は本ワークフローの不変条件で禁止。値ドメインの正本是正はコード層（`normalizeTagSource`）の fail-soft 吸収を正本とする（ユーザー承認）。CHECK 制約は将来 migration タスクで別途検討 | 別ワークフロー（migration タスク）。実施時は既存 seed の `'seed'` 値の扱い（書き換え or 許容拡張）を先に決定する必要あり |

> B-1 / B-2 は index.md スコープ外表と整合する技術的スコープ外。今回サイクルの先送りではなく、本経路外（B-1）/ 不変条件抵触（B-2）が起票しない理由。current 側に追加すべき未タスクは無い。

## 関連タスク差分確認（FB-CANCEL-004-2: 重複起票防止）

| 確認項目 | 結果 |
| --- | --- |
| 既存 issue との重複 | 本ワークフローは `relatedIssue=null`（staging 観察起点）。baseline B-1 / B-2 は起票しないため重複の発生なし |
| 兄弟ワークフローとの重複 | `member_tags.source` 値ドメイン不一致による admin 詳細 500 を扱う既存 WF は無い。重複なし |
| 既存タスク ID との統合先確認 | B-1 の attach retry は `issue-1068`（`createdPendingAttach` / `tag-attach-retry`）で別観点が実装済み。本 baseline は tags **取得** fetch の retry であり統合先は無し（起票しないため統合不要） |
| 本サイクル内タスク間の重複 | Lane A（shared/api 値正規化）/ Lane B（web UI 回復）は関心分離済・重複なし |

## 検出結果サマリ

**新規未タスク（current）: 0 件。新規 Issue: 0 件。** current の Lane A / Lane B は本サイクルで完結。baseline B-1 / B-2 は技術的スコープ外（本経路外 / 不変条件抵触）のため起票しない。

## 完了条件

- [x] スコープ外/MINOR/Phase11計画/TODO の 4 ソースを確認
- [x] B-1（MemberTagsEditor 子 fetch retry）/ B-2（DB CHECK 制約）を baseline 候補として記録（起票しない技術的理由を明記）
- [x] current（0 件）/ baseline（2 件）を分離
- [x] 「関連タスク差分確認」セクションを設置（FB-CANCEL-004-2）
- [x] current 検出 0 件として出力

## 成果物

- `outputs/phase-12/unassigned-task-detection.md`（本ファイル）

## 参照資料

- `index.md`（既知のスコープ外表）
- `_shared-context.md` §6（不変条件・スコープ外）
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（`MemberTagsEditor` マウント条件 / `issue-1068` attach retry）
