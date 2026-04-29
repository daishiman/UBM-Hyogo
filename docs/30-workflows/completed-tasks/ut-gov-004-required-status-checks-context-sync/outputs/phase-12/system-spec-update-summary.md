# system-spec-update-summary.md — UT-GOV-004 によるシステム仕様更新サマリ

## 0. Phase 12 Step 判定

| Step | 判定 | 実施内容 |
| --- | --- | --- |
| Step 1-A | 完了 | 本 workflow 配下の Phase 12 成果物、`docs/30-workflows/LOGS.md`、両 skill の `LOGS/_legacy.md` に UT-GOV-004 の close-out を記録 |
| Step 1-B | 完了 | 本タスクは docs-only / NON_VISUAL / `spec_created` として扱い、アプリ実装完了とは区別 |
| Step 1-C | 完了 | UT-GOV-001/005/007 と `task-git-hooks-lefthook-and-post-merge` への責務委譲を `unassigned-task-detection.md` と本サマリで明記 |
| Step 2 | N/A | 新規 API / IPC / DB schema / TypeScript interface の追加なし。設定値正本は `outputs/phase-08/confirmed-contexts.yml` に限定 |

## 1. 更新対象（既存組み込み）

| 既存タスク | 既存ファイル | UT-GOV-004 による上書き内容 |
| --- | --- | --- |
| task-github-governance-branch-protection | `outputs/phase-2/design.md §2.b` | 草案 8 contexts → 確定 3 contexts へ上書き |
| task-github-governance-branch-protection | `outputs/phase-12/implementation-guide.md §1, §5(H-1)` | target contexts と H-1 hazard 対策の正本を本タスクへ移譲 |

> 上記既存タスク側のドキュメントは過去成果物として扱い、本タスクでは直接上書きしない。現在の正本は本 workflow の `outputs/phase-08/confirmed-contexts.yml` であり、UT-GOV-001 はこのファイルだけを apply 入力にする。

## 2. 新規ドキュメント

| 種別 | パス | 役割 |
| --- | --- | --- |
| 仕様 index | `docs/30-workflows/ut-gov-004-required-status-checks-context-sync/index.md` | 既存 |
| Phase 1〜13 仕様書 | 同 ディレクトリ `phase-01.md` 〜 `phase-13.md` | 既存 |
| Phase 1〜12 outputs | 同 `outputs/phase-NN/*.md` | **本タスクで新規作成** |
| 機械可読正本 | `outputs/phase-08/confirmed-contexts.yml` | UT-GOV-001 入力契約 |

## 3. CLAUDE.md / 不変条件への影響

なし。本タスクは governance 層に閉じる。CLAUDE.md §「重要な不変条件」#1〜#7 への影響ゼロ。

## 4. branch protection の運用ルール追加

| 規則 | 出典 |
| --- | --- |
| 投入文字列は `gh api check-runs` で過去 30 日以内の success 実績を持つこと | AC-3 |
| `<workflow>/<job>` フルパス記載 | AC-8 |
| context 名変更は同一 PR で branch protection も更新（経路 A） | AC-9 |
| lefthook と CI は同一 pnpm script を呼ぶ | AC-5 |

## 5. 後続作業

UT-GOV-001 が confirmed-contexts.yml を apply 完了した時点で、適用結果を UT-GOV-001 側の Phase 12 成果物に記録する。本タスク側の正本入力は `outputs/phase-08/confirmed-contexts.yml` のまま維持する。

## 6. 依存成果物参照

- `outputs/phase-05/implementation-runbook.md`
- `outputs/phase-05/workflow-job-inventory.md`
- `outputs/phase-05/required-contexts-final.md`
- `outputs/phase-05/lefthook-ci-mapping.md`
- `outputs/phase-05/staged-rollout-plan.md`
- `outputs/phase-05/strict-mode-decision.md`
- `outputs/phase-06/failure-cases.md`
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-08/main.md`
- `outputs/phase-08/confirmed-contexts.yml`
- `outputs/phase-08/lefthook-ci-mapping.md`
- `outputs/phase-09/main.md`
- `outputs/phase-09/strict-decision.md`
