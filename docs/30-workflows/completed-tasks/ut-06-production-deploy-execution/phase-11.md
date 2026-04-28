# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-27 |
| 前 Phase | 10 (最終レビュー / GO・NO-GO) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

Phase 10 で GO 判定された本番環境（OpenNext Workers / API Workers / D1）に対し、**実 smoke test を実施**し AC-1 / AC-2 / AC-4 / AC-5 を実環境で証跡として記録する。
本タスクは implementation 種別であり、ut-02（docs-only）と異なり N/A 扱いせず、本番 URL・本番 Workers・本番 D1 に対する実コマンド実行および証跡取得を行う。

> **重要:** 本 Phase は本番環境への HTTP リクエストを実施する。ブロッカー検出時は Phase 6 で確立したロールバック手順に従い、即時にロールバック判断を行うこと。

## 実行タスク

- 本番デプロイ完了後（Phase 5 実施直後）の本番環境に対し、実 smoke test シナリオ（最低 10 項目）を実行する
- 各シナリオの実行コマンド・期待結果・実際の結果・証跡（HTTP ステータス・レスポンス本文・スクリーンショット・Workers ログ）を記録する
- 実施記録テーブル（実施日時・実施者・結果・証跡パス）を `outputs/phase-11/smoke-test-result.md` に作成する
- ブラウザ検証用スクリーンショットを `outputs/phase-11/screenshots/` に保管する
- API レスポンス証跡を `outputs/phase-11/api-response-evidence.md` に記録する
- ブロッカー検出時に Phase 6 のロールバック runbook に従い対応する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-10/go-nogo.md | GO 判定確認 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-02/deploy-design.md | smoke test 手順設計 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-02/rollback-runbook.md | ブロッカー検出時のロールバック手順 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/deploy-execution-log.md | 本番 URL・コミット SHA 確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler tail / curl コマンド仕様 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | go-live / rollback 方針 |
| 参考 | docs/30-workflows/ut-06-production-deploy-execution/index.md | AC-1 〜 AC-8 |

## 実行手順

### ステップ 1: 前提確認

- Phase 10 の GO 判定が `go-nogo.md` に記録されており、承認権者の署名が取得済みであることを確認する
- Phase 5 の `deploy-execution-log.md` から本番 URL（Pages: `https://<project>.pages.dev` または カスタムドメイン、Workers: `https://<service>.workers.dev`）を取得する
- 実施担当者・実施日時・wrangler CLI バージョン・対象コミット SHA を `smoke-test-result.md` のヘッダーに記入する
- ロールバック準備（前 deployment ID・前 version_id・D1 backup SQL パス）を手元に控える

### ステップ 2: 実 smoke test シナリオの実行

- 後述のシナリオ表に従い、各項目を順次実行する
- 各シナリオで HTTP ステータス・レスポンス本文・実行時刻を取得する
- ブラウザ検証はフルページスクリーンショットを取得し `outputs/phase-11/screenshots/` に保存する（ファイル名規則: `<scenario-id>-<YYYYMMDD-HHMMSS>.png`）
- API レスポンスの生ログは `outputs/phase-11/api-response-evidence.md` にコードブロックで貼付する

### ステップ 3: 結果判定とブロッカー検出

- 各シナリオで「期待結果」と「実際の結果」を比較し PASS / FAIL を判定する
- FAIL が 1 件でも検出された場合、ブロッカー判定基準（後述）に従いロールバック要否を即時判断する
- ロールバック要と判定した場合は Phase 6 の `rollback-runbook.md` に従い実施し、Phase 6 へ戻り原因切り分けを行う

### ステップ 4: 実施記録のまとめ

- `smoke-test-result.md` に実施記録テーブル（シナリオ ID・実施日時・実施者・結果・証跡パス）を完成させる
- 全件 PASS であれば Phase 12 への進行を承認し、`smoke-test-result.md` のサマリ欄に GO 判定を記入する
- 1 件でも FAIL かつロールバック未実施の場合は Phase 11 を中断し、Phase 6 / Phase 5 へ戻る

## 実 smoke test シナリオ表【必須】

| ID | シナリオ | 対応 AC | 実行手順 | 期待結果 | 証跡形式 |
| --- | --- | --- | --- | --- | --- |
| S-01 | Web 本番 URL ホーム画面表示 | AC-1 | `curl -sI https://<web-url>/` を実行し、ブラウザでも `/` を開いてフルページスクリーンショット取得 | HTTP 200、`content-type: text/html`、ページタイトル表示 | curl 出力 + スクリーンショット |
| S-02 | Pages 代表的サブページ表示 | AC-1 | 代表 1〜2 経路（例: `/about` `/members`）に対し `curl -sI` 実行 + ブラウザ確認 | 各経路で HTTP 200 / 30x（リダイレクト先 200） | curl 出力 + スクリーンショット |
| S-03 | apps/api `/health` 200 OK + healthy ペイロード | AC-2 | `curl -s https://<workers-url>/health` を実行 | HTTP 200、JSON ボディに `{"status":"healthy"}` 等の healthy 表現 | curl 出力（JSON 全文） |
| S-04 | apps/api 経由で D1 SELECT 成功 | AC-4 | `curl -s https://<workers-url>/health/db`（または smoke 専用エンドポイント）を実行し、Workers が D1 から 1 件以上 SELECT して返答 | HTTP 200、レスポンスに D1 取得結果が含まれる | curl 出力 + Workers ログ抜粋 |
| S-05 | 認証エンドポイント（Auth.js）が認可フロー開始 | AC-2 拡張 | `curl -sI https://<workers-url>/api/auth/signin/google` を実行（`apps/web` 配下なら該当経路） | HTTP 302 リダイレクト、`location` ヘッダーに Google OAuth 認可エンドポイントを含む | curl 出力（Location ヘッダー） |
| S-06 | 静的アセット配信（CSS / JS / フォント） | AC-1 補強 | ホーム画面 HTML 内の代表 CSS / JS / フォント URL に対し `curl -sI` を実行 | 各リソースで HTTP 200、適切な `content-type` | curl 出力 |
| S-07 | レスポンスヘッダー検証（Cache-Control / Security headers） | AC-1 補強 | `curl -sI https://<web-url>/` の出力ヘッダーを確認 | `cache-control` / `strict-transport-security` / `x-content-type-options: nosniff` 等が想定値 | curl 出力（ヘッダー全文） |
| S-08 | Workers ログに ERROR が無い | AC-5 | smoke test 実施中に `wrangler tail --env production --format pretty` を別ターミナルで実行し、シナリオ S-01 〜 S-07 期間のログを取得 | ERROR / FATAL レベルのログがゼロ | wrangler tail 出力ログファイル |
| S-09 | D1 接続エラーなし | AC-4 補強 | S-04 実行直後に `wrangler tail` 出力で D1 binding 関連の例外（`D1_ERROR` 等）が無いことを確認 + `wrangler d1 execute <DB> --env production --command "SELECT 1;"` を実行 | wrangler tail に D1 関連エラーなし、`SELECT 1` が `1` を返す | wrangler tail 抜粋 + d1 execute 出力 |
| S-10 | DNS 伝播確認（pages.dev / カスタムドメイン両方） | AC-1 補強 | `dig +short <web-url>` および `dig +short <custom-domain>`（カスタムドメイン設定がある場合）を実行し、両 URL に対し `curl -sI` を実行 | 両 URL とも DNS 解決成功・HTTP 200 / 30x | dig 出力 + curl 出力 |

> シナリオ S-10 でカスタムドメインがスコープ外の場合は `pages.dev` のみで実施し、その旨を `smoke-test-result.md` に明記する。

## 各シナリオの期待結果と証跡フォーマット

各シナリオの記録は以下のフォーマットで `api-response-evidence.md` に統一する。

```markdown
### S-XX <シナリオ名>
- 実行時刻: 2026-04-27 HH:MM:SS JST
- 実行コマンド: `<コマンド全文>`
- 期待結果: <期待結果>
- 実際の結果: <観測結果>
- 判定: PASS / FAIL
- 証跡パス: outputs/phase-11/screenshots/S-XX-<timestamp>.png ほか
- 備考: <ブロッカー検出時の対応等>
```

## 実施記録テーブル【必須】

| シナリオ ID | 実施日時 (JST) | 実施者 | 対象 URL | 結果 | 証跡パス |
| --- | --- | --- | --- | --- | --- |
| S-01 | TBD | TBD | TBD | TBD | TBD |
| S-02 | TBD | TBD | TBD | TBD | TBD |
| S-03 | TBD | TBD | TBD | TBD | TBD |
| S-04 | TBD | TBD | TBD | TBD | TBD |
| S-05 | TBD | TBD | TBD | TBD | TBD |
| S-06 | TBD | TBD | TBD | TBD | TBD |
| S-07 | TBD | TBD | TBD | TBD | TBD |
| S-08 | TBD | TBD | TBD | TBD | TBD |
| S-09 | TBD | TBD | TBD | TBD | TBD |
| S-10 | TBD | TBD | TBD | TBD | TBD |

**サマリ判定:** TBD（全件 PASS なら GO / 1 件以上 FAIL なら Phase 6 へ戻る）

## ブロッカー検出時の Phase 6 戻り基準

| 検出事象 | 戻り先 | 即時アクション |
| --- | --- | --- |
| S-01 / S-02 で HTTP 500 系を返す | Phase 6 → Phase 5 | Pages の前 deployment へロールバック（`wrangler deploy --config apps/web/wrangler.toml --env production list` → ロールバック） |
| S-03 で `/health` が unhealthy を返す | Phase 6 → Phase 5 | Workers を前 version_id へロールバック（`wrangler rollback <version_id> --env production`） |
| S-04 / S-09 で D1 SELECT 失敗（`D1_ERROR` 等） | Phase 6 → Phase 5 | Workers binding 設定を確認後、必要に応じ Workers ロールバック + D1 backup からの手動リストア検討 |
| S-05 で Auth.js 認可フローが開始されない | Phase 6 → Phase 4 | Secrets（GOOGLE_CLIENT_ID / SECRET / AUTH_SECRET）配置を再確認 |
| S-08 で Workers ログに ERROR が混入 | Phase 6 | エラー内容に応じて Phase 5 / Phase 4 / Phase 2 へ戻る |
| S-10 で DNS 解決失敗 | Phase 6 → Phase 2 | DNS 伝播待ち or DNS 設計再確認（伝播時間内であれば再実行待機） |

> ロールバック発動の最終判断は delivery 担当 + レビュアー 1 名で実施する。Phase 6 の `rollback-runbook.md` に従い、判断時刻・実施時刻・実施結果を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | smoke test 実施対象となる本番環境を提供 |
| Phase 6 | ブロッカー検出時のロールバック手順を提供・戻り先となる |
| Phase 7 | smoke test 結果（AC-1 / AC-2 / AC-4 / AC-5）を AC matrix に反映 |
| Phase 10 | GO 判定の前提として本 Phase の実施可否が決まる |
| Phase 12 | smoke test 結果サマリを close-out / spec-update に反映 |

## 多角的チェック観点（AIが判断）

- 価値性: 実 smoke test により本番環境の go-live が証跡付きで完了し、後続タスクのクリティカルパスが解放されるか
- 実現性: curl / wrangler tail / dig / ブラウザ検証が全て delivery 担当の権限・環境で実施可能か
- 整合性: シナリオ表が AC-1 / AC-2 / AC-4 / AC-5 を完全カバーし、Phase 2 設計の smoke test 手順と一致しているか
- 運用性: ブロッカー検出時に 5 分以内にロールバック判断が可能か・証跡保管パスが Phase 12 / Phase 13 から参照可能な構造か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 前提確認（GO 判定・本番 URL 取得） | 11 | pending | Phase 10 / Phase 5 参照 |
| 2 | シナリオ S-01 〜 S-10 の実行 | 11 | pending | curl / ブラウザ / wrangler tail |
| 3 | 証跡取得（スクリーンショット / ログ） | 11 | pending | screenshots/ ディレクトリ整備 |
| 4 | 実施記録テーブル完成 | 11 | pending | smoke-test-result.md |
| 5 | API レスポンス証跡記録 | 11 | pending | api-response-evidence.md |
| 6 | ブロッカー検出時の判断・対応 | 11 | pending | Phase 6 へ戻る基準を適用 |
| 7 | サマリ判定（GO / Phase 6 戻り） | 11 | pending | 全件 PASS で Phase 12 へ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/smoke-test-result.md | 実施記録テーブル・サマリ判定・ブロッカー検出記録 |
| ディレクトリ | outputs/phase-11/screenshots/ | ブラウザ検証スクリーンショット（S-01 / S-02 / 必要シナリオ） |
| ドキュメント | outputs/phase-11/api-response-evidence.md | 各シナリオの curl / wrangler tail / dig 出力ログ |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- 実 smoke test シナリオ S-01 〜 S-10 が全て実施されている（カスタムドメイン未設定時の S-10 部分対応含む）
- 各シナリオで PASS / FAIL 判定と証跡パスが記録されている
- 実施記録テーブルが完成している（実施日時・実施者・結果・証跡パス）
- 全件 PASS であるか、または FAIL 検出時の Phase 6 戻り対応が完了している
- スクリーンショットと API レスポンス証跡が `outputs/phase-11/` 配下に保管されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（ブロッカー検出・ロールバック発動・DNS 伝播待機）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: smoke test 結果（PASS / FAIL サマリ）・本番 URL 確定値・ブロッカー検出時の対応履歴を Phase 12 に引き継ぐ
- ブロック条件: 実 smoke test 全件 PASS でない場合、または FAIL 検出後のロールバック対応が未完了の場合は Phase 12 に進まない
