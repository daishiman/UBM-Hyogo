# Phase 03 — タスク分解 (単一責務原則)

本タスクは runtime ops のみで、CONST_007 に従い「1 サイクル内で完了できるスコープ」に収める。コード変更が必要となった場合は後述の例外条件に従い別タスクへ切り出す。

## 3.1 ステップ一覧 (直列)

| # | ステップ | 責務 | 成果物 | 依存 |
|---|----------|------|--------|------|
| S1 | 事前 snapshot 取得 | production 現状を記録 | `outputs/phase-11/snapshot-before.json` | 親 PR #960 が production deploy 済であること |
| S2 | secrets readiness 確認 | snapshot から欠落キー特定 | `secretsReadiness.{...}` 真偽メモ | S1 |
| S3 | Cloudflare Secrets 投入 | 欠落キーを `cf.sh secret put` で投入 | `cf.sh secret list` 出力 (キー名のみ) | S2 / 1Password 参照可 |
| S4 | cron schedule drift 確認 | `wrangler.toml` 現状 vs deploy 済 schedule | drift 無 or 修正差分 | S1 |
| S5 | cron 起動観測 | `cf.sh tail --env production` を 16 分 (1 cycle + margin) 張る | tail log 抜粋 | S3 / S4 |
| S6 | stale lock check | `sync_jobs` の `started_at < now-1h` AND `status='running'` を SELECT | 該当 row 一覧 (有/無) | S5 |
| S7 | stale lock reset (該当時のみ) | `status='running'` を `'aborted'` に手動 UPDATE | UPDATE 結果 row 数 | S6 で該当時 |
| S8 | 事後 snapshot 取得 | AC 全達成を確認 | `outputs/phase-11/snapshot-after.json` | S5 / S7 |
| S9 | 差分検証 | before/after を比較し AC-2/3/4 達成を明文化 | `outputs/phase-11/snapshot-diff.md` | S8 |

## 3.2 並列化可否

- 全ステップ直列 (production runtime 状態が前提のため)。
- 例外: S1 と Phase 02 の drift チェックリスト確認は並行可。

## 3.3 例外: コード変更が必要となるケース (runtime evidence dependent)

以下は **現時点では未観測** の runtime evidence dependent 候補であり、推測だけでは未タスク化しない。ユーザー承認後の production 観測で実際に発生した場合は、その時点で本タスクを完了扱いにせず、影響範囲・実施時期・登録先を明記してユーザーへエスカレーションする。

| 事象 | 判断 | 理由 |
|------|---------------|------|
| `sheets-auth-classifier` の reason code が想定外パターンを返す | 観測時にエスカレーション | classifier ロジック追加は単独レビュー対象。観測 log と reason payload なしに spec 化しない |
| sync-lock TTL が長すぎて stale lock が滞留する | 観測時にエスカレーション | TTL 定数変更は他 cron job 全体に波及。1 cycle の production evidence なしに調整しない |
| Forms API quota / backoff 問題 | 既存 Issue #265 と照合してエスカレーション | quota / governance は別 governance スコープ。既存 Issue で足りない場合のみ追加 formalize |

分離理由 (CONST_008): 上記はいずれも production 観測が成立して初めて必要性が確定する。未観測のまま backlog を作ると speculative task になり、逆に観測後に放置すると本タスクの復旧目的を満たさないため、runtime execution cycle 内では「観測 → エスカレーション → ユーザー判断 → formalize / 同一 cycle 修正」の順で扱う。
