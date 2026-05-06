# task-issue-351-post-release-dashboard-30day-conclusion-001

## メタ情報

```yaml
issue_number: 497
```

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-351-post-release-dashboard-30day-conclusion-001 |
| タスク名 | post-release-dashboard schedule の 30 日連続実行 conclusion 集計と skill feedback 化 |
| 分類 | operations |
| 対象機能 | GitHub Actions schedule observability / aiworkflow-requirements skill feedback |
| 優先度 | 中 |
| 見積もり規模 | 小〜中規模 |
| ステータス | formalized（時間経過依存・defer allowed / 30 日 gate pending） |
| 発見元 | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-05 |
| 起票元仕様 | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/`（U-1 として defer 判断） |

## 1. なぜこのタスクが必要か（Why）

issue-351 で導入した `post-release-dashboard.yml` は schedule（UTC 00:00）で日次起動し、Cloudflare metrics と D1 reads/writes を artifact 化する。導入直後は run 履歴が無いため、schedule の安定性（成功率・失敗パターン・retry 必要性）と artifact の継続的妥当性を実測できない。

放置すると、schedule run の沈黙的失敗（cron 停止 / token 失効 / GraphQL schema 変更 / artifact retention 漏れ）に気付くのが障害発生時になり、09c が解消しようとした「比較不能・属人的な 24h 観測」へ逆戻りする。

## 2. 何を達成するか（What）

main に merge された `post-release-dashboard.yml` の 30 日連続 run 結果を `gh run list` で集計し、conclusion / artifact / 所要時間の傾向を `aiworkflow-requirements` skill の feedback として正本化する。

## 3. どのように実行するか（How）

実 schedule run が 30 日分蓄積されるまで実施不可。本タスクは時間依存のため、main merge 後 30 日経過した時点で着手する。集計は read-only `gh run list` のみで、production への副作用は持たない。

## 4. 実行手順

1. main 上で `post-release-dashboard.yml` が初回 schedule run 完了済みであることを `gh run list --workflow=post-release-dashboard.yml --limit=80` で確認する。
2. 30 日経過後、以下で 30 件分以上の schedule run conclusion / createdAt / databaseId / status / updatedAt を取得する。
   ```bash
   gh run list --workflow=post-release-dashboard.yml --limit=80 \
     --json conclusion,createdAt,databaseId,status,event,updatedAt,url \
     --jq '[.[] | select(.event=="schedule")]' > tmp/post-release-dashboard-30d.json
   ```
3. `event=="schedule"` の日次 gap が 0 であることを確認し、manual `workflow_dispatch` run は 30 日連続判定に含めない。
4. `success / failure / cancelled / startup_failure` の分布と連続 failure 区間を集計する。
5. `gh run download <id>` で artifact downloadability / retention を確認し、`createdAt`〜`updatedAt` の所要時間を集計する。
6. failure run について `gh run view <id> --log-failed` でパターンを抽出する（token 失効 / GraphQL 5xx / schema drift 等）。
7. 集計結果を `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` の post-release-dashboard 章に「30 日実測 feedback」として追記する。
8. failure 比率が `>= 10%` の場合は retry / alert 追加を別 unassigned task として起票する。

## 5. 完了条件チェックリスト

- [ ] `gh run list` の取得対象が 30 日以上の連続期間をカバーしている
- [ ] 取得対象は `event=="schedule"` に限定され、日次 gap が 0 である
- [ ] conclusion 分布表が `deployment-gha.md` に追記されている
- [ ] failure run の根本原因が分類されている（token / API / cron / その他）
- [ ] artifact downloadability / retention と run 所要時間が記録されている
- [ ] failure 比率に応じた次アクション（retry 追加 / alert 追加 / 現状維持）が判断されている
- [ ] `aiworkflow-requirements` skill の changelog に 30 日 feedback 反映が記載されている

## 6. 検証方法

```bash
# 30 日分の run 取得
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json conclusion,createdAt,databaseId,status,event,updatedAt,url \
  --jq '[.[] | select(.event=="schedule")]' \
  > tmp/post-release-dashboard-30d.json

jq 'group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})' \
  tmp/post-release-dashboard-30d.json

# skill 追記の grep
rg -n "30 日実測|30-day|post-release-dashboard 実測" \
  .claude/skills/aiworkflow-requirements/references/deployment-gha.md
```

期待: conclusion 分布が JSON で集計でき、skill references に 30 日実測セクションが追加されている。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| 30 日経過前に着手して仮証跡を作る | 着手前に最古 run 日付を確認し、30 日未満なら作業を止める |
| failure 原因が token 失効で機微情報を含む | `gh run view --log-failed` 出力に対し `rg -i "(token\|bearer\|secret\|Authorization)"` redaction grep を必須にする |
| GitHub Actions retention（90 日）超過 | 30 日経過 ASAP に着手し、retention 失効前に集計を完了する |

## 8. 参照情報

- `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md`
- `.github/workflows/post-release-dashboard.yml`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `scripts/post-release-dashboard/`

## 9. 備考

本タスクは外部時間依存（GitHub Actions schedule の 30 日連続実 run が前提）。issue-351 サイクル内で fixture / dry-run までは完了しているため、ここでの検証対象は「実 schedule の信頼性」に限定する。

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md`
- 症状: schedule の安定性 feedback は schedule 実 run の蓄積が前提で、close-out サイクル内では仮証跡しか作れない。「実装は完了した／検証は時間依存で defer」を Phase 12 で明示する形式が必要だった。
- 対策: `defer allowed` 区分を `unassigned-task-detection.md` に明記し、本仕様書を別タスク化することで close-out を阻害しないようにした。同種タスク（schedule 実測 feedback）は将来も繰り返し発生するため、テンプレ化を検討する。
- 参照: issue-351 Phase 12 unassigned-task-detection / skill-feedback-report

## スコープ

### 含む

- `post-release-dashboard.yml` の 30 日連続 schedule run の conclusion 集計
- `aiworkflow-requirements` skill references への 30 日実測 feedback 追記
- failure 比率に応じた次アクション判断

### 含まない

- alert / retry / 通知の実装（必要な場合は別 unassigned task として起票）
- production deploy / Cloudflare 設定変更
- artifact 内 metrics 値の傾向分析（schedule 安定性に観点を絞る）

## 状態遷移

- 2026-05-06: `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/` へ formalize 済み。Issue #497 は CLOSED 維持。30 日 gate 成立後に Phase 11 / 12 を実行し、PR 文脈では `Refs #497, Refs #351` のみ使用する。
