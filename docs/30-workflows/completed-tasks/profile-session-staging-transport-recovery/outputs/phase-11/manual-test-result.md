# Phase 11: 手動テスト計画 + 証跡（staging 復旧検証）

## タスク種別（冒頭宣言）

| 項目 | 値 |
| --- | --- |
| taskType | **VISUAL** |
| visualEvidence | **VISUAL_ON_EXECUTION** |
| workflow_state | **`implemented_local_runtime_pending`** |
| implementation_mode | edit（既存 env/transport/fetch/診断スクリプトの編集） |
| 主証跡ソース（復旧検証: AC-9） | staging deploy 後の `bash scripts/diagnose-profile-session.sh` stdout + ログイン済みブラウザでの `/profile` 正常描画 + 復旧後 screenshot |
| 主証跡ソース（非復旧時: S1〜S4 確定） | 新構造化ログ（`server_fetch_failed {transportKind, baseHost, status}` / `api_transport_fallback {from, to, path}`）の `bash scripts/cf.sh` tail 読解 |
| 主証跡ソース（実装ローカル） | focused vitest 5 spec（Phase 9 L-3・jsdom）。コード変更は transport/env 層で UI 外観は不変 |

> **visualEvidence = VISUAL_ON_EXECUTION 宣言**: 現象 screenshot は**ユーザー提供済み**（2026-06-11 21:43 JST・staging `/profile`・サイドバーに「ishida 会員」表示のままエラーバナー。文中参照・リポジトリ非配置）。復旧後の staging 認証 runtime screenshot `outputs/phase-11/screenshots/profile-session-recovery-staging.png` は認証必須ルートのため **user-gated**（Claude Code は staging 認証ログインして取得しない）。`implemented_local_runtime_pending` の本 wave では PNG を一切取得・配置しない（`screenshots/` は `.gitkeep` のみ）。

## 実施情報

| 項目 | 値 |
| --- | --- |
| 実施 wave | `implemented_local_runtime_pending`（本 wave は手順定義のみ。RT-A〜RT-D の実施はすべてuser-gated・実結果 pending） |
| ブランチ | `fix/profile-session-staging-transport-recovery` |
| 起点 | `origin/dev` (986d5e669) |
| 対象環境 | staging（`ubm-hyogo-web-staging.daishimanju.workers.dev`） |
| 現象 URL | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile` |

## 現象 screenshot（ユーザー提供画像の文中参照）

- 参照対象: staging `/profile` の「セッション情報を取得できませんでした / 通信経路でセッション確認に失敗しました。時間をおいて再読み込みしてください。」エラーバナー（ユーザー提供画像・2026-06-11 21:43 JST）。
- 同一画面のサイドバーに「ishida 会員」が表示されている＝ web Worker 側の Auth.js JWT decode は成功（F-4）。
- 表示文言は `session-error-display.ts` の `session-failed` 分岐（`MEMBER_SESSION_FAILED`）専用文言（F-1）。これにより staging bundle は 2026-06-10 以降の deploy であり（F-2）、`/me` fetch が HTTP 応答に至らず throw した transport 失敗（F-3）が確定している。
- 残るサブ原因は S1（transport 解決不能 throw）/ S2（localhost fallback 接続失敗）/ S3（service-binding fetch throw）/ S4（http fetch throw）の 4 つ。本 WF はどれであっても復旧する多層防御（T01〜T04）を deploy し、確定は RT-D で行う。

## staging 復旧検証手順（RT-A〜RT-D・すべて user-gated・実結果 pending）

各手順は「コマンド / 前提 / 期待結果 / 実結果」形式。本 wave では local focused evidence を固定し、staging runtime 実結果は pending。

### RT-A: 実装 + merge 後の staging deploy

| 項目 | 内容 |
| --- | --- |
| 前提 | T01〜T04 実装済・Phase 9 ゲート（typecheck/lint/focused vitest/bash -n/grep ゲート）全 PASS・work branch が dev へマージ済（または検証用に work branch を直接 deploy する判断をユーザーが明示） |
| 手順 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`（`wrangler` 直叩き禁止・`scripts/cf.sh` 経由のみ） |
| 期待結果 | deploy 成功。新 bundle に T01 統合の観測性（`ApiTransportError{transportKind,baseHost}` / safe-fetch transport ログ）+ T02 field-tolerant + T03 fallback chain が含まれる |
| 実結果 | **pending（user-gated）** |

### RT-B: 拡張後 診断スクリプトの実行（2 系統 probe）

| 項目 | 内容 |
| --- | --- |
| 前提 | RT-A 完了。T04 拡張済の `scripts/diagnose-profile-session.sh` が存在（read-only・冪等・secret/cookie/memberId 非出力） |
| 手順 | `bash scripts/diagnose-profile-session.sh` を実行。(a) web `/api/me`（proxy 実経路）と (b) API direct `${API_BASE}/me` の **2 系統**の status を確認。cookie 提供時（user-gated）は web `/profile` HTML の `data-cause` 値も外形判定。deploy 版数確認手順の出力も確認 |
| 期待結果 | 未認証直叩きで両系統とも 401（= web→API・direct→API の双方が HTTP 応答に到達＝transport 疎通あり）。版数が RT-A の deploy と一致。再実行で同一出力（冪等） |
| 実結果 | **pending（user-gated・T04 実装後）** |

### RT-C: ログイン済みブラウザで `/profile` 正常描画確認 + screenshot

| 項目 | 内容 |
| --- | --- |
| 前提 | RT-A/RT-B 完了。ユーザーが staging にログイン済み（認証セッションは user 保有・Claude Code は取得しない） |
| 手順 | ブラウザで `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile` を開き、エラーバナーが消えてマイページ本体（会員情報セクション）が描画されることを確認。復旧後画面の screenshot を取得し `outputs/phase-11/screenshots/profile-session-recovery-staging.png` として保存 |
| 期待結果 | 「セッション情報を取得できませんでした」バナーが表示されず、`/me` 由来の会員情報が正常描画される（復旧確認 = 本 WF の最終証跡） |
| 実結果 | **pending（user-gated・認証必須）** |

### RT-D: 復旧しない場合 — 新構造化ログで S1〜S4 を確定する判定フロー

| 項目 | 内容 |
| --- | --- |
| 前提 | RT-C で復旧が確認できない場合のみ実施。T01 統合により staging ログに `transportKind` / `baseHost` が出力されている |
| 手順 | `bash scripts/cf.sh` の tail（例: `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging`）で `/profile` リロード時の新構造化ログ（`server_fetch_failed {transportKind, baseHost, status}` / `api_transport_fallback {from, to, path}` / `auth_env_field_dropped {keys}`）を読み、下の判定フローで S1〜S4 を排他的に確定する |
| 期待結果 | S1〜S4 のいずれか **1 つ**に確定し、根拠ログ行とともに本ファイルの「サブ原因確定結論」欄（user-gated runtime 後に追記）へ記録される（AC-9） |
| 実結果 | **pending（user-gated・RT-C 非復旧時のみ）** |

#### S1〜S4 排他判定フロー（AC-9 の核心）

```
server_fetch_failed ログの内容は？
├─ message に「API transport unresolved」throw の痕跡（transport 解決不能）
│    ──→ ✓ S1 確定（getAuthEnv が API_SERVICE も INTERNAL_API_BASE_URL も返せていない）
│         → 併発する auth_env_field_dropped {keys} があれば F-A（field drop）が誘発元
├─ baseHost = localhost:8787（http transport が localhost へ向いた）
│    ──→ ✓ S2 確定（ENVIRONMENT が staging として読めず local 扱い）
│         → T01 fail-closed 化後は throw になるため、新 bundle でこのログが出ること自体が env 注入異常の証拠
├─ transportKind = service-binding の ApiTransportError（API_SERVICE.fetch 自体が throw）
│    ──→ ✓ S3 確定（bound worker の hard error / binding 不調）
│         → api_transport_fallback {from: service-binding, to: http, ...} の有無で chain の劣化運転状況も確認
│         → unassigned-task/task-api-worker-hard-error-root-fix.md の着手条件が満たされる
└─ transportKind = http の ApiTransportError（fetch() 自体が throw・DNS/TLS/到達不能）
     ──→ ✓ S4 確定（API ホスト到達不能）
          → RT-B の API direct probe 結果（401 が返ったか）と突き合わせて網羅確認
```

> 判定は `transportKind`（service-binding / http）× `baseHost`（staging API ホスト / localhost）× message（unresolved throw か fetch throw か）の 3 軸で排他的に 1 つへ収束する。chain（T03）deploy 後は片系 throw でも fallback で復旧するため、`api_transport_fallback` warn が出ていれば「復旧済みだが片系劣化」として同じ軸でサブ原因を確定する。

### サブ原因確定結論（user-gated runtime 後に追記）

- 結論: **pending（implemented_local_runtime_pending では未確定。RT-C 復旧確認または RT-D 判定フローの実施後に S1〜S4 のいずれかと根拠ログ行を追記する）**

## screenshot 計画

| 証跡 | パス | 状況 |
| --- | --- | --- |
| 現象 screenshot（ユーザー提供 2026-06-11 21:43 JST・「ishida 会員」） | （ユーザー提供画像・文中参照・リポジトリ非配置） | user-provided（受領済み） |
| screenshots placeholder | `outputs/phase-11/screenshots/.gitkeep` | present（ディレクトリ保持・既存） |
| 復旧後 staging runtime screenshot | `outputs/phase-11/screenshots/profile-session-recovery-staging.png` | **user-gated・implemented_local_runtime_pending では未取得（pending）** |

## 完了条件

- [x] 冒頭に taskType=VISUAL / visualEvidence=VISUAL_ON_EXECUTION / workflow_state=implemented_local_runtime_pending の宣言表を記載
- [x] RT-A（deploy）→ RT-B（diagnose 2 系統）→ RT-C（`/profile` 正常描画 + screenshot）→ RT-D（非復旧時の S1〜S4 確定）を「コマンド/前提/期待結果/実結果(pending)」形式で記録
- [x] S1〜S4 排他判定フロー（S1: unresolved throw message / S2: baseHost=localhost:8787 / S3: transportKind=service-binding の ApiTransportError / S4: transportKind=http の ApiTransportError）を記載（AC-9）
- [x] 現象 screenshot をユーザー提供（2026-06-11 21:43 JST・「ishida 会員」）として文中参照
- [x] 復旧後 PNG は user-gated・implemented_local_runtime_pending では未取得と明記（PNG 非配置）

## 成果物

- `outputs/phase-11/manual-test-result.md`（本ファイル）
- `outputs/phase-11/screenshots/.gitkeep`（既存）

## 参照資料

- `_shared-context.md` §1（F-1〜F-6・S1〜S4）/ §4（AC-9）/ §8（検証コマンド）
- `outputs/phase-3/phase-3.md` §3.4（Phase 11 特化宣言）
- `outputs/phase-5/task-01..04-*.md`（実装仕様書本体）
- `CLAUDE.md`（cf.sh 規約・secret 非転記）

## 統合テスト連携

RT-C の復旧確認（または RT-D のサブ原因確定）が AC-9 の実結果正本。S3 確定時のみ `unassigned-task/task-api-worker-hard-error-root-fix.md` が着手可能になる（CONST_007 例外①）。実装ローカルの focused vitest（Phase 9 L-3・5 spec）と合わせて Phase 12 の実装ガイド・compliance へ引き継ぐ。
