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

| Version | Date | Changes |
| --- | --- | --- |
| v2026.04.30-ut21-legacy-umbrella-closeout | 2026-04-30 | UT-21 Forms sync conflict close-out の Phase 12 feedback を反映。docs-only / NON_VISUAL / `spec_created` の legacy umbrella close-out では、旧仕様を削除せず状態欄で legacy 化し、現行正本・新設禁止 IF・後続 Uxx 分離先を `implementation-guide.md` / `system-spec-update-summary.md` / `unassigned-task-detection.md` に同時固定する運用例を追加。 |
| v2026.04.30-07c-attendance-audit-closeout | 2026-04-30 | 07c attendance audit API Phase 12 feedback を反映。API-only implementation task では Phase 11 screenshot 要求を実装範囲に合わせて NON_VISUAL evidence へ縮約し、Phase 12 implementation-guide に API 型・request/response/error/edge case を必須記載する運用を明確化。root / outputs `artifacts.json` parity と実装タスクの `taskType=implementation` への更新漏れを再発防止対象に追加。 |
| v2026.04.30-07a-status-alias-contract | 2026-04-30 | 07a tag queue resolve Phase 12 skill-feedback を反映。`references/phase-template-core.md` の Phase 2 ポイントに、既存 DB / API / shared schema の enum や status を拡張・alias する場合の **仕様語 ↔ 実装語対応表** と **追従対象（backend route / web client / shared zod / type / docs）** 明示を追加。`candidate/confirmed` と `queued/resolved` の drift、web client body、shared schema 追従漏れを再発防止する。 |
| v2026.04.30-07b-schema-alias-closeout-feedback | 2026-04-30 | 07b schema alias workflow Phase 12 final review feedback。実DB schema と task spec の差分（`response_fields.questionId` / `is_deleted` 不在、`queued/resolved` 実 enum、revision-scoped stableKey 更新）を実装前に検出するため、Phase 2/4/12 では `apps/api/migrations/*.sql` と repository contract の grep 照合を必須確認にする。back-fill / dryRun / apply union を持つ workflow は「即時 alias 確定」と「再開可能 back-fill」を分けて記述し、単発 API atomic 前提を書かない。 |
| v2026.04.30-utgov001-second-stage-reapply | 2026-04-30 | UT-GOV-001 second-stage reapply workflow review sync。implementation / NON_VISUAL / `spec_created` のまま Phase 13 approval + execute gate を扱う実例として、root / outputs `artifacts.json` parity、Phase 11 NON_VISUAL 必須3成果物 + 任意補助 `link-checklist.md`、Phase 12 7成果物、Phase 13 payload evidence path (`outputs/phase-13/branch-protection-payload-{dev,main}.json`) を揃える運用を反映。さらに `phase-template-phase13.md` / `phase-template-phase13-detail.md` に approval-gated NON_VISUAL implementation パターン（三役ゲート: user 承認 / 実 PUT / push&PR、rollback payload 上書き禁止 + merge前/後分離、コミット粒度 5 単位、Phase 13 fresh GET = applied evidence、`Refs #<issue>` 採用 / `Closes` 禁止）を正式テンプレ化し、`resource-map.md` から導線追加。 |
| v2026.04.29-ut09-direction-reconciliation-closeout | 2026-04-29 | UT-09 direction reconciliation Phase 12 review sync。docs-only / direction-reconciliation でも「記述レベル PASS」と「実測 PASS」を分離し、validator 未実行・未起票 unassigned-task・stale references 撤回待ちは PASS 化しない運用を skill-feedback に記録。root / outputs `artifacts.json` parity は実同期を必須化。 |
| v2026.04.29-phase12-subagent-profile | 2026-04-29 | Phase 12 feedback を反映。`references/phase-12-documentation-guide.md` に一括 SubAgent 実行プロファイルを追加し、監査並列 / 編集直列 / Step 2 判定 owner 固定 / open-done-baseline-duplicate 表 / validator 実測値で閉じる統合順を正本化。 |
| v2026.04.29-ut-cicd-drift-phase12-sync | 2026-04-29 | UT-CICD-DRIFT Phase 12 feedback を反映。docs-only drift cleanup では `docs-only/current facts/impl delegation/既存タスク委譲` を drift matrix で分離し、存在しない派生IDを正本に残さない運用を `references/phase-template-phase12.md` に追記。workflow lint 未導入など検証未実施 gate は改善提案止まりにせず未タスク化する。 |
| v2026.04.29-05a-auth-session-contract | 2026-04-29 | 05a Auth.js Google OAuth/admin gate Phase 12 feedback を反映。Phase 2 テンプレに OAuth / session / admin gate 系タスクの「session 型定義・JWT encode/decode 契約・provider 共有 ADR・実 cookie/token 互換テスト」を必須化し、Phase 5 OAuth client runbook 作成を明示（`references/phase-template-core.md`）。あわせて `references/unassigned-task-required-sections.md` の「リスクと対策」表を **2 列形式（リスク / 対策）を最低要件**に緩和し、影響列（高/中/低）は任意拡張とする運用に正本化（監査スクリプト未実装と整合、04c/05a の実用形式を反映）。 |
| v2026.04.29-parallel-wave-schema-ownership | 2026-04-29 | 04b Phase 12 feedback を受け、Phase 1 テンプレに「Schema / 共有コード Ownership 宣言」セクションを追加。並列 wave で共有 schema や `_shared/` の編集権を Phase 1 で明示することを必須化（`references/phase-template-phase1.md` の 1.X 節）。`admin_member_notes.note_type` の wave 越境を再発防止する。|
| v2026.04.28-claude-code-permissions-comparison-review | 2026-04-28 | `task-claude-code-permissions-project-local-first-comparison-001` の Phase 12 review で、docs-only 比較設計タスクでも root / outputs `artifacts.json` parity、必須見出し、LOGS / 正本仕様同期、後続タスク方針更新を同一 wave で閉じる必要を確認。比較設計テンプレート改善は LOGS と skill-feedback-report に記録。 |
| v2026.04.29-04c-evidence-bundle-task2-checklist | 2026-04-29 | 04c admin backoffice タスク Phase 12 skill-feedback で「root / outputs `artifacts.json` parity と NON_VISUAL の代替 evidence ファイル名が抜けやすい」と指摘。`assets/evidence-bundle-template.md` に Task 2（artifacts parity / NON_VISUAL manual-evidence 明示）チェック項目を追加。 |

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

Phase 12 は次の 5 必須タスクに加え、Task 6 compliance check（`outputs/phase-12/phase12-task-spec-compliance-check.md`）を作成し、最低 7 ファイルを実体確認する:

1. 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）
2. システム仕様書更新（Step 1-A/B/C + 条件付き Step 2）
3. ドキュメント更新履歴作成
4. 未タスク検出レポート作成（**0 件でも出力必須**）
5. スキルフィードバックレポート作成（**改善点なしでも出力必須**）

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
| Phase 12 よくある漏れ / 苦戦防止 Tips | [references/phase-12-pitfalls.md](references/phase-12-pitfalls.md) |
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
