# Phase 3: 設計レビュー

## メタ情報

- taskId: `parallel-08-shared-foundation-admin-ui-foundation`
- phase: 3 / 13
- 実装区分: **実装仕様書**

## 目的

Phase 2 の設計を多角的にレビューし、PASS / MINOR / MAJOR 判定を確定する。simpler alternative の探索と Phase 4 開始条件 / Phase 13 blocked 条件を明示する。

## 実行タスク

1. レビュー観点ごとの判定
2. simpler alternative の検討
3. Phase 4 開始条件の確定
4. Phase 13 blocked 条件の確定
5. リスクと mitigations

## レビュー観点

| # | 観点 | 判定 | コメント |
|---|------|------|---------|
| R1 | 単一責務 | PASS | "admin UI 共通基盤の構造宣言" の 1 責務に閉じている |
| R2 | 副作用範囲 | PASS | layout への Provider 追加 + new 2 ファイル。既存 children 不変 |
| R3 | 後方互換 | PASS | ToastProvider は additive。既存 `useToast` 未使用 component は影響なし |
| R4 | テスタビリティ | PASS | type import / runtime throw / barrel import 全て Vitest で機械検証可能 |
| R5 | 命名 | MINOR | `useAdminMutation` の `_endpoint` underscore prefix は skeleton 期間のみ。step-01 で除去 |
| R6 | 不変条件遵守 | PASS | D1 直アクセスなし / 新規 endpoint なし / HEX 直書きなし / `*.spec.tsx` 命名 |
| R7 | 並列性 | PASS | parallel-01..07 と疎結合。serial-05/step-01 は本タスク完了後に開始 |
| R8 | client/server boundary | MINOR | `layout.tsx` は Server Component のまま、`ToastProvider` が client boundary を担う。Next.js App Router 規約と整合 |
| R9 | error.tsx 範囲 | PASS | admin segment の `error.tsx` が hook throw を catch する。global `error.tsx` も別途存在し二段防御 |
| R10 | 型 strict | PASS | `verbatimModuleSyntax` で type re-export を `type` キーワード付きで実施 |

総合判定: **PASS**（MINOR 2 件は実装フェーズで自然解消）

## Simpler Alternative の検討

| Alt | 概要 | 比較 | 採否 |
|-----|------|------|------|
| A1: ToastProvider を `(admin)/layout.tsx` に限定 | scope を admin に絞る | `/login` 等で `useToast` 使用不可になり後続 spec で再 wrap が必要 | **不採用** |
| A2: hook 自体を作らず step-01 で初出 | barrel/型を後送り | serial-05/step-01〜07 が同時に type 不明な import を持ち、type drift が起きる | **不採用** |
| A3: skeleton ではなく no-op 実装 | throw せず Promise.resolve | 「未実装」検知が困難・本番混入リスク | **不採用** |
| A4 (採用): root wrap + skeleton throw + barrel | 現方針 | 型固定 + 未実装検知の両立 | **採用** |

## Phase 4 開始条件

- [ ] Phase 3 総合判定が PASS（MINOR は記録のみで block しない）
- [ ] Validation Matrix が全 AC を網羅
- [ ] テストファイル配置パスが確定: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` + `apps/web/__tests__/layout.spec.tsx`（Vitest）, `apps/web/playwright/admin-shared-foundation.spec.ts`（Playwright）
- [ ] 既存 `*.test.{ts,tsx}` 命名違反がないこと（`*.spec.{ts,tsx}` のみ）

## Phase 13 blocked 条件（解除されるまで PR 不可）

- [ ] `pnpm tsc --noEmit` が green
- [ ] `pnpm lint` が green
- [ ] coverage Statements/Branches/Functions/Lines >= 80%（apps/web）
- [ ] `verify-design-tokens` CI gate が pass（HEX/直書き禁止）
- [ ] serial-05/step-01 が本タスクの export 契約に依存する import を保持しても type error にならない
- [ ] API error inventory の grep 結果が記録され、serial-05/step-01 の parser compatibility 境界と発散していない

## リスクと Mitigations

| リスク | 影響 | Mitigation |
|--------|------|-----------|
| ToastProvider の `useState` が全 route で初期化される | 軽微（state 1 個・配列空） | そのまま受容 |
| skeleton throw が production にリーク | admin 機能が動作しない | step-01 実装前に admin 機能本番リリースしない / Phase 4 で throw を pin |
| `verbatimModuleSyntax` 違反 | tsc fail | barrel で `type` キーワード付き re-export を強制 |
| 既存 `useToast` 利用箇所との衝突 | None | 現在 `useToast` を呼ぶ component が Provider 外に居る場合は throw する設計済み。wrap で逆に救済される |

## 多角的チェック観点（AI 判断）

- A1 を採用しなかったことで「`/login` で toast が出せる」副次効果がある（後続 task で活用余地）
- ToastProvider が SSR で空 array で初期化される点に SSR/CSR mismatch がないこと（`crypto.randomUUID()` は client toast 時のみ呼ばれるため hydration safe）

## サブタスク管理

- [ ] R1〜R10 判定確定
- [ ] simpler alternative 4 件評価
- [ ] Phase 4 開始条件確定
- [ ] Phase 13 blocked 条件確定

## 成果物

- 本 phase-03.md（PASS 判定 + Phase 4 開始条件 + Phase 13 blocked 条件）

## 完了条件 (DoD)

- [ ] 総合判定 PASS
- [ ] simpler alternative 比較表完成
- [ ] 後続 Phase ゲート条件が機械検証可能

## タスク100%実行確認【必須】

- [ ] 観点 R1〜R10 全件レビュー済
- [ ] MAJOR 判定なし
- [ ] Phase 4 / Phase 13 ゲート条件が確定

## 次 Phase

Phase 4（テスト作成）: Vitest type / contract / Playwright 3 観点をテストファイル配置パスと共に明示
