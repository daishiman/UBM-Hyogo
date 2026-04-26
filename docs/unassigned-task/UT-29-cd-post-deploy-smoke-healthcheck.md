# UT-29: CD デプロイ後スモーク／ヘルスチェック自動化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-29 |
| タスク名 | CD デプロイ後スモーク／ヘルスチェック自動化 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2以降 |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | #49 |
| 検出元 | docs/04-serial-cicd-secrets-and-environment-sync の phase-12 |

## 目的

`backend-ci.yml` / `web-cd.yml` の deploy ステップ直後に同期スモーク（HTTP ヘルスチェック）を追加し、wrangler の outcome が success でもアプリが 5xx / タイムアウト状態である場合に CD ジョブを失敗扱いにする。Discord 通知もスモーク結果まで含めた最終ステータスに改修する。

## スコープ

### 含む

- `apps/api` の `/api/health` エンドポイント実装（200 OK + JSON レスポンスを返すシンプルなルート）
- `backend-ci.yml` の deploy ステップ後にスモーク GET リクエストを追加するワークフロー改修
- `web-cd.yml` の deploy ステップ後にスモーク GET リクエストを追加するワークフロー改修
- スモーク失敗時に CD ジョブを `exit 1` で失敗させるロジック
- Discord 通知ステップをスモーク結果まで含めた最終ステータス（success / failure / skipped）に改修
- staging / production それぞれの環境 URL に対するスモーク実行（環境別 URL の動的生成）
- リトライロジック（デプロイ直後の warm-up 待機を考慮した最大 3 回リトライ）

### 含まない

- E2E テスト / 結合テスト（本タスクは HTTP レベルの疎通確認のみ）
- `/api/health` エンドポイントの高度な診断情報返却（DB 接続確認等は別タスク）
- アラート通知の Discord 以外への拡張（Slack / PagerDuty 等）
- ロールバック自動化（失敗検知後の自動ロールバックは本タスクのスコープ外）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-27（GitHub Secrets / Variables 配置） | CD ワークフロー自体が動作するために Secrets が必要 |
| 上流 | UT-28（Cloudflare Pages プロジェクト作成） | スモーク先の URL（Pages の `*.pages.dev`）が確定している必要がある |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | 改修対象の workflow YAML が確定・マージ済みであること |
| 連携 | UT-21（sync endpoint 実装） | `/api/health` の実装先となる `apps/api` の基本構造が整備済みであること |

## 着手タイミング

> **着手前提**: UT-27 / UT-28 が完了し CD ワークフローが実稼働状態（デプロイが成功する状態）であること。

| 条件 | 理由 |
| --- | --- |
| UT-27 完了 | Secrets が未配置だと CD ワークフロー自体が動かない |
| UT-28 完了 | スモーク先の URL が確定していないとヘルスチェックが書けない |
| UT-21 進行中以降 | `/api/health` 実装先の `apps/api` ルーティング基盤が整備されている方が望ましい |

## 苦戦箇所・知見

**wrangler success != アプリ正常稼働**
`wrangler deploy` / `wrangler pages deploy` コマンドが 0 終了（成功）を返しても、実際のアプリが起動エラー・クラッシュ・バインディングエラーで 5xx を返しているケースがある。特に D1 binding や環境変数の欠損は wrangler が検知できず、初回リクエストまで発覚しない。スモークテストはこのギャップを埋めるために必須。

**デプロイ直後の warm-up 待機**
Cloudflare Workers は通常コールドスタートが非常に速いが、Pages のデプロイ直後はプロパゲーションに数秒かかる場合がある。ヘルスチェックの最初のリクエストが 404 / 503 を返すことがあるため、`sleep 5` + 最大 3 回リトライのロジックを組み込むこと。`curl --retry 3 --retry-delay 5 --retry-connrefused` で実現可能。

**環境 URL の動的生成**
staging の Pages URL は `https://<project>.pages.dev`（production_branch=dev のデプロイ）、production は `https://<project>.pages.dev` または独自ドメイン。workflow の `env` コンテキストや Variables から URL を組み立てるか、`wrangler pages deploy` の出力から URL を抽出するスクリプトが必要になる場合がある。

**Discord 通知の最終ステータス設計**
現状の Discord 通知が deploy ステップの成否だけを見ている場合、スモーク失敗時に「デプロイ成功・通知 success → 実際は 5xx」という誤報が発生する。`if: always()` で通知ステップを実行し、`job.status` ではなくスモークステップの `outcome` を参照するよう改修する。`steps.<smoke_step_id>.outcome == 'success'` で条件分岐を書くと明示的。

**`/api/health` エンドポイントの設計**
Hono ルーターに `GET /api/health` を追加し、`200 OK` + `{"status":"ok","timestamp":"..."}` を返す最小実装で十分。将来的に D1 接続確認等を追加したい場合は、`/api/health/deep` 等の別エンドポイントに切り出すことで基本ヘルスチェックの応答速度を保つ。

**GitHub Actions の `curl` によるヘルスチェック**
GitHub Actions の ubuntu ランナーには `curl` がデフォルトでインストールされている。`curl -sf <url>` で 2xx 以外を失敗とみなし、`|| exit 1` でジョブを失敗させるシンプルなアプローチが信頼性が高い。`-f` フラグは HTTP エラーコードを curl の終了コードに反映する。

**スモーク URL の Secrets 管理**
スモーク先 URL に認証が必要な場合は Secrets を使う必要があるが、MVP フェーズの `/api/health` は認証不要の public エンドポイントとして実装する。URL 自体は Variables で管理し、ワークフローから参照する設計が望ましい。

## 実行概要

1. `apps/api/src/routes/health.ts`（または相当ファイル）に `GET /api/health` ルートを追加
2. `backend-ci.yml` の deploy ステップ後にスモークステップを追加:
   ```yaml
   - name: Smoke test (API health check)
     run: |
       curl -sf --retry 3 --retry-delay 5 \
         https://<api-url>/api/health || exit 1
   ```
3. `web-cd.yml` の deploy ステップ後に同様のスモークステップを追加（Pages の `*.pages.dev` URL を対象）
4. Discord 通知ステップを `if: always()` かつスモーク outcome を参照するよう改修
5. staging / production 両環境で push をトリガーし、スモーク込みの CD フローが green になることを確認
6. 意図的に `/api/health` を 500 返却に変更してスモーク失敗→ジョブ失敗→Discord fail 通知の流れを確認（動作確認後に元に戻す）

## 完了条件

- [ ] `apps/api` に `GET /api/health` エンドポイントが実装済み（200 OK + `{"status":"ok"}` を返す）
- [ ] `backend-ci.yml` に deploy 後スモークステップが追加済み
- [ ] `web-cd.yml` に deploy 後スモークステップが追加済み
- [ ] スモーク失敗時に CD ジョブが `failure` で終了することを確認
- [ ] スモーク成功時に CD ジョブが `success` で終了することを確認
- [ ] Discord 通知がスモーク結果を含めた最終ステータスを反映していることを確認
- [ ] staging 環境でスモーク込みの CD フローが green で完走することを確認
- [ ] production 環境でスモーク込みの CD フローが green で完走することを確認
- [ ] リトライロジック（最大 3 回 / 5 秒間隔）が実装されていることを確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/04-serial-cicd-secrets-and-environment-sync/outputs/phase-12/unassigned-task-detection.md | 検出原典 |
| 必須 | .github/workflows/backend-ci.yml | 改修対象の workflow |
| 必須 | .github/workflows/web-cd.yml | 改修対象の workflow |
| 必須 | apps/api/src/ | ヘルスチェックエンドポイント実装先 |
| 参考 | https://developers.cloudflare.com/workers/observability/health-checks/ | Workers ヘルスチェック公式 |
| 参考 | https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/evaluate-expressions-in-workflows-and-actions | GitHub Actions の outcome 評価 |
| 参考 | UT-27 仕様書 | Secrets 配置（DISCORD_WEBHOOK_URL） |
| 参考 | UT-28 仕様書 | Pages URL 確定（スモーク先 URL） |
