# Closed Issue Reference Pattern

CLOSED 状態を維持したまま後続 PR から GitHub Issue を参照するためのパターン。Issue を再オープンせず、`Refs #XXX` のみで連結することで、observation / reminder / docs-only spec_created の独立ライフサイクルを保つ。

## 適用条件

以下のいずれかに該当する場合に本パターンを適用する。

| ケース | 説明 |
| --- | --- |
| docs-only spec_created タスク | 実装着手前に CLOSED した仕様策定 Issue。後続の docs-only commit / PR から参照する |
| reminder issue 自動起票 | GitHub Actions schedule で生成され、観測完了後に CLOSED した reminder issue（`scheduled-reminder-issue-pattern.md` 参照） |
| post-release observation | リリース後 D+7 / D+30 等の長期観測タスク。観測 PR は元 issue を再オープンせず連結のみ |
| follow-up runtime evidence | 親 Issue が CLOSED 後、後続 PR で runtime evidence を補強するケース |

## 禁止事項

- `Closes #XXX` / `Fixes #XXX` / `Resolves #XXX` の使用は禁止（PR merge 時に CLOSED → re-CLOSED になり履歴が濁る、または再 OPEN→CLOSE で通知が増える）
- Issue を `gh issue reopen` で再オープンしない（CLOSED 維持が大原則）
- 同一 Issue に対する PR 連結は `Refs #XXX` 形式に統一する

## 標準パターン

PR 本文に以下の 1 行を含める。

```
Refs #XXX
```

複数 Issue を参照する場合:

```
Refs #502, #503
```

## 検証手順

```bash
# 1. 対象 Issue が CLOSED 状態であることを確認
gh issue view <num> --json state | jq '.state'        # "CLOSED" を期待

# 2. 当該 Issue を Refs で参照している PR を列挙
gh pr list --state all --search "in:body Refs #<num>"

# 3. CLOSED 後に re-open されていないことを timeline で確認
gh issue view <num> --json timelineItems | jq '.timelineItems[] | select(.__typename=="ReopenedEvent")'
# → 空配列を期待
```

## 例: Issue #502 (DLQ Monitoring Dashboard)

- Issue #502 は実装完了 + Phase-12 完了で CLOSED
- 完了後に `completed-tasks/observability/issue-502-dlq-monitoring-dashboard/` への移動 PR と、long-term observation 観測ログ更新 PR が発生
- いずれの PR も本文に `Refs #502` のみを記載し、Issue #502 は CLOSED 維持
- aiworkflow-requirements の changelog / artifact-inventory には「Issue #502 → completed-tasks 移動 (`Refs #502`)」の逆引きエントリを追加

## 関連スキル / 逆引き

- task-specification-creator: `references/completed-tasks-policy.md`（`Refs #XXX` 連結 / metadata 据え置きルール）
- aiworkflow-requirements: `changelog/` および `artifact-inventory`（Issue 番号からタスクパスへの逆引き）
- 本スキル: `scheduled-reminder-issue-pattern.md`（reminder Issue 自動起票時の CLOSED 維持要件）

## 不変条件サマリ

| 観点 | 値 |
| --- | --- |
| Issue state | 常に CLOSED 維持 |
| 参照キーワード | `Refs #XXX` のみ |
| 再オープン | 禁止（必要なら新規 Issue を起票し `Refs` で旧 Issue に逆リンク） |
| 連結方向 | PR body → Issue（PR 側に `Refs` を書く。Issue body 側は任意で `gh issue comment` 補強） |
