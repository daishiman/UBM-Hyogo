# Completed Tasks Path Normalization

完了済みタスクの workflow ディレクトリを `docs/30-workflows/` 直下に放置せず、`docs/30-workflows/completed-tasks/<category>/<issue-XXX-task-id>/` 配下へ正規化移動するための運用ルール。

## 適用対象

- `taskType: implementation` / `docs-only` を問わず、Phase 12 完了 + Phase 13 (PR merge) が完了したタスク
- `spec_created` close-out で実装着手前に CLOSED したタスク（docs-only spec_created 含む）
- post-release observation や reminder issue 起票で生成された短命タスク

## 移動タイミング

| トリガ | アクション |
| --- | --- |
| Phase 13 (PR) merge 完了 | 同 PR or 直後の follow-up commit でディレクトリを `completed-tasks/<category>/` へ `git mv` |
| `spec_created` close-out (docs-only spec_created) | Issue を CLOSED にした wave で同時移動 |
| タスク仕様書で別途規定された時点 | 仕様書記載のゲートに従う（例: D+30 reminder クローズ時） |

## 移動先パス規約

```
docs/30-workflows/completed-tasks/<category>/<issue-XXX-task-id>/
```

| セグメント | 値の決め方 |
| --- | --- |
| `<category>` | `artifacts.json.metadata.category`（例: `observability`, `automation`, `governance`, `infrastructure`, `documentation`） |
| `<issue-XXX-task-id>` | `issue-<番号>-<task-id slug>` 形式。Issue 未起票の docs-only は `noissue-<task-id>` |

## 移動手順（最小ゲート）

1. `git mv docs/30-workflows/<task-dir>/ docs/30-workflows/completed-tasks/<category>/<issue-XXX-task-id>/`
2. `artifacts.json.metadata` は **保持**。`workflow_state` は **書き換えない**（`spec_created` のままなら据え置き）
3. `index.md` 内の relative 参照（`../../specs/...` 等）が階層変化で壊れていないか `pnpm typecheck` 相当の参照解決で確認
4. 関連 register（aiworkflow-requirements `references/legacy-ordinal-family-register.md` 等）の path を新パスに追従更新
5. 後続 PR からの参照は `Refs #XXX` パターンに統一（`Closes` / `Fixes` 禁止。Issue は CLOSED 維持）

## 不変条件

- `artifacts.json.metadata` の値は移動前後で diff ゼロを基本とする。`workflow_state` を移動契機に書き換えない
- `phases[].status` も移動契機では更新しない（実 phase 完了タイミングでのみ更新）
- Issue は CLOSED を維持し、後続 PR からは `Refs #XXX` で連結する（`github-issue-manager/references/closed-issue-reference-pattern.md` を参照）
- 移動を `--no-verify` で押し通さない。pre-commit `staged-task-dir-guard` が誤検知する場合は hook 側を改善する（CLAUDE.md sync-merge ポリシー準拠）

## 検証コマンド

```bash
# 旧パスへの参照残存チェック
grep -rn "docs/30-workflows/<task-dir>" docs/ apps/ scripts/ .claude/ || echo "OK"

# completed-tasks 配下の整合
ls docs/30-workflows/completed-tasks/<category>/<issue-XXX-task-id>/
jq '.metadata.workflow_state' docs/30-workflows/completed-tasks/<category>/<issue-XXX-task-id>/artifacts.json
```

## 適用例

- Issue #502 (DLQ Monitoring Dashboard) Phase-12 完了後の移動：
  - 移動前: `docs/30-workflows/02-application-implementation/09b-A-observability-sentry-slack-runtime-smoke/`
  - 移動後: `docs/30-workflows/completed-tasks/observability/issue-502-dlq-monitoring-dashboard/`
  - Issue は CLOSED 維持、PR は `Refs #502` で連結
