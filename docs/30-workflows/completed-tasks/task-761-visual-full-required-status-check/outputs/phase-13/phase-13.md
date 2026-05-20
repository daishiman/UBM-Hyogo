[実装区分: 実装仕様書]

# Phase 13 — PR 作成

| 項目 | 値 |
|------|------|
| phase | 13 |
| 名称 | PR 作成 |
| status | pending |
| base branch | `dev` |
| working branch | `feat/task-761-visual-full-required-check` |
| 完了条件 | user 明示承認後 `gh pr create --base dev` 成功、PR URL を返却 |

## ⚠️ 重要

`gh pr create` は user 明示承認後のみ実行する。Phase 12 までの成果物完備と Phase 11 evidence 完了を確認後にのみ進む。

## 1. 事前チェック

```bash
git status --porcelain          # 空 or 仕様書ファイルのみ stage 済
git diff dev...HEAD --name-only # 仕様書 16 ファイル + CLAUDE.md (Phase 12 更新)
ls docs/30-workflows/task-761-visual-full-required-status-check/outputs/phase-11/evidence/ | wc -l  # 9 件
```

## 2. Governance Mutation Gate（branch protection contexts POST）

| ブランチ | before evidence | contexts payload | after evidence | user 承認 |
| --- | --- | --- | --- | --- |
| dev | `outputs/phase-11/evidence/dev-protection-before.json.md` | `/tmp/visual-full-contexts.json` | `outputs/phase-11/evidence/dev-protection-after.json.md` | `outputs/phase-13/user-approval-task-761-visual-full-required-status-check-<timestamp>.md` |
| main | `outputs/phase-11/evidence/main-protection-before.json.md` | `/tmp/visual-full-contexts.json` | `outputs/phase-11/evidence/main-protection-after.json.md` | same marker |

User approval marker must include an ISO8601 timestamp and the exact approval phrase. A template file under Phase 11 is not approval evidence.

## 3. PR 作成コマンド

```bash
gh pr create --base dev --title "feat(task-761): visual-full required status check on dev/main" --body "$(cat <<'EOF'
## Summary

- `playwright-visual-full` workflow の 3 viewport job (chromium × desktop / tablet / mobile) を `dev` / `main` の `required_status_checks.contexts` に追加する governance mutation。
- `.github/workflows/playwright-visual-full.yml` の `pull_request.paths` を削除し、docs-only PR でも required check context が pending にならないようにする。
- branch protection contexts POST 前後の JSON evidence を保存。
- rollback remove-contexts payload を draft として残置。

## 追加した required contexts

- `visual-full (desktop)`
- `visual-full (tablet)`
- `visual-full (mobile)`

## evidence

- dev before: `docs/30-workflows/task-761-visual-full-required-status-check/outputs/phase-11/evidence/dev-protection-before.json.md`
- main before: `docs/30-workflows/task-761-visual-full-required-status-check/outputs/phase-11/evidence/main-protection-before.json.md`
- dev after: `.../dev-protection-after.json.md`
- main after: `.../main-protection-after.json.md`
- pull_request 自然発火: `.../pull-request-trigger-natural-firing.md`
- user 承認: `.../user-approval-marker.md`
- rollback payload: `.../rollback-put-payload.md`

## rollback コマンド

```bash
gh api -X DELETE repos/daishiman/UBM-Hyogo/branches/dev/protection/required_status_checks/contexts --input /tmp/visual-full-contexts-remove.json
gh api -X DELETE repos/daishiman/UBM-Hyogo/branches/main/protection/required_status_checks/contexts --input /tmp/visual-full-contexts-remove.json
```

## 視覚証跡

UI/UX変更なしのため Phase 11 スクリーンショット不要。

## Test plan

- [ ] dev / main の `required_status_checks.contexts` が 5 → 8 件に増加
- [ ] 既存 5 contexts が残存
- [ ] `required_pull_request_reviews=null` / `enforce_admins=true` / `lock_branch=false` 等の不変条件保持
- [ ] task-761 PR 自身で `playwright-visual-full` 3 viewport job が pass
- [ ] `.github/workflows/playwright-visual-full.yml` に `pull_request.paths` が存在しない

Refs #761
EOF
)"
```

## 4. PR 作成後

- PR URL を最終レポートに記載
- `outputs/phase-13/phase-13.md` 末尾に作成日時と URL を追記
- artifacts.json の `status` は `implemented`。PR URL は Phase 13 evidence にのみ追記し、commit / push / PR は user approval 後に実行する。

## 5. base branch 規約

- 既定: `dev` （CLAUDE.md ルール）
- `main` への PR は production リリース時の `dev → main` のみ。本タスクは `dev` 向け。
