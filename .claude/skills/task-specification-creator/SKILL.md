---
name: task-specification-creator
description: |
  タスクを単一責務原則で分解しPhase 1-13の実行可能な仕様書を生成。Phase 12は中学生レベル概念説明を含む。
  Anchors:
  • Clean Code / 適用: SRP / 目的: タスク分解基準
  • Continuous Delivery / 適用: フェーズゲート / 目的: 品質パイプライン
  • DDD / 適用: ユビキタス言語 / 目的: 用語統一
  Trigger:
  タスク仕様書作成, タスク分解, ワークフロー設計, Phase実行, インテグレーション設計, ワークフローパッケージ, Cloudflare Workers, Web API設計, 外部連携パッケージ, NON_VISUAL, docs-only spec, canonical root existence gate, full mirror artifacts parity, Phase 12 strict 7 outputs
  タスク仕様書作成, タスク分解, ワークフロー設計, Phase実行, インテグレーション設計, ワークフローパッケージ, Cloudflare Workers, Web API設計, 外部連携パッケージ, completed-tasks 移動, task path normalization, docs-only spec_created
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
| v2026.05.08-issue546-long-running-gha-observation | 2026-05-08 | Issue #546 CF audit-log 90 day baseline observation の Phase 12 feedback を反映。長期 GitHub Actions 観測では `gh api --paginate` + JSON array evidence を正本とし、JSON Lines `.json`、readiness 不足のゼロ件 PASS、baseline/helper 欠測の黙殺を禁止するルールを Phase 11 NON_VISUAL evidence guide に追加。 |
| v2026.05.07-task19-phase12-validator-promotion | 2026-05-07 | task-19 09c primitives full spec の Phase 12 review 続編を反映。`references/phase-12-documentation-guide.md` に (1) placeholder token grep 0 件 gate（禁止語リスト + コマンド逐語 + exit code 記録）、(2) §99 必須項目 content check（見出し存在ではなく本文 keyword 出現を `rg -n` で確認）、(3) docs-only 隣接コード差分検出（Phase 12 entry checklist 必須、`git status apps/ packages/` 出力転記）、(4) deterministic verify script の Phase 1-4 前倒し配置運用、(5) `documentation-changelog.md` 必須エントリ最小セット拡張（specs 個別 path / validator 実行記録セクション = コマンド + exit code + 件数 3 値必須）を追加。 |
| v2026.05.07-task19-placeholder-dirty-code-gates | 2026-05-07 | task-19 09c primitives full spec review feedback を反映。docs-only / NON_VISUAL close-out でも `apps/` / `packages/` dirty diff があれば分類・分離記録なしに PASS しない dirty-code gate、`token-sized` / `09b-token-value` / `token-mix` など placeholder token 0 件 gate、§99 content gate を Phase 12 compliance に追加。 |
| v2026.05.06-issue371-implemented-local-state-vocab | 2026-05-06 | Issue #371 UT-02A follow-up 003 Hono ctx DI migration の Phase 12 skill-feedback を反映。`spec_created` task に `apps/` / `packages/` の code wave が入った場合は同サイクル内で `implemented-local` へ再分類する手順を `references/phase-12-documentation-guide.md` に明文化。`CONTRACT_READY_IMPLEMENTATION_PENDING`（pre-code・docs/.claude のみ）と `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（local PASS 5 点取得済 + runtime pending）の使い分けマトリクスを追加。`references/phase-11-guide.md` に状態語彙対応表と Phase 11 evidence canonical path 規約 `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` を local PASS 5 点セットとして固定。 |
| v2026.05.07-task-06-ui-ux-contract-rewrite-classification | 2026-05-07 | task-06 UI/UX contract rewrite review feedback を反映。docs markdown のみでも正本仕様ファイルを全面 rewrite して後続実装 contract を unblock する場合は `implementation / NON_VISUAL` とし、`artifacts.json` / Phase 11 表現 / diff scope を一致させる。主成果物 M が宣言されている場合は同サイクルで実ファイルを更新し、無関係 D diff は active 正本参照を壊すため復元または formal trace を必須にする。 |
| v2026.05.06-issue371-implemented-local-state-vocab | 2026-05-06 | Issue #371 UT-02A follow-up 003 Hono ctx DI migration の Phase 12 skill-feedback を反映。`spec_created` task に `apps/` / `packages/` の code wave が入った場合は同サイクル内で `implemented-local` へ再分類する手順を `references/phase-12-documentation-guide.md` に明文化。`CONTRACT_READY_IMPLEMENTATION_PENDING`（pre-code・docs/.claude のみ）と `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（local PASS 5 点取得済 + runtime pending）の使い分けマトリクスを追加。 |
| v2026.05.06-workflow-path-existence-gate | 2026-05-06 | U-FIX-CF-ACCT-01-DERIV-02 token split review feedback を反映。CI/CD workflow 変更タスクでは Phase 2 / 5 / 9 / 12 で `.github/workflows/*.yml` の実在確認を必須化し、存在しない `deploy-staging.yml` / `deploy-production.yml` 等を正本として参照したまま PASS しない workflow path existence gate を追加。 |

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
| 未タスクテンプレ必須 4 セクション（苦戦箇所 / リスクと対策 / 検証方法 / スコープ） | [references/unassigned-task-required-sections.md](references/unassigned-task-required-sections.md) |
| 品質ゲート / Phase 境界 / 検証コマンド導線（commands.md とハブ関係） | [references/quality-gates.md](references/quality-gates.md) |
| オーケストレーション / リソース導線 / ベストプラクティス | [references/orchestration.md](references/orchestration.md) |
| NON_VISUAL governance パターン（Phase 8 単一正本 YAML / check-runs 並走 / Phase 13 二重承認） | [lessons-learned/non-visual-governance-pattern.md](lessons-learned/non-visual-governance-pattern.md) |
| NON_VISUAL 不可逆操作タスク（3-gate 分離 / migration literal / SSOT リテラル禁則 / runtime spec_created 起票） | [references/non-visual-irreversible-task-rules.md](references/non-visual-irreversible-task-rules.md) |
| Completed Tasks Path Normalization（Phase 13 完了後の `completed-tasks/<category>/` 移動 / `Refs #XXX` 連結 / metadata 据え置き） | [references/completed-tasks-policy.md](references/completed-tasks-policy.md) |

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
e-skill-sync/` 自身が本フローの第一適用例。
