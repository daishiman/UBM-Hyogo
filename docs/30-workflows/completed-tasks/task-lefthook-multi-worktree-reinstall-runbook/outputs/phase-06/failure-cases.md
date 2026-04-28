# Phase 6: 異常系検証 — failure-cases.md

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
| 関連 AC | AC-9（苦戦箇所 4 件以上） / AC-2（並列禁止理由） / AC-4（旧 hook 点検） / AC-5（ログ書式） |

## 1. 目的

Phase 2 の設計 (`runbook-design.md`) と Phase 5 の擬似実装 (`runbook.md` 仕様) が、
30+ worktree 一括再 install で**現場運用上ほぼ確実に発生する 10 種の異常系を、
runbook 自体を停止させずに検出・記録・継続できる**ことを構造的に確認する。

本 Phase は次の 3 点を固定する。

1. 異常系の発生条件・検出シグナル・continue/abort 判定・復帰手順を 10 ケース分。
2. continue/abort マトリクスにより runbook の停止判断を一意化する。
3. AC-9（苦戦箇所 4 件以上）を異常系ケースに紐付けるカバレッジ表。

## 2. 異常系一覧（10 ケース）

### F-01 pnpm store 並列書き込み競合

| 項目 | 内容 |
| --- | --- |
| 発生条件 | runbook の並列禁止条項（ADR-01）に違反し、複数 worktree で `pnpm install` を同時実行した結果、pnpm の content-addressable store（`~/.local/share/pnpm/store/v3` 等）に同名 entry を競合書き込みする |
| 典型シグナル | `pnpm install` の exit code 非ゼロ。stderr に `ERR_PNPM_BROKEN_LOCKFILE_FORMAT` / `ERR_PNPM_TARBALL_INTEGRITY` / `EEXIST` / `EINTEGRITY` / `ENOTEMPTY` などが現れる。store 配下に `*.tmp` が残ることもある |
| runbook での検出 | `mise exec -- pnpm install --prefer-offline` の exit code を `install_status=FAIL` として記録（runbook §4.2 の continue ループ）。集計表では FAIL 行が複数連続する |
| continue ポリシー | continue（ADR-02）。当該 worktree のみ FAIL 記録し次に進む |
| 復帰手順 | (1) 並列実行を即座に停止する。(2) `mise exec -- pnpm store prune` で破損 entry を除去。(3) 必要なら `~/Library/Caches/pnpm` の整合性ログを確認。(4) FAIL 行の worktree のみ抽出して**逐次**で再実行。(5) 並列禁止条項を再周知（runbook 冒頭 + `lefthook-operations.md`） |
| runbook での吸収箇所 | 設計 §4.2「逐次 install ループ」/ ADR-01 / 擬似スクリプト §5 の `while read` ループ。並列起動そのものを runbook が許容しない構造で予防する |

### F-02 detached HEAD worktree

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `git worktree add --detach <path> <sha>` で作成された worktree、もしくは PR レビュー目的で detached HEAD のまま放置されている worktree |
| 典型シグナル | `git worktree list --porcelain` の HEAD 行が `detached` を含む。`git -C <wt> rev-parse --abbrev-ref HEAD` が `HEAD` を返す |
| runbook での検出 | 抽出フェーズ（§4.1 awk）は detached HEAD を**除外しない**。ADR-04 で対象に含める方針を採用済み |
| continue ポリシー | continue（通常通り install + version 検証 + hygiene を実施）|
| 復帰手順 | 復帰不要。runbook 完了時点で hook 層は整備済み。M-03 によりブランチ状態は変更しない（`git checkout` / `git switch` を発行しない） |
| runbook での吸収箇所 | 設計 §2 前提表「detached HEAD: 含める」/ ADR-04 / 擬似スクリプト §5 の awk 部（HEAD 行を判定材料にしない） |

### F-03 prunable worktree

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 物理ディレクトリは削除済みだが `.git/worktrees/<name>` の admin entry が残存し、`git worktree list` には表示される |
| 典型シグナル | `git worktree list --porcelain` のレコード内に `prunable gitdir file points to non-existent location` 形の行が現れる |
| runbook での検出 | §4.1 の awk parser が `prunable` 行を見たら `path=""` に上書き → ループに渡らない。よってログにも出力されない |
| continue ポリシー | continue（スキップ。明示ログは残さない）|
| 復帰手順 | (1) `git worktree prune` で admin entry を回収。(2) 必要なら `scripts/new-worktree.sh` で再作成。(3) 再作成した worktree は `prepare` script により `lefthook install` が自動で走る |
| runbook での吸収箇所 | 設計 §4.1 awk 仕様 / 擬似スクリプト §5 の awk 部 / Phase 1 受入条件 AC-1 |

### F-04 Apple Silicon バイナリ rebuild が必要

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `node_modules/lefthook/bin` に格納されているネイティブバイナリが arm64 / x86_64 不一致（Rosetta 環境差・別マシンで作られた node_modules を rsync コピー・Time Machine 復元など）で起動できない |
| 典型シグナル | `pnpm exec lefthook version` 1 回目が `bad CPU type in executable` / `cannot execute binary file` / exit code 非ゼロ |
| runbook での検出 | §4.3 の version 検証フェーズ。1 回目失敗時点で自動リトライ条件を満たす |
| continue ポリシー | continue + 1 回だけ自動 retry。`mise exec -- pnpm rebuild lefthook` を実施し再度 `pnpm exec lefthook version` を実行 |
| 復帰手順（自動成功時） | `version_status=OK_AFTER_REBUILD` として記録。追加対応不要 |
| 復帰手順（自動失敗時） | F-05 に遷移 |
| runbook での吸収箇所 | 設計 §4.3「FAIL 時の自動 retry」/ 擬似スクリプト §5 の rebuild 分岐 |

### F-05 lefthook バイナリ rebuild 失敗（rebuild 後も version FAIL）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `pnpm rebuild lefthook` 後も `lefthook version` が失敗する。Node アーキテクチャ不整合（arm64 Node で x86_64 binary を解決）／パッケージ tarball 破損／ファイル権限欠落／OS ライブラリ非互換／ディスク full 等 |
| 典型シグナル | 2 回目の `mise exec -- pnpm exec lefthook version` も exit code 非ゼロ。stderr に `EACCES` / `dyld: missing symbol` / `not a dynamic executable` 等 |
| runbook での検出 | §4.3 の二度目判定で確定。`version=FAIL` / バージョン文字列を `-` として記録。M-02 に従い stderr に warning 文面を出力 |
| continue ポリシー | continue（abort しない）|
| 復帰手順 | (1) `mise current node` でアーキテクチャ確認。(2) `file node_modules/lefthook/bin/lefthook` で実バイナリ ABI を確認。(3) `lefthook-operations.md` の troubleshooting セクションへ誘導。(4) 解消困難なら当該 worktree を破棄し `scripts/new-worktree.sh` で再作成 |
| runbook での吸収箇所 | 設計 §4.3 二度目失敗判定 / §9 失敗復帰戦略 / M-02 警告文面 / 擬似スクリプト §5 の二段 if |

### F-06 `.git/hooks/post-merge` 残存（STALE）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | post-merge 自動 indexes 再生成が廃止される前の worktree で、`.git/hooks/post-merge` に lefthook の sentinel コメント (`# LEFTHOOK`) を含まないファイルが残っている |
| 典型シグナル | `head -n1 .git/hooks/post-merge` の出力に `LEFTHOOK` 文字列が含まれない |
| runbook での検出 | §4.4 hook hygiene チェック。sentinel 不在 → `hygiene=STALE` と記録 |
| continue ポリシー | continue（abort しない）。**自動削除は行わない**（ADR-03。ユーザー独自カスタム hook 誤削除リスクを回避）|
| 復帰手順 | (1) runbook 完了後、サマリー表で STALE 行を抽出。(2) 各 worktree で `cat .git/hooks/post-merge` を確認しカスタム実装が無いか目視。(3) カスタム無しと判断したら手動 `rm .git/hooks/post-merge`。(4) その後 `mise exec -- pnpm install --prefer-offline` を再実行し `lefthook install` を再走させる |
| runbook での吸収箇所 | 設計 §4.4 hygiene 判定 / ADR-03 / 擬似スクリプト §5 の `head -n1 ... grep LEFTHOOK` ブロック / `lefthook-operations.md` 差分仕様 §10 |

### F-07 `.git` ディレクトリ／worktree gitfile 欠損

| 項目 | 内容 |
| --- | --- |
| 発生条件 | worktree path は存在するが `.git` ファイル（worktree では gitdir 参照ファイル）が手動削除・rsync ミス等で欠損 |
| 典型シグナル | `pushd "$wt"` 成功後、`pnpm install` が `git` 呼び出しに失敗、もしくは `head -n1 .git/hooks/post-merge` で `No such file or directory` |
| runbook での検出 | install 段で FAIL を取り、hygiene チェックで `hygiene=ABSENT` を記録 |
| continue ポリシー | continue。`install_status=FAIL` / `hygiene=ABSENT` で next |
| 復帰手順 | 当該 worktree を `git worktree remove --force <path>` で破棄し、`scripts/new-worktree.sh` で再作成 |
| runbook での吸収箇所 | 設計 §4.2 install 失敗継続 / §4.4 hygiene `ABSENT` 判定 |

### F-08 ログファイル書き込み失敗

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `outputs/phase-11/manual-smoke-log.md` の親ディレクトリ不在・ファイル権限不足・別プロセスがロック中 |
| 典型シグナル | `printf >> "$LOG"` の exit code 非ゼロ。`set -u` のため `$LOG` 未定義は即時失敗 |
| runbook での検出 | リダイレクトの失敗を shell が即座に返す |
| continue ポリシー | **abort**。証跡保全こそ本 runbook の主目的のため、ログ書き込み失敗は最優先で修復する |
| 復帰手順 | (1) `mkdir -p outputs/phase-11`。(2) ログヘッダ行を再生成（既存ファイルは追記、無ければ表ヘッダから書き出す）。(3) 中断点以降の worktree から再実行（冪等）|
| runbook での吸収箇所 | 設計 §4.5 ログ書式 / ADR-05 ログ単一ファイル方針 / Phase 11 の事前準備項目 |

### F-09 `git worktree list` 自体が失敗

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `.git` 破損 / 権限不足 / git 未インストール / リポジトリ root 外で実行 |
| 典型シグナル | `git worktree list --porcelain` の exit code 非ゼロ。stderr に `fatal: not a git repository` 等 |
| runbook での検出 | パイプラインが空出力で終了し、while ループが 0 回回って終了する |
| continue ポリシー | **abort**。runbook の起点が成立しないため fatal（設計 §4.1）|
| 復帰手順 | (1) `git --version` / `which git` を確認。(2) `cd "$(git rev-parse --show-toplevel)"` を実行できるか確認。(3) 環境を修復してから runbook を最初からやり直す |
| runbook での吸収箇所 | 設計 §4.1「失敗時: 中断（fatal）」/ §9 失敗復帰戦略表 |

### F-10 ネットワーク失敗時の `--prefer-offline` 振る舞い

| 項目 | 内容 |
| --- | --- |
| 発生条件 | runbook 実行中にネットワークが切断される（オフィス Wi-Fi 切替・VPN 切断・DNS 障害）。`pnpm install --prefer-offline` は**ローカルキャッシュを最優先しつつ、不足分のみネットワーク取得**を試みる |
| 典型シグナル（成功時） | 全依存がローカルキャッシュにある場合は完全オフラインで成功する。ネットワーク試行ログが出ない |
| 典型シグナル（失敗時） | キャッシュ未取得の依存があるとネットワーク取得で `ECONNREFUSED` / `ETIMEDOUT` / `ENOTFOUND registry.npmjs.org` を返し install FAIL |
| runbook での検出 | F-01 と同じく `install_status=FAIL`。ただしエラーメッセージ種別は異なる |
| continue ポリシー | continue（ADR-02）。次 worktree でも同じネットワーク状態が続けば連続 FAIL になり、サマリー表で人間が即座に気づける |
| 復帰手順 | (1) ネットワークを復旧。(2) FAIL 行の worktree を抽出して再実行。(3) 完全オフラインで運用したい場合は事前に 1 worktree で `pnpm install` を完走させ store を温めておく |
| runbook での吸収箇所 | 設計 §2 前提表（`--prefer-offline` 採用根拠）/ §4.2 continue ポリシー / §9 失敗復帰戦略 |

## 3. continue / abort マトリクス

| ケース | install 段 | version 段 | hygiene 段 | runbook 全体 | 根拠 |
| --- | --- | --- | --- | --- | --- |
| F-01 pnpm store 競合 | FAIL | n/a | n/a | continue | ADR-02 単一 FAIL で全停止しない |
| F-02 detached HEAD | PASS | PASS | OK | continue | ADR-04 含める |
| F-03 prunable | スキップ | スキップ | スキップ | continue | §4.1 awk で除外 |
| F-04 Apple Silicon rebuild | PASS | OK_AFTER_REBUILD | OK | continue | §4.3 自動 retry 1 回 |
| F-05 rebuild 後も version FAIL | PASS | FAIL | OK/STALE | continue | M-02 warning 出力 |
| F-06 旧 post-merge STALE | PASS | OK | STALE | continue | ADR-03 自動削除しない |
| F-07 `.git` 欠損 | FAIL | n/a | ABSENT | continue | 当該 worktree を破棄して再作成 |
| F-08 ログ書き込み失敗 | n/a | n/a | n/a | **abort** | 証跡保全が runbook の主目的 |
| F-09 `git worktree list` 失敗 | n/a | n/a | n/a | **abort** | 起点が成立しない |
| F-10 ネットワーク失敗 | FAIL | n/a | n/a | continue | ADR-02。連続 FAIL でユーザーが気づく |

abort は F-08 / F-09 の 2 件のみ。残り 8 件は全て continue で吸収する設計。

## 4. 苦戦箇所カバレッジ（AC-9 トレース）

AC-9 は「苦戦箇所が 4 件以上記載されていること」を要求する。
index.md §「苦戦箇所・知見」と本 Phase の異常系ケースを 1:N で対応付ける。

| # | 苦戦箇所（index.md 記載） | 対応する異常系ケース | 主要な吸収箇所 |
| --- | --- | --- | --- |
| 1 | pnpm store の並列書き込み禁止 | F-01 | ADR-01 / 設計 §4.2 / 擬似スクリプト §5 |
| 2 | detached HEAD worktree の扱い | F-02 | ADR-04 / 設計 §4.1 / M-03 |
| 3 | prunable worktree の除外 | F-03 | 設計 §4.1 awk / AC-1 |
| 4 | Apple Silicon バイナリ rebuild | F-04, F-05 | 設計 §4.3 / M-02 / 擬似スクリプト §5 二段 if |
| 5 | `.git/hooks/post-merge` 残存 | F-06 | ADR-03 / 設計 §4.4 / `lefthook-operations.md` 差分 §10 |
| 6 | ネットワーク失敗時の `--prefer-offline` 振る舞い | F-10 | 設計 §2 前提 / §4.2 / §9 |
| 7 | `lefthook install` のべき等性 | F-10 後の再実行 / 全ケースの再走 | 設計 §8 冪等性表 |

苦戦箇所 7 件 ≥ AC-9 要求の 4 件。本 Phase で AC-9 充足を構造的に保証する。

## 5. 受入条件 (AC) との対応

| AC | 本 Phase での対応 |
| --- | --- |
| AC-2 | F-01 の発生条件と復帰手順により「並列禁止理由」の根拠を異常系側からも裏付ける |
| AC-4 | F-06 / F-07 で `.git/hooks/post-merge` 等の旧 hook 点検手順を異常系として固定する |
| AC-5 | F-08 でログ書き込み失敗を abort 扱いとし、ログ書式 (`outputs/phase-11/manual-smoke-log.md`) の保全を最優先化する |
| AC-9 | §4 カバレッジ表で 7 件 ≥ 4 件を担保 |

## 6. 実行タスク

1. F-01〜F-10 の 10 ケースを §2 で固定済み。
2. continue / abort マトリクスを §3 で完成。
3. 苦戦箇所カバレッジを §4 で AC-9 と紐付け。
4. AC マッピングを §5 で整理し Phase 7 の AC マトリクス入力にする。

## 7. 成果物

- 本ファイル `outputs/phase-06/failure-cases.md`
- 異常系 10 ケース定義（§2）
- continue / abort マトリクス（§3）
- 苦戦箇所カバレッジ表（§4）
- AC マッピング（§5）

## 8. 完了条件

- [x] 異常系が 7 件以上（実 10 件）定義されている
- [x] pnpm store 競合 / detached HEAD / prunable / Apple Silicon binary rebuild 失敗 / `lefthook version` 失敗 / 旧 hook 残存 / `.git` 欠損 / ネットワーク失敗時の `--prefer-offline` を全て含む
- [x] 各ケースに発生条件・検出方法・continue ポリシー・復帰手順・runbook での吸収箇所を記述
- [x] 苦戦箇所カバレッジが AC-9 を満たす（7 件 ≥ 4 件）

## 9. Phase 7 への引き渡し

- F-01〜F-10 を AC マトリクスのトレーサビリティ列に取り込む。特に AC-2 / AC-4 / AC-5 / AC-9 の根拠列に異常系ケース ID を直接引用する。
- continue / abort マトリクス（§3）を Phase 7 の「runbook 停止判断」検証行で再利用する。
- 苦戦箇所カバレッジ表（§4）を Phase 7 の AC-9 検証行に丸ごと転記する。
- abort 系 (F-08 / F-09) は Phase 9 の「文書品質ゲート」でログパス・git 起動可否の事前チェック項目として参照する。
