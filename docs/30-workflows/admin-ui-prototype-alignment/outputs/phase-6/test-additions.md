# Phase 6: テスト拡充

## 追加 spec

| ファイル | 件数 | カバー範囲 |
| --- | --- | --- |
| `_shared/__tests__/AdminSectionCard.spec.tsx` | 5 | title / description / aria-labelledby / density / as prop |
| `_shared/__tests__/AdminSectionError.spec.tsx` | 5 | sectionLabel / code / correlationId / role=alert / aria-live |
| `_shared/__tests__/AdminEmptyState.spec.tsx` | 4 | title / description / primaryAction / icon variant |
| `_shared/__tests__/AdminStat.spec.tsx` | 4 | label/value / tone / loading skeleton / hint |
| `_shared/__tests__/AdminTable.spec.tsx` | 6 | 行 render / onRowSelect / emptyState / sort 切替 / caption / selectedKey |
| `_shared/__tests__/AdminQueuePanel.spec.tsx` | 5 | listbox render / onSelect / aria-selected / empty fallback / detail pane |
| `lib/admin/__tests__/safe-server-fetch.spec.ts` | 4 | ok=true / status code 展開 / 非 Error throw / fallback code |

合計 33 spec、全件 PASS。

## fail path

`safe-server-fetch.spec.ts` の TC-SSF-02/03/04 で fail path を網羅:
- `fetchAdmin` が `Error("admin api ... failed: 500")` を throw → `code=ADMIN_FETCH_500`
- 非 Error (string) を throw → `code=ADMIN_FETCH_UNKNOWN`
- 任意 Error → `code=ADMIN_FETCH_FAILED`

## regression

既存 admin component / page test (KpiGrid, MembersTable, IdentityConflictRow, SchemaDiffPanel, etc.) は全件 PASS のまま (897/898 — 1 skipped は無関係の build-output runtime test)。
