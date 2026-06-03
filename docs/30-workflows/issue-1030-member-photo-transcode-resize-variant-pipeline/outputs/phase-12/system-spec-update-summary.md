# システム仕様更新サマリ — issue-1030

## Step 1-A: 完了タスク記録

- workflow `issue-1030-member-photo-transcode-resize-variant-pipeline` を `spec_created` で記録し、2026-06-01 実装レビューで local implementation present として追記。
- 親 #983 の followup-003 として位置づけ。

## Step 1-B: 実装状況

| 項目 | status |
|------|--------|
| Phase 1-13 spec | spec_created origin / implementation review addendum あり |
| コード実装 | local implementation present（commit / push / PR なし） |

## Step 1-C: 関連タスク

| 関連 | 状態 |
|------|------|
| #983 R2 storage 基盤 | CLOSED / 実装済（PR #1038） |
| #1029 公開メンバー表示（followup-002） | CLOSED / 別レーン（公開 thumb 露出はこちら） |
| #1031 self upload（followup-001） | OPEN / 別レーン |
| M-1 content_hash R2 dedup | 未タスク候補（unassigned-task-detection.md で判定） |

## Step 2: 新規インターフェース判定

- MemberDetail viewmodel の `photoThumbUrl?: string`、`member_photos` の variant メタ列、`POST /admin/members/:id/photo` の multipart 拡張は 2026-06-01 時点の local implementation に存在。
- aiworkflow-requirements の workflow inventory は planned から local implementation present に同期済み。既存正本構造では本 workflow inventory が issue-1030 の API / DB / shared / web contract の反映先であり、追加の正本ページ新設は不要。

## workflow-local 同期 / aiworkflow-requirements sync

- workflow-local: index.md / artifacts.json / outputs/artifacts.json を `spec_created` で同期済。
- aiworkflow-requirements workflow index sync: `indexes/quick-reference.md`, `indexes/resource-map.md`, `references/task-workflow-active.md`, `references/workflow-issue-1030-member-photo-transcode-resize-variant-pipeline-artifact-inventory.md`, `changelog/20260601-issue1030-member-photo-variant-spec-sync.md` を same-wave 更新済。
- aiworkflow-requirements interface contract sync: workflow inventory / active task / index / changelog に local implementation present を反映。
