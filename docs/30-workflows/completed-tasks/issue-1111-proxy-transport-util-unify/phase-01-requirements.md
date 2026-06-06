# Phase 01 — 要件定義

## 1. タスク分類

| 項目 | 値 |
| --- | --- |
| タスク種別 | refactoring（pure refactor・内部抽出） |
| 視覚区分 | NON_VISUAL（UI/UX 変更なし。transport 選択の内部制御構造を共通化） |
| implementation_mode | `new`（共通 util 新規作成 + 既存 3 呼び出し側の import 切替） |
| 実装区分 | 実装仕様書（CONST_004） |
| docs-only か | いいえ（コード変更を伴う） |

## 2. 真の論点（要件レビュー思考法）

1. **真の論点**: 「binding 優先 → HTTP fallback」という transport 選択イディオムが 3 ファイルに独立複製され、片方だけ直すと transport 非対称（= 親 workflow の 404 と同クラスの不具合）が再発する構造。これを **挙動を 1 ビットも変えずに** 単一の判断点へ集約する。
2. **依存関係・責務境界**: transport 選択（binding vs HTTP）と、その周辺（env 読み取り・test 判定・fallback 戦略・ログ shape・request 構築・cache 制御・auth header）の責務境界。後者は呼び出し側固有差が大きく、無理に共通化すると挙動が変わる。
3. **価値とコストの不均衡**: 価値 = 将来の transport 仕様変更を 1 箇所修正で完結（drift 根絶）。コスト = 抽象化の維持コスト + pure refactor 検証コスト。3 箇所目（public.ts）の出現で Rule of Three が成立し、価値がコストを上回ったと判断（YAGNI 解除）。
4. **改善優先順位**: ①制御構造骨格の共通化（高価値・低リスク）> ②binding/base 解決の共通化（中リスク・差異吸収が必要）。判定述語と fallback 戦略は呼び出し側に残す（最小リスク）。
5. **4 条件評価**: 価値性=transport drift 再発コストを下げる / 実現性=新規 util 1 file + import 切替 3 file で 1 サイクル完了 / 整合性=per-caller 真理値を保存し pure refactor を担保 / 運用性=回帰 spec が緑なら抽出成功を機械判定可能。

## 3. 既存コード命名規則（FB-01 / FB-SDK-07-4 対応）

| 対象 | 既存命名 | 本タスクの新規命名（一貫性担保） |
| --- | --- | --- |
| transport 種別 | `"service-binding"` / `"http-fallback"`（server-fetch・public のログ literal） | `TransportKind = "service-binding" \| "http-fallback"`（既存 literal を型へ昇格） |
| binding 解決 | `getAdminServiceBinding()` / `getServiceBinding()` / `adminServiceBinding()` | `resolveServiceBinding({ binding, disableBinding })`（中立名・呼び出し側で wrap） |
| base 解決 | `resolveApiBase()` / `apiBase()` / `getBaseUrl()` | 各呼び出し側に保持。util へは `resolveBase: () => string \| null` として注入 |
| ログ | `logAdminTransport()` / `logTransport()` | 各呼び出し側に保持。util へは `log?: (kind, path, status) => void` として注入 |
| ファイル名 | `kebab-case.ts`（`server-fetch.ts` / `public.ts`） | `transport-select.ts`（kebab-case 準拠） |

ファイル配置: `apps/web/src/lib/fetch/`（既存 `public.ts` と同階層・admin/public 中立）。

## 4. isTestOrPlaywright 真理値表（症状1 の固定）【最重要】

pure refactor の核心。3 呼び出し側の test 判定述語は**異なる**ため、util へ潰さず呼び出し側に保持する。下表を実装時の不変参照とする。

| 呼び出し側 | env アクセサ | 判定式 | `ENVIRONMENT==="local"` 条件 | `process.env` 直接参照 |
| --- | --- | --- | --- | --- |
| `route.ts` | `getAuthEnv()`（引数 env） | `process.env["NODE_ENV"]==="test" \|\| process.env["PLAYWRIGHT_TEST"]==="1" \|\| env.ENVIRONMENT==="local"` | **あり** | **あり**（既存・新規追加しない） |
| `server-fetch.ts` | `getAdminFetchEnv()` | `env.NODE_ENV==="test" \|\| env.PLAYWRIGHT_TEST==="1"` | なし | なし |
| `public.ts` | `getPublicFetchEnv()` | `env.NODE_ENV==="test" \|\| env.PLAYWRIGHT_TEST==="1"` | なし | なし |

→ 3 者は真理値が一致しないケースがある（例: `ENVIRONMENT==="local"` かつ `NODE_ENV!=="test"` のとき route.ts のみ true）。**この差異を保存することが AC「挙動不変」の必須条件**。util の `resolveServiceBinding` は判定結果 boolean (`disableBinding`) のみ受け取り、判定ロジックは移送しない。

## 5. binding 無効化条件の真理値表（症状2 の固定）

| 呼び出し側 | 無効化式 | base var |
| --- | --- | --- |
| `route.ts` | `isTestOrPlaywright(env) && env.INTERNAL_API_BASE_URL` | INTERNAL |
| `server-fetch.ts` | `isTestOrPlaywright() && env.INTERNAL_API_BASE_URL` | INTERNAL |
| `public.ts` | `isTestOrPlaywright() && env.PUBLIC_API_BASE_URL` | PUBLIC |

→ 「形」は共通（test 時に明示 base があれば binding を捨てる）。base var の違いは呼び出し側が `disableBinding` boolean を計算して吸収。

## 6. fallback base 解決の真理値表（症状3 の固定）

| 呼び出し側 | 関数 | 戦略 | null を返すか |
| --- | --- | --- | --- |
| `route.ts` | `apiBase(env)` | `INTERNAL_API_BASE_URL` 末尾 `/` 除去 → 無ければ local dev 限定で `LOCAL_DEV_FALLBACK`（127.0.0.1:8787）→ staging/prod は `null` | **あり（fail-fast）** |
| `server-fetch.ts` | `resolveApiBase()` | `getAdminFetchEnv().INTERNAL_API_BASE_URL ?? getEnv().INTERNAL_API_BASE_URL` を末尾 `/` 除去 | なし（常に string） |
| `public.ts` | `getBaseUrl()` | `getPublicFetchEnv().PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL`（localhost:8787） | なし（常に string） |

→ util の `resolveBase: () => string | null` は呼び出し側固有の戦略を委譲注入。`null` を返すのは route.ts のみで、util はその場合 `{ kind: "base-unavailable" }` を返し route.ts が 500 を返す（現状維持）。

## 7. transport ログ shape の真理値表

| 呼び出し側 | ログ有無 | shape |
| --- | --- | --- |
| `route.ts` | **無し** | —（util の `log` を渡さない＝挙動変更を避ける） |
| `server-fetch.ts` | あり | `{ transport, scope: "admin", path: path.split("?")[0], status }`（`logAdminTransport`） |
| `public.ts` | あり | `{ transport, path: path.split("?")[0], status }`（`logTransport`・scope 無し） |

→ ログ fn は呼び出し側が構成し util へ opt-in 注入。route.ts はログ無しを維持（issue「pure refactor を守るため route.ts 側のログ有無は現状を維持する」に整合）。

## 8. 受け入れ基準（AC）

- [ ] AC-1（YAGNI 解除の確認）: transport 選択イディオムの 3 箇所目が `apps/web/src/lib/fetch/public.ts` に存在することを確認済み。Rule of Three 成立により着手可能（本 spec で確認完了）。
- [ ] AC-2（挙動不変）: 抽出前後で ①binding 優先→HTTP fallback の分岐結果 ②fallback base 解決 ③test/playwright 時の binding 無効化条件 ④各 transport ログ出力が変わらない。§4-7 真理値表を不変参照とする。
- [ ] AC-3（回帰緑）: 既存 `route.spec.ts` / `server-fetch.binding.spec.ts` / `server-fetch.http-fallback.spec.ts` / `server-fetch.env.spec.ts` / `public.spec.ts` が全 PASS のまま。
- [ ] AC-4（env アクセサ維持）: 共通 util 内で env 参照は呼び出し側から注入される値のみを扱い、util から `process.env.*` を直接参照しない。route.ts の既存 `process.env` 併用は新規に増やさない。
- [ ] AC-5（焼き込み gate 維持）: `LOCAL_DEV_FALLBACK`（127.0.0.1:8787）の扱いを変えず、util へ 127.0.0.1 系文字列を焼き込まない。`127.0.0.1:8888` を `apps/web/src` 配下へ新規追加しない（task-18 gate）。
- [ ] AC-6（util 単体テスト）: 新規 `transport-select.spec.ts` で `resolveServiceBinding`（disable true/false）/ `selectAndFetch`（binding 経路 / http-fallback 経路 / base-unavailable 経路 / log opt-in 有無）が PASS。

## 9. carry-over 確認（直近コミット棚卸し）

`git log --oneline -5`: issue-1077 / 1070 / 1076 / 1069 / 1068 系（tag・OG・bulk picker）で本タスクの transport 層とは無関係。`transport-select.ts` は dev に存在しない（新規）。`staging-api-url-and-session-recovery` の `transport.ts` は別 worktree 未コミットで dev 未マージ → 本タスクは現行 dev の 3 ファイル複製を正本として進める。
