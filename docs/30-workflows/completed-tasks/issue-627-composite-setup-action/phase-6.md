# Phase 6: 実装（composite action 本体作成）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-4.md` / `phase-5.md` |
| 出力 | `.github/actions/setup-project/action.yml`（新規） / `ci.yml` の composite action structure gate（任意） |
| implementation_mode | `new` |

---

## 0. 実装サマリ

| ID | 影響ファイル | 変更種別 | コミット粒度 |
|----|--------------|---------|-------------|
| F-01 | `.github/actions/setup-project/action.yml` | **new** | C1 |
| F-02 | `.github/workflows/ci.yml`（`workflow-shell-lint` の `actionlint` step 引数） | edit（任意） | C1 |

`F-01` と `F-02` は単一コミット C1 として PR-A に積む（呼出側 7 job の置換 = Phase 7 = 別コミット C2 とする）。

---

## 1. 前提確認

| # | チェック | コマンド | 期待 |
|---|---------|---------|------|
| P-01 | Phase 4 草案 | `grep -E "^name: 'Setup Project" docs/30-workflows/issue-627-composite-setup-action/phase-4.md` | hit 1 |
| P-02 | 既存 dir 未存在 | `test -d .github/actions/setup-project && echo PRESENT \|\| echo MISSING` | `MISSING` |
| P-03 | actionlint 実行可能 | `./.tmp/actionlint/actionlint -version` または `mise exec -- pnpm dlx actionlint -version` | バージョン文字列 |

---

## 2. 新規ファイル: `.github/actions/setup-project/action.yml`

Phase 4 §3 の草案をそのまま採用する。**完全な YAML 本体**を以下に再掲する（実装時はこの内容で `Write` する）。

```yaml
name: 'Setup Project (UBM-Hyogo)'
description: 'Composite action that consolidates Node + pnpm (or mise) setup and frozen-lockfile install used across CI workflows.'

inputs:
  setup-strategy:
    description: 'Setup path: "node-setup" (actions/setup-node + pnpm/action-setup) or "mise" (jdx/mise-action).'
    required: false
    default: 'node-setup'
  install:
    description: 'If "true", run `pnpm install --frozen-lockfile` after setup.'
    required: false
    default: 'true'
  node-version:
    description: 'Node.js version for setup-strategy=node-setup.'
    required: false
    default: '24.15.0'
  pnpm-version:
    description: 'pnpm version for pnpm/action-setup (node-setup path).'
    required: false
    default: '10.33.2'
  working-directory:
    description: 'Working directory used when invoking pnpm install.'
    required: false
    default: '.'

outputs:
  node-version:
    description: 'Resolved Node.js version reported by `node -v`.'
    value: ${{ steps.report.outputs.node-version }}
  pnpm-version:
    description: 'Resolved pnpm version reported by `pnpm -v`.'
    value: ${{ steps.report.outputs.pnpm-version }}
  setup-strategy:
    description: 'Setup strategy actually applied.'
    value: ${{ inputs.setup-strategy }}

runs:
  using: 'composite'
  steps:
    - name: Validate setup-strategy
      shell: bash
      run: |
        case "${{ inputs.setup-strategy }}" in
          node-setup|mise) ;;
          *)
            echo "::error::Invalid setup-strategy='${{ inputs.setup-strategy }}'. Must be 'node-setup' or 'mise'."
            exit 1
            ;;
        esac

    - name: Setup pnpm (node-setup)
      if: inputs.setup-strategy == 'node-setup'
      uses: pnpm/action-setup@v4
      with:
        version: ${{ inputs.pnpm-version }}

    - name: Setup Node.js (node-setup)
      if: inputs.setup-strategy == 'node-setup'
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: pnpm

    - name: Setup mise (Node + pnpm from .mise.toml)
      if: inputs.setup-strategy == 'mise'
      uses: jdx/mise-action@v2
      with:
        cache: true

    - name: Install dependencies (node-setup)
      if: inputs.install == 'true' && inputs.setup-strategy == 'node-setup'
      shell: bash
      working-directory: ${{ inputs.working-directory }}
      run: pnpm install --frozen-lockfile

    - name: Install dependencies (mise)
      if: inputs.install == 'true' && inputs.setup-strategy == 'mise'
      shell: bash
      working-directory: ${{ inputs.working-directory }}
      run: mise exec -- pnpm install --frozen-lockfile

    - name: Report resolved versions
      id: report
      shell: bash
      run: |
        if [[ "${{ inputs.setup-strategy }}" == "mise" ]]; then
          NODE_V="$(mise exec -- node -v)"
          PNPM_V="$(mise exec -- pnpm -v)"
        else
          NODE_V="$(node -v)"
          PNPM_V="$(pnpm -v)"
        fi
        echo "node-version=${NODE_V}" >> "$GITHUB_OUTPUT"
        echo "pnpm-version=${PNPM_V}" >> "$GITHUB_OUTPUT"
        echo "::notice::setup-project resolved node=${NODE_V} pnpm=${PNPM_V} strategy=${{ inputs.setup-strategy }}"
```

---

## 3. 実装手順

```bash
# 3.1 ディレクトリ作成
mkdir -p .github/actions/setup-project

# 3.2 action.yml を作成（Write で §2 の内容をそのまま書く）
$EDITOR .github/actions/setup-project/action.yml

# 3.3 lint
node -e "const fs=require('fs'); const s=fs.readFileSync('.github/actions/setup-project/action.yml','utf8'); if (!s.includes(\"using: 'composite'\")) process.exit(1)"
yamllint -d 'rules: {line-length: {max: 200}, document-start: disable}' \
  .github/actions/setup-project/action.yml

# 3.4 step / input / output 数の grep gate
grep -cE '^\s*-\s+name:' .github/actions/setup-project/action.yml
# 期待: 7（Validate / Setup pnpm / Setup Node / Setup mise / Install(node) / Install(mise) / Report）

grep -cE '^\s{2}[a-z-]+:$' .github/actions/setup-project/action.yml | head -1
# inputs 配下 5 個 + outputs 配下 3 個 が含まれる

# 3.5 add + commit（PR-A C1）
git add .github/actions/setup-project/action.yml
git commit -m "feat(ci): add composite action setup-project for shared Node + pnpm setup (RB-02, #627)"
```

---

## 4. `ci.yml` の actionlint 引数追加（F-02・任意）

既存 `workflow-shell-lint` job の actionlint step に composite action のパスを追加する。

### 4.1 編集対象

`/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260512-141040-wt-8/.github/workflows/ci.yml`（行 49-50）

### 4.2 Edit パターン

```diff
       - name: Actionlint workflow syntax
-        run: ./actionlint -color .github/workflows/post-release-observation-reminder.yml .github/workflows/ci.yml .github/workflows/web-cd.yml .github/workflows/runtime-smoke-staging.yml
+        run: ./actionlint -color .github/workflows/post-release-observation-reminder.yml .github/workflows/ci.yml .github/workflows/web-cd.yml .github/workflows/runtime-smoke-staging.yml
```

> 既存 actionlint 引数の末尾にスペース区切りで追加する。actionlint は composite action ファイルも validate 可能。

### 4.3 採否

| 採否 | 理由 |
|------|------|
| 推奨 | composite action 自体の retrogression を CI gate で検出するため |
| 不採用可 | 既存 `workflow-shell-lint` の対象は post-release / runtime-smoke / ci / web-cd 限定で他 workflow も網羅していない（最小差分原則を優先するなら見送り可） |

実装時はまず推奨案で実施し、actionlint が composite action ファイル形式で fail する場合のみ撤回する。

---

## 5. step / input / output 検証

### 5.1 inputs カウント

```bash
grep -cE "^  [a-z-]+:$" .github/actions/setup-project/action.yml
# 期待: setup-strategy / install / node-version / pnpm-version / working-directory + outputs 3 個
# inputs ブロックに限定するなら yq / Python パースが安全
```

### 5.2 outputs 参照整合

| output | value 参照 | 確認方法 |
|--------|-----------|---------|
| `node-version` | `${{ steps.report.outputs.node-version }}` | `grep 'steps.report.outputs.node-version' action.yml` hit 1 |
| `pnpm-version` | `${{ steps.report.outputs.pnpm-version }}` | 同上 |
| `setup-strategy` | `${{ inputs.setup-strategy }}` | 同上 |

### 5.3 shell 指定

全 `run:` step に `shell: bash` が明示されているか:

```bash
# composite action では shell 指定が必須
grep -cE '^\s+shell: bash$' .github/actions/setup-project/action.yml
# 期待: 4（Validate / Install(node) / Install(mise) / Report）
```

---

## 6. ローカル自己検証

```bash
# 構文・lint
node -e "const fs=require('fs'); const s=fs.readFileSync('.github/actions/setup-project/action.yml','utf8'); if (!s.includes(\"using: 'composite'\")) process.exit(1)"
yamllint -d 'rules: {line-length: {max: 200}, document-start: disable}' \
  .github/actions/setup-project/action.yml

# YAML parse 可能（Python or yq）
python3 -c "import yaml,sys; yaml.safe_load(open('.github/actions/setup-project/action.yml')); print('YAML OK')"

# step 数
grep -cE '^\s*-\s+name:' .github/actions/setup-project/action.yml   # 7

# inputs 既定値
grep -E "default:\s*'24\.15\.0'" .github/actions/setup-project/action.yml
grep -E "default:\s*'10\.33\.2'" .github/actions/setup-project/action.yml
grep -E "default:\s*'node-setup'" .github/actions/setup-project/action.yml
grep -E "default:\s*'true'" .github/actions/setup-project/action.yml
```

全 violation 0 / 全 grep が hit を期待する。

---

## 7. token / secret

| 名前 | 用途 | 設定先 |
|------|------|--------|
| `GITHUB_TOKEN` | actions 標準 | auto-provided（composite 内で参照しない） |
| 追加 secret | **なし** | — |

composite action 内で `secrets.*` を参照しない（呼出側 workflow の permissions / secrets 設計に介入しないため）。

---

## 8. PR 構成（本 Phase 範囲）

| commit | 含むファイル | 説明 |
|--------|--------------|------|
| C1 | `.github/actions/setup-project/action.yml`（new） / `ci.yml`（composite structure gate 追加 = 任意） | composite action 本体導入 |
| C2 | （Phase 7） `.github/workflows/{lighthouse,e2e-tests,ci,pr-build-test}.yml` | 7 job 置換 |

C1 のみで `ci` / `lighthouse-ci` / `e2e-tests` / `pr-build-test` の挙動は変わらないため、C1 単独で merge しても安全（呼出側は Phase 7 で初めて切替）。

---

## 9. DoD（Phase 6 完了条件）

| # | 条件 |
|---|------|
| D-01 | `.github/actions/setup-project/action.yml` が §2 の内容で存在 |
| D-02 | actionlint / yamllint / Python YAML parse で violation 0 |
| D-03 | step 数 7 / inputs 5 / outputs 3 / shell: bash 4 件 |
| D-04 | `secrets.*` を action.yml 内で参照しない |
| D-05 | C1 が呼出側未切替で merge しても既存 7 job の動作が変わらない |

---

## 10. 引き継ぎ（Phase 7 へ）

| 項目 | 内容 |
|------|------|
| 置換対象 7 job | lighthouse / e2e (matrix 1 job として再利用 1 回 = 厳密には matrix 含み 1) / e2e-tests-coverage-gate / ci(=typecheck/lint 1 job) / coverage-gate / pr-build-test |
| Edit パターン | Phase 7 §2..§5 |
| 削減行数の計測 | Phase 7 §6 で `git diff --stat` 実測 |

> 補足: `index.md` の「7 job 重複」は `lighthouse` / `e2e (shard)` / `e2e-tests-coverage-gate` / `ci.typecheck` / `ci.lint` / `ci.test`(=coverage-gate 相当) / `pr-build-test` を指す。Phase 7 で再列挙する。

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 6
- task classification: implementation / NON_VISUAL (CI infra)
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

composite action 本体 `.github/actions/setup-project/action.yml` を Phase 4 §3 草案どおりに新規作成し、structure / SHA pin gate と workflow actionlint の分離を達成する。呼出側未切替で merge 可能な安全コミット C1 として整える。

## 実行タスク

- §2 で action.yml 完全本体を確定。
- §3 で作成手順を確定。
- §4 で ci.yml への任意追加を提示。
- §5 / §6 で自己検証手順を確定。
- §8 で PR 構成と C1 単独 merge の安全性を明文化。

## 参照資料

- docs/30-workflows/issue-627-composite-setup-action/phase-4.md §3
- docs/30-workflows/issue-627-composite-setup-action/phase-5.md §5
- .github/workflows/ci.yml（actionlint step）

## 実行手順

1. P-01..P-03 着手前提確認。
2. `.github/actions/setup-project/` 作成 → `action.yml` を Write。
3. actionlint / yamllint / Python YAML parse で自己検証。
4. ci.yml の actionlint 引数末尾に追加（任意）。
5. C1 として add + commit。

## 統合テスト連携

- NON_VISUAL phase は actionlint / yamllint / shellcheck（actionlint 内蔵）を Playwright 代替の verification gate とする。
- 実 GHA run は Phase 9 draft PR で実施し evidence を `outputs/phase-11/evidence/setup-lines-delta.md` に集約する。

## 成果物

- `.github/actions/setup-project/action.yml`
- 本 phase markdown

## 完了条件

- [x] 仕様記述済: 必須セクションが存在する。
- [x] 仕様記述済: coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
