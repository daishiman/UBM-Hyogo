# System Spec Update Summary

## 更新対象（同期済み + 条件付き）

| 対象 | 更新条件 | 内容 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 常時 + A/B 採用時 | 常時: Issue #616 の月次 / Miniflare major triage runbook pointer と 2026-05-11 改善なし結論を追加。A/B 採用時: 軸B（`--maxWorkers=1`）記述を採用 N に更新、上流改善検知 release tag 追記 |
| `.claude/skills/aiworkflow-requirements/references/` 配下 current task inventory | 常時 | 本 workflow 追加済み |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` | 常時 | 本 workflow の lookup 導線追加済み |
| `.claude/skills/aiworkflow-requirements/changelog/20260511-issue616-miniflare-undici-upstream-tracking.md` | 常時 | 同期履歴追加済み |

## 改善なし時の更新

- `15-infrastructure-runbook.md` に recurring tracking pointer と現行 cap 維持根拠を追加
- aiworkflow-requirements に本 workflow 登録（`verified_current_no_code_change_pending_pr` / implementation / NON_VISUAL）
- changelog 更新済み

## 改善あり時の追加更新

- `15-infrastructure-runbook.md` の軸B 説明箇所を新採用 N に書き換え
- 上流改善検知日 / release tag / 採用根拠を追記

## 実行コマンド

```bash
rg -n "task-issue-577-followup-002-miniflare-undici-upstream-tracking" \
  .claude/skills/aiworkflow-requirements
```

## 不変条件

- `docs/00-getting-started-manual/specs/01-api-schema.md` 変更なし（API contract 不変）
- `docs/00-getting-started-manual/specs/08-free-database.md` 変更なし（D1 binding 不変）
- `apps/api/wrangler.toml` 変更なし
