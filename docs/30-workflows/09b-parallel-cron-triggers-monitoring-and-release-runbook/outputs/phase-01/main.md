# Phase 1 出力: 要件定義サマリ

## 1. 目的の再掲

09b の単一責務は「Workers Cron Triggers の正本定義 + 監視 placeholder + release/incident runbook + rollback 手順」を 1 タスクで束ね、09a（staging deploy）と 09c（production deploy）から分離して固定すること。本タスクは docs-only / `workflow_state=spec_created` であり、`apps/api/wrangler.toml` 自体は本 wave 内では変更しない（cron 文字列は仕様書として記録するのみ）。

## 2. スコープ確定

### 2.1 含む

- `apps/api/wrangler.toml` の `[triggers]` セクション current facts の正本記録
  - `0 * * * *`: legacy Sheets sync（残存。撤回は UT21-U05 に分離）
  - `*/15 * * * *`: response sync（15 分毎、Forms responses → D1）
  - `0 18 * * *`: schema sync（毎日 03:00 JST = UTC 18:00）
- Cloudflare Analytics ダッシュボード URL placeholder（Workers / D1 / Pages × staging / production = 6 件）
- Sentry / Logpush 連携 placeholder（DSN / sink 名は環境変数 + Cloudflare Secrets で管理）
- `outputs/phase-12/release-runbook.md`（go-live + rollback + cron 制御 + dashboard URL）
- `outputs/phase-12/incident-response-runbook.md`（initial / escalation / postmortem）
- worker / pages / D1 migration / cron の 4 種 rollback 手順

### 2.2 含まない

- staging deploy 本体（09a）
- production deploy 本体（09c）
- 本番 alert 送信先の実値（Slack channel, Email アドレス）
- Sentry 有料 plan 加入、Logpush 有料 sink 設定、Slack bot 構築

## 3. 真の論点

| # | 論点 | 仮結論 |
| --- | --- | --- |
| Q1 | Cron 頻度は `*/15` で良いか、`*/30` に減らすか | `*/15` を維持。`apps/api/wrangler.toml` current facts と一致させ、Phase 9 で 121 req/day 試算が無料枠 100k req/day の 0.2% 以下であることを示す |
| Q2 | Sentry / Logpush placeholder を 09b で配置するか別 task に切るか | 09b 内に placeholder のみ配置。実 DSN 登録と Logpush sink 設定は別 task（UT-OBS-SENTRY-001 / UT-OBS-LOGPUSH-001、unassigned-task-detection.md に列挙） |
| Q3 | release runbook の置き場所 | `docs/30-workflows/09b-.../outputs/phase-12/release-runbook.md` に配置（phase-2-design.md に従う）。 `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` への昇格は別途 system-spec-update-summary.md で提案 |
| Q4 | incident response の通知先（Slack / Email） | 平文 secret は書かず `<placeholder>` 表記。実値は Cloudflare Secrets / 1Password に置く |

open question は 4 件で、3 件未満要件は Q1/Q2/Q3/Q4 のうち Q4 のみ runtime にて値解決が必要なため Phase 3 で再評価し、最終 Q1〜Q3 は Phase 3 で clear する。

## 4. 上流 AC 引き継ぎ確認

| 上流 task | 引き継ぎ物 | 状態 |
| --- | --- | --- |
| 08a-parallel-api-contract-repository-and-authorization-tests | `POST /admin/sync/{schema,responses}` の AC（認可 + sync_jobs running guard 契約） | pending（同 wave 並列）。AC 達成後 Phase 4 verify suite I-1 と I-2 の test base にする |
| 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | sync 完了後の UI 表示確認（dashboard 画面の `sync_unavailable` 警告消失） | pending（同 wave 並列）。runbook 走破 R-1 で UI 表示パスを確認 |
| docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails | Cloudflare Analytics URL placeholder 構造、cost guardrails 試算雛形 | completed。Phase 9 の試算と URL 命名規則の元 |

## 5. AC リスト（index.md 9 件再掲）

- AC-1: `apps/api/wrangler.toml [triggers] crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]` を runbook に正本記録（docs-only / wrangler.toml は変更しない）
- AC-2: cron が staging で適用された場合の確認方法（`wrangler deployments list` + Cloudflare Dashboard Triggers タブ）が runbook に記載
- AC-3: `outputs/phase-12/release-runbook.md` に staging→production go-live 手順、production rollback 手順、cron 一時停止/再開手順
- AC-4: incident response runbook に initial response / escalation matrix / postmortem template
- AC-5: monitoring dashboard URL（Workers / D1 / Pages × staging / production = 6）と Sentry / Logpush placeholder
- AC-6: cron 二重起動防止のため `sync_jobs.running` 参照設計（spec/03-data-fetching.md 準拠）
- AC-7: 不変条件 #5 違反 rollback 手順（apps/web からの D1 操作）が含まれない
- AC-8: 不変条件 #6 違反（GAS apps script trigger）が cron 定義に含まれない
- AC-9: 不変条件 #10（無料枠）試算で `*/15` cron が Workers 100k req/day 以内

## 6. 依存境界

- 09b が触る: `apps/api/wrangler.toml` 仕様、Cloudflare Analytics / Sentry / Logpush placeholder、release/incident runbook、rollback 手順、cron 制御手順
- 09b が触らない: staging deploy 本体（09a）、production deploy 本体（09c）、Slack/Email 実値登録、Sentry 実接続、Logpush sink 接続

## 7. 4 条件 仮判定

| 条件 | 問い | 仮判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | runbook で incident 復旧時間を短縮できるか | PASS | rollback 4 種 + cron 一時停止 + escalation matrix で初動 5 分以内が再現可能 |
| 実現性 | wrangler.toml + spec_created で 1 営業日完了か | PASS | docs-only。コード変更なし、placeholder 化で外部接続不要 |
| 整合性 | 09a / 09c との scope 重複なし | PASS | dependency matrix で in/out を明示（Phase 2 で詳述） |
| 運用性 | rollback / cron 一時停止が誰でも実行可能か | TBD | Phase 5 で cron-deployment-runbook 完成後に PASS 確定 |

## 8. invariants touched 確認

- #5: rollback 手順内で apps/web 側からの D1 操作を一切含めない
- #6: cron 定義は Workers Cron Triggers のみ。GAS apps script trigger を runbook 内 alternative として提示しない
- #10: cron 頻度試算は Phase 9 で 121 req/day（100k 無料枠の 0.2%）として確定
- #15: rollback 後の attendance 整合性確認 SQL を Phase 6 rollback-procedures.md に必ず含める

## 9. open question

- O-1（Q1）: `*/15` 維持 → Phase 3 で alternative 比較し採択を確定する
- O-2（Q2）: Sentry / Logpush placeholder の同 wave 配置 → Phase 12 unassigned-task-detection.md で別 task 化を明文化する
- O-3（Q4）: Slack / Email 通知先 → `<placeholder>` 表記で固定、実値は Cloudflare Secrets / 1Password 経由に統一

## 10. 次 Phase への引き継ぎ

- 採択候補: cron schedule = current facts 3 件（Q1 仮結論）
- Phase 2 で cron-schedule-design.md に頻度試算 + 二重起動防止設計を展開
- Phase 2 dependency matrix で 09a → 09b（staging URL）/ 09b → 09c（runbook 本体）を明示
