# Implementation Guide

## 実装区分

[実装区分: 実装仕様書]

## Part 1: 中学生レベルの説明

同じ人がメールアドレスを変えてもう一度申し込むと、名簿では別の人に見えてしまうことがあります。
たとえば学校で、同じ生徒が古い連絡先と新しい連絡先で二回出席カードを出したような状態です。
先生は「これは同じ人かもしれない」と気づいて、二つのカードを一人分としてまとめる必要があります。

なぜ必要かというと、同じ人が二人いるように見えると、公開名簿や連絡の記録がずれるからです。
何をするかというと、先生役の管理者だけが候補を見て、確認画面でもう一度確かめてから、一人分にまとめます。
間違えたときに後から確認できるよう、誰がいつ何をまとめたかも記録します。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| identity merge | 二つの名簿カードを一人分にまとめること |
| admin | 先生役の管理者 |
| transaction | 途中で失敗したら全部元に戻す約束 |
| audit log | 後で確認できる記録ノート |
| masked email | メールアドレスを一部だけ隠した表示 |
| canonical alias | 「実はこの人と同じ」と書いた付箋 |

## Part 2: 技術者向け実装メモ

### API（実装済み）

実装: `apps/api/src/routes/admin/identity-conflicts.ts:34` `createAdminIdentityConflictsRoute`

- `GET /admin/identity-conflicts` — `EMAIL_CONFLICT` 起点の候補一覧を cursor pagination で返す
- `POST /admin/identity-conflicts/:id/merge` — `targetMemberId` と `reason` を受け、単一 D1 transaction で source を target に統合
- `POST /admin/identity-conflicts/:id/dismiss` — `reason` を受け、候補を別人として再検出から除外

### Repository / Service

- `listIdentityConflicts` (`apps/api/src/repository/identity-conflict.ts:80`)
- `dismissIdentityConflict` (`apps/api/src/repository/identity-conflict.ts:174`)
- `mergeIdentities` (`apps/api/src/repository/identity-merge.ts:78`)
- `resolveCanonicalMemberId` (`apps/api/src/repository/identity-merge.ts:165`)
- `detectConflictCandidates` (`apps/api/src/services/admin/identity-conflict-detector.ts:35`)

### Shared Schema

`packages/shared/src/schemas/identity-conflict.ts`

```ts
type MergeIdentityRequest = { targetMemberId: string; reason: string };
type MergeIdentityResponse = {
  mergedAt: string;
  targetMemberId: string;
  archivedSourceMemberId: string;
  auditId: string;
};
```

`maskResponseEmail(email)` は `先頭1文字 + "***" + "@" + domain` 形式。

### DDL

- `apps/api/migrations/0010_identity_merge_audit.sql`
- `apps/api/migrations/0011_identity_aliases.sql`
- `apps/api/migrations/0012_identity_conflict_dismissals.sql`

### UI

- `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`
- `apps/web/src/components/admin/IdentityConflictRow.tsx`
- 管理ナビ: `apps/web/src/components/layout/AdminSidebar.tsx` に `/admin/identity-conflicts` を追加

### Canonical 表示境界

merge 後は `identity_aliases.source_member_id` を archived source として扱う。
公開 member list / public stats / admin member list は archived source を除外し、source が二重表示されないようにする。
merge reason と dismiss reason は同じ `redactIdentityReason()` で email / phone を `[redacted]` に置換して永続化する。
source の過去回答本文・status・tags は不変条件 #11 により移動しない。

## Part 3: Edge Cases

| Case | Handling | Error class / status |
| --- | --- | --- |
| non-admin | `require-admin` で fail closed | 403 |
| missing reason | zod validation | 400 |
| self-reference (source == target) | `MergeSelfReference` | 400 |
| 既統合 conflict 再 merge | `MergeConflictAlreadyApplied` | 409 |
| identity not found | `MergeIdentityNotFound` | 404 |
| duplicate dismiss | upsert: reason / dismissed_by / dismissed_at 更新 | 200 |
| transaction failure | D1 自動 rollback | 500 |

### Constants

| Name | Value |
| --- | --- |
| first-stage match | `name` exact match AND `affiliation` exact match |
| email mask | first character + `***` + `@` + domain |
| reason 上限 | 500 文字 |
| 月次 EMAIL_CONFLICT alert 閾値 | 5 件（03b-followup-006 連携） |
