# e2e-quality-uplift-stage-2 sub-task 2d: `contract-stage-2.test.ts` 新規実装

## メタ情報

```yaml
issue_number: 607
parent_workflow: docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/
parent_sub_task_spec: docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md
```

| 項目 | 内容 |
| --- | --- |
| タスクID | e2e-stage-2-2d-contract-stage-2-001 |
| タスク名 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` 新規実装 |
| 分類 | implementation / Vitest contract test |
| 対象機能 | 2a/2b/2c の UI fixture object と admin route の zod schema の同型性検証 |
| 親 umbrella Issue | #607（e2e-quality-uplift-stage-2） |
| 親 workflow | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |
| 元仕様 | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md` |
| Implementation Mode | `new` |
| coverageTier | standard（contract test 単体は coverage 加点対象外、green の有無のみ判定） |
| visualEvidence | NON_VISUAL |
| 行数目安 | 200-260 行 |
| 優先度 | High |
| ステータス | unassigned（spec 未作成、grep で未存在を確認済み） |
| 起点日 | 2026-05-09 |

## 背景

`e2e-quality-uplift-stage-2` 親 workflow（completed-tasks 配下）の Stage 2 サブタスク 2d として位置付けられているが、対象成果物 `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` は **未作成**（リポジトリ grep で 0 hit）。本タスクで未実装分を捕捉する。

2a/2b/2c の Playwright spec が `page.route()` で返す UI fixture object と、`apps/api` 側 route 実装が parse する zod schema が同型であることを CI で機械検証する pure unit test。drift があれば mock が通る環境で本番 API が 422/400 を返す事故が発生し、E2E green が production 信頼性を担保しなくなるため、本 contract test を CI gate として配置する。

## 受け入れ基準（DoD）

元仕様 §10 に準拠する。

| # | 条件 |
|---|------|
| 1 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` が存在（200-260 行） |
| 2 | 7 describe ブロック（`/admin/requests` GET / POST resolve / `/admin/identity-conflicts` GET / merge / dismiss / `/admin/members/:id/delete` / `/admin/audit` GET）すべて green |
| 3 | `test.skip` / `it.skip` / `describe.skip` が 0 件 |
| 4 | `MergeIdentityRequestZ.parse` / `DismissIdentityConflictRequestZ.parse` が成功系で throw しない |
| 5 | `DeleteBodyZ.parse({ reason:'' })` / `parse({})` / `parse({ reason: 501 文字 })` が throw する |
| 6 | shared `MergeIdentityResponseZ` の `archivedSourceMemberId` を含む shape を fixture が満たす |
| 7 | 2d test 内に `z.object(` が **0 件**（schema 重複定義禁止 / CONST_007） |
| 8 | route 側の `DeleteBodyZ` / `ListRequestsQueryZ` / `ListAuditQueryZ` が named export として参照可能（route 3 ファイルに +1 行ずつ修正） |
| 9 | `pnpm --filter @ubm-hyogo/api typecheck` exit 0 |
| 10 | `pnpm lint` exit 0 |

## 苦戦箇所メモ（将来同種課題を簡潔に解決するための知見）

- **merge response shape 不整合（正本訂正）**: 親 workflow `phase-4.md` §1 Q2 / `phase-5.md` §4 では `{ targetMemberId, sourceMemberId, mergedAt }` と記載されていたが、実体である `packages/shared/src/schemas/identity-conflict.ts:34-39` の `MergeIdentityResponseZ` は `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }`。**正本は shared schema 側**。本 contract test は shared schema を import し fixture を `archivedSourceMemberId` + `auditId` 含む形で固定する。2b 側 fixture の最終整合は本 contract test の green が決着判定。
- **route schema の named export 化（CONST_007 重複禁止）**: 2d test を schema 重複定義なしで書くため、route 内 inline 定義の 3 schema を named export に修正（各 +1 行）:
  - `apps/api/src/routes/admin/member-delete.ts:10` の `DeleteBodyZ` → `export const`
  - `apps/api/src/routes/admin/requests.ts` の `ListQueryZ` → `export const ListRequestsQueryZ` として再 export
  - `apps/api/src/routes/admin/audit.ts` の `QueryZ` → `export const ListAuditQueryZ` として再 export
  - `MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` 等は既に `packages/shared` で named export 済み。`DeleteBodyZ` の shared 昇格は本 PR 範囲外（phase-4 §1 Q6 結論、別 PR で対応）。
- **zod 未エクスポートな response shape の同型確認**: response 型が zod export されていない場合は `expectTypeOf<typeof fixture>().toMatchTypeOf<...>()` による type-level 同型で代替する。fixture object は inline literal を `as const` 固定。
- **D1 直接アクセス禁止**: 本 contract test は pure unit。DB / Network / FS / Cloudflare binding に一切触れない。`apps/web` を import しない（CLAUDE.md 重要不変条件 5 を `apps/api` 側 test でも遵守）。
- **fixture object の所在**: phase-5 §4 の標準形に従い 2d test 内 inline で定義する。別ファイル化（`fixtures/admin-stage-2.ts` 等）は Phase 8 リファクタの責務。2a/2b/2c も同 shape を inline で持つため、CI 上 2d が green であれば 4 spec の fixture 整合が担保される設計。drift 発生時、最初に失敗するのは 2d の zod parse。

## システム仕様反映

### CLAUDE.md UI alignment 不変条件（task-02..22 共通）

| # | 不変条件 | 本 test での担保 |
|---|---------|----------------|
| 1 | 既存 API endpoint surface のみ参照、新 endpoint 追加禁止 | 7 endpoint すべて `apps/api/src/routes/admin/` 既存 route。新規追加 0 |
| 2 | D1 schema 変更禁止 | 本仕様書は schema/migration を扱わない |
| 3 | OKLch トークン正本化 | 該当なし（contract test は色を扱わない） |
| 4 | `apps/web` から D1 直接アクセス禁止 | 本 spec は `apps/api` 内で完結。`apps/web` を import しない |
| 5 | スキーマ重複定義禁止（CONST_007） | 2d test 内 `z.object(` 0 件、すべて route/shared import |

### CLAUDE.md 重要な不変条件

- 不変条件 5（D1 への直接アクセスは `apps/api` に閉じる）を遵守。本 contract test は DB / binding に触れない pure unit。

## 関連

- 親 umbrella Issue: #607
- 親 workflow: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/index.md`
- 元 sub-task 仕様書: `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md`
- 兄弟 sub-task: `2b-admin-identity-conflicts.md` / `2c-admin-member-delete.md`
- 共有 schema: `packages/shared/src/schemas/identity-conflict.ts`
- API 実装（参照のみ + named export 1 行修正）: `apps/api/src/routes/admin/{requests,identity-conflicts,member-delete,audit}.ts`
- 既存 contract test 命名・構造参照: `apps/api/src/audit-correlation/__tests__/contract.test.ts`
