[実装区分: 実装仕様書]

# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| 前提 Phase | Phase 12（6 成果物完了） |
| 次 Phase | （なし — タスク完了） |
| user_approval_required | **true**（ユーザー明示承認後のみ実行） |
| base ブランチ | `dev`（CLAUDE.md PR 作成フロー既定） |

## 目的

Phase 1〜12 の全成果物をまとめて `dev` ブランチへ PR を作成する。実 secret 投入や Google Cloud Console での実 key 操作は本 PR には含めず、SOP・helper・テスト・記録テンプレの整備のみで完結させる。

## ユーザー承認待ち項目

以下は本仕様書 Phase 13 では実行しない。ユーザーが明示的に「PR 作成」「コミット」と指示した時点で初めて実行する。

- `git add` / `git commit`
- `git push origin <branch>`
- `gh pr create --base dev`

## 変更対象ファイル（PR に含める範囲）

| パス | 種別 |
| --- | --- |
| `scripts/cf-rotate-sa-key.sh` | 新規 |
| `scripts/__tests__/cf-rotate-sa-key.bats` | 新規 |
| `scripts/__tests__/fixtures/sa-key-rotation/dummy.json` | 新規 |
| `scripts/__tests__/helpers/cf-mock.bash`（既存があれば差分のみ） | 新規 or 編集 |
| `docs/30-workflows/runbooks/sa-key-rotation-sop.md` | 新規 |
| `docs/30-workflows/runbooks/sa-key-rotation-records/TEMPLATE.md` | 新規 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集（+3 行） |
| `docs/30-workflows/ut-25-deriv-01-sa-key-rotation-sop/`（本タスク仕様書 15 ファイル） | 新規 |

## PR 本文構成（CLAUDE.md PR 作成フローに従う）

```
## Summary
- UT-25-DERIV-01: SA Service Account key 定期ローテーション運用 SOP を新規整備
- 90 日サイクル / staging→production 順序 / grace 24-48h + disable 7 日保持を SOP に固定
- helper `scripts/cf-rotate-sa-key.sh` で stdin パイプ強制 / HISTFILE 抑止 / dry-run / state guard を機械保証
- bats 20 ケースで helper 全分岐をカバー

## Implementation guide
（outputs/phase-12/implementation-guide.md の主要見出しを反映）

## Test plan
- [ ] bats scripts/__tests__/cf-rotate-sa-key.bats（24/24 PASS）
- [ ] shellcheck scripts/cf-rotate-sa-key.sh
- [ ] markdownlint docs/30-workflows/runbooks/sa-key-rotation-sop.md
- [ ] 値漏洩 grep（0 件）
- [ ] pnpm typecheck / pnpm lint
- [ ] bash scripts/verify-pr-ready.sh

## Out of scope
- 実 SA key の発行・ローテーション実行（SOP に従う運用作業）
- UT-25-DERIV-02 / 03 / 04, UT-25-DEFER-01

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Phase 11 にスクリーンショット画像がないため、PR 本文に Screenshot セクションは作成しない（CLAUDE.md PR 作成前チェックに従う）。

## PR 作成前チェック（CLAUDE.md §「PR 作成前チェック」）

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` が PR ファイル一覧と一致
- [ ] implementation-guide.md の主要見出しが PR 本文に反映
- [ ] outputs/phase-11/ に画像なし → スクリーンショット欄を作らない
- [ ] base = `dev`

## 品質検証（PR 作成直前）

CLAUDE.md PR 作成フロー §「品質検証」の 4 コマンド:

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

加えて bash 専用検証:

```bash
mise exec -- bats scripts/__tests__/cf-rotate-sa-key.bats
mise exec -- shellcheck scripts/cf-rotate-sa-key.sh
```

## DoD

- [ ] ユーザー明示承認を取得
- [ ] 上記 4 + 2 検証コマンドが全 PASS
- [ ] PR 作成前チェックリスト全 ✓
- [ ] PR 本文に implementation-guide / test plan / out-of-scope が記載
- [ ] base が `dev`
- [ ] PR URL を最終レポートで返却

## blocked 条件

- AC-1〜AC-12 のいずれかが未達
- bats / shellcheck / markdownlint のいずれかが fail
- 値漏洩 grep が 0 件でない
- ユーザー承認が未取得

## 終了

Phase 13 完了をもって本タスク `UT-25-DERIV-01` を `spec_created` → `completed` へ遷移し、`docs/30-workflows/completed-tasks/` への移動を別オペレーションで実施する（completed-tasks-policy に従う）。
