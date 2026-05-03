# Phase 13: PR 作成（Refs #198）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成（Refs #198） |
| 作成日 | 2026-05-02 |
| 前 Phase | 12 (実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback) |
| 次 Phase | なし（最終 Phase） |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |
| Issue | #198（CLOSED, 2026-05-02 — クローズドのまま docs spec 提供） |

## 目的

`.claude/commands/ai/diff-to-pr.md` の手順に従い、本タスクの全 Phase 成果物（`_design/sync-jobs-spec.md` / 03a 03b 参照差し替え / `database-schema.md` 参照化 / Phase 9-13 仕様書）を 1 本の PR に集約する。Issue #198 は CLOSED だが docs spec の提供のため `Refs #198` を本文に含める。Cloudflare 操作（`scripts/cf.sh`）はゼロ。スクリーンショットは添付しない（NON_VISUAL）。ユーザー明示指示前は push / PR 作成しない（コマンド列の記述に留める）。

## 実行タスク

1. PR 作成前のチェック（変更一覧 / コミット境界 / `pnpm typecheck` / `pnpm lint`）
2. ローカル `main` の `origin/main` 同期および作業ブランチへの merge（コンフリクトは CLAUDE.md の既定方針で解消）
3. PR タイトル / 本文の整形（`outputs/phase-12/implementation-guide.md` 主要見出しを反映）
4. `Refs #198` を本文に含める
5. ユーザー明示指示があった時点で push / `gh pr create` を実行

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/commands/ai/diff-to-pr.md | PR 作成手順の正本 |
| 必須 | outputs/phase-12/implementation-guide.md | PR 本文の主要見出し |
| 必須 | outputs/phase-12/documentation-changelog.md | 変更ファイル一覧 |
| 必須 | outputs/phase-09/indexes-rebuild.log | indexes drift 解消 evidence |
| 推奨 | CLAUDE.md（PR作成の完全自律フロー節） | コンフリクト解消既定方針 |

## 実行手順（ステップ別）

### ステップ 1: 事前チェック

```bash
git status --porcelain
git diff main...HEAD --name-only
mise exec -- pnpm indexes:rebuild
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/03b-followup-005-sync-jobs-design-spec
```

`git status --porcelain` の差分が意図した docs / skill reference / indexes に限定され、PR に含めるファイル一覧が `git diff main...HEAD --name-only` で取得できることを確認。`pnpm typecheck` / `pnpm lint` は implementation の任意 evidence とし、必須 gate にはしない。

### ステップ 2: main 同期

```bash
git fetch origin main
git checkout main && git merge --ff-only origin/main
git checkout -
git merge main
```

コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」表に従う。docs ファイル / `pnpm-lock.yaml` の取り扱いに従い解消。

### ステップ 3: PR 本文の整形

PR タイトル:

```
docs(issue-198): aggregate sync_jobs spec to _design/sync-jobs-spec.md
```

PR 本文構成（`outputs/phase-12/implementation-guide.md` の主要見出しを反映）:

```markdown
## Summary

- `docs/30-workflows/_design/sync-jobs-spec.md` を新規作成し、`sync_jobs` テーブルの `job_type` enum / `metrics_json` schema / lock TTL（10 分）を集約
- 03a / 03b の task spec を `_design/sync-jobs-spec.md` への参照差分に置き換え、定義の重複を解消
- `.claude/skills/aiworkflow-requirements/references/database-schema.md` の `sync_jobs` 節を `_design/` 参照に更新し、`mise exec -- pnpm indexes:rebuild` で drift を解消

## Implementation Guide 反映

- Part 1（中学生レベル）: sync_jobs の役割 / 正本集約の意味 / PII 不混入 / lock TTL 10 分
- Part 2（技術者レベル）: 正本性 / 03a・03b 参照差し替え / database-schema.md 同期 / verify-indexes CI gate
- Step 1-A/B/C: aiworkflow-requirements skill の `database-schema.md` 同期手順

## Test plan

- [ ] `mise exec -- pnpm typecheck` が green
- [ ] `mise exec -- pnpm lint` が green
- [ ] `mise exec -- pnpm indexes:rebuild` 後に `git status --porcelain` が空
- [ ] CI `verify-indexes-up-to-date` job が green
- [ ] `rg -n "_design/sync-jobs-spec\.md" docs/30-workflows .claude/skills` で 03a / 03b / database-schema.md からの参照が確認できる

Refs #198

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

スクリーンショットセクションは作らない（NON_VISUAL）。

### ステップ 4: PR 作成コマンド（ユーザー明示指示後にのみ実行）

```bash
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"

gh pr create --title "docs(issue-198): aggregate sync_jobs spec to _design/sync-jobs-spec.md" --body "$(cat <<'EOF'
## Summary

- docs/30-workflows/_design/sync-jobs-spec.md を新規作成し、sync_jobs の job_type enum / metrics_json schema / lock TTL（10 分）を集約
- 03a / 03b の task spec を _design/sync-jobs-spec.md への参照差分に置き換え、定義の重複を解消
- .claude/skills/aiworkflow-requirements/references/database-schema.md の sync_jobs 節を _design/ 参照に更新し、indexes drift を解消

## Implementation Guide 反映

- Part 1（中学生レベル）: sync_jobs の役割 / 正本集約の意味 / PII 不混入 / lock TTL 10 分
- Part 2（技術者レベル）: 正本性 / 03a・03b 参照差し替え / database-schema.md 同期 / verify-indexes CI gate
- Step 1-A/B/C: aiworkflow-requirements skill の database-schema.md 同期手順

## Test plan

- [ ] mise exec -- pnpm typecheck が green
- [ ] mise exec -- pnpm lint が green
- [ ] mise exec -- pnpm indexes:rebuild 後に git status --porcelain が空
- [ ] CI verify-indexes-up-to-date job が green
- [ ] rg -n "_design/sync-jobs-spec\.md" docs/30-workflows .claude/skills で 03a / 03b / database-schema.md からの参照が確認できる

Refs #198

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

> ⚠️ ユーザーから明示指示がない限り、本ステップ（push / `gh pr create`）は **実行しない**。コマンド列を `outputs/phase-13/main.md` に転記し、レビュー後に実行する。

### ステップ 5: PR URL の記録

PR 作成完了後、URL / ブランチ名 / コミット SHA を `outputs/phase-13/pr-evidence.md` に記録する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | Phase 13 総括 + 実行コマンド列 |
| ドキュメント | outputs/phase-13/pr-body.md | PR 本文の最終形 |
| ドキュメント | outputs/phase-13/pr-evidence.md | PR URL / ブランチ / コミット SHA |
| メタ | artifacts.json | Phase 13 を completed に更新（PR 作成後） |

## 完了条件

- [ ] PR タイトルが `docs(issue-198): aggregate sync_jobs spec to _design/sync-jobs-spec.md` である
- [ ] PR 本文に `Refs #198` が含まれている
- [ ] PR 本文に `outputs/phase-12/implementation-guide.md` の主要見出し（Part 1 / Part 2 / Step 1-A/B/C）が反映されている
- [ ] スクリーンショットセクションが本文にない（NON_VISUAL）
- [ ] `pnpm typecheck` / `pnpm lint` が green
- [ ] CI `verify-indexes-up-to-date` job が green
- [ ] PR URL / ブランチ / コミット SHA が `pr-evidence.md` に記録されている

## DoD（implementation / NON_VISUAL）

- PR が `Refs #198` 付きで作成済み（または、ユーザー指示前ならコマンド列が `main.md` に整っている）
- Cloudflare 操作（`scripts/cf.sh`）を一切実行していない
- スクリーンショットの添付や参照がない（NON_VISUAL）
- 本タスク全 13 Phase の成果物が `outputs/phase-XX/` 配下に揃っている

## 次 Phase

- なし（本タスク最終 Phase）
- close-out 後の残課題は `outputs/phase-12/unassigned-task-detection.md` で別 follow-up へ引き継ぐ
- ブロック条件: CI red / typecheck・lint fail / `Refs #198` 欠落 / スクリーンショット混入
