# Phase 13: PR 作成

> Phase: 13 / 13

---

## 前提

- user の明示承認後のみ実施
- base ブランチ: `dev`（CLAUDE.md 既定）

---

## 13.1 事前チェック

```bash
git fetch origin dev
git status --porcelain          # 空であること
git diff dev...HEAD --name-only # 変更ファイルリスト確認
cmp -s docs/30-workflows/completed-tasks/parallel-03-prototype-ux-css/artifacts.json docs/30-workflows/completed-tasks/parallel-03-prototype-ux-css/outputs/artifacts.json
test -f docs/30-workflows/completed-tasks/parallel-03-prototype-ux-css/outputs/phase-12/phase12-task-spec-compliance-check.md
find docs/30-workflows/completed-tasks/parallel-03-prototype-ux-css/outputs/phase-12 -maxdepth 1 -type f | wc -l
```

---

## 13.2 quality gate（PR 作成前）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual
```

失敗時は修正して再実行する。コミット、push、PR 作成は user の明示承認後のみ実施する。

---

## 13.3 PR 作成

```bash
gh pr create --base dev --title "feat(ui): prototype UX/CSS feedback G3-1/2/3 implementation" --body "$(cat <<'EOF'
## Summary
- Tag pill に `aria-pressed` / `data-selected` / `data-component="tag-pill"` を付与し、選択時の塗りつぶしを CSS layer で実装（G3-1）
- Member card hover/focus-visible 用 transition を `globals.css` `@layer components` に追加（G3-2）
- Profile section に `data-visibility` 属性と左ボーダー + icon の視覚マーカーを追加（G3-3）

## Implementation notes
- OKLch token のみ使用、HEX 直書きなし
- `apps/api` / D1 schema / Google Form 仕様は無変更
- section visibility は API 未提供のため UI 側で `"public"` fallback

## Test plan
- [ ] `pnpm typecheck` / `pnpm lint` `completed (exit 0)`
- [ ] Vitest（`MemberFilters` / `MemberDetailSections`）`completed (exit 0)`
- [ ] Playwright visual smoke `completed (exit 0)`
- [ ] axe a11y violations 0
- [ ] `verify-design-tokens` CI gate `completed (exit 0)`

## Screenshots
`outputs/phase-11/screenshots/` 参照（tag-pill / member-card / profile-section 各種）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 13.4 報告事項

- PR URL
- 採用ブランチ
- 自動修復履歴
- 解消したコンフリクト
- 残課題（あれば Phase 12 未タスクへリンク）
