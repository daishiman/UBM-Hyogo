[実装区分: 実装仕様書]

# Phase 3: 設計レビュー — issue-385-web-build-global-error-prerender-fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 3 / 13 |
| wave | issue-385 |
| mode | serial |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1（要件定義 改訂版）と Phase 2（lazy factory 設計）を、3 系統（システム / 戦略・価値 / 問題解決）と 4 条件（矛盾なし・漏れなし・整合性・依存関係整合）でレビューし、不変条件 #5 / #14 / #16 への整合および上流・下流タスクとのブロック解消条件を確定する。Plan A の自己レビュー観点（lazy factory 冗長性、export shape 互換性、await 漏れリスク、テスト mock 影響、pnpm patch 不要根拠、ESM 解決問題回避根拠）を網羅し、Phase 5 実装ランブックへの引き渡し事項を明確化する。

## 3 系統レビュー

### A. システム系（構造・契約・実装整合）

| 観点 | 確認内容 | 判定 |
| --- | --- | --- |
| `auth.ts` lazy factory `getAuth()` の構造妥当性 | top-level next-auth import を撤廃し、内部で `await import("next-auth")`。module-level Promise メモ化により 2 回目以降ゼロコスト | OK |
| `auth.ts` の export shape 互換性 | `handlers` / `auth` / `signIn` / `signOut` の直接 export を撤廃し、`getAuth()` 経由のみに統一。pure 関数 (`buildAuthConfig` / `fetchSessionResolve` / `AuthEnv`) と type-only export は据え置き。4 route handler / middleware が同等機能を維持 | OK |
| `oauth-client.ts` の dynamic import 化 | top-level `import { signIn } from "next-auth/react"` を関数内 `await import("next-auth/react")` へ。client bundle 影響軽微 | OK |
| 4 route handler の書き換え | `[...nextauth]` / `callback/email` / `admin/[...path]` / `me/[...path]` のすべてで `await getAuth()` 経由に統一。シグネチャ変更なし | OK |
| `middleware.ts` への影響 | next-auth 直接 import なし、`decodeAuthSessionJwt` のみ使用。Plan A の影響範囲外 | OK |
| `app/global-error.tsx` / `error.tsx` / `not-found.tsx` への影響 | 変更なし。`global-error.tsx` は Next 16 仕様に従い `"use client"` 維持 | OK |
| `next.config.ts` 影響 | `serverExternalPackages` 採用は ERR_MODULE_NOT_FOUND を招くため不採用。Plan A は config 変更を要しない | OK |
| `package.json` 影響 | `next` / `react` / `react-dom` / `next-auth` 全て据置。AC-8 整合 | OK |
| `wrangler.toml` 影響 | 本 issue と独立、変更しない | OK |
| `route.test.ts` 群への影響 | `vi.mock("@/lib/auth", ...)` で `handlers` 直接 mock していた箇所を `getAuth()` 経由 mock に統一。Phase 4 で形式確定、Phase 5 で実装 | OK（Phase 4 でフォーマット決定要） |

### B. 戦略・価値系（運用・コスト・将来拡張）

| 観点 | 確認内容 | 判定 |
| --- | --- | --- |
| 修正コスト最小化 | 6 ファイル（auth.ts / oauth-client.ts / 4 routes）+ 2 test の最小集合 | OK |
| dependency 副作用ゼロ | `next` / `react` / `react-dom` / `next-auth` / `@opennextjs/cloudflare` 全て据置。`pnpm-lock.yaml` 変更なし | OK |
| 将来の next-auth アップグレード耐性 | dynamic import path (`"next-auth"` / `"next-auth/react"` / `"next-auth/providers/*"`) は major bump 横断で安定。export shape 維持で route handler 影響なし | OK |
| 将来の Next / React アップグレード耐性 | top-level import 撤廃により build 時 prerender 経路から next-auth が完全隔離される。将来 Next が prerender 戦略を変えても影響を受けにくい | OK |
| Cloudflare free-tier (#14) | build 成果物の構造変化最小、新規 binding ゼロ。dynamic import は OpenNext 1.19.4 で transparent | OK |
| 開発者体験 | route handler の `await getAuth()` 1 行追加のみ。typecheck で await 漏れを早期検出 | OK |
| 観測性 | route handler 内の `await getAuth()` 失敗時は Next 標準 500 経路。既存ロギング維持 | OK |
| 上流修正待ちリスク回避 | Next.js / next-auth 上流修正時期未定の中で本リポ側に恒久 workaround を実装することで deploy ブロックを即時解消 | OK |

### C. 問題解決系（真の論点・因果・改善優先順位）

#### 真の論点

「next-auth top-level import が build 時 prerender で `@auth/core` の `React.createContext(undefined)` を発火させ React Dispatcher を破壊する」という pre-existing バグに対し、上流修正待ちでは staging/production deploy ブロックが継続する。本リポ側で **next-auth を build 時 prerender 経路から完全隔離する lazy factory パターン** を採用することで、依存据え置きのまま恒久解消する。

#### 因果と境界

| 因 | 果 | 境界 |
| --- | --- | --- |
| `auth.ts` の top-level `import NextAuth from "next-auth"` | build 時 prerender worker が next-auth module-init を評価し `@auth/core` `React.createContext` 発火 → Dispatcher 破壊 → `useContext` null | top-level import を撤廃すれば prerender 経路から完全隔離可能 |
| Next 16 + React 19 + next-auth 5.x の組み合わせ | pre-existing バグ（試行 1〜7 で確認） | upstream 修正は時期未定。本リポ側 workaround で恒久解消可 |
| route handler 実行時には next-auth が必要 | dynamic import (`await import("next-auth")`) で cold-start 時のみ読み込み、cache メモ化で 2 回目以降ゼロコスト | Cloudflare Workers の dynamic import 標準サポート、OpenNext 1.19.4 互換 |

#### 価値とコスト

| 案 | 価値 | コスト |
| --- | --- | --- |
| Plan A: lazy factory（採用） | dependency 据置で恒久解消 / next-auth bump 耐性高 / middleware・config 変更不要 | 6 ファイル改修 / route handler に `await getAuth()` 1 行追加 / test mock 形式統一 |
| 旧 (d) RSC 化（不採用） | — | Next 16 仕様違反で build 拒否 |
| (a) Next patch upgrade（不採用） | — | 16.2.5 不存在 |
| (b) React downgrade（不採用） | — | 19.2.4 でも再現 |
| (c) `serverExternalPackages`（不採用） | useContext は解消 | ERR_MODULE_NOT_FOUND を新たに招く |
| (e) next-auth bump（不採用） | — | module-init 構造同一で再発 |
| (f) global-error.tsx 削除（不採用） | — | auth.ts 経由で再現 |
| (g) 上流修正待ち（不採用） | — | 修正時期未定、deploy ブロック継続不可 |
| (h) pnpm patch（不採用） | 動作可能 | next-auth bump 時に毎回 patch 再生成、保守性劣 |

#### 改善優先順位

1. Plan A を Phase 5 で実装（auth.ts lazy factory + 4 routes 改修 + oauth-client dynamic import + test mock 修正）
2. Phase 11 で `pnpm build` / `pnpm build:cloudflare` / `pnpm typecheck` / `pnpm lint` 4 セット実測
3. AC-1〜AC-9 すべて PASS を確認
4. 失敗時は Phase 2 評価マトリクスに戻り、Plan A 内の cache 戦略 / dynamic import path / mock 形式を優先的に再評価（パッケージ bump や config 変更には踏み込まない）

## 4 条件評価

### 矛盾なし

- Plan A の「top-level next-auth import 撤廃」は Phase 1 真因（next-auth top-level import → Dispatcher 破壊）に対して直接的解消経路を取る
- AC-6（top-level import 撤廃）/ AC-7（export shape 互換）/ AC-8（dependency 据置）/ AC-9（テスト PASS）と Plan A の設計が整合
- 不採用 8 件の根拠が index.md と一致
- 旧 first-choice (RSC 化) を Phase 1 「失敗 first-choice」表で明示し、再試行を禁止
- 矛盾なし: PASS

### 漏れなし

- 失敗 2 経路（`/_global-error`, `/_not-found`）両方を Plan A で解消
- AC-1〜AC-9 すべてに evidence path 割当済（Phase 1）
- 試行履歴 7 件（next bump / react downgrade / bundler / global-error 削除 / route segment config / next-auth 除去 / 真因切り分け）が真因セクションで参照済
- 影響範囲: auth.ts / oauth-client.ts / 4 routes / 2 test の 8 ファイルに集約
- middleware / next.config / package.json / global-error.tsx が変更不要な根拠を Phase 2 で明示
- ブロック対象タスク 5 件が下流に列挙済
- 漏れなし: PASS

### 整合性

- Plan A は Next 16 App Router の `global-error.tsx` "use client" 必須仕様を侵害しない
- lazy factory `getAuth()` のシグネチャは next-auth 5.x の `NextAuth()` 戻り値型 (`NextAuthResult`) と一致
- type-only import は TypeScript 5.x の `verbatimModuleSyntax` / `isolatedModules` と整合
- Cloudflare Workers の dynamic import は OpenNext 1.19.4 で transparent（既存 build 経路と整合）
- middleware の `decodeAuthSessionJwt` 経路は Plan A 影響範囲外（独立）
- 整合性: PASS

### 依存関係整合

- 上流: Phase 1 真因 / 試行履歴 / Next・React・next-auth GitHub issue / 公式 docs に矛盾なし
- 下流: P11-PRD-003 / P11-PRD-004 / wrangler 追記 / 09a / 09c はいずれも build 成功を前提とするため、本タスク完了で blocking 解消
- 並行: `apps/api` 側の作業と独立（D1 / API 変更ゼロ）
- 依存関係整合: PASS

## 不変条件との整合確認

| 不変条件 | 確認内容 | 判定 |
| --- | --- | --- |
| #5 D1 access boundary | 本タスクは `apps/web` のみ。D1 / `apps/api` 変更ゼロ | OK |
| #14 Cloudflare free-tier | 新規 binding / KV / D1 / cron 追加なし。build 成果物の構造変化最小、dynamic import は OpenNext transparent | OK |
| #16 secret values never documented | build ログから secret 文字列を evidence に転記しないルールを Phase 11 で明文化 | OK |

## Plan A の自己レビュー観点

| 観点 | 評価 | 結論 |
| --- | --- | --- |
| lazy factory の冗長性 | route handler 各所に `await getAuth()` 1 行追加が必要だが、6 ファイルに集約され可読性は許容範囲。共通 helper を切ると再び top-level import を呼び込む懸念があるため敢えて分散配置のまま | 許容 |
| export shape 互換性 | runtime 直接 export (`handlers`/`auth`/`signIn`/`signOut`) を撤廃する破壊的変更を含む。ただし consumer は `apps/web` 内 6 ファイルに限定され、すべて本タスクで併行修正されるため外部影響なし | 許容 |
| await 漏れリスク | TypeScript の strict 設定で `Promise<NextAuthResult>` から直接 `.GET` 等にアクセスすると型エラー。typecheck でカバーされる。Phase 5 実装チェックリストに「await 全箇所明示」を追加 | 緩和済 |
| テスト mock 影響 | `vi.mock("@/lib/auth")` の形式が `handlers` 直接 mock から `getAuth` factory mock へ変化。Phase 4 で mock template を確定し、Phase 5 で 2 test ファイルを併行修正 | 緩和策確定 |
| `pnpm patch` 不要根拠 | next-auth/lib の `next/server` ESM extension 不足問題は、`serverExternalPackages` を採用しない限り発生しない。Plan A は `serverExternalPackages` を使わないため patch 不要 | 確認済 |
| ESM 解決問題回避根拠 | Plan A は next-auth を bundler の通常解決経路（dynamic import）に乗せるだけで、`external` 化しない。よって `ERR_MODULE_NOT_FOUND` は発生しない | 確認済 |
| Cloudflare Workers 互換 | OpenNext 1.19.4 は dynamic import を transparent に処理。Phase 11 で `build:cloudflare` 実測により担保 | Phase 11 で確認 |
| 初回 latency 増加 | route handler cold start 時のみ next-auth dynamic import コスト。Cloudflare Workers の cold start とほぼ同オーダーで実用上影響なし。module-level Promise メモ化で 2 回目以降ゼロコスト | 許容 |

## 上流 / 下流ブロック解消条件

### 上流ブロック

| 上流タスク | 解消条件 |
| --- | --- |
| Issue #385（CLOSED 状態のまま仕様化） | Phase 1 で真因再確定、Phase 2 で Plan A 確定。実装着手時に user 承認のうえ再 open 判断 |
| vercel/next.js #86178 等 / nextauthjs/next-auth #13302 | upstream 修正待ちは不採用。本リポ側で恒久 workaround を実装 |

### 下流ブロック解消

| 下流タスク | 解消条件 |
| --- | --- |
| P11-PRD-003 fetchPublic service-binding 経路書き換え | `pnpm build` / `pnpm build:cloudflare` 緑化により deploy 経路が再開し検証可能になる |
| P11-PRD-004 `/privacy` `/terms` ページ実装 | 同上 |
| `apps/web/wrangler.toml` `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` 追加 | 既に追加済（Phase 1 確認）。本タスクで build 緑化により deploy 反映可能 |
| 09a-A-staging-deploy-smoke-execution | web build 成果物が生成されることで staging deploy が実行可能 |
| 09c-A-production-deploy-execution | 同上、production fail-closed 検証も可能 |

## レビュー結果サマリ

| 項目 | 結果 |
| --- | --- |
| 採用 | Plan A: lazy factory `getAuth()` パターン（auth.ts + oauth-client.ts + 4 routes + 2 test） |
| 不採用 | 旧 (d) RSC 化 / (a) Next bump / (b) React downgrade / (c) serverExternalPackages / (e) next-auth bump / (f) global-error.tsx 削除 / (g) 上流修正待ち / (h) pnpm patch |
| 不変条件 #5 / #14 / #16 | 全 PASS |
| 4 条件評価 | 全 PASS |
| 自己レビュー 8 観点 | 全 緩和策確定 / 許容 |
| 上流 / 下流ブロック | 解消条件確定 |
| **レビュー結論** | **Plan A 採択。Phase 5 実装ランブックへ引き渡し** |

## リスクと代替案

| リスク | 緩和策 / 代替 |
| --- | --- |
| Plan A 適用後も build 失敗 | Phase 2 評価マトリクスに戻り、Plan A 内の cache 戦略 / dynamic import path / type-only import 範囲を再評価。dependency bump や config 変更には踏み込まない（不採用根拠が確定済のため） |
| route handler の await 漏れ | typecheck で検出。Phase 5 実装チェックリストに「すべての route handler で `const { ... } = await getAuth();` 形式を確認」を追加 |
| test mock 形式の不整合 | Phase 4 で mock template を確定。Phase 5 で 2 test ファイルを併行修正し、Phase 9 で test PASS を確認 |
| Cloudflare Workers での dynamic import 互換問題 | Phase 11 で `build:cloudflare` 実測。失敗時は OpenNext 設定 (`apps/web/open-next.config.ts`) を確認するが、現状 1.19.4 で transparent サポート確認済 |
| 将来 next-auth が ESM 構造変更 | dynamic import path 変更要。type import で早期検出。next-auth changelog を refs に追加 |

## 後続 Phase への要請

| Phase | 要請内容 |
| --- | --- |
| Phase 4 (テスト戦略) | (a) `pnpm build` / `pnpm build:cloudflare` / `pnpm typecheck` / `pnpm lint` を AC ↔ evidence 形式で整理 (b) `vi.mock("@/lib/auth")` の lazy factory mock template を確定（`getAuth` を `vi.fn(async () => ({ handlers: ..., auth: ..., signIn: ..., signOut: ... }))` 形式） (c) `useContext` null 文字列の grep 仕様を確定 |
| Phase 5 (実装ランブック) | (a) auth.ts: top-level next-auth import 撤廃 + `getAuth()` lazy factory 追加 + cache メモ化 (b) oauth-client.ts: 関数内 dynamic import 化 (c) 4 route handler: `await getAuth()` 経由化 (d) 2 test ファイル: mock template 適用 (e) `mise exec -- pnpm --filter @ubm-hyogo/web build` / `build:cloudflare` / `typecheck` / `lint` 実行 (f) await 漏れ確認チェックリスト |
| Phase 6 (異常系) | `/_global-error` / `/_not-found` 両経路の prerender 結果、route handler 初回 latency、dynamic import 失敗時の挙動、test mock の境界 |
| Phase 7 (AC マトリクス) | AC-1〜AC-9 を 1 つの表に集約 |
| Phase 8 (DRY) | 6 ファイル改修のうち、route handler 4 件で `await getAuth()` パターンが共通化可能か検討（共通 helper 化は top-level import を再導入する懸念があるため原則不採用） |
| Phase 9 (品質保証) | typecheck / lint / build / test 4 点セットの最終通過確認 |
| Phase 10 (最終レビュー) | diff の最小性（6 ファイル + 2 test）、AC-6（rg による top-level next-auth import 0 hit）、AC-8（package.json diff 0）、approval gate 順守を再確認 |
| Phase 11 (実測 evidence) | build stdout 抜粋、`useContext` null 文字列 grep 結果、`.open-next/worker.js` 生成 ls 出力、`rg -n '^import.*from "next-auth' apps/web/src/lib/auth.ts` の 0 hit 確認 |
| Phase 12 (docs) | Issue #385 のクローズコメント or 再 open 判断、Plan A 採択経緯を user に提示する要約 |
| Phase 13 (PR) | Plan A 採択時の PR 本文 template（lazy factory 採択理由 + 失敗 first-choice 履歴 + AC 達成証跡） |

## 真因の再確認（Phase 1 / Phase 2 との整合）

Phase 1 で再確定した真因「`apps/web/src/lib/auth.ts` の top-level next-auth import が Next 16 + React 19 build 時 prerender で `@auth/core` `next-auth/react` の `React.createContext(undefined)` を発火させ React Dispatcher を破壊し `useContext` null を引き起こす」は、Phase 2 の Plan A（lazy factory `getAuth()` 化 + 4 routes 改修 + oauth-client dynamic import）で構造的に解消方針が確定。本 Phase で 4 条件すべて PASS、不変条件 #5 / #14 / #16 整合、自己レビュー 8 観点すべて緩和策確定を確認したため、レビューゲートを通過とし **Plan A を採択** する。

## 実行タスク

1. 3 系統（システム / 戦略・価値 / 問題解決）でレビューする。完了条件: 各系統で OK / NG 判定が記録される。
2. 4 条件（矛盾なし・漏れなし・整合性・依存関係整合）を評価する。完了条件: 全 4 条件で PASS 判定が固定される。
3. 不変条件 #5 / #14 / #16 との整合を確認する。完了条件: 各不変条件に確認内容が紐付く。
4. Plan A の自己レビュー 8 観点（冗長性 / export 互換 / await 漏れ / test mock / patch 不要 / ESM 解決 / Workers 互換 / 初回 latency）を整理する。完了条件: 全 8 観点に評価と結論が付く。
5. 上流 / 下流のブロック解消条件を確定する。完了条件: 5 タスク（下流）すべてに解消条件が記載される。
6. リスクと代替案、後続 Phase への要請を整理する。完了条件: Phase 4〜13 への要請が表で揃う。

## 参照資料

- Phase 1 / Phase 2（改訂版）の確定事項
- index.md
- apps/web/src/lib/auth.ts / auth/oauth-client.ts
- apps/web/app/api/auth/[...nextauth]/route.ts / callback/email/route.ts / admin/[...path]/route.ts / me/[...path]/route.ts
- apps/web/middleware.ts / next.config.ts / package.json / wrangler.toml
- vercel/next.js issue #86178 / #84994 / #85668 / #87719
- nextauthjs/next-auth issue #13302
- @opennextjs/cloudflare 1.19.4 release notes

## 実行手順

- 対象 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- 本仕様書作成ではコード変更、deploy、commit / push / PR、dependency 更新を行わない
- 実コード変更は **Phase 5 で実施**、commit / push / PR は **user 指示後** に別経路で実施

## 統合テスト連携

- 上流: Phase 1 / Phase 2（改訂版）
- 下流: Phase 4〜13 と P11-PRD-003 / P11-PRD-004 / 09a / 09c

## 多角的チェック観点

- #5 / #14 / #16: 全 OK（本書内で確認）
- 失敗 first-choice (旧 d / a / b / c / e / f / g / h) の不採用根拠を本書でも再確認したか: OK
- 未実装 / 未実測を PASS と扱わない: レビュー PASS は AC-1〜AC-3（build / build:cloudflare / エラー文字列非出現）の実測代替にならない
- pre-existing バグであることを根拠に放置しない: Plan A による恒久 workaround を確定

## サブタスク管理

- [ ] 3 系統レビューを完了した
- [ ] 4 条件評価で全 PASS を確認した
- [ ] 不変条件 #5 / #14 / #16 の整合を確認した
- [ ] Plan A の自己レビュー 8 観点を整理した
- [ ] 上流 / 下流のブロック解消条件を確定した
- [ ] リスクと代替案を整理した
- [ ] 後続 Phase への要請（Phase 4〜13）を整理した
- [ ] outputs/phase-03/main.md を作成した

## 成果物

- outputs/phase-03/main.md（3 系統レビュー / 4 条件評価 / 不変条件整合 / 自己レビュー 8 観点 / ブロック解消 / リスク / 後続要請 / レビューサマリ）

## 完了条件

- 3 系統レビューと 4 条件評価で全 PASS が記録されている
- 不変条件 #5 / #14 / #16 への整合確認が表で残っている
- Plan A の自己レビュー 8 観点（冗長性 / export 互換 / await 漏れ / test mock / patch 不要 / ESM 解決 / Workers 互換 / 初回 latency）すべてに評価と結論が付いている
- 下流 5 タスクすべてに解消条件が紐付いている
- 後続 Phase 4〜13 への要請が一覧化されている
- レビュー結論として Plan A 採択が明記されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 失敗 first-choice の再試行を許容する記述がない
- [ ] 実装、deploy、commit、push、PR、dependency 更新を実行していない
- [ ] secret 値・実行ログ実値を記録していない

## 次 Phase への引き渡し

Phase 4（テスト戦略）へ次を渡す:

- レビュー PASS 済 Plan A: lazy factory `getAuth()` パターン
- 不採用 8 件の根拠（旧 d / a / b / c / e / f / g / h）
- AC-1〜AC-9 と evidence path
- 4 コマンド検証セット（`pnpm build` / `pnpm build:cloudflare` / `pnpm typecheck` / `pnpm lint`）+ test 経路（`route.test.ts` 群）
- mock template 確定要請: `vi.mock("@/lib/auth")` の lazy factory 形式
- 上流 / 下流ブロック解消条件
- リスクと代替案、Phase 4〜13 への要請
- 自己レビュー 8 観点の緩和策（特に await 漏れチェックリスト / test mock template）
