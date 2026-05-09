# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 3 |
| task | task-05-error-boundary-and-staging-smoke |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

この Phase で task-05 の実装仕様、検証条件、または close-out 条件を固定する。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-03/main.md`

## 統合テスト連携

`apps/web/tests/e2e/staging-smoke.spec.ts` は `staging-smoke-checklist.md` の 19 routes を正本として実装サイクルで接続する。

## レビュー観点

### システム系

| 観点 | 評価 |
| --- | --- |
| 既存 API endpoint surface を侵さないか | OK。`error.tsx` / `not-found.tsx` は backend 非依存 |
| D1 直接アクセス禁止の不変条件 | OK。`apps/web` 配下の新設ファイルは D1 binding を呼ばない |
| 上流 task 契約のみで成立するか | OK。`@/lib/logger`（task-04）に集約。Sentry SDK 直叩きなし |
| Cloudflare Workers ランタイム制約 | OK。`error.tsx` / `global-error.tsx` は `"use client"` のため Edge runtime と無関係 |

### 戦略・価値系

| 観点 | 評価 |
| --- | --- |
| phase-1 S-06 を達成する最小スコープか | OK。19 routes smoke + 4 boundary 新設に限定 |
| token 正本化と整合するか | OK。`var(--ubm-color-*)` 経由のみ |
| task-18 への引き継ぎが明確か | OK。`e2e:staging` script + `staging-smoke-checklist.md` 出力で接続 |

### 問題解決系

| リスク | 緩和策 |
| --- | --- |
| primitives 未完成のため UI 暫定 | token 経由で実装、task-15 周辺の refactor 巻き取り |
| Playwright flaky | `retries: 2` を staging project 限定で適用 |
| `STAGING_BASE_URL` に production URL が混入 | spec 冒頭で `assert(!url.includes("production"))` 風の guard を入れる |
| `global-error.tsx` の挙動が dev で観察できない | `next build && next start` で確認、または staging で意図的 throw |

## 設計判断の追認

- error UI 文言は最小限。`responderUrl` 案内は task-15 以降で追加（本 task のスコープ外）
- `not-found.tsx` の Link は `next/link` 経由で `/` へ遷移
- `loading.tsx` は `aria-busy="true"` / `aria-live="polite"` を必ず持つ

## 残課題（本 task では未着手・他 task に渡す）

- a11y axe 自動検証 → task-18
- token 適用 grep gate → task-18
- error UI 最終デザイン → task-15

## 完了条件

- [ ] システム / 戦略 / 問題解決の 3 系統で blocking 級の指摘がない
- [ ] リスク表が原典 §11 と整合
- [ ] 残課題は本 task ではなく既存タスク（task-15 / task-18）が引き受けると確認済み（CONST_007 例外なし、先送り発生なし）
