# Phase 13: コミット・PR 作成【BLOCKED PLACEHOLDER】

> **CONST_004 / CONST_005 準拠の実装仕様書**。spec 段階ではアクションを起こさず、G1-G4 multi-stage approval gate / branch / labels / 本文テンプレを placeholder として確定する。

## ⚠️ 必須宣言（冒頭）

**本 Phase は user 明示承認なしに `git commit` / `git push` / `gh pr create` を実行してはならない。** spec 段階ではアクションを起こさず、placeholder として手順を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 状態 | **blocked_pending_user_approval** |
| ブロック理由 | production runtime smoke 取得（Phase 11 G3）と親 Issue #371 昇格 commit が伴うため、user 明示承認後にのみ commit / push / PR を実行する |
| ブランチ | `docs/issue-572-attendance-provider-production-runtime-smoke` |
| 親 Issue | #572（CLOSED） |
| 関連 Issue | #531 / #371 / #571（すべて CLOSED） |

## 実行禁止事項（spec 段階）

- [ ] `git commit`
- [ ] `git push`
- [ ] `gh pr create`
- [ ] `gh pr merge`
- [ ] production への副作用ある write 操作（POST / PUT / DELETE / D1 write）

## G1-G4 multi-stage approval gate

| Gate | 条件 | 検証コマンド / 確認方法 |
| --- | --- | --- |
| G1 | typecheck / lint / test / build PASS | `mise exec -- pnpm typecheck && mise exec -- pnpm lint && mise exec -- pnpm --filter @ubm-hyogo/api test --run && mise exec -- pnpm --filter @ubm-hyogo/api build` exit 0 |
| G2 | grep-gate redact zero-hit | `outputs/phase-11/redact-filter-zero-hit.log` に `grep_exit=1`（0 hit）が記録されていること |
| G3 | production smoke evidence + 親 Issue #371 昇格 commit | `outputs/phase-11/production-smoke-summary.md` 存在 / `.attendance | type == "array"` true / commit hash 記載 |
| G4 | user 明示承認 | `outputs/phase-11/user-approval-evidence.md` に summary-only キャプチャ存在 / "Phase 13 を実行してよい" 等の明示 |

G1-G3 すべて満たし、かつ G4（user 明示承認）取得後にのみ以下手順を実行する。

## 品質ゲート（CLAUDE.md「PR 作成の完全自律フロー」と整合）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# 期待: 3 コマンドすべて exit 0
# 失敗時は最大 3 回まで自動修復し、修復差分を NEW commit で積む（--amend は使わない）
```

## 実行解放後の手順（参考）

```bash
# 1) ブランチ確認
git status
git branch --show-current
# 期待: docs/issue-572-attendance-provider-production-runtime-smoke

# 2) ステージング（具体ファイル指定 / git add -A は避ける）
git add docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/ \
        .claude/skills/aiworkflow-requirements/references/task-workflow.md \
        .claude/skills/aiworkflow-requirements/references/api-contracts.md \
        .claude/skills/aiworkflow-requirements/references/lessons-learned.md \
        .claude/skills/aiworkflow-requirements/indexes/

# 3) commit（spec 本体）
git commit -m "$(cat <<'EOF'
docs(issue-572): production runtime smoke spec for attendanceProvider DI completion

- Phase 11-13 spec for production GET smoke on /admin/members/:memberId and /me/profile
- DI-bound evidence: .attendance | type == "array" on both endpoints
- Summary-only evidence with redact filter (cookie / Bearer / cf-* / OAuth secret / email / fullName)
- Promotes parent issue #371 from PASS_BOUNDARY_SYNCED_RUNTIME_PENDING to PASS_RUNTIME_VERIFIED / completed
- Retrospective record for #531 / #371 / #571 / #572 (all CLOSED)

Refs: #572
Refs: #371

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 4) push（G1-G4 すべて満たした後にのみ実行）
git push -u origin docs/issue-572-attendance-provider-production-runtime-smoke

# 5) PR 作成
gh pr create --base dev \
  --label priority:high \
  --label type:workflow \
  --label scale:small \
  --title "docs(issue-572): production runtime smoke spec for attendanceProvider DI completion" \
  --body "$(cat <<'EOF'
## Summary
- Issue #572 に対する production runtime smoke 仕様書（13 phase + outputs）の整備
- production GET smoke (`/admin/members/:memberId` / `/me/profile`) の DI-bound evidence (`.attendance | type == "array"`) 取得手順を確定
- summary-only evidence + redact filter zero-hit（cookie / Bearer / cf-* / OAuth secret / email / fullName 実値除外）の運用ルールを明文化
- 親 Issue #371 を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_RUNTIME_VERIFIED` / `completed` に昇格する commit を含む
- 関連 Issue #531 / #371 / #571 / #572 すべて CLOSED のレトロスペクティブ記録

## Promoted parent issue
親 Issue #371 完了化 commit hash: `<COMMIT_HASH_FROM_outputs/phase-11/production-smoke-summary.md>`

## Test plan
- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test --run` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api build` exit 0
- [ ] production GET smoke で `/admin/members/:memberId` および `/me/profile` の `.attendance | type == "array"` true
- [ ] `outputs/phase-11/redact-filter-zero-hit.log` に `grep_exit=1`（0 hit）
- [ ] `outputs/phase-11/user-approval-evidence.md` に summary-only キャプチャ存在
- [ ] CI `verify-indexes-up-to-date` gate clean

## Implementation guide
詳細は `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-12/implementation-guide.md` を参照。

Refs: #572
Refs: #371

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# 6) CI 確認
gh pr view --json number,url,statusCheckRollup
```

## ラベル運用ルール

| ラベル | Issue 側 | PR 側 |
| --- | --- | --- |
| `priority:high` | 付与 | 付与（`--label priority:high`） |
| `type:workflow` | 付与 | 付与（`--label type:workflow`） |
| `scale:small` | 付与 | 付与（`--label scale:small`） |
| `status:unassigned` | 該当なし | **付けない** |

## ロールバック

1. **PR 段階**: `gh pr close <PR>` + ブランチ削除（spec 専用ブランチのため副作用なし）
2. **merge 後**: revert commit を新規 PR で立てる（`--amend` / 履歴改変禁止）
3. **親 Issue #371 昇格 commit の取り消し**: `references/task-workflow.md` を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` に戻す revert PR を別途作成

## DoD

- [ ] G1-G4 すべて満たした後に `gh pr create` 実行
- [ ] PR labels に `priority:high` / `type:workflow` / `scale:small` が付与
- [ ] PR 本文に `Refs: #572` および `Refs: #371` が含まれる
- [ ] PR 本文に親 Issue #371 昇格 commit hash が記載
- [ ] PR base が `dev`
- [ ] PR 作成完了で本タスク終了

## Phase 13 ステータス

`blocked_pending_user_approval` を維持。G1-G4 全 gate 解除後にのみ上記手順を実行する。**PR 作成完了で本タスク終了**。
