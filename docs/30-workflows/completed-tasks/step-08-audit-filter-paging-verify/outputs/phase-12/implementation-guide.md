# Implementation Guide: step-08 Audit Filter/Paging Verify

## Part 1: 中学生レベル概念説明

このタスクは、新しい機能を作る仕事ではなく、すでにある監査ログ画面が壊れていないかを確かめるための仕様書です。

監査ログ画面は「だれが、いつ、何をしたか」を管理者が確認する画面です。検索条件でしぼり込み、次のページへ進み、メールアドレスなどの個人情報がそのまま見えないようにします。

今回の一番大事な約束は、アプリのコードを変えずに、既存テストと証跡で「今の実装で十分」という監査結論を守れる状態にすることです。

たとえば、家の鍵が今日もちゃんと閉まるかを毎朝確認する点検を思い浮かべてください。新しい鍵を取り付ける（＝コードを書き換える）のではなく、「今ある鍵がちゃんと閉まること」を毎回確かめて記録に残す作業です。このタスクも同じで、監査ログ画面という「今ある鍵」が壊れていないことを、テストという点検手順で確認し、その結果を証跡として残します。さらに、確認のやり方を自動の見張り（CI）に登録しておくことで、将来だれかがうっかり鍵を壊しても、すぐ気づける状態にします。

| 用語 | 意味 |
| --- | --- |
| verify_existing | 既存実装を検証するだけで、新規実装しない進め方 |
| NON_VISUAL | 画面の見た目を新しく撮影・変更しない分類 |
| strict 7 | Phase 12で必ず置く7つの成果物 |
| PII masking | 個人情報をそのまま見せないように隠す処理 |

## Part 2: 技術ドキュメント

### 背景

元spec `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-08-audit-filter-paging/spec.md` は、`/admin/audit` のfilter、cursor paging、PII maskingを「改善不要」と判定している。

本workflowはその判断をPhase 1-13仕様に昇格し、回帰検証コマンド、FR-to-test coverage map、diffゼロ証跡を固定する。

### 実装方針

- `apps/` と `packages/` は変更しない。
- `taskType` は `implementation`、`visualEvidence` は `NON_VISUAL` として扱う。
- Phase 11実行証跡は `outputs/phase-11/manual-test-result.md` に集約する。
- Phase 12 strict 7とaiworkflow正本同期は本waveで完了する。

### 検証対象（current contract / phase-1 §2-1 inventory）

| 区分 | パス |
|------|------|
| Web route | `apps/web/app/(admin)/admin/audit/page.tsx` |
| Web util | `apps/web/app/(admin)/admin/audit/audit-query.ts` |
| Web loading | `apps/web/app/(admin)/admin/audit/loading.tsx` |
| Web component | `apps/web/src/components/admin/AuditLogPanel.tsx` |
| API route | `apps/api/src/routes/admin/audit.ts` |
| API repo / redact | `apps/api/src/repository/auditLog.ts` / `apps/api/src/lib/audit/redact.ts` |

`target delta` は no-op。Before/After は同一であり `After = same / no-op`（差分を捏造しない）。

### 既存テスト（回帰の正本 / phase-1 §2-2）

| テスト | パス | 行 |
|--------|------|----|
| Web component | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 423 |
| Web page | `apps/web/app/(admin)/admin/audit/page.page.spec.ts` | 14 |
| API contract | `apps/api/src/routes/admin/audit.contract.spec.ts` | 303 |
| E2E | `apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts` | 151 |

### FR↔テスト coverage map（phase-9 §1 参照）

| FR | 要件（既存挙動の継続保証） | 担保テスト | 判定 |
|----|---------------------------|-----------|------|
| FR-1 | filter form 7 項目 `defaultValue` 反映 + GET URL 同期 | `AuditLogPanel.component.spec.tsx` | full |
| FR-2 | cursor paging（`buildAuditHref` filter 保持 / `nextCursor=null` 表示） | `AuditLogPanel.component.spec.tsx` / `audit.contract.spec.ts` | full |
| FR-3 | PII masking（`maskAuditJson` 再帰マスク二段防御） | `AuditLogPanel.component.spec.tsx` / `audit.contract.spec.ts` | full |
| FR-4 | API query validation（不正入力 400 / `AdminAuditListResponseZ` 準拠） | `audit.contract.spec.ts` | full |
| FR-5 | JST 変換（`jstLocalToUtcIso` start / end-exclusive） | `AuditLogPanel.component.spec.tsx` / `audit.contract.spec.ts` | full |
| FR-6 | 認可（`requireAdmin` 経由のみ・read-only） | `audit.contract.spec.ts` | full |

FR-1〜FR-6 は全て full（partial / 未カバーの監査主張なし）。詳細担保ケースは `phase-9-qa.md` §1 を正本とする。

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/admin/__tests__/AuditLogPanel.component.spec.tsx 'app/(admin)/admin/audit/page.page.spec.ts'
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/routes/admin/audit.contract.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
git status --short -- apps packages
git diff -- apps packages
```

### 視覚証跡

UI/UX変更なしのため Phase 11 スクリーンショット不要

`visualEvidence=NON_VISUAL`。既存 visual baseline（`admin-audit-{desktop,tablet,mobile}` snapshot）を流用し、新規撮影・差分は発生しない。

### 既知制限

実テスト実行は Phase 11 の verification lane で完了済み。commit、push、PR作成はユーザー明示承認まで行わない。

CSV export、Saved filters、Real-time updateは元specがcore外bonusとして扱っており、本検証workflowの欠落ではない。今回のCONST_005に従い、新規バックログ化ではなく「別スコープ」として明示する。
