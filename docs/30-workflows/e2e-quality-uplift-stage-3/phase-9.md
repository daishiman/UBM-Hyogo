# Phase 9: 品質保証（Stage 3）

| 項目 | 値 |
|------|----|
| 入力 | `phase-8.md` |
| 出力 | YAML 構文検証 / secret token 列挙 / 静的解析結果 |

---

## 1. YAML 構文検証

### 1.1 ツール

| ツール | 対象 | 実行コマンド |
|--------|------|-------------|
| `actionlint` | `.github/workflows/*.yml` | `pnpm dlx actionlint -color` |
| `yamllint` | 同上 + `lighthouserc.json`（参考） | `pnpm dlx yaml-lint .github/workflows/lighthouse.yml .github/workflows/e2e-tests.yml` |
| `gh workflow view` | 適用前確認 | `gh workflow view lighthouse.yml` / `gh workflow view e2e-tests.yml` |

### 1.2 必須 pass 項目

| # | 内容 |
|---|------|
| Y-01 | `actionlint` violation 0 |
| Y-02 | `name:` が context と完全一致（`lighthouse-ci` / `e2e-tests-coverage-gate`） |
| Y-03 | `runs-on: ubuntu-latest` |
| Y-04 | `actions/checkout@v4` / `pnpm/action-setup@v4` / `actions/setup-node@v4` / `actions/upload-artifact@v4` の **major version 固定** |
| Y-05 | inline script 内の `${{ }}` 展開で shell injection 経路がないこと（user input を直接 `run:` に流していない） |

### 1.3 `lighthouserc.json` 検証

| # | 内容 | コマンド |
|---|------|---------|
| L-01 | JSON 構文 | `jq . lighthouserc.json` |
| L-02 | lhci healthcheck | `pnpm dlx @lhci/cli@0.14 healthcheck --config=./lighthouserc.json` |
| L-03 | URL 4 件すべて localhost | `jq -r '.ci.collect.url[]' lighthouserc.json \| grep -cE '^http://localhost:3000/'` = `4`（Q-03 縮退時は `3`） |

---

## 2. secret / token 列挙

### 2.1 Stage 3 で参照する secret 一覧

| name | scope | 用途 | 設定先 |
|------|-------|------|--------|
| `GITHUB_TOKEN` | workflow auto | Actions 標準操作 | GitHub auto-provided |
| （追加 secret なし） | — | — | — |

### 2.2 hardcode 検査

| # | 検査 | コマンド | 期待 |
|---|------|---------|------|
| S-01 | API token 直書き | `grep -rE '(ghp_\|ghs_\|github_pat_)[A-Za-z0-9_]+' .github/ scripts/ lighthouserc.json` | hit 0 |
| S-02 | Cloudflare API token 直書き | `grep -rE 'CF[a-zA-Z0-9_-]{32,}' .github/ scripts/ apps/web/ lighthouserc.json` | hit 0 |
| S-03 | OAuth client secret | `grep -rE 'client_secret\|oauth_token' .github/ scripts/ lighthouserc.json` | hit 0（コメント除く） |
| S-04 | 1Password reference の流出 | `grep -rE 'op://' .github/workflows/` | hit 0（CI workflow には op 参照を入れない） |
| S-05 | localhost 以外の URL | `grep -rE 'http(s)?://(?!localhost)' lighthouserc.json` | hit 0 |

### 2.3 op:// 参照の取扱

`scripts/coverage-gate-e2e.sh` には secret 不要。`scripts/cf.sh` のような `op run --env-file=.env` パターンは Stage 3 では使用しない（Cloudflare API call なし）。

---

## 3. shell script 静的解析

| # | 対象 | コマンド | 期待 |
|---|------|---------|------|
| SH-01 | `scripts/coverage-gate-e2e.sh` | `pnpm dlx shellcheck scripts/coverage-gate-e2e.sh` | violation 0 |
| SH-02 | `set -euo pipefail` 設定 | `head -3 scripts/coverage-gate-e2e.sh` | 含む |
| SH-03 | `jq` `awk` `pnpm` の存在前提を明示 | スクリプト先頭コメント | `# requires: jq, awk, pnpm` 記載 |

---

## 4. branch protection payload の構造検証

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| BP-01 | payload JSON 構文 | `jq . payload.json` | parse 成功 |
| BP-02 | `required_pull_request_reviews=null` 明示 | `jq '.required_pull_request_reviews == null' payload.json` | `true` |
| BP-03 | `lock_branch=false` 明示 | `jq '.lock_branch == false' payload.json` | `true` |
| BP-04 | `contexts` 配列の重複なし | `jq '.required_status_checks.contexts \| length, (. \| unique \| length)' payload.json` | 5 / 5 |

---

## 5. CI 実 run の事前 sanity check

| # | 内容 | 期待 |
|---|------|------|
| SC-01 | PR-A の `lighthouse-ci` job が draft PR 上で 1 回 success | green |
| SC-02 | PR-B の `e2e-tests-coverage-gate` job が draft PR 上で 1 回 success | green |
| SC-03 | 両 job の所要時間が phase-6 §1.1 の試算範囲内 | lhci ≦ 15 min / e2e ≦ 30 min |

---

## 6. 終了基準

| # | 条件 |
|---|------|
| EX-01 | Y-01..Y-05 / L-01..L-03 全 pass |
| EX-02 | S-01..S-05 全て hit 0 |
| EX-03 | SH-01..SH-03 全 pass |
| EX-04 | BP-01..BP-04 全 pass（payload を ad-hoc file に保存して検査） |
| EX-05 | SC-01..SC-03 全 pass（draft PR 観測） |

---

## 7. 引き継ぎ（Phase 10 へ）

| 項目 | 内容 |
|------|------|
| Phase 10 入力 | 本 phase の検証ログ集約（`outputs/phase-9/` 任意 evidence） |
| solo 運用 | レビュアー必須化なし。自己レビュー + checklist 確認のみ |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 9
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

