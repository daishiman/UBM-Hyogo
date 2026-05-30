# Workflow Artifact Inventory: task-c-public-member-sidebar-shell-integration

| 項目 | 内容 |
| --- | --- |
| workflow root | `docs/30-workflows/task-c-public-member-sidebar-shell-integration/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / runtime_visual_pending` |
| parent | `docs/30-workflows/unified-sidebar-shell-public-and-admin/` Task C |
| purpose | 公開 6 route と会員 `/profile` を Task A/B/E の `SidebarShell` へ統合し、旧 `PublicHeader` / `MemberHeader` を削除する実装 |
| implementation targets | `apps/web/src/components/shell/**`, `apps/web/app/(public)/layout.tsx`, `apps/web/app/(member)/layout.tsx`, root/legal/login route group moves, `apps/web/app/(member)/profile/page.tsx`, old header components and specs, focused specs |
| dependency boundary | Task A/B/E の shell primitive は本サイクルで先行実装済み。Task C は `SidebarShellServer` を mount し、role/session logic を再実装しない |
| invariant | URL 不変の route group 移動、API / D1 / Google Form schema / auth middleware 変更なし、`PublicFooter` は shell 配下で保持 |
| Phase 12 | strict 7 present; root/output `artifacts.json` parity present |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-c-public-member-sidebar-shell-integration-2026-05.md` |
| evidence boundary | focused vitest / typecheck / lint は local PASS。Phase 11 pixel screenshots and staging visual baseline are Gate-C user-gated; commit / push / PR are Gate-C user-gated |

## Lessons Learned

詳細: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-c-public-member-sidebar-shell-integration-2026-05.md`

- **L-TASKC-001**: route group 集約は実態調査後に user decision（URL 不変 `git mv`）を固定する。
- **L-TASKC-002**: VISUAL task は source evidence（focused vitest / typecheck / lint）と runtime pixel evidence（Gate-C）を分離する。
- **L-TASKC-003**: route group `git mv` は移動セグメント数ぶんだけ相対 import 深度を補正し、route path assertion spec も同 wave で更新する。
- **L-TASKC-004**: 旧コンポーネント削除（`PublicHeader` / `MemberHeader`）は `grep` で dangling 参照 0 を確定し、component + spec を 1 wave で削除する。
- **L-TASKC-005**: shell primitive が依存する utility / token / 不変条件 spec の変更も in-scope とし、root / outputs 両 `artifacts.json` の `implementation_files` に parity を保って列挙する。
