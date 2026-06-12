# Phase 2: 設計

## メタ情報
正本: `outputs/phase-2/phase-2.md` / 上位 SSOT: `../../_shared-context.md`

## 目的
レーン設計・状態所有権・因果ループ・fail-closed 設計・validation path を固定する。

## 1. レーン設計（3 並列以下 / validation 直列）

| レーン | タスク | 領域 | 依存 |
|--------|--------|------|------|
| A | T02 → T01 | `env.ts`（getEnvironmentResolution）→ `fetch/`（transport/errors/authed） | T01 は T02 の戻り値を入力に使うため A 内で直列（T02 先行） |
| B | T03 | `server-fetch/safe-fetch.ts`（ログ拡張） | T01 の `FetchAuthedError`/`ApiTransportError` 診断メタ shape に依存（契約は Phase 4 で固定するため設計上は並列可・実装は契約合意後） |
| C | T04 | `scripts/diagnose-profile-session.sh`（echo 追加） | 独立 |

validation lane（Phase 9）は直列で締める。

## 2. 状態所有権（責務境界）

| レイヤ | 責務 | 所有する状態 |
|--------|------|-------------|
| `env.ts` | 環境変数の解決と「明示注入されたか」の判定 | `{ environment, explicit }` |
| `transport.ts` | env から transport を解決（fail-closed 判定を含む）+ transport の診断ラベル生成 | `ApiTransport` / `ApiTransportDescriptor` |
| `authed.ts` | transport 解決の配線・cookie 転送・HTTP/接続エラーの分類と診断メタ付与 | `FetchAuthedError` / `ApiTransportError` |
| `safe-fetch.ts` | エラー正規化（`MEMBER_SESSION_*`）と構造化ログ出力 | `SafeResultError` / ログ |
| `session-error-display.ts`（不変） | error code → UI 表示マッピング | 既存・本タスクで触らない |

> 診断メタ（transportKind/baseHost）の**生成責務は transport.ts（describeTransport）に一元化**し、authed.ts は付与のみ、safe-fetch.ts は読み取り・出力のみ。生成ロジックを複数レイヤに分散させない。

## 3. fail-closed 設計（中核）

### 現状 `resolveApiFetch` 解決順序
```
1. isTest && baseUrl            -> http(baseUrl)
2. API_SERVICE != undefined     -> service-binding         ← staging は通常ここで解決
3. baseUrl != undefined         -> http(baseUrl)
4. (environment ?? "local")==="local" -> http(localhost:8787)   ← 穴: ENVIRONMENT 未注入で local 扱い
5. else                          -> throw
```
穴: `getEnvironment()` は `ENVIRONMENT` が enum 3値以外（未注入/typo）だと `"local"` を返すため step4 で localhost に行く。staging では step2 で先に解決されるため顕在化は「binding も baseUrl も両方欠落 × ENVIRONMENT 未注入」の異常時のみだが、**「環境設定が壊れた staging で誤って localhost を叩く」経路を構造的に塞ぐ**のが本タスクの fail-closed の目的。

### 改修方針
- `ApiTransportEnv` に optional `environmentExplicit?: boolean` を追加。
- step4 の条件を `(environment ?? "local") === "local" && environmentExplicit === true` に変更。
  - `environmentExplicit !== true`（= ENVIRONMENT 未注入/不正/省略で明示されていない）のとき step4 を skip → step5 throw（fail-closed）。
  - `environmentExplicit === true` かつ environment === "local"（明示 local 開発）のときのみ localhost フォールバックを許可。
- throw メッセージは「ENVIRONMENT 未注入で transport 解決不能（fail-closed）」を示し、`apps/web/src/app/error.tsx` の error boundary が補足する。

### env.ts 側
`getEnvironmentResolution(rawEnv = readRawEnv())`:
- `rawEnv["ENVIRONMENT"]` が `"local"|"staging"|"production"` に厳密一致 → `{ environment: <値>, explicit: true }`
- それ以外（未定義/typo/型不一致） → `{ environment: "local", explicit: false }`
- `getEnvironment` は後方互換のため不変。内部で本関数の `environment` と同値を返す（重複ロジックは本関数に寄せる純関数リファクタは Phase 8 で検討）。

### authed.ts 配線
```ts
const resolution = getEnvironmentResolution();
const transport = resolveApiFetch({
  API_SERVICE: env.API_SERVICE,
  baseUrl: env.INTERNAL_API_BASE_URL,
  environment: resolution.environment,
  environmentExplicit: resolution.explicit,
  isTest: getTransportRuntimeIsTest(),
});
const descriptor = describeTransport(transport);
// fetchViaApiTransport が接続失敗(throw)を ApiTransportError(..., descriptor, cause) に wrap
// 非2xx -> new FetchAuthedError(status, text, descriptor)
```

## 4. 診断ラベル設計（describeTransport）

```ts
export interface ApiTransportDescriptor {
  readonly transportKind: "service-binding" | "http";
  readonly baseHost: string;
}
export function describeTransport(t: ApiTransport): ApiTransportDescriptor {
  if (t.kind === "service-binding") {
    return { transportKind: "service-binding", baseHost: new URL(SERVICE_BINDING_ORIGIN).host };
  }
  return { transportKind: "http", baseHost: new URL(t.baseUrl).host };
}
```
- `SERVICE_BINDING_ORIGIN`（既存定数 `https://service-binding.local`）と `t.baseUrl`（ランタイム値）から `URL.host` を抽出するのみ。**新規 localhost/8787/8888 リテラルを足さない**（verify-no-localhost-bake gate 準拠）。
- baseHost 例: `service-binding.local` / `ubm-hyogo-api-staging.daishimanju.workers.dev` / `localhost:8787`（local 開発時のみ）。

## 5. ログ拡張設計（safe-fetch.ts）

```ts
function transportFromError(err: Error): ApiTransportDescriptor | undefined {
  const transport = (err as { readonly transport?: unknown }).transport;
  if (transport && typeof transport === "object") {
    const t = transport as { transportKind?: unknown; baseHost?: unknown };
    if ((t.transportKind === "service-binding" || t.transportKind === "http") && typeof t.baseHost === "string") {
      return { transportKind: t.transportKind, baseHost: t.baseHost };
    }
  }
  return undefined;
}
// logServerFetchFailure 内:
console.error("server_fetch_failed", {
  code: error.code,
  path: opts.logPath,
  status: statusMatch ? Number(statusMatch[1]) : null,
  ...(error.transport ?? {}), // transportKind / baseHost（あれば）
});
```
- `normalizeError` で catch した元 error の `transport` を `SafeResultError` へ移し、`logServerFetchFailure` が flat spread する（公開 API シグネチャ `safeServerFetch` は不変）。
- **memberId / cookie / secret は出力しない**（host とステータスのみ。不変条件 #11）。

## 6. 因果ループ

- 強化ループ（観測性）: transport 可視化 → 実機ログで真因即特定 → 修正の精度向上 → 同種事象の MTTR 短縮。
- バランスループ（fail-closed）: ENVIRONMENT 破損 → localhost フォールバック禁止（throw）→ error boundary が明示エラー表示 → 「謎の通信失敗」より原因が明白 → 設定修復が早い。

## 7. validation path

`pnpm typecheck` → `pnpm lint` → focused vitest（T1-T5）→ `verify-no-localhost-bake --src-only` → `bash -n diagnose-profile-session.sh` → `git diff --stat apps/api`（空）→ phase output validators。

## 8. 既存コンポーネント再利用（FB-SDK-07-1）
新規ファイル・新規 primitive を作らない。既存の `ApiTransport` 判別 union・`FetchAuthedError`・`server_fetch_failed` ログイベント・`SERVICE_BINDING_ORIGIN` 定数を再利用し、追加は型・純関数・optional フィールドに留める。

## 統合テスト連携
unit（fetch モック）で transport 解決・診断メタ付与・ログ出力を検証。実機統合は Phase 11 手動手順。

## 参照資料
- `../phase-1/phase-1.md` / `../../_shared-context.md`

## 成果物
- `outputs/phase-2/phase-2.md`

## 完了条件
- [x] レーン・状態所有権・fail-closed 設計・診断ラベル・ログ拡張・validation path を固定した。
