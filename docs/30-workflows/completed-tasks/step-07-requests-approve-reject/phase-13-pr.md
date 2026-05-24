# Phase 13: PR 作成

**[実装区分: 実装仕様書]**
**Workflow**: step-07-requests-approve-reject
**前提 Phase**: phase-12-documentation
**次 Phase**: なし（終端）

## 目的

base=`dev` への PR を作成する。PR 作成、push、commit はユーザーの明示承認後にのみ実行する。

## 事前チェック

| 項目 | 確認方法 |
|---|---|
| 実装 phase artifacts 生成済 | 実装実行後に artifacts.json `phases.*.status` が `completed` / `runtime_pending` / `pending_user_approval` の実態と一致 |
| Phase 11 evidence 5 点セット | `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` 存在 |
| Phase 12 strict 7 outputs | `outputs/phase-12/*.md` 7 ファイル存在 |
| commit clean | `git status --porcelain` が空（または unstaged を全て add 済） |

## 実行ステップ

```bash
# 1. dev 取り込み
git fetch origin dev
git checkout dev && git pull --ff-only origin dev
git checkout -                # 作業ブランチへ戻る
git merge dev                 # 必要に応じ conflict resolve

# 2. pre-flight gate
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh

# 3. push（ユーザー明示承認後のみ）
git push -u origin HEAD

# 4. PR 作成（ユーザー明示承認後のみ）
gh pr create --base dev --title "feat(admin/requests): step-07 approve/reject 二段階確認 + 409 conflict 処理" --body "$(cat <<'EOF'
## Summary
- admin/requests で visibility_request / delete_request の approve/reject を二段階確認 UI で実行できるようにする。
- 409 conflict (`already_resolved`) を toast + router.refresh() で処理。
- useAdminMutation (step-01) + useConfirmDialog (step-06) を再利用し、RequestQueuePanel の state を圧縮。

## 変更対象ファイル
- apps/web/src/components/admin/RequestQueuePanel.tsx (refactor)
- apps/web/src/components/admin/RequestQueueDetail.tsx (新規)
- apps/web/src/components/admin/RequestConfirmDialog.tsx (新規)
- apps/web/src/components/admin/__tests__/{RequestQueuePanel.component,RequestQueueDetail,RequestConfirmDialog}.spec.tsx

## DoD
- 27 test case green / coverage ≥80%
- typecheck / lint / build 0 error
- verify-design-tokens / verify-phase12-compliance gate green
- CLAUDE.md 不変条件 9, 10 遵守

## Test plan
- [ ] pnpm test apps/web --run -- RequestQueuePanel.component.spec.tsx
- [ ] pnpm test apps/web --run -- RequestQueueDetail.spec.tsx
- [ ] pnpm test apps/web --run -- RequestConfirmDialog.spec.tsx
- [ ] 手動 QA-01..QA-10 / EC-01..EC-05 (phase-9)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## base ブランチ

**`dev`**（CLAUDE.md 既定）。`main` は dev→main release 時のみ。

## PR 本文構成（CLAUDE.md PR 自律フロー §PR本文）

- Summary
- 変更対象ファイル一覧（`git diff dev...HEAD --name-only` と整合）
- DoD
- Test plan
- Screenshot 参照: `outputs/phase-11/` に画像が存在する場合のみ追記（NON_VISUAL のため通常は省略）

## 完了条件

- PR URL 取得
- base=dev であること
- required status checks green（CI 完了後）

## ユーザーゲート

この Phase 13 は実行手順の仕様であり、本 workflow 作成時点では `pending_user_approval`。ユーザー指示なしに commit / push / PR 作成を実行しない。
