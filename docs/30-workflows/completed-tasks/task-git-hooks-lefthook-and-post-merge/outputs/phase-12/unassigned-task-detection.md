# Phase 12 — unassigned-task-detection

## Status

completed

## 方針

「0 件で済ませない」運用ルールに従い、本タスクから派生する未割当タスク候補を **open**（本タスクで未完了として残すもの）と **resolved-in-wave**（同一 wave 内で対応済み）と **baseline**（既存リポジトリに既出だが未対応）に分離して記録する。

---

## open — 本タスクで未完了として残す候補

### C-1. CI `verify-indexes-up-to-date` job の新設（M-04 由来）

| 項目 | 内容 |
| --- | --- |
| 派生元 | Phase 3 review.md MINOR 指摘 M-04、Phase 2 design.md 第 3 節 |
| 概要 | post-merge 自動再生成を廃止することで、開発者が `pnpm indexes:rebuild` を忘れた場合に古い indexes のまま PR が作られるリスクが残る。GitHub Actions に「HEAD で `pnpm indexes:rebuild` を実行 → diff があれば fail」する verify job を新設する |
| 推奨 owner | platform / devex |
| 推奨 taskType | code-change |
| 想定スコープ | `.github/workflows/verify-indexes.yml` 1 本 + 必要であれば `package.json` script 追加 |
| 優先度 | High（post-merge 廃止と同時に必要） |
| 状態 | unassigned（正式タスク化済み: `docs/30-workflows/unassigned-task/task-verify-indexes-up-to-date-ci.md`） |

---

## resolved-in-wave — 本タスク内で対応済みの候補

### C-2. `lefthook-local.yml` の `.gitignore` 追記（M-01 由来）

| 項目 | 内容 |
| --- | --- |
| 派生元 | Phase 3 review.md MINOR 指摘 M-01、Phase 2 design.md ADR-04 |
| 概要 | 開発者個別の hook override を許容するため、`lefthook-local.yml` を `.gitignore` に追加する。lefthook 公式が推奨する慣例 |
| 推奨 owner | platform / devex |
| 推奨 taskType | code-change |
| 想定スコープ | `.gitignore` 1 行追加 |
| 優先度 | Medium（lefthook 導入実装と同梱推奨） |
| 状態 | resolved-in-wave（`.gitignore` に追記済み） |

### C-3. post-merge 廃止後の周知ドキュメント整備（M-03 由来）

| 項目 | 内容 |
| --- | --- |
| 派生元 | Phase 3 review.md MINOR 指摘 M-03、本 Phase 12 implementation-guide 2.5 |
| 概要 | post-merge による自動再生成が廃止されることを既存コントリビュータに周知する。具体的には `CLAUDE.md` の「よく使うコマンド」へ `pnpm indexes:rebuild` を追記し、`doc/00-getting-started-manual/` 配下に lefthook 運用 1 ページを新設する |
| 推奨 owner | platform / devex |
| 推奨 taskType | implementation |
| 想定スコープ | `CLAUDE.md` 数行追加 + `doc/00-getting-started-manual/lefthook-operations.md`（新規 1 本） |
| 優先度 | Medium（実装タスク完了直後に推奨） |
| 状態 | resolved-in-wave（`CLAUDE.md` と `doc/00-getting-started-manual/lefthook-operations.md` に反映済み） |

---

## baseline — 既存だが未対応の関連候補

### B-1. 既存 30+ worktree への lefthook 一括再インストール runbook の運用化

| 項目 | 内容 |
| --- | --- |
| 派生元 | Phase 1 main.md スコープ（3）、Phase 2 design.md 第 4 節 |
| 概要 | `git worktree list` 上 30+ 件存在する worktree それぞれに `lefthook install` を一巡させる必要がある。Phase 5 runbook で詳細化されるが、その実行責任者と実行記録の運用が baseline として未確定 |
| 推奨 owner | platform / devex |
| 推奨 taskType | runbook execution |
| 状態 | unassigned（実装タスク完了時に Phase 11 manual smoke 内で実施するか、別タスクで切り出すか要決定） |

### B-2. `husky` 不採用判断の ADR 化

| 項目 | 内容 |
| --- | --- |
| 派生元 | Phase 2 design.md ADR-01、Phase 3 review.md 第 5 節 |
| 概要 | 「husky 不採用 / lefthook 採用」の判断は本タスク outputs に分散して記述されているが、リポジトリ全体の ADR 集約場所（`doc/` 配下や `decisions/` 等）にはまだ転記されていない。将来別 hook ツールへの移行検討時にトレースできるよう ADR として独立化する |
| 推奨 owner | platform / devex |
| 推奨 taskType | implementation |
| 状態 | unassigned（本タスクのスコープ外。優先度 Low） |

---

## サマリ

| 区分 | 件数 |
| --- | --- |
| open | 1 |
| resolved-in-wave | 2 |
| baseline | 2 |
| 合計 | 5 |

C-1 のみ unassigned として正式タスク化済み。C-2 / C-3 は本タスク内で解消済みのため open set から除外する。
