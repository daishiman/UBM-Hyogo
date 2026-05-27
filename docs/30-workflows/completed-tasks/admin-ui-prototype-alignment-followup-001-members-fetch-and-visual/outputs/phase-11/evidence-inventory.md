# Phase 11 evidence inventory

Runtime evidence は user-gated（staging deploy + CI dispatch + commit）。
本仕様書段階では物理ファイル未生成。`status=pending` で予約パスを記載する。

## Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/evidence-inventory.md | present |
| screenshot (members list aligned) | outputs/phase-11/evidence/admin-members-list-aligned-staging-visual-chromium-linux.png | pending |
| screenshot (members drawer aligned) | outputs/phase-11/evidence/admin-members-drawer-aligned-staging-visual-chromium-linux.png | pending |
| staging GET /admin/members trace | outputs/phase-11/evidence/admin-members-200.log | pending |
| typecheck log | outputs/phase-11/evidence/typecheck.log | pending |
| lint log | outputs/phase-11/evidence/lint.log | pending |
| verify-pr-ready log | outputs/phase-11/evidence/verify-pr-ready.log | pending |
| staging-visual run log | outputs/phase-11/evidence/staging-visual-run.log | pending |
