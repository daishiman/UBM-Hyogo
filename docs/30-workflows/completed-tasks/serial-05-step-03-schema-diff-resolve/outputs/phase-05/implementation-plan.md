**[実装区分: 実装仕様書]**

# Phase 5: 実装計画 — serial-05-step-03-schema-diff-resolve

## 1. 目的

admin/schema 画面の既存 `SchemaDiffPanel` を hardening する。server component は `fetchAdmin("/admin/schema/diff")` で `{ total, items }` を取得し、client component は既存 `postSchemaAlias()` で browser proxy `POST /api/admin/schema/aliases` を呼ぶ。

## 2. 上位原則 / 不変条件（CLAUDE.md 整合）

- `apps/web` から D1 直接アクセス禁止。`apps/api` 経由 (`INTERNAL_API_BASE_URL`) のみ。
- 既存 API endpoint surface のみ利用（新規 endpoint 追加禁止）。
- 色は OKLch design token (`apps/web/src/styles/tokens.css`) 経由。HEX / `bg-[#xxx]` 禁止。
- 新規 test ファイルは `*.spec.tsx` のみ。`*.test.tsx` 禁止。
- env 参照は `apps/web/src/lib/env.ts` 経由（fetch 経路は既存 `server-fetch.ts` を踏襲、`process.env` 直参照を新規追加しない）。

## 3. 変更対象ファイル一覧

| ファイル | 種別 | 概要 |
|---------|------|------|
| `apps/web/app/(admin)/admin/schema/page.tsx` | 編集必要時のみ | 既存 server component。`fetchAdmin("/admin/schema/diff")` と `SchemaDiffPanel` import を維持。 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集 | 既存 4 ペイン + inline form + feedback 表示を hardening。 |
| `apps/web/src/lib/admin/api.ts` | 編集必要時のみ | 既存 `postSchemaAlias()` / `isSchemaAliasRetryableContinuation()` を維持し、error shape drift があれば補正。 |
| `apps/web/src/lib/admin/server-fetch.ts` | 編集必要時のみ | 既存 `/admin/schema/diff` fixture と `fetchAdmin` helper を維持。 |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 編集 | 既存 component spec に 422 / 409 / 202 / queued 表示を追加。 |

> 既存 `server-fetch.ts` には `task17SchemaFixture` + `/admin/schema/diff` 分岐が既に存在する。新規 fetch wrapper を増やさず、`page.tsx` の既存 `fetchAdmin("/admin/schema/diff")` 経路を維持する。

## 4. 関数・型シグネチャ

### 4.1 `SchemaDiffPanel.tsx`

```typescript
"use client";

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

export interface SchemaDiffListProps {
  readonly initial: SchemaDiffListView;
}

export interface SchemaDiffListView {
  readonly total: number;
  readonly items: SchemaDiffItem[];
}

export function SchemaDiffPanel(props: { readonly initial: SchemaDiffListView }): ReactNode;
```

### 4.2 `page.tsx`

```typescript
export const dynamic = "force-dynamic";

export default async function AdminSchemaPage(): Promise<ReactNode>;
```

## 5. 実装順序

1. 現行 `page.tsx` / `SchemaDiffPanel.tsx` / `api.ts` / `server-fetch.ts` を再確認し、既存 topology を Phase 11 evidence に残す。
2. `SchemaDiffPanel.tsx` の表示契約を `{ total, items }` / `queued|resolved` / 202 retryable / 409 / 422 へ固定する。
3. mutation helper は既存 `postSchemaAlias()` を維持する。step-01 hook へ寄せる場合は同 wave で `postSchemaAlias()` 重複を撤去する。
4. 既存 `SchemaDiffPanel.component.spec.tsx` を拡張し green。
5. e2e smoke の `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` 経路で動作確認。

## 6. 依存関係

- **前提（必須）**: step-01 `useAdminMutation` hook が `apps/web/src/features/admin/hooks/useAdminMutation.ts` に実装済。ただし本既存 panel は `postSchemaAlias()` を採用中。
- **共有**: `apps/api/src/routes/admin/schema.ts:178` の `POST /schema/aliases` が稼働中。
- **token**: `apps/web/src/styles/tokens.css` の `--color-surface`、`--color-fg`、`--color-danger`、`--color-success` を利用。
- **error boundary**: `apps/web/src/app/error.tsx`（task-05 で導入済）。

## 7. 縮退仕様ゲート

新規 env gate は導入しない。GET 失敗は既存 `fetchAdmin` / error boundary / fixture 経路に委譲する。POST 422 / 409 / 202 は API 応答として `SchemaDiffPanel` が feedback 表示し、read-only fallback にしない。

## 8. ロールバック手順

1. `SchemaDiffPanel.tsx` の hardening 差分のみ revert。
2. `api.ts` の `postSchemaAlias()` 周辺差分のみ revert。
3. `server-fetch.ts` の fixture 補正があれば revert（`task17SchemaFixture` は維持）。
4. `pnpm typecheck && pnpm lint` で green を確認。
5. ロールバック後は step-02 までの状態に戻ること（step-04 以降未着手であることを GitHub Issue で記録）。

## 9. DoD（このフェーズ）

- [ ] 変更対象ファイル一覧確定
- [ ] 各関数・型シグネチャ確定
- [ ] 実装順序・依存・ロールバック手順記載
- [ ] 縮退ゲートの境界条件明文化
