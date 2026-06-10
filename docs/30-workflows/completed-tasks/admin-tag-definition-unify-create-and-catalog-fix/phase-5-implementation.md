# Phase 5 — 実装計画（3 lane 分解）

> 正本: [`_shared-context.md`](./_shared-context.md) / [`phase-2-design.md`](./phase-2-design.md) / [`phase-4-test-plan.md`](./phase-4-test-plan.md)。
> 本書は **新規/修正/削除ファイルの確定一覧**と **3 lane への分解・依存**、および **型二重定義の一本化決定**を固定する。
> コード実装は本サイクルで local 完了。各 lane の実装手順と実績は `tasks/task-{a,b,c}-*.md` を正本とする。ブラウザ runtime visual / commit / PR / push のみ user-gated。

---

## 1. 変更ファイル一覧（Feedback RT-03・必須）

### 1.1 新規作成

| パス | Lane | 内容 |
|------|------|------|
| `apps/web/src/components/admin/tagDefinitionView.ts` | A | 防御正規化 + フィルタ + 件数の純関数群 |
| `apps/web/src/components/admin/TagDefinitionCreateForm.tsx` | B | 作成フォーム（FormField 経由） |
| `apps/web/src/components/admin/TagDefinitionPanel.tsx` | C | 統合パネル（state owner） |
| `apps/web/src/components/admin/__tests__/tagDefinitionView.spec.ts` | A | 純関数テスト |
| `apps/web/src/features/admin/api/__tests__/tags.create.spec.ts` | B | `createTag()` テスト |
| `apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx` | C | 統合パネルテスト |
| `apps/web/app/(admin)/admin/tag-master/page.spec.tsx` | A/C | server page テスト（新規 or 既存更新） |
| `apps/web/app/(admin)/admin/tags/catalog/page.spec.tsx` | C | catalog redirect テスト |

### 1.2 修正

| パス | Lane | 内容 |
|------|------|------|
| `apps/web/src/features/admin/api/tags.ts` | B | `createTag()` を `updateTag` と並置・戻り値 `TagDefinitionItem`（active 補完） |
| `apps/web/src/features/admin/api/members.ts` | B | 既存 `createTag` に 401→`AuthRequiredError` 分岐追加 |
| `apps/web/app/(admin)/admin/tag-master/page.tsx` | A+C | `normalizeTagDefinitionList` 通過 + `TagDefinitionPanel` 描画 + header 文言「タグ定義」 |
| `apps/web/app/(admin)/admin/tags/catalog/page.tsx` | C | `redirect("/admin/tag-master")` 化 |
| `apps/web/src/components/shell/shell-config.ts` | C | `ShellNavItemId` から `tag-catalog` 除去・`tag-master` ラベル「タグ定義」 |
| `apps/web/src/components/shell/icons.tsx` | C | `PATHS` から `tag-catalog` キー除去（union 整合・same-wave） |
| `apps/web/src/styles/globals.css` | C | `.tag-definition-*` 統合スタイル（tokens 準拠・HEX 0） |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | C | nav assertion 更新（数 12→11・「タグ定義」・tag-catalog 除去） |
| `apps/web/src/features/admin/api/__tests__/members.tagCreate.spec.ts` | B | 401 ケース追加（回帰固定） |

### 1.3 削除（統合に吸収・live import 0 を grep 証跡化）

| パス | Lane | 吸収先 |
|------|------|--------|
| `apps/web/src/components/admin/TagCatalogPanel.tsx` | C | `TagDefinitionPanel` |
| `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx` | C | `TagDefinitionPanel` |
| `apps/web/src/components/admin/__tests__/TagCatalogPanel.component.spec.tsx` | C | 統合 spec へ移行（describe.skip 禁止） |
| `apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx` | C | 同上 |

> **再利用（削除しない）**: `tagCatalogLifecycle.ts`（lifecycle 純関数）・`TagCatalogRow.tsx`（一覧行）・`TagMasterEditForm.tsx`（編集フォーム）。
> **非接触（AC-11）**: `apps/web/app/(admin)/admin/tags/page.tsx`・`TagQueuePanel`（タグキュー）。`apps/api/**`・D1 migrations。

---

## 2. 型二重定義の一本化決定（Phase 3 残課題を Phase 5 で確定）

`TagDefinitionItem`（`{tagId,code,label,category,active}`）は **`apps/web/src/components/admin/tagCatalogLifecycle.ts:5` を正本**とする。

- `tagDefinitionView.ts` は **再定義せず** `import type { TagDefinitionItem } from "./tagCatalogLifecycle"` で再利用し、`export type { TagDefinitionItem }` で view 経由参照を可能にする。
- `tags.ts` の `createTag` 戻り値、`TagDefinitionPanel` / `TagDefinitionCreateForm` の item 型も同 SSOT を参照。
- 旧 `TagCatalogPanel.tsx:20` の `TagCatalogListView` は削除（`tagDefinitionView.TagDefinitionListView` に統一）。

> 決定根拠: lifecycle 純関数（`applyLifecycleSuccess` 等）が同型を消費しており、lifecycle を正本にすると統合パネルが lifecycle 戻り値と無変換で繋がる。view 側を新正本にすると lifecycle が view へ依存し循環の懸念があるため、lifecycle 正本＋view 再 export を採用。

---

## 3. 3 lane 分解と依存

```
Lane A（データ層）─────┐
  tagDefinitionView.ts │（list view shape を確定）
                       ▼
Lane C（IA 統合）◀────── TagDefinitionPanel が A の view + 純関数を消費
  ▲                    └ shell-config / icons / catalog redirect / CSS / 旧 panel 削除
  │
Lane B（作成 UI）──────┘（C が作成フォームを統合パネルへ組込）
  tags.ts createTag + TagDefinitionCreateForm（A と独立に着手可）
```

| Lane | タスク仕様書 | 依存 |
|------|-------------|------|
| A | [`tasks/task-a-catalog-crash-fix-and-data-layer.md`](./tasks/task-a-catalog-crash-fix-and-data-layer.md) | なし（C の前提） |
| B | [`tasks/task-b-tag-create-ui.md`](./tasks/task-b-tag-create-ui.md) | なし（A と独立） |
| C | [`tasks/task-c-tag-definition-consolidation.md`](./tasks/task-c-tag-definition-consolidation.md) | A（view）+ B（createTag/form）の surface 確定後に統合 |

> **1 サイクル / 1 PR 完結（CONST_007・先送りなし）**: 停止中フィルタ・作成・lifecycle・nav 整理・redirect・CSS・旧 panel 削除すべて本サイクルで完了。別 PR / バックログ送り無し。

---

## 4. 実装順序（推奨）

1. **A**: `tagDefinitionView.ts` + spec（純関数・他に依存なし・最速 GREEN 可能）。
2. **B**: `members.ts` 401 分岐 → `tags.ts` `createTag` wrapper → `TagDefinitionCreateForm` + spec（A と並行可）。
3. **C**: `TagDefinitionPanel`（A の view + B の form + lifecycle + edit 統合）→ `tag-master/page.tsx` 差替 → `shell-config`/`icons` nav 整理 → `catalog/page.tsx` redirect → `globals.css` → 旧 panel/spec 削除。
4. 横断 gate: `verify-design-tokens` / `git -C apps/api diff --stat` / 旧 panel import grep。

---

## 5. 不変条件適合（Phase 3 マトリクス再掲・Phase 5 確定）

| 不変条件 | 確定内容 |
|---------|---------|
| #1 既存 API のみ | GET/POST/PATCH/DELETE `/admin/tags` のみ消費。新 endpoint 0。`createTag` は既存 `POST /api/admin/tags` |
| #2 D1 直接禁止 | web は proxy のみ |
| #3 OKLch トークン | `.tag-definition-*` は `var(--ubm-*)` のみ・HEX 0 |
| #4 primitives 準拠 | Button/Card/Chip/Input/FormField/EmptyState/ConfirmDialog 再利用・新規 primitive 0 |
| #5 FormField 経由 | 作成/編集 input は FormField |
| #6 useAdminMutation | 作成/編集/lifecycle すべて `@/features/admin/hooks/useAdminMutation` |
| #7 `.spec` のみ | 新規テストは `*.spec.ts(x)` |
| #8 adapter 吸収 | `normalizeTagDefinitionList` で API 非変更 |
| #9 タグキュー不変 | `/admin/tags` 非接触 |

---

## 6. Phase 8/9 連携（旧 panel 削除証跡）

- Phase 8（実装）: 旧 `TagCatalogPanel` / `TagMasterPanel` を削除し統合パネルへ吸収。`TagCatalogRow` / `TagMasterEditForm` / `tagCatalogLifecycle.ts` は再利用で残置。
- Phase 9（検証）: `grep -rn "TagCatalogPanel\|TagMasterPanel" apps/web/src apps/web/app --include="*.ts" --include="*.tsx" | grep -v "__tests__"` が **0 行**（live import 0）。describe.skip 残存 0（FB-TASK-01/02）。
