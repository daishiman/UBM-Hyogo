# Phase 13: PR 作成（user 承認後のみ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 12（ドキュメント更新完了） |
| 下流 | - |
| 状態 | blocked |
| user_approval_required | **true** |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |
| 元タスク | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/` |

## 最重要ルール（冒頭で明示）

> **user の明示承認なしに `git commit` / `git push` / `gh pr create` を実行しない。**
>
> - 「PR を作って」「commit して」と user が明示した場合のみ着手
> - それまでは Phase 13 は **`blocked`** のまま維持
> - 自動コミット禁止・auto-push 禁止・force push 禁止
> - `--no-verify` で hook をスキップしない（pre-commit hook は CLAUDE.md ルールにより main / dev への直接コミットを block する設計）

## 目的

Phase 12 までの成果物と実機反映ログを、user の明示承認後にだけ commit / PR 化できる状態へ整理する。
承認がない間は `blocked` を維持し、PR description と local check の準備だけを行う。

## 前提条件

- Phase 12 の 7 成果物が揃い、`phase12_completed` が同期済み
- `outputs/phase-11/manual-smoke-log.md` の主証跡が記録済み（NON_VISUAL）
- 元タスク `skill-feedback-report.md` に「U1 反映完了」追記済み（AC-9）
- pre-commit hook（`lefthook.yml` 配下）が有効（`pnpm install` 経由で `lefthook install` が走っている）

## ブランチ戦略（CLAUDE.md 準拠）

```
feature/* --PR--> dev --PR--> main
```

| ブランチ | 用途 | 直接 commit |
| --- | --- | --- |
| `feat/issue-140-claude-code-permissions-apply-001` | 本タスク作業ブランチ（命名例） | OK |
| `dev` | staging | **禁止**（pre-commit hook が block） |
| `main` | production | **禁止**（pre-commit hook が block） |

ブランチ命名例:
- `feat/issue-140-claude-code-permissions-apply-001`
- `feat/claude-code-permissions-apply-001`

## 事前チェック

- [ ] Phase 12 の 7 成果物が `outputs/phase-12/` に揃う
- [ ] artifacts.json が JSON valid かつ `phase12_completed` 同期済み
- [ ] `git status` で意図したファイルのみ stage 候補（`.env` / `*.bak.<TS>` / token を含むファイルは含まない）
- [ ] secrets 混入 0 件（grep で API token / OAuth token / `.env` 実値を再走査）
- [ ] 現在ブランチが `main` / `dev` でない（hook で block されるが事前確認）
- [ ] `bash scripts/cf.sh whoami` 等の Cloudflare 実認証情報を **commit 対象に含めていない**

## PR description テンプレート

```markdown
## Summary
- task-claude-code-permissions-apply-001（issue #140）の Phase 1-13 仕様書を追加
- 元タスク `task-claude-code-permissions-decisive-mode` の設計を host 環境（settings 3 層 + cc alias）へ反映
- E-1: settings 階層の `defaultMode` を `bypassPermissions` で統一（実反映済）
- E-2: `cc` alias を `--dangerously-skip-permissions` 併用に正準化（実反映済）
- E-3: project `permissions.allow` / `deny` whitelist 整備（実反映済）
- 主証跡は `outputs/phase-11/manual-smoke-log.md`（NON_VISUAL：UI 変更ゼロ）

## Test plan
- [ ] phase-01〜phase-13.md と outputs/phase-XX/ の主成果物が揃う
- [ ] artifacts.json が JSON valid かつ index.md と同期
- [ ] TC-01〜TC-05 / TC-F-01〜TC-F-02 / TC-R-01 の判定が manual-smoke-log.md に記録済
- [ ] secrets 混入 0 件（API token / OAuth / .env 実値）
- [ ] backup 4 ファイル（settings ×3 + zshrc ×1）の取得記録が backup-manifest.md にある
- [ ] 元タスク skill-feedback-report.md に「U1 反映完了」追記済（AC-9）

## Risk
- グローバル `~/.claude/settings.json` 変更は他 project / 他 worktree に波及（Phase 3 R-1 で評価済）
- `--dangerously-skip-permissions` + `permissions.deny` の実効性は前提タスク結論に依存
- pre-commit hook の主担保は CI gate / linear history / force-push 禁止（solo 開発・必須レビュアー 0）

## Rollback
- `outputs/phase-05/backup-manifest.md` の `*.bak.<TS>` 4 ファイルから復元
- runbook: `outputs/phase-05/runbook-execution-log.md` 末尾の rollback 手順
- PR 単位の rollback は `git revert <merge-commit>`

## Linked issue
closes #140
```

> 上記は **草案テンプレート**。user 承認時に実際の差分・smoke 結果に合わせて更新する。

## 実行手順（user 承認後のみ）

1. **承認確認**: user から「PR を作って」等の明示承認文言を得る
2. **ブランチ確認**: `git rev-parse --abbrev-ref HEAD` が `feat/...` 系であること
3. **stage 範囲確認**: `git status` で本タスクディレクトリ + 元タスク `skill-feedback-report.md` 追記分のみ
4. **secrets 再走査**:
   ```bash
   git diff --cached | grep -E '(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|CLOUDFLARE_API_TOKEN=|op://)' && echo NG || echo OK
   ```
5. **commit**（HEREDOC で本文整形）:
   ```bash
   git commit -m "$(cat <<'EOF'
   feat(claude-code): apply bypassPermissions across settings hierarchy and cc alias

   - settings 3 層の defaultMode を bypassPermissions で統一
   - cc alias を --dangerously-skip-permissions 併用に正準化
   - project permissions whitelist を設計どおり整備
   - manual smoke (TC-01..TC-R-01) を outputs/phase-11 に記録 (NON_VISUAL)

   closes #140
   EOF
   )"
   ```
6. **push**: `git push -u origin feat/issue-140-claude-code-permissions-apply-001`
7. **PR 作成**: `gh pr create --base dev --title "..." --body "$(cat <<'EOF' ... EOF)"`
8. **CI 確認**: `gh pr checks` で required status checks が PASS
9. **review-gate-criteria に従い merge 可否を判定**

## 参照スキル / ドキュメント

- `.claude/skills/task-specification-creator/references/review-gate-criteria.md`（merge ゲート基準）
- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`
- CLAUDE.md「ブランチ戦略」「Git hook の方針」セクション
- `lefthook.yml`（pre-commit hook 正本）

## 禁止事項（再掲）

- user 承認なしの auto commit / auto push / auto PR
- `git push --force` to `main` / `dev`
- `--no-verify` での hook スキップ
- `main` / `dev` への直接 commit（pre-commit hook が block するが、bypass しない）
- 1Password 参照ではなく **平文 token** を commit する
- `~/Library/Preferences/.wrangler/config/default.toml` を commit に混入させる

## 主成果物

なし（artifacts.json の `phases[12].outputs` は空配列）。
PR description は本ドキュメントのテンプレートを正本とし、ファイル化はしない。

## 完了条件

- [ ] user 承認が記録されている（チャットログ / commit message / PR description のいずれか）
- [ ] PR がオープンされ、`closes #140` が body に含まれる
- [ ] CI required status checks が PASS
- [ ] secrets 混入 0 件（PR diff に対して再走査）
- [ ] base ブランチが `dev`（直 main 禁止）

## 依存 Phase

- 上流: Phase 12（7 成果物 + ledger 同期完了）
- 上流（user）: 明示承認
- 下流: なし

## 想定 SubAgent / 並列性

- 単一 agent で直列実行
- user 承認待ちは block 状態として明示

## ゲート判定基準

- user 承認 ✅ かつ Phase 12 完了条件 ALL PASS ✅ → Phase 13 着手 Go
- いずれか欠ける → `blocked` のまま
- CI FAIL → 修正 commit を **新規追加**（amend / force push 禁止）

## リスクと対策

| リスク | 対策 |
| --- | --- |
| user 承認前の auto commit | 冒頭最重要ルールで明示・本ドキュメント全体で繰り返し |
| `main` / `dev` への直接 commit | pre-commit hook（`lefthook.yml`）で物理 block・本タスクで bypass しない |
| secrets 混入 | stage 直前に grep 再走査・PR diff にも再走査 |
| amend / force push でレビュー履歴喪失 | 修正は **新規 commit** で対応（CLAUDE.md 準拠） |
| base ブランチ間違い（main 直 PR） | `gh pr create --base dev` 固定運用 |
| Cloudflare token 等の OAuth ファイル混入 | `.gitignore` 確認 + grep `op://` / `CLOUDFLARE_API_TOKEN=` |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
