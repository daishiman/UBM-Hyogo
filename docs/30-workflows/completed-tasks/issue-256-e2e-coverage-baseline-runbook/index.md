# Issue #256 E2E Coverage Baseline & Runbook - Workflow Index

`[実装区分: 実装仕様書]`

## メタ情報

```yaml
workflow_id: issue-256-e2e-coverage-baseline-runbook
title: apps/web E2E coverage の baseline 実測と runbook 化 (issue #256 残課題)
github_issue: 256
github_issue_state: closed
source_workflow: docs/30-workflows/completed-tasks/coverage-80-enforcement/
parent_task_spec: docs/30-workflows/unassigned-task/task-e2e-playwright-coverage-001.md
category: testing / observability
target_feature: vitest coverage exclude 比率の baseline 計測 / playwright smoke SLA 文書化
priority: 中
scale: 小規模
status: implemented_local_evidence_captured
workflow_state: implemented_local_evidence_captured
taskType: implementation
visualEvidence: NON_VISUAL
implementation_kind: 実装仕様書
implementation_kind_rationale: |
  Issue #256 の 4 AC のうち AC1 / AC4 は実装済 (full-smoke.spec.ts + staging-smoke + runtime-smoke-staging.yml)。
  残る AC2 (主要 route SLA 明文化) と AC3 (exclude 比率 baseline + 代替指標 runbook) は、
  以下の実コード変更を伴うため実装仕様書として扱う:
  (1) scripts/measure-coverage-exclude-ratio.ts 新規 — vitest.config.ts から exclude を解析し
      apps/web/app/**/*.{ts,tsx} に対する除外比率 (excluded_files / total_eligible_files) を JSON 出力
  (2) scripts/__tests__/measure-coverage-exclude-ratio.spec.ts 新規 — 比率計算 unit test
  (3) .github/workflows/verify-coverage-exclude-ratio.yml 新規 — 30% 超過時 PR コメント (soft warn)
  (4) docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md 新規 — 代替指標合意
  (5) docs/30-workflows/runbooks/playwright-smoke-19-route-sla.md 新規 — SLA 文書
  (6) vitest.config.ts の coverage include / exclude を現行 `apps/web/app` topology に同期し、
      loading.tsx / not-found.tsx は exclude しない
  (7) 既存 `apps/web/app/__tests__/error.component.spec.tsx` で loading / not-found の回帰を継続確認
created_date: 2026-05-18
dependencies:
  - coverage-80-enforcement (完了済)
  - task-18-w7-verify-tokens-and-playwright-smoke (smoke gate 設定済)
coverage_ac: 適用
coverage_ac_rationale: |
  (1)(2) で追加する measure-coverage-exclude-ratio は決定論的な集計関数のため unit test 100% を目標とする。
  (6)(7) で除外解除する component は line / branch とも 80% 以上を目標。
```

## 現状調査サマリ (2026-05-18)

| AC | 状態 | 根拠 |
|----|------|------|
| AC1: 主要 route smoke / a11y / server action E2E | ✅ 完了 | `apps/web/playwright/tests/full-smoke.spec.ts` が慣用名 "19-route smoke" / 実体 17 route entries (公開7+会員1+管理8+404 canary) を `@axe-core/playwright` 込みでカバー |
| AC2: E2E coverage 閾値 CI gate | △ 部分完了 | `playwright-smoke / smoke (chromium)` が required check (全 spec pass = 100%)。ただし "主要 route SLA" の明示文書 / 追加時の手順は未整備 |
| AC3: `coverage.exclude` 比率 30% 以下 or 代替指標 runbook | 実装済 / warn | `vitest.config.ts` を現行 `apps/web/app` topology に同期し、test spec を除いた production-like source baseline 比率 46.3% を `outputs/phase-7/coverage-exclude-ratio.*` に記録。超過時は fallback runbook を参照 |
| AC4: Cloudflare Workers staging で E2E 実行可能 | ✅ 完了 | `apps/web/tests/e2e/staging-smoke.spec.ts` + `.github/workflows/runtime-smoke-staging.yml` |

→ 本 workflow は **AC2 SLA 明文化** + **AC3 baseline 実測 + 代替指標 runbook** に加え、baseline が実測できるよう `vitest.config.ts` の現行 topology drift を同一 wave で補正する。

## Phase 構成

| Phase | ファイル | 概要 |
|------|---------|------|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義・AC・残課題確定・命名規則記録 |
| 2 | [phase-2-design.md](phase-2-design.md) | 計測ロジック / runbook 構造 / CI gate 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー・Phase 4 進行可否判定 |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | TDD RED / unit test 仕様 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | scripts / workflow / runbook / vitest exclude 実装 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | edge case / unit test 拡充 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | 新規スクリプト + 除外解除 component のカバレッジ確認 |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ・重複除去 |
| 9 | [phase-9-qa.md](phase-9-qa.md) | lint / typecheck / 既存テスト regression |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー / AC 達成判定 |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動 smoke (NON_VISUAL evidence) |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | implementation-guide / system-spec sync / changelog |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成 (ユーザー承認後) |

## 不変条件

1. issue は CLOSED のまま (リオープンしない)。本 workflow は close 後の根本対応として記録
2. AC1 / AC4 は完了済として再実装しない (regression 確認のみ)
3. `vitest.config.ts` の exclude 縮小は **unit test で取り戻し可能な component のみ** が対象。破綻する場合は scope out として理由明記
4. baseline 比率の閾値 30% は initial soft warn (block しない)、超過時は代替指標 runbook を参照
5. commit / push / PR はユーザー明示承認後にのみ実行
6. 既存 CI required check (`playwright-smoke / smoke (chromium)`) の semantics を変更しない
7. 新規 workflow `verify-coverage-exclude-ratio` は PR comment soft warn のみ (initial release では required check に登録しない)

## 関連参照

- 親仕様: `docs/30-workflows/unassigned-task/task-e2e-playwright-coverage-001.md`
- 上流: `docs/30-workflows/completed-tasks/coverage-80-enforcement/`
- baseline 計測テンプレ: `docs/30-workflows/completed-tasks/coverage-80-enforcement/outputs/phase-11/coverage-baseline-summary.md`
- 既存 SLA gate: `.github/workflows/playwright-smoke.yml`
- 正本 vitest 設定: `vitest.config.ts`
