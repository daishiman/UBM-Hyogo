# タスク仕様書: task-06b-c-profile-logged-in-runtime-evidence-execution-001

## メタ情報

```yaml
issue_number: 449
task_id: task-06b-c-profile-logged-in-runtime-evidence-execution-001
task_name: 06b-C /profile logged-in runtime evidence execution
category: 改善
target_feature: /profile logged-in visual evidence
priority: 高
scale: 小規模
status: promoted_to_workflow
source_phase: docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-03
dependencies: [06b-A-me-api-authjs-session-resolver, 06b-B-profile-self-service-request-ui, 09a-staging-smoke-runtime]
spec_path: docs/30-workflows/unassigned-task/task-06b-c-profile-logged-in-runtime-evidence-execution-001.md
promoted_workflow_path: docs/30-workflows/06b-c-runtime-evidence-execution/
promoted_date: 2026-05-04
```

---

## 目的

`06b-C-profile-logged-in-visual-evidence` で準備済みの Playwright spec と capture wrapper を、ユーザー承認済みの logged-in `storageState` と staging/local target に対して実行し、M-08 / M-09 / M-10 / M-16 の runtime evidence を Phase 11 に保存する。

## 背景

06b-C は `apps/web/playwright/tests/profile-readonly.spec.ts` と `scripts/capture-profile-evidence.sh` を追加し、Phase 12 strict 7 files まで整備済みである。一方、Phase 11 は `PENDING_RUNTIME_EVIDENCE` のままで、実スクリーンショットと DOM dump は未取得である。

この未タスクはアプリ実装の追加ではなく、既存の capture contract を実環境相当で閉じる実行タスクである。commit / push / PR 作成は含めない。

## 対象範囲

### Scope In

- logged-in `storageState` をローカルに用意し、secret / session 値を commit 対象に含めないことを確認する
- `scripts/capture-profile-evidence.sh --base-url <target> --storage-state <state>` を実行する
- `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/screenshots/` に M-08 / M-10 / M-16 screenshot を保存する
- `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/dom/` に M-09 / M-10 DOM evidence を保存する
- `manual-smoke-evidence.md` と Phase 12 `implementation-guide.md` を runtime 実測結果へ同期する

### Scope Out

- `/profile` 本文編集 UI の追加
- Auth.js / Magic Link / Google OAuth の新規実装
- production deploy
- commit / push / PR 作成

## 受け入れ条件

- M-08 logged-in `/profile` screenshot が desktop / mobile で保存されている
- M-09 no-form DOM evidence で本文編集 `form` / `textarea` / submit button が 0 件である
- M-10 `/profile?edit=true` ignored evidence が desktop / mobile で保存されている
- M-16 logout redirect または未ログイン境界の evidence が保存されている
- `manual-smoke-evidence.md` が `pending` から `captured` / `blocked` / `fail` のいずれかの実測状態へ更新されている
- session / token / cookie 値が git diff、docs、Issue body に露出していない

## 苦戦箇所

| ID | 内容 | 次回の簡潔解決 |
| --- | --- | --- |
| L-06BC-RUNTIME-001 | Playwright spec 作成と runtime evidence 取得を同じ完了状態に混ぜると、Phase 11 を誤って PASS 扱いしやすい。 | `implementation-prepared` と `runtime evidence captured` を別ステータスに分離し、Phase 11 は実ファイル数で判定する。 |
| L-06BC-RUNTIME-002 | logged-in `storageState` は必須だが secret 相当であり、capture 手順に含めると漏洩リスクがある。 | `.gitignore` と wrapper の existence check を先に確認し、Issue / docs には state path だけを書き値を記録しない。 |
| L-06BC-RUNTIME-003 | 旧 `02-application-implementation/...` と non-completed `06b-C...` の path drift により、証跡の保存先を間違えやすい。 | current canonical evidence root を `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/` に固定し、legacy stub は参照リンク専用にする。 |

## Phase 1-13 実行仕様

| Phase | 内容 | 成果物 |
| --- | --- | --- |
| 1 | 実行対象 URL / storageState / 承認境界を確認する | 実行メモ |
| 2 | evidence 保存先と redaction 方針を確認する | 保存先一覧 |
| 3 | command dry-run と production guard を確認する | dry-run log |
| 4 | Playwright 実行条件を確定する | 実行チェックリスト |
| 5 | capture wrapper を実行する | command log |
| 6 | screenshot / DOM evidence を検査する | evidence inventory |
| 7 | AC M-08 / M-09 / M-10 / M-16 を判定する | AC matrix |
| 8 | manual-smoke-evidence を同期する | 更新済み Phase 11 docs |
| 9 | secret 値が露出していないことを確認する | redaction check |
| 10 | 失敗時の再実行条件を整理する | retry notes |
| 11 | 実測結果を Phase 11 に保存する | screenshots / DOM dumps |
| 12 | implementation-guide / unassigned-task-detection を更新する | Phase 12 sync |
| 13 | ユーザー承認待ちの commit / PR 境界を記録する | blocked placeholder |

## 完了条件

- Phase 11 の runtime evidence が実ファイルとして存在する
- Phase 12 の実装ガイドが実測 command / output path / redaction 結果を含む
- GitHub Issue / task tracking は昇格先 `docs/30-workflows/06b-c-runtime-evidence-execution/` を正本にし、この未タスクは `promoted_to_workflow` として残す

## 昇格メモ（2026-05-04）

この未タスクは `docs/30-workflows/06b-c-runtime-evidence-execution/` に Phase 1-13 workflow として昇格済み。未タスクとしての二重実行は行わず、以後の実行・証跡・Phase 12 同期は昇格先 workflow を正本にする。
