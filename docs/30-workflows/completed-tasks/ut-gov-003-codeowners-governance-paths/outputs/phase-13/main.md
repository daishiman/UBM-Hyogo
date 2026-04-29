# Phase 13 main — UT-GOV-003 CODEOWNERS（PR 作成手順 / user 明示承認待ち）

> **status**: NOT EXECUTED — awaiting user approval
> **本 PR の性質**: Phase 12 までの成果物と `.github/CODEOWNERS` / docs 整理差分を提出する。PR 作成はユーザー承認後のみ。
> **user_approval_required**: true

## 1. 承認ゲート

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 11 必須 3 outputs | `outputs/phase-11/{main,manual-smoke-log,link-checklist}.md` 揃い | 要確認 |
| Phase 12 必須 6 outputs | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report}.md` 揃い | 要確認 |
| `screenshots/` 不在 | NON_VISUAL 整合（`outputs/phase-11/screenshots/` 不在） | 要確認 |
| 1Password URI 混入 | 0 件（`rg "op://"`） | 要確認 |
| 計画系 wording 残存 | 0 件（`rg "仕様策定のみ\|実行予定\|保留として記録"`） | 要確認 |
| Secret 混入 | 0 件 | 要確認 |
| user 明示承認 | 「PR を作成してよい」明示指示 | **承認待ち** |

> 全項目 PASS まで `git commit` / `git push` / `gh pr create` を実行しない。

## 2. local-check（docs-only）

```bash
# 必須 outputs 確認
ls docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/
ls docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/
ls docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-13/

# screenshots/ 不在
test ! -d docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/screenshots && echo "OK"

# 計画系 wording / 1Password URI / Secret
rg -n "仕様策定のみ|実行予定|保留として記録" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/ \
  || echo "計画系 wording なし"
rg -n "op://" docs/30-workflows/ut-gov-003-codeowners-governance-paths/ \
  || echo "1Password URI 混入なし"
rg -nE "ya29\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=" docs/30-workflows/ut-gov-003-codeowners-governance-paths/ \
  || echo "Secret 混入なし"

# Part 1 / Part 2 構造
rg -n "^## Part [12]" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/implementation-guide.md
```

## 3. PR メタ情報

| 項目 | 値 |
| --- | --- |
| title | `docs(workflow): add UT-GOV-003 codeowners governance task spec (#146)` |
| base | `dev` |
| head | 現行 worktree branch |
| labels | `area:docs` / `task:ut-gov-003` / `governance` |
| linked issue | #146（`Refs #146`） |

## 4. PR body 草案

```markdown
## Summary
GitHub Issue #146「[UT-GOV-003] CODEOWNERS governance path 整備」のタスク仕様書、`.github/CODEOWNERS`、docs 整理差分を `docs/30-workflows/ut-gov-003-codeowners-governance-paths/` の Phase 12 close-out として提出する PR。

- 実 `.github/CODEOWNERS` 適用 / `doc/` `docs/` 整理は本差分に含む。
- `require_code_owner_reviews=true` は有効化しない。

## 変更内容
- `.github/CODEOWNERS`
- `CLAUDE.md`
- `docs/00-getting-started-manual/**`
- `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`
- `docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-{11,12,13}.md`
- `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/{main,manual-smoke-log,link-checklist}.md`
- `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report}.md`
- `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-13/main.md`

## Test plan
- [ ] Phase 11 NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）が記載
- [ ] `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` が `{"errors":[]}`
- [ ] 5 governance path × suggested reviewer 観察はユーザー承認後の PR smoke で実施
- [ ] Phase 12 必須 5 outputs（+ main.md）が揃っている
- [ ] implementation-guide が Part 1 + Part 2 構成
- [ ] 1Password URI / 計画系 wording / Secret 混入が 0 件
- [ ] docs validator PASS

## Issue reference
- Refs #146（Closes にするかは PR 作成時に確認）
- 関連: UT-GOV-001 / UT-GOV-002 / UT-GOV-004 / UT-GOV-005

## 注意事項
- 本 PR は `.github/CODEOWNERS` 編集を含む。
- solo 運用方針のため `require_code_owner_reviews=true` は有効化しない。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 5. PR 作成コマンド（user 承認後のみ実行）

```bash
git status
git branch --show-current

git add docs/30-workflows/ut-gov-003-codeowners-governance-paths/

git commit -m "$(cat <<'EOF'
docs(workflow): add UT-GOV-003 codeowners governance task spec (#146)

- Phase 11 / 12 / 13 仕様書を新規作成
- NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）を CODEOWNERS 適用版で固定
- Phase 12 必須 5 outputs を網羅
- 実 .github/CODEOWNERS 適用 / doc/docs 整理は本差分に含む

Refs #146

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin <current-branch>

gh pr create \
  --title "docs(workflow): add UT-GOV-003 codeowners governance task spec (#146)" \
  --base dev \
  --body "（上記 PR body 草案を貼付）"
```

## 6. ブロック条件

- user 承認なしで commit / push / PR 作成しない
- local-check FAIL（docs validator） → Phase 12 へ差し戻し
- 1Password URI / 計画系 wording / Secret 混入 1 件以上 → 即時停止 / Phase 12 再実施

## 7. マージ後フォロー（user 操作）

- artifacts.json があれば Phase 13 を `completed` に更新
- 後続「Phase 13 PR smoke」を本仕様書を入力に起票
- C-1（`codeowners-validator` action 導入）の unassigned-task ファイル化検討
- GitHub Issue #146 へ「spec 完了 / 実 CODEOWNERS 適用は本差分に含む」コメント追加
