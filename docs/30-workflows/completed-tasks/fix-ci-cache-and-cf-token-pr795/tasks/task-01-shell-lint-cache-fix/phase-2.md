# Phase 2 — 設計 (task-01)

ワークフロー Phase 2 (`outputs/phase-2/phase-2.md` §Task 01) の採用案 **A1** を実装可能粒度に展開する。

## 採用設計 (A1)

`.github/actions/setup-project/action.yml` に新 input `cache` を追加し、`actions/setup-node@v4` step の `cache:` 値にそのまま渡す。呼出側 (`ci.yml` の `workflow-shell-lint` job) で `install: 'false'` と同時に `cache: ''` を渡し cache 機構を無効化する。

### input 仕様

| 属性 | 値 |
| ---- | -- |
| 名前 | `cache` |
| description | `Cache strategy passed to actions/setup-node. Use empty string to disable.` |
| required | `false` |
| default | `'pnpm'` |
| 取り得る値 | `'pnpm'` / `'npm'` / `'yarn'` / `''` (無効化) |

`actions/setup-node@v4` の `cache` 入力は string 型で空文字渡しが doc 上 cache 無効化を意味する canonical な経路。

## before / after (YAML 断片)

### `.github/actions/setup-project/action.yml`

**before** (L21-24, inputs ブロック末尾):

```yaml
  working-directory:
    description: 'Working directory used when invoking pnpm install.'
    required: false
    default: '.'
```

**after**:

```yaml
  working-directory:
    description: 'Working directory used when invoking pnpm install.'
    required: false
    default: '.'
  cache:
    description: 'Cache strategy passed to actions/setup-node (node-setup path). Use empty string to disable.'
    required: false
    default: 'pnpm'
```

---

**before** (L57-62, Setup Node.js step):

```yaml
    - name: Setup Node.js (node-setup)
      if: inputs.setup-strategy == 'node-setup'
      uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: pnpm
```

**after**:

```yaml
    - name: Setup Node.js (node-setup)
      if: inputs.setup-strategy == 'node-setup'
      uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: ${{ inputs.cache }}
```

### `.github/workflows/ci.yml`

**before** (L25-29, `workflow-shell-lint` job):

```yaml
      - name: Setup project
        uses: ./.github/actions/setup-project
        with:
          node-version: '24'
          install: 'false'
```

**after**:

```yaml
      - name: Setup project
        uses: ./.github/actions/setup-project
        with:
          node-version: '24'
          install: 'false'
          cache: ''
```

## 後方互換性

`cache` input の default を `'pnpm'` としたため、既存 caller (合計 9 箇所、後述) は引数追加不要で従来通り pnpm cache が有効化される。

### 影響する caller 一覧

| Path | Line | install 値 | cache 期待値 | 修正要否 |
| ---- | ---- | ---------- | ----------- | -------- |
| `.github/workflows/ci.yml` | 26 | `'false'` | 無効化 | **本 PR で `cache: ''` 追加** |
| `.github/workflows/ci.yml` | 103 | default `'true'` | `pnpm` | 不要 (default) |
| `.github/workflows/ci.yml` | 223 | default `'true'` | `pnpm` | 不要 (default) |
| `.github/workflows/pr-build-test.yml` | 44 | default `'true'` | `pnpm` | 不要 |
| `.github/workflows/verify-stable-key-update.yml` | 24 | default `'true'` | `pnpm` | 不要 |
| `.github/workflows/e2e-tests.yml` | 31 | default `'true'` | `pnpm` | 不要 |
| `.github/workflows/e2e-tests.yml` | 96 | default `'true'` | `pnpm` | 不要 |
| `.github/workflows/playwright-visual-full.yml` | 56 | default `'true'` | `pnpm` | 不要 |
| `.github/workflows/playwright-visual-baseline-update.yml` | 22 | default `'true'` | `pnpm` | 不要 |

## 不採用案

| 案 | 不採用理由 |
| -- | --------- |
| A2: `workflow-shell-lint` を `actions/setup-node@v4` 直呼びに切替 | composite 再利用性を損ない、SHA pin の重複管理が発生 |
| A3: post-cleanup を `continue-on-error` で握り潰し | 根本原因隠蔽。将来の真の cache fail を検知不能化 |

## state ownership

| step | owner | 引き渡し |
| ---- | ----- | -------- |
| composite YAML 編集 | 実装者 | git diff |
| ci.yml 呼出側編集 | 実装者 | git diff |
| 構文検証 | 実装者 | `actionlint` 出力 |
| CI 再実行 | GitHub Actions | `gh run watch` |
| Green 確認 | 実装者 | `gh run view --log` |

## ライブラリ / external action 確認

| ライブラリ | バージョン | 確認事項 |
| ---------- | ---------- | -------- |
| `actions/setup-node` | v4 (`49933ea`) | `cache:` 入力に空文字渡しで cache 機構自体が起動しない (post-cleanup も発火せず) |
| `pnpm/action-setup` | v4 (`b906affc`) | 本 PR では非変更 |

## リスク

| リスク | 緩和策 |
| ------ | ------ |
| `cache: ''` が他バージョンで挙動変化 | SHA pin で固定済み、`actions/setup-node@49933ea` の挙動が canonical |
| YAML indent ミス | actionlint で構文検証、CI 実行で動作検証 |
| 他 caller への波及 | default `'pnpm'` で後方互換、Phase 6 で grep gate |
