# Phase 4: I/O 契約 / テスト設計

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 4 / 13 |
| 前提 | Phase 3 GO 判定済み（設計レビュー PASS） |
| taskType | implementation |
| implementation_mode | `edit` |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

Phase 2 で確定した多層防御設計（T01〜T04）を、実装がそのまま RED→GREEN で進められる **I/O 契約表・fallback 判定マトリクス・RED 観点（実装前に落ちるべきテスト一覧）** へ落とし込む。シグネチャは SSOT §2「主要シグネチャ」を正とし、ここで入力 × 出力 × 副作用 × throw 条件を 1 行ずつ固定する。

## 実行タスク

### 4.1 `resolveApiTransportChain(env): ApiTransport[]` の I/O 契約（T03）

```ts
// apps/web/src/lib/fetch/transport.ts（SSOT §2 シグネチャ）
export interface ApiTransportChainEnv extends ApiTransportEnv {
  publicBaseUrl?: string | undefined; // NEXT_PUBLIC_API_BASE_URL（staging/production の最終 fallback）
}
export function resolveApiTransportChain(env: ApiTransportChainEnv): ApiTransport[];
```

| 区分 | 契約 |
| --- | --- |
| 入力 | `{ API_SERVICE?, baseUrl?（INTERNAL_API_BASE_URL）, publicBaseUrl?（NEXT_PUBLIC_API_BASE_URL）, environment?, environmentExplicit?, isTest? }`。`baseUrl` / `publicBaseUrl` は空文字を「未設定」と同義に扱い、末尾スラッシュを除去して正規化（既存 `trimTrailingSlash` 再利用） |
| 出力（順序保証） | `[service-binding（API_SERVICE があれば）, http: INTERNAL_API_BASE_URL（あれば）, http: NEXT_PUBLIC_API_BASE_URL（**staging/production のみ**・あれば）]` の順。`environment` が明示 local の場合のみ末尾に `http: LOCAL_API_FALLBACK_BASE_URL` を追加（`localhost-allow:local-fallback` 規約維持） |
| 出力（test 決定性） | `isTest === true` かつ `baseUrl` あり → `[http: baseUrl]` の単一要素（既存 `resolveApiFetch` の isTest 優先順位と整合。テストで fallback が暴発しない） |
| 出力（重複排除） | 正規化後の `baseUrl` と `publicBaseUrl` が同一文字列なら http 候補は 1 本に縮約（同一宛先への無意味な再試行を作らない） |
| 出力（長さ保証） | 戻り値は**長さ >= 1**。1 要素も構成できない場合は戻らず throw |
| throw 条件 | 候補 0 件 かつ（非 local **または** local 非明示）→ `Error`（message は既存 `resolveApiFetch` の `"API transport unresolved"` 系を踏襲）。**fail-closed**: `ENVIRONMENT` 未注入（`environmentExplicit !== true`）では絶対に localhost を返さない（AC-4・T01 の `environmentExplicit` 方式維持） |
| 副作用 | なし（純関数。ログも出さない。fallback warn は `fetchViaApiTransportChain` の責務） |

### 4.2 `fetchViaApiTransportChain(chain, path, init)` の I/O 契約（T03）

```ts
export async function fetchViaApiTransportChain(
  chain: ApiTransport[],
  path: string,
  init?: RequestInit,
): Promise<Response>;
```

| 区分 | 契約 |
| --- | --- |
| 入力 | `chain`（長さ >= 1。4.1 の戻り値）、`path`（先頭スラッシュへ正規化は既存 `fetchViaApiTransport` と同一）、`init`（無加工で各 transport に渡す） |
| 出力 | 最初に **Response を返した** transport の `Response` を**無加工で返す**（status・headers・body に一切介入しない。401/404/410/5xx もそのまま返す = AC-7） |
| throw 条件1 | 全候補が transport 層で throw → **最後の `ApiTransportError` を rethrow**（→ 上位は従来どおり `MEMBER_SESSION_FAILED` に正規化される） |
| throw 条件2 | method が GET/HEAD 以外（POST 等）で transport 層 throw → 次候補を試さず `ApiTransportError` を即伝播（二重適用防止）。method は `init?.method ?? "GET"` の大文字小文字非依存判定 |
| throw 条件3 | `chain.length === 0` は呼び出し契約違反として `Error` を throw（4.1 が長さ >= 1 を保証するため通常到達しない防御） |
| 副作用 | fallback 発生時のみ `console.warn("api_transport_fallback", { from, to, path })` を 1 回/遷移 出力。`from`/`to` は `describeTransport` の `{transportKind, baseHost}`（T01 統合済）。memberId・cookie・secret・init.headers は**出力しない**（AC-5） |
| 内部 helper（export 任意） | `fetchViaApiTransportChainWithMeta(chain, path, init): Promise<{ response: Response; transport: ApiTransport }>` を内部に持ち、公開 `fetchViaApiTransportChain` はその thin wrapper とする。`authed.ts` は meta 版を使い、**実際に応答した transport** の descriptor を `FetchAuthedError` に渡す（fallback 後でも診断値が正確になる。SSOT §2 の「内部 helper・export は任意」方式と同型） |

### 4.3 fallback 判定マトリクス（Phase 2 の 2.3 と 1:1 対応）

| # | 条件 | 挙動 | 検証 TC |
| --- | --- | --- | --- |
| M-1 | transport 層 throw（`ApiTransportError`）かつ method が GET/HEAD かつ 次候補あり | **次候補で再試行** + `api_transport_fallback {from, to, path}` warn | FB-1 / FB-2 / AU-1 |
| M-2 | HTTP エラー Response（401/404/410/5xx） | **fallback しない**。Response をそのまま返す（status 体系・`AuthRequiredError` 挙動不変） | FB-3 / AU-2 / AU-3 / PG-1..4 |
| M-3 | 非冪等 method（POST 等）の transport 層 throw | **fallback しない**（二重適用防止）。`ApiTransportError` を伝播 | FB-4 |
| M-4 | 全候補 throw | 最後の `ApiTransportError` を **rethrow**（→ 既存どおり `MEMBER_SESSION_FAILED`） | FB-5 / AU-4 / PG-5 |

> M-1〜M-4 は Phase 2 §2.3 の 4 行と 1:1。これ以外の fallback 経路は存在しない（`ApiTransportError` **以外**の throw — 例: `path` 形式違反の `Error` — も fallback せず伝播する）。

### 4.4 `getAuthEnv` field-tolerant の契約（T02）

```ts
// apps/web/src/lib/env.ts（公開シグネチャ不変）
export function getAuthEnv(rawEnv?: RawEnv): AuthEnv;
// 新規（内部 helper・export は任意）: field 単位 safeParse + dropped keys 構造化 warn
```

| 区分 | 契約 |
| --- | --- |
| 入力 | `rawEnv`（省略時 `readRawEnv()`。従来と同一） |
| 出力 | `AuthEnv`（**戻り値型・公開シグネチャ不変**）。`AuthEnvSchema` の各 field を**個別に** safeParse し、valid な field のみ採用。`undefined` の field は判定対象外（従来の `.partial()` 意味論を維持） |
| 不正 field の扱い | 不正な field（例: 空文字 `GOOGLE_CLIENT_ID`・16 文字未満 `AUTH_SECRET`・URL 形式でない `AUTH_URL`）は**その field のみ** drop。他の valid field（とくに `INTERNAL_API_BASE_URL`）は**保持する**（F-A 根治・AC-2） |
| 副作用 | dropped keys が 1 件以上の場合のみ `console.warn("auth_env_field_dropped", { keys: string[] })` を 1 回出力。**key 名のみ**を出し、**値・secret は絶対に出力しない**（AC-5）。0 件なら warn なし |
| `API_SERVICE` | 従来どおり `rawEnv["API_SERVICE"]` を schema 外で透過（変更なし） |
| throw 条件 | なし（throw しない。全滅時は `{}` 相当 + 全 key 名の warn） |
| 互換性 | 全 field valid な入力では従来と完全に同一の戻り値（既存テスト・既存 consumer は無変更で green） |

### 4.5 診断スクリプトの I/O 契約（T04）

`scripts/diagnose-profile-session.sh`（read-only・冪等・`bash -n` PASS・AC-6）。

| 区分 | 契約 |
| --- | --- |
| 入力（env 変数） | `PROFILE_SESSION_BASE_URL`（web。既定 `https://ubm-hyogo-web-staging.daishimanju.workers.dev`）/ `PROFILE_SESSION_API_BASE_URL`（API direct。既定 `https://ubm-hyogo-api-staging.daishimanju.workers.dev`）/ `PROFILE_SESSION_COOKIE` または `PROFILE_SESSION_COOKIE_FILE`（排他・任意・user-gated）/ `PROFILE_SESSION_CF_ENV`（既定 `staging`） |
| 出力（stdout・key=value） | `profile_session.web_api_me_status=<3 桁 or 000>`（web `/api/me` proxy probe）/ `profile_session.api_me_status=<3 桁 or 000>`（API direct `/me` probe）/ `profile_session.profile_data_cause=<値 or absent>`（cookie 提供時のみ `/profile` HTML から `data-cause` 抽出）/ `profile_session.cookie_source=<file|env|none>` / `profile_session.deployments_hint=<bash scripts/cf.sh 経由の版数確認コマンド文字列>` / `profile_session.tail_hint=...`（既存維持）/ `profile_session.candidate=<判定>` |
| exit code | `0`: 全 probe 実行完了（probe 先が 4xx/5xx/000 でも診断としては成功）/ `2`: 入力エラー（cookie 二重指定等の usage 違反）。curl 失敗は status `000` に正規化して exit 0（既存の `set +e` パターン維持） |
| 禁止（不変） | secret 実値・cookie 値・token・memberId を出力しない。`wrangler` 直叩きしない（版数確認は `bash scripts/cf.sh` 経由の**手順文字列を出力**するのみで実行しない = read-only 維持）。書込・deploy なし（冪等） |
| 是正点（MINOR-2） | 現行の probe は web ホストの `/me`（route 不在）を叩いており常に route miss 系の status になる誤誘導欠陥。これを web `/api/me`（proxy 実経路）+ API direct `/me` の 2 系統へ是正する |

### 4.6 RED 観点（実装前に落ちるべきテスト一覧）

実装前（T01 統合 直後の状態）に追加した時点で **fail（RED）** し、T02/T03/T04 実装で GREEN になるテスト。テストファイルは SSOT §5 の既存 5 spec への追加のみ。詳細ケース表は Phase 6。

| TC-ID | ファイル | RED の内容 | 対応 AC / S / F |
| --- | --- | --- | --- |
| EV-1 | `env.spec.ts` | 空文字 `GOOGLE_CLIENT_ID` + 正常 `INTERNAL_API_BASE_URL` の入力で `INTERNAL_API_BASE_URL` が**消える**（現行 all-or-nothing） | AC-2 / F-A |
| EV-2 | `env.spec.ts` | `auth_env_field_dropped` warn が**出ない**（現行は黙って全 drop） | AC-2 / AC-5 |
| CH-1〜CH-6 | `transport.spec.ts` | `resolveApiTransportChain` が**存在しない**（import エラー → RED） | AC-3 / AC-4 / F-B |
| FB-1〜FB-5 | `transport.spec.ts` | `fetchViaApiTransportChain` が**存在しない** | AC-3 / M-1〜M-4 |
| AU-1 | `authed.spec.ts` | service-binding fetch throw 時に `INTERNAL_API_BASE_URL` への http fallback で `/me` 取得が**成功しない**（現行は単一 transport で即 throw） | AC-3 / S3 |
| AU-4 | `authed.spec.ts` | 全滅時に `ApiTransportError` が伝播する（fallback 実装後も維持されるべき挙動の固定。chain 化前は単一 throw として既に通る場合は回帰 guard 扱い） | M-4 / S1〜S4 |
| PG-1..5 | `page.spec.tsx` | 回帰 guard（401 redirect / 404 CTA / 410・5xx・FAILED バナー文言不変）。実装前から GREEN であり、**T03 実装後も GREEN のまま**であることを確認する非回帰枠 | AC-7 |
| DG-1 | （vitest 外）`bash -n` + 出力 key 検査 | 現行スクリプトに `web_api_me_status` / `api_me_status` / `profile_data_cause` / `deployments_hint` が**無い** | AC-6 |

> RED 確認の運用: T02/T03 のテストは「先に spec を書き、実装前に 1 度 RED を観測してから実装する」。PG 系（回帰 guard）と AU の既存ケースは最初から GREEN であることが正であり、T03 実装後の GREEN 維持を Phase 9 で一括確認する。

## 完了条件

- [x] `resolveApiTransportChain` の入力 × 出力（順序・test 決定性・重複排除・長さ保証）× 副作用なし × throw 条件（fail-closed）を契約化
- [x] `fetchViaApiTransportChain` の入力 × 出力（Response 無加工）× throw 条件（全滅 rethrow / 非冪等 / 空 chain）× 副作用（fallback warn・PII なし）を契約化
- [x] fallback 判定マトリクス M-1〜M-4 が Phase 2 §2.3 の 4 行と 1:1 対応
- [x] `getAuthEnv` field-tolerant の契約（不正 field のみ drop・key 名のみ warn・値非出力・公開シグネチャ不変・throw なし）を確定
- [x] 診断スクリプトの I/O（env 入力・stdout key=value・exit code・read-only/冪等/非出力）を確定
- [x] RED 観点（EV / CH / FB / AU / PG / DG）を AC・S・F に紐づけて列挙

## 成果物

- `outputs/phase-4/phase-4.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 境界・fail-closed（M-2 の根拠） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` 契約不変（AC-7） |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | session 未解決→401→redirect の正本 |

- `_shared-context.md` §2（主要シグネチャ）・§4（AC-1〜9）・§5（test_files）
- `outputs/phase-2/phase-2.md` §2.3（fallback 判定規則の設計正本）/ `outputs/phase-3/phase-3.md`（GO 判定・MINOR-1/2）
- `apps/web/src/lib/env.ts:131-137`（現行 `getAuthEnv`）/ `apps/web/src/lib/fetch/transport.ts` / `scripts/diagnose-profile-session.sh`（現行 probe）
- `git diff origin/dev...origin/fix/profile-session-staging-localhost-endpoint -- apps/web scripts`（T01 統合対象）

## 統合テスト連携

4.3 の M-1〜M-4 と 4.6 の TC-ID を Phase 5 の task-01..04 の `テスト方針` 表へ展開し、Phase 6 で全ケースを確定、Phase 7 で変更ブロック限定カバレッジ、Phase 9 で focused vitest + `bash -n` + grep ゲートの一括 PASS を確認する。Phase 11 は本契約の chain 復旧を staging 実機（user-gated）で実証し S1〜S4 を確定する。
