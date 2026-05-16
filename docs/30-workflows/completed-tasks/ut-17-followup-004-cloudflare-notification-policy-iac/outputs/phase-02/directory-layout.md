# Phase 2 成果物: ディレクトリ構成

```
infra/cloudflare-alerts/
├── README.md
├── quota-base.json
├── policies/
│   ├── workers-requests.json
│   ├── d1-read-queries.json
│   ├── d1-write-queries.json
│   ├── pages-build.json
│   └── r2-class-a.json
├── webhooks/
│   └── ut-17-relay.json
├── schema/
│   ├── policy.schema.json
│   ├── webhook.schema.json
│   └── quota-base.schema.json
└── lib/
    ├── types.ts
    ├── canonicalize.ts
    ├── diff.ts
    ├── resolve.ts
    ├── quota-base.ts
    ├── load.ts
    ├── api-client.ts
    ├── cli.ts
    └── __tests__/
        ├── canonicalize.test.ts
        ├── diff.test.ts
        ├── resolve.test.ts
        ├── quota-base.test.ts
        └── load.test.ts

scripts/__tests__/cf-alerts-cli.test.ts   # vitest + child_process で cf.sh alerts 統合テスト
tests/fixtures/cloudflare-alerts/         # API mock fixture
.github/workflows/cloudflare-alerts-drift.yml
```

note: 当初仕様 `infra/cloudflare-alerts/lib/{apply.sh,diff.sh,list.sh,normalize.mjs,resolve-destination-id.mjs}` は
TypeScript ベースで `infra/cloudflare-alerts/lib/` に集約 (シェルから tsx で exec)。
bash + mjs 分離より、純関数の単体テストが組みやすく型安全。
