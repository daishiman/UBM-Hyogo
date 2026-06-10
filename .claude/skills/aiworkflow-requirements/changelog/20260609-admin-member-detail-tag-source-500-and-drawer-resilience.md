# 2026-06-09 admin-member-detail-tag-source-500-and-drawer-resilience

`docs/30-workflows/admin-member-detail-tag-source-500-and-drawer-resilience/` を `implemented_local_evidence_captured / implementation / VISUAL / staging_visual_pending_user_gate` として同期。

`member_tags.source='seed'` が `TagSourceZ` の 3 値 enum と衝突し admin member detail / member profile view parse を 500 にする問題を、shared `normalizeTagSource()` + `TagSourceZ.catch("manual")` + builder 2 箇所の cast 排除で解消。`MemberDrawer` には fetch failure retry button と `reloadKey` refetch を追加し、同一 memberId で回復可能化した。

focused Vitest 4 files / 69 tests PASS、shared/api/web typecheck PASS、verify:no-inline-style PASS。D1 schema / migration / seed / endpoint surface / Google Form は不変。staging authenticated screenshots、deploy、commit、push、PR は user-gated。

