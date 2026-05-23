# Implementation Guide

## Part 1: 中学生レベルの説明

管理画面には、会員さんの公開状態を棒グラフで見る場所があります。前の作業では、その場所に「あとで本物に差し替えるための小さな仮画像」だけが置かれていました。

これは、学校の発表で「ここに写真を貼る」と書いた紙を先に置いておき、あとで本物の写真に貼り替えるのに似ています。紙があるだけでは、発表の内容が正しく見えるかはまだ分かりません。

この作業では、本物の管理画面を開き、棒グラフが出ている状態と、データがない状態の画像を撮ります。そのあと、小さな仮画像を本物の画像に差し替えます。撮影のために一時的に画面へ決まった数字を入れることはありますが、撮り終わったら必ず元に戻します。

| 用語 | 日常語での言い換え |
| --- | --- |
| runtime screenshot | 動いている画面を撮った写真 |
| dummy PNG | あとで差し替えるための仮画像 |
| admin dashboard | 管理する人だけが見る画面 |
| fixture | 撮影のために一時的に入れる見本データ |
| revert | 作業前の状態へ戻すこと |

## Part 2: 技術者向け手順

### State Contract

```ts
type TaskType = "implementation";
type VisualEvidence = "VISUAL_ON_EXECUTION";
type WorkflowState = "spec_created" | "runtime_pending" | "completed";
```

### Runtime Evidence Paths

| Artifact | Canonical path |
| --- | --- |
| placeholder screenshot | `outputs/phase-11/screenshots/admin-dashboard-placeholder.png` |
| populated chart screenshot | `outputs/phase-11/screenshots/admin-dashboard-chart.png` |
| parent placeholder mirror | `completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-placeholder.png` |
| parent chart mirror | `completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-chart.png` |

### API / UI Contract

- API surface: existing `GET /admin/dashboard` only.
- UI receiver: `StatusDistribution` consumes optional `byStatus` slices.
- Temporary fixture injection belongs at the caller boundary, not inside `StatusDistribution.tsx`.
- Error handling: if authenticated admin runtime is unavailable, keep Phase 11 as `runtime_pending` and do not mark parent evidence as `runtime_completed`.

### Verification Commands

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/features/admin/components/_dashboard/StatusDistribution.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web build
grep -nE 'fill="#|bg-\[#|text-\[#' apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx
git status apps/web/app/ apps/web/src/features/admin/ apps/web/src/lib/admin/ apps/api/src/routes/admin/
```

## Part 3: 2026-05-20 実行ログ

### 3.1 仕様書からの逸脱と判断根拠

Phase 5 §5.3-§5.6 は「caller (`apps/web/app/(admin)/admin/page.tsx`) を一時編集 →
Chrome DevTools "Capture node screenshot" → caller revert」を規定していたが、本実行は
これを **Playwright + mock-api seed 経路** に置き換えた。理由:

- Claude Code 単独で完遂可能な経路に揃える (Magic Link / Google OAuth UI 操作は CLI 自動化不能)
- 既存の Playwright 認証 bypass (signed JWT cookie via `apps/web/playwright/fixtures/auth.ts`)
  と in-process mock API がそのまま使えるため
- caller への temp edit を**そもそも発生させない**ことで AC-4 (working tree clean) の
  リスクをゼロにできるため

`StatusDistribution.tsx` 本体は 1 行も変更していない (不変条件 #5 維持)。

### 3.2 変更ファイル

| パス | 種別 | 用途 |
|---|---|---|
| `apps/web/playwright/fixtures/auth.ts` | edit | `MockApi.setAdminDashboardByStatus` seeder + state + `/__test__/admin-dashboard-by-status` handler |
| `apps/web/playwright/tests/issue-819-status-distribution.spec.ts` | new | placeholder + populated の 2 PNG 取得 spec |
| `scripts/e2e-mock-api.mjs` | edit | standalone mock の `byStatus` parity (CI 互換) |
| `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-{placeholder,chart}.png` | replace | dummy 16×16/445B → 本物 PNG |
| 親 workflow `outputs/phase-11/main.md` / `outputs/phase-12/main.md` / `outputs/phase-12/unassigned-task-detection.md` | edit | `runtime_completed` 化 + consumed followup 表追加 |
| `docs/30-workflows/unassigned-task/step-05-followup-001-...-capture.md` | edit | ステータス → `consumed (by issue-819 on 2026-05-20)` |
| `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/` | new | 6 log + 2 PNG (本タスク root 側) |

### 3.3 evidence 取得コマンド

```bash
pkill -f scripts/e2e-mock-api.mjs || true   # 8787 を空ける
cd apps/web
mise exec -- ../../node_modules/.bin/playwright test \
  playwright/tests/issue-819-status-distribution.spec.ts \
  --project=desktop-chromium
```

結果: 1 passed (33.3s) on Playwright v1.59.1 / chromium 1217.

### 3.4 取得 PNG

| file | dimensions | size |
|---|---|---|
| `admin-dashboard-placeholder.png` | 920×135 | 7,137 B |
| `admin-dashboard-chart.png` | 920×352 | 11,680 B |

両 PNG とも 200×100 以上 / 500KB 以下を満たす。chart は SVG bar 3 本 (public=12,
member_only=7, hidden=3) + 凡例 chip 3 個、placeholder は section heading +
"分布データは現在集計対象外です" メッセージを含む。

### 3.5 検証 log (全て exit 0)

| log | path |
|---|---|
| typecheck | `outputs/phase-11/typecheck.log` |
| lint | `outputs/phase-11/lint.log` |
| focused vitest | `outputs/phase-11/test.log` |
| `next build --webpack` | `outputs/phase-11/build.log` (要 env: ENVIRONMENT / AUTH_SECRET / NEXT_PUBLIC_API_BASE_URL / PUBLIC_API_BASE_URL / INTERNAL_API_BASE_URL) |
| grep-gate | `outputs/phase-11/grep-gate.log` (0 hit) |
| git status | `outputs/phase-11/git-status.log` |

### 3.6 user-gated boundary

commit / push / PR は user 明示承認後のみ実行する。本実行は evidence capture と
documentation 更新までを完了させ、`workflow_state` は `runtime_completed` (commit/push/PR
pending) として記録する。
