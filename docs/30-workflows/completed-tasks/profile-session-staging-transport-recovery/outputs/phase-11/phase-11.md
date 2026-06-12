# Phase 11: 手動テスト検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 11 / 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

**本 Phase は「staging 復旧の実機検証 + サブ原因（S1〜S4）の最終確定」に特化する**（Phase 3 §3.4 の特化宣言を継承）。前身 WF（profile-session-fetch-failure-investigation）の MT-A〜MT-D はこの復旧検証に統合され、独立の調査ステップとしては実施しない。実装 + merge 後の staging deploy → 診断 → `/profile` 正常描画確認 → 復旧しない場合の新構造化ログ読解（S1〜S4 排他判定）までの手順を固定する。本サイクルは `implemented_local_runtime_pending` のため、**local focused evidence と手順定義**を行い、staging deploy 以降は user-gated とする。

## 実行タスク

1. `manual-test-result.md` に staging 復旧検証手順 RT-A〜RT-D を「コマンド / 前提 / 期待結果 / 実結果(pending)」形式で記録する。
2. RT-D に S1〜S4 の排他的判定フロー（新構造化ログ `server_fetch_failed {transportKind, baseHost, status}` / `api_transport_fallback` の読解）を記載する（AC-9）。
3. 現象 screenshot（ユーザー提供 2026-06-11 21:43 JST・「ishida 会員」）を文中参照として記録する。
4. 復旧後 staging runtime screenshot（`profile-session-recovery-staging.png`）の取得計画を `screenshot-plan.json` / `phase11-capture-metadata.json` に planned/pending で記録する（staging PNG は user-gated・本 wave では作らない）。

## 完了条件

- [x] manual-test-result.md 冒頭に taskType=VISUAL / visualEvidence=VISUAL_ON_EXECUTION / workflow_state=implemented_local_runtime_pending の宣言表を記載
- [x] RT-A〜RT-D の手順を user-gated・実結果 pending で固定
- [x] S1〜S4 判定フローが排他的に切り分けられることを記録（AC-9）
- [x] screenshot 計画（復旧後 PNG=user-gated・implemented_local_runtime_pending では未取得）を JSON 2 件に記録

## 成果物

- `outputs/phase-11/manual-test-result.md`（最重要・復旧検証手順の正本）
- `outputs/phase-11/manual-test-report.md`
- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
- `outputs/phase-11/discovered-issues.md`
- `outputs/phase-11/ui-sanity-visual-review.md`
- `outputs/phase-11/screenshot-plan.json`
- `outputs/phase-11/phase11-capture-metadata.json`
- `outputs/phase-11/screenshots/.gitkeep`（既存・staging PNG は user-gated）

## 参照資料

- `_shared-context.md` §1（S1〜S4）/ §4（AC-9）/ §8（検証コマンド）
- `outputs/phase-3/phase-3.md` §3.4（Phase 11 特化宣言）
- `outputs/phase-5/task-04-diagnose-script-extension.md`（RT-B の診断スクリプト拡張仕様）
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 統合テスト連携

RT-A〜RT-D の実施結果（復旧確認 + サブ原因確定）が AC-9 の実結果正本。S3 と確定した場合のみ `unassigned-task/task-api-worker-hard-error-root-fix.md` の着手条件が満たされる（Phase 12 unassigned-task-detection と連動）。focused vitest（Phase 9 L-3）はlocal focused evidenceであり、本 Phase は staging 実機の二次証跡（運用復旧）を担う。
