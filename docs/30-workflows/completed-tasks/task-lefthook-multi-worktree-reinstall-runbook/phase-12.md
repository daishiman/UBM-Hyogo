# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-28 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| タスク分類 | docs-only / runbook-spec |

## 目的

`task-specification-creator` skill の Phase 12 で必須化されている **5 種の成果物**を全て出力し、
本タスクの仕様内容を以下に正しく組み込む。

1. 中学生レベルの概念説明（Part 1）と運用者向け詳細手順（Part 2）の二部構成 implementation-guide
2. システム正本仕様（`doc/00-getting-started-manual/lefthook-operations.md`）への差分追記
3. 仕様書同期サマリー / 更新履歴 / 未タスク検出 / skill フィードバック

## 評価観点

| 観点 | 期待 |
| --- | --- |
| 必須 5 種出力 | 1 つも欠けない（0 件でも空ファイルでなくテンプレで出力） |
| Part 1 平易性 | 中学生が読んで「何のために何をするか」が伝わる |
| Part 2 実用性 | 運用者がコピペで実行でき、トラブル時に該当行を見れば対処できる |
| 正本ドキュメント整合 | `lefthook-operations.md` への差分が既存構成を破壊しない |
| baseline 記録 | Phase 3 代替案 A/B/C を不採用記録として残す |

## Task 一覧

### Task 1: `outputs/phase-12/implementation-guide.md`（Part 1 + Part 2）

#### Part 1: 中学生レベル概念説明

例えで揃える語彙:

| 専門用語 | 言い換え（中学生向け） |
| --- | --- |
| worktree | 「同じプロジェクトの作業部屋」 |
| 30+ worktree | 「30 個以上の作業部屋」 |
| lefthook install | 「各部屋の入口に番人を配置する作業」 |
| hook | 「コミット前後に動く番人」 |
| pnpm install --prefer-offline | 「キャッシュ優先で必要な道具を揃える」 |
| pnpm content-addressable store | 「全部屋で共有する道具箱」 |
| 並列禁止 | 「みんなで同時に道具箱を触ると壊れるので順番にやる」 |
| `.git/hooks/post-merge` 残存 | 「前の番人が居座っている状態」 |
| ISO8601 | 「世界共通の日時の書き方」 |

##### Part 1 専門用語セルフチェック表（必ず本ガイドに含める）

| 使ってよい言葉 | 避ける言葉（言い換え対象） |
| --- | --- |
| 作業部屋 | worktree |
| 番人 | hook / lefthook hook |
| 番人を配置する | lefthook install / pnpm install via prepare |
| 道具箱 | pnpm store |
| 順番にやる | 逐次実行 / serial execution |
| 居座っている前の番人 | 旧 `.git/hooks/post-merge` 残存 |
| 世界共通の日時 | ISO8601 / UTC timestamp |

> セルフチェック方法: 文中に「avoid 列の語」が残っていないか grep し、残っていたら use 列の語に置換する。

##### Part 1 ストーリー骨子

1. 私たちは同じプロジェクトを 30 個以上の「作業部屋」に分けて並行作業している。
2. 各作業部屋の入口には「番人」が必要（変な内容のコミットを止める役）。
3. 番人は `pnpm install` のついでに自動配置されるが、
   昔から残っている部屋では番人が居なかったり古かったりする。
4. なので「全部屋を順番に回って番人を配置し直す」運用を本タスクで決めた。
5. 同時にやると共有の道具箱が壊れるので、必ず順番にやる。
6. 結果は世界共通の日時付きで表に残す（後で誰が見ても辿れるように）。

#### Part 2: 運用者向け詳細手順

必須セクション:

1. 前提（mise / pnpm / `lefthook.yml` 正本主義 / `.git/hooks/*` 手書き禁止）
2. 実コマンド一覧（Phase 2 擬似スクリプト + Phase 11 dry-run 手順）
3. ログ書式（Phase 11 で確定した Markdown 表をそのまま転載 + ISO8601 注記）
4. トラブル対応表

##### トラブル対応表（Part 2 必須）

| 症状 | 原因仮説 | 一次対処 | 二次対処 |
| --- | --- | --- | --- |
| `pnpm install` が中途半端で止まる | pnpm store の競合（並列実行の疑い） | 全プロセスを止め、逐次に戻す | `pnpm store prune` |
| `lefthook version` が exit 1 | Apple Silicon バイナリ不一致 | `pnpm rebuild lefthook` | 手動で `pnpm install --force` |
| `.git/hooks/post-merge` に旧 hook 残存（STALE） | post-merge 廃止前の手書き | 内容確認後に手動削除 | 自動削除はしない |
| `worktree path` が存在しない (SKIP_NOT_FOUND) | prunable / 削除済み | `git worktree prune` | runbook 再実行 |
| detached HEAD で install したいか判断不能 | branch 未割当 | hook は branch と独立なので install 対象に含める | 補足: コミット行為は実行者に発生しない |

##### Part 2 実コマンド（要点抜粋）

```bash
git worktree list --porcelain
# 各 worktree で逐次:
mise exec -- pnpm install --prefer-offline
mise exec -- pnpm exec lefthook version
```

### Task 2: `doc/00-getting-started-manual/lefthook-operations.md` への差分追記仕様

本タスクは **docs-only** なので、`lefthook-operations.md` への変更は本仕様書の指示に従い
実装 Wave で適用する。差分追記内容を以下のとおり specify する。

#### Step 2-1: セクション「初回セットアップ / 既存 worktree への適用」を拡張

- 既存セクションの末尾に以下を追記:
  - 一括再 install runbook の概要（1 段落）
  - 詳細手順は本タスクの `phase-12 implementation-guide.md` Part 2 へリンク
  - 並列禁止の理由（pnpm content-addressable store 競合）の一文
  - ISO8601 ログ書式の参照リンク

#### Step 2-2: トラブルシュート表に行追加

`lefthook-operations.md` 内の既存トラブルシュート表に下記行を追記:

| 症状 | 対処（lefthook-operations.md 追記） |
| --- | --- |
| 「ある worktree だけ pre-commit が走らない」 | その worktree で `mise exec -- pnpm install --prefer-offline` を再実行。改善しなければ runbook の一括再 install を回す |
| 「`lefthook version` が exit 1」 | `pnpm rebuild lefthook` を 1 度試行。再失敗なら `pnpm install --force` |
| 「`.git/hooks/post-merge` が残っている」 | `LEFTHOOK` sentinel 行を確認。無ければ手動削除（自動削除はしない） |

#### Step 2-3: ログ書式参照リンク追加

- `manual-smoke-log.md` の書式へのリンクを「運用記録」セクションに追加
- ISO8601 表記注記を併記

#### Step 2-4: 整合性チェック

- CLAUDE.md「Git hook の方針」セクションと矛盾しないことを目視確認
- post-merge 廃止方針との整合を再確認
- `scripts/new-worktree.sh` 関連記述と責務境界が衝突しないこと

### Task 3: `outputs/phase-12/system-spec-update-summary.md`

必須項目:

| 項目 | 内容 |
| --- | --- |
| 更新対象ドキュメント | `doc/00-getting-started-manual/lefthook-operations.md` |
| 追記セクション | 初回セットアップ / トラブルシュート表 / ログ書式参照 |
| 追加リンク先 | 本タスクの implementation-guide.md Part 2 / manual-smoke-log.md |
| Phase 11 証跡参照 | `link-checklist.md` の OK 判定 |
| 整合性確認結果 | CLAUDE.md / post-merge 廃止方針 / new-worktree.sh と矛盾なし |

### Task 4: `outputs/phase-12/unassigned-task-detection.md`（**0 件でも出力必須**）

必須項目:

- 検出件数（本タスクから派生する未タスクの数）
- baseline 記録: **Phase 3 代替案 A / B / C を不採用 baseline として保存**

| ID | 代替案 | 不採用理由 | baseline 用途 |
| --- | --- | --- | --- |
| ALT-A | GitHub Actions による全 worktree CI 検証 | CI からはローカル `.git/hooks/` を参照できないため本問題を解けない | 将来「rare ローカル環境差異検出」が必要になった際の参照点 |
| ALT-B | `git worktree` 全廃して per-clone 化 | コスト過大・既存ワークフロー破壊 | clone モデル移行時の比較材料 |
| ALT-C | post-merge を復活させて auto re-install | 上流タスクの方針に逆行・無関係 PR への diff 混入が再燃 | 自動化要望が再燃した際の却下根拠 |

- 派生未タスクが 0 件であっても、本ファイルは **空にせず** 上記 baseline を必ず記録する。
- 派生候補（参考メモ）として N-01「`scripts/reinstall-lefthook-all-worktrees.sh` 実装 Wave + CI smoke」を記録する。

### Task 5: `outputs/phase-12/skill-feedback-report.md`（**改善点なしでも出力必須**）

必須項目:

| 項目 | 内容 |
| --- | --- |
| 利用 skill | `task-specification-creator` |
| Phase 11 NON_VISUAL ルール適用 | OK（`screenshots/` 不作成・`manual-smoke-log.md` で代替） |
| Phase 12 必須 5 種出力 | OK（本タスクで 5 種揃う） |
| Part 1 中学生レベル基準 | OK（セルフチェック表で担保） |
| 改善要望 | なし（あれば箇条書き、無くても「なし」と明記） |

> 改善点が 0 でも本ファイルは出力する。「改善要望: なし」と明記すること。

### Task 6: `outputs/phase-12/documentation-changelog.md`

必須項目:

| 日付 (ISO8601) | 変更対象 | 変更概要 | 起点 Phase |
| --- | --- | --- | --- |
| 2026-04-28 | `lefthook-operations.md` | 初回セットアップ拡張 / トラブル表追記 / ログ書式参照追加 | Phase 12 Task 2 |
| 2026-04-28 | 本タスク `outputs/phase-11/manual-smoke-log.md` | 書式テンプレ確定 | Phase 11 Task 1 |
| 2026-04-28 | 本タスク `outputs/phase-11/link-checklist.md` | dead link 検証 | Phase 11 Task 4 |

## 完了条件

- `outputs/phase-12/` 配下に以下 5 種が **全て** 存在する:
  - `implementation-guide.md`（Part 1 + Part 2、セルフチェック表含む）
  - `system-spec-update-summary.md`
  - `documentation-changelog.md`
  - `unassigned-task-detection.md`（baseline A/B/C 記録）
  - `skill-feedback-report.md`（改善点なしでも明記）
- `lefthook-operations.md` 差分追記仕様が Step 2-1〜2-4 まで specify されている
- Part 1 セルフチェック表で「avoid 列の語」が Part 1 本文に残っていない

## Phase 13 への引き渡し

- 5 種成果物のパス
- `lefthook-operations.md` 差分追記内容（実装 Wave 用の specify 済み指示）
- baseline 記録（A/B/C）
- PR 作成は **ユーザー承認後のみ実行可**（Phase 13 で再強調）
