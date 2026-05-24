# Phase 13: PR 作成

> **CONST_002 / CLAUDE.md §「PR 作成は自動実行しない」**: 本ワークフローではユーザー明示承認を待ってから PR を作成する。

## 1. ブランチ

- `feat/members-page-prototype-alignment-spec`（本仕様書作成用。Phase 5 実装も同 branch 続行で OK）
- base: `dev`

## 2. PR 作成手順（実装完了後）

```bash
# 事前 verify
mise exec -- bash scripts/verify-pr-ready.sh

# push
git push -u origin HEAD

# PR 作成
gh pr create --base dev --title "feat: /members page prototype alignment" --body "$(cat <<'EOF'
## Summary
- /members 公開画面とプロトタイプの視覚的乖離を解消
- PublicHeader / PublicFooter / DensityToggle / MemberFilters / MemberTable / page-head の DOM/CSS をプロトタイプ準拠に整える
- 既存 API / token / primitive のみ利用、新 endpoint / D1 変更なし

## Test plan
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm build` pass
- [ ] vitest unit 全 pass（DensityToggle / MemberCard / MemberFilters）
- [ ] Playwright `members-prototype-alignment.spec.ts` pass
- [ ] `pnpm verify:tokens` pass
- [ ] staging deploy 後の `/members` を comfy/dense/list + mobile で目視確認

## Evidence
- `docs/30-workflows/members-page-prototype-alignment/outputs/phase-11/screenshots/EV-1..6`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 3. 完了条件

- PR URL を取得し index.md にリンク追記
- レビュー指摘があれば対応サイクル開始
