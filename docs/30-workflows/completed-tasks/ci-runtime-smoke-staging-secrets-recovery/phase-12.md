# Phase 12: ドキュメント更新

## 必須成果物（strict 7 件）

| # | ファイル | 内容 |
|---|---------|------|
| 1 | `outputs/phase-12/main.md` | Phase 12 root evidence |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル概念説明）+ Part 2（技術詳細）+ 視覚証跡（NON_VISUAL） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A / 1-B / 1-C + Step 2 判定 |
| 4 | `outputs/phase-12/documentation-changelog.md` | 全 Step の結果を逐次記録 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも出力必須 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | 改善点なしでも出力。今回の learning 記録 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | root evidence。Task 12-1〜12-6 完了確認 |

## Task 12-1 Part 1 サンプル（中学生レベル）

> CI（自動テスト工場）の「最後の点検」が動くには、テスト用の「合言葉」が 4 つ必要です。今は合言葉が GitHub の金庫にまだ入っていないため、工場が「合言葉が足りない！」と止まっています。担当者が金庫に合言葉を 4 つ（＋通知用 1 つ）入れれば動き始めます。さらに、案内紙の置き場所が変わっていたので、エラー画面で正しい場所を案内するように直しました。次から同じことが起きないように、「案内紙が実在するか毎回チェックする」自動見回りも追加しました。

## Task 12-1 Part 2（技術詳細）

- 修正 file: `.github/workflows/runtime-smoke-staging.yml` / `.github/workflows/ci.yml` / 既存 workflow コメントの stale docs path
- 新規 file: `scripts/ci/verify-workflow-doc-refs.sh` / `scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh` / `.github/workflows/verify-workflow-doc-refs.yml`
- secret 投入: user が `bash scripts/smoke/provision-staging-secrets.sh` で 5 件投入。workflow early-fail は smoke 本体 4 件、Slack は failure post step guard
- 検証 evidence: Phase 11 成果物
- 視覚証跡: UI/UX 変更なしのため Phase 11 スクリーンショット不要

## Task 12-2 system-spec update

- Step 1-A: 完了タスクセクション追記（本ワークフロー） + LOGS.md (aiworkflow-requirements / task-specification-creator) + topic-map.md
- Step 1-B: 実装状況テーブルに `implemented_local_evidence_captured / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
- Step 1-C: 関連タスクテーブルのステータス更新
- Step 2: **N/A**（新規 public interface / API / shared 型なし。CI guard script は内部 ops で公開 surface に該当しない）

## Task 12-4 未タスク検出

- 0 件。runbook 昇格と Markdown 全体リンク検査は今回の原因に対する必須修正ではなく、既存正本を current path へ同期し、workflow docs ref guard を追加したため未タスク化しない。
