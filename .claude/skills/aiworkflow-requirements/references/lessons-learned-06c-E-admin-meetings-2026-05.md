# Lessons Learned: 06c-E Admin Meetings

## L-06CE-001: docs-only label must not hide implementation gaps

`docs_only=true` が残っていても、PATCH / CSV export / soft delete / UI controls が未実装なら implementation として扱う。ラベルではなく AC と実コード差分を正本にする。

## L-06CE-002: existing route compatibility beats contract replacement

既存 `POST /admin/meetings/:sessionId/attendance` / `DELETE /admin/meetings/:sessionId/attendance/:memberId` を壊さず、06c-E の `{ attended }` contract は `/attendances` alias として足す。後続 07c / 08b / 09a の破壊を避けられる。

## L-06CE-003: root-only artifacts parity must be explicit

`outputs/artifacts.json` が無い workflow では root `artifacts.json` が唯一正本であることを Phase 12 compliance に明記する。

## L-06CE-004: visual evidence pending is not full PASS

focused tests が green でも、admin session + D1 fixture + deployed smoke の visual evidence は 08b / 09a で取得する。Phase 11 は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として分離する。
