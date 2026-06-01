# ドキュメント更新履歴

## 2026-05-31 — member-publish-recovery-form-ops-and-admin-link 実装反映（implemented_local_static_evidence_captured_runtime_visual_pending）

### 新規作成

| パス | 内容 |
|------|------|
| `docs/30-workflows/member-publish-recovery-form-ops-and-admin-link/index.md` | workflow 概要 + 4 タスク俯瞰 |
| `.../artifacts.json` / `.../outputs/artifacts.json` | artifacts（parity 同期） |
| `.../phase-1.md` 〜 `.../phase-13.md` | 設計書（1-3）+ 各 phase（4-13） |
| `.../tasks/A-publish-state-backfill-admin-ui.md` | Task A 実装仕様書 |
| `.../tasks/B-manual-form-resync-admin-ui.md` | Task B 実装仕様書 |
| `.../tasks/C-reflection-timing-visibility-and-sla-doc.md` | Task C 実装仕様書 |
| `.../tasks/D-admin-google-form-responses-link.md` | Task D 実装仕様書 |
| `.../outputs/phase-11/main.md` | Phase 11 evidence index（local static PASS / runtime visual pending） |
| `.../outputs/phase-11/manual-test-result.md`, `screenshot-plan.json`, `screenshot-coverage.md`, `phase11-capture-metadata.json` | Phase 11 runtime visual pending 境界と取得計画 |
| `.../outputs/phase-12/*.md` | Phase 12 strict 7 |

### 実装反映

| パス | 変更内容 | タスク |
|------|---------|--------|
| `apps/web/src/features/admin/components/_sync/` | backfill / manual resync 操作パネル追加 | A/B |
| `apps/web/app/api/admin/[...path]/route.ts` | current sync 系 path に server-side `SYNC_ADMIN_TOKEN` Bearer 注入、未設定 500 | B |
| `apps/web/src/components/public/ReflectionTimingNote.tsx` | `/members` / `/profile` の反映タイミング表示 | C |
| `docs/00-getting-started-manual/specs/03-data-fetching.md` | 反映 SLA セクション追記 | C |
| `apps/web/src/components/shell/*`, `apps/web/src/lib/constants/form.ts` | Google Form 回答 external nav link | D |

### 検証コマンド記録

- `pnpm --filter @ubm-hyogo/web typecheck` PASS
- Focused Vitest PASS（8 files / 53 tests）
- `pnpm --filter @ubm-hyogo/web lint` PASS
- legacy endpoint grep gate PASS（active scope に `/admin/sync/run` / `/admin/sync/backfill` なし）
- Playwright runtime visual capture attempted; no PNG captured, runtime visual remains pending
- `git status` / `git diff --stat` により apps/web + docs 実変更を確認
