# Phase 1: 要件定義

`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation（VISUAL） |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

staging `/profile`（マイページ）で、ログイン済み（「万壽本大嗣・管理者」）にもかかわらず Server Component が API Worker の `GET /me` 取得に失敗し「セッション情報を取得できませんでした / 時間をおいて再読み込みしてください / 再読み込み」エラーバナーを表示する事象について、観測事象・真因仮説（H1〜H6）・受入条件（AC-1〜8）・対象 inventory・命名規則・実装区分判定根拠を確定し、後続フェーズが調査・観測性向上を実装可能な粒度の前提を固定する。

### 実装区分の判定根拠（CONST_004 準拠）

- ユーザー指定スコープは **「調査・原因特定のみ（診断中心）」**。
- ただし「マイページが取得できない原因を**確認可能にする**」目的の達成には、現状 410/5xx/transport 失敗（FAILED）を一律「時間をおいて再読み込み」へ集約して root cause を隠蔽している観測性欠如（H6）を是正する**コード変更（エラーコード区別表示・構造化ログ・診断スクリプト）が必須**。
- よって CONST_004 に従い、純粋な docs-only ではなく **診断・観測性向上のコード変更を含む実装仕様書**として作成する。
- 本格的な根本修正（410 復帰フロー / 5xx 原因の session-resolver・API 修正 / transport デプロイ齟齬の運用是正 / 管理者 `/profile` 専用 UX）は、**真因が staging 実機調査で確定するまで修正方針を確定できない**ため CONST_007 例外条件①（合意未済の仕様分岐）に該当し、Phase 12 で未タスク化する（ユーザーが「調査・原因特定のみ」を選択済み = 分離承認済み）。

## 実行タスク

### 1.1 観測事象

| 項目 | 値 |
|------|------|
| 環境 | staging（`https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile`） |
| 画面 | 会員マイページ `/(member)/profile`（サイドバー「マイページ」active） |
| ログイン状態 | 左下アカウント「万壽本大嗣・管理者」でログイン済み（admin かつ member 想定） |
| 表示 | エラーバナー「セッション情報を取得できませんでした」/ detail「時間をおいて再読み込みしてください。」/ リンク「再読み込み」 |
| 対応分岐 | `apps/web/app/(member)/profile/page.tsx:66-74` の**デフォルト失敗分岐**（`MEMBER_SESSION_404` 以外の `!meResult.ok`） |

画像症状「時間をおいて再読み込みしてください。」は、`/me` が **非404 かつ非redirect** で返ったこと（`page.tsx:66-74` のデフォルト分岐に到達したこと）を意味する。

ブラウザコンソールの以下は**本件と無関係**（スコープ外）:
- `[Sentry] You cannot use Sentry.init() in a browser extension`（ブラウザ拡張バンドル由来・自社外）
- `content.js POST http://127.0.0.1:8888/ net::ERR_CONNECTION_REFUSED`（ブラウザ拡張（1Password 等）由来・自社外）
- `Permissions-Policy header: Unrecognized feature: 'browsing-topics'`（Chromium 標準警告・無害）

### 1.2 真因仮説マトリクス（調査の核心）

`/profile` Server Component は `safeServerFetch(() => fetchAuthed<MeSessionResponse>("/me"), { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] })` で `/me` を取得する（`apps/web/app/(member)/profile/page.tsx:41-44`）。エラー分岐は次の 2 つだけ:

- `meResult.error.code === "MEMBER_SESSION_404"` → 「アカウント情報を確認できませんでした。再ログインしてください。」+ 再ログイン CTA（`page.tsx:53-63`）
- それ以外（非2xx 全般 / transport 失敗）→ **「時間をおいて再読み込みしてください。」+ 再読み込み（`page.tsx:66-74`）← 画像の症状**

`/me` の API 側分岐（`apps/api/src/middleware/session-guard.ts`）と web 側帰結の突き合わせ:

| API 応答 | 条件 | web 側の帰結 | エラーバナー文言 | 画像症状と一致 |
| --- | --- | --- | --- | --- |
| 401 UNAUTHENTICATED | session 未解決 / identity or status 不在（`session-guard.ts:78-79`, `89-92`） | `fetchAuthed` が 401→`AuthRequiredError` throw → `rethrowOn` で rethrow → **`/login?redirect=/profile` へ redirect**（`page.tsx:46-47`） | （バナー無し・redirect） | **✗ 不一致** |
| 404 NOT_FOUND | route 解決層・末尾スラッシュ非マッチ（既存 WF `profile-reload-session-404-fix` が対処済み） | `MEMBER_SESSION_404` → 「再ログイン」分岐 | 再ログイン CTA | **✗ 不一致** |
| 410 DELETED | `member_status.is_deleted=1`（`session-guard.ts:95-100`） | `FetchAuthedError(410)` → `MEMBER_SESSION_410` → デフォルト分岐 | 時間をおいて再読み込み | **✓ 一致** |
| 5xx | session-resolver / D1 / ハンドラ例外 | `FetchAuthedError(5xx)` → `MEMBER_SESSION_5xx` → デフォルト分岐 | 時間をおいて再読み込み | **✓ 一致** |
| transport 失敗 | service-binding 未応答 / 旧 bundle / network（message に 3桁が無く `statusFromError`→null。`safe-fetch.ts:11-19`） | `MEMBER_SESSION_FAILED` → デフォルト分岐 | 時間をおいて再読み込み | **✓ 一致** |

#### 仮説一覧（H1〜H6）

| ID | 仮説 | 症状一致 | 一次切り分け方法 |
| --- | --- | --- | --- |
| H1 | 既存 6 WF の staging 未デプロイ（古い bundle が残存） | △（主要修正は dev マージ済みだが staging 反映状態は要確認） | staging deploy 版数 / `/me` を直 https で叩く |
| H2 | 401（session 未解決 / identity・status 不在） | ✗（redirect されバナーにならない） | `/me` の HTTP status を DevTools / 診断スクリプトで確認 |
| H3 | **410（`member_status.is_deleted=1`）→ `MEMBER_SESSION_410`** | ✓ | `/me` status=410 か / 当該 member の `member_status.is_deleted` を D1 で確認（read-only） |
| H4 | **5xx（session-resolver / D1 / ハンドラ例外）→ `MEMBER_SESSION_5xx`** | ✓ | `/me` status=5xx か / API worker ログ |
| H5 | **transport 失敗（service-binding 未応答 / 旧 bundle / network）→ `MEMBER_SESSION_FAILED`** | ✓ | service-binding 経由応答確認 / `MEMBER_SESSION_FAILED` か `_410`/`_5xx` か |
| H6 | **観測性欠如（410/5xx/FAILED を一律「時間をおいて再読み込み」に集約）= 診断不能の主因** | 主問題 | `page.tsx:66-74` の分岐 |

#### 切り分けの結論（一次トリアージ）

- 画像症状は「時間をおいて再読み込みしてください。」= **`MEMBER_SESSION_404` 以外のデフォルト分岐**（`page.tsx:66-74`）。
- これは `/me` が **非404 かつ非redirect** で返ったことを意味するため、**画像症状と一致するのは H3（410）/ H4（5xx）/ H5（transport FAILED）の 3 つ**に絞られる。
- **H2（401）は web 側で `/login` へ redirect されバナーにならない**ため一次的に除外。**404 は「再ログイン」CTA 分岐**になるため画像症状（再読み込みバナー）と矛盾し一次的に除外。
- どれが真かは観測性が無いため現状切り分け不能 → これが H6（観測性欠如）を是正する動機。最有力は **H3 / H4 / H5**。

### 1.3 受入条件（AC）

| ID | 受入条件 |
|----|----------|
| AC-1 | staging 実機で `/profile` アクセス時の `/me` HTTP status（404/410/5xx/transport 失敗）と web 側 error code（`MEMBER_SESSION_*`）を確定し、H1〜H5 のいずれかへ収束した結論を `outputs/phase-11/manual-test-result.md` に根拠付きで記録する |
| AC-2 | 管理者アカウント（万壽本大嗣・管理者）が member identity/status を保持するか、session-resolver が staging で Auth.js cookie を解決できるかを read-only で確認し、管理者 `/profile` の期待挙動を結論として明記する |
| AC-3 | `/profile` のエラー分岐が `MEMBER_SESSION_410` / 5xx 族 / `MEMBER_SESSION_FAILED` を区別し、root cause を開発者が判別できる（ユーザー向け文言は安全側を維持しつつ、原因コードを `data-*` 属性 or ログで可視化）。401→redirect・404→再ログイン CTA の既存挙動は回帰なし |
| AC-4 | `/me` 取得失敗時に server-side で `status`/`code`/`path` を構造化ログ出力する（memberId 等の個人情報は出さない）。技術文字列はユーザー画面に露出しない |
| AC-5 | 診断スクリプト `scripts/diagnose-profile-session.sh`（read-only・冪等）が存在し、staging `/me` の status 確認・env/secret parity 確認・deploy 版数確認の手順を 1 本で再現できる |
| AC-6 | `/me` のレスポンス shape・path・status 体系、D1 schema、Google Form 仕様、認証境界（fail-closed）を一切変更しない |
| AC-7 | 区別分岐・ログ・診断の挙動を `*.spec.{ts,tsx}` で固定し、`mise exec -- pnpm typecheck` / `pnpm lint` / 対象 vitest がすべて PASS |
| AC-8 | 真因確定後に必要となる本格修正を Phase 12 で未タスク化し、配置先・実施時期・依存を明記する（0 件にしない） |

### 1.4 既存コードの命名規則（FB-01 / FB-SDK-07-4 遵守）

| 観点 | 既存規則 | 本タスクでの遵守 |
|------|----------|------------------|
| web fetch | `fetchAuthed` / `safeServerFetch`、error code `MEMBER_SESSION_<status>` / `MEMBER_SESSION_FAILED`（`codePrefix`_`<status>` 生成・status 無→`_FAILED`。`safe-fetch.ts:34-37`） | error code 分岐は `MEMBER_SESSION_410` / 5xx 族 / `MEMBER_SESSION_FAILED` 文字列で判定 |
| error UI | `SectionError`（`section-error` primitive）。CTA は `actionHref`/`actionLabel` の既存 optional props を使う | 区別表示は `SectionError` props 拡張 + `data-*` 属性に留める。新規 primitive 禁止 |
| script | `scripts/*.sh`（既存 `diagnose-auth-secret-parity.sh` / `smoke-staging-me.sh` と同系の命名・read-only 規約に揃える。既存スクリプトを再利用できる場合は再利用） | `scripts/diagnose-profile-session.sh`（read-only・冪等） |
| test | `*.spec.{ts,tsx}`（`*.test.*` 禁止） | 区別分岐・ログを `*.spec.{ts,tsx}` で固定 |

### 1.5 対象 inventory（current code anchor）

| 系統 | パス | 役割 / 調査観点 |
| --- | --- | --- |
| profile page (web) | `apps/web/app/(member)/profile/page.tsx` | `/me` 結果分岐（53-63=404再ログイン / 66-74=デフォルト「時間をおいて再読み込み」）。D1 の改修対象 |
| error UI (web) | `apps/web/src/components/member/SectionError.tsx` | `title/detail/retryHref/actionHref/actionLabel` props。`data-*` 可視化の拡張対象 |
| safe fetch (web) | `apps/web/src/lib/server-fetch/safe-fetch.ts` | `normalizeError`（`codePrefix_<status>` 生成 / status 無→`_FAILED`）。`STATUS_FROM_MESSAGE=/\bfailed:?\b.*\b(\d{3})\b/`。D2 ログ挿入候補 |
| authed fetch (web) | `apps/web/src/lib/fetch/authed.ts` | 401→`AuthRequiredError` / 非2xx→`FetchAuthedError(status,text)`。cookie 転送 |
| transport (web) | `apps/web/src/lib/fetch/transport.ts` | service-binding 優先 → baseUrl → local fallback → 非local で throw |
| env (web) | `apps/web/src/lib/env.ts` | `getAuthEnv()`（`API_SERVICE`/`INTERNAL_API_BASE_URL`）。read-only 確認 |
| me route (api) | `apps/api/src/routes/me/index.ts` | `GET /me` ハンドラ（200）。read-only |
| session guard (api) | `apps/api/src/middleware/session-guard.ts` | 401（78-79, 89-92）/ 410（95-100）判定。真因切り分けの中核 |
| session resolver (api) | `apps/api/src/middleware/me-session-resolver.ts` | Auth.js cookie/JWT → session 解決。staging 動作の確認対象 |
| me mount (api) | `apps/api/src/index.ts` | `/me` mount + `notFound`。read-only |
| web wrangler | `apps/web/wrangler.toml` | `[env.staging]` に `API_SERVICE`(service)/`INTERNAL_API_BASE_URL` 設定済みを確認（H5 切り分け） |
| 診断スクリプト | `scripts/diagnose-profile-session.sh`（**新規**） | staging `/me` status / parity / deploy 版数 |
| 既存ラッパー | `scripts/cf.sh` | Cloudflare CLI（read-only D1 / whoami / deploy 版数）。直 wrangler 禁止 |

### 1.6 既存関連ワークフローとの関係（重複回避・真因引き継ぎ）

すべて `implemented_local_evidence_captured`（ローカル実装済み・一部 dev マージ済み・未デプロイ要素あり）。本タスクは **これらが解決済みの真因（404・loopback・resolver 未接続・safeServerFetch 化）を「解決済み前提」として引き継ぎ、なお残るデフォルト分岐（410/5xx/FAILED）の真因を切り分ける**ことで重複しない。

| 既存 WF | 解決済み真因 | 本タスクでの扱い |
| --- | --- | --- |
| `profile-reload-session-404-fix` | `/me` 末尾スラッシュ 404（route 解決層） | 404 は「再ログイン」分岐 = 画像症状と不一致。解決済み前提で除外 |
| `staging-api-url-and-session-recovery` | service-binding loopback 404 / localhost 焼込み | service-binding は wrangler staging に設定済みを確認。応答性は H5 で再確認 |
| `06b-A-me-api-authjs-session-resolver` | Auth.js cookie session resolver 未接続 | resolver は実装済み。staging での実動作を AC-2 で確認 |
| `login-stale-link-and-profile-me-safe-fetch` / `issue-879-...` | `/me` 失敗の throw 伝播 → `safeServerFetch`+`SectionError` 化 | 現状の集約分岐（`page.tsx:66-74`）はこの成果。本タスクはここに観測性を足す |
| `admin-member-detail-status-404-fix` | orphan `member_status`（identity 有・status 無） | 同種データ不整合は H2(401) 側。本症状(410/5xx)とは別経路だが調査で参照 |

> dev に現状マージ済みであることを確認した anchor: `page.tsx` は `safeServerFetch`+`MEMBER_SESSION_404` 分岐済み（`page.tsx:41-74`）、`transport.ts` は service-binding 優先 + 非local throw 済み（`transport.ts:27,40-42`）、`/me` proxy route と `me-session-resolver.ts` が存在。

## 完了条件

- [x] 観測事象（staging /profile デフォルト分岐 / コンソールノイズのスコープ外分離）を anchor 付きで確定
- [x] 真因仮説マトリクス H1〜H6 と一次トリアージ（H3/H4/H5 が画像症状一致・H2/404 除外）を明示
- [x] AC-1〜AC-8 を逐語列挙
- [x] 既存命名規則・対象 inventory・既存関連 WF との関係を記録
- [x] 実装区分判定根拠（CONST_004 / CONST_007 例外①）を明記

## 成果物

- `outputs/phase-1/phase-1.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | セッション / Auth.js / `/me` 解決の正本 |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | authGateState / session 境界 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` レスポンス項目（不変であることの確認） |

- `_shared-context.md`（SSOT）
- `index.md`（SCOPE）

## 統合テスト連携

Phase 4 で I/O 契約（`/me` status × web error code 対応表 / 診断スクリプト I/O / 区別分岐・ログの期待値）を確定し、Phase 5/6 で D1/D2/D3 のテストへ落とし込む。Phase 11 は staging 実機での `/me` status 切り分けに特化する。
