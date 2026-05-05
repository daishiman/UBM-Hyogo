# Issue #475 — branch protection coverage-gate 追加 — 実行サマリ (main.md)

## Part 1: 中学生向け説明

このタスクは「コードチェックの合格点（カバレッジ80%）が取れていない PR を、自動で merge できないようにする」最後の鍵を回す作業です。

- 仕組み: 既に CI（自動チェック）に「coverage-gate」というチェックを作ってあるが、GitHub の「これに合格しないと merge できません」というルール一覧にはまだ登録されていない
- やること: GitHub の API を `gh` コマンドで叩いて main / dev というブランチのルールに「coverage-gate も合格必須」を追加する
- 終わったら: 80% に達していない PR は merge ボタンが押せなくなる

## Part 2: 技術者向け説明

### 目的
`main` / `dev` の `required_status_checks.contexts` に `coverage-gate` を append し、`.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` の current applied 表を同期する。

### 実行手順サマリ
1. Phase 1: baseline GET（`{main,dev}-protection-baseline.json`）+ GO 判定
2. Phase 2: PUT body 設計（baseline echo back + `coverage-gate` append）
3. Phase 3: 影響範囲確認（open PR / SSOT / CLAUDE.md）
4. Phase 4: 検証シナリオ設計（drift / invariant / 既存 contexts 維持 / coverage 未達 dry-run）
5. Phase 5: PUT 実行 main → dev + SSOT 編集 + skill index 再生成（Gate A は外部適用済みとして fresh GET で観測済）
6. Phase 6-7: コード変更不在確認 / coverage 維持確認（適用外）
7. Phase 8: workflow ↔ branch protection 統合確認
8. Phase 9: typecheck / lint / yamllint / index drift / coverage
9. Phase 10: 最終レビュー + rollback 手順確認
10. Phase 11: NON_VISUAL evidence 8 ファイル取得（empirical PR observation は Gate B 後）
11. Phase 12: 7 必須成果物
12. Phase 13: PR 作成（spec docs + applied evidence 部分のみ。commit / push / PR は **Gate B: git publish approval** 必須）

### 参照
- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/475 (CLOSED)
- unassigned-task spec: `docs/30-workflows/unassigned-task/task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001.md`
- 親 wave: `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/`
- SSOT: `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`
