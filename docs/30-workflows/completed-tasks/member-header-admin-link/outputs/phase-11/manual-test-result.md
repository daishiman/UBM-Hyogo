# Phase 11 — Manual Test Result（runtime evidence 境界）

> 本 workflow はローカル実装、静的・unit evidence、header 単体の local visual sanity screenshot を採取済み。staging `/profile` runtime screenshot は Phase 13 以降の user-gated 実行に残す。

## 1. Phase 11 evidence file inventory

| # | Path | Status |
|---|------|--------|
| 1 | `outputs/phase-11/evidence/typecheck.log` | present |
| 2 | `outputs/phase-11/evidence/lint.log` | present |
| 3 | `outputs/phase-11/evidence/vitest-member-header.log` | present |
| 4 | `outputs/phase-11/evidence/grep-no-hex.log` | present |
| 5 | `outputs/phase-11/evidence/grep-member-header-contract.log` | present |
| 6 | `outputs/phase-11/evidence/playwright-member-header.log` | present |
| 7 | `outputs/phase-11/screenshots/member-header-member.png` | present |
| 8 | `outputs/phase-11/screenshots/member-header-admin.png` | present |

すべて `present`。`grep-no-hex.log` は 0 byte（rg 1 = no match）を PASS とする。

## 2. 実装完了後の採取手順

```bash
mkdir -p docs/30-workflows/completed-tasks/member-header-admin-link/outputs/phase-11/evidence
mise exec -- pnpm typecheck 2>&1 | tee docs/30-workflows/completed-tasks/member-header-admin-link/outputs/phase-11/evidence/typecheck.log
mise exec -- pnpm lint 2>&1 | tee docs/30-workflows/completed-tasks/member-header-admin-link/outputs/phase-11/evidence/lint.log
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts \
  apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx \
  2>&1 | tee docs/30-workflows/completed-tasks/member-header-admin-link/outputs/phase-11/evidence/vitest-member-header.log
rg -n "#[0-9a-fA-F]{3,8}" apps/web/src/components/layout/MemberHeader.tsx \
  > docs/30-workflows/completed-tasks/member-header-admin-link/outputs/phase-11/evidence/grep-no-hex.log || true
rg -n "data-auth-state=|data-role=\"admin-cta\"|await getAuthView" \
  apps/web/src/components/layout/MemberHeader.tsx apps/web/app/\(member\)/layout.tsx \
  > docs/30-workflows/completed-tasks/member-header-admin-link/outputs/phase-11/evidence/grep-member-header-contract.log
```

## 3. visual evidence（VISUAL_ON_EXECUTION）

- local header visual sanity として `outputs/phase-11/screenshots/member-header-member.png` / `member-header-admin.png` を採取済み。focused Vitest の DOM contract（member は admin CTA なし、admin は `/admin` CTA あり）に対応する見た目確認である。
- staging deploy 後、`/profile` ページの screenshot を `outputs/phase-11/screenshots/profile-{guest,member,admin}.png` として 3 枚採取
- 採取は親 workflow Task G の Playwright e2e と統合してもよい

## 4. 状態

- workflow_state: `implemented_local_evidence_captured`
- staging visual 完了後: `completed` 候補。commit / push / PR / staging visual smoke は user-gated。
