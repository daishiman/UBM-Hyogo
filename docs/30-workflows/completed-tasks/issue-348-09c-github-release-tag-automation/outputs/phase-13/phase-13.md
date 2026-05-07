# Phase 13: コミット・PR 作成【BLOCKED PLACEHOLDER】

## ⚠️ 必須宣言（冒頭）

**本 Phase は user 明示承認なしに `git commit` / `git push` / `gh pr create` を実行してはならない。** spec 段階ではアクションを起こさず、placeholder として手順を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 状態 | **blocked_pending_user_approval** |
| ブロック理由 | release 自動作成は GitHub 上に副作用を持つ workflow を新規追加する。PR merge 後に本番 tag push で trigger されるため、user 明示承認後にのみ commit / push / PR を実行する |
| 親 Issue | #348 (CLOSED) — **CLOSED のまま運用 / 再オープン禁止** |

## 実行禁止事項（spec 段階）

本ファイルは user 承認前の placeholder であり、以下のアクションを **絶対に実行してはならない**:

- [ ] `git commit`
- [ ] `git push`
- [ ] `gh pr create`
- [ ] `gh pr merge`
- [ ] `gh release create`（本番 tag への apply）
- [ ] `git tag v*` を本番ブランチで打つこと

## 実行解放条件（すべて満たした後のみ進行）

- [ ] Phase 1 GO 判定が記録
- [ ] Phase 5 で `scripts/release/*.sh` 3 ファイル + `release-notes.template.md` が実体配置
- [ ] Phase 7 で `.github/workflows/release-create.yml` が実体配置
- [ ] Phase 8 で `docs/runbooks/release-create.md` が実体配置
- [ ] Phase 9 で SSOT (`.claude/skills/aiworkflow-requirements/references/release-runbook.md`) と indexes 更新
- [ ] Phase 10 bats / actionlint / shellcheck PASS
- [ ] Phase 11 NON_VISUAL evidence 3 ファイルすべて実体配置（user gate 解除済）
- [ ] Phase 12 6 必須成果物 + compliance check PASS
- [ ] **user 明示承認**（"Phase 13 を実行してよい" / "PR 作成してよい" 等）

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
# 期待: feat/issue-348-09c-github-release-tag-automation

# 2) ステージング（具体ファイル指定 / git add -A は避ける）
git add docs/30-workflows/issue-348-09c-github-release-tag-automation/ \
        scripts/release/release-notes.template.md \
        scripts/release/generate-release-notes.sh \
        scripts/release/create-github-release.sh \
        scripts/release/__tests__/generate-release-notes.bats \
        .github/workflows/release-create.yml \
        docs/runbooks/release-create.md \
        .claude/skills/aiworkflow-requirements/references/release-runbook.md \
        .claude/skills/aiworkflow-requirements/indexes/

# 3) commit
git commit -m "$(cat <<'EOF'
feat(release): issue-348 09c release tag からの GitHub Release 自動作成

- scripts/release/ に release note 生成 / gh release create ラッパーを新規追加
- .github/workflows/release-create.yml で tag push / workflow_dispatch 起動の 2 トリガ対応
- tag format (vYYYYMMDD-HHMM) / template placeholder 全置換 / dry-run 決定論性を bats で保証
- actionlint / shellcheck clean
- docs/runbooks/release-create.md に manual fallback 手順を整備
- aiworkflow-requirements SSOT (release-runbook.md) と indexes に反映

Refs: #348

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 4) push（解放条件をすべて満たした後にのみ実行）
git push -u origin feat/issue-348-09c-github-release-tag-automation

# 5) PR 作成（index.md claudeCodeContext と完全一致 / status:unassigned は付けない）
gh pr create --base main \
  --label priority:medium \
  --label scale:small \
  --title "feat(release): issue-348 09c release tag からの GitHub Release 自動作成" \
  --body "$(cat <<'EOF'
## Summary
- Issue #348 (CLOSED) に対する 09c release tag → GitHub Release 自動作成
- `scripts/release/generate-release-notes.sh` が Phase 12 changelog と Phase 11 evidence URL を入力に release note 本文を決定論的に組み立て
- `scripts/release/create-github-release.sh` が tag 検証 → dry-run → apply の 3 段ゲートを実装
- `.github/workflows/release-create.yml` が tag push / workflow_dispatch の 2 トリガで自動起動
- aiworkflow-requirements SSOT (`release-runbook.md`) と indexes に反映済

## Test plan
- [ ] bats（8 TC）/ actionlint / shellcheck がすべて PASS
- [ ] 既存 tag に対する `--draft` release 作成が成功し、`gh release view --json` の body が dry-run dump と一致
- [ ] dry-run の決定論性（同一入力 → diff 空）を確認
- [ ] manual fallback runbook で同等の release 作成が再現可能

## Implementation guide
詳細は `docs/30-workflows/issue-348-09c-github-release-tag-automation/outputs/phase-12/implementation-guide.md` を参照。

Refs: #348

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# 6) CI 確認
gh pr view --json number,url,statusCheckRollup
```

## ラベル運用ルール（重要）

| ラベル | Issue 側 | PR 側 |
| --- | --- | --- |
| `priority:medium` | 付与 | 付与（`--label priority:medium`） |
| `scale:small` | 付与 | 付与（`--label scale:small`） |
| `status:unassigned` | 付与（Issue メタ） | **付けない**（PR には付与しない） |

`gh pr create` の `--label` 引数には `priority:medium` / `scale:small` のみを渡す。

## Issue 状態運用

- Issue #348 は **CLOSED のまま運用**（再オープン禁止）
- PR merge 後も Issue は CLOSED のまま。本仕様書群は historical traceability のための後追いドキュメント
- PR 本文末尾に `Refs: #348`（`Closes` / `Fixes` は使わない）

## ロールバック（PR merge 後 / release 作成失敗時）

1. **draft release 削除**: `gh release delete <tag> --yes`（draft 段階での誤作成時）
2. **published release 削除**: `gh release delete <tag> --yes` 後、必要なら `git tag -d <tag>` + `git push --delete origin <tag>`
3. **workflow 自体の disable**: `.github/workflows/release-create.yml` を `on: workflow_dispatch:` のみに緊急縮退する PR を別途作成

## Phase 13 ステータス

`blocked_pending_user_approval` を維持。user 明示承認後にのみ上記手順を実行する。**PR 作成完了で本タスク終了**。
