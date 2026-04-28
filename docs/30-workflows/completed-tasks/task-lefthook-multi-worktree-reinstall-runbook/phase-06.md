# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-28 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |
| タスク分類 | docs-only / runbook-spec |

## 目的

Phase 5 で確定した擬似実装の各分岐が、想定される 7 種以上の異常系を「停止せずに記録・継続」できることを検証する。AC-9（苦戦箇所 4 件以上）を保証するため、本 Phase で各ケースの発生条件・検出方法・continue ポリシー・運用復帰手順を固定する。

## 異常系一覧

| # | ケース名 | 発生条件 | runbook の検出 | continue ポリシー | 復帰手順 |
| --- | --- | --- | --- | --- | --- |
| F-01 | pnpm store 競合 | 並列実行禁止に違反し、`pnpm install` を複数 worktree で同時実行した結果、content-addressable store が破壊される | `pnpm install` の exit code 非ゼロ。stderr に `ERR_PNPM_*` / `EEXIST` / `EINTEGRITY` 等が出る | 当該 worktree を `install_status=FAIL` で記録し次へ進む | `mise exec -- pnpm store prune` 後に該当 worktree から逐次再実行。並列禁止条項を再周知 |
| F-02 | detached HEAD worktree | `git worktree add --detach` などで HEAD が detached になっている | `git worktree list --porcelain` の `HEAD` 行が detached 表記 | 対象に含めて install を実行（ADR-04）。HEAD 状態は変更せず、commit / checkout を発生させない（M-03） | 復帰不要。runbook 完了時点で hook 層は整備済み |
| F-03 | prunable worktree | 物理ディレクトリは消えたが `git worktree list` には残存している | awk parser が `prunable` 行を検出し path を空に上書き → ループに渡らない | スキップ（ループ対象外） | `git worktree prune` を実行し、必要なら `git worktree add` で再作成 |
| F-04 | Apple Silicon バイナリ不一致 | `node_modules/lefthook` のバイナリが arm64 / x86_64 不一致で起動失敗 | `pnpm exec lefthook version` の 1 回目が exit code 非ゼロ | `pnpm rebuild lefthook` を 1 度だけ実施 → 再試行 → OK なら `OK_AFTER_REBUILD`、二度目も失敗なら `FAIL` + 警告文面（M-02）を stderr 出力 | 二度目失敗時は `lefthook-operations.md` の troubleshooting に従い、Rosetta 環境 / Node アーキテクチャを点検 |
| F-05 | `lefthook version` 失敗（rebuild 後も） | rebuild 後も `lefthook version` が失敗する。バイナリ欠損・権限不足・OS 非互換など | 二度目の `pnpm exec lefthook version` が exit code 非ゼロ | `version_status=FAIL` / `version="-"` / 備考に「WARN: lefthook unavailable after rebuild」を記録（M-02） | `lefthook-operations.md` troubleshooting セクションへ誘導。手動で当該 worktree を破棄 + 再作成も可 |
| F-06 | 旧 hook 残存（`.git/hooks/post-merge` STALE） | post-merge 廃止前の worktree で `.git/hooks/post-merge` に lefthook sentinel を含まないファイルが残っている | `head -n1 .git/hooks/post-merge` が `LEFTHOOK` を含まない → `hygiene=STALE` | 自動削除はしない（ADR-03）。STALE として記録し、運用者の判断に委ねる | 運用者が中身を確認し、カスタム hook でなければ手動削除。削除後に `mise exec -- pnpm install --prefer-offline` で `lefthook install` を再走 |
| F-07 | `.git` ディレクトリ欠損 | worktree path は存在するが `.git` ファイル/ディレクトリが消えている（手動削除事故など） | `pushd` 成功後に `pnpm install` がエラー、または `head -n1 .git/hooks/post-merge` で path 不在 | `install_status=FAIL` / `hygiene=ABSENT` で記録し次へ | 当該 worktree は破棄し、`scripts/new-worktree.sh` で再作成 |
| F-08 | ログファイル書き込み失敗 | `outputs/phase-11/manual-smoke-log.md` がロック / 権限不足 / 親ディレクトリ不在 | `printf >> "$LOG"` の exit code 非ゼロ。`set -u` のため変数未定義は即時失敗 | runbook 自体を中断し、ログパスを修復してから再実行 | `mkdir -p outputs/phase-11` → ヘッダ行を再生成 → 中断点から再開（冪等） |
| F-09 | `git worktree list` 自体が失敗 | `.git` 破損・権限不足・git 未インストール | `git worktree list --porcelain` が exit code 非ゼロ → ループに入れない | runbook を fatal 中断（Phase 2 設計） | 環境を修復してから最初からやり直し |
| F-10 | install 中の Ctrl-C 中断 | 運用者が途中で SIGINT を送る | `pnpm install` が中断され FAIL 行が記録されないまま runbook 終了 | 部分的に記録された状態。冪等なので再実行で復帰 | 中断点以降の worktree から再実行。ログのサマリー行は最終実行時のみ追記 |

## ケース別 continue / abort マトリクス

| ケース | continue | abort | 備考 |
| --- | --- | --- | --- |
| F-01 | yes | no | ADR-02: 1 件失敗で全停止しない |
| F-02 | yes | no | M-03: HEAD 状態は変更しない |
| F-03 | yes | no | スキップしてログにも書かない（ループに渡らないため） |
| F-04 | yes | no | rebuild で多くは復旧 |
| F-05 | yes | no | 警告文面（M-02）を必ず stderr 出力 |
| F-06 | yes | no | 自動削除しない（ADR-03） |
| F-07 | yes | no | SKIP_NOT_FOUND または FAIL で記録 |
| F-08 | no | yes | ログ系の失敗は最優先で修復 |
| F-09 | no | yes | git 系の根幹失敗 |
| F-10 | n/a | n/a | 再実行で冪等復帰 |

## 苦戦箇所カバレッジ（AC-9 トレース）

| 苦戦箇所（index.md） | 対応ケース |
| --- | --- |
| pnpm store の並列書き込み禁止 | F-01 |
| detached HEAD / prunable worktree の扱い | F-02, F-03 |
| Apple Silicon バイナリ不一致 | F-04, F-05 |
| `.git/hooks/post-merge` 等の旧 hook 残存 | F-06 |
| `lefthook install` のべき等性 | F-10（再実行で復帰）で確認 |

10 ケースを定義しており AC-9（4 件以上）を充足する。

## 実行タスク

1. F-01〜F-10 の発生条件・検出・continue ポリシー・復帰手順を固定する。
2. continue / abort マトリクスを完成させる。
3. 苦戦箇所カバレッジを AC-9 と紐づける。
4. `outputs/phase-06/failure-cases.md` に最終化版を書き出す。

## 成果物

- `outputs/phase-06/failure-cases.md`（本 Phase の本体）
- 異常系 10 ケース表
- continue / abort マトリクス
- 苦戦箇所カバレッジ表

## 完了条件

- 異常系が 7 件以上（実際は 10 件）定義されている
- pnpm store 競合 / detached HEAD / prunable / Apple Silicon binary mismatch / `lefthook version` 失敗 / 旧 hook 残存 / `.git` 欠損 が全て含まれている
- 各ケースに復帰手順が記述されている
- AC-9 がトレース可能

## Phase 7 への引き渡し

- F-01〜F-10 を AC マトリクスのトレーサビリティ列に組み込む
- 苦戦箇所カバレッジ表を Phase 7 の AC-9 検証行で再利用する
