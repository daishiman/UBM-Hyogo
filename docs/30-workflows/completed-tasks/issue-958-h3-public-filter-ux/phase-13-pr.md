# Phase 13 — PR 作成（user-gated）

## 0. 前提

CONST_002: user 明示承認後のみ実施。本仕様書段階では `gh pr create` を実行しない。

## 1. PR 作成手順

```bash
git fetch origin dev
git checkout feat/issue-958-h3-public-filter-ux
git merge origin/dev   # conflict は CLAUDE.md 既定方針で解消
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
git add -A
git status --porcelain   # 残差なし確認
git diff dev...HEAD --name-only
```

## 2. PR 本文

`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として参照し、`outputs/phase-12/implementation-guide.md` を反映。

### title 候補

`feat(web): H3 公開フィルタ UX 改修（profile callout + admin bulk republish + public fallback）`

### body 骨子

```
## Summary
- Track A: profile に PublicConsentCallout を追加（Google Form 再回答誘導）
- Track B: admin /admin/members に一括公開復帰 drawer 追加（既存 PATCH 反復）
- Track C: /members で全 hidden 状態を fallback 表示し離脱抑制

Refs: #958 (CLOSED, Refs 運用)
親 workflow: docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/

## Test plan
- [ ] vitest targeted run pass
- [ ] typecheck / lint pass
- [ ] verify-pr-ready.sh pass
- [ ] verify-design-tokens pass
- [ ] Phase 11 screenshots 10 件添付
```

screenshot 参照は `outputs/phase-11/screenshots/*.png` が存在する場合のみ追記。

## 3. base ブランチ

`--base dev`（production リリースでない）

## 4. 完了条件

- [x] PR 作成手順明示
- [x] body 骨子確定
- [x] user-gated 明記
