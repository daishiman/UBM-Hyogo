# 2026-05-10 e2e-quality-uplift Stage 3b implementation-local sync

- 親 spec: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/`
- 起案ブランチ: `feat/e2e-coverage-gate`
- 状態遷移: `spec_created / runtime_pending` → `implemented-local / IMPLEMENTED_LOCAL_RUNTIME_PENDING`
- 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,skill-feedback-report,phase12-task-spec-compliance-check,unassigned-task-detection,documentation-changelog,main}.md`

## 反映済み実コード変更

- `.github/workflows/e2e-tests.yml` を `e2e-tests-coverage-gate` job として major rewrite（`on: pull_request: branches: [dev, main]` / deterministic mock API 起動 / smoke fail-fast → full e2e → coverage gate / 3 種 artifact upload）。
- `apps/web/playwright.config.ts` の reporter 配列末尾に `monocart-reporter` を追加（既存 `html`/`json`/`list` を維持）。
- `apps/web/src/lib/fetch/public.ts`: `PUBLIC_API_BASE_URL` 明示時は service binding より HTTP fallback を優先し、CI / local E2E の mock API 差し替えを成立させる。
- `apps/web/package.json`: devDeps に `monocart-reporter@^2.9.0` / `c8@^10.1.0` 追加。`e2e` script を `playwright test` のエイリアスとして追加（workflow `pnpm --filter @ubm-hyogo/web e2e` 整合用）。
- `scripts/coverage-gate-e2e.sh`（新規）: line coverage 80% gate / `THRESHOLD_FIXTURE` override / `set -euo pipefail` / `quality-gates.md` 根拠 path コメント。
- `scripts/e2e-mock-api.mjs`（新規）: deterministic mock API。Server Component `fetch()` 経路を `INTERNAL_API_BASE_URL=http://127.0.0.1:8787` で受ける。
- `scripts/__tests__/coverage-gate-e2e.fixture/{pass,fail-79,missing}/`（新規）: T-3b-5..7 fixture（85.0% pass / 79.99% fail / 不在）。

## ローカル検証結果

| ID | コマンド | 結果 |
|----|----------|------|
| T-3b-5 | `THRESHOLD_FIXTURE=…/pass bash scripts/coverage-gate-e2e.sh` | exit 0 / `::notice::line coverage 85.0 >= 80` |
| T-3b-6 | `THRESHOLD_FIXTURE=…/fail-79 bash scripts/coverage-gate-e2e.sh` | exit 1 / `::error::line coverage 79.99 < 80` |
| T-3b-7 | `THRESHOLD_FIXTURE=…/missing bash scripts/coverage-gate-e2e.sh` | exit 1 / `::error::coverage-summary.json not found` |
| T-3b-3 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 |
| T-3b-17 | YAML 構文（`pnpm dlx @action-validator/cli`） | exit 0（actionlint バイナリ不在のため代替検証） |
| T-3b-18 | `shellcheck scripts/coverage-gate-e2e.sh` | violation 0 |

## 苦戦箇所（lessons 追記）

`lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md` に以下 3 件を追加:

- **L-E2EQU-013**: `PUBLIC_API_BASE_URL` を service binding より優先して CI mock を成立させる設計の必然性。
- **L-E2EQU-014**: Playwright reporter 配列追加は **末尾追加** で既存 `html` / `json` / `list` を維持する Phase 12 gate。
- **L-E2EQU-015**: `THRESHOLD_FIXTURE` override + 3 fixture（pass / fail-79 / missing）で coverage gate スクリプト自体を unit test 可能にする。actionlint 不在時は `@action-validator/cli` で代替検証する但し書きを Phase 12 DoD に残す規約。

## 同期対象（同一 wave）

- `references/task-workflow-active.md` L1084: 3b 行を `spec_created / runtime_pending` → `implemented-local / IMPLEMENTED_LOCAL_RUNTIME_PENDING` に書き換え、新規実装 path / fixture / 苦戦箇所 cross-ref を追記。
- `lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md` に L-E2EQU-013..015 追記。
- 本 changelog `20260510-e2e-stage3b-implementation-local.md` 新規作成。
- `SKILL-changelog.md` に v2026.05.10-e2e-stage3b-implementation-local 行を追加。
- `topic-map.md` / `keywords.json` は `pnpm indexes:rebuild` で再生成。

## Runtime / user-gated remainder

- 実 CI run（T-3b-8..16, AC-3b-1..6）と branch protection mutation（3c）は PR 作成後に観測する user-gated step。
- Phase 13 `outputs/phase-13/` は本 cycle では作成しない（PR 後に lessons 最終化と合わせて昇格）。
- 未配置 follow-up 候補（phase-12 hint 由来）は `unassigned-task-detection.md` 通り「No new unassigned task」だが、PR CI runtime 後に server fetch mock seed 検証 / monocart retry 整合 / phase-13 PR 化を必要に応じて起票する。
