# e2e-quality-uplift-stage-2 sub-task 2b: `admin-identity-conflicts.spec.ts` 新規実装

## メタ情報

```yaml
issue_number: 607
parent_workflow: docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/
parent_sub_task_spec: docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2b-admin-identity-conflicts.md
```

| 項目 | 内容 |
| --- | --- |
| タスクID | e2e-stage-2-2b-admin-identity-conflicts-001 |
| タスク名 | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` 新規実装 |
| 分類 | implementation / E2E (Playwright) |
| 対象機能 | `/admin/identity-conflicts` の merge / dismiss / 認可境界 |
| 親 umbrella Issue | #607（e2e-quality-uplift-stage-2） |
| 親 workflow | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |
| 元仕様 | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2b-admin-identity-conflicts.md` |
| Implementation Mode | `new` |
| coverageTier | standard |
| visualEvidence | NON_VISUAL |
| 行数目安 | 200-240 行 |
| 優先度 | High |
| ステータス | formalized_and_implemented_local（workflow 化 + local chromium evidence 取得済み） |
| formalized workflow | `docs/30-workflows/2b-admin-identity-conflicts-spec/` |
| 起点日 | 2026-05-09 |

## 背景

`e2e-quality-uplift-stage-2` 親 workflow（completed-tasks 配下）の Stage 2 サブタスク 2b として起票された。2026-05-09 に `docs/30-workflows/2b-admin-identity-conflicts-spec/` へ formalize され、後続実装 wave で `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`、non-production server-side fixture gate、Playwright evidence routing、shared schema strict 化まで反映済み。

以後の実装入力と状態正本は workflow root を正本とし、本ファイルは起票元 trace として保持する。旧 source spec の「GET list を browser `page.route()` で mock」「merge 後 `/admin/members/:id` 再 fetch」前提は superseded。

`/admin/identity-conflicts` は GET list / POST merge / POST dismiss の 3 endpoint を持ち（`apps/api/src/routes/admin/identity-conflicts.ts:38,54,91`）、共有 schema `packages/shared/src/schemas/identity-conflict.ts` で request/response が定義済み。Stage 1 で `signSession()` が活性化され、`apps/web/playwright/fixtures/auth.ts` に `adminPage` / `memberPage` / `anonymousPage` が公開されているため、E2E spec の追加実装ブロッカーは無い。

## 受け入れ基準（DoD）

元仕様 §9 に準拠する。

| # | 基準 |
|---|------|
| 1 | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` がリポジトリに存在する |
| 2 | 6 test すべて green（一覧 / merge / dismiss / refresh 境界 / member redirect / anonymous redirect） |
| 3 | `pnpm --filter @ubm-hyogo/web typecheck` 終了コード 0 |
| 4 | `pnpm lint` 終了コード 0 |
| 5 | `adminPage` / `memberPage` / `anonymousPage` の 3 ロール分岐が共存 |
| 6 | network 経路は初期 list が non-production server fixture、mutation が `page.route()` mock（実 API / 実 D1 hit 0） |
| 7 | merge response shape が `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` で shared `MergeIdentityResponseZ` parse 通過 |
| 8 | `mergedMemberId` 文字列が spec 内に出現しない |
| 9 | skip 0 件（`test.skip` / `test.fixme` 0 hit） |
| 10 | 行数 200-240 |

## 苦戦箇所メモ（将来同種課題を簡潔に解決するための知見）

- **merge response shape 不整合**: 親 workflow `phase-4.md` §1 Q2 / `phase-5.md` §4 では `{ targetMemberId, sourceMemberId, mergedAt }` と記載されていたが、実体である `packages/shared/src/schemas/identity-conflict.ts:34-39` の `MergeIdentityResponseZ` は `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }`。**正本は shared schema 側**。spec 実装時は shared schema を import し `parse()` を mock handler 内で実行することで drift を即検出する。`mergedMemberId` は不存在プロパティのため使用禁止。
- **Server Component fetch 境界**: 初期 list は `fetchAdmin()` の server-side fetch のため browser `page.route()` では捕捉できない。`PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1` の non-production gate で固定 2 件を返し、shared `ListIdentityConflictsResponseZ` で parse する。
- **D1 直接アクセス禁止**: `apps/web` から D1 binding を叩く経路は不存在前提。初期 list は server fixture、merge/dismiss は browser `page.route()` で完結させ、実 API・実 D1 を一切叩かない（CLAUDE.md 重要不変条件 5）。
- **3 ロール分岐の共存**: admin（成功）/ member（API 403 → UI 403 or `/profile` redirect）/ anonymous（`page.url()` が `/login` を含む）の 3 分岐を 1 ファイル内に配置。新 fixture を作らず `auth.ts:39-67` の既存 3 fixture を import する。
- **selector 戦略**: `getByRole` / `getByText` / `getByTestId` 優先。色値・Tailwind class 依存禁止（OKLch 不変条件）。

## システム仕様反映

### CLAUDE.md UI alignment 不変条件（task-02..22 共通）

| # | 不変条件 | 本 spec での担保 |
|---|---------|----------------|
| 1 | 既存 API endpoint surface のみ利用 | `identity-conflicts.ts:38/54/91` の 3 endpoint と `/admin/members/:id` のみ mock 対象 |
| 2 | OKLch トークン正本化（HEX 直書き禁止） | selector に色値・`bg-[#xxx]` / `text-[#xxx]` を使用しない |
| 3 | プロトタイプ正本順位（primitives 共有） | 新 primitive を生成せず既存 primitive の semantics に対し assert |
| 4 | `apps/web` から D1 直接アクセス禁止 | 初期 list は server fixture、mutation は `page.route()` mock。D1 / Workers binding 操作なし |
| 5 | spec のみ作成・新規 fixture 禁止 | `auth.ts` 既存 3 fixture を import するだけ |

### CLAUDE.md 重要な不変条件

- 不変条件 5（D1 への直接アクセスは `apps/api` に閉じる）を遵守。`apps/web` の Playwright spec は HTTP レイヤで完結。

## 関連

- 親 umbrella Issue: #607
- 親 workflow: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/index.md`
- 元 sub-task 仕様書: `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2b-admin-identity-conflicts.md`
- 兄弟 sub-task: `2c-admin-member-delete.md` / `2d-contract-stage-2.md`
- 共有 schema: `packages/shared/src/schemas/identity-conflict.ts`
- API 実装（参照のみ・変更禁止）: `apps/api/src/routes/admin/identity-conflicts.ts`
- repository: `apps/api/src/repository/identity-merge.ts:149,171`
- Auth fixture: `apps/web/playwright/fixtures/auth.ts:39-67`
