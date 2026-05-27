---
phase: 13
title: Commit / PR draft
workflow_id: google-form-reflection-diagnostics
status: pending_user_approval
---

# Phase 13 — Commit / PR draft

[実装区分: 実装仕様書]

## 1. ブランチ戦略

- 作業ブランチ: `feat/google-form-reflection-diagnostics`
- PR base: **`dev`** (CLAUDE.md 既定)
- main への直接 PR は不可 (production リリース時 `dev → main` のみ)

## 2. Commit 構造案

| commit | 内容 |
| --- | --- |
| 1 | `docs(google-form-reflection-diagnostics): Phase 1-13 spec set + outputs/phase-12 strict 7` |
| 2 | `feat(api): /admin/diagnostics/{forms-pipeline,member/:id} read-only diagnostics endpoints` |
| 3 | `feat(api): contract + unit specs for diagnostics (D1 lane)` |
| 4 | `feat(web): /admin/sync-status route + MemberDrawer diagnostics tab` |
| 5 | `test(web): playwright env-gated sync-status smoke spec` |

solo dev のため必要に応じて squash 可。

## 3. Commit message テンプレート

```
feat(google-form-reflection-diagnostics): Spec-A diagnostics foundation

- Add /admin/diagnostics/forms-pipeline and /admin/diagnostics/member/:id
- Add /admin/sync-status SSR route + Client refresh CTA
- Add MemberDrawer diagnostics tab
- Add contract spec (D1 lane) + unit spec + playwright env-gated smoke
- Phase 1-13 spec set documents H1-H4 hypothesis discrimination scope
- Spec-B (H1-H4 remediation) is intentionally out-of-scope (CONST_007 exception, Phase 1/8)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## 4. PR 本文 draft

```
## Summary

- Google Form 31 項目が admin / profile / public 3 経路すべてで反映されない事象に対する **診断基盤 (Spec-A)** を実装
- staging で /admin/sync-status を開けば H1 (ingest 未稼働) / H2 (本人マッチング切れ) / H3 (公開フィルタで全 hidden) / H4 (schema alias 未割当) のどれが該当するか機械的に切り分け可能
- 修復 (Spec-B 以降) は本 PR 範囲外 (CONST_007 例外、Phase 1/8 参照)

## Files

- `apps/api/src/diagnostics/forms-pipeline.{ts,spec.ts,contract.spec.ts}`
- `apps/api/src/diagnostics/member-diagnosis.{ts,contract.spec.ts}`
- `apps/api/src/index.ts` (route mount)
- `apps/web/app/(admin)/admin/sync-status/page.tsx`
- `apps/web/src/features/admin/diagnostics/{types.ts,api.ts}`
- `apps/web/src/features/admin/components/_members/MemberDiagnosticsPanel.tsx`
- `apps/web/src/features/admin/components/MemberDrawer.tsx`
- `apps/web/playwright/tests/admin/sync-status.spec.ts`
- `docs/30-workflows/google-form-reflection-diagnostics/` (Phase 1-13 spec set)

## Security boundary

- diagnostics endpoint は既存 admin middleware (Auth.js session + admin role) で保護
- secrets readiness は boolean のみ (実値 / hash / 末尾 4 桁を含めない)
- response は集計値中心。1 メンバー診断 endpoint は admin が id 明示指定したときのみ最小フィールドを返す
- read-only SELECT のみ。書き込みなし

## Test plan

- [x] `pnpm --filter @ubm-hyogo/api typecheck`
- [x] `pnpm --filter @ubm-hyogo/web typecheck`
- [x] `pnpm lint`
- [x] `pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/diagnostics/forms-pipeline.spec.ts apps/api/src/diagnostics/forms-pipeline.contract.spec.ts apps/api/src/diagnostics/member-diagnosis.contract.spec.ts` (diagnostics unit + D1 route contracts)
- [x] `pnpm verify:phase12-compliance`
- [x] `pnpm gate-metadata:validate`
- [x] `pnpm indexes:rebuild` 冪等
- [ ] staging deploy + `/admin/sync-status` 実視認 (user-gated)
- [ ] Playwright env-gated smoke + screenshot コミット (user-gated)

## Follow-up

診断結果を踏まえて `outputs/phase-12/unassigned-task-detection.md` の Spec-B 候補 4 件 (H1〜H4 修復) のうち該当する Issue を起票する (user 判断)。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 5. user-gated 操作

以下は **本 Phase 13 完了後、user 明示承認後にのみ実施**:

- `git commit` 実体化 (現状はローカル準備のみ)
- `git push origin feat/google-form-reflection-diagnostics`
- `gh pr create --base dev --title ... --body ...`
- staging deploy
- branch protection required check 追加 (本 Spec-A では未予定)

## 6. PR pre-flight check

```bash
bash scripts/verify-pr-ready.sh
```

failure 時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照。
