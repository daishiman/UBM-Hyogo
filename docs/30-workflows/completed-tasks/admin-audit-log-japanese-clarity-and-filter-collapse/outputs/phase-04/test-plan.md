# Phase 4 — テストケース一覧（TC-XX）

> 上流: `./main.md`。各 TC は対象 / 操作 / 期待値 / 対応 AC / 追加 spec パスを持つ。
> Red 設計: Phase 5 実装前は新規 TC が fail が正常。fail path（TC-E-XX）は Phase 6（`outputs/phase-06/failure-cases.md`）で追加する。

## 0. fixture（テスト共通データ）

```ts
import type { AuditLogItem } from "@ubm-hyogo/shared"; // 既存 shared 型（Phase 5 着手時に実フィールド再確認）

const itemKnown: AuditLogItem = {
  auditId: "audit_001",
  action: "attendance.add",          // 登録済 → "出席を追加"
  actorEmail: "admin@example.com",
  targetType: "meeting",             // 登録済 → "開催日"
  targetId: "meeting_123",
  batchId: null,
  occurredAt: "2026-06-11T03:34:56.000Z",
  payload: {},
};

const itemUnknown: AuditLogItem = {
  ...itemKnown,
  auditId: "audit_002",
  action: "admin.future.unknown_op", // 未登録 → raw fallback
  targetType: null,                  // null → "—"
};

const filtersAdvancedEmpty = { action: "attendance.add", actorEmail: "", from: "", to: "", limit: "50", targetType: "", targetId: "", batchId: "" };
const filtersAdvancedFilled = { ...filtersAdvancedEmpty, targetType: "meeting", targetId: "meeting_123" };
```

> 注: `AuditLogItem` の実フィールドは `packages/shared` を Phase 5 着手時に再確認すること（本 fixture は既存実装から逆算した shape）。

---

## 1. `auditGlossary` describe helper（spec: `__tests__/auditGlossary.spec.ts` 新規 / AC-3 / AC-6 / [WEEKGRD-02]）

| TC | 対象 | 操作（入力） | 期待値 | 対応 AC |
| --- | --- | --- | --- | --- |
| **TC-01** | `describeAuditAction` 正常系 | `describeAuditAction("attendance.add")` | `"出席を追加"` | AC-3 / AC-6 |
| **TC-02** | `describeAuditAction` 未登録 raw fallback | `describeAuditAction("admin.future.unknown_op")` | `"admin.future.unknown_op"`（生コード fallback・throw しない） | AC-3 / AC-6 |
| **TC-03** | `describeAuditTargetType` 正常系 | `describeAuditTargetType("meeting")` | `"開催日"` | AC-3 / AC-6 |
| **TC-04** | `describeAuditTargetType` null | `describeAuditTargetType(null)` | `"—"` | AC-3 / AC-6 |
| **TC-05** | `describeAuditTargetType` 未登録 raw fallback | `describeAuditTargetType("unknown_type")` | `"unknown_type"`（生コード fallback） | AC-3 / AC-6 |
| **TC-06** | `describeAuditField` 正常系 | `describeAuditField("actorEmail")` | `"実行者（メール）"` | AC-1 / AC-6 |
| **TC-07** | `describeAuditField` 未登録 raw fallback | `describeAuditField("cursor")` | `"cursor"`（生コード fallback） | AC-6 |
| **TC-08** | helper が例外を投げない | `expect(() => describeAuditAction("x")).not.toThrow()` | throw しない | [WEEKGRD-02] |

> 純関数のため `render` 不要。`import { describeAuditAction, describeAuditTargetType, describeAuditField } from "../auditGlossary";` で直接呼ぶ。

---

## 2. `auditAppliedFilters` チップ日本語化（spec: `__tests__/auditAppliedFilters.spec.ts` 新規/追従 / AC-4）

| TC | 対象 | 操作 | 期待値 | 対応 AC |
| --- | --- | --- | --- | --- |
| **TC-09** | チップ label 日本語 | `buildAuditAppliedFilters({ action: "attendance.add" })` | chips に label `"操作の種類"` が含まれる（`describeAuditField` 経由） | AC-4 |
| **TC-10** | チップ value 日本語（action） | 同上 | value が `"出席を追加"`（`describeAuditAction` 経由・生コードでない） | AC-4 |
| **TC-11** | チップ value 日本語（targetType） | `buildAuditAppliedFilters({ targetType: "meeting" })` | label `"対象の種類"` / value `"開催日"` | AC-4 |
| **TC-12** | 英語キー名露出ゼロ | render したチップ群（または chips の label 集合） | `"action"` / `"actor"` / `"target type"` / `"batchId"` が含まれない | AC-4 |
| **TC-13** | 非変換フィールドは raw 値 | `buildAuditAppliedFilters({ actorEmail: "a@b.com" })` | label `"実行者（メール）"` / value `"a@b.com"`（メールは変換せず raw 維持） | AC-4 |

---

## 3. `AuditLogPanel` 段階開示 + ラベル日本語 + name 維持（spec: `__tests__/AuditLogPanel.component.spec.tsx` 新規/追従 / AC-1 / AC-2 / AC-5 / AC-11）

| TC | 対象 | 操作 | 期待値 | 対応 AC |
| --- | --- | --- | --- | --- |
| **TC-14** | ラベル日本語化 | `render(<AuditLogPanel filters={filtersAdvancedEmpty} .../>)` | `getByLabelText("操作の種類")` / `getByLabelText("実行者（メール）")` / `getByLabelText("表示件数")` が存在 | AC-1 |
| **TC-15** | name 属性英語維持 | `getByLabelText("操作の種類")` の `name` | `toHaveAttribute("name", "action")`（ラベル日本語・name 英語） | AC-1 / AC-9 |
| **TC-16** | 詳細フィルタ details 存在 | 同 render | `.admin-audit-filter-advanced`（`<details>`）と `<summary>詳細な絞り込み（対象・一括処理ID）</summary>` が存在 | AC-2 |
| **TC-17** | details デフォルト閉（値なし） | `filters=filtersAdvancedEmpty`（targetType/targetId/batchId 空） | `details.open === false` | AC-2 |
| **TC-18** | details デフォルト開（値あり） | `filters=filtersAdvancedFilled`（targetType=meeting） | `details.open === true`（適用中の高度条件を隠さない） | AC-2 |
| **TC-19** | details 内に詳細 3 項目 | 同 render | `getByLabelText("対象の種類")` / `getByLabelText("対象ID")` / `getByLabelText("一括処理ID")` が details 配下に存在 | AC-2 |
| **TC-20** | datalist placeholder 日本語 | 操作の種類 input の placeholder | 日本語例示（例: `"例: 出席を追加"`）。生コード `attendance.add` が placeholder に出ない | AC-5 |
| **TC-21** | 適用フィルタ aria-label 維持 | 適用フィルタコンテナ | `aria-label="現在の絞り込み条件"` が存在 | AC-11 |
| **TC-22** | summary キーボード可達 | `<summary>` 要素 | フォーカス可能（`tabIndex` 既定・native details）。`getByText("詳細な絞り込み（対象・一括処理ID）")` が summary 配下 | AC-11 |

> **internal/external（[VSCPKR-03]）**: TC-17/18 は details の **DOM 属性 `open`**（`container.querySelector(".admin-audit-filter-advanced").open`）を検証。クリックによる state 変化は検証しない（uncontrolled）。TC-14/19 のラベルは render 出力。

---

## 4. `AuditLogCard` action/targetType 日本語表示（spec: `__tests__/AuditLogCard.spec.tsx` 新規/追従 / AC-3 / AC-5）

| TC | 対象 | 操作 | 期待値 | 対応 AC |
| --- | --- | --- | --- | --- |
| **TC-23** | action 日本語表示 | `render(<AuditLogCard item={itemKnown} />)` | `getByText("出席を追加")` が存在。生コード `attendance.add` は表示されない | AC-3 |
| **TC-24** | targetType 日本語表示 | 同上 | `getByText(/開催日/)` が存在。生コード `meeting` は対象種別表示に出ない | AC-3 |
| **TC-25** | action 未登録 raw fallback | `render(<AuditLogCard item={itemUnknown} />)` | `getByText("admin.future.unknown_op")`（未登録のみ生コード fallback） | AC-3 |
| **TC-26** | targetType null 表示 | `item={itemUnknown}`（targetType=null） | 対象種別が `"—"`（`describeAuditTargetType(null)`） | AC-3 |
| **TC-27** | `auditId` ラベル日本語 | `render(<AuditLogCard item={itemKnown} />)` | `getByText(/ログID/)` が存在。`"auditId"` の英語ラベルは出ない | AC-5 |

---

## 5. 既存挙動温存（回帰・AC-12）

| TC | spec | 期待値 | 対応 AC |
| --- | --- | --- | --- |
| **TC-28** | `AuditLogPanel` 既存 検索/リセット | 変更なしで pass（検索ボタン / リセットボタンの挙動・ページネーション） | AC-12 |
| **TC-29** | `AuditLogCard` 既存 PII マスク / JSON 開示 | 変更なしで pass（PII マスク表示 / payload JSON 開示） | AC-12 |

> 既存 spec があれば回帰 pass を維持。無ければ本タスクで追加せず Phase 6 で fail path とともに最小限カバー。

---

## 6. 追加 spec ファイルパス一覧（Phase 5 runbook 入力）

| spec ファイル | 区分 | カバー TC |
| --- | --- | --- |
| `apps/web/src/components/admin/__tests__/auditGlossary.spec.ts` | 新規 | TC-01〜TC-08 |
| `apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts` | 新規/追従 | TC-09〜TC-13 |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 新規/追従 | TC-14〜TC-22, TC-28 |
| `apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` | 新規/追従 | TC-23〜TC-27, TC-29 |

> 新規 test は `*.spec.{ts,tsx}` のみ（不変条件 #8）。`*.test.{ts,tsx}` は使わない。

## 7. Red 状態の確認

- TC-01〜TC-27 は Phase 5 実装前は **全 fail**（map/helper 未追加・details ラッパ未実装・describe helper 未適用のため）。
- TC-28/29（既存挙動温存）は既存 spec があれば実装前から pass を維持する。
- Phase 5 で TC-01〜27 を Green 化し、Phase 6 で fail path（TC-E-XX）を拡充する。
