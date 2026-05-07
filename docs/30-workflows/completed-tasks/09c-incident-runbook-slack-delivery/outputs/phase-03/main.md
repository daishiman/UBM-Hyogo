# Phase 3 サマリ — 設計レビュー

[実装区分: 実装仕様書]

## 結果

- 観点 32 項目: **PASS 28 / WARN 3 / FAIL 0**
- FAIL 0 件のため Phase 4 進行可。

## WARN（後続 Phase に引き渡し）

| WARN | 引き渡し先 | 対応 |
| --- | --- | --- |
| `WebClient` の DI 化 | Phase 4 / 6 | `webClient?: WebClient` を optional 引数に追加し、テストで stub 注入 |
| `save-slack-evidence.ts` の責務分割 | Phase 6 | 内部で `ensureDir` + `writeJson` の 2 関数に切る |
| local からの誤配信防止 | Phase 5 | `.env` に production channel id を置かない、`--mode production` を local 実行禁止と運用ルール化 |

## レビュー観点群

A. SRP / B. 依存方向 / C. テスト容易性 / D. Observability / E. Secret hygiene / F. 誤配信ガード / G. CONST 準拠 / H. 既存整合性 の 8 群。

## セキュリティ結論

- token redaction 三層（console 置換 + evidence 後段 redact + GitHub `::add-mask::`）
- bot scope は `chat:write`, `chat:write.public`, `links:read` のみ
- 誤配信ガードは構造（mode switch + `needs:` + `environment:`）と動作（unit test）の二重

## 不採用案

Cloudflare Workers Cron / Slack Incoming Webhook / Slack workflow builder / 09c workflow への直接組み込み — それぞれの理由を本 Phase に明記。

## 引き渡し

Phase 4 へ: WebClient DI 前提のテスト戦略 / 誤配信ガード unit test 必須項目 / evidence schema を expected に再利用 / permalink 失敗時 `permalink: null` exit 0 の expected。
