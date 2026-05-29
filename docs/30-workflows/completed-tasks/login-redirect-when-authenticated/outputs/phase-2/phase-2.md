# Phase 2 — 設計

**[実装区分: 実装仕様書]**

## 1. アーキテクチャ

```
┌─ /login (Server Component) ──────────────────┐
│  searchParams (Promise) を await             │
│  getSession() を await   ─── 既存            │
│  session != null:                            │
│    next = safeNext(searchParams.next)        │
│    redirect(next ?? "/profile")  ─ 終端      │
│  session == null:                            │
│    parseLoginQuery → LoginShell/Card/Panel  │
└──────────────────────────────────────────────┘
```

## 2. `safeNext` 純関数 設計

### 2.1 命名決定

| 候補                   | pros                                  | cons                                         |
| ---------------------- | ------------------------------------- | -------------------------------------------- |
| `safeNext.ts` (camel)  | 元タスク仕様通り                      | 既存 `login-query.ts` 等 kebab-case と不一致 |
| `safe-next.ts` (kebab) | 既存 url ディレクトリ命名と整合 ★採用 | 元タスク仕様と表記揺れ                       |

**決定**: ファイルは `safe-next.ts`（kebab-case）、export 名は `safeNext`（camelCase）。
（既存 `safe-redirect.ts` / `isSafeInternalRedirect` と同パターン）

### 2.2 既存 `safe-redirect.ts` との関係

| 項目                   | `safe-redirect.ts` 既存          | `safeNext`（本タスク） |
| ---------------------- | -------------------------------- | ---------------------- |
| 用途                   | server-action / API リダイレクト | `/login?next=` クエリ専用 |
| 入力型                 | `string \| undefined`            | `unknown`              |
| `/login` ループ防止    | あり                             | あり（既存 predicate 再利用） |
| `:` 拒否               | なし                             | あり（`javascript:` 対策） |
| 長さ上限               | なし                             | 256                    |
| 戻り値                 | `string`（fallback 自動）        | `string \| null`（caller fallback）|

**決定**: 用途が異なる（入力型・戻り値契約が違う）ため**併存**とする。重複コードの整理は Phase 12 で未タスク候補として記録（CONST_007 例外条件には該当しない軽微な topic）。

### 2.3 シグネチャ

```ts
// apps/web/src/lib/url/safe-next.ts
export function safeNext(raw: unknown): string | null;
```

### 2.4 内部判定ロジック

```
raw が string でない → null
raw.length > 256 → null
raw[0] !== '/' → null
raw.startsWith('//') → null
raw.includes('\\') → null
raw.includes(':') → null
return raw
```

副作用なし / throw なし。

## 3. `/login` page 設計

### 3.1 差分

```tsx
// 既存 import に追加
import { redirect } from "next/navigation";
import { getSession } from "../../src/lib/session";
import { safeNext } from "../../src/lib/url/safe-next";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const raw = (await searchParams) ?? {};

  // ▼ 追加: ログイン済みなら redirect
  const session = await getSession();
  if (session) {
    const nextRaw = raw["next"];
    const next = safeNext(Array.isArray(nextRaw) ? nextRaw[0] : nextRaw);
    redirect(next ?? "/profile");
  }
  // ▲ 追加

  const q = parseLoginQuery(raw);
  // ...既存処理
}
```

### 3.2 設計判断

- `getSession()` は内部で `getAuth()` を呼び、例外時 `null` を返す。fail-closed として信頼する。
- `redirect()` は Next.js 内部で `NEXT_REDIRECT` を throw する。**try/catch しない**（既存 `/profile` 系と同パターン）。
- `searchParams.next` が配列の場合は先頭を採用（Next.js の string \| string[] 仕様）。

## 4. 責務境界（state ownership）

| layer        | 責務                                       |
| ------------ | ------------------------------------------ |
| `safe-next.ts` | 入力検証（純関数・副作用ゼロ）           |
| `page.tsx`   | session 取得 + redirect 副作用 + fallback |
| `getSession` | 認証情報取得（既存・fail-closed）         |

## 5. 因果ループ

- 強化ループ: ログイン済み → `/login` 到達 → 即 redirect → UI 不整合解消 → 再到達発生確率低下
- バランスループ: 不正 `next` → `safeNext` で null → `/profile` fallback で攻撃面遮断

## 6. テスト topology

```
unit (vitest)
├─ safe-next.spec.ts: 純関数 16 ケース
└─ page.spec.tsx:
   ├─ session=null → LoginCard 描画
   ├─ session=有, next 無 → redirect("/profile")
   ├─ session=有, next="/members" → redirect("/members")
   └─ session=有, next="//evil" → redirect("/profile")
```

## 7. 4条件評価

| 観点    | 評価                                                        |
| ------- | ----------------------------------------------------------- |
| 価値性  | ログイン済み UX 整合化 + open-redirect 攻撃面遮断           |
| 実現性  | 純関数 + page 1ファイル編集で完結。1サイクル内可            |
| 整合性  | 既存 `getSession` / `redirect` パターン踏襲。新規境界増えず |
| 運用性  | 純関数の挙動が unit でロックされ、回帰検出容易              |
