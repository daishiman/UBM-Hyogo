# Phase 3: アーキテクチャ設計（Issue #627 Composite setup action）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` / `phase-2.md` |
| 出力 | `action.yml` 構造設計 / SHA pin 表 / cache 戦略 / 呼び出し側スニペット |

---

## 1. `.github/actions/setup-project/action.yml` 構造

### 1.1 トップレベル

| key | 値 |
|-----|----|
| `name` | `Setup Project (Node + pnpm + install)` |
| `description` | `Composite action that sets up Node / pnpm via either setup-node or mise, then optionally runs pnpm install --frozen-lockfile.` |
| `inputs` | 5 件（phase-2 §2.1） |
| `outputs` | 3 件（phase-2 §2.2） |
| `runs.using` | `composite` |
| `runs.steps` | 7 step（後述） |

### 1.2 inputs YAML スニペット

```yaml
inputs:
  setup-strategy:
    description: "Setup setup-strategy. Either 'setup-node' (default) or 'mise'."
    required: false
    default: 'setup-node'
  node-version:
    description: "Node version when setup-strategy=setup-node. Ignored for setup-strategy=mise."
    required: false
    default: '24.15.0'
  pnpm-version:
    description: "pnpm version when setup-strategy=setup-node. Ignored for setup-strategy=mise."
    required: false
    default: '10.33.2'
  install:
    description: "Whether to run `pnpm install --frozen-lockfile` after setup."
    required: false
    default: 'true'
  install-args:
    description: "Extra args to pnpm install (default `--frozen-lockfile`)."
    required: false
    default: '--frozen-lockfile'
```

### 1.3 outputs YAML スニペット

```yaml
outputs:
  node-version:
    description: "Resolved Node version (node --version output)."
    value: ${{ steps.report.outputs.node-version }}
  pnpm-version:
    description: "Resolved pnpm version (pnpm --version output)."
    value: ${{ steps.report.outputs.pnpm-version }}
  setup-strategy:
    description: "Engine that was used (echo of inputs.setup-strategy)."
    value: ${{ inputs.setup-strategy }}
```

### 1.4 runs.steps（7 step）

| # | id | uses / run | shell / if | 概要 |
|---|----|------------|------------|------|
| 1 | `validate` | `run: |` | `shell: bash` | `inputs.setup-strategy` が `setup-node` または `mise` でなければ exit 1 |
| 2 | `setup-pnpm` | `pnpm/action-setup@<SHA> # v4` | `if: inputs.setup-strategy == 'setup-node'` | pnpm CLI を `inputs.pnpm-version` で配置 |
| 3 | `setup-node` | `actions/setup-node@<SHA> # v4` | `if: inputs.setup-strategy == 'setup-node'` | `node-version: ${{ inputs.node-version }}` / `cache: pnpm` |
| 4 | `setup-mise` | `jdx/mise-action@<SHA> # v2` | `if: inputs.setup-strategy == 'mise'` | `with: { cache: true }` |
| 5 | `install-setup-node` | `run: pnpm install ${{ inputs.install-args }}` | `shell: bash` / `if: inputs.install == 'true' && inputs.setup-strategy == 'setup-node'` | install |
| 6 | `install-mise` | `run: mise exec -- pnpm install ${{ inputs.install-args }}` | `shell: bash` / `if: inputs.install == 'true' && inputs.setup-strategy == 'mise'` | install |
| 7 | `report` | `run: \| echo "node-version=$(node --version)" >> "$GITHUB_OUTPUT" ...` | `shell: bash` | `node --version` / `pnpm --version` を outputs に書き出す（mise の場合は `mise exec -- node --version`） |

---

## 2. SHA pin 表（UT-GOV-007 整合）

| action | pinned SHA | 表示 version | 出典 |
|--------|-----------|-------------|------|
| `pnpm/action-setup` | _Phase 5 で確定_（spec_created 時点では `@v4` で表記） | v4 | 現行 `lighthouse.yml` 等で `@v4` 利用中 |
| `actions/setup-node` | _Phase 5 で確定_ | v4 | 同上 |
| `jdx/mise-action` | `5083fe46898c414b2475087cc79da59e7da859e8` | v2 | `pr-build-test.yml` 既存 pin |
| `actions/checkout` | `b4ffde65f46336ab88eb53be808477a3936bae11` | v4 | `pr-build-test.yml` 既存 pin（composite 対象外だが呼び出し側で参照） |

> `pnpm/action-setup` / `actions/setup-node` の SHA は Phase 5 で実 commit を解決して固定する。spec_created 時点では `@v4` 表記とし、PR 時点で SHA に差し替える。

---

## 3. cache 戦略

| setup-strategy | cache 経路 | key 構成 | TTL / scope |
|--------|-----------|----------|-------------|
| `setup-node` | `actions/setup-node@v4` 内蔵 `cache: pnpm` | `pnpm-lock.yaml` hash + OS + Node version | GitHub Actions cache（branch scope） |
| `mise` | `jdx/mise-action` の `cache: true` | `.mise.toml` hash + OS | 同上 |

### 3.1 cache 衝突回避

- `setup-node` 系統と `mise` 系統は **cache key 名前空間が異なる**ため、同一 repo 内に共存しても衝突しない（`setup-node--*` vs `mise-tools--*` という actions 内部 prefix 違い）。
- pnpm store は両系統で共通だが、`pnpm install --frozen-lockfile` は store ↔ `node_modules` の整合性を lockfile から再構築するため、cross-setup-strategy の cache hit でも壊れない設計。

### 3.2 cache miss 時の degradation

- cache miss でも install は完走する（最大 +30 秒程度）。hard failure にはしない。

---

## 4. 呼び出し側スニペット例

### 4.1 `lighthouse.yml`（setup-node + install）

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Setup project
    uses: ./.github/actions/setup-project
  - name: Build (Next.js production)
    run: pnpm --filter @ubm-hyogo/web build
  # ...
```

### 4.2 `ci.yml`（既存 step-level if を維持）

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Check implementation readiness
    id: ready
    run: |
      if [ -f "package.json" ] && [ -f "pnpm-workspace.yaml" ]; then
        echo "value=true" >> "$GITHUB_OUTPUT"
      else
        echo "value=false" >> "$GITHUB_OUTPUT"
      fi
  - name: Setup project
    if: steps.ready.outputs.value == 'true'
    uses: ./.github/actions/setup-project
  - name: Type check
    if: steps.ready.outputs.value == 'true'
    run: pnpm typecheck
```

### 4.3 `workflow-shell-lint`（install:'false'）

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Install shellcheck
    run: sudo apt-get update && sudo apt-get install -y shellcheck
  - name: Setup project
    uses: ./.github/actions/setup-project
    with:
      install: 'false'
  - name: Bash syntax for observation reminder
    run: bash -n scripts/observation/create-reminder-issue.sh
```

### 4.4 `pr-build-test.yml`（setup-strategy:'mise'）

```yaml
steps:
  - name: Checkout PR head
    uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4
    with:
      ref: ${{ github.event.pull_request.head.sha }}
      persist-credentials: false
  - name: Setup project
    uses: ./.github/actions/setup-project
    with:
      setup-strategy: 'mise'
  - name: Type check
    run: mise exec -- pnpm typecheck
```

---

## 5. 4-condition gate 評価

| # | 条件 | 評価 | 根拠 |
|---|------|------|------|
| C1 | 受入基準が測定可能 | PASS (spec_created / design verified) | AC-627-1..7 が `actionlint` / `gh run` / `git diff --stat` / `gh api branches/.../protection` で機械検証可能 |
| C2 | 不変条件と矛盾しない | PASS (spec_created / design verified) | branch protection 不変（AC-627-6）/ untrusted context での secrets 非接触（phase-2 §4）/ `.mise.toml` 正本値整合 |
| C3 | 依存タスクが解決済み | PASS (spec_created / design verified) | 3a / 3b 稼働済（index.md §1）。RB-01 完了済 |
| C4 | リスクと緩和策が一対 | PASS (spec_created / design verified) | phase-2 §6 で 5 リスク全てに緩和策が 1 対 1 紐付 |

---

## 6. blocking dependencies

| ID | 内容 | 解消条件 |
|----|------|----------|
| BLK-01 | `pnpm/action-setup` / `actions/setup-node` の SHA pin 値未確定 | Phase 5 で `gh api repos/pnpm/action-setup/git/refs/tags/v4` 等で解決し commit |
| BLK-02 | composite action の呼び出しは `actions/checkout` 済みでないと `./.github/actions/setup-project` を解決できない | 呼び出し側 step 順を「checkout → setup-project」に統一（phase-2 §1） |
| BLK-03 | step-level `if:` を持つ既存 `ci` / `coverage-gate` job で composite を呼ぶと、composite 内 step に `if` 連鎖が必要 | 呼び出し側 step に `if:` を維持し、composite 内 step では `inputs.install` で分岐する設計（§1.4） |

---

## 7. solo policy / governance 整合

| 観点 | 値 | 整合 |
|------|----|------|
| `required_pull_request_reviews` | `null` 維持（本 PR は変更しない） | OK |
| required contexts | `ci` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate` / `build-test` / `workflow-shell-lint` を **完全保存** | OK（AC-627-6） |
| CODEOWNERS | `.github/workflows/**` は `@daishiman`（CLAUDE.md governance §1） | OK（`.github/actions/**` も同 owner 想定） |
| secrets 接触 | composite 内で `secrets.*` 参照なし | OK（phase-2 §2.4） |

---

## 8. GO / NO-GO

| 観点 | 判定 |
|------|------|
| 設計の一貫性 | GO |
| 受入基準の検証可能性 | GO |
| solo dev policy 整合 | GO |
| 3a / 3b 依存解消 | GO |
| SHA pin 確定（Phase 5 で実施） | CONDITIONAL（Phase 5 着手時点で解決） |

### 結論

**GO**（SHA pin 確定は Phase 5 で行う設計上の作業として既知化。Phase 4 着手前 blocker ではない）。

---

## 9. DoD（Phase 3 完了条件）

| # | 条件 |
|---|------|
| D-01 | `action.yml` の inputs / outputs / runs.steps 構造が YAML スニペットで提示されている |
| D-02 | SHA pin 表（4 actions）が記載され、未確定箇所が明示されている |
| D-03 | cache 戦略が setup-strategy 別に記載され、衝突回避と miss 時挙動が明文化されている |
| D-04 | 呼び出し側スニペットが 4 系統（lighthouse / ci / workflow-shell-lint / pr-build-test）提示されている |
| D-05 | 4-condition gate / BLK / solo policy / GO 判定が記載されている |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 3
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

`setup-project` composite action の YAML 構造・SHA pin・cache 戦略・呼び出し側スニペットを確定し、Phase 4 詳細設計と Phase 5 実装に渡せる完成度に到達させる。

## 実行タスク

- `action.yml` の inputs / outputs / runs.steps を YAML スニペット付きで確定する。
- SHA pin 表を 4 actions 分作成し、未確定箇所を Phase 5 タスクとして引き継ぐ。
- setup-strategy 別 cache 戦略を表化する。
- 呼び出し側スニペットを 4 系統提示する。
- 4-condition gate / BLK / solo policy で GO/NO-GO を判定する。

## 参照資料

- phase-1.md / phase-2.md（本サブタスク内）
- .github/workflows/pr-build-test.yml（SHA pin 先行事例）
- docs/30-workflows/completed-tasks/ut-gov-007-action-sha-pin/（SHA pin policy）
- .claude/skills/task-specification-creator/references/phase-template-core.md

## 実行手順

1. phase-2 の inputs/outputs を YAML スニペット化する。
2. runs.steps 7 step の if / shell / id を表化する。
3. SHA pin 表を作成し、Phase 5 で確定する SHA を identify する。
4. cache 戦略を setup-strategy 別に整理する。
5. 呼び出し側スニペットを 4 系統作成する。
6. 4-condition gate を評価し GO 判定を出す。

## 統合テスト連携

- NON_VISUAL phase のため Playwright 実行なし。Phase 8 で actionlint / yamllint / list smoke、Phase 9 で draft PR 実 run 検証。
- evidence は `outputs/phase-11/` に保存する。

## 成果物

- 本 phase markdown
- Phase 4 詳細設計（input validation エッジケース / 7 step の冪等性検証）への引き継ぎ

## 完了条件

- [x] 仕様記述済: 必須セクションが存在する。
- [x] 仕様記述済: coverage AC 適用: standard tier lines >= 70%（本タスク自体は NON_VISUAL）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
