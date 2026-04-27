# Phase 6 — 成果サマリ (placeholder)

phase-06.md の異常系検証を実行した結果のサマリ。本ファイルは implementation taskのため placeholder。

## 網羅した異常系カテゴリ

- OAuth callback 異常（F-01〜F-05、state mismatch / redirect_uri_mismatch / code 期限切れ / cancel）
- PKCE 異常（F-06〜F-08）
- Cookie 異常（F-09〜F-12、属性 / 無効化）
- allowlist 異常（F-13〜F-16、外 / 0 件 / unverified / 大文字小文字）
- JWT 異常（F-17〜F-21、改ざん / 期限 / alg / 最小 claim）
- middleware bypass / logout（F-22〜F-27）
- Edge runtime 制限（F-28〜F-30、Node.js `crypto` / `Buffer` / D1 直接禁止）
- 運用 / concurrency（F-31〜F-35、secret / 再デプロイ / race condition）

## 仕様確定

- F-35（allowlist 削除後の取消し遅延）: MVP では JWT 24h 有効で受容、緊急時は `SESSION_SECRET` ローテーションで全 session 無効化（Phase 12 の runbook 追記）
- F-27（logout 後の古い Cookie）: server-side blacklist は MVP 外、`exp` で自然失効

## 引継ぎ

- Phase 7: AC × test ID × failure ID の対応表に流し込む
- Phase 9: lint rule（F-28〜F-30）を required-checks に
- Phase 11: F-03 / F-05 / F-12 / F-31〜F-33 を手動 smoke
