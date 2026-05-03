[実装区分: 実装仕様書]

# Phase 6 合意 — 異常系検証

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| phase | 6 / 13 |
| 改訂日 | 2026-05-03 |
| 実装区分 | 実装仕様書 |
| 状態 | pending（異常系設計確定・実測未実施) |

## 合意 summary

Plan A 適用後に想定される 12 件の異常パターン（F-1〜F-12）を網羅し、検出経路 / 期待挙動 / 分岐先を仕様化。lazy factory 特有の失敗モード（dynamic import 失敗 / cold-start latency / 並行呼び出し / 部分 import）と build 中断時の部分成果物 / rollback 経路を切り分ける。

## Phase deliverables — 異常系マトリクス概要

| # | 異常パターン | 主要分岐 |
| --- | --- | --- |
| F-1 | Plan A 適用後も `/_global-error` build で `useContext` null 再発 | top-level value import 残存を rg で再検証 → 撤廃 → なお再発なら F-3 |
| F-2 | `/_not-found` で同種エラー継続 | F-1 と同根、同じ rg 確認後 F-3 |
| F-3 | top-level 撤廃済みでも build 失敗 | Phase 2 再オープン、不採用候補（serverExternalPackages + pnpm patch）の user 承認後再評価 |
| F-4 | `await import("next-auth")` runtime 失敗 | route handler 500 / Worker log。`pnpm install --force` 後再現確認 |
| F-5 | cold start latency 増加 | next-auth bundle (~150KB) の初回 ESM 解決による数十 ms 増は許容。p95 100ms 超のみ調査 |
| F-6 | 並行リクエストで dynamic import 多重評価 | ESM native cache で通常は単一評価。万一は module-level Promise cache で memoize |
| F-7 | 部分 destructure でも全 module load 副作用 | next-auth 5.x は単一 module export、ESM 仕様準拠の正常挙動として抑止対象外 |
| F-8 | typecheck / lint 新規 fail | `getAuth` 戻り値型を明示 interface 固定で再試行、再発時は Step rollback |
| F-9 | 既存 vitest が mock 切替後も fail | mock 形式が `Awaited<ReturnType<typeof getAuth>>` 型と整合するか再確認 |
| F-10 | build 中断による部分成果物 | clean (`rm -rf apps/web/.next apps/web/.open-next`) で再 build、部分成果物を deploy しない |
| F-11 | source guard rg が type-only を誤検知 | 否定先読み `^import\s+(?!type)` で除外、誤検知時は guard 設計再調整 |
| F-12 | deploy 後 service-binding 経路 500 | 本 issue 責務外。`PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` 不在の可能性、P11-PRD-003 / wrangler 追記タスクへエスカレート |

## F-1 / F-2 切り分け手順（要約）

1. build log の `useContext` null 行とその ±20 行を確認
2. `auth.ts` / `oauth-client.ts` に top-level next-auth value import 残存がないか rg
3. 4 route handler が `await getAuth()` 経由になっているか rg
4. middleware.ts / next.config.ts 経由の transitive load 確認
5. すべて clear なら F-3 へ移行（user 承認後 Phase 2 再オープン）

## 自走禁止

- F-3 で不採用候補（serverExternalPackages / pnpm patch）の再評価には user 承認必須
- F-12 のエスカレーション先は本タスク責務外、別タスクで処理

## 状態

- **completed**: 異常系マトリクス / 切り分け手順は確定。実測 build / build:cloudflare は Phase 11 evidence で PASS。deploy・commit / push / PR は実施しない

## 次 Phase への引き渡し

Phase 7（AC マトリクス）へ次を渡す:

- F-1〜F-12 の検出経路と分岐
- F-3（Plan A 失敗時）の Plan B 移行ゲート定義
- cold-start latency / 並行呼び出しの許容基準（性能観点）
- AC-1〜AC-9 の異常系カバレッジ（特に AC-3 の `useContext` null 再発検出）
