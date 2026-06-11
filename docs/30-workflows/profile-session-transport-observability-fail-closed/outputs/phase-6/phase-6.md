# Phase 6: テスト拡充

## メタ情報
正本: `outputs/phase-6/phase-6.md` / 上位 SSOT: `../../_shared-context.md`

参照: `../phase-4/phase-4.md`（I/O 契約 D-1〜3 / E-1〜5 / R-1〜8 / ログ出力キー契約 / テスト期待値表 T1-1〜T5-5）/ `../phase-5/phase-5.md` + `task-0N-*.md`（実装手順）/ `../phase-3/phase-3.md`（レビュー指摘 R1-R5）

## 目的
Phase 5 までで固定した I/O 契約に対し、**fail path（失敗系）と回帰 guard（後方互換）** の追加ケースを網羅する。各ケースについて「RED（実装前に失敗する根拠）→ GREEN（実装後に通る条件）」を明示し、TDD のグラウンドトゥルースを揃える。本 Phase は Phase 4 のテスト期待値表（T1-1〜T5-5）を**失敗系・漏洩検査・後方互換の観点で補強**するもので、新規ケースのみを足す（既存 green ケースは回帰 guard として据え置き）。

不変条件: 既存 spec の期待値を変更しない（回帰ゼロ / AC-8）。`127.0.0.1` / `localhost` / `8787` / `8888` をテスト本体コードへ新規リテラルとして書かない（spec 内の `service-binding.local` は localhost リテラルではなく、ログ出力検証用の error メタ値）。`memberId` / `cookie` / `secret` / `token` をログ出力検査の対象語として参照することは許容（含まれ「ない」ことの検証目的）。

---

## 1. fail path / 回帰 guard 追加ケース表

下表は Phase 4 のテスト期待値表に対する**追加ケース**である。列「区分」は fail（失敗系）/ regression（後方互換 guard）/ leak（漏洩検査）を示す。各ケースの RED→GREEN 方針は §2 に対応行を持つ。

### 1.1 fail-closed throw（resolveApiFetch / fetchAuthed 配線）

| ケースID | 対象ファイル | 区分 | 入力 | 期待 |
|----------|--------------|------|------|------|
| P6-1 | transport.spec.ts | fail | `resolveApiFetch({ environment: "local", environmentExplicit: false })`（R-7・binding/baseUrl 無） | `throw`（`/API transport unresolved/`）。step4 を skip して step5 に到達 |
| P6-2 | transport.spec.ts | fail | `resolveApiFetch({ environment: "staging", environmentExplicit: false })`（R-8 系・非 local かつ未明示） | `throw`（`/API transport unresolved/`）。非 local は元から throw する既存挙動を fail-closed 経路でも保証 |
| P6-3 | authed.spec.ts | fail | `getEnvironmentResolution` mock が `{ environment: "local", explicit: false }`・`getAuthEnv` が `INTERNAL_API_BASE_URL:""`・binding 無 | `fetchAuthed("/x")` が `/API transport unresolved/` を throw（fail-closed が authed.ts に配線済み・T3-6 の失敗系強化） |

### 1.2 ApiTransportError（transport 接続失敗 = fetch throw）

| ケースID | 対象ファイル | 区分 | 入力 | 期待 |
|----------|--------------|------|------|------|
| P6-4 | authed.spec.ts | fail | service-binding 経路で fetch が `TypeError`（network error）を throw | `ApiTransportError` を throw・`transportKind==="service-binding"`・`baseHost===new URL(SERVICE_BINDING_ORIGIN).host`・`cause` が元 TypeError（T3-3 の cause 連鎖を明示確認） |
| P6-5 | authed.spec.ts | fail | http baseUrl 経路で fetch が throw | `ApiTransportError`・`transportKind==="http"`・`baseHost===<baseUrl の host>`・`cause` 保持 |
| P6-6 | authed.spec.ts | regression | 既存「network failure は素通しで throw」相当の経路（診断付与後も）で `ApiTransportError instanceof Error` | `ApiTransportError` が `Error` の派生であり、`safe-fetch` の `instanceof Error` 分岐を壊さない |

### 1.3 診断メタ無し error の後方互換（safe-fetch）

| ケースID | 対象ファイル | 区分 | 入力（throw する error） | 期待 `console.error("server_fetch_failed", {...})` |
|----------|--------------|------|---------------------------|----------------------------------------------------|
| P6-7 | safe-fetch.spec.ts | regression | 診断メタ無し・`status:410` のみ（既存「logs structured diagnostics」相当） | `{ code:"MEMBER_SESSION_410", path:"/me", status:410 }`（`transportKind`/`baseHost` キーが**現れない**＝従来形維持・T4-3 強化） |
| P6-8 | safe-fetch.spec.ts | regression | 診断メタ無し・status 抽出不能の汎用 Error | `{ code:"MEMBER_SESSION_FAILED", path:"/me", status:null }`（メタキー非出現・FAILED 正規化が従来どおり） |
| P6-9 | safe-fetch.spec.ts | regression | `logPath` 未指定で診断メタ付き error を throw | `console.error` が**呼ばれない**（既存「does not log diagnostics unless logPath is provided」をメタ付き error でも維持） |

### 1.4 ログ出力キー検査（許可キー / 禁止キー）

| ケースID | 対象ファイル | 区分 | 入力 | 期待 |
|----------|--------------|------|------|------|
| P6-10 | safe-fetch.spec.ts | leak | `Object.assign(new Error("fetchAuthed failed: 410"), { status:410, transportKind:"service-binding", baseHost:"service-binding.local" })`・`{codePrefix:"MEMBER_SESSION", logPath:"/me"}` | 出力オブジェクトの**キー集合が `code,path,status,transportKind,baseHost` に一致**（`Object.keys(call[1]).sort()` で固定）。余計なキーが混入しない |
| P6-11 | safe-fetch.spec.ts | leak | P6-10 の error に `memberId`/`cookie`/`secret`/`token`/`authorization` を仮付与しても | `JSON.stringify(errorSpy.mock.calls)` に上記 5 禁止語のいずれも含まれない（不変条件 #11・AC-3 の漏洩検査・T4-4 強化） |
| P6-12 | safe-fetch.spec.ts | leak | P6-10 と同条件で `bodyText` を持つ error | 出力に `bodyText` キーが**現れない**（secret/memberId を含み得る `bodyText` をログに転記しない契約の保証） |

### 1.5 env 未注入 / typo（getEnvironmentResolution）

| ケースID | 対象ファイル | 区分 | 入力 `rawEnv` | 期待 |
|----------|--------------|------|----------------|------|
| P6-13 | env.spec.ts | fail | `{}`（ENVIRONMENT 未注入・E-4） | `{ environment:"local", explicit:false }`（fail-closed の入力になる） |
| P6-14 | env.spec.ts | fail | `{ ENVIRONMENT:"stagin" }`（typo・E-5） | `{ environment:"local", explicit:false }` |
| P6-15 | env.spec.ts | fail | `{ ENVIRONMENT:"" }` / `{ ENVIRONMENT:123 as unknown }`（空文字・型不一致） | `{ environment:"local", explicit:false }`（enum 厳密一致しないものは全て非明示） |
| P6-16 | env.spec.ts | regression | `{ ENVIRONMENT:"staging" }`（E-1）に対し `getEnvironment(rawEnv)` と `getEnvironmentResolution(rawEnv).environment` を比較 | 両者が**同値**（後方互換 = `getEnvironment` の戻り値と一致） |

---

## 2. 各ケースの RED → GREEN 方針

| ケースID | RED（実装前に失敗する根拠） | GREEN（実装後に通る条件） |
|----------|------------------------------|----------------------------|
| P6-1 | 改修前 `resolveApiFetch` は step4 で `environment==="local"` のみ見て localhost フォールバックを返すため throw しない（テストが `toThrow` で fail） | step4 条件を `environmentExplicit === true` に変更。`false`/`undefined` 時は step4 skip → step5 throw（task-01） |
| P6-2 | 改修前も非 local は step5 throw するが、`environmentExplicit:false` 経路を通った場合の throw を明示確認するケースが無い | 既存 throw 経路が `environmentExplicit:false` でも保持されることを確認（実装変更不要・回帰保証） |
| P6-3 | authed.ts が `getEnvironment`（resolution でない）を使っており explicit を transport に渡さないため fail-closed が配線されず throw しない | authed.ts を `getEnvironmentResolution` 利用に切替え、`explicit` を `environmentExplicit` として `resolveApiFetch` に渡す（task-01） |
| P6-4 | 改修前は fetch throw が素の `TypeError` のまま伝播し `ApiTransportError`/診断メタが付かない | `fetchViaApiTransport` が throw を `ApiTransportError`（`describeTransport` のメタ + `cause`）で包む（task-01） |
| P6-5 | 同上（http 経路でも素の throw） | 同上。`describeTransport({kind:"http",baseUrl})` の `baseHost` がメタに乗る |
| P6-6 | `ApiTransportError` クラスが未定義 | `transport.ts` に `ApiTransportError extends Error` を新規 export（task-01・F3） |
| P6-7 | 改修前のログは `{code,path,status}` のみ。メタ追加実装でキーが**増えてしまわない**ことを後方互換として固定する必要がある | `logServerFetchFailure` がメタを**条件付き spread**で出力。メタ無し error ではキー非出現（task-03・F5） |
| P6-8 | 同上（FAILED 系でもメタキー非出現を保証） | 条件付き spread により status=null でもメタキー非出現 |
| P6-9 | 改修で logPath 判定を壊すとメタ付き error で誤発火し得る | logPath 未指定の早期 return を維持（task-03） |
| P6-10 | 改修前はメタキー自体が存在しない。実装後にキー集合が契約どおりかを固定する必要がある | `transportFromError` が `error.transport` から読み取った `transportKind`/`baseHost` のみを追加。出力キー集合が契約と一致（task-03） |
| P6-11 | 改修でメタ転記時に error 全体を spread すると禁止語が混入し得る | error から**許可キーのみ**を選択読み取り（`transportFromError` が `transport.transportKind`/`transport.baseHost` だけ抽出）。禁止語非出現（task-03） |
| P6-12 | `bodyText` を持つ error をログに渡すと secret 混入し得る | ログ出力は `code/path/status/transportKind/baseHost` のみ。`bodyText` を読み取らない（task-03） |
| P6-13 | `getEnvironmentResolution` が未実装 | `env.ts` に新規 export。未注入は `{local,false}`（task-02・F2） |
| P6-14 | 同上（typo の enum 不一致判定が無い） | enum 厳密一致のみ explicit=true。typo は `{local,false}` |
| P6-15 | 同上（空文字・型不一致） | 同上（厳密一致しない全入力が非明示） |
| P6-16 | `getEnvironment` と新関数の整合が未保証 | `getEnvironmentResolution` は `environment` を `getEnvironment` と同値で返す（後方互換・task-02） |

---

## 3. 既存ケースの回帰 guard（据え置き・変更禁止）

下記は**変更せず**、実装後も同じ期待値で green であることを Phase 9 で確認する（AC-8 回帰ゼロ）。

| ファイル | 据え置きケース |
|----------|----------------|
| transport.spec.ts | "allows localhost fallback only for local"（R-5）/ "uses service binding when present outside test override"（R-1）/ "fails closed for staging without binding or baseUrl"（R-8） |
| transport-select.spec.ts | "selects service binding before HTTP fallback"（T2-1）/ "returns base-unavailable without calling fetch"（T2-2）ほか既存全ケース（当ファイルは `resolveApiFetch` 非対象・重複追加しない・phase-4 §6 T2 注記） |
| authed.spec.ts | "401 で AuthRequiredError"（T3-4）/ "200 で JSON を返し cookie を転送"（T3-5）/ "source から process.env 直参照と localhost fallback を排除する"（リテラル gate） |
| safe-fetch.spec.ts | "logs structured diagnostics when logPath is provided"（既存メタ無し形を P6-7 が継承）/ "does not log diagnostics unless logPath is provided"（P6-9 が継承） |
| env.spec.ts | `getEnv` / `getAuthEnv` / `readRawEnv` 系全ケース（本タスクは `getEnvironment` 不変・追加のみ） |

---

## 統合テスト連携
本 Phase の追加ケース（P6-1〜P6-16）と回帰 guard は、Phase 4 の I/O 契約をテスト資産として実体化したもの。Phase 7 でこれらの実行行が変更ブロックの line/branch カバレッジに到達することを確認し、Phase 9 で focused vitest（T1-T5）として一括実行 + `verify-no-localhost-bake --src-only` + `apps/api` 非接触で締める。実機統合（staging `/me` の真因確定）は Phase 11 の `wrangler tail`（`scripts/cf.sh` 経由）手順で代替する。

## 参照資料
- `../../_shared-context.md`（SSOT §4 変更対象 / §5 シグネチャ / §7 テスト方針）
- `../phase-4/phase-4.md`（I/O 契約・テスト期待値表 T1-1〜T5-5）
- `../phase-3/phase-3.md`（レビュー指摘 R4 ログ漏洩 / R3 後方互換）
- 実テスト: `apps/web/src/lib/fetch/transport.spec.ts` / `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts` / `apps/web/src/lib/fetch/authed.spec.ts` / `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` / `apps/web/src/lib/__tests__/env.spec.ts`

## 成果物
- `outputs/phase-6/phase-6.md`

## 完了条件
- [x] fail-closed throw（P6-1〜P6-3）の追加ケースを RED→GREEN 方針付きで定義した。
- [x] `ApiTransportError`（P6-4〜P6-6）の追加ケースを定義した。
- [x] 診断メタ無し error の後方互換（P6-7〜P6-9）を回帰 guard として定義した。
- [x] ログ出力キー検査 / 漏洩検査（P6-10〜P6-12）を定義した。
- [x] env 未注入 / typo（P6-13〜P6-16）の追加ケースを定義した。
- [x] 据え置く既存回帰ケースを一覧化し、変更禁止と明示した。
