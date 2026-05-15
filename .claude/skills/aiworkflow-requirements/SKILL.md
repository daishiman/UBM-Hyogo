---
name: aiworkflow-requirements
description: |
  ubm-hyogo Webアプリの正本仕様を `references/` から検索・参照・更新するスキル。`resource-map` / `quick-reference` / `topic-map` / `keywords` を起点に必要最小限だけ読む。用途は要件確認、設計・API契約確認、UI/状態管理/セキュリティ判断、`task-workflow` / `lessons-learned` / 未タスク同期。主要対象は Cloudflareデプロイ、Webアプリアーキテクチャ、インテグレーションパッケージ（packages/integrations/）、ブランチ戦略（feature/dev/main）、シークレット管理（CF/GitHub/1Password）、認証、スキルライフサイクル、UI設計、セキュリティ要件。Anchors: Specification-Driven Development, Progressive Disclosure。Trigger: 仕様確認、仕様更新、task-workflow同期、lessons-learned同期、API契約確認、セキュリティ要件確認、Cloudflare、Pages、Workers、D1、R2、r2_buckets、KV、デプロイ、認証、スキルライフサイクル、UI設計、データベース設計、RAG、検索、インテグレーション、ブランチ戦略、シークレット管理、Secrets、Variables、environment-scoped、repository-scoped、配置決定マトリクス、1Password 正本、GitHub 派生コピー、ストレージ、presigned URL、オブジェクトストレージ、legacy umbrella close-out、stale-current classification、post-release-dashboard、redaction-check、30 day gate、30day-contract、formalized contract、failure rate gate、schedule feedback、external-time-dependent、3-fence detection、DLQ、dead-letter、Cloudflare Queue 監視、observability runbook、dlq-monitoring、schema-alias-backfill、schema_diff_queue、NON_VISUAL、docs-only spec、canonical root existence gate、full mirror artifacts parity、Phase 11 10 screenshots, Phase 12 strict 7 outputs、screen blueprints admin、09g、primitives-harness、ENABLE_PRIMITIVES_HARNESS、dev-only route gating、Playwright+axe evidence、VISUAL_ON_EXECUTION 2段階 state、implemented_local_evidence_captured。
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
| v2026.05.15-issue324-shared-package-type-contracts | 2026-05-15 | Issue #324 / UT-08A-05 shared package type contracts を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期。`packages/shared/src/__tests__/type-contracts.spec.ts`、Phase 11 local evidence、Phase 12 strict 7、source unassigned completed trace、quick-reference/resource-map/task-workflow-active/changelog/LOGS を反映。Issue #324 は CLOSED 維持、PR は `Refs #324` のみ。 |
| v2026.05.13-issue627-composite-setup-action | 2026-05-13 | Issue #627 RB-02 composite setup action を `implemented_local_runtime_pending / implementation / NON_VISUAL` として同期。checkout-less `.github/actions/setup-project/action.yml`、7 workflow call sites、SHA-pinned nested actions、workflow actionlint と composite structure gate の分離、Phase 11 local static evidence、quick-reference/resource-map/task-workflow-active/changelog を反映。Runtime GHA evidence、commit、push、PR は user-gated。 |
| v2026.05.11-issue616-miniflare-undici-tracking | 2026-05-11 | Issue #616 Miniflare / undici upstream tracking を `verified_current_no_code_change_pending_pr / implementation / NON_VISUAL / conditional` として同期。2026-05-11 read-only release triage で上流改善なしを確認し、`apps/api/package.json#scripts.test:coverage` の `--maxWorkers=1 --minWorkers=1` 維持、Phase 11 evidence、Phase 12 strict 7、runbook pointer、quick-reference/resource-map/task-workflow-active/artifact inventory/changelog を反映。future A/B は `--maxWorkers=2 → 4 → auto` 段階評価、commit / push / PR は user-gated。 |

## 設計原則

| 原則 | 説明 |
| --- | --- |
| Progressive Disclosure | 必要な reference だけを段階的に読む |
| Index First | resource-map / quick-reference / topic-map / keywords を起点にする |
| Same-wave Sync | 仕様・索引・workflow 台帳・LOGS を同一 wave で同期する |
| Evidence Boundary | planned evidence と captured evidence を混同しない |

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
