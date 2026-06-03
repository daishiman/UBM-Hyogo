# Phase 2: 設計

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| workflow_state | `spec_created` |
| 対象 | Task A（apps/api）/ Task B・Task C（apps/web） |

> 本ファイルは設計仕様であり、コード実装・runtime 検証は含まない。実装者が単独で着手できる粒度
> （変更対象ファイル・シグネチャ・SQL・JSX 配置・入出力・テスト方針・DoD）を記述する（CONST_005）。

---

## 1. システム思考（因果ループ・バランスループ）

### 因果ループ（問題構造）

```
bulk tag 操作（#1036）で batchId を audit JSON に埋め込む
        │
        ▼
/admin/audit に batchId 検索性が無い  ──┐
        │                              │（強化ループ R）
        ▼                              │
運用者が audit JSON を手作業で目視       │
（JSON inspection コスト）              │
        │                              │
        ▼                              │
一括操作の追跡・取り消し判断が遅延 ───────┘
```

→ batchId filter / 表示 / copy 導線を追加することで強化ループを断ち切る。

### バランスループ（トレードオフ）

```
batchId を JSON 列で検索可能にする（json_extract）
        │
        ▼
JSON 列に index が無い → full scan リスク ◀────┐
        │                                      │（バランスループ B）
        ▼                                      │
keyset cursor + LIMIT + UUID sparse 性 + ────────┘
from/to·action 併用で走査範囲を bound
```

→ 検索利便（価値）と full scan コスト（運用コスト）を、schema 変更を伴わない緩和策で釣り合わせる。
schema 化（index）は別関心として切り離す（§4 / AC-5）。

---

## 2. 責務境界（状態所有権）

| 関心 | 所有レイヤ | 根拠 |
| --- | --- | --- |
| batchId の D1 JSON 検索（`json_extract`） | `apps/api/src/repository/auditLog.ts` | 不変条件 #5（D1 直接アクセスは apps/api に閉じる） |
| query parse / validation / appliedFilters | `apps/api/src/routes/admin/audit.ts` | 既存 audit route の責務。zod で 400 を返す境界 |
| filter input / URL builder / page plumbing | `apps/web`（AuditLogPanel filter 領域・page.tsx・types） | UI plumbing。API レスポンスのみを扱い D1 に触れない |
| batchId 抽出・表示・copy | `apps/web`（AuditLogPanel row 領域・新規 BatchIdCopyButton） | 表示専用。copy は client interaction（"use client"） |

**並列性**: Task B / Task C は `AuditLogPanel.tsx` を共有するが編集領域が分離する。
- Task B = `AuditSearchValues` / `buildAuditHref` / FilterForm（filter 領域）
- Task C = `extractBatchId` helper / `AuditRow`（row 領域）+ 新規 `BatchIdCopyButton.tsx`

両者は 1 実装サイクル・1 PR で完了する（先送り分割ではない・CONST_007）。

---

## 3. Task A: API 設計（apps/api）

### A-1. `audit.ts` — query schema / response / 呼び出し拡張

`ListAuditQueryZ` に batchId を追加する。

```ts
export const ListAuditQueryZ = z.object({
  action: z.string().min(1).optional(),
  actorEmail: z.string().email().optional(),
  targetType: z.string().min(1).optional(),
  targetId: z.string().min(1).optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  batchId: z.string().min(1).optional(), // ← 追加
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
```

`AdminAuditListResponseZ.appliedFilters` に batchId を追加する（`.strict()` 維持のため schema 側も追加必須）。

```ts
appliedFilters: z.object({
  action: z.string().nullable(),
  actorEmail: z.string().nullable(),
  targetType: z.string().nullable(),
  targetId: z.string().nullable(),
  from: z.string().nullable(),
  to: z.string().nullable(),
  batchId: z.string().nullable(), // ← 追加
  limit: z.number().int().min(1).max(100),
}).strict(),
```

`app.get("/audit", ...)` 内の修正点（3 箇所）:

1. safeParse 入力に `batchId: c.req.query("batchId") || undefined` を追加。
2. `listFiltered({ ... })` 呼び出しに spread 追加:
   ```ts
   ...(parsed.data.batchId ? { batchId: parsed.data.batchId } : {}),
   ```
3. `appliedFilters` 返却に追加:
   ```ts
   batchId: parsed.data.batchId ?? null,
   ```

`ListAuditResponse` interface（`appliedFilters`）にも `batchId: string | null;` を追加し、`satisfies ListAuditResponse` を保つ。

> 既存 `appliedFilters` には実コード上 `action / actorEmail / targetType / targetId / from / to / limit` が含まれる。
> 本タスクはここに `batchId` を 1 つ加えるのみで、他フィールドの順序・型は変更しない。

### A-2. `auditLog.ts` — filter 型と json_extract 検索

`AuditLogListFilters` に batchId を追加:

```ts
export interface AuditLogListFilters {
  action?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  fromUtc?: string;
  toUtcExclusive?: string;
  batchId?: string; // ← 追加
  cursor?: { createdAt: string; auditId: string };
  limit: number;
}
```

`listFiltered` 内、cursor 句より**前**（plain 列 filter 群の後）に batchId 専用 WHERE を追加する。
`add()` helper は単一 `?` を 1 つの `?N` に置換する前提のため **使わず**、値を 1 回だけ push して
同じ `?N` を両 `json_extract` で参照する:

```ts
if (filters.action) add("action = ?", filters.action);
if (filters.actorEmail) add("actor_email = ?", filters.actorEmail);
if (filters.targetType) add("target_type = ?", filters.targetType);
if (filters.targetId) add("target_id = ?", filters.targetId);
if (filters.fromUtc) add("created_at >= ?", filters.fromUtc);
if (filters.toUtcExclusive) add("created_at < ?", filters.toUtcExclusive);
if (filters.batchId) {
  bindings.push(filters.batchId);
  where.push(
    `((json_valid(after_json) AND json_extract(after_json, '$.batchId') = ?${bindings.length}) ` +
      `OR (json_valid(before_json) AND json_extract(before_json, '$.batchId') = ?${bindings.length}))`,
  );
}
if (filters.cursor) { /* 既存 keyset 句（非変更） */ }
```

**ポイント**:
- assign は `after_json.$.batchId`、unassign は `before_json.$.batchId` に batchId が入るため、両列を OR で検索する（検索漏れ防止）。
- 値は **1 回だけ** `bindings.push` し、両 `json_extract` が同一 `?N` を参照する（`add()` を使うと 2 binding に分かれ番号がずれるため不可）。
- 他 filter（action / from / to 等）との AND は既存 `where.join(" AND ")` でそのまま成立する（AC-3）。
- ORDER BY / LIMIT / cursor / `add()` の既存挙動は変更しない。

### A-3. AC-5 full scan 方針（schema 変更回避の根拠 = AC-5 充足）

`json_extract(after_json, '$.batchId')` は **JSON 列に index が無い**ため、原理的に `audit_log` の
sequential scan（full scan）になる。本タスクは以下で制限を明記し、schema 変更を別関心として切り離す:

| 緩和策 | 内容 |
| --- | --- |
| (a) keyset cursor + LIMIT | `ORDER BY created_at DESC, audit_id DESC LIMIT ?N` により 1 ページの取得行数を bound（既存挙動）。full table を一度に返さない。 |
| (b) batchId の sparse 性 | batchId は `crypto.randomUUID()`（UUID v4）。衝突確率は無視可能で、一致行は 1 bulk 操作分のみ（=極めて sparse）。 |
| (c) 併用推奨 | batchId filter は from/to 日付や action（`admin.member.tag_assigned` 等）と併用することで、scan 前に `created_at` / `action` の plain 列条件で範囲を絞れる。UI helper text で誘導（Task B）。 |

**schema 変更の別タスク化（scope 外）**: `correlation_id` 列追加 / generated column（`batchId` 抽出列）/
JSON index migration は本タスクの scope 外。親 #1036 が schema 変更なしの軽量 batchId 方針を採択済みで、
index 化は migration を伴う別関心。将来 audit 行数が増え full scan コストが問題化した場合に、別タスクとして
generated column + index を検討する方針を Phase 12 未タスク候補に記録する。

> `json_extract` は SQLite/D1 でサポートされる組み込み関数。D1 上での動作と full scan semantics は
> Phase 4（テスト作成）で実 D1（miniflare / D1 fixture）に対する contract test で実測検証する。

---

## 4. Task B: Web filter plumbing 設計（apps/web）

### B-1. `AuditLogPanel.tsx` — filter 領域

`AuditSearchValues` に batchId を追加:

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

`buildAuditHref` に batchId を含める（既存 `set()` は空値を除外するので空文字は URL に出ない）:

```ts
set("from", values.fromLocal);
set("to", values.toLocal);
set("batchId", values.batchId); // ← 追加
set("limit", values.limit);
set("cursor", cursor);
```

→ これにより Pagination の `nextHref={buildAuditHref(values, data.nextCursor)}` が batchId を保持する（AC-4）。

FilterForm に batchId フィールドを追加（`<FormField>` 経由・不変条件 #9）:

```tsx
<FormField name="batchId" label="batchId">
  <Input
    name="batchId"
    defaultValue={values.batchId ?? ""}
    placeholder="batch-id (uuid)"
  />
</FormField>
```

- 配置は from/to の後・limit の前（既存 `grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-4`）。
  フィールドは grid セルとして増えるだけで、`lg:grid-cols-4` の折り返しに自然に乗る（grid 列数は変更不要）。
- helper text（advanced filter 誘導）を `<FormField>` の説明、または batchId 入力近傍の `<p className="...text token...">` で
  「batchId は from/to や action と併用推奨（full scan 回避）」と示す。色は token のみ・HEX 禁止。
- 既存 action free text（`list="audit-action-presets"`）はそのまま維持（advanced filter 群として共存）。

### B-2. `page.tsx` — searchParams plumbing

`buildAuditApiPath` に batchId を追加:

```ts
set("from", jstLocalToUtcIso(values.fromLocal));
set("to", jstLocalToUtcIso(values.toLocal));
set("batchId", values.batchId); // ← 追加（日付変換不要・そのまま）
set("limit", values.limit);
set("cursor", values.cursor);
```

searchParams 解析に batchId を追加:

```ts
withValue(rawValues, "batchId", toSingle(sp["batchId"]));
```

`page.tsx` の `dynamic = "force-dynamic"` / `safeServerFetch<AdminAuditListResponse>` の構造は非変更。

### B-3. `types.ts` — appliedFilters 型整合

`AdminAuditFilters`（`appliedFilters` の型）に batchId を追加:

```ts
export interface AdminAuditFilters {
  readonly action?: string;
  readonly actorEmail?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly from?: string;
  readonly to?: string;
  readonly batchId?: string; // ← 追加
  readonly limit?: number;
  readonly cursor?: string;
}
```

`AdminAuditListItem` / `AdminAuditListResponse` は Task C の表示で参照するが、batchId は JSON 内にあるため
型追加は不要（既存 `maskedBefore` / `maskedAfter` / `beforeJson` / `afterJson` から抽出する）。

---

## 5. Task C: Web row detail batchId 表示+copy 設計（apps/web）

### C-1. `extractBatchId` pure helper（AuditLogPanel.tsx に追加）

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

- 探索順: `maskedAfter → afterJson → maskedBefore → beforeJson`。assign 行は after 側、unassign 行は before 側に batchId を持つため両方を見る。
- 見つからなければ `null`（batchId を持たない単一 endpoint の audit 行や非 tag action 行は表示しない）。
- pure function（副作用なし）。`AuditLogPanel` は server-renderable のまま保つ（このヘルパは "use client" を要求しない）。

### C-2. `AuditRow` — batchId 表示行

JSON disclosure とは別に、batchId 専用の表示ブロックを追加する:

```tsx
function AuditRow({ item }: { readonly item: AdminAuditListItem }) {
  const beforeValue = item.maskedBefore ?? item.beforeJson ?? null;
  const afterValue = item.maskedAfter ?? item.afterJson ?? null;
  const batchId = extractBatchId(item); // ← 追加
  return (
    <tr>
      {/* 日時/ID・action/actor・target は既存どおり */}
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
    </tr>
  );
}
```

- batchId が無い行では batchId ブロックを描画しない（`null`）。
- 既存 JSON disclosure / parseError 表示は非変更。

### C-3. 新規 client component `BatchIdCopyButton.tsx`

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

- "use client" は **この component のみ**に閉じ込める。`AuditLogPanel` は server-renderable を維持する。
- copy 失敗（`navigator.clipboard` 不在 / 権限拒否）時は例外を握り潰し、copied フィードバックを出さない（UI fallback）。手動コピーは `<code>` 選択で可能。
- 色・variant は既存 `Button` の `variant="ghost"` を使い token のみ（HEX 禁止）。
- `aria-label` で copy 対象を明示（アクセシビリティ）。

---

## 6. ライブラリ / SQL 選定

| 選定 | 採用 | 根拠 |
| --- | --- | --- |
| JSON 検索 | SQLite/D1 組み込み `json_extract(col, '$.batchId')` | schema 変更なしで JSON 内 batchId を検索可能。外部依存ゼロ。動作は Phase 4 で実 D1 fixture に対し検証。 |
| binding | 既存 `bindings.push` + `?N` 手動付番 | `add()` helper は単一 `?` 前提。両列 OR で同一 `?N` を共有するため直接 push する。 |
| copy | ブラウザ標準 `navigator.clipboard.writeText` | 追加依存なし。fallback で例外を握る。 |
| filter input | 既存 primitives `FormField` + `Input` | 不変条件 #9。新規 input を直接生やさない。 |
| copy button | 既存 `Button`（ghost / sm） | OKLch token のみ。新規 primitive を生やさない。 |

---

## 7. 変更対象ファイル一覧

| パス | 区分 | Task |
| --- | --- | --- |
| `apps/api/src/routes/admin/audit.ts` | 編集 | A |
| `apps/api/src/repository/auditLog.ts` | 編集 | A |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集（B: filter / C: row + helper） | B / C |
| `apps/web/app/(admin)/admin/audit/page.tsx` | 編集 | B |
| `apps/web/src/lib/admin/types.ts` | 編集 | B |
| `apps/web/src/components/admin/BatchIdCopyButton.tsx` | **新規** | C |
| 各 spec（contract / repository / component） | 新規 / 追記 | A / B / C |

---

## 8. 入出力・副作用・エラーハンドリング

| ケース | 振る舞い |
| --- | --- |
| `?batchId=<uuid>`（一致あり） | 該当 batchId を after/before に持つ行のみ返却（200）。 |
| `?batchId=<uuid>`（不一致） | 空 `items: []`・`nextCursor: null`（200）。エラーではない。 |
| `?batchId=` 空文字 | `c.req.query("batchId") || undefined` で undefined 扱い → filter 適用なし（全件 query 既存挙動）。 |
| invalid query（例: limit 範囲外） | 既存どおり zod safeParse 失敗 → `400 { ok:false, error:"invalid query" }`。batchId は `z.string().min(1).optional()` なので空文字は上流で undefined 化され 400 を誘発しない。 |
| `?action=...&batchId=...&from=...` 併用 | 全条件 AND（AC-3）。json_extract OR は括弧で AND の中の 1 項として閉じる。 |
| copy 成功 | `navigator.clipboard.writeText` → "コピー済み" を 1.5s 表示 → "コピー" に戻る。 |
| copy 失敗（clipboard 不在 / 拒否） | 例外を握り潰し copied=false 維持。`<code>` 手動選択で代替（fallback）。副作用なし。 |
| batchId 不在行 | row に batchId ブロックを描画しない（noop）。 |

**副作用**: API は read-only（audit_log への mutation なし・append-only 不変は維持）。UI copy は clipboard への書き込みのみ。

---

## 9. テスト方針概要（Phase 4 で詳細化）

| 層 | spec | 観点 |
| --- | --- | --- |
| repository | `auditLog.spec.ts`（追記） | `listFiltered({ batchId })` が after/before 両列の json_extract OR を生成し、一致行のみ返す。action / from・to との AND 併用（AC-3）。値が同一 `?N` を共有し binding がずれない。 |
| API contract | `audit` route contract spec（追記・**d1 config 必須**） | `?batchId=<uuid>` で該当 row のみ。`appliedFilters.batchId` 返却。`?action=&batchId=` 併用。不一致→空。invalid query→400。 |
| component | `AuditLogPanel.spec.tsx`（追記） | `extractBatchId` の after/before 探索順・null。AuditRow に batchId `<code>` + copy ボタン描画。`buildAuditHref` が batchId / next URL を保持（AC-4）。filter form に `<FormField name="batchId">` 描画。 |
| client component | `BatchIdCopyButton.spec.tsx`（新規） | click で `navigator.clipboard.writeText(batchId)` 呼び出し。copied フィードバック。失敗時 fallback。aria-label。 |
| page | （任意）`page` 解析 | searchParams → batchId が `buildAuditApiPath` に渡る。 |

新規テストファイルは `*.spec.ts(x)` のみ（`*.test.*` 禁止・CLAUDE.md 不変8）。

---

## 不変条件遵守の明記

- **OKLch token**: 新規 UI（filter / batchId 表示 / copy）は既存 primitives と token のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を書かない（CI gate `verify-design-tokens`）。
- **FormField（#9）**: batchId filter input は `<FormField>` 経由。直接 `<input>` を生やさない。
- **D1 直アクセス（#5）**: json_extract SQL は `apps/api/src/repository/auditLog.ts` にのみ存在。apps/web は API レスポンスのみ扱う。
- **既存 API surface**: `GET /admin/audit` の query 拡張のみ。新 endpoint / schema / write 側変更なし。

---

## 完了条件 (DoD)

- Task A/B/C それぞれの変更対象ファイル・シグネチャ・SQL・JSX が、実装者が単独で着手できる粒度で記述されている。
- json_extract の値共有（同一 `?N`）・after/before 両列 OR 検索が明記されている（検索漏れ防止）。
- AC-5 full scan 方針（緩和策 + schema 変更の別タスク化）が独立セクションで記述されている。
- 入出力・副作用・エラーハンドリング・テスト方針が網羅されている。
- 不変条件（OKLch / FormField / D1 / 既存 API surface）の遵守が明記されている。
