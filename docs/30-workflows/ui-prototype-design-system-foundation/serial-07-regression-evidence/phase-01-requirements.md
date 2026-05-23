---
phase: 1
title: 要件定義 — regression evidence と CI gate green 確保
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 1 — 要件定義（serial-07-regression-evidence）

[実装区分: 実装仕様書]

> **前提**: 本サブワークフローは `serial-06-form-response-binding` の完了を**必須前提**とする。serial-00〜serial-06 までの実装（globals.css rhythm / prototype CSS rules / AppShell layouts / shared page chrome / 19 routes 全 page.tsx / Form response → MemberDetail 描画）が green build に到達してから着手する。serial-06 までに regression がある場合は本サブワークフローを着手せず、該当 SW を先に修復する（Phase 9 §3 fallback）。

## 1. 解決すべき要件

serial-00〜serial-06 で構築した「プロトタイプ正本反映の仕組み」が、後続 PR・後続 task で **regression を起こさないこと** を機械的に保証する。Playwright visual baseline 4 screens と verify-design-tokens / verify-pr-ready を最小 6 gate として固定し、PR push 時の required status check 候補に揃える。

### 1.1 機能要件

| ID | 要件 | 根拠 |
|----|------|------|
| FR-01 | Playwright visual snapshot を **最小 4 screens** で取得する（top / public members list / public member detail / admin dashboard） | SCOPE.md DoD #5 / CLAUDE.md `playwright-smoke / visual (chromium, 4 screens)` |
| FR-02 | `apps/web/playwright/tests/visual/` 配下に 4 spec を実装し、`apps/web/playwright.config.ts` の `/visual/` 経路で baseline 取得できる | apps/web/playwright.config.ts L31-L36 既存パターン |
| FR-03 | baseline snapshot（`*.spec.ts-snapshots/*.png`）を git にコミットし、CI 上で diff fail を gate にする | playwright-visual-full.yml L40-L48 既存パターン |
| FR-04 | `verify-design-tokens` CI gate（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0 件）が green | CLAUDE.md NFR / verify-design-tokens.yml |
| FR-05 | `pnpm typecheck` / `pnpm lint` / `pnpm build`（`next build --webpack`） が green | serial-00 Phase 1 NFR-05/06 |
| FR-06 | `bash scripts/verify-pr-ready.sh` が exit 0（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift なし） | CLAUDE.md PR pre-flight |
| FR-07 | evidence を本サブワークフローの `outputs/phase-11/` に物理配置し、inventory ledger（Phase 11 表）と整合 | phase-11-screenshot-guide / evidence existence validator |
| FR-08 | required status check 候補リストを Phase 13 PR draft に明記（`verify-design-tokens / verify-design-tokens`、`playwright-smoke / smoke (chromium)`、`playwright-smoke / visual (chromium, 4 screens)`、`verify-phase12-compliance`、`verify-gate-metadata`、`verify-indexes-up-to-date`） | CLAUDE.md branch protection note |

### 1.2 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | snapshot baseline は OS / browser font rendering 差異の影響を受ける。CI runner は `ubuntu-latest`（既存 playwright-visual-full.yml に合わせる）に固定する |
| NFR-02 | flake 防止: animation / transition / caret-color を spec 内で disable（既存 public-top.spec.ts L7 パターン踏襲） |
| NFR-03 | `maxDiffPixelRatio: 0.02` を既存 spec と揃える |
| NFR-04 | 新規 test ファイルは `*.spec.ts` のみ。`*.test.ts` 禁止（CLAUDE.md 不変条件 #8） |
| NFR-05 | 新規 API endpoint / D1 schema / Google Form 仕様変更 0 件（serial-00 NFR 継承） |
| NFR-06 | snapshot baseline は `apps/web/playwright/tests/visual/*.spec.ts-snapshots/` に物理コミット。`.gitignore` で除外しない |
| NFR-07 | mock API は既存 `apps/web/playwright/fixtures/auth.ts` の `mockApi` fixture を再利用。新規 mock server を立てない |

## 2. 最小 6 gate の固定

| # | Gate | local 実行コマンド | CI workflow |
|---|------|------------------|-------------|
| G1 | Playwright visual 4 screens | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual` | `playwright-visual-full.yml` / `playwright-smoke.yml` |
| G2 | verify-design-tokens | `mise exec -- pnpm verify:tokens` | `verify-design-tokens.yml` |
| G3 | typecheck | `mise exec -- pnpm typecheck` | 既存 build pipeline |
| G4 | lint | `mise exec -- pnpm lint` | 既存 build pipeline |
| G5 | build (`next build --webpack`) | `mise exec -- pnpm --filter @ubm-hyogo/web build` | 既存 build pipeline |
| G6 | verify-pr-ready | `bash scripts/verify-pr-ready.sh` | `verify-phase12-compliance.yml` / `verify-gate-metadata.yml` / `verify-indexes.yml` |

すべて exit 0 を DoD とする（Phase 8 で再掲）。

## 3. スコープ境界

### IN

- `apps/web/playwright/tests/visual/{top,members-list,member-detail,admin-dashboard}.spec.ts` 新規 / 既存編集
- 対応する `*.spec.ts-snapshots/*.png` baseline コミット
- `.github/workflows/` 既存 workflow の path 追加（必要時のみ）
- `outputs/phase-11/` 配下の evidence 物理配置
- Phase 13 PR body / required status check 候補リスト

### OUT

- serial-00〜serial-06 のコード再変更（regression 発見時は該当 SW にバックポート）
- 新規 CI workflow ファイル作成（既存 workflow の trigger / path 拡張のみ）
- E2E（非 visual）spec の追加
- A11y / Lighthouse 等の追加 gate

## 4. 受け入れ条件

`SCOPE.md` の DoD #5（4 snapshot 物理存在）/ DoD #6（verify-design-tokens green）/ DoD #7（verify-pr-ready exit 0）を満たす。Phase 8 で再掲。

## 5. 参照

- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-00-design/phase-01-requirements.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md`
- `apps/web/playwright.config.ts`
- `apps/web/playwright/tests/visual/public-top.spec.ts`
- `apps/web/playwright/tests/visual/admin-dashboard.spec.ts`
- `apps/web/playwright/fixtures/auth.ts`
- `.github/workflows/verify-design-tokens.yml`
- `.github/workflows/playwright-visual-full.yml`
- `.github/workflows/playwright-smoke.yml`
- `scripts/verify-pr-ready.sh`
- `.claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`
