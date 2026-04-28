# Phase 2 — design.md

## Status

completed

## 1. lefthook.yml 案（正本）

```yaml
# lefthook.yml — Git hook 統一設定（UBM 兵庫支部会）
# Docs: https://lefthook.dev/configuration/

# 並列実行のデフォルト値（hook ごとに上書き可）
min_version: 1.6.0
no_tty: false
colors: true

# 全体共通：失敗時に他 lane の出力を残す
output:
  - meta
  - summary
  - failure

pre-commit:
  parallel: true
  commands:
    staged-task-dir-guard:
      # ブランチ名と無関係なタスクディレクトリの混入を阻止
      run: bash scripts/hooks/staged-task-dir-guard.sh
      stage_fixed: false
      fail_text: |
        🚫 ブランチと無関係なタスクディレクトリが含まれています。
        意図的に含める場合: git commit --no-verify
        除外する場合:       git restore --staged <path>

post-merge:
  parallel: false
  commands:
    stale-worktree-notice:
      # main 同期後に遅れている worktree を通知（read-only）
      run: bash scripts/hooks/stale-worktree-notice.sh post-merge
      # ⚠ post-merge では indexes/*.json の再生成を行わない
      # 再生成は明示コマンド `pnpm indexes:rebuild` でのみ実行する

# 開発者がローカルで個別に上書きしたい場合は lefthook-local.yml を使う
# （.gitignore 済み）
```

## 2. trace matrix — 旧 hook → 新 lane

| 旧 hook（`.git/hooks/`） | 機能 | 新 lane（`lefthook.yml`） | 移植スクリプト | 備考 |
| --- | --- | --- | --- | --- |
| `pre-commit` | branch ↔ task-dir 整合チェック | `pre-commit :: staged-task-dir-guard` | `scripts/hooks/staged-task-dir-guard.sh` | 旧スクリプトをそのまま転記 |
| `post-merge` (前半) | `indexes/*.json` 再生成 | **削除** | — | 明示コマンド `pnpm indexes:rebuild` に分離 |
| `post-merge` (後半) | stale worktree 通知 (current==main) | `post-merge :: stale-worktree-notice` | `scripts/hooks/stale-worktree-notice.sh post-merge` | lefthook schema 外のため対象外 |

## 3. post-merge regeneration 廃止の根拠

### 観測された問題

ブランチ作成 + `git merge origin/main --no-edit` 直後に以下 2 ファイルが必ず変更される:

- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`

これは `post-merge` フックが `generate-index.js` を無条件で呼び出すため、`merge=ours` 設定で本来温存したいブランチ側の indexes が即座に再生成され、無関係 PR に diff が混入する。本ブランチでも実際に観測した（Phase 1 main.md `Why now` 参照）。

### 廃止後の代替

| 場面 | 代替手段 |
| --- | --- |
| skill 仕様変更時 | 開発者が `pnpm indexes:rebuild` を明示実行 |
| CI ゲート | GitHub Actions の `verify-indexes-up-to-date` job で生成済み indexes と HEAD を diff し、ずれていれば fail |
| Phase 12 spec sync | `task-specification-creator` skill の `generate-index.js` 実行を Phase 12 ランブックに必須記載（既存運用継続） |

### 互換性

`merge=ours` 戦略を採用している `.gitattributes` は変更しない。post-merge での自動再生成だけが廃止される。`pnpm indexes:rebuild` は package.json scripts に新設する。

## 4. 既存 worktree への再インストール手順骨子（Phase 5 で詳細化）

```bash
# (1) 全 worktree を列挙
git worktree list | awk '{print $1}'

# (2) 各 worktree で lefthook install
for wt in $(git worktree list | awk '{print $1}'); do
  ( cd "$wt" && pnpm lefthook install )
done

# (3) 旧 .git/hooks/{pre-commit, post-merge} は
#     lefthook install が上書きするため手動削除不要
```

> 例外: prunable / detached HEAD の worktree はスキップする。`git worktree list` 出力をフィルタする。

## 5. package.json 変更案

```jsonc
{
  "scripts": {
    "prepare": "lefthook install",
    "indexes:rebuild": "node .claude/skills/aiworkflow-requirements/scripts/generate-index.js"
  },
  "devDependencies": {
    "lefthook": "^1.7.0"
  }
}
```

- `prepare` script は `pnpm install` 後に自動実行されるため、新規 clone / worktree でも自動で hook がインストールされる。
- `indexes:rebuild` は post-merge から分離した明示コマンド。

## 6. CI と lefthook の責務分離

| ゲート | 責務 | 失敗時 |
| --- | --- | --- |
| lefthook (local) | 速い・対話的・`--no-verify` でバイパス可 | 開発者が即座に修正 |
| GitHub Actions (authoritative) | 全 PR で必ず実行・バイパス不可 | merge ブロック |

ローカル lefthook は authoritative ではない。同等チェックを CI 側でも実行することで、`--no-verify` の事故を防ぐ（`task-github-governance-branch-protection` で branch protection rule として固定する）。

## 7. リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| `pnpm prepare` 未実行で hook が install されない | `scripts/new-worktree.sh` 末尾に `pnpm install && pnpm lefthook install` を必ず含める |
| Go バイナリが利用不可な環境 | `lefthook` は `node_modules/.bin/lefthook` 経由で呼べるため pnpm 経由 OK |
| 既存 30+ worktree 全てへの再インストール忘れ | Phase 5 runbook で一括スクリプト化 + Phase 11 manual smoke で確認 |
| post-merge 廃止により indexes が古い PR が増える | CI `verify-indexes-up-to-date` job で fail させる |

## 8. 設計上の決定（ADR ライト）

| ID | 決定 | 理由 |
| --- | --- | --- |
| ADR-01 | lefthook を採用（husky 不採用） | Node 非依存・Go バイナリで安定・宣言的 yaml |
| ADR-02 | post-merge 自動再生成を廃止 | 無関係 PR diff の根本原因 |
| ADR-03 | hook 本体は `scripts/hooks/*.sh` に移植 | yaml に長文 inline するより diff レビュー性が高い |
| ADR-04 | `lefthook-local.yml` を `.gitignore` 対象に追加 | 開発者個別 override を許容 |
