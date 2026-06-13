# System Spec Update Summary

[実装区分: 実装仕様書]

aiworkflow-requirements の system spec（公開 interface SSOT）への昇格要否を Step 1-A/1-B/1-C → Step 2 で判定する。本タスクは `implemented_local_evidence_captured`（local evidence 取得済み）であり、aiworkflow-requirements 正本の実更新は同一 wave で行った。

---

## Step 1-A: 新規 export interface の有無

| 新規追加 | 配置 | 公開境界か |
|----------|------|-----------|
| `generateTagCode(label: string): string` 純関数 | `apps/web/src/lib/admin/tagCodeAutogen.ts` | No（apps/web ローカル表現層・shared 型ではない） |
| `KANA_ROMAJI_MAP` / `TAG_CODE_PATTERN` 純データ・定数 | 同上 | No（apps/web ローカル） |
| `TagGlossaryTerm` 型 / `TAG_MANAGEMENT_GLOSSARY` / `getTagTerm` | `apps/web/src/lib/admin/tagManagementGlossary.ts` | No（apps/web ローカル表示用データ・interface） |
| `TagManagementGuideProps` 型 / `TagManagementGuide` component | `apps/web/src/components/admin/TagManagementGuide.tsx` | No（apps/web ローカル component） |

判定: いずれも **apps/web ローカルの表現層**。`packages/shared/**` の公開 interface でも、apps/api との contract でもない。

## Step 1-B: 既存 shared 型 / API contract の変更有無

- 既存 API surface（`GET/POST /admin/tags` / `GET /admin/tags/queue`）の shape・呼び出しを変更しない。`createTag` 呼び出し shape 不変。
- D1 schema / migrations 不変（AC-10）。Google Form schema 不変。
- `shell-config.ts` の label 変更（C2）は IA 文言のみで型 contract に影響しない。

## Step 1-C: 公開ドキュメント（specs/**）への影響

- 対象は `/admin/tag-master` / `/admin/tags` の表現層改修のみ。`docs/00-getting-started-manual/specs/**` の API schema・auth・DB 構成に変更なし。
- 画面 blueprint（管理画面群）は、タグ定義のコード自動生成 / 2 画面ガイド・相互リンク / 命名統一を後続実装の参照対象として `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` 相当へ反映する候補（同一 wave で同期済み）。

## Step 2: aiworkflow-requirements system spec 更新判定

**判定: 該当あり（新規インターフェース追加のため）。ただし aiworkflow-requirements 正本更新は同一 wave で行った。**

判定根拠:
1. 新規インターフェース（`TagGlossaryTerm` / `TagManagementGuideProps` / `generateTagCode` / `getTagTerm` / `TagManagementGuide`）を追加するため、Step 2 = 該当あり。
2. ただしこれらは **apps/web ローカル表現層**であり、`packages/shared/**` の公開 interface でも apps/api contract でもないため、API schema / shared interface / DB への昇格は **不要**。
3. apps/api / D1 / Google Form 非接触（不変条件 §7・AC-10）。
4. 本タスクは `implemented_local_evidence_captured`（local evidence 取得済み）。aiworkflow-requirements の task-workflow-active / artifact-inventory / changelog / quick-reference / resource-map / SKILL-changelog / LOGS および UI blueprint の実同期は、apps/web 実装が入る本サイクルで同一 wave で行う。

> したがって API schema / shared interface / DB への昇格は不要。UI blueprint と aiworkflow ledgers の実更新は同一 wave で同期済みする（`documentation-changelog.md` 参照）。
