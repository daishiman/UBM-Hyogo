# Phase 1: 要件定義 — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

## 1. 機能要件

### FR-1: h1 自動 focus 移譲
root `apps/web/app/error.tsx` がマウント完了直後に h1 要素へプログラム的 focus を移譲する。screen reader 利用者がエラー見出しを即座に読み上げできるようにする。

### FR-2: スクロール位置維持
`focus({ preventScroll: true })` により視覚的なスクロールジャンプを抑制する。モバイル端末でビューポートがトップへスナップしないこと。

### FR-3: 副作用順序の固定
既存 useEffect 内で `logger.error → headingRef.current?.focus()` の順を厳守。`logger.error` は throw しない既存境界を維持し、ログ記録後に focus を移譲する。

### FR-4: digest / dev stack 表示維持
`error.digest` 表示および dev 環境での stack 表示は既存挙動を完全維持する（regression なし）。

### FR-5: client component / SSR 整合
`"use client"` directive を維持し、`useRef` / `useEffect` が SSR 中に副作用を起こさないこと。hydration warning ゼロ。

## 2. 非機能要件

### NFR-1: 差分最小性
変更は約 4 行（`useRef` import / ref 生成 / focus 呼び出し / h1 props）に限定する。文言・スタイル・logger シグネチャは変更しない。

### NFR-2: a11y 規格遵守
- `tabIndex={-1}` を h1 に付与し、プログラム的 focus を許可しつつタブ移動の natural order からは外す
- `:focus-visible` の outline が h1 に visible にならないことを既存 focus-visible utility 経由で担保

### NFR-3: テスト可検証性
`@testing-library/react` の render 後に `document.activeElement` で focus 状態を assert できる単体テストを既存ファイルへ追加する。

## 3. 利害関係者

| ロール | 関心 |
|---|---|
| screen reader 利用者 | エラー発生時の即時通知 |
| 開発者 / QA | parallel-07 DoD 達成（spec 4.3） |
| solo 運用者 (daishiman) | regression 検知用 a11y baseline 整備 |

## 4. 制約

- CLAUDE.md「重要な不変条件 8」: 新規 test ファイルは `*.spec.{ts,tsx}` のみ（本タスクは既存 `error.component.spec.tsx` への追記）
- CLAUDE.md「UI prototype alignment / MVP recovery」不変条件 1〜4 継承
- 既存 `useEffect` のクリーンアップ関数を追加しない（focus は idempotent な操作で teardown 不要）

## 5. 受入条件マッピング

| AC | 検証手段 |
|---|---|
| AC-1 | `apps/web/app/error.tsx` の grep: `ref={headingRef}` + `tabIndex={-1}` |
| AC-2 | `apps/web/app/error.tsx` の AST 走査または手動レビュー（順序確認） |
| AC-3 | grep: `useRef<HTMLHeadingElement>` |
| AC-4 | vitest TC-U-09: `document.activeElement === h1` PASS（既存 `error.component.spec.tsx` へ追記） |
| AC-5 | vitest TC-U-03 / TC-U-04: 既達（変更不要） |
| AC-6 | `pnpm typecheck` / `pnpm lint` 0 error |
| AC-7 | `pnpm -F "@ubm-hyogo/web" test -- --run error.component` PASS |
| AC-8 | parallel-07 spec 4.3 チェックリスト 5/5 |
| AC-9 | 親 workflow index.md の i06 行更新（local implementation complete、commit / push / PR は user-gated） |
| AC-10 | `git diff dev...HEAD --name-only` で `apps/web/app/login/error.tsx` 不在を確認 |

## 6. 完了判定

Phase 1 は本ファイルの記述で完了。Phase 2 設計に進む。
