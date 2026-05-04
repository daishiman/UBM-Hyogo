# Phase 13: コミット・PR 作成【BLOCKED PLACEHOLDER】

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 状態 | **blocked** |
| ブロック理由 | spec_created 段階。実装着手 + Phase 11 runtime evidence 取得 + user 明示承認後にのみ実行可 |

## ⚠️ 実行禁止事項（spec 段階）

本ファイルは **spec_created 段階の placeholder** であり、以下のアクションを **絶対に実行してはならない**:

- [ ] `git commit`
- [ ] `git push`
- [ ] `gh pr create`
- [ ] `gh pr merge`
- [ ] Cloudflare deploy（本タスクは workflow yml のみのためそもそも該当なし）
- [ ] branch protection 変更

これらは Phase 1 GO 判定 → Phase 5 実装完了 → Phase 11 runtime evidence 取得 → Phase 12 7 成果物完備 → **user の明示承認** が揃った後にのみ、別ターンで実行する。

## 実行解放条件（すべて満たした後のみ進行）

- [ ] Task C / Task D が完了し main CI で全 metric ≥80% 確認済
- [ ] Phase 1 GO 判定が記録されている
- [ ] Phase 5 で yml diff 適用済
- [ ] Phase 9 品質検証 6 項目すべて exit 0
- [ ] Phase 11 NON_VISUAL evidence 3 点が実体配置
- [ ] Phase 12 7 ファイル実体配置 + compliance check PASS
- [ ] coverage Statements / Branches / Functions / Lines ≥80% 全パッケージ維持
- [ ] `bash scripts/coverage-guard.sh` exit 0
- [ ] **user の明示承認**（"Phase 13 を実行してよい" 等の指示）

## 実行解放後の手順（参考）

```bash
# 1) commit
git add .github/workflows/ci.yml scripts/coverage-guard.sh \
        docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-e-coverage-hard-gate/ \
        docs/30-workflows/completed-tasks/coverage-80-enforcement/  # 存在時のみ
git commit -m "$(cat <<'EOF'
ci(coverage-gate): hard gate 化 (PR3/3) — continue-on-error 削除

- .github/workflows/ci.yml の coverage-gate job から job/step 両レベルの
  continue-on-error: true を削除し coverage 80% 未達時に CI を fail させる。
- 履歴: PR1/3 (soft gate) → PR2/3 (閾値整備) → PR3/3 (本変更, hard gate)。
- 仕様: docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-e-coverage-hard-gate/

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 2) push
git push -u origin feat/ci-recover-task-e-coverage-gate-hard

# 3) PR 作成（.claude/commands/ai/diff-to-pr.md Phase 13 仕様に従う）
gh pr create --title "ci(coverage-gate): hard gate 化 (PR3/3)" --body "$(cat <<'EOF'
## Summary
- coverage-gate job/step から continue-on-error: true を削除し hard gate 化
- coverage 80% 未達 PR が merge できない状態に昇格
- 親 wave: ci-test-recovery-coverage-80-2026-05-04 / Task E

## Test plan
- [ ] gh workflow view ci.yml で coverage-gate に continue-on-error なし
- [ ] coverage-gate job が PASS（apps/* / packages/* 全 metric ≥80%）
- [ ] bash scripts/coverage-guard.sh exit 0
- [ ] regression: pnpm typecheck / pnpm lint exit 0

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## NO-GO（Phase 13 を実行しない）条件

- 解放条件のいずれかが未充足
- main CI で coverage が突如 80% 未満に低下（Task C / D regression）
- branch protection 変更で `coverage-gate` context が drift

## 完了条件

- [ ] 上記実行解放条件すべて充足の確認
- [ ] PR URL が記録される（実行後）
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（全パッケージ）
- [ ] `bash scripts/coverage-guard.sh` exit 0

## タスク 100% 実行確認【必須】

- [ ] BLOCKED placeholder としての警告文が冒頭に表示されている
- [ ] 実行禁止事項リストが明示されている
- [ ] user 明示承認ゲートが解放条件に含まれている
