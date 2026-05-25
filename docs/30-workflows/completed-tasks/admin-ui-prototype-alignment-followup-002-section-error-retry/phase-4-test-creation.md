---
phase: 4
title: Data contract — props / a11y
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 4: データ契約

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 4 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

データ契約の責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

## 実行タスク

1. 本 Phase の既存本文に定義された要件・手順・判定表を実装時の入力として確認する。
2. Phase 間の依存順序を守り、前 Phase の完了条件を満たしてから次へ進む。
3. 差分が発生した場合は Phase 11 evidence と Phase 12 strict 7 へ同一 wave で同期する。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本ファイル: `phase-4-test-creation.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

## 統合テスト連携

- 実装サイクルでは Phase 10 の focused unit / axe / grep gate を Phase 11 evidence として保存する。
- 本 Phase 自体は仕様書段階のため、実行ログは `outputs/phase-11/` に取得後追記する。

---


## 1. `AdminSectionErrorProps`（拡張後）

```ts
export interface AdminSectionErrorProps {
  sectionLabel: string;
  code?: string;
  correlationId?: string;
  message?: string;
  className?: string;
  // --- 追加 ---
  onRetry?: () => void;
  retryLabel?: string;   // default: "再読み込み"
  isRetrying?: boolean;  // default: false
}
```

| field | required | default | 用途 |
|-------|----------|---------|------|
| `sectionLabel` | yes | - | 既存 |
| `code` | no | - | 既存 |
| `correlationId` | no | - | 既存 |
| `message` | no | "再読み込みしてください。" | 既存 |
| `className` | no | - | 既存 |
| `onRetry` | no | undefined | 指定時のみ retry button 描画 |
| `retryLabel` | no | "再読み込み" | button text |
| `isRetrying` | no | false | true で disabled + aria-busy |

### 1.1 後方互換契約

- `onRetry` / `retryLabel` / `isRetrying` を渡さない呼び出しは v1 と完全同一 DOM を返す
- 既存 caller の typecheck は壊れない（全 field optional）

## 2. `AdminSectionErrorClientProps`

```ts
"use client";
export type AdminSectionErrorClientProps = Omit<
  AdminSectionErrorProps,
  "onRetry" | "isRetrying"
>;
```

| field | required | 用途 |
|-------|----------|------|
| `sectionLabel` | yes | AdminSectionError へ pass-through |
| `code` | no | 同上 |
| `correlationId` | no | 同上 |
| `message` | no | 同上 |
| `className` | no | 同上 |
| `retryLabel` | no | 同上 |

> `onRetry` / `isRetrying` は wrapper 内部で生成するため props として受けない（serializable のみを境界越しに渡す原則）。

## 3. a11y 契約

| 要素 | 属性 | 条件 |
|------|------|------|
| outer container | `role="alert"` | 常時（既存維持） |
| outer container | `aria-live="polite"` | 常時（既存維持） |
| outer container | `data-testid="admin-section-error"` | 常時（既存維持） |
| retry button | tag = `<button type="button">` | `onRetry` 指定時のみ描画 |
| retry button | `aria-label` | `${sectionLabel} を再読み込み` |
| retry button | `aria-busy` | `isRetrying ? "true" : "false"` |
| retry button | `disabled` | `isRetrying === true` |
| retry button | `data-testid="admin-section-error-retry"` | retry button 存在時 |

## 4. design token 契約

- retry button の color / spacing は既存 Button primitive の variant が `tokens.css` 経由で適用する
- 本 component 内で `bg-[#xxx]` / `text-[#xxx]` / HEX 直書きは禁止（`verify-design-tokens` で fail）
- 追加 CSS class は `admin-section-error__retry` 等 BEM 規約に準拠（既存 `admin-section-error__title` 等に整合）

## 5. event 契約（AdminSectionErrorClient 内部）

| event | 実装 |
|-------|------|
| button click | `startTransition(() => router.refresh())` |
| retry 中 | `useTransition()` の `isPending` を `isRetrying` として AdminSectionError へ渡す |
| 二度押し防止 | `disabled` 属性 + `isRetrying` check（click handler 冒頭 early return） |
