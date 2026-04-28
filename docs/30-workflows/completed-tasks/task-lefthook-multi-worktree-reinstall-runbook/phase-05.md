# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-28 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |
| タスク分類 | docs-only / runbook-spec |

## 目的

Phase 2 の擬似スクリプト仕様を **実行手順書としての本体** に最終化する。本タスクは docs-only であり、`scripts/reinstall-lefthook-all-worktrees.sh` の **コードファイルは生成しない**。本 Phase 内に擬似実装を完全な形で記述し、別 Wave で起こすコード化作業の入力に供する。Phase 3 の MINOR 指摘 M-01 / M-02 / M-03 を本 Phase で吸収する。

## MINOR 吸収方針

| ID | 指摘 | 本 Phase での吸収 |
| --- | --- | --- |
| M-01 | `outputs/phase-11/manual-smoke-log.md` の "実行日時" は ISO8601 表記とする運用が習慣化していない | 実行日時カラムは `YYYY-MM-DDTHH:MMZ`（UTC、ISO8601 basic-extended）形式を必須とし、擬似スクリプト内の `TODAY` 変数を `date -u +%Y-%m-%dT%H:%MZ` で生成する旨を本 Phase の「ログ書式」「擬似実装」「実行例」全てに明記する |
| M-02 | `pnpm rebuild lefthook` 後の二度目失敗時の警告文面が未定 | 警告文面を「`WARN: lefthook unavailable after rebuild at <wt>; this worktree will skip pre-commit hooks until manual recovery (see lefthook-operations.md troubleshooting).`」と確定し、stderr に出力する旨を擬似実装に組み込む |
| M-03 | detached HEAD worktree でコミット行為が runbook 実行者に発生しないことを補足する一文がない | runbook 冒頭の「重要な注意事項」に「本 runbook は `pnpm install` と `lefthook install` のみを行い、いかなる worktree でも `git commit` / `git push` / `git checkout <branch>` を発生させない。detached HEAD worktree でも HEAD 状態を変更せず、作業ツリーへの commit も生成しない。」と明記する |

## runbook 本体（最終化版）

### 重要な注意事項（冒頭ガード）

1. **並列禁止**: `xargs -P` / GNU parallel / バックグラウンド `&` は禁止。pnpm content-addressable store の同時書き込みは store 破壊を引き起こす。
2. **コミット行為の不発生**（M-03 吸収）: 本 runbook は `pnpm install` と `lefthook install`（`prepare` script 経由）のみを行い、`git commit` / `git push` / `git checkout <branch>` を一切発生させない。detached HEAD worktree でも HEAD 状態を変更せず、作業ツリーへの commit も生成しない。
3. **冪等性**: `lefthook install` は何度実行しても最終状態が同一。途中中断後の再実行も安全。
4. **実行ラッパ**: 全コマンドに `mise exec --` を前置する。Node 24 / pnpm 10 を保証する。
5. **`wrangler` 直接実行禁止**: 本 runbook は Cloudflare CLI を呼ばないが、習慣として `scripts/cf.sh` 経由のポリシーを継承する。

### 前提

| 前提 | 内容 |
| --- | --- |
| ホスト | macOS (Darwin) / Apple Silicon を主対象 |
| Node 環境 | `mise install` 完了済み（Node 24.15.0 / pnpm 10.33.2） |
| 作業 cwd | リポジトリ root（`UBM-Hyogo` の main worktree でも feature worktree でも可） |
| ログファイル | `outputs/phase-11/manual-smoke-log.md` が事前作成済み（ヘッダ行のみ） |

### ログ書式（M-01 吸収）

`outputs/phase-11/manual-smoke-log.md` のヘッダと 1 行例。

```markdown
| 実行日時 (ISO8601 UTC) | worktree path | install result | lefthook version | hook hygiene | 備考 |
| --- | --- | --- | --- | --- | --- |
| 2026-04-28T10:00Z | /Users/dm/dev/.../UBM-Hyogo | PASS | 1.10.10 | OK | - |
```

| カラム | 値域 | 説明 |
| --- | --- | --- |
| 実行日時 (ISO8601 UTC) | `YYYY-MM-DDTHH:MMZ` | `date -u +%Y-%m-%dT%H:%MZ` で生成。タイムゾーンは UTC 固定 |
| worktree path | 絶対パス | `git worktree list --porcelain` から取得 |
| install result | `PASS` / `FAIL` / `SKIP_NOT_FOUND` | `pnpm install --prefer-offline` の exit code に対応 |
| lefthook version | semver | `pnpm exec lefthook version` の最終行。失敗時は `-` |
| hook hygiene | `OK` / `STALE` / `ABSENT` / `OK_AFTER_REBUILD` | `.git/hooks/post-merge` の sentinel 判定 + rebuild 経由の OK |
| 備考 | 任意 | warning 文面・手動対応指示などを記述 |

### 実行手順（人間向け）

1. リポジトリ root に `cd` する。
2. `outputs/phase-11/manual-smoke-log.md` のヘッダ行が存在することを確認する（無ければ書式通りに作成）。
3. `git worktree list --porcelain` を実行し、prunable を含む全 worktree を確認する。
4. 擬似実装（後述）に従って逐次ループを実行する。
5. 全 worktree 完了後、ログ末尾にサマリー行（PASS / FAIL / SKIP / STALE の件数）を追記する。
6. `hygiene = STALE` の worktree があれば、`.git/hooks/post-merge` を手動確認し、`lefthook-operations.md` の手順で削除可否を判断する（自動削除しない）。

### 擬似実装（最終版・コードは生成しない）

```bash
# scripts/reinstall-lefthook-all-worktrees.sh （仕様。本タスクでは実装しない）
# 別 Wave でコード化する際は、この擬似実装と 100% 整合させること。
set -uo pipefail

LOG="outputs/phase-11/manual-smoke-log.md"
TODAY="$(date -u +%Y-%m-%dT%H:%MZ)"   # M-01: ISO8601 UTC

git worktree list --porcelain |
  awk 'BEGIN{path=""}
       /^worktree /{path=$2}
       /^prunable/{path=""}
       /^$/{if(path) print path; path=""}
       END{if(path) print path}' |
  while read -r wt; do
    # M-03: HEAD 状態を変更せず、commit / checkout / push を一切発生させない
    [ -d "$wt" ] || { printf "| %s | %s | SKIP_NOT_FOUND | - | - | - |\n" "$TODAY" "$wt" >> "$LOG"; continue; }
    pushd "$wt" >/dev/null

    # (1) install
    if mise exec -- pnpm install --prefer-offline >/dev/null 2>&1; then
      install_status="PASS"
    else
      install_status="FAIL"
    fi

    # (2) lefthook version
    if mise exec -- pnpm exec lefthook version >/dev/null 2>&1; then
      version="$(mise exec -- pnpm exec lefthook version 2>/dev/null | tail -n1)"
      version_status="OK"
    else
      # Apple Silicon binary mismatch 対策の自動 retry（ADR の rebuild 経路）
      mise exec -- pnpm rebuild lefthook >/dev/null 2>&1 || true
      if mise exec -- pnpm exec lefthook version >/dev/null 2>&1; then
        version="$(mise exec -- pnpm exec lefthook version 2>/dev/null | tail -n1)"
        version_status="OK_AFTER_REBUILD"
      else
        version="-"
        version_status="FAIL"
        # M-02: 二度目失敗時の警告文面を確定
        printf "WARN: lefthook unavailable after rebuild at %s; this worktree will skip pre-commit hooks until manual recovery (see lefthook-operations.md troubleshooting).\n" "$wt" >&2
      fi
    fi

    # (3) hook hygiene
    if [ ! -f .git/hooks/post-merge ]; then
      hygiene="ABSENT"
    elif head -n1 .git/hooks/post-merge 2>/dev/null | grep -q "LEFTHOOK"; then
      hygiene="OK"
    else
      hygiene="STALE"
    fi

    # version_status が OK_AFTER_REBUILD の場合は hygiene 列を上書きせず、備考に記録する
    if [ "$version_status" = "OK_AFTER_REBUILD" ]; then
      note="rebuilt"
    elif [ "$version_status" = "FAIL" ]; then
      note="WARN: lefthook unavailable after rebuild"
    else
      note="-"
    fi

    printf "| %s | %s | %s | %s | %s | %s |\n" "$TODAY" "$wt" "$install_status" "$version" "$hygiene" "$note" >> "$LOG"
    popd >/dev/null
  done
```

> 本ブロックは Phase 2 の擬似スクリプトと **100% 整合** する。差分は M-01（ISO8601 表記の明示）/ M-02（警告文面確定）/ M-03（冒頭ガード文の追加）の 3 点のみで、フロー・分岐・出力カラムは Phase 2 と同一。

### 実行例（単 worktree dry-run）

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo
mise exec -- pnpm install --prefer-offline
mise exec -- pnpm exec lefthook version
# stdout 例: 1.10.10
```

ログ追記例:

```markdown
| 2026-04-28T10:00Z | /Users/dm/dev/dev/個人開発/UBM-Hyogo | PASS | 1.10.10 | OK | - |
```

### サマリー行書式

全件処理後、ログ末尾に以下を追記する。

```markdown
<!-- summary: run=2026-04-28T10:30Z total=32 pass=30 fail=0 skip=1 stale=1 -->
```

## 責務境界（再掲）

| 経路 | 担当 |
| --- | --- |
| 新規 worktree 作成 | `scripts/new-worktree.sh`（`pnpm install` 自動実行で `lefthook install` も走る） |
| 既存 worktree 群への遡及 | 本 runbook |
| CI ドリフト検出 | task-verify-indexes-up-to-date-ci |

## 実行タスク

1. 重要な注意事項（並列禁止 / コミット不発生 / 冪等性 / `mise exec --` / `wrangler` 直接実行禁止）を冒頭ガードとして固定する。
2. ログ書式を ISO8601 UTC で確定する（M-01）。
3. 擬似実装に M-02 警告文面・M-03 ガード文を反映する。
4. Phase 2 擬似スクリプトとの整合 100% を確認する。
5. `outputs/phase-05/runbook.md` に最終化版を書き出す。

## 成果物

- `outputs/phase-05/runbook.md`（本 runbook の最終化版）
- 擬似実装（同ファイルに内包）
- ログ書式定義
- サマリー行書式

## 完了条件

- 重要な注意事項 5 項目が冒頭にある
- M-01 / M-02 / M-03 が全て吸収されている
- 擬似実装が Phase 2 と整合し、コードファイル `scripts/reinstall-lefthook-all-worktrees.sh` は生成されていない
- ログ書式・サマリー行書式が確定している

## Phase 6 への引き渡し

- 擬似実装の各分岐（PASS / FAIL / OK_AFTER_REBUILD / STALE / ABSENT / SKIP_NOT_FOUND）に対応する異常系ケースを Phase 6 で列挙する
- 警告文面（M-02）の発火条件を Phase 6 の「`lefthook version` 失敗」ケースに紐づける
- detached HEAD ガード（M-03）を Phase 6 の「detached HEAD」ケースで再点検する
