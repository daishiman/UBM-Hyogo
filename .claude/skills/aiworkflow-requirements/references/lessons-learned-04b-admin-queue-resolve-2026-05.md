# Lessons Learned: 04b Admin Queue Resolve Workflow（2026-05）

## L-04B-RQ-001: approve は D1 batch 前に member_status を preflight する

`member_status` 更新と note resolve を同じ D1 batch に入れても、最後の note UPDATE だけを確認すると、対象 member の status row が欠落したまま note だけ `resolved` になる。approve path は batch 前に `getStatus()` を確認し、欠落時は 404 `member_status_not_found` で note を pending のまま残す。

## L-04B-RQ-002: Phase 12 の「要更新」は候補で止めない

`system-spec-update-summary.md` に正本仕様の更新候補を列挙した場合、同一 wave で references / indexes / manual specs / task workflow まで反映する。候補表だけで Phase 12 を completed にしない。

## L-04B-RQ-003: VISUAL completed と screenshot delegated を混同しない

admin session と D1 fixture が必要な UI は、local screenshot を未取得のまま「visual evidence complete」と書かない。Phase 11 は automated test + delegated staging gate として明記し、実画像は別 staging visual evidence task に formalize する。

## L-04B-RQ-004: 昇格元 unassigned stub は consumed 状態へ同期する

canonical workflow が `implementation_completed` へ進んだら、元 unassigned stub の `spec_created / 未着手` 表現を残さない。stub は consumed / superseded として canonical root と current state を指す。

## L-04B-RQ-005: audit target taxonomy の暫定丸めは follow-up 化する

`AuditTargetType` に `admin_member_note` / `admin_request` が無い場合、短期的には `targetType='member'` + `after.noteId` で追跡できる。ただし audit browsing の filter 精度が落ちるため、first-class target taxonomy extension を未タスク化する。
