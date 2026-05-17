# Phase 12: 未タスク検出レポート

## 0 件判定の確認ソース一覧

| ソース | 確認結果 |
|--------|---------|
| 元タスク仕様書「スコープ外」 | 3 件あり（下記） |
| Phase 3 / Phase 10 レビュー MINOR | 3 件あり（下記） |
| Phase 11 手動テスト | 0 件 |
| コードコメント TODO/FIXME/HACK/XXX | 本タスクはコード変更なし。N/A |
| `describe.skip` ブロック | 本タスクは新規テスト計画のみ。N/A |

## 検出された未タスク（合計 4 件）

### UT-RSE-001: KV namespace の新規作成 / 既存流用の最終決定

| 項目 | 内容 |
|------|------|
| 由来 | Phase 3 MINOR-1 |
| 状態 | current（実装タスク開始時に決定が必要） |
| 関連タスク差分 | 既存 KV binding が `apps/api/wrangler.toml` にあるか確認の上、新規 namespace（`SERVICE_TOKEN_NONCE_KV`）を作成するのが標準 |
| 推奨対応 | 別タスク `task-service-token-kv-provisioning` を起票し、`scripts/cf.sh kv:namespace create` 手順を runbook 化 |

### UT-RSE-002: admin UI から service-token を発行する経路の設計

| 項目 | 内容 |
|------|------|
| 由来 | Phase 1 scope out / Phase 10 M-2 |
| 状態 | baseline（将来拡張） |
| 関連タスク差分 | 既存 admin UI に「service-token 発行ボタン」を追加する場合、HMAC 計算をブラウザで行うべきではないため、admin 専用 server-side endpoint をさらに別途新設する必要あり |
| 推奨対応 | MVP 後の機能拡張として `task-admin-ui-service-token-issuance` を backlog 登録 |

### UT-RSE-003: production smoke 結果の Grafana / Cloudflare Analytics 連携

| 項目 | 内容 |
|------|------|
| 由来 | Phase 10 M-3 |
| 状態 | baseline |
| 関連タスク差分 | 既存通知は Slack のみ。中長期的にダッシュボード可視化が望ましい |
| 推奨対応 | `task-smoke-result-observability` を backlog 登録 |

### UT-RSE-004: D1 migration apply の自動化（user-gated を維持しつつ semi-auto 化）

| 項目 | 内容 |
|------|------|
| 由来 | Phase 1 scope out（実 apply は本タスクの user-gated） |
| 状態 | baseline |
| 関連タスク差分 | 本タスクの `runbooks/d1-migration-apply.md` は手動手順。GitHub Actions の workflow_dispatch 経由で apply を半自動化する余地あり |
| 推奨対応 | `task-d1-migration-apply-workflow` を backlog 登録 |

## 関連タスク差分確認（FB-CANCEL-004-2 準拠）

- 既存タスク `runtime-smoke-staging-secrets-restore` は staging incident 対応に閉じており、本タスクの未タスク群と重複しない
- 既存 backlog `completed-tasks/ci-env-secret-inventory-and-preflight-gate` は allowlist contract のみで、KV / Grafana / D1 自動化は別領域

## 完了条件

- 0 件でも本ファイルを出力する → 本タスクでは 4 件検出
- 各未タスクに由来 / 状態 / 関連タスク差分 / 推奨対応が記録されている

## 成果物

- `outputs/phase-12/unassigned-tasks.md`（本ファイル）
