# Phase 5 成果物: 実装ランブック（NOT EXECUTED — docs-only / spec_created）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 種別 | 実装ランブック仕様（NOT EXECUTED） |
| 作成日 | 2026-04-28 |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

> **NOT EXECUTED — 本ワークフロー (`task-20260428-170023`) では実装を行わない。**
> 本ファイルは Phase 5 仕様書 (`phase-05.md`) を実装担当者が別 PR で逐次実行するための **ランブック骨格**。実コミット作成・`.gitignore` patch / `git rm --cached` / hook 編集はすべて **未実施**。

## A-2 完了の前提確認【着手ゲート】

> **実装担当者は Step 1 開始前にここを必ず埋めること。1 件でも NG が残る場合は着手禁止。**

| 確認項目 | 期待値 | 実走結果 |
| --- | --- | --- |
| A-2 task の `status` | `completed` | _NOT EXECUTED_ |
| GitHub Issue 状態 | `CLOSED` | _NOT EXECUTED_ |
| `LOGS.md` の fragment 化反映 | 反映済み | _NOT EXECUTED_ |
| `LOGS.md` 本体が target globs に含まれていない | 含まれていない | _NOT EXECUTED_ |

## 実装ステップ（NOT EXECUTED）

### Step 1: `.gitignore` patch 適用

| 項目 | 内容 |
| --- | --- |
| 状態 | _NOT EXECUTED_ |
| 追記内容 | runbook §Step 1（`indexes/keywords.json` / `indexes/index-meta.json` / `indexes/*.cache.json` / `LOGS.rendered.md`） |
| コミット | `chore(skill): add A-1 gitignore globs for auto-generated ledger`（コミット 1） |
| Green 条件 | T1 全マッチ |

### Step 2: 実態棚卸し

| 項目 | 内容 |
| --- | --- |
| 状態 | _NOT EXECUTED_ |
| コマンド | `git ls-files .claude/skills \| rg "(indexes/.*\.json\|\.cache\.json\|LOGS\.rendered\.md)" > /tmp/a1-untrack-targets.txt` |
| 棚卸し件数 | _NOT EXECUTED_ |
| 内訳 | _NOT EXECUTED_（実走時に記入） |

### Step 3: `git rm --cached <files>`

| 項目 | 内容 |
| --- | --- |
| 状態 | _NOT EXECUTED_ |
| コマンド | `xargs -a /tmp/a1-untrack-targets.txt git rm --cached` |
| コミット | `chore(skill): untrack auto-generated ledger files (A-1)`（コミット 2） |
| Green 条件 | T2（tracked 派生物 0 件） |

### Step 4: hook 冪等ガード追加

| 項目 | 内容 |
| --- | --- |
| 状態 | _NOT EXECUTED_ |
| 編集対象 | `lefthook.yml` または既存 hook script |
| ガード | `[[ -f <target> ]] && exit 0` 相当の存在チェック |
| コミット | `chore(hooks): add idempotency guard for skill ledger derived files`（コミット 3） |
| Green 条件 | T3 / T5 |
| 備考 | T-6（hook 本体未実装）の場合、最小限の存在チェックに留め本格実装は T-6 PR へ委譲（Phase 3 open question #1） |

### Step 5: 4 worktree smoke（Phase 11 で実走）

| 項目 | 内容 |
| --- | --- |
| 状態 | _NOT EXECUTED — Phase 11 へ委譲_ |
| コマンド系列 | Phase 2 §「4 worktree smoke 検証コマンド系列」 |
| Green 条件 | T4（`git ls-files --unmerged \| wc -l` => 0） |

## コミット粒度（NOT EXECUTED）

| # | メッセージ | スコープ | 状態 |
| --- | --- | --- | --- |
| 1 | `chore(skill): add A-1 gitignore globs for auto-generated ledger` | `.gitignore` のみ | _NOT EXECUTED_ |
| 2 | `chore(skill): untrack auto-generated ledger files (A-1)` | `git rm --cached` のみ | _NOT EXECUTED_ |
| 3 | `chore(hooks): add idempotency guard for skill ledger derived files` | hook script / lefthook.yml | _NOT EXECUTED_ |

## 検証ログ（NOT EXECUTED）

```text
# 実装担当者が別 PR 実走時にここへ貼り付ける:
# - T1: git check-ignore -v ... の出力
# - T2: git ls-files | rg ... | wc -l の出力
# - T3: pnpm indexes:rebuild && git status --porcelain の出力
# - T5: tree hash 比較の出力
```

## 完了確認（仕様レベル）

- [x] Step 0〜4 が表化されている
- [x] A-2 完了確認ゲートが冒頭に明記
- [x] 3 コミット粒度が分離設計されている
- [x] hook が canonical を書かない境界が再掲されている
- [x] NOT EXECUTED が全 Step で明示されている
- [ ] 実走（実装担当者の別 PR）

## 申し送り

- 実装担当者は本ファイルの `_NOT EXECUTED_` を実走結果で置換する
- 実走結果は別 PR で commit / push し、本ファイルを上書きしてから Phase 6 / 7 / 11 へ進む
- 本ワークフローでは **コミット作成しない**
