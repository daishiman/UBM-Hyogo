# Phase 8: DoD (Definition of Done)

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 08 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装状態を検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装済み項目は Gate-B passed、staging runtime 操作は Gate-C pending として明示する。

## 参照資料

- 依存 Phase: phase-01 / Phase 1, phase-02 / Phase 2, phase-05 / Phase 5, phase-06 / Phase 6, phase-07 / Phase 7
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


## コード変更

- [ ] 14 ファイルの新規/編集が phase-05 表通り完了
- [ ] `decidePublishState` の truth table 7 ケース全 green
- [ ] sync regression spec で flag=false 動作変化なし
- [ ] backfill endpoint が idempotent（2 回目 applied=0）

## ローカル検証

- [ ] `mise exec -- pnpm typecheck && pnpm lint && pnpm --filter @ubm/api test && pnpm build` 全 green
- [ ] `bash scripts/verify-pr-ready.sh` pass

## Runtime 検証（user-gated）

- [ ] staging deploy 完了 (`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`)
- [ ] `bash scripts/diagnose-members-pipeline.sh staging` 実行し、`diagnosis` フィールドが "正常" または明確な原因表示
- [ ] H3 該当時: `bash scripts/backfill-publish-state.sh --env staging --apply` 実行
- [ ] `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members` で 1 件以上表示 + browser console clean
- [ ] 再診断で `visiblePublicCount > 0`

## ドキュメント

- [ ] Phase 11 evidence inventory 完備（diagnostic JSON 出力 + backfill レスポンス + browser screenshot）
- [ ] artifacts.json gate metadata Gate-A passed
- [ ] aiworkflow-requirements skill の resource-map / topic-map / quick-reference に本 workflow 追加
- [ ] PR draft (Phase 13) 完了
