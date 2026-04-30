# UT-CICD-DRIFT-IMPL-CRON-CONSOLIDATION

```yaml
issue_number: 285
task_id: UT-CICD-DRIFT-IMPL-CRON-CONSOLIDATION
task_name: Cloudflare Worker cron consolidation review
category: 改善
target_feature: Cloudflare Workers cron operations
priority: 低
scale: 小規模
status: 未実施
source_phase: UT-CICD-DRIFT Phase 12
created_date: 2026-04-29
dependencies: [#58]
```

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-CICD-DRIFT-IMPL-CRON-CONSOLIDATION |
| 親タスク | UT-CICD-DRIFT |
| 起源 drift | DRIFT-07 |
| workflow_state | spec_created |
| 優先度 | LOW |
| 分類 | docs-impl（運用棚卸し） |
| 起票日 | 2026-04-29 |

## 親タスク背景

`apps/api/wrangler.toml` の `[triggers] crons` は現状 3 件（既存 2 件 + 03a schema sync `0 18 * * *`）。重複・無駄実行・タイムゾーン整合の棚卸しは UT-CICD-DRIFT 範囲外で本派生に委譲。

## 範囲

1. 3 件の cron 各々の目的・呼び出し先 handler を documentation 化
2. UTC / JST タイムゾーン整合確認（schema sync が 03a のローカル業務時間と整合か）
3. 重複統合 / 削除可否の判断

## 不変条件 reaffirmation

| # | 不変条件 | 適用 |
| --- | --- | --- |
| #5 | apps/api 配下のため抵触なし | — |
| #6 | 影響なし | — |

## 受入条件

- [ ] AC-1: 3 件の cron 表が `deployment-cloudflare.md` で目的記述付きで揃う
- [ ] AC-2: タイムゾーン整合の判断結果が記録される
- [ ] AC-3: 重複/削除の決定が反映される

## 苦戦箇所【記入必須】

- cron は同じ Worker に複数存在しても、handler 内の分岐で用途が変わるため、toml だけでは要否を判断できない。
- `0 18 * * *` は今回仕様へ追加済みだが、運用意図の追跡が不足すると後で不要扱いされやすい。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 必要な cron を重複と誤認して停止する | Worker handler と運用ログを確認し、用途が不明なものは削除せず調査タスク化する |
| 仕様書だけ更新され、実 toml と再びずれる | `apps/api/wrangler.toml` と `deployment-cloudflare.md` を同一差分で確認する |

## 検証方法

- `rg -n "crons|scheduled|0 \\*/6 \\* \\* \\*|0 18 \\* \\* \\*|\\*/15 \\* \\* \\* \\*" apps/api .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- 各 cron の handler 分岐とログ出力を確認し、用途表へ反映する。

## スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| 3 cron の用途棚卸し、UTC / JST 整合確認、重複統合判断 | sync job 実装本体変更、本番 cron の即時停止、D1 schema 変更 |

## 委譲先 / 関連

- 関連: 03a sheets-d1-sync 系タスク
