[実装区分: 実装仕様書]

# Phase 3 合意 — 設計レビュー

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| phase | 3 / 13 |
| 改訂日 | 2026-05-03 |
| 実装区分 | 実装仕様書 |
| 状態 | pending（レビュー PASS・実装は Phase 5 / user 指示後) |

## 合意 summary

Phase 1（要件 / 真因再確定）と Phase 2（lazy factory 設計）を 3 系統 × 4 条件でレビューし、不変条件 #5 / #14 / #16 の整合と上流 / 下流ブロック解消条件を確定。**Plan A 採択を最終決定** とし、Phase 5 実装ランブックへ引き渡す。

## Phase deliverables

### 3 系統レビュー結果

| 系統 | 観点数 | 結果 |
| --- | --- | --- |
| A. システム系（構造・契約・実装整合） | 10 観点 | 全 OK（test mock 切替は Phase 4 でフォーマット決定要） |
| B. 戦略・価値系（運用・コスト・将来拡張） | 8 観点 | 全 OK |
| C. 問題解決系（真の論点・因果・改善優先順位） | 因果表 + 価値コスト表 + 優先順位 | OK |

### 4 条件評価

- 矛盾なし: PASS（Plan A は Phase 1 真因に直接対応、AC と整合、不採用根拠が index.md と一致、旧 first-choice 再試行禁止明記）
- 漏れなし: PASS（`/_global-error` `/_not-found` 両経路解消、AC-1〜AC-9 evidence 割当済、影響範囲 8 ファイル集約、middleware / config / package.json の不変根拠明示）
- 整合性: PASS（Next 16 `"use client"` 必須仕様侵害なし、TypeScript `verbatimModuleSyntax` 整合、Cloudflare Workers OpenNext 1.19.4 dynamic import 互換）
- 依存関係整合: PASS（上流: 試行履歴 / 公式 docs に矛盾なし、下流: blocking 解消、並行: `apps/api` 独立）

### 不変条件整合

- #5（D1 access boundary）: OK（`apps/web` のみ、D1 / `apps/api` 変更ゼロ）
- #14（Cloudflare free-tier）: OK（新規 binding ゼロ、worker.js 構造変化最小）
- #16（secret values never documented）: OK（build ログから secret 文字列を evidence に転記しないルールを Phase 11 で運用）

### Plan A 自己レビュー 8 観点

冗長性 / export 互換 / await 漏れ / test mock / patch 不要 / ESM 解決 / Workers 互換 / 初回 latency — すべて緩和策確定または許容判定。

### 下流 5 タスク ブロック解消条件

| 下流タスク | 解消条件 |
| --- | --- |
| P11-PRD-003 fetchPublic service-binding 経路書き換え | `pnpm build` / `build:cloudflare` 緑化 |
| P11-PRD-004 `/privacy` `/terms` ページ実装 | 同上 |
| `apps/web/wrangler.toml` env 追加に伴う deploy | 同上 |
| 09a-A-staging-deploy-smoke-execution | web build 成果物生成で staging deploy 可能化 |
| 09c-A-production-deploy-execution | 同上、production fail-closed 検証可能化 |

## レビュー結論

**Plan A 採択。Phase 5 実装ランブックへ引き渡し。**

不採用 8 件（旧 d / a / b / c / e / f / g / h）はそれぞれ index.md の根拠表と一致しており、再評価対象外。

## 状態

- **pending**: 仕様レビュー PASS は「設計妥当性」の合意。実コード変更 / build 実測は未実施

## 次 Phase への引き渡し

Phase 4（テスト戦略）へ次を渡す:

- レビュー PASS 済 Plan A の確定設計
- 4 コマンド検証セット（build / build:cloudflare / typecheck / lint）+ vitest mock 切替方針要請
- mock template 形式: `vi.mock("@/lib/auth", () => ({ getAuth: vi.fn().mockResolvedValue({ auth, signIn, signOut, handlers }) }))`
- source guard rg コマンド設計要請（type-only import 許容 / value import のみ hit）
- await 漏れチェックリスト（Phase 5 実装前提）
- Phase 4〜13 への要請一覧
