# Phase 2: 設計 — main.md

## 1. 設計サマリ

Phase 1 で確定した要件に基づき、`.github/workflows/verify-indexes.yml` の **独立 workflow file** として CI gate を設計する。
job 名 `verify-indexes-up-to-date` / concurrency `verify-indexes-${{ github.ref }}` で既存 4 workflow と完全独立に運用する。

## 2. 全体フロー（Mermaid）

```mermaid
flowchart TD
  A[PR opened/sync<br/>or push to main/dev] --> B[GitHub Actions trigger<br/>verify-indexes.yml]
  B --> C[actions/checkout@v4]
  C --> D[pnpm/action-setup@v4<br/>version: 10.33.2]
  D --> E[actions/setup-node@v4<br/>node-version: 24<br/>cache: pnpm]
  E --> F[pnpm install --frozen-lockfile]
  F --> G[pnpm indexes:rebuild]
  G --> H[git add -N .claude/skills/aiworkflow-requirements/indexes]
  H --> I{git diff --exit-code<br/>-- .claude/skills/aiworkflow-requirements/indexes}
  I -->|diff なし| J[PASS exit 0]
  I -->|diff あり| K[::error::index drift detected<br/>+ git diff --name-only<br/>+ git status --short]
  K --> L[FAIL exit 1]
```

## 3. workflow YAML サンプル（実装は本タスク）

```yaml
name: verify-indexes-up-to-date

on:
  workflow_dispatch:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main, dev]

concurrency:
  group: verify-indexes-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify-indexes-up-to-date:
    name: verify-indexes-up-to-date
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Rebuild indexes
        run: pnpm indexes:rebuild
      - name: Detect drift
        run: |
          git add -N .claude/skills/aiworkflow-requirements/indexes
          if ! git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes; then
            echo "::error::index drift detected. Run 'pnpm indexes:rebuild' locally and commit the result."
            echo "--- changed files ---"
            git diff --name-only -- .claude/skills/aiworkflow-requirements/indexes
            echo "--- git status ---"
            git status --short
            exit 1
          fi
```

## 4. 採用根拠（独立 workflow file vs ci.yml 内 job 追加）

1. **責務分離**: `ci.yml` に混ぜると build / typecheck と gate が同居し、failure 時の責務境界が曖昧になる。独立 file は `git revert` 1 つで完全撤去可能。
2. **trigger 独立**: 本 gate は indexes 配下を変更しない PR でも一律実行する必要があり、ci.yml の trigger 条件と将来ずれた際の分離コストが高い。最初から独立させる方が運用が単純。
3. **可読性**: workflow 名 = gate 意味で、Required Status Checks 設定画面で発見しやすい。
4. **将来拡張性**: 他 skill の indexes 検証を追加する際にも同 file 内 job として並列追加できる。

## 5. step 詳細設計（6 step）

| # | step | 目的 | 失敗時の意味 |
| --- | --- | --- | --- |
| 1 | `actions/checkout@v4` | リポジトリ取得（差分判定に必要） | infra 障害 |
| 2 | `pnpm/action-setup@v4` (10.33.2) | pnpm バイナリ固定 | バージョン不整合 |
| 3 | `actions/setup-node@v4` (Node 24, cache: pnpm) | Node 24 + pnpm キャッシュ有効化 | mise 環境再現失敗 |
| 4 | `pnpm install --frozen-lockfile` | 依存導入 + lockfile drift 別途検出 | lockfile 不整合 |
| 5 | `pnpm indexes:rebuild` | 生成本体（`generate-index.js`）実行 | スクリプトの bug |
| 6 | drift 検出（`git add -N` + `git diff --exit-code -- <indexes>`） | **本 gate の唯一の判定 step** | drift 検出 → fail |

## 6. env / 依存マトリクス

| 区分 | キー | 値 / 配置 | 担当 |
| --- | --- | --- | --- |
| Action | `actions/checkout` | `v4` | GitHub 公式 |
| Action | `pnpm/action-setup` | `v4`（pnpm 10.33.2 を install） | pnpm 公式 |
| Action | `actions/setup-node` | `v4`（Node 24 / cache: pnpm） | GitHub 公式 |
| Runtime | Node | `24.15.0`（`.mise.toml` と同期） | setup-node |
| Runtime | pnpm | `10.33.2`（`.mise.toml` と同期） | action-setup |
| Script | `pnpm indexes:rebuild` | `package.json` 既存 | 既存 |
| 監視パス | `.claude/skills/aiworkflow-requirements/indexes` | リポ内 | 既存 |
| Secrets | （なし） | — | 本 gate は外部 API / Cloudflare に触れない |

## 7. dependency matrix（既存 4 workflow との独立性）

| from \ to | ci.yml | backend-ci.yml | web-cd.yml | validate-build.yml | verify-indexes.yml |
| --- | --- | --- | --- | --- | --- |
| ci.yml | — | 独立 | 独立 | 独立 | **独立** |
| backend-ci.yml | 独立 | — | 独立 | 独立 | **独立** |
| web-cd.yml | 独立 | 独立 | — | 独立 | **独立** |
| validate-build.yml | 独立 | 独立 | 独立 | — | **独立** |
| verify-indexes.yml | **独立** | **独立** | **独立** | **独立** | — |

→ どの workflow とも `needs:` 関係なし。concurrency group も独立 (`verify-indexes-${{ github.ref }}`)。

## 8. 監視対象パス確定

`.claude/skills/aiworkflow-requirements/indexes/` 配下のみを対象とする（`git diff` の path 引数で限定）。
references / scripts / SKILL.md は対象外（誤検出回避、AC-7 担保）。

未追跡 index も検出するため、`git diff` 直前に `git add -N` を実行（Git の intent-to-add）。

## 9. 失敗時のログ仕様

job が fail する際、以下を順序通りに出力する:

1. `::error::index drift detected. Run 'pnpm indexes:rebuild' locally and commit the result.`
2. `--- changed files ---` 区切り + `git diff --name-only -- .claude/skills/aiworkflow-requirements/indexes`
3. `--- git status ---` 区切り + `git status --short`
4. `exit 1`

→ 開発者が PR 上で「どの index を再生成すれば直るか」を即座に判断できる。

## 10. 不変条件チェック

- CLAUDE.md 不変条件 #1〜#7 に触れない（CI gate 追加のみ）
- secrets / OAuth / Cloudflare token は使用しない
- D1 / wrangler / Google Forms API に触れない
- GitHub Actions 無料枠で完結

## 11. 申し送り（Phase 3 へ）

- 採用案: 独立 workflow file `.github/workflows/verify-indexes.yml`
- 比較対象: ci.yml 内 job 追加（案 B） / pre-commit のみ（案 C） / post-merge 復活（案 D）
- 連続 2 回実行 test 戦略は Phase 4 へ申し送り
- file +1 と pnpm install オーバーヘッドは MINOR 候補として Phase 3 で評価

## 12. 完了条件チェック

- [x] Mermaid フロー図完成
- [x] workflow YAML サンプル完成
- [x] step 詳細表（6 step）+ env matrix 完成
- [x] dependency matrix で既存 4 workflow との独立性確認済
- [x] 失敗時ログ仕様確定
- [x] 独立 file 採用根拠 4 点が明文化
