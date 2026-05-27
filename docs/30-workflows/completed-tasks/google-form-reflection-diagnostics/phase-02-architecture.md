---
phase: 2
title: アーキテクチャ — diagnostics module 配置と既存資産再利用
workflow_id: google-form-reflection-diagnostics
status: spec_created
---

# Phase 2 — アーキテクチャ

[実装区分: 実装仕様書]

## 1. 全体図

```
┌──────────────────────────────────────────────────────────────────┐
│  apps/web (Cloudflare Workers, Next.js App Router)               │
│                                                                  │
│  /admin/sync-status (Server Component)                           │
│    └─ SSR summary cards (H1-H4 flags)                            │
│         └─ features/admin/diagnostics/api.ts (fetch wrapper)     │
│                                                                  │
│  Member Drawer                                                   │
│    └─ MemberDiagnosticsPanel (新 tab)                            │
└──────────────────────┬───────────────────────────────────────────┘
                       │  HTTPS (Auth.js session + admin role)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  apps/api (Cloudflare Workers, Hono)                             │
│                                                                  │
│  /admin/diagnostics/forms-pipeline     (GET)                     │
│  /admin/diagnostics/member/:id         (GET)                     │
│                                                                  │
│  diagnostics/forms-pipeline.ts                                   │
│  diagnostics/member-diagnosis.ts                                 │
└──────────────────────┬───────────────────────────────────────────┘
                       │  D1 binding (read-only SELECT)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  D1 (既存 schema、変更なし)                                       │
│  - sync_jobs                                                     │
│  - member_responses / response_fields                            │
│  - members / member_identities                                   │
│  - schema_diff_queue                                             │
└──────────────────────────────────────────────────────────────────┘
```

## 2. 既存資産の再利用

| 既存資産 | 再利用方法 |
| --- | --- |
| `apps/api/src/jobs/sync-forms-responses.ts` | 直接呼び出さない。最新実行結果 `sync_jobs` 行のみ参照 |
| `sync_jobs` table | `job_type in ('response_sync','forms_response_sync')` の直近 10 行を `latestSyncRuns` として集計 |
| `member_identities` table | H2 切り分けの primary key (email / external_id alias) |
| `schema_diff_queue` table | H4 切り分けの未割当数 `aliasPendingCount` 算出元 |
| `member_responses` / `response_fields` | カウント (件数 / 直近 1 件取得日時) のみ参照 |
| `apps/api/src/middleware/require-admin.ts` (既存) | `/admin/diagnostics/*` のセッション + role check に再利用 |
| `apps/web/src/lib/env.ts` の `getEnv()` | API base URL / Auth secret を web 側で参照 |

## 3. 新規モジュール配置

| パス | 役割 |
| --- | --- |
| `apps/api/src/diagnostics/forms-pipeline.ts` | パイプライン全体集計クエリ + Hono route handler |
| `apps/api/src/diagnostics/member-diagnosis.ts` | 1 メンバー診断クエリ + Hono route handler |
| `apps/web/app/(admin)/admin/sync-status/page.tsx` | Server Component (SSR fetch + initial render) |
| `apps/web/src/features/admin/diagnostics/types.ts` | zod schema (api ↔ web 共有型の web 側コピー) |
| `apps/web/src/features/admin/diagnostics/api.ts` | fetch wrapper (server-side: getEnv + Auth.js cookie pass-through) |
| `apps/web/src/features/admin/components/_members/MemberDiagnosticsPanel.tsx` | Member Drawer 内診断パネル |

## 4. データフロー

### 4.1 forms-pipeline snapshot

1. admin が `/admin/sync-status` にアクセス
2. Server Component が Auth.js session を取得し admin role を検証
3. Server Component は `safeServerFetch('/admin/diagnostics/forms-pipeline')` で内部 API を呼び、Client component は `/api/admin/diagnostics/*` proxy を呼ぶ
4. `apps/api` 側 handler が D1 へ 4 つの SELECT を発行し `FormsPipelineSnapshot` を組み立てる
5. Server Component が初期描画、Client island が refresh CTA を表示

### 4.2 member diagnosis

1. admin が Member Drawer を開き「診断」タブを選択
2. Client component が `/admin/diagnostics/member/:id` を fetch
3. `apps/api` 側 handler が member 関連 5 SELECT を発行し `MemberDiagnosis` を返す
4. ドロワー内で H1-H4 判定の bool / 数値を表示

## 5. セキュリティ境界

| 境界 | 対策 |
| --- | --- |
| 未認証アクセス | `apps/api` 既存 admin middleware で 401 |
| 非 admin アクセス | role check で 403 |
| secrets 露出 | response に **boolean readiness のみ** 含める (`secretsReadiness.googleServiceAccountEmail: boolean` など)。実値 / 末尾 4 桁等を含めない |
| 個人情報 | 全体 snapshot は集計値のみ。1 メンバー endpoint は admin が id 明示指定時のみ返す |
| CSRF | GET のみのため対象外。POST/PUT は本仕様に含めない |

## 6. 観測性

| 観測項目 | 実装 |
| --- | --- |
| diagnostics endpoint アクセス | 既存 admin audit log に記録 (既存仕組みを再利用) |
| latency | Workers metrics で観測 (新規追加なし) |
| Spec-B 起票判定 | 診断結果を `outputs/phase-11/forms-pipeline-snapshot.json` として保存し、`outputs/phase-12/unassigned-task-detection.md` で参照 |

## 7. 拡張性

将来 H5 以降の新仮説が追加されても、`FormsPipelineSnapshot` に boolean / カウントフィールドを追加するだけで UI 表示を拡張できる構造を選ぶ。zod schema を SSOT として `apps/api` ↔ `apps/web` 間で共有する (Phase 4 参照)。
