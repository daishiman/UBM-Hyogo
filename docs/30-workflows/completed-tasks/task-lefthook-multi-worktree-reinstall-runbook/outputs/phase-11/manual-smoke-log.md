# Phase 11: manual-smoke-log（書式テンプレート）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase | 11 / 13 |
| 種別 | NON_VISUAL 代替 evidence（dry-run 実行ログ書式テンプレート） |
| 作成日 | 2026-04-28 |
| 状態 | template_only（実機未実行） |

## 冒頭注記（必読）

- 本タスクは `taskType: docs-only / runbook-spec`、`visualEvidence: NON_VISUAL` である。
  **screenshot は一切作成しない**。`screenshots/` ディレクトリも `.gitkeep` も配置しない。
- 本ファイルは将来 Wave（`scripts/reinstall-lefthook-all-worktrees.sh` 実装タスク）が
  そのまま再利用する **書式テンプレート** であり、本 Phase 11 では実 worktree への
  install を **一切実行していない**。掲載されている表行は書式の見本（dummy）である。
- 「実行日時」カラムは UTC の ISO8601（`YYYY-MM-DDThh:mmZ`）で記録する。
  `date -u +%Y-%m-%dT%H:%MZ` の出力をそのまま貼ること。
  ローカルタイム表記・秒精度の追加・タイムゾーンオフセット表記（`+09:00` 等）は **禁止**。
- 1 行 = 1 worktree。複数の worktree を 1 行にまとめてはいけない。
- 実行ごとに新行を append する。既存行を編集して上書きしない（追記式・履歴保全）。

## 値の語彙（固定）

| カラム | 取り得る値 |
| --- | --- |
| 実行日時 | `YYYY-MM-DDThh:mmZ` （UTC・ISO8601） |
| worktree path | 絶対パス（`git worktree list --porcelain` の `worktree` 行から取得） |
| install result | `PASS` / `FAIL` / `SKIP_NOT_FOUND` / `SKIP_PRUNABLE` |
| lefthook version | semver 文字列（例: `1.6.10`） / `-`（取得失敗時） |
| hook hygiene | `OK` / `STALE` / `ABSENT` |
| 備考 | 自由記述（例: `OK_AFTER_REBUILD`、`detached HEAD`、`prunable skipped` 等） |

## 表ヘッダ（固定 / コピペ用）

```markdown
| 実行日時 (ISO8601 UTC) | worktree path | install result | lefthook version | hook hygiene | 備考 |
| --- | --- | --- | --- | --- | --- |
```

## ダミー見本行（書式テンプレート・実機未実行）

| 実行日時 (ISO8601 UTC) | worktree path | install result | lefthook version | hook hygiene | 備考 |
| --- | --- | --- | --- | --- | --- |
| 2026-04-28T10:00Z | /Users/dm/dev/dev/個人開発/UBM-Hyogo | PASS | 1.6.10 | OK | 見本行（実機未実行・PASS 例） |
| 2026-04-28T10:01Z | /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/legacy-wt | FAIL | - | STALE | 見本行（pnpm rebuild lefthook 二度目失敗・STALE post-merge 検出） |

> 上 2 行は **書式の見本** である。Phase 6 で定義した失敗ケース
> （FAIL / SKIP_NOT_FOUND / OK_AFTER_REBUILD / STALE）の 1 部を例示することが目的。

## 将来 Wave での dry-run 実行手順（参照用・本 Phase では実行しない）

```bash
# 前提: メイン clone のルートで実行
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo

# 1. ISO8601 タイムスタンプ取得
date -u +%Y-%m-%dT%H:%MZ

# 2. 有効 worktree 抽出（prunable 除外）
git worktree list --porcelain |
  awk 'BEGIN{p=""}
       /^worktree /{p=$2}
       /^prunable/{p=""}
       /^$/{if(p) print p; p=""}
       END{if(p) print p}'

# 3. 単一 worktree で smoke
cd <選んだ worktree path>
mise exec -- pnpm install --prefer-offline
mise exec -- pnpm exec lefthook version

# 4. 旧 hook 残存点検
head -n1 .git/hooks/post-merge 2>/dev/null || echo "ABSENT"

# 5. 全件 smoke は scripts/reinstall-lefthook-all-worktrees.sh 実装 Wave で実施
```

## 関連参照

- Phase 2 設計: `outputs/phase-02/runbook-design.md` §4.5（ログ書式定義）
- Phase 5 実装ランブック: `outputs/phase-05/runbook.md`
- Phase 6 異常系: `outputs/phase-06/failure-cases.md`
- Phase 11 リンク検証: `outputs/phase-11/link-checklist.md`
- Phase 12 ガイド: `outputs/phase-12/implementation-guide.md`
