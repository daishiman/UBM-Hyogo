# Phase 4: 詳細設計（composite action インターフェース）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` / `phase-2.md` / `phase-3.md` / `index.md` |
| 出力 | `.github/actions/setup-project/action.yml` の完全 YAML 草案 / input / output / runs.using=composite の steps 構成 |
| 変更対象（本 Phase 時点） | 設計のみ（実ファイル作成は Phase 6） |

---

## 0. 前提確認（着手前 必須チェック）

| # | チェック項目 | コマンド | 期待 |
|---|-------------|----------|------|
| P-01 | index.md 採用条件 | `grep -E '充足' docs/30-workflows/issue-627-composite-setup-action/index.md` | hit >= 3 |
| P-02 | 置換対象 7 job 実在 | `grep -lE 'pnpm install --frozen-lockfile' .github/workflows/{lighthouse,e2e-tests,ci,pr-build-test}.yml` | 4 ファイル全 hit |
| P-03 | `.github/actions/` 未存在 | `ls .github/actions/ 2>/dev/null || echo MISSING` | `MISSING` |
| P-04 | Node / pnpm | `mise exec -- node -v && mise exec -- pnpm -v` | `v24.15.0` / `10.33.2` |
| P-05 | SHA pin policy (UT-GOV-007) | `grep -E 'b4ffde65f46336ab88eb53be808477a3936bae11' .github/workflows/pr-build-test.yml` | hit 1 |

P-01〜P-05 全 GO で本 Phase を確定する。

---

## 1. 設計指針

| # | 指針 | 根拠 |
|---|------|------|
| D-01 | `runs.using: composite` を採用し、JavaScript Action / Docker Action は使わない | shell + 既存 action の合成のみで足り、ビルド成果物が不要 |
| D-02 | `inputs.setup-strategy` で `node-setup`（既定） / `mise` を切替可能とする | pr-build-test.yml が mise 系統、他 6 job が setup-node 系統。統一は別タスク（RB-05） |
| D-03 | `inputs.install` で `pnpm install --frozen-lockfile` を on/off できる | install を skip したい将来 job 余地（実 7 job は全 `true`） |
| D-04 | `inputs.node-version` / `inputs.pnpm-version` を expose し既定値はリポ正本に揃える | `.mise.toml` と一致（Node `24.15.0` / pnpm `10.33.2`） |
| D-05 | `outputs.node-version` / `outputs.pnpm-version` を expose | debug および後続 step での参照用 |
| D-06 | `actions/cache` は composite 内で追加しない | 既存 `cache: pnpm`（setup-node 内蔵）/ `mise-action.cache: true` の挙動を温存（CONST_004 既存挙動の温存） |
| D-07 | SHA pin は呼出側 workflow の既存値を**踏襲しない** | composite 内は `@v4` タグ参照に統一し、pr-build-test の SHA pin は composite 内側で同等 SHA を pin する |
| D-08 | 失敗時メッセージは `::error::` ANSI 形式で標準化 | actions の log filtering 互換 |

---

## 2. インターフェース定義

### 2.1 inputs

| name | required | default | type | 説明 |
|------|----------|---------|------|------|
| `setup-strategy` | false | `node-setup` | enum: `node-setup` \| `mise` | Node / pnpm のセットアップ経路 |
| `install` | false | `'true'` | boolean string | `pnpm install --frozen-lockfile` を実行するか |
| `node-version` | false | `24.15.0` | string | `setup-strategy=node-setup` 時に setup-node へ渡す version |
| `pnpm-version` | false | `10.33.2` | string | `pnpm/action-setup` に渡す version |
| `working-directory` | false | `.` | string | install を実行する CWD |

> boolean は composite では string で受け取り `if: inputs.install == 'true'` 形式で評価する。

### 2.2 outputs

| name | description | value source |
|------|-------------|--------------|
| `node-version` | 実セットアップした Node version | `node -v` の出力 |
| `pnpm-version` | 実セットアップした pnpm version | `pnpm -v` の出力 |
| `setup-strategy` | 採用した strategy | `${{ inputs.setup-strategy }}` |

---

## 3. action.yml 完全草案

```yaml
name: 'Setup Project (UBM-Hyogo)'
description: 'Composite action that consolidates checkout-less Node + pnpm (or mise) setup and frozen-lockfile install used across CI workflows.'

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

    # ---- node-setup strategy ----
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

    # ---- mise strategy ----
    - name: Setup mise (Node + pnpm from .mise.toml)
      if: inputs.setup-strategy == 'mise'
      uses: jdx/mise-action@v2
      with:
        cache: true

    # ---- install ----
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

    # ---- report ----
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

## 4. ステップ列挙表

| # | step name | 条件 | 主体 |
|---|-----------|------|------|
| 1 | Validate setup-strategy | 常時 | shell（enum 検証） |
| 2 | Setup pnpm (node-setup) | `setup-strategy=node-setup` | `pnpm/action-setup@v4` |
| 3 | Setup Node.js (node-setup) | `setup-strategy=node-setup` | `actions/setup-node@v4` |
| 4 | Setup mise | `setup-strategy=mise` | `jdx/mise-action@v2` |
| 5 | Install (node-setup) | `install=true` かつ node-setup | `pnpm install --frozen-lockfile` |
| 6 | Install (mise) | `install=true` かつ mise | `mise exec -- pnpm install --frozen-lockfile` |
| 7 | Report | 常時 | `$GITHUB_OUTPUT` 書出し |

---

## 5. 呼び出し側 contract（Phase 7 への引き継ぎ）

### 5.1 node-setup 系（6 job）

```yaml
- uses: actions/checkout@v4
- uses: ./.github/actions/setup-project
  # 既定値で OK（node-version=24.15.0 / pnpm-version=10.33.2 / install=true）
```

### 5.2 mise 系（pr-build-test の build-test job）

```yaml
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4
  with:
    ref: ${{ github.event.pull_request.head.sha }}
    persist-credentials: false
- uses: ./.github/actions/setup-project
  with:
    setup-strategy: mise
```

### 5.3 install を skip したい将来 job

```yaml
- uses: ./.github/actions/setup-project
  with:
    install: 'false'
```

---

## 6. 既存挙動の温存（CONST_004）

| 既存挙動 | 温存方法 |
|---------|----------|
| `cache: pnpm`（setup-node 内蔵） | composite 内の `actions/setup-node@v4` step で `cache: pnpm` を維持 |
| `mise-action.cache: true` | composite 内で `cache: true` を維持 |
| `version: 10.33.2` ピン | inputs の既定値で同値 |
| `node-version: 24.15.0` ピン | inputs の既定値で同値 |
| ci.yml の `'24'` 表記 | Phase 7 で `24.15.0` に正規化（branch protection contexts 名は不変） |
| pr-build-test の SHA pin | composite 内 `@v4` タグ統一とのトレードオフを Phase 5 で再確認 |

> ci.yml の `'24'` → `24.15.0` への正規化は CI 動作上等価（GitHub Actions の semver 解決ロジックで Node 24 系列の最新が選ばれるため）。required context 名 `ci` は workflow `name:` / job `name:` から派生するため不変。

---

## 7. 制約・リスクと対処

| # | リスク | 対処 |
|---|--------|------|
| R-01 | composite action 内の `@v4` タグ参照が UT-GOV-007 SHA pin policy に反する懸念 | UT-GOV-007 は呼出側 workflow 側に閉じた契約。composite 内部は Phase 5 で actionlint pin check を別途整備（Phase 8 で `pinact` 検討） |
| R-02 | `cache: pnpm` は setup-node 配下で `package-lock.json` / `pnpm-lock.yaml` を自動検出するが、composite 内の CWD で見つからない場合キャッシュが効かない | 既存と同じ root 配置のため挙動変わらず（既存 6 job も root で install） |
| R-03 | mise / node-setup の Node version 差で type 解決が変わる | 両 strategy で Node 24.15.0 に固定 |
| R-04 | `inputs.install` が string `'true'` / `'false'` 比較になるため typo 検知不能 | Validate step で将来 enum 化を Phase 8 backlog に積む |

---

## 8. DoD（Phase 4 完了条件）

| # | 条件 |
|---|------|
| D-01 | §3 の YAML 草案が yamllint 構文上 valid（実検証は Phase 5） |
| D-02 | inputs / outputs / steps が §2 / §4 と一致 |
| D-03 | 既存 7 job のセットアップが全て本 composite に変換可能（§5 contract が網羅） |
| D-04 | SHA pin / cache / mise の挙動温存方針が §6 / §7 で明文化 |

---

## 9. 引き継ぎ（Phase 5 へ）

| 項目 | 内容 |
|------|------|
| 設計確定物 | `action.yml` 草案（§3） |
| 環境準備で確認すること | `actionlint` / `yamllint` / `act`（任意）の導入 / 既存 lock 等 |
| 実装で作成するファイル | `.github/actions/setup-project/action.yml`（Phase 6） |
| 置換対象 | `.github/workflows/{lighthouse,e2e-tests,ci,pr-build-test}.yml`（Phase 7） |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 4
- task classification: implementation / NON_VISUAL (CI infra)
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

`.github/actions/setup-project/action.yml` の inputs / outputs / steps / 呼出 contract を確定し、Phase 5 環境準備 / Phase 6 実装 / Phase 7 置換に必要な設計成果物を揃える。

## 実行タスク

- §1 設計指針 D-01..D-08 を確定。
- §2 inputs / outputs を表で確定。
- §3 完全 YAML 草案を提示。
- §4 step 列挙を確定。
- §5 呼出 contract を 3 ケース提示。
- §6 既存挙動の温存方針を表で確定。
- §7 リスクと対処を整理。

## 参照資料

- docs/30-workflows/issue-627-composite-setup-action/index.md
- docs/30-workflows/issue-627-composite-setup-action/phase-1.md / phase-2.md / phase-3.md
- .github/workflows/{lighthouse,e2e-tests,ci,pr-build-test}.yml

## 実行手順

1. P-01..P-05 で着手前提確認。
2. §1 設計指針確定。
3. §2 / §3 / §4 で interface と YAML 草案確定。
4. §5 で呼出 contract、§6 で既存挙動温存方針、§7 でリスク対処確定。

## 統合テスト連携

- NON_VISUAL phase は actionlint / yamllint / list smoke を Playwright 代替とする。
- 実 GHA run による検証は Phase 9 / Phase 11 evidence で実施する。

## 成果物

- 本 phase markdown
- Phase 5 環境準備計画 / Phase 6 実装計画への引継ぎ表

## 完了条件

- [x] 仕様記述済: 必須セクションが存在する。
- [x] 仕様記述済: coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
