# admin-audit-log-ux-clarity-and-reduce-error-fix artifact inventory

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL` |
| purpose | `/admin/audit` をカード型タイムライン、appliedFilters チップ、目的・用語ガイド、親切なエラー表示へ刷新し、`/admin/tags/catalog` の `items.reduce` undefined クラッシュを防御する |
| implementation | `apps/web/src/components/admin/AuditLogPanel.tsx`, `AuditLogCard.tsx`, `auditLogDisplay.ts`, `auditAppliedFilters.ts`, `AuditPurposeGuide.tsx`, `auditGlossary.ts`, `auditErrorMessage.ts`, `TagCatalogPanel.tsx`, `apps/web/src/styles/globals.css` |
| tests | `apps/web/src/components/admin/__tests__/{AuditLogPanel.component,AuditLogCard,AuditPurposeGuide,TagCatalogPanel.reduce-guard}.spec.tsx`, `auditAppliedFilters.spec.ts`, `auditErrorMessage.spec.ts` |
| evidence | focused Vitest 6 files / 59 tests PASS |
| invariant | `apps/api` / D1 schema / Google Form / public API response shape unchanged. `appliedFilters` is existing API/type surface and is only rendered in UI. Existing audit helper signatures remain re-exported from `AuditLogPanel.tsx`; shared helper ownership moved to `auditLogDisplay.ts` to avoid component import cycles. |
| user gate | runtime screenshots, staging authenticated baseline, commit, push, PR, staging deploy |

## Four-condition notes

- 矛盾なし: local implementation/test completion and runtime screenshot pending are separated.
- 漏れなし: AC-1..AC-6 have focused tests; AC-7 helper signatures are preserved by re-export; AC-8 apps/api unchanged is a final grep gate.
- 整合性あり: screenshot inventory maps TC-11-1..6 to AC-1..6.
- 依存関係整合: `AuditLogPanel` and `AuditLogCard` share `auditLogDisplay.ts`; no `AuditLogPanel` ↔ `AuditLogCard` cycle.

## Lessons Learned

- **L-AALUCS-001（既存 API/型 surface を変えずに UI 可視化）**: `appliedFilters` は型（`apps/web/src/lib/admin/types.ts:30`）・API（`apps/api/src/routes/admin/audit.ts:30-51`）に既に存在し API も返していたが UI 未表示だった。情報設計タスクでは新 endpoint / D1 / 型公開を足す前に既存 surface を grep で確認すれば、不変条件1（apps/api 非変更）を保ったまま価値（読める化）を出せる。「未表示 = 機能不在」と誤認しない。
- **L-AALUCS-002（1 報告に 2 案件混在の切り分け）**: `/admin/tags/catalog` の `items.reduce` undefined クラッシュは admin 共通 error boundary 経由で audit 画面操作時に表面化した。ユーザー報告は audit 起点でも真因は別 component（`TagCatalogPanel`）。CONST_007 に従い同一サイクルで「audit 情報設計」と「catalog 防御ガード（`initial?.items ?? []` / `initial?.total ?? 0`）」を分離実装し、別 endpoint / 別 WF へ越境しない。
- **L-AALUCS-003（循環依存回避のための helper 所有移管）**: カード（`AuditLogCard`）とパネル（`AuditLogPanel`）が共有する純関数を `auditLogDisplay.ts` に所有移管した。`AuditLogPanel.tsx` は既存テスト互換のため `maskAuditJson` / `summarizeAuditJson` / `formatJst` / `maskAuditText` / `buildAuditHref` / `extractBatchId` を re-export 維持（AC-7）。component から component を import する循環を避け、純関数は presentational component の外（純データ/純関数モジュール）に置く。
- **L-AALUCS-004（VISUAL × implemented_local_evidence_captured の screenshot 語彙）**: 実 PNG が無い段階では Phase 11 evidence status を `present` でなく `pending`（capture runtime_pending）に統一する。phase12-compliance gate は status 語彙を `present` / `pending` / `n/a` に厳密化しており、`present` と書くと gate 違反になる。`screenshots/` は `.gitkeep` のみ配置し screenshot 行は全て `pending`。
- **L-AALUCS-005（artifact-inventory の Lessons Learned 節は inventory 作成と同 wave で書く）**: 本 inventory は初回作成時に `## Lessons Learned` を欠き、後続の skill 反映 wave で補完が必要になった（兄弟 inventory 97/359 が保有・直近兄弟は必須運用）。inventory 作成時に Four-condition notes だけでなく Lessons Learned（苦戦箇所）を同時に書くと、後続 wave での再編集と indexes:rebuild 追従を省ける。

anti-pattern:
- ❌ 既存 API が既に返している値（`appliedFilters`）を「新機能」と誤認し endpoint / D1 変更を企てる（不変条件1 抵触）。
- ❌ error boundary 経由で表面化した別 component のバグを、報告起点の画面側で握り潰す / 別 WF の責務まで越境して実装する。
- ❌ component 間の純関数共有を component 直 import で解決し `AuditLogPanel` ↔ `AuditLogCard` 循環を作る。
- ❌ implemented_local_evidence_captured で実 PNG が無いのに screenshot status を `present` と記載し phase12-compliance gate を破る。
