[実装区分: 実装仕様書]

# Phase 6: 異常系検証 — issue-385-web-build-global-error-prerender-fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 6 / 13 |
| wave | issue-385 |
| mode | serial |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Plan A（`getAuth()` lazy factory + 4 route handler / `oauth-client.ts` の dynamic import 化）適用後に想定される異常パターンを網羅し、検出方法・期待挙動・分岐先を仕様化する。lazy factory 特有の失敗モード（dynamic import 失敗・cold start latency・並行呼び出し・部分 import）と、build 中断時の部分成果物・rollback 経路を切り分ける。本 Phase は実測ではなく検証設計のみであり、本 Phase 内で実コード変更・commit / push / PR は行わない（CONST_007 / index.md scope out）。

## 異常系マトリクス

| # | 異常パターン | 検出経路 | 期待挙動 / 分岐 | evidence |
| --- | --- | --- | --- | --- |
| F-1 | Plan A 適用後も `/_global-error` build で `useContext` null 再発 | `pnpm build` log の grep | regression。`auth.ts` / `oauth-client.ts` の top-level import が完全撤廃されているか rg で再検証 → 残存時は撤廃、撤廃済みなら F-3 へ | `outputs/phase-11/build-smoke.md` |
| F-2 | `/_not-found` prerender で同種エラー継続 | `pnpm build` log の grep | F-1 と同根（next-auth 経由）の可能性が高い。同じ rg 確認後、F-3 へ | `outputs/phase-11/build-smoke.md` |
| F-3 | top-level import 撤廃済みでも build 失敗 | build log + rg ダブル確認 | Phase 2 を再オープン。不採用候補 (`serverExternalPackages` + `pnpm patch`) を user 承認後に再評価 | Phase 2 再オープンログ |
| F-4 | `await getAuth()` 内部の `await import("next-auth")` が runtime で失敗 | route handler の 500 応答 / Worker log | エラーを上位に伝播させ 500 を返す。原因は依存解決破壊（lockfile 不整合 / pnpm-lock 破損）の疑い → `pnpm install --force` 再実行後に再現確認 | Phase 11 任意項目 |
| F-5 | cold start で初回 `getAuth()` 呼び出しの latency 増加 | local `next start` または Worker preview の手動計測 | next-auth bundle (推定 ~150KB) の初回 ESM 解決による数十 ms オーダの増加は許容。p95 100ms 超の場合のみ調査対象 | Phase 11 任意項目 |
| F-6 | 並行リクエストで dynamic import が複数回評価される | route handler の log / 計測 | ESM native module cache により 2 回目以降は同一 module instance を返すため通常は単一評価。万一複数評価が観測されれば cache モジュール変数（`let cached: Promise<...> \| null`）で memoize | Phase 11 任意項目 |
| F-7 | `getAuth()` の戻り値から `signIn` のみ destructure しても `auth` / `handlers` を含む全 module load が走る副作用 | bundle / log 観察 | next-auth 5.x は単一 module export のため部分 load 不可。これは ESM 仕様準拠の正常挙動と判定し抑止対象としない | 設計記録のみ |
| F-8 | typecheck / lint が新たに fail（`getAuth` 戻り値型の推論失敗等） | Phase 5 / Phase 11 | 戻り値型を `ReturnType<typeof NextAuth>` ではなく明示 `interface` で固定し再試行。再発時は Step を rollback | `outputs/phase-09/main.md` |
| F-9 | 既存 vitest（`me/[...path]/route.test.ts` / `auth/callback/email/route.test.ts`）が mock 切替後も fail | `pnpm test` exit code | mock 切替方針 (Phase 4 L5) の `vi.mocked(getAuth).mockResolvedValue(...)` が `Awaited<ReturnType<typeof getAuth>>` 型と整合するか再確認 | `outputs/phase-11/build-smoke.md`（test サマリ） |
| F-10 | `pnpm build` 中断で `apps/web/.next` / `.open-next` に部分成果物が残る | build 異常終了後の `ls` | clean 実行 (`rm -rf apps/web/.next apps/web/.open-next`) で再 build。部分成果物を deploy しない | Phase 11 |
| F-11 | source guard rg が type-only import を誤検知 | guard コマンド | rg を `^import\s+(?!type)` の否定先読みで type-only を除外。誤検知時は guard 設計 (Phase 4 L3) を再調整 | guard 設計 (Phase 4 L3) |
| F-12 | deploy 後 service-binding 経路で 500 | staging deploy 後 smoke (09a) | 本 issue 責務外。`PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` 不在の可能性 → P11-PRD-003 / wrangler 追記タスクへエスカレート | 09a evidence |

## F-1 / F-2: build 失敗継続時の判定

### 切り分け手順

```bash
# build log を再確認
grep -nE "(_global-error|_not-found)" /tmp/issue-385-build.log
grep -n "Cannot read properties of null" /tmp/issue-385-build.log

# auth.ts の top-level value import 残存確認
rg -n '^import\s+(?!type)' apps/web/src/lib/auth.ts | rg 'from ["'\'']next-auth'

# oauth-client.ts も同様
rg -n '^import\s+(?!type).*from ["'\'']next-auth/react' apps/web/src/lib/auth/oauth-client.ts

# 4 route handler が lazy 経路へ切り替わっているか
rg -n 'await getAuth\(\)' apps/web/app/api/auth/\[...nextauth\]/route.ts \
  apps/web/app/api/auth/callback/email/route.ts \
  apps/web/app/api/admin/\[...path\]/route.ts \
  apps/web/app/api/me/\[...path\]/route.ts
```

### 判定

| 状態 | 分岐 |
| --- | --- |
| `auth.ts` に top-level next-auth value import 残存 | Step を再適用、`getAuth` 内へ移送 |
| `oauth-client.ts` に top-level `next-auth/react` value import 残存 | dynamic import 化を再適用 |
| 4 route のいずれかが直接 import 経路のまま | 該当 route を `await getAuth()` 経由に修正 |
| 上記すべて clear かつ再発 | F-3 へ |

## F-3: top-level 撤廃済みでも build 失敗

### 対応手順

1. build log の `useContext` null hit 行を ±20 行コンテキストで抽出
2. 隣接スタックトレースから next-auth 以外の経路（`@auth/core` 派生・middleware 等）が原因か判定
3. middleware.ts / next.config.ts 経由で next-auth の transitive load が発生していないかを `rg -n 'next-auth\|@auth/core' apps/web/middleware.ts apps/web/next.config.ts` で確認
4. Phase 2 再オープンを user 承認後に提案し、不採用候補（`serverExternalPackages: ["next-auth", "@auth/core"]` + `pnpm patch` での `.js` 拡張子追加）の再評価へ移行

### 自走禁止

- `next.config.ts` の `serverExternalPackages` / `experimental.*` 追加は user 承認なしに実施しない
- `pnpm patch` 適用も同様

## F-4: `await import("next-auth")` runtime 失敗

### 検出

```bash
# Worker log / route 500 応答を確認
curl -i http://localhost:8787/api/me/profile
# 期待: 200 / 401。500 + ERR_MODULE_NOT_FOUND が出れば F-4 確定
```

### 想定原因と対応

| 原因 | 対応 |
| --- | --- |
| pnpm-lock.yaml の不整合 | `mise exec -- pnpm install --force` で lockfile 再解決 |
| OpenNext bundling で next-auth が外部化されている | `apps/web/.open-next/worker.js` 内に next-auth が同梱されているかを `grep -c 'next-auth' apps/web/.open-next/worker.js` で確認、不在なら OpenNext config を別タスクで調整 |
| dynamic import path tactical typo | `auth.ts` 内の `await import("next-auth")` 文字列を再確認 |

### rollback

```bash
# auth.ts / 4 route / oauth-client.ts を直前 commit に戻す
git checkout -- apps/web/src/lib/auth.ts \
                apps/web/src/lib/auth/oauth-client.ts \
                apps/web/app/api/auth/\[...nextauth\]/route.ts \
                apps/web/app/api/auth/callback/email/route.ts \
                apps/web/app/api/admin/\[...path\]/route.ts \
                apps/web/app/api/me/\[...path\]/route.ts
```

## F-5: cold start latency

### 計測軸

- 初回 `getAuth()`: `await import("next-auth")` で next-auth bundle の ESM 解決が走る（推定 +数十 ms）
- 2 回目以降: ESM native module cache hit のため追加コストはほぼゼロ

### 許容判定

| p95 増加 | 判定 |
| --- | --- |
| ~50ms 以下 | 許容（cold start のみの一時コスト） |
| 50-100ms | 許容範囲だが Phase 12 で記録 |
| 100ms 超 | Phase 11 任意項目で実測 → 超過時は Phase 2 再オープン |

### evidence

- 必須ではない。Phase 11 任意項目として `time curl` ベースの粗計測で十分

## F-6: 並行リクエストでの dynamic import cache

### 期待挙動

- ESM 仕様により `import("next-auth")` は同一 specifier に対して **single module instance** を返す（promise が cache される）
- `getAuth()` を毎回呼んでも `import` の解決済 Promise が共有されるため、追加の bundle parse は発生しない

### 念のための memoize（任意）

```ts
let cached: ReturnType<typeof buildAuth> | null = null;
async function buildAuth(env: AuthEnv) {
  const { default: NextAuth } = await import("next-auth");
  // ...
}
export async function getAuth(env?: AuthEnv) {
  if (!cached) cached = buildAuth(env ?? readEnv());
  return cached;
}
```

- 上記は副作用ゼロかつ Plan A の趣旨と整合
- 計測で複数評価が観測された場合のみ採用、初版では不要

## F-7: 部分 destructure でも全 module load

### 設計判定

- next-auth 5.x は `default export = NextAuth(config) -> { handlers, auth, signIn, signOut }` の単一 factory 構造
- `const { signIn } = await getAuth();` のように一部のみ destructure しても、`getAuth` 内で `await import("next-auth")` 全体が解決される
- これは ESM tree-shaking が runtime ではなく build 時にのみ効く性質に基づく **正常挙動**であり、抑止対象としない
- 副作用は next-auth bundle の load コストのみで、Plan A の真因解消（build prerender 経路から完全隔離）の目的は達成される

## F-8: typecheck / lint 失敗

### 想定原因と修正

| 原因 | 修正 |
| --- | --- |
| `getAuth` の戻り値型が `Awaited<ReturnType<typeof NextAuth>>` 推論で any 化 | 明示 `interface AuthFactory { handlers: { GET, POST }; auth: ...; signIn: ...; signOut: ... }` を定義し戻り値型を固定 |
| 4 route handler 側で `auth` / `handlers` の型推論が崩れる | route で `const { auth } = await getAuth();` の destructure 型を確認、必要なら as 互換キャスト |
| lint: `no-explicit-any` / `consistent-type-imports` | type-only import 化（`import type { Session } from "next-auth"` 等） |

## F-9: 既存 vitest 失敗

### 切り分け

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  app/api/me/[...path]/route.test.ts \
  app/api/auth/callback/email/route.test.ts 2>&1 | tail -30
```

### 修正方針

- mock の戻り値型が `Awaited<ReturnType<typeof getAuth>>` と一致するか再確認
- `vi.mocked(getAuth).mockResolvedValue({...} as unknown as Awaited<ReturnType<typeof getAuth>>)` の形式へ統一
- 既存 assertion (`expect(auth).toHaveBeenCalled()` 等) は mock 戻り値の `auth` 関数 mock に対して動くため変更不要

## F-10: build 中断時の部分成果物

### 対応

```bash
# 部分成果物を完全削除して再実行
rm -rf apps/web/.next apps/web/.open-next
mise exec -- pnpm --filter @ubm-hyogo/web build
```

- 部分成果物 (`apps/web/.next/server/...` の不完全状態) は deploy 不可、ローカル検証でも信頼しない
- `apps/web/.open-next/worker.js` 不在なら build:cloudflare 未完了と判定

## F-11: source guard 誤検知

### guard 設計の堅牢化

```bash
# type-only import を除外、value import のみを hit
rg -n '^import\s+(?!type)' apps/web/src/lib/auth.ts | rg 'from ["'\'']next-auth'
```

- 単に `next-auth` を grep すると `import type` も hit するため、`^import\s+(?!type)` の否定先読みで除外
- 別タスクで CI 統合する際もこの形式を踏襲

## F-12: deploy 後 service-binding 起因 500（本 issue 責務外）

### 境界宣言

- 本 issue の AC は `pnpm build` / `pnpm build:cloudflare` 緑化 + 既存テスト PASS まで
- deploy 後 runtime で `/api/public/*` 経路が 500 になる場合、原因は別タスク (P11-PRD-003 fetchPublic / wrangler 追記) の可能性が高い
- 本 issue では 500 を観測しても fix しない。Issue を分離し別タスクへエスカレートする

### evidence

- 09a / 09c の smoke evidence で確認
- 本 Phase 6 では切り分け基準のみ記録

## rollback 手順

### git revert 対象 commit 範囲

本 issue の実装 commit は次の単位を想定（Phase 5 runbook で確定）:

1. `apps/web/src/lib/auth.ts` の lazy factory 化
2. `apps/web/src/lib/auth/oauth-client.ts` の dynamic import 化
3. 4 route handler の `await getAuth()` 経由化
4. 既存 vitest 2 ファイルの mock 切替

これらが単一 commit にまとめられている場合:

```bash
git revert <commit-sha>
mise exec -- pnpm install --force
mise exec -- pnpm --filter @ubm-hyogo/web build  # revert 後の build 確認
```

複数 commit に分割されている場合は、4 route → oauth-client → auth.ts の逆順で revert する（依存方向と逆）。

### 不要 rollback 判定基準

次のすべてが満たされる場合は rollback 不要:

| 条件 | 確認方法 |
| --- | --- |
| build / build:cloudflare exit 0 | Phase 11 build-smoke / build-cloudflare-smoke |
| `useContext` null 文字列が build log に 0 hit | Phase 11 grep |
| typecheck / lint exit 0 | Phase 9 evidence |
| 既存 vitest 2 ファイル PASS | Phase 11 test サマリ |
| `package.json` diff なし | `git diff main -- apps/web/package.json` 空 |

逆に、上記いずれか 1 つでも fail した場合は F-1〜F-9 の該当異常系へ分岐し、必要に応じて rollback を判断する。

## build 成功 ≠ runtime 成功の分離原則

| layer | 責務 | 本 issue |
| --- | --- | --- |
| build (`pnpm build` / `build:cloudflare`) | artifact 生成 | 本 issue の AC-1 / AC-2 / AC-3 |
| 既存 vitest | route handler の振る舞い等価性 | 本 issue の AC-9 |
| Worker runtime (`bash scripts/cf.sh deploy` 後) | env binding / fetch / D1 等の runtime 動作 | 別タスク (09a / 09c / P11-PRD-003) |

本 issue で build artifact 生成 + 既存テスト PASS を緑化しても、runtime 側で `PUBLIC_API_BASE_URL` 等が未設定なら 500 は発生しうる。これは本 issue の bug ではない。

## 異常系における不変条件遵守

- 不変条件 #5: 異常系切り分けで `apps/api` / D1 への変更を提案しない
- 不変条件 #14: rollback / fallback で新規 binding を増やさない
- 不変条件 #16: build / install / Worker log の secret 文字列を evidence に転記しない

## 実行タスク

1. 異常系マトリクス F-1〜F-12 を確定する。完了条件: 各異常系に検出経路・分岐・evidence が紐付く。
2. F-1 / F-2 の切り分け手順（top-level import 残存確認）を確定する。完了条件: rg コマンドと判定表が揃う。
3. F-3 fallback 失敗時の Phase 2 再オープン条件を明記する。完了条件: 不採用候補の再評価が user 承認 gate 付きで列挙される。
4. F-4〜F-7 の lazy factory 特有失敗モード（dynamic import 失敗 / cold start / 並行 / 部分 load）を仕様化する。完了条件: 各々に許容基準と任意 memoize 方針が明示される。
5. F-12 service-binding 起因 500 が本 issue 責務外であることを宣言する。完了条件: 境界線がエスカレート先と共に明記される。
6. rollback 手順と不要 rollback 判定基準を確定する。完了条件: revert 順序と 5 条件の判定表が揃う。

## 参照資料

- Phase 1-5 の確定事項
- `apps/web/src/lib/auth.ts` / `apps/web/src/lib/auth/oauth-client.ts`
- `apps/web/app/api/auth/[...nextauth]/route.ts` / `apps/web/app/api/auth/callback/email/route.ts`
- `apps/web/app/api/admin/[...path]/route.ts` / `apps/web/app/api/me/[...path]/route.ts`
- `apps/web/app/api/me/[...path]/route.test.ts` / `apps/web/app/api/auth/callback/email/route.test.ts`
- `apps/web/middleware.ts` / `apps/web/next.config.ts` / `apps/web/package.json`
- Next.js 16 / next-auth 5.x docs / ESM module cache 仕様
- 09a-A-staging-deploy-smoke-execution / 09c-A-production-deploy-execution 仕様書

## 実行手順

- 対象 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- 本仕様書作成ではコード変更、deploy、commit / push / PR、dependency 更新を行わない
- 異常系再現は build smoke / 既存 vitest / 任意 runtime smoke に閉じる
- production への意図的な未修正 deploy は禁止

## 統合テスト連携

- 上流: Phase 4（テスト戦略）/ Phase 5（実装ランブック）
- 下流: Phase 7（AC マトリクス）/ Phase 11（実測）/ 09a / 09c（runtime smoke）
- エスカレート先: P11-PRD-003 / P11-PRD-004 / wrangler 追記タスク

## 多角的チェック観点

- 不変条件 #5 / #14 / #16: 異常系記述の各所で遵守
- 未実装 / 未実測を PASS と扱わない: F-1〜F-3 の設計のみで AC-1 (build smoke) を満たしたとみなさない
- lazy factory の ESM 仕様準拠の正常挙動 (F-7) を異常と誤判定しない
- pre-existing バグを根拠に放置しない: F-3 で Phase 2 再オープン経路を確保
- rollback 判定の単一基準化: 5 条件で全 PASS を rollback 不要の必要十分条件とする

## サブタスク管理

- [ ] refs を確認した
- [ ] 異常系マトリクス F-1〜F-12 を確定した
- [ ] F-1 / F-2 の切り分け手順を確定した
- [ ] F-3 fallback 失敗時の再オープン条件を明記した
- [ ] F-4〜F-7 lazy factory 特有モードを仕様化した
- [ ] F-12 service-binding 責務外宣言を明記した
- [ ] rollback 手順 + 不要 rollback 判定基準を明記した
- [ ] build 成功 ≠ runtime 成功の分離原則を記述した
- [ ] approval gate を明記した
- [ ] outputs/phase-06/main.md を作成した

## 成果物

- `outputs/phase-06/main.md`（異常系マトリクス F-1〜F-12 / lazy factory 特有モード / 切り分け手順 / fallback 対応 / rollback 手順 / 責務境界 / 分離原則）

## 完了条件

- F-1〜F-12 すべてに検出経路・分岐・evidence が紐付いている
- lazy factory 特有失敗モード (F-4〜F-7) の許容基準が明記されている
- fallback 失敗時の Phase 2 再オープン条件 (F-3) が明記されている
- 「build 成功 ≠ runtime 成功」の分離原則が表で確定している
- 本 issue の責務外 (F-12) がエスカレート先と共に宣言されている
- rollback 手順と不要 rollback 判定基準が確定している

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR、dependency 更新を実行していない
- [ ] secret 値・実行ログ実値を記録していない

## 次 Phase への引き渡し

Phase 7（AC マトリクス）へ次を渡す:

- 異常系マトリクス F-1〜F-12 と evidence path
- F-3 fallback 失敗時の Phase 2 再オープン条件
- lazy factory 特有失敗モード (F-4〜F-7) の許容基準
- F-12 service-binding 起因 500 が本 issue 責務外であること
- build 成功 ≠ runtime 成功の分離原則
- rollback 手順 + 不要 rollback 判定基準（5 条件）
- approval gate（serverExternalPackages / pnpm patch / experimental flag / deploy）
