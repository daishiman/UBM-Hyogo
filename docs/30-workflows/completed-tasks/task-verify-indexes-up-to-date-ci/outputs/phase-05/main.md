# Phase 5 — 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase | 5 / 13 |
| 状態 | completed |
| 上流 | Phase 4（TC 表 / read-only 認可境界） |
| 下流 | Phase 6（異常系検証） |

## 結論サマリ

`.github/workflows/verify-indexes.yml`（独立 workflow / 約 40 行）を新規追加し、
`pnpm indexes:rebuild` 実行後の `git add -N` + `git diff --exit-code` で indexes の
drift を検出する。secret は一切要求しない read-only gate。`lefthook.yml` には触れない。

## 新規作成 / 修正ファイル一覧

### 新規作成

| パス | 内容 | 行数目安 |
| --- | --- | --- |
| `.github/workflows/verify-indexes.yml` | 独立 workflow（job 名 `verify-indexes-up-to-date`） | 約 35〜45 行 |

### 修正

| パス | 修正内容 | 行数目安 |
| --- | --- | --- |
| `CLAUDE.md` | "よく使うコマンド" 節の `pnpm indexes:rebuild` 行末に「（CI gate `verify-indexes-up-to-date` で drift 検出）」を最小追記 | +1 行 |

### 修正検討（必要時のみ）

| パス | 修正内容 | 判断基準 |
| --- | --- | --- |
| `README.md` | CI バッジまたは gate 名追記 | README に CI 章がある場合のみ |
| `doc/00-getting-started-manual/lefthook-operations.md` | post-merge 廃止節に「代替 gate = verify-indexes-up-to-date」cross-reference | 該当節を持つ場合のみ |

> **AC-4 厳守**: `lefthook.yml` には変更を加えない。

## workflow YAML 実装サンプル（最終形）

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
          node-version: 24.15.0
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

## runbook 手順（順序付き 9 step）

1. `bash scripts/new-worktree.sh feat/wt-5` でブランチ作成
2. `.github/workflows/verify-indexes.yml` を上記 YAML 通りに新規作成
3. `CLAUDE.md` の `pnpm indexes:rebuild` 行に CI gate 言及を 1 行追記
4. ローカル sanity check（次節 6 step）を全通過
5. `git add .github/workflows/verify-indexes.yml CLAUDE.md` → commit → push → draft PR
6. CI 上で `verify-indexes-up-to-date` job が緑になることを確認（AC-1 / AC-3）
7. 故意に index を 1 文字編集して push し、fail ログに `::error::index drift detected` が出ることを確認（AC-2）
8. step 7 を revert し、再度緑になることを確認
9. draft → ready で PR review

## placeholder（secret / 環境変数）

| placeholder | 値 | 備考 |
| --- | --- | --- |
| Secrets | （なし） | **本 workflow は secrets を要求しない** |
| Variables | （なし） | GitHub Variables も不使用 |
| ENV | `node-version: 24.15.0`, `pnpm version: 10.33.2` | yaml 内に直書き（.mise.toml と同期） |
| 1Password | （不使用） | `scripts/cf.sh` / `scripts/with-env.sh` を呼ばない |

> **重要**: Cloudflare API Token / OAuth Token / op:// 参照を **絶対に追加しない**。

## sanity check（ローカル 6 step）

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

# 6. drift simulation（exit 1 + ::error::index drift を確認）
echo "// drift" >> .claude/skills/aiworkflow-requirements/indexes/<対象>.json
act -j verify-indexes-up-to-date -W .github/workflows/verify-indexes.yml
git checkout -- .claude/skills/aiworkflow-requirements/indexes
```

## CI gate 設定（実装後の手作業）

| 項目 | 値 |
| --- | --- |
| Repository Settings | Branch protection rules → main / dev |
| Required status checks | `verify-indexes-up-to-date` を追加 |
| Strict | optional（CI 全体ポリシーに準拠） |

> 本 Phase では設定値の確定のみ。実際の branch protection 更新は
> `task-github-governance-branch-protection-spec` の運用ループに委譲。

## MINOR 申し送り対応（Phase 3 から）

| MINOR | 対応 |
| --- | --- |
| workflow file +1 | 採用済み（独立 file 配置確定） |
| pnpm install オーバーヘッド | `cache: pnpm` で軽減（setup-node@v4 の組込 cache） |

## 完了条件

- [x] 新規 / 修正 / 修正検討の 3 群が明示
- [x] YAML 擬似コードがそのまま実装に使える状態
- [x] runbook が 9 手順で完結
- [x] secret 不要が placeholder 表に明記
- [x] sanity check が act を含む

## 次 Phase

Phase 6 に YAML 仕様（concurrency / timeout）と sanity 失敗時の挙動仕様を引き継ぐ。
