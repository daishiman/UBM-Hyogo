# Phase 5 — 実装手順書（runbook）

> 後続実装者がそのまま着手できる粒度。各ファイルの「Before の該当箇所 → After の変更内容」、glossary 追加コード、CSS、検証コマンドまで網羅する。
> 全パスは repo ルートからの相対。
> 不変条件: API/D1/shared 型を変更しない（AC-9）/ `<input name>` = query param キー不変 / 新規 primitive ゼロ（AC-10）/ HEX 直書きゼロ（AC-8）。

---

## 0. 着手前の前提確認（実コード裏取り）

実装前に以下を Read / grep で再確認すること（drift 防止）:

```bash
# 既存 glossary（追加先の現状・AUDIT_ACTION_PRESETS / AUDIT_TARGET_TYPE_PRESETS が既存）
sed -n '1,54p' apps/web/src/components/admin/auditGlossary.ts
# Panel の現状フォーム（FormField label が英語キー名直書き L90/103/106/119/122/125/128/139）
sed -n '84,160p' apps/web/src/components/admin/AuditLogPanel.tsx
# Card の現状（item.action 直表示 L37/39、targetType L49、auditId ラベル L54）
sed -n '25,74p' apps/web/src/components/admin/AuditLogCard.tsx
# appliedFilters の英語 label（L29-32, L40-42）
sed -n '22,45p' apps/web/src/components/admin/auditAppliedFilters.ts
# 既存 CSS（.chip-row は L2189-2196 に wrap 定義済 / .admin-audit-* は L1909-2032）
grep -n "\.chip-row\|admin-audit-glossary\|admin-audit-card__meta\|admin-audit-filter" apps/web/src/styles/globals.css
# token 実在確認（border-default / surface-panel / space-2,3,4 / radius-sm / text-xs / text-secondary）
grep -nE "ubm-color-border-default|ubm-color-surface-panel|ubm-space-[234]\b|ubm-radius-sm|ubm-text-xs|ubm-color-text-secondary" apps/web/src/styles/tokens.css
```

**確定事実**:
- `.chip-row` は既に `globals.css` L2189-2196 に `display:flex; flex-wrap:wrap; align-items:center; gap:var(--ubm-space-2)` を持つ（共通ユーティリティ）。**再宣言しない**（重複定義回避）。`.admin-audit-applied-filters` の chip 行はこの既存定義で wrap 済み。
- `--ubm-color-border-subtle` は tokens.css に**未定義**（既存 audit CSS が使用しているがフォールバック透明・既存挙動）。新規 CSS では `--ubm-color-border-default` を使う。
- `--ubm-space-5` は未定義。間隔は `--ubm-space-{1,2,3,4,6}` から選ぶ。

---

## 1. 新規 / 修正ファイルパス一覧テーブル（[Feedback RT-03]）

| # | パス | 種別 |
| --- | --- | --- |
| 1 | `apps/web/src/components/admin/auditGlossary.ts` | 修正 |
| 2 | `apps/web/src/components/admin/AuditLogPanel.tsx` | 修正 |
| 3 | `apps/web/src/components/admin/AuditLogCard.tsx` | 修正 |
| 4 | `apps/web/src/components/admin/auditAppliedFilters.ts` | 修正 |
| 5 | `apps/web/src/components/admin/AuditPurposeGuide.tsx` | 修正（CSS で吸収できる場合は触れない） |
| 6 | `apps/web/src/styles/globals.css` | 修正 |
| 7 | `apps/web/src/components/admin/__tests__/auditGlossary.spec.ts` | 新規 |
| 8 | `apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts` | 新規/追従 |
| 9 | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 新規/追従 |
| 10 | `apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` | 新規/追従 |

> 削除ファイルなし。

---

## 2. ステップ別実装手順

### ステップ 1: `auditGlossary.ts`（C1 / SSOT §4 のコードそのまま追加）

**Before**: ファイル末尾（L53）が `AUDIT_TARGET_TYPE_PRESETS` 配列で終わる。ラベルマップ・helper は存在しない。

**After**: 既存の `AUDIT_GLOSSARY` / `AUDIT_ACTION_PRESETS` / `AUDIT_TARGET_TYPE_PRESETS` は**そのまま残し**、ファイル末尾に以下を追加する。

```ts
// 操作コード → 日本語ラベル（生コード非表示の正本）
export const AUDIT_ACTION_LABELS: Readonly<Record<string, string>> = {
  "attendance.add": "出席を追加",
  "attendance.remove": "出席を取り消し",
  "identity.merge": "会員の名寄せ（統合）",
  "identity.dismiss": "名寄せ候補を却下",
  "admin.member.tag_assigned": "タグを割り当て",
  "admin.member.tag_unassigned": "タグを解除",
  "admin.member.status_updated": "会員ステータスを更新",
  "admin.tag.created": "タグを作成",
  "admin.request.approve": "申請を承認",
  "admin.meeting.created": "開催日を作成",
};

// 対象種別 → 日本語ラベル
export const AUDIT_TARGET_TYPE_LABELS: Readonly<Record<string, string>> = {
  meeting: "開催日",
  member: "会員",
  admin_member_note: "管理メモ",
  tag: "タグ",
};

// フィルタ/フォーム/チップのフィールド日本語ラベル（query param キー → 表示ラベル）
export const AUDIT_FIELD_LABELS: Readonly<Record<string, string>> = {
  action: "操作の種類",
  actorEmail: "実行者（メール）",
  targetType: "対象の種類",
  targetId: "対象ID",
  from: "期間（開始）",
  to: "期間（終了）",
  batchId: "一括処理ID",
  limit: "表示件数",
};

// helper: 登録あれば日本語、未登録は生コード fallback。
// raw fallback の理由: 操作コード/対象種別は将来 DB に未登録の新コードが現れ得る。
//   その場合に空表示すると監査ログの情報が欠落するため、未登録時のみ生コードを返す安全弁とする。
//   常用想定ではない（出現時は Phase 12 未タスク=SSOT 追記候補として記録する）。throw しない。
export const describeAuditAction = (code: string): string =>
  AUDIT_ACTION_LABELS[code] ?? code;
export const describeAuditTargetType = (code: string | null): string =>
  code == null ? "—" : (AUDIT_TARGET_TYPE_LABELS[code] ?? code);
export const describeAuditField = (key: string): string =>
  AUDIT_FIELD_LABELS[key] ?? key;
```

> `AUDIT_ACTION_PRESETS` / `AUDIT_TARGET_TYPE_PRESETS`（datalist 用の生コード配列）は維持する（datalist の `value` は API へ送る生コードのため）。表示専用ラベルは別途上記マップが担う。

---

### ステップ 2: `AuditLogPanel.tsx`（C1/C2 / 2 層段階開示）

**2-a. import 追加**: L15 の import を helper を含める形に拡張。

- Before: `import { AUDIT_ACTION_PRESETS, AUDIT_TARGET_TYPE_PRESETS } from "./auditGlossary";`
- After: `import { AUDIT_ACTION_PRESETS, AUDIT_TARGET_TYPE_PRESETS, describeAuditField } from "./auditGlossary";`

**2-b. 詳細フィルタの open 判定を関数冒頭に追加**: `const items = data?.items ?? [];`（L67）の直後に追加。

```tsx
// 詳細フィルタ（対象の種類 / 対象ID / 一括処理ID）にいずれか値があれば details を既定 open にする（適用中の高度条件を隠さない）。
const advancedHasValue = Boolean(
  values.targetType?.trim() || values.targetId?.trim() || values.batchId?.trim(),
);
```

**2-c. フォームを 2 層に再構成**: L89-145 の `<form>` 内 `FormField` 群を以下の構造へ置換する。

- **常時表示**（form 直下に残す）: 操作の種類（action）/ 実行者（actorEmail）/ 期間（開始）（from）/ 期間（終了）（to）/ 表示件数（limit）。
- **詳細な絞り込み**（`<details>` 内へ移動）: 対象の種類（targetType）/ 対象ID（targetId）/ 一括処理ID（batchId）。

各 `FormField` の `label` を `describeAuditField(key)` 経由の日本語へ。`<input name>` / datalist `id` は不変。

```tsx
{/* 常時表示 */}
<FormField name="action" label={describeAuditField("action")}>
  <Input
    name="action"
    defaultValue={values.action ?? ""}
    placeholder="例: 出席を追加"
    list="audit-action-presets"
  />
</FormField>
<datalist id="audit-action-presets">
  {AUDIT_ACTION_PRESETS.map((value) => (
    <option key={value} value={value} />
  ))}
</datalist>
<FormField name="actorEmail" label={describeAuditField("actorEmail")}>
  <Input name="actorEmail" defaultValue={values.actorEmail ?? ""} inputMode="email" />
</FormField>
<FormField name="from" label={describeAuditField("from")}>
  <Input name="from" type="datetime-local" defaultValue={values.fromLocal ?? ""} />
</FormField>
<FormField name="to" label={describeAuditField("to")}>
  <Input name="to" type="datetime-local" defaultValue={values.toLocal ?? ""} />
</FormField>
<FormField name="limit" label={describeAuditField("limit")}>
  <Select name="limit" defaultValue={values.limit ?? "50"}>
    <option value="25">25</option>
    <option value="50">50</option>
    <option value="100">100</option>
  </Select>
</FormField>

{/* 詳細な絞り込み（段階開示） */}
<details
  className="admin-audit-filter-advanced col-span-full"
  open={advancedHasValue}
>
  <summary>詳細な絞り込み（対象・一括処理ID）</summary>
  <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-3">
    <FormField name="targetType" label={describeAuditField("targetType")}>
      <Input
        name="targetType"
        defaultValue={values.targetType ?? ""}
        placeholder="例: 開催日"
        list="audit-target-type-presets"
      />
    </FormField>
    <datalist id="audit-target-type-presets">
      {AUDIT_TARGET_TYPE_PRESETS.map((value) => (
        <option key={value} value={value} />
      ))}
    </datalist>
    <FormField name="targetId" label={describeAuditField("targetId")}>
      <Input name="targetId" defaultValue={values.targetId ?? ""} />
    </FormField>
    <FormField
      name="batchId"
      label={describeAuditField("batchId")}
      helper="一括処理IDは「期間」や「操作の種類」と一緒に使うと速く絞り込めます"
    >
      <Input
        name="batchId"
        defaultValue={values.batchId ?? ""}
        placeholder="例: 1f3a…（一括処理の目印）"
      />
    </FormField>
  </div>
</details>

{/* 検索 / リセット（不変） */}
<div className="col-span-full flex justify-end gap-2">
  <Button type="submit" variant="primary">検索</Button>
  <Link href="/admin/audit" data-role="reset" className={buttonVariants({ variant: "ghost", size: "md" })}>
    リセット
  </Link>
</div>
```

> **注意**: datalist の `<option value>` は生コード（API 送信値）のまま維持する。placeholder のみ日本語例示に変更（生コード露出を避ける）。`<details>` をフォーム grid 内に置くため `col-span-full` を付け、内部は独自 grid を持たせる。`helper` 文言の英語キー（`batchId` / `from` / `to` / `action`）を日本語へ平易化する（AC-5）。

---

### ステップ 3: `AuditLogCard.tsx`（C1/C3 / action・targetType・auditId 日本語化）

**3-a. import 追加**: L1-10 の import 群に helper を追加。

```tsx
import { describeAuditAction, describeAuditTargetType } from "./auditGlossary";
```

**3-b. action 表示の日本語化**: L37 / L39 の `{item.action}` を `describeAuditAction(item.action)` へ。

- Before（L37）: `<h3 id={`audit-${item.auditId}`}>{item.action}</h3>`
- After: `<h3 id={`audit-${item.auditId}`}>{describeAuditAction(item.action)}</h3>`
- Before（L39）: `<Chip tone="info">{item.action}</Chip>`
- After: `<Chip tone="info">{describeAuditAction(item.action)}</Chip>`

**3-c. targetType 表示の日本語化**: L49 の `<span>{item.targetType ?? "—"}</span>` を helper 経由へ。

- After: `<span>{describeAuditTargetType(item.targetType)}</span>`

> `describeAuditTargetType` が `null` → `"—"` を返すため、`?? "—"` は不要になる。`<code>{item.targetId ?? "—"}</code>`（対象ID の生 ID）はそのまま維持（ID は技術値なので生表示でよい）。

**3-d. auditId ラベルの日本語化**: L54 の `<dt>auditId</dt>` を日本語へ。

- Before: `<dt>auditId</dt>`
- After: `<dt>ログID</dt>`

> `<code>{item.auditId}</code>`（ID 値）はそのまま維持。

---

### ステップ 4: `auditAppliedFilters.ts`（C1 / チップ日本語化・英語キー名ゼロ）

**4-a. import 追加**: L1 の `import type` の下に helper を追加。

```ts
import { describeAuditAction, describeAuditField, describeAuditTargetType } from "./auditGlossary";
```

**4-b. チップ label / value を日本語化**: L29-42 を以下へ置換。

- Before（L29-32）:
```ts
if (hasValue(filters.action)) chips.push({ key: "action", label: "action", value: String(filters.action) });
if (hasValue(filters.actorEmail)) chips.push({ key: "actorEmail", label: "actor", value: String(filters.actorEmail) });
if (hasValue(filters.targetType)) chips.push({ key: "targetType", label: "target type", value: String(filters.targetType) });
if (hasValue(filters.targetId)) chips.push({ key: "targetId", label: "target id", value: String(filters.targetId) });
```
- After:
```ts
if (hasValue(filters.action)) chips.push({ key: "action", label: describeAuditField("action"), value: describeAuditAction(String(filters.action)) });
if (hasValue(filters.actorEmail)) chips.push({ key: "actorEmail", label: describeAuditField("actorEmail"), value: String(filters.actorEmail) });
if (hasValue(filters.targetType)) chips.push({ key: "targetType", label: describeAuditField("targetType"), value: describeAuditTargetType(String(filters.targetType)) });
if (hasValue(filters.targetId)) chips.push({ key: "targetId", label: describeAuditField("targetId"), value: String(filters.targetId) });
```

- Before（L40-42）:
```ts
if (hasValue(filters.batchId)) chips.push({ key: "batchId", label: "batchId", value: String(filters.batchId) });
if (hasValue(filters.limit)) chips.push({ key: "limit", label: "limit", value: String(filters.limit) });
else if (fallbackLimit.trim()) chips.push({ key: "limit", label: "limit", value: fallbackLimit.trim() });
```
- After:
```ts
if (hasValue(filters.batchId)) chips.push({ key: "batchId", label: describeAuditField("batchId"), value: String(filters.batchId) });
if (hasValue(filters.limit)) chips.push({ key: "limit", label: describeAuditField("limit"), value: String(filters.limit) });
else if (fallbackLimit.trim()) chips.push({ key: "limit", label: describeAuditField("limit"), value: fallbackLimit.trim() });
```

> `key`（内部識別子）は英語のまま維持（React key / 重複判定用）。表示される `label` / `value` のみ日本語化。`period`（期間）チップ（L36-38）は既に日本語なので不変。
> **英語キー名ゼロの担保**: 表示文字列（`label` / `value`）に `action` / `actor` / `target type` / `batchId` / `limit` 等の英語が残らない。

---

### ステップ 5: `globals.css`（C3 / 整列・details スタイル・全 token）

`@layer components` 内、既存 `.admin-audit-*` ブロック（L1909-2032 周辺）の末尾に以下を追加する。**`.chip-row` は既存 L2189-2196 で wrap 済のため再宣言しない**。

```css
  /* 監査ログ: 用語集グリッドの整列（行の高さ揃え・最小幅統一） */
  .admin-audit-glossary {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    align-items: stretch;
  }

  /* 監査ログ: カード meta の整列（truncate 安全・最小幅統一） */
  .admin-audit-card__meta {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    align-items: start;
  }

  /* 監査ログ: フィルタ段階開示（詳細な絞り込み details） */
  .admin-audit-filter-advanced {
    margin-top: var(--ubm-space-2);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-sm);
    background: var(--ubm-color-surface-panel-2);
    padding: var(--ubm-space-3);
  }

  .admin-audit-filter-advanced > summary {
    cursor: pointer;
    color: var(--ubm-color-text-secondary);
    font-size: var(--ubm-text-sm);
    font-weight: 700;
  }

  .admin-audit-filter-advanced[open] > summary {
    margin-bottom: var(--ubm-space-3);
  }
```

- 既存の `.admin-audit-glossary`（L1933）/ `.admin-audit-card__meta`（L1999）は `grid-template-columns` を**上書き**する形で追加宣言する（同じ `@layer components` 内の後勝ち）。`display:grid` / `gap` 等の既存プロパティは既存宣言が継続適用される。整理を 1 箇所に集約したい場合は既存宣言を直接編集してもよい（その場合は重複宣言を作らない）。
- **HEX / arbitrary color ゼロ**: 上記は全て `var(--ubm-color-*)` / `var(--ubm-space-*)` / `var(--ubm-radius-*)` / `var(--ubm-text-*)` 経由。

---

### ステップ 6: `AuditPurposeGuide.tsx`（C3 / 必要時のみ）

- 用語集グリッドの整列は CSS（ステップ 5）で吸収できるため、原則 **DOM は触れない**。
- どうしても DOM 調整が必要な場合のみ、`dl.admin-audit-glossary` の構造を維持したまま class 追加に留める（新規 primitive を作らない）。

---

## 3. API 契約の保護（不変点まとめ）

| 不変点 | 確認方法 |
| --- | --- |
| `<input name="action">` 等 8 個の name 属性 | `grep -nE 'name="(action|actorEmail|targetType|targetId|from|to|batchId|limit)"' AuditLogPanel.tsx` で 8 個維持 |
| `buildAuditHref` の `set(key, ...)` キー名 | L43-51 を変更しない |
| datalist `id`（`audit-action-presets` / `audit-target-type-presets`） | 変更しない |
| datalist `<option value>`（生コード） | 変更しない（API 送信値） |
| `apps/api` / `packages/shared` | `git diff --name-only -- apps/api packages/shared` が空 |

---

## 4. 挙動不変温存の確認手順（AC-12）

| 挙動 | 確認 |
| --- | --- |
| 検索 | `<form action="/admin/audit">` + Button submit が不変 |
| リセット | `<Link href="/admin/audit" data-role="reset">` が不変 |
| ページネーション（cursor） | `<Pagination>` + `buildAuditHref(values, nextCursor)` が不変 |
| PII マスク | `maskAuditText` / `maskAuditJson` を経由する表示が不変 |
| JSON 開示 | `JsonDisclosure`（before/after `<details>`）が不変 |
| エラー親切メッセージ | `toAuditErrorView` 経由の Banner が不変 |

---

## 5. ローカル検証コマンド（SSOT §9）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/auditGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx
git diff --name-only -- apps/api packages/shared      # 空であること（AC-9）
```

> **jsdom 注記**: jsdom / happy-dom は CSS を評価しないため、`.admin-audit-glossary` 等の整列（grid-template-columns）はテストで視覚検証できない。テストは **クラスが付与されていること（構造）**に限定し、視覚整列は Phase 11 の screenshot で担保する。
