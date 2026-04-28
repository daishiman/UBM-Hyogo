# Phase 6: 異常系シナリオマトリクス

> 各シナリオは Phase 2 rollback-runbook.md と対応。実行時は発生 → 対応 → 結果を本書に追記。

## 1. シナリオ一覧

| ID | シナリオ | 想定原因 | 検知方法 | 対応 (rollback-runbook.md 参照) | 合格基準 |
| --- | --- | --- | --- | --- | --- |
| A-1 | wrangler 認証エラー | API トークン期限切れ / アカウント不一致 | `wrangler whoami` で識別 | トークン再発行・`wrangler login` 再実行 | 認証成功後リトライで進行 |
| A-2 | D1 binding 不一致 | wrangler.toml の binding 名 / database_id 誤り | apply / execute 時の binding error | `apps/api/wrangler.toml` を再確認・修正後リトライ | binding error 解消 |
| A-3 | D1 migration apply 部分失敗 | SQL エラー / 一部成功 | `migrations list` の applied/pending 不整合 | rollback-runbook.md D-1 (バックアップから restore) または D-2 (DROP SQL) | テーブル状態が apply 前と一致 |
| A-4 | apps/api wrangler deploy 失敗 | ビルド成果物欠損 / binding error | wrangler deploy が non-zero exit | rollback-runbook.md W-1 (API のみ rollback) → 修正 → 再 deploy | `/health` 200 復帰 |
| A-5 | apps/web wrangler deploy 失敗 | OpenNext 形式整合 / Pages 形式設定不整合 | wrangler deploy が non-zero exit | rollback-runbook.md W-1 (Web のみ rollback) → 修正 → 再 deploy | Pages 200 復帰 |
| A-6 | 直後 smoke FAIL (AC-1) | Web 配信不通 / DNS 未伝播 | `curl -sI` non-2xx | rollback-runbook.md W-1 (Web) | 200 OK |
| A-7 | 直後 smoke FAIL (AC-2) | API 起動失敗 / runtime error | `/health` non-2xx | rollback-runbook.md W-1 (API) | healthy |
| A-8 | 直後 smoke FAIL (AC-4) | Workers→D1 binding 切断 / migration 不整合 | `/health/db` non-2xx | rollback-runbook.md D-1 + W-1 (API) | DB 疎通 OK |
| A-9 | 全件成功後の運用障害 | 認証 / 想定外 runtime error | エラーログ / ユーザー報告 | rollback-runbook.md §4 表 (Web → API → DB の逆順) | 旧版に復帰 |
| A-10 | Cloudflare 広域障害 | プラットフォーム障害 | status.cloudflare.com | デプロイ中止・障害復旧待機 | Cloudflare 復旧後再判定 |
| A-11 | バックアップ取得失敗 | D1 export がエラー終了 / 容量制限 | 出力ファイル不在 / 0 byte | 認証・binding 再確認後リトライ。3 回失敗で Phase 5 中止 | バックアップファイル取得 |
| A-12 | rollback リハーサル未実施 | スケジュール不足 | Phase 6 rollback-rehearsal-result.md 不在 | 実行 GO 判定の前に staging リハーサル必須 | リハーサル PASS 記録あり |

## 2. 異常系発生時の共通対応

1. 当該ステップを即時停止
2. 本書テーブルに発生記録 (時刻 / 操作者 / 観測ログ)
3. rollback-runbook.md の該当節を実施
4. `outputs/phase-05/deploy-execution-log.md` の対応結果欄に追記
5. 是正後の再開判断は Phase 4 production-approval.md §2 の運用責任者が下す

## 3. AC-8 (rollback 事前確認) 観点

- 全シナリオが rollback-runbook.md と対応している
- 対応コマンドは全て docs-only モードで机上確認済
- 実行時は staging リハーサル (`outputs/phase-06/rollback-rehearsal-result.md`) で 1 件以上実機確認すること

## 4. 実発生記録 (実行時追記)

| 発生 ID | 発生時刻 | 操作者 | 適用対応 | 結果 | 備考 |
| --- | --- | --- | --- | --- | --- |
| - | - | - | - | - | - |
