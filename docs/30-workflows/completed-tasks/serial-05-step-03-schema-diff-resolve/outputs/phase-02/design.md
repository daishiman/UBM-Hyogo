**[実装区分: 実装仕様書]**

# Phase 2: 設計 — serial-05-step-03-schema-diff-resolve

---

## 1. コンポーネント構成図

```
app/(admin)/admin/schema/page.tsx                        (Server Component)
  │  fetchAdmin<SchemaDiffListView>("/admin/schema/diff")
  │
  └── <SchemaDiffPanel initial={data}>                    (Client Component)
        ├─ 4 panes: added / changed / removed / unresolved
        ├─ selected row local state
        └─ postSchemaAlias()                              (existing admin API helper)
             └─ Browser proxy POST /api/admin/schema/aliases
                └─ Worker POST /admin/schema/aliases
```

---

## 2. データフロー

1. **server fetch**: `page.tsx`（server component）で `fetchAdmin<SchemaDiffListView & { sections?: FormSection[] }>("/admin/schema/diff")` を呼び、Worker `GET /admin/schema/diff` から `{ total, items }` を取得する。
2. **render**: `<SchemaDiffPanel initial={data} />` に props として渡す。
3. **resolve trigger**: row の button click → `SchemaDiffPanel` 内で選択行と `stableKey` local state を保持し、inline form を表示。
4. **mutation**: form submit → `postSchemaAlias()` が browser proxy `POST /api/admin/schema/aliases` を発火し、Worker `POST /admin/schema/aliases` に到達する。
5. **再取得**: 成功時 `router.refresh()` を呼び、server component を再 render し直して最新 diff を表示。失敗時は toast で error を提示。

---

## 3. 型定義

```typescript
// apps/web/src/components/admin/SchemaDiffPanel.tsx
export interface SchemaDiffItem {
  readonly diffId: string;
  readonly revisionId: string;
  readonly type: "added" | "changed" | "removed" | "unresolved";
  readonly questionId: string | null;
  readonly stableKey: string | null;
  readonly label: string;
  readonly suggestedStableKey: string | null;
  readonly status: "queued" | "resolved";
  readonly resolvedBy: string | null;
  readonly resolvedAt: string | null;
  readonly createdAt: string;
}

export interface SchemaDiffListView {
  readonly total: number;
  readonly items: SchemaDiffItem[];
}
```

---

## 4. API contract

### Browser proxy GET /api/admin/schema/diff → Worker GET /admin/schema/diff

```
Request: (admin session cookie 必須)
Response 200:
{
  "total": 1,
  "items": [
    {
      "diffId": "d_xxx",
      "revisionId": "rev_xxx",
      "type": "added",
      "questionId": "q_yyy" | null,
      "stableKey": null,
      "label": "氏名（フルネーム）",
      "suggestedStableKey": "fullName" | null,
      "status": "queued" | "resolved",
      "recommendedStableKeys": ["fullName"]
    }
  ]
}
Response 401: 未認証 → /login へ redirect
Response 403: 非 admin → 403 page
```

### Browser proxy POST /api/admin/schema/aliases → Worker POST /admin/schema/aliases

```
Request:
{
  "diffId": "d_xxx",
  "questionId": "q_yyy" | null,
  "stableKey": "fullName",
  "dryRun": false
}

Response 200:
{ "ok": true, "mode": "apply", "confirmed": true, "backfill": { "status": "completed" } }

Response 202:
{ "ok": true, "mode": "apply", "confirmed": true, "backfill": { "status": "exhausted", "retryable": true, "code": "backfill_cpu_budget_exhausted" } }

Response 422:
{ "ok": false, "code": "stable_key_collision", "error": "stableKey collision", "existingQuestionIds": ["q_old"] }

Response 409:
{ "ok": false, "error": "alias already assigned", "existingStableKey": "fullName" }
```

---

## 5. design token 適用

| 用途 | token |
|------|------|
| 背景 | `--color-surface` / `--color-surface-muted` |
| テキスト | `--color-text` / `--color-text-muted` |
| 主アクション（Resolve） | `--color-primary` / `--color-primary-foreground` |
| status badge: queued | `--color-warning` |
| status badge: resolved | `--color-success` |
| エラー toast | `--color-danger` |

- HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止
- すべて Tailwind の token utility 経由（例: `bg-surface`, `text-text-muted`）

---

## 6. a11y

- table semantics: `<table>` + `<thead>` + `<tbody>`、各 `<th scope="col">`、行は `<tr>`。
- status は視覚情報だけでなく内部値 `queued` / `resolved` を日本語表示へ変換し、支援技術にも伝える。
- row button: `aria-pressed` で選択状態を表す。
- form: `<label htmlFor>` で input と関連付け、エラーは `aria-describedby` で `<p role="alert">` を参照。
- focus: form 展開時に stableKey input へ programmatic focus。

---

## 7. エラー処理

| ケース | 表示 | 動作 |
|--------|------|------|
| 422 stable_key_collision | `validation_error` feedback | form は閉じない、再入力可能 |
| 409 alias conflict | `conflict_error` feedback | form は閉じない |
| 202 retryable continuation | `retryable` feedback | form は閉じず再実行可能 |
| network error / 5xx | toast（danger）"通信エラー、再試行してください" | form は閉じない |
| 401 / 403（mutation） | 既存 admin API helper の error 表示 | server component fetch 段階で /login redirect |
| GET 失敗 | error boundary または fixture fallback | POST 422 を縮退扱いしない |

現行 `SchemaDiffPanel` は `data-feedback-kind` に `success` / `retryable` / `validation_error` / `conflict_error` / `error` を出し分ける。step-01 hook へ寄せる場合もこの表示契約を維持する。

---

## 8. 縮退仕様ゲート

新規 env `ADMIN_SCHEMA_RESOLVE_ENABLED` は導入しない。API surface は既に実在するため、縮退は GET 失敗時の error boundary / fixture fallback に限定する。POST 422 / 409 は縮退ではなく form feedback として扱う。

---

## 9. 状態管理

- server component fetch を正本とし、`useState` でクライアント側 diff cache を持たない。
- mutation 後の最新化は `router.refresh()` のみで行う（SWR / React Query は不採用、step-01〜02 の方針と統一）。
- form の開閉状態（どの row が展開中か）のみ Client Component 側の `useState<string | null>` で管理。

---

## 10. ファイル責務（SRP）

| ファイル | 責務 |
|---------|------|
| `page.tsx` | server-side `fetchAdmin("/admin/schema/diff")` + sections fallback + render |
| `SchemaDiffPanel.tsx` | 4 ペイン表示、row 選択 state、stableKey form、feedback 表示 |
| `api.ts` | `postSchemaAlias()` と retryable continuation 判定 |
| `server-fetch.ts` | `/admin/schema/diff` fixture / server fetch helper |
