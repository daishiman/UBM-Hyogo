# Phase 1 成果物 — 要件定義（T-6 hook 冪等化）

## 1. 背景

A-1（`skill-ledger-a1-gitignore` / Issue #129）で `.gitignore` 化と untrack を行うことで、`indexes/keywords.json` 等の派生物は git index から外れる。現行正本では post-merge は stale 通知のみで indexes 再生成を行わないため、T-6 は「post-merge 再生成を戻す」タスクではない。原典スペック（`docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md`）を、hook 内で `git add` 系を呼ばないこと、明示 `pnpm indexes:rebuild` 部分失敗時のリカバリ手順、4 worktree 並列 smoke で `git ls-files --unmerged | wc -l = 0` を実走証跡で示すことへ再整理する。本ワークフローはこの T-6 を Phase 1〜13 のタスク仕様書として固定する整備フェーズに閉じる（実 hook 実装は Phase 5 以降の別 PR）。

## 2. 課題（why this task）

| # | 課題 | 影響 |
| --- | --- | --- |
| C-1 | hook 内に `git add <派生物>` が残ると A-1 untrack が hook 1 回で無効化 | merge-conflict 0 化が崩壊し、A-1 PR の効果が消える |
| C-2 | `pnpm indexes:rebuild` 途中失敗で部分書き込み JSON が残留 | 次回 hook の存在チェックが誤って成立し、破損 JSON が温存される |
| C-3 | 4 worktree 並列再生成の `wait` 戻り値喪失 | 並列ジョブの一部失敗が見えず、smoke が誤って PASS 判定される |
| C-4 | A-2 未完了で T-6 を実装に持ち込むと `LOGS.md` 履歴が gitignore 連鎖で事故的に失われる | append-only 正本の喪失（最重要苦戦箇所） |
| C-5 | 4 worktree 一括起動の I/O 飽和（Mac mini クラス） | 実走時に再現できず、smoke の証跡が取れない |

## 3. hook target glob と禁止コマンド集合（Phase 1 で固定）

### hook が読み書きする派生物 glob（A-1 から継承）

```
.claude/skills/*/indexes/keywords.json
.claude/skills/*/indexes/index-meta.json
.claude/skills/*/indexes/*.cache.json
.claude/skills/*/LOGS.rendered.md
```

### hook 内で禁止するコマンド集合（AC-1）

```
git add
git stage
git update-index --add
```

> 静的検査: `grep -nE 'git (add|stage|update-index --add)' lefthook.yml scripts/*.sh => 0 件` を Phase 5 / Phase 9 の gate とする。

## 4. 部分 JSON リカバリ要件（AC-3）

```bash
# pnpm indexes:rebuild 失敗時のリカバリループ（仕様レベル）
find .claude/skills -path '*/indexes/*.json' -o -name 'LOGS.rendered.md' \
  | while read -r f; do
      if ! jq -e . "$f" >/dev/null 2>&1; then
        rm -v "$f"
      fi
    done
mise exec -- pnpm indexes:rebuild   # 削除分のみ再生成（hook 冪等性で残存ファイルは触らない）
```

## 5. 2-worktree → 4-worktree 二段 smoke 要件（AC-6 / AC-7）

```bash
# 並列 PID 個別集約（AC-6 の核心）
pids=()
for n in 1 2; do
  ( cd .worktrees/verify-t6-$n && mise exec -- pnpm indexes:rebuild ) &
  pids+=("$!")
done
rc=0
for pid in "${pids[@]}"; do
  wait "$pid" || rc=$?
done
# rc=0 なら 4-worktree full smoke へ進む。非 0 なら lane 2 リカバリへ戻る
```

## 6. スコープ

### 含む（spec scope）

- Phase 1〜13 のタスク仕様書整備
- Phase 1〜3 成果物本体の作成
- hook target glob 4 系列 / 禁止コマンド 3 系列の Phase 1 固定
- 部分 JSON リカバリ要件（AC-3）の固定
- 2-worktree → 4-worktree 二段 smoke + `wait $PID` 個別集約（AC-6 / AC-7）の固定
- A-2 完了必須前提の 3 重明記設計

### 含まない

- 実 `lefthook.yml` / hook script の編集
- A-2 / A-1 / B-1 の作業
- UI / API / D1 / Cloudflare Secret の変更
- Issue #161 の状態変更（CLOSED のまま）

## 7. 受入条件（AC）

AC-1〜AC-11 は `index.md` §受入条件と同期。本 Phase で blocker は検出されず、Phase 2（設計）へ進行可能。

## 8. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 worktree 並列で `git ls-files --unmerged | wc -l = 0` を実走証跡として再現可能にし、A-1 の効果を hook 経路で恒久化 |
| 実現性 | PASS | lefthook + bash + jq で完結。`git add` 禁止 / 存在スキップは数行の bash gate |
| 整合性 | PASS | 不変条件 #5 を侵害しない。A-1 state ownership（hook = 派生物のみ）を実装段階に固定 |
| 運用性 | PASS | リカバリループで破損 JSON 自動回復、ロールバック 1 コミット粒度 |

## 9. タスク種別の固定

| 項目 | 値 |
| --- | --- |
| taskType | implementation（本ワークフローは仕様書整備に閉じる） |
| visualEvidence | NON_VISUAL |
| scope | infrastructure_governance |

`artifacts.json.metadata` と完全一致。

## 10. 苦戦箇所サマリ（原典 / A-1 §9 写経 + T-6 固有）

1. **A-2 未完了で T-6 実装に着手すると `LOGS.md` 履歴が事故的に失われる**（最重要・A-1 から継承）。Phase 1 / 2 / 3 の 3 箇所で重複明記する。
2. hook 内 `git add` 残留で A-1 untrack が 1 回で無効化 → AC-1 として禁止コマンド集合を Phase 1 で固定。
3. `pnpm indexes:rebuild` 部分失敗での破損 JSON 残留 → AC-3 / Phase 2 lane 2 で `jq -e . || rm` ループを規定。
4. 並列 smoke の `wait` 戻り値喪失 → AC-6 / `pids=()` + `wait $PID` 個別集約を必須化。
5. 4 worktree 一括 I/O 飽和 → AC-7 / 2-worktree 事前 smoke を 4-worktree への gate に置く。

## 11. 命名規則チェックリスト

- hook 配置: `lefthook.yml` 経由（`.git/hooks/*` 直編集禁止）
- rebuild コマンド: `pnpm indexes:rebuild`（`mise exec --` 経由推奨）
- target glob: A-1 4 系列を継承
- リカバリ検査: `jq -e . <file>`
- 並列起動: `&` + `pids=("$!")` + `wait "$pid"` 個別

## 12. 真の論点（Phase 1 確定）

「`.gitignore` で派生物を git index から外す（A-1）」だけでは hook 1 回で無効化されるため、T-6 では「hook が `git add` を呼ばない」「派生物存在時はスキップ」「`pnpm indexes:rebuild` 部分失敗時の破損 JSON を `jq -e . || rm` で自動回復」「`wait $PID` 個別集約で並列失敗を見逃さない」の 4 軸を実装段階の冪等性として保証することが本タスクの本質。
