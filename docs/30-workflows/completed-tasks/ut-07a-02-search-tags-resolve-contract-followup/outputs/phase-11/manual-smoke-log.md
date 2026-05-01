# Phase 11 Manual Smoke Log

Status: completed / NON_VISUAL

NON_VISUAL smoke was recorded with focused route/schema/type evidence:

| Check | Result |
| --- | --- |
| TC-01 confirmed | PASS: `{ ok: true, result: { status: "resolved", idempotent: false } }` covered by focused API tests |
| TC-02 rejected | PASS: `{ ok: true, result: { status: "rejected", idempotent: false } }` covered by focused API tests |
| TC-03 idempotent | PASS: `{ ok: true, result: { idempotent: true } }` covered by focused API tests |
| TC-04 validation | PASS: `400 validation_error` for mixed body covered |
| TC-05 conflict | PASS: `409` conflict family covered |
| TC-06 unknown tag | PASS: `422 unknown_tag_code` covered |
