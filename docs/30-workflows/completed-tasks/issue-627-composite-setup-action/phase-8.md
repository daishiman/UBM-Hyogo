# Phase 8: 単体テスト（composite action 単独検証）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-6.md`（composite action 本体実装）/ `phase-7.md`（呼び出し側 workflow 置換） |
| 出力 | actionlint / yamllint pass 結果 / list smoke 出力 / grep gate による重複行削減の実測 |
| 運用 | solo（self-verification） |

---

## 0. 目的

`.github/actions/setup-project/action.yml` および 7 job の置換差分が **静的検査で全て pass** し、かつ **重複ステップが構造的に消えている** ことを、CI 実行に先立ってローカル / setup-strategy 非依存に検証する。

統合 (Phase 9) で実 setup-strategy 起動コストを払う前に、構文・命名・重複削減効果を確定する gate と位置付ける。

---

## 1. actionlint（GitHub Actions 構文）

### 1.1 対象

| # | path | 役割 |
|---|------|------|
| A-01 | `.github/actions/setup-project/action.yml` | composite action 本体 |
| A-02 | `.github/workflows/ci.yml` | typecheck / lint / test の 3 job |
| A-03 | `.github/workflows/lighthouse.yml` | lighthouse job |
| A-04 | `.github/workflows/e2e-tests.yml` | e2e-shard / report-merge |
| A-05 | `.github/workflows/pr-build-test.yml` | pr-build-test（mise 系統） |

### 1.2 コマンド / 期待

| # | コマンド | 期待 |
|---|---------|------|
| AL-01 | official `download-actionlint.bash` + `actionlint` against workflow YAML files only | violation 0 |
| CA-01 | `node` structure / SHA pin assertion for `.github/actions/setup-project/action.yml` | pass |
| AL-02 | `mise exec -- pnpm dlx actionlint -color .github/workflows/ci.yml .github/workflows/lighthouse.yml .github/workflows/e2e-tests.yml .github/workflows/pr-build-test.yml` | violation 0 |
| AL-03 | `mise exec -- pnpm dlx actionlint -color .github/workflows/*.yml` | violation 0（他 workflow への副作用がないこと） |

### 1.3 fail 判定

- exit code != 0、または stdout に `error:` を含む場合 fail。
- composite action 内 `using: composite` 必須・`steps[*].shell` 必須（actionlint が捕捉）。

---

## 2. yamllint（インデント / 行末 / 真偽値表記）

| # | コマンド | 期待 |
|---|---------|------|
| YL-01 | `yamllint .github/actions/setup-project/action.yml` | exit 0 |
| YL-02 | `yamllint .github/workflows/ci.yml .github/workflows/lighthouse.yml .github/workflows/e2e-tests.yml .github/workflows/pr-build-test.yml` | exit 0 |

> `yamllint` が PATH 未配備の環境では `mise exec -- pipx run yamllint <path>` で代替する。設定ファイル `.yamllint` 未存在のため default profile を採用。

---

## 3. list smoke（composite action の interface 確認）

`act` を用いた dry-run でローカル job 列挙を行い、composite action 参照が解決可能であることを確認する。

| # | コマンド | 期待 |
|---|---------|------|
| LS-01 | `act -l -W .github/workflows/ci.yml` | typecheck / lint / test の 3 job が列挙 |
| LS-02 | `act -l -W .github/workflows/lighthouse.yml` | lighthouse 1 job |
| LS-03 | `act -l -W .github/workflows/e2e-tests.yml` | e2e-shard / report-merge |
| LS-04 | `act -l -W .github/workflows/pr-build-test.yml` | pr-build-test 1 job |
| LS-05 | `grep -RE 'uses:\s*\./\.github/actions/setup-project' .github/workflows/` | hit >= 7（置換 7 job 全件） |

> `act` が未配備の場合 LS-01..LS-04 は skip 可。LS-05 は必須。

---

## 4. grep gate（重複行が消えたことの検証）

Phase 4 §1.1 で実測した「重複 7 箇所」の元ステップが composite 置換後に **直接記述として残っていない** ことを grep で機械的に確認する。

| # | 検査内容 | コマンド | 期待 |
|---|---------|---------|------|
| G-01 | 7 workflow 内に `actions/checkout@v4` 直書きが残っていない | `grep -RE '^\s*-\s*uses:\s*actions/checkout@v4' .github/workflows/ci.yml .github/workflows/lighthouse.yml .github/workflows/e2e-tests.yml .github/workflows/pr-build-test.yml \| wc -l` | 0 |
| G-02 | `actions/setup-node@v4` 直書きが残っていない | `grep -RE '^\s*-\s*uses:\s*actions/setup-node@v4' .github/workflows/ci.yml .github/workflows/lighthouse.yml .github/workflows/e2e-tests.yml \| wc -l` | 0 |
| G-03 | `pnpm install --frozen-lockfile` を `run:` で直叩きしている行が消えている | `grep -RE 'pnpm install --frozen-lockfile' .github/workflows/ci.yml .github/workflows/lighthouse.yml .github/workflows/e2e-tests.yml .github/workflows/pr-build-test.yml \| wc -l` | 0 |
| G-04 | composite 呼び出しが 7 件以上ある | `grep -RE 'uses:\s*\./\.github/actions/setup-project' .github/workflows/*.yml \| wc -l` | >= 7 |
| G-05 | `with:` で `node-version` / `pnpm-version` を input 経由で渡している箇所がある | `grep -A5 -RE 'uses:\s*\./\.github/actions/setup-project' .github/workflows/*.yml \| grep -E 'node-version\|pnpm-version\|setup-strategy'` | hit >= 1（少なくとも mise 系統 pr-build-test で `setup-strategy: mise` を指定） |

> G-01..G-03 は **0 でなければ Phase 7 置換漏れ**。G-04 は **7 未満で置換漏れ**。

---

## 5. 重複削減行数の実測

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| D-01 | composite 導入前後の workflow 合計行数 diff | `git diff --stat origin/dev...HEAD -- .github/workflows/` | `-` 行数が `+` 行数を **十分上回る**（目標 70% 削減） |
| D-02 | setup boilerplate のみの削減行数 | `git diff origin/dev...HEAD -- .github/workflows/ \| grep -E '^-\s' \| grep -E 'checkout@v4\|setup-node@v4\|pnpm install --frozen-lockfile\|pnpm/action-setup@v4' \| wc -l` | >= 20 行（7 job × 平均 3 行） |
| D-03 | 計測結果を evidence ファイルに保存 | `outputs/phase-11/evidence/setup-lines-delta.md` に手動転記 | ファイル存在 |

---

## 6. evidence 保存先

すべて `docs/30-workflows/issue-627-composite-setup-action/outputs/phase-11/evidence/` 配下に保存する（Phase 11 でまとめて整理）。

| ファイル | 内容 |
|---------|------|
| `actionlint-action-yml.log` | AL-01 出力 |
| `actionlint-workflows.log` | AL-02 / AL-03 出力 |
| `yamllint.log` | YL-01 / YL-02 出力 |
| `act-list.log` | LS-01..LS-04 出力 |
| `grep-gate-results.txt` | G-01..G-05 の各 wc -l 結果 |
| `setup-lines-delta.md` | D-01..D-02 の集計サマリ |

---

## 7. pass / fail 判定基準

| 観点 | pass | fail |
|------|------|------|
| 構文 | AL-01..AL-03 / YL-01..YL-02 全て exit 0 | いずれか violation 検出 |
| interface | LS-05 hit >= 7 | hit < 7 |
| 重複削減 | G-01..G-03 全 0 / G-04 >= 7 | いずれか不適合 |
| 行数削減 | D-02 >= 20 行 | < 20 行（Phase 7 設計に戻る） |

---

## 8. 引き継ぎ（Phase 9 へ）

| 項目 | 内容 |
|------|------|
| Phase 9 起動条件 | 本 phase の AL / YL / G / D が `completed (local static evidence captured)` であること |
| 残作業 | draft PR を起こし実 GitHub Actions で 7 job green を観測する |

---

## DoD（Phase 8 完了条件）

| # | 条件 |
|---|------|
| D-01 | AL-01..AL-03 / YL-01..YL-02 のコマンドと期待が実行可能形で記述 |
| D-02 | LS-01..LS-05 の list smoke が定義済 |
| D-03 | G-01..G-05 / D-01..D-03 の grep gate / 行数差分が定義済 |
| D-04 | evidence 保存先 6 ファイルが列挙済 |
| D-05 | pass / fail 判定基準が表で確定 |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 8
- task classification: implementation / NON_VISUAL（CI infra）
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

composite action 本体と 7 workflow 置換差分について、静的検査 (actionlint / yamllint) と grep gate により重複削減効果を setup-strategy 非依存に確定する。

## 実行タスク

- actionlint / yamllint を composite action + 4 workflow に実行する。
- `act -l` で job 列挙の smoke を取り、composite 参照が解決可能か確認する。
- grep gate G-01..G-05 で重複ステップ消失を検証する。
- `git diff --stat` で行数削減を実測する。
- evidence を `outputs/phase-11/evidence/` 配下に保存する。

## 参照資料

- docs/30-workflows/completed-tasks/3a-lighthouse-ci/phase-8.md（フォーマット参考）
- docs/30-workflows/issue-627-composite-setup-action/index.md
- phase-6.md / phase-7.md（本サブタスク内）

## 実行手順

1. AL-01..AL-03 を実行し violation 0 を確認。
2. YL-01..YL-02 を実行し exit 0 を確認。
3. LS-01..LS-05 で job 列挙と composite 参照件数を確認。
4. G-01..G-05 で重複ステップ消失を確認。
5. D-01..D-03 で削減行数を集計し evidence に保存。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- 実 GitHub Actions 起動による統合検証は Phase 9 で実施する。

## 成果物

- 本 phase markdown
- `outputs/phase-11/evidence/` 配下の 6 evidence ファイル（Phase 11 で集約）

## 完了条件

- [x] 仕様記述済: 必須セクションが存在する。
- [x] 仕様記述済: coverage AC 適用: standard tier（本タスクは NON_VISUAL / CI infra のため lines 計測対象外）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
