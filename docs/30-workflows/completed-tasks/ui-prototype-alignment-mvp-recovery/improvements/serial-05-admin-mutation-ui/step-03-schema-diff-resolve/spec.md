# step-03-schema-diff-resolve 実装仕様書

**[実装区分: 実装仕様書 (read-only 可視化 + optional mutation)]**
**[直列順序: 3/5 | 前提: step-01 useAdminMutation hook]**

## 1. 目的

admin/schema 画面の既存 `SchemaDiffPanel` に diff 一覧と resolve UI が存在するため、本 step では greenfield 追加ではなく existing hardening として現行 API contract・a11y・validation を揃える。

**API 実在確認済 (2026-05-15)**: `apps/api/src/routes/admin/schema.ts:178` に `app.post("/schema/aliases", ...)` 実装あり。本 spec は **full 仕様（SchemaDiffResolveForm 含む）** で進める。縮退ゲートは fallback として残すが、デフォルトは full 実装。

## 2. スコープ

- **変更対象**: `apps/web/src/components/admin/SchemaDiffPanel.tsx` / `apps/web/src/lib/admin/api.ts` / focused tests
- **既存実装 hardening**: `SchemaDiffPanel` の 4 ペイン table semantics、stableKey client validation、form focus、409/422 payload detail、status 日本語表示
- **API**:
  - `GET /api/admin/schema/diff` (read-only fetch)
  - `POST /api/admin/schema/aliases` (resolve, optional)
- **UI パターン**: diff 一覧表示 → optional form → mutation (if API exists)

## 3. 変更対象ファイル一覧

```
apps/web/src/lib/admin/
  ├── api.ts (POST /api/admin/schema/aliases payload detail retention)
apps/web/src/components/admin/
  ├── SchemaDiffPanel.tsx (既存 hardening)
  └── __tests__/SchemaDiffPanel.component.spec.tsx
```

## 4. 設計

### 4.1 SchemaDiffPanel list region

**役割**: 既存 `SchemaDiffPanel` 内の schema diff 一覧表示（field-by-field）

**Props**:
```typescript
interface SchemaDiffListProps {
  readonly diffs: readonly SchemaDiff[];
  readonly onResolve?: (diffId: string, stableKey: string) => void;
}

interface SchemaDiff {
  readonly diffId: string;
  readonly questionId: string | null;
  readonly label: string;
  readonly suggestedStableKey: string | null;
  readonly status: "queued" | "resolved";
}
```

**UI 構成**:
- table または card list で diff 表示
  - diffId
  - questionId (nullable)
  - label (schema 上の質問文)
  - suggestedStableKey (AI recommendation, read-only)
  - status badge
  - resolve button (optional)

**Read-only vs Interactive**:
- API `POST /api/admin/schema/aliases` が存在 → resolve button 表示
- API 未実装 → read-only 表示のみ

### 4.2 SchemaDiffResolveForm component (optional)

**役割**: 既存 `SchemaDiffPanel` 内の schema diff field-by-field resolve

**Props**:
```typescript
interface SchemaDiffResolveFormProps {
  readonly diffId: string;
  readonly questionId: string | null;
  readonly label: string;
  readonly suggestedStableKey: string | null;
  readonly onSuccess: () => void;
}
```

**フォーム要素**:
- text input: stableKey (override suggestion)
- checkbox: dryRun (optional)
- "Resolve" button

**API Contract**:
```
POST /api/admin/schema/aliases
{
  "diffId": "...",
  "questionId": "...",
  "stableKey": "user_defined_key",
}

Response (200):
{
  "ok": true,
  "mode": "apply",
  "confirmed": true,
  "backfill": { "status": "completed" }
}

Error (422):
{ "ok": false, "code": "stable_key_collision", "error": "stableKey collision", "existingQuestionIds": ["..."] }
```

## 5. 関数・型シグネチャ

### SchemaDiffList
```typescript
export function SchemaDiffList({
  diffs,
  onResolve,
}: SchemaDiffListProps): ReactNode;
```

### SchemaDiffResolveForm
```typescript
export function SchemaDiffResolveForm({
  diffId,
  questionId,
  label,
  suggestedStableKey,
  onSuccess,
}: SchemaDiffResolveFormProps): ReactNode;
```

## 6. 入出力・副作用

### SchemaDiffList
- **入力**: diffs array, optional onResolve callback
- **出力**: table/card list HTML
- **副作用**: button click → modal or form toggle

### SchemaDiffResolveForm
- **入力**: diff metadata (diffId, questionId, label, etc.)
- **出力**: form HTML + submit button
- **副作用**: useAdminMutation trigger, router.refresh(), onSuccess callback

## 7. テスト方針

### SchemaDiffPanel.component.spec.tsx
- [✓] diffs render as rows
- [✓] 4 ペイン table semantics
- [✓] queued / resolved は日本語 label
- [✓] form render (stableKey input + submit)
- [✓] row select → stableKey input focus
- [✓] stableKey input change
- [✓] client-side regex validation + `aria-describedby`
- [✓] submit → mutation trigger
- [✓] 200 response → onSuccess()
- [✓] 422 response (collision) → error alert with existingQuestionIds
- [✓] 409 response → conflict alert with existingStableKey

## 8. ローカル実行コマンド

```bash
# unit test
pnpm exec vitest run apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx apps/web/src/lib/admin/__tests__/api.spec.ts

# dev server
pnpm dev
# → http://localhost:3000/admin/schema
# → diff list 表示
# → resolve button (if available) → form

# e2e
pnpm e2e:smoke
```

## 9. DoD

### 実装完了
- [✓] 既存 SchemaDiffPanel hardening
- [✓] unit test green
- [✓] page.tsx で fetch + component 统合

### 品質
- [✓] table a11y (th/td, scope)
- [✓] form validation (stableKey regex: /^[a-zA-Z][a-zA-Z0-9_]*$/)
- [✓] design token 色 使用

### 動作確認
- [✓] diff list render
- [✓] resolve form toggle (if available)
- [✓] mutation 後 list 自動 refetch
- [✓] error handling (422)
- [✓] smoke test PASS

## 10. リスク

1. **API availability**: `POST /api/admin/schema/aliases` 実装状況確認必須
2. **stableKey validation**: API側の regex と同期確認
3. **処理待ち feedback**: 長時間実行される diff 処理に対する UI feedback

## 11. 前提

**step-01 完了**: useAdminMutation hook 確立済

## 12. 縮退仕様ゲート

**条件**: `POST /api/admin/schema/aliases` が未実装の場合
- **動作**: SchemaDiffList read-only 표시のみ
- **UI**: resolve button 非表示
- **追加**: "resolve は今後実装" メモ or placeholder
- **残課題**: API 실装後に SchemaDiffResolveForm 統合

---

**Updated**: 2026-05-16
**Status**: implemented-local-runtime-pending（local hardening 実装済み、runtime screenshots / PR は user-gated）
