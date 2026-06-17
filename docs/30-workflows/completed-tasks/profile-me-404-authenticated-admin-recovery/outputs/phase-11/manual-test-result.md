# Phase 11: 手動テスト計画 + 証跡（staging 復旧 + data-cause 確定）

## タスク種別（冒頭宣言）

| 項目 | 値 |
| --- | --- |
| taskType | **implementation**（NON_VISUAL のコード変更） |
| visualEvidence | **VISUAL_ON_EXECUTION**（復旧最終証跡のみ visual） |
| workflow_state | **`implemented_local_runtime_pending`** |
| implementation_mode | `edit`（error-handler / safe-fetch / diagnose-profile-session 編集 + api-cd.yml 新規） |
| **証跡の主ソース（自動テスト名 / 件数）** | T01 `apps/api/src/middleware/error-handler.spec.ts`（notFound 構造化ログ payload: method+path allowlist・secret 非含有）／ T03 `apps/web/src/lib/server-fetch/safe-fetch.spec.ts`（route-404 → `server_fetch_failed` transport descriptor 記録）／ T04 `bash -n scripts/diagnose-profile-session.sh`（構文 + redaction grep）／ T02 `.github/workflows/api-cd.yml` YAML 構文検証。件数は本 wave で確定。API 1 PASS、web 12 PASS、shell syntax PASS、YAML 構文 OK |
| 証跡の主ソース（staging 復旧: AC-1/AC-3） | 拡張 `bash scripts/diagnose-profile-session.sh` stdout（`/me/healthz` vs `/me` route 存在差分 + deploy parity）+ minted-cookie 認証 `GET {API}/me` 200 + ログイン済みブラウザの `/profile` 正常描画 + 復旧後 screenshot |
| 証跡の主ソース（非復旧時: data-cause 確定） | API notFound 構造化ログ（`UBM-1404 GET /me`）/ web `server_fetch_failed {transportKind, status}` の `bash scripts/cf.sh` tail 読解 |
| **スクリーンショットを作らない / 復旧後に作る理由** | (1) 本 WF のコード変更 T01〜T04 は **NON_VISUAL**（API ログ / CI/CD / 診断 script / web transport ログ層に閉じ、`session-error-display.ts` / `SectionError` / `/profile` page.tsx を非接触）で UI 描画を変えない＝静的 UI contract screenshot は差分ゼロで無意味。(2) 唯一意味のある visual 証跡は **復旧後の `/profile` 正常描画**だが、これは staging 認証ログインを要し（認証必須ルート）user-gated。(3) `implemented_local_runtime_pending` の本 wave はlocal実装は完了済みだが staging deploy は未実施のため screenshot は計画のみ・pending。現象 screenshot はユーザー提供済（文中参照）。 |

> **visualEvidence = VISUAL_ON_EXECUTION 宣言**: 現象 screenshot は**ユーザー提供済み**（2026-06-13 10:38 JST・staging `/profile`・`MEMBER_SESSION_404`「セッション情報を取得できませんでした / アカウント情報を確認できませんでした。再ログインしてください。」+ CTA「再ログイン」。文中参照・リポジトリ非配置）。復旧後の staging 認証 runtime screenshot `outputs/phase-11/screenshots/profile-me-404-recovery-staging.png` は認証必須ルートのため **user-gated**（Claude Code は staging 認証ログインして取得しない）。`implemented_local_runtime_pending` の本 wave では PNG を一切取得・配置しない（`screenshots/` は `.gitkeep` のみ）。

## 実施情報

| 項目 | 値 |
| --- | --- |
| 実施 wave | `implemented_local_runtime_pending`（本 wave はlocal証跡まで実施済み。RT-A〜RT-E のstaging runtime実施は user-gated・実結果 pending） |
| ブランチ | `fix/profile-me-404-authenticated-admin-recovery` |
| 起点 | `origin/dev`（#1237 transport 多段フォールバック含む） |
| 対象環境 | staging（`ubm-hyogo-web-staging.daishimanju.workers.dev` / `ubm-hyogo-api-staging.daishimanju.workers.dev`） |
| 現象 URL | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile` |
| 主証跡ソース | 上表「証跡の主ソース」参照（自動テスト + staging probe + 復旧後 screenshot(user-gated)） |

## 仕様判断根拠

- **NON_VISUAL 宣言の根拠**: SSOT §0・§4。T01=API notFoundHandler 構造化ログ（応答 body/status 不変）／ T02=apps/api 自動 CD 新設（YAML）／ T03=web `server_fetch_failed` ログ強化（UI 文言・分岐・shape 不変・AC-6）／ T04=診断 script 拡張（read-only stdout）。いずれも `/profile` 描画に touch しない。
- **観測 404 が `MEMBER_SESSION_404` 専用文言である根拠**: F-1/F-2（`session-error-display.ts:24-31` が `GET /me` の HTTP 404 のときのみ生成）。F-3 により 401 なら `/login?redirect=/profile` redirect・error 画面非表示ゆえ、画面表示そのものが 404 を確定させる。
- **`/me` が 200 を返すべき根拠**: F-4（valid JWT・新規ログイン直後）/ F-5（ログイン成功＝D1 に identity + consented status 存在が逆算で確定）/ F-6（api `/me` ルートは有効認証下で 404 を返さない）。よって観測 404 は notFoundHandler（route 未マッチ・S1）または web↔api ドリフト（S2）が真因クラス（F-7/F-8）。
- **api CD 新設が S1 根治である根拠**: F-8（apps/api に自動 CD ワークフローが存在せず手動 deploy 依存）。

## 現象 screenshot（ユーザー提供画像の文中参照）

- 参照対象: staging `/profile` の「セッション情報を取得できませんでした / アカウント情報を確認できませんでした。再ログインしてください。」エラーバナー + CTA「再ログイン」（ユーザー提供画像・2026-06-13 10:38 JST）。
- 表示文言は `session-error-display.ts` の `MEMBER_SESSION_404` 分岐専用文言（F-1）。これにより (a) 401 ではない（401 なら `/login` redirect・F-3）(b) transport throw（`MEMBER_SESSION_FAILED`）でもない、が確定。
- 残るサブ原因は S1（api-staging deploy/route ドリフト）/ S2（service-binding 経路の path/version 不整合）/ S3（401/410 系・スコープ外候補）の 3 つ。本 WF は S1/S2 のいずれでも復旧する多層防御（T01〜T04）を deploy し、確定は RT-E で行う。

## staging 復旧 + data-cause 確定手順（RT-A〜RT-E・すべて user-gated・実結果 pending）

各手順は「コマンド / 前提 / 期待結果 / 実結果」形式。本 wave では手順を固定し、staging runtime 実結果は pending。

### RT-A: dev 反映後の apps/api staging deploy（T02 api-cd 経由）

| 項目 | 内容 |
| --- | --- |
| 前提 | T01〜T04 実装済・Phase 9 ゲート全 PASS・work branch が `dev` へマージ済（または検証用 work branch 直接 deploy をユーザー明示） |
| 手順 | `dev` 反映で `api-cd`（`.github/workflows/api-cd.yml`）が発火し `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` 実行。手動の場合も `scripts/cf.sh` 経由のみ（`wrangler` 直叩き禁止・AC-7） |
| 期待結果 | api-staging worker が現行 `/me` ルート契約を持つ新 bundle へ更新。api-cd deploy 後 smoke gate（`/me/healthz` 200 + minted-cookie 認証 `/me` 200）PASS |
| 実結果 | **pending（user-gated）** |

### RT-B: 拡張後 diagnose script で route 存在差分 + parity 取得

| 項目 | 内容 |
| --- | --- |
| 前提 | RT-A 完了。T04 拡張済 `scripts/diagnose-profile-session.sh`（read-only・冪等・secret/cookie/memberId 非出力） |
| 手順 | `bash scripts/diagnose-profile-session.sh` を実行。(a) `${API_BASE}/me/healthz` と `${API_BASE}/me` の route 存在差分、(b) web↔api deploy version parity を確認 |
| 期待結果 | `/me/healthz` が 200 かつ未認証 `/me` が 401（route 存在し認証境界到達）。`/me` が 404 のままなら route 未マッチ（S1）。version parity が RT-A deploy と一致。再実行で同一出力（冪等・AC-5） |
| 実結果 | **pending（user-gated・T04 実装後）** |

### RT-C: minted-cookie 認証で `GET {API}/me` 200 を確認

| 項目 | 内容 |
| --- | --- |
| 前提 | RT-A/RT-B 完了。`scripts/smoke/mint-staging-session-cookie.mts` 発行の認証 cookie（user-gated・cookie 実値は本ファイル**非記載**） |
| 手順 | minted-cookie を `Cookie` ヘッダに付与し `GET ${API_BASE}/me` 実行（api-cd smoke gate と同 probe・`scripts/smoke/runtime-admin-web.sh` 系資産流用） |
| 期待結果 | 認証 `/me` が **200**（AC-1 の API 側担保）。401/410 が返る場合は data-cause が認証/data 系（S3）= スコープ外候補 |
| 実結果 | **pending（user-gated・認証必須）** |

### RT-D: ログイン済みブラウザで `/profile` 正常描画確認 + screenshot

| 項目 | 内容 |
| --- | --- |
| 前提 | RT-A〜RT-C 完了。ユーザーが staging にログイン済み（認証セッションは user 保有・Claude Code は取得しない） |
| 手順 | ブラウザで `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile` を開き、`MEMBER_SESSION_404` バナーが消えてマイページ本体（会員情報セクション）が描画されることを確認。復旧後 screenshot を `outputs/phase-11/screenshots/profile-me-404-recovery-staging.png` として保存 |
| 期待結果 | 「セッション情報を取得できませんでした」バナー非表示、`/me` 由来の会員情報が正常描画（復旧確認 = 本 WF の最終証跡・AC-1） |
| 実結果 | **pending（user-gated・認証必須）** |

### RT-E: 復旧しない場合 — 構造化ログで S1〜S3 を確定する判定フロー

| 項目 | 内容 |
| --- | --- |
| 前提 | RT-D で復旧が確認できない場合のみ実施。T01 統合により API notFound ログに `method`+`path`、web に `transportKind` が出力 |
| 手順 | `bash scripts/cf.sh tail`（api / web 双方）で `/profile` リロード時の構造化ログ（API: `UBM-1404 {method, path}` / web: `server_fetch_failed {transportKind, status}`）を読み、下の判定フローで S1〜S3 を排他的に確定 |
| 期待結果 | S1〜S3 のいずれか **1 つ**に確定し、根拠ログ行とともに本ファイル「data-cause 確定結論」欄（user-gated runtime 後に追記）へ記録（AC-2/AC-9） |
| 実結果 | **pending（user-gated・RT-D 非復旧時のみ）** |

#### data-cause 確定フロー（AC-2 の核心）

```
API notFound ログ / web server_fetch_failed ログの内容は？
├─ API notFound ログに「UBM-1404 GET /me」が出力されている
│    ──→ ✓ S1 確定（api-staging worker が GET /me を route できていない＝deploy/route ドリフト）
│         → T02 の api CD deploy で現行ルートが入れば復旧。RT-A 後の RT-B で /me が 401 化を再確認
├─ API notFound ログに /me が無く、web server_fetch_failed の transportKind が service-binding
│    ──→ ✓ S2 確定（service-binding 経由で想定外 version / path へ到達）
│         → RT-A 後の api CD deploy で binding 先 version が揃えば復旧
└─ 認証 /me が 401（session 未解決/identity・status 欠落）または 410（is_deleted=1）
     ──→ ✓ S3 確定（/me 404 ではなく member データ/認証境界事象＝本 WF スコープ外）
          → admin /profile 専用 UX = Issue #1192 / environmentExplicit fail-closed = Issue #1234（FU-001）へ委譲
          → unassigned-task/ に格下げ記録（Phase 12 unassigned-task-detection と連動）
```

> 判定は `API notFound ログの method+path`（route 未マッチか）× `web transportKind`（service-binding/http）× `認証 /me の status`（200/401/410）の 3 軸で排他的に 1 つへ収束する。F-3/F-6 により 401 は redirect・410 は別文言ゆえ観測 404 とは整合しない＝S3 は data-cause が 401/410 と判明した場合のみ。

### data-cause 確定結論（user-gated runtime 後に追記）

- 結論: **pending（`implemented_local_runtime_pending` では未確定。RT-D 復旧確認または RT-E 判定フローの実施後に S1〜S3 のいずれかと根拠ログ行を追記する）**

## screenshot 計画

| 証跡 | パス | 状況 |
| --- | --- | --- |
| 現象 screenshot（ユーザー提供 2026-06-13 10:38 JST・`MEMBER_SESSION_404`） | （ユーザー提供画像・文中参照・リポジトリ非配置） | user-provided（受領済み） |
| screenshots placeholder | `outputs/phase-11/screenshots/.gitkeep` | present（ディレクトリ保持） |
| 復旧後 staging runtime screenshot | `outputs/phase-11/screenshots/profile-me-404-recovery-staging.png` | **user-gated・`implemented_local_runtime_pending` では未取得（pending）** |

## 実行記録

| 項目 | 値 |
| --- | --- |
| local 実施（本 wave） | なし（`implemented_local_runtime_pending`・ローカル実装済みのため focused vitest / `bash -n` は本 wave で取得済み） |
| staging 実施（RT-A〜RT-E） | すべて pending（user-gated） |
| 実行ログ雛形 | `outputs/phase-11/manual-smoke-log.md`（実値は user-gated 実行時に追記・secret 非記載） |

## 完了条件

- [x] 冒頭に taskType / visualEvidence=VISUAL_ON_EXECUTION / workflow_state=implemented_local_runtime_pending と「証跡の主ソース」「screenshot を作らない/復旧後に作る理由」の宣言表を記載（Feedback 4）
- [x] RT-A（api deploy）→ RT-B（route 存在差分 + parity）→ RT-C（minted-cookie 認証 `/me` 200）→ RT-D（`/profile` 正常描画 + screenshot）→ RT-E（非復旧時の S1〜S3 確定）を「コマンド/前提/期待結果/実結果(pending)」形式で記録
- [x] data-cause 確定フロー（S1: `UBM-1404 GET /me` / S2: transportKind=service-binding / S3: 401/410）を排他的に記載（AC-2）
- [x] 現象 screenshot をユーザー提供（2026-06-13 10:38 JST・`MEMBER_SESSION_404`）として文中参照
- [x] 復旧後 PNG は user-gated・`implemented_local_runtime_pending` では未取得と明記（PNG 非配置）
- [x] 実施情報・仕様判断根拠・実行記録の 4 セクション（実施情報 / 仕様判断根拠 / 現象+手順 / 実行記録）を網羅し、secret/cookie/JWT/memberId 非記載（AC-9）

## 成果物

- `outputs/phase-11/manual-test-result.md`（本ファイル）
- `outputs/phase-11/screenshots/.gitkeep`

## 参照資料

- `_shared-context.md` §1（F-1〜F-9）/ §2（S1〜S3）/ §6（AC-1〜AC-10）/ §9（観測データ・secret 非記載）
- `outputs/phase-3/phase-3.md` §3.6（Phase 11 特化宣言）
- `outputs/phase-5/task-01..04-*.md`（実装仕様書本体）
- `scripts/diagnose-profile-session.sh`（T04 拡張対象）/ `scripts/smoke/mint-staging-session-cookie.mts`・`scripts/smoke/runtime-admin-web.sh`
- `.github/workflows/web-cd.yml`（api-cd.yml 同型雛形）
- `CLAUDE.md`（`scripts/cf.sh` 規約・secret 非転記）

## 統合テスト連携

RT-D の復旧確認（または RT-E の data-cause 確定）が AC-1/AC-2 の実結果正本。S3 確定時のみ本 WF はスコープ外となり #1192/#1234 へ委譲（CONST_007 例外・Phase 12 unassigned-task-detection 連動）。実装ローカルの focused vitest（Phase 9）と合わせて Phase 12 の実装ガイド・compliance へ引き継ぐ。
