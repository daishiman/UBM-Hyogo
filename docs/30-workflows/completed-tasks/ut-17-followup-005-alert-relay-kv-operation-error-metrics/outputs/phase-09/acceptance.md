# Phase 9 成果物: 受入確認

## AC evidence マッピング

| AC | 内容 | evidence | 結果 |
| --- | --- | --- | --- |
| AC-1 | `KV.get` 例外時に構造化ログ 1 行 emit / fail-open 維持 | TC-LOG-01 (`alert-relay.spec.ts`) / `alert-relay.ts:103-108` | PASS |
| AC-2 | `KV.put` 例外時に構造化ログ 1 行 emit / `dedupPersisted=false` 維持 | TC-LOG-02 / `alert-relay.ts:135-142` | PASS |
| AC-3 | 固定 schema (6 field) / `JSON.stringify` 1 行 | TC-LOG-01 payload shape assertion / `log-schema.md` / runbook section 5-2 | PASS |
| AC-4 | `dedupeKeyHash` = SHA-256 先頭 12 hex / 同一 key で同 hash | TC-LOG-05 + `computeDedupeKeyHash` 実装 (`alert-relay.ts:39-45`) | PASS |
| AC-5 | `isolateId` は module top で `crypto.randomUUID()` 1 回 | TC-LOG-04 / `alert-relay.ts:17` (`const isolateId = crypto.randomUUID();`) | PASS |
| AC-6 | 成功パスで `console.warn` 0 回 | TC-LOG-03 / TC-LOG-06 / TC-LOG-07 | PASS |
| AC-7 | 既存挙動（dedup hit / Slack 502 / `dedupPersisted=false`）が不変 | 既存 ROUTE-04 / ROUTE-05 / TC-KV-01 PASS | PASS |
| AC-8 | typecheck / lint / build / test 全 PASS | Phase 11 evidence (27 alert-relay tests / API 294 tests PASS) | PASS |
| AC-9 | monthly runbook に「KV 操作エラーログ確認」セクション + grep 例 + field 表 | runbook section 5 (UT-17 alert-relay monthly healthcheck) | PASS |
| AC-10 | 新規/変更テストは `*.spec.ts` のみ | 追加先は既存 `alert-relay.spec.ts`、新規 `*.test.ts` なし | PASS |

## 不変条件 evidence

| 不変条件 | 結果 | evidence |
| --- | --- | --- |
| 1. behaviour change なし (`KV.get` fail-closed → fail-open は明示承認済) | PASS | Gate-A 承認 + emit-points.md |
| 2. `*.spec.ts` 縛り | PASS | `git diff --stat` で `*.test.ts` 追加なし |
| 3. D1 直接アクセス境界 | PASS | 本タスクで D1 binding 不使用 |
| 4. `wrangler` 直接禁止 | PASS | wrangler 操作なし |
| 5. 平文 secret 禁止 | PASS | secret 追加なし |
| 6. CONST_007 (cycle 内完了) | PASS | Phase 1〜11 + local 実装が同サイクルで完了 |
| 7. ログ schema 安定化 (additive only) | PASS | field 6 個固定、rename/削除なし |
| 8. PII non-leak | PASS | dedupeKey raw 出力なし、stack 出力なし |

## 受入コマンド実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck   # PASS
mise exec -- pnpm --filter @ubm-hyogo/api lint        # PASS
mise exec -- pnpm --filter @ubm-hyogo/api build       # PASS
ESBUILD_BINARY_PATH="$PWD/node_modules/@esbuild/darwin-arm64/bin/esbuild" mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay   # PASS (48 files / 294 tests)
```

Phase 11 evidence ファイルに転記する:

- `outputs/phase-11/evidence/typecheck.txt`
- `outputs/phase-11/evidence/lint.txt`
- `outputs/phase-11/evidence/build.txt`
- `outputs/phase-11/evidence/test.txt`
- `outputs/phase-11/evidence/grep-gate.txt`

## behaviour parity 検証

| 既存挙動 | 期待 response | 検証 |
| --- | --- | --- |
| dedup hit | `{ ok: true, deduped: true }` | TC-LOG-06 / ROUTE-04 |
| Slack 全 retry 失敗 | 502 + `{ ok: false, attempts, status, error }` | TC-LOG-07 / ROUTE-05 |
| `KV.put` throw 後 | `{ ok: true, attempts, dedupPersisted: false }` | TC-LOG-02 / TC-KV-01 |
| 正常完了 | `{ ok: true, attempts }` | TC-LOG-03 / ROUTE-base |

## Gate-B 判定

**GO**

CONDITIONAL 3 件（Phase 3 から持ち越し）はすべて実装・テスト・ドキュメントで充足:

1. AC-8 → コマンド実行 evidence で PASS
2. AC-9 → runbook section 5 追記で充足
3. behaviour change → emit-points.md と実装が完全一致

## Phase 10 への申し送り

- 全 AC PASS / 全不変条件 PASS / behaviour parity 維持
- Phase 10 リファクタでは behaviour 不変のまま型整理 / docstring 追加 / DRY 化のみ実施
