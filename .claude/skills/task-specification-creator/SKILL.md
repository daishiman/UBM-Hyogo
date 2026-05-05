---
name: task-specification-creator
description: |
  タスクを単一責務原則で分解しPhase 1-13の実行可能な仕様書を生成。Phase 12は中学生レベル概念説明を含む。
  Anchors:
  • Clean Code / 適用: SRP / 目的: タスク分解基準
  • Continuous Delivery / 適用: フェーズゲート / 目的: 品質パイプライン
  • DDD / 適用: ユビキタス言語 / 目的: 用語統一
  Trigger:
  タスク仕様書作成, タスク分解, ワークフロー設計, Phase実行, インテグレーション設計, ワークフローパッケージ, Cloudflare Workers, Web API設計, 外部連携パッケージ
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

# Task Specification Creator

開発タスクを Phase 1〜13 の実行可能な仕様書へ落とし込む。`SKILL.md` は入口だけを持ち、詳細は `references/` と `LOGS.md` に分離する。

## 変更履歴

詳細は [SKILL-changelog.md](SKILL-changelog.md) を参照。最新 3 件のみ列挙する。

| Version | Date | Changes |
| --- | --- | --- |
| v2026.05.05-task-05a-form-preview-503-bugfix-runbook-integrity | 2026-05-05 | task-05a-form-preview-503-001 の Phase 12 skill-feedback を反映。`references/phase12-skill-feedback-promotion.md` Applied Examples に bugfix / NON_VISUAL タスクの routing decision を 1 行追加。runbook 内 seed file 参照と `schema_versions.state` inline SQL の整合性を同 wave で実ドキュメント側に補正し、テンプレ差分は no-op routing。`logWarn({ code: "UBM-5500", context })` 構造化ログ追加と TC-RED-03 ルート 503 contract test 配置、runtime curl evidence を `PENDING_RUNTIME_EVIDENCE` で Phase 11 close-out する流れを併記。 |
| v2026.05.04-ut07b-fu04-already-applied-verification | 2026-05-04 | UT-07B-FU-04 review feedback を反映。production D1 ledger 既適用時は apply execution を already-applied verification へ再分類し、`d1 migrations apply` を forbidden path、`apply.log` を no-op prohibition evidence とする。post-check は target migration owned objects のみに限定し、placeholder evidence と fresh runtime evidence を Phase 12 で分離する。 |
| v2026.05.03-ut-05a-deploy-verification-two-path | 2026-05-03 | UT-05A fetchPublic service-binding workflow の skill feedback を反映。Cloudflare Workers の deploy-verification 型 Phase 11 では code diff / staging curl / production curl / tail / local fallback / redaction を分け、未実行 runtime evidence を PASS 化しない。service-binding + HTTP fallback の two-path 実装は AC を runtime path × evidence で記録する。 |
| v2026.05.04-ut-09a-cloudflare-cli-non-visual | 2026-05-04 | UT-09A Cloudflare auth token injection recovery feedback を反映。Cloudflare CLI / shell wrapper 系 NON_VISUAL Phase 11 は `phase-11-cloudflare-cli-non-visual-evidence.md` を使い、`main.md` PASS 後に helper artifacts / artifacts ledgers / Phase 12 compliance / aiworkflow index を同一 wave で runtime state に同期する。`whoami` exit 0 と deploy scope PASS を混同しない。 |
| v2026.05.03-issue394-pass-with-blocker-parity | 2026-05-03 | Issue #394 stableKey strict CI gate review feedback を反映。`implementation / NON_VISUAL` でも現行 blocker により code change が unsafe な場合は `PASS_WITH_BLOCKER` を許容するが、root/outputs `artifacts.json` parity、current evidence と planned evidence の分離、Phase 12 compliance の実体一致、skill feedback promoted 証跡を同 wave で必須化。 |
| v2026.05.02-ut07b-fu03-runbook-evidence | 2026-05-02 | UT-07B-FU-03 production migration apply runbook の Phase 12 skill feedback を反映。production apply を実行しない NON_VISUAL runbook formalization では Phase 11 evidence を `structure-verification.md` / `grep-verification.md` / `staging-dry-run.md` / `redaction-check.md` に標準化し、`DOC_PASS` と runtime PASS を分離する。runbook formalization は root workflow state を `completed` に昇格せず `spec_created` + Phase 13 approval gate を維持する。 |
| v2026.05.02-issue355-deploy-deferred-evidence-contract | 2026-05-02 | Issue #355 OpenNext Workers CD cutover spec review feedback を反映。`implementation / NON_VISUAL / deploy-deferred` workflow では Phase 11 の declared outputs を必ず実体化し、実測ログが未取得の場合は `PENDING_IMPLEMENTATION_FOLLOW_UP` evidence contract として保存する。Phase 7 は runtime `OK/PASS` ではなく `COVERED_BY_PLANNED_TEST` / `gate defined / pending follow-up execution` を使い、Phase 13 declared files は commit / push / PR / deploy 禁止を明示した blocked placeholder として配置する。 |
| v2026.05.02-06a-a-visual-on-execution-classifier | 2026-05-02 | 06a-A public-web real workers D1 smoke execution の skill feedback を反映。`scripts/validate-phase-output.js` の `classifyVisualEvidence` 正規表現を拡張し、`VISUAL_ON_EXECUTION` / `VISUAL_DEFERRED` を `non_visual` / `docs-only` / `spec_created` と同列に扱う。Phase 11 で実装/設計完了済みかつ UI 証跡を後続 runtime smoke で取得するタスクの誤検出（実行前スクリーンショット不足）を解消。`references/task-type-decision.md` に `VISUAL_ON_EXECUTION` の運用ルールを追記。 |
| v2026.05.01-route-inventory-design-sync | 2026-05-01 | UT-06-FU-A route inventory script design close-out feedback を反映。docs-only design workflow が新 workflow root と implementation follow-up を作る場合、Phase 12 Step 1 で「実 command / output path の contract 昇格 no-op」と「workflow tracking / open follow-up / artifact inventory 同期」を分離して閉じる運用を追加。`InventoryReport` の competing schema（`reason` vs `notes`）や endpoint drift は Phase 12 で SSOT に戻す。`references/phase12-skill-feedback-promotion.md` に **Phase index / artifacts parity early gate**（Phase 0/1 で `index.md` と `artifacts.json.phases` の整合・root/outputs parity・canonical Phase 12 filename pre-check）と **Design GO / runtime GO 分離ルール**（docs-only design workflow で Phase 10/11/12 を Design GO のみで閉じ、実 command / output path の runtime GO は implementation follow-up 完了時に取得）を追加。 |
| v2026.05.01-05b-a-env-contract-evidence | 2026-05-01 | 05b-A auth mail env contract alignment の skill feedback を反映。env-name contract docs-only workflow では Phase 11 NON_VISUAL evidence を `env-name-grep.md` / `secret-list-check.md` / `magic-link-smoke-readiness.md` の 3 点に標準化し、Phase 12 strict 7 files は template 記載だけでなく `outputs/phase-12/` 実体確認で閉じる運用を追加。 |
| v2026.05.01-ut-07a-02-contract-path-discovery | 2026-05-01 | UT-07A-02 search-tags resolve contract follow-up skill-feedback 反映。Phase 2 で存在しない慣用パスを仮置きしないよう、`references/phase-template-core.md` に current repo layout discovery を追加。shared schema SSOT を API と web が既に共有できる場合は重複 union 型を作らず、追従対象表に source-of-truth file と consumer file を明記する。 |
| v2026.05.01-adr-topology-drift-phase12-feedback | 2026-05-01 | UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION の skill feedback を反映。ADR 起票 / deploy target decision / topology drift docs-only task では Phase 1 に base case 別差分マトリクスを置き、Phase 4 doc-only grep、Phase 11 NON_VISUAL evidence、Phase 12 Step 2 stale contract withdrawal を標準化。 |

## 設計原則

| 原則                      | 説明                                                        |
| ------------------------- | ----------------------------------------------------------- |
| Script First              | 決定論的処理は `scripts/` で固定する                        |
| LLM for Judgment          | 判断、設計、レビューだけを LLM が担う                       |
| Progressive Disclosure    | 必要な reference だけを段階的に読む                         |
| 1 File = 1 Responsibility | 大きくなった guide は family file へ分離する                |
| `.claude` Canonical       | 正本は `.claude/skills/...`、`.agents/skills/...` は mirror |

## 要件レビュー思考法（要約）

要件・設計レビューでは、システム系 / 戦略・価値系 / 問題解決系の 3 系統を必ず通し、真の論点 / 因果と境界 / 価値とコスト / 改善優先順位 / 4 条件評価を明示してから Phase 1 へ進む。詳細手順は [references/requirements-review.md](references/requirements-review.md) を参照。

## タスクタイプ判定（要約）

タスク作成前に **taskType**（implementation / docs-only）と **visualEvidence**（VISUAL / NON_VISUAL）を確定し、Phase 1 〜 artifacts.json 生成まで一貫して使う。判定フローと各分岐の運用ルールは [references/task-type-decision.md](references/task-type-decision.md) を参照。

---

## クイックスタート

| モード              | 用途                               | 最初に読むもの                                                                           |
| ------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `create`            | 新規 workflow を作る               | [references/create-workflow.md](references/create-workflow.md)                           |
| `execute`           | Phase 1〜13 を順番に実行する       | [references/execute-workflow.md](references/execute-workflow.md)                         |
| `update`            | 既存仕様書を修正する               | [references/phase-templates.md](references/phase-templates.md)                           |
| `detect-unassigned` | Phase 12 の残課題を formalize する | [references/phase-12-documentation-guide.md](references/phase-12-documentation-guide.md) |

```bash
node scripts/detect-mode.js --request "{{USER_REQUEST}}"
```

## 実行フロー（要約）

`create` フローは `agents/decompose-task.md` → `agents/identify-scope.md` → `agents/design-phases.md` → `agents/generate-task-specs.md` → `agents/output-phase-files.md` → `agents/update-dependencies.md` → `agents/verify-specs.md` の順で gate を通す。`execute` フローは Phase 1（要件定義）〜 Phase 13（PR 作成）の 13 段階を順次実行する。各 Phase の目的と Feedback 注釈、Task 仕様ナビ表は [references/phase-templates.md](references/phase-templates.md) を参照。

## Phase 12 重要仕様（要約）

Phase 12 は次の **6 必須タスク** を実行し、最低 7 ファイルを実体確認する（Task 6 は実態として全タスクが生成しているため 6 番目に昇格）:

1. 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）
2. システム仕様書更新（Step 1-A/B/C + 条件付き Step 2）
3. ドキュメント更新履歴作成
4. 未タスク検出レポート作成（**0 件でも出力必須**。coverage 型タスクは coverage layer 表 `file/before%/after%/delta%` で代替可能）
5. スキルフィードバックレポート作成（**改善点なしでも出力必須**。章立ては「テンプレ改善 / ワークフロー改善 / ドキュメント改善」の 3 観点固定）
6. タスク仕様書コンプライアンスチェック（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

詳細仕様（Part 1/2 セルフチェック・Step 1-A〜1-D ルール・`spec_created` close-out・docs-only → code 再判定）は [references/phase-12-spec.md](references/phase-12-spec.md)。`spec_created` / docs-only / NON_VISUAL は root workflow state を据え置き、Phase status と 7 ファイル実体・current/baseline 監査値で検証する。よくある漏れ（UBM-009〜017 含む）と苦戦防止 Tips は [references/phase-12-pitfalls.md](references/phase-12-pitfalls.md)。

## 重要ルール（要約）

- **Phase 完了時の必須アクション**: タスク完全実行 / 成果物確認 / `complete-phase.js` で artifacts.json 更新 / 完了条件チェック明記
- **PR 作成は自動実行しない**: 必ずユーザーの明示的な許可を得てから実行する
- **Phase 12 と Phase 13 の境界**: Task 12-1〜12-5 の完了条件と Phase 13（commit/PR）の承認ゲート

詳細と検証コマンド一覧は [references/quality-gates.md](references/quality-gates.md) を参照。

## agent 導線

- [agents/decompose-task.md](agents/decompose-task.md)
- [agents/identify-scope.md](agents/identify-scope.md)
- [agents/design-phases.md](agents/design-phases.md)
- [agents/generate-task-specs.md](agents/generate-task-specs.md)
- [agents/output-phase-files.md](agents/output-phase-files.md)
- [agents/update-dependencies.md](agents/update-dependencies.md)
- [agents/verify-specs.md](agents/verify-specs.md)
- [agents/update-system-specs.md](agents/update-system-specs.md)
- [agents/generate-unassigned-task.md](agents/generate-unassigned-task.md)

## References

| topic | path |
| --- | --- |
| 要件レビュー思考法 | [references/requirements-review.md](references/requirements-review.md) |
| タスクタイプ判定フロー | [references/task-type-decision.md](references/task-type-decision.md) |
| Phase テンプレ詳細（Phase 1〜13 / Task ナビ） | [references/phase-templates.md](references/phase-templates.md) |
| Phase 12 重要仕様（5 タスク詳細） | [references/phase-12-spec.md](references/phase-12-spec.md) |
| Phase 12 skill feedback promotion | [references/phase12-skill-feedback-promotion.md](references/phase12-skill-feedback-promotion.md) |
| Phase 12 よくある漏れ / 苦戦防止 Tips | [references/phase-12-pitfalls.md](references/phase-12-pitfalls.md) |
| Phase 12 sync パターン（aiworkflow-requirements 同時更新 / workflow root 移動チェックリスト） | [references/patterns-phase12-sync.md](references/patterns-phase12-sync.md) |
| 品質ゲート / Phase 境界 / 検証コマンド導線（commands.md とハブ関係） | [references/quality-gates.md](references/quality-gates.md) |
| オーケストレーション / リソース導線 / ベストプラクティス | [references/orchestration.md](references/orchestration.md) |
| NON_VISUAL governance パターン（Phase 8 単一正本 YAML / check-runs 並走 / Phase 13 二重承認） | [lessons-learned/non-visual-governance-pattern.md](lessons-learned/non-visual-governance-pattern.md) |

## 最小 workflow

```
decompose-task → identify-scope → design-phases → generate-task-specs
   → output-phase-files → update-dependencies → verify-specs
   → (Phase 1〜13 を execute) → update-system-specs (Phase 12)
   → generate-unassigned-task (条件分岐)
```

詳細な履歴と usage log は [LOGS.md](LOGS.md)、[SKILL-changelog.md](SKILL-changelog.md)、[references/logs-archive-index.md](references/logs-archive-index.md) を参照。

## タスクタイプ判定フロー（docs-only / NON_VISUAL）

Phase 1 で `artifacts.json.metadata.visualEvidence` を必ず確定する。未設定で Phase 11 縮約テンプレが
発火しない事故を防ぐため、Phase 1 完了条件として必須化する（[references/phase-template-phase1.md](references/phase-template-phase1.md) §「Phase 1 必須入力: artifacts.json.metadata.visualEvidence」）。

### 発火マトリクス

| 入力（artifacts.json.metadata） | 適用テンプレ |
| --- | --- |
| `taskType: docs-only` かつ `visualEvidence: NON_VISUAL` | [references/phase-template-phase11.md](references/phase-template-phase11.md) §「docs-only / NON_VISUAL 縮約テンプレ」+ Phase 12 docs-only 判定ブランチ |
| `taskType: docs-only` かつ `visualEvidence: VISUAL` | UI task 追加要件（screenshot 必須） |
| `taskType: implementation` 等 | 通常テンプレ |

### 状態分離（spec_created vs completed）

| レイヤ | フィールド | 値の意味 |
| --- | --- | --- |
| workflow root | `metadata.workflow_state` または `index.md` メタ「状態」 | `spec_created` = 仕様書作成済 / 実装着手前。Phase 12 close-out で書き換えない |
| Phase 別 | `phases[].status` | `completed` / `pending` / `blocked` |

Phase 12 close-out で workflow root を `completed` に書き換えるのは実装完了タスクのみ。
docs-only / `spec_created` タスクは workflow root を据え置き、`phases[].status` のみ更新する。

### 第一適用例（drink-your-own-champagne）

`docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/` 自身が本フローの第一適用例。
