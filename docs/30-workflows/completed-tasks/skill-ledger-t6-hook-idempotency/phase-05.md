# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill ledger hook 冪等化と 4 worktree 並列 smoke 実走 (skill-ledger-t6-hook-idempotency) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（hook 冪等ガード / 部分 JSON リカバリ / 2-worktree → 4-worktree smoke） |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | template_created |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |
| GitHub Issue | #161 |

## 目的

Phase 4 で固定した T1〜T5 を Green にするための **実装ステップ列** を仕様化する。本 Phase 仕様書は実装担当者（人間 / Claude Code）が別 PR で逐次実行するためのランブックであり、本ワークフロー (`task-20260429-073916`) は **仕様化までで完了**。実コード適用・コミット作成は本 PR では行わない。

> **重要**: 本 Phase の冒頭で **A-2 完了の前提確認**（AC-5）を必須化する。A-2 未完了の場合は実装着手不可（NO-GO 条件）。

## 依存タスク順序（A-2 完了必須）

A-2（task-skill-ledger-a2-fragment, GitHub Issue #130）の completed 状態を Step 0 ゲートで担保する。A-2 未完了で T-6 を起動した場合、`LOGS.md` 履歴喪失リスクが発生し AC-5 違反となる。

加えて A-1（skill-ledger-a1-gitignore）が completed であること。A-1 で `.gitignore` patched / `git rm --cached` 完了の前提下でしか hook ガードが意味を持たない。

## A-2 完了の前提確認【実装着手前の必須ゲート / AC-5】

実装担当者は **Step 1 に入る前に** 以下を必ず確認する。1 件でも該当した場合は実装着手禁止 → A-2 着手へ差し戻す。

```bash
# A-2 完了確認（必須）
test -f docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md
gh issue view 130 --json state                                  # state: CLOSED
rg -l "fragment" .claude/skills/*/LOGS/                          # fragment 化が反映されているか
git log --oneline --grep "skill-ledger-a2"                      # マージコミットが履歴にあるか
```

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| A-2 task `status` | `completed` | `pending` / `in_progress` |
| GitHub Issue #130 状態 | `CLOSED` | `OPEN` |
| `LOGS.md` の fragment 化 | 反映済み | 未反映 |
| A-1 完了 | `completed` | 未完了 |

**1 つでも NO-GO 条件に該当 → 実装着手禁止 → 本 Phase を pending に戻し A-2 / A-1 着手へ。**

## 実行タスク

- タスク1: A-2 / A-1 完了ゲートを実装着手前の必須確認として固定する。
- タスク2: hook 冪等ガード / 部分 JSON リカバリ / 2-worktree 事前 smoke / 4-worktree full smoke を分離する。
- タスク3: コミット粒度と rollback 境界を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-04.md | T1〜T5（Green 条件） |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-05.md | hook ガード Step 4 / 3 コミット粒度 |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md | runbook 正本 |
| 必須 | docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md | T-6 原典 / AC-1〜AC-5 |
| 参考 | lefthook.yml | hook 配置 |
| 必須 | CLAUDE.md | hook 方針（post-merge index 再生成廃止 / 明示 rebuild） |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-devops-core.md | Git hook 運用正本 |

## 実行手順

1. Step 0 で A-2 / A-1 完了を確認し、NO-GO 条件を判定する。
2. Step 1〜2 で hook 冪等ガードと部分 JSON リカバリを実装する。
3. Step 3 の 2-worktree 事前 smoke で前段ゲートを通す。
4. Step 4 の 4-worktree full smoke を Phase 11 / 実装 PR で実走する。

## 統合テスト連携

Phase 4 の T1〜T5 を Green 条件として参照し、Phase 6 の異常系で fail path を追加検証する。Phase 11 smoke が AC-4 の最終証跡。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-05/main.md | 実装ランブック（NOT EXECUTED テンプレ、pending のため骨格のみ予約） |
| 別 PR 成果（参考） | hook script diff / 部分 JSON リカバリロジック / smoke ログ | 本ワークフローでは生成しない |

## 実装手順（5 ステップ）

### Step 0: 前提確認（必須 / AC-5）

- 上記「A-2 完了の前提確認」を全項目クリア。
- A-1（skill-ledger-a1-gitignore）の `.gitignore` patched / `git rm --cached` 完了を確認。
- T1〜T5 が現在 Red であることを確認（hook ガード未実装状態）。
- `git ls-files .claude/skills` で tracked canonical の棚卸しを行い、A-1 完了後でも canonical のみが tracked であることを確認。

### Step 1: hook 冪等ガード実装（AC-1 / AC-2）

- 対象: `lefthook.yml` および `scripts/hooks/*`。現行 `post-merge` は stale 通知のみであり、index 再生成を戻さない。
- 必須要件:
  - `git add` / `git stage` / `git update-index --add` を **呼ばない**（AC-1）。
  - hook が派生物を自動再生成しないことを確認する。将来 hook が派生物に触れる場合のみ、各 target に対して **存在 → スキップ** ガードを設置（AC-2）。

  ```bash
  # 例: 派生物の存在ガード（疑似コード）
  for target in .claude/skills/*/indexes/keywords.json; do
    [[ -f "$target" ]] && continue
    node scripts/generate-index.js "$(dirname "$(dirname "$target")")"
  done
  ```

- canonical（`SKILL.md` / `LOGS.md` 本体）には **絶対に書き込まない**（state ownership）。
- 確認: T1（`git diff --cached` 空）/ T3（`git status --porcelain` 空）が Green。
- コミット粒度: `chore(hooks): add idempotency guard for skill ledger derived files (T-6)`（**コミット 1**）。

### Step 2: 部分 JSON リカバリ実装（AC-3）

- 対象: `pnpm indexes:rebuild` を呼ぶ前段ロジック、または hook script 内の検出 → 削除 → 再生成。
- 必須要件:
  - 派生 JSON の存在チェックに加えて **valid 性チェック**（`jq -e . <file> >/dev/null 2>&1`）。
  - 部分 JSON 検出時は `rm -f <file>` → 再生成にフォールバック。
  - atomic write（tmp → rename）で生成自体の中断耐性を確保。
- 確認: T2（破損 JSON → 再生成後 valid）が Green。
- コミット粒度: `chore(hooks): detect and recover partial JSON for skill indexes (T-6)`（**コミット 2**）。

### Step 3: 2-worktree 事前 smoke（前段ゲート / AC-4 前段）

- worktree A / B を作成し、両者で同時に `pnpm indexes:rebuild` を実行 → 順次 merge。
- 検証: `git ls-files --unmerged | wc -l` が `0`。
- 失敗時は Step 4（4-worktree）に進まず Step 1〜2 を見直す。
- 確認: T4 が Green。
- このステップは smoke のみで commit 不要（worktree 削除）。

### Step 4: 4-worktree full smoke（AC-4 本体）

- worktree A〜D の 4 並列で `pnpm indexes:rebuild` を `&` で起動。
- **`wait $PID` を個別集約**（PID 配列で各 return code を確認）。

  ```bash
  pids=()
  for wt in A B C D; do
    (cd .worktrees/$wt && pnpm indexes:rebuild) &
    pids+=($!)
  done
  rc=0
  for p in "${pids[@]}"; do
    wait "$p" || rc=$?
  done
  [[ $rc -eq 0 ]] || { echo "smoke FAIL: $rc"; exit $rc; }
  ```

- 順次 merge → `git ls-files --unmerged | wc -l` が `0`（AC-4）。
- ログを `outputs/phase-11/manual-smoke-log.md` に追記。
- 確認: T5 が Green。
- このステップは smoke のみで commit 不要。

## コミット粒度

| # | メッセージ | スコープ | レビュー観点 |
| --- | --- | --- | --- |
| 1 | `chore(hooks): add idempotency guard for skill ledger derived files (T-6)` | hook script / lefthook.yml の guard 追加 | `git add` 系不在 / canonical 不上書き / 存在ガード |
| 2 | `chore(hooks): detect and recover partial JSON for skill indexes (T-6)` | 部分 JSON 検出ロジック | valid 性チェック / atomic write / 削除 → 再生成 fallback |

> smoke ステップ（Step 3 / Step 4）は commit を生成しない（実走ログのみ Phase 11 main.md に追記）。

## 検証コマンド（実装担当者向け）

```bash
# Step 1 完了後
grep -nE 'git (add|stage|update-index --add)' lefthook.yml .lefthook 2>/dev/null  # T1 => 0 件
pnpm indexes:rebuild && git status --porcelain                                    # T3 => empty

# Step 2 完了後
truncate -s 10 .claude/skills/<skill>/indexes/keywords.json
pnpm indexes:rebuild && jq -e . .claude/skills/<skill>/indexes/keywords.json     # T2 => exit 0

# Step 3 完了後（2-worktree）
git ls-files --unmerged | wc -l                                                   # T4 => 0

# Step 4 完了後（4-worktree）
git ls-files --unmerged | wc -l                                                   # T5 => 0
```

## 完了条件

- [ ] Step 0〜4 が `outputs/phase-05/main.md` に NOT EXECUTED テンプレで列挙されている
- [ ] A-2 / A-1 完了確認が冒頭ゲートとして明記されている（AC-5）
- [ ] hook 冪等ガード（AC-1 / AC-2）の実装ステップが固定されている
- [ ] 部分 JSON リカバリ（AC-3）が独立コミットで分離されている
- [ ] 2-worktree → 4-worktree の段階的 smoke（AC-4）が固定されている
- [ ] hook が canonical を書かない境界が再掲されている
- [ ] 本ワークフローでは実コミットを作成しない旨が明示されている

## 苦戦防止メモ

1. **A-2 / A-1 未完了で着手しない**: AC-5 違反 / 履歴喪失事故の主要因。Step 0 で必ず block。
2. **`git add` 系を一切呼ばない**: AC-1 は厳格。`grep -E 'git (add|stage|update-index --add)'` で hook 全体を CI gate に組み込む。
3. **`[[ -f <target> ]]` だけでは AC-3 不足**: 内容 valid 性も `jq -e .` で必ず確認すること。
4. **`wait $PID` の個別集約**: 引数なし `wait` は最後の子の code しか返らない。配列で個別管理する。
5. **2-worktree を飛ばさない**: 4-worktree で失敗した時の切り分けが指数関数的に難しくなる。
6. **本 Phase 自身は実装しない**: 仕様化のみ。実装は別 PR。

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 2 コミット粒度の分離が異常系（hook 中断 / race / partial JSON）の前提
  - Step 4 の `wait $PID` 個別集約方式が Phase 6 の return code 集約失敗ケースの入力
  - smoke ログ保存先は Phase 11 main.md
- ブロック条件:
  - A-2 / A-1 完了確認ゲートが欠落
  - hook が canonical を書く設計が残っている
  - `git add` 系コマンドが hook script に残っている
