# Phase 1: 要件定義（Stage 3）

| 項目 | 値 |
|------|----|
| 起票日 | 2026-05-08 |
| 担当 | solo (daishiman) |
| 対象 PR base | `dev` |
| tier | standard（lines >= 70%） |

---

## 1. P50 pre-check（事前確認サマリ）

| 確認項目 | 結果 | 根拠 |
|---------|------|------|
| `apps/web/playwright.config.ts` reporter 現状 | `['html','json','list']` のみ。`monocart-reporter` 未導入 | `apps/web/playwright.config.ts:15-19` |
| `apps/web/package.json` 内 monocart-reporter / c8 / @lhci/cli | いずれも **未導入** | `grep -E "(monocart|c8|@lhci)" apps/web/package.json` 該当なし |
| `.github/workflows/e2e-tests.yml` 現状 | `workflow_dispatch` のみ。PR トリガなし | `.github/workflows/e2e-tests.yml:1-10` |
| `dev` branch protection 現 contexts | `["ci","Validate Build","coverage-gate"]` | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` 2026-05-08 取得 |
| `dev` `required_pull_request_reviews` | `null`（solo policy 整合） | 同上 |
| `dev` `enforce_admins.enabled` | `false` | 同上（CLAUDE.md governance では `true` が期待値 — Stage 3c で drift 観測として記録、本 Stage では現状維持し別 workflow で扱う） |
| `dev` `lock_branch.enabled` | `false` | 同上 |
| Stage 2 完了状況 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` は artifacts と Phase 1-13 を保有 | `ls docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |

> **注**: `enforce_admins=false` は CLAUDE.md governance（`enforce_admins=true` 期待）と drift しているが、Stage 3 のスコープ外（既存状態）として扱い、`phase-3.md` GO/NO-GO で blocking 扱いしない。Stage 3c の payload は `enforce_admins` を変更せず、`required_status_checks.contexts` のみ更新する。

---

## 2. サブタスク 3a — Lighthouse CI 導入

### 2.1 scope

| in scope | out of scope |
|----------|-------------|
| `.github/workflows/lighthouse.yml` 新規作成 | `wrangler` deploy preview 連携 |
| `lighthouserc.json` プロジェクトルート新規作成 | mobile preset 個別調整 |
| `@lhci/cli` の devDependency 追加（`apps/web/package.json`） | カスタム plugin 開発 |
| 4 routes（`/`, `/(public)/members`, `/profile`, `/login`）への assertion | 管理画面群（認証フローが重く CI 不安定） |

### 2.2 pre-conditions

- Stage 2 完了（critical-route smoke が green）。
- `pnpm --filter @ubm-hyogo/web build` が CI で成功する（`pr-build-test.yml` 実績あり）。
- `/profile` / `/login` は未認証時もレンダリング可能（loading skeleton 含む）であること。

### 2.3 acceptance criteria

| # | 内容 |
|---|------|
| AC-3a-1 | PR to `dev` で `lighthouse-ci` job が起動する |
| AC-3a-2 | 4 routes 全てで perf>=80 / a11y>=90 / best-practices>=90 / seo>=80 を満たすときに pass |
| AC-3a-3 | いずれかが閾値割れすると job が `failure` になり、PR check が赤くなる |
| AC-3a-4 | `lhci-report` artifact が retention 7 日でアップロードされる |

### 2.4 inventory（変更対象）

| path | 種別 |
|------|------|
| `.github/workflows/lighthouse.yml` | new |
| `lighthouserc.json` | new |
| `apps/web/package.json` | edit（devDependencies に `@lhci/cli` 追加） |
| `pnpm-lock.yaml` | regenerate |

### 2.5 naming conventions

- workflow `name:` = `lighthouse-ci`（contexts と一致）
- job id = `lighthouse`
- artifact name = `lhci-report-${{ github.sha }}`

### 2.6 implementation_mode

`new`

---

## 3. サブタスク 3b — `e2e-tests.yml` hard gate 化

### 3.1 scope

| in scope | out of scope |
|----------|-------------|
| `.github/workflows/e2e-tests.yml` を PR トリガ + coverage gate に書き換え | Stage 2 の coverage 計測実装本体（前提） |
| `apps/web/playwright.config.ts` reporter に `monocart-reporter` 追加 | reporter `html` / `json` / `list` の削除 |
| `c8` 経由の line coverage 集計 + 70% gate script | branch / function / statement coverage gate（standard tier は line のみ） |
| 失敗時の HTML report artifact upload | trace viewer ホスティング |

### 3.2 pre-conditions

- Stage 2 で `pnpm e2e` が deterministic に green。
- critical-route smoke tag（`@critical-route` 等）が test 内に付与済み。
- `apps/web` が `c8` で instrument 可能な構成。

### 3.3 acceptance criteria

| # | 内容 |
|---|------|
| AC-3b-1 | PR to `dev` で `e2e-tests-coverage-gate` job が起動 |
| AC-3b-2 | `pnpm e2e` の line coverage < 70% で job が fail |
| AC-3b-3 | `@critical-route` を持つ test が 1 件でも fail で job が fail |
| AC-3b-4 | `coverage-summary.json` artifact が retention 14 日でアップロード |
| AC-3b-5 | failure 時のみ `playwright-html-report` artifact が retention 7 日でアップロード |
| AC-3b-6 | reporter list に `monocart-reporter` が含まれ、既存 `html`/`json`/`list` も維持される |

### 3.4 inventory

| path | 種別 |
|------|------|
| `.github/workflows/e2e-tests.yml` | edit（major rewrite — workflow_dispatch から PR トリガへ） |
| `apps/web/playwright.config.ts` | edit（reporter 配列に monocart 追加） |
| `apps/web/package.json` | edit（`monocart-reporter` / `c8` を devDependencies） |
| `scripts/coverage-gate-e2e.sh`（新規） | new（line coverage 70% 判定スクリプト） |
| `pnpm-lock.yaml` | regenerate |

### 3.5 naming conventions

- workflow `name:` = `e2e-tests`
- job id / context = `e2e-tests-coverage-gate`
- coverage artifact = `e2e-coverage-${{ github.sha }}`
- HTML report artifact = `e2e-html-report-${{ github.sha }}`

### 3.6 targeted test file list（Stage 2 引き継ぎ前提）

| 区分 | path glob | 備考 |
|------|-----------|------|
| critical-route smoke | `apps/web/playwright/tests/critical/**/*.spec.ts` | Stage 2 で `@critical-route` tag 付与 |
| coverage 対象 | `apps/web/src/**/*.{ts,tsx}` | `apps/web/src/lib/env.ts` 等含む |
| 除外 | `apps/web/src/**/*.test.{ts,tsx}` / `apps/web/src/styles/**` | c8 `--exclude` に列挙 |

### 3.7 implementation_mode

`new`（既存ファイルだが内容を全面書き換えるため新規扱い）

---

## 4. サブタスク 3c — Branch protection contexts 更新

### 4.1 scope

| in scope | out of scope |
|----------|-------------|
| `dev` / `main` の `required_status_checks.contexts` に `lighthouse-ci` / `e2e-tests-coverage-gate` を追加 | `enforce_admins` / `lock_branch` / `required_pull_request_reviews` の変更 |
| `gh api` PUT コマンドの spec 化 | Terraform / OpenTofu IaC への移行 |
| 適用後の検証コマンドの spec 化 | branch protection の rollback 自動化 |

### 4.2 pre-conditions

- 3a / 3b が `dev` にマージ済みで、少なくとも 1 度 green run が観測されている（context 名が GitHub に登録済み）。
- 操作者が repo admin 権限を持つ（solo dev: daishiman）。

### 4.3 acceptance criteria

| # | 内容 |
|---|------|
| AC-3c-1 | `dev` の contexts が `["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]` を含む |
| AC-3c-2 | `main` の contexts も同等に更新される |
| AC-3c-3 | `required_pull_request_reviews=null` が drift していない |
| AC-3c-4 | `lock_branch=false` が drift していない |
| AC-3c-5 | 既存 contexts（`ci` / `Validate Build` / `coverage-gate`）が削除されない |

### 4.4 inventory

| path | 種別 |
|------|------|
| （ファイル成果物なし） | `gh api` コマンドの実行ログのみ |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/branch-protection-evidence.md`（後続 Phase 11 で作成） | evidence |

### 4.5 implementation_mode

`verify_existing`（API call のみ、リポジトリ内ファイル変更なし）

---

## 5. open questions

| # | 質問 | 暫定方針 |
|---|------|----------|
| Q-01 | `enforce_admins=false` 現状の drift を Stage 3 で是正すべきか | 別 workflow（governance drift 是正）で扱う。Stage 3 はスコープ外 |
| Q-02 | Lighthouse の baseURL は `localhost` build か preview deployment か | `pnpm --filter @ubm-hyogo/web build && pnpm --filter @ubm-hyogo/web start` で localhost を使用（CI 安定優先） |
| Q-03 | `/profile` 未認証時の挙動が a11y >=90 を満たすか | Phase 2 で実測 + 必要なら除外 route に降格 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 1
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 3 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

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
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
