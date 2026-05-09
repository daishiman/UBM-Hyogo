# Phase 8: リファクタリング（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 入力 | `phase-7.md` |
| 出力 | shellscript 共通化判断 / 既存 `coverage-guard.sh` との重複解消方針 / 軽微整理 |

---

## 1. shellscript 共通化判断

### 1.1 候補 A: `scripts/coverage-gate-e2e.sh` と既存 `scripts/coverage-guard.sh` の統合

| 項目 | 値 |
|------|----|
| 既存 `scripts/coverage-guard.sh` の責務 | unit / workspace coverage を pre-push hook で守る（`lefthook.yml` 経由） |
| 新規 `scripts/coverage-gate-e2e.sh` の責務 | CI 内で E2E line coverage 70% を判定する |
| 入力 source | guard: workspace coverage（vitest 系） / gate-e2e: monocart-reporter v8 → c8 json-summary |
| しきい値の正本 | guard: 既存 ruleset（複数 metric） / gate-e2e: standard tier line=70 |
| 実行コンテキスト | guard: pre-push hook（local） / gate-e2e: GitHub Actions step |

### 1.2 判定

**統合しない**（責務分離維持）。理由:

| # | 理由 |
|---|------|
| R-01 | 入力 source が異なる（vitest workspace vs Playwright v8 hook）。共通化は内部分岐を増やすだけ |
| R-02 | しきい値のシンタックスが異なる（multi-metric vs line のみ） |
| R-03 | 実行コンテキストが異なる（pre-push hook の sync-merge skip ロジック vs CI 単純判定） |
| R-04 | sync-merge スキップ条件（CLAUDE.md「sync-merge 時の hook 挙動」）は guard 側でのみ必要。gate-e2e は CI のみで動くため不要 |
| R-05 | 統合により guard 側の sync-merge skip 経路に CI fail パスを巻き込むリスク |

### 1.3 共通化候補（軽量・採用可）

| ID | 内容 | 採否 |
|----|------|------|
| SH-01 | しきい値根拠 path のコメントテンプレート化 | **採用**（両 script に同一コメント定型を残す） |
| SH-02 | `awk "BEGIN { exit !($pct >= $T) }"` の共通 helper 関数化 | **不採用**（1 行ずつで意図が明確） |
| SH-03 | `coverage-summary.json` 読み取り helper の sourcing | **不採用**（path 規約が異なる） |

---

## 2. 既存 `coverage-guard.sh` との重複解消方針

| 観点 | gate-e2e (新規) | guard (既存) | 重複なし |
|------|----------------|--------------|---------|
| トリガ | CI (pull_request) | local pre-push hook | 異なる |
| 対象 metric | line のみ | multiple | 異なる |
| 対象 coverage 種別 | E2E (Playwright + monocart) | unit / workspace (vitest) | 異なる |
| しきい値 | 70（quality-gates §7.5 standard tier） | guard 既存 ruleset | 異なる |
| sync-merge skip | 不要（CI のみ） | 必要 | 責務外 |

> 結論: 重複なし。`scripts/coverage-gate-e2e.sh` と `scripts/coverage-guard.sh` は異なる責務として併存させる。

---

## 3. workflow YAML の軽微整理

| # | 対象 | 内容 |
|---|------|------|
| R-3b-01 | `.github/workflows/e2e-tests.yml` の `name:` / `jobs.e2e.name:` | branch protection context (`e2e-tests-coverage-gate`) と完全一致を再確認（タイポは BLK-3b-03 を発動） |
| R-3b-02 | `concurrency.group` の命名 | `e2e-${{ github.ref }}` で統一（親 phase-8 §4 R-02 と整合） |
| R-3b-03 | `timeout-minutes` 値 | `30`（CI minute budget §1.2 の試算根拠） |
| R-3b-04 | `actions/upload-artifact@v4` の `retention-days` | coverage=14 / monocart=7 / html=7 で統一（親 phase-8 §4 R-04 と整合） |
| R-3b-05 | `pnpm/action-setup@v4` の `version` 値 | `10.33.2`（CLAUDE.md / `.mise.toml` 正本） |
| R-3b-06 | `actions/setup-node@v4` の `node-version` 値 | `24.15.0`（同上） |

> R-3b-01〜R-3b-06 は phase-5 §4 で既に正しく書かれている前提。phase-8 で再点検し、別途 refactor commit は発生しない。

---

## 4. Stage 4 以降への refactor backlog（3b 寄与）

| ID | 内容 | 優先 |
|----|------|------|
| RB-3b-01 | composite action `setup-project`（pnpm + node + install を 1 step 化） | mid |
| RB-3b-02 | `lighthouse` / `e2e-tests` の build 共有（artifact 受け渡し） | low |
| RB-3b-03 | `paths` filter による docs-only PR の skip 戦略確立 | mid |
| RB-3b-04 | `gate-e2e` と `guard` の共通 helper 抽出（`set -euo pipefail` / `::error::` 形式） | low |

---

## 5. 終了基準

| # | 条件 |
|---|------|
| EX-01 | shellscript 共通化判断が「統合しない」で確定し、根拠 R-01..R-05 が記録 |
| EX-02 | R-3b-01..R-3b-06 全て phase-5 内容と整合 |
| EX-03 | RB-3b-01..RB-3b-04 が Stage 4 backlog として `phase-12.md` に記録 |
| EX-04 | `actionlint` / `shellcheck` で違反なし（phase-9 で実検証） |

---

## 6. 引き継ぎ（Phase 9 へ）

| 項目 | 内容 |
|------|------|
| Phase 9 検証対象 | YAML 構文 / shell 静的検査 / typecheck / lint |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 8
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3b の shellscript 共通化判断と軽微整理項目を確定し、Stage 4 backlog への引き取りを明示する。

## 実行タスク

- `coverage-guard.sh`（既存）と `coverage-gate-e2e.sh`（新規）の責務分離を確認。
- 統合しない判断の根拠を記録。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-8.md

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
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
