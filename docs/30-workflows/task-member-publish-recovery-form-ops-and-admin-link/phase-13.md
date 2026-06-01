# Phase 13: PR 作成（設計書 / user-gated）

本 workflow は `implemented_local_evidence_captured`。以下はすべてユーザー明示指示まで実行しない（CONST_002）:

- production `MEMBERS_AUTO_PUBLISH_ON_CONSENT` flag 切替
- `SYNC_ADMIN_TOKEN` の Cloudflare Secrets 注入（Task A/B 認証経路）
- staging / production deploy
- runtime screenshot 取得（Phase 11）
- commit / push / PR 作成

## 残る承認ゲート

1. staging / production secret・flag 操作を行う
2. deploy 後に authenticated runtime screenshot を取得する
3. commit / push / PR（base=dev）を作成する
