# SSOT: profile-session-transport-observability-fail-closed

> 本ファイルは設計の正本（Single Source of Truth）。`index.md` / `phase-*.md` / `outputs/phase-N/*` が衝突する場合は本ファイルを優先する。

---

## 0. 実装区分

`[実装区分: 実装仕様書]`（NON_VISUAL / fetch・transport 層のコード変更を含む）

- CONST_004 デフォルト（実装仕様書）に該当。ユーザー依頼「localhost を見に行っていないか確認 → 直す」は、確認結果を**実機ログで証明可能にし、誤って localhost を叩く経路を構造的に塞ぐ**コード変更（観測性強化 + fail-closed）なしには達成できないため、実装仕様書として作成する。
- AskUser 確定（2026-06-11）: スコープ=「観測性強化 + localhost fail-closed 実装」、実機ログ=「仕様書の DoD に staging 実機ログ確認手順を含める」。

---

## 1. ユーザー報告と調査結論（確定事実）

### 1.1 報告
staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile` で「セッション情報を取得できません」エラーが継続。ブラウザコンソールに以下が出る:
- `content.js:21 POST http://127.0.0.1:8888/ net::ERR_CONNECTION_REFUSED`
- `[Sentry] You cannot use Sentry.init() in a browser extension`
- `service-worker-loader.js ... Could not establish connection. Receiving end does not exist.`
- ユーザーの疑問: 「ローカル環境（127.0.0.1）の情報を見に行っていないか」

### 1.2 調査結論（コード読解で確定 — これがユーザー疑問への回答）

**結論: アプリは localhost（127.0.0.1）を参照していない。コンソールの `127.0.0.1:8888` はブラウザ拡張機能由来でアプリと無関係。**

| 根拠 | 詳細 |
|------|------|
| ポート不一致 | アプリのローカルフォールバック値は `8787`（`apps/web/src/lib/fetch/transport.ts:14` `LOCAL_API_FALLBACK_BASE_URL`）。`8888` は**アプリのコード全体に 0 件**（`apps/web/src`・`apps/web/app`・`apps/og/src`・`apps/api/src` を grep して確認）。 |
| 発生源が拡張機能 | `content.js` / `service-worker-loader.js` / `Sentry.init() in a browser extension` 警告は、すべてブラウザ拡張（Manifest V3）の構成要素。アプリバンドル（`index-BusXyNuZ.js`）とは別プロセス。 |
| サーバー側 fetch は service-binding | `/profile`（`page.tsx:39-49`）は Server Component で `fetchAuthed("/me")` を実行。`resolveApiFetch`（`transport.ts:18-43`）は `API_SERVICE` binding を最優先で使う。staging の `wrangler.toml` には `[[env.staging.services]] binding = "API_SERVICE"`（L41-42）が設定済みのため、localhost フォールバック（step4）には**構造的に到達しない**。 |

### 1.3 真の失敗原因（本タスクで観測可能化する対象）
`/profile` は `safeServerFetch(() => fetchAuthed("/me"))` の失敗を `mapProfileSessionErrorToDisplay` で 404 / 410 / 5xx / transport失敗 に分類して当該メッセージを表示する（`session-error-display.ts`）。401 は `/login` リダイレクトされるため**除外確定**。残る真因（API が 410 / 5xx を返す、または service-binding 通信失敗）は **staging 実機の HTTP ステータスログを見ないと確定できない**。現状ログ（`safe-fetch.ts:54` `server_fetch_failed`）は `{code, path, status}` のみで、**「どの transport で・どの host を叩いたか」が記録されない**ため、「localhost を叩いていないこと」を実機ログで証明できず、真因切り分けが鈍い。

---

## 2. 既存資産との関係（重複回避 — 最重要）

dev（現 HEAD `d0dd40069`）には profile-session 系の先行 WF 成果が**既に取り込み済み**:

| 先行成果 | 状態 | 本タスクとの関係 |
|---------|------|-----------------|
| `apps/api/src/middleware/trailing-slash.ts`（`profile-reload-session-404-fix`） | dev取込済 | 前提として引き継ぐ。本タスクで触らない |
| `apps/web/app/api/me/[...path]/route.ts` proxy fix | dev取込済 | 同上 |
| `session-error-display.ts`（410/5xx/FAILED 区別表示） | dev取込済 | 前提。本タスクで触らない |
| `safe-fetch.ts` の `server_fetch_failed` `{code,path,status}` ログ | dev取込済 | **本タスクで `transportKind`/`baseHost` を追加拡張** |
| `scripts/diagnose-profile-session.sh` | dev取込済 | **本タスクで transport echo を追加拡張** |

**本タスクの新規価値（既存にない差分のみ）:**
1. **transport 解決先の可視化** — `server_fetch_failed` ログに「service-binding か http か」と「base host」を追加。→ 「localhost を叩いていない」ことを実機ログで証明可能にする。
2. **localhost fail-closed** — `ENVIRONMENT` が未注入（enum 3値以外）のとき暗黙 `local` 化して localhost フォールバックに到達する経路を、staging/production では構造的に禁止（throw）する。

> 既存 WF（`profile-session-fetch-failure-investigation`）が未デプロイ（`implemented_local_evidence_captured`・commit/PR user-gated）である点は本タスクのスコープ外（CONST_007 例外②: 別 WF の deploy は user-gated）。本タスクは dev 取込済みコードへの追加差分として独立に 1 サイクル完結する。

---

## 3. 真因仮説マトリクス（実機ログで確定する候補）

| ID | 仮説 | 画像症状（非401）一致 | 本タスクの観測強化での切り分け |
|----|------|------|------|
| C1 | 410（`member_status.is_deleted=1`）→ `MEMBER_SESSION_410` | ✓ | `server_fetch_failed.status=410` + `transportKind=service-binding` |
| C2 | 5xx（resolver / D1 / handler 例外）→ `MEMBER_SESSION_5xx` | ✓ | `status=5xx` + `baseHost=service-binding.local` |
| C3 | transport 失敗（service-binding 未応答 / 旧 bundle）→ `MEMBER_SESSION_FAILED` | ✓ | `transportKind` 記録 + `ApiTransportError` で接続失敗を識別 |
| C4 | （否定済）localhost 参照 | ✗ | `baseHost` が `localhost:8787` でないことをログで証明 |
| C5 | （否定済）401 | ✗ | `/login` redirect されバナーにならない |

最有力: C1 / C2 / C3。本タスクは「どれであるか」を実機ログで一意確定できる観測性を与える。

---

## 4. 変更対象ファイル一覧（CONST_005 必須項目①）

| # | ファイル | 種別 | 変更概要 |
|---|---------|------|---------|
| F1 | `apps/web/src/lib/fetch/transport.ts` | 編集 | (a) `resolveApiFetch` に fail-closed: `environment` が未注入(`unknown`)のとき localhost フォールバックを禁止し throw。(b) `describeTransport(t): ApiTransportDescriptor` を新規 export（診断ラベル生成・localhost リテラルを新規焼き込みしない） |
| F2 | `apps/web/src/lib/env.ts` | 編集 | `getEnvironmentResolution(rawEnv?): { environment: "local"\|"staging"\|"production"; explicit: boolean }` を新規 export。`getEnvironment` は後方互換のため不変 |
| F3 | `apps/web/src/lib/fetch/errors.ts` / `transport.ts` | 編集 | (a) `FetchAuthedError` に任意 readonly `transport?: ApiTransportDescriptor` を追加。(b) `ApiTransportError`（transport 接続失敗を診断付きで包む）を `transport.ts` で新規 export |
| F4 | `apps/web/src/lib/fetch/authed.ts` | 編集 | transport 解決ラベルを `describeTransport` で作り、`FetchAuthedError`（非2xx）へ `transport` メタを付与。fetch throw は `fetchViaApiTransport` が `ApiTransportError` に wrap。`getEnvironmentResolution` で fail-closed を配線 |
| F5 | `apps/web/src/lib/server-fetch/safe-fetch.ts` | 編集 | `logServerFetchFailure` に `transportKind`/`baseHost` を追加出力。error の `transport` から診断メタを読み取る `transportFromError(err)` ヘルパを追加 |
| F6 | `scripts/diagnose-profile-session.sh` | 編集 | 実機ログ確認手順の echo に「`transportKind`/`baseHost` を `wrangler tail` で確認する」案内を追加（read-only・冪等） |

テストファイル:

| # | ファイル | 種別 | 追加ケース |
|---|---------|------|-----------|
| T1 | `apps/web/src/lib/fetch/transport.spec.ts` | 編集 | fail-closed（explicit=false × binding/baseUrl 無 → throw）、`describeTransport`（service-binding / http の baseHost 抽出） |
| T2 | `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts` | 編集 | service-binding 優先で localhost 不到達、staging explicit でも binding なし時の挙動 |
| T3 | `apps/web/src/lib/fetch/authed.spec.ts` | 編集 | `FetchAuthedError.transport` に transportKind/baseHost が乗る、fetch throw 時 `ApiTransportError.transport` に診断が乗る |
| T4 | `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | 編集 | `server_fetch_failed` ログに transportKind/baseHost が含まれる、診断メタ無し error でも従来形を維持 |
| T5 | `apps/web/src/lib/__tests__/env.spec.ts` | 編集 | `getEnvironmentResolution`: enum 明示 → explicit=true、未注入/不正 → `{local,false}` |

---

## 5. 主要シグネチャ（CONST_005 必須項目②）

```ts
// F1: transport.ts
export interface ApiTransportDescriptor {
  readonly transportKind: "service-binding" | "http";
  readonly baseHost: string; // service-binding は "service-binding.local"、http は new URL(baseUrl).host
}
export function describeTransport(transport: ApiTransport): ApiTransportDescriptor;

// resolveApiFetch のシグネチャ拡張
export interface ApiTransportEnv {
  API_SERVICE?: { fetch: typeof fetch } | undefined;
  baseUrl?: string | undefined;
  environment?: "local" | "staging" | "production" | undefined;
  environmentExplicit?: boolean | undefined; // 追加: ENVIRONMENT が enum 3値で明示注入されたか
  isTest?: boolean | undefined;
}
// 改修後の step4: localhost フォールバックは (environment === "local" && environmentExplicit === true) のときのみ許可。
// environmentExplicit !== true（未注入/不正/省略）のときは localhost に行かず、step5 の throw（fail-closed）へ。

// F2: env.ts
export function getEnvironmentResolution(
  rawEnv?: RawEnv,
): { environment: "local" | "staging" | "production"; explicit: boolean };
// explicit = rawEnv["ENVIRONMENT"] が "local"|"staging"|"production" に厳密一致するか。
// 不一致/未定義時は { environment: "local", explicit: false }。

// F3: errors.ts
export class FetchAuthedError extends Error {
  readonly status: number;
  readonly bodyText: string;
  readonly transport?: ApiTransportDescriptor;
  // 既存 constructor は後方互換。診断メタは optional 第3引数で付与。
}
export class ApiTransportError extends Error {
  readonly transport: ApiTransportDescriptor;
  readonly cause?: unknown;
}
```

### 入力・出力・副作用（CONST_005 必須項目③）
- `describeTransport`: 純関数。副作用なし。入力 `ApiTransport`、出力 `ApiTransportDescriptor`。
- `getEnvironmentResolution`: 入力 `RawEnv`（省略時 `readRawEnv()`）、出力 environment + explicit。副作用なし。
- `resolveApiFetch`（改修）: 副作用なし。fail-closed 時は throw（`apps/web/src/app/error.tsx` の error boundary が補足）。
- `safe-fetch.ts` の `logServerFetchFailure`: 副作用 = `console.error("server_fetch_failed", {...})`。**個人情報・secret・memberId・cookie を出力しない**（host とステータスのみ）。

---

## 6. 不変条件（CLAUDE.md 準拠）

1. 既存 API endpoint surface（`/me` path・shape・status 体系）を変更しない。apps/api 非接触（diff 空が DoD）。
2. D1 直接アクセス禁止（不変条件 #5）。apps/web から D1 binding を触らない。
3. env 参照は `apps/web/src/lib/env.ts` の公開アクセサ経由のみ（`process.env` 直接参照禁止）。認証境界は fail-closed を優先。
4. **`127.0.0.1` / `localhost` / `8787` / `8888` の新規リテラル焼き込み禁止**（`scripts/verify-no-localhost-bake.sh` の grep gate）。`describeTransport` は既存定数を `new URL().host` で抽出するのみ。既存 `// localhost-allow:local-fallback` コメント規約は維持。
5. 不変条件 #11: `/me/*` は `session.user.memberId` のみ参照し、memberId を response / ログに露出しない。ログには transport host とステータスのみ。
6. OKLch トークン正本（本タスクは NON_VISUAL ゆえ UI / 色変更なし）。
7. 新規 test ファイルは `*.spec.{ts,tsx}` のみ。
8. `wrangler` 直叩き禁止（`bash scripts/cf.sh` 経由）。secret 実値・トークンを出力しない。

---

## 7. テスト方針（CONST_005 必須項目④）

- TDD: F1-F5 各々に対応する spec を RED → GREEN。
- 既存テスト（transport.spec / transport-select / authed.spec / safe-fetch.spec / env.spec）の**回帰ゼロ**を維持（後方互換シグネチャ）。
- focused run（jsdom）。実機 fetch はモック。

## 8. ローカル実行・検証コマンド（CONST_005 必須項目⑤）

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/__tests__/transport-select.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts \
  apps/web/src/lib/__tests__/env.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-no-localhost-bake.sh --src-only
bash -n scripts/diagnose-profile-session.sh
git diff --stat -- apps/api   # 空であること（apps/api 非接触）
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/profile-session-transport-observability-fail-closed
node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/profile-session-transport-observability-fail-closed
```

## 9. 完了条件（DoD / CONST_005 必須項目⑥）

- [ ] typecheck / lint green
- [ ] focused vitest（T1-T5）green・既存回帰ゼロ
- [ ] `verify-no-localhost-bake --src-only` green（新規 localhost/8787/8888 リテラル 0）
- [ ] `apps/api` diff 空（API surface 非接触）
- [ ] `server_fetch_failed` ログに `transportKind` / `baseHost` / `status` が出力される
- [ ] fail-closed: `environmentExplicit=false` × binding/baseUrl 無 → throw（localhost 不到達）の test green
- [ ] **（staging 実機 / user-gated 実行）** deploy 後 `wrangler tail`（`bash scripts/cf.sh` 経由）で `server_fetch_failed` の `{transportKind, baseHost, status}` を観測し、`baseHost` が `service-binding.local`（localhost でない）であることと真因ステータス（410/5xx/transport）を確定。手順は Phase 11 / `diagnose-profile-session.sh` に記載。

---

## 10. スコープ外（CONST_007 例外明示）

| 事象 | 理由 / 対応先 |
|------|------|
| 確定後の本格修正（410 復帰導線 / 5xx の apps/api 根治 / transport 運用是正） | 真因が staging 実機で確定するまで方針を決められない（CONST_007 例外①: 合意未済の仕様分岐）。Phase 12 で未タスク化。既存 issue #1189-1192 と重複チェックする |
| 既存 6 WF（profile-session-fetch-failure-investigation 等）の commit / deploy | それぞれ user-gated（CONST_007 例外②: 外部運用）。本タスクは dev 取込済みコードへの追加差分 |
| ブラウザ拡張のコンソールノイズ（Sentry / content.js / 127.0.0.1:8888） | 自社外。`sentry-extension-noise-filter-spec` WF が別途存在 |

## 11. タスク分解（今回 1 サイクル完結 / CONST_007）

| タスク | 領域 | 種別 | 並列性 | 概要 |
|--------|------|------|--------|------|
| T01 | `apps/web/src/lib/fetch`（transport/errors/authed） | NON_VISUAL | レーンA | fail-closed（resolveApiFetch + environmentExplicit）+ describeTransport + 診断メタ付与 + ApiTransportError |
| T02 | `apps/web/src/lib`（env） | NON_VISUAL | レーンA(直列前段) | `getEnvironmentResolution` 追加。T01 が依存するため A 内で先行 |
| T03 | `apps/web/src/lib/server-fetch`（safe-fetch） | NON_VISUAL | レーンB | `server_fetch_failed` ログに transportKind/baseHost 追加 |
| T04 | `scripts/`（diagnose 拡張） | NON_VISUAL | レーンC | transport 確認手順 echo 追加（read-only） |

T02→T01 は同一レーン直列（env が transport の入力）。T03/T04 は独立並列。

## 12. 正本順位（衝突時）

1. `_shared-context.md`（本ファイル / SSOT）
2. `index.md`（SCOPE）
3. `outputs/phase-{1,2,3}/phase-N.md`（設計の正本）
4. `outputs/phase-5/task-0N-*.md`（実装仕様書本体）
5. `docs/00-getting-started-manual/specs/*.md`（`02-auth.md` / `13-mvp-auth.md`）
