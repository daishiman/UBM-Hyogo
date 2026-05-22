# ut-17-followup-002-alert-relay-dedup-kv — タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: in-memory `Map<string, number>` を Cloudflare KV 永続化に置換するコード変更（`apps/api/src/routes/internal/alert-relay.ts`、`apps/api/src/env.ts`、`apps/api/wrangler.toml`、テスト一式）が必須。Cloudflare 側の KV namespace 作成（`bash scripts/cf.sh` 経由）も伴うが、ペイロード処理・dedup 判定はコード側のロジック書き換えで実現する。docs-only では到底達成できない。

## メタ情報

| 項目 | 値 |
|------|-----|
| ID | ut-17-followup-002 |
| タスク名 | alert-relay dedup を in-memory Map から Cloudflare KV namespace へ移行 |
| ディレクトリ | docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv |
| Wave | UT-17 follow-up |
| 実行種別 | 改善（信頼性 / Cloudflare Workers isolate 跨ぎ dedup） |
| 作成日 | 2026-05-13 |
| 担当 | delivery |
| 状態 | implemented-local-runtime-pending |
| タスク種別 | implementation / NON_VISUAL |
| visualEvidence | NON_VISUAL |
| 優先度 | LOW（priority:low / scale:small） |
| GitHub Issue | #634（CLOSED — 未解決のままクローズ。本仕様書で formalize） |
| 親タスク | ut-17-cloudflare-analytics-alerts（Issue #20） |
| implementation_mode | new |

## 目的

`apps/api/src/routes/internal/alert-relay.ts` の dedup 状態を Cloudflare KV namespace に永続化し、Cloudflare Workers の isolate 再生成・複数 isolate ルーティング状況下でも、同一 (metric, policy_id, minuteBucket) のアラートが TTL（5分）内に Slack へ重複配信される確率を実用上大きく低減する。

## なぜ必要か

- 現状: `seenAlerts = new Map<string, number>()` は **isolate ローカル in-memory**。
- 問題: cold start・rolling deploy・region 切替・複数 isolate 分散により dedup window が isolate 跨ぎで実効 0 まで縮退し、Cloudflare Notifications の retry に対し Slack 二重通知が発生し得る。
- 影響: アラート疲労、ノイズの本物障害混入、UT-17 で導入した monthly healthcheck runbook の効果毀損。

## スコープ

### 含む

- `apps/api/src/env.ts` への `ALERT_DEDUP_KV: KVNamespace` binding 追加
- `apps/api/wrangler.toml` への user-gated KV namespace binding block テンプレート追加（実 namespace id 取得まではコメント化）
- `alert-relay.ts` の dedup 処理を `Map` から `await c.env.ALERT_DEDUP_KV.get/put` に置換し、Slack 配信成功後だけ KV に保存
- Miniflare の KV stub を利用した test fixture 整備と既存テストの整合
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` への「KV namespace 健全性確認」項追記

### 含まない

- Slack 配信 retry・Block Kit 整形・cf-webhook-auth middleware の挙動変更
- 新規 Cloudflare Notification policy 追加
- KV eventual consistency に伴う完全な race 排除（同一リクエスト内 read→put の二重実行は許容）
- Cloudflare KV namespace 作成、実 namespace id 反映、deploy、Slack runtime smoke（明示承認後に実行）

## 不変条件

1. KV binding 追加は `apps/api` 内のみ。`apps/web` 側からは触れない（D1 直接アクセス禁止と同じ責務境界）。
2. Cloudflare CLI 操作は **必ず `bash scripts/cf.sh` 経由**。`wrangler` を直接呼ばない。
3. dedup key の構造（`{metric}:{policy_id}:{minuteBucket}`）と TTL（5分）は維持。
4. dedup 値は最小化（"1" のみ）。metadata は使わない。
5. KV eventual consistency を理由に in-memory Map を併用しない（two-tier cache は今回のスコープ外）。

## 成果物

- 更新版 `apps/api/src/env.ts`
- 更新版 `apps/api/src/routes/internal/alert-relay.ts`
- 更新版 `apps/api/wrangler.toml`
- 更新版 `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`（既存実体パス）
- `outputs/phase-01..13/` の各 Phase 成果物
- runbook 追記

## 正本順位

1. 本 `index.md` と `outputs/phase-*/` 各成果物
2. 既存単一 spec: `docs/30-workflows/unassigned-task/ut-17-followup-002-alert-relay-dedup-kv-persistence.md`（参考資料・本仕様書で置換）
3. 親タスク: `docs/30-workflows/ut-17-cloudflare-analytics-alerts/`
4. CLAUDE.md の Cloudflare 系 CLI 実行ルール

## Phase 一覧

| Phase | 名称 | ステータス | 主要成果物 |
|-------|------|-----------|-----------|
| 1 | 要件定義 | completed | `outputs/phase-01/requirements.md` |
| 2 | 設計 | completed | `outputs/phase-02/design.md` |
| 3 | 設計レビュー | completed | `outputs/phase-03/design-review.md` |
| 4 | テスト作成 | completed | `outputs/phase-04/test-plan.md` |
| 5 | 実装 | completed | `outputs/phase-05/implementation-plan.md` |
| 6 | テスト拡充 | completed | `outputs/phase-06/test-supplement.md` |
| 7 | カバレッジ確認 | completed | `outputs/phase-07/coverage.md` |
| 8 | リファクタリング | completed | `outputs/phase-08/refactor.md` |
| 9 | 品質保証 | completed | `outputs/phase-09/qa.md` |
| 10 | 最終レビュー | completed | `outputs/phase-10/final-review.md` |
| 11 | 手動テスト | completed | `outputs/phase-11/manual-test-result.md` |
| 12 | ドキュメント更新 | completed | `outputs/phase-12/main.md` + strict 6 補助成果物 |
| 13 | PR 作成 | blocked_pending_user_approval | — |

## 正本同期状態

- 本 workflow は `docs/30-workflows/unassigned-task/ut-17-followup-002-alert-relay-dedup-kv-persistence.md` を successor として置換する。
- root `workflow_state` は `implemented-local-runtime-pending`。コード実装・local evidence は完了し、Cloudflare KV namespace 作成、`wrangler.toml` への実 namespace id 反映、deploy、Slack runtime smoke、commit、push、PR は user-gated。
- 承認前の active `wrangler.toml` に placeholder id を置かない。user-gated block はコメント化し、実 id 取得後に有効化する。

## CONST_007 スコープ宣言

本仕様書の全 Phase は、後続実装プロンプト（03.実装.md）の **1 サイクル内で完了するスコープ** に収めている。バックログ送り・別 PR 先送りは存在しない。仕様書を 13 ファイルに分割しているのは Phase 単位の関心ごと分離が目的であり、先送りではない。
