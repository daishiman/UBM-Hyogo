# GitHub Actions CI/CD パイプライン

> 本ドキュメントは統合システム設計仕様書の一部です。
> 管理: .claude/skills/aiworkflow-requirements/

---

**親ドキュメント**: [deployment.md](./deployment.md)

## 概要

本ドキュメントは、ubm-hyogo プロジェクトの GitHub Actions CI/CD パイプライン設定を定義する。

### 目的

- PR 時の品質ゲート（Lint・型チェック・テスト・ビルド）を自動化
- dev / main ブランチへのマージ時の CD（dev=staging / main=production の自動デプロイ・通知）を実行
- テスト並列実行による高速フィードバックを実現

### スコープ

| 対象 | 説明 |
| ---- | ---- |
| CI | PR トリガーの品質検証（ci.yml） |
| CD | dev / main マージ時の自動デプロイ（web-cd.yml） |
| 最適化 | テストシャーディング、キャッシュ戦略、並列実行 |

### 設計原則

| 原則 | 説明 |
| ---- | ---- |
| 高速フィードバック | シャード分割とキャッシュで実行時間を最小化 |
| 品質ゲート | テスト・カバレッジ未達でマージをブロック |
| コスト効率 | 条件分岐で PR 時は軽量実行、main 時のみフル計測 |

---

## ワークフロー構成

| ファイル | 用途 |
| -------- | ---- |
| `ci.yml` | PR 時の CI（Lint・型チェック・テスト・ビルド） |
| `web-cd.yml` | Web アプリ CD（dev: staging / main: production 自動デプロイ + Discord 通知） |
| `backend-ci.yml` | API アプリ CD（dev: staging / main: production 自動デプロイ + Discord 通知） |
| `validate-build.yml` | ビルド検証（PR / push トリガー、apps/* の `pnpm build` 通過確認） |
| `verify-indexes.yml` | aiworkflow-requirements skill indexes drift 検出（`pnpm indexes:rebuild` 結果と committed の差分検証） |
| `pr-target-safety-gate.yml` | `pull_request_target` trusted context を triage / metadata / manual audit のみに限定する safety gate。PR head checkout / install / build は禁止。 |
| `pr-build-test.yml` | untrusted PR head の build / lint / typecheck を `pull_request` + `contents: read` のみで実行する workflow。 |

> **current facts (UT-GOV-002-IMPL / 2026-04-30)**: 上記 7 件が `.github/workflows/` 配下の current inventory。`pr-target-safety-gate.yml` / `pr-build-test.yml` は spec_created 時点の実 workflow 草案で、Phase 13 ユーザー承認後に dry-run / VISUAL evidence を取得して branch protection context と同期する。

---

## CI ワークフロー要件（PR 時）

### トリガー条件

- PR が dev または main ブランチに対して作成されたとき
- PR に新しいコミットがプッシュされたとき

### 実行ステップ

1. リポジトリコードの取得
2. pnpm のセットアップ（バージョン: 10.33.2 / `.mise.toml` に固定、`pnpm/action-setup@v4` で導入）
3. Node.js のセットアップ（バージョン: 24 / `.mise.toml` に固定、`actions/setup-node@v4` で導入）
4. pnpm キャッシュの有効化
5. 依存関係のインストール（frozen-lockfile モード）
6. TypeScript 型チェックの実行
7. ESLint によるコード品質チェック
8. Next.js ビルドの確認
9. Vitest によるユニットテストの実行
10. **カバレッジチェックと Codecov 連携**
    - test ジョブ完了後にカバレッジを収集
    - Codecov にレポートをアップロード
    - 閾値 80% 未達で CI 失敗

### 品質ゲート

- すべてのステップが成功しない限り PR をマージできないようにする
- テストは前のステップが失敗しても必ず実行する
- **カバレッジが 80% 未満の場合、CI を失敗させる**
  - Project coverage: 80% 以上
  - Patch coverage: 80% 以上
  - 設定ファイル: `codecov.yml`

> **current facts（ci-test-recovery-coverage-80-2026-05-04 / 2026-05-04）**: `ci.yml` の `coverage-gate` job は Task E で hard gate 化済み。過去に job レベルと `Run coverage-guard` step レベルの両方に `continue-on-error: true` があり、`coverage-guard.sh` が 80% 未達で exit 1 になっても GitHub Actions の check は success 扱いになっていた。現在は両方の `continue-on-error` を削除し、`scripts/coverage-guard.test.ts` で `coverage-gate` block に `continue-on-error` が再混入しないことを静的検証する。

---

## キャッシュ戦略

### pnpm キャッシュ

| 項目 | 設定 |
| ---- | ---- |
| 使用 Action | `actions/cache@v4` |
| 対象 | pnpm ストア、node_modules |
| キャッシュキー | OS + pnpm-lock.yaml のハッシュ |
| フォールバック | OS のみでマッチ |
| 効果 | 初回 3-5 分 → キャッシュヒット時 30-60 秒 |

### ビルドキャッシュ

| 項目 | 設定 |
| ---- | ---- |
| 対象 | `.next/cache`、`.tsbuildinfo` |
| キャッシュキー | OS + Git SHA |
| フォールバック | OS + ブランチ名 |
| 注意点 | ブランチごとにキャッシュを分離する |

---

## 並列実行の活用

### 並列実行可能なジョブ

- lint と typecheck は依存関係がないため並列実行可能
- 複数パッケージのテストは `--filter` で分離して並列実行

### 順次実行必須なジョブ

- build → test（テストはビルド成果物が必要）
- test → deploy（品質ゲート通過後のみデプロイ）

### GitHub Actions 無料枠

- パブリックリポジトリ：無制限
- プライベートリポジトリ：月 2,000 分

### テストシャード戦略

テスト実行時間を短縮するため、GitHub Actions matrix でシャード分割を行う。

| 項目 | 設定値 | 効果 |
| ---- | ------ | ---- |
| シャード数 | 16 | 各シャード約 25 ファイル |
| 分散方式 | Vitest --shard=N/M | ファイルハッシュベースで均等分配 |
| 並列度 | maxForks=4 (CI) | I/O 待ち時間活用 |

**ジョブ依存グラフ**:

| ジョブ | 依存関係 | 並列実行 |
| ------ | -------- | -------- |
| lint | なし | 可 |
| build-shared | なし | 可 |
| typecheck | build-shared | 条件付き |
| test-shared | build-shared | 条件付き |
| test-web[shard 1-16] | build-shared | 16 並列 |
| coverage | test-web 全完了 | 順次 |

**カバレッジ条件分岐**:

| イベント | カバレッジ計測 | 理由 |
| -------- | -------------- | ---- |
| pull_request | なし | 高速フィードバック優先 |
| push (main) | あり | 品質メトリクス収集 |

### Vitest 並列化設定（CI 環境）

| 設定項目 | CI 値 | ローカル値 | 理由 |
| -------- | ----- | ---------- | ---- |
| maxForks | 4 | CPU コア数/2 | CI は 2 コアだが I/O 活用で 4 並列 |
| fileParallelism | true | 環境変数制御可 | CI 高速化 |
| testTimeout | 10 秒 | 10 秒 | 両環境共通 |
| pool | forks | forks | プロセス分離で安定性確保 |

---

## CD ワークフロー要件（dev / main マージ時）

### トリガー条件

- dev ブランチへのプッシュ（PR マージ時）
- main ブランチへのプッシュ（PR マージ時）

### 実行内容

1. ブランチに応じて Cloudflare Workers へ自動デプロイ（`cloudflare/wrangler-action@v3` + `wrangler deploy --env <env>`）。2026-05-01 時点の `.github/workflows/web-cd.yml` は Pages deploy 残で、ADR-0001 / `task-impl-opennext-workers-migration-001` で置換する
2. デプロイ完了後、Discord Webhook で通知を送信

### 通知要件

| 項目 | 説明 |
| ---- | ---- |
| 形式 | Discord Embed 形式で視認性を向上 |
| 内容 | コミットハッシュ、ブランチ名、作成者を含める |
| タイムスタンプ | 付与する |
| 成功時 | 緑色の Embed でデプロイ完了を通知 |
| 失敗時 | 赤色の Embed でエラー内容を通知 |

> **current facts (UT-CICD-DRIFT / 2026-04-29)**: 上記 Discord Webhook 通知ステップは現行 `.github/workflows/web-cd.yml` には未実装。UT-08-IMPL（観測性実装、Wave 2）で導入予定。UT-CICD-DRIFT では存在しない派生タスクIDへ委譲せず、通知未実装を current facts として固定する。

> **deploy target current facts (ADR-0001 / 2026-05-01)**: `apps/web/wrangler.toml` は OpenNext Workers 形式、`.github/workflows/web-cd.yml` は Pages deploy 残。Workers deploy への切替は `task-impl-opennext-workers-migration-001` の責務。

---

## Backend ワークフロー要件（dev / main マージ時）

### トリガー条件

- dev ブランチへのプッシュ（PR マージ時）
- main ブランチへのプッシュ（PR マージ時）

### 実行内容

1. D1 migrations apply を先に実行して、スキーマ変更を反映する
2. ブランチに応じて Cloudflare Workers へ自動デプロイ（`wrangler deploy`）
3. デプロイ完了後、Discord Webhook で通知を送信

### 注意点

- staging は `apps/api/wrangler.toml` の `[env.staging]`、production は top-level 設定を使う
- migration と deploy の順序を逆にしない

> **current facts (UT-CICD-DRIFT / 2026-04-29)**: 現行 `.github/workflows/backend-ci.yml` には D1 migrations apply + Workers deploy のステップは実装済みだが、Discord Webhook 通知ステップは未実装。UT-08-IMPL（Wave 2）で導入予定。UT-CICD-DRIFT では存在しない派生タスクIDへ委譲せず、通知未実装を current facts として固定する。

---

## モニタリングとアラート

### ヘルスチェックエンドポイント設計

**基本ヘルスチェック（`/api/health`）**

| 項目 | 仕様 |
| ---- | ---- |
| ステータスコード | 200 |
| レスポンス | ステータスとタイムスタンプを含む JSON |
| 実行時間 | 100ms 以内 |
| 内容 | サーバー稼働状況のみ |

### 監視すべきメトリクス（ゴールデンシグナル）

| シグナル | 測定項目 | 目標値 |
| -------- | -------- | ------ |
| レイテンシ | p50, p95, p99 | p95 < 500ms |
| トラフィック | リクエスト数/分 | ベースライン把握 |
| エラー | エラー率 | < 1% |
| サチュレーション | CPU・メモリ使用率 | < 80% |

### Discord 通知

**通知レベル**

| レベル | トリガー | 対応期限 |
| ------ | -------- | -------- |
| Critical | サービスダウン、エラー率 > 10% | 即座に対応 |
| Warning | エラー率 5-10%、パフォーマンス劣化 | 24 時間以内 |
| Info | デプロイ成功、定期バックアップ完了 | 記録のみ |

---

## GitHub Secrets の要件

| Secret 名 | 用途 | 必須 |
| --------- | ---- | ---- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン | Yes |
| `DISCORD_WEBHOOK_URL` | Discord 通知用 Webhook URL | No |

### Variables（非シークレット）

| Variable 名 | 用途 | 必須 |
| ----------- | ---- | ---- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account 識別子。資格情報ではないため Repository Variable として管理し、workflow では `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` で参照する | Yes |
| `CLOUDFLARE_PAGES_PROJECT` | Pages production/base プロジェクト名。UT-28 正本値は `ubm-hyogo-web`。staging は workflow 側で `-staging` suffix を連結して `ubm-hyogo-web-staging` とする | Yes |

`CLOUDFLARE_PAGES_PROJECT` に `ubm-hyogo-web-staging` を直接入れてはいけない。dev deploy は `${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging` を使うため、staging 名を入れると `ubm-hyogo-web-staging-staging` になる。

### セキュリティ要件

| 要件 | 説明 |
| ---- | ---- |
| 設定場所 | GitHub リポジトリの Settings から設定 |
| 注入方法 | 環境変数として安全に注入 |
| マスク処理 | ログに出力されないようマスク処理 |

## UT-27: GitHub Secrets / Variables 配置決定（2026-04-29）

UT-27 (`docs/30-workflows/completed-tasks/ut-27-github-secrets-variables-deployment/`) では、CD 有効化に必要な GitHub Actions Secrets / Variables / Environments を次の配置に固定する。実 `gh secret set` / `gh variable set` / `gh api .../environments` は Phase 13 の user 明示承認後だけ実行する。

| 名前 | 種別 | 配置 | 理由 |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Secret | environment-scoped（`staging` / `production`） | 環境別 token ローテーションと権限分離を優先 |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | repository-scoped | Account ID は資格情報ではなく識別子。既存 GitHub 実設定に合わせ、`vars.` 参照で空展開を防ぐ |
| `DISCORD_WEBHOOK_URL` | Secret | repository-scoped（分離が必要なら environment-scoped） | MVP は単一通知先。未設定時も CI 全体を落とさない |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | repository-scoped | 非機密値で、suffix 連結結果をログで追えるよう Secret 化しない |

運用ゲート:

- `staging` / `production` Environments は `gh api repos/{owner}/{repo}/environments/{name} -X PUT` で作成する。
- dev push smoke は `backend-ci.yml` / `web-cd.yml` の `deploy-staging` green と Discord 通知または未設定耐性を確認する。
- `if: secrets.X != ''` に依存せず、workflow 側では env に受けて shell で空文字判定する設計を優先する。
- API Token は Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read の最小スコープに限定し、命名規則 `ubm-hyogo-cd-{env}-{yyyymmdd}`（例: `ubm-hyogo-cd-staging-20260429`）でローテーション履歴を Token 名から追えるようにする。

---

## 関連ドキュメント

- [デプロイメント概要](./deployment.md)
- [Cloudflare デプロイ](./deployment-cloudflare.md)

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
| ---- | ---------- | -------- |
| 2026-04-29 | 2.2.0 | UT-CICD-DRIFT: Node 22→24 / pnpm 9→10.33.2 同期、workflow 構成表に `validate-build.yml` / `verify-indexes.yml` を追加、Discord 通知未実装の current facts 注記、coverage soft→hard gate 段階性注記 |
| 2026-04-29 | 2.1.0 | UT-27: GitHub Secrets / Variables 配置決定マトリクスと Phase 13 user 承認ゲートを追記 |
| 2026-04-09 | 2.0.0 | 旧デプロイ基盤・Electron E2E 削除、Cloudflare Pages デプロイへ移行 |
