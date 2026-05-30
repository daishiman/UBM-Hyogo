# Phase 13 — PR 作成

**user の明示承認後のみ実施する。**

## 1. ブランチ

- 作業ブランチ: `feat/public-header-session-aware-auth-view-base`
- base: `dev`

## 2. 事前ゲート

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

すべて exit 0 を確認。

## 3. PR 本文構成

```markdown
## Summary
- PublicHeader を async server component 化し、ログイン状態（guest/member/admin）で auth CTA を出し分け
- AuthView 型 / resolveAuthView() 純関数 / getAuthView() async helper を新設し、後続 Task B/C/E/G の共有基盤を確立
- (public)/layout.tsx を async 化し PublicHeader へ authView を配信

## Test plan
- [x] mise exec -- pnpm typecheck
- [x] mise exec -- pnpm lint
- [x] vitest 24 ケース PASS (resolveAuthView 9 + getAuthView 4 + PublicHeader 8 + PublicLayout 3)
- [x] HEX 直書き grep 0 hit
- [x] Phase 11 screenshot 3 状態取得 (guest/member/admin)
```

## 4. 画像参照

`outputs/phase-11/screenshots/` の 3 画像を PR 本文末尾に参照添付。

## 5. 実行コマンド（user 承認後）

```bash
gh pr create --base dev --title "feat(public-header): session-aware auth view base" --body "$(cat <<'EOF'
... (上記 §3)
EOF
)"
```

## 6. 完了条件

- [ ] PR URL 取得
- [ ] CI required status check すべて green
- [ ] staging deploy（user-gated）

## 7. 注意

- `--no-verify` 使用禁止
- amend ではなく新規 commit
- staging deploy / runtime smoke は本タスクスコープ外（user-gated 別 wave）
