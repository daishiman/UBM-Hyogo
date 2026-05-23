**[実装区分: 実装仕様書]**

# Phase 13 — PR Summary Draft (serial-05-step-03-schema-diff-resolve)

> 注: 実際の PR 作成 / `git push` / `git commit` はユーザー明示承認まで実行禁止。本ファイルはドラフトのみ。

## PR meta

| key | value |
| --- | --- |
| Title | `feat(serial-05-step-03): admin schema diff list + resolve UI` |
| Base | `dev` |
| Head | `feat/serial-05-step-03-schema-diff-resolve`（実装着手時に作業ブランチ名を確定） |
| Labels (推奨) | `area/admin`, `area/web`, `type/feature`, `wave/serial-05` |

## Summary（3 bullet 以内）

- `apps/web/app/(admin)/admin/schema` の既存 `SchemaDiffPanel` を hardening し、browser proxy `/api/admin/schema/*` と Worker `/admin/schema/*` の既存 API contract に揃える
- 既存 `postSchemaAlias()` helper を単一 mutation 経路として維持し、202 retryable / 409 conflict / 422 collision を feedback として取り扱う
- design token (OKLch) と既存 admin component pattern（serial-05-step-02 と同形）に統一し、grep gate / typecheck / lint / test / build の PASS 5 点と Issue #775 fixture-backed visual evidence 11 PNG を取得する

## Test plan（checklist）

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm test apps/web --run -- SchemaDiffPanel.component.spec.tsx` exit 0
- [ ] `mise exec -- pnpm build` exit 0
- [ ] grep gate（`bg-\[#` / `text-\[#` / `process\.env\.`）match 0 件
- [ ] dev server 起動 → `/admin/schema` で diff list 表示確認
- [ ] row button → form open → 200 OK で `router.refresh()` + success feedback
- [ ] 202 retryable / 409 conflict / 422 collision で form feedback
- [ ] GET 失敗は error boundary / fixture fallback として扱い、POST 422 を read-only fallback にしない
- [ ] Issue #775 visual evidence 11 PNG（4 pane × desktop/mobile + resolve success/409/422）を `outputs/phase-11/screenshots/` に保存し、legacy placeholder を PASS inventory から除外

## 関連 spec / issue

- ソース spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-03-schema-diff-resolve/spec.md`
- 親ワークフロー: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/index.md`
- 仕様パッケージ root: `docs/30-workflows/serial-05-step-03-schema-diff-resolve/index.md`
- 前提 PR: serial-05-step-01（useAdminMutation hook）/ parallel-08（shared foundation）

## 注意事項

- 本タスクでは `apps/api/` の variation・D1 schema・Google Form schema を一切変更しない
- production リリースは `dev → main` PR で別途行う（本 PR は base = `dev`）
- screenshot / runtime evidence は実装着手後に取得し別途 push する
