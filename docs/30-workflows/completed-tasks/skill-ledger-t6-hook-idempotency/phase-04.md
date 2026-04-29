# Phase 4: テスト戦略（TDD Red）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill ledger hook 冪等化と 4 worktree 並列 smoke 実走 (skill-ledger-t6-hook-idempotency) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（TDD Red） |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | template_created |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |
| GitHub Issue | #161 |

## 目的

Phase 3 でレビュー済みの hook 冪等化設計に対して、**TDD Red 段階の失敗テスト一覧** を仕様レベルで固定する。本 Phase はテストの実走ではなく、Phase 5 実装着手前に「原典 AC-1〜AC-5 を満たす T1〜T5」と「拡張 AC-6〜AC-11 を追跡する Phase 7 / 9 / 10 gate」を確定する。実テストは Phase 5 / Phase 6 / Phase 11 で順次走らせる。

> **本 Phase は仕様化のみ**。テスト本体スクリプトは作成しない。Phase 5 ランブック / Phase 11 smoke で参照するための **検証コマンド系列の正本** として固定する。

## 依存タスク順序（A-2 完了必須）— 重複明記の継続

A-2（task-skill-ledger-a2-fragment, GitHub Issue #130）が **completed** であること。A-2 未完了で T1〜T5 を走らせると、`LOGS.md` 本体が hook 経由で再生成 / 上書きされ、履歴喪失（AC-5 違反）が発生する。本 Phase は AC-5（A-2 完了前は実行しない gate）を全テストの大前提として明記する。

加えて A-1（skill-ledger-a1-gitignore）が完了していること。A-1 が `.gitignore` を patched している前提でしか hook の存在ガードが意味を持たないため、A-1 → T-6 の前後関係を入れ替えてはならない。

## 実行タスク

- タスク1: T1〜T5 の Red/Green 条件を hook 冪等化 / 部分 JSON リカバリ / 単一 worktree クリーン再生成 / 2-worktree 事前 smoke / 4-worktree full smoke の 5 軸で定義する。
- タスク2: A-2 完了前提を全テストの開始条件として固定する。
- タスク3: 実走を Phase 5 / 6 / 11 に委譲する境界を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md | T-6 原典スペック / AC-1〜AC-5 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-04.md | T1〜T5 のフォーマット参照 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-02.md | lane 1〜4 設計 / state ownership |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md | runbook 正本 |
| 参考 | lefthook.yml | post-commit / post-merge hook 配置 |

## 実行手順

1. Phase 2 / Phase 3 設計を入力として原典 AC-1〜AC-5 を T1〜T5 に対応付け、拡張 AC-6〜AC-11 を Phase 7 へ渡す。
2. T1〜T5 の対象 AC、検証コマンド、期待値、Red 状態を表に落とす。
3. 仕様化のみのため、本 Phase ではコマンドを実走しないことを確認する。

## 統合テスト連携

T1〜T5 は実装 PR 側で Phase 5 / 6 / 11 の gate として実走する。本 Phase はテスト仕様の正本化のみを行う。Phase 7 の AC マトリクスは T1〜T5 と AC-1〜AC-11 の対応マトリクスを再利用する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-04/main.md | T1〜T5 のテスト一覧 / 検証コマンド / 期待値 / 失敗時切り分け（pending 段階では未作成 / 骨格のみ予約） |
| メタ | artifacts.json `phases[3].outputs` | `outputs/phase-04/main.md` |

## テスト一覧（TDD Red）

> 表記凡例: **期待値** = Green 成立条件 / **Red 状態** = 仕様確定時点（実装前）の現状値 / **対応 AC** = Issue #161 受入条件番号

### T1: hook 冪等性（git index に再追加しない）

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 AC | AC-1 / AC-2 |
| 検証コマンド | `pnpm indexes:rebuild && git diff --cached --name-only \| wc -l` および `grep -nE 'git (add\|stage\|update-index --add)' lefthook.yml .lefthook 2>/dev/null \| wc -l` |
| 期待値 | `git diff --cached` が `0`、grep 結果が `0`（hook が `git add` 系コマンドを呼ばない） |
| Red 状態 | hook が tracked path に書き込み staged 差分が発生 / hook script に `git add` が残存 |
| 失敗時切り分け | (a) hook ガード `[[ -f <target> ]] && exit 0` 未実装 / (b) generate-index.js が canonical を上書き / (c) `git add` が legacy hook に残留 |

### T2: 部分 JSON リカバリ

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 AC | AC-3 |
| 検証コマンド | `truncate -s 10 .claude/skills/<skill>/indexes/keywords.json && pnpm indexes:rebuild && jq . .claude/skills/<skill>/indexes/keywords.json` |
| 期待値 | `jq` exit 0（再生成後の JSON が valid）/ 部分 JSON は検出後削除 → 再生成される |
| Red 状態 | 部分 JSON が残存し `jq` parse error / hook がスキップして valid 化されない |
| 失敗時切り分け | (a) 部分 JSON 検出ロジック不在 / (b) `[[ -f ]]` のみで内容 valid 性をチェックしていない / (c) `pnpm indexes:rebuild` 自体が atomic write 未実装 |

### T3: 単一 worktree クリーン再生成

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 AC | AC-1 / AC-2 |
| 検証コマンド | `pnpm indexes:rebuild && git status --porcelain` |
| 期待値 | `git status --porcelain` の出力が空（再生成しても tracked 差分が出ない） |
| Red 状態 | 派生物が canonical path に書かれて diff 発生 |
| 失敗時切り分け | (a) `.gitignore`（A-1）未適用 / (b) hook が tracked path に書いている / (c) generate-index.js の出力 path が canonical のまま |

### T4: 2-worktree 事前 smoke（full smoke 前段ゲート）

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 AC | AC-4（前段） |
| 検証コマンド | 2 worktree を作成 → 両者で `pnpm indexes:rebuild` 並列実行 → main へ順次 merge → `git ls-files --unmerged \| wc -l` |
| 期待値 | `0`（2-worktree merge で unmerged 0） |
| Red 状態 | 派生物 conflict が残る / merge がブロックされる |
| 失敗時切り分け | (a) 4-worktree full smoke を直接走らせて root cause 切り分け不可 / (b) hook 冪等ガード未実装 / (c) merge=union（B-1）が必要なケース |

### T5: 4-worktree full smoke（AC-4 本体）

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 AC | AC-4 |
| 検証コマンド | 4 worktree 作成 → 各々で `pnpm indexes:rebuild` を `&` で並列起動 → `wait $PID` ごとに return code を集約 → 順次 merge → `git ls-files --unmerged \| wc -l` |
| 期待値 | 全 worktree の `wait` return code が `0` かつ `git ls-files --unmerged \| wc -l` が `0` |
| Red 状態 | 1 つ以上の worktree で hook が tracked を再追加 / unmerged 件数 > 0 |
| 失敗時切り分け | (a) T4 を未通過のまま T5 を実走 / (b) `wait $PID` の return code を個別集約していない / (c) `pnpm indexes:rebuild` の非決定性 / (d) hook 並列実行時の race（atomic rename 不在） |

## テストカバレッジ目標（仕様レベル）

| スコープ | 目標 |
| --- | --- |
| AC-1（`git add` 系不在） | T1 で grep 全行被覆 |
| AC-2（canonical 不上書き） | T1 + T3 で「存在 → スキップ」分岐被覆 |
| AC-3（部分 JSON リカバリ） | T2 で「破損 → 削除 → 再生成」3 段階被覆 |
| AC-4（4-worktree unmerged 0） | T4（前段）+ T5（本体）で merge path 100% |
| AC-5（A-2 未完了 gate） | Phase 5 Step 0 ゲートで実装前ブロック確認 |

## 完了条件

- [ ] T1〜T5 が `outputs/phase-04/main.md` に表化されている（pending のため骨格のみ予約）
- [ ] 各テストに ID / 対象 AC / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けが記述されている
- [ ] A-2 完了が本 Phase の前提として明記されている
- [ ] 原典 AC-1〜AC-5 が T1〜T5 のいずれかでカバーされ、拡張 AC-6〜AC-11 が Phase 7 に渡されている
- [ ] 実テスト走行は Phase 5 / 6 / 11 に委ねる旨が明示されている

## 検証コマンド（仕様確認用）

```bash
test -f docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-04.md
rg -c "^### T[1-5]:" docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-04.md
# => 5
rg -c "AC-[1-5]" docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-04.md
# => 5 以上（全 AC 言及）
```

## 苦戦防止メモ

1. **T2 の部分 JSON 検出は単純な `[[ -f ]]` では不足**: ファイルが存在しても内容が壊れていれば再生成すべき。`jq -e .` または size 0 検出が必要。
2. **T4 を飛ばして T5 に行かない**: 2-worktree で再現しない問題は 4-worktree でも解消しない。前段ゲートとして必須。
3. **T5 の `wait $PID` 個別集約**: `wait` を引数なしで呼ぶと最後の子プロセスの code しか返らない。各 PID を配列に積み個別 `wait $PID` で集約する。
4. **AC-5 は実走不可な gate**: A-2 完了の前提は Phase 5 Step 0 で人間判断する性質のもの。テストでは検証できないため、ランブック上のゲートとして担保する。
5. **本 Phase は実走しない**: Red 状態の確認は Phase 5 着手直前に実施する。仕様化のみで Phase 5 へ進む。

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - T1〜T5 を Phase 5 ステップ 1〜4 の Green 条件として参照
  - Phase 11 smoke は T4 / T5 を実走する位置づけ
  - AC-1〜AC-11 と T1〜T5 / review gate の対応は Phase 7 AC マトリクスで再利用
- ブロック条件:
  - A-2 が completed でない（AC-5 違反）
  - A-1 が completed でない（hook ガードの前提不成立）
  - T1〜T5 のいずれかに期待値・検証コマンドが欠けている
