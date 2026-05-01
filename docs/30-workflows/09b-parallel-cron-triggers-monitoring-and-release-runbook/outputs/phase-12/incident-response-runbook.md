# incident-response-runbook（最終版）

UBM 兵庫支部会 メンバーサイトの障害対応手順を 1 ファイルで再現可能にする runbook。
release-runbook.md と相互参照し、cron 制御や rollback の具体 command はそちらへ redirect する。

> 不変条件: #5 / #6 / #10 / #15 を担保した手順のみを記載する。

## 1. 重大度定義

| 重大度 | 内容 | 例 |
| --- | --- | --- |
| **P0** | production 全停止 / データ消失 / secret 漏洩 | apps/web 200 を返さない、D1 全 query 失敗、log に Bearer token 出力、apps/web bundle に D1Database import 検出（不変条件 #5 違反） |
| **P1** | sync 完全停止 / authn 不可 / 重要機能停止 | sync_jobs 30 分以上 stale running、Auth.js login 失敗、admin endpoint 全件 5xx |
| **P2** | sync 遅延 / 部分機能停止 / 監視 alert | sync_jobs.failed 連続、Forms 429、dashboard URL 404 |

## 2. initial response

### 2.1 5 分以内（detect → declare）

1. **detect**: dashboard / sync_jobs SELECT で異常を検知
   ```bash
   wrangler d1 execute ubm-hyogo-db-prod \
     --command "SELECT id, type, status, error, started_at FROM sync_jobs ORDER BY started_at DESC LIMIT 10;" \
     --config apps/api/wrangler.toml --env production
   ```
2. **declare**: 重大度判定（P0 / P1 / P2）
3. **immediate action**:
   - P0: Slack `<#ubm-hyogo-prod-incident>` 通知 + cron 一時停止 + rollback 準備
   - P1: Slack `<#ubm-hyogo-prod-incident>` 通知 + 影響範囲評価
   - P2: Slack `<#ubm-hyogo-dev>` 通知 + 自然 retry 観察

### 2.2 30 分以内（mitigate）

- P0: rollback 実施（release-runbook § 4 参照）。secret 漏洩時は rotation 開始
- P1: cron 一時停止して原因特定（cron-deployment-runbook Step 4）
- P2: 連続 fail なら cron 一時停止、単発なら観察継続

### 2.3 60 分以内（stabilize）

- 復旧確認: release-runbook § 7（10 ページ smoke）と attendance 整合性確認 SQL（不変条件 #15）
- cron 再開判断
- postmortem ドラフト着手

## 3. escalation matrix

| 重大度 | 内容 | 一次対応者 | エスカレ先 | 通知先 placeholder |
| --- | --- | --- | --- | --- |
| **P0** | production 全停止 / データ消失 / secret 漏洩 | release-runbook 担当 | release-staging 担当 + 開発 lead | Slack `<#ubm-hyogo-prod-incident>` + Email `<admin@ubm-hyogo.example>` + 必要に応じて電話 |
| **P1** | sync 完全停止 / authn 不可 | release-runbook 担当 | 開発 lead（30 分以内に未復旧の場合） | Slack `<#ubm-hyogo-prod-incident>` |
| **P2** | sync 遅延 / 部分機能停止 | dev 担当 | release-runbook 担当（連続 3 周期以上の場合） | Slack `<#ubm-hyogo-dev>` |

> 実通知先は Cloudflare Secrets / 1Password で管理。本ファイルには平文を書かない（CLAUDE.md secret 管理ポリシー）。

## 4. cron 一時停止コマンド（runbook redirect）

詳細は `outputs/phase-05/cron-deployment-runbook.md` Step 4 を参照。緊急時のショート手順:

```toml
# apps/api/wrangler.toml
[env.production.triggers]
crons = []
```

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

## 5. 影響範囲評価

### 5.1 sync 系障害

```sql
-- 直近 24 時間の sync_jobs 集計
SELECT type, status, COUNT(*) c
FROM sync_jobs
WHERE started_at > datetime('now', '-24 hours')
GROUP BY type, status;
```

期待:
- `responses, success`: ~96 件 / 24h
- `schema, success`: 1 件 / 24h
- legacy `sheets, *`: 24 件 / 24h
- `failed`: 単発はあり得る、連続 3 件以上で P1

### 5.2 全停止

- 公開 API: `curl -sI https://ubm-hyogo-api.<account>.workers.dev/health` → 5xx
- web: `curl -sI https://ubm-hyogo-web.pages.dev/` → 5xx
- どちらも 5xx → P0 候補。片側のみなら該当 service の rollback

### 5.3 secret 漏洩

- log review: `wrangler tail --config apps/api/wrangler.toml --env production` で直近 30 分の log を確認
- `rg -i 'authorization:\s*bearer\s+ey'` 等の grep を実行
- 検出時即座に rotation（release-runbook § 6 の手動 sync token、Cloudflare API Token、Sentry DSN（placeholder）等）

## 6. mitigation 標準パターン

| パターン | 適用ケース | 手順 |
| --- | --- | --- |
| **rollback** | 直前 deploy が原因 | release-runbook § 4 |
| **cron 停止** | sync 連続 fail / 二重起動 | release-runbook § 5 |
| **手動 sync** | cron 停止中に最新 data が必要 | release-runbook § 6 |
| **fix migration** | D1 schema 不整合 | release-runbook § 4.3 |
| **secret rotation** | secret 漏洩 | failure-cases F-10 |
| **頻度低下** | 無料枠接近 | failure-cases F-6/F-7 |
| **観察継続** | 単発 P2、自然 retry が期待できる | 次 cron 周期で sync_jobs.success を待つ |

## 7. attendance 整合性確認（不変条件 #15）

mitigation 完了後、必ず以下を実行:

```bash
# 重複チェック
wrangler d1 execute ubm-hyogo-db-prod \
  --command "SELECT meeting_id, member_id, COUNT(*) c FROM member_attendance WHERE deleted_at IS NULL GROUP BY meeting_id, member_id HAVING c > 1;" \
  --config apps/api/wrangler.toml --env production
# expected: 0 rows

# 削除済みメンバー残存チェック
wrangler d1 execute ubm-hyogo-db-prod \
  --command "SELECT a.id FROM member_attendance a JOIN members m ON m.id = a.member_id WHERE m.deleted_at IS NOT NULL AND a.deleted_at IS NULL;" \
  --config apps/api/wrangler.toml --env production
# expected: 0 rows
```

違反検出時は 02c へ差し戻し、後方互換 fix migration で解消。

## 8. postmortem template

```markdown
# Postmortem: <incident title>

## meta
- date: YYYY-MM-DD
- severity: P0 / P1 / P2
- duration: HH:MM (detect → stabilize)
- detection: <自動 alert / 手動発見 / user report>
- author: <担当者>

## 概要
<1〜2 段落で何が起きたか>

## 影響範囲
- 影響したサービス: <apps/api / apps/web / cron / D1 / etc.>
- 影響した user: <推定数 + 内容>
- データ影響: <あり/なし、内容>

## 根本原因（root cause）
<5 whys 推奨>

## mitigation（実施した対応）
1. <step>
2. <step>

## timeline
- HH:MM 検知
- HH:MM 重大度判定（P?）
- HH:MM 一次対応者通知（Slack <#channel>）
- HH:MM cron 停止 / rollback / fix migration 等
- HH:MM 復旧確認（release-runbook § 7 / attendance 整合性）
- HH:MM postmortem ドラフト開始

## 検出までの時間（detection time）
- 障害発生から検知まで: HH:MM
- 検知から復旧まで: HH:MM

## なぜ防げなかったか（why not prevented）
<前回 postmortem の action item で防げたか / 監視の盲点 / etc.>

## action items
- [ ] <preventive measure 1> — owner: <name>, due: YYYY-MM-DD
- [ ] <preventive measure 2> — owner: <name>, due: YYYY-MM-DD

## 関連 link
- release-runbook.md
- failure-cases.md（該当 F-? を引用）
- 監視 dashboard URL（事象発生時間帯のスクリーンショット）
```

## 9. 不変条件チェック

| 不変条件 | 本 runbook での対応 |
| --- | --- |
| #5 | rollback / mitigation すべて apps/api 経由。apps/web からの D1 操作なし |
| #6 | cron 停止 / 手動 sync は Workers Cron Triggers + admin endpoint のみ。apps script trigger なし |
| #10 | 無料枠接近時の mitigation を § 6 に集約（頻度低下） |
| #15 | mitigation 完了後 § 7 の attendance 整合性 SQL を必須実行 |

## 10. 改訂履歴

| 日付 | 変更 |
| --- | --- |
| 2026-04-26 | 初版（09b Phase 12 で作成） |

## 11. 関連 runbook

- `outputs/phase-12/release-runbook.md`（rollback / cron 制御の具体 command）
- `outputs/phase-06/failure-cases.md`（F-1〜F-12 と検出 / mitigation）
- `outputs/phase-06/rollback-procedures.md`
- `outputs/phase-05/cron-deployment-runbook.md`
- `outputs/phase-07/ac-matrix.md`（AC-4 対応セクション）
