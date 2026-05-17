**[実装区分: 実装仕様書]**

# Phase 4: タスク分解 — serial-05-step-03-schema-diff-resolve

SRP に従い 1ファイル=1責務で分解する。各タスクは「変更対象ファイル / 関数シグネチャ / 入出力 / テスト / 実行コマンド / DoD」を必須項目として持つ（CONST_005）。

---

## T0: 着手前 gate（既存トポロジー確認）

**変更対象**: なし（read-only 確認のみ）

**手順**:
```bash
ls   apps/web/app/\(admin\)/admin/schema/
cat  apps/web/src/lib/admin/server-fetch.ts
cat  apps/web/src/lib/admin/useAdminMutation.ts
grep -n "schema/diff\|schema/aliases" apps/api/src/routes/admin/schema.ts
```

**DoD**:
- [ ] 既存 page.tsx 内容を把握
- [ ] server-fetch.ts の既存 export 名と pattern を把握
- [ ] useAdminMutation hook signature を把握
- [ ] API handler の response shape / regex を把握

---

## T1: 既存 `page.tsx` / `server-fetch.ts` contract 確認

**変更対象**: `apps/web/app/(admin)/admin/schema/page.tsx` / `apps/web/src/lib/admin/server-fetch.ts`

**関数シグネチャ**:
```typescript
export interface SchemaDiffItem {
  readonly diffId: string;
  readonly revisionId: string;
  readonly type: "added" | "changed" | "removed" | "unresolved";
  readonly questionId: string | null;
  readonly stableKey: string | null;
  readonly label: string;
  readonly suggestedStableKey: string | null;
  readonly status: "queued" | "resolved";
}
export interface SchemaDiffListView {
  readonly total: number;
  readonly items: SchemaDiffItem[];
}
```

**入出力**:
- 入力: admin session cookie（既存 helper 経由）
- 出力: `SchemaDiffListView`
- 副作用: なし（pure fetch wrapper）

**テスト**: server-fetch は既存 mock 経路に追従（既存 spec があれば追加、なければ統合テストで担保）

**実行コマンド**:
```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

**DoD**:
- [ ] `fetchAdmin<SchemaDiffListView>("/admin/schema/diff")` を維持
- [ ] 401/403 は既存 helper の throw 経路に乗せる
- [ ] typecheck / lint PASS

---

## T2: 既存 `SchemaDiffPanel.tsx` hardening

**変更対象**: `apps/web/src/components/admin/SchemaDiffPanel.tsx`（既存）

**関数シグネチャ**:
```typescript
export function SchemaDiffPanel(props: { readonly initial: SchemaDiffListView }): ReactNode;
```

**入出力**:
- 入力: `{ total, items }`
- 出力: 4 ペイン（added / changed / removed / unresolved）+ inline alias form
- 副作用: 選択中 row / stableKey / busy / feedback の local state

**テスト**: `SchemaDiffPanel.component.spec.tsx`
- `items` render as 4 panes
- `queued` / `resolved` が表示される
- questionId なし row は alias 割当不可 alert
- button click → 該当 row の form 展開

**DoD**:
- [ ] OKLch token のみ
- [ ] `data-feedback-kind` の 5 状態を維持
- [ ] spec PASS

---

## T3: `postSchemaAlias()` error / continuation contract 確認（並列 T2）

**変更対象**: `apps/web/src/lib/admin/api.ts`

**関数シグネチャ**:
```typescript
export const postSchemaAlias = (body: {
  questionId: string;
  stableKey: string;
  diffId?: string;
}) => Promise<AdminMutationResult<SchemaAliasApplyBody>>;
```

**入出力**:
- 入力: `diffId / questionId / stableKey`
- 出力: `AdminMutationResult<SchemaAliasApplyBody>`
- 副作用: browser proxy `POST /api/admin/schema/aliases`

**テスト**: `SchemaDiffPanel.component.spec.tsx` / `apps/web/src/lib/admin/__tests__/api.spec.ts`
- 200 apply → success feedback
- 202 exhausted retryable → retryable feedback
- 409 → conflict feedback
- 422 stable_key_collision → validation feedback

**DoD**:
- [ ] POST 422 を fallback 扱いしない
- [ ] 202 retryable continuation を failure 扱いしない
- [ ] spec PASS

---

## T4: `page.tsx` 統合（server component）

**変更対象**: `apps/web/app/(admin)/admin/schema/page.tsx`

**役割**:
1. `fetchAdmin<SchemaDiffListView & { sections?: FormSection[] }>("/admin/schema/diff")` 呼び出し
2. sections fallback
3. `<SchemaDiffPanel initial={data} />` を render

**実装方針**:
- server component を維持（"use client" は子のみ）
- 新規 env gate は導入しない

**実行コマンド**:
```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm dev   # ローカル確認
```

**DoD**:
- [ ] server component で fetch
- [ ] 縮退分岐が読みやすい if/else
- [ ] typecheck / lint PASS

---

## T5: 既存 tests 拡張

**変更対象**: `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`

**内容**: T2/T3 の component + mutation feedback contract を既存 spec に追加。

**DoD**:
- [ ] `*.spec.tsx` ではなく既存 `*.component.spec.tsx` 命名を維持
- [ ] typecheck / focused test PASS

---

## T6: unit tests 追加 / 更新

**変更対象**:
- `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`
- `apps/web/src/lib/admin/__tests__/api.spec.ts`

**実行コマンド**:
```bash
mise exec -- pnpm test apps/web --run -- SchemaDiffPanel.component.spec.tsx
mise exec -- pnpm test apps/web --run -- api.spec.ts
```

**DoD**:
- [ ] 命名 `*.spec.tsx`（CI gate `verify-test-suffix` PASS）
- [ ] T2 / T3 の test 項目をすべて green

---

## T7: error / fallback path 確認

**変更対象**: なし（T4 の条件分岐の動作確認）

**確認内容**:
- GET 失敗は error boundary / fixture fallback として扱う
- POST 422 は validation feedback
- POST 409 は conflict feedback
- POST 202 は retryable feedback

**DoD**:
- [ ] POST 422 / 409 / 202 を read-only fallback にしない

---

## T8: 視覚エビデンス（Phase 11 用）

**取得対象**（4 枚）:
1. `/admin/schema` diff 一覧（4 ペイン）
2. resolve form 展開状態
3. resolve 成功 toast
4. 422 collision エラー toast

**保存先**: `outputs/phase-11/` の PNG 4 枚

**DoD**:
- [ ] PNG 4 枚保存
- [ ] artifacts.json.metadata.visualEvidence = `VISUAL`

---

## 共通 DoD（全タスク終了時）

- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `verify-design-tokens` PASS（HEX/arbitrary 0 件）
- [ ] `verify-test-suffix` PASS
- [ ] spec 命名は `*.spec.tsx`
- [ ] mutation helper を二重化しない（既存 `postSchemaAlias()` or step-01 hook のどちらかに統一）
