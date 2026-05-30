# Phase 8: リファクタリング

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `server-fetch.ts` の transport 分岐 | inline if/else | 維持（共通化候補は別タスク） | `fetchPublic` 側と pattern が一致しているため抽出より対称性優先 |
| `logAdminTransport` の log 形式 | `{ transport, path, status }` (fetchPublic 同形) に `scope: "admin"` を 1 フィールド追加 | そのまま | 観測時に admin / public を区別したい |

## 共通化検討（今回は実施しない）

`fetchPublic` と `fetchAdmin` の transport selector を `lib/server-fetch/transport.ts` に抽出するアイデアはあるが、現時点では:

- public / admin で env accessor (`getPublicFetchEnv` vs `getEnv`) と header build (cookie 必須かどうか) が異なる
- 抽出して generic 化すると引数増、可読性低下

→ 共通化は将来 admin 以外にも server fetch 経路が増えた時点で検討する未タスク候補（Phase 12 で明示）。

## 削除

なし。
