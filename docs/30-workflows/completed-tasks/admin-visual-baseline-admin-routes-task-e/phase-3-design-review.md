---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 3
phase_name: 設計レビュー
created_at: 2026-05-27
---

# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## 1. レビュー観点と判断

| # | 観点 | 判断 | 根拠 |
|---|------|------|------|
| R1 | 既存 `admin-dashboard.spec.ts` との重複 | 統合方針で解消（旧 spec + snapshot dir を削除し `admin-shell/dashboard.spec.ts` にリプレース） | 同 route の baseline が 2 経路に分散すると drift の origin が不明になるため |
| R2 | `adminLogin` fixture の継承可否 | local visual では継承可。staging baseline では既存 `staging-visual-authenticated` storageState setup を継承し、`adminLogin(context)` 直呼びは使わない | 新規 mint 経路を作らない不変条件 / runtime-smoke-mint パターン / cookie URL drift 回避 |
| R3 | viewport を spec 内で hardcode するか project で注入するか | **project で注入**（spec 側は viewport-agnostic） | 同 spec を 4 viewport で回す matrix と整合・spec 重複を防ぐ |
| R4 | env-gated detail を default skip にする理由 | seed ID 不在時は SSR が 404 / 403 / レイアウト崩れになり、baseline が不安定 | AC-4 / L-I902-001..004 |
| R5 | `mockApi` を全 route に適用するか | client-side GET 系のみ。mutation は触らない | SSR fetch stub 不可 / mutation で副作用を起こさない不変条件 |
| R6 | 中間値 44 PNG 運用 | **禁止**。env-gated 2 routes は両方そろってから有効化 | baseline 正本の不安定化を防ぐ（AC-1 / 不変条件） |

---

## 2. リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| Task A-D の staging 反映遅延 | Phase 10 ゲートで「Task A-D staging 反映済」を着手条件として明示 |
| staging auth cookie URL drift | `staging-visual-authenticated` の storageState setup を使い、`PLAYWRIGHT_STAGING_BASE_URL` に対する cookie を生成する |
| bot baseline push 後の required check 未発火 | feedback_visual_baseline_github_token_retrigger に従い空コミット再トリガーを Phase 5/13 に明記 |
| seed ID 漏えい | env var は CI secret として注入、commit しない |

---

## 3. 既存 visual asset の取り扱い

- 削除対象: `apps/web/playwright/tests/visual/admin-dashboard.spec.ts` + `admin-dashboard.spec.ts-snapshots/`
- 削除前に該当 baseline を `admin-shell/dashboard.spec.ts-snapshots/` 側に再撮影（CI Linux runner）して置換
- 並行期間は設けない（重複 baseline は原則禁止）
