---
phase: 5
title: Implementation guide
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 5 — Implementation guide

[実装区分: 実装仕様書]

## 5.1 変更対象ファイル一覧

| 変更種別 | パス | 概要 |
|---------|------|------|
| **move** | `apps/web/app/profile/page.tsx` → `apps/web/app/(member)/profile/page.tsx` | route group 配下へ移設 |
| **move** | `apps/web/app/profile/error.tsx` → `apps/web/app/(member)/profile/error.tsx` | 同上 |
| **move** | `apps/web/app/profile/loading.tsx` → `apps/web/app/(member)/profile/loading.tsx` | 同上 |
| **move** | `apps/web/app/profile/loading.spec.tsx` → `apps/web/app/(member)/profile/loading.spec.tsx` | 同上 |
| **move** | `apps/web/app/profile/not-found.tsx` → `apps/web/app/(member)/profile/not-found.tsx` | 同上 |
| **move** | `apps/web/app/profile/_components/**` → `apps/web/app/(member)/profile/_components/**` | 同上 |
| **move** | `apps/web/app/profile/_lib/**` → `apps/web/app/(member)/profile/_lib/**` | 同上 |
| **move** | `apps/web/app/profile/__tests__/**` → `apps/web/app/(member)/profile/__tests__/**` | 同上 |
| **edit** | 移動先 `*.tsx` / `*.ts` の相対 import で `../../../src/` 等の深さに依存しているもの | `app/profile/` → `app/(member)/profile/` で 1 階層深くなるため `../` を 1 つ追加 |
| **edit** | `apps/web/src/__tests__/static-invariants.runtime.spec.ts` | `join(WEB_ROOT, "app/profile")` → `join(WEB_ROOT, "app/(member)/profile")`（S-01 / S-02 / S-04 / S-04b の 4 か所） |
| **new** | `apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts` | Phase 4 §4.2 シグネチャ |
| **new** | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-member.txt` | Playwright 実行で生成 |
| **new** | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/screenshots/member-shell.png` | Playwright 実行で生成 |
| **edit** | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md` | EV-13 / EV-16 を Phase 4 §4.4 の文言に更新 |

## 5.2 実装手順

### Step 1: profile route の移動

```bash
mkdir -p apps/web/app/\(member\)/profile
git mv apps/web/app/profile/page.tsx apps/web/app/\(member\)/profile/page.tsx
git mv apps/web/app/profile/error.tsx apps/web/app/\(member\)/profile/error.tsx
git mv apps/web/app/profile/loading.tsx apps/web/app/\(member\)/profile/loading.tsx
git mv apps/web/app/profile/loading.spec.tsx apps/web/app/\(member\)/profile/loading.spec.tsx
git mv apps/web/app/profile/not-found.tsx apps/web/app/\(member\)/profile/not-found.tsx
git mv apps/web/app/profile/_components apps/web/app/\(member\)/profile/_components
git mv apps/web/app/profile/_lib apps/web/app/\(member\)/profile/_lib
git mv apps/web/app/profile/__tests__ apps/web/app/\(member\)/profile/__tests__
rmdir apps/web/app/profile
```

### Step 2: 相対 import 修正

`grep -rn "from ['\"]\\.\\." apps/web/app/\(member\)/profile/` で `../` 起点の import を列挙し、`app/profile` 時点の深さ基準（src root から見て 2 階層）から `app/(member)/profile` 基準（3 階層）に修正。`@/` alias 利用箇所は変更不要。

### Step 3: static-invariants.runtime.spec.ts 修正

```ts
// before
await walk(join(WEB_ROOT, "app/profile"));
// after
await walk(join(WEB_ROOT, "app/(member)/profile"));
```

S-01 / S-02 / S-04 / S-04b の 4 か所をすべて更新。

### Step 4: Playwright spec 新規作成

Phase 4 §4.2 のコードをそのまま `apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts` に書き込む。member 認証 fixture が必要な場合は既存 `apps/web/playwright/fixtures/auth.ts` の admin パターンを member 用に拡張（既存 helper 流用）。

### Step 5: scrape + screenshot 実行

```bash
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11 \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/parallel-03-member-shell-scrape.spec.ts \
  --project=desktop-chromium --reporter=line
```

### Step 6: 親台帳更新

`phase-11-evidence-inventory.md` の EV-13 / EV-16 行を Phase 4 §4.4 の文言で置換。

### Step 7: gate 実行

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

## 5.3 status 語彙固定

親台帳の status は `present` / `pending` / `n/a` のみ。`captured` 等 invalid 語彙を **書かない**（followup-002 R-03 の教訓）。
