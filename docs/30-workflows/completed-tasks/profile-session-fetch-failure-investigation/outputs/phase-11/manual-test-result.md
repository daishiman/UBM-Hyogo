# Phase 11: 手動テスト計画 + 証跡（staging 実機切り分け）

## タスク種別

| 項目 | 値 |
| --- | --- |
| taskType | VISUAL |
| implementation_mode | new（診断用の新規コード + 新規テスト） |
| visualEvidence | **VISUAL_ON_EXECUTION** |
| workflow_state | implemented_local_evidence_captured |
| 主証跡ソース（調査: AC-1/AC-2） | staging 実機の `/me` HTTP status（DevTools Network）+ 診断スクリプト stdout + D1 read-only クエリ結果 |
| 主証跡ソース（NON_VISUAL: T02） | 自動テスト（Vitest）の名前と件数（予定） |
| 主証跡ソース（VISUAL: T01） | jsdom render（`page.spec.tsx` / `SectionError.spec.tsx`）+ 診断後 static UI contract screenshot。staging 認証 runtime screenshot は二次証跡 |

> **visualEvidence = VISUAL_ON_EXECUTION 宣言**: 現象 screenshot はユーザー提供済み（文中参照）。診断後の static UI contract screenshot（410/5xx/FAILED 区別バナー）は実装時に Playwright Chromium で取得する。staging `/profile` の認証 runtime screenshot はログイン必須ルートのため **user-gated**（Claude Code は staging 認証ログインして取得しない）。

## 実施情報

| 項目 | 値 |
| --- | --- |
| 実施 wave | implemented_local_evidence_captured（local focused tests と static screenshot は実施済み。staging 実機調査・D1 read-only・staging screenshot は user-gated） |
| ブランチ | `feat/profile-session-fetch-failure-investigation` |
| 起点 | `origin/dev` (b59a9b450) |
| 対象環境 | staging（`ubm-hyogo-web-staging.daishimanju.workers.dev`） |
| 現象 URL | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile` |

## 仕様判断根拠（スクリーンショット二段境界）

- workflow_state は `implemented_local_evidence_captured`。local focused tests と静的 screenshot は完了。staging 実機の真因切り分け、D1 read-only、staging runtime screenshot は user-gated。
- 現象 screenshot は**ユーザー提供済み**: staging `/profile` でログイン済み（左下アカウント「万壽本大嗣・管理者」）にもかかわらず「セッション情報を取得できませんでした / 時間をおいて再読み込みしてください / 再読み込み」エラーバナーが表示され本体が描画されない画面。これは `/profile` page.tsx のデフォルト失敗分岐（非404・非redirect）に一致し、`/me` が 410 / 5xx / transport 失敗のいずれかで返ったことを示す（H3/H4/H5）。
- 診断後の static UI contract screenshot（区別バナー）は実装時に取得し `outputs/phase-11/screenshots/` に保存する計画。staging 認証 runtime screenshot は user-gated。
- Phase 12 compliance check では、現象 screenshot を user-provided、診断後 static screenshot を present、staging runtime screenshot を user-gated として分離して扱う。

## 現象 screenshot（ユーザー提供画像の文中参照）

- 参照対象: staging `/profile` の「セッション情報を取得できませんでした / 時間をおいて再読み込みしてください」エラーバナー（ユーザー提供画像）。
- 一致する分岐: `apps/web/app/(member)/profile/page.tsx:66-74` デフォルト失敗分岐（`MEMBER_SESSION_404` 以外の非2xx / transport 失敗）。
- 一致しない分岐（一次除外）: 401 は `/login?redirect=/profile` へ redirect されバナーにならない（H2 除外）。404 は「再ログイン」CTA 分岐になる（症状不一致）。

## staging 実機 真因切り分け手順（AC-1 / AC-2 の核心）

各手順は「コマンド / 前提 / 期待結果 / 実結果」形式。local implementation evidence は実施済み。staging 実機手順の実結果は pending（user-gated）。

### MT-A: DevTools Network で `/me` の HTTP status 確認

| 項目 | 内容 |
| --- | --- |
| 前提 | staging `/profile` にログイン済み（万壽本大嗣・管理者）。Chrome DevTools Network を開く |
| 手順 | `/profile` をリロードし、Server Component が裏で叩く `GET /me`（または web proxy `/api/me`）のリクエストを Network タブで特定し HTTP status を確認 |
| 期待結果 | status が `410` / `5xx` / （応答無し=transport 失敗）のいずれか。`401`/`404` でないこと（症状一致の確認）。`401` なら redirect が起きるはずでバナー不一致、`404` なら再ログイン CTA になるため、ここで `410`/`5xx`/応答無しを観測できれば H3/H4/H5 へ進む |
| 実結果 | **pending（staging 実機・user-gated）** |

### MT-B: 診断スクリプト `bash scripts/diagnose-profile-session.sh` 実行

| 項目 | 内容 |
| --- | --- |
| 前提 | T03 実装済み。`scripts/diagnose-profile-session.sh`（read-only・冪等）が存在。Cloudflare 認証は `bash scripts/cf.sh` 経由（直 wrangler 禁止） |
| 手順 | `bash scripts/diagnose-profile-session.sh` を実行。staging `/me` を https 直で叩き status を確認、env/secret parity（`AUTH_SECRET` 等の存在有無のみ・実値は出さない）、staging deploy 版数を 1 本で出力 |
| 期待結果 | (a) staging `/me` の status（未認証直叩きなら 401 期待＝サービス疎通の確認）(b) env/secret parity が staging で揃っている（H5 transport / parity 欠落の切り分け）(c) deploy 版数が最新 dev bundle に一致（H1 旧 bundle 残存の切り分け）。冪等（再実行で同一出力・副作用なし） |
| 実結果 | **pending（user-gated・T03 実装後）** |

### MT-C: D1 read-only で当該 member の `member_status.is_deleted` 確認

| 項目 | 内容 |
| --- | --- |
| 前提 | D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）。調査は `bash scripts/cf.sh d1`（read-only SELECT）経由のみ。memberId はログ/ドキュメントに転記しない（不変条件 #11） |
| 手順 | `bash scripts/cf.sh d1` 経由で当該管理者アカウントに紐づく `member_status` を read-only SELECT し、`is_deleted` の値と `member_identity` / `member_status` 行の有無を確認（identity 有・status 無 = orphan の可能性も確認） |
| 期待結果 | `is_deleted=1` なら H3（410 DELETED）確定。`member_status` 行が無い（orphan）なら 401/500 経路の可能性（H2/H4 側へ分岐）。`is_deleted=0` かつ status 有なら 410 は否定され H4（5xx）/ H5（transport）へ収束 |
| 実結果 | **pending（staging D1 read-only・user-gated）** |

### MT-D: web error code（`MEMBER_SESSION_*`）の確定 + H 収束判定

| 項目 | 内容 |
| --- | --- |
| 前提 | T01/T02 実装後は `/profile` の `data-*` 原因コード可視化 + server-side 構造化ログで error code を判別可能 |
| 手順 | `/profile` 画面の `data-*` 属性（または server ログの `code`）が `MEMBER_SESSION_410` / `MEMBER_SESSION_5xx`（5xx 族）/ `MEMBER_SESSION_FAILED` のどれかを確認し、MT-A〜MT-C の status / D1 結果と突き合わせる |
| 期待結果 | error code と HTTP status と D1 状態が整合し、真因が H3 / H4 / H5 の **いずれか 1 つに収束**する |
| 実結果 | **local implementation present; staging 実機は user-gated** |

### 真因収束 判定フロー（H3 / H4 / H5）

```
MT-A: /me の HTTP status は？
├─ 401 ──→ H2（症状不一致・redirect されるはず）→ 再現条件を再確認（除外見直し）
├─ 404 ──→ 症状不一致（再ログイン CTA になるはず）→ 既存 404 WF 領域（除外）
├─ 410 ──→ MT-C で member_status.is_deleted=1 を確認 ──→ ✓ H3 確定（410 DELETED）
├─ 5xx ──→ MT-B/API ログで resolver/D1/handler 例外を確認 ──→ ✓ H4 確定（5xx）
└─ 応答無し / 3桁status不在（MEMBER_SESSION_FAILED） ──→ MT-B で service-binding 応答 / deploy 版数を確認
      ├─ 旧 bundle 残存 ──→ H1（staging 未デプロイ）寄り → H5 と切り分け
      └─ service-binding 未応答 ──→ ✓ H5 確定（transport 失敗）
```

> 最有力は H3 / H4 / H5。MT-A の status と MT-C の D1 状態の交差で真因を 1 つに収束させ、結論を本ファイルの「真因確定結論」欄（実装/調査 wave で追記）へ根拠付きで記録する（AC-1）。管理者アカウントの identity/status 保持と resolver の cookie 解決可否を MT-C / MT-B で確認し、管理者 `/profile` の期待挙動を結論化する（AC-2）。

## 観測性向上の証跡（T01 / T02 / T03）

### NON_VISUAL パート（T02）— 自動テスト主証跡

| ID | 対象 | テストファイル（予定） | 予定テスト名 | 期待結果 |
| --- | --- | --- | --- | --- |
| SF-1 | T02 safe-fetch ログ | `apps/web/src/lib/server-fetch/safe-fetch.spec.ts` | `/me` 失敗時に `status`/`code`/`path` を構造化ログ出力する | PASS |
| SF-2 | T02 個人情報非露出 | `apps/web/src/lib/server-fetch/safe-fetch.spec.ts` | ログに memberId / 認証 token を含めない（不変条件 #11） | PASS |
| SF-3 | T02 code 生成 | `apps/web/src/lib/server-fetch/safe-fetch.spec.ts` | 410→`MEMBER_SESSION_410` / 5xx→`MEMBER_SESSION_5xx` / status 不在→`MEMBER_SESSION_FAILED` | PASS |
| SF-4 | T02 ユーザー非露出 | `apps/web/src/lib/server-fetch/safe-fetch.spec.ts` | 技術文字列（`fetchAuthed failed: <status>`）をユーザー向け値に渡さない | PASS |

### VISUAL パート（T01）— jsdom render 主証跡 + screenshot 二次証跡

| ID | 対象 | 証跡 | 予定内容 | 期待結果 |
| --- | --- | --- | --- | --- |
| PF-1 | T01 `/profile` 410 分岐 | jsdom render（`app/(member)/profile/page.spec.tsx`） | `MEMBER_SESSION_410` 時に安全文言 + `data-*` 原因コード可視化（生 message 非露出） | PASS |
| PF-2 | T01 `/profile` 5xx 分岐 | jsdom render | `MEMBER_SESSION_5xx`（5xx 族）時に区別文言 + `data-*` 可視化 | PASS |
| PF-3 | T01 `/profile` 401 回帰 | jsdom render | 401（`AuthRequiredError`）は `/login?redirect=/profile` へ redirect（回帰なし） | PASS |
| PF-4 | T01 `/profile` 404 回帰 | jsdom render | `MEMBER_SESSION_404` は再ログイン CTA（既存挙動・回帰なし） | PASS |
| PF-5 | T01 `/profile` FAILED 分岐 | jsdom render | `MEMBER_SESSION_FAILED`（transport）時に区別文言 + `data-*` 可視化 | PASS |
| SE-1 | T01 `SectionError` data-* | jsdom render（`src/components/member/__tests__/SectionError.spec.tsx`） | 原因コードの `data-*` 属性描画。HEX 直書きなし | PASS |
| TC-01 | T01 区別バナー外観 | static UI contract screenshot（`outputs/phase-11/screenshots/profile-session-disambiguation-static-contract.png`） | 410/5xx/FAILED 区別バナーの視覚契約 | present |
| TC-02 | T01 ページ内配置 | static page screenshot（`outputs/phase-11/screenshots/profile-session-disambiguation-static-page.png`） | ページ内配置の視覚契約 | present |
| TC-03 | T01 staging runtime | staging runtime screenshot（`outputs/phase-11/screenshots/profile-session-disambiguation-staging.png`） | staging `/profile` 実機の区別バナー | **user-gated（認証必須・未取得）** |

## 完了条件

- [x] visualEvidence=VISUAL_ON_EXECUTION を冒頭宣言（現象=ユーザー提供 / 診断後 static=実装時取得 / staging runtime=user-gated）
- [x] 現象 screenshot をユーザー提供画像として文中参照
- [x] staging 実機切り分け手順 MT-A〜MT-D を「コマンド/前提/期待結果/実結果(pending)」形式で記録
- [x] 真因収束判定フロー（H3/H4/H5）を記載
- [x] 証跡の主ソース（自動テスト名/件数の予定）を SF-* / PF-* で記録
- [x] screenshots/ は `.gitkeep` と static UI contract PNG 2 件を保持。staging runtime PNG は user-gated

## 成果物

- `outputs/phase-11/manual-test-result.md`（本ファイル）
- `outputs/phase-11/screenshots/.gitkeep`
- `outputs/phase-11/screenshots/profile-session-disambiguation-static-contract.png`
- `outputs/phase-11/screenshots/profile-session-disambiguation-static-page.png`

## 参照資料

- `_shared-context.md` §2（H1-H6）/ §4（AC-1〜8）/ §8（検証コマンド）
- `outputs/phase-1/phase-1.md`（仮説マトリクス）
- `outputs/phase-5/task-01..03-*.md`（実装仕様書本体）

## 統合テスト連携

MT-A〜MT-D の真因収束結論（H3/H4/H5 のいずれか）が AC-1/AC-2 の調査正本。実装後の SF-*/PF-* 自動テスト PASS と合わせて Phase 12 の実装ガイド・未タスク化（本格修正）・compliance へ引き継ぐ。staging 認証 runtime screenshot は user-gated 承認後に取得し `outputs/phase-11/screenshots/` へ配置する。
