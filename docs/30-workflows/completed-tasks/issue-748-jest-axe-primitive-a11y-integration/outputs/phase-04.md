# Phase 4 — タスク分解

[実装区分: 実装仕様書]

## 4.1 タスク一覧

| # | タスク | 対象ファイル | 種別 | 依存 |
| --- | --- | --- | --- | --- |
| T1 | 共有 axe runner 新規作成 | `apps/web/src/test/axe.ts` | 新規 | なし |
| T2 | primitive spec への jest-axe 統合 | `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx` | 編集 | T1 |
| T3 | proxy assertion の整理（削除 / 残置） | 同上 | 編集 | T2 |
| T4 | ローカル test 実行と evidence 記録 | `outputs/phase-11.md` | 編集 | T2, T3 |
| T5 | typecheck / lint 確認 | リポジトリ全体 | コマンド | T2, T3 |

## 4.2 各タスク詳細

### T1: 共有 axe runner 新規作成

- パス: `apps/web/src/test/axe.ts`
- 内容: Phase 3.2 に記載のコード
- export: `axe` (configureAxe 結果)
- import path: `@/test/axe`（`apps/web/tsconfig.json` の path alias `@/*` → `src/*` を利用）

### T2: primitive spec への jest-axe 統合

- 既存 `parallel09-primitives.component.spec.tsx` 末尾に `describe.each` ブロックを追加
- Phase 3.3 のコード片を採用
- import 追加:
  - `import { axe } from "@/test/axe";`

### T3: axe と component contract assertion の責務分離

Phase 3.3.1 / 3.3.2 の再分類に従い、既存 assertion は削除しない。axe は real rule violation 0 件の横断チェックとして追加し、exact component contract は primitive の公開 API として残す。

残置:

| 残置対象 | 理由 |
| --- | --- |
| `expect(errorEl.id).toBe(describedBy);` | id 参照一致は固有契約 |
| `aria-invalid="true"` / `role="status"` / `aria-hidden="true"` | exact attribute contract |
| `nav[aria-label="pagination"]` / `nav[aria-label="breadcrumb"]` | landmark naming contract |
| `aria-current="page"` の値確認 | 固有契約 |
| `size` ごとの px 算出 | 固有契約 |
| `onNext` / `onPrev` 発火条件 | 機能 contract |
| items 空時の null 描画 | 機能 contract |
| children-only 既存 API 互換 | 機能 contract |
| `aria-invalid` 無しの確認（error 無し時） | axe では「無いこと」までは検出しづらいため明示確認 |

### T4: ローカル test 実行と evidence 記録

```bash
mise exec -- pnpm --filter web test -- apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx
```

出力（要 green）を `outputs/phase-11/local-test.log` として保存し、`phase-11.md` から参照する。

### T5: typecheck / lint 確認

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

両方 green を確認。

## 4.3 単一実装サイクル充足性（CONST_007）

- T1〜T5 は単一実装者が直列 + 一部並列で完了可能（T1→T2→T3 直列、T4/T5 はその後）
- 先送り項目なし
