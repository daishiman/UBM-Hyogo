# Phase 9 成果物: AC-1〜AC-10 検証結果テンプレート

本ファイルは Phase 9 実行時に実測値を書き込むテンプレート。
全 AC について「期待」と「実測」を並べ、PASS / FAIL を判定する。

---

## 実行サマリ

| 項目 | 値 |
| --- | --- |
| 実施日 | 2026-05-16 |
| 担当 | delivery |
| ブランチ | current worktree |
| HEAD | 未コミット（user-gated） |
| typecheck | PASS (`mise exec -- pnpm typecheck`) |
| lint | PASS (`mise exec -- pnpm lint`) |
| test | PASS (`mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`; API 全体 48 files / 290 tests) |
| AC 全体判定 | PASS |

---

## AC 突合表

| AC ID | 検証手順（phase-09.md 9-3 参照） | 期待 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | grep `const isolateId = crypto.randomUUID()` | hit 1 行 / handler 関数より前の行 | `alert-relay.ts:17` | [x] |
| AC-2 | grep `async function logKvOperationError(` / export 文 / 外部 import | def 1 / export 0 / 外部 import 0 | def 1、外部 import 0 | [x] |
| AC-3 | grep `"alert_relay_kv_op_failed"` / 6 field / `console.warn(JSON.stringify(` + vitest payload assertion | literal 1 / 6 field hit / vitest PASS | helper + tests + runbook で hit、Vitest PASS | [x] |
| AC-4 | vitest hash 再現性ケース PASS + 12 hex 正規表現 assertion | hash 再現 PASS / 12 hex match PASS | get/put throw tests で `/^[0-9a-f]{12}$/` assertion PASS | [x] |
| AC-5 | grep `KV.get` 周辺 try/catch + catch 内 `logKvOperationError('get', ...)` | try/catch あり + helper 呼出 + fail-open 継続 | `alert-relay.ts:97-102` | [x] |
| AC-6 | grep `KV.put` catch + `dedupPersisted` 不変 | put catch 内 helper 呼出 + dedupPersisted: false 維持 | `alert-relay.ts:130-135` | [x] |
| AC-7 | vitest で 4 ケース PASS + `afterEach(vi.restoreAllMocks)` | 4 ケース PASS / mock restore 設定済 | `alert-relay.spec.ts` 23 tests PASS、API 全体 290 tests PASS | [x] |
| AC-8 | runbook grep（セクション + grep 例 + しきい値 + 6 field） | 全て hit | runbook Step 4c に schema 表 + 10 件しきい値 + grep 例 | [x] |
| AC-9 | typecheck / lint / test 各コマンド | 全 exit 0 | typecheck/lint/API test exit 0 | [x] |
| AC-10 | 既存テスト全 PASS + `dedupPersisted` フィールド不変 | regression 0 件 | API 全体 48 files / 290 tests PASS、`dedupPersisted: false` 維持 | [x] |

---

## AC 別 evidence ファイル一覧

| AC ID | evidence ファイル |
| --- | --- |
| AC-1 | `outputs/phase-09/ac-01-isolate-id.txt` |
| AC-2 | `outputs/phase-09/ac-02-helper-def.txt` / `ac-02-no-export.txt` / `ac-02-no-external-import.txt` |
| AC-3 | `outputs/phase-09/ac-03-schema-fields.txt` |
| AC-4 | `outputs/phase-09/ac-04-hash-test.txt` |
| AC-5 | `outputs/phase-09/ac-05-get-trycatch.txt` |
| AC-6 | `outputs/phase-09/ac-06-put-catch.txt` |
| AC-7 | `outputs/phase-09/ac-07-spec-run.txt` / `ac-07-test-names.txt` |
| AC-8 | `outputs/phase-09/ac-08-runbook-section.txt` / `ac-08-schema-fields.txt` |
| AC-9 | `outputs/phase-09/ac-09-typecheck.log` / `ac-09-lint.log` / `ac-09-test.log` |
| AC-10 | `outputs/phase-09/ac-10-regression.log` / `ac-10-dedup-persisted.txt` |

---

## FAIL 時の差し戻し先

| FAIL の AC | 差し戻し先 Phase |
| --- | --- |
| AC-1 / AC-2 / AC-3 / AC-5 / AC-6 / AC-10 | Phase 6（実装） |
| AC-4 / AC-7 | Phase 7（テスト計画 → 実装の vitest 追加） |
| AC-8 | Phase 8（ドキュメント更新） |
| AC-9 | typecheck / lint は Phase 6 / test は Phase 7 |

---

## 実測値記入欄

### AC-1〜AC-10: 実測サマリ

```
apps/api/src/routes/internal/alert-relay.ts:17:const isolateId = crypto.randomUUID();
apps/api/src/routes/internal/alert-relay.ts:49:async function logKvOperationError(
apps/api/src/routes/internal/alert-relay.ts:56:    event: "alert_relay_kv_op_failed" as const,
apps/api/src/routes/internal/alert-relay.ts:63:  console.warn(JSON.stringify(payload));
apps/api/src/routes/internal/alert-relay.ts:100:      await logKvOperationError("get", error, dedupeKey);
apps/api/src/routes/internal/alert-relay.ts:134:      await logKvOperationError("put", error, dedupeKey);
apps/api/src/routes/internal/alert-relay.ts:135:      return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
```

判定: [x] PASS / [ ] FAIL

```
mise exec -- pnpm typecheck: exit 0
mise exec -- pnpm lint: exit 0
mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/internal/__tests__/alert-relay.spec.ts:
  Test Files 48 passed (48)
  Tests 290 passed (290)
```

判定: [x] PASS / [ ] FAIL

---

## 総合判定

- [x] AC-1〜AC-10 全 PASS → Phase 10 へ進む
- [ ] いずれか FAIL → 上記差し戻し表に従い該当 Phase へ戻す

備考:
_FAIL があった場合の原因・対応をここに記録_
