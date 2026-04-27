# 依存関係マトリクス

## モジュール間依存

|  | brand | db | sql | members | identities | status | responses | sections | fields | visibility | tags |
|--|-------|-----|-----|---------|-----------|--------|-----------|---------|--------|-----------|------|
| builder | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| members | ○ | ○ | ○ | - | - | - | - | - | - | - | - |
| identities | ○ | ○ | ○ | - | - | - | - | - | - | - | - |
| status | ○ | ○ | ○ | - | - | - | - | - | - | - | - |
| responses | ○ | ○ | ○ | - | - | - | - | - | - | - | - |
| responseSections | ○ | ○ | ○ | - | - | - | - | - | - | - | - |
| responseFields | ○ | ○ | ○ | - | - | - | - | - | - | - | - |
| fieldVisibility | ○ | ○ | ○ | - | - | - | - | - | - | - | - |
| memberTags | ○ | ○ | ○ | - | - | - | - | - | - | - | - |

## 外部パッケージ依存

| モジュール | @ubm-hyogo/shared | @cloudflare/workers-types |
|-----------|------------------|--------------------------|
| brand.ts | ○（re-export） | ✗（使わない） |
| db.ts | ✗ | ✗（独自 interface を使用） |
| 各リポジトリ | ○（型のみ） | ✗ |
| テストコード | ✗ | ✗（MockD1 を使用） |

## D1 型の扱い方針

`@cloudflare/workers-types` の `D1Database` は `apps/api/tsconfig.json` に `types` で追加されているため、
本番コードでは暗黙的に使用できる。しかしテストは vitest / jsdom 環境であり、
`D1Database` 型が存在しないためビルドエラーになる。

解決策: `_shared/db.ts` で独自の `D1Db` interface を定義し、全リポジトリはこの interface のみに依存する。
本番環境では Cloudflare D1 が構造的部分型として互換し、テストでは `MockD1` が実装する。
