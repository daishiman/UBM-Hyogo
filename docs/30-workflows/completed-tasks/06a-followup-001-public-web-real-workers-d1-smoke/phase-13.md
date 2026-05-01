# Phase 13: PR 作成

## 目的

Phase 1〜12 で生成した仕様書ファイル群を、user 承認 gate を通したうえで feature ブランチへ commit し、push して PR を作成する。**コード実装・migration・実 smoke 実行は伴わない**。本 PR はあくまで spec_created 段階の Markdown PR である。

## ユーザー承認 gate

- Phase 13 の commit / push / PR 作成は **user の明示的 GO 指示後にのみ実行**する。
- spec ファイル群が AC / outputs / index.md と整合していることを Phase 12 compliance check で確認済みであることが前提。
- 本タスクは Issue #273（CLOSED）由来であり、Issue 再オープンは行わない。PR 本文は `Refs #273` 固定。

## commit 粒度の方針

solo 開発ポリシー / リニア履歴運用に従い、以下の粒度で 1〜3 コミットに分割する。

| グループ | 含めるファイル | コミットメッセージ案 |
| --- | --- | --- |
| 1 | index.md / artifacts.json / phase-01〜10.md / 対応 outputs | `docs(06a-followup-001): add phase 1-10 spec for real workers d1 smoke (Refs #273)` |
| 2 | phase-11.md / outputs/phase-11（evidence/ ディレクトリ含む） | `docs(06a-followup-001): add phase 11 manual smoke spec (Refs #273)` |
| 3 | phase-12.md / phase-13.md / outputs/phase-12 / outputs/phase-13 | `docs(06a-followup-001): add phase 12-13 doc update and pr template (Refs #273)` |

> 1 コミットに集約しても良い。重要なのは `Refs #273` 表記と `Closes #273` 不使用、および `--no-verify` を使わないこと。

## push & PR 作成順序

1. `git status` / `git diff` / `git log -n 5` で変更内容と直近コミットスタイルを確認（read-only）
2. user GO を受領
3. 必要に応じて `git checkout -b feature/06a-followup-001-public-web-real-workers-d1-smoke`
4. `git add <仕様書ファイルのみを明示>` — `git add -A` / `git add .` は使わない
5. `git commit -m "$(cat <<'EOF' ... EOF\n)"` で HEREDOC 経由
6. `git push -u origin <branch>`
7. `gh pr create` で PR 作成（template は `outputs/phase-13/pr-template.md` を流用）
8. `gh pr view --json url` 等で URL を user に返却

## 禁止事項（再掲）

- `wrangler` 直接実行（必ず `bash scripts/cf.sh` 経由）
- `git commit --no-verify` / `git push --no-verify`
- `git commit --amend`（新規 commit を作る方針）
- `Closes #273` の使用（Issue は CLOSED 維持）
- Issue #273 再オープンを示唆する記述
- 実 secret 値・Cloudflare API token・D1 database ID の commit
- `.env` 内容の cat / Read

## 完了条件

- `outputs/phase-13/local-check-result.md` が placeholder（spec 段階の typecheck/lint/vitest 観点記載）として存在
- `outputs/phase-13/change-summary.md` に変更ファイル一覧が記載済み
- `outputs/phase-13/pr-template.md` が `Refs #273` 表記で完成
- user 承認後、PR URL が返却済み
- CI（branch protection 必須 status check）が green に到達

## 失敗時の対応

- pre-commit hook 失敗時: 原因を修正し **新規コミット**で再 commit（amend 禁止）
- CI fail 時: 失敗ジョブログを確認し、別コミットで修正 push（force push 禁止）
- いずれの場合も Issue #273 を再オープンしない

## CI gate との関係

- branch protection の `required_status_checks` には typecheck / lint / build / verify-indexes-up-to-date 等が含まれる想定。仕様書のみ変更でも上記は走るため、push 前に local check を通すこと。
- `verify-indexes-up-to-date` は `.claude/skills/aiworkflow-requirements/indexes` の drift を検知する。本 PR では skill 改修を行わないため drift は発生しない想定。

## ブランチ戦略との整合

- 本 PR は feature ブランチ → `dev` または `main` への通常 PR。CLAUDE.md のブランチ戦略どおり solo 運用ポリシー（必須レビュアー数 0 / CI gate のみ保護）に従う。
- `required_status_checks` / `required_linear_history` / `required_conversation_resolution` を満たすように push 前に local check を通す。
- force push / `--no-verify` 使用は禁止。

## 仕様書の整合性最終確認（push 前）

- [ ] index.md outputs リストと実体ファイルが一致（Phase 11 actual evidence は planned evidence として除外）
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` が Phase 12 required files 7/7 OK
- [ ] `wrangler` 直接呼び出し例が仕様書内に存在しない
- [ ] 実 secret 値 / Cloudflare API token / D1 database ID が含まれていない
- [ ] `Closes #273` 表記が含まれていない（`Refs #273` のみ）
- [ ] Issue #273 再オープンを示唆する記述が含まれていない

## 次フェーズ（PR マージ後）

- spec_created → executed への移行は別タスク化。`outputs/phase-12/system-spec-update-summary.md` の pending を解除する PR を別途切る。
- Phase 11 evidence の実ログ・screenshot 保存は smoke 実行時にコミット。
- 後続 PR でも `Refs #273` 表記を維持し、Issue 再オープンは行わない。

## メタ情報

- workflow: `06a-followup-001-public-web-real-workers-d1-smoke`
- phase: 13
- status: `spec_created / pending`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 実行タスク

- local-check-result と change-summary を確認する
- ユーザー承認後に PR template を使用する

## 参照資料

- `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md`
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物

- `outputs/phase-13/main.md`

