# Phase 13 — PR 作成

## 13.1 PR base / title

- base: `dev`
- branch: `refactor/issue-622-packages-test-suffix-rename`
- title: `refactor(packages): rename test suffix .test.ts → .spec.ts (issue-622)`

## 13.2 PR 本文 template

```markdown
## Summary

- `packages/shared` (17 files) と `packages/integrations` (11 files) 合計 28 ファイルの `*.test.ts` を `*.spec.ts` に rename
- Issue body の 26 files は起票時集計であり、current worktree 実測に基づく実装対象は 28 files
- `packages/shared/ADR-test-suffix.md` および `packages/integrations/ADR-test-suffix.md` を Accepted で追加
- `apps/api` (#325) / `apps/web` (#621) に続くモノレポ test suffix 横断統一の最終ピース
- 種別 prefix（unit/zod/db/contract/mapper）の導入は本 PR 範囲外。既存 `auth.contract.test.ts` 等の慣例は `*.contract.spec.ts` で温存

## Closes

Closes #622
Refs #325, #621, #623

## Test plan

- [ ] `find packages -name '*.test.ts' -o -name '*.test.tsx' \| wc -l` = 0
- [ ] `find packages -name '*.spec.ts' -o -name '*.spec.tsx' \| wc -l` = 28
- [ ] `mise exec -- pnpm typecheck` 新規エラー 0
- [ ] `mise exec -- pnpm lint` 新規エラー 0
- [ ] `mise exec -- pnpm -r test` baseline と同件数 PASS
- [ ] `mise exec -- pnpm --filter '@ubm-hyogo/shared' test` PASS
- [ ] `mise exec -- pnpm --filter '@ubm-hyogo/integrations' test` PASS
- [ ] `mise exec -- pnpm --filter '@ubm-hyogo/integrations-google' test` PASS
- [ ] `git log --follow` で抜き打ち 1 ファイルの履歴連続性確認
- [ ] `rg "packages/.*\.test\."` が `.github/` / `apps/` / `scripts/` で 0 件

## Follow-ups

- #623 / followup-003: ルート vitest.config の `{test,spec}` → `spec` 単一収斂（既存未タスクを本 PR merge 後に unblock）
- 種別 prefix（zod/db/contract/mapper）は本 PR では未起票。各 package ADR の Non-goal として残し、実需要発生時に再評価
```

## 13.3 Issue 状態方針

- Issue #622 は OPEN → PR merge で **CLOSE**（`Closes #622` 使用）
- 上流 #325 / #621 は CLOSED 維持（`Refs` のみ）
- 下流 #623 は本 PR merge 後に unblock されるため `Refs #623` のみ

## 13.4 PR 作成コマンド

```bash
gh pr create --base dev --title "refactor(packages): rename test suffix .test.ts → .spec.ts (issue-622)" --body "$(cat <<'EOF'
（13.2 の本文を貼る）
EOF
)"
```

## 13.5 マージ後 followup

- #623 / followup-003（vitest spec 単一収斂）の Issue / 仕様書を確認し、ブロック解除を通知
