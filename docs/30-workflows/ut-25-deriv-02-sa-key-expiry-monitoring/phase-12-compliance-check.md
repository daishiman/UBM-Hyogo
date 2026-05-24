---
phase: 12
title: Compliance Check (canonical 9 headings)
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 12: Compliance Check — SA key 失効監視

[実装区分: 実装仕様書]

## 1. 中学生向け解説

GoogleスプレッドシートをアプリAPIが読みに行くとき、Google にログインするための「鍵」（サービスアカウントの秘密鍵）を使っています。この鍵が**壊れたり、Googleに取り消されたりすると、アプリは何もエラーを表示せずに静かに動かなくなる**ことがあります。家の鍵に例えると、知らないうちに鍵屋さんが鍵を作り直していて、玄関を開けようとして「あれ？開かない」となったときに、家族の誰も気づかない状態です。

この仕組みは、**鍵が無効になった瞬間にすぐ気づくための「警報装置」**です。

- アプリがGoogleにアクセスして「鍵が違います（401）」「権限がありません（403）」と返されたら、その情報を**特別な目印（error code）付きで記録**します
- さらに **15分に1回、わざと簡単なリクエストを送って鍵が生きているか確かめます**（既存の警報タイマーに相乗りするので、タイマーは増やしません）
- 異常を見つけたら Slack やメールで管理者に通知し、対処マニュアル（rollback-runbook）の場所も一緒に教えます
- ただし、Google のサーバーが一時的に重い（500番台）だけのときは警報を鳴らさないように工夫します（誤報を出さないため）

## 2. 不変条件遵守

- [x] Cloudflare free plan の cron 3 本上限を侵犯しない（既存 `*/15` に相乗り）
- [x] 401 と 403 を error code レベルで区別
- [x] 既存 throw 経路を破壊しない（catch → log → rethrow）
- [x] D1 直接アクセスは `apps/api` 内に閉じる
- [x] 新規 test ファイルは `*.spec.ts` のみ
- [x] Cloudflare CLI は `scripts/cf.sh` 経由のみ
- [x] PR base = `dev`

## 3. CLAUDE.md unbreakable 確認

| 項目 | 状態 |
| --- | --- |
| 出力言語: 日本語 | OK |
| `process.env.*` 直接参照禁止（apps/web） | 本タスクは apps/api のみで該当なし |
| `wrangler` 直接実行禁止 | Phase 10 で `scripts/cf.sh` 経由のみ明記 |
| `.env` 実値非コミット | Phase 11 §4 で明記 |
| `*.test.ts` 禁止 | Phase 6 §8 で明記 |
| 既定 PR base = dev | Phase 13 で明記 |

## 4. canonical compliance output

CI canonical 9 headings の正本は
`outputs/phase-12/phase12-task-spec-compliance-check.md` に配置する。
本 flat Phase 12 は説明用サマリであり、Gate-C / validator / evidence
inventory は output 側の canonical file を参照する。

## 5. ユビキタス言語整合

| 用語 | 意味 | 適用箇所 |
| --- | --- | --- |
| Sheets 認証失敗 (`sheets.auth.failure`) | Sheets API が 401/403 を返した状態 | classifier / logger / event 名 |
| key invalid (`SHEETS_AUTH_401_KEY_INVALID`) | private_key 破損 / 失効 | error code |
| forbidden (`SHEETS_AUTH_403_FORBIDDEN`) | スコープ剥奪 / SA disabled | error code |
| sheets-auth-healthcheck | 能動検出 cron 相乗りジョブ | scheduled module |
| rollback runbook | UT-25 phase-13 の復旧手順 | alert payload field |

## 6. Continuous Delivery 適合

- 全変更が CI gate（typecheck / lint / vitest / verify-phase12-compliance / gate-metadata:validate）でブロック
- staging deploy → 24h 観測 → production deploy のフェーズゲートを Phase 10 §5 で明示
- 新規 cron 追加なしで deploy 影響範囲を最小化

## 7. SRP 適合

- classifier: 分類のみ
- logger: 出力のみ
- healthcheck: 能動検出のみ
- alert-relay: 通知のみ（既存）
- sync ジョブ injection: 既存 throw 経路を維持しつつ log を挿入するのみ

## 8. DDD 整合

- 「Sheets 認証ドメイン」を独立した module 群（`jobs/sheets-auth-*`、`scheduled/sheets-auth-*`）として閉じる
- 既存 sync ジョブ（同期ドメイン）と alert-relay（通知ドメイン）は本ドメインに依存するが逆向き依存はない

## 9. 受け入れ条件チェック

Phase 8 DoD の全項目を本 PR で満たすことを確認。
未充足項目がある場合は Gate-C を passed にしない。
