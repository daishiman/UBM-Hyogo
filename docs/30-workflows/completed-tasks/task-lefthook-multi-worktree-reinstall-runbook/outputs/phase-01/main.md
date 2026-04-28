# Phase 1: 要件定義 — 30+ worktree への lefthook 一括再インストール runbook 運用化

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
| タスク分類 | docs-only / runbook-spec |
| visualEvidence | NON_VISUAL |

## 1. 目的

`task-git-hooks-lefthook-and-post-merge` の baseline B-1 として残された
「30+ worktree への lefthook 一括再インストール runbook 運用化」の
**真の論点・依存境界・受入条件**を確定する。
Phase 2 設計が、pnpm store 競合 / detached HEAD / prunable worktree /
Apple Silicon バイナリ rebuild 失敗 の 4 既知制約を一意に判定できる入力を作る。

## 2. 真の論点

- 主問題: 「lefthook install を 30+ worktree で 1 巡させること」ではなく、
  **hook 層が暗黙にスキップされる worktree をゼロにし、それを継続的に保証する運用を定義する**こと。
- 副次論点: 1 つの提案に複数案件が混じらないよう、以下 2 経路を**分離**する。
  - (a) 既存 worktree 群への遡及適用 runbook（本タスクのスコープ）
  - (b) 新規 worktree 作成時の自動 install（`scripts/new-worktree.sh` で既に解決済み）
- why now: post-merge 自動再生成が廃止された結果、
  `pnpm install` が走らない worktree では hook 配置が空になる構造的リスクが顕在化したため。
- why this way: 既存の `pnpm install` の `prepare` script に
  `lefthook install` がぶら下がる構造である以上、worktree ごとに `pnpm install` を
  逐次回す手順を冪等な runbook として整備する以外に副作用なく解決する道がない。

## 3. 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | task-git-hooks-lefthook-and-post-merge（completed） | lefthook 採用 / `lefthook.yml` 正本 / post-merge 廃止 / `prepare` script 配置 | runbook の前提として継承 |
| 上流 | doc/00-getting-started-manual/lefthook-operations.md | 既存運用ガイド | 差分追記する baseline |
| 並列 | scripts/new-worktree.sh | 新規 worktree 作成時の `pnpm install` 自動化 | 新規 vs 既存 の責務境界を共有 |
| 下流 | task-verify-indexes-up-to-date-ci（unassigned） | indexes 鮮度の CI 検出 | 一括再 install 後の indexes 状態と整合する運用記録 |

## 4. スコープ（含む / 含まない）

index.md と完全同一。差分が出た場合は index.md を正本とする。

### 含む

- 既存 worktree 群への lefthook 一括再インストール runbook 仕様
- `pnpm install --prefer-offline` を用いた一括再 install スクリプトの仕様（実装はしない）
- 各 worktree で `lefthook version` が PASS することの検証手順
- `.git/hooks/post-merge` 等の旧 hook 残存検出手順
- `doc/00-getting-started-manual/lefthook-operations.md` への差分追記内容
- 運用記録（実行ログ）の保存場所と書式
- 4 条件評価

### 含まない

- lefthook 採用 ADR 化（baseline B-2 / 別タスク）
- CI `verify-indexes-up-to-date` 実装（C-1 / 別タスク）
- 実スクリプト（`scripts/reinstall-lefthook-all-worktrees.sh`）の本実装
- pnpm store の並列書き込み問題そのものの解決
- husky / pre-commit / git-hooks 等の他 hook ツール導入

## 5. 受入条件 (AC)

index.md と文言一致を維持する。

- AC-1: `git worktree list --porcelain` から prunable を除外した有効 worktree 群を抽出する手順が runbook に明記されている
- AC-2: 各 worktree で `mise exec -- pnpm install --prefer-offline` を逐次実行する手順が並列禁止理由（pnpm store 競合）と共に記述されている
- AC-3: 各 worktree で `mise exec -- pnpm exec lefthook version` が成功することを検証する手順がある
- AC-4: `.git/hooks/post-merge` 等の旧 hook が残存しないことを点検する手順がある
- AC-5: 実行ログを `outputs/phase-11/manual-smoke-log.md` に記録する書式が定義されている（worktree path / lefthook version / PASS/FAIL）
- AC-6: `doc/00-getting-started-manual/lefthook-operations.md` への差分追記内容が specify されている
- AC-7: 新規 worktree 作成時の自動 install 経路（`scripts/new-worktree.sh`）と一括再 install runbook の責務境界が明記されている
- AC-8: 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である
- AC-9: 苦戦箇所が「pnpm store の並列書き込み禁止」「detached HEAD worktree」「prunable worktree の除外」「Apple Silicon バイナリ rebuild」を含めて 4 件以上記載されている
- AC-10: Phase 12 で本仕様書の `documentation-changelog.md`、`unassigned-task-detection.md`、`skill-feedback-report.md` を全て出力する（0 件でも出力必須）

## 6. 価値とコスト

- **価値**: hook 層の暗黙スキップを撲滅でき、`scripts/hooks/staged-task-dir-guard.sh` /
  `scripts/hooks/main-branch-guard.sh` 等の混入阻止 hook が全 worktree で確実に効く。
  pre-commit が動かない worktree から間違ったコミットが発生する事故を抑止できる。
- **コスト**: 30+ worktree を逐次 `pnpm install --prefer-offline` する単発作業時間
  （prefer-offline 利用で数分〜十数分）。CI 実装は別タスク。
- **機会コスト**: 「全 worktree を毎度作り直す」アプローチに比べ、
  既存 worktree の作業ツリーを温存できるため作業ロスがない。

## 7. 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | hook スキップの暗黙リスクを正本化された runbook で固定でき、再 install 証跡が残る。誤った `--no-verify` 慣性化を防止できる |
| 実現性 | PASS | 既存 `pnpm install` の `prepare` script を流用するだけで実現可能。新規依存導入なし。`mise exec --` 経由で Node 24 / pnpm 10 を保証 |
| 整合性 | PASS | `lefthook.yml` 正本主義 / post-merge 廃止方針 / `.git/hooks/*` 手書き禁止 / `scripts/new-worktree.sh` 自動化と矛盾しない。CLAUDE.md「Git hook の方針」を強化する |
| 運用性 | PASS | 実行ログ書式（worktree path / install result / lefthook version / hook hygiene）を固定し、後段から差分監査可能。`outputs/phase-11/manual-smoke-log.md` を NON_VISUAL 代替 evidence の主ソースとする |

総合判定: **PASS**（MAJOR ゼロ）。Phase 2 へ進行可。

## 8. 既存規約の確認（runbook 文書化のための前提）

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| 実行ラッパ | `mise exec --` 経由 | Node 24.15.0 / pnpm 10.33.2 を保証する。runbook 内の全コマンドに前置 |
| pnpm モード | `pnpm install --prefer-offline` | store キャッシュを優先し I/O とネットワーク負荷を抑える |
| 並列性 | 逐次（`while read`） | pnpm content-addressable store の同時書き込みは禁止（破損不可逆） |
| worktree 抽出 | `git worktree list --porcelain` | `prunable` 行を除外。detached HEAD は対象に含める（Phase 2 ADR-04） |
| ログ出力先 | `outputs/phase-11/manual-smoke-log.md` | NON_VISUAL タスクの代替 evidence 主ソース |
| hook 配置 | `.git/hooks/*` 手書き禁止 | `lefthook.yml` が正本。`prepare` script で配置 |
| indexes 再生成 | `pnpm indexes:rebuild` | post-merge 自動再生成は廃止。明示コマンドに一本化 |

## 9. 苦戦箇所（事前棚卸し / 5 件）

派生元 `task-git-hooks-lefthook-and-post-merge` Phase 12 implementation-guide /
unassigned-task-detection（B-1）から転記し、本タスク向けに再整理した。

### 苦戦-1: pnpm store の並列書き込み禁止

複数 worktree で `pnpm install` を並列実行すると、pnpm の content-addressable store
（`~/.local/share/pnpm/store/v3` 等）が壊れる。一度壊れると個別 worktree からの
リカバリが困難で、`pnpm store prune` / 全 worktree 再 install が必要になる。
**対策**: runbook では `while read` ループで必ず逐次実行する。
`xargs -P` / GNU parallel / `&` バックグラウンドは禁止。

### 苦戦-2: detached HEAD / prunable worktree の扱い

`git worktree list --porcelain` には `prunable` フラグ付きの古い worktree や
detached HEAD の作業ツリーも含まれる。
**対策**: `--porcelain` 出力の `prunable` 行を parse して除外。
detached HEAD は hook 必要性が branch state と独立であるため**含める**（Phase 2 ADR-04）。

### 苦戦-3: Apple Silicon でのバイナリ不一致

`pnpm install` 時にダウンロードされる lefthook バイナリが arch 不一致で
起動失敗するケースがある（既存 `lefthook-operations.md` トラブルシュート表に記載）。
**対策**: runbook 内で `lefthook version` が失敗した場合に
`pnpm rebuild lefthook` を **1 度だけ** 自動 retry し、二度目失敗は FAIL 記録に留める。

### 苦戦-4: `.git/hooks/post-merge` 等の旧 hook 残存

post-merge 廃止前に作成された worktree には旧 hook が残存している可能性がある。
`lefthook install` は同名 hook を上書きするが、**上書き対象外のカスタム hook**が
混在している場合の安全側判断として、自動削除はしない。
**対策**: runbook 末尾で `head -n1 .git/hooks/post-merge` を確認し、
LEFTHOOK sentinel が無い場合は STALE と warning 記録（自動削除しない）。

### 苦戦-5: `lefthook install` のべき等性確認

同一 worktree への複数回実行が壊れないことは公式仕様だが、運用者が「重複実行で壊れるかも」
と躊躇すると runbook が形骸化する。
**対策**: runbook 冒頭で「再実行可能・冪等」を明記し、
失敗 worktree のみ部分再実行する経路も明示する。

## 10. タスク分類

| 項目 | 値 |
| --- | --- |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| screenshot 不要根拠 | runbook 文書化のみ。UI 変更ゼロ。代替 evidence は `outputs/phase-11/manual-smoke-log.md` のテーブル形式実行ログ |

## 11. 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| 該当なし | docs/CLAUDE.md の主要不変条件（フォーム schema 固定回避 / D1 アクセス境界 等）に直接抵触しない | runbook 文書化のみのため、business invariant には影響しない |
| 派生 | CLAUDE.md「Git hook の方針: lefthook.yml が hook の正本」 | 本 runbook はこの方針を前提にし、`.git/hooks/*` 手書きを禁止する立場を継承する |
| 派生 | CLAUDE.md「indexes 再生成は post-merge から廃止」 | runbook 完了後の indexes 再生成は `pnpm indexes:rebuild` の明示実行で行う旨を継承する |

## 12. 完了条件

- 真の論点 / 依存境界 / 4 条件 / AC / 苦戦箇所 / タスク分類 がすべて埋まっている
- 派生元 B-1 の不確定要素がすべて本仕様書で確定している
- index.md と AC・スコープ・不変条件 touched 表が完全一致
- 4 条件すべて PASS

## 13. Phase 2 への引き渡し事項

- 真の論点（hook スキップ撲滅 + 継続保証）
- 4 条件評価結果（全 PASS）
- 依存境界（特に `scripts/new-worktree.sh` との責務分界: 新規 = 自動 / 既存 = 一括 runbook）
- 既存規約（実行ラッパ / pnpm モード / 並列性 / worktree 抽出 / ログ出力先）
- 苦戦箇所 5 件（Phase 2 設計が判断材料として参照）
- タスク分類: docs-only / NON_VISUAL（後段で screenshot 不要を誤判定しないため）
