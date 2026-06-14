# Phase 3 成果物: alternatives（代替案比較の詳細）

> 状態: completed。Phase 2 で残した 2 判断事項の代替案比較と決定根拠。

## 1. ダイアログ diff 表示（AC-8）

| 案 | 内容 | 利点 | 欠点 | 採否 |
| --- | --- | --- | --- | --- |
| 案 A | `RequestQueuePanel.tsx` の `destructiveMessage` 生成箇所で具体遷移文言（「公開状態を『公開』から『非公開』へ変更します。」）を組み立てる。`RequestConfirmDialog` props 非追加。92 行表示条件を `destructiveMessage` 単独へ緩和 | 既存テスト破壊リスク最小。最小スコープで AC-8 充足。props readonly 契約不変 | 92 行緩和に伴い `RequestConfirmDialog.spec.tsx` の追従が 1 箇所必要 | **採用** |
| 案 B | `RequestConfirmDialog` に `before`/`after` props を追加し、ダイアログ内に詳細パネルと同じ diff DOM を描画 | ダイアログでも視覚 diff が出る | `RequestConfirmDialogProps`（9-17 行）の readonly 契約変更 + 既存テスト追従増。視覚 diff はダイアログでは過剰 | 不採用 |

**決定**: 案 A。92 行を `isDestructive && destructiveMessage` → `destructiveMessage` 単独表示へ緩和し、`isDestructive` は `<p role="alert">` の警告トーン制御に限定。delete=警告トーン + 退会文言、visibility=通常トーン + 遷移文言を出し分ける。

## 2. 申請内容 dd（70-73 行 `summarizePayload`）

| 案 | 内容 | 利点 | 欠点 | 採否 |
| --- | --- | --- | --- | --- |
| 案 A | `visibility_request` は申請内容（`desiredState: hidden` 生表示）を diff 行へ統合し、生英語を除去。`delete_request` は申請内容 dd を残す | AC-3（英語値露出なし）と整合。冗長表示解消 | `summarizePayload` の役割を delete 限定に再定義する必要 | **採用** |
| 案 B | 申請内容 dd を全 note_type で残し diff 行を別途追加 | 既存表示を一切いじらない | `desiredState: hidden` の生英語が残り AC-3 に反する。現在値と目標値の冗長表示が継続 | 不採用 |

**決定**: 案 A。`summarizePayload`（12-20 行）は `delete_request` の理由表示等に役割を限定するか、`visibility_request` では diff 行に置換する。

## 3. helper 配置（Phase 5 で最終確定する補助判断）

| 案 | 内容 | 備考 |
| --- | --- | --- |
| 案 i | `RequestQueueDetail.tsx` 内に定義し export、`RequestQueuePanel` から import | ファイル増やさない。RequestQueueDetail が helper owner |
| 案 ii | `apps/web/src/components/admin/publishStateDiff.ts` を新規作成し両者から import | 関心分離。spec も独立して切れる |

> いずれも `apps/web/src/components/admin/` ローカルに閉じ、公開 surface へ昇格しない。最終配置は Phase 5 runbook で確定（どちらでも AC-6 / invariant を満たす）。
