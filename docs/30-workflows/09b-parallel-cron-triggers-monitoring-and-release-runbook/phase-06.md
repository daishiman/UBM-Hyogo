# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

cron / 監視 / runbook で起こり得る失敗ケース 12 種と、それぞれの検出 / mitigation / rollback 手順を `outputs/phase-06/failure-cases.md` と `outputs/phase-06/rollback-procedures.md` に固定する。

## 実行タスク

1. failure case 12 種列挙
2. 検出方法（dashboard / wrangler tail / sync_jobs SELECT）
3. mitigation（rollback / cron 停止 / 手動 sync）
4. rollback procedures（worker / pages / D1 / cron）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-05.md | runbook |
| 必須 | docs/00-getting-started-manual/specs/03-data-fetching.md | sync 失敗時運用 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | rollback / cron |

## 実行手順

### ステップ 1: failure case 12 種

### ステップ 2: 検出方法

### ステップ 3: mitigation

### ステップ 4: rollback procedures

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC matrix の negative |
| Phase 11 | manual evidence で chaos 実行 |
| 並列 09a | staging で再現可能なら共通化 |
| 下流 09c | production rollback 手順 |

## 多角的チェック観点（不変条件）

- #5: rollback で web 側 D1 操作なし
- #6: GAS apps script trigger を rollback 候補に出さない
- #10: 無料枠超過時の cron 一時停止手順
- #15: rollback で attendance 整合性

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case 12 種 | 6 | pending | failure-cases.md |
| 2 | 検出方法 | 6 | pending | dashboard / wrangler / sql |
| 3 | mitigation | 6 | pending | rollback / 停止 / 手動 |
| 4 | rollback procedures | 6 | pending | rollback-procedures.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 異常系サマリ |
| ドキュメント | outputs/phase-06/failure-cases.md | 12 ケース詳細 |
| ドキュメント | outputs/phase-06/rollback-procedures.md | worker / pages / D1 / cron rollback |
| メタ | artifacts.json | Phase 6 を completed に更新 |

## 完了条件

- [ ] failure case 12 種完成
- [ ] 各ケースに検出 + mitigation
- [ ] rollback procedures が 4 種（worker / pages / D1 / cron）

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 3 ファイル配置済み
- artifacts.json の phase 6 を completed に更新

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ事項: failure cases / rollback procedures
- ブロック条件: rollback procedures が 4 種未満で次 Phase に進まない

## Failure cases（12 ケース）

| # | カテゴリ | 失敗内容 | 検出方法 | mitigation |
| --- | --- | --- | --- | --- |
| F-1 | cron 不動作 | 15 分経っても sync_jobs に新規行なし | dashboard / `SELECT MAX(started_at) FROM sync_jobs;` | wrangler.toml の `[triggers]` 確認 → 再 deploy |
| F-2 | cron 二重起動 | sync_jobs.running が 2 件以上 | `SELECT COUNT(*) FROM sync_jobs WHERE status='running';` | 古い running を `failed` 化、03b の guard 強化 |
| F-3 | sync 連続 fail | sync_jobs.failed が 3 連続 | `SELECT * FROM sync_jobs WHERE status='failed' ORDER BY started_at DESC LIMIT 3;` | cron 一時停止 → 原因特定 → 修正 → 再開 |
| F-4 | Forms API 429 | sync_jobs.error に "rate limit" | wrangler tail | retry を待つ / cron 頻度を一時的に下げる |
| F-5 | D1 read timeout | sync_jobs.error に "timeout" | wrangler tail / Cloudflare D1 metrics | 02a/b の query を最適化 |
| F-6 | D1 write 上限 | D1 writes が 100k 接近 | Cloudflare D1 metrics | sync 頻度を下げる、UPSERT 最適化 |
| F-7 | Workers req 上限 | Workers req が 100k 接近 | Cloudflare Workers metrics | cron 頻度を下げる、API への重複 call を削減 |
| F-8 | rollback 不可 | wrangler rollback がエラー | wrangler 出力 | Cloudflare Dashboard から手動 rollback |
| F-9 | D1 migration 不整合 | production migration 適用失敗 | wrangler tail | 後方互換 migration を新規作成して fix（直接 SQL は禁止 spec/15） |
| F-10 | secret 漏洩 | log に secret が出る | log review | secret を rotation、Cloudflare Secrets 更新 |
| F-11 | 監視 dashboard URL 変更 | dashboard URL が 404 | runbook 走破 | placeholder 更新、infra と sync |
| F-12 | apps/web に D1 import | bundle に出現 | `rg D1Database apps/web/.vercel/output` | 02c へ差し戻し、cron rollback 不要 |

## Rollback procedures

### A. Worker rollback

```bash
# 直前 deploy id を取得
wrangler deployments list --config apps/api/wrangler.toml --env production | head -5

# rollback
wrangler rollback <deploy_id> --config apps/api/wrangler.toml --env production
```

- sanity: `curl -sI .../public/stats` で 200
- 注意: rollback で cron も直前バージョンに戻る → cron schedule が古い場合は再 deploy

### B. Pages rollback

```text
Cloudflare Dashboard
→ Pages
→ ubm-hyogo-web (production)
→ Deployments
→ 直前の "successful" deploy を選択
→ "Rollback to this deployment"
```

- sanity: web URL が前バージョンの content を返す
- 注意: production 環境の Pages secret は rollback されない（secret は手動管理）

### C. D1 migration rollback（緊急）

```bash
# 通常: 後方互換 migration を新規作成
wrangler d1 migrations create ubm-hyogo-db-prod fix_<issue> --config apps/api/wrangler.toml
# fix migration を編集後
wrangler d1 migrations apply ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml
```

- sanity: `wrangler d1 migrations list` で fix migration が `Applied`
- 注意: 直接 SQL `DROP TABLE` 等は禁止（spec/15-infrastructure-runbook.md 準拠）

### D. Cron rollback / 一時停止

```bash
# wrangler.toml の [env.production.triggers] crons = [] に変更し再 deploy
wrangler deploy --config apps/api/wrangler.toml --env production
```

- sanity: dashboard で cron 0 件
- 再開: `crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]` に戻して再 deploy

### attendance 整合性確認（不変条件 #15）

```bash
# rollback 後に attendance に重複 / 削除済みメンバーが含まれないか
wrangler d1 execute ubm-hyogo-db-prod \
  --command "SELECT session_id, member_id, COUNT(*) c FROM member_attendance GROUP BY session_id, member_id HAVING c > 1;" \
  --config apps/api/wrangler.toml --env production
# expected: 0 rows
```
