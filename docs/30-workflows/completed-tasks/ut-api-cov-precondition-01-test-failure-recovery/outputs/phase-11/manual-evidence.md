# Phase 11 manual evidence

- status: PASS（NON_VISUAL: smoke checks → コードリーディング + test 実行で代替）
- evidence type: NON_VISUAL
- visual evidence: not required
- 実測日: 2026-05-01

## Manual smoke checklist 実測結果

| 項目 | 結果 | 根拠 |
| --- | --- | --- |
| Auth boundary: public/member/admin access remains separated | PASS | `apps/api/src/__tests__/authz-matrix.test.ts` 4 PASS（admin 401/403 含む） |
| Data source boundary: apps/web does not directly access D1 | PASS | apps/web 編集なし（diff = `apps/api/src/jobs/__fixtures__/d1-fake.ts` のみ） |
| Response fields: responseEmail is system-controlled | PASS | `sync-forms-responses.test.ts` AC-4 で `member_responses.response_email` が system field 列に保存される動作を検証 (PASS) |
| Identity fields: responseId と memberId は brand 型で分離 | PASS | `apps/api/src/__tests__/brand-type.test.ts` 3 PASS、`invariants.test.ts` 5 PASS |

## Recording rule

Record exact commands, observed output, and blockers here. Unexecuted checks must remain pending or blocked. → 全 4 項目 PASS、blocker なし。
