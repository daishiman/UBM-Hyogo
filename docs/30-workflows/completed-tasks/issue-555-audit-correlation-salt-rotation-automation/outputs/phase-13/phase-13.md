# Phase 13: コミット・PR 作成【BLOCKED PLACEHOLDER】

## ⚠️ 必須宣言（冒頭）

**本 Phase は user 明示承認なしに `git commit` / `git push` / `gh pr create` を実行してはならない。** spec 段階ではアクションを起こさず、placeholder として手順を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | `blocked_pending_user_approval` |
| ブロック理由 | dual-hash window staging apply / Cloudflare Secrets 操作を伴うため、user 明示承認後にのみ実行 |
| 親 Issue | #555（CLOSED 維持 / reopen / close 操作禁止） |
| 親タスク | issue-516 (FU-01) |

## 実行禁止事項（spec 段階）

- [ ] `git commit`
- [ ] `git push`
- [ ] `gh pr create`
- [ ] `gh pr merge`
- [ ] `gh issue reopen 555` / `gh issue close 555`（CLOSED 維持）
- [ ] `--env production` への rotate-salt.sh 操作

## G1-G4 multi-stage approval gate

| Gate | 条件 | 検証コマンド / 確認方法 |
| --- | --- | --- |
| G1 | typecheck / lint PASS | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` exit 0 |
| G2 | vitest + shellcheck PASS | `mise exec -- pnpm --filter @ubm-hyogo/api test` + `shellcheck scripts/audit-correlation/rotate-salt.sh` 双方 exit 0 |
| G3 | staging runtime evidence + 親 FU-01 完了 | `outputs/phase-11/staging-evidence.md` / `dual-hash-grep-gate.log` / `high-alert-continuity.md` 実体配置 + `outputs/phase-11/upstream-fu01-status.log` で FU-01 完了確認 |
| G4 | user 明示承認 | "Phase 13 を実行してよい" / "PR 作成してよい" 等の明示 |

G1-G3 すべて満たし、かつ G4（user 明示承認）取得後にのみ以下手順を実行する。

## 変更対象ファイル一覧と種別（PR 同梱想定）

| ファイル | 種別 |
| --- | --- |
| `apps/api/src/audit-correlation/redact.ts` | 編集 |
| `apps/api/src/audit-correlation/correlate.ts` | 編集 |
| `apps/api/src/audit-correlation/__tests__/redact.test.ts` | 編集 |
| `apps/api/src/audit-correlation/__tests__/correlate.test.ts` | 編集 |
| `apps/api/src/audit-correlation/__tests__/fixtures/rotation/{baseline,dual-hash-window,post-rotation}.json` | 新規 |
| `scripts/audit-correlation/rotate-salt.sh` | 新規 / 編集 |
| `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` | 編集 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 編集 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 |
| `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/**` | 新規 / 編集 |
| `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md` | 書き換え（consumed marker） |

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
# 期待: feat/issue-555-audit-correlation-salt-rotation-automation

# 2) main 同期（CLAUDE.md 自律フロー準拠）
git fetch origin main
git checkout main && git merge --ff-only origin/main
git checkout feat/issue-555-audit-correlation-salt-rotation-automation
git merge main

# 3) ステージング（具体ファイル指定 / git add -A は避ける）
git add apps/api/src/audit-correlation/ \
        scripts/audit-correlation/ \
        .claude/skills/aiworkflow-requirements/references/audit-correlation.md \
        .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md \
        .claude/skills/aiworkflow-requirements/indexes/ \
        docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/ \
        docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md

# 4) commit
git commit -m "$(cat <<'EOF'
feat(api,infra): issue-555 AUDIT_CORRELATION_SALT rotation automation and fingerprintVersion=2 migration

- rotate-salt.sh で dry-run / apply / end-rotation の rotation 自動化
- redact() で dual-hash 期間中 v1 + v2 の fingerprintHashes を生成し fingerprintVersion=2 を導入
- correlate() で v1 / v2 の cross-version actor merge を実装
- vitest 4 ケース（dual-hash / single / rollback / cross-version merge）を追加
- aiworkflow-requirements SSOT (audit-correlation / secrets-management / topic-map / keywords) と consumed trace を反映
- staging で 7 日間 dual-hash window を実施し HIGH alert 連続性 ≥ 99% を確認

Refs: #555
Refs: #516

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 5) push
git push -u origin feat/issue-555-audit-correlation-salt-rotation-automation

# 6) PR 作成（base=dev）
gh pr create --base dev \
  --label priority:medium \
  --label type:security \
  --label scale:medium \
  --label area:api \
  --label area:infra \
  --title "feat(api,infra): issue-555 AUDIT_CORRELATION_SALT rotation automation and fingerprintVersion=2 migration" \
  --body "$(cat <<'EOF'
## Summary
- AUDIT_CORRELATION_SALT rotation を `scripts/audit-correlation/rotate-salt.sh` で自動化（dry-run / apply / end-rotation の 3 サブコマンド）
- dual-hash 機構を導入し fingerprintVersion=1 → 2 段階移行を実現（rotation 7 日間は v1 + v2 双方の hash を生成、cross-version で actor merge）
- staging のみスコープ。production rotation は本 PR の対象外（user gate 後の別タスク）

## Test plan
- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` で dual-hash / single / rollback / cross-version merge の 4 ケース PASS
- [ ] `shellcheck scripts/audit-correlation/rotate-salt.sh` exit 0
- [ ] staging で `--dry-run` / `--apply` / `--end-rotation` の各 evidence が `outputs/phase-11/` に存在
- [ ] dual-hash 期間中 `dual-hash-grep-gate.log` で v1 + v2 同居 record ≥ 1 件、end-rotation 後 48h で v1 新規 0 件
- [ ] HIGH alert 連続性 ≥ 99% を `high-alert-continuity.md` で証明
- [ ] salt 実値が docs / log / commit に一切残っていない

## Implementation guide
詳細は `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/outputs/phase-12/implementation-guide.md` を参照。

## Issue 状態
Issue #555 は CLOSED のまま運用する（reopen / close 操作なし）。本 PR は `Refs: #555` / `Refs: #516` で参照のみ。

Refs: #555
Refs: #516

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# 7) CI 確認
gh pr view --json number,url,statusCheckRollup
```

## ラベル運用ルール

| ラベル | Issue 側 | PR 側 |
| --- | --- | --- |
| `priority:medium` | 付与 | 付与（`--label priority:medium`） |
| `type:security` | 付与 | 付与（`--label type:security`） |
| `scale:medium` | 付与 | 付与（`--label scale:medium`） |
| `area:api` | 付与なし（Issue メタは Issue 側に集約） | 付与（`--label area:api`） |
| `area:infra` | 付与なし | 付与（`--label area:infra`） |
| `status:unassigned` | 付与（Issue メタ） | **付けない**（PR には付与しない） |

## Issue #555 の取扱い（厳守）

- Issue #555 は CLOSED のまま運用する（user 指示）
- 本 Phase で `gh issue reopen 555` / `gh issue close 555` / `gh issue edit 555 --add-label` 等の state 変更操作を**しない**
- PR 本文の `Refs: #555` は参照のみで、GitHub の自動 close キーワード（`Closes #555` / `Fixes #555`）は使用しない

## 検証コマンド

```bash
# Issue 状態 確認（commit 前後）
gh issue view 555 --json state,title
# 期待: state=CLOSED が変わっていない

# PR labels 確認
gh pr view --json labels
# 期待: priority:medium, type:security, scale:medium, area:api, area:infra
```

## 入力 / 出力 / 副作用

- 入力: G1-G3 evidence、user 明示承認
- 出力: PR URL、CI status
- 副作用: 本タスクのコード差分 / docs 差分が dev ブランチへの merge 候補となる。Cloudflare 環境への直接副作用はない（rotation は Phase 11 で完了済み）

## ロールバック

1. **PR 段階**: `gh pr close <PR>` + ブランチ削除
2. **merge 後**: revert commit を新規 PR で立てる（`--amend` / 履歴改変禁止）
3. **dual-hash window 中の rotation 不採用切替**: `AUDIT_CORRELATION_SALT=OLD` に戻し `AUDIT_CORRELATION_SALT_PREVIOUS` 削除（OLD で計算した v2 hash と従来 v1 hash が一致するため continuity 保持）

## DoD

- [ ] G1-G4 すべて満たした後に `gh pr create` 実行
- [ ] PR labels に `priority:medium` / `type:security` / `scale:medium` / `area:api` / `area:infra` が付与
- [ ] PR 本文に `Refs: #555` / `Refs: #516` が含まれる
- [ ] PR 本文に `Closes` / `Fixes` キーワードが**含まれない**（Issue CLOSED 維持）
- [ ] Issue #555 が CLOSED のまま（state 変更操作なし）
- [ ] salt 実値が PR 差分に含まれていない（grep 確認）
- [ ] PR 作成完了で本タスク終了

## Phase 13 ステータス

`blocked_pending_user_approval` を維持。G1-G4 全 gate 解除後にのみ上記手順を実行する。**PR 作成完了で本タスク終了**。
