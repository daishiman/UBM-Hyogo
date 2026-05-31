# Phase 13: PR 作成（user-gated）

**[実装区分: 実装仕様書]**

## 前提

- Phase 1〜12 がすべて完了し `artifacts.json` が更新されている
- ローカルで typecheck / lint / vitest が green
- Phase 11 evidence inventory が `present` または明示 `pending`

## 承認ゲート

Phase 13 は **ユーザー明示承認後のみ** 実行可能。本仕様書側では commit / push / PR 作成を実行しない。

## ブランチ運用

- base branch: `dev`
- feature branch 例: `feat/admin-sidebar-public-return-link`
- 親 workflow `public-header-logged-in-nav-cleanup` が別ブランチで進行中の場合、本タスクは独立 PR でも、親 PR への absorb でも可（ユーザー判断）

## Commit メッセージ案

```
feat(admin-sidebar): 「公開サイトに戻る」リンクを最下段に追加

- AdminSidebar の Public セクションから `/`（ホーム）を除去
- footer 直前に `<a data-role="public-return" aria-label="公開サイトに戻る">` を追加
- AdminSidebar.spec.tsx に T1-T11 regression を追加

Refs docs/30-workflows/public-header-logged-in-nav-cleanup/tasks/task-f-admin-sidebar-public-return.md

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## PR 本文テンプレ

```markdown
## Summary
- AdminSidebar に「公開サイトに戻る」リンクを追加（最下段、SignOutButton 直上）
- 既存「ホーム」ラベルを廃止し意味を整理
- DOM 契約 `data-role="public-return"` で regression を anchor 化

## 変更ファイル
- apps/web/src/components/layout/AdminSidebar.tsx
- apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx

## Test plan
- [ ] mise exec -- pnpm typecheck
- [ ] mise exec -- pnpm lint
- [ ] mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/layout/__tests__/AdminSidebar.spec.tsx
- [ ] /admin で sidebar 最下段に「公開サイトに戻る」が表示される（手動）
- [ ] クリックで `/` へ遷移する（手動）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 実行コマンド（ユーザー承認後）

```bash
# 1. CLAUDE.md PR autonomous flow に従う
bash scripts/verify-pr-ready.sh

# 2. ブランチを最新 dev と同期
git fetch origin dev
git merge origin/dev --no-edit

# 3. push
git push -u origin feat/admin-sidebar-public-return-link

# 4. PR 作成
gh pr create --base dev --title "feat(admin-sidebar): 「公開サイトに戻る」リンクを最下段に追加" \
  --body "$(cat <<'EOF'
...（上記 PR 本文テンプレ）
EOF
)"
```

## 完了条件

- ユーザーが「PR 作成」を明示
- `bash scripts/verify-pr-ready.sh` が exit 0
- `gh pr create` が成功し PR URL を返す
- 本 workflow は `implemented_local_evidence_captured`。Phase 13 はユーザー明示承認後に commit / push / PR を実施し、PR merge 時に `completed` へ昇格
