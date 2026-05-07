# Phase 11: 実行 evidence（NON_VISUAL）

`visualEvidence: NON_VISUAL` のため、screenshot / UI 動画は不要。次の log / diff を evidence として `outputs/phase-11/` に保存する。

## evidence 一覧

| ファイル | 取得コマンド | 期待結果 |
| --- | --- | --- |
| `typecheck.log` | `pnpm --filter @ubm-hyogo/api typecheck && pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| `lint.log` | `pnpm lint 2>&1 \| tee outputs/phase-11/lint.log` | exit 0（stableKey literal は既存 warning のみ） |
| `test-api.log` | `pnpm exec vitest run --config=vitest.config.ts apps/api/src/repository/__tests__/auditLog.test.ts apps/api/src/routes/admin/requests.test.ts apps/api/src/routes/admin/audit.test.ts` | focused 3 files PASS |
| `test-web.log` | `pnpm --filter @ubm-hyogo/web test -- apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx` | PASS |
| `coverage-summary.log` | `pnpm exec vitest run --config=vitest.config.ts --coverage ...focused tests...` | changed target files maintain >=80% where applicable |
| `grep-target-type.log` | `grep -nE "'admin_member_note'\|\"admin_member_note\"" apps/api/src \| tee outputs/phase-11/grep-target-type.log` | resolve INSERT と enum 定義に hit |
| `grep-legacy-member.log` | `grep -n "target_type='member'\|targetType.*'member'" apps/api/src/routes/admin/requests.ts \| tee outputs/phase-11/grep-legacy-member.log` | resolve INSERT に旧 `'member'` が残らないことを確認 |

## 完了条件

- 上記 evidence ファイルがすべて生成され、内容が期待結果と一致
- どの log にも未解決のエラーが残らない
