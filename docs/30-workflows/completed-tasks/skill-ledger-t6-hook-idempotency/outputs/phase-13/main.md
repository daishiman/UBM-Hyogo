# Phase 13 成果物 — PR 本文案（pending_user_approval）

> **承認待ち**: 本フェーズは **ユーザーの明示承認があるまで commit / push / PR 作成を実行しない**。本ファイルは PR 本文案・差分サマリー・残リスクを記述する草稿。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 状態 | NOT EXECUTED / pending_user_approval |
| 種別 | spec-only PR（仕様書整備のみ） |
| 関連 Issue | #161（CLOSED のまま参照のみ。reopen しない） |
| ベースブランチ | main |
| 作業ブランチ（想定） | feat/skill-ledger-t6-hook-idempotency-spec |

## 2. PR タイトル案

```
docs(t6): add skill-ledger T-6 hook idempotency task spec (Phase 1-13)
```

## 3. PR 本文案（HEREDOC 想定）

```markdown
## Summary
- skill-ledger T-6（hook 冪等化と 4 worktree 並列 smoke 実走）のタスク仕様書を Phase 1〜13 で整備（実 hook 実装と smoke 実走は別 PR）
- AC-1〜AC-11（hook が `git add` を呼ばない / 派生物存在時はスキップ / 部分 JSON リカバリ / 4 worktree `unmerged=0` / A-2 完了 gate / `wait $PID` 個別集約 / 2→4 二段構え / 1 コミット粒度 rollback / metadata 整合 / 代替案 4 案以上 PASS / 4 条件 PASS）を Phase 1〜3 で固定
- aiworkflow-requirements references への直接差分なし（policy の帰結のため二重化を避ける）

## AC 達成サマリ
- AC-1 hook が `git add` 系を呼ばない（仕様禁止）: PASS（Phase 1 §AC, Phase 2 §4）
- AC-2 派生物存在時はスキップ: PASS（Phase 2 §2 lane 1）
- AC-3 部分 JSON リカバリ手順: PASS（Phase 2 §2 lane 2）
- AC-4 4 worktree `unmerged=0`: NOT EXECUTED（Phase 11 別 PR で実走）
- AC-5 A-2 完了 gate（3 箇所重複明記）: PASS（Phase 1 / 2 / 3）
- AC-6 `wait $PID` 個別集約: PASS（Phase 2 §6 / outputs/phase-11/manual-smoke-log.md）
- AC-7 2→4 二段構え: PASS（Phase 2 §6）
- AC-8 1 コミット粒度 rollback: PASS（Phase 2 §5 / Phase 12 implementation-guide §2.6）
- AC-9 metadata 整合: PASS（artifacts.json metadata = NON_VISUAL / implementation / infrastructure_governance）
- AC-10 代替案 4 案以上 PASS/MINOR/MAJOR: PASS（Phase 3 / base case D = PASS with notes）
- AC-11 4 条件 PASS: PASS（Phase 1 / Phase 3）

## 検証結果
- typecheck / lint / build: 仕様書整備のみのためコード差分なし（影響なし）
- verify-indexes-up-to-date CI gate: aiworkflow-requirements 直接差分なしのため drift なし
- Phase 11 smoke: NOT EXECUTED（実走は別 PR で実施）

## 残リスク
- A-2（Issue #130）/ A-1（Issue #129）の状態が変化した場合、本仕様書の AC-5 gate 文言再確認が必要
- 4 worktree smoke 実走時の I/O 飽和（D-2）は事前 smoke gate（AC-7）で逓減
- 部分 JSON リカバリループ（D-5）は実走時の決定論性に依存する仕様であり、Phase 11 実走で再現性を確認する

## Test plan
- [ ] `docs/30-workflows/skill-ledger-t6-hook-idempotency/index.md` が `artifacts.json` と整合
- [ ] `outputs/phase-01/main.md` 〜 `outputs/phase-13/main.md` が存在し phase-NN.md と矛盾しない
- [ ] `outputs/phase-11/{main,manual-smoke-log,manual-test-checklist,manual-test-result,link-checklist,discovered-issues}.md` が存在
- [ ] `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` が存在
- [ ] aiworkflow-requirements references に差分が出ていないこと（spec-only PR の境界）
- [ ] Issue #161 が CLOSED のまま（本 PR で reopen していない）

## 関連
- Issue: #161（CLOSED のまま参照）
- 上流: Issue #130（A-2） / Issue #129（A-1）
- 並列: Issue #132（B-1）
- 原典: docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. 差分サマリー（想定）

| カテゴリ | 件数（想定） | 内容 |
| --- | --- | --- |
| 新規ファイル | 22 件前後 | `docs/30-workflows/skill-ledger-t6-hook-idempotency/` 配下の `index.md` / `artifacts.json` / `phase-01.md`〜`phase-13.md` / `outputs/phase-0N/main.md`（Phase 1〜13）/ Phase 11 / 12 / 13 の追加 evidence 群 |
| 既存ファイル変更 | 0 件 | aiworkflow-requirements references / lefthook.yml / scripts / apps いずれも未変更 |
| バイナリ | 0 件 | NON_VISUAL のためスクリーンショットなし |

## 5. 承認待ち項目（ユーザー指示で実行）

| # | 項目 | 状態 |
| --- | --- | --- |
| 1 | `git add <仕様書ファイル群>` の実行 | pending_user_approval |
| 2 | `git commit -m "..."` の実行 | pending_user_approval |
| 3 | `git push -u origin <branch>` の実行 | pending_user_approval |
| 4 | `gh pr create ...` の実行 | pending_user_approval |
| 5 | PR レビュー対応 | pending_user_approval |

**自動実行禁止**: 本フェーズで AI が `git add` / `git commit` / `git push` / `gh pr create` を自動的に実行することはない。ユーザーが明示的に「commit して」「PR を作って」と指示した時にのみ実行する。

## 6. Issue #161 の扱い

- 状態: CLOSED のまま参照のみ。reopen しない（artifacts.json `metadata.issue_state_note` 参照）。
- 本 PR の merge 後も Issue 状態は CLOSED を維持する。
- 実 hook 実装 PR（後続）でも Issue #161 を reopen せず、新規 Issue を起票するか PR の `Refs #161` で参照のみ行う。

## 7. 完了判定

- [x] PR 本文案が作成されている
- [x] 差分サマリーが記述されている
- [x] 残リスクが列挙されている
- [x] Test plan が含まれている
- [ ] ユーザーが明示承認を出した
- [ ] 上記承認後に commit / push / PR を実行した

ユーザー承認前に最後の 2 項目を実行することは禁止。
