# Phase 1: 要件定義（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 起票日 | 2026-05-09 |
| 担当 | solo (daishiman) |
| 対象 PR base | `dev` |
| feature branch（想定） | `feat/e2e-coverage-gate` |
| tier | standard（lines >= 80%） |
| coverage_threshold_source | `.claude/skills/task-specification-creator/references/quality-gates.md` §7.5 |

---

## 1. 背景と目的

`apps/web` の Playwright e2e は Stage 2 で「coverage 80% 達成」「`@critical-route` tag 付与」「deterministic green」まで到達した。しかし `.github/workflows/e2e-tests.yml` は **`workflow_dispatch` 単独**で PR 上で自動起動しないため、品質回帰を機械的に防げない。3b では本 workflow を **PR ブロッキング可能な hard CI gate** に昇格させる。

成果として以下を得る:
- PR to `dev` / `main` で `e2e-tests-coverage-gate` job が自動起動する
- line coverage < 80% で job fail
- `@critical-route` smoke が 1 件でも fail で job fail（fail-fast）
- coverage / 失敗時 HTML report の artifact 取得可

---

## 2. P50 pre-check（事前確認サマリ）

| 確認項目 | 結果 | 根拠 |
|---------|------|------|
| `apps/web/playwright.config.ts` reporter 現状 | `['html','json','list']` のみ。`monocart-reporter` 未導入 | `apps/web/playwright.config.ts:15-19` |
| `apps/web/package.json` 内 `monocart-reporter` / `c8` | いずれも **未導入** | `grep -E "(monocart-reporter|\"c8\")" apps/web/package.json` 該当なし |
| `.github/workflows/e2e-tests.yml` 現状 | `workflow_dispatch` のみ。PR トリガなし | `.github/workflows/e2e-tests.yml:1-10` |
| Stage 2 の coverage 80% 到達 | 達成済 | `docs/30-workflows/e2e-quality-uplift-stage-2/outputs/phase-7/coverage-summary.json` |
| `@critical-route` tag | 付与済 | `grep -r '@critical-route' apps/web/playwright/tests/critical/` |
| `dev` 現契約 contexts | `["ci","Validate Build","coverage-gate"]`（3c で `e2e-tests-coverage-gate` を追加予定） | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` 2026-05-08 取得 |

---

## 3. scope

| in scope | out of scope |
|----------|-------------|
| `.github/workflows/e2e-tests.yml` を PR トリガ + coverage gate に書き換え | Stage 2 の coverage 計測実装本体（前提） |
| `apps/web/playwright.config.ts` reporter 配列末尾に `monocart-reporter` 追加 | reporter `html` / `json` / `list` の削除・順序変更 |
| `c8` 経由の line coverage 集計 + 80% gate script | branch / function / statement coverage gate（standard tier は line のみ） |
| `scripts/coverage-gate-e2e.sh` 新規作成 | `wrangler` deploy preview 連携 |
| 失敗時の HTML report artifact upload | trace viewer ホスティング |
| critical-route fail-fast 先行 step | `@critical-route` tag 付与（Stage 2 で完了済前提） |

---

## 4. pre-conditions

- Stage 2 で `pnpm e2e` が deterministic に green。
- `@critical-route` tag が `apps/web/playwright/tests/critical/**` に付与済。
- `apps/web` が `c8` で instrument 可能な構成（`monocart-reporter` の v8 coverage hook を経由）。
- `mise install` 済（Node 24.15.0 / pnpm 10.33.2）。

---

## 5. acceptance criteria

| # | 内容 |
|---|------|
| AC-3b-1 | PR to `dev` / `main` で `e2e-tests-coverage-gate` job が起動 |
| AC-3b-2 | `pnpm e2e` の line coverage < 80% で job が fail |
| AC-3b-3 | `@critical-route` を持つ test が 1 件でも fail で job が fail（fail-fast 先行 step） |
| AC-3b-4 | `e2e-coverage-${{ github.sha }}` artifact が retention 14 日でアップロード |
| AC-3b-5 | failure 時のみ `e2e-html-report-${{ github.sha }}` artifact が retention 7 日でアップロード |
| AC-3b-6 | reporter list に `monocart-reporter` が含まれ、既存 `html`/`json`/`list` も維持される |

> 親 index.md AC-02 / AC-03 / AC-04 への trace は `artifacts.json#acceptance_criteria_trace` 参照。

---

## 6. inventory（変更対象）

| path | 種別 | 主要変更点 |
|------|------|-----------|
| `.github/workflows/e2e-tests.yml` | edit | major rewrite — `workflow_dispatch` から PR トリガへ。`jobs.e2e.name = e2e-tests-coverage-gate` |
| `apps/web/playwright.config.ts` | edit | reporter 配列に `monocart-reporter` を **末尾追加**（行 15-19） |
| `apps/web/package.json` | edit | devDependencies に `monocart-reporter@^2.9.0` / `c8@^10.1.0` 追加 |
| `scripts/coverage-gate-e2e.sh`（新規） | new | `set -euo pipefail` / c8 report / jq / awk 閾値判定 / `::error::` / `::notice::` |
| `pnpm-lock.yaml` | regenerate | `pnpm install` で更新 |

---

## 7. naming conventions

- workflow `name:` = `e2e-tests`
- job id = `e2e`
- job `name:` / branch protection context = `e2e-tests-coverage-gate`（**完全一致必須**）
- coverage artifact = `e2e-coverage-${{ github.sha }}`
- monocart artifact = `e2e-monocart-${{ github.sha }}`
- HTML report artifact = `e2e-html-report-${{ github.sha }}`
- concurrency.group = `e2e-${{ github.ref }}`

---

## 8. coverage 閾値の正本参照

`.claude/skills/task-specification-creator/references/quality-gates.md` §7.5（standard tier = line >= 80%）を正本とする。3b 内で独自しきい値を持たない。`scripts/coverage-gate-e2e.sh` 内で 80 をハードコードする際は、必ず以下のコメントを付与する:

```bash
# coverage threshold = 80%
# source: .claude/skills/task-specification-creator/references/quality-gates.md §7.5
# tier: standard / metric: lines
THRESHOLD=80
```

---

## 9. open questions（3b 関連のみ）

| # | 質問 | 暫定方針 |
|---|------|----------|
| Q-3b-01 | `monocart-reporter` の `entryFilter` で集計対象を `_next/static` に限定すべきか | 採用（phase-2 §2.1）。flaky 削減のため。 |
| Q-3b-02 | c8 単独運用 vs. monocart の v8 coverage hook 経由 | monocart 経由に統一（二重計測回避） |
| Q-3b-03 | failure 時のみ HTML report を upload するか常時 upload するか | failure 時のみ（CI artifact 容量節約・解析必要時に絞る） |

---

## 10. implementation_mode

`new`（既存ファイルだが内容を全面書き換えるため新規扱い）

---

## 11. exit criteria

| # | 条件 |
|---|------|
| EX-01 | inventory 5 件が確定し、各 path の責務が明示されている |
| EX-02 | AC-3b-1..AC-3b-6 が機械検証可能な形式で列挙されている |
| EX-03 | coverage threshold = 80 の正本 path が明示されている |
| EX-04 | naming conventions の context 名が `e2e-tests-coverage-gate` で固定されている |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 1
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented-local

## 目的

Stage 3 のサブタスク 3b（`e2e-tests.yml` hard gate 化）を独立した実装仕様書として確立し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 親 `e2e-quality-uplift-stage-3/phase-1.md` §3 から 3b 関連箇所を抽出。
- inventory / AC / pre-condition / threshold 正本 path を明示。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-1.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / scripts / .github 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=80%。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
