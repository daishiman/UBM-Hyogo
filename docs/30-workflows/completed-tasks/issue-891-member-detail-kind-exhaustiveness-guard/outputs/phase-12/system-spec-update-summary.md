# System Spec Update Summary

## 更新内容

Issue #891 を `implemented_local_evidence_captured / implementation / NON_VISUAL` として aiworkflow-requirements に登録する。

## 同期対象

| 対象 | 内容 |
| --- | --- |
| `task-workflow-active.md` | active workflow row を追加 |
| `indexes/quick-reference.md` | Issue #891 quick reference を追加 |
| `indexes/resource-map.md` | Issue #891 resource map row を追加 |
| artifact inventory | `workflow-issue-891-member-detail-kind-exhaustiveness-guard-artifact-inventory.md` を追加 |
| changelog / LOGS | 2026-05-25 の同期履歴を追加 |
| `docs/00-getting-started-manual/specs/04-types.md` | `FieldKind` に `consent` / `system` を同期し、MemberDetail field route 契約を追加 |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | public member detail の `linkSections` と excluded kind 表示契約を追加 |

## コード正本

`apps/web/src/lib/adapters/member-detail.ts` の `KIND_ROUTE` が FieldKind 分類の正本である。
`DISPLAYABLE_KINDS` の手動 allowlist は使わず、detail 出力対象と link 出力対象は `KIND_ROUTE` から導出する。
`apps/web/src/components/public/MemberDetail.tsx` は `linkSections` を既存 `MemberLinks` へ渡す。
