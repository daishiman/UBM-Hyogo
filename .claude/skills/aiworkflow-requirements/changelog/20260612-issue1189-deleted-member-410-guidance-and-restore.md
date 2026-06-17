# 20260612 issue-1189 deleted member 410 guidance and restore

`issue-1189-deleted-member-410-guidance-and-restore` を `implemented_local_evidence_captured / implementation / VISUAL / local_static_visual_present_staging_visual_pending_user_gate` として同期。

- `/profile` の `MEMBER_SESSION_410` 表示を「このアカウントは退会済みです」+ 公開トップ導線へ変更し、無意味な再読み込みを出さない。
- admin `MemberDrawer` の退会済みセクションへ既存 restore API のボタンを配線。`useAdminMutation` 経由、success / cancel / 409 / 404 / network / pending 二重送信を focused spec で固定。
- focused Vitest 3 files / 24 tests PASS。
- local static visual screenshot 3 PNG present（profile 410 / restore button / after restore）。
- apps/api / D1 schema / Google Form / restore endpoint contract は不変。
- staging D1 mutation、authenticated runtime screenshots、commit、push、PR、Issue mutation は user-gated。
