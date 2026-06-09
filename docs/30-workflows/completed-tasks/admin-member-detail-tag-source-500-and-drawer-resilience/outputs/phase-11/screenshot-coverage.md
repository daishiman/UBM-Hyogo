# Phase 11 Screenshot Coverage

> workflow_state = `implemented_local_evidence_captured`。本 wave では PNG を取得しない（PNG 0 件）。下表の各 capture は実装後に staging で取得する計画であり、`status` は `staging_visual_pending_user_gate`。staging は管理者認証必須ルートのため取得は user-gated。

| ID | Target | Evidence (planned) | Status | Runtime boundary |
| --- | --- | --- | --- | --- |
| SC-01 | MemberDrawer 詳細 fetch 失敗時の error + 再試行ボタン（`data-testid=member-detail-retry`） | outputs/phase-11/screenshots/member-detail-error-retry.png | staging_visual_pending_user_gate | staging admin authenticated runtime; user-gated |
| SC-02 | 再試行押下後の回復ドロワー（TEST-MEM-09・seed source タグ表示） | outputs/phase-11/screenshots/member-detail-recovered.png | staging_visual_pending_user_gate | staging admin authenticated runtime; user-gated |
| SC-03 | `GET /api/admin/members/TEST-MEM-09` 200（500 解消） | outputs/phase-11/screenshots/member-detail-api-200.png | staging_visual_pending_user_gate | staging admin authenticated runtime; user-gated |

実装後の一次証跡は Lane B の jsdom render（`MemberDrawer.spec.tsx`）と Lane A の focused Vitest（`viewmodel.spec.ts` / `builder.repository.spec.ts`）であり、staging runtime screenshot は二次証跡として user-gated 承認後に取得する。implemented_local_evidence_captured 段階では実画像は存在しない。
