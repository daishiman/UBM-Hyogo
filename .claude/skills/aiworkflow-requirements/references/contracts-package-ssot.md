# Contracts Package SSOT — `@ubm-hyogo/contracts`

> 起点 workflow: `docs/30-workflows/completed-tasks/issue-667-stage3b-mock-api-fixture-coverage/`
> 関連: `[[mock-api-dispatcher-pattern]]` `[[testing-fixtures]]` `[[quality-e2e-testing]]`

## 責務

mock API runtime / `apps/api` / `apps/web` / playwright tests が共通参照する **response schema と E2E fixture seed の単一正本**。同型性は zod schema の `parse()` で機械検証する。

## 配置

```
packages/contracts/
├── package.json            # name: "@ubm-hyogo/contracts", type: "module", main/exports は .mjs
└── src/
    ├── index.mjs           # barrel re-export entry
    ├── me.mjs              # /me 系 response schema
    ├── public.mjs          # public (members, zones, search facets) response schema
    ├── admin.mjs           # admin route response schema
    ├── identity-conflicts.mjs  # admin identity-conflicts merge/dismiss schema
    └── fixtures.mjs        # E2E seed (named export)
```

## 採用ルール (Phase 1 確定)

| 項目 | 採用値 | 理由 |
|------|-------|------|
| 依存 | **zod のみ** | mock runtime (`.mjs` 直接 node 実行) からも import 可能にするため |
| モジュール形式 | **plain ESM `.mjs`** | tsup build 不要・Node 24 直接 import・watch 不要 |
| export 形 | **barrel 経由 + named export** | consumer 側で tree-shake 可能・schema 一覧性を index.mjs に集約 |
| 型定義 | zod の `z.infer<typeof X>` で派生 | `.d.ts` 別管理を避ける |

## 消費者

| consumer | 用途 |
|----------|------|
| `scripts/e2e-mock-api.mjs` | 全業務 endpoint response を `safeJson(..., schema)` で強制 parse |
| `scripts/__tests__/e2e-mock-api.contract.spec.ts` | mock response が schema に適合することを vitest で機械検証 |
| `apps/api/src/**` | route response を `satisfies z.infer<typeof X>` で型固定 |
| `apps/web/src/**` | server-fetch / SSR fixture が同 schema を parse |
| `apps/web/playwright/tests/**` | E2E spec が `fixtures.mjs` seed を参照 |

## 循環依存禁止

- `@ubm-hyogo/contracts` は **`@ubm-hyogo/shared` に依存しない**。
- 既存 `packages/shared/src/schemas/**` の schema は段階的に contracts へ移行し、shared 側は後方互換 re-export 経路としてのみ残す。
- 移行未完了の schema は本 workflow スコープ外（別 wave で対応）。

## `fixtures.mjs` 提供 seed

E2E 既知正解として固定する seed:

| 種別 | 件数 | 内容 |
|------|-----|------|
| members | 3 | profile/list/detail 検証用 |
| zones | 2 | Kobe / Himeji |
| memberships | 2 | regular / honorary |
| negative search query | 1 | `zzz_no_match_zzz`（0 hit 経路検証） |
| tag facets | 2 | ABC法 / DEF法 |

これら seed は `scripts/e2e-mock-api.mjs` の dispatcher response と playwright spec の assertion が同じ参照を持つことを保証する。

## 検証フロー

1. mock dispatcher response を `safeJson(res, status, body, schema)` で wrap
2. `parse()` 失敗時は HTTP 500 + `{ zodIssues }` を返し fail-fast
3. `scripts/__tests__/e2e-mock-api.contract.spec.ts` (28 tests) で全 endpoint が schema 適合することを検証
4. drift 検出は最初に contract spec が落ちる設計（playwright green に依存しない）

## 関連 lookup

- `[[mock-api-dispatcher-pattern]]` — dispatcher 順序と parse 例外境界
- `[[testing-fixtures]]` — fixture 設計の共通原則
- `[[quality-e2e-testing]]` — E2E quality uplift 全体方針
- `[[workflow-issue-667-stage3b-mock-api-fixture-coverage-artifact-inventory]]` — 本 SSOT 導入 wave の inventory
