# Phase 1 — 要件定義

`[実装区分: 実装仕様書]`

## 1. なぜ (Why)

Issue #256 の AC1 / AC4 は完了済だが、AC2 (主要 route SLA 明文化) と AC3 (`coverage.exclude` baseline + 代替指標 runbook) が **CLOSE 後も未着手** で残っている。`vitest.config.ts` の exclude が apps/web の主要 page / layout を黙って除外しているため、coverage 80% gate を通過しても実体カバレッジが薄いリスクが顕在化する。

## 2. 何を (What)

### 2.1 AC (今回スコープ)

| ID | 受入条件 | 検証手段 |
|----|---------|---------|
| AC-1 | `coverage.exclude` 比率 (現行 `apps/web/app` 配下 .ts/.tsx ファイルに対する除外 / 全 .ts/.tsx) を自動計測できる | `pnpm coverage:measure-exclude-ratio` が JSON / markdown を出力 |
| AC-2 | 30% 超過時に PR コメントで warn される (initial release は soft warn) | `.github/workflows/verify-coverage-exclude-ratio.yml` が pull_request で実行 |
| AC-3 | 30% 超過時の代替指標 (E2E route hit rate / a11y violations / smoke pass rate) が runbook に明文化される | `docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md` |
| AC-4 | 19-route smoke の SLA / 追加手順が runbook 化される | `docs/30-workflows/runbooks/playwright-smoke-19-route-sla.md` |
| AC-5 | 現行 topology drift を補正し、`loading.tsx` / `not-found.tsx` を coverage exclude に含めない。既存 component spec で回帰確認する | `vitest.config.ts` の `apps/web/app` include/exclude + `apps/web/app/__tests__/error.component.spec.tsx` |

### 2.2 スコープ外

- AC1 / AC4 の再実装 (regression 確認のみ)
- exclude 比率 gate を required check に登録すること (initial release は soft warn のみ)
- page.tsx / layout.tsx の unit test 化 (Edge runtime 依存のため exclude 継続を許容)

## 3. 現状 inventory

| 項目 | 現状 |
|------|------|
| `vitest.config.ts` exclude (旧 apps/web/app 系) | current topology では stale。`apps/web/app` に同期する必要あり |
| 19-route smoke | `apps/web/playwright/tests/full-smoke.spec.ts` (慣用名。実体は公開7 + 会員1 + 管理8 + 404 canary = 17 entries) |
| smoke 実行 job | `.github/workflows/playwright-smoke.yml` > `smoke (chromium)` (required check) |
| staging smoke | `apps/web/tests/e2e/staging-smoke.spec.ts` + `.github/workflows/runtime-smoke-staging.yml` |
| baseline 実測値 | `docs/30-workflows/completed-tasks/coverage-80-enforcement/outputs/phase-11/coverage-baseline-summary.md` で TBD のまま |

## 4. 命名規則 (既存コード分析結果)

| 種別 | 規則 | 既存例 |
|------|------|--------|
| scripts/ ファイル名 | kebab-case + `.ts` | `coverage-guard.sh`, `verify-design-tokens.ts` |
| spec ファイル名 | `*.spec.ts` (`*.test.ts` 禁止 / CLAUDE.md L75-76) | `coverage-guard.spec.ts` |
| docs/30-workflows/runbooks/ | kebab-case + `.md` | (新規ディレクトリ) |
| pnpm script | `coverage:` prefix or 単独 | `lint`, `typecheck`, `build` |

## 5. 出力

- [outputs/phase-1/inventory.md](outputs/phase-1/inventory.md) — exclude 一覧と route inventory の確定リスト

## 6. P50 チェック

| 確認項目 | 判定 |
|---------|------|
| 実装が current branch に存在 | No → 通常実装 |
| upstream にマージ済 | No |
| 依存タスク完了 | Yes (coverage-80-enforcement / task-18-w7) |

→ `implementation_mode: "new"`
