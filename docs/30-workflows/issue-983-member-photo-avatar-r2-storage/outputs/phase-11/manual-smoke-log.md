# Manual Smoke Log

Status: `local_tests_passed / staging_runtime_pending_user_approval`.

Local focused tests were executed in this cycle. The following remote operations are intentionally user-gated:

- R2 bucket creation for `ubm-hyogo-member-photos-staging`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` secret injection
- remote D1 migration `0022_member_photos.sql` apply
- staging deploy
- authenticated staging screenshot capture

Expected staging runtime smoke:

1. Confirm `GET /admin/members/:memberId` returns `200` without `photoUrl` when presign is unavailable.
2. Upload a valid jpeg/png/webp file through `POST /admin/members/:memberId/photo`.
3. Confirm `photoUrl` appears only after D1 row and presign succeed.
4. Confirm image error or TTL expiry falls back to the hue placeholder.
