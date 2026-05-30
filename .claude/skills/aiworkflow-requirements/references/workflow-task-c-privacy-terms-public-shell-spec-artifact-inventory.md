# Workflow Artifact Inventory: task-c-privacy-terms-public-shell-spec

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/task-c-privacy-terms-public-shell-spec/` |
| root artifacts | `docs/30-workflows/task-c-privacy-terms-public-shell-spec/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/task-c-privacy-terms-public-shell-spec/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/task-c-privacy-terms-public-shell-spec/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| parent workflow | `docs/30-workflows/public-header-logged-in-nav-cleanup/` |
| parent task | `docs/30-workflows/public-header-logged-in-nav-cleanup/tasks/task-c-privacy-terms-public-shell.md` |
| implementation targets | `apps/web/app/privacy/page.tsx`, `apps/web/app/terms/page.tsx` |
| test targets | `apps/web/app/privacy/__tests__/page.spec.tsx`, `apps/web/app/terms/__tests__/page.spec.tsx` |

Status: `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / local_verification_passed`.

Runtime evidence: apps/web implementation, focused tests, typecheck/lint, and Phase 11 screenshots are present. Commit, push, and PR remain user-gated.

## Lessons Learned

`.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-c-privacy-terms-public-shell-2026-05.md` に体系化済み。要旨:

- **L-TCPTS-001**: `(public)` route group 移動ではなく page.tsx への shell 直 mount を選ぶ最小差分原則。route group 統合は別 wave に deferred。
- **L-TCPTS-002**: async page + `getAuthView()` 配線では shell mount page で必ず `authView` を prop で渡し、PublicHeader 側の fallback fetch に依存しない（session 解決を 1 page あたり 1 回に固定）。
- **L-TCPTS-003**: legal prose 本文と既存 metadata は **不変条件** として grep gate で守る。shell 追加の再フォーマットで本文 1 文字も変えない。
- **L-TCPTS-004**: 子 workflow（implementation-spec 派生）でも root/output artifacts parity + Phase 12 strict 7 を独立に持つ。verifier が独立 root として走査する。
- **L-TCPTS-005**: VISUAL_ON_EXECUTION + session-aware UI の Phase 11 evidence は `{surface} × {guest|member|admin}` の全組合せ PNG を行ごと present 判定する。

