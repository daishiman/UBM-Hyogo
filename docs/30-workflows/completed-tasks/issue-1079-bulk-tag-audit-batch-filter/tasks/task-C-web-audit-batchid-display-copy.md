# Task C: audit row の batchId 表示 + copy 導線（apps/web）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| task | Task C（apps/web row 表示 + copy） |
| package | `@ubm-hyogo/web` |
| workflow_state | `spec_created` |
| 担当 AC | AC-2 |
| 並列性 | Task B と `AuditLogPanel.tsx` を共有するが編集領域が分離（C=row/抽出 helper/新規 component、B=FilterForm/URL builder/型）。1 サイクル 1 PR で完了（CONST_007）。 |

> 本ファイルは単独実装仕様書（実装者が単独着手できる粒度）。コード実装・runtime 検証は含まない。
> runtime 完了語は記載しない。

---

## 1. 責務

audit row detail に batchId を抽出・表示し、copy ボタンで clipboard へコピーできるようにする（AC-2）。
batchId は audit JSON 内（assign は after 側、unassign は before 側）に存在するため、pure helper `extractBatchId` で
両方向を探索する。copy は client interaction のため、新規 `"use client"` component `BatchIdCopyButton` に閉じ込め、
`AuditLogPanel` は server-renderable を維持する。

---

## 2. 変更対象ファイル一覧

| パス | 区分 | 内容 |
| --- | --- | --- |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 | `extractBatchId` pure helper 追加 / `AuditRow` に batchId 表示ブロック追加 / `BatchIdCopyButton` import |
| `apps/web/src/components/admin/BatchIdCopyButton.tsx` | **新規** | `"use client"` copy ボタン |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 追記 | `extractBatchId` 探索順 / null / AuditRow の batchId `<code>` + copy ボタン描画 |
| `apps/web/src/components/admin/__tests__/BatchIdCopyButton.component.spec.tsx` | **新規** | click で clipboard 呼び出し / copied フィードバック / 失敗 fallback / aria-label |

> `AuditLogPanel.tsx` は Task B も編集するが、Task C は row 領域（`extractBatchId` / `AuditRow`）のみに触れる。filter 領域（`AuditSearchValues` / `buildAuditHref` / FilterForm）は Task B。

---

## 3. `extractBatchId` pure helper（`AuditLogPanel.tsx` に追加）

```ts
export function extractBatchId(item: AdminAuditListItem): string | null {
  const sources = [item.maskedAfter, item.afterJson, item.maskedBefore, item.beforeJson];
  for (const src of sources) {
    if (src && typeof src === "object" && !Array.isArray(src)) {
      const v = (src as Record<string, unknown>).batchId;
      if (typeof v === "string" && v.length > 0) return v;
    }
  }
  return null;
}
```

| 項目 | 仕様 |
| --- | --- |
| 探索順 | `maskedAfter → afterJson → maskedBefore → beforeJson`（assign は after 側、unassign は before 側に batchId を持つため両方向を見る・検索漏れ防止） |
| null 安全 | `src` が null / undefined / 非 object / array の場合はスキップ。`batchId` が string かつ非空のときのみ採用。 |
| 戻り値 | 最初に見つかった非空 string、無ければ `null`（batchId を持たない単一 endpoint audit 行・非 tag action 行は null）。 |
| 副作用 | なし（pure function）。`AuditLogPanel` は server-renderable のまま（この helper は `"use client"` を要求しない）。 |

> `AdminAuditListItem` は `../../lib/admin/types` から既に import 済み（追加 import 不要）。

---

## 4. `AuditRow` の batchId 表示ブロック（`AuditLogPanel.tsx`）

JSON disclosure 群の `<td>` 内・`<JsonDisclosure label="before" ...>` の**前**に batchId ブロックを追加する。

**before（既存の最終 `<td>`）:**
```tsx
<td>
  <JsonDisclosure label="before" value={beforeValue} />
  <JsonDisclosure label="after" value={afterValue} />
  {item.parseError ? <p role="note">JSON parse warning: {item.parseError}</p> : null}
</td>
```

**after:**
```tsx
<td>
  {batchId ? (
    <p data-testid="audit-batch-id">
      batchId: <code>{batchId}</code>
      <BatchIdCopyButton batchId={batchId} />
    </p>
  ) : null}
  <JsonDisclosure label="before" value={beforeValue} />
  <JsonDisclosure label="after" value={afterValue} />
  {item.parseError ? <p role="note">JSON parse warning: {item.parseError}</p> : null}
</td>
```

`AuditRow` 関数冒頭（`afterValue` 計算の直後）に追加:
```ts
const batchId = extractBatchId(item); // ← 追加
```

- batchId が無い行（`null`）では batchId ブロックを描画しない（noop）。
- 既存 JSON disclosure / parseError 表示は非変更。
- `BatchIdCopyButton` を `AuditLogPanel.tsx` 冒頭で import: `import { BatchIdCopyButton } from "./BatchIdCopyButton";`

---

## 5. 新規 client component `BatchIdCopyButton.tsx`

`apps/web/src/components/admin/BatchIdCopyButton.tsx`（**新規・"use client"**）:

```tsx
"use client";
import { useState } from "react";
import { Button } from "../ui/Button";

export function BatchIdCopyButton({ batchId }: { readonly batchId: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(batchId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false); // copy 失敗時はフィードバックを出さず黙って復帰（fallback）
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onCopy}
      aria-label={`batchId ${batchId} をコピー`}
    >
      {copied ? "コピー済み" : "コピー"}
    </Button>
  );
}
```

### props / 挙動仕様

| 項目 | 仕様 |
| --- | --- |
| props | `batchId: string`（readonly・必須） |
| 初期表示 | ラベル「コピー」 |
| click（成功） | `navigator.clipboard.writeText(batchId)` を await → `copied=true`（ラベル「コピー済み」）→ 約 1500ms 後 `copied=false`（「コピー」に戻る） |
| click（失敗 = clipboard 不在 / 権限拒否） | 例外を握り潰し `copied=false` を維持（フィードバックを出さない）。`<code>` 手動選択で代替コピー可能（UI fallback）。 |
| aria-label | `` `batchId ${batchId} をコピー` ``（スクリーンリーダで対象判別可能） |
| 色 / variant | 既存 `Button`（`variant="ghost"` / `size="sm"`）を再利用し token のみ。HEX 直書きしない。新規 primitive を生やさない。 |
| client 境界 | `"use client"` は本 component のみ。`AuditLogPanel` は server-renderable を維持。 |

> `Button` の variant/size 値（`ghost` / `sm`）は既存 `../ui/Button` に存在することを実装時に確認する（`buttonVariants` の variant 集合）。万一 `sm` が未定義なら既存に存在する最小 size を採用する。

---

## 6. テストケース

### 6.1 `AuditLogPanel.component.spec.tsx` 追記

| # | ケース | assert |
| --- | --- | --- |
| C-T1 | `extractBatchId` after 側抽出 | `extractBatchId({ ...item, maskedAfter: { tagId: "t1", batchId: "b-a" } })` が `"b-a"`。 |
| C-T2 | `extractBatchId` before 側抽出（unassign） | `extractBatchId({ ...item, maskedBefore: { tagId: "t1", batchId: "b-b" } })` が `"b-b"`。 |
| C-T3 | `extractBatchId` 探索順（after 優先） | after / before 両方に batchId があるとき after 側（`maskedAfter`）の値を返す。 |
| C-T4 | `extractBatchId` afterJson fallback | masked が無く `afterJson: { batchId: "b-c" }` のとき `"b-c"`。 |
| C-T5 | `extractBatchId` null | batchId を持たない / array / 非 object / 空文字 のとき `null`。 |
| C-T6 | AuditRow に batchId `<code>` 描画 | batchId を持つ row で `screen.getByTestId("audit-batch-id")` 内に `<code>` の UUID とラベル「コピー」を含む copy ボタンが描画される。 |
| C-T7 | batchId 無し行は非描画 | batchId を持たない row で `screen.queryByTestId("audit-batch-id")` が `null`。 |

### 6.2 `BatchIdCopyButton.component.spec.tsx` 新規

clipboard モック方針（**skill lesson VSCPKR-02 遵守**）:
- `Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn() }, configurable: true })` で clipboard を差し替える。
- **`vi.stubGlobal("window", ...)` は禁止**（jsdom window を丸ごと差し替えると `window.setTimeout` 等が壊れる）。タイマーは `vi.useFakeTimers()` で進める。
- 各テスト後に `vi.restoreAllMocks()` / clipboard descriptor の cleanup を行う。

| # | ケース | assert |
| --- | --- | --- |
| C-T8 | click で clipboard 呼び出し | copy ボタン click で `navigator.clipboard.writeText` が `batchId` 引数で呼ばれる。 |
| C-T9 | copied フィードバック | click 後ラベルが「コピー済み」になり、`vi.advanceTimersByTime(1500)` 後「コピー」に戻る。 |
| C-T10 | 失敗時 fallback | `writeText` が reject（または clipboard 不在）でも例外を投げず、ラベルが「コピー」のまま（copied=false 維持）。 |
| C-T11 | aria-label | copy ボタンの `aria-label` が `batchId <uuid> をコピー` を含む。 |

> 新規テストは `*.spec.tsx` のみ（不変8・`*.test.*` 禁止）。

---

## 7. ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin/__tests__/AuditLogPanel.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin/__tests__/BatchIdCopyButton.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

> lint は `mise exec -- pnpm lint`。実行・commit・PR・screenshot は user-gated。

---

## 8. 不変条件遵守

- **OKLch token**: batchId 表示（`<code>`）/ copy ボタン（`Button` ghost/sm）は既存 primitives と token のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を書かない（CI gate `verify-design-tokens`）。
- **client 境界**: `"use client"` は `BatchIdCopyButton.tsx` のみ。`AuditLogPanel` / `extractBatchId` は server-renderable を維持。
- **D1 直アクセス（#5）**: Task C は API レスポンス（`AdminAuditListItem`）のみ扱い D1 に触れない。
- **既存 API surface**: 新 endpoint / schema 変更なし。表示は既存レスポンス内 JSON からの抽出のみ。
- **a11y**: copy ボタンに `aria-label`、clipboard 不在時の fallback（例外握り潰し）。

---

## 9. 完了条件 (DoD)

- `extractBatchId` が after/before 両方向を探索順どおりに走査し、null 安全である。
- `AuditRow` に batchId 表示ブロック（`<code>` + `BatchIdCopyButton`）が追加され、batchId 無し行では非描画。
- 新規 `BatchIdCopyButton.tsx`（"use client"）が props / 挙動 / aria-label / fallback 仕様どおりに実装されている。
- C-T1..11 のテストが追加され、clipboard モックは `Object.defineProperty` 方式（`vi.stubGlobal("window",...)` 不使用）。
- typecheck / 当該 spec が緑（実行は user-gated）。
- 不変条件（OKLch / client 境界 / D1 #5 / 既存 API surface / a11y）に整合。
