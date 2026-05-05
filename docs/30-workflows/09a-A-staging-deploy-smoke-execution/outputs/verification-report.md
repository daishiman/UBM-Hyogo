# タスク仕様書 検証レポート

> 検証日時: 2026-05-05T13:34:32.479Z
> 対象: docs/30-workflows/09a-A-staging-deploy-smoke-execution

## サマリー

| 項目 | 値 |
|------|-----|
| 総Phase数 | 13 |
| 検証済みPhase | 13 |
| エラー | 0 |
| 警告 | 27 |
| 情報 | 34 |
| **結果** | **✅ PASS** |

## Phase別検証結果

### Phase 1: 要件定義 ✅

- ℹ️ [consistency] 参照パス「task-09c-production-deploy-execution-001.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「task-09c-production-deploy-execution-001.md」の存在を確認してください

### Phase 2: 設計 ✅

- ℹ️ [consistency] 参照パス「docs/30-workflows/unassigned-task/task-09a-d1-schema-parity-followup-001.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md」の存在を確認してください

### Phase 3: 設計レビューゲート ✅

- ℹ️ [consistency] 参照パス「unassigned-task/task-09a-d1-schema-parity-followup-001.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「references/task-workflow-active.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「task-ut-09-member-responses-table-name-drift.md」の存在を確認してください

### Phase 4: テスト作成 ⚠️

- ⚠️ [consistency] 依存するPhase 2の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 3の成果物が文書内で参照されていない可能性があります
- ℹ️ [consistency] 参照パス「bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging \| tee outputs/phase-11/evidence/deploy/deploy-api-staging.log」の存在を確認してください
- ℹ️ [consistency] 参照パス「bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \| tee outputs/phase-11/evidence/deploy/deploy-web-staging.log」の存在を確認してください
- ℹ️ [consistency] 参照パス「bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \| tee outputs/phase-11/evidence/d1/d1-migrations-list.txt」の存在を確認してください
- ℹ️ [consistency] 参照パス「timeout 60 bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format pretty \| bash scripts/lib/redaction.sh \| tee outputs/phase-11/evidence/wrangler-tail/wrangler-tail.log」の存在を確認してください
- ℹ️ [consistency] 参照パス「unassigned-task/task-09a-d1-schema-parity-followup-001.md」の存在を確認してください

### Phase 5: 実装 ✅

問題なし

### Phase 6: テスト拡充 ⚠️

- ⚠️ [quality] 曖昧表現「必要なら」が1箇所で使用されています
- ℹ️ [consistency] 参照パス「task-09c-production-deploy-execution-001.md」の存在を確認してください

### Phase 7: テストカバレッジ確認 ✅

- ℹ️ [consistency] 参照パス「grep -q '09a-A 実測完了\|09a-A staging deploy smoke completed' docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md && jq -e '.phases[] \| select(.id=="phase-11") \| .state == "complete"' "$PARENT/artifacts.json"」の存在を確認してください

### Phase 8: リファクタリング ⚠️

- ⚠️ [consistency] 依存するPhase 6の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 7の成果物が文書内で参照されていない可能性があります
- ℹ️ [consistency] 参照パス「curl -sSi 'https://<api-staging>/public/members?...' \| tee outputs/phase-11/evidence/curl-public-members-<key>.log」の存在を確認してください
- ℹ️ [consistency] 参照パス「docs/30-workflows/unassigned-task/task-09a-staging-smoke-helpers-001.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「unassigned-task/task-09a-staging-smoke-helpers-001.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「task-09a-staging-smoke-helpers-001.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「unassigned-task/task-09a-staging-smoke-helpers-001.md」の存在を確認してください

### Phase 9: 品質保証 ✅

- ℹ️ [consistency] 参照パス「grep -nE 'Bearer\|token=\|sk-\|API_KEY=\|password=' outputs/phase-11/evidence/ -r」の存在を確認してください
- ℹ️ [consistency] 参照パス「grep -rn 'NOT_EXECUTED' outputs/phase-11/evidence/」の存在を確認してください
- ℹ️ [consistency] 参照パス「jq '.summary.diffCount' outputs/phase-11/evidence/d1-schema-parity.json」の存在を確認してください
- ℹ️ [consistency] 参照パス「grep -E 'Deployed (ubm-hyogo-(api\|web)-staging\|to https)' outputs/phase-11/evidence/deploy-{api,web}-staging.log」の存在を確認してください

### Phase 10: 最終レビューゲート ⚠️

- ⚠️ [quality] 曖昧表現「必要なら」が1箇所で使用されています
- ⚠️ [consistency] 依存するPhase 2の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 5の成果物が文書内で参照されていない可能性があります
- ℹ️ [consistency] 参照パス「task-09c-production-deploy-execution-001.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「task-09c-production-deploy-execution-001.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「task-09c-production-deploy-execution-001.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「task-09c-production-deploy-execution-001.md」の存在を確認してください

### Phase 11: 手動テスト検証 ⚠️

- ⚠️ [consistency] 依存するPhase 6の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 8の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 9の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 10の成果物が文書内で参照されていない可能性があります
- ℹ️ [consistency] 参照パス「docs/30-workflows/unassigned-task/task-09a-d1-schema-parity-followup-001.md」の存在を確認してください

### Phase 12: ドキュメント更新 ⚠️

- ⚠️ [structure] 完了条件がチェックリスト形式（- [ ] / - [x]）ではありません
- ⚠️ [consistency] 依存するPhase 2の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 5の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 6の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 7の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 8の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 9の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 10の成果物が文書内で参照されていない可能性があります
- ℹ️ [consistency] 参照パス「test -f docs/30-workflows/unassigned-task/task-09a-canonical-directory-restoration-001.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「references/task-workflow-active.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「docs/30-workflows/unassigned-task/task-09a-d1-schema-parity-followup-001.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「docs/30-workflows/unassigned-task/task-09a-common-helper-extraction-001.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「docs/30-workflows/unassigned-task/task-09c-production-deploy-precondition-XXX.md」の存在を確認してください
- ℹ️ [consistency] 参照パス「docs/30-workflows/unassigned-task/task-09a-wrangler-tail-recovery-001.md」の存在を確認してください

### Phase 13: PR作成 ⚠️

- ⚠️ [consistency] 依存するPhase 2の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 5の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 6の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 7の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 8の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 9の成果物が文書内で参照されていない可能性があります
- ⚠️ [consistency] 依存するPhase 10の成果物が文書内で参照されていない可能性があります
