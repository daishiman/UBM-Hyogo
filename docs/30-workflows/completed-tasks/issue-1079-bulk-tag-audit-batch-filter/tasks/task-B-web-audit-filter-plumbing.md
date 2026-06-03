# Task B: audit UI の batchId filter plumbing（apps/web）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| task | Task B（apps/web filter plumbing） |
| package | `@ubm-hyogo/web` |
| workflow_state | `spec_created` |
| 担当 AC | AC-1 / AC-3 / AC-4 |
| 並列性 | Task C と `AuditLogPanel.tsx` を共有するが編集領域が分離（B=FilterForm/URL builder/型、C=row/抽出 helper/新規 component）。1 サイクル 1 PR で完了（CONST_007）。 |

> 本ファイルは単独実装仕様書（実装者が単独着手できる粒度）。コード実装・runtime 検証は含まない。
> runtime 完了語は記載しない。

---

## 1. 責務

`/admin/audit` の filter form に batchId 入力を追加し、URL builder / page searchParams / 型に batchId を
plumbing する。これにより batchId 絞り込み（AC-1）・action 併用（AC-3）・cursor 保持（AC-4）の UI 側経路を成立させる。
D1 検索 SQL は Task A（apps/api）の責務であり、Task B は API レスポンスのみを扱う（不変条件 #5）。

---

## 2. 変更対象ファイル一覧

| パス | 区分 | 内容 |
| --- | --- | --- |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 | `AuditSearchValues` に batchId 追加 / `buildAuditHref` に batchId 追加 / FilterForm に batchId `<FormField>` 追加 |
| `apps/web/app/(admin)/admin/audit/page.tsx` | 編集 | `buildAuditApiPath` に batchId 追加 / searchParams 解析に batchId 追加 |
| `apps/web/src/lib/admin/types.ts` | 編集 | `AdminAuditFilters` に batchId 追加 |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 追記 | batchId FormField defaultValue 復元 / buildAuditHref が batchId + cursor を保持 |

> `AuditLogPanel.tsx` は Task C も編集するが、Task B は filter 領域（`AuditSearchValues` / `buildAuditHref` / FilterForm）のみに触れる。row 領域（`extractBatchId` / `AuditRow`）は Task C。

---

## 3. 関数シグネチャ before / after

### 3.1 `AuditSearchValues`（`AuditLogPanel.tsx`）

**before:**
```ts
export interface AuditSearchValues {
  readonly action?: string;
  readonly actorEmail?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly fromLocal?: string;
  readonly toLocal?: string;
  readonly limit?: string;
  readonly cursor?: string;
}
```

**after:**
```ts
export interface AuditSearchValues {
  readonly action?: string;
  readonly actorEmail?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly fromLocal?: string;
  readonly toLocal?: string;
  readonly batchId?: string; // ← 追加
  readonly limit?: string;
  readonly cursor?: string;
}
```

### 3.2 `buildAuditHref`（`AuditLogPanel.tsx`・シグネチャ不変・本体に 1 行追加）

`set("to", values.toLocal);` の直後に追加:

```ts
set("batchId", values.batchId); // ← 追加（既存 set() が trim + 空値除外するので空文字は URL に出ない）
```

→ `Pagination` の `nextHref={buildAuditHref(values, data.nextCursor)}` が batchId を保持する（AC-4）。

### 3.3 FilterForm に batchId フィールド追加（`AuditLogPanel.tsx`）

`to (JST)` の `<FormField>` の直後・`limit` の `<FormField>` の前に追加（不変条件 #9 = `FormField` 経由・直接 `<input>` を増やさない）:

```tsx
<FormField
  name="batchId"
  label="batchId"
  helper="batchId は from/to や action と併用推奨（full scan 回避）"
>
  <Input
    name="batchId"
    defaultValue={values.batchId ?? ""}
    placeholder="batch-id (uuid)"
  />
</FormField>
```

- 既存 grid（`grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-4`）の grid セルとして 1 つ増えるだけで、grid 列数の変更は不要（`lg:grid-cols-4` の折り返しに自然に乗る）。
- helper text は `FormField` の `helper` prop で表示（`ui-form-field__helper` クラスで token 由来・HEX 直書きしない）。
- 既存 `Input` import（`../ui/Input`）/ `FormField` import（`../ui/FormField`）は既存のため追加不要。

### 3.4 `buildAuditApiPath`（`page.tsx`・本体に 1 行追加）

`set("to", jstLocalToUtcIso(values.toLocal));` の直後に追加（batchId は日付変換不要・そのまま）:

```ts
set("batchId", values.batchId); // ← 追加
```

### 3.5 searchParams 解析（`page.tsx`・1 行追加）

`withValue(rawValues, "toLocal", toSingle(sp["to"]));` の直後に追加:

```ts
withValue(rawValues, "batchId", toSingle(sp["batchId"])); // ← 追加
```

> `rawValues as AuditSearchValues` キャストは §3.1 で `batchId?: string` を追加済みのため型整合する。
> `dynamic = "force-dynamic"` / `safeServerFetch<AdminAuditListResponse>` の構造は非変更。

### 3.6 `AdminAuditFilters`（`types.ts`）

**before:**
```ts
export interface AdminAuditFilters {
  readonly action?: string;
  readonly actorEmail?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly from?: string;
  readonly to?: string;
  readonly limit?: number;
  readonly cursor?: string;
}
```

**after:**
```ts
export interface AdminAuditFilters {
  readonly action?: string;
  readonly actorEmail?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly from?: string;
  readonly to?: string;
  readonly batchId?: string; // ← 追加（API appliedFilters.batchId と整合）
  readonly limit?: number;
  readonly cursor?: string;
}
```

> `AdminAuditListItem` / `AdminAuditListResponse` は非変更（batchId は JSON 内にあり Task C が抽出する）。

---

## 4. 入出力

| 入力 | 出力 / 振る舞い |
| --- | --- |
| filter form で batchId 入力 → 検索 submit | `GET /admin/audit?...&batchId=<uuid>` で API へ渡る（`buildAuditApiPath`）。 |
| `?batchId=<uuid>` を含む URL で page を開く | searchParams 解析で `values.batchId` に入り、batchId input の defaultValue に復元される。 |
| batchId 空文字 | `set()` の trim + 空値除外で URL / API path に出ない（filter なし扱い）。 |
| 結果に nextCursor あり | 「次のページ」href が `buildAuditHref(values, nextCursor)` で batchId + cursor を保持（AC-4）。 |
| action + batchId 併用 | 両 query が API へ渡り、Task A の WHERE で AND 絞り込みされる（AC-3）。 |

---

## 5. テストケース（`AuditLogPanel.component.spec.tsx` 追記）

| # | ケース | assert |
| --- | --- | --- |
| B-T1 | batchId filter フィールド描画 | `screen.getByLabelText("batchId")` が存在し、`name="batchId"` / `placeholder="batch-id (uuid)"` を持つ。 |
| B-T2 | batchId defaultValue 復元 | `values={{ batchId: "b-123", limit: "50" }}` で render → batchId input の `value` が `"b-123"`。 |
| B-T3 | batchId 未指定で空文字 default | `values={{ limit: "50" }}` で batchId input の `value` が `""`。 |
| B-T4 | buildAuditHref が batchId を保持 | `buildAuditHref({ batchId: "b-1" }, "next")` が `?batchId=b-1` と `&cursor=next` の両方を含む（AC-4）。 |
| B-T5 | buildAuditHref で batchId + 他 filter 併用 | `buildAuditHref({ action: "admin.member.tag_assigned", batchId: "b-1" })` が `action=...` と `batchId=b-1` を両方含む（AC-3 の URL 側）。 |
| B-T6 | batchId 空文字はスキップ | `buildAuditHref({ batchId: "  " })` が `/admin/audit`（batchId が URL に出ない）。 |
| B-T7 | helper text 描画 | batchId フィールドに「併用推奨」を含む helper text が描画される。 |

> 既存テスト（`buildAuditHref — 境界`・`values の各フィールドが defaultValue として反映される`）の固定 URL アサーションに batchId が割り込まないこと（batchId 未指定なら既存挙動不変）を確認する。新規テストは `*.spec.tsx` のみ（不変8）。

---

## 6. ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin/__tests__/AuditLogPanel.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

> lint は `mise exec -- pnpm lint`（または `pnpm lint --fix`）。実行・commit・PR は user-gated。

---

## 7. 不変条件遵守

- **FormField（#9）**: batchId input は `<FormField name="batchId">` 経由。直接 `<input>` を増やさない。
- **OKLch token**: helper text / input は既存 primitives（`FormField` / `Input`）と token のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を書かない。
- **D1 直アクセス（#5）**: Task B は API レスポンスのみ扱い D1 / json_extract に触れない（SQL は Task A）。
- **既存 API surface**: `GET /admin/audit` の query 拡張のみ。新 endpoint を作らない。
- `AuditLogPanel` は server-renderable のまま（`"use client"` を付けない）。

---

## 8. 完了条件 (DoD)

- `AuditSearchValues` / `AdminAuditFilters` に batchId が追加され、型整合する。
- `buildAuditHref` / `buildAuditApiPath` / searchParams 解析に batchId が plumbing されている。
- FilterForm に `<FormField name="batchId">` + helper text が `FormField` 経由で追加されている。
- B-T1..7 のテストが追記され、既存テストの固定 URL アサーションを破壊しない。
- typecheck / 当該 component spec が緑（実行は user-gated）。
- 不変条件（FormField #9 / OKLch / D1 #5 / 既存 API surface / server-renderable 維持）に整合。
