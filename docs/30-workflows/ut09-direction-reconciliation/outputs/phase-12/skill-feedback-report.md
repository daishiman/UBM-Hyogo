# Phase 12 Skill Feedback Report

> 正本仕様: `../../phase-12.md` §タスク 5
> 改善点なしでも出力必須。本タスクは direction-reconciliation の初例のため、改善提案が複数発生した。

---

## 1. task-specification-creator（改善提案 3 件）

| # | フィードバック | 改善提案 | 反映先（別タスク） |
| --- | --- | --- | --- |
| TSC-1 | direction-reconciliation 系 docs-only タスクの `implemented` 強要が不適切。`spec_created` で close-out するパスがテンプレ化されていなかった | docs-only / direction-reconciliation のテンプレ化（`implemented` 必須化を緩和し `spec_created` で close-out 可能と明示）。`references/phase-12-spec.md` に「docs-only タスクは `spec_created` で close-out」セクション追加 | B-09 |
| TSC-2 | Phase 12「実装ガイド」が code-only 前提で、reconciliation 系では「reconciliation 手順ガイド」への読み替えが必要 | Phase 12 spec に「docs-only 時は reconciliation / 文書化手順ガイドに読み替え可能」を `references/phase-12-documentation-guide.md` で明記 | B-09 |
| TSC-3 | Phase 12 compliance check の「pending を PASS と誤記しない」運用ルールが skill 全体で共通化されていない | 全 task の Phase 12 compliance check に運用ルール 1（staging smoke 表記: pending / PASS / FAIL）を組み込む。`references/phase-12-completion-checklist.md` に固定行追加 | B-09 |
| TSC-4 | docs-only / direction-reconciliation で「実測 PASS」と「記述レベル PASS」が混ざりやすい | compliance check に `PASS / PENDING / NOT_APPLICABLE` を導入し、validator 未実行や別タスク起票前の項目を PASS としない | B-09 |

## 2. aiworkflow-requirements（改善提案 2 件）

| # | フィードバック | 改善提案 | 反映先（別タスク） |
| --- | --- | --- | --- |
| AWR-1 | Forms 分割方針 vs Sheets 採用方針の二重正本リスクを検知する仕組みが弱い | Ownership 宣言（5 対象 = api-endpoints / database-schema / environment-variables / deployment-cloudflare / topic-map）を references の正本構造に組み込み、衝突検出時に reconciliation タスクを自動起票する hook を提案 | B-05 後続 |
| AWR-2 | `references/api-endpoints.md` / `database-schema.md` の登録に「採用方針別の有効期間」を持たせる仕組みが無い | 各 entry に `direction_owner` フィールドを導入し、reconciliation で参照される base case を明示 | B-05 後続 |
| AWR-3 | A 維持時に「Step 2 不発火」と判定すると、既存 references / runtime に残る Sheets 系 stale contract を見逃す | Step 2 に「stale 撤回」分岐を追加し、A 維持でも `api-endpoints` / `deployment-cloudflare` / `environment-variables` / runtime mount / cron を撤回対象として audit する | B-05 / B-10 |

## 3. github-issue-manager（改善提案 1 件）

| # | フィードバック | 改善提案 |
| --- | --- | --- |
| GHM-1 | Issue #94 (CLOSED) を再オープンせずコメント追記で同期できた | CLOSED Issue への close-out コメント手順をテンプレ化（`gh issue comment <num> --body "..."` のテンプレを `references/` に追加） |

## 4. automation-30（改善提案 1 件）

| # | フィードバック | 改善提案 |
| --- | --- | --- |
| A30-1 | 30 種思考法は省略不可であり、Phase 3 の代表 8 種だけでは AC-11 PASS にできない。Phase 10 補完 22 種を必須ゲート化することで全 30 種適用を満たせた | 分割適用する場合も、全 30 種が揃うまで PASS としない運用ルールを skill に追記 |

## 5. 改善点なし skill（明示）

| skill | 状態 |
| --- | --- |
| skill-creator | 本タスクで未使用のため改善点なし |
| skill-fixture-runner | 本タスクで未使用のため改善点なし |
| int-test-skill | 本タスクで未使用のため改善点なし（docs-only） |
| claude-agent-sdk | 本タスクで未使用のため改善点なし |
| simplify | 本タスクで未使用のため改善点なし（docs-only / コード変更なし） |

## 6. セルフチェック

- [x] task-specification-creator の改善提案が 3 件以上（TSC-1〜3）
- [x] aiworkflow-requirements の改善提案が 1 件以上（AWR-1, AWR-2）
- [x] github-issue-manager / automation-30 の改善提案を含む
- [x] 無提案 skill には「改善点なし」を明示

---

状態: spec_created
