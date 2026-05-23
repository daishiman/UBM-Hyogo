# Phase 13: PR 作成

**前提:** Phase 1-12 がすべて完了し、user が PR 作成を明示的に承認していること。承認なしでは実行禁止。

## 事前確認

```bash
git status --porcelain
git fetch origin dev
git diff dev...HEAD --name-only
```

期待される diff 対象:

```
apps/web/app/page.tsx
apps/web/src/components/public/CallToActionCTA.tsx
apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx
apps/web/src/lib/constants/form.ts
apps/web/src/lib/constants/__tests__/form.spec.ts
apps/web/src/styles/legacy-public.css
docs/30-workflows/integration-fixes-i04-homepage-cta-implementation/...
docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i04-homepage-cta/spec.md (status 更新)
docs/30-workflows/unassigned-task/integration-fixes-i04-homepage-cta.md (resolved 化)
```

## ブランチ

`feat/integration-fixes-i04-homepage-cta`（既存 worktree のブランチ）

## PR base

`dev`（CLAUDE.md 既定）

## PR title

`feat(i04): HomePage に prototype CallToActionCTA section を追加 (closes-ref #767)`

## PR body 構成

CLAUDE.md「PR作成の完全自律フロー」+ `.claude/commands/ai/diff-to-pr.md` Phase 13 仕様 + `outputs/phase-12/implementation-guide.md` を反映:

```markdown
## Summary
- HomePage 末尾に prototype `pages-public.jsx:136-149` 由来の dark variant CTA "FOR MEMBERS / メンバー情報の掲載をお願いします" を実装
- `CallToActionCTA` component + `FORM_RESPONDER_URL` 定数の新規作成
- legacy-public.css に dark variant style を追加（OKLch token のみ・HEX なし）

## Background
- GitHub issue #767 は CLOSED だがコード調査で未実装を確認
- parent spec `parallel-i04-homepage-cta/spec.md` が in-place fix 予定で残置されていたため Phase 1-13 で実装可能仕様化

## Test plan
- [ ] `pnpm -F "@ubm-hyogo/web" exec vitest run apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx`
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] dev server で `/` を開き dark variant CTA section の目視確認
- [ ] external link が新タブで開くこと

## Screenshots
- desktop / mobile / full-page の 3 件（`outputs/phase-11/screenshots/`）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 実行コマンド

```bash
gh pr create --base dev --title "..." --body "$(cat <<'EOF'
... (上記内容) ...
EOF
)"
```

## 完了条件

- [ ] user 明示承認取得
- [ ] PR URL を取得し最終レポートに記載
- [ ] issue #767 は **CLOSED のまま**（ユーザー明示指示）

## 成果物

`outputs/phase-13/pr-url.md`（PR URL を記録）
