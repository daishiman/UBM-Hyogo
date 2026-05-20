# dev sync — generated artifacts drift (static-manifest) パターン記録 (2026-05-19)

`feat/ut-07c-followup-001-attendance-csv-import` への `origin/dev` 取り込みで、skill 系 conflict 解消後に CI が `verify-static-manifest` で `sourceSpecHashDrift` を返した事例を記録する。

## パターン
- dev 取り込みで `apps/api/src/sync/**` / `packages/shared/src/zod/**` / `apps/api/src/repository/_shared/**` の source spec が更新される
- ローカルに残る `apps/api/src/repository/_shared/generated/static-manifest.json` は HEAD 時点のハッシュなので drift
- CI `verify-static-manifest` job が `sourceSpecHashDrift` で fail → 下流の `coverage-gate` も連鎖 fail

## 解消手順（branch-sync 完了後に必ず実行）
1. `mise exec -- pnpm install --frozen-lockfile`
2. `mise exec -- pnpm regenerate:static-manifest`
3. `git status -s` で `apps/api/src/repository/_shared/generated/static-manifest.json` の M を確認
4. 差分があれば `git add` + `git commit -m "chore: regenerate static-manifest after dev sync"` で同 wave に積む
5. 任意で `mise exec -- pnpm verify:static-manifest` を local で実行し PASS 確認

## 適用先
- `references/pr-pre-flight-ci-gate-checklist.md` の§3 (generated artifacts drift) に「static-manifest 再生成」を branch-sync 後の必須項目として追加検討。
- 関連: `aiworkflow-requirements/changelog/20260519-dev-sync-ut07c-followup-001-attendance-csv-import.md`
