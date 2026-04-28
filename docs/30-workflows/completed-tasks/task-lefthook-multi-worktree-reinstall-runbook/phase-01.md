# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-28 |
| 実行種別 | serial（Phase 2 設計の前提固定） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | docs-only / runbook-spec（NON_VISUAL） |

## 目的

`task-git-hooks-lefthook-and-post-merge` の baseline B-1 として残された「30+ worktree への lefthook 一括再インストール runbook 運用化」の真の論点・依存境界・受入条件を固定する。Phase 2 の設計が、pnpm store 競合・detached HEAD・prunable worktree・bin rebuild 失敗を all 既知制約として一意に判断できる入力を作る。

## 真の論点

- 主問題: 「lefthook install を 30+ worktree で一巡させること」ではなく、「**hook 層が暗黙にスキップされる worktree をゼロにし、その状態を継続的に保証する運用を定義する**」こと。
- 1 つの提案に複数案件が混じらないよう、(a) 既存 worktree 群への遡及適用 runbook と、(b) 新規 worktree 作成時の自動 install（`scripts/new-worktree.sh` 経由）を分離する。
- why now: post-merge 自動再生成が廃止された結果、`pnpm install` が走らない worktree では hook が空になる構造的リスクが発生したため。
- why this way: 既存の `pnpm install` `prepare` script に `lefthook install` がぶら下がる以上、worktree ごとに `pnpm install` を回す手順を冪等な runbook として整備する以外に副作用なく解決する道がない。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | task-git-hooks-lefthook-and-post-merge（completed） | lefthook 採用 / `lefthook.yml` 正本 / post-merge 廃止 / `prepare` script 配置 | runbook の前提として継承 |
| 上流 | doc/00-getting-started-manual/lefthook-operations.md | 既存の運用ガイド | 差分追記する baseline |
| 並列 | scripts/new-worktree.sh | 新規 worktree 作成時の `pnpm install` 自動化 | 新規 vs 既存の責務境界を定義して共有 |
| 下流 | task-verify-indexes-up-to-date-ci（unassigned） | indexes 未鮮度の CI 検出 | 一括再 install 後の indexes 状態と整合する運用記録を提供 |

## 価値とコスト

- 価値: hook 層の暗黙スキップを撲滅し、`scripts/hooks/staged-task-dir-guard.sh` 等の混入阻止 hook が全 worktree で確実に効く。pre-commit が動かない worktree から間違ったコミットが発生する事故を抑止できる。
- コスト: 30+ worktree を逐次 `pnpm install` する単発作業時間（pnpm の prefer-offline 利用で数分〜十数分）。CI 実装は本タスクのスコープ外。
- 機会コスト: 「全 worktree を毎度作り直す」アプローチに比べ、既存 worktree の作業ツリーを温存できるため作業ロスがない。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | hook スキップの暗黙リスクを正本化された runbook で固定でき、再 install 証跡が残る |
| 実現性 | PASS | 既存 `pnpm install` の `prepare` script を流用するだけで実現可能。新規依存導入なし |
| 整合性 | PASS | `lefthook.yml` 正本主義 / post-merge 廃止 / `.git/hooks/*` 手書き禁止 / new-worktree.sh と矛盾しない |
| 運用性 | PASS | 実行ログ書式（worktree path / lefthook version / PASS-FAIL）を固定し監査可能 |

## スコープ確認（含む / 含まない）

「含む / 含まない」は index.md と完全同一を維持する。差分が出た場合は Phase 2 に進む前に index.md を正とする。

## 既存規約の確認（runbook 文書化のための前提）

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| 実行ラッパ | `mise exec --` 経由 | Node 24 / pnpm 10 を保証する。runbook 内の全コマンドに前置 |
| pnpm モード | `pnpm install --prefer-offline` | store キャッシュを優先し I/O とネットワーク負荷を抑える |
| 並列性 | 逐次（`while read`） | pnpm content-addressable store の同時書き込みは禁止 |
| worktree 抽出 | `git worktree list --porcelain` | `prunable` 行を除外。detached HEAD でも対象に含めるかは Phase 2 で判断 |
| ログ出力先 | `outputs/phase-11/manual-smoke-log.md` | NON_VISUAL タスクの代替 evidence 主ソース |

## 実行タスク

1. 派生元 `task-git-hooks-lefthook-and-post-merge` の Phase 12 implementation-guide / unassigned-task-detection（B-1）を読み、苦戦箇所と前提を本仕様書の苦戦箇所セクションに写経する（完了条件: 4 件以上の苦戦項目が転記済み）。
2. 真の論点 / 依存境界 / 4 条件を上記の通り PASS で確定する（完了条件: 各セクションの空欄ゼロ）。
3. AC-1〜AC-10 を index.md と同期する（完了条件: 文言差分ゼロ）。
4. 「含む / 含まない」を index.md と整合させる（完了条件: 差分ゼロ）。
5. Phase 1 タスク分類 = `docs-only` / `visualEvidence = NON_VISUAL` を `artifacts.json.metadata` と Phase 11 仕様書の前提に明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/implementation-guide.md | runbook 仕様の派生元 |
| 必須 | docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md | B-1 の派生根拠 |
| 必須 | doc/00-getting-started-manual/lefthook-operations.md | 既存運用ガイドの差分追記対象 |
| 必須 | lefthook.yml | hook 定義の正本 |
| 必須 | package.json | `prepare` script の経路確認 |
| 必須 | scripts/new-worktree.sh | 新規 worktree セットアップとの責務境界 |
| 必須 | CLAUDE.md | 「Git hook の方針」セクションとの整合確認 |

## 実行手順

### ステップ 1: 派生元の読み込み

- `task-git-hooks-lefthook-and-post-merge` の Phase 12 成果物 5 種を全て読み、本タスクで再利用すべき表現と既知苦戦を抽出する。
- B-1 のスコープ（運用責任者・実行記録の運用・別タスク切り出しの境界）を本タスクで全て formalize する。

### ステップ 2: 真の論点と依存境界の固定

- 主問題を 1 文で書き直し、副次論点と独立項に切り分ける。
- 並列 task `scripts/new-worktree.sh` との責務境界（新規 = 自動 / 既存 = 一括 runbook）を明確化する。

### ステップ 3: 4 条件評価

- 価値性 / 実現性 / 整合性 / 運用性 のすべてに PASS と根拠を 1 行で書く。
- 一つでも MAJOR が出る場合は Phase 2 へ進めない。

### ステップ 4: AC とスコープの同期

- AC-1〜AC-10 を index.md と完全同一文言に保つ。
- 含む / 含まない / 不変条件 touched も index.md と同期。

### ステップ 5: タスク分類の明記

- `taskType: docs-only` / `visualEvidence: NON_VISUAL` を artifacts.json と Phase 11 仕様書冒頭に必ず明記する（screenshot 不要を後段で誤判定しないため）。

## 完了条件

- 真の論点 / 依存境界 / 4 条件 / AC / 苦戦箇所 / タスク分類が全て埋まっている
- 派生元 B-1 の不確定要素がすべて本仕様書で確定している
- index.md と AC・スコープ・不変条件 touched 表が完全一致

## Phase 2 への引き渡し

- 真の論点
- 4 条件評価
- 依存境界（特に new-worktree.sh との責務分界）
- 既存規約（実行ラッパ / pnpm モード / 並列性 / worktree 抽出 / ログ出力先）
- 苦戦箇所 5 件
