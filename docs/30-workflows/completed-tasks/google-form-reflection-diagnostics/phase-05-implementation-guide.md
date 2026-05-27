---
phase: 5
title: 実装ガイド — 変更ファイル / 関数シグネチャ / DoD
workflow_id: google-form-reflection-diagnostics
status: spec_created
---

# Phase 5 — 実装ガイド (CONST_005 全項目)

[実装区分: 実装仕様書]

## 1. 変更対象ファイル一覧

| パス | 種別 | 概要 |
|------|------|------|
| `apps/api/src/diagnostics/forms-pipeline.ts` | 新規 | 集計クエリ + Hono route handler |
| `apps/api/src/diagnostics/forms-pipeline.contract.spec.ts` | 新規 | D1 lane contract spec |
| `apps/api/src/diagnostics/forms-pipeline.spec.ts` | 新規 | unit spec (純関数 + zod parse) |
| `apps/api/src/diagnostics/member-diagnosis.ts` | 新規 | 1 メンバー診断 handler |
| `apps/api/src/diagnostics/member-diagnosis.contract.spec.ts` | 新規 | D1 lane contract spec |
| `apps/api/src/index.ts` | 編集 | `app.route('/admin/diagnostics', diagnosticsRouter)` を mount |
| `apps/web/app/(admin)/admin/sync-status/page.tsx` | 新規 | Server Component (SSR fetch) |
| `apps/web/src/features/admin/diagnostics/types.ts` | 新規 | zod schema 共有 (web 側コピー) |
| `apps/web/src/features/admin/diagnostics/api.ts` | 新規 | fetch wrapper |
| `apps/web/src/features/admin/components/_members/MemberDiagnosticsPanel.tsx` | 新規 | Member Drawer 内診断パネル |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | 診断パネルを既存 drawer へ統合 |
| `apps/web/playwright/tests/admin/sync-status.spec.ts` | 新規 | env-gated Playwright smoke |

## 2. 関数シグネチャ

### 2.1 `apps/api/src/diagnostics/forms-pipeline.ts`

```ts
import type { Hono } from 'hono';
import type { ApiEnv } from '../env';
import { FormsPipelineSnapshotSchema, type FormsPipelineSnapshot } from './schema';

/**
 * D1 から最新 sync_jobs / counts / public visibility / identity health / alias pending count を集計し、
 * H1-H4 仮説 flag を導出する。secrets は実値を読まず boolean readiness のみ返す。
 */
export async function getFormsPipelineSnapshot(env: ApiEnv): Promise<FormsPipelineSnapshot>;

/** Hono router を返す。`/admin/diagnostics` 配下に mount 想定 */
export function createDiagnosticsRouter(): Hono<{ Bindings: ApiEnv }>;
```

### 2.2 `apps/api/src/diagnostics/member-diagnosis.ts`

```ts
export async function getMemberDiagnosis(
  env: ApiEnv,
  memberId: string,
): Promise<MemberDiagnosis | null>; // 該当 member 無いとき null → handler が 404
```

### 2.3 `apps/web/src/features/admin/diagnostics/api.ts`

```ts
export async function fetchFormsPipelineSnapshot(opts: { cookie: string }): Promise<FormsPipelineSnapshot>;
export async function fetchMemberDiagnosis(memberId: string, opts: { cookie: string }): Promise<MemberDiagnosis>;
```

`opts.cookie` は Server Component で Auth.js cookie をパススルーするための文字列。Client island からの呼び出しは browser cookie が自動付与されるため省略可能 (実装では optional)。

## 3. 入出力 (Phase 4 から再掲)

GET `/admin/diagnostics/forms-pipeline` の response 例は Phase 4 §2.2 / §2.3 を参照。

## 4. 副作用

- **D1 への書き込みなし** (read-only SELECT のみ)
- ログ出力: 既存 admin audit middleware に乗る (新規 logger 追加なし)
- 既存 cron / ingest job への影響なし

## 5. 実装ステップ

1. `apps/api/src/diagnostics/schema.ts` を新規作成し Phase 4 §2.1 / §3.1 の zod schema を export
2. `forms-pipeline.ts` で SELECT 4 本 (`sync_jobs` 直近 10 件 / counts 集計 / `schema_diff_queue` queued / `member_status` join consent/publish) を実装し snapshot を組み立て
3. `member-diagnosis.ts` で member id 起点に SELECT (`member_identities` / `member_status` / `member_responses` / `response_fields`) を実行し H2/H3/H4 個別フラグを導出
4. `apps/api/src/index.ts` で既存 admin middleware の下に `app.route('/admin/diagnostics', createDiagnosticsRouter())` を追加
5. `apps/web/src/features/admin/diagnostics/types.ts` に同一 schema をコピー (apps/api からの import は Workers bundle 都合で避ける)
6. `api.ts` で同一 origin の `/api/admin/diagnostics/*` proxy 経由で fetch
7. `page.tsx` (Server Component) で SSR 取得し H1-H4 判定 UI を render
8. `MemberDiagnosticsPanel.tsx` を `MemberDrawer.tsx` に追加
9. contract / unit / playwright spec を追加し全 green

## 6. テスト追加先 (Phase 6 で詳細化)

- `apps/api/src/diagnostics/forms-pipeline.contract.spec.ts`: D1 lane (`vitest.d1.config.ts`)、既存 `sync-forms-responses.contract.spec.ts` の D1 fixture 構築を再利用
- `apps/api/src/diagnostics/forms-pipeline.spec.ts`: 純関数 (hypothesis flag 導出) を unit 検証
- `apps/api/src/diagnostics/member-diagnosis.contract.spec.ts`: D1 lane
- `apps/web/playwright/tests/admin/sync-status.spec.ts`: env-gated smoke

## 7. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/diagnostics/forms-pipeline.spec.ts apps/api/src/diagnostics/forms-pipeline.contract.spec.ts apps/api/src/diagnostics/member-diagnosis.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:phase12-compliance
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm indexes:rebuild
```

## 8. DoD

- 上記 12 ファイル変更が完了
- 全 quality gate (Phase 7) が green
- staging deploy 後、admin が `/admin/sync-status` を開いて H1-H4 のどれが該当するか bool / 数値で読み取れる
- Member Drawer 診断タブで本人 H2-H4 が読み取れる
- Spec-B (修復) を起票するための事実証拠が揃う
- secrets 実値が response に **一切含まれない** (contract spec で assert)

## 9. 注意事項

- `apps/web` から D1 binding 直接アクセス禁止 (CLAUDE.md 不変条件 #5)
- テスト拡張子 `*.spec.ts` 厳守 (不変条件 #8)
- secrets readiness は boolean のみ。実値の length / hash / 末尾 4 桁等を含めない (Phase 9 §3 参照)
- `apps/web` env 参照は `getEnv()` 経由のみ (`process.env.*` 直接禁止 — CLAUDE.md `apps/web` env アクセス不変条件)
