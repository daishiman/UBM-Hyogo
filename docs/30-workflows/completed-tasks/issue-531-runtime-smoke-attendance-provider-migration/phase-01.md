# Phase 1: 要件定義

## 真の論点

親タスク `issue-371-ut-02a-followup-003-hono-ctx-di-migration` は local PASS 5 点を取得済みだが
`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で close-out されている。staging で **実際の Worker 上に provider middleware が結線されているか** を確認しなければ、
silent fallback 撤廃（throw 化）が prod 寄り環境で意図通り作用するか保証できない。
本タスクの真の論点は「staging runtime での attendance hydrate と未結線時 throw の実踏 evidence 取得」。

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 必要性 | HIGH | runtime evidence なしに親タスクを `completed` に遷移できない |
| 実現可能性 | HIGH | staging deploy 済み・curl + 1Password 経由の bearer 注入で実行可能 |
| 副作用 | LOW | read-only smoke（GET 中心）。POST は visibility-request / delete-request のみで pending 重複時は 409 で安全 |
| コスト | LOW | scale:small。新規スクリプト 2 本と evidence 6 ファイル程度 |

## 不変条件

1. D1 直接アクセス禁止（`apps/web` から / smoke スクリプトから D1 binding に触れない。HTTP API 経由のみ）
2. session cookie / Bearer token / OAuth secret は evidence に**実値で残さない**（`[REDACTED]` 置換必須）
3. `wrangler` 直接呼び出し禁止（`scripts/cf.sh` 経由）
4. `apps/api` の source 改修禁止（親タスク完了済み）
5. POST smoke は実行しない。visibility/delete request は DB write を伴うため route inventory のみで扱う
6. production への deploy / smoke は禁止（staging のみ）

## artifacts.json metadata 確定値

```json
{
  "taskType": "implementation",
  "visualEvidence": "NON_VISUAL",
  "workflow_state": "spec_created",
  "scale": "small",
  "priority": "medium"
}
```

## 完了条件

- 真の論点・4 条件評価・不変条件・artifacts.json metadata が確定し本ファイルに記録されている
- AC-1〜AC-9 が index.md に列挙され、各 AC が後続 Phase のどこで満たされるかが [phase-02.md](phase-02.md) に紐づくこと
