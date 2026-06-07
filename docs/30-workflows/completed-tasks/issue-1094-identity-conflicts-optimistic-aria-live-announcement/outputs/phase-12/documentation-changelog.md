# Phase 12 / Task 12-3: ドキュメント更新履歴

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

## 更新履歴

| 対象 | 更新内容 | 状態 |
| --- | --- | --- |
| `index.md` | workflow_state / implementation_status を `implemented_local_evidence_captured` へ昇格。Local Evidence 表を追加 | 完了 |
| `artifacts.json` / `outputs/artifacts.json` | status / metadata.workflow_state / Gate-B を local implementation PASS へ更新 | 完了 |
| `outputs/phase-11/manual-test-result.md` | source-level PASS と manual SR pending_user_gate を分離 | 完了 |
| `outputs/phase-12/*` | strict 7 を現状態へ同期 | 完了 |
| `outputs/phase-13/phase-13.md` | local 実装済み、external ops pending の境界へ更新 | 完了 |
| `apps/web/src/components/admin/*` | `IdentityConflictAnnouncer` / `identityConflictAnnouncements` 新規、`IdentityConflictRow` の focus stealing 撤去 | 完了 |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | Server Component を client 化せず announcer wrapper を追加 | 完了 |
| `apps/web/src/components/admin/__tests__/*` | focused Vitest 26 tests PASS | 完了 |
| `.claude/skills/aiworkflow-requirements/*` | changelog / task-workflow-active / quick-reference / resource-map / artifact inventory を同期 | 完了 |

## 検証

- `pnpm exec vitest run apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` → PASS（2 files / 26 tests）
- `pnpm --filter @ubm-hyogo/web typecheck` → PASS
- `pnpm --filter @ubm-hyogo/web lint` → PASS
- `pnpm verify:tokens` → PASS
- 撤去 grep → PASS（`optimisticStatusRef` / `.focus()` / legacy hook / HEX / inline style 追加なし）

## 残境界

commit / push / PR / Issue mutation / staging 手動 SR 検証は user-gated。
