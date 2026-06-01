# Phase 5: 実装 — Issue #57

> NON_VISUAL / 実装仕様書。CONST_005 必須項目を満たす。

## 1. 概要

AC-1〜AC-6 を実装する。kill-switch・env.ts 型整合・GitHub Actions env wiring・3 ドキュメント是正。

## 2. 前提条件

Phase 4 の RED 確認済。`grep -n ALERT_DEDUP_KV apps/api/src/routes/internal/alert-relay.ts` で absence guard を先に確認（AC-4 の前提）。

## 3. 変更対象ファイル一覧

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/src/env.ts` | 編集 | `ALERT_DEDUP_KV?: KVNamespace`（optional 化） |
| `apps/api/src/routes/internal/alert-relay.ts` | 編集 | KV 未設定時に Slack delivery を fail-open し、dedup のみ無効化 |
| `scripts/audit-log/export-to-r2.ts` | 編集 | `opts.paused === true` で D1 SELECT / manifest / R2 PUT を short-circuit |
| `.github/workflows/audit-log-cold-storage.yml` | 編集 | repository variable `AUDIT_COLD_STORAGE_EXPORT_PAUSED` を script env へ渡す |
| `scripts/audit-log/__tests__/export-to-r2.spec.ts` | 編集 | TC-PAUSE-01 追加 |
| `apps/api/src/routes/internal/__tests__/alert-relay*.ts` | 編集 | ALERT_DEDUP_KV 未設定 fail-open regression |
| `docs/00-getting-started-manual/specs/08-free-database.md` | 編集 | 無料枠表に KV/R2 行（確認日付き） |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 編集 | stale 記述是正 + KV/R2 limit |
| `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md` | 編集 | §2-7 数値閾値 + §4-2 executable degrade + handoff 同期 |

## 4. 主要シグネチャ・構造

### env.ts（型）

```ts
readonly ALERT_DEDUP_KV?: KVNamespace; // 型整合: wrangler.toml はコメントアウト（未活性）
readonly ALERT_DEDUP_KV?: KVNamespace; // 未活性時は alert delivery を優先し dedup を fail-open
```

### export-to-r2.ts（判定順序）

```ts
if (opts.paused === true) {
  return {
    exportRunId,
    partitionKey: partKey,
    status: "paused",
    rowCount: 0,
    uncompressedBytes: 0,
    compressedBytes: 0,
    sha256: "",
    objectKey: null,
    errorMessage: null,
  };
}
```

## 5. 入力・出力・副作用

- 入力: workflow / CLI env `AUDIT_COLD_STORAGE_EXPORT_PAUSED`（`"true"` 完全一致のみ）。
- 出力: pause 時 `ExportRunResult.status = "paused"`（R2 PUT / manifest write なし）。非 pause 時は既存挙動（R2 PUT + manifest）。
- 副作用: pause 時は D1 SELECT / R2 PUT / manifest INSERT/UPDATE を行わない（= degrade 達成）。

## 6. AC-4 の安全弁

- alert-relay.ts が `env.ALERT_DEDUP_KV` を optional guard（`if (!c.env.ALERT_DEDUP_KV) return ...` 等）していることを確認してから optional 化する。guard が無い場合は optional 化を本 PR から外し、`unassigned-task-detection.md` に follow-up として記録（ut-17-followup-002 へ統合）。

## 7. 実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run scripts/audit-log/__tests__/export-to-r2.spec.ts apps/api/src/routes/internal/__tests__/alert-relay.spec.ts apps/api/src/routes/internal/__tests__/alert-relay.sheets-auth.contract.spec.ts
```

## 8. DoD（Definition of Done）

- typecheck green / lint green。
- TC-PAUSE-01 と ALERT_DEDUP_KV optional regression が GREEN。
- 3 ドキュメントが is 是正済（grep で「R2 binding 未適用」「KV binding 未追加」の旧文言が残っていない）。
- `git status apps/` に意図した編集のみ（不要混入なし）。

## 9. 成果物

| 成果物 | パス |
| --- | --- |
| 実装サマリー | `outputs/phase-05/main.md` |

## 10. 参照資料

- `phase-02.md` / `phase-04.md`
- `apps/api/src/env.ts` / `apps/api/src/routes/internal/alert-relay.ts` / `scripts/audit-log/export-to-r2.ts` / `.github/workflows/audit-log-cold-storage.yml`


## Skill Template Compatibility


## メタ情報

workflow_id: issue-57-kv-r2-guardrail-degrade-design / phase: 5 / taskType: implementation / visualEvidence: NON_VISUAL

## 目的

KV/R2 guardrail drift と executable degrade を、実装・仕様・証跡の同一 wave で整合させる。

## 実行タスク

- 本文の「実行タスク」または該当する設計・検証セクションを参照。

## 参照資料

本文の「参照資料」セクション、index.md、outputs/artifacts.json を参照。

## 成果物/実行手順

本文の成果物表および outputs/phase-* 配下の対応成果物を参照。

## 完了条件

- [x] 本文の完了条件および artifacts.json の phase status を参照。

## 統合テスト連携

NON_VISUAL のため focused Vitest / typecheck / lint を統合証跡とし、UI screenshot は不要。
