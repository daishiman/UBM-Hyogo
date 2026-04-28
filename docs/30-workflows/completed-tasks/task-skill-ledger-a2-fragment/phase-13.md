# Phase 13: 完了確認 / PR

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| Phase | 13 |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |
| user_approval_required | **true** |

## 目的

ユーザーの **明示承認後にのみ** commit / PR を作成する。Phase 13 は「準備が整っていることを示す」段階であり、自走で commit / push / PR 作成を行ってはならない。

## 重要ルール

- ❌ ユーザー承認なしに `git commit` / `git push` / `gh pr create` を実行しない。
- ❌ Issue #130 を再オープンしない（CLOSED のまま）。
- ❌ `wrangler` を直接呼ばない（`scripts/cf.sh` 経由のみ）。
- ❌ `.env` の中身を表示・読み取らない。
- ✅ `outputs/phase-13/` に PR テンプレ・change summary を準備のみ行う。
- ✅ ユーザー承認待ちステータスを明示する。

## 実行タスク

Phase 13 の入力成果物:

- Phase 2 `outputs/phase-2/fragment-schema.md` / `outputs/phase-2/render-api.md`
- Phase 5 `outputs/phase-5/runbook.md`
- Phase 6 `outputs/phase-6/fragment-runbook.md`
- Phase 7 `outputs/phase-7/coverage.md`
- Phase 8 `outputs/phase-8/before-after.md`
- Phase 9 `outputs/phase-9/quality-gate.md`

### Step 1: change summary 作成

`outputs/phase-13/change-summary.md`

- 変更内容の要約（A-2 fragment 化の実装仕様書 13 Phase 作成）
- 影響範囲（`docs/30-workflows/task-skill-ledger-a2-fragment/` の仕様書一式）
- 互換性: 実装コード・skill 本体・既存 ledger は変更しない
- ロールバック手順: 仕様書ディレクトリ追加分のみを revert
- リスク: 将来実装時の smoke は未実行のため、Phase 11 に evidence plan として残す

### Step 2: PR テンプレ作成（実 PR 作成は禁止）

`outputs/phase-13/pr-template.md`

```
## Summary
- A-2 skill ledger fragment 化の実装仕様書を 13 Phase で作成
- `pnpm skill:logs:render` / append helper / legacy 退避 / 4 worktree smoke の契約を明文化
- implementation / NON_VISUAL / implementation-ready として整理
- Phase 13 はユーザー承認待ち

## Test plan
- [ ] `node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/task-skill-ledger-a2-fragment --strict --json`
- [ ] `node -e "JSON.parse(require('fs').readFileSync('docs/30-workflows/task-skill-ledger-a2-fragment/artifacts.json','utf8'))"`
- [ ] Phase 11 NON_VISUAL required outputs are listed: main.md / manual-smoke-log.md / link-checklist.md / 4worktree-smoke-evidence.md
- [ ] Phase 13 does not run commit / push / PR creation

Refs: #130
```

### Step 3: 完了サマリー

`outputs/phase-13/main.md`

- Phase 1〜12 のステータス一覧
- Acceptance Criteria 8 項目の最終 PASS 確認
- 「ユーザー承認待ち」ステータスを明記
- 承認後に実施する操作の列挙:
  1. `git add <変更ファイル一覧>`
  2. `git commit -m "..."`（HEREDOC 形式）
  3. `git push -u origin feat/issue-130-skill-ledger-a2-fragment-task-spec`
  4. `gh pr create --title "..." --body "..."`

## 参照資料

- Phase 10 `outputs/phase-10/go-no-go.md`
- Phase 11 `outputs/phase-11/4worktree-smoke-evidence.md`
- Phase 12 `outputs/phase-12/implementation-guide.md`

## 成果物

- `outputs/phase-13/main.md`（完了サマリー・承認待ちステータス）
- `outputs/phase-13/change-summary.md`
- `outputs/phase-13/pr-template.md`

## 完了条件

- [ ] change-summary / pr-template / main.md の 3 成果物が準備されている。
- [ ] 「ユーザー承認待ち」が明示されている。
- [ ] 自走による commit / push / PR 作成が **行われていない**。
- [ ] Issue #130 が CLOSED のまま維持されている。
- [ ] artifacts.json の Phase 13 status は `pending`（user_approval_required: true）。
