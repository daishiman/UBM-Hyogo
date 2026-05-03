[実装区分: 実装仕様書]

# Phase 7 合意 — AC マトリクス

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| phase | 7 / 13 |
| 改訂日 | 2026-05-03 |
| 実装区分 | 実装仕様書 |
| 状態 | pending（gate 定義完了・実測は Phase 11) |

## 合意 summary

index.md 定義の AC-1〜AC-9（Plan A: lazy factory 方針）を 5 ゲート（build / static-analysis / source-guard / dependency hygiene / test）にマッピングし、各 AC に「検証コマンド」「担当 Phase」「evidence 出力ファイル」「PASS 判定基準」を紐付けた単一マトリクスを確定。各 AC の status は **`gate defined / pending follow-up execution`** とし、実測は Phase 11 で実施する。

## Phase deliverables

### ゲート定義

| ゲート | 検証内容 | 実施 Phase |
| --- | --- | --- |
| build | `pnpm build` / `build:cloudflare` exit 0 + `useContext` null 0 hit + artifact 生成 | Phase 5 / Phase 11 |
| static-analysis | typecheck / lint exit 0 | Phase 9 / Phase 11 |
| source-guard | `auth.ts` / `oauth-client.ts` に top-level value import 不在 | Phase 5 / Phase 11 |
| dependency hygiene | `package.json` / `pnpm-lock.yaml` 差分が 4 パッケージで無変更 | Phase 5 / Phase 10 |
| test | 既存 vitest 2 ファイル PASS | Phase 5 / Phase 11 |

### AC ↔ ゲート 対応表（要約）

| AC | gate | 主要 evidence | 判定基準 |
| --- | --- | --- | --- |
| AC-1 | build | `outputs/phase-11/build-smoke.md` | exit 0 |
| AC-2 | build | `outputs/phase-11/build-cloudflare-smoke.md` | exit 0 + worker.js ls hit |
| AC-3 | build | build / build:cloudflare 両 log | `useContext` null grep 0 hit |
| AC-4 | static-analysis | `outputs/phase-09/main.md` | typecheck exit 0 |
| AC-5 | static-analysis | `outputs/phase-09/main.md` | lint exit 0 |
| AC-6 | source-guard | `outputs/phase-11/build-smoke.md` | `rg` 0 hit |
| AC-7 | static-analysis + diff | `outputs/phase-10/main.md` | typecheck PASS + `getAuth()` 戻り値 shape |
| AC-8 | dependency hygiene | `outputs/phase-10/main.md` | 4 パッケージ version 行 diff 0 |
| AC-9 | test | `outputs/phase-11/build-smoke.md` | vitest exit 0 + 全 PASS |

### evidence カバレッジ

- AC-1〜AC-3 は build smoke 同一実行で 3 evidence 同時取得（実測コスト低）
- AC-7 は型 + 手動 diff の二重化
- 全 AC が 1 つ以上のゲートで担保

### phase-11 outputs と AC の対応

| phase-11 evidence | カバー AC |
| --- | --- |
| `build-smoke.md` | AC-1, AC-3, AC-4, AC-5, AC-6, AC-9 |
| `build-cloudflare-smoke.md` | AC-2, AC-3 |
| `prerender-output-check.md` | AC-1, AC-2, AC-3（補助） |
| `main.md` | 上記 3 ファイルへのインデックス + AC × evidence 最終マッピング |

## 状態

- **pending**: ゲート定義完了。実測は Phase 11 で実施。本 Phase ではコード変更 / 実走 / commit / push / PR を実施しない

## 次 Phase への引き渡し

Phase 8（DRY 化）へ次を渡す:

- AC ↔ 5 ゲートのマトリクス
- evidence 出力ファイル一覧
- 全 AC のカバレッジ判定（漏れなし）
- Phase 11 へ持ち越す実測項目一覧
