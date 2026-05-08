# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| Source | `outputs/phase-13/phase-13.md` |
| 状態 | blocked_pending_user_approval |

## 目的

commit / push / PR 作成手順を定義する（実行はユーザー承認後）。CLAUDE.md「PR 作成の完全自律フロー」に従う。

## 実行タスク

### 13.1 PR 作成前提

- base branch: **`dev`**（既定。`main` 直接は禁止）
- branch 名: `feat/issue-560-next-standalone-instrumentation-patch`
- title: `feat(web): issue-560 next standalone instrumentation patch pipeline + regression test`
- labels: `priority:medium type:improvement scale:medium area:testing`

### 13.2 G1-G4 multi-stage approval gate

| Gate | 条件 | evidence |
| --- | --- | --- |
| G1 | local regression PASS | `outputs/phase-9/quality-evidence.log` |
| G2 | build:cloudflare blocker acknowledged | `outputs/phase-9/build-cloudflare-evidence.log` |
| G3 | CI gate pass / fail evidence | GitHub Actions `pr-build-test.yml` run after push; local `outputs/phase-11/phase-11.md` records fail/pass fixture evidence |
| G4 | user 明示承認 | conversation log |

合算承認禁止。各 Gate を独立に通過させること。

### 13.3 PR 本文必須項目

- `Refs: #560`
- 親タスク参照（`task-03-w2-par-sentry-workers-sdk-unify`）
- 変更 summary（patch script / open-next 配線 / regression test / CI gate / RUN BOOK）
- evidence link（Phase 11 のファイルへの相対 path）
- スクリーンショット項目は **作らない**（NON_VISUAL）

### 13.4 commit message

`feat(web): add next standalone instrumentation patch pipeline + regression test (Refs #560)`

## 参照資料

- `CLAUDE.md`（PR 作成の完全自律フロー）
- `outputs/phase-11/phase-11.md`
- `outputs/phase-12/implementation-guide.md`

## 成果物

- `outputs/phase-13/phase-13.md`
- PR URL（作成後に追記）

## 完了条件

- G1〜G4 全 PASS 後に `gh pr create` を実行し PR 作成完了
- 本タスク close 条件: PR merge を以て workflow_state = `completed` とし、`completed-tasks/` への移送は別フローで実施
