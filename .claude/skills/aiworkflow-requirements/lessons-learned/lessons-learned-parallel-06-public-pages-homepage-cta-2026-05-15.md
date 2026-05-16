# Lessons Learned — parallel-06 Public Pages HomePage CTA（2026-05-15）

> task: `parallel-06-public-pages-homepage-cta`
> 関連 spec: `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`、`docs/00-getting-started-manual/specs/09b-design-tokens.md`
> 関連 source: `apps/web/src/components/public/CallToActionCTA.tsx`、`apps/web/src/lib/constants.ts`、`apps/web/app/page.tsx`、`apps/web/app/(public)/register/page.tsx`、`apps/web/app/login/_components/LoginStatus.tsx`、`vitest.config.ts`
> 関連 reference: `task-workflow-active.md`（parallel-06 行）/ `quick-reference.md`（parallel-06 ブロック）/ `resource-map.md`（parallel-06 行）

## 教訓一覧

### L-PAR06-001: test suffix 統一 wave (issue-623) 後は **`vitest.config.ts` の include / exclude 双方を再確認**する

- **背景**: 本タスクで `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` を追加した際、root `vitest.config.ts` の `exclude` に `apps/web/src/lib/__tests__/issue-399-seed-syntax.test.ts` のみが残っており、`.spec.ts` への suffix converge 後の対応する path が未除外で root gate が break した。
- **教訓**: `.test.ts` → `.spec.ts` への suffix 統一マージ後、root vitest config の `exclude` array は **既存除外行と同じ glob を `.spec.ts` 側にも複製**する必要がある（issue-623 の波及作業）。新規テスト追加時に root config 起動が失敗したら、まず suffix convergence の補正漏れを疑う。
- **将来アクション**: test suffix 統一 wave 完了後の follow-up タスクとして「`vitest.config.ts` の `exclude` glob を `.spec.{ts,tsx}` 双方に展開する補正」を CI gate（`verify-test-suffix`）の隣接チェックに含めることを検討する。

### L-PAR06-002: Phase 11 full-page screenshot は **Playwright Node API `locator().screenshot()`** を正本にする

- **背景**: 初期手順は `playwright screenshot --selector` の CLI を想定していたが、CLI はセレクタマッチング出力を stdout に混在させ、log redirect で evidence が破綻した。
- **教訓**: Phase 11 visual evidence の component close-up screenshot は、Playwright Node API の `page.locator('[data-component="..."]').screenshot({ path })` を使い、log とファイル出力を物理分離する。CLI `--selector` オプションは evidence 取得には非推奨。
- **将来アクション**: 以後の VISUAL タスクで component-scope close-up が必要な場合は、Playwright spec を `outputs/phase-11/` 配下に小スクリプトとして配置し、`page.locator(...)` chain を使う標準パターンとする。CLI 利用は full-page スクリーンショット限定とする。

### L-PAR06-003: 実 worktree に `apps/web` 差分があるのに `spec_created` と分類するのは aiworkflow ledger discovery を破壊する

- **背景**: 初期 close-out で `workflow_state=spec_created / no impl yet` となっていたが、実 worktree には CTA component / page integration / fallback 統一のフル実装が存在した。状態語彙の drift により、aiworkflow-requirements の resource-map / quick-reference 経由の discovery が「未実装」と誤読される。
- **教訓**: Phase 12 entry checklist で `git status --porcelain apps/ packages/` を生で転記し、dirty diff があれば `implemented_local_evidence_captured` 系に再分類する。既存ルール（`phase-12-spec.md` / `phase-12-documentation-guide.md`）の適用漏れを Phase 12 着手時に必ずチェックする。
- **将来アクション**: workflow_state 再分類時は **同一 wave** で `artifacts.json` / `outputs/artifacts.json` / `index.md` / Phase 12 outputs / aiworkflow-requirements ledgers (`resource-map.md` / `quick-reference.md` / `task-workflow-active.md` / `LOGS/_legacy.md`) / `docs/30-workflows/LOGS.md` を全て同期する。一つでも漏れると discovery が壊れる。

### L-PAR06-004: pre-PR の workflow root を `completed-tasks/` 下に置かない

- **背景**: 本タスクは `implementation_complete_pending_pr`（Phase 13 user-gated 残）であるにもかかわらず、worktree 上で `docs/30-workflows/completed-tasks/parallel-06-public-pages-homepage-cta/` に配置されており、`completed-tasks-policy.md`（PR merge 後のみ `completed-tasks/<category>/` へ `git mv`）に違反していた。
- **教訓**: `completed-tasks/` は **Phase 13 PR merge 完了後**のディレクトリ。pre-PR の workflow root は `docs/30-workflows/<workflow-slug>/` の top-level に置く。aiworkflow ledgers の path 表記と physical 配置が乖離した場合は、ledger 表記（policy 準拠）を正として physical を移動する。
- **将来アクション**: Phase 12 の compliance check で「`workflow_state != merged_*` なのに `completed-tasks/` 配下に存在しないか」の検証ステップを明示化する。
