# 05a Follow-up 003: Admin Revoke Immediate Effect

## 苦戦箇所【記入必須】

05a の MVP は `isAdmin` を session JWT に含めるため、`admin_users.active` を false にしても既存 JWT の期限（24h）までは admin 操作が通る可能性がある。Phase 10/12 では既知制約 B-01 として許容したが、運用要件が厳しくなる場合は即時反映設計が必要。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 管理者剥奪後も既存 cookie で操作できる | `requireAdmin` で必要に応じて D1 `admin_users.active` を再確認する、または session version / revocation list を導入する |
| 毎リクエスト D1 lookup で無料枠・latency が悪化する | 高リスク mutation のみ再確認、TTL 短縮、KV cache などを比較する |

## 検証方法

- admin JWT 発行後に `admin_users.active=0` へ更新
- `/admin/*` read / mutation API の期待ステータスを比較
- D1 lookup 回数と latency を計測

## スコープ（含む/含まない）

含む:

- admin 剥奪即時反映方式の設計
- `requireAdmin` または session invalidation の実装
- contract test / race condition test

含まない:

- Google OAuth provider の変更
- admin CRUD UI の新規作成
