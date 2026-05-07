# Phase 13: コミット・PR 作成【BLOCKED PLACEHOLDER】

## ⚠️ 必須宣言（冒頭）

**本 Phase は user 明示承認なしに `git commit` / `git push` / `gh pr create` を実行してはならない。** spec 段階ではアクションを起こさず、placeholder として手順を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 状態 | **blocked_pending_user_approval** |
| ブロック理由 | runtime evidence 取得（staging deploy + fixture 投入）と migration 0015 追加（採用時）が伴うため、user 明示承認後にのみ commit / push / PR を実行する |
| 親 Issue | #503 |

## 実行禁止事項（spec 段階）

- [ ] `git commit`
- [ ] `git push`
- [ ] `gh pr create`
- [ ] `gh pr merge`
- [ ] migration 0015 の本番 apply

## G1-G4 multi-stage approval gate

| Gate | 条件 | 検証コマンド / 確認方法 |
| --- | --- | --- |
| G1 | typecheck / lint PASS | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` exit 0 |
| G2 | vitest PASS | `mise exec -- pnpm --filter @ubm-hyogo/api test -- --run schemaAliasBackfillBatch` exit 0 |
| G3 | staging runtime evidence + 採用判断レコード | `outputs/phase-11/decision-record.md` 存在 / `staging-evidence-{remaining-scan,cursor}.md` 実体配置 |
| G4 | user 明示承認 | "Phase 13 を実行してよい" / "PR 作成してよい" 等の明示 |

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
# 期待: feat/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration

# 2) ステージング（具体ファイル指定 / git add -A は避ける）
git add docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/ \
        docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md \
        apps/api/src/workflows/schemaAliasBackfillBatch.ts \
        apps/api/src/repository/schemaDiffQueue.ts \
        apps/api/src/workflows/__tests__/ \
        .claude/skills/aiworkflow-requirements/references/database-schema.md \
        .claude/skills/aiworkflow-requirements/references/database-operations.md \
        .claude/skills/aiworkflow-requirements/indexes/
# cursor 採用時のみ追加:
#   apps/api/migrations/0015_schema_diff_queue_cursor.sql

# 3) commit
git commit -m "$(cat <<'EOF'
feat(api): issue-503 schema alias back-fill cursor semantics shadow flag and decision evidence

- BACKFILL_CURSOR_MODE shadow flag で remaining-scan / cursor 経路を切替可能化
- staging で 10,000 行 fixture による比較 evidence を取得し採用判断を decision-record.md に記録
- vitest に cursor / parity / fallback の 5 test ケースを追加
- aiworkflow-requirements SSOT (db-schema / keywords) と consumed trace を反映

Refs: #503

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 4) push（G1-G4 すべて満たした後にのみ実行）
git push -u origin feat/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration

# 5) PR 作成
gh pr create --base main \
  --label priority:low \
  --label type:improvement \
  --label scale:medium \
  --label area:api \
  --title "feat(api): issue-503 schema alias back-fill cursor semantics shadow flag and decision evidence" \
  --body "$(cat <<'EOF'
## Summary
- Issue #503 に対する schema alias back-fill batch の cursor 化判断と shadow flag 実装
- `BACKFILL_CURSOR_MODE` env で remaining-scan / cursor 経路を切替可能化（API contract `backfill.status` は不変）
- staging で 10,000 行 fixture による比較 evidence を取得し、採用 / 不採用 / 判定保留を `decision-record.md` に記録
- aiworkflow-requirements SSOT (`references/database-schema.md` / `references/database-operations.md` / `indexes/keywords.json`) と consumed trace を反映

## Test plan
- [ ] vitest（cursor / parity / fallback 5 ケース）PASS
- [ ] `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` exit 0
- [ ] staging fixture 10,000 行で remaining-scan / cursor 双方の evidence が `outputs/phase-11/` に存在
- [ ] decision-record.md に採用判断と数値根拠（CPU 比 / retry_count）が記載
- [ ] D1 schema parity（staging vs production）に未承認 drift 無し

## Implementation guide
詳細は `docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/outputs/phase-12/implementation-guide.md` を参照。

Refs: #503

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# 6) CI 確認
gh pr view --json number,url,statusCheckRollup
```

## ラベル運用ルール

| ラベル | Issue 側 | PR 側 |
| --- | --- | --- |
| `priority:low` | 付与 | 付与（`--label priority:low`） |
| `type:improvement` | 付与 | 付与（`--label type:improvement`） |
| `scale:medium` | 付与 | 付与（`--label scale:medium`） |
| `area:api` | 付与 | 付与（`--label area:api`） |
| `status:unassigned` | 付与（Issue メタ） | **付けない**（PR には付与しない） |

## ロールバック

1. **PR 段階**: `gh pr close <PR>` + ブランチ削除
2. **merge 後**: revert commit を新規 PR で立てる（`--amend` / 履歴改変禁止）
3. **migration 0015 apply 後の cursor 不採用切替**: `BACKFILL_CURSOR_MODE=remaining-scan` を Cloudflare Secrets で恒久設定 → cursor 列は残置（無害）し、後続タスクで列削除 migration を別途検討

## DoD

- [ ] G1-G4 すべて満たした後に `gh pr create` 実行
- [ ] PR labels に `priority:low` / `type:improvement` / `scale:medium` / `area:api` が付与
- [ ] PR 本文に `Refs: #503` が含まれる
- [ ] PR 作成完了で本タスク終了

## Phase 13 ステータス

`blocked_pending_user_approval` を維持。G1-G4 全 gate 解除後にのみ上記手順を実行する。**PR 作成完了で本タスク終了**。
