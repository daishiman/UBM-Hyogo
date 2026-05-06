# task-09c-cloudflare-analytics-export-001

## メタ情報

```yaml
issue_number: 347
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-09c-cloudflare-analytics-export-001 |
| タスク名 | Cloudflare Analytics 長期保存 export 方式の確定 |
| 分類 | operations |
| 対象機能 | Cloudflare Analytics / post-release evidence |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | consumed_by_issue_347_decision_and_issue_484_automation |
| 発見元 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-01 |

## 1. なぜこのタスクが必要か（Why）

09c は 24h post-release verification までを扱うが、Cloudflare Analytics の長期保存形式は未定義である。Cloudflare dashboard の一時的な目視だけでは、1週間後・1か月後の比較やリリース後の傾向分析に使える証跡が残らない。

放置すると、free-tier 境界、D1 read/write 増加、error rate の変化を後から説明できず、incident や postmortem の根拠が弱くなる。

## 2. 何を達成するか（What）

Cloudflare Analytics の長期保存方式は Issue #347 decision workflow で GraphQL aggregate-only export に確定済み。月次 automation は Issue #484 workflow が current root として所有する。本ファイルは 09c 起点の historical source trace として保持する。

## 3. どのように実行するか（How）

current root:
- decision: `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/`
- automation: `docs/30-workflows/issue-484-cloudflare-analytics-export-automation/`

保存先は `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/`。request body や個人識別情報は保存しない。

## 4. 実行手順

1. `references/deployment-cloudflare*.md` と 09c Phase 11/12 を読み、現行の production evidence path を確認する。完了先: Issue #347 / Issue #484。
2. Cloudflare Analytics で取得する指標を req/day、error rate、D1 reads/writes、cron/event volume に絞る。完了先: Issue #347。
3. Free plan で可能な export 方法を選び、保存形式と retention を仕様書へ記載する。完了先: Issue #347。
4. 取得サンプルを1回作成し、PII が入っていないことを確認する。schema sample は Issue #347、runtime sample は Issue #484 runtime operation。
5. aiworkflow-requirements の該当 deployment / operations 参照へ導線を追加する。完了先: Issue #347 / Issue #484。

## 5. 完了条件チェックリスト

- [x] export 方式、保存先、保持期間が1つに決まっている（Issue #347）
- [x] 保存対象の指標が集計値に限定されている（Issue #347 / Issue #484）
- [x] Cloudflare Free plan 外の機能に依存しないことを確認済み（Issue #347）
- [x] 09c または ops workflow から evidence path へ辿れる（Issue #484 quick-reference / resource-map）

## 6. 検証方法

```bash
rg -n "Cloudflare Analytics|CSV|export|retention" docs/30-workflows .claude/skills/aiworkflow-requirements/references
```

期待: 採用した export 方式、保存先、retention が正本化されている。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| 無料枠外の Logpush などに依存する | Phase 1 で Free plan で使える取得手段だけを採用条件にする |
| PII 混入 | aggregate metrics のみ保存し、URL query、request body、user data は保存しない |
| 保存だけして判断基準がない | 09c の runtime threshold と対応表を作る |

## 8. 参照情報

- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`

## 9. 備考

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-065106-wt-10/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md`
- 症状: 24h evidence は screenshot / SQL 中心で、長期保存フォーマットと retention が未定だった
- 参照: 09c Phase 12 unassigned-task-detection

## スコープ

### 含む

- 長期保存フォーマットの選定
- 保存先、retention、PII 除外ルールの定義

### 含まない

- PII ログ収集
- 有料 Logpush 導入
