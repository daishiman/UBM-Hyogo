# SSOT: profile-session-staging-transport-recovery

> 本ファイルは Phase 1-13 仕様書生成の **設計正本（Single Source of Truth）**。各 phase-N.md / index.md / artifacts.json はこの内容と矛盾してはならない。
> 衝突時の正本順位: 本 SSOT → index.md → outputs/phase-{1,2,3}/phase-N.md → outputs/phase-5/task-*.md。

---

## 0. メタ情報（全 phase 共通）

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| canonical_root | `docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery` |
| branch | `fix/profile-session-staging-transport-recovery` |
| 起点 | `origin/dev` (986d5e669) |
| 種別 | recovery / bugfix（staging `/profile` transport 失敗の復旧 + 多層防御） |
| **実装区分** | **`[実装区分: 実装仕様書]`** |
| taskType | implementation（復旧の最終証跡が staging `/profile` の正常描画 screenshot。コード変更自体は transport/env 層で UI 外観は不変） |
| implementation_mode | `edit`（既存 env/transport/fetch/診断スクリプトの編集 + 既存テストの拡充） |
| visualEvidence | VISUAL_ON_EXECUTION（現象 screenshot はユーザー提供済み 2026-06-11。復旧後 staging 認証 runtime screenshot は user-gated。実装時の static contract は jsdom 主証跡） |
| workflow_state | `implemented_local_runtime_pending`（本サイクルはlocal 実装・focused 検証済み。commit・push・PR・staging deploy は本実行サイクル / user-gated） |
| 想定 PR base | `dev` |
| relatedIssue | null（staging 実機観察起点・ユーザー報告 2026-06-11 21:43 JST） |
| 直接前身 WF | `completed-tasks/profile-session-fetch-failure-investigation`（観測性 D1/D2/D3・dev マージ済 #1194）/ `profile-session-transport-observability-fail-closed`（branch `fix/profile-session-staging-localhost-endpoint`・**未マージ・PR 未作成**） |

### 実装区分の判定根拠（CONST_004 準拠・仕様書冒頭に明記すること）

- ユーザー要求は「セッション情報を取得できませんでした、を**対策して**」= staging `/profile` の復旧。コード変更（env 読み取り堅牢化・transport 多段フォールバック・診断拡張）なしでは達成不可能なため、デフォルト通り**実装仕様書**として作成する。
- CONST_005 必須項目（変更対象ファイル・関数シグネチャ・入出力・テスト方針・実行コマンド・DoD）を outputs/phase-5/task-01..04 に明記する。

---

## 1. 主問題（真の論点）と確定済み事実

**staging `/profile` で、ログイン済み会員（スクショでは「ishida 会員」）に「セッション情報を取得できませんでした / 通信経路でセッション確認に失敗しました。時間をおいて再読み込みしてください。」が表示され、マイページ本体が描画されない。これを今回 1 サイクルのコード変更で復旧し、再発時も staging ログだけでサブ原因を即特定できる状態にする。**

### ユーザー提供エビデンス（2026-06-11 21:43 JST）から確定した事実

| # | 事実 | 根拠 |
| --- | --- | --- |
| F-1 | 表示文言は「通信経路でセッション確認に失敗しました」= `mapProfileSessionErrorToDisplay` の **`session-failed` 分岐（`MEMBER_SESSION_FAILED`）専用文言**（`apps/web/app/(member)/profile/_lib/session-error-display.ts:54-60`） | スクショ本文と dev コードの突き合わせ |
| F-2 | この区別文言は PR #1194（78df4dea0・2026-06-10 dev マージ）で導入。staging に表示されている＝**staging bundle は 2026-06-10 以降の deploy**。前身 WF の仮説 H1（旧 bundle）/H3（410）/H4（5xx）は**このスクショ自体が除外**する（410/5xx なら別文言になる） | session-error-display.ts の git log + スクショ文言 |
| F-3 | `MEMBER_SESSION_FAILED` は `safeServerFetch.normalizeError` で「`err.status` が無く message にも 3 桁 status が無い」場合のみ生成される（`apps/web/src/lib/server-fetch/safe-fetch.ts:29-45`）= **`/me` の fetch が HTTP 応答に至らず throw した（transport 失敗）** | コード経路 |
| F-4 | 同一画面のサイドバーに「ishida 会員」が表示＝ web Worker 側の Auth.js JWT decode（`AUTH_SECRET`）は成功。middleware の CSP ヘッダに staging API URL が焼かれている＝ middleware コンテキストでは `NEXT_PUBLIC_API_BASE_URL` を読めている | スクショのサイドバー + response headers の `content-security-policy` |
| F-5 | `apps/web/wrangler.toml` `[env.staging]` には `[[env.staging.services]] API_SERVICE → ubm-hyogo-api-staging` と `INTERNAL_API_BASE_URL` / `ENVIRONMENT=staging` が**設定済み**（wrangler.toml:26-51） | 設定ファイル現物 |
| F-6 | 観測性 + fail-closed の先行実装（`ApiTransportError{transportKind,baseHost}` / `describeTransport` / `environmentExplicit` / safe-fetch transport ログ）は branch `fix/profile-session-staging-localhost-endpoint`（origin push 済・2026-06-11 dev 同期済 82f19bcc8）に存在するが **dev 未マージ → staging 未デプロイ**。現行 staging ログには transportKind/baseHost が出ない | git branch / diff |

### 残るサブ原因仮説（S1〜S4）と横断要因（F-A/F-B）

`MEMBER_SESSION_FAILED`（transport throw）を起こす経路は現行 dev コード上、次の 4 つに限られる:

| ID | サブ原因 | 経路 | 現行コードでの帰結 |
| --- | --- | --- | --- |
| S1 | transport 解決不能 throw | `getAuthEnv()` が `API_SERVICE` も `INTERNAL_API_BASE_URL` も返せず、`getEnvironment()`=staging → `resolveApiFetch` が `API transport unresolved` を throw（transport.ts:40-42） | `MEMBER_SESSION_FAILED` |
| S2 | localhost fallback 接続失敗 | env が全く読めず `getEnvironment()`=local 扱い → `http://localhost:8787` へ fetch → Workers ランタイムで接続失敗 throw（transport.ts:33-38） | `MEMBER_SESSION_FAILED` |
| S3 | service-binding fetch throw | binding は取れたが `API_SERVICE.fetch` 自体が throw（bound worker の hard error / binding 不調） | `MEMBER_SESSION_FAILED` |
| S4 | http fetch throw | baseUrl transport で `fetch()` 自体が throw（API 到達不能・DNS/TLS 等） | `MEMBER_SESSION_FAILED` |

| ID | 横断要因（コードの設計欠陥として本サイクルで根治する） | 箇所 |
| --- | --- | --- |
| F-A | **`getAuthEnv` の all-or-nothing safeParse**: `AuthEnvSchema.partial().safeParse(rawEnv)` が 1 つでも不正な field（例: 空文字 `GOOGLE_CLIENT_ID`、16 文字未満 `AUTH_SECRET`、URL 形式でない `AUTH_URL`）を含むと **全 field を黙って捨て**、無関係な `INTERNAL_API_BASE_URL` まで喪失 → S1/S2 を誘発（env.ts:131-137） | `apps/web/src/lib/env.ts` |
| F-B | **単一 transport 依存**: `fetchAuthed` は service-binding か baseUrl の**どちらか 1 本**しか試さず、transport 層の throw で即 `MEMBER_SESSION_FAILED`。staging には binding と URL の両方が設定されているのに片方の不調で全断する | `apps/web/src/lib/fetch/transport.ts` / `authed.ts` |

> サブ原因 S1〜S4 のどれが今日の staging で起きているかは staging ログ（未デプロイの観測性）が無いと確定できない。**本 WF はサブ原因の確定を deploy 後の Phase 11 検証に置きつつ、S1〜S4 のいずれであっても復旧する多層防御（F-A/F-B の根治 + 観測性の deploy 到達）を today's fix とする**。これにより「真因確定待ちで復旧が止まる」ことを回避する（前身調査 WF の MT-A〜MT-D が user-gated のまま停滞した教訓）。

---

## 2. 対策設計（タスク分解 T01〜T04）

| ID | タスク | 対象 | 解消するもの | 並列性 |
| --- | --- | --- | --- | --- |
| T01 | **観測性成果統合** | 未マージ観測性ブランチの必要成果を現行 branch に最小統合 | F-6（観測性未デプロイ）・S2（localhost fail-closed 化）。`ApiTransportError{transportKind,baseHost}` / `describeTransport` / `getEnvironmentResolution`(`environmentExplicit`) / safe-fetch transport ログ / `FetchAuthedError` transport 引数が本 branch に入る | 直列（T02/T03 の前提。最初に実施） |
| T02 | **`getAuthEnv` field-tolerant 化** | `apps/web/src/lib/env.ts` | F-A。field 単位で safeParse し、不正 field のみ捨てる。捨てた **key 名のみ**を構造化 `console.warn`（値・secret は出さない） | T01 後、T03 と並列可 |
| T03 | **transport 多段フォールバック chain** | `apps/web/src/lib/fetch/transport.ts` / `authed.ts` | F-B・S1/S3/S4。`resolveApiTransportChain` で [service-binding → `INTERNAL_API_BASE_URL` → `NEXT_PUBLIC_API_BASE_URL`(staging/production のみ)] を順に構成し、`ApiTransportError`（transport 層 throw）時のみ次へ。**HTTP エラー Response（401/404/410/5xx）では fallback しない**（status 体系・AuthRequiredError 挙動不変）。**GET/HEAD のみ fallback**（非冪等 POST の二重適用防止）。fallback 発生時は `api_transport_fallback {from, to, path}` を構造化 warn | T01 後、T02 と並列可 |
| T04 | **診断スクリプト拡張** | `scripts/diagnose-profile-session.sh` | 運用診断の精度。(a) probe 先を web `/api/me`（proxy 実経路）と API direct `${API_BASE}/me` の **2 系統**に拡張（現行は web `/me` を叩いており route 不在で常に 404 系になる欠陥の是正）(b) cookie 提供時（user-gated）に web `/profile` HTML から `data-cause` 値を抽出して失敗クラスを外形判定 (c) `bash scripts/cf.sh` 経由の staging deploy 版数確認手順を出力に含める。read-only・冪等・secret/cookie/memberId 非出力は維持 | T01-T03 と独立並列 |

### 設計上の不変点（やらないこと）

- `/me` の path・レスポンス shape・status 体系、`apps/api` 全体、D1 schema、Google Form 仕様は**一切変更しない**。
- `/profile` page.tsx のエラー分岐・`session-error-display.ts` の文言・`SectionError` は**変更しない**（復旧後は正常描画になり、真の全断時のみ既存バナーが出る）。
- 認証境界は fail-closed を維持: fallback chain が空 かつ 非 local の場合は throw（T01 の `environmentExplicit` 方式を維持）。localhost への fallback は「`ENVIRONMENT=local` が**明示**されている場合」のみ。
- fallback は同一 deployment 内の同一 API（staging→staging / production→production の自ホスト）へのみ向く。cookie の転送先は従来の http transport（`INTERNAL_API_BASE_URL`）と同一信頼境界であり拡大しない。

### 主要シグネチャ（Phase 4/5 で契約化）

```ts
// apps/web/src/lib/env.ts
export function getAuthEnv(rawEnv?: RawEnv): AuthEnv; // 戻り値型不変・内部を field-tolerant 化
// 新規（内部 helper・export は任意）: field 単位 safeParse + dropped keys 構造化 warn

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

// apps/web/src/lib/fetch/authed.ts
export const fetchAuthed: <T>(path: string, init?: RequestInit) => Promise<T>; // 公開契約不変・内部を chain 化
```

---

## 3. スコープ（CONST_007: 今回 1 サイクルで完結）

### IN（今回サイクル）

1. T01 観測性成果統合（local 実装済み。push/PR は user-gated）
2. T02 env field-tolerant 化 + 専用テスト
3. T03 transport 多段フォールバック chain + 専用テスト + `/profile` 回帰テスト
4. T04 診断スクリプト拡張（read-only）
5. Phase 11: staging 復旧の実機検証**手順**（deploy → diagnose → `/profile` 正常描画 + ログで sub-cause 確定。実施は user-gated）

### OUT（CONST_007 例外①で未タスク化・Phase 12 で formalize）

| 項目 | 分離理由 | 起票先 |
| --- | --- | --- |
| API worker（`ubm-hyogo-api-staging`）側の根治 | サブ原因が S3（bound worker の hard error）と **staging ログで確定した場合のみ**必要。確定前に `apps/api` を触るのは AC-7（apps/api 非接触）違反かつ仕様分岐の合意未済 | `unassigned-task/task-api-worker-hard-error-root-fix.md` |

> 上記 1 件以外に先送りは無い。前身調査 WF の unassigned C-1〜C-4（Issue #1189-#1192）のうち「transport 運用是正（#1192 相当）」は**本 WF が実装で回収**する（重複起票しない。Phase 12 unassigned-task-detection で対応関係を明記）。

### 不変条件（CLAUDE.md / プロジェクト準拠）

- D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）。本 WF は `apps/api` 非接触。
- `apps/web` の env 参照は `getEnv()` / `getAuthEnv()` 等のアクセサ経由のみ（`process.env` 直接参照禁止）。
- `127.0.0.1:8888` 等ローカル限定エンドポイントの `apps/web/src` への焼き込み禁止。localhost fallback は `localhost-allow:local-fallback` コメント規約を維持。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ。
- `wrangler` 直叩き禁止（`bash scripts/cf.sh` 経由）。secret 実値・cookie・トークン・memberId を出力/ドキュメントに転記しない。
- コミット・PR・push・staging deploy はユーザー指示があるまで実行禁止（CONST_002）。

---

## 4. 受入条件（AC・Phase 1 に転記）

| ID | 受入条件 |
| --- | --- |
| AC-1 | T01: 観測性ブランチの必要成果が work branch に統合され、`ApiTransportError`/`describeTransport`/`getEnvironmentResolution`/safe-fetch transport ログの既存テストがすべて green |
| AC-2 | T02: `getAuthEnv` が field 単位 tolerant になり、「無関係 field 1 つの不正で `INTERNAL_API_BASE_URL` が消える」回帰ケースが spec で固定される（不正 field のみ drop / dropped key 名のみ warn / 値は出力しない） |
| AC-3 | T03: service-binding fetch が throw した場合に `INTERNAL_API_BASE_URL` への http fallback で `/me` 取得が成功する（GET/HEAD のみ）。HTTP エラー Response（401/404/410/5xx）では fallback せず既存 status 体系・`AuthRequiredError` 挙動が回帰なし |
| AC-4 | 非 local 環境で localhost transport に絶対に落ちない（`ENVIRONMENT` 明示 local のみ localhost fallback。fail-closed 維持） |
| AC-5 | fallback 発生時に `api_transport_fallback {from, to, path}` 構造化 warn が出る。memberId・cookie・secret はログに出ない |
| AC-6 | T04: 診断スクリプトが web `/api/me` と API direct `/me` の 2 系統 probe + （cookie 提供時）`data-cause` 抽出 + deploy 版数手順を出力し、read-only・冪等・`bash -n` PASS |
| AC-7 | `/me` のレスポンス shape・path・status 体系、`apps/api` 全体、D1 schema、Google Form 仕様、`/profile` の UI 文言・分岐を一切変更しない |
| AC-8 | `mise exec -- pnpm typecheck` / `pnpm lint` / 対象 focused vitest がすべて PASS |
| AC-9 | Phase 11 に staging 復旧の実機検証手順（user-gated: deploy → `bash scripts/diagnose-profile-session.sh` → `/profile` 正常描画 screenshot → 新ログ transportKind/baseHost で S1〜S4 の確定）が記載され、判定フローが S1〜S4 を排他的に切り分ける |

---

## 5. 対象 inventory（current code anchor / 変更種別）

| 系統 | パス | 変更種別 | 役割 |
| --- | --- | --- | --- |
| env (web) | `apps/web/src/lib/env.ts` | **編集**（T01 統合 で `getEnvironmentResolution` 追加済 → T02 で `getAuthEnv` field-tolerant 化） | F-A 根治 |
| transport (web) | `apps/web/src/lib/fetch/transport.ts` | **編集**（T01 統合 で `ApiTransportError`/`describeTransport`/`environmentExplicit` 追加済 → T03 で chain 追加） | F-B 根治 |
| authed fetch (web) | `apps/web/src/lib/fetch/authed.ts` | **編集**（T03: chain 利用へ内部置換。公開契約不変） | `/me` 取得経路 |
| safe fetch (web) | `apps/web/src/lib/server-fetch/safe-fetch.ts` | **T01 統合 のみ**（transport descriptor ログ。T02/T03 での追加変更なし） | 構造化ログ |
| fetch errors (web) | `apps/web/src/lib/fetch/errors.ts` | **T01 統合 のみ** | `FetchAuthedError` transport 引数 |
| 診断スクリプト | `scripts/diagnose-profile-session.sh` | **編集**（T04） | 運用診断 |
| env spec | `apps/web/src/lib/__tests__/env.spec.ts` | **編集**（T02 ケース追加） | 回帰固定 |
| transport spec | `apps/web/src/lib/fetch/transport.spec.ts` | **編集**(T03 chain ケース追加) | 回帰固定 |
| authed spec | `apps/web/src/lib/fetch/authed.spec.ts` | **編集**（T03 fallback 成功/不実施ケース追加） | 回帰固定 |
| safe-fetch spec | `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | **T01 統合 のみ** | 観測性固定 |
| profile page spec | `apps/web/app/(member)/profile/page.spec.tsx` | **編集**（回帰: 分岐・文言不変の確認のみ） | UI 回帰 guard |
| 非接触（read-only） | `apps/api/**` / `apps/web/app/(member)/profile/` 配下の UI 実装（page.tsx・_components・_lib） / `apps/web/wrangler.toml`（設定は F-5 で正しいと確認済） | 非接触 | AC-7 |

### 既存命名規則（遵守）

- error: `ApiTransportError` / `FetchAuthedError` / `AuthRequiredError`。error code: `MEMBER_SESSION_<status>` / `MEMBER_SESSION_FAILED`（**変更しない**）。
- 構造化ログ: 既存 `server_fetch_failed` に倣い snake_case イベント名（新規 `api_transport_fallback` / `auth_env_field_dropped`）。
- transport 定数: `SERVICE_BINDING_ORIGIN` / `LOCAL_API_FALLBACK_BASE_URL`（`localhost-allow:local-fallback` コメント維持）。
- test: `*.spec.{ts,tsx}`。focused 実行は `--root=../.. --config=vitest.config.ts <path>` 形式（monorepo root 基準 glob）。

---

## 6. 既存関連ワークフローとの関係（重複回避）

| 既存 WF | 状態 | 本 WF での扱い |
| --- | --- | --- |
| `profile-session-fetch-failure-investigation`（completed） | 観測性 D1/D2/D3 は dev マージ済（#1194）。MT-A〜MT-D は user-gated のまま未実施 | F-1〜F-3 の確定により H 仮説を S1〜S4 へ精緻化。MT 系の実機切り分けは本 WF Phase 11 の復旧検証に統合 |
| `profile-session-transport-observability-fail-closed`（branch 未マージ） | `fix/profile-session-staging-localhost-endpoint` に実装済・dev 同期済・PR 未作成 | **T01 で必要成果を本 WF branch へ統合し、本 WF の PR が当該成果を dev へ届ける**（個別 PR を別途立てない。Phase 12/13 で明記） |
| 前身 unassigned C-1〜C-4（Issue #1189-#1192） | OPEN | transport 運用是正系は本 WF が実装で回収（重複起票しない）。410 復帰/5xx 根治/管理者 UX は対象外のまま |
| `staging-api-url-and-session-recovery`（completed） | service-binding / URL 設定は解決済 | F-5（設定正常）の前提として引用 |

---

## 7. Phase 構成（13 仕様書・各 phase の責務）

| Phase | 名称 | 本タスクでの責務 | 主成果物 |
| --- | --- | --- | --- |
| 1 | 要件定義 | 確定事実 F-1〜F-6・サブ原因 S1〜S4・横断要因 F-A/F-B・AC-1〜9・inventory・命名規則・実装区分判定根拠 | `outputs/phase-1/phase-1.md` |
| 2 | 設計 | 多層防御設計（T01〜T04）・transport chain の状態遷移・fallback 判定規則（ApiTransportError のみ/GET・HEAD のみ）・ログ設計・因果ループ | `outputs/phase-2/phase-2.md` |
| 3 | 設計レビュー | Phase 4 進行判定。fallback が status 体系・認証境界・cookie 信頼境界を侵さないかのレビュー。Phase 11 を「復旧検証 + sub-cause 確定」に特化する宣言 | `outputs/phase-3/phase-3.md` |
| 4 | I/O 契約 / テスト設計 | `resolveApiTransportChain`/`fetchViaApiTransportChain`/`getAuthEnv` の I/O 契約表・fallback 判定マトリクス・RED 観点 | `outputs/phase-4/phase-4.md` |
| 5 | 実装手順 | T01〜T04 の Before→After 手順（CONST_005 全項目） | `outputs/phase-5/phase-5.md` + `task-01-observability-branch-integration.md` / `task-02-auth-env-field-tolerant.md` / `task-03-transport-fallback-chain.md` / `task-04-diagnose-script-extension.md` |
| 6 | テスト拡充 | S1〜S4 ×（fallback 成功/全滅）× HTTP エラー非 fallback × 非冪等 method 非 fallback の網羅・ログ非 PII | `outputs/phase-6/phase-6.md` |
| 7 | カバレッジ確認 | 変更ブロック（env field-tolerant / chain 分岐）の line/branch 実測（変更箇所限定） | `outputs/phase-7/phase-7.md` |
| 8 | リファクタリング | chain 構成と単発 resolve の重複排除（`resolveApiFetch` を chain の先頭要素として再定義 or 互換 wrapper 化）+ rollback 方針 | `outputs/phase-8/phase-8.md` |
| 9 | 品質保証 | typecheck/lint/focused vitest 一括 + `bash -n` + apps/api 非接触 grep + localhost 焼き込み grep | `outputs/phase-9/phase-9.md` |
| 10 | 最終レビュー | AC-1〜9 充足判定・blocker・MINOR 追跡 | `outputs/phase-10/phase-10.md` |
| 11 | 手動テスト | **staging 復旧検証手順（user-gated）**: merge→deploy→diagnose→`/profile` 描画→新ログで S1〜S4 確定。screenshot 計画 | `outputs/phase-11/manual-test-result.md` ほか証跡セット |
| 12 | ドキュメント更新 | strict 7 成果物。unassigned 1 件（S3 API 根治）formalize + 前身 Issue との対応関係 | `outputs/phase-12/*.md` |
| 13 | PR 作成 | user 明示承認後のみ。`dev` base。T01 統合により観測性ブランチ成果も同 PR で dev へ届く旨を本文に明記 | `outputs/phase-13/phase-13.md` |

### 因果ループ（Phase 2 に記載）

- バランスループ B1: 単一 transport 依存(F-B) → 片系不調で全断 → ユーザー影響 → 緊急対応、を「chain fallback + fallback ログ」で断ち切る（劣化運転 + 検知）。
- バランスループ B2: env の all-or-nothing parse(F-A) → 無関係 field の drift で transport 喪失 → 原因がログに出ない、を「field-tolerant + dropped-key warn」で断ち切る。
- 状態所有権: 認証判定（401/410）の所有権は **api/session-guard**（不変）。web は transport の選択・劣化運転・観測のみを所有する。fallback は Response の status には一切介入しない。

---

## 8. 検証コマンド（Phase 9 / close-out）

```bash
# 仕様書構造検証
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery
node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery
mise exec -- pnpm verify:phase12-compliance docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery
mise exec -- pnpm gate-metadata:validate
# 品質ゲート
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/__tests__/env.spec.ts \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts' \
  'apps/web/app/(member)/profile/page.spec.tsx'
bash -n scripts/diagnose-profile-session.sh
# 復旧検証（user-gated・deploy 後）
bash scripts/diagnose-profile-session.sh
```

> focused vitest は `apps/web` package 内から `--root=../..` 形式で実行する（include glob が monorepo root 基準のため。直 path 指定では "No test files found" になる既知の罠）。

---

## 9. SubAgent 分担（並列生成）

- Lane A（直列・設計）: Phase 1, 2, 3（本 SSOT から設計書を作成。CONST_001: Phase 3 完了まで Phase 4 以降に着手しない）
- Lane B（並列）: Phase 4, 5（+ task-01..04）, 6, 7, 8
- Lane C（並列）: Phase 9, 10, 11（+ 証跡セット）, 12（strict 7）, 13 + unassigned-task 1 件

各 Lane は本 SSOT を唯一の入力とし、AC ID（AC-1〜9）・事実 ID（F-1〜F-6）・サブ原因 ID（S1〜S4）・横断要因 ID（F-A/F-B）・タスク ID（T01〜T04）・anchor・命名規則を逐語で踏襲する。workflow_state=implemented_local_runtime_pending のため、Phase 11 screenshots は `.gitkeep` のみ（staging PNG は user-gated）、phase12 compliance の §4 Status は厳密トークン（`present`/`pending`/`n/a`）のみを用いる。
