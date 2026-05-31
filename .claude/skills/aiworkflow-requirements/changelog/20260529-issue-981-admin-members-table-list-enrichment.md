# 2026-05-29: issue-981 admin members table list enrichment

Issue #981 was synchronized as `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`.

## Changes

- Implemented `/admin/members` list enrichment rendering in `MembersTable.tsx`.
- Added focused component assertions in `MembersTable.spec.tsx`.
- Preserved API/schema boundary: #968 remains the data enrichment baseline.
- Added workflow strict 7 outputs and aiworkflow artifact inventory / active workflow / indexes entries.

## Evidence

- `mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx`
- Result: web suite 189 files / 1300 tests PASS, 2 skipped.

## Lessons Learned

- `lessons-learned/lessons-learned-issue-981-admin-members-table-list-enrichment-2026-05.md`
  - L-I981-001: rendering-only gap と data-layer gap の判別（prop に値が来ていれば API/schema/D1 無変更で描画追加のみ）
  - L-I981-002: 既存 primitive 再利用（`Chip` + `zoneTone`/`statusTone`）・新規 primitive/tone map 生成禁止
  - L-I981-003: optional field の条件描画と empty fallback（tags 空は `未タグ` warning chip）の使い分け
  - L-I981-004: tag overflow `+N` 集約 + wrapper `<span>` の `title` tooltip 契約
  - L-I981-005: VISUAL_ON_EXECUTION workflow の docs-only close-out 禁止（implementation 再分類）
  - L-I981-006: enrichment component の TC granularity（部分欠損組合せ・tag 0/2/3 件境界・混在行 a11y）

## User-Gated

- staging visual baseline
- staging deploy/runtime smoke
- commit, push, PR
