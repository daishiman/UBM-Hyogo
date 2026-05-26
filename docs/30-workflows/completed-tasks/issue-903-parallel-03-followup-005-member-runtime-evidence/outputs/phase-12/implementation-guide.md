# Phase 12 — implementation-guide

[実装区分: 実装仕様書]

PR message source。`../../phase-05-implementation-guide.md` を正本とする。Phase 13 commit/PR draft は `../../phase-13-commit-pr.md` を参照。

## 主要変更（PR summary 用）

- `apps/web/app/profile/**` → `apps/web/app/(member)/profile/**` へ git mv（URL は route group 仕様で不変）
- `apps/web/src/__tests__/static-invariants.runtime.spec.ts` の path 参照 4 か所更新
- `apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts` 新規
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-member.txt` 新規
- 同 `outputs/phase-11/screenshots/member-shell.png` 新規
- 同 `phase-11-evidence-inventory.md` の EV-13 / EV-16 を `present` へ更新

## 検証

```bash
mise exec -- pnpm typecheck && mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```
