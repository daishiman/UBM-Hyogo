# Phase 13: Commit / PR draft

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 13 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装状態を検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装済み項目は Gate-B passed、staging runtime 操作は Gate-C pending として明示する。

## 参照資料

- 依存 Phase: phase-01 / Phase 1, phase-02 / Phase 2, phase-05 / Phase 5, phase-06 / Phase 6, phase-07 / Phase 7, phase-08 / Phase 8, phase-09 / Phase 9, phase-10 / Phase 10, phase-11 / Phase 11, phase-12 / Phase 12
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


## Branch

`feat/members-not-displaying-form-sync-investigation`

## Commit (single)

```
feat(api): auto-publish on consent policy + diagnostic/backfill ops for members pipeline

- diagnostic endpoint に publicConsent / publishState breakdown + visiblePublicCount + lastSuccessfulSyncAt 追記
- MEMBERS_AUTO_PUBLISH_ON_CONSENT feature flag 導入（staging=true, prod=false）
- decidePublishState 純関数 + sync 時統合（admin override 尊重）
- backfill-publish-state ops endpoint (dryRun default) + script
- scripts/diagnose-members-pipeline.sh で H1-H4 自動判別
```

## PR

- base: `dev`
- title: `feat(api): members publish_state auto-publish policy + diagnostic ops`
- body:
  - ## Summary
    - Google Form 回答済み会員が公開メンバー一覧に表示されない問題の恒久対策
    - 既存 publish_state default 'member_only' により sync された会員が公開されない根本原因に対し、consent ベースの auto-publish policy を feature flag で導入
    - 診断 endpoint と backfill ops を追加し、staging 既存 records も解消
  - ## Test plan
    - [ ] unit test 全 green
    - [ ] staging deploy 後 diagnose script 実行
    - [ ] backfill dry-run → apply 実行
    - [ ] `/members` browser smoke で会員表示確認
  - ## Linked
    - 関連: #956 (CLOSED, H1), #957 (CLOSED, H2), #958 (CLOSED, H3 UX), #959 (CLOSED, H4)
    - 親 workflow: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/`

## ユーザー gated 項目

- commit
- push
- PR 作成
- staging deploy
- backfill apply
- production への flag=true 切替（別サイクル）
