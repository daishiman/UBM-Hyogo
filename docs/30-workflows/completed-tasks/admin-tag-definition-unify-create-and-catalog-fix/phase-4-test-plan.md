# Phase 4 — テスト計画

> 正本: [`_shared-context.md`](./_shared-context.md) / [`phase-2-design.md`](./phase-2-design.md) / [`phase-3-design-review.md`](./phase-3-design-review.md)。
> 本書は **TDD のテスト設計と local GREEN 済み範囲**を固定する。実コードは本サイクルで実装済み。ブラウザ runtime visual / commit / PR / push のみ user-gated。
> 命名は `*.spec.{ts,tsx}` のみ（不変条件 #7。`*.test.*` は lefthook `block-test-suffix` / CI `verify-test-suffix` が reject）。

---

## 1. テスト対象と方針サマリ

| # | テストファイル | 対象 | 種別 | Lane |
|---|--------------|------|------|------|
| T-A1 | `apps/web/src/components/admin/__tests__/tagDefinitionView.spec.ts` | `normalizeTagDefinitionList` / `filterTagDefinitions` / `countTagDefinitions` | 純関数・防御正規化網羅 | A |
| T-B1 | `apps/web/src/features/admin/api/__tests__/tags.create.spec.ts` | `createTag()` web api fn | 201/409/401/400/非JSON | B |
| T-B2 | `apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx` | 作成フォーム（統合パネル経由） | 検証・409 handling・作成反映 | B/C |
| T-C1 | `apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx` | 統合パネル | 一覧/作成/編集/lifecycle/停止中トグル/件数 | C |
| T-C2 | `apps/web/src/components/shell/__tests__/shell-config.spec.ts`（更新） | nav 整理 | 回帰 guard | C |
| T-C3 | `apps/web/app/(admin)/admin/tag-master/page.spec.tsx`（新規/更新） | server page 防御正規化 | 回帰 guard | A/C |
| T-B3 | `apps/web/src/features/admin/api/__tests__/members.tagCreate.spec.ts`（更新） | members `createTag` の 401 分岐追加 | 回帰固定 | B |

> catalog redirect のテスト（`redirect` mock）は Phase 6（`phase-6-test-additions.md` T-6）で確定。

---

## 2. T-A1: `tagDefinitionView`（防御正規化 falsy 網羅）

純関数のみ（DOM / fetch 不要）。各関数の入出力値検証。

### `normalizeTagDefinitionList`（falsy 全網羅・WEEKGRD-02）

| ケース | 入力 | RED で期待する出力 |
|--------|------|-------------------|
| N-1 | `undefined` | `{ total: 0, items: [] }` |
| N-2 | `null` | `{ total: 0, items: [] }` |
| N-3 | `{}` | `{ total: 0, items: [] }` |
| N-4 | `{ items: null }` | `{ total: 0, items: [] }` |
| N-5 | `{ items: "x" }` | `{ total: 0, items: [] }`（非配列を畳む） |
| N-6 | `{ items: [{tagId:"t1",code:"vip",label:"VIP",category:"membership",active:true}] }` | `total:1`・items 1 件・各値保持・`active===true` |
| N-7 | `{ total:7, items:[...1件...] }` | `total:7`（明示数値優先） |
| N-8 | `{ total:"x", items:[...1件...] }` | `total:1`（非数→items.length） |
| N-9 | `{ items:[null, {tagId:"t2",...}] }` | null 要素除外で 1 件 |

### `filterTagDefinitions`

| ケース | 期待 |
|--------|------|
| F-1 showInactive=false | active のみ |
| F-2 showInactive=true | active+inactive |
| F-3 query="vip" | 部分一致のみ |
| F-4 query="" | base 全件 |
| F-5 query="VIP" | 大文字小文字無視でヒット |

### `countTagDefinitions`

| ケース | 期待 |
|--------|------|
| C-1 `[]` | `{active:0,inactive:0,total:0}`（**空 reduce 安全＝クラッシュ class 根絶の回帰 guard**） |
| C-2 active2/inactive1 | `{active:2,inactive:1,total:3}` |

> **TDD RED**: 未実装段階で import 解決失敗→spec fail（RED）。実装後 GREEN。
> **internal/external（VSCPKR-03）**: 純関数のため internal state 無し。**external = 戻り値**のみを assert。window 不要。

---

## 3. T-B1: `createTag()`（web api fn）

`fetch` を `Object.defineProperty(globalThis, "fetch", { configurable:true, value: vi.fn() })` でモック（`members.tagCreate.spec.ts` 踏襲）。**`vi.stubGlobal("window")` は使わない**（VSCPKR-02）。

| ケース | モック | RED 期待 |
|--------|--------|---------|
| C-B-1 201 成功 | 201 `{tagId,code,label,category,active:true}` | 戻り `{...,active:true}` の `TagDefinitionItem`・fetch URL===`/api/admin/tags`・method POST（新 endpoint を叩かない契約を URL assert で固定・不変条件 #1） |
| C-B-2 201 active 欠落 | 201 active なし | 戻り `active===true`（補完） |
| C-B-3 409 conflict | 409 `{ok:false,error:"tag_code_conflict"}` | `TagCreateError` throw・`code==="tag_code_conflict"`・`status===409` |
| C-B-4 401 | 401 | `AuthRequiredError` throw（fail-closed・不変条件 #11 整合） |
| C-B-5 400 invalid_body | 400 `{ok:false,error:"invalid_body"}` | `TagCreateError(code:"invalid_body",status:400)` |
| C-B-6 非 JSON | 500 + 壊れ text | `TagCreateError(code:null)`・`bodyText` 非空 |

> **internal/external（VSCPKR-03）**: external = throw された error 種別・`code`・`status`・fetch 引数（URL/method/body）。

---

## 4. T-B2: `TagDefinitionCreateForm`（統合パネル spec 内で検証）

`TagDefinitionCreateForm` は `TagDefinitionPanel` の作成導線として実装し、`apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx` で DOM / prop 観測により検証する。単体 spec は重複を避けて作成しない。

| ケース | 操作 | RED 期待（external DOM/prop） |
|--------|------|------|
| C-B-7 409 重複表示 | createTag が `TagCreateError(tag_code_conflict)` reject | `role="alert"`「同じコードのタグが既にあります。…」・`onCreated` 未呼出 |
| C-B-8 大文字 code | code="VIP" submit | `createTag` 未呼出（送信前検証）・検証メッセージ |
| C-B-9 先頭 `_` | code="_x" submit | `createTag` 未呼出 |
| C-B-10 65 文字 | code 65 文字 | `createTag` 未呼出 |
| C-B-11 label 空 | submit | 必須メッセージ・`createTag` 未呼出 |
| C-B-12 成功 | createTag が item を返す | `onCreated(item)` 呼出・入力 reset |

> **internal/external（VSCPKR-03）**: 観測点は `onCreated` mock 呼出有無・`role="alert"` テキスト・`createTag` mock 呼出有無（**external prop / DOM**）。内部 `useState` は覗かない。
> **window モック（VSCPKR-02）**: フォームは window 直接依存なし。fetch 差替は `Object.defineProperty`。`vi.stubGlobal("window")` 禁止。

---

## 5. T-C1: `TagDefinitionPanel`

`@testing-library/react` render。`createTag` / lifecycle mutation を `vi.mock`。`useRouter` を `next/navigation` module mock。

| ケース | 操作 | RED 期待 |
|--------|------|---------|
| P-1 既定有効のみ | active2/inactive1 initial | 一覧 active 2 行のみ・チップ「有効2/停止中1/全体3」 |
| P-2 トグル ON | 「停止中も表示」click | 3 行表示 |
| P-3 0 件 | items=[] | EmptyState・クラッシュなし（**AC-1 回帰 guard**） |
| P-4 作成導線 | 「新規タグ作成」click | 右に作成フォーム |
| P-5 作成反映 | createTag が item | 一覧 prepend・作成 item 選択（AC-4） |
| P-6 検索 | "vip" 入力 | 部分一致行のみ |
| P-7 deactivate | 「しまう」click | active→false・状態 Chip 切替 |
| P-8 physical-delete | 「完全削除」→確定 | ConfirmDialog→行除去。409 使用中は referenceCount メッセージ |

> **internal/external（VSCPKR-03）**: トグル/検索/作成/lifecycle は DOM 操作→表示行数・チップ文言・ConfirmDialog 出現・mock 呼出で検証。内部 state を直接覗かない。
> **window モック（VSCPKR-02）**: パネルは window 直接依存なし。`useRouter` は module mock。必要時のみ `Object.defineProperty(window, ...)`。`vi.stubGlobal("window")` 禁止。

---

## 6. T-C2: `shell-config.spec.ts`（nav 整理後 assertion）

| 既存 → 更新 | RED 期待 |
|-------------|---------|
| admin items 数 12 → **11** | `expect(admin?.items).toHaveLength(11)` |
| `toContain("tag-catalog")` 削除 | `expect(...).not.toContain("tag-catalog")` 追加 |
| `tag-master` label「タグ管理」→「タグ定義」 | `toMatchObject({ href:"/admin/tag-master", label:"タグ定義" })` |
| `tag-catalog` href/label の it（既存 :36-43） | **削除**（describe.skip 禁止・FB-TASK-01/02） |
| `isNavItemActive("/admin/tags","/admin/tag-master")===false` | 維持（特例不変の回帰 guard） |

---

## 7. T-C3: `tag-master/page.spec.tsx`（server page 防御正規化）

| ケース | RED 期待 |
|--------|---------|
| PG-1 ok:true | `TagDefinitionPanel` に `normalizeTagDefinitionList` 通過 initial が渡る |
| PG-2 items 欠落レスポンス | 防御正規化で空配列・クラッシュなし（**AC-2 回帰 guard**） |
| PG-3 ok:false | `AdminSectionErrorClient` 描画（既存挙動維持） |

---

## 8. T-B3: `members.tagCreate.spec.ts`（401 回帰追加）

既存 spec（issue-1068）に 401 ケースを追加し、`createTag`（members 本体）が 401→`AuthRequiredError` を投げる新挙動を回帰固定。既存 C-A-T1〜T3 は維持。

---

## 9. grep gate（CI / 手動・横断）

| gate | コマンド | 期待 |
|------|---------|------|
| HEX 0 | `mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts` | PASS（`.tag-definition-*` に HEX 直書き 0・AC-12） |
| apps/api diff 空 | `git -C apps/api diff --stat` | 空（AC-13・API 非変更） |
| 旧 panel live import 0 | `grep -rn "TagCatalogPanel\|TagMasterPanel" apps/web/src apps/web/app --include="*.ts" --include="*.tsx" \| grep -v "__tests__"` | 0 行（削除証跡） |
| reduce 隔離 | `grep -rn "\.reduce(" apps/web/src/components/admin/TagDefinitionPanel.tsx` | 0（reduce は `countTagDefinitions` のみ） |

---

## 10. 実行コマンド（repo root が root のためフルパス指定）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root . \
  apps/web/src/components/admin/__tests__/tagDefinitionView.spec.ts \
  apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx \
  apps/web/src/features/admin/api/__tests__/tags.create.spec.ts \
  apps/web/src/features/admin/api/__tests__/members.tagCreate.spec.ts \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts \
  apps/web/app/\(admin\)/admin/tag-master/page.spec.tsx \
  apps/web/app/\(admin\)/admin/tags/catalog/page.spec.tsx
mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts
git -C apps/api diff --stat
```

> 相対実行（`apps/web` 内 `vitest run src/...`）だと vitest config root が repo root のため "No test files" になる。**必ず `--root .` + repo root 相対フルパス**（_shared-context §verify_commands 準拠）。

---

## 11. ゲート判定

**PASS → Phase 5 実装仕様へ。**

- 防御正規化の falsy 網羅（N-1〜N-9）、作成失敗パス（401/409/400/非JSON）、nav 回帰、クラッシュ class 根絶の空 reduce guard（C-1 / P-3 / PG-2）を網羅。
- internal/external 区分（VSCPKR-03）と window モック方針（VSCPKR-02・`vi.stubGlobal("window")` 禁止）を全テストで明示。
