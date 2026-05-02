# タスク仕様書 検証レポート

> 検証日時: 2026-05-02T12:12:02.514Z
> 対象: docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook

## サマリー

| 項目 | 値 |
|------|-----|
| 総Phase数 | 13 |
| 検証済みPhase | 13 |
| エラー | 0 |
| 警告 | 21 |
| 情報 | 21 |
| **結果** | **✅ PASS** |

## Phase別検証結果

### Phase 1: 要件定義 ✅

- ℹ️ [consistency] 参照パス「unassigned-task-detection.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「unassigned-task-detection.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「task-ut-07b-fu-04-production-migration-apply-execution.md」の存在を確認してください

### Phase 2: 設計 ✅

- ℹ️ [consistency] 参照パス「rg -n "CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID" outputs/phase-11/」の存在を確認してください

### Phase 3: 設計レビューゲート ✅

- ℹ️ [consistency] 参照パス「unassigned-task-detection.md」の存在を確認してください

### Phase 4: テスト作成 ✅

- ℹ️ [consistency] 参照パス「grep -E '^## (Overview\|承認ゲート\|Preflight\|Apply\|Post-check\|Evidence\|Failure handling\|Smoke 制限)' outputs/phase-05/main.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「grep -n 'apps/api/migrations/0008_schema_alias_hardening\.sql' outputs/phase-05/main.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「grep -nE 'ubm-hyogo-db-prod' outputs/phase-05/main.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「grep -nE -- '--env production' outputs/phase-05/main.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「grep -nE '(schema_aliases\|idx_schema_aliases_revision_stablekey_unique\|idx_schema_aliases_revision_question_unique\|backfill_cursor\|backfill_status)' outputs/phase-05/main.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「grep -nE '^[^#]*\bwrangler\b' outputs/phase-05/main.md \| grep -v 'scripts/cf.sh'」の存在を確認してください
- ℹ️ [consistency] 参照パス「grep -nE '(commit \\\| PR \\\| merge\|ユーザー承認\|本タスクでは実行しない)' outputs/phase-05/main.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「grep -nE '(destructive な apply smoke\|別承認)' outputs/phase-05/main.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「grep -nE '(apps/api/migrations\|D1 への直接アクセス)' outputs/phase-05/main.md」の存在を確認してください

### Phase 5: 実装 ⚠️

- ⚠️ [quality] 曖昧表現「必要なら」が1箇所で使用されています

### Phase 6: テスト拡充 ✅

- ℹ️ [consistency] 参照パス「grep -rEn '[A-Za-z0-9_-]{40,}' outputs/」の存在を確認してください
- ℹ️ [consistency] 参照パス「grep -rEn '[a-f0-9]{32}' outputs/」の存在を確認してください

### Phase 7: テストカバレッジ確認 ✅

問題なし

### Phase 8: リファクタリング ⚠️

- ⚠️ [consistency] 依存するPhase 2の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 7の成果物が文書内で参照されていない可能性があります

### Phase 9: 品質保証 ✅

- ℹ️ [consistency] 参照パス「ls outputs/phase-*/main.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「grep -RE "[A-Za-z0-9_-]{30,}" outputs/phase-11/」の存在を確認してください

### Phase 10: 最終レビューゲート ✅

問題なし

### Phase 11: 手動テスト検証 ⚠️

- ⚠️ [consistency] 依存するPhase 2の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 8の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 9の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 10の成果物が文書内で参照されていない可能性があります

### Phase 12: ドキュメント更新 ⚠️

- ⚠️ [consistency] 依存するPhase 2の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 5の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 6の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 7の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 8の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 9の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 10の成果物が文書内で参照されていない可能性があります
- ℹ️ [consistency] 参照パス「unassigned-task-detection.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「unassigned-task-detection.md」の存在を確認してください

### Phase 13: PR作成 ⚠️

- ⚠️ [consistency] 依存するPhase 2の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 5の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 6の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 7の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 8の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 9の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 10の成果物が文書内で参照されていない可能性があります
- ℹ️ [consistency] 参照パス「unassigned-task-detection.md」の存在を確認してください
