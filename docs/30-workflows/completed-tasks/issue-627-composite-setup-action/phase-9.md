# Phase 9: 統合テスト（draft PR で実 GitHub Actions 実行）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-8.md`（単体テスト `completed (local static evidence captured)`） |
| 出力 | draft PR 上で `ci` / `lighthouse-ci` / `e2e-tests` / `pr-build-test` の全 job が green である観測ログ |
| 運用 | solo（self-observation） |

---

## 0. 目的

composite action 置換後の workflow を **実 GitHub-hosted setup-strategy** 上で起動し、以下を統合的に検証する:

1. 全 7 job が green
2. `setup-project` composite action が input 経由で `node-version` / `pnpm-version` / `setup-strategy` を正しく解決
3. branch protection が要求する required status check 名（`ci` / `lighthouse-ci` / `e2e-tests` / `pr-build-test`）が **変化していない**
4. 所要時間が composite 化前と同等以内（実測比較は Phase 10 で行う）

---

## 1. draft PR 起こし手順

| # | 操作 | コマンド |
|---|------|---------|
| P-01 | feature branch 確認 | `git rev-parse --abbrev-ref HEAD` → `feat/issue-627-composite-setup-action` |
| P-02 | origin push | `git push -u origin feat/issue-627-composite-setup-action` |
| P-03 | draft PR 作成 | `gh pr create --base dev --draft --title "feat(ci): composite setup action (issue-627)" --body-file docs/30-workflows/issue-627-composite-setup-action/outputs/phase-13/pr-body.md` |
| P-04 | PR 番号取得 | `gh pr view --json number -q .number` を以下 `${PR}` として使用 |

> 本 phase は **draft 状態のまま** 検証。ready-for-review への昇格は Phase 13 で行う。

---

## 2. workflow 起動と監視

### 2.1 自動起動分

push に伴い以下 workflow が自動で起動する想定:

| workflow | trigger | job 名 |
|---------|---------|--------|
| `ci.yml` | `pull_request` to `dev` | `typecheck` / `lint` / `test` |
| `lighthouse.yml` | `pull_request` to `dev` | `lighthouse` (context `lighthouse-ci`) |
| `e2e-tests.yml` | `pull_request` to `dev` | `e2e-shard` × N / `report-merge` |
| `pr-build-test.yml` | `pull_request` to `dev` | `pr-build-test` |

### 2.2 監視コマンド

| # | コマンド | 用途 |
|---|---------|------|
| W-01 | `gh pr checks ${PR} --watch` | PR レベルで全 check を一覧監視 |
| W-02 | `gh run list --branch feat/issue-627-composite-setup-action --limit 10` | run id 取得 |
| W-03 | `gh run watch <run-id> --exit-status` | 個別 run を最後まで監視（fail で非 0 終了） |
| W-04 | `gh run view <run-id> --log` | 失敗時の詳細 log 取得 |
| W-05 | `gh run view <run-id> --log-failed` | 失敗 step のみ抽出 |

### 2.3 個別 workflow 監視

| # | コマンド | 期待 |
|---|---------|------|
| M-01 | `gh run list --workflow=ci.yml --branch feat/issue-627-composite-setup-action --limit 1 --json conclusion -q '.[0].conclusion'` | `success` |
| M-02 | `gh run list --workflow=lighthouse.yml --branch feat/issue-627-composite-setup-action --limit 1 --json conclusion -q '.[0].conclusion'` | `success` |
| M-03 | `gh run list --workflow=e2e-tests.yml --branch feat/issue-627-composite-setup-action --limit 1 --json conclusion -q '.[0].conclusion'` | `success` |
| M-04 | `gh run list --workflow=pr-build-test.yml --branch feat/issue-627-composite-setup-action --limit 1 --json conclusion -q '.[0].conclusion'` | `success` |

---

## 3. composite action 動作の確認

実 setup-strategy ログから以下を確認する。

| # | 内容 | 確認コマンド | 期待 |
|---|------|-------------|------|
| C-01 | composite action が解決されている | `gh run view <ci-run-id> --log \| grep -E 'Run \./\.github/actions/setup-project'` | hit >= 1 / job |
| C-02 | node version が `24.15.0` 解決 | `gh run view <ci-run-id> --log \| grep -E 'node-version.*24\.15\.0'` | hit >= 1 |
| C-03 | pnpm version が `10.33.2` 解決 | `gh run view <ci-run-id> --log \| grep -E 'pnpm.*10\.33\.2'` | hit >= 1 |
| C-04 | mise 系統（pr-build-test）が `setup-strategy: mise` で分岐動作 | `gh run view <pr-build-run-id> --log \| grep -E 'mise (exec\|install)'` | hit >= 1 |
| C-05 | `pnpm install --frozen-lockfile` が composite 内で 1 回ずつ実行 | `gh run view <ci-run-id> --log \| grep -cE 'pnpm install --frozen-lockfile'` | == job 数（typecheck/lint/test で計 3） |

---

## 4. required status check 一致確認

branch protection が `dev` に対して要求する context 名と、実 PR で報告される check 名が一致していることを確認する。

| # | コマンド | 期待 |
|---|---------|------|
| R-01 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection --jq '.required_status_checks.contexts'` | 既存 contexts 配列（変更なし） |
| R-02 | `gh pr checks ${PR} --json name -q '.[].name' \| sort -u` | R-01 の contexts を **全て含む** |
| R-03 | context 名 drift | diff コマンド: `diff <(gh api ... --jq '.required_status_checks.contexts[]' \| sort) <(gh pr checks ${PR} --json name -q '.[].name' \| sort -u)` | required 側に **不足なし** |

> R-03 で required 側に不足があれば **永久 pending** リスク（BLK-01 系）。即 Phase 7 に差し戻し。

---

## 5. 再現性確認（rerun smoke）

composite action の input 解決が rerun で再現することを確認する。

| # | コマンド | 期待 |
|---|---------|------|
| RR-01 | `gh run rerun <ci-run-id>` | 起動成功 |
| RR-02 | `gh run watch <rerun-id> --exit-status` | exit 0 |
| RR-03 | rerun でも node / pnpm version が同一 | C-02 / C-03 を rerun ログで再確認 |

---

## 6. evidence 保存先

| ファイル | 内容 |
|---------|------|
| `outputs/phase-11/evidence/gh-pr-checks.json` | `gh pr checks ${PR} --json name,state,conclusion` 出力 |
| `outputs/phase-11/evidence/gh-run-list.json` | M-01..M-04 の生 JSON |
| `outputs/phase-11/evidence/ci-run.log` | `gh run view <ci-run-id> --log` |
| `outputs/phase-11/evidence/lighthouse-run.log` | `gh run view <lighthouse-run-id> --log` |
| `outputs/phase-11/evidence/e2e-run.log` | `gh run view <e2e-run-id> --log` |
| `outputs/phase-11/evidence/pr-build-test-run.log` | `gh run view <pr-build-run-id> --log` |
| `outputs/phase-11/evidence/branch-protection-dev.json` | R-01 の生 JSON |

---

## 7. pass / fail 判定基準

| 観点 | pass | fail |
|------|------|------|
| job 結果 | M-01..M-04 全て `success` | いずれか `failure` / `cancelled` |
| composite 解決 | C-01..C-05 全 hit 期待値以上 | いずれか hit 0 |
| context 一致 | R-03 diff が空 | required 側に不足あり |
| rerun 再現 | RR-01..RR-03 `completed (runtime rerun evidence captured)` | いずれか fail |

---

## 8. 失敗時の切り戻し方針

| 種別 | 対応 |
|------|------|
| composite action 内 step 失敗 | Phase 6 に戻り action.yml を修正 |
| 呼び出し側 input 不整合 | Phase 7 に戻り `with:` を修正 |
| context 名差分 | Phase 7 で `jobs.<id>.name:` を再点検 |
| flaky e2e | 同一 run を 1 回だけ rerun。2 連続 fail なら Phase 7 差し戻し |

---

## 9. 引き継ぎ（Phase 10 へ）

| 項目 | 内容 |
|------|------|
| Phase 10 起動条件 | M-01..M-04 / C-01..C-05 / R-03 / RR-01..RR-03 が `completed (runtime GHA evidence captured)` |
| Phase 10 入力 | 本 phase の evidence 7 ファイル |

---

## DoD（Phase 9 完了条件）

| # | 条件 |
|---|------|
| D-01 | draft PR 起こし手順 P-01..P-04 が記述済 |
| D-02 | M-01..M-04 / W-01..W-05 の監視コマンドが実行可能形で記述 |
| D-03 | C-01..C-05 の composite 動作確認手順が記述 |
| D-04 | R-01..R-03 の required context 一致確認が記述 |
| D-05 | 失敗時切り戻し方針が表で確定 |
| D-06 | evidence 7 ファイルが列挙済 |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 9
- task classification: implementation / NON_VISUAL（CI infra integration）
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

実 GitHub Actions 上で composite action 置換後の 7 job が green であり、required status check 名が drift していないことを統合的に観測する。

## 実行タスク

- draft PR を起こし全 workflow を起動する。
- `gh pr checks --watch` および `gh run watch` で全 job green を確認する。
- composite action 内 step ログから node / pnpm / mise の input 解決を確認する。
- branch protection の required contexts と PR check 名の一致を確認する。
- rerun smoke を 1 回行い再現性を確認する。

## 参照資料

- docs/30-workflows/completed-tasks/3a-lighthouse-ci/phase-9.md（フォーマット参考）
- docs/30-workflows/issue-627-composite-setup-action/index.md
- phase-6.md / phase-7.md / phase-8.md（本サブタスク内）

## 実行手順

1. P-01..P-04 で draft PR を起こす。
2. W-01 で全 check を一覧監視。
3. M-01..M-04 で個別 workflow の conclusion を確認。
4. C-01..C-05 で composite 動作を log から検証。
5. R-01..R-03 で context 一致を確認。
6. RR-01..RR-03 で rerun 再現性を確認。
7. evidence を 7 ファイルに保存。

## 統合テスト連携

- 実 GitHub-hosted setup-strategy 上での実行が本 phase の integration coverage 本体。
- E2E job (`e2e-tests`) は本タスクスコープ外の Playwright であり、composite 経由で setup が正しく解決されるかのみ確認する。

## 成果物

- 本 phase markdown
- `outputs/phase-11/evidence/` 配下 7 ファイル

## 完了条件

- [x] 仕様記述済: 必須セクションが存在する。
- [x] 仕様記述済: coverage AC 適用: standard tier（NON_VISUAL / CI infra のため lines 計測対象外）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
