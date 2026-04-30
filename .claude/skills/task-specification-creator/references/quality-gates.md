# 品質ゲート / Phase 境界 / 検証コマンド

## 重要ルール

### Phase完了時の必須アクション

1. **タスク完全実行**: Phase内で指定された全タスクを完全に実行
2. **成果物確認**: 全ての必須成果物が生成されていることを検証
3. **artifacts.json更新**: `complete-phase.js` でPhase完了ステータスを更新
4. **完了条件チェック**: 各タスクを完遂した旨を必ず明記

### PR作成に関する注意

**PR作成は自動実行しない。必ずユーザーの明示的な許可を得てから実行すること。**

📖 [commands.md](commands.md) - コマンド一覧

## Phase 12 と Phase 13 の境界

| Task      | 完了条件                                                                                                              | 詳細                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Task 12-1 | `implementation-guide.md` が Part 1/2 を満たす                                                                        | [phase-12-documentation-guide.md](phase-12-documentation-guide.md)   |
| Task 12-2 | Step 1 と Step 2 の判定が記録される                                                                                   | [spec-update-workflow.md](spec-update-workflow.md)                   |
| Task 12-3 | `documentation-changelog.md` と artifacts が同期される                                                                | [spec-update-validation-matrix.md](spec-update-validation-matrix.md) |
| Task 12-4 | 0件でも `unassigned-task-detection.md` を出し、`current/baseline` を分離して記録する                                  | [unassigned-task-guidelines.md](unassigned-task-guidelines.md)       |
| Task 12-5 | 改善点なしでも `skill-feedback-report.md` を出し、`phase12-task-spec-compliance-check.md` を root evidence として残す | [patterns-phase12-sync.md](patterns-phase12-sync.md)                 |
| Phase 13  | commit と PR は user の明示承認後だけ                                                                                 | [review-gate-criteria.md](review-gate-criteria.md)                   |

UI/UX 実装を含む task では Phase 11 で screenshot と Apple UI/UX 視覚検証を行う。手順は [phase-11-screenshot-guide.md](phase-11-screenshot-guide.md) と [screenshot-verification-procedure.md](screenshot-verification-procedure.md) を使う。

NON_VISUAL タスク（API repository / library / config / boundary tooling など）で staging 未配備や実フロー前提が成立しない場合は、Phase 11 の代替 evidence プレイブックを使う: [phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md)。L1 型 / L2 lint-boundary / L3 in-memory test / L4 意図的 violation の 4 階層と「代替 evidence 差分表」で何を保証し何を保証できないかを明示する。

### Approval-Gated NON_VISUAL Implementation

Phase 13 が user approval + 実行ゲートを兼ねる NON_VISUAL implementation task では、Phase 12 までの JSON は成功証跡ではなく計画 / template / reserved path として扱う。

- `branch-protection-payload-*` など不可逆 API の PUT payload は、承認前でも完全 payload 形を保つ。部分 payload を「後で差分適用される」とみなさない。
- `current-*` / `applied-*` GET evidence は、Phase 13 承認後の fresh command output で上書きされた時だけ AC evidence にできる。
- AC matrix では spec evidence と runtime evidence を分離し、`blocked_until_user_approval` placeholder を PUT 成功や drift 解消の根拠にしない。
- Phase 12 の system spec update は `spec_created` を維持し、実行後の正本反映が必要な場合は正式 unassigned-task へ分離する。

## 検証コマンド

```bash
node scripts/validate-phase-output.js docs/30-workflows/{{FEATURE_NAME}}
node scripts/verify-all-specs.js --workflow docs/30-workflows/{{FEATURE_NAME}}
node ../skill-creator/scripts/quick_validate.js .claude/skills/task-specification-creator
node ../skill-creator/scripts/validate_all.js .claude/skills/task-specification-creator
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
node scripts/log-usage.js --result success --phase "Phase {{N}}"
```

Phase 12 では追加で `detect-unassigned-tasks.js`、`audit-unassigned-tasks.js`、`verify-unassigned-links.js`、`validate-phase12-implementation-guide.js` を実行する。
