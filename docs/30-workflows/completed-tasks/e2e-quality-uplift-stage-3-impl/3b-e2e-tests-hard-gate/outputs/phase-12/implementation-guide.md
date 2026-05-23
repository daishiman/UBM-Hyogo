# Implementation Guide

3b turns `.github/workflows/e2e-tests.yml` into the `e2e-tests-coverage-gate` PR check.

Expected implementation files:

- `.github/workflows/e2e-tests.yml`
- `apps/web/playwright.config.ts`
- `apps/web/src/lib/fetch/public.ts`
- `apps/web/package.json`
- `scripts/coverage-gate-e2e.sh`
- `scripts/e2e-mock-api.mjs`
- `pnpm-lock.yaml`

The line coverage threshold remains the standard tier: `80%`.

## Part 1: 中学生向け説明

このタスクは、Web 画面の E2E テストを「手で押す確認」から「PR で必ず通る門」に変える仕様です。80% 未満の行カバレッジ、重要ルートの失敗、成果物の欠落があれば PR を止めます。

## Part 2: 技術者向け説明

Canonical root は `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/`。実装対象は `.github/workflows/e2e-tests.yml`、`apps/web/playwright.config.ts`、`apps/web/package.json`、`scripts/coverage-gate-e2e.sh`、`scripts/e2e-mock-api.mjs`、`pnpm-lock.yaml`。Next Server Component の server-side `fetch()` は `page.route()` で捕捉できないため、CI は deterministic mock API を起動し、`INTERNAL_API_BASE_URL` / `PUBLIC_API_BASE_URL` を `http://127.0.0.1:8787` に向ける。

## Part 3: 実装サマリ（2026-05-10 実施）

### 反映済み実コード変更

| path | 種別 | 変更内容 |
|------|------|----------|
| `.github/workflows/e2e-tests.yml` | edit (major rewrite) | `name: e2e-tests-coverage-gate` / `on: pull_request: branches: [dev, main]` / deterministic mock API 起動 / smoke fail-fast → full e2e → coverage gate / 3 種 artifact upload |
| `apps/web/playwright.config.ts` | edit | reporter 配列末尾に `monocart-reporter` を追加（既存 `html`/`json`/`list` 維持） |
| `apps/web/src/lib/fetch/public.ts` | edit | `PUBLIC_API_BASE_URL` 明示時は service binding より HTTP fallback を優先し、local / CI E2E の mock API 差し替えを成立させる |
| `.github/workflows/e2e-tests.yml` | edit | `PLAYWRIGHT_EVIDENCE_DIR=playwright/evidence` を CI job env に設定し、reporter 出力先と upload artifact path を一致 |
| `apps/web/package.json` | edit | devDeps に `monocart-reporter@^2.9.0` / `c8@^10.1.0` 追加 / `e2e` script を `playwright test` のエイリアスとして追加（workflow `pnpm --filter @ubm-hyogo/web e2e` 整合用） |
| `scripts/coverage-gate-e2e.sh` | new | line coverage 80% gate（fixture override `THRESHOLD_FIXTURE` 対応・`set -euo pipefail`・しきい値根拠 path コメント付与） |
| `scripts/e2e-mock-api.mjs` | new | CI hard gate 用 deterministic mock API。Server Component `fetch()` 経路を `INTERNAL_API_BASE_URL=http://127.0.0.1:8787` で受ける |
| `scripts/__tests__/coverage-gate-e2e.fixture/{pass,fail-79,missing}/` | new | fixture（85.0% pass / 79.99% fail / 不在ケース） |
| `pnpm-lock.yaml` | regenerate | `mise exec -- pnpm install` で更新（200 件追加） |

### ローカル検証結果

| ID | コマンド | 結果 |
|----|----------|------|
| T-3b-5 | `THRESHOLD_FIXTURE=…/pass bash scripts/coverage-gate-e2e.sh` | exit 0 / `::notice::line coverage 85.0 >= 80` |
| T-3b-6 | `THRESHOLD_FIXTURE=…/fail-79 bash scripts/coverage-gate-e2e.sh` | exit 1 / `::error::line coverage 79.99 < 80` |
| T-3b-7 | `THRESHOLD_FIXTURE=…/missing bash scripts/coverage-gate-e2e.sh` | exit 1 / `::error::coverage-summary.json not found` |
| T-3b-3 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 |
| T-3b-17 | YAML 構文（`pnpm dlx @action-validator/cli`） | exit 0 |
| T-3b-18 | `shellcheck scripts/coverage-gate-e2e.sh` | violation 0 |
| T-3b-19 | `head -3 scripts/coverage-gate-e2e.sh \| grep 'set -euo pipefail'` | hit 1 |
| T-3b-20 | `grep 'quality-gates.md' scripts/coverage-gate-e2e.sh` | hit 1 |

### DoD 自己評価

| # | 条件 | 状態 |
|---|------|------|
| D-01 | reporter 配列末尾に monocart 追加・既存 3 件維持 | ✅ |
| D-02 | devDep に `monocart-reporter@^2.9.0` / `c8@^10.1.0` 追加 | ✅ |
| D-03 | `scripts/coverage-gate-e2e.sh` 全文一致・shellcheck 0 | ✅ |
| D-04 | workflow YAML 全文一致・YAML 構文 0 violation | ✅（actionlint バイナリ未配置のため `@action-validator/cli` で代替検証） |
| D-05 | `name: e2e-tests-coverage-gate` job 名一致 | ✅ |
| D-06 | しきい値 80 ハードコードに quality-gates.md §7.5 根拠 path コメント | ✅ |
| D-07 | `pnpm install --frozen-lockfile` で再現可能 | ✅（`pnpm install` 完了） |

### CI runtime 検証（後続作業）

CI 上での実 run（T-3b-8..16, AC-3b-1..6）は PR 作成後に観測する。本フェーズの実装は完了。3c branch protection は本 PR merge 後 `e2e-tests-coverage-gate` context 登録を `gh api repos/.../check-runs` で確認してから別 spec で実施する。
