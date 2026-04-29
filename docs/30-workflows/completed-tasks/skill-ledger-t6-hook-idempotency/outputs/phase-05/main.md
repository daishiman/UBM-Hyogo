# Phase 5 成果物 — 実装ランブック（NOT EXECUTED）

> **本ワークフローは仕様書整備に閉じる。** 本ファイルは `phase-05.md` の実装ランブックを成果物として正本化したものであり、Step 0〜4 の **コマンド・コミット・smoke は本 PR では一切実行しない**。実装担当者（人間 / Claude Code）が別 PR で逐次実行する。本ワークフロー (`task-20260429-073916`) は仕様化までで完了する。

## 0. 概要 / 2 コミット粒度

| # | コミットメッセージ | スコープ | 対応 AC | 検証 T |
| --- | --- | --- | --- | --- |
| 1 | `chore(hooks): add idempotency guard for skill ledger derived files (T-6)` | `lefthook.yml` / `scripts/hooks/*` の `git add` 系除去 + 存在ガード | AC-1 / AC-2 | T1 / T3 |
| 2 | `chore(hooks): detect and recover partial JSON for skill indexes (T-6)` | 部分 JSON 検出 → 削除 → 再生成 + atomic write | AC-3 | T2 |

> Step 3（2-worktree smoke）/ Step 4（4-worktree full smoke）は **実走ログのみ Phase 11 main.md に追記** し、本 Phase ではコミットを生成しない。

## Step 0: 前提確認ゲート（A-2 / A-1 完了必須 / AC-5）

実装担当者は **Step 1 へ進む前に必ず以下を全項目クリア**する。1 件でも NO-GO 該当時は実装着手禁止 → 本 Phase を pending に戻し A-2 / A-1 着手へ差し戻す。

```bash
# A-2 完了確認（必須）
test -f docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md
gh issue view 130 --json state                                  # state: CLOSED
rg -l "fragment" .claude/skills/*/LOGS/                          # fragment 化反映確認
git log --oneline --grep "skill-ledger-a2"                      # マージコミット履歴確認

# A-1 完了確認（必須）
gh issue view 129 --json state                                  # state: CLOSED
rg -nE '^\.claude/skills/.+/(indexes|cache)' .gitignore         # .gitignore patched
git ls-files .claude/skills | rg '(indexes|\.cache)\.json' || echo OK  # tracked から除外済み

# T1〜T5 が現在 Red であることを確認
pnpm indexes:rebuild
git diff --cached --name-only | wc -l    # 期待: > 0（Red 状態の根拠）
git status --porcelain                   # 期待: 非空（Red 状態の根拠）
```

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| A-2 task `status` | `completed` | `pending` / `in_progress` |
| GitHub Issue #130 状態 | `CLOSED` | `OPEN` |
| `LOGS.md` fragment 化 | 反映済み | 未反映 |
| A-1 task `status` | `completed` | 未完了 |
| `.gitignore` patched | 反映済み | 未反映 |
| T1〜T5 Red 状態 | 確認済み | 未確認 |

**1 つでも NO-GO 該当 → 実装着手禁止。**

## Step 1: hook 冪等ガード実装（コミット 1 / AC-1 / AC-2）

### 対象

- `lefthook.yml`
- `scripts/hooks/*`（存在する場合）
- 必要に応じて `scripts/generate-index.js` の出力 path 確認

### 必須要件

- **`git add` / `git stage` / `git update-index --add` を一切呼ばない**（AC-1 厳格）。
- hook が派生物を自動再生成しない（post-merge index 再生成は CLAUDE.md 記載通り廃止済み）。将来 hook が派生物に触れる場合は、各 target に対して **存在 → スキップ** ガードを設置する（AC-2）。
- canonical（`SKILL.md` / `LOGS.md` 本体）には絶対に書き込まない（state ownership）。

### 疑似コード

```bash
# 派生物の存在ガード例
for target in .claude/skills/*/indexes/keywords.json; do
  [[ -f "$target" ]] && continue
  node scripts/generate-index.js "$(dirname "$(dirname "$target")")"
done
```

### 検証（Green 条件）

```bash
# T1
grep -nE 'git (add|stage|update-index --add)' lefthook.yml .lefthook 2>/dev/null | wc -l
# 期待: 0

pnpm indexes:rebuild && git diff --cached --name-only | wc -l
# 期待: 0

# T3
pnpm indexes:rebuild && git status --porcelain
# 期待: 出力空
```

### コミット

```
chore(hooks): add idempotency guard for skill ledger derived files (T-6)
```

> **本 Phase ではこのコミットを作成しない。** 実装 PR で実施する。

## Step 2: 部分 JSON リカバリ実装（コミット 2 / AC-3）

### 対象

- `pnpm indexes:rebuild` を呼ぶ前段ロジック、または hook script 内の検出 → 削除 → 再生成パス
- `scripts/generate-index.js` の atomic write 化（tmp → rename）

### 必須要件

- 派生 JSON の存在チェックに加えて **valid 性チェック**: `jq -e . <file> >/dev/null 2>&1`。
- 部分 JSON 検出時は `rm -f <file>` → 再生成にフォールバック。
- 生成自体の中断耐性として **atomic write**（`tmpfile && mv tmpfile <target>`）を `generate-index.js` 側にも要請。

### 疑似コード

```bash
for target in .claude/skills/*/indexes/*.json; do
  if [[ -f "$target" ]] && ! jq -e . "$target" >/dev/null 2>&1; then
    rm -f "$target"
  fi
done
pnpm indexes:rebuild
```

### 検証（Green 条件）

```bash
# T2
truncate -s 10 .claude/skills/<skill>/indexes/keywords.json
pnpm indexes:rebuild && jq -e . .claude/skills/<skill>/indexes/keywords.json
# 期待: exit 0
```

### コミット

```
chore(hooks): detect and recover partial JSON for skill indexes (T-6)
```

> **本 Phase ではこのコミットを作成しない。** 実装 PR で実施する。

## Step 3: 2-worktree 事前 smoke（前段ゲート / AC-4 前段 / commit なし）

### 手順

1. worktree A / B を作成。
2. 両者で同時に `pnpm indexes:rebuild` を実行（並列）。
3. main へ順次 merge。
4. `git ls-files --unmerged | wc -l` を確認。

### 検証（Green 条件 / T4）

```bash
git ls-files --unmerged | wc -l
# 期待: 0
```

### 失敗時の対応

- T4 が PASS しなければ **Step 4（4-worktree）へ進まず Step 1〜2 を見直す**。2-worktree で再現する問題は 4-worktree でも解消しない。

## Step 4: 4-worktree full smoke（AC-4 本体 / commit なし）

### 必須実装パターン: `wait $PID` 個別集約

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

if [[ $rc -ne 0 ]]; then
  echo "smoke FAIL: $rc"
  exit $rc
fi
```

> **`wait` を引数なしで呼んではいけない**。最後の子プロセスの return code しか返らず、失敗を見逃す（T7 regression）。

### 検証（Green 条件 / T5）

```bash
# 4 worktree 並列再生成 → 順次 merge → unmerged 0 確認
git ls-files --unmerged | wc -l
# 期待: 0
```

### ログ保存先

- `outputs/phase-11/manual-smoke-log.md` に追記（実装 PR で生成）。

## 検証コマンド一覧（実装担当者向け早見）

```bash
# Step 1 完了後
grep -nE 'git (add|stage|update-index --add)' lefthook.yml .lefthook 2>/dev/null  # T1: 0
pnpm indexes:rebuild && git status --porcelain                                    # T3: empty

# Step 2 完了後
truncate -s 10 .claude/skills/<skill>/indexes/keywords.json
pnpm indexes:rebuild && jq -e . .claude/skills/<skill>/indexes/keywords.json     # T2: exit 0

# Step 3 完了後
git ls-files --unmerged | wc -l                                                   # T4: 0

# Step 4 完了後
git ls-files --unmerged | wc -l                                                   # T5: 0
```

## ロールバック境界

| 障害 | rollback 単位 |
| --- | --- |
| Step 1 のみ失敗 | コミット 1 を `git revert`（コミット 2 は未生成のため影響なし） |
| Step 2 失敗 | コミット 2 を `git revert`（コミット 1 は維持して hook ガードのみ適用） |
| smoke のみ失敗 | コミット未生成 → worktree 削除のみで rollback 不要 |

## 苦戦防止メモ

1. **A-2 / A-1 未完了で着手しない**: AC-5 違反 / 履歴喪失事故の主要因。Step 0 で必ず block。
2. **`git add` 系を一切呼ばない**: AC-1 は厳格。CI 静的検査（grep gate）候補は Phase 9 / 12 へ申し送り。
3. **`[[ -f <target> ]]` だけでは AC-3 不足**: 内容 valid 性も `jq -e .` で必ず確認。
4. **`wait $PID` の個別集約**: 配列で個別管理しなければ T7 regression を踏む。
5. **2-worktree を飛ばさない**: 4-worktree で失敗した時の切り分けが指数関数的に難しくなる。
6. **本 Phase 自身は実装しない**: 仕様化のみ。実装は別 PR。

## 完了条件（成果物観点）

- [x] Step 0〜4 が NOT EXECUTED テンプレで列挙されている
- [x] A-2 / A-1 完了確認が冒頭ゲートとして明記されている（AC-5）
- [x] hook 冪等ガード（AC-1 / AC-2）の実装ステップが固定されている
- [x] 部分 JSON リカバリ（AC-3）が独立コミットで分離されている
- [x] 2-worktree → 4-worktree の段階的 smoke（AC-4）が固定されている
- [x] `wait $PID` 個別集約スクリプトが必須実装パターンとして提示されている
- [x] 本ワークフローでは実コミットを作成しない旨が明示されている

## 次 Phase への引き渡し

- **次 Phase**: 6（異常系検証）
- **引き継ぎ事項**:
  - 2 コミット粒度の分離が異常系（hook 中断 / race / partial JSON）の前提
  - Step 4 の `wait $PID` 個別集約方式が Phase 6 T7 の入力
  - smoke ログ保存先は Phase 11 main.md
- **ブロック条件**:
  - A-2 / A-1 完了確認ゲートが欠落
  - hook が canonical を書く設計が残っている
  - `git add` 系コマンドが hook script に残っている
