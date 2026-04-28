# Phase 12: implementation-guide（Part 1 中学生向け + Part 2 運用者向け）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase | 12 / 13 |
| 作成日 | 2026-04-28 |
| 派生元タスク | `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/` |
| 関連証跡 | `outputs/phase-11/manual-smoke-log.md` / `outputs/phase-11/link-checklist.md` |
| 用途 | 運用者向け実行ガイド & PR メッセージ素材 |

---

# Part 1: 中学生レベルの概念説明

## なぜこの作業をするの？

私たちは UBM 兵庫支部会のシステムを、ひとつのプロジェクトを **30 個以上の「作業部屋」**
（worktree）に分けて、同時に複数の機能開発を進めています。

各「作業部屋」の入口には、コードを保存する前に変なミスが混ざらないか
チェックしてくれる **「番人」**（Git hook）が必要です。番人は、最近 `lefthook` という
仕組みで一括管理することにしました。

ところが番人は、`pnpm install`（必要な道具を揃える作業）の **おまけ** として
自動的に配置される作りになっているため、

- 昔から放置されている作業部屋には番人がいない
- もしくは古いタイプの番人が居座っている（「居座っている前の番人」）

という状態が起きえます。番人がいない部屋からコミットされると、
変な内容がそのまま本番に流れてしまう危険があります。

そこで本タスクでは、

> **「全部屋を順番に回って、番人を新しい仕様で配置し直す」運用ルール**

を文書として固定します。

## なぜ「順番に」なの？

全部屋は **共有の道具箱**（pnpm の content-addressable store）から道具を取り出します。
複数部屋で同時に道具箱を触ると、道具箱そのものが壊れてしまいます。

だから絶対に **同時並行ではなく、1 部屋ずつ順番に** やります。

## 結果はどう残すの？

「いつ・どの部屋で・番人配置が成功したか」を、
**世界共通の日時の書き方**（ISO8601、`2026-04-28T10:00Z` のような形式）で
1 部屋 1 行ずつ表に書き残します。

これで後から誰が見ても、どの部屋がまだ番人を配置できていないかが分かります。

## Part 1 専門用語セルフチェック表

このガイドの Part 1 では、以下の言い換えに **完全に統一** されています。

| 使ってよい言葉 | 避ける言葉（言い換え対象） |
| --- | --- |
| 作業部屋 | worktree |
| 番人 | hook / lefthook hook |
| 番人を配置する | lefthook install / pnpm install via prepare |
| 道具箱 | pnpm store / content-addressable store |
| 順番にやる | 逐次実行 / serial execution |
| 居座っている前の番人 | 旧 `.git/hooks/post-merge` 残存 |
| 世界共通の日時 | ISO8601 / UTC timestamp |

> セルフチェック方法: Part 1 本文中に「avoid 列の語」が残っていないか
> grep し、残っていたら use 列の語に置換する。本ガイドは確認済み（残存なし）。

---

# Part 2: 運用者向け詳細手順

## 前提

- Node 24 / pnpm 10 を `mise` で固定（`.mise.toml`）
- hook の正本は **`lefthook.yml`** のみ。`.git/hooks/*` の手書きは禁止
- 本 runbook は **既存 worktree 群への遡及適用** が責務。新規 worktree は
  `scripts/new-worktree.sh` 経由で作成され、その時点で `pnpm install` が走るため
  本 runbook の対象外（責務分離）
- 並列実行は **禁止**（pnpm content-addressable store の同時書き込みで破壊される）
- 派生元タスク（baseline B-1）: `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/`

## 実コマンド一覧

### 1. ISO8601 タイムスタンプ取得

```bash
date -u +%Y-%m-%dT%H:%MZ
```

### 2. 有効 worktree 抽出（prunable 除外）

```bash
git worktree list --porcelain |
  awk 'BEGIN{p=""}
       /^worktree /{p=$2}
       /^prunable/{p=""}
       /^$/{if(p) print p; p=""}
       END{if(p) print p}'
```

### 3. 単一 worktree で smoke（任意の 1 件で先行検証）

```bash
cd <選んだ worktree path>
mise exec -- pnpm install --prefer-offline
mise exec -- pnpm exec lefthook version
```

### 4. 旧 hook 残存点検（hook hygiene）

```bash
head -n1 .git/hooks/post-merge 2>/dev/null || echo "ABSENT"
# 出力に "LEFTHOOK" sentinel があれば OK
# ファイルは存在するが sentinel が無ければ STALE（手動削除判断）
```

### 5. 全件 smoke

> 本タスクは **docs-only** のため、全件実行は次 Wave
> （`scripts/reinstall-lefthook-all-worktrees.sh` 実装タスク）で行う。
> その時点で本ガイドの手順とログ書式が **そのまま** 再利用される。
> 設計と擬似スクリプトは Phase 2 (`outputs/phase-02/runbook-design.md` §5) と
> Phase 5 (`outputs/phase-05/runbook.md`) を参照。

## ログ書式（Phase 11 で確定）

実行結果は `outputs/phase-11/manual-smoke-log.md` に下記書式で append する。

```markdown
| 実行日時 (ISO8601 UTC) | worktree path | install result | lefthook version | hook hygiene | 備考 |
| --- | --- | --- | --- | --- | --- |
```

**ISO8601 注記（必須遵守）**: 「実行日時」カラムは UTC の ISO8601
（`YYYY-MM-DDThh:mmZ`）で記録する。`date -u +%Y-%m-%dT%H:%MZ` の出力をそのまま貼ること。
ローカルタイム表記・秒精度の追加・`+09:00` のようなオフセット表記は **禁止**。

詳細書式・値の語彙・見本行は `outputs/phase-11/manual-smoke-log.md` を参照。

## トラブル対応表

| 症状 | 原因仮説 | 一次対処 | 二次対処 |
| --- | --- | --- | --- |
| `pnpm install` が中途半端で止まる | pnpm store の競合（並列実行の疑い） | 全プロセスを止め、逐次に戻す | `pnpm store prune` |
| `lefthook version` が exit 1 | Apple Silicon バイナリ不一致 | `mise exec -- pnpm rebuild lefthook` | `mise exec -- pnpm install --force` |
| `.git/hooks/post-merge` に旧 hook 残存（STALE） | post-merge 廃止前の手書き | 内容確認後に **手動削除** | 自動削除はしない（ADR-03） |
| `worktree path` が存在しない (SKIP_NOT_FOUND) | prunable / 削除済み | `git worktree prune` | runbook 再実行 |
| ある worktree だけ pre-commit が走らない | `prepare` script が走らないまま放置 | その worktree で `mise exec -- pnpm install --prefer-offline` を再実行 | 改善しなければ runbook の一括再 install を回す |
| detached HEAD で install してよいか不明 | branch 未割当 | hook は branch と独立なので **install 対象に含める**（ADR-04） | コミット行為の有無は実行者が判断 |

## 派生元タスクへの参照

- baseline タスク: `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/`
  - 派生根拠: 同 `outputs/phase-12/unassigned-task-detection.md`（baseline B-1）
  - 元の `implementation-guide.md`: 同 `outputs/phase-12/implementation-guide.md`
- 本タスクは baseline B-1 を **runbook として formalize** する位置付けである。

## manual-smoke-log への参照

- 書式テンプレ: `outputs/phase-11/manual-smoke-log.md`
- リンク検証結果: `outputs/phase-11/link-checklist.md`（PASS）
- ISO8601 注記の文面はテンプレファイルから転載すること（差分最小化）

## PR メッセージ素材（Phase 13 で再利用）

- 概要: 30+ worktree に lefthook を再インストールする運用 runbook を文書化（docs-only）。
- スコープ: 仕様・設計・擬似スクリプト・ログ書式・トラブル表・差分追記指示。
  実コード（`scripts/reinstall-lefthook-all-worktrees.sh`）は別 Wave。
- 影響: 本リポ内のドキュメント追加のみ。Cloudflare 等のランタイム・DB に影響なし。
- 検証: 本タスク Phase 11 で書式テンプレートと dead link 検査を実施（PASS）。
  実機 dry-run は次 Wave で本ガイドを参照して実行する。
