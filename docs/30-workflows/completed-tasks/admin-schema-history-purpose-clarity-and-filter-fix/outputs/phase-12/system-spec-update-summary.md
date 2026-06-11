# System Spec Update Summary

[実装区分: 実装仕様書]

aiworkflow-requirements の system spec（公開 interface SSOT）への昇格要否を Step 1-A/1-B/1-C → Step 2 で判定する。

---

## Step 1-A: 新規 export interface の有無

| 新規追加 | 配置 | 公開境界か |
|----------|------|-----------|
| `formatSchemaHistoryError(e: unknown): string` 純関数 | `apps/web/src/lib/admin/schemaHistoryError.ts` | No（apps/web ローカル表現層・shared 型ではない） |
| `schemaHistoryGlossary` / `schemaHistoryPurposeSteps` 純データ | `apps/web/src/lib/admin/schemaHistoryGlossary.ts` | No（apps/web ローカル表示用データ） |
| `SchemaHistoryGlossaryTerm` / `SchemaHistoryPurposeStep` 型 | 同上 | No（apps/web ローカル interface） |
| `SchemaHistoryPurposeExplainer(): ReactElement` component | `apps/web/src/components/admin/SchemaHistoryPurposeExplainer.tsx` | No（apps/web ローカル component） |

判定: いずれも **apps/web ローカルの表現層**。`packages/shared/**` の公開 interface でも、apps/api との contract でもない。

## Step 1-B: 既存 shared 型 / API contract の変更有無

- `AppliedFiltersZ` への `batchId: z.string().nullable()` 追加は **apps/web 側の adapter zod**（`apps/web/src/lib/admin/api.ts`）。API response（`apps/api` の `appliedFilters.batchId`）は既存のまま（issue-1079/1128/1129 で既に返却済み）であり、web 側 zod が後追いで追従するだけ。API contract / shared 型は **不変**。
- D1 schema / migrations 不変（AC-9）。Google Form schema 不変。

## Step 1-C: 公開ドキュメント（specs/**）への影響

- 対象は `/admin/schema/history` の表現層改修のみ。`docs/00-getting-started-manual/specs/**` の API schema・auth・DB 構成に変更なし。
- 画面 blueprint は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` へ反映済み（目的説明 / card list / `.schema-history-error` / `appliedFilters.batchId` 受理・batchId filter UI 非追加）。

## Step 2: aiworkflow-requirements system spec 更新判定

**判定: 部分同期済み（API / DB は N/A、UI blueprint のみ更新）。**

判定根拠:
1. 追加された interface（`formatSchemaHistoryError` 純関数 / `schemaHistoryGlossary` 純データ / `SchemaHistoryPurposeExplainer` component）は **apps/web ローカル表現層のみ**で、公開 interface（shared 型 / API contract）の追加・変更を伴わない。
2. `AppliedFiltersZ` の `batchId` 追加は既存 API response への web 側 zod の後追い追従であり、新規公開境界を作らない。
3. apps/api / D1 / Google Form 非接触（不変条件 #5・AC-9）。
4. ただし `/admin/schema/history` の画面目的・カード表示・error 表示は管理画面 blueprint として後続実装の参照対象になるため、`09g-screen-blueprints-admin.md` に同期した。

> したがって API schema / shared interface / DB への昇格は不要。UI blueprint のみ同一 wave で同期する（`documentation-changelog.md` 参照）。
