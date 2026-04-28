# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| Wave | - |
| 実行種別 | serial |
| 作成日 | 2026-04-28 |
| 上流 | Phase 1 |
| 下流 | Phase 3 |
| 状態 | completed |

## 目的

Phase 1 で確定した要件に基づき、`verify-indexes.yml` の **workflow 構造 / step / dependency matrix / fail パス** を確定する。

## 全体フロー（Mermaid）

```mermaid
flowchart TD
  A[PR opened/sync<br/>or push to main] --> B[GitHub Actions trigger<br/>verify-indexes.yml]
  B --> C[actions/checkout@v4<br/>fetch-depth: 0]
  C --> D[pnpm/action-setup@v4<br/>version: 10.33.2]
  D --> E[actions/setup-node@v4<br/>node-version: 24<br/>cache: pnpm]
  E --> F[pnpm install --frozen-lockfile]
  F --> G[pnpm indexes:rebuild]
  G --> H{git diff --exit-code<br/>-- .claude/skills/aiworkflow-requirements/indexes}
  H -->|diff なし| I[PASS]
  H -->|diff あり| J[git status --short<br/>git diff --name-only<br/>を出力]
  J --> K[FAIL]
```

## workflow 構成案

### 採用: 独立 workflow file `.github/workflows/verify-indexes.yml`

```yaml
# 設計サンプル（実装は本タスク）
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

### 採用根拠

- **責務分離**: ci.yml に混ぜると job 失敗時の責務境界が曖昧になる。独立 file は `git revert` で 1 コミット撤去可能
- **trigger の独立性**: ci.yml は build / typecheck の trigger を持つが、本 gate は indexes 配下が変わらない PR でも一律実行する必要がある
- **可読性**: workflow 名 = gate の意味そのもので、Required Status Checks 設定時に発見しやすい
- **将来拡張**: 他 skill の indexes 検証を追加する際にも同 file 内 job として並列追加できる

## step 詳細設計

| step | 目的 | 失敗時の意味 |
| --- | --- | --- |
| checkout | fetch-depth: 0 で diff 取得を担保 | リポ取得失敗 → infra 障害 |
| pnpm setup | バージョン固定 (10.33.2) | mise と同じ版を使う |
| node setup | Node 24 + pnpm cache | CLAUDE.md の `mise exec --` 環境を CI で再現 |
| install | `--frozen-lockfile` で lockfile drift を別途検出 | lockfile 不整合 |
| rebuild | `pnpm indexes:rebuild` 実行 | 生成スクリプト自体の bug |
| detect | `git add -N` 後に `git diff --exit-code` で tracked/untracked drift を検出 | **本 gate の唯一の判定 step** |

## env / 依存マトリクス

| 区分 | キー | 値 / 配置 | 担当 |
| --- | --- | --- | --- |
| Action | actions/checkout | v4 | GitHub 公式 |
| Action | pnpm/action-setup | v4 | pnpm 公式 |
| Action | actions/setup-node | v4 | GitHub 公式 |
| ランタイム | Node | 24 (.mise.toml と同期) | mise / setup-node |
| ランタイム | pnpm | 10.33.2 (.mise.toml と同期) | pnpm/action-setup |
| script | pnpm indexes:rebuild | package.json | 既存 |
| 監視パス | `.claude/skills/aiworkflow-requirements/indexes` | リポ内 | 既存 |
| 環境変数 | （なし） | — | secrets 不使用 |

## dependency matrix（既存 workflow との独立性）

| from \ to | ci.yml | backend-ci.yml | web-cd.yml | validate-build.yml | verify-indexes.yml |
| --- | --- | --- | --- | --- | --- |
| ci.yml | — | | | | （独立） |
| backend-ci.yml | | — | | | （独立） |
| web-cd.yml | | | — | | （独立） |
| validate-build.yml | | | | — | （独立） |
| verify-indexes.yml | | | | | — |

→ どの workflow とも `needs:` 関係なし。concurrency group も独立 (`verify-indexes-${{ github.ref }}`)。

## 監視対象パス確定

`.claude/skills/aiworkflow-requirements/indexes/`（ディレクトリ単位で `git diff --exit-code` の引数）。
references / scripts / SKILL.md は対象外（誤検出回避）。

## 失敗時のログ仕様

fail 時 stderr に必須出力:

1. `::error::index drift detected. Run 'pnpm indexes:rebuild' locally and commit the result.`
2. `git diff --name-only -- .claude/skills/aiworkflow-requirements/indexes` の出力（変更ファイル一覧）
3. `git status --short`（参考情報）

→ 開発者が PR 上で「どの index を再生成すれば直るか」を即座に判断できる。

## 実行タスク

1. Mermaid 全体フロー図を `outputs/phase-02/main.md` に貼る
2. workflow YAML サンプルを記載（実装は本タスク）
3. 採用根拠（独立 file vs ci.yml job 追加）を整理
4. step 詳細表 / env / dependency matrix を記載
5. 失敗時ログ仕様を確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 1 | 真の論点 + inventory |
| 必須 | .github/workflows/ci.yml | setup 流用元 |
| 必須 | .mise.toml | Node / pnpm バージョン正本 |
| 必須 | package.json | `indexes:rebuild` script 定義 |
| 参考 | docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci.md | 元タスク指示書 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | alternative 案の比較対象 |
| Phase 4 | 連続 2 回実行 test / 意図的 drift fail test |
| Phase 5 | runbook 章立て（workflow 配置 → push → PR 検証） |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 不変条件 | #1〜#7 | 触れない |
| secret 不使用 | — | secrets / OAuth / Cloudflare token は使わない |
| 無料枠 | — | GitHub Actions 無料枠で完結 |
| 既存 CI 衝突 | — | 独立 file + 独立 concurrency group |
| docs + CI | — | 仕様書のみ作成、workflow 実装は本タスク |

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | Mermaid フロー図 | completed | PR → diff 検出までの直線フロー |
| 2 | workflow YAML サンプル | completed | 設計用、実装は本タスク |
| 3 | step 詳細表 | completed | 6 step |
| 4 | env / dep matrix | completed | 既存 4 workflow と独立 |
| 5 | 失敗時ログ仕様 | completed | name-only + status |
| 6 | 採用根拠 | completed | 独立 file の優位性 4 点 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | Mermaid + YAML サンプル + matrix |

## 完了条件

- [ ] Mermaid フロー図完成
- [ ] workflow YAML サンプル完成
- [ ] step 詳細表 + env matrix 完成
- [ ] 失敗時ログ仕様確定
- [ ] 独立 file 採用根拠が明文化

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 completed
- [ ] outputs/phase-02/main.md 配置済み
- [ ] artifacts.json の Phase 2 を completed

## 次 Phase

- 次: Phase 3 (設計レビュー)
- 引き継ぎ事項: 採用案（独立 workflow file）+ YAML サンプル + 失敗時ログ仕様
- ブロック条件: 既存 4 workflow との独立性が確認できなければ Phase 3 に進めない
