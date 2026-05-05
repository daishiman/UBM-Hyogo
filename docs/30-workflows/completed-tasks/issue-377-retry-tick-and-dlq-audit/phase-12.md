# Phase 12: 実装ガイド・未タスク・skill feedback

task-specification-creator skill の Phase 12 仕様（6 必須タスク・最低 7 ファイル）に従い、以下を `outputs/phase-12/` に作成する。

## 必須 7 ファイル

| ファイル | 内容 |
| --- | --- |
| outputs/phase-12/main.md | Phase 12 indexer（各 file へのリンクと完了 chk） |
| outputs/phase-12/implementation-guide.md | Part 1 中学生レベル + Part 2 技術者レベル。retry tick が「失敗したら少し待ってもう一度試す係」であることを Part 1、Part 2 は本仕様書 Phase 3-9 を要約 |
| outputs/phase-12/system-spec-update-summary.md | aiworkflow-requirements の queue lifecycle / cron 章への反映 diff 概要 |
| outputs/phase-12/documentation-changelog.md | 本タスクで更新したドキュメント一覧 |
| outputs/phase-12/unassigned-task-detection.md | 後述「未タスク」一覧。0 件でも出力必須 |
| outputs/phase-12/skill-feedback-report.md | テンプレ改善 / ワークフロー改善 / ドキュメント改善 の 3 観点固定。改善点なしでも出力必須 |
| outputs/phase-12/phase12-task-spec-compliance-check.md | 本 Phase 12 の 6 task / 7 file 実体確認 |

## 未タスク（unassigned-task-detection.md に記載すべき項目）

CONST_007 に従い、以下は本タスクスコープ外であり、明確な分離理由を伴って未タスクに記録する:

1. **manual requeue API**（`POST /admin/tags/queue/:id/requeue`）— admin UI / RBAC 設計と連動するため独立 issue。
2. **Cloudflare Queues 移行**（`[[queues.consumers]]` 採用）— free plan で D1 + cron が成立する間は不要。Queues 採用は別 wave で評価。
3. **DLQ row redrive UI** — admin queue 画面の機能追加。UI スコープ。
4. **emergency runbook** — DLQ 急増時の op 手順。docs-only タスク。

各項目に「分離理由・想定実施時期・実施場所（issue 番号 or backlog）」を記入する。

## 完了条件

- [ ] 7 ファイルすべてが `outputs/phase-12/` に実体存在する。
- [ ] implementation-guide.md に Part 1 / Part 2 が両方含まれる。
- [ ] 未タスク 4 件が分離理由付きで記録される。

## 出力

- outputs/phase-12/*（7 ファイル）

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 目的

Phase 12 strict 7 files と正本同期を完了する。

## 実行タスク

- 実装ガイド / 正本同期 / lessons / compliance を作成する。

## 参照資料

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 成果物/実行手順

- `outputs/phase-12/*`

## 統合テスト連携

- Phase 11 focused evidence を参照
