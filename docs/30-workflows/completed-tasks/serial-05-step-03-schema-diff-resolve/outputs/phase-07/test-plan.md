**[実装区分: 実装仕様書]**

# Phase 7: テスト計画 — serial-05-step-03-schema-diff-resolve

## 0. 不変条件

- 既存実装は `apps/web/src/components/admin/SchemaDiffPanel.tsx` と `apps/web/src/lib/admin/api.ts`。
- 新規 greenfield component を前提にせず、既存 `SchemaDiffPanel.component.spec.tsx` を拡張する。
- `test.describe.skip` / `it.skip` / `it.todo` は追加しない。
- 内部 status は `queued` / `resolved` 固定。UI 表示だけ日本語化してよい。

## 1. テスト対象とファイル

| 種別 | テスト対象 | ファイル |
| --- | --- | --- |
| component | `SchemaDiffPanel` | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` |
| helper | `postSchemaAlias` / `isSchemaAliasRetryableContinuation` | `apps/web/src/lib/admin/__tests__/api.spec.ts` |
| integration | `AdminSchemaPage` | `apps/web/app/(admin)/admin/schema/page.tsx` 既存 render path |
| e2e smoke | `/admin/schema` existing panel | `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` smoke |

## 2. Component Tests

| # | ケース | Assert |
| --- | --- | --- |
| 1 | `{ total, items }` を render | total と 4 ペイン added / changed / removed / unresolved が表示される |
| 2 | `queued` row | alias assign button が表示される |
| 3 | `resolved` row | 解決済み状態が表示され、再割当の誤操作が起きない |
| 4 | `questionId=null` row | role=`alert` で割当不可を表示 |
| 5 | 200 apply | `data-feedback-kind="success"` |
| 6 | 202 exhausted retryable | `data-feedback-kind="retryable"` |
| 7 | 409 conflict | `data-feedback-kind="conflict_error"` |
| 8 | 422 stable_key_collision | `data-feedback-kind="validation_error"` |

## 3. Helper Tests

`apps/web/src/lib/admin/__tests__/api.spec.ts` で次を確認する。

- `postSchemaAlias()` は `/api/admin/schema/aliases` に POST する。
- 200 / 202 は `ok: true` として扱う。
- 409 / 422 は `ok: false` として扱う。
- `isSchemaAliasRetryableContinuation()` は 202 + `backfill.status="exhausted"` + `retryable=true` + `code="backfill_cpu_budget_exhausted"` のみ true。

## 4. E2E 実行可能性 DoD

| 項目 | 本タスクでの固定値 |
| --- | --- |
| 対象 spec の列挙 | `admin-schema-diff-resolve` smoke / `SchemaDiffPanel.component.spec.tsx` |
| 1 行実行コマンド | `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 mise exec -- pnpm e2e:smoke -- admin-schema-diff-resolve` |
| 実行前提 | browser binary installed / webServer auto start / admin fixture enabled |
| un-skip 不変条件 | `test.describe.skip` / `it.skip` / `it.todo` を追加しない |
| browser install | CI または local setup の Playwright install step を使用 |
| webServer | Playwright config の webServer を使用。手動 dev server 前提にしない |
| CI gate | smoke は実装 PR の CI で実行。現 wave は local focused evidence captured、runtime smoke pending |
| E2E coverage | task scope の critical lines 80% 以上を目標。未達なら Phase 11 evidence に理由を記録 |

## 5. 実行コマンド

```bash
mise exec -- pnpm test apps/web --run -- SchemaDiffPanel.component.spec.tsx
mise exec -- pnpm test apps/web --run -- api.spec.ts
PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 mise exec -- pnpm e2e:smoke -- admin-schema-diff-resolve
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 6. DoD

- [ ] 既存 component / helper の focused test が green
- [ ] 202 / 409 / 422 の分岐が UI feedback として検証済み
- [ ] E2E 1 行コマンドと前提が明記済み
- [ ] skip / todo 追加なし
