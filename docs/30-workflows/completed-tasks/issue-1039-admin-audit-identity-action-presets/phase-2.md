# Phase 2: 設計

> **[実装区分: 実装仕様書]**。datalist 方式の最終設計と、既存コンポーネント再利用方針を固定する。

---

## 1. 既存コンポーネント再利用可否（FB-SDK-07-1 対応）

| 候補 | 再利用可否 | 判断 |
|------|----------|------|
| `FormField`（`apps/web/src/components/ui/FormField.tsx`） | **再利用** | 既存 action FormField をそのまま使う。新規 primitive を生やさない（invariant #6 / CLAUDE.md invariant #9） |
| `Input`（`apps/web/src/components/ui/Input.tsx`） | **再利用** | `...props` 透過で `list` 属性をそのまま渡せる。改修不要 |
| `<datalist>` / `<option>` | **native HTML** | 新規 React コンポーネント不要。`AuditLogPanel.tsx` 内に inline 配置 |
| `Select`（`apps/web/src/components/ui/Select.tsx`） | **不採用** | Select 化は自由入力を殺し AC-3 退化 |

> **新規 UI 実装ゼロ**で、native datalist により品質・アクセシビリティ・自由入力維持を既存レベルで担保できるため、再利用を最優先する（FB-SDK-07-1）。

## 2. 最終設計（datalist 方式）

### 2.1 DOM 構造（変更後の action FormField）

```tsx
<FormField name="action" label="action">
  <Input
    name="action"
    defaultValue={values.action ?? ""}
    placeholder="attendance.add"
    list="audit-action-presets"
  />
  <datalist id="audit-action-presets">
    <option value="identity.merge" />
    <option value="identity.dismiss" />
  </datalist>
</FormField>
```

### 2.2 設計上の不変点（契約保持の根拠）

| 契約 | 保持方法 |
|------|---------|
| 自由入力（AC-3） | `<Input>` は `type` 既定の text のまま。`list` は候補提示のみで入力値を制限しない（datalist の仕様：候補外も入力可） |
| `name="action"`（AC-2） | 無変更。form GET submit で `?action=<入力値>` を送る既存挙動を維持 |
| SSR 復元（AC-2） | `defaultValue={values.action ?? ""}` を無変更。`?action=identity.dismiss` で初期値が入る既存経路を維持 |
| cursor pagination（AC-4） | `buildAuditHref`（L91-107）に**一切触れない**。action query 保持は既存ロジックのまま |
| primitive 方針（invariant #6 / #9） | `<datalist>` は native element。`<input>` を直接増やしていない（datalist は input ではない） |

### 2.3 プリセット値定数化の判断

| 選択肢 | 判断 |
|------|------|
| inline `<option value="identity.merge" />` を直書き | **採用**。2 値のみで、`AuditLogPanel.tsx` 内に閉じる。過剰な抽象化を避ける |
| 別ファイルに `AUDIT_ACTION_PRESETS` 定数を切り出し | 不採用（2 値・単一利用箇所のため YAGNI） |

> 将来プリセットが増える場合は Phase 8（リファクタリング）で定数配列 + `.map()` へ抽出可能。初回は inline で十分。

## 3. スタイル / a11y 設計

| 観点 | 設計 |
|------|------|
| 色トークン | datalist は native UI（ブラウザ既定描画）。追加 CSS 不要。装飾を足す場合のみ `--ubm-color-*` トークン経由（HEX 禁止・invariant #2） |
| a11y | `<Input list>` は input に `aria` 追加配線不要。datalist は支援技術にネイティブ対応。既存 `FormField` の label 紐付けを維持 |
| ラベル文言 | issue リスク表「identity 専用 UI が他 action を目立たなくする（低）」対策として、datalist option は `identity.merge` / `identity.dismiss` の 2 値のみに留め、placeholder は既存の `attendance.add`（identity 以外の例）を維持 → identity だけが唯一の候補に見えない |

## 4. データフロー / 状態所有権

| 要素 | 状態所有 |
|------|---------|
| action 入力値 | DOM（uncontrolled `defaultValue`）→ form GET submit → URL query → SSR searchParams → `values.action` |
| datalist 候補 | 静的 DOM（state なし） |

> React state を一切増やさない。`AuditLogPanel` は server component のまま（`"use client"` 不要）。

## 5. 影響範囲分析

| ファイル | 変更種別 | 影響 |
|---|---|---|
| `AuditLogPanel.tsx` | 編集（L181-183 周辺に datalist 追加 + list 属性） | DOM に datalist 1 個追加。既存テスト `getByLabelText("action")` は引き続き単一 Input を返す（datalist は label 対象外） |
| `AuditLogPanel.component.spec.tsx` | 編集（テスト追加） | 既存 6 テスト非退化 + 新規 datalist テスト |
| `page.page.spec.ts` | 編集（テスト追加） | SSR `?action=` 復元テスト追加 |

> 既存テスト L100-113「renders the filter form with existing UI primitives」は `getByLabelText("action")` が単一要素を期待する。datalist 追加で Input は変わらないため**非退化**。L408「getByLabelText(/action/)」は正規表現で複数マッチの懸念があるが、datalist には label が無く `getByLabelText` の対象にならないため影響なし（Phase 3 でリスク確認）。

## 完了条件（Phase 2）

- [x] datalist 方式の DOM 構造を確定した
- [x] 5 つの契約（自由入力 / name / SSR / pagination / primitive 方針）の保持方法を明記した
- [x] 既存 primitive 再利用（新規 0）を確定した
- [x] 状態所有権（uncontrolled / state 増やさない）を固定した
- [x] 影響範囲（既存テスト非退化）を分析した

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
datalist 方式の最終 DOM 構造と、5 契約（自由入力 / name / SSR / pagination / primitive 方針）の保持方法、既存 primitive 再利用方針を確定する。

## 実行タスク
- action FormField の変更後 DOM 構造を確定する。
- 既存 primitive（FormField / Input）再利用と新規 0 を固定する。

## 参照資料
- `phase-1.md`
- `apps/web/src/components/ui/Input.tsx`
- `apps/web/src/components/ui/FormField.tsx`

## 成果物
- Phase 2 設計仕様（本ファイル）

## 統合テスト連携
本 Phase で固定した DOM 構造と契約保持方針を Phase 4 テスト・Phase 5 実装が参照する。
