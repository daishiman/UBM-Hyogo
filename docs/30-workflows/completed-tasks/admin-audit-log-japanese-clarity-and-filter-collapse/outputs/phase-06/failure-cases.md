# Phase 6 — 異常系・境界値テストケース（failure-cases.md）

> describe helper は throw しない純関数のため、異常系はすべて「fallback 値が返る / 表示される」形で検証する。

## TC-E 一覧

| TC-E | 対象 | 入力データ | 期待値 | 配置 spec | 担保 AC |
| --- | --- | --- | --- | --- | --- |
| TC-E-01 | `describeAuditAction` | `"some.unknown.code"`（未登録） | 戻り値 = `"some.unknown.code"`（生コード fallback・throw しない） | auditGlossary.spec.ts | AC-3 |
| TC-E-02 | `describeAuditTargetType` | `null` | 戻り値 = `"—"` | auditGlossary.spec.ts | AC-3 |
| TC-E-03 | `AuditLogCard` | `item.action = "x.unregistered"` | カードの h3 / Chip に `"x.unregistered"` が表示される（情報欠落しない） | AuditLogCard.spec.tsx | AC-3 |
| TC-E-04 | `AuditLogCard` | `item.targetType = null` | 対象欄に `"—"` が表示される（`describeAuditTargetType(null)`） | AuditLogCard.spec.tsx | AC-3 |
| TC-E-05 | `toAppliedFilterChips` / `AuditLogPanel` | `appliedFilters = undefined`（または全フィールド空） | チップ配列が空 → `data-testid="audit-applied-filters"` 内に Chip が無く「なし（直近 N 件…）」が表示される | auditAppliedFilters.spec.ts + AuditLogPanel.component.spec.tsx | AC-4 |
| TC-E-06 | `describeAuditField` | `"unknownKey"`（未登録） | 戻り値 = `"unknownKey"`（key fallback） | auditGlossary.spec.ts | AC-4 |
| TC-E-07 | `AuditLogPanel` | `values.targetType / targetId / batchId` 全て空 | `<details className="admin-audit-filter-advanced">` に `open` 属性が**付かない**（`details.open === false`） | AuditLogPanel.component.spec.tsx | AC-2 |
| TC-E-08 | `AuditLogPanel` | `values.batchId = "abc"`（詳細のいずれか値あり） | `<details>` に `open` 属性が**付く**（`details.open === true`） | AuditLogPanel.component.spec.tsx | AC-2 |
| TC-E-09 | `toAppliedFilterChips` | `action="attendance.add"`, `targetType="meeting"`, `batchId="b"`, `limit="50"` | 全チップの `label` / `value` に英語キー名（`action`/`actor`/`target type`/`batchId`/`limit`）が**含まれない**。`value` は `"出席を追加"`/`"開催日"` 等の日本語 | auditAppliedFilters.spec.ts | AC-4 |

## 境界値の補足

### action（登録済 / 未登録）

- 登録済（正常系 Phase 4）: `"attendance.add"` → `"出席を追加"`。
- 未登録（TC-E-01 / TC-E-03）: `"some.unknown.code"` → そのまま（fallback）。
- **off-by-one 防止**: 登録済の境界（マップの最初と最後のキー `"attendance.add"` / `"admin.meeting.created"`）を正常系で網羅し、未登録 1 件を異常系で網羅する。

### targetType（登録済 / 未登録 / null）

- 登録済: `"meeting"` → `"開催日"`。
- 未登録: `"unknown_type"` → `"unknown_type"`（fallback）。
- null: `null` → `"—"`（TC-E-02 / TC-E-04）。

### 詳細フィルタ open（全空 / 一部 / 全あり）

- 全空（TC-E-07）: `details.open === false`。
- 一部あり（TC-E-08）: `batchId` のみ値 → `details.open === true`。
- 全あり: `targetType + targetId + batchId` → `details.open === true`（TC-E-08 と同分岐・追加検証で網羅可）。

### appliedFilters（空 / 1 件 / 複数）

- 空（TC-E-05）: チップ 0 件、「なし」表示。
- 1 件 / 複数（正常系 Phase 4）: 日本語チップが該当数だけ表示。

## 異常系で「壊れない」ことの定義

| 観点 | 期待 |
| --- | --- |
| 例外送出なし | describe helper は throw せず必ず string を返す |
| 情報欠落なし | 未登録コードでも生コードを表示し、空文字にしない |
| crash なし | targetType=null / appliedFilters=undefined でも component が render される |
| 英語キー名露出ゼロ | 表示文字列に英語キー名（`action`/`actor` 等）が出ない（TC-E-09） |
