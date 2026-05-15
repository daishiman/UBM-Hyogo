# Phase 3 — 設計レビュー

## 判定: PASS

Phase 4（テスト作成）へ進行。

## レビュー観点

| 観点 | 評価 |
|------|------|
| 真の論点 | isolate 跨ぎ二重通知の排除。設計は KV による外部化で直接応答。 |
| 因果ループ | in-memory dedup → isolate 切替 → 二重通知 のループを KV で遮断 |
| 責務境界 | dedup state=KV / key 構築=handler / TTL=KV `expirationTtl` / Slack=既存 sender。所有権重複なし |
| 価値とコスト | 価値: HIGH（アラート疲労低減）／ コスト: LOW（6 ファイル変更） |
| 整合性 | 親 UT-17、CLAUDE.md の `bash scripts/cf.sh` ルール、`apps/api` 責務境界と整合 |
| 運用性 | namespace 作成は ラッパー経由で再現可能。runbook に Step 4b 追記 |

## 主要リスクと緩和

| リスク | 緩和 |
|--------|------|
| KV eventual consistency による race | 同一リクエスト内 read→put 二重実行を許容（spec 明記） |
| binding 未設定で runtime 落ち | `Env` 必須プロパティで型システム検出 |
| `wrangler` 直接実行混入 | Phase 5 で `bash scripts/cf.sh` 経由を明記、Phase 9 grep gate 確認 |
| Miniflare KV stub と本番差異 | TTL 経過 / `null` 返却仕様準拠を Phase 4 で実測（TC-KV-01〜03） |

## MINOR 指摘

- namespace_id は Phase 5 で `<...>` placeholder で記述、user-gated step で実 ID に置換する運用。Phase 9 grep gate で確認。
- `Env` の `ALERT_DEDUP_KV` 必須化により `buildFormsClient(env: Env)` の contravariance が崩れるため、narrow env を導入する副次設計判断を Phase 5 で実施した。
