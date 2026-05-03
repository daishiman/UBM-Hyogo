[実装区分: 実装仕様書]

# Phase 7: AC マトリクス — issue-385-web-build-global-error-prerender-fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 7 / 13 |
| wave | issue-385 |
| mode | serial |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

index.md で定義した AC-1〜AC-9（Plan A: lazy factory 方針）を、build gate / static-analysis gate / source-guard gate / dependency hygiene gate / test gate の 5 ゲートにマッピングし、各 AC が「検証手段（コマンド）」「担当 Phase」「evidence 出力ファイル」「PASS 判定基準」を持つ単一マトリクスとして集約する。各 AC の status は `gate defined / pending follow-up execution`（実測は Phase 11）とし、本 Phase は実装・実測・commit / push / PR を含まない（CONST_007 / index.md scope out）。

## ゲート定義

| ゲート | 検証内容 | 実施 Phase |
| --- | --- | --- |
| build gate | `pnpm build` / `pnpm build:cloudflare` exit 0 + `useContext` null 0 hit + artifact 生成 | Phase 5 (runbook) / Phase 11 (実測) |
| static-analysis gate | `pnpm typecheck` / `pnpm lint` exit 0 | Phase 9 / Phase 11 |
| source-guard gate | `apps/web/src/lib/auth.ts` / `oauth-client.ts` に top-level next-auth value import 不在 | Phase 5 / Phase 11 (手動) |
| dependency hygiene gate | `package.json` 差分が `next` / `react` / `react-dom` / `next-auth` で無変更 | Phase 5 / Phase 10 (最終レビュー) |
| test gate | 既存 vitest (`me/[...path]/route.test.ts` / `auth/callback/email/route.test.ts`) PASS | Phase 5 (mock 切替) / Phase 11 |

## AC ↔ ゲート マトリクス

| AC | 内容（index.md と完全整合） | gate | 検証手段（コマンド） | 担当 Phase | evidence 出力ファイル | PASS 判定基準 | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0 | build | `mise exec -- pnpm --filter @ubm-hyogo/web build; echo $?` | Phase 5 / Phase 11 | `outputs/phase-11/build-smoke.md` | exit code 0 | gate defined / pending follow-up execution |
| AC-2 | `build:cloudflare` exit 0 + `apps/web/.open-next/worker.js` 生成 | build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare; echo $?; ls -la apps/web/.open-next/worker.js` | Phase 5 / Phase 11 | `outputs/phase-11/build-cloudflare-smoke.md` | exit code 0 かつ `worker.js` が ls で hit | gate defined / pending follow-up execution |
| AC-3 | AC-1 / AC-2 の build ログに `Cannot read properties of null (reading 'useContext')` が含まれない | build | `grep -n "Cannot read properties of null (reading 'useContext')" /tmp/issue-385-build*.log \|\| echo OK` | Phase 11 | `outputs/phase-11/build-smoke.md` / `outputs/phase-11/build-cloudflare-smoke.md` | grep hit 0 件（"OK" 出力） | gate defined / pending follow-up execution |
| AC-4 | `pnpm typecheck` exit 0 | static-analysis | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck; echo $?` | Phase 9 / Phase 11 | `outputs/phase-09/main.md` / `outputs/phase-11/build-smoke.md` | exit code 0 | gate defined / pending follow-up execution |
| AC-5 | `pnpm lint` exit 0 | static-analysis | `mise exec -- pnpm --filter @ubm-hyogo/web lint; echo $?` | Phase 9 / Phase 11 | `outputs/phase-09/main.md` / `outputs/phase-11/build-smoke.md` | exit code 0 | gate defined / pending follow-up execution |
| AC-6 | `apps/web/src/lib/auth.ts` が top-level で `next-auth` / `next-auth/providers/*` / `next-auth/jwt` を value import していない（type-only は許容） | source-guard | `rg -n '^import\s+(?!type)' apps/web/src/lib/auth.ts \| rg 'from "next-auth' \|\| echo OK` | Phase 5 / Phase 11 | `outputs/phase-11/build-smoke.md` / `outputs/phase-10/main.md`（diff レビュー） | rg hit 0 件（"OK" 出力） | gate defined / pending follow-up execution |
| AC-7 | `auth.ts` の export 互換性が維持され、4 route handler および middleware が変更後も同等機能を提供する（typecheck PASS で担保） | static-analysis | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck; echo $?` + `git diff main -- apps/web/src/lib/auth.ts` で export shape 確認 | Phase 9 / Phase 10 / Phase 11 | `outputs/phase-09/main.md` / `outputs/phase-10/main.md` | typecheck exit 0 かつ `getAuth()` 戻り値が `{ handlers, auth, signIn, signOut }` を含む | gate defined / pending follow-up execution |
| AC-8 | `next` / `react` / `react-dom` / `next-auth` の version 変更を伴わない | dependency hygiene | `git diff main -- apps/web/package.json pnpm-lock.yaml` を確認、対象 4 パッケージの version 行に diff なし | Phase 5 / Phase 10 | `outputs/phase-10/main.md` | 4 パッケージとも version 行 diff 0 | gate defined / pending follow-up execution |
| AC-9 | `apps/web/app/api/auth/callback/email/route.test.ts` および `apps/web/app/api/me/[...path]/route.test.ts` 等の既存テストが PASS する（mock 切替後を含む） | test | `mise exec -- pnpm --filter @ubm-hyogo/web test -- app/api/me/[...path]/route.test.ts app/api/auth/callback/email/route.test.ts; echo $?` | Phase 5 / Phase 11 | `outputs/phase-11/build-smoke.md`（test サマリ）| exit code 0 + 全 spec PASS（fail / skip ゼロ） | gate defined / pending follow-up execution |

## 各 AC の evidence カバレッジ確認

| AC | 該当ゲート数 | evidence file 数 | カバレッジ判定 |
| --- | --- | --- | --- |
| AC-1 | 1 (build) | 1 | OK |
| AC-2 | 1 (build) | 1 | OK |
| AC-3 | 1 (build) | 2（build / build:cloudflare 両 log） | OK |
| AC-4 | 1 (static-analysis) | 1-2 | OK |
| AC-5 | 1 (static-analysis) | 1-2 | OK |
| AC-6 | 1 (source-guard) | 1-2 | OK |
| AC-7 | 1 (static-analysis) + diff レビュー | 1-2 | OK（型 + 手動 diff の二重化）|
| AC-8 | 1 (dependency hygiene) | 1 | OK |
| AC-9 | 1 (test) | 1 | OK |

build smoke 系 AC (AC-1〜AC-3) は同一実行で 3 evidence を同時取得するため実測コストが低い。

## phase-11 outputs との対応関係

index.md outputs に列挙された 3 つの phase-11 evidence file と AC の対応:

| phase-11 evidence file | カバーする AC | 主要記載内容 |
| --- | --- | --- |
| `outputs/phase-11/build-smoke.md` | AC-1, AC-3, AC-4, AC-5, AC-6, AC-9 | `pnpm build` stdout 抜粋 / exit code / `useContext` null grep 結果 / typecheck・lint・test サマリ / source guard rg 結果 |
| `outputs/phase-11/build-cloudflare-smoke.md` | AC-2, AC-3 | `pnpm build:cloudflare` stdout 抜粋 / exit code / `worker.js` ls / `useContext` null grep 結果 |
| `outputs/phase-11/prerender-output-check.md` | AC-1, AC-2, AC-3 (補助) | `apps/web/.next/server/app/_global-error.*` / `_not-found.*` の生成有無 ls / Static or Prerendered 判定の補助記録 |

`outputs/phase-11/main.md` は上記 3 ファイルへのインデックスとして位置付け、AC × evidence の最終マッピングを集約する。

## evidence path 一覧（Phase output cross-reference）

| Phase output | 主に保証する AC | 主要内容 |
| --- | --- | --- |
| `outputs/phase-01/main.md` | AC-1〜AC-9 (要件) | 真因（Plan A）/ Scope / approval gate / AC ↔ evidence 初期表 |
| `outputs/phase-02/main.md` | AC-1〜AC-3, AC-6, AC-7, AC-8 | Plan A 採用方針 / 不採用候補比較 / 依存変更マトリクス（差分ゼロ） |
| `outputs/phase-03/main.md` | AC-1〜AC-9 (レビュー) | 設計レビュー / 4 条件 / 不変条件整合 / ブロック解消 |
| `outputs/phase-04/main.md` | AC-1〜AC-9 | 5 レイヤテスト境界 / mock 切替方針 / source guard 設計 |
| `outputs/phase-05/main.md` | AC-1〜AC-9 | runbook / lazy factory 実装 diff / mock 切替実装 / approval gate |
| `outputs/phase-06/main.md` | AC-1〜AC-3, AC-9 | 異常系 F-1〜F-12 / lazy factory 特有モード / rollback 手順 |
| `outputs/phase-07/main.md` | AC-1〜AC-9 (本マトリクス) | AC × ゲート対応表 / phase-11 evidence file マッピング |
| `outputs/phase-09/main.md` | AC-4, AC-5, AC-7 | typecheck / lint 実行サマリ / 型互換確認 |
| `outputs/phase-10/main.md` | AC-6, AC-7, AC-8 | 最終 diff レビュー / source guard 結果 / 依存差分レビュー |
| `outputs/phase-11/build-smoke.md` | AC-1, AC-3, AC-4, AC-5, AC-6, AC-9 | build / typecheck / lint / test stdout 抜粋 / grep 結果 |
| `outputs/phase-11/build-cloudflare-smoke.md` | AC-2, AC-3 | cloudflare build stdout 抜粋 / worker.js ls |
| `outputs/phase-11/prerender-output-check.md` | AC-1, AC-2, AC-3 (補助) | prerender artifact 検査 |
| `outputs/phase-11/main.md` | AC-1〜AC-9 | 上記 3 evidence file へのインデックス + 最終 AC × evidence マッピング |

## approval gate 集約

| 操作 | 承認単位 | 担当 Phase |
| --- | --- | --- |
| `apps/web/src/lib/auth.ts` の lazy factory 化（実装） | 本タスク内で実施（Phase 5） | Phase 5 |
| 4 route handler の `await getAuth()` 経由化 | 本タスク内で実施 | Phase 5 |
| `oauth-client.ts` の dynamic import 化 | 本タスク内で実施 | Phase 5 |
| 既存 vitest 2 ファイルの mock 切替 | 本タスク内で実施 | Phase 5 |
| `next.config.ts` `serverExternalPackages` 追加 | 禁止 / 必要時は user 承認 | Phase 6 F-3 |
| `pnpm patch next-auth` 適用 | 禁止 / 必要時は user 承認 | Phase 6 F-3 |
| `next` / `react` / `react-dom` / `next-auth` の version bump | 禁止（AC-8） | 全 Phase |
| `bash scripts/cf.sh deploy` | 都度 user 承認 | 09a / 09c (本タスク外) |
| commit / push / PR | 本タスクでは行わない（user 承認後に別経路で実施） | Phase 13 / 別タスク |

## ゲート fail 時の扱い

| ゲート | fail 時の対応 |
| --- | --- |
| build gate | Phase 6 F-1 / F-2 の rg 切り分け → top-level import 残存なら撤廃、撤廃済みなら F-3（Phase 2 再オープン: `serverExternalPackages` + `pnpm patch` 再評価） |
| static-analysis gate | Phase 6 F-8 の戻り値型明示で再試行、再発時は該当 Step rollback |
| source-guard gate | `auth.ts` / `oauth-client.ts` の該当 import を再撤廃 |
| dependency hygiene gate | `git checkout -- apps/web/package.json pnpm-lock.yaml` で巻き戻し、版据置に戻す |
| test gate | Phase 6 F-9 の mock 戻り値型確認 → `Awaited<ReturnType<typeof getAuth>>` 整合へ修正 |

## ステータス記法

| status | 意味 |
| --- | --- |
| `gate defined / pending follow-up execution` | 検証手段と evidence path が確定済み。実測は Phase 11 |
| `passed` | 実測 evidence が evidence path に追記され gate を通過（Phase 11 完了後に遷移） |
| `failed` | gate fail。fallback / 再オープンの対応中（本 Phase では使用しない） |

## 実行タスク

1. AC-1〜AC-9 を 5 ゲートにマッピングする。完了条件: AC × ゲート対応表が確定する。
2. 各 AC に検証手段・担当 Phase・evidence 出力ファイル・PASS 判定基準を割り当てる。完了条件: 全 AC が 4 列すべて埋まる。
3. phase-11 outputs (`build-smoke.md` / `build-cloudflare-smoke.md` / `prerender-output-check.md`) と AC の対応を確定する。完了条件: 3 evidence file × AC マッピング表が揃う。
4. status 列を `gate defined / pending follow-up execution` で統一する。完了条件: 実測判断を本 Phase に混入させない。
5. ゲート fail 時の対応経路を確定する。完了条件: 5 ゲートすべてに fail 時の分岐が記載される。
6. approval gate を集約する。完了条件: 8 項目以上が表で揃う。

## 参照資料

- `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/index.md`（AC-1〜AC-9 の正本 / Plan A 全体方針）
- `phase-01.md`（AC ↔ evidence 初期マッピング）
- `phase-02.md`（Plan A 採用方針 / 不採用候補）
- `phase-04.md`（5 レイヤテスト境界 / mock 切替方針）
- `phase-05.md`（runbook / lazy factory 実装）
- `phase-06.md`（異常系 F-1〜F-12 / rollback 手順）

## 実行手順

- 対象 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- 本仕様書作成ではコード変更、deploy、commit / push / PR、dependency 更新、build smoke 実測を行わない
- 実測は Phase 9 / Phase 11 で実施

## 統合テスト連携

- 上流: Phase 4 / Phase 5 / Phase 6
- 下流: Phase 8（DRY）/ Phase 9（QA）/ Phase 10（最終レビュー）/ Phase 11（実測）

## 多角的チェック観点

- 不変条件 #5 / #14 / #16: マトリクス記述に `apps/api` / D1 / 新規 binding / secret 値を含めない
- 未実測を PASS と扱わない: status を `gate defined / pending follow-up execution` に固定
- ゲート単一経路 PASS の見落とし防止: AC-7 を typecheck + 手動 diff で二重化、AC-3 を build / build:cloudflare 両 log で二重化
- index.md AC との完全整合: AC-1〜AC-9 の文言・対象コマンドを正本と一致させる
- phase-11 evidence file との対応関係を明示し、Phase 11 実測時に file 配置の判断ブレを起こさない

## サブタスク管理

- [ ] refs を確認した
- [ ] AC × ゲート対応表を確定した（AC-1〜AC-9）
- [ ] 各 AC の evidence カバレッジを確認した
- [ ] phase-11 outputs (`build-smoke.md` / `build-cloudflare-smoke.md` / `prerender-output-check.md`) と AC の対応表を確定した
- [ ] approval gate 集約表を確定した
- [ ] ゲート fail 時の対応を明記した
- [ ] status 列を `gate defined / pending follow-up execution` で統一した
- [ ] outputs/phase-07/main.md を作成した

## 成果物

- `outputs/phase-07/main.md`（AC × ゲート対応表 / evidence カバレッジ / phase-11 evidence file マッピング / approval gate 集約 / ゲート fail 対応 / status 記法）

## 完了条件

- AC-1〜AC-9 すべてが検証手段・担当 Phase・evidence 出力ファイル・PASS 判定基準に紐付いている
- 5 ゲート (build / static-analysis / source-guard / dependency hygiene / test) すべてに fail 時対応が記載されている
- phase-11 の 3 evidence file と AC の対応関係が表で確定している
- status 列が `gate defined / pending follow-up execution` で統一されている
- approval gate 8 項目以上が集約されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR、dependency 更新、build smoke 実測を実行していない
- [ ] secret 値・実行ログ実値を記録していない

## 次 Phase への引き渡し

Phase 8（DRY 化）へ次を渡す:

- AC × ゲート対応表（evidence file の重複・欠落確認のベース）
- evidence path 一覧（Phase output cross-reference）
- phase-11 evidence file × AC マッピング
- approval gate 集約（重複記述があれば DRY 化対象）
- ゲート fail 時の対応経路
- status 記法（実測時に `passed` / `failed` への遷移ルール）
