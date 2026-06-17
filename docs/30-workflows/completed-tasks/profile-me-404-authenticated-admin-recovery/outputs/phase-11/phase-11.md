# Phase 11: 最終レビュー（staging 復旧 + data-cause 確定）

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 11 / 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION（NON_VISUAL 宣言／復旧最終証跡のみ visual） |
| workflow_state | `implemented_local_runtime_pending` |
| SSOT | `_shared-context.md` §1（F-1〜F-9）/ §2（S1〜S3）/ §6（AC-1〜AC-10） |

## 目的

**本 Phase は「staging 復旧の実機検証 + 故障の data-cause（S1〜S3）の最終確定」に特化する**（Phase 3 §3.6 の特化宣言を継承）。

本 WF のコード変更 T01〜T04 は **NON_VISUAL**（API ログ／CI/CD／診断 script／web transport ログ層のみで `/profile` の UI 描画を一切変えない）。したがって実装ローカルの一次証跡は **自動テスト**であり、staging 復旧の最終証跡のみ VISUAL_ON_EXECUTION（復旧後 `/profile` 正常描画 screenshot・user-gated）。

`implemented_local_runtime_pending` の本 wave では **手順定義のみ**を行い、staging deploy 以降（RT-A〜RT-E）はすべて user-gated・実結果 pending とする。secret/cookie/JWT/memberId はどのファイルにも転記しない（AC-9）。

## 実行タスク

### NON_VISUAL 宣言

| 項目 | 値 |
| --- | --- |
| タスク種別 | **NON_VISUAL**（T01〜T04 は UI 描画不変） |
| 非視覚的理由 | T01=API notFoundHandler 構造化ログ追加（応答 body/status 不変）／ T02=apps/api 自動 CD 新設（YAML）／ T03=web `server_fetch_failed` ログ強化（UI 文言・分岐・shape 不変・AC-6）／ T04=診断 script 拡張（read-only stdout のみ）。いずれも `session-error-display.ts` / `SectionError` / `/profile` page.tsx 非接触。 |
| 主証跡ソース（実装ローカル） | T01〜T04 の focused vitest / unit spec（jsdom・node）。コードは UI 外観を変えない |
| 主証跡ソース（staging 復旧: AC-1/AC-3） | (a) `bash scripts/cf.sh` deploy 後の `bash scripts/diagnose-profile-session.sh`（拡張版）stdout、(b) minted-cookie 認証で `GET {API}/me` 200、(c) ログイン済みブラウザの `/profile` 正常描画 + 復旧後 screenshot |
| 主証跡ソース（非復旧時: data-cause 確定） | API notFound 構造化ログ（`UBM-1404 GET /me`）+ web `server_fetch_failed {transportKind, status}` の `bash scripts/cf.sh` tail 読解 |
| 代替証跡（NON_VISUAL ゆえ） | `manual-test-result.md`（証跡メタ）+ `ui-sanity-visual-review.md`（差分ゼロ宣言）+ 復旧後 staging screenshot（user-gated） |

### staging 復旧 + data-cause 確定手順（RT-A〜RT-E・すべて user-gated・実結果 pending）

各手順は「コマンド / 前提 / 期待結果 / 実結果」形式。本 wave では手順を固定し、staging runtime 実結果は pending。詳細フォーマットは `manual-test-result.md` を正本とする。

#### RT-A: dev 反映後の apps/api staging deploy（T02 api-cd 経由）

| 項目 | 内容 |
| --- | --- |
| 前提 | T01〜T04 実装済・Phase 9 ゲート全 PASS・work branch が `dev` へマージ済（または検証用に work branch を直接 deploy する判断をユーザーが明示） |
| 手順 | `dev` への反映で `api-cd`（T02 新設 `.github/workflows/api-cd.yml`）が発火し `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` を実行。手動の場合も `scripts/cf.sh` 経由のみ（`wrangler` 直叩き禁止・AC-7） |
| 期待結果 | api-staging worker が現行 `/me` ルート契約を持つ新 bundle へ更新。api-cd の deploy 後 smoke gate（`/me/healthz` 200 + minted-cookie 認証 `/me` 200）が PASS |
| 実結果 | **pending（user-gated）** |

#### RT-B: 拡張後 diagnose script で route 存在差分を取得（S1 確定の核心）

| 項目 | 内容 |
| --- | --- |
| 前提 | RT-A 完了。T04 拡張済の `scripts/diagnose-profile-session.sh` が存在（read-only・冪等・secret/cookie/memberId 非出力） |
| 手順 | `bash scripts/diagnose-profile-session.sh` を実行。(a) `${API_BASE}/me/healthz` と `${API_BASE}/me` の **route 存在差分**、(b) web↔api の deploy version parity を確認 |
| 期待結果 | `/me/healthz` が 200 かつ `/me` が未認証で 401（= route は存在し認証境界に到達）。`/me` が 404 のままなら route 未マッチ（S1）。version parity が RT-A の deploy と一致。再実行で同一出力（冪等・AC-5） |
| 実結果 | **pending（user-gated・T04 実装後）** |

#### RT-C: minted-cookie 認証で `GET {API}/me` 200 を確認

| 項目 | 内容 |
| --- | --- |
| 前提 | RT-A/RT-B 完了。`scripts/smoke/mint-staging-session-cookie.mts` で発行した認証 cookie（user-gated・cookie 実値は本ファイル非記載） |
| 手順 | minted-cookie を `Cookie` ヘッダに付与し `GET ${API_BASE}/me` を実行（api-cd smoke gate と同じ probe・`scripts/smoke/runtime-admin-*.sh` 系資産流用） |
| 期待結果 | 認証 `/me` が **200**（AC-1 の API 側担保）。401/410 が返る場合は data-cause が認証/data 系（S3）= スコープ外候補 |
| 実結果 | **pending（user-gated・認証必須）** |

#### RT-D: staging `/profile` を実ログインで再確認し正常描画 screenshot 取得

| 項目 | 内容 |
| --- | --- |
| 前提 | RT-A〜RT-C 完了。ユーザーが staging にログイン済み（認証セッションは user 保有・Claude Code は取得しない） |
| 手順 | ブラウザで `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile` を開き、`MEMBER_SESSION_404` バナーが消えてマイページ本体（会員情報セクション）が描画されることを確認。復旧後画面の screenshot を `outputs/phase-11/screenshots/profile-me-404-recovery-staging.png` として保存 |
| 期待結果 | 「セッション情報を取得できませんでした」バナー非表示、`/me` 由来の会員情報が正常描画（VISUAL_ON_EXECUTION・復旧確認 = 本 WF の最終証跡・AC-1） |
| 実結果 | **pending（user-gated・認証必須）** |

#### RT-E: 復旧しない場合 — 構造化ログで S1〜S3 を確定する判定フロー

| 項目 | 内容 |
| --- | --- |
| 前提 | RT-D で復旧が確認できない場合のみ実施。T01 統合により API notFound ログに `method`+`path`、web に `transportKind` が出力されている |
| 手順 | `bash scripts/cf.sh tail`（api / web 双方）で `/profile` リロード時の構造化ログ（API: `UBM-1404 {method, path}` / web: `server_fetch_failed {transportKind, status}`）を読み、下の判定フローで S1〜S3 を排他的に確定する |
| 期待結果 | S1〜S3 のいずれか **1 つ**に確定し、根拠ログ行とともに `manual-test-result.md` の「data-cause 確定結論」欄（user-gated runtime 後に追記）へ記録される（AC-2/AC-9） |
| 実結果 | **pending（user-gated・RT-D 非復旧時のみ）** |

#### data-cause 確定フロー（AC-2 の核心）

```
API notFound ログ / web server_fetch_failed ログの内容は？
├─ API notFound ログに「UBM-1404 GET /me」が出力されている
│    ──→ ✓ S1 確定（api-staging worker が GET /me を route できていない＝deploy/route ドリフト）
│         → T02 の api CD deploy で現行ルートが入れば復旧。RT-A 後の RT-B で /me が 401 化することを再確認
├─ API notFound ログに /me が無く、web server_fetch_failed の transportKind が service-binding
│    ──→ ✓ S2 確定（service-binding 経由で想定外 version / path へ到達）
│         → RT-A 後の api CD deploy で binding 先 version が揃えば復旧
└─ 認証 /me が 401（session 未解決/identity・status 欠落）または 410（is_deleted=1）
     ──→ ✓ S3 確定（/me 404 ではなく member データ/認証境界事象＝本 WF スコープ外）
          → admin /profile 専用 UX = Issue #1192 / environmentExplicit fail-closed = Issue #1234（FU-001）へ委譲
          → unassigned-task/ に格下げ記録（Phase 12 unassigned-task-detection と連動）
```

> 判定は `API notFound ログの method+path`（route 未マッチか）× `web transportKind`（service-binding/http）× `認証 /me の status`（200/401/410）の 3 軸で排他的に 1 つへ収束する（F-3/F-6 により 401 は redirect・410 は別文言ゆえ観測 404 とは整合しない＝S3 は data-cause が 401/410 と判明した場合のみ）。

### data-cause 確定結論（user-gated runtime 後に追記）

- 結論: **pending（`implemented_local_runtime_pending` では未確定。RT-D 復旧確認または RT-E 判定フローの実施後に S1〜S3 のいずれかと根拠ログ行を `manual-test-result.md` に追記する）**

## 統合テスト連携

RT-D の復旧確認（または RT-E の data-cause 確定）が AC-1/AC-2 の実結果正本。S3 確定時のみ本 WF はスコープ外となり #1192/#1234 へ委譲（CONST_007 例外・Phase 12 unassigned-task-detection と連動）。実装ローカルの focused vitest（Phase 9）と合わせて Phase 12 の実装ガイド・compliance へ引き継ぐ。

## 参照資料

- `_shared-context.md` §1（F-1〜F-9）/ §2（S1〜S3）/ §6（AC-1〜AC-10）/ §9（観測データ・secret 非記載）
- `outputs/phase-3/phase-3.md` §3.6（Phase 11 特化宣言）
- `outputs/phase-5/task-01..04-*.md`（実装仕様書本体）
- `scripts/diagnose-profile-session.sh`（T04 拡張対象）/ `scripts/smoke/mint-staging-session-cookie.mts`・`scripts/smoke/runtime-admin-web.sh`（smoke 資産流用）
- `.github/workflows/web-cd.yml`（T02 api-cd.yml の同型雛形）
- `CLAUDE.md`（`scripts/cf.sh` 規約・secret 非転記）

## 成果物

- `outputs/phase-11/phase-11.md`（本ファイル）
- `outputs/phase-11/main.md`（証跡サマリ・index）
- `outputs/phase-11/manual-test-result.md`（復旧検証手順の正本・証跡メタ）
- `outputs/phase-11/manual-smoke-log.md`（diagnose + smoke 実行ログ雛形）
- `outputs/phase-11/link-checklist.md`（成果物間リンク整合）
- `outputs/phase-11/ui-sanity-visual-review.md`（NON_VISUAL 宣言）
- `outputs/phase-11/screenshots/.gitkeep`（復旧後 PNG は user-gated）

## 完了条件

- [x] 冒頭に taskType / visualEvidence=VISUAL_ON_EXECUTION / workflow_state=implemented_local_runtime_pending と NON_VISUAL 宣言を記載
- [x] RT-A（api deploy）→ RT-B（route 存在差分）→ RT-C（minted-cookie 認証 `/me` 200）→ RT-D（`/profile` 正常描画 + screenshot）→ RT-E（非復旧時の S1〜S3 確定）を「コマンド/前提/期待結果/実結果(pending)」形式で記録
- [x] data-cause 確定フロー（S1: `UBM-1404 GET /me` / S2: transportKind=service-binding / S3: 401/410）を排他的に記載（AC-2）
- [x] 現象 screenshot をユーザー提供（2026-06-13 10:38 JST・`MEMBER_SESSION_404`）として文中参照
- [x] 復旧後 PNG は user-gated・`implemented_local_runtime_pending` では未取得と明記（PNG 非配置・`.gitkeep` のみ）
- [x] secret/cookie/JWT/memberId を本ファイルに非記載（AC-9）
