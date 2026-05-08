# Phase 1: 要件定義

実装区分: 実装仕様書（CONST_004 デフォルト適用 — `.claude/skills/task-specification-creator/` 配下に reference を 2 件新設し、SKILL.md / SKILL-changelog.md / LOGS/_legacy.md を編集する。`mise exec -- pnpm indexes:rebuild` 実行と ledger diff を伴う）

## 真の論点

| # | 論点 | 決定方針 | 決定根拠 |
| --- | --- | --- | --- |
| Q1 | workflow_state 状態定義をどこに集約するか | 新規 `references/workflow-state-vocabulary.md` を単一正本とし、既存 reference からは link のみ張る | 既存 reference に分散させると正本が再び拡散する。新ファイル単一正本方針が CONST_001（正本一元化）に整合 |
| Q2 | compliance-check テンプレを vocabulary と統合するか分離するか | 分離（`references/phase12-compliance-check-template.md` 新設） | vocabulary は「語彙の定義」、compliance-check は「観点リスト + 検証コマンド + drift パターン例」で責務が異なる。Clean Code SRP に従い分離 |
| Q3 | 状態名のリネームを行うか | 行わない（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 等は維持） | SKILL-changelog.md に既存状態名が version 行として記録済み。改名は遡及影響大。長さ起因の誤用は禁止表記の明示で対処 |
| Q4 | hook / lefthook / CI gate での機械的強制を本タスクに含めるか | 含めない（reference 末尾に「機械的強制が必要」とのみ明記し、後続タスクで分離） | スコープ肥大を防ぐ。親タスクの skill-feedback-report.md でも文書化を本タスクのスコープと指定 |
| Q5 | 既存 reference からの link 追加範囲 | `phase-12-spec.md` / `phase12-skill-feedback-promotion.md` / `phase-template-phase11.md` の 3 ファイルに限定 | 親タスク spec stub で promotion target として明記された 3 ファイルに揃える |
| Q6 | indexes 再生成の取り扱い | 同一コミットで `mise exec -- pnpm indexes:rebuild` を実行し、diff を含めてコミット | CLAUDE.md 規定の `verify-indexes-up-to-date` gate を緑にするため必須 |
| Q7 | aiworkflow-requirements skill への波及 | ledger / indexes sync はスコープ内、ドメイン仕様変更はスコープ外 | Issue #534 を workflow inventory から検索できるようにするため、quick-reference / resource-map / task-workflow-active / LOGS / SKILL-changelog は同一 wave で同期する。CLAUDE.md / docs/00-getting-started-manual/specs/ への仕様変更は行わない |

## 現状ベースライン（既存実装の事実）

| 既存 | パス / 識別子 | 本タスクでの扱い |
| --- | --- | --- |
| reference | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | 新 reference へ link 追加 |
| reference | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` | 新 reference へ link 追加 |
| reference | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | 新 reference へ link 追加 |
| skill index | `.claude/skills/task-specification-creator/SKILL.md` References 表 | 行 2 件追加 |
| changelog | `.claude/skills/task-specification-creator/SKILL-changelog.md` | version 行追加 |
| usage log | `.claude/skills/task-specification-creator/LOGS/_legacy.md` | usage log 追加 |
| 親タスク証跡 | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/skill-feedback-report.md` | promotion target の正本（読み取りのみ） |
| 親タスク証跡 | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/phase12-task-spec-compliance-check.md` | compliance テンプレ抽出元（読み取りのみ） |

## 不変条件と本タスクの関係

| 不変条件 | 影響 | 守り方 |
| --- | --- | --- |
| skill 正本一元化（重複定義を作らない） | 直接該当 | 状態定義は新 reference 単一正本。既存 reference は link のみ |
| `verify-indexes-up-to-date` CI gate | 直接該当 | 同一コミットで indexes:rebuild を実行し diff をコミット |
| 既存 SKILL-changelog.md の version 連番性 | 直接該当 | 既存最新 version 行の上に追記し過去行は変更しない |
| 既存状態名の不変 | 該当 | 改名せず、誤用は禁止表記の明示で対処 |
| docs-only spec_created の workflow_state 据え置き | 直接該当 | 本タスクの artifacts.json は `workflow_state: spec_created` を維持し、Phase 12 close-out で `completed` 化のタイミングを reference 自身の説明と合致させる |

## automation-30 4条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 状態定義の単一正本化 + 既存 reference link で responsibility が明確 |
| 漏れなし | PASS | vocabulary / compliance-check / SKILL.md References / 既存 reference link / changelog / LOGS / indexes 再生成を対象化 |
| 整合性あり | PASS | 既存状態名・既存 SKILL-changelog version 連番を保持 |
| 依存関係整合 | PASS | 親タスク Phase 12 成果物が `completed-tasks/` に存在し、読み取りのみで参照可能 |

## エスカレーション条件

- 親タスク Phase 12 成果物（skill-feedback-report.md / phase12-task-spec-compliance-check.md）の絶対パスが移動していた場合 → ユーザー確認の上、index.md / phase-01.md の「現状ベースライン」を更新する
- `mise exec -- pnpm indexes:rebuild` で aiworkflow-requirements indexes 以外の差分が発生した場合 → 影響範囲を確認し、想定外なら commit 前にユーザー報告

## 次フェーズへの引き渡し

Phase 2 設計書では以下を成果物化する:

- `outputs/phase-02/vocabulary-structure.md`（workflow-state-vocabulary.md の章立て / 状態 → 必要証跡マッピング表のスケルトン / 禁止表記節）
- `outputs/phase-02/compliance-check-template-structure.md`（テンプレの 3 部構成: 観点リスト / 検証コマンド / drift パターン例）
- `outputs/phase-02/changed-files.md`（CONST_005 必須項目: 変更対象ファイル一覧 / 変更種別 / DoD）
