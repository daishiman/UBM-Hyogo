# task-03: transport 多段フォールバック chain（F-B 根治）

`[実装区分: 実装仕様書]`

> 判定根拠: CONST_004 に従う。本タスクは `apps/web/src/lib/fetch/transport.ts`（編集: chain 追加）と `authed.ts`（編集: 内部 chain 化）+ テスト 3 ファイル（編集）を変更し、単一 transport 依存（F-B）による「片系不調で全断」を多段フォールバックで根治するコード変更を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ワークフロー | `profile-session-staging-transport-recovery` |
| 親 Phase | Phase 5（実装） |
| タスク ID | T03 |
| ブランチ | `fix/profile-session-staging-transport-recovery` |
| visualEvidence | NON_VISUAL（spec + 構造化 warn で判定。復旧の VISUAL 証跡は Phase 11 user-gated） |
| 想定 PR base | `dev` |
| 並列性 | **T01 完了後**。T02 と並列可（対象ファイル排他） |
| 紐づく AC / F / S | AC-3（binding throw → http fallback 成功・HTTP エラー非介入）/ AC-4（非 local で localhost 不落）/ AC-5（fallback warn・PII なし）/ AC-7（status 体系不変）/ F-B（根治対象）/ S1・S3・S4（復旧対象） |

## 背景

staging には service-binding（`API_SERVICE`）と URL（`INTERNAL_API_BASE_URL`）の **2 経路が設定済み**（F-5）なのに、現行 `fetchAuthed` は `resolveApiFetch` が選んだ **1 本**しか試さず、transport 層の throw（S1/S3/S4）で即 `MEMBER_SESSION_FAILED` 全断になる（F-B）。T01 統合後は throw が `ApiTransportError{transportKind,baseHost}` として観測可能になっており、この型を fallback 判定のキーに使える。chain 化により S1（解決不能）・S3（binding throw）・S4（http throw）のいずれでも、残りの健全な経路で `/me` 取得を復旧する（劣化運転）。

## 目的

`resolveApiTransportChain`（候補列の構成）と `fetchViaApiTransportChain`（`ApiTransportError` 時のみ・GET/HEAD のみ次候補へ fallback）を transport.ts に追加し、`authed.ts` の内部を chain 化する（`fetchAuthed<T>` の公開契約は不変）。fallback 発生時は `api_transport_fallback {from, to, path}` を構造化 warn する。HTTP エラー Response（401/404/410/5xx）には一切介入しない（Phase 4 マトリクス M-1〜M-4）。

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/lib/fetch/transport.ts` | 編集 | `ApiTransportChainEnv` 型 / `resolveApiTransportChain` / `fetchViaApiTransportChain`（+ 内部 meta 版 helper）を追加。既存 `resolveApiFetch` / `fetchViaApiTransport` は無変更（Phase 8 で重複整理） |
| `apps/web/src/lib/fetch/authed.ts` | 編集 | `resolveApiFetch` + `fetchViaApiTransport` の単発呼び出しを chain 化へ内部置換。`getPublicEnvSafe` で `NEXT_PUBLIC_API_BASE_URL` を chain へ供給。公開契約（`fetchAuthed<T>(path, init?)`）不変 |
| `apps/web/src/lib/fetch/transport.spec.ts` | 編集 | chain 構成（CH-1〜CH-6）・fallback 判定（FB-1〜FB-5）ケース追加 |
| `apps/web/src/lib/fetch/authed.spec.ts` | 編集 | fallback 成功 / 不実施 / 全滅伝播ケース（AU-1〜AU-4）追加 |
| `apps/web/app/(member)/profile/page.spec.tsx` | 編集 | 回帰確認のみ（PG-1〜PG-5: 分岐・文言不変。UI 実装は非接触） |

それ以外は無編集。`gate-state` / `magic-link` / `api/me proxy` / `verify-magic-link` の各 caller は単発 `resolveApiFetch` のまま（chain 化は `/me` server fetch 経路 = authed.ts のみ。横展開は投機実装しない）。

## 2. 主要な関数・型のシグネチャまたは構造（CONST_005 必須・SSOT §2 を正とする）

```ts
// apps/web/src/lib/fetch/transport.ts
export interface ApiTransportChainEnv extends ApiTransportEnv {
  publicBaseUrl?: string | undefined; // NEXT_PUBLIC_API_BASE_URL（staging/production の最終 fallback）
}
export function resolveApiTransportChain(env: ApiTransportChainEnv): ApiTransport[]; // 長さ>=1 or throw（非local・候補0）
export async function fetchViaApiTransportChain(
  chain: ApiTransport[],
  path: string,
  init?: RequestInit,
): Promise<Response>; // ApiTransportError 時のみ次候補（GET/HEAD のみ）。最後も throw なら ApiTransportError を rethrow

// 内部 helper（export 任意・authed.ts が使用）: 実際に応答した transport を返す
async function fetchViaApiTransportChainWithMeta(
  chain: ApiTransport[],
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; transport: ApiTransport }>;

// apps/web/src/lib/fetch/authed.ts
export const fetchAuthed: <T>(path: string, init?: RequestInit) => Promise<T>; // 公開契約不変・内部を chain 化
```

### Before（authed.ts・T01 統合後の単発 transport）

```ts
const env = getAuthEnv();
const environment = getEnvironmentResolution();
const transport = resolveApiFetch({
  API_SERVICE: env.API_SERVICE,
  baseUrl: env.INTERNAL_API_BASE_URL,
  environment: environment.environment,
  environmentExplicit: environment.explicit,
  isTest: getTransportRuntimeIsTest(),
});
const transportDescriptor = describeTransport(transport);
// ...
const res = await fetchViaApiTransport(transport, path, { ...init, headers, cache: "no-store" });
```

### After（authed.ts・chain 化）

```ts
const env = getAuthEnv();
const environment = getEnvironmentResolution();
const chain = resolveApiTransportChain({
  API_SERVICE: env.API_SERVICE,
  baseUrl: env.INTERNAL_API_BASE_URL,
  publicBaseUrl: getPublicEnvSafe()?.NEXT_PUBLIC_API_BASE_URL, // safeParse・throw しない（Phase 2 §2.4）
  environment: environment.environment,
  environmentExplicit: environment.explicit,
  isTest: getTransportRuntimeIsTest(),
});
// ...
const { response: res, transport } = await fetchViaApiTransportChainWithMeta(chain, path, {
  ...init,
  headers,
  cache: "no-store",
});
const transportDescriptor = describeTransport(transport); // 実際に応答した transport の診断値
```

### transport.ts 追加分の実装構造（Phase 4 §4.1/§4.2 の契約に 1:1）

```ts
export function resolveApiTransportChain(env: ApiTransportChainEnv): ApiTransport[] {
  const baseUrl = normalize(env.baseUrl);          // trimTrailingSlash + 空文字→undefined
  const publicBaseUrl = normalize(env.publicBaseUrl);
  if (env.isTest === true && baseUrl !== undefined) return [{ kind: "http", baseUrl }]; // test 決定性
  const chain: ApiTransport[] = [];
  if (env.API_SERVICE !== undefined) chain.push({ kind: "service-binding", fetch: env.API_SERVICE.fetch });
  if (baseUrl !== undefined) chain.push({ kind: "http", baseUrl });
  const environment = env.environment ?? "local";
  if (
    publicBaseUrl !== undefined &&
    publicBaseUrl !== baseUrl && // 重複排除
    (environment === "staging" || environment === "production")
  ) {
    chain.push({ kind: "http", baseUrl: publicBaseUrl });
  }
  if (environment === "local" && env.environmentExplicit === true) {
    // localhost-allow:local-fallback
    chain.push({ kind: "http", baseUrl: LOCAL_API_FALLBACK_BASE_URL });
  }
  if (chain.length === 0) {
    throw new Error(
      "resolveApiTransportChain: API transport unresolved (no API_SERVICE binding and no base URL) in non-local runtime",
    );
  }
  return chain;
}

const FALLBACK_SAFE_METHODS = new Set(["GET", "HEAD"]);

async function fetchViaApiTransportChainWithMeta(chain, path, init) {
  if (chain.length === 0) throw new Error("fetchViaApiTransportChain: empty chain"); // 防御
  const method = (init?.method ?? "GET").toUpperCase();
  let lastError: ApiTransportError | undefined;
  for (let i = 0; i < chain.length; i += 1) {
    const transport = chain[i];
    try {
      return { response: await fetchViaApiTransport(transport, path, init), transport };
    } catch (error) {
      if (!(error instanceof ApiTransportError)) throw error;        // M-1 範囲外は即伝播
      if (!FALLBACK_SAFE_METHODS.has(method)) throw error;           // M-3 非冪等は fallback しない
      lastError = error;
      const next = chain[i + 1];
      if (next === undefined) break;                                  // M-4 全滅
      console.warn("api_transport_fallback", {                        // M-1 検知（PII なし）
        from: describeTransport(transport),
        to: describeTransport(next),
        path,
      });
    }
  }
  throw lastError ?? new Error("fetchViaApiTransportChain: unreachable");
}

export async function fetchViaApiTransportChain(chain, path, init) {
  return (await fetchViaApiTransportChainWithMeta(chain, path, init)).response;
}
```

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 区分 | 内容 |
| --- | --- |
| 入力 | Phase 4 §4.1（chain 構成）・§4.2（chain 実行）の契約表のとおり |
| 出力 | HTTP Response は**無加工**（401→`AuthRequiredError`・非 2xx→`FetchAuthedError`・2xx→JSON という `fetchAuthed` の既存変換は chain の**後段**で従来どおり 1 回だけ行う = M-2 / AC-7） |
| 副作用 | fallback 遷移ごとに `console.warn("api_transport_fallback", { from, to, path })` 1 回。`from`/`to` は `{transportKind, baseHost}` のみ。**memberId・cookie・secret・headers は出力しない**（AC-5） |
| throw | 全滅時は最後の `ApiTransportError` を rethrow（→ `safeServerFetch` で従来どおり `MEMBER_SESSION_FAILED`。S1〜S4 確定用の transport 診断値付き）。非冪等 method の transport throw は即伝播。chain 構成不能（非 local・候補 0）は `Error` throw（fail-closed・AC-4） |
| cookie 信頼境界 | fallback 先は従来の http transport（`INTERNAL_API_BASE_URL`）と同一信頼境界の自 API ホスト（staging→staging / production→production）のみ。送信先は拡大しない（SSOT §2 不変点） |

## 4. テスト方針（CONST_005 必須）

Phase 4 §4.6 RED 観点 / Phase 6 のケース表を正とする。要点:

### `transport.spec.ts`（CH: chain 構成 / FB: fallback 判定）

| TC-ID | 入力 | 期待 |
| --- | --- | --- |
| CH-1 | binding + baseUrl + publicBaseUrl（staging） | `[service-binding, http(internal), http(public)]` の 3 要素・この順序 |
| CH-2 | publicBaseUrl のみ（staging） | `[http(public)]`（最後の砦が機能） |
| CH-3 | 候補 0・`environment: "staging"` | throw（fail-closed） |
| CH-4 | 候補 0・`environment: "local"`・`environmentExplicit: true` | `[http(localhost:8787)]`（明示 local のみ・AC-4） |
| CH-5 | 候補 0・environment 未指定（`environmentExplicit` なし） | throw（**非明示は localhost に落ちない**・AC-4） |
| CH-6 | `isTest: true` + baseUrl / baseUrl === publicBaseUrl | 単一 `[http(baseUrl)]` / 重複排除で 2 要素にならない |
| FB-1 | GET・binding fetch reject → 次候補 http 200 | Response 200 が返り、`console.warn("api_transport_fallback", {from: service-binding, to: http, path})` が 1 回（M-1） |
| FB-2 | GET・binding reject → internal reject → public 200 | 2 段 fallback 成功・warn 2 回（M-1 連鎖） |
| FB-3 | binding が **Response 503** を返す | fallback **せず** 503 Response をそのまま返す・warn なし（M-2・AC-3/AC-7） |
| FB-4 | **POST**・binding fetch reject・次候補あり | fallback せず `ApiTransportError` 伝播・warn なし（M-3） |
| FB-5 | GET・全候補 reject | 最後の `ApiTransportError` rethrow（transport 診断値が最後の候補のもの）（M-4） |

### `authed.spec.ts`（AU: fetchAuthed 統合）

| TC-ID | 入力 | 期待 |
| --- | --- | --- |
| AU-1 | env に binding + `INTERNAL_API_BASE_URL`、binding fetch throw、http が `/me` 200 JSON | `fetchAuthed("/me")` が JSON を返す（**S3 復旧の正本・AC-3**）。warn に cookie/memberId 非含有（AC-5） |
| AU-2 | http transport が 401 Response | `AuthRequiredError` throw（fallback なし・回帰）（M-2） |
| AU-3 | http transport が 503 Response | `FetchAuthedError(503)` throw・`transport` descriptor が**応答した transport** のもの | 
| AU-4 | 全候補 throw | `ApiTransportError` 伝播（→ 上位で `MEMBER_SESSION_FAILED`）（M-4） |

### `page.spec.tsx`（PG: 回帰のみ・UI 非接触の確認）

| TC-ID | 確認 |
| --- | --- |
| PG-1〜PG-5 | 401→redirect / 404→再ログイン CTA / 410・5xx・FAILED の `data-cause` バナー文言が**従来と同一**（既存ケースの green 維持 + transport throw → `MEMBER_SESSION_FAILED` 文言の固定）（AC-7） |

## 5. ローカル実行・検証コマンド（CONST_005 必須）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint

cd apps/web
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  'apps/web/app/(member)/profile/page.spec.tsx'
# 観測性側の非回帰（T01 取込分）
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts'
cd ../..

# localhost 焼き込み grep（LOCAL_API_FALLBACK_BASE_URL 定数 + localhost-allow コメント以外の増加が無いこと）
grep -rn "127.0.0.1:8888" apps/web/src && echo NG || echo OK
```

## 6. 完了条件（DoD: Definition of Done, CONST_005 必須）

| ID | 条件 | 検証 |
| --- | --- | --- |
| DoD-T03-1 | `resolveApiTransportChain` / `fetchViaApiTransportChain` が SSOT §2 シグネチャで存在し CH-1〜CH-6 PASS | §5 vitest |
| DoD-T03-2 | FB-1（binding throw → http fallback 成功 + warn）/ AU-1 が PASS（AC-3 の正本） | §5 vitest |
| DoD-T03-3 | FB-3 / AU-2 / AU-3（HTTP エラー Response 非介入・401 `AuthRequiredError` 回帰なし）が PASS（AC-3/AC-7） | §5 vitest |
| DoD-T03-4 | CH-4 / CH-5（明示 local のみ localhost・非明示 throw）が PASS（AC-4 fail-closed） | §5 vitest |
| DoD-T03-5 | FB-4（POST 非 fallback）/ FB-5・AU-4（全滅 rethrow）が PASS（M-3/M-4） | §5 vitest |
| DoD-T03-6 | warn payload に memberId・cookie・secret が含まれない spec が PASS（AC-5） | §5 vitest |
| DoD-T03-7 | PG-1〜PG-5（`/profile` 分岐・文言不変）が PASS、`fetchAuthed` 公開契約不変 | §5 vitest / `git diff` |
| DoD-T03-8 | `typecheck` / `lint` exit 0・`apps/api` 差分空（AC-7・AC-8） | §5 / `git diff` |

## 7. ロールバック手順

```bash
git checkout -- apps/web/src/lib/fetch/transport.ts \
                apps/web/src/lib/fetch/authed.ts \
                apps/web/src/lib/fetch/transport.spec.ts \
                apps/web/src/lib/fetch/authed.spec.ts \
                'apps/web/app/(member)/profile/page.spec.tsx'
```

revert 後は T01 統合直後の単発 transport（観測性あり・fallback なし）に戻る。T02/T04 の成果に影響しない（対象ファイル排他）。

## 8. 後続タスク・先送り項目

CONST_007 に違反する先送りは無し。単発 `resolveApiFetch` / `fetchViaApiTransport` と chain の一時的な共存（MINOR-1）は Phase 8 で整理する。他 caller（magic-link / gate-state / api/me proxy）の chain 化横展開は本症状の復旧に不要なため行わない。

## 9. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。T01〜T04 を 1 本の PR（base=`dev`）に束ねる（Phase 13）。
