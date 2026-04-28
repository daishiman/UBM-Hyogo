# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill-ledger-b1-gitattributes |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 12 (ドキュメント更新) |
| 下流 | — |
| 状態 | blocked |
| user_approval_required | **true** |
| ブロック条件 | user の明示承認なし / Phase 12 未完 / CI gate FAIL |

## 目的

user の明示承認後に PR を作成する。承認なしの状態では blocked のまま放置する。ローカル確認を省略しない。本 Phase は design workflow の最終ゲートで、派生実装タスクへ A-2 完了後の解除手順を引き継ぐ。

## 入力

- `outputs/phase-12/` 配下 6 ファイル
- `outputs/phase-11/` 配下 NON_VISUAL 代替証跡 3 点
- 派生実装タスクの `.gitattributes` B-1 セクション手順

## ブロック解除条件

- user が「PR 作成して良い」と明示承認
- Phase 12 完了（5 必須 + compliance check）
- CI gate（typecheck / lint / 既存 hook）が GREEN 想定
- branch protection（main / dev）への直接 push でないことを確認

## ローカル確認（省略禁止）

```bash
# 1. branch 状態
git status --porcelain
git log --oneline main..HEAD

# 2. typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. .gitattributes 検証
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
git check-attr merge -- .claude/skills/aiworkflow-requirements/indexes/keywords.json

# 4. Phase 12 計画系 wording 残存確認
rg -n "仕様策定のみ|実行対象|保留として記録" \
  docs/30-workflows/skill-ledger-b1-gitattributes/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "計画系 wording なし"
```

## PR タイトルテンプレ

```
chore(skill-ledger): apply merge=union for legacy ledger (B-1)
```

## PR 本文テンプレ

```markdown
## Summary
- A-1〜A-3 完了後に残る append-only skill ledger（`_legacy.md` 系）に `merge=union` を適用
- 対象は行独立な append-only Markdown のみ。JSON / YAML / SKILL.md / lockfile は除外
- A-2 fragment 化完了時の解除条件を `.gitattributes` コメントに明記

## 関連 Issue
- Closes #132

## 上流依存
- A-1 (`task-skill-ledger-a1-gitignore`): main マージ済
- A-2 (`task-skill-ledger-a2-fragment`): main マージ済
- A-3 (`task-skill-ledger-a3-progressive-disclosure`): main マージ済

## 検証
- [ ] AC-1〜AC-11 全件 GREEN（`outputs/phase-09/main.md`）
- [ ] 4 worktree smoke PASS（`outputs/phase-11/manual-smoke-log.md`）
- [ ] Phase 10 Go 判定（`outputs/phase-10/go-no-go.md`）
- [ ] typecheck / lint exit 0

## 解除条件（A-2 完了後）
`git ls-files '.claude/skills/**/_legacy.md'` が空になった時点で `.gitattributes` の B-1 セクションを削除する。`outputs/phase-12/implementation-guide.md` 参照。

## Test plan
- [ ] CI: typecheck / lint
- [ ] reviewer: `.gitattributes` の broad glob 不在確認
- [ ] reviewer: 解除条件コメント残存確認
```

## 実行タスク

1. user 承認待ち（無い限り blocked）
2. ローカル確認 5 項目を実行し `local-check-result.md` に保存
3. `change-summary.md` 作成（変更ファイル一覧 + 影響範囲）
4. user 承認後に `gh pr create` 実行
5. PR 番号と URL を `pr-creation-result.md` に記録
6. CI gate 結果を待ち、`pr-info.md` に最終ステータス記録

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Skill Ledger Overview | `.claude/skills/aiworkflow-requirements/references/skill-ledger-overview.md` | A-2 → A-1 → A-3 → B-1 の実装順序と責務境界 |
| Skill Ledger Gitattributes Policy | `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitattributes-policy.md` | B-1 `merge=union` の許可・禁止・解除条件 |
| Skill Ledger Lessons Learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-skill-ledger-redesign-2026-04.md` | skill ledger 4施策の苦戦箇所と再発防止 |


| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-12/` 配下 |
| 必須 | `outputs/phase-10/go-no-go.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase13.md` |

## 依存Phase明示

- Phase 1 成果物を参照する。
- Phase 2 成果物を参照する。
- Phase 5 成果物を参照する。
- Phase 6 成果物を参照する。
- Phase 7 成果物を参照する。
- Phase 8 成果物を参照する。
- Phase 9 成果物を参照する。
- Phase 10 成果物を参照する。
- Phase 11 成果物を参照する。
- Phase 12 成果物を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-13/main.md` | Phase 13 トップ index / blocked 理由 / approval status |
| `outputs/phase-13/local-check-result.md` | ローカル確認 5 項目の出力 |
| `outputs/phase-13/change-summary.md` | 変更ファイル / 影響範囲 |
| `outputs/phase-13/pr-info.md` | PR 番号 / URL / CI ステータス（user 承認後） |
| `outputs/phase-13/pr-creation-result.md` | `gh pr create` 結果（user 承認後） |

## 完了条件 (DoD)

- [ ] user 承認確認済（明示承認なしなら blocked のまま終了）
- [ ] local-check-result.md / change-summary.md 作成済
- [ ] PR 作成済（承認後のみ）
- [ ] CI gate GREEN（承認後のみ）
- [ ] pr-info.md / pr-creation-result.md 作成済（承認後のみ）

## 苦戦箇所・注意

- **承認なし自動実行禁止**: Phase 13 のルール最重要項目。ユーザーが「進めて」と言うまで blocked のままにする。`gh pr create` を勝手に走らせない
- **branch protection**: main / dev への直接 push は pre-commit hook で拒否される。PR 経由のみ
- **混在コミット**: B-1 のみのコミットで PR を作る。task workflow 仕様書 commit と分離されているか git log で確認
- **A-2 完了の前提**: 上流依存（A-1〜A-3 main マージ済）を 派生実装タスクのPR本文に明記しないと reviewer が依存関係を追跡できない
- **CI hook 失敗時の再 commit**: hook 失敗時は `--amend` ではなく新規コミットを積む（CLAUDE.md ルール）

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の仕様書作成であり、アプリケーション統合テストは追加しない。
- 統合検証は `git check-attr merge`、Phase 11 NON_VISUAL smoke、リンク整合、`artifacts.json` 整合で代替する。
- 派生実装タスクで `.gitattributes` を編集する場合は、本 Phase の検証コマンドをそのまま実行し、結果を outputs に記録する。

## 次 Phase

- 次: なし（最終 Phase）
- post-merge: A-2 完了レビュー時に B-1 attribute 残存確認を行う運用フェーズへ移行
