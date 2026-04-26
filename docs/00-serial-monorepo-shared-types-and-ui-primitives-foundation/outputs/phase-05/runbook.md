# Runbook: Wave 0 scaffold 実装

## Step 1: root config 更新

```bash
# pnpm-workspace.yaml に packages/integrations/* を追加
# package.json に test script と vitest devDependency を追加
# tsconfig.json に @ubm-hyogo/integrations-google path を追加
# vitest.config.ts 新規作成
pnpm install  # AC-1 sanity
```

## Step 2: packages/shared 雛形

```ts
// packages/shared/src/types/ids.ts
declare const __brand: unique symbol;
export type Brand<T, B> = T & { [__brand]: B };
export type MemberId = Brand<string, "MemberId">;
export type ResponseId = Brand<string, "ResponseId">;
export type ResponseEmail = Brand<string, "ResponseEmail">;
export type StableKey = Brand<string, "StableKey">;
```

```bash
pnpm --filter @ubm-hyogo/shared typecheck  # sanity
```

## Step 3: packages/integrations/google 雛形

```ts
// FormsClient interface のみ。実装は 01b
export interface FormsClient {
  getForm(formId: string): Promise<unknown>;
  listResponses(formId: string): Promise<unknown[]>;
}
```

```bash
pnpm --filter @ubm-hyogo/integrations-google typecheck  # sanity
```

## Step 4: apps/api /healthz 追加

```ts
app.get("/healthz", (c) => c.json({ ok: true }));
```

**sanity**: wrangler dev 後 `curl localhost:8787/healthz` → `{"ok":true}` 200

## Step 5: apps/web UI primitives + tones.ts

```
apps/web/src/components/ui/: Chip/Avatar/Button/Switch/Segmented/Field/
  Input/Textarea/Select/Search/Drawer/Modal/Toast/KVList/LinkPills
apps/web/src/lib/tones.ts: zoneTone/statusTone
```

```bash
pnpm --filter @ubm-hyogo/web typecheck  # sanity
```

## Step 6: 統合検証

```bash
pnpm -r typecheck   # AC-2
pnpm -r lint        # AC-3
pnpm test           # AC-4
```

**全 exit 0 で完了。**
