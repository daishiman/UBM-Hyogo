# Phase 12: - ドキュメント更新（strict 7 + optional split guide outputs）

[実装区分: 実装仕様書 / Phase 12]

## 目的

実装内容を 6+1 成果物として formalize し、SSOT（observability-monitoring）にダッシュボード URL/path を追記する。task-specification-creator skill の Phase 12 canonical heading SSOT 規約に従う。

## strict 7 outputs（必須）+ optional split guide

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `main.md` | Phase 12 close-out summary |
| 2 | `implementation-guide.md` (Part1) | 中学生レベル概念説明 + システム全景 + 「なぜこの設計か」 |
| 3 | `system-spec-update-summary.md` | SSOT 同期差分一覧（observability-monitoring へ dashboard URL/path 追記） |
| 4 | `documentation-changelog.md` | 本 PR で追加・編集された docs / SSOT の changelog |
| 5 | `unassigned-task-detection.md` | 残タスク検出と未タスク化の要否 |
| 6 | `skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements への feedback（あれば） |
| 7 | `phase12-task-spec-compliance-check.md` | Phase 12 canonical heading SSOT 適合チェック |

Optional split guide: `implementation-guide-part2.md` は技術者向け詳細を分離した追加成果物であり、strict 7 の `implementation-guide.md` を置換しない。

## SSOT 更新対象

| ファイル | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | section「7day summary trend dashboard」追加。dashboard 配置 path（候補 A: `apps/web/src/app/(admin)/admin/audit/dashboard/page.tsx` または 候補 B: `docs/dashboards/cf-audit-log-7day-trend/index.html`）と aggregator script path、入力 evidence path、screenshot 4 点 path を canonical absolute path で列挙 |

Phase 12 では aiworkflow-requirements の同一 wave 同期を任意にしない。`indexes/resource-map.md`、`indexes/quick-reference.md`、`references/task-workflow-active.md`、`references/workflow-u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash-artifact-inventory.md`、`changelog/20260514-u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash.md`、`LOGS/_legacy.md` のいずれかを更新対象または N/A 根拠として `system-spec-update-summary.md` に記録する。

## phase12-task-spec-compliance-check.md（必須項目）

- [x] strict 7 ファイル + optional split guide が `outputs/phase-12/` 配下に物理配置
- [ ] canonical heading（Phase 12 SSOT）の必須 9 セクション（Summary verdict / Changed-files classification / `workflow_state` and phase status consistency / Phase 11 evidence file inventory / Phase 12 strict 7 file inventory / Skill/reference/system spec same-wave sync / Runtime or user-gated boundary / Archive/delete stale-reference gate / Four-condition verdict）と heading が一致
- [x] 実装変更が SSOT の `observability-monitoring.md` に反映
- [x] `Refs #549, Refs #586, Refs #656` の cross-link が Phase 12 成果物に明記
- [ ] verify-phase12-compliance CI gate に該当 fail 0 件

## 実行コマンド

```bash
# Phase 12 SSOT 規約確認
ls -la outputs/phase-12/
mise exec -- pnpm verify:phase12-compliance docs/30-workflows/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash 2>/dev/null || true
```

## 出力

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/implementation-guide-part2.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 状態 | implemented_local_runtime_pending |

## 実行タスク

- 本文の目的・手順・出力に従う。

## 参照資料

- `index.md`
- `artifacts.json`

## 成果物

- `outputs/phase-*` に定義された成果物。

## 完了条件

- [ ] 本 Phase の出力仕様が `artifacts.json` と一致している。
