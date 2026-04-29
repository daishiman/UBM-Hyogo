# Phase 4 成果物 — テスト戦略（TDD Red / T1〜T5）

> **本ワークフローは仕様書整備に閉じる。** 本ファイルは `phase-04.md` 仕様書から「成果物として固定すべき内容」を抽出した正本である。実テストの Red 確認・Green 化は **実装担当者が別 PR で Phase 5 / Phase 6 / Phase 11 として実走** する。本ワークフロー (`task-20260429-073916`) ではコマンドを実行しない。

## 0. 前提ゲート（A-2 完了必須 / AC-5）

T1〜T5 の全テストは **A-2（task-skill-ledger-a2-fragment, GitHub Issue #130）completed** を絶対前提とする。A-2 未完了で T-6 hook を有効化した場合、`LOGS.md` 本体が hook の glob に巻き込まれて履歴喪失（AC-5 違反）が発生する。本 Phase は実走しないが、Phase 5 Step 0 でこのゲートを必ず通過させる。

加えて A-1（skill-ledger-a1-gitignore, Issue #129）completed が前提。A-1 で `.gitignore` patched / `git rm --cached` 完了済みの状態でしか hook ガードは意味を持たない。

## 1. AC ↔ T 対応マトリクス

| AC | 内容 | カバー T |
| --- | --- | --- |
| AC-1 | hook が `git add` / `git stage` / `git update-index --add` を呼ばない | T1 |
| AC-2 | canonical（`SKILL.md` / `LOGS.md` 本体）を hook が上書きしない | T1 / T3 |
| AC-3 | 部分 JSON 残留からの自動リカバリ（検出 → 削除 → 再生成） | T2 |
| AC-4 | 4-worktree 並列再生成 → 順次 merge で `git ls-files --unmerged` が `0` | T4（前段）/ T5（本体） |
| AC-5 | A-2 未完了時は本タスクを起動しない gate | Phase 5 Step 0 / 本 Phase 冒頭明記 |
| AC-6〜AC-11（拡張） | smoke 観測 / CI gate / 履歴保護 等 | Phase 7 マトリクスへ引き渡し |

## 2. テスト一覧（TDD Red）

> 凡例: **期待値** = Green 成立条件 / **Red 状態** = 仕様確定時点の現状値 / **失敗時切り分け** = Green に至らないとき確認すべき分岐。

### T1: hook 冪等性（git index に再追加しない）

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 AC | AC-1 / AC-2 |
| 検証コマンド | `pnpm indexes:rebuild && git diff --cached --name-only \| wc -l` ／ `grep -nE 'git (add\|stage\|update-index --add)' lefthook.yml .lefthook 2>/dev/null \| wc -l` |
| 期待値 | `git diff --cached` 行数 `0` ／ grep ヒット `0`（hook script に `git add` 系コマンドが存在しない） |
| Red 状態 | hook が tracked path に書き込み staged 差分が発生する／ hook script に `git add` 系が残存する |
| 失敗時切り分け | (a) hook ガード `[[ -f <target> ]] && exit 0` 未実装 ／ (b) `generate-index.js` が canonical を上書き ／ (c) 旧 hook の `git add` 残留 |

### T2: 部分 JSON リカバリ

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 AC | AC-3 |
| 検証コマンド | `truncate -s 10 .claude/skills/<skill>/indexes/keywords.json && pnpm indexes:rebuild && jq -e . .claude/skills/<skill>/indexes/keywords.json` |
| 期待値 | `jq -e .` exit 0（破損 JSON は検出 → 削除 → 再生成され valid） |
| Red 状態 | 部分 JSON が残存し `jq` parse error ／ hook が valid 性チェック無しでスキップ |
| 失敗時切り分け | (a) 部分 JSON 検出ロジック不在 ／ (b) `[[ -f ]]` のみで内容 valid 性未チェック ／ (c) atomic write（tmp → rename）未実装 |

### T3: 単一 worktree クリーン再生成

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 AC | AC-1 / AC-2 |
| 検証コマンド | `pnpm indexes:rebuild && git status --porcelain` |
| 期待値 | `git status --porcelain` 出力が空（再生成しても tracked 差分が出ない） |
| Red 状態 | 派生物が canonical path に書かれて diff 発生 |
| 失敗時切り分け | (a) `.gitignore`（A-1）未適用 ／ (b) hook が tracked path に書込 ／ (c) `generate-index.js` の出力 path が canonical のまま |

### T4: 2-worktree 事前 smoke（前段ゲート）

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 AC | AC-4（前段） |
| 検証コマンド | 2 worktree 作成 → 両者で `pnpm indexes:rebuild` 並列実行 → main へ順次 merge → `git ls-files --unmerged \| wc -l` |
| 期待値 | `0`（2-worktree merge で unmerged 0） |
| Red 状態 | 派生物 conflict が残存／ merge ブロック |
| 失敗時切り分け | (a) hook 冪等ガード未実装 ／ (b) `wait $PID` 個別集約欠落 ／ (c) merge=union（B-1）が必要なケース該当 |

### T5: 4-worktree full smoke（AC-4 本体）

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 AC | AC-4 |
| 検証コマンド | 4 worktree 作成 → 各 worktree で `pnpm indexes:rebuild` を `&` で並列起動 → PID を配列に積み `wait $PID` ごとに return code 集約 → 順次 merge → `git ls-files --unmerged \| wc -l` |
| 期待値 | 全 worktree の `wait $PID` return code が `0` かつ `git ls-files --unmerged \| wc -l` が `0` |
| Red 状態 | 1 つ以上の worktree で hook が tracked を再追加／ unmerged 件数 > 0／ `wait` 集約失敗で fail を見逃す |
| 失敗時切り分け | (a) T4 を未通過のまま T5 を実走 ／ (b) `wait $PID` 個別集約していない（引数なし `wait` で最後の子の code しか拾わない） ／ (c) `pnpm indexes:rebuild` の非決定性 ／ (d) hook 並列実行時の race（atomic rename 不在） |

## 3. テストカバレッジ目標（仕様レベル）

| スコープ | カバレッジ目標 |
| --- | --- |
| AC-1（`git add` 系不在） | T1 で hook script 全行を grep 被覆 |
| AC-2（canonical 不上書き） | T1 + T3 で「存在 → スキップ」分岐被覆 |
| AC-3（部分 JSON リカバリ） | T2 で「破損検出 → 削除 → 再生成」3 段階を被覆 |
| AC-4（4-worktree unmerged 0） | T4（前段）→ T5（本体）で merge path を 100% 通過 |
| AC-5（A-2 未完了 gate） | Phase 5 Step 0 ゲートで人間判断確認（テスト不可） |

## 4. A-2 完了 gate 明記

T1〜T5 を実走する条件として、Phase 5 Step 0 で以下を確認すること。1 件でも NO-GO 該当時は実装着手禁止。

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| A-2 task `status` | `completed` | `pending` / `in_progress` |
| GitHub Issue #130 状態 | `CLOSED` | `OPEN` |
| `LOGS.md` の fragment 化 | 反映済み | 未反映 |
| A-1 完了 | `completed` | 未完了 |

## 5. 実走範囲の境界（本ワークフロー外）

- 本 Phase の責務は **テスト仕様の正本化** のみ。`pnpm indexes:rebuild` / `truncate` / `git ls-files --unmerged` 等の実コマンドは本 PR では実行しない。
- 実走は次の通り別 PR / 別 Phase に委譲する。

| テスト | 実走場所 | 役割 |
| --- | --- | --- |
| T1 / T2 / T3 | 実装 PR の Phase 5 Step 1〜2 完了直後 | hook ガード + 部分 JSON リカバリの単体検証 |
| T4 | 実装 PR の Phase 5 Step 3 | 4-worktree 着手前の前段ゲート |
| T5 | 実装 PR の Phase 5 Step 4 / Phase 11 manual smoke | AC-4 最終証跡 |
| Phase 6 fail path（T6〜T10） | 実装 PR / 回帰 guard | regression 検出 |

## 6. 苦戦防止メモ（仕様化観点）

1. **T2 の検出は `[[ -f ]]` だけでは不足**: ファイル存在のみでは内容破損を見抜けない。`jq -e .` または size 0 検出を必須とする。
2. **T4 を飛ばして T5 へ進まない**: 2-worktree で再現しない不具合は 4-worktree でも解消しない。前段ゲート必須。
3. **T5 の `wait $PID` 個別集約**: 引数なし `wait` は最後の子 process の return code しか返さない。各 PID を配列に積み個別 `wait $PID` で集約する。
4. **AC-5 はテスト不可な gate**: A-2 完了確認は人間判断。Phase 5 Step 0 ランブックゲートで担保する。
5. **本 Phase は実走しない**: Red 状態の確認は実装 PR 着手直前に実施。仕様化のみで Phase 5 へ進む。

## 7. 完了条件（成果物観点）

- [x] T1〜T5 を表形式で固定（ID / 対象 AC / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分け）
- [x] AC-1〜AC-5 の全項目が T1〜T5 のいずれか／ Phase 5 Step 0 でカバー
- [x] AC-6〜AC-11 を Phase 7 AC マトリクスへ引き渡す旨明記
- [x] A-2 / A-1 完了ゲートを冒頭で重複明記
- [x] 実走は Phase 5 / 6 / 11 別 PR で行う旨明記

## 8. 次 Phase への引き渡し

- **次 Phase**: 5（実装ランブック）
- **引き継ぎ事項**:
  - T1〜T5 を Phase 5 Step 1〜4 の Green 条件として参照
  - Phase 11 smoke は T4 / T5 を実走する位置づけ
  - AC-1〜AC-11 と T1〜T5 / review gate の対応は Phase 7 AC マトリクスで再利用
- **ブロック条件**:
  - A-2 / A-1 が completed でない（AC-5 / hook ガード前提崩壊）
  - T1〜T5 のいずれかに期待値・検証コマンドが欠けている
