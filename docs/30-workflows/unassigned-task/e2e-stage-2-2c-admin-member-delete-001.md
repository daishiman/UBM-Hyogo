# e2e-quality-uplift-stage-2 sub-task 2c: `admin-member-delete.spec.ts` 新規実装

## メタ情報

```yaml
issue_number: 607
parent_workflow: docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/
parent_sub_task_spec: docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2c-admin-member-delete.md
```

| 項目 | 内容 |
| --- | --- |
| タスクID | e2e-stage-2-2c-admin-member-delete-001 |
| タスク名 | `apps/web/playwright/tests/admin-member-delete.spec.ts` 新規実装 |
| 分類 | implementation / E2E (Playwright) |
| 対象機能 | `/admin/members` の delete gate（二段確認 / reason 必須 / audit 連動） |
| 親 umbrella Issue | #607（e2e-quality-uplift-stage-2） |
| 親 workflow | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |
| 元仕様 | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2c-admin-member-delete.md` |
| Implementation Mode | `new` |
| coverageTier | standard（lines >= 70% / critical route smoke 100%） |
| visualEvidence | NON_VISUAL |
| 行数 | 175 行 |
| Tier-aware skip 例外 | cascade preview 1 件のみ（CONST_007 例外条件 1+2 同時該当） |
| 優先度 | High |
| ステータス | consumed_by `docs/30-workflows/admin-member-delete-e2e-spec/`（implemented-local-runtime-pending） |
| 起点日 | 2026-05-09 |

## 背景

`e2e-quality-uplift-stage-2` 親 workflow（completed-tasks 配下）の Stage 2 サブタスク 2c として位置付けられた未実装分は、`docs/30-workflows/admin-member-delete-e2e-spec/` で消費済み。対象成果物 `apps/web/playwright/tests/admin-member-delete.spec.ts` は作成済み。

`POST /admin/members/:memberId/delete`（`apps/api/src/routes/admin/member-delete.ts:44`）と `GET /admin/audit`（`apps/api/src/routes/admin/audit.ts:144`）はいずれも実装済みで、API 側ブロッカーは無い。`DeleteBodyZ` は `member-delete.ts:10` に inline 定義されており reason 必須（`min(1)`/`max(500)`）。本 spec は二段確認 UI / reason 空時の UI disabled + API 到達 0 / audit 連動 / 認可 3 ロール分岐を E2E で確認する。API 422 は backend contract 側で担保する。

## 受け入れ基準（DoD）

元仕様 §9 に準拠する。

| # | 基準 |
|---|------|
| 1 | `apps/web/playwright/tests/admin-member-delete.spec.ts` が存在（175 行） |
| 2 | cascade preview を除く **5 test が green** |
| 3 | cascade preview test が `test.skip(...)` で明示され `// TODO(stage-3)` コメント付き |
| 4 | `pnpm typecheck` 終了コード 0 |
| 5 | `pnpm lint` 終了コード 0 |
| 6 | 認可 3 ロール（admin / member / anonymous）すべて分岐 test 存在 |
| 7 | SSR fetch は `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1`、Client detail/delete は `page.route()` |
| 8 | reason 必須 validation は UI disabled + API 到達 0 で確認（API 422 は backend contract 側） |
| 9 | 新 fixture を追加していない（既存 3 fixture 再利用のみ） |
| 10 | skip は cascade preview の **1 件のみ**（`test.skip` 出現 = 1、`test.fixme` 出現 = 0） |

## 苦戦箇所メモ（将来同種課題を簡潔に解決するための知見）

- **cascade preview API 未実装による skip 例外**: `grep -rn "delete-preview\|deletePreview\|cascade.*preview"` が 0 件であることが phase-4 §1 Q5 で確認済。本 spec の 6 test 中 1 件のみ `test.skip` を許容（CONST_007 例外条件 1: 外部依存未実装 / 2: 後続 Stage 持越し明記、の 2 条件同時該当）。それ以外の skip は禁止。Stage 3 で API 実装後に active 化する。
- **reason validation の責務分離**: 現 UI は空 reason で `削除実行` disabled になり API へ到達しない。E2E は disabled + call count 0、API 422 は backend contract 側で担保する。
- **二段確認 UI の取り違え防止**: 「1 段目 button click」「2 段目 confirm dialog 表示」「dialog 内 reason 入力」「dialog 内 confirm button」の 4 ステップを別々に assert（ロケータも `getByRole('dialog')` で dialog scope を明示してから内部要素を取得する）。
- **Server Component fetch 境界**: `/admin/members` と `/admin/audit` は server-side `fetchAdmin()` のため、browser `page.route()` では捕捉できない。`PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1` で固定 fixture を返す。
- **D1 直接アクセス禁止**: spec は SSR fixture gate と `page.route()` で HTTP 層を mock。`apps/web` から D1 binding を叩かない。
- **selector 戦略**: `getByRole` / `getByLabel` / `getByText` を優先。色値依存・class 名依存のセレクタは禁止（OKLch 不変条件）。

## システム仕様反映

### CLAUDE.md UI alignment 不変条件（task-02..22 共通）

| # | 不変条件 | 本 spec での担保 |
|---|---------|----------------|
| 1 | 既存 API endpoint surface のみ利用、新 endpoint・D1 schema 変更禁止 | mock 対象は `member-delete.ts` / `audit.ts` の既存 endpoint のみ |
| 2 | OKLch トークン正本化（HEX 直書き禁止） | selector に色値を使わず `getByRole` / `getByLabel` / `getByText` のみ |
| 3 | プロトタイプ正本順位 | 新 primitive を生成しない |
| 4 | `apps/web` から D1 直接アクセス禁止 | SSR fixture gate + `page.route()`。D1 binding 参照なし |
| 5 | 既存 fixture 再利用、新 fixture 禁止 | `adminPage` / `memberPage` / `anonymousPage`（`auth.ts:1-67`）のみ使用 |

### CLAUDE.md 重要な不変条件

- 不変条件 5（D1 への直接アクセスは `apps/api` に閉じる）を遵守。
- `apps/web/src/lib/env.ts` の `getEnv()` 経由のみ env を参照する原則は本 spec のスコープ外（spec 内で env を参照しない）。

## 関連

- 親 umbrella Issue: #607
- 親 workflow: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/index.md`
- 元 sub-task 仕様書: `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2c-admin-member-delete.md`
- 兄弟 sub-task: `2b-admin-identity-conflicts.md` / `2d-contract-stage-2.md`
- API 実装（参照のみ・変更禁止）: `apps/api/src/routes/admin/member-delete.ts:44` / `apps/api/src/routes/admin/audit.ts:144`
- `DeleteBodyZ`: `apps/api/src/routes/admin/member-delete.ts:10`
- Auth fixture: `apps/web/playwright/fixtures/auth.ts:1-67`
- 消費先: `docs/30-workflows/admin-member-delete-e2e-spec/`
- 持越し: cascade preview test → `docs/30-workflows/e2e-quality-uplift-stage-3-impl/`（後続ワークフロー）
