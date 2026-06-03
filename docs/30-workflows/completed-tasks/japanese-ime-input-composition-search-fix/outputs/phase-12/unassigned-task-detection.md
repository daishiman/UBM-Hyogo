# 未タスク検出（Phase 12）

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- workflow: `docs/30-workflows/japanese-ime-input-composition-search-fix`
- workflow_state: `spec_created`
- 作成日: 2026-06-02

## 判定サマリ

| 項目 | 値 |
| --- | --- |
| 今回タスク由来の必須未タスク | **0 件** |
| 新規 Issue 起票 | 不要（本サイクルスコープで完結） |
| 横展開候補（将来候補・実害なし） | 2 件（下記） |
| 配置先 | `docs/30-workflows/unassigned-task/`（本 wave は新規ファイル作成なし） |

本タスクのスコープ（共有フック新設 + `Search` 改修 + ×重複解消 + 配線確認 + `Input` opt-in）は
1 サイクルで完結し、AC-1〜AC-7 を充足する設計が確定済み。**必須の未タスクは 0 件**と判定する。

## current / baseline 分離

| 区分 | 値 | 説明 |
| --- | --- | --- |
| current（本タスク差分由来の未タスク） | 0 件 | 本 workflow のスコープ内で要件・AC・設計・テスト設計がすべて閉じている |
| baseline（既存 repo 全体の未対応） | 本タスク非関連 | IME-safe 横展開候補は別関心であり、本タスクの remediation 対象ではない |

> current=0 のため、本タスクは「未タスクを生まない完結タスク」。baseline 側の横展開候補は下記に分離記録する。

## 横展開候補（将来候補・「問題が存在しない別関心」）

以下は **「分量が多いから先送り」ではなく「現状その箇所では IME 破綻が発生しない別関心」** である。
共有フック `useImeSafeInput` は将来適用できる形で提供するが、本サイクルでは配線変更しない。

### 候補 (a): admin の理由記述 textarea 群

| 対象 | 現状の挙動 | 横展開の余地 |
| --- | --- | --- |
| `IdentityConflictRow`（理由入力） | **submit 型**。onChange が親再描画/URL 更新を起こさず input 再 mount もしないため IME 破綻が発生しない | submit 前の draft 保持を共有フックに揃えると一貫性が増す（必須ではない） |
| `RequestConfirmDialog`（理由入力） | 同上（submit 型・実害なし） | 同上 |
| `TagsQueueResolveDrawer`（理由入力） | 同上（submit 型・実害なし） | 同上 |

> これらは「検索のように 1 文字ごとに `router.replace` を発火する」構造ではなく、確定/submit 時に値を読むため、
> composition 中の再設定が起きない。よって **現状実害なし**。共有フック化は将来の DRY 改善候補に留める。

### 候補 (b): `SchemaDiffHistoryPanel` の `questionTextLike` フィルタ

| 対象 | 現状の挙動 | 横展開の余地 |
| --- | --- | --- |
| `SchemaDiffHistoryPanel`（`questionTextLike` クライアントフィルタ） | form submit 型でクライアント側フィルタのため、入力中に外部再描画で value を再設定しない。IME 破綻なし | 共有フック適用で他検索系と挙動を統一できる（必須ではない） |

## 関連タスク差分確認

| 確認観点 | 結果 |
| --- | --- |
| 既存の同種 IME 修正タスク | なし（admin `MembersFilters` は個別実装で IME-safe 済み。共通化未実施） |
| 既存 remediation task（unassigned-task 配下） | 本タスクに紐づく既存 remediation なし（baseline violations は本タスク非関連） |
| 重複起票リスク | なし（横展開候補は Issue 化せず本ファイルに記録のみ） |

## 配置監査（本 wave）

| 項目 | 結果 |
| --- | --- |
| 新規未タスクファイル | なし（必須未タスク 0 件のため `docs/30-workflows/unassigned-task/` 配下に新規作成なし） |
| current violations（本タスク差分） | 0 |
| baseline violations | 本タスク非関連（横展開候補は別関心として分離記録） |

## 結論

必須未タスクは **0 件**。本タスクはスコープ内で完結する。横展開候補 2 件（admin 理由 textarea 群 /
`SchemaDiffHistoryPanel`）は **現状実害のない別関心**として記録し、将来 `useImeSafeInput` を適用しうる
基盤として `Input` の opt-in を残す。新規 Issue 起票・新規未タスクファイル作成は行わない。
