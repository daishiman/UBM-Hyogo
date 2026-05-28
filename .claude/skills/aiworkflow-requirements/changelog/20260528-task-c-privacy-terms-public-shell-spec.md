# 2026-05-28 task-c-privacy-terms-public-shell-spec

`docs/30-workflows/task-c-privacy-terms-public-shell-spec/` を `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` として同期。Task C (`/privacy`, `/terms` public shell mount) の子 workflow に root/output artifacts parity、Phase 12 strict 7、Phase 11 screenshot evidence 6 件、30-method compact evidence、aiworkflow-requirements ledger を追加した。apps/web implementation、focused tests、typecheck/lint、browser screenshots は local PASS。commit、push、PR は user-gated。

## Lessons Learned 追加 (2026-05-28)

`lessons-learned/lessons-learned-task-c-privacy-terms-public-shell-2026-05.md` 新規 + artifact-inventory `## Lessons Learned` 節を追加。L-TCPTS-001..005 を体系化:

- L-TCPTS-001: `(public)` route group 移動ではなく page.tsx への shell 直 mount を選ぶ最小差分原則
- L-TCPTS-002: async page + `getAuthView()` 配線では shell mount page で必ず `authView` prop 渡し（PublicHeader fallback fetch 非依存）
- L-TCPTS-003: legal prose 本文 + metadata は不変条件として grep gate で守る
- L-TCPTS-004: 子 workflow (implementation-spec 派生) でも root/output artifacts parity + Phase 12 strict 7 を独立に持つ（verifier 独立 root 走査）
- L-TCPTS-005: VISUAL_ON_EXECUTION + session-aware UI の Phase 11 evidence は `{surface} × {guest|member|admin}` 全組合せ PNG を行ごと present 判定

