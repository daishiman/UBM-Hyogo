---
task_id: ut-branch-flow-dev-staging-sync
title: feature → dev → main 運用フロー切替・dev/staging 同期確立
status: local_verified_remote_sync_pending_user_approval
priority: high
type: chore
implementation_class: 実装仕様書
taskType: implementation
visualEvidence: NON_VISUAL
workflow_state: local_verified
implementation_status: local_implementation_complete_remote_sync_pending
created: 2026-05-03
issue_number: TBD
---

# ut-branch-flow-dev-staging-sync

[実装区分: 実装仕様書]

## 実装区分の判定根拠

CONST_004 に基づき、本タスクは以下の点でコード変更（=リポジトリ管理ファイル変更）を伴うため、実装仕様書として作成する。

- `scripts/new-worktree.sh` の分岐元を `origin/main` → `origin/dev` に変更
- `CLAUDE.md` の PR 作成フロー記述を `main` → `dev` ターゲットに切替
- `.claude/commands/ai/diff-to-pr.md` の同期元・PR base を `main` → `dev` に切替
- `origin/dev` を `origin/main` 同期させる operational アクション（branch protection 一時緩和 → force-push → 復元、ユーザー承認ゲート）
- 既存コミット済タスク（`ut-05a-auth-ui-logout-button-001/`）の削除確定

## 目的

GitHub の運用フローを `feature/* → main` から `feature/* → dev → main` に切り替え、`dev` push で staging、`main` push で production が自動デプロイされる既存 CD パイプライン（`backend-ci.yml` / `web-cd.yml`）を機能させる。

## Phase Index

| Phase | File | Status |
| --- | --- | --- |
| Phase 1 | [phase-01.md](phase-01.md) | completed |
| Phase 2 | [phase-02.md](phase-02.md) | completed |
| Phase 3 | [phase-03.md](phase-03.md) | completed |
| Phase 4 | [phase-04.md](phase-04.md) | completed |
| Phase 5 | [phase-05.md](phase-05.md) | completed |
| Phase 6 | [phase-06.md](phase-06.md) | completed |
| Phase 7 | [phase-07.md](phase-07.md) | completed |
| Phase 8 | [phase-08.md](phase-08.md) | completed |
| Phase 9 | [phase-09.md](phase-09.md) | completed |
| Phase 10 | [phase-10.md](phase-10.md) | completed |
| Phase 11 | [phase-11.md](phase-11.md) | completed |
| Phase 12 | [phase-12.md](phase-12.md) | completed |
| Phase 13 | [phase-13.md](phase-13.md) | blocked_until_user_approval |

| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |

## スコープ

- 含む: `origin/dev` 同期、関連 docs / scripts 更新、本リポジトリ向けタスク仕様書作成、PR 作成テンプレート作成（`feat/branch-flow-dev-sync` → `dev`）
- 含まない: 別ブランチでの実作業、production cutover（dev → main PR は別タスク）

## DoD

- `origin/dev` head が `origin/main` head と一致
- `bash scripts/new-worktree.sh feat/x` で `origin/dev` から worktree が生成される
- `CLAUDE.md` PR 作成フローが `dev` ターゲットになっている
- `gh pr create` のデフォルト base が `dev`
- `feat/branch-flow-dev-sync` → `dev` の PR テンプレートが作成済（実 PR はユーザー明示指示後）
- PR がマージされ `dev` push で `backend-ci` / `web-cd` の `deploy-staging` job が成功（Phase 13 後続確認）

## 状態境界

- 本タスクのローカル実装・仕様書・正本同期は `local_verified / local_implementation_complete_remote_sync_pending`。
- 2026-05-03 review 時点の実測では `origin/main...origin/dev = 8 0` で、remote `dev` は current `main` より 8 commits 遅れている。`origin/dev == origin/main` は未完了であり、ユーザー承認後の remote mutation として扱う。
- `git commit` / `git push` / `gh pr create` はユーザー明示指示まで実行しない。
- dev → main 昇格と production deploy 確認は本タスクの範囲外で、別 release タスクの承認ゲートに置く。

## 関連

- `.github/workflows/backend-ci.yml`（dev → staging deploy）
- `.github/workflows/web-cd.yml`（dev → staging deploy）
- 親ブランチ戦略: CLAUDE.md「ブランチ戦略」セクション
