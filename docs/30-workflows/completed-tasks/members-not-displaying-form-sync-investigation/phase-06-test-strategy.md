# Phase 6: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 06 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装状態を検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装済み項目は Gate-B passed、staging runtime 操作は Gate-C pending として明示する。

## 参照資料

- phase-05 / Phase 5
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


## Unit tests

### Task A
- `forms-pipeline.spec.ts`
  - breakdown 集計（既存 fake D1 で member_status fixture 拡張、3 種 publish_state × 3 種 consent の matrix 1 件ずつ）
  - `lastSuccessfulSyncAt` が success 以外を除外することの確認
  - `visiblePublicCount` が WHERE all-AND と一致することのプロパティテスト

### Task B
- `auto-publish.spec.ts`
  - truth table 全 7 ケース（phase-04 参照）を `it.each` で網羅
  - 境界: `publicConsent='unknown'` で `flagEnabled=true` の場合 member_only 維持
- `sync-forms-responses.contract.spec.ts`
  - flag=false: 従来 publish_state='member_only' 維持（regression）
  - flag=true + consent=consented + override 無し: publish_state='public' に更新 + history append
  - flag=true + admin override 有り: 更新スキップ

### Task C
- `backfill-publish-state.spec.ts`
  - dryRun=true: applied=0、candidates 正しい
  - dryRun=false: 期待件数 UPDATE、再実行で applied=0 (idempotent)
  - admin override 行は skipped.adminExplicit にカウント
  - non-admin token は 401

## Integration / Manual

| 項目 | 手段 | 環境 |
|------|------|------|
| Diagnostic endpoint live response | `bash scripts/diagnose-members-pipeline.sh staging` | staging |
| Backfill dry-run | `bash scripts/backfill-publish-state.sh --env staging --dry-run` | staging |
| Backfill apply | `bash scripts/backfill-publish-state.sh --env staging --apply` | staging（user-gated） |
| `/members` browser smoke | DevTools Network 200 + 1 件以上表示 | staging（user-gated） |

## 既存テスト regression

- `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` の既存ケース（fixture: `publish_state="member_only"`）が flag=false default で緑のまま維持されること
- `apps/api/src/routes/public/publicMembers.spec.ts` の既存 WHERE 条件契約に変更なし
