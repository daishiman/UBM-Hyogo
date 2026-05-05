[実装区分: 実装仕様書]

# Phase 10 合意 — 最終レビュー（仕様整合 PASS）

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| phase | 10 / 13 |
| 改訂日 | 2026-05-03 |
| 実装区分 | 実装仕様書 |
| 状態 | pending（仕様整合 PASS・build 成功 PASS は Phase 11 で取得) |

## 合意 summary

Plan A を採る Phase 1〜9 の成果物を 4 条件 × 16 項目 review checklist で評価し、cross-reference 整合と不変条件 #5 / #14 / #16 の整合を確認した。**本 Phase の PASS は「仕様整合 PASS」であり、実測 evidence による「build 成功 PASS」は Phase 11 で別途取得する**。残課題を Phase 11 / Phase 12 / ブロック対象 follow-up に引き渡す。

## Phase deliverables — review checklist 16 項目

| # | 項目 | 引用 Phase | 結果 |
| --- | --- | --- | --- |
| C-1 | 真因記述の正確性（next-auth 除去で再現消失の切り分け実験で確定） | 1 | PASS |
| C-2 | Plan A 採択根拠の網羅性（lazy factory 隔離 + 不採用 5 件） | 2 / index.md | PASS |
| C-3 | AC-1〜AC-9 の test / evidence 担保 | 1 / 7 / 9 / 11 | PASS |
| C-4 | export shape 互換維持（`getAuth()` 戻り値 = handlers/auth/signIn/signOut） | 2 / 5 / 7 / 8 | PASS（typecheck G-1 で構造担保） |
| C-5 | 4 route handler 全変更網羅 | index.md / 5 / 8 R-1〜R-4 | PASS |
| C-6 | `oauth-client.ts` dynamic import 適用 | 2 / 5 / 8 DC-6 | PASS |
| C-7 | middleware / next.config / package.json 不変 | index.md / 1 / 9 grep | PASS |
| C-8 | 既存テスト mock 修正案の妥当性 | 4 / 9 G-3 | PASS |
| C-9 | DRY 化判定（案 B 採用 / helper 不要） | 8 | PASS |
| C-10 | dead code 検出計画 DC-1〜DC-8 | 8 / 9 | PASS |
| C-11 | `getAuth()` 内部 Promise cache | 8 | PASS |
| C-12 | type-only import 境界の明文化 | 8 | PASS |
| C-13 | 不採用案の root-cause 文書化漏れチェック | index.md | PASS |
| C-14 | lefthook / CI gate 影響 | 9 | PASS |
| C-15 | skill index 影響（Phase 12 で `pnpm indexes:rebuild`） | 9 | PASS |
| C-16 | Phase 11 manual smoke runbook 引き継ぎ | 9 | PASS |

## 4 条件評価

| 条件 | 結果 | 主要根拠 |
| --- | --- | --- |
| (1) 矛盾なし | PASS | Plan A 方針と AC ↔ evidence と DRY 判定と approval gate が index.md / Phase 2 / 5 / 7 / 8 / 9 で一貫 |
| (2) 漏れなし | PASS | 影響 9 ファイル / 5 ゲート / 4 evidence / DC-1〜DC-8 / 下流 5 タスクすべてに引き継ぎ先 |
| (3) 整合性 | PASS | `apps/web` 責務境界 / 状態所有権集中 / dependency 据置 / 公式 docs `"use client"` 必須要件維持 |
| (4) 依存関係整合 | PASS | 上流（試行履歴 + 切り分け実験 7 件）/ 下流（P11-PRD-003 / -004 / wrangler env / 09a / 09c）すべて解消条件明示 |

## 不変条件整合

- #5（D1 access boundary）: PASS — `apps/web` 内に閉じる
- #14（Cloudflare free-tier）: PASS — 新規 binding ゼロ、worker.js 構造変化最小
- #16（secret values never documented）: PASS — Phase 11 で secret 文字列を evidence に転記しないルール継承

## diff 最小性 検証計画

- `git diff main -- apps/web/src/lib/auth.ts apps/web/src/lib/auth/oauth-client.ts` で lazy factory 改修のみ
- 4 route handler は `await getAuth()` 1〜2 行追加 + import path 切替のみ
- `git diff main -- apps/web/package.json pnpm-lock.yaml` 空（AC-8）
- `git diff main -- apps/web/middleware.ts apps/web/next.config.ts apps/web/app/global-error.tsx` 空

## 残課題引き継ぎ

| 引継ぎ先 | 残課題 |
| --- | --- |
| Phase 11 | build / build:cloudflare / typecheck / lint / test の実走と exit code 取得 / `useContext` null grep 結果 / `worker.js` ls / source guard rg 結果 |
| Phase 12 | ドキュメント更新（issue #385 closing comment / Plan A 採択経緯 user 報告）/ `pnpm indexes:rebuild` |
| follow-up タスク | L3 source guard CI 統合 / staging deploy (09a) / production deploy (09c) / commit / push / PR (Phase 13 / diff-to-pr) |

## 状態

- **pending**: 仕様整合 PASS 確定。build 成功 PASS（実測）は **未取得**、Phase 11 で取得する。本 Phase ではコード変更・実走・commit / push / PR・dependency 更新を実施しない

## 次 Phase への引き渡し

Phase 11（実測 evidence）へ次を渡す:

- 仕様整合 PASS 済（Plan A 採択 / 不採用 8 件記録 / 4 条件 PASS / 不変条件 #5 #14 #16 整合）
- 実走対象 5 ゲート + 補助 grep
- evidence 4 ファイル（main / build-smoke / build-cloudflare-smoke / prerender-output-check）への記録項目
- secret 転記禁止ルール（不変条件 #16）
- 失敗時の Phase 5 / Phase 8 差し戻し経路
