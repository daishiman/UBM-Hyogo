# task-02: `getAuthEnv` の field-tolerant 化（F-A 根治）

`[実装区分: 実装仕様書]`

> 判定根拠: CONST_004 に従う。本タスクは `apps/web/src/lib/env.ts`（編集）とテスト 1 ファイル（編集）を変更し、「無関係 field 1 つの不正で `INTERNAL_API_BASE_URL` を含む全 field が黙って消える」all-or-nothing 欠陥（F-A）を field 単位 safeParse で根治するコード変更を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ワークフロー | `profile-session-staging-transport-recovery` |
| 親 Phase | Phase 5（実装） |
| タスク ID | T02 |
| ブランチ | `fix/profile-session-staging-transport-recovery` |
| visualEvidence | NON_VISUAL（spec + 構造化 warn で判定） |
| 想定 PR base | `dev` |
| 並列性 | **T01 完了後**。T03 と並列可（対象ファイル排他） |
| 紐づく AC / F / S | AC-2（field-tolerant + 回帰固定）/ AC-5（key 名のみ warn・値非出力）/ F-A（根治対象）/ S1・S2（誘発元の遮断） |

## 背景

現行 `getAuthEnv`（`apps/web/src/lib/env.ts:131-137`）は `AuthEnvSchema.partial().safeParse(rawEnv)` の **all-or-nothing** 判定で、1 つでも不正な field（例: 空文字 `GOOGLE_CLIENT_ID`、16 文字未満 `AUTH_SECRET`、URL 形式でない `AUTH_URL`）があると `parsed.success === false` となり **全 field を黙って `{}` に落とす**。これにより無関係な `INTERNAL_API_BASE_URL` まで喪失し、transport 解決不能（S1）や localhost fallback（S2・T01 で fail-closed 化済）を誘発する（F-A）。しかも drop はログに出ないため原因が不可視。staging スクショ（F-4）では middleware は env を読めており、**部分故障**が濃厚なシナリオで本欠陥は全断への増幅器になる。

## 目的

`getAuthEnv` の内部を **field 単位 safeParse** に変え、不正 field のみ drop・valid field は保持する。drop が発生した場合のみ dropped **key 名のみ**を `auth_env_field_dropped` 構造化 warn で出力する（値・secret は出さない）。公開シグネチャ・戻り値型・`API_SERVICE` 透過は不変。

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/lib/env.ts` | 編集 | `getAuthEnv` の内部を field 単位 safeParse 化。内部 helper `parseAuthEnvFieldTolerant`（export 任意）を追加 |
| `apps/web/src/lib/__tests__/env.spec.ts` | 編集 | field-tolerant の回帰固定ケース（EV-1〜EV-6）を追加。既存ケースは無変更で green 維持 |

それ以外は無編集。`AuthEnvSchema` の定義・`AuthEnv` 型・他のアクセサ（`getEnv` / `getPublicEnv*` / `getEnvironment*` 等）は不変。

## 2. 主要な関数・型のシグネチャまたは構造（CONST_005 必須・SSOT §2 を正とする）

```ts
// apps/web/src/lib/env.ts
export function getAuthEnv(rawEnv: RawEnv = readRawEnv()): AuthEnv; // 公開シグネチャ・戻り値型不変

// 新規（内部 helper・export は任意）
interface AuthEnvFieldTolerantResult {
  readonly data: z.infer<typeof AuthEnvSchema>;
  readonly droppedKeys: readonly string[];
}
function parseAuthEnvFieldTolerant(rawEnv: RawEnv): AuthEnvFieldTolerantResult;
```

### Before（現行 env.ts:131-137）

```ts
export function getAuthEnv(rawEnv: RawEnv = readRawEnv()): AuthEnv {
  const parsed = AuthEnvSchema.safeParse(rawEnv);
  const base = parsed.success ? parsed.data : {}; // ← 1 field の不正で全 drop（F-A）・無音
  const binding = rawEnv["API_SERVICE"];
  if (binding === undefined) return base;
  return { ...base, API_SERVICE: binding as ServiceBinding };
}
```

### After（field 単位 safeParse + dropped-key warn）

```ts
function parseAuthEnvFieldTolerant(rawEnv: RawEnv): AuthEnvFieldTolerantResult {
  const data: Record<string, unknown> = {};
  const droppedKeys: string[] = [];
  for (const [key, fieldSchema] of Object.entries(AuthEnvSchema.shape)) {
    const value = rawEnv[key];
    if (value === undefined) continue; // .partial() 意味論維持（未設定は drop でも採用でもない）
    const parsed = fieldSchema.safeParse(value);
    if (parsed.success) {
      if (parsed.data !== undefined) data[key] = parsed.data;
    } else {
      droppedKeys.push(key); // 不正 field のみ drop（F-A 根治）
    }
  }
  return { data: data as z.infer<typeof AuthEnvSchema>, droppedKeys };
}

export function getAuthEnv(rawEnv: RawEnv = readRawEnv()): AuthEnv {
  const { data, droppedKeys } = parseAuthEnvFieldTolerant(rawEnv);
  if (droppedKeys.length > 0) {
    // key 名のみ。値・secret は絶対に出力しない（AC-5）
    console.warn("auth_env_field_dropped", { keys: [...droppedKeys].sort() });
  }
  const binding = rawEnv["API_SERVICE"];
  if (binding === undefined) return data;
  return { ...data, API_SERVICE: binding as ServiceBinding };
}
```

> `AuthEnvSchema` は `.partial()` 済みのため `shape` の各 field は optional schema。`undefined` を先にスキップすることで従来の「未設定は単に無い」意味論を保つ。warn のイベント名は既存 `server_fetch_failed` に倣う snake_case（SSOT §5 命名規則）。

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 区分 | 内容 |
| --- | --- |
| 入力 | `rawEnv`（省略時 `readRawEnv()`。Cloudflare context / process.env 解決は従来どおり） |
| 出力 | `AuthEnv`（valid field のみ採用。全 field valid なら従来と**完全同一**の戻り値・後方互換） |
| 副作用 | dropped keys >= 1 のときのみ `console.warn("auth_env_field_dropped", { keys })` を 1 回。0 件なら副作用なし |
| 非出力（AC-5） | field の**値**・secret・memberId・cookie を warn に含めない。`keys` は key 名文字列の配列のみ |
| throw | しない（全滅時も `{}` 相当 + 全 dropped key 名 warn で返す。fail-closed 判定は transport 層 = T01/T03 の責務） |
| 互換性 | 公開シグネチャ・`AuthEnv` 型・`API_SERVICE` 透過・既存 consumer（authed.ts / route 群 / verify-magic-link）すべて無変更で動作 |

## 4. テスト方針（CONST_005 必須）

ファイル: `apps/web/src/lib/__tests__/env.spec.ts`（編集・追加のみ）。`vi.spyOn(console, "warn")` で warn をキャプチャする。Phase 4 §4.6 の RED 観点 EV-1/EV-2 を含む。

| TC-ID | 入力 | 期待 | RED |
| --- | --- | --- | --- |
| EV-1（回帰の正本） | `{ GOOGLE_CLIENT_ID: "", INTERNAL_API_BASE_URL: "https://api.example.com", ENVIRONMENT: "staging" }` | 戻り値に `INTERNAL_API_BASE_URL` / `ENVIRONMENT` が**保持**され、`GOOGLE_CLIENT_ID` のみ存在しない（AC-2: 無関係 field 1 つの不正で `INTERNAL_API_BASE_URL` が消えない） | RED（現行は全 drop） |
| EV-2 | EV-1 と同入力 | `console.warn` が 1 回、第 1 引数 `"auth_env_field_dropped"`、payload `{ keys: ["GOOGLE_CLIENT_ID"] }`。payload の JSON 文字列に **field 値（空文字以外も）が含まれない** | RED（現行は warn なし） |
| EV-3 | `{ AUTH_SECRET: "short", AUTH_URL: "not-a-url", INTERNAL_API_BASE_URL: "https://api.example.com" }` | `AUTH_SECRET` / `AUTH_URL` の 2 key が drop（`keys` は両方を含む）、`INTERNAL_API_BASE_URL` 保持 | RED |
| EV-4 | 全 field valid（既存テストの fixture） | 従来と同一の戻り値・`console.warn` **呼ばれない** | GREEN 維持（後方互換 guard） |
| EV-5 | `{ API_SERVICE: binding, GOOGLE_CLIENT_ID: "" }` | `API_SERVICE` は schema 外透過で**保持**（warn 対象外）、`GOOGLE_CLIENT_ID` のみ drop | RED |
| EV-6 | `{}`（空） | `{}` 相当を返し warn なし（未設定 ≠ 不正） | GREEN 維持 |

既存の `getAuthEnv` テスト・`getEnvironmentResolution` テスト（T01 取込分）は無変更で green であること。

## 5. ローカル実行・検証コマンド（CONST_005 必須）

```bash
# 1. 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 2. 本タスクの focused vitest（apps/web package 内から。SSOT §8 形式）
cd apps/web
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/__tests__/env.spec.ts

# 3. consumer 非回帰（authed / safe-fetch / page）
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts' \
  'apps/web/app/(member)/profile/page.spec.tsx'
cd ../..
```

## 6. 完了条件（DoD: Definition of Done, CONST_005 必須）

| ID | 条件 | 検証 |
| --- | --- | --- |
| DoD-T02-1 | `getAuthEnv` が field 単位 safeParse になり、EV-1（`INTERNAL_API_BASE_URL` 保持）が PASS（AC-2） | §5 手順 2 |
| DoD-T02-2 | EV-2/EV-3（dropped key 名のみ warn・値非出力）が PASS（AC-5） | §5 手順 2 |
| DoD-T02-3 | EV-4/EV-6（全 valid・空入力の後方互換）が PASS、既存 env.spec ケースが全 green | §5 手順 2 |
| DoD-T02-4 | 公開シグネチャ・`AuthEnv` 型が不変（consumer のコード変更ゼロ） | `git diff` で env.ts と env.spec.ts 以外に差分が無い |
| DoD-T02-5 | `typecheck` / `lint` exit 0、§5 手順 3 の consumer spec が全 green | §5 手順 1・3 |
| DoD-T02-6 | `apps/api` 差分が空（AC-7） | `git diff origin/dev...HEAD -- apps/api` |

## 7. ロールバック手順

```bash
git checkout -- apps/web/src/lib/env.ts apps/web/src/lib/__tests__/env.spec.ts
```

revert 後は all-or-nothing 挙動（F-A）に戻るのみで、他タスク（T01/T03/T04）の成果に影響しない（対象ファイル排他）。

## 8. 後続タスク・先送り項目

CONST_007 に違反する先送りは無し。`getEnv()`（throw する厳格版）や `getPublicEnvSafe` の tolerant 化は本症状の復旧に不要なため**行わない**（スコープ外・投機実装しない）。

## 9. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。T01〜T04 を 1 本の PR（base=`dev`）に束ねる（Phase 13）。
