# Phase 12: ドキュメント / aiworkflow-requirements 反映

`[実装区分: 実装仕様書]`

判定根拠: 本タスクは CI workflow のコード変更を伴うため、Phase 12 の strict 7 files を実体化し、aiworkflow-requirements 正本へ同一 wave で同期する。

---

## 目的

task-specification-creator skill の Phase 12 標準仕様を実施し、HOLD 実装、正本仕様、未タスク検出、skill feedback、compliance check を矛盾なく閉じる。

## 変更対象ファイル

| パス | 種別 |
| --- | --- |
| `outputs/phase-12/main.md` | 新規（Phase 12 close-out summary） |
| `outputs/phase-12/implementation-guide.md` | 新規（Part 1 中学生レベル + Part 2 技術者レベル） |
| `outputs/phase-12/system-spec-update-summary.md` | 新規（aiworkflow-requirements 反映記録） |
| `outputs/phase-12/documentation-changelog.md` | 新規 |
| `outputs/phase-12/unassigned-task-detection.md` | 新規（0 件でも出力必須） |
| `outputs/phase-12/skill-feedback-report.md` | 新規（テンプレ / ワークフロー / ドキュメント 3 観点固定） |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 編集 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 編集 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 編集 |
| `.claude/skills/aiworkflow-requirements/changelog/20260507-issue518-cf-audit-logs-hold.md` | 新規 |

## 7 必須タスク

### 12-1 main summary

`outputs/phase-12/main.md` に strict 7 files の作成状況、root-only `artifacts.json` 方針、Phase 11 post-merge pending 境界、4条件再検証結果を記録する。`outputs/artifacts.json` は本 workflow では作らず、root `artifacts.json` を唯一正本とする。

### 12-2 実装ガイド作成

`outputs/phase-12/implementation-guide.md` を作成する。Part 1 は中学生レベルで、なぜ自動監視を止めたか / 何を残したか / どう手動確認するか / どうなったら再開するかを説明する。Part 2 は技術者向けに、YAML 編集、watchdog 削除、runbook、dry_run default、再開手順、GitHub Variable、Cloudflare Token 境界を記録する。

### 12-3 システム仕様書更新

`.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` / `deployment-secrets-management.md` / `task-workflow-active.md` / indexes に「cf-audit-log-monitor は Issue #518 により HOLD（schedule 削除 / dry_run default true / 週次手動確認 runbook 経由運用）」を同一 wave で追記する。結果は `system-spec-update-summary.md` に記録する。

### 12-4 ドキュメント更新履歴

`documentation-changelog.md` に Phase 5-12 の変更ファイル一覧を記録する。

### 12-5 未タスク検出レポート

既存 `bot:cf-audit-log-watchdog` ラベル付き open Issue の有無は `gh issue list --label bot:cf-audit-log-watchdog --state open` で確認する。存在する場合は今回サイクルで手動 close するか、外部承認が必要ならユーザーへエスカレーションする。D1 schema rollback は HOLD 方針上不要であり未タスク化しない。

### 12-6 スキルフィードバック

`skill-feedback-report.md` は「テンプレ改善 / ワークフロー改善 / ドキュメント改善」の 3 観点固定で作成する。改善点なしの場合も明記する。

### 12-7 コンプライアンスチェック

各 Phase ファイルが CONST_005 必須項目（変更対象 / シグネチャ / 入出力 / テスト / 実行コマンド / DoD）を含むか自己確認し、`phase12-task-spec-compliance-check.md` に PASS/FAIL マトリクスを残す。

## 関数 / シグネチャ

該当なし。

## 入出力 / 副作用

- 出力: `outputs/phase-12/*.md` strict 7 ファイル
- 副作用: aiworkflow-requirements skill の正本 / indexes / changelog 更新

## テスト方針

- `outputs/phase-12/` strict 7 ファイル実体確認
- aiworkflow-requirements 同期後の `pnpm indexes:rebuild`
- 4条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）の再検証

## ローカル実行・検証コマンド

```bash
find docs/30-workflows/issue-518-cf-audit-logs-monitoring-hold/outputs/phase-12 -maxdepth 1 -type f | wc -l   # 7
mise exec -- pnpm indexes:rebuild
```

## DoD

- strict 7 ファイルが `outputs/phase-12/` に存在
- aiworkflow-requirements 反映判断が `system-spec-update-summary.md` に記録
- compliance check で全 Phase が PASS
- Phase 11 は post-merge runtime observation として `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` に分離され、Phase 13 の前提と循環しない
