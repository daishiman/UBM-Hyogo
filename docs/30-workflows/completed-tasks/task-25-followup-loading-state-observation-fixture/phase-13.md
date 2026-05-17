# Phase 13: PR 作成（ユーザー明示承認後）

`[実装区分: 実装仕様書]`

## 状態

`blocked`（ユーザー明示承認まで実行禁止。CONST_002 / セキュリティポリシー準拠）。

## PR メタ情報

| 項目 | 値 |
|------|----|
| Source branch | `feat/task-25-followup-loading-state-fixture` |
| Base branch | `dev` |
| Title | `feat(task-25-followup): deterministic loading-state smoke fixture` |
| Linked Issue | https://github.com/daishiman/UBM-Hyogo/issues/711（CLOSED のまま参照のみ。reopen はしない） |
| Reviewer | solo dev policy（自己マージ可） |

## PR Body の必須セクション

1. **Summary**
   - `apps/web/app/loading.tsx` の runtime 観測を deterministic に行う staging smoke fixture を追加
   - matrix 行 19 の `N/A-runtime-observation` を実観測へ置換
   - 既存 `__smoke__/error-boundary` と同パターンの env 二重ガードで production 漏出を防止

2. **変更ファイル**（Phase 5 + Phase 8 の最終形）
   - 新規: `apps/web/app/smoke/loading-state/page.tsx`
   - 新規: `apps/web/app/smoke/loading-state/loading.tsx`
   - 編集: `apps/web/tests/e2e/staging-smoke.spec.ts`
   - 編集: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
   - 新規（任意）: `apps/web/app/__smoke__/_lib/fixture-guard.ts`（Phase 8 で集約した場合）

3. **Test plan**
   - [ ] `pnpm typecheck` pass
   - [ ] `pnpm lint` pass
   - [ ] `pnpm --filter @ubm-hyogo/web build` pass
   - [ ] `playwright-smoke / smoke (chromium)` CI gate pass
   - [ ] `verify-design-tokens` CI gate pass
   - [ ] Phase 11 手動 evidence 添付

4. **Issue #711 対応マトリクス**
   - deterministic latency 制御: `clampDelay` + setTimeout server-side
   - loading selector assert: `data-page="smoke-loading-state"` + `role="status"`
   - matrix `N/A-runtime-observation` 置換: 行 19 更新済

## 実行コマンド（承認後）

```bash
# 1) ローカル整合確認
git status --porcelain
git diff dev...HEAD --name-only

# 2) push
git push -u origin feat/task-25-followup-loading-state-fixture

# 3) PR 作成
gh pr create --base dev --title "feat(task-25-followup): deterministic loading-state smoke fixture" --body "$(cat <<'EOF'
## Summary

- `apps/web/app/loading.tsx` runtime 観測を deterministic に行う staging smoke fixture を追加
- `SMOKE-COVERAGE-MATRIX.md` 行 19 の `N/A-runtime-observation` を実観測へ置換
- 既存 `__smoke__/error-boundary` と同パターンの env 二重ガードで production 漏出を防止

## Test plan
- [ ] pnpm typecheck
- [ ] pnpm lint
- [ ] pnpm --filter @ubm-hyogo/web build
- [ ] playwright-smoke / smoke (chromium)
- [ ] verify-design-tokens

Refs: #711
EOF
)"
```

## 注意事項

- Issue #711 は CLOSED のまま運用する（reopen 禁止）。PR 本文には `Refs: #711` を使用し `Closes #711` は使わない。
- `main` への直接 PR は禁止（`dev` 経由のみ）。
- CONST_002 によりユーザー明示承認まで `git push` / `gh pr create` を実行しない。
