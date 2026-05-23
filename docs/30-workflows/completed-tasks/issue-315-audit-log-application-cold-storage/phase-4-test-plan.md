# Phase 4: テスト計画（テストファースト）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 4 / 13 |
| 目的 | `*.spec.ts` テストを Phase 5 実装前に列挙する。AC-1..AC-9 を verifiable に対応付ける |
| 依存 | Phase 3 GO |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## テストファイル一覧（`*.spec.ts` のみ。`*.test.ts` 禁止）

| ファイル | 種別 | 対応 AC |
|----------|------|---------|
| `apps/api/src/lib/audit/__tests__/redact.spec.ts` | unit | AC-3, AC-7 |
| `apps/api/src/repository/__tests__/auditLog-export.spec.ts` | integration (Miniflare D1) | AC-1, AC-2, AC-5 |
| `scripts/audit-log/__tests__/export-to-r2.spec.ts` | integration (mocked R2 binding) | AC-1, AC-2, AC-3, AC-6 |
| `scripts/audit-log/__tests__/redact-grep-gate.spec.ts` | grep gate (no raw email/phone in output paths) | AC-7 |

## テストケース詳細

### `redact.spec.ts`

| ID | ケース | 期待 |
|----|--------|------|
| TC-RED-01 | `redactString("contact me at manju@example.com")` | `"contact me at [REDACTED:email]"` |
| TC-RED-02 | 電話番号 `090-1234-5678` を含む文字列 | `[REDACTED:phone]` に置換 |
| TC-RED-03 | `redactAuditPayload({ email: "x@y.z", name: "山田" })` | `{ email: { redacted: true, kind: "email" }, name: "山田" }` |
| TC-RED-04 | `redactForExport({ beforeJson: '{"email":"a@b.c"}', afterJson: null, actorEmail: "a@b.c" })` | beforeJson に raw email を含まない、actorEmailMasked = `[REDACTED:actor_email]` |
| TC-RED-05 | null / 空文字入力で throw しない | graceful pass-through |
| TC-RED-06 | `REDACTION_POLICY_VERSION === "v1"` | 定数固定値 |
| TC-RED-07 | 連続適用 idempotent (`redactString(redactString(x)) === redactString(x)`) | 真 |

### `auditLog-export.spec.ts`

| ID | ケース | 期待 |
|----|--------|------|
| TC-REP-01 | `listForExport({ fromUtc, toUtcExclusive, limit })` で該当範囲のみ返却 | 範囲外 row 不含 |
| TC-REP-02 | `insertExportManifest` で `status='pending'` row 作成、`UNIQUE(yyyy,mm,dd)` 違反時 throw | 期待 throw |
| TC-REP-03 | `completeExportManifest(id, { r2Etag, completedAt })` で `status='completed'` 遷移 | 遷移確認 |
| TC-REP-04 | `failExportManifest(id, { errorMessage, completedAt })` で `status='failed'` + error_message 記録 | 記録確認 |
| TC-REP-05 | `purgeExportedOlderThan(thresholdUtc)` で manifest completed 被覆範囲のみ DELETE | 未 export 行は残存 |
| TC-REP-06 | `purgeExportedOlderThan` を `status='failed'` 日付に対して呼ぶ → 0 件 DELETE | 安全装置確認 |
| TC-REP-07 | append-only invariant: UPDATE/DELETE export from this module 以外なし | 型レベル `// @ts-expect-error` |

### `export-to-r2.spec.ts`（mocked R2 binding）

| ID | ケース | 期待 |
|----|--------|------|
| TC-EXP-01 | dry-run mode で R2 PUT が呼ばれない、manifest 未挿入 | mock R2 put 呼出 0 |
| TC-EXP-02 | 正常 path: D1 SELECT → redact → gzip → R2 PUT → manifest completed | 全 stage 通過 |
| TC-EXP-03 | R2 PUT 失敗時に manifest failed + process exit 1 | exit code 1 |
| TC-EXP-04 | 同日 2 回目実行で `(yyyy,mm,dd)` UNIQUE により idempotent skip | 2 回目で skip 判定 |
| TC-EXP-05 | export 出力 JSONL に raw email/phone が含まれない | grep gate `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}` で 0 hit |
| TC-EXP-06 | object_key 形式 `application/yyyy=YYYY/mm=MM/dd=DD/audit-log-<runId>.jsonl.gz` | regex 一致 |
| TC-EXP-07 | sha256 が D1 manifest と R2 object metadata で一致 | 一致 |
| TC-EXP-08 | row_count=0 でも manifest は completed で挿入（empty day 記録） | 挿入確認 |

### `redact-grep-gate.spec.ts`

| ID | ケース | 期待 |
|----|--------|------|
| TC-GREP-01 | export script 配下 stdout / file output に raw email pattern が出現しない | rg exit code 1 (no match) |
| TC-GREP-02 | export script 配下 stdout / file output に raw phone pattern が出現しない | rg exit code 1 (no match) |

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/lib/audit/__tests__/redact.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/repository/__tests__/auditLog-export.spec.ts
mise exec -- pnpm test scripts/audit-log/__tests__/export-to-r2.spec.ts
mise exec -- pnpm test scripts/audit-log/__tests__/redact-grep-gate.spec.ts
```

## 成果物

- `outputs/phase-4/test-cases.md`（TC-RED / TC-REP / TC-EXP / TC-GREP 全件 + AC traceability）
- `outputs/phase-4/test-execution-plan.md`（実行順 / Miniflare D1 fixture / mock R2 構成）

## 完了条件

- [ ] 4 テストファイルと TC 一覧が全件記述されている
- [ ] AC-1..AC-9 すべてに最低 1 テスト対応
- [ ] `*.test.ts` 拡張子のテストファイルが存在しない（block-test-suffix gate 通過）
- [ ] grep gate に raw PII 0 件確認手順がある

## 参照資料

- Phase 2 全成果物
- `scripts/cf-audit-log/__tests__/export-to-r2.spec.ts`（fixture 構造参考）
