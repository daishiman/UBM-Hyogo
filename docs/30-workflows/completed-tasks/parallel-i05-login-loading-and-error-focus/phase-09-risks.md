---
phase: 9
title: リスクと緩和策
workflow_id: parallel-i05-login-loading-and-error-focus
status: completed
---

# Phase 9: リスク

[実装区分: 実装仕様書]

## 1. リスクテーブル

| ID | リスク | 影響 | 確率 | 対策 |
|----|--------|------|------|------|
| R-01 | `bg-surface-2` Tailwind utility が未定義で skeleton が透明になる | 中 | 中 | T-01 で grep 確認、未定義時のみ `globals.css` `@layer utilities` に最小追加（HEX 禁止） |
| R-02 | `Card` / `CardContent` primitive が `apps/web/src/components/ui/` に存在しない | 低 | 高 | section + class で代替。focus 管理が必須項目、Card layout は best-effort |
| R-03 | `focus({ preventScroll: true })` が一部古いブラウザで未対応 | 低 | 低 | TypeScript 型 OK、ブラウザは options を無視するため安全。fallback 不要 |
| R-04 | `headingRef.current` が null（StrictMode 二重 mount 等）で focus が当たらない | 低 | 低 | optional chaining `?.focus(...)` で握り潰す、effect は何もしない |
| R-05 | `useEffect` 依存配列 `[error]` で error 参照が常に新しいと無限再 focus | 中 | 低 | Next.js は同一 error なら同一参照を渡す。実害なし、StrictMode 二重実行も focus 冪等 |
| R-06 | `*.test.tsx` を誤って作成し lefthook が reject | 低 | 低 | Phase 6 で `*.spec.tsx` 明記、CI gate も補助 |
| R-07 | `loading.tsx` が Server Component で client hook を誤使用 | 中 | 低 | Phase 5 完成形に hook なし。lint で検知される |
| R-08 | jest-axe が未導入で任意テスト追加時に build fail | 低 | 中 | Phase 5 §0 で存在確認、未導入なら追加しない |
| R-09 | parallel-03 と `globals.css` の編集競合 | 低 | 低 | T-01 は条件付き追加のみで footprint 小、merge 時は `@layer utilities` ブロックを union |
| R-10 | Phase 11 の VISUAL screenshot が NON_VISUAL と判定される [Feedback W1-02b-1] | 低 | 低 | Phase 11 で `mode: "VISUAL"` をデフォルト固定 |

## 2. 並列性リスク

- 兄弟 i06 / i07 と本 SW は対象ファイルが分離されており衝突しない
- 親 SW の他 task との競合: `apps/web/src/styles/globals.css` を編集する場合のみ R-09 注意

## 3. 監視ポイント

| ポイント | 確認方法 |
|---------|---------|
| skeleton 表示 | Phase 11 で screen reader 経由「ログイン画面を読み込み中」アナウンス確認 |
| focus 移譲 | Phase 11 で `/login` で意図的にエラーを発生させ、h1 にフォーカスが入ることを screen reader / DevTools で確認 |
| digest 表示 | `digest` を含む / 含まない 2 ケースを vitest と Phase 11 manual test で確認 |

## 4. 撤退基準

以下に該当した場合は本 SW を blocker として停止し、ユーザーにエスカレーション:

- `--ubm-color-surface-bg-2` / `--color-surface-2` bridge が存在しない（parallel-03 依存）
- `apps/web/app/login/` 配下に既に loading.tsx / error.tsx 以外の予期しないファイルがある（無関係作業の混入）
- Phase 7 build が token utility 不足以外の理由で fail


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 9 |
| status | completed |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的

/login loading boundary と error focus management を、実装・証跡・仕様の状態語彙が矛盾しない形で完了させる。

## 実行タスク

- 対象 phase の本文に従い、/login の loading / error / test / evidence contract を確認する。
- 実装済み差分と workflow state の整合を維持する。
- Phase 13 の commit / push / PR / runtime screenshot は user approval まで実行しない。

## 参照資料

- docs/30-workflows/parallel-i05-login-loading-and-error-focus/index.md
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/artifacts.json
- docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md

## 成果物

- apps/web/app/login/loading.tsx
- apps/web/app/login/error.tsx
- apps/web/app/login/loading.spec.tsx
- apps/web/app/login/error.spec.tsx
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-11/
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-12/

## 完了条件

- Focused Vitest が exit 0。
- Phase 12 compliance check が exit 0。
- 矛盾なし・漏れなし・整合性あり・依存関係整合の 4 条件が completed。

## 統合テスト連携

Focused Vitest: `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/app/login/error.spec.tsx apps/web/app/login/loading.spec.tsx`。Runtime screenshot は user-gated evidence として Phase 13 境界に残す。
