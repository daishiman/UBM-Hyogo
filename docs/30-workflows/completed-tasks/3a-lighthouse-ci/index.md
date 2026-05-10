# 3a — Lighthouse CI 導入

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| workflow id | `e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci` |
| 親 workflow | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/` |
| base branch | `dev` |
| feature branch | `feat/lighthouse-ci`（PR-A） |
| 起票日 | 2026-05-09 |
| CONST_007 | single cycle |
| coverageTier | standard（lines >= 70%） |
| visualEvidence | NON_VISUAL |
| implementation_mode | `new` |
| solo policy | `required_pull_request_reviews=null` 維持 |

## 機械検証メタ情報

| key | value |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| coverageTier | standard |
| workflow_state | spec_created |
| evidence_state | runtime_pending |

---

## 目的

Stage 3 の hard CI gate 群のうち、サブタスク 3a「Lighthouse CI 導入」だけを単一実装サイクルで完遂するための Phase 1-13 仕様書。`/`, `/(public)/members`, `/profile`, `/login` の 4 routes に対し perf>=80 / a11y>=90 / best-practices>=90 / seo>=80 を assertion し、PR ブロック可能な hard gate として機能させる。

> 親ワークフロー `e2e-quality-uplift-stage-3` の責務（3a / 3b / 3c）から **3a 関連部分のみ抽出**し、独立した実装サイクルとして再構成している。3b（e2e hard gate）/ 3c（branch protection contexts 更新）は本サブタスクの責務範囲外（依存関係としてのみ言及）。

---

## サブタスク概要

| 項目 | 値 |
|------|----|
| 主成果物 | `.github/workflows/lighthouse.yml`（新規） / `lighthouserc.json`（新規） |
| 編集対象 | `apps/web/package.json`（devDependencies に `@lhci/cli` 追加） / `pnpm-lock.yaml`（regenerate） |
| 対象 routes | `/`, `/(public)/members`（=`/members`）, `/profile`, `/login` |
| assertion 値 | perf>=0.80 / a11y>=0.90 / best-practices>=0.90 / seo>=0.80 |
| token 要件 | なし（filesystem upload のみ・`LHCI_GITHUB_APP_TOKEN` 不採用） |
| context name | `lighthouse-ci`（branch protection と完全一致） |

---

## 依存関係

| 種別 | 内容 | 状態 |
|------|------|------|
| depends-on | Stage 2 完了（critical-route smoke + coverage 70%） | 完了想定（親 stage-3 phase-3 の CONDITIONAL GO 解消条件） |
| depends-on | `pnpm --filter @ubm-hyogo/web build` が CI で成功する（`pr-build-test.yml` 実績あり） | 確認済み |
| depends-on | `/profile` / `/login` が未認証時もレンダリング可能（Q-02 縮退判定の前提） | Phase 7 で実測判定 |
| relates-to（外部） | 3b `e2e-tests-coverage-gate` context 化 | 別 PR（PR-B）。本タスクは独立 |
| relates-to（外部） | 3c branch protection contexts 5 件揃え | 3a / 3b 両方 merge 後に手動 `gh api` 実行（本タスク責務外） |
| blocks（外部） | 3c | 本サブタスク merge 後に context 名 `lighthouse-ci` が GitHub に登録されないと 3c が永久 pending を引き起こす |

---

## 受入基準

| # | 受入基準 | 検証方法 |
|---|----------|----------|
| AC-3a-1 | PR to `dev` で `lighthouse-ci` job が起動する | `gh run list --workflow=lighthouse.yml --branch=<pr-branch>` |
| AC-3a-2 | 4 routes 全てで perf>=0.80 / a11y>=0.90 / best-practices>=0.90 / seo>=0.80 を満たすときに pass | lhci report 内 score を `outputs/phase-11/lhci-scores.json` で確認 |
| AC-3a-3 | いずれかの assertion 割れで job が `failure` になり、PR check が赤くなる | 故意閾値割れ再現 PR を作成し fail 観測 |
| AC-3a-4 | `lhci-report-${{ github.sha }}` artifact が retention 7 日でアップロードされる | `gh run download <run-id> --name lhci-report-<sha>` |
| AC-3a-5 | 親 index.md AC-05 の context 命名（`lighthouse-ci`）が workflow `name:` / `jobs.<id>.name:` と完全一致 | `grep -E '^name:' .github/workflows/lighthouse.yml` |

> 親 stage-3 index.md AC-05 の **branch protection 適用** 部分は 3c の責務。本タスクは context 名を確定し GitHub に登録される地点までを担う。

---

## 不変条件（本サブタスク固有）

1. solo dev policy: `required_pull_request_reviews=null` 維持。レビュアー必須化を導入しない。
2. Lighthouse CI は **PR to `dev`** のみで実行（`main` への PR は `dev` 経由で既に通過済みのため重複実行しない）。
3. Lighthouse `numberOfRuns: 1` を維持し、`preset: desktop` 固定で localhost build に対して計測する（CI 安定優先 / token 不要）。
4. `wrangler` 直叩きを CI 内で行わない（本タスクは CF API call なし）。
5. `process.env.*` を `apps/web/src` 配下から直接参照しない既存規約に違反しない（本タスクは workflow YAML / JSON 設定追加のみで `apps/web/src` のコード変更なし）。
6. CONST_007: 単一実装サイクルで完了。先送りや「将来 PR」を作らない。`/profile` Q-02 縮退判定も本サイクル内で確定する。

---

## Phase 1-13 状態表

| Phase | 名称 | 状態 | 出力 |
|-------|------|------|------|
| 1 | 要件定義 | spec_created | `phase-1.md` |
| 2 | 設計 | spec_created | `phase-2.md` |
| 3 | 設計レビュー | spec_created | `phase-3.md` |
| 4 | テスト作成 | spec_created | `phase-4.md` |
| 5 | 実装 | spec_created | `phase-5.md` |
| 6 | テスト拡充 | spec_created | `phase-6.md` |
| 7 | カバレッジ確認 | spec_created | `phase-7.md` |
| 8 | リファクタリング | spec_created | `phase-8.md` |
| 9 | 品質保証 | spec_created | `phase-9.md` |
| 10 | 最終レビュー | spec_created | `phase-10.md` |
| 11 | 手動テスト / Evidence | spec_created | `phase-11.md` |
| 12 | ドキュメント更新 | spec_created | `phase-12.md` |
| 13 | PR 作成 | spec_created | `phase-13.md` |

---

## 正本順位（衝突時の優先度）

1. 親 `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/index.md` の AC / 不変条件
2. 本 `index.md` の AC / 不変条件
3. 本 `phase-{1..13}.md` の Phase 内記述
4. `.claude/skills/task-specification-creator/references/quality-gates.md`（standard tier 70%）

---

## 参照ドキュメント

- 親 ワークフロー: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/`
- skill: `.claude/skills/task-specification-creator/references/phase-template-core.md`
- quality gates: `.claude/skills/task-specification-creator/references/quality-gates.md` §7.5
- CLAUDE.md: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/CLAUDE.md`「ブランチ戦略」「Governance / CODEOWNERS」
