# Phase 1 — 要件定義

## 目的

issue #347 が要求する「Cloudflare Analytics 長期保存 export 方式の確定」の真の論点・成功条件・制約を明示し、artifacts.json metadata（`taskType=docs-only` / `visualEvidence=NON_VISUAL`）を確定する。

## 真の論点

- 09c の 24h post-release verification では Cloudflare dashboard を一時目視するだけで、1 週間後・1 か月後の比較に使える証跡が残らない
- Cloudflare Free plan で持続可能かつ PII を含まない export 形式が一意に決まっていない
- 09c phase-12 unassigned-task-detection で発見済みだが、保存先・retention・取得粒度が未定

## 因果と境界

- 原因: 09c の post-release verification が短期検証に閉じており、長期 evidence の保存仕様を持たない
- 境界: 本タスクは「方式決定 + 1 回サンプル取得」までで完結。自動化（CI cron / scheduled fetcher）は本タスク完了後に独立タスクで起票する

## 価値とコスト

- 価値: postmortem / incident review 時に「リリース前後の req/day, error rate, D1 reads/writes 変化」を客観評価できる
- コスト: Free plan 制約調査 + 1 回サンプル取得 + 4 ファイル程度の正本化。コード変更なし

## 入力

- docs/30-workflows/unassigned-task/task-09c-cloudflare-analytics-export-001.md
- docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md
- .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
- .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md

## 出力

- `outputs/phase-01/main.md`: 真の論点・AC-1〜8 確定・artifacts.json metadata 確定値
- `outputs/phase-01/artifacts.json`（または index.md 内記述）: `taskType: docs-only` / `visualEvidence: NON_VISUAL` / `workflow_state: spec_created`

## 完了条件

- [ ] AC-1〜8 が index.md と整合し、削除・追加・粒度変更がないこと
- [ ] artifacts.json metadata が `taskType=docs-only` / `visualEvidence=NON_VISUAL` で確定
- [ ] 真の論点が 1 段落で記述
- [ ] スコープ in / out の境界が「自動化は別タスク」として明記

## 受け入れ条件（AC mapping）

- AC-1〜8 すべて: 本 Phase で要件として確定し、Phase 2 以降で各論を詰める

## 検証手順

```bash
# index.md と本 Phase の AC 数が一致
grep -c "^- AC-" docs/30-workflows/issue-347-cloudflare-analytics-export-decision/index.md
# 期待: 8

# metadata
grep -E "taskType|visualEvidence|workflow_state" docs/30-workflows/issue-347-cloudflare-analytics-export-decision/index.md
```

## リスク

| リスク | 対策 |
| --- | --- |
| AC が後続 Phase で増減する | index.md と本 Phase の AC 番号を Phase 7 で再 trace し drift 検出 |
| docs-only 判定が誤りで code change が必要 | Phase 9 Free plan 制約確認時に再評価。必要なら CONST_004 に従い実装区分を切替 |
