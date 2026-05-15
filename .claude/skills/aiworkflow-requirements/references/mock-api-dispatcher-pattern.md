# Mock API Dispatcher Pattern — `scripts/e2e-mock-api.mjs`

> 起点 workflow: `docs/30-workflows/completed-tasks/issue-667-stage3b-mock-api-fixture-coverage/`
> 関連: `[[contracts-package-ssot]]` `[[quality-e2e-testing]]` `[[testing-playwright-e2e]]`

## 責務

playwright E2E から叩く mock API runtime の **dispatcher 順序 / response parse 規約 / 例外境界 / 回帰検出経路** を SSOT として記述する。実装は `scripts/e2e-mock-api.mjs`。

## `safeJson(res, status, body, schema)` ラッパー規約

業務 endpoint の response は **必ず** 本ラッパー経由で返す。

```
safeJson(res, status, body, schema)
  ├─ schema.parse(body)
  │    ├─ success → res.writeHead(status, json) + res.end(JSON.stringify(body))
  │    └─ failure → res.writeHead(500, json) + res.end({ zodIssues: <issues> })
```

- `schema` は `@ubm-hyogo/contracts` の named export を渡す（`[[contracts-package-ssot]]`）。
- fail-fast: parse 失敗時に 200 を返さない。**200 fallthrough `{ ok: true }` は廃止**。
- 500 + `zodIssues` を返すことで mock の drift を E2E ログ / contract spec の両側から検出可能にする。

## Dispatcher 順序ルール

URL マッチは **以下の固定順** で行う。新規 endpoint を挿入する際は本順序を破壊しないこと。

1. **exact-match**: 完全一致 path（例: `/me`, `/public/members`, `/health`）
2. **regex**: 動的 segment を含む path（例: `/admin/identity-conflicts/:id/merge` `/admin/identity-conflicts/:id/dismiss` `/public/members/:id`）
3. **startsWith**: prefix マッチで残りを処理する path（例: `/admin/...` 系 fallback、`/__test__/...` control）

理由: regex が startsWith より後に評価されると `/admin/identity-conflicts/abc/merge` が `/admin/` startsWith に吸われて誤 200 を返す。逆に exact-match が regex より後だと `/public/members` が `/public/members/:id` regex に吸われ得る。

## Parse 例外境界

`safeJson` を通さず素の JSON を返してよい endpoint は **以下 2 系統のみ**:

| path | 用途 |
|------|------|
| `/health` | playwright readiness wait（30s curl loop の対象） |
| `/__test__/*` | E2E 用 control endpoint（seed リセット等） |

これらは playwright 起動制御に関わるため schema parse 対象外とする。業務 endpoint は **例外なく** `safeJson` 経由。

## 回帰検出経路

| 経路 | 検出対象 | 場所 |
|------|---------|------|
| `scripts/__tests__/e2e-mock-api.contract.spec.ts` (28 tests) | response shape の drift | vitest |
| dispatcher 順序 grep gate | exact-match / regex / startsWith の挿入順崩れ | `docs/30-workflows/completed-tasks/issue-667-stage3b-mock-api-fixture-coverage/outputs/phase-11/evidence/dispatcher-grep.txt` |
| `.github/workflows/e2e-tests.yml` mock API log artifact | runtime parse 失敗時の 500 ログ | retention 7d |

## CI / runtime 統合

- `.github/workflows/ci.yml` に `Mock API contract tests` step（contract spec を独立に run）
- `.github/workflows/e2e-tests.yml` に curl readiness wait（最大 30s）+ mock API stdout/stderr log artifact（retention 7d）

## 関連 lookup

- `[[contracts-package-ssot]]` — `safeJson` に渡す schema の正本
- `[[quality-e2e-testing]]` — E2E quality uplift 全体方針
- `[[testing-playwright-e2e]]` — playwright spec 側の fixture 参照規約
- `[[workflow-issue-667-stage3b-mock-api-fixture-coverage-artifact-inventory]]` — 本 pattern 導入 wave の inventory
