# admin-audit-log-japanese-clarity-and-filter-collapse artifact inventory

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-audit-log-japanese-clarity-and-filter-collapse/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / staging_visual_pending_user_gate` |
| purpose | `/admin/audit` の英語表記・技術キー露出を日本語ラベル化し、フィルタを常時表示 + 詳細な絞り込みへ段階開示し、監査ログカードのメタ情報を整列する |
| implementation | `apps/web/src/components/admin/auditGlossary.ts`, `AuditLogPanel.tsx`, `AuditLogCard.tsx`, `auditAppliedFilters.ts`, `apps/web/src/styles/globals.css` |
| tests | `apps/web/src/components/admin/__tests__/{auditGlossary,auditAppliedFilters,AuditLogPanel.component,AuditLogCard}.spec.ts*` |
| evidence | focused Vitest 4 files / 57 tests PASS、typecheck PASS、lint PASS、verify:tokens PASS、verify:phase12-compliance PASS、gate-metadata ERROR 0、apps/api / packages/shared diff empty |
| invariant | `apps/api` / D1 schema / Google Form / `packages/shared` unchanged. Query param keys and `<input name>` values remain English API contract; only visible labels and helper display values changed. No new UI primitive or design token. |
| user gate | staging authenticated screenshots, commit, push, PR, staging deploy |

## Four-condition notes

- 矛盾なし: `implemented_local_evidence_captured` と staging screenshot pending を分離し、実 PNG 未取得を `present` と書かない。
- 漏れなし: AC-1..AC-6 and AC-11/12 have focused tests; AC-7 is scoped CSS; AC-8/9 are verified by `verify:tokens` and `git diff --name-only -- apps/api packages/shared`.
- 整合性あり: `auditGlossary.ts` is the display label SSOT; field labels, card labels, and applied filter chips consume the same helpers.
- 依存関係整合: apps/web presentation layer only. API query vocabulary and shared response shape remain unchanged.

## Lessons Learned

- **L-AALJFC-001（表示ラベル SSOT と API key 不変の分離）**: 管理画面の日本語化では `<input name>` / query param key を変更せず、display helper でラベルだけを変換する。API 契約と管理者の読みやすさを両立できる。
- **L-AALJFC-002（VISUAL local evidence と staging visual pending の分離）**: focused component tests で semantic UI contract を完了しても、認証付き staging PNG は user-gated として pending に残す。Phase 11 inventory は local evidence present / screenshot pending の二層で記録する。
- **L-AALJFC-003（未登録 audit code fallback）**: audit log は追跡性が最優先なので、未知の action / targetType は空欄化せず raw fallback を返す。raw fallback の発生は SSOT 追記候補として扱う。
