# task-01 — `getPublicEnvSafe` を `apps/web/src/lib/env.ts` に追加

[実装区分: 実装仕様書]

## 目的

env 不在経路で throw しない safe accessor を追加し、metadata 生成専用に利用できる surface を作る。既存 throw 仕様の `getPublicEnv` / `getEnv` は不変条件として残す。

## 変更対象ファイル

| ファイル | 変更種別 |
| --- | --- |
| `apps/web/src/lib/env.ts` | 編集（function 追加） |
| `apps/web/src/lib/__tests__/env.spec.ts` | 新規 or 既存に追記 |

## 関数シグネチャ

```ts
export function getPublicEnvSafe(
  rawEnv?: RawEnv,
): Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL"> | undefined;
```

- 戻り値 `undefined` = parse 失敗（throw しない）。
- success 時は既存 `getPublicEnv` と同型を返す。

## 実装手順

1. `apps/web/src/lib/env.ts` の `getPublicEnv` 直下に `getPublicEnvSafe` を追加。
2. 実装は `const parsed = PublicEnvSchema.safeParse(rawEnv ?? readRawEnv()); return parsed.success ? parsed.data : undefined;` で完結。
3. JSDoc は付けない（CLAUDE.md: comments 原則禁止。理由が非自明な場合のみ）。

## テスト（追加ケース）

`apps/web/src/lib/__tests__/env.spec.ts`:

- `getPublicEnvSafe({ ENVIRONMENT: "local", NEXT_PUBLIC_API_BASE_URL: "http://localhost:8787" })` → 値を返す。
- `getPublicEnvSafe({})` → `undefined` を返す（throw しない）。
- `getPublicEnv({})` → 例外 throw を維持していること（regression assertion）。

## ローカル実行コマンド

```
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/__tests__/env.spec.ts
```

## DoD

- 上記 vitest が PASS。
- typecheck / lint green。
- 既存 `getPublicEnv` / `getEnv` の signature・throw 挙動が変わっていないこと。
