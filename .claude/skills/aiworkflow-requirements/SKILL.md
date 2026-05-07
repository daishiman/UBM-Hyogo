---
name: aiworkflow-requirements
description: |
  ubm-hyogo Web アプリの正本仕様を `references/` から検索・参照・更新するスキル。
  `indexes/resource-map.md` / `indexes/quick-reference.md` / `indexes/topic-map.md` /
  `indexes/keywords.json` を起点に Progressive Disclosure で必要最小限だけ読む。
  用途は要件確認、設計・API契約確認、UI/状態管理/セキュリティ判断、
  `task-workflow` / `lessons-learned` / 未タスク同期。

  Anchors:
  • Specification-Driven Development / 適用: 正本仕様の単一情報源化 / 目的: 仕様 drift 防止
  • Progressive Disclosure / 適用: indexes 起点の段階読み込み / 目的: コンテキスト効率化
  • DDD (Eric Evans) / 適用: ユビキタス言語・Bounded Context / 目的: 用語と境界の統一

  Trigger:
  仕様確認, 仕様更新, task-workflow 同期, lessons-learned 同期, API 契約確認,
  セキュリティ要件確認, Cloudflare, Pages, Workers, D1, R2, r2_buckets, KV,
  デプロイ, 認証, スキルライフサイクル, UI 設計, データベース設計,
  RAG, 検索, インテグレーション, ブランチ戦略, シークレット管理, Secrets, Variables,
  environment-scoped, repository-scoped, 配置決定マトリクス, 1Password 正本,
  GitHub 派生コピー, ストレージ, presigned URL, オブジェクトストレージ,
  legacy umbrella close-out, stale-current classification, post-release-dashboard,
  redaction-check, 30 day gate, 30day-contract, formalized contract,
  failure rate gate, schedule feedback, external-time-dependent, 3-fence detection,
  DLQ, dead-letter, Cloudflare Queue 監視, observability runbook,
  dlq-monitoring, schema-alias-backfill, schema_diff_queue
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# ubm-hyogo Requirements Manager

## 概要

ubm-hyogo Web アプリプロジェクトの全仕様を管理するスキル。
**このスキルが仕様の正本**であり、`references/` 配下のドキュメントを直接編集・参照する。

## 変更履歴

詳細は [SKILL-changelog.md](SKILL-changelog.md) を参照。最新 3 件のみ列挙する。

| Version | Date | Changes |
| --- | --- | --- |
| v2026.05.07-task-06-ui-ux-contract-rewrite | 2026-05-07 | UI/UX contract rewrite task-06 を `implemented-local / implementation / NON_VISUAL` として同期。`09-ui-ux.md` は契約のみ正本（19+1 routes、13 primitives、feature components、login 5 state、server-pending、a11y、token prefix）へ再構成し、視覚詳細は 09a..09h / Storybook VRT へ委譲。task-06 diff scope は `09-ui-ux.md` M + workflow package A のみに固定し、attendance 系 workflow 削除混入は active/resource-map 参照破壊のため復元。 |
| v2026.05.07-issue517-followup-auto-summary | 2026-05-07 | Issue #517 post-release 30 day auto-summary foundation を `spec_created / implementation / NON_VISUAL / channel-bootstrap-preflight` として同期。`.github/workflows/post-release-30day-auto-summary.yml`、`scripts/post-release-dashboard/30day-summary.sh` / `lib/aggregate.sh`、draft PR 冪等規約、Slack channel `w1618436027-ek2505248` の Incoming Webhook manual preflight、`SLACK_WEBHOOK_URL` Secret、`CONTRACT_READY_SECRET_PENDING` / `CONTRACT_READY_RUNTIME_PENDING` 境界を `deployment-gha.md` に正本化。 |
| v2026.05.07-task02-wrangler-env-injection | 2026-05-07 | UI prototype alignment / MVP recovery task-02 wrangler env injection を `implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として同期。`apps/web/wrangler.toml` の non-secret vars、`.dev.vars.example`、`apps/web/src/lib/env.ts` zod accessor、env tests、Phase 12 strict outputs、quick-reference/resource-map/task-workflow-active/LOGS を同一 wave で反映。Cloudflare Secrets 値投入、runtime dry-run、commit/push/PR は user-gated。 |
| v2026.05.07-issue503-cursor-semantics-shadow | 2026-05-07 | Issue #503 UT-07B-FU-01 cursor semantics migration を `implemented-local / implementation / NON_VISUAL / runtime evidence pending_user_gate` として同期。`BACKFILL_CURSOR_MODE` shadow A/B、queue consumer + initial apply path 適用、既存 `schema_diff_queue.backfill_cursor` 再利用、stale cursor null reset による row-skip 防止、`0015` migration adoption-gated 境界、artifact inventory / quick-reference / resource-map / task-workflow-active / database schema / operations を反映。 |
| v2026.05.07-issue502-dlq-monitoring | 2026-05-07 | Issue #502 UT-07B-FU-01 DLQ monitoring dashboard follow-up を `spec_created / docs-only / NON_VISUAL / contract_ready_runtime_pending` として同期。`docs/runbooks/dlq-monitoring/schema-alias-backfill.md`、`references/dlq-monitoring.md`、`changelog/20260507-issue502-dlq-monitoring.md`、quick-reference/resource-map/task-workflow-active/topic-map/keywords を反映。Cloudflare Queue / DLQ binding 名、D1 `schema_diff_queue` 監視列、read-only 集計 SQL 3 種、しきい値（DLQ >= 1 / retry >= 3 / exhausted 24h）、`last_error` SELECT 禁止、Issue #502 CLOSED 維持を正本化。実 D1 SQL / dash runtime evidence は user approval 後に取得する。 |
| v2026.05.07-issue504-schema-alias-50k-stress-trial | 2026-05-07 | Issue #504 UT-07B-FU-01 extended fixture 50k row follow-up を `spec_created / implementation / NON_VISUAL / staging stress trial user-gated` として同期。`scripts/schema-alias-backfill/` の fixture generation / staging-only seed-cleanup / 10 trial driver、prefix付き `dedupe_key` cleanup contract、trigger path `/admin/schema/backfill/trigger`、abort thresholds (`retry_count<=3`, `dlq_count=0`, `cpu_ms<=250000`, timeout 1800s)、Phase 12 strict outputs、resource-map / quick-reference / task-workflow-active / runbook SSOT を反映。Issue #504 は CLOSED 維持、PR 文脈は `Refs #504` のみ。 |
| v2026.05.07-ui-prototype-scope-gate | 2026-05-07 | UI prototype alignment / MVP recovery task-01 scope gate を `spec_created / docs-only / NON_VISUAL` として同期。`SCOPE.md` の 19 routes、既存 API のみ接続、OKLch token 正本化、completed-tasks archive rule、quick-reference/resource-map/task-workflow-active/changelog を同一 wave で反映。 |
| v2026.05.06-issue378-tag-queue-paused-flag | 2026-05-06 | Issue #378 tag queue pause flag を `implemented-local / implementation / NON_VISUAL / Phase 13 pending_user_approval` として同期。canonical workflow root は `docs/30-workflows/completed-tasks/issue-378-tag-queue-paused-flag/`。`TAG_QUEUE_PAUSED` は non-secret Cloudflare variable、`"true"` 完全一致のみ Forms sync candidate enqueue を D1 read/write 前に停止し `{ enqueued: false, reason: "paused" }` と structured log `UBM-TAGQ-PAUSED` を返す。source unassigned `task-issue-109-tag-queue-pause-flag-001.md` は consumed、旧親 docs の secret / 503 rollback 記述は stale-current として撤回。 |

## クイックスタート

### 仕様を探す

```bash
# キーワード検索（推奨）
node scripts/search-spec.js "認証" -C 5

# または resource-map.md でタスク種別から逆引き
```

### 仕様を読む

1. **まず [resource-map.md](indexes/resource-map.md) を確認** - タスク種別と current canonical set を特定
2. 該当ファイルを `Read` ツールで参照
3. 詳細行番号や完全ファイル一覧が必要な場合は [topic-map.md](indexes/topic-map.md) と `node scripts/list-specs.js --topics` を参照

### 仕様を作成・更新

1. `templates/` 配下の該当テンプレートを使用
2. `references/spec-guidelines.md` と `references/spec-splitting-guidelines.md` を見て、classification-first で更新する
3. 編集後は `node scripts/generate-index.js` を実行

## ワークフロー

```
                    ┌→ search-spec ────┐
user-request → ┼                       ┼→ read-reference → apply-to-task
                    └→ browse-index ───┘
                              ↓
                    (仕様変更が必要な場合)
                              ↓
              ┌→ create-spec ──────────┐
              ┼                         ┼→ update-index → validate-structure
              └→ update-spec ──────────┘
```

## Task 仕様ナビ

| Task | 責務 | 起動タイミング | 入力 | 出力 |
| ---- | ---- | -------------- | ---- | ---- |
| search-spec | 仕様検索 | 仕様確認が必要な時 | キーワード | ファイルパス一覧 |
| browse-index | 全体像把握 | 構造理解が必要な時 | なし | トピック構造 |
| read-reference | 仕様参照 | 詳細確認が必要な時 | ファイルパス | 仕様内容 |
| create-spec | 新規作成 | 新機能追加時 | 要件 | 新規仕様ファイル |
| update-spec | 既存更新 | 仕様変更時 | 変更内容 | 更新済みファイル |
| update-index | インデックス化 | 見出し変更後 | references/ | indexes/ |
| validate-structure | 構造検証 | 週次/リリース前 | 全体 | 検証レポート |

## リソース参照

### indexes/（Progressive Disclosure 起点）

| ファイル | 内容 | 用途 |
| -------- | ---- | ---- |
| `quick-reference.md` | キー情報の即時アクセス（推奨・最初に読む） | パターン/型/API 早見表 |
| `resource-map.md` | リソースマップ（読み込み条件付き） | タスク種別 → ファイル |
| `topic-map.md` | トピック別マップ（セクション・行番号詳細） | セクション直接参照 |
| `keywords.json` | キーワード索引（自動生成） | スクリプト検索用 |

> **Progressive Disclosure**: まず `resource-map.md` でタスクに必要なファイルを特定し、必要なファイルのみを読み込む。詳細セクション・行番号は `topic-map.md` を参照。

### 仕様ファイル一覧（カテゴリ別概要）

完全な一覧は [indexes/resource-map.md](indexes/resource-map.md) と [indexes/topic-map.md](indexes/topic-map.md) を参照。

| カテゴリ | 主要ファイル |
| -------- | ------------ |
| 概要・品質 | overview.md, quality-requirements.md |
| アーキテクチャ | architecture-overview.md, architecture-patterns.md, arch-\*.md |
| インターフェース | interfaces-agent-sdk.md, llm-\*.md, rag-search-\*.md |
| API 設計 | api-core.md, api-endpoints.md, api-internal-\*.md |
| データベース | database-schema.md, database-implementation.md |
| UI/UX | ui-ux-components.md, ui-ux-design-principles.md, ui-history-\*.md |
| セキュリティ | security-principles.md, csrf-state-parameter.md, security-\*.md |
| 技術スタック | technology-core.md, technology-frontend.md, technology-backend.md |
| Claude Code | claude-code-overview.md, claude-code-skills-\*.md |
| デプロイ・運用 | deployment.md, deployment-cloudflare.md, environment-variables.md |
| ガイドライン | spec-guidelines.md, development-guidelines.md, architecture-implementation-patterns.md |

**注記**: 18-skills.md（Skill 層仕様書）は `skill-creator` スキルで管理。

### scripts/

| スクリプト | 用途 | 使用例 |
| ---------- | ---- | ------ |
| `search-spec.js` | キーワード検索 | `node scripts/search-spec.js "認証" -C 5` |
| `list-specs.js` | ファイル一覧 | `node scripts/list-specs.js --topics` |
| `generate-index.js` | インデックス再生成 | `node scripts/generate-index.js` |
| `validate-structure.js` | 構造検証 | `node scripts/validate-structure.js` |
| `select-template.js` | テンプレート選定 | `node scripts/select-template.js "API仕様"` |
| `split-reference.js` | 大規模ファイル分割 | `node scripts/split-reference.js <file>` |
| `remove-heading-numbers.js` | 見出し番号削除 | `node scripts/remove-heading-numbers.js` |
| `log_usage.js` | 使用状況記録 | `node scripts/log_usage.js --result success` |

### agents/

| エージェント | 用途 | 対応 Task |
| ------------ | ---- | --------- |
| [create-spec.md](agents/create-spec.md) | 新規仕様作成 | create-spec |
| [update-spec.md](agents/update-spec.md) | 既存仕様更新 | update-spec |
| [validate-spec.md](agents/validate-spec.md) | 仕様検証 | validate-structure |

### templates/

新規仕様書作成時のテンプレート。`node scripts/select-template.js` で自動選定可能。代表ファイル: `spec-template.md` / `interfaces-template.md` / `architecture-template.md` / `api-template.md` / `database-template.md` / `ui-ux-template.md` / `security-template.md` / `testing-template.md` / `react-hook-template.md` / `react-context-template.md` / `service-template.md`。詳細は templates/ 配下を直接参照。

### references/（ガイドライン）

| ファイル | 内容 |
| -------- | ---- |
| `spec-guidelines.md` | 命名規則・記述ガイドライン |
| `spec-splitting-guidelines.md` | 大規模ファイル分割ガイドライン |
| `ui-result-panel-pattern.md` | ResultPanel コンポーネント設計パターン |
| `lessons-learned-skill-wizard-redesign.md` | Skill Wizard Redesign 実装知見 |
| `r2-storage-decision-guide.md` | R2 ストレージ採用案決定フロー |

### 連携スキル

| スキル | 用途 |
| ------ | ---- |
| `task-specification-creator` | タスク仕様書作成、Phase 12 での仕様更新ワークフロー管理 |

**Phase 12 仕様更新時**: `.claude/skills/task-specification-creator/references/spec-update-workflow.md` を参照

### 運用ファイル

| ファイル | 用途 |
| -------- | ---- |
| `EVALS.json` | スキルレベル・メトリクス管理 |
| `LOGS.md` | 使用履歴・フィードバック記録 |
| `SKILL-changelog.md` | 変更履歴の全記録（本体には最新 3 件のみ） |

## ベストプラクティス

### すべきこと

- キーワード検索で情報を素早く特定
- 編集後は `node scripts/generate-index.js` を実行
- 500 行超過時は classification-first で parent / child / history / archive / discovery を同一 wave で分割

### 避けるべきこと

- references/ 以外に仕様情報を分散
- インデックス更新を忘れる
- 詳細ルールを SKILL.md に追加（→ spec-guidelines.md へ）

**詳細ルール**: See [references/spec-guidelines.md](references/spec-guidelines.md)
