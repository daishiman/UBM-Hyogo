# issue-534-skill-workflow-state-guidance — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | workflow_state 分類ガイダンスの task-specification-creator skill 本体への昇格 |
| タスクID | task-spec-skill-workflow-state-guidance |
| ディレクトリ | docs/30-workflows/issue-534-skill-workflow-state-guidance |
| Issue | #534（state: CLOSED — closed のまま spec を作成） |
| 親タスク | issue-371-ut-02a-followup-003-hono-ctx-di-migration（completed-tasks 配下） |
| 兄弟タスク | なし |
| Wave | skill 改善（promotion） |
| 実行種別 | sequential（reference 設計 → 既存 reference link → SKILL.md 同期は順序依存） |
| 作成日 | 2026-05-08 |
| 担当 | spec drafted on this branch |
| 状態 | implemented_local_evidence_captured |
| タスク種別 | implementation / NON_VISUAL |
| 実装区分 | 実装完了 pending PR（CONST_004 デフォルト適用 — `.claude/skills/task-specification-creator/` 配下の reference 新規作成・SKILL.md / SKILL-changelog.md / LOGS/_legacy.md の編集を伴うため、ドキュメントのみ仕様書ではなく実装仕様書として扱う） |
| 優先度 | priority:medium |
| 発見元 | issue-371-ut-02a-followup-003-hono-ctx-di-migration / Phase 12 skill-feedback-report.md L9-13 |

## purpose

`task-specification-creator` skill の SKILL.md および references に、workflow_state の状態定義・遷移条件・reclassify ルール・必要証跡マッピングを集約し、Phase 12 compliance-check の観点を再利用可能なテンプレートとして提供する。

具体的には:

- `references/workflow-state-vocabulary.md` を新設し、状態語彙の単一正本とする
- `references/phase12-compliance-check-template.md` を新設し、phase-12 compliance-check を再利用可能にする
- SKILL.md References 表に 2 reference を登録し、1 hop で到達可能にする
- 既存 reference（`phase-12-spec.md` / `phase12-skill-feedback-promotion.md` / `phase-template-phase11.md`）から新 reference へ link を張る
- 禁止表記（`PASS` 単独 / 状態混在）を明示する
- SKILL-changelog.md / LOGS/_legacy.md / aiworkflow-requirements indexes を同一 wave で同期する

本タスクは skill 本体の文書化に閉じる。状態遷移を機械的に強制する hook / lefthook / CI gate の実装は **後続タスクで分離**する（CONST_007 例外: 範囲外を明示）。

## scope in / out

### scope in

- `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md`（新規）
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`（新規）
- `.claude/skills/task-specification-creator/SKILL.md` References 表追記
- `.claude/skills/task-specification-creator/references/phase-12-spec.md` から新 reference への link 追加
- `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` から新 reference への link 追加
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md` から新 reference への link 追加
- `.claude/skills/task-specification-creator/SKILL-changelog.md` への version 行追記
- `.claude/skills/task-specification-creator/LOGS/_legacy.md` への usage log 追記
- `mise exec -- pnpm indexes:rebuild` 実行

### scope out

- 他 skill（`github-issue-manager` 等）への波及改修。`aiworkflow-requirements` は Issue #534 inventory / indexes / LOGS 同期のみ含む
- workflow_state を機械的に強制する hook / lefthook / CI gate 実装（必要性は reference 末尾に明記するが実装は別タスク）
- 既存 workflow（`docs/30-workflows/completed-tasks/**`）への遡及書き換え
- 状態名のリネーム（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 等は維持。改名は影響範囲が大きいため別タスク）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/skill-feedback-report.md` | promotion target の正本 |
| 上流 | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/phase12-task-spec-compliance-check.md` | compliance-check 観点の正本 |
| external gate | なし | skill 内文書化のみで完結 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | References 表更新対象 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | 既存 reference link 追加対象 |
| 必須 | .claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md | 既存 reference link 追加対象 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | 既存 reference link 追加対象 |
| 必須 | .claude/skills/task-specification-creator/SKILL-changelog.md | version 行追加対象 |
| 必須 | .claude/skills/task-specification-creator/LOGS/_legacy.md | usage log 追加対象 |
| 必須 | docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/skill-feedback-report.md | promotion target 抽出元 |
| 必須 | docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/phase12-task-spec-compliance-check.md | compliance テンプレ抽出元 |
| 参考 | docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/unassigned-task/task-spec-skill-workflow-state-guidance.md | 親タスク内に置かれた spec stub（本仕様書の起点） |

## Acceptance Criteria

| ID | 内容 |
| --- | --- |
| AC-1 | `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md` が新規作成され、`spec_created` / `CONTRACT_READY_IMPLEMENTATION_PENDING` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `implemented_local_evidence_captured` / `completed` を含む全状態定義と必要証跡マッピング表を含む |
| AC-2 | 同 reference に Phase 開始時 reclassify ルール（spec_created → 実装着手時の必須切り替え）が記述されている |
| AC-3 | 同 reference に禁止表記（`PASS` 単独 / 状態混在 / phase-status と workflow-status の混在表記）が明示されている |
| AC-4 | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` が新規作成され、観点リスト・検証コマンド・drift パターン例の3部構成になっている |
| AC-5 | SKILL.md References 表に新 reference 2 件（vocabulary / compliance-check-template）が登録され、1 hop で到達可能 |
| AC-6 | `phase-12-spec.md` / `phase12-skill-feedback-promotion.md` / `phase-template-phase11.md` から新 reference への link が少なくとも 1 箇所追加されている |
| AC-7 | SKILL-changelog.md に本タスクの version 行が追加されている（既存最新行の上に追記） |
| AC-8 | LOGS/_legacy.md に本タスクの usage log が追加されている |
| AC-9 | `mise exec -- pnpm indexes:rebuild` が成功し、`.claude/skills/aiworkflow-requirements/indexes` の drift がない状態で commit される |
| AC-10 | `verify-indexes-up-to-date` gate 相当の検査（`mise exec -- pnpm indexes:rebuild` 後に `git diff --exit-code .claude/skills/aiworkflow-requirements/indexes`）が green |
| AC-11 | Phase 11 で NON_VISUAL evidence（typecheck.log / lint.log / grep gate / indexes-rebuild.log）が `outputs/phase-11/evidence/` に配置される |
| AC-12 | Phase 12 implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main 7 ファイルが揃っている |
| AC-13 | workflow root の削除・移動時に aiworkflow indexes / task-workflow / LOGS の stale 参照を同一 wave で解消する archive/delete gate が vocabulary と compliance template に入っている |

## phase index

| Phase | ファイル | 概要 |
| --- | --- | --- |
| 1 | [phase-01.md](phase-01.md) | 要件定義（真の論点 / 4条件評価 / 不変条件） |
| 2 | [phase-02.md](phase-02.md) | 設計（vocabulary 構成 / compliance-check テンプレ構成 / changed-files） |
| 3 | [phase-03.md](phase-03.md) | 代替案比較 ADR（単一 reference / 既存統合 / 別 skill 分離） |
| 4 | [phase-04.md](phase-04.md) | テスト戦略（grep gate / link 到達性 / indexes drift） |
| 5 | [phase-05.md](phase-05.md) | 実装ランブック（reference 作成 → link → changelog → indexes） |
| 6 | [phase-06.md](phase-06.md) | レビュー観点（用語整合 / link 死活 / 状態語彙網羅） |
| 7 | [phase-07.md](phase-07.md) | 静的解析・lint・indexes 検査 |
| 8 | [phase-08.md](phase-08.md) | テスト実行（reference link smoke / indexes diff） |
| 9 | [phase-09.md](phase-09.md) | 不変条件・整合性検査（既存 reference 矛盾なし） |
| 10 | [phase-10.md](phase-10.md) | リスク再評価 |
| 11 | [phase-11.md](phase-11.md) | NON_VISUAL evidence（grep / link / indexes log） |
| 12 | [phase-12.md](phase-12.md) | implementation-guide / unassigned 検出 / skill feedback / compliance |
| 13 | [phase-13.md](phase-13.md) | commit / PR 承認ゲート |
