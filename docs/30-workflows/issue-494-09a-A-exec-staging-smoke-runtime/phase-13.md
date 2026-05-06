# Phase 13: PR 作成 — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: 本 Phase は G4 承認後に実 PR を `gh pr create` で作成する副作用を伴い、CI gate（typecheck / lint / verify-indexes-up-to-date）通過まで watch する。CONST_004 により実 GitHub への副作用 + repo コミット成果物 → 実装仕様書扱い。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task id | UT-09A-A-EXEC-STAGING-SMOKE-001 |
| GitHub Issue | #494 |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| phase | 13 / 13 |
| wave | 9a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実行タスク

- [ ] G4 user approval 後にのみ commit / push / PR を実行する
- [ ] G1-G4 approval timestamp と PR URL / CI 結果を `outputs/phase-13/main.md` に記録する
- [ ] `--no-verify`、force-push、admin merge を使わず branch protection に従う

## 目的

G4 承認後に Phase 11 evidence + Phase 12 ドキュメント更新を 1 つの実行 PR にまとめ、Issue #494 にリンクして main へマージ可能な状態にする。本 Phase は親 spec phase-13.md の「実行 PR」契約を Issue #494 のスコープで実装する。

## 前提条件

- Phase 11 完了: 13 evidence が `$EVID/` 配下に保存済 + redaction grep 0 件
- Phase 12 完了: 7 ファイル更新済 + `artifacts.json` parity 成立 + `task-workflow-active.md` 昇格済
- G1-G3 承認 timestamp が `outputs/phase-13/main.md` に記録済
- G4 承認は本 Phase 冒頭で取得（Phase 11 G4 と同一発言で代替可・ただし `outputs/phase-13/main.md` には独立行で記録）

## commit 単位設計

以下 5 commit を順序固定で作成する（G4 承認時に 5 commit 戦略を提示し承認を得る。1 commit に集約する場合は G4 承認時に明示し承認を得る）:

| # | commit message（例）| 含める変更 |
| --- | --- | --- |
| 1 | `feat(09a-A): staging runtime evidence 13件取得 (Issue #494)` | `outputs/phase-11/evidence/` 配下 13 ファイル + redaction 確認 grep ログ |
| 2 | `docs(09a-A): outputs/phase-11/main.md を実測値で全置換` | `outputs/phase-11/main.md` の `NOT_EXECUTED` 全置換 |
| 3 | `docs(09a-A): phase-12 implementation-guide / compliance-check / changelog 更新` | `outputs/phase-12/implementation-guide.md` / `phase12-task-spec-compliance-check.md` / `documentation-changelog.md` |
| 4 | `chore(09a-A): artifacts.json parity 同期 (evidence=13)` | `artifacts.json` ↔ `outputs/artifacts.json` |
| 5 | `docs(09c): blocker を 09a-A 完了で更新 + skill index 昇格` | `task-09c-production-deploy-execution-001.md` + `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` + 本タスク `outputs/phase-12/main.md` / `outputs/phase-13/main.md` |

> **--no-verify 禁止**: 本タスクはコード変更を含まないため lefthook の pre-commit hook（lint / staged-task-dir-guard 等）は通過想定。失敗時は CLAUDE.md「PR作成の完全自律フロー」の自動修復に従い最大 3 回まで修復 commit を追加。`--no-verify` を付ける運用は本仕様書では禁止する。

## branch 戦略

- branch name: `feat/issue-494-09a-A-exec-staging-smoke-runtime`（または `feat/issue-494-09a-A-exec-staging-smoke-runtime` 互換）
- base: `main`
- branch protection 要件:
  - main: `required_pull_request_reviews=null` / `required_status_checks` 通過 / `required_linear_history=true` / `required_conversation_resolution=true` / force-push & 削除禁止
  - dev: 同上（Issue #494 は staging 限定なので main 直接 PR で問題ないが、ローカル運用で dev 経由する場合は dev → main の 2 段 PR 構成）

## PR 本文テンプレ

```
## Summary
- Issue #494 (UT-09A-A-EXEC-STAGING-SMOKE-001) を G1-G4 multi-stage approval gate のもと完遂
- ubm-hyogo-{api,web}-staging を deploy し、curl smoke / Playwright UI smoke / Forms sync / wrangler tail を実測
- 13 evidence を docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/ 配下に保存
- D1 schema parity (staging vs production) = diffCount=<N>
- 09c production deploy への blocker を「09a-A 完了済」に更新
- task-workflow-active.md の 09a-A 行を runtime_evidence_captured に昇格

## Approval gate 取得 timestamp 表
| Gate | approved_at (UTC) | approved_by | command_executed |
| --- | --- | --- | --- |
| G1 (api/web staging deploy) | <ISO8601> | <user> | bash scripts/cf.sh deploy --config apps/{api,web}/wrangler.toml --env staging |
| G2 (D1 migration apply) | <ISO8601 / N/A pending=0> | <user> | bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging |
| G3 (Forms sync) | <ISO8601> | <user> | curl POST /admin/forms/sync/{schema,responses} |
| G4 (blocker update commit & PR) | <ISO8601> | <user> | git commit / gh pr create |

> 合算承認・逆順実行は発生していない（自己監査済）。production 拡張は行っていない。

## 必須 evidence パス一覧（13 件）
1. preflight/cf-whoami.log
2. d1/d1-migrations-staging.log
3. d1/d1-migrations-prod.log
4. d1/d1-schema-parity.json
5. deploy/deploy-api-staging.log
6. deploy/deploy-web-staging.log
7. forms/forms-schema-sync.log
8. forms/forms-responses-sync.log
9. forms/sync-jobs-staging.json
10. forms/audit-log-staging.json
11. playwright/ (HTML report + trace)
12. screenshots/{public-members,login,me,admin}-staging.png (4 ファイル)
13. wrangler-tail/api-30min.log（または取得不能理由テンプレ）

すべて prefix: docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/

## 09c blocker 更新差分
- docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md
- 主要変更: 「blocker: 09a-A 未実測」→「blocker: 09a-A 完了済 (Issue #494) / 残課題: <列挙 or なし>」

## rollback 手順
- staging deploy: bash scripts/cf.sh rollback <旧VERSION_ID> --config apps/{api,web}/wrangler.toml --env staging
- D1 migration: backup-pre-migrate.sql から手動 restore（CLI rollback なし）
- Forms sync: 副作用は sync_jobs / audit_log への履歴追加のみ・rollback 不要
- 本 PR 自体: git revert <merge_sha>（main protection 上、force-push は使用しない）

## Test plan
- [ ] mise exec -- pnpm typecheck が成功
- [ ] mise exec -- pnpm lint が成功
- [ ] grep -RE 'NOT_EXECUTED|PASS_BOUNDARY_SYNCED_RUNTIME_PENDING' docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/ が 0
- [ ] secret / PII grep（Authorization / Bearer / メール正規表現）が 0
- [ ] artifacts.json ↔ outputs/artifacts.json の evidence 配列長が共に 13
- [ ] CI gate（typecheck / lint / verify-indexes-up-to-date）が green
- [ ] 4 staging screenshots が PR から閲覧可能

## Visual Evidence
[VISUAL_ON_EXECUTION]
- screenshots/public-members-staging.png
- screenshots/login-staging.png
- screenshots/me-staging.png
- screenshots/admin-staging.png

## 関連
- Issue: #494
- spec 確定 PR: #493
- 親 spec: docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/
- 後続: 09c production deploy execution

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## `gh pr create` コマンド例

```
gh pr create --base main --head feat/issue-494-09a-A-exec-staging-smoke-runtime \
  --title "feat(09a-A): staging deploy smoke 実測 evidence 13件取得 + 09c blocker 更新 (#494)" \
  --body "$(cat <<'EOF'
## Summary
... (上記テンプレ全文)
EOF
)"
```

## CI gate 待機方針

```
gh pr checks <PR_NUMBER> --watch
```

`required_status_checks`（typecheck / lint / verify-indexes-up-to-date 等）が green になるまで待機。失敗時は CLAUDE.md「PR作成の完全自律フロー」の「品質検証失敗時の自動修復」に従い、最大 3 回まで修復コミットを追加。**`--no-verify` / `--admin merge` は使用しない**。

## `outputs/phase-13/main.md` 記録フォーマット

`outputs/phase-13/main.md` には以下のテーブルとセクションを必ず置く（テンプレ skeleton は `outputs/phase-13/main.md` 雛形ファイル参照）:

```
## G1-G4 user approval timestamp 記録

| Gate | approved_at (UTC) | approved_by | user 発言原文（要約可・PII redacted）| command_executed | evidence_paths |
| --- | --- | --- | --- | --- | --- |
| G1 | <ISO8601> | <user handle> | "approve G1" | <full command> | $EVID/deploy/* |
| G2 | <ISO8601 / N/A> | <user handle> | "approve G2" / "skip G2 (pending=0)" | <full command> | $EVID/d1/* |
| G3 | <ISO8601> | <user handle> | "approve G3" | <full command> | $EVID/forms/* |
| G4 | <ISO8601> | <user handle> | "approve G4" | git commit / gh pr create | (PR URL) |

## 自己監査チェック（spec 制約）

- [ ] 合算承認なし（各 gate 直前で個別 approve を取得）
- [ ] 逆順実行なし（G1 → G2 → G3 → G4 の順序）
- [ ] production 拡張時の追加承認: 該当なし（staging 限定）／該当あり: <記録>
- [ ] redaction grep 0 件確認済

## PR URL
<gh pr create 出力の URL>

## CI gate 結果
<gh pr checks --watch 最終出力>
```

## 多角的チェック観点

- G1-G4 の独立承認 timestamp が PR 本文・`outputs/phase-13/main.md` の双方に記録されている
- `--no-verify` を使っていない（本仕様書はコード変更なしのため hook 通過想定）
- branch protection 要件（main / dev とも `required_pull_request_reviews=null` / status checks 通過 / 線形履歴 / force-push 禁止）に違反していない
- redaction grep 0 件が PR 本文 Test plan にチェックとして含まれている
- rollback 手順が PR 本文に明記されている

## サブタスク管理

- [ ] 5 commit 戦略（または 1 commit 集約）について G4 承認を取得
- [ ] commit を順序固定で作成（hook 通過確認）
- [ ] PR 本文テンプレを上記テンプレに従い埋める
- [ ] `gh pr create` 実行 → PR URL を `outputs/phase-13/main.md` に記録
- [ ] `gh pr checks --watch` で CI green 確認
- [ ] G1-G4 timestamp 表の 4 行すべてが埋まっていることを最終確認

## 成果物

- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-13/main.md`（G1-G4 timestamp 記録）
- 実行 PR URL（main ブランチに対する PR）

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み
- 5 commit（または承認済み 1 commit 集約）が main へ向けて push 済
- PR が `gh pr create` で作成され URL が記録されている
- CI gate green / Issue #494 のチェックリスト 13 項目がすべて済
- `outputs/phase-13/main.md` の G1-G4 timestamp 表 4 行が埋まっている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] `--no-verify` を使っていない
- [ ] CONST_007 違反（先送り）が発生していない
- [ ] G1-G4 承認の独立性・順序性が破られていない

## 参照資料

- 親 spec: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-13.md`
- CLAUDE.md「PR作成の完全自律フロー」
- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`
- GitHub Issue #494
- spec 確定 PR: #493
