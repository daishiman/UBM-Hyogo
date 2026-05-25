---
phase: 6
title: Test strategy
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 6: テスト戦略

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 6 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

テスト戦略の責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

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

- 本ファイル: `phase-6-test-expansion.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

## 統合テスト連携

- 実装サイクルでは Phase 10 の focused unit / axe / grep gate を Phase 11 evidence として保存する。
- 本 Phase 自体は仕様書段階のため、実行ログは `outputs/phase-11/` に取得後追記する。

---


## 1. 対象範囲

| layer | 対象 | tooling |
|-------|------|---------|
| unit (existing) | `AdminSectionError.spec.tsx` 既存 case + regression assert | vitest + @testing-library/react |
| unit (new) | `AdminSectionErrorClient.spec.tsx` | vitest + @testing-library/react + `useRouter` mock |
| a11y | retry button axe scan | `@axe-core/playwright` または vitest-axe |
| static analysis | grep で page.tsx の `"use client"` 追加検出 | shell + rg |

## 2. 既存 `AdminSectionError.spec.tsx` 追加 case（regression assert）

| case | assert |
|------|--------|
| AS-1 | `onRetry` 未指定で render → `queryByTestId("admin-section-error-retry")` が null |
| AS-2 | `onRetry` 指定で render → `getByTestId("admin-section-error-retry")` が存在 |
| AS-3 | `onRetry` 指定 + `isRetrying=true` → button が `disabled` かつ `aria-busy="true"` |
| AS-4 | `onRetry` 指定 + `isRetrying=false` → button が enabled かつ `aria-busy="false"` |
| AS-5 | `retryLabel="再試行"` → button text が「再試行」 |
| AS-6 | `retryLabel="再試行"` + `isRetrying=true` → button text が「再試行中…」 |
| AS-7 | button の `aria-label` が `${sectionLabel} を再読み込み` 形式 |

> 既存 case は無修正で pass し続けること（v1 互換 SLO）。

## 3. 新規 `AdminSectionErrorClient.spec.tsx` case

| case | assert |
|------|--------|
| AC-1 | render → `getByRole("button")` で retry button が描画される |
| AC-2 | click → `useRouter().refresh` mock が 1 回呼ばれる |
| AC-3 | click 中（startTransition pending）→ `aria-busy="true"` + `disabled` |
| AC-4 | transition 完了後 → button が enabled に戻る |
| AC-5 | `aria-label` に `sectionLabel` が含まれる |
| AC-6 | `retryLabel` props が button text に反映される |
| AC-7 | button class に HEX 直書き class が含まれない（`/(bg|text)-\[#/` で grep） |
| AC-8 | `code` / `correlationId` / `message` 等の該当項目の pass-through props が DOM に出る |

### 3.1 useRouter mock 例

```ts
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
```

`refresh` mock は `vi.fn()` を test scope で再生成して呼び出し回数を assert する。

## 4. a11y test

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx
```

- axe-core 連携は既存 admin spec の axe ヘルパに合わせる（無ければ vitest-axe を使う）
- assert: `expect(results.violations.filter(v => v.impact === "critical")).toHaveLength(0)`

## 5. grep / 静的検証

| 検証 | コマンド | 期待 |
|------|---------|------|
| page.tsx に `"use client"` 追加なし | `rg -n '^"use client"' apps/web/app/\(admin\)/admin/` | 既存以外 0 件 |
| HEX 直書きなし（本 component 内） | `rg -n '#[0-9a-fA-F]{3,8}' apps/web/src/features/admin/components/_shared/AdminSectionError*.tsx` | 0 件 |
| `bg-[#...]` / `text-[#...]` なし | `rg -n '(bg|text)-\[#' apps/web/src/features/admin/components/_shared/AdminSectionError*.tsx` | 0 件 |
| 新規 primitive 不追加 | `git diff --stat apps/web/src/components/ui/` | 変更 0 件 |

## 6. テスト実行コマンド

```bash
# 既存 + 新規 spec
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionError.spec.tsx \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx

# 全体
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 7. 失敗時の切り分け

| 症状 | 切り分け |
|------|----------|
| AS-2 fail | T-01 の `onRetry` 条件分岐実装漏れ |
| AC-2 fail | mock の path（`next/navigation`）誤り、または click handler 内 `startTransition` 漏れ |
| AC-3 fail | `useTransition` の `isPending` を `isRetrying` に渡せていない |
| axe critical > 0 | `aria-label` 漏れ・`role="alert"` outer 削除等の該当項目 |
