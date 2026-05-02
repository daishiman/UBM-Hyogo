# Phase 11: 24h post-release 検証 + 共有

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-09c-production-deploy-execution-001 |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 24h post-release 検証 + incident runbook 共有 |
| Wave | 9 |
| Mode | serial（最終 / execution-only） |
| 作成日 | 2026-05-02 |
| 前 Phase | 10 (GO/NO-GO 判定 / user 承認 2 回目) |
| 次 Phase | 12 (実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback) |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL |
| user_approval | REQUIRED（Phase 10 で取得済み承認の継続管理） |
| Cloudflare CLI | `bash scripts/cf.sh` 経由のみ |

## 目的

Phase 10 で GO 判定された production 環境に対して、deploy 完了から **24 時間** の post-release 観測（Cloudflare Analytics）と、**incident response runbook（09b 親成果物）の関係者共有**、および **異常検知時の incident runbook 起動 evidence**（または「異常なし」evidence）を、VISUAL 証跡（screenshots）と Markdown evidence の両輪で固定する。本 Phase は production への新規 mutation を行わず、観測と共有のみで構成する。

## 実行タスク

1. 24h 観測ウィンドウの開始時刻記録（Phase 10 GO 判定時刻 + 0h を起点）
2. Cloudflare Workers Analytics（API / Web）の 24h 観測 — Workers req / day（< 5k MVP）
3. Cloudflare D1 Metrics の 24h 観測 — reads / writes（無料枠 10% 以下）
4. 異常 rate 観測 — 5xx / 4xx の急増がないこと（Workers tail / Analytics）
5. 観測 screenshots を `outputs/phase-11/screenshots/` に保存（必須 3 枚 + Slack reaction は任意）
6. incident response runbook（09b 成果物）の関係者共有（Slack post placeholder / Email placeholder）+ 受領確認
7. 24h 期間中の **新規 deploy 凍結** ルールを遵守（incident hotfix 例外のみ）
8. 異常検知時は incident runbook 起動 evidence、無事完了時は「異常なし」evidence を保存
9. 不変条件 #5 / #15 の SQL 再確認（`bash scripts/cf.sh d1 execute` 経由）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-10.md | GO/NO-GO 判定 / 観測起点 |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md | 親 24h evidence template |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/post-release-summary.md | MVP リリース完了報告 template |
| 必須 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/incident-response-runbook.md | incident runbook 本体 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | 無料枠閾値（D1 reads 500k / writes 100k） |
| 必須 | scripts/cf.sh | Cloudflare CLI wrapper |

## 実行手順

### ステップ 1: 24h 観測ウィンドウ開始

```bash
# Phase 10 GO 判定時刻を観測起点として記録
echo "OBSERVATION_START=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> outputs/phase-11/24h-metrics.md
```

- 起点 `T+0h`、終点 `T+24h` を Markdown に明記
- 観測中の **新規 deploy 凍結** をチームに告知（Slack post）

### ステップ 2: Cloudflare Workers Analytics 観測

- Cloudflare Dashboard → Workers & Pages → `ubm-hyogo-api` / `ubm-hyogo-web` → Analytics
- 24h 区間で以下を取得し screenshot 保存:
  - `outputs/phase-11/screenshots/analytics-workers-api.png`
  - `outputs/phase-11/screenshots/analytics-workers-web.png`
- 計測値:
  - Workers req / day（< 5k MVP 目標）
  - 5xx rate / 4xx rate（baseline と比較し急増なし）

### ステップ 3: Cloudflare D1 Metrics 観測

- Cloudflare Dashboard → D1 → `ubm_hyogo_production` → Metrics
- 24h 区間で reads / writes を確認、screenshot 保存:
  - `outputs/phase-11/screenshots/analytics-d1.png`
- 判定: reads < 50k（500k の 10%）/ writes < 10k（100k の 10%）

### ステップ 4: 異常 rate 観測（Workers tail）

```bash
# 観測中スポットで wrangler tail（30 分以上）
bash scripts/cf.sh tail --env production --config apps/api/wrangler.toml \
  | tee outputs/phase-11/wrangler-tail-24h-spot.log
```

- 5xx / unhandled exception / unauthorized leak が出ていないこと
- session token / secret が log に出力されていないこと（取扱注意）

### ステップ 5: 不変条件 SQL 再確認

```bash
# 不変条件 #5（apps/web → D1 直叩き禁止）
rg "D1Database" apps/web/.open-next/ 2>&1 | tee outputs/phase-11/invariant-5-rg.txt

# 不変条件 #15（attendance 重複防止）
bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --command "SELECT session_id, member_id, COUNT(*) c FROM attendances WHERE deleted_at IS NULL GROUP BY session_id, member_id HAVING c > 1;" \
  --remote --env production --config apps/api/wrangler.toml \
  | tee outputs/phase-11/invariant-15-sql.json
```

- #5: 0 hit ならば PASS
- #15: 0 行ならば PASS

### ステップ 6: incident runbook 共有 evidence

- 09b 親成果物の `incident-response-runbook.md` URL を Slack / Email で共有
- 共有先 / 日時 / 受領確認（reaction / reply）を `share-evidence.md` に記録
- 実値はファイルに残さず placeholder で記述（CLAUDE.md secret 管理ルール準拠）

```markdown
# share-evidence.md
- Slack channel: <placeholder #ubm-hyogo-prod-incident>
- Email recipient: <placeholder admin@ubm-hyogo.example>
- 共有日時: <YYYY-MM-DDTHH:MMZ>
- 受領確認: Slack reaction screenshot を screenshots/slack-reaction.png に保存
```

### ステップ 7: 異常 / 無事完了の判定 evidence

- 異常検知時: incident runbook 起動 evidence を `incident-or-no-incident.md` に記録
  - 検知時刻 / 内容 / 起動 step / rollback 実行有無
- 無事完了時: 「異常なし」evidence を同ファイルに記録
  - 観測終了時刻 / 全 metric が閾値内 / 5xx 急増なし

### ステップ 8: 24h-metrics.md 仕上げ

- ステップ 2-5 の実測値を 1 ファイルにまとめる
- 親 09c `post-release-summary.md` テンプレを踏襲

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | implementation-guide / system-spec-update に 24h 実測値と incident 有無を反映 |
| Phase 13 | PR body の Test plan / Summary に 24h 実測値リンクを記載 |
| 親 09c Phase 11 | template との対応表を `outputs/phase-11/parent-template-parity.md` に記載 |
| 上流 09b | incident runbook の共有経路を実行 |

## 多角的チェック観点（不変条件）

- 不変条件 #4: production `/profile` に編集 form 不在を 24h 中に再 screenshot で証跡化（任意 spot check）
- 不変条件 #5: 24h 後に `rg D1Database apps/web/.open-next/` が 0 hit
- 不変条件 #6: cron 確認画面（Cloudflare Dashboard → Workers → Triggers）に GAS apps script trigger が存在しないことを screenshot
- 不変条件 #10: 24h 後に Workers req < 5k、D1 reads / writes が無料枠 10% 以下
- 不変条件 #11: admin 詳細画面に編集 form がないことを目視 + screenshot 注釈
- 不変条件 #15: 24h 後に attendance 重複 0 件 SQL の結果を保存

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 24h 観測ウィンドウ開始記録 | 11 | spec_created | T+0h 起点 |
| 2 | Workers Analytics 観測 + screenshots | 11 | spec_created | API / Web 各 1 枚以上 |
| 3 | D1 Metrics 観測 + screenshot | 11 | spec_created | reads / writes |
| 4 | wrangler tail spot 観測 | 11 | spec_created | 30 分以上 |
| 5 | 不変条件 #5 / #15 SQL 再確認 | 11 | spec_created | 0 hit / 0 行 |
| 6 | incident runbook 共有 evidence | 11 | spec_created | Slack / Email + 受領 |
| 7 | 異常 / 無事完了 判定 evidence | 11 | spec_created | どちらか 1 つ必須 |
| 8 | 24h-metrics.md 仕上げ | 11 | spec_created | 実測値必須 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | Phase 11 サマリ |
| ドキュメント | outputs/phase-11/24h-metrics.md | Workers req / D1 reads / writes / 5xx rate 実測値 |
| ドキュメント | outputs/phase-11/share-evidence.md | incident runbook 共有記録（Slack / Email + 受領） |
| ドキュメント | outputs/phase-11/incident-or-no-incident.md | 異常検知時 runbook 起動 / 無事完了 evidence |
| 証跡（VISUAL） | outputs/phase-11/screenshots/analytics-workers-api.png | Workers Analytics（API） |
| 証跡（VISUAL） | outputs/phase-11/screenshots/analytics-workers-web.png | Workers Analytics（Web） |
| 証跡（VISUAL） | outputs/phase-11/screenshots/analytics-d1.png | D1 Metrics |
| 証跡（VISUAL 任意） | outputs/phase-11/screenshots/slack-reaction.png | Slack 受領 reaction |
| 証跡 | outputs/phase-11/wrangler-tail-24h-spot.log | tail spot log |
| 証跡 | outputs/phase-11/invariant-5-rg.txt | #5 grep 結果 |
| 証跡 | outputs/phase-11/invariant-15-sql.json | #15 SQL 結果 |
| メタ | artifacts.json | Phase 11 を completed に更新 |

## 完了条件

- [ ] `24h-metrics.md` に Workers req / D1 reads / writes / 5xx rate の **実測値** が記載
- [ ] screenshots に最低 3 枚（analytics-workers-api / analytics-workers-web / analytics-d1）
- [ ] `share-evidence.md` に incident runbook 共有先 + 共有日時 + 受領確認
- [ ] `incident-or-no-incident.md` に「異常なし」または「runbook 起動」evidence
- [ ] 不変条件 #5（rg 0 hit）/ #15（SQL 0 行）が PASS
- [ ] 24h 期間中の新規 deploy 凍結ルール遵守（hotfix 例外のみ）
- [ ] artifacts.json の Phase 11 を completed に更新

## タスク100%実行確認【必須】

- 全実行タスクが completed
- evidence 全種が `outputs/phase-11/` に配置
- VISUAL screenshots が 3 枚以上配置
- artifacts.json の phase 11 を completed に更新
- Phase 12 引き継ぎ準備（24h-metrics.md / incident-or-no-incident.md）が完了

## 次 Phase

- 次: 12 (実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback)
- 引き継ぎ事項: 24h-metrics 実測値 / incident 有無 / 不変条件 #5 #15 結果
- ブロック条件: 24h-metrics.md に実測値が入っていない、または share-evidence が欠ける場合は次 Phase に進まない

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 24h 観測中に 5xx 急増 | production 影響 | 即時 incident runbook 起動 → rollback 判断（Phase 7 deploy evidence + Phase 6 D1 backup を活用） |
| Cloudflare 無料枠超過 | サービス停止リスク | D1 reads / writes が 10% を超えた段階で原因調査 task を起票（unassigned-task として Phase 12 で検出） |
| Slack / Email 共有が届かない | runbook 周知失敗 | 受領確認（reaction / reply）が 24h 内に取れない場合は再送 + 別経路（DM 等）で再送 evidence を残す |
| 24h 中に hotfix 必要 | 観測ウィンドウ汚染 | hotfix 例外として記録（incident-or-no-incident.md に分離記載）し、観測ウィンドウを延長 |
| screenshot に session token 等が写り込む | secret leak | 取得前に Cloudflare Dashboard の URL bar / network panel を closed にし、取得後に目視 redact 確認 |
