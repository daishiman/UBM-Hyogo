# 2026-05-25 Issue #911 meeting attendance unregister UI

Issue #911 を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期。`MeetingAttendancePanel.tsx` に registered 行専用の出席解除 CTA、unregister 用 `useAdminMutation` instance、UI logger event を追加し、既存 `POST /api/admin/meetings/:id/attendances` `{ attended:false }` に `treat404AsSuccess: { toast: "既に解除済みです" }` を配線した。

API / D1 / hook 本体は無変更。register 側 404 は引き続き失敗扱い、unregister 側 404 のみ success-equivalent として `data-registered=false` に収束する。Phase 12 strict 7、root/output artifacts parity、Issue #842 stale note 補正、lessons / artifact inventory / indexes を同 wave で反映。commit / push / PR / staging runtime smoke は user-gated。
