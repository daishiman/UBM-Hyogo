**[実装区分: 実装仕様書]**

# Phase 1: 要件定義 — serial-05-step-03-schema-diff-resolve

直列順序: 3/5（serial-05 admin-mutation-ui 系列）
前提: step-01 `useAdminMutation` hook 確立済 / step-02 identity-conflicts merge 完了

---

## 1. 目的

UBM 兵庫支部会員サイトの管理画面 `/admin/schema` に既に存在する `SchemaDiffPanel` を、現行 API contract と serial-05 の mutation UI 方針へ揃えて hardening する。資料管理者が field 単位で正規 stableKey を割り当て、alias 解決を安全に実行できる状態を完成させる。

- read-only 表示: 既存 `SchemaDiffPanel` の 4 ペイン（added / changed / removed / unresolved）
- mutation: stableKey 上書き → browser proxy `POST /api/admin/schema/aliases` → Worker `POST /admin/schema/aliases`
- API response: `GET /admin/schema/diff` は `{ total, items }`、未解決 status は `queued`
- step-01 の `useAdminMutation` 方針と既存 `postSchemaAlias` helper の責務を比較し、独自 fetch 増殖を避ける

---

## 2. スコープ

### 19 routes のうち本タスク対象
- `/(admin)/admin/schema`（管理層 8 routes の 1 つ）

### 変更対象ファイル
- `apps/web/app/(admin)/admin/schema/page.tsx`（既存 server component。`fetchAdmin("/admin/schema/diff")` + `SchemaDiffPanel` render）
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`（既存 client component。4 ペイン + alias assign form）
- `apps/web/src/lib/admin/api.ts`（既存 `postSchemaAlias()` / retryable continuation 判定）
- `apps/web/src/lib/admin/server-fetch.ts`（既存 `task17SchemaFixture` / `/admin/schema/diff` fixture 経路）
- 既存 spec: `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`

### 対象外
- API 側実装（`apps/api/src/routes/admin/schema.ts` は変更しない、実在確認済）
- D1 schema 変更
- Google Form schema 変更
- 他の admin routes（members / tags / meetings / requests / identity-conflicts / audit）

---

## 3. 実装区分

| 項目 | 値 |
|------|----|
| taskType | implementation |
| 実装区分 | 実装仕様書（コード変更あり） |
| visualEvidence | **VISUAL**（admin/schema 画面の diff 一覧および resolve form の UI スクリーンショットを Phase 11 で取得） |
| artifacts.json.metadata.visualEvidence | `VISUAL` に固定 |

> Phase 11 では admin ログイン後 `/admin/schema` の diff list / resolve form 入力中 / resolve 成功 toast / 422 collision エラー toast の 4 枚を outputs/phase-11/ に PNG で保存する。

---

## 4. 不変条件（CLAUDE.md 由来 + 本系列固有）

1. **D1 直接アクセス禁止**: `apps/web` から D1 binding 不可。すべて `apps/api` の HTTP endpoint 経由。
2. **既存 API のみ接続**: browser proxy は `/api/admin/schema/*`、Worker route は `/admin/schema/*` のみ利用。新 endpoint 追加禁止。
3. **OKLch design token 正本化**: 色は `apps/web/src/styles/tokens.css` の OKLch token のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。`verify-design-tokens` CI gate で fail 判定。
4. **`getEnv()` 経由のみ**: `apps/web` ランタイムでの env 参照は `apps/web/src/lib/env.ts` の `getEnv()` / `getPublicEnv()` 経由のみ。`process.env.*` 直接参照禁止。
5. **`*.spec.{ts,tsx}` 限定**: 新規テストファイルは `*.spec.tsx` のみ。`*.test.tsx` は CI gate で reject。
6. **プロトタイプ primitives 再利用**: 新規 primitive は生やさず、既存 `docs/00-getting-started-manual/claude-design-prototype/` 由来の primitives + tokens + rhythm に従う。
7. **stableKey regex 同期**: UI 側 form validation regex は API 側と同じ `/^[a-zA-Z][a-zA-Z0-9_]*$/` を使用。
8. **mutation helper の単一化**: 既存 `postSchemaAlias()` と step-01 `useAdminMutation` を二重実装しない。採用する経路を Phase 5 で 1 つに固定する。

---

## 5. 前提条件

| 前提 | 確認方法 |
|------|---------|
| step-01 `useAdminMutation` hook 完成 | `apps/web/src/features/admin/hooks/useAdminMutation.ts` 実在確認 |
| step-02 identity-conflicts merge 完了 | serial-05 step-02 マージ済（PR #757） |
| `GET /api/admin/schema/diff` 実装 | `apps/api/src/routes/admin/schema.ts` で確認 |
| `POST /api/admin/schema/aliases` 実装 | 2026-05-15 時点で `apps/api/src/routes/admin/schema.ts:178` に実装あり（確認済） |
| admin session（admin ロール）取得経路 | `apps/web/src/lib/admin/server-fetch.ts` 既存 helper を経由 |

---

## 6. 外部依存

### API endpoint（実在確認済）

| Endpoint | 用途 | 実在 |
|---------|------|------|
| Worker `GET /admin/schema/diff` / browser proxy `GET /api/admin/schema/diff` | diff 一覧取得 `{ total, items }` | 確認済 |
| Worker `POST /admin/schema/aliases` / browser proxy `POST /api/admin/schema/aliases` | stableKey resolve | 確認済（2026-05-15） |

### 内部依存

- `apps/web/src/features/admin/hooks/useAdminMutation.ts`（step-01）
- `apps/web/src/lib/admin/api.ts`（既存 `postSchemaAlias` helper）
- `apps/web/src/lib/admin/server-fetch.ts`（既存 helper を拡張）
- 既存 admin UI primitives（Toast / Button / Form 系）

---

## 7. 受け入れ条件（DoD 抜粋）

- diff 一覧が server-side `fetchAdmin("/admin/schema/diff")` で render される
- resolve form 送信で browser proxy `POST /api/admin/schema/aliases` が呼ばれ、成功時 `router.refresh()` で再取得
- 422 `stable_key_collision` / 409 conflict / 202 retryable continuation がそれぞれ別状態で提示される
- stableKey input が regex `/^[a-zA-Z][a-zA-Z0-9_]*$/` で client-side validation される
- HEX 直書き 0 件（`verify-design-tokens` PASS）
- `pnpm typecheck` / `pnpm lint` PASS
- 新規 spec が `*.spec.tsx` で命名されている

---

## 8. 縮退仕様（fallback）

新規 env gate は導入しない。GET 失敗は既存 error boundary / fixture fallback に委譲する。POST 422 / 409 / 202 は read-only 縮退ではなく、`SchemaDiffPanel` の feedback として扱う。

---

## 9. metadata（artifacts.json）

```json
{
  "metadata": {
    "taskType": "implementation",
    "visualEvidence": "VISUAL",
    "serialOrder": "3/5",
    "series": "serial-05-admin-mutation-ui",
    "implementation_mode": "existing-schema-diff-panel-hardening",
    "dependsOn": ["serial-05-step-01", "serial-05-step-02"]
  }
}
```
