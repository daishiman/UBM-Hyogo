---
phase: 3
title: タスク分解 — 4 spec / baseline / CI 確認 / evidence 収集
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
---

# Phase 3 — タスク分解

[実装区分: 実装仕様書]

## 1. タスク一覧（SRP 単位）

| ID | タスク | 主変更ファイル | 完了基準 |
|----|------|---------------|---------|
| T-01 | Playwright config の `/visual/` 経路再確認 | （read-only） `apps/web/playwright.config.ts` | argv 内 `/visual/` で `isTask18RegressionGate=true` 経由 EVIDENCE_DIR が解決することを確認、変更不要 |
| T-02 | top spec 実装 | `apps/web/playwright/tests/visual/top.spec.ts`（既存 `public-top.spec.ts` を基準に新規） | `/` で h1 visible → snapshot |
| T-03 | members-list spec 実装 | `apps/web/playwright/tests/visual/members-list.spec.ts` | `/members` で list grid visible → snapshot |
| T-04 | member-detail spec 実装 | `apps/web/playwright/tests/visual/member-detail.spec.ts` | `/members/[id]` で MemberDetail visible → snapshot |
| T-05 | admin-dashboard spec 実装 | `apps/web/playwright/tests/visual/admin-dashboard.spec.ts`（既存活用） | admin login + `/admin` で dashboard visible → snapshot |
| T-06 | baseline snapshot 4 枚生成・コミット | `apps/web/playwright/tests/visual/<name>.spec.ts-snapshots/*.png` | git に PNG コミット済 |
| T-07 | CI workflow path 確認 | `.github/workflows/playwright-smoke.yml` / `verify-design-tokens.yml` | trigger path が新規 spec をカバー、不足時は path 追加のみ |
| T-08 | evidence 収集 | `outputs/phase-11/{typecheck.log,lint.log,build.log,playwright-visual.log,verify-design-tokens.log,verify-pr-ready.log,screenshots/*.png}` | Phase 11 inventory 表と整合 |
| T-09 | required status check 候補リスト確定 | Phase 13 PR body | 6 context 名を PR body に明記 |
| T-10 | Phase 12 compliance gate 確認 | `outputs/phase-11/` 全 evidence | `pnpm verify:phase12-compliance` exit 0 |

依存関係:

```
T-01 → T-02..T-05（並列可） → T-06 → T-07 → T-08 → T-09, T-10（並列可）
```

## 2. 変更ファイル俯瞰

### 2.1 新規 / 編集ファイル

| パス | 種別 | 行数想定 |
|------|------|---------|
| `apps/web/playwright/tests/visual/top.spec.ts` | 新規（既存 `public-top.spec.ts` 別名複製） | 10-15 行 |
| `apps/web/playwright/tests/visual/members-list.spec.ts` | 新規 | 15-20 行 |
| `apps/web/playwright/tests/visual/member-detail.spec.ts` | 新規 | 15-20 行 |
| `apps/web/playwright/tests/visual/admin-dashboard.spec.ts` | 既存利用 / 再確認 | 10-15 行 |
| `apps/web/playwright/tests/visual/*.spec.ts-snapshots/*.png` | 新規 baseline | binary |
| `.github/workflows/playwright-smoke.yml` | 既存（path 不足時のみ追加） | 差分 ≤ 5 行 |

### 2.2 変更しないファイル

- `apps/web/playwright.config.ts`（既存 `/visual/` 経路で吸収済）
- `apps/web/playwright/fixtures/auth.ts`（`mockApi` 再利用）
- `apps/web/src/**`（serial-00..06 で完成済前提）
- `apps/api/src/**`（API 変更禁止 / NFR-05）
- `scripts/verify-pr-ready.sh`（既存スクリプト再利用）

## 3. evidence 収集対象（Phase 11 と同期）

| evidence path | 取得コマンド |
|--------------|------------|
| `outputs/phase-11/typecheck.log` | `mise exec -- pnpm typecheck 2>&1 \| tee outputs/phase-11/typecheck.log` |
| `outputs/phase-11/lint.log` | `mise exec -- pnpm lint 2>&1 \| tee outputs/phase-11/lint.log` |
| `outputs/phase-11/build.log` | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee outputs/phase-11/build.log` |
| `outputs/phase-11/verify-design-tokens.log` | `mise exec -- pnpm verify:tokens 2>&1 \| tee outputs/phase-11/verify-design-tokens.log` |
| `outputs/phase-11/verify-pr-ready.log` | `bash scripts/verify-pr-ready.sh 2>&1 \| tee outputs/phase-11/verify-pr-ready.log` |
| `outputs/phase-11/playwright-visual.log` | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual 2>&1 \| tee outputs/phase-11/playwright-visual.log` |
| `outputs/phase-11/screenshots/{top,members-list,member-detail,admin-dashboard}.png` | snapshot を copy / 同期 |

## 4. 不変条件 → 実装規則

| 不変条件 | 実装規則 |
|---------|---------|
| 新規 API endpoint 禁止 | `apps/api/src/**` の diff 0 行 |
| OKLch トークン正本性 | spec で HEX を含めない / verify-tokens green |
| 新規 primitive 禁止 | `apps/web/src/components/ui/**` の diff 0 行 |
| test suffix | 新規 spec は `*.spec.ts` のみ |
| D1 直接アクセス禁止 | spec の page.goto 先で `apps/web` ランタイムが D1 を呼ばないこと（serial-00..06 で保証済） |

## 5. CONST_007 適合

本 SW のタスク T-01〜T-10 は単一 PR / 単一実装サイクルで完了する。serial-06 完了が前提のため、先送り・後続フェーズ送り・分離 PR 前提は発生しない。
