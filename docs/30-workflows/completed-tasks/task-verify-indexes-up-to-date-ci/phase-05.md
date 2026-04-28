# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | - |
| 実行種別 | serial |
| 作成日 | 2026-04-28 |
| 上流 | Phase 4 |
| 下流 | Phase 6 |
| 状態 | completed |

## 目的

Phase 2 の workflow 設計と Phase 4 の TC 表をもとに、`verify-indexes-up-to-date` を
実装する際の **手順 / ファイル一覧 / placeholder / sanity check** を確定する。
本 Phase は **仕様確定のみ**で、実装コミットは本タスクで行う。

## 新規作成 / 修正ファイル一覧（必須）

### 新規作成

| パス | 内容 | 行数目安 |
| --- | --- | --- |
| `.github/workflows/verify-indexes.yml` | 独立 workflow（job 名 `verify-indexes-up-to-date`） | 約 35〜45 行 |

### 修正

| パス | 修正内容 | 行数目安 |
| --- | --- | --- |
| `CLAUDE.md` | "よく使うコマンド" 節の `pnpm indexes:rebuild` 行末に "（CI gate `verify-indexes-up-to-date` で drift 検出）" を最小追記 | +1 行 |

### 修正検討（必要時のみ）

| パス | 修正内容 | 判断基準 |
| --- | --- | --- |
| `README.md` | 該当 section が存在する場合のみ CI バッジまたは gate 名を追記 | README に CI 章がある場合のみ |
| `doc/00-getting-started-manual/lefthook-operations.md` | post-merge 廃止節に「代替 gate = verify-indexes-up-to-date」の cross-reference 追記 | lefthook-operations.md が当該節を持つ場合のみ |

> **明示**: `lefthook.yml` には変更を加えない（AC-4 違反となるため）。

## workflow YAML 擬似コード（実装サンプル）

```yaml
name: verify-indexes-up-to-date

on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main, dev]

permissions:
  contents: read

concurrency:
  group: verify-indexes-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify-indexes-up-to-date:
    name: verify-indexes-up-to-date
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - name: Setup Node.js
        uses: actions/setup-node@v4
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

## runbook 手順（順序付き）

1. `feat/wt-5` ブランチを `bash scripts/new-worktree.sh` で作成
2. `.github/workflows/verify-indexes.yml` を上記擬似コード通りに新規作成
3. `CLAUDE.md` に最小追記（1 行）
4. ローカル sanity check（次節）
5. commit → push → draft PR
6. CI 上で `verify-indexes-up-to-date` job が緑になることを確認（AC-1 / AC-3）
7. 故意に index を 1 文字編集して push し、fail ログに `::error::index drift` が出ることを確認（AC-2）
8. 7 を revert し、再度緑になることを確認
9. draft → ready で PR review

## placeholder（secret / 環境変数）

| placeholder | 値 | 備考 |
| --- | --- | --- |
| Secrets | （なし） | **本 workflow は secrets を要求しない** |
| Variables | （なし） | GitHub Variables も不使用 |
| ENV | `NODE_VERSION=24`, `PNPM_VERSION=10.33.2` | yaml 内に直書き（.mise.toml と同期） |
| 1Password | （不使用） | `scripts/cf.sh` / `scripts/with-env.sh` を呼ばない |

> **重要**: Cloudflare API Token / OAuth Token / op:// 参照を **絶対に追加しない**。
> 本 gate は read-only な静的検証のみ。

## sanity check（ローカル）

```bash
# 1. 環境セットアップ
mise install
mise exec -- pnpm install

# 2. indexes 再生成
mise exec -- pnpm indexes:rebuild

# 3. drift がないことを確認
git add -N .claude/skills/aiworkflow-requirements/indexes
git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes && echo "OK: clean"

# 4. workflow ファイルの構文確認
yamllint .github/workflows/verify-indexes.yml || true
actionlint .github/workflows/verify-indexes.yml || true

# 5. act でローカル simulation
act -j verify-indexes-up-to-date -W .github/workflows/verify-indexes.yml

# 6. drift simulation
echo "// drift" >> .claude/skills/aiworkflow-requirements/indexes/<対象>.json
act -j verify-indexes-up-to-date -W .github/workflows/verify-indexes.yml
# → exit 1 と "::error::index drift" を確認
git checkout -- .claude/skills/aiworkflow-requirements/indexes
```

## CI gate 設定（実装後の手作業）

| 項目 | 値 |
| --- | --- |
| Repository Settings | Branch protection rules → main / dev |
| Required status checks | `verify-indexes-up-to-date` を追加 |
| Strict | optional（CI 全体ポリシーに準拠） |

> 本 Phase では **設定値を確定するのみ**で、実際の branch protection 更新は本タスク
> （task-github-governance-branch-protection-spec の運用ループ）に委譲。

## MINOR 申し送り対応（Phase 3 から）

| MINOR | 対応 |
| --- | --- |
| workflow file +1 | 採用済み。本 Phase で配置先・命名を確定（独立 file） |
| pnpm install オーバーヘッド | `cache: pnpm` で軽減（setup-node@v4 の組込 cache） |

## 実行タスク

1. 新規作成 / 修正ファイルパス一覧を `outputs/phase-05/main.md` に記載
2. workflow YAML 擬似コードを完全な状態で記載
3. runbook 9 手順を順序付きで記載
4. placeholder 表（secret 不要を明記）を記載
5. sanity check 6 手順を記載

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 2 outputs | YAML の正本 |
| 必須 | Phase 4 outputs | sanity check に使う TC |
| 必須 | .github/workflows/ci.yml | setup の参照 |
| 必須 | .mise.toml | バージョン正本 |
| 参考 | docs/30-workflows/task-github-governance-branch-protection-spec | required status checks の追加先 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | sanity check 失敗パターンを異常系として再利用 |
| Phase 7 | ファイル一覧 ↔ AC マトリクス |
| Phase 9 | 無料枠（Actions 月間分）見積もり |
| Phase 11 | 実機 PR での smoke evidence |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 不変条件 | #1〜#7 | 触れない |
| secret 不使用 | — | placeholder 表で確認 |
| read-only | — | `permissions: contents: read` のみ |
| post-merge 復活なし | — | lefthook.yml を変更しない（AC-4） |

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | ファイル一覧（新規/修正/修正検討） | completed | 3 群 |
| 2 | YAML 擬似コード | completed | 完成形 |
| 3 | runbook 9 手順 | completed | 順序付き |
| 4 | placeholder 表 | completed | secret 不要明記 |
| 5 | sanity check 6 手順 | completed | act 含む |
| 6 | MINOR 申し送り対応 | completed | 2 件 |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-05/main.md | ファイル一覧 + YAML + runbook + placeholder + sanity |

## 完了条件

- [ ] 新規 / 修正 / 修正検討の 3 群が明示
- [ ] YAML 擬似コードがそのまま実装に使える状態
- [ ] runbook が 9 手順で完結
- [ ] secret 不要が placeholder 表に明記
- [ ] sanity check が act を含む

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 completed
- [ ] outputs/phase-05/main.md 配置済み
- [ ] artifacts.json の Phase 5 を completed

## 次 Phase

- 次: Phase 6 (異常系検証)
- 引き継ぎ事項: 実装サンプル + sanity 失敗時の挙動仕様
- ブロック条件: secret 不要の明記が無ければ Phase 6 に進めない
