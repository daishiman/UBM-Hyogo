# Phase 9: 品質保証（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 入力 | `phase-8.md` |
| 出力 | actionlint / shellcheck / typecheck / lint / secret hardcode 検査 |

---

## 1. actionlint（YAML 構文）

| ツール | 対象 | 実行コマンド |
|--------|------|-------------|
| `actionlint` | `.github/workflows/e2e-tests.yml` | `pnpm dlx actionlint -color .github/workflows/e2e-tests.yml` |

### 1.1 必須 pass 項目

| # | 内容 |
|---|------|
| Y-01 | `actionlint` violation 0 |
| Y-02 | `name: e2e-tests` / `jobs.e2e.name: e2e-tests-coverage-gate` の context 完全一致 |
| Y-03 | `runs-on: ubuntu-latest` |
| Y-04 | `actions/checkout@v4` / `pnpm/action-setup@v4` / `actions/setup-node@v4` / `actions/upload-artifact@v4` の **major version 固定** |
| Y-05 | inline script 内の `${{ }}` 展開で shell injection 経路がないこと（user input を直接 `run:` に流していない） |
| Y-06 | `concurrency.group: e2e-${{ github.ref }}` / `cancel-in-progress: true` |
| Y-07 | `timeout-minutes: 30` |

---

## 2. shellcheck（shellscript 静的解析）

| # | 対象 | コマンド | 期待 |
|---|------|---------|------|
| SH-01 | `scripts/coverage-gate-e2e.sh` | `pnpm dlx shellcheck scripts/coverage-gate-e2e.sh` | violation 0 |
| SH-02 | `set -euo pipefail` 設定 | `head -20 scripts/coverage-gate-e2e.sh \| grep -F 'set -euo pipefail'` | hit 1 |
| SH-03 | `jq` `awk` `pnpm` の存在前提を明示 | スクリプト先頭コメント | `# requires: pnpm, c8 (apps/web devDependency), jq, awk` 記載 |
| SH-04 | しきい値根拠 path コメント | `grep -F 'quality-gates.md §7.5' scripts/coverage-gate-e2e.sh` | hit 1 |

---

## 3. typecheck / lint（apps/web）

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| TC-01 | TypeScript 型チェック | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| TC-02 | reporter swap 後の `playwright.config.ts` 型整合 | 同上に含む | error なし |
| LT-01 | ESLint | `mise exec -- pnpm lint` | exit 0 |
| LT-02 | reporter 配列の TypeScript 型エラーなし | 同上 | clean |

---

## 4. secret / token 列挙

### 4.1 Stage 3b で参照する secret 一覧

| name | scope | 用途 | 設定先 |
|------|-------|------|--------|
| `GITHUB_TOKEN` | workflow auto | Actions 標準操作 | GitHub auto-provided |
| （追加 secret なし） | — | — | — |

### 4.2 hardcode 検査

| # | 検査 | コマンド | 期待 |
|---|------|---------|------|
| S-01 | API token 直書き | `grep -rE '(ghp_\|ghs_\|github_pat_)[A-Za-z0-9_]+' .github/workflows/e2e-tests.yml scripts/coverage-gate-e2e.sh` | hit 0 |
| S-02 | Cloudflare API token 直書き | `grep -rE 'CF[a-zA-Z0-9_-]{32,}' .github/workflows/e2e-tests.yml scripts/coverage-gate-e2e.sh` | hit 0 |
| S-03 | OAuth client secret | `grep -iE 'client_secret\|oauth_token' .github/workflows/e2e-tests.yml scripts/coverage-gate-e2e.sh` | hit 0（コメント除く） |
| S-04 | 1Password reference の流出 | `grep -F 'op://' .github/workflows/e2e-tests.yml` | hit 0 |
| S-05 | 開発用 endpoint（`127.0.0.1:8888` 等）の焼き込み | `grep -F '127.0.0.1' .github/workflows/e2e-tests.yml apps/web/playwright.config.ts` | hit 0（task-18 regression smoke と整合） |

### 4.3 op:// 参照の取扱

`scripts/coverage-gate-e2e.sh` には secret 不要。`scripts/cf.sh` のような `op run --env-file=.env` パターンは 3b では使用しない（Cloudflare API call なし）。

---

## 5. fixture 単体テスト（phase-4 EXT-3b-01）

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| FX-01 | pass fixture | `THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/pass bash scripts/coverage-gate-e2e.sh` | exit 0 |
| FX-02 | fail-69 fixture | `THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/fail-69 bash scripts/coverage-gate-e2e.sh` | exit 1 |
| FX-03 | missing fixture | `THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/missing bash scripts/coverage-gate-e2e.sh` | exit 1 |

---

## 6. CI 実 run の事前 sanity check

| # | 内容 | 期待 |
|---|------|------|
| SC-01 | PR-B の `e2e-tests-coverage-gate` job が draft PR 上で 1 回 success | green |
| SC-02 | 所要時間が phase-6 §1.1 の試算範囲内 | ≦ 30 min（timeout 内） |
| SC-03 | artifact `e2e-coverage-<sha>` / `e2e-monocart-<sha>` が `actions/upload-artifact@v4` で取得可能 | `gh run download` で確認 |

---

## 7. 終了基準

| # | 条件 |
|---|------|
| EX-01 | Y-01..Y-07 全 pass |
| EX-02 | SH-01..SH-04 全 pass |
| EX-03 | TC-01 / TC-02 / LT-01 / LT-02 全 pass |
| EX-04 | S-01..S-05 全て hit 0 |
| EX-05 | FX-01..FX-03 全 pass |
| EX-06 | SC-01..SC-03 全 pass（draft PR 観測） |

---

## 8. 引き継ぎ（Phase 10 へ）

| 項目 | 内容 |
|------|------|
| Phase 10 入力 | 本 phase の検証ログ集約（`outputs/phase-9/` 任意 evidence） |
| solo 運用 | レビュアー必須化なし。self-review + checklist 確認のみ |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 9
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3b の actionlint / shellcheck / typecheck / lint / secret hardcode 検査の合格条件を確定し、Phase 10 self-review への入力を完備させる。

## 実行タスク

- 親 phase-9.md §1 / §2 / §3 から 3b 関連箇所を抽出。
- fixture 単体テスト（FX-01..FX-03）を品質保証チェックに組み込み。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-9.md

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
