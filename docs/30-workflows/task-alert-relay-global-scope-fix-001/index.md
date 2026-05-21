# task-alert-relay-global-scope-fix-001

[実装区分: 実装仕様書]

## 概要

`apps/api/src/routes/internal/alert-relay.ts:17` の module top-level で `crypto.randomUUID()` を呼んでいるため、Cloudflare Workers の validation error 10021 (Disallowed operation called within global scope) で staging deploy が reject されている。`isolateId` を lazy 初期化に変更し、global scope の乱数生成を排除する。

- **対象 PR**: #505 (backend-ci deploy-staging job failure)
- **ブロッカー**: staging deploy 不可、production deploy も同条件で fail する
- **スコープ**: 単一ファイル修正 + 既存 vitest spec 更新 + global scope guard regression test 追加
- **taskType**: `implementation`
- **visualEvidence**: `NON_VISUAL` (UI/UX 変更なし)
- **workflow_state**: `implemented_local_evidence_captured` (staging deploy validation / commit / push / PR は user-gated)
- **implementation_mode**: `existing-worker-route-hardening`（既存 route の deploy blocker 修正）

## 正本順位

1. Cloudflare Workers docs: https://developers.cloudflare.com/workers/runtime-apis/handlers/
2. validation-error 10021: https://developers.cloudflare.com/workers/observability/errors/#validation-errors-10021
3. `apps/api/src/routes/internal/alert-relay.ts` (現状)
4. `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` (既存契約)

## Phase 一覧

| Phase | 名称           | 状態          | 成果物                                 |
| ----- | -------------- | ------------- | -------------------------------------- |
| 1     | 要件定義       | spec_created  | outputs/phase-1/phase-1.md             |
| 2     | 設計           | spec_created  | outputs/phase-2/phase-2.md             |
| 3     | 設計レビュー   | spec_created  | outputs/phase-3/phase-3.md             |
| 4     | テスト設計     | spec_created  | outputs/phase-4/phase-4.md             |
| 5     | 実装仕様       | spec_created  | outputs/phase-5/phase-5.md (**正本**)  |
| 6     | 実装           | completed      | `apps/api/src/routes/internal/alert-relay.ts` |
| 7     | テスト実装     | completed      | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` |
| 8     | リファクタ     | completed      | 最小差分のため追加リファクタなし |
| 9     | QA             | completed      | `outputs/phase-11/evidence/alert-relay-vitest.log` / `grep-gate.log` |
| 10    | 最終レビュー   | completed      | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 11    | NON_VISUAL 証跡 | runtime_pending | local test / grep / dry-run evidence。staging deploy job は user-gated |
| 12    | 仕様同期       | completed      | `outputs/phase-12/` strict 7 + aiworkflow sync |
| 13    | PR             | pending        | commit / push / PR はユーザー承認後 |

## 不変条件

1. 既存 D1 schema / API endpoint surface に変更を加えない
2. KV dedup の挙動 (ut-17-followup-002) を変更しない
3. log payload の `isolateId` フィールド契約 (string, UUID 形式) を維持する
4. 単一 PR / 1 実装サイクルで完了する (CONST_007)
5. `apps/api` の wrangler.toml / Bindings / Environment Variables を変更しない
