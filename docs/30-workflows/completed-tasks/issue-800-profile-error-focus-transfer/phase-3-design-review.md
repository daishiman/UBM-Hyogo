# Phase 3: 設計レビュー — `/profile/error.tsx` 横展開

**[実装区分: 実装仕様書]**

## 1. レビュー観点と判定

| 観点 | 判定 | 根拠 |
|---|---|---|
| 単一責務（SRP） | ✅ | error boundary 1 役 / module 抽出なし |
| 既存 API surface 不変 | ✅ | `apps/api` 不変。fetch 経路は profile 通常レンダリング側のため本タスクのスコープ外 |
| D1 直接アクセスなし | ✅ | client component / fetch 一切なし |
| OKLch トークン正本 | ✅ | root と同じ Tailwind class のみ（`text-danger` / `bg-surface-2` / `bg-accent` / `text-panel` / `border-border` / `text-text-3`）。HEX 直書きなし |
| primitives 範囲 | ✅ | 既存 button / Link / typography のみ。新規 primitive 追加なし |
| `*.spec.{ts,tsx}` 命名 | ✅ | `error.component.spec.tsx` 採用 |
| Phase 12 9 canonical headings 整合 | ✅ | Phase 12 output 構成済（main / implementation-guide / spec-update / changelog / unassigned-task / skill-feedback / compliance） |
| CONST_007 単一サイクル | ✅ | 30種レビュー後、横展開残 (`/admin` `/login`) と hook 抽出を今回サイクルで回収 |

## 2. リスクと緩和

| リスク | 緩和策 |
|---|---|
| profile route の他 spec ファイル（`_components/__tests__/*`）の vitest jsdom 設定との衝突 | 既存 vitest config で `@testing-library/react` の cleanup が global に設定済（root の `error.component.spec.tsx` と同 path 階層） |
| `<main>` 除去で page 側の skip link / heading hierarchy が崩れる | root layout が `<main>` を保有する場合に限り問題なし。事前に `apps/web/app/layout.tsx` を確認することを Phase 5 実装前 step に明記 |
| `logger` import path 解決失敗 | root が `"../src/lib/logger"`（1 階層）を使用。profile は `"../../src/lib/logger"`（2 階層）。Phase 5 で必ず相対 path を 2 階層に調整 |

## 3. 承認

- **Gate-A 設計レビュー判定**: 仕様書レベルでは PASS 相当。実装時に Phase 5 step 0 として `apps/web/app/layout.tsx` の `<main>` 存在確認を行う条件付き承認。
- **Approver**: daishiman（solo 運用ポリシーにより本人セルフレビュー）
