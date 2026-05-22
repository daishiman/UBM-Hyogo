# Phase 11: Evidence 収集

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| 区分 | 検証 / evidence |
| visualEvidence | VISUAL_ON_EXECUTION |
| 想定所要 | 0.2 人日 |

## 目的

実装完了後の状態を、機械可読 evidence と human-readable artifact で固定する。

## 11.1 canonical evidence paths (本ワークフロー直下 `outputs/phase-11/`)

| evidence | path | status |
| --- | --- | --- |
| typecheck log | `outputs/phase-11/evidence/typecheck.log` | present / PASS |
| lint log | `outputs/phase-11/evidence/lint.log` | present / PASS |
| test log (unit/component) | `outputs/phase-11/evidence/test.log` | present / PASS |
| build log | `outputs/phase-11/evidence/build-web-local.log` | present / PASS |
| grep gate log | `outputs/phase-11/evidence/grep-gate.log` | present / PASS |
| e2e smoke log | `outputs/phase-11/evidence/e2e-attendance.log` | present / PASS |
| screenshot: meetings list before | `outputs/phase-11/screenshots/01-meetings-list.png` | present |
| screenshot: confirm dialog (remove attendance) | `outputs/phase-11/screenshots/02-confirm-remove.png` | present |
| screenshot: confirm dialog (delete meeting) | `outputs/phase-11/screenshots/03-confirm-delete-meeting.png` | present |
| screenshot: meeting detail 出席登録後 | `outputs/phase-11/screenshots/04-attendance-registered.png` | present |
| screenshot: 409 toast | `outputs/phase-11/screenshots/05-toast-duplicate.png` | present |

## 11.2 Phase 11 evidence file inventory

| # | Path | Status |
| --- | --- | --- |
| 1 | `outputs/phase-11/evidence/typecheck.log` | present / PASS |
| 2 | `outputs/phase-11/evidence/lint.log` | present / PASS |
| 3 | `outputs/phase-11/evidence/test.log` | present / PASS |
| 4 | `outputs/phase-11/evidence/design-tokens.log` | present / PASS |
| 5 | `outputs/phase-11/evidence/build-web-local.log` | present / PASS |
| 6 | `outputs/phase-11/evidence/grep-gate.log` | present / PASS |
| 7 | `outputs/phase-11/evidence/e2e-attendance.log` | present / PASS |
| 8 | `outputs/phase-11/screenshots/01-meetings-list.png` | present |
| 9 | `outputs/phase-11/screenshots/02-confirm-remove.png` | present |
| 10 | `outputs/phase-11/screenshots/03-confirm-delete-meeting.png` | present |
| 11 | `outputs/phase-11/screenshots/04-attendance-registered.png` | present |
| 12 | `outputs/phase-11/screenshots/05-toast-duplicate.png` | present |

## 11.3 evidence 取得コマンド

```bash
mkdir -p docs/30-workflows/step-06-meetings-attendance-implementation/outputs/phase-11/{evidence,screenshots}

OUT=docs/30-workflows/step-06-meetings-attendance-implementation/outputs/phase-11/evidence

mise exec -- pnpm typecheck 2>&1 | tee "$OUT/typecheck.log"
mise exec -- pnpm lint 2>&1 | tee "$OUT/lint.log"
mise exec -- pnpm test apps/web --run -- useConfirmDialog ConfirmDialog MeetingPanel MeetingAttendancePanel 2>&1 | tee "$OUT/test.log"
mise exec -- pnpm test apps/web --coverage --run -- useConfirmDialog ConfirmDialog MeetingPanel MeetingAttendancePanel 2>&1 | tee -a "$OUT/test.log"
cp apps/web/coverage/coverage-summary.json "$OUT/coverage-summary.json"
mise exec -- pnpm build 2>&1 | tee "$OUT/build.log"
mise exec -- pnpm e2e:smoke 2>&1 | tee "$OUT/e2e-smoke.log"

{
  echo "=== fetch in admin/meetings ==="
  rg -n "fetch\(" apps/web/app/\(admin\)/admin/meetings || echo "OK: no direct fetch"
  echo "=== legacy singular attendance UI path ==="
  rg -n "/api/admin/meetings/.+/attendance(?!s)" apps/web || echo "OK: UI uses attendances alias"
  echo "=== HEX in ConfirmDialog ==="
  rg -n "#[0-9a-fA-F]{6}\b" apps/web/src/components/ui/ConfirmDialog.tsx || echo "OK: no HEX"
} 2>&1 | tee "$OUT/grep-gate.log"
```

screenshot は Phase 6.3 の手順 4, 7, 11 + 一覧 + 詳細登録後の状態を Playwright または手動で撮影する。

## 11.4 a11y result

- focus trap: implemented and tested in `ConfirmDialog.spec.tsx`
- focus restore: implemented
- static id collision: avoided with `useId()`
- submitting double-submit guard: implemented in `useConfirmDialog`

## 完了条件

- [x] 11.2 inventory の全 path に file が物理存在する
- [x] grep-gate.log にすべて "OK:" が出ている
- [x] focused test / design-token / Playwright が PASS
- [x] screenshot 5 枚が撮影されている
- [x] Phase 12 Task 6 を PASS に更新済み

## リスク

- e2e smoke が dialog 追加で flaky → re-run で安定するか確認。不安定なら test を再設計し evidence を再取得
