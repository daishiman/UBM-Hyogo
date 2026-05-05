# Issue #355 OpenNext Workers CD Cutover Lessons (2026-05)

## Scope

Workflow: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/`

Task type: `spec_created / implementation / NON_VISUAL / deploy-deferred`

Source: `outputs/phase-12/skill-feedback-report.md` F-1〜F-5、`outputs/phase-12/system-spec-update-summary.md`、`outputs/phase-12/unassigned-task-detection.md`

## Lessons

### L-355-001: Deploy-deferred implementation pattern must separate Design GO from Runtime GO

- Symptom: `taskType=implementation` であっても、`.github/workflows/web-cd.yml` 改修や Cloudflare deploy を本spec waveで実行できないケースで、Phase 11 を runtime PASS と誤認しがち。
- Cause: implementation / NON_VISUAL / deploy-deferred の三重条件で、設計判定と runtime 判定を同列に扱った。
- Recurrence condition: CD cutover、custom domain移譲、destructive cleanup を含む spec が deploy 権限を持たない wave で書かれるとき。
- 5-minute resolution: Phase 11 declared outputs を `PENDING_IMPLEMENTATION_FOLLOW_UP` evidence contract として実体化し、Phase 7 は `OK/PASS` ではなく `COVERED_BY_PLANNED_TEST` / `gate defined / pending follow-up execution` を使う。Phase 13 declared files は commit / push / PR / deploy 禁止の blocked placeholder として配置する。
- Evidence path: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/outputs/phase-12/skill-feedback-report.md` F-1

### L-355-002: Cloudflare rollback readiness は VERSION_ID と Pages dormant の二段で扱う

- Symptom: Workers cutover後に rollback options を Pages 即削除で失う、もしくは VERSION_ID 履歴の append-only 規約を逸脱する。
- Cause: rollback readiness を「Workers 旧 VERSION_ID への巻き戻し」のみで設計し、Pages project の dormant 保持を含めなかった。
- Recurrence condition: Pages → Workers のような配信形態切替を伴う cutover で、cleanup を同 wave に詰め込もうとするとき。
- 5-minute resolution: VERSION_ID append-only（`bash scripts/cf.sh rollback <ID>` 経路）と Pages dormant（observation period 経過後の `task-issue-355-pages-project-delete-after-dormant-001.md` で別承認削除）の二段戦略を Phase 11 / Phase 13 に明示する。destructive cleanup は cutover と同 wave 禁止。
- Evidence path: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/outputs/phase-12/unassigned-task-detection.md` U-3, `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md`

### L-355-003: CLOSED Issue は reopen せず spec_created workflow を fork する

- Symptom: 過去 CLOSED Issue（#355）に紐づく追加仕様が必要になったとき、Issue を reopen して history を汚す、もしくは `Closes #355` で履歴整合を壊す。
- Cause: Issue lifecycle と spec workflow lifecycle を 1:1 と仮定した。
- Recurrence condition: CLOSED Issue から派生する後続 spec / implementation follow-up を扱うとき（特に CD / governance 系）。
- 5-minute resolution: CLOSED Issue は **reopen しない**。新spec workflow root を `docs/30-workflows/<topic>-task-spec/` に作成し、PR description / commit message では `Refs #355` のみを使い `Closes #355` は禁止。実 implementation follow-up は新規 Issue で fork するか、既存 unassigned task に委譲する。
- Evidence path: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/index.md`, `outputs/phase-13/main.md`

### L-355-004: aiworkflow-requirements 同期は PASS_BOUNDARY_SYNCED_RUNTIME_PENDING で境界を明示する

- Symptom: spec wave で aiworkflow-requirements の current fact を昇格してしまい、実 deploy 完了前に「runtime PASS」を主張する stale contract が生まれる。
- Cause: `same-wave sync applied` を `final fact promotion` と混同した。
- Recurrence condition: deploy / migration / destructive cleanup を含む spec workflow で、indexes 同期を一括完了させようとするとき。
- 5-minute resolution: workflow root / index pointers / unassigned task pointers のみ同 wave 同期し、最終 current fact 昇格は implementation follow-up 完了時に延期する `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 分類を Phase 12 判定で使う。同期対象は (1) `references/task-workflow-active.md`, (2) `indexes/resource-map.md`, (3) `indexes/quick-reference.md`, (4) 関連 unassigned task 行 のみに限定する。
- Evidence path: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/outputs/phase-12/system-spec-update-summary.md` Step 2

### L-355-005: Phase 1 既実装状態調査 (P50) は CD cutover で主要価値になる

- Symptom: CD cutover spec の Phase 1 で「あるべき姿」だけを書き、現状の `web-cd.yml` / `wrangler.toml` / Pages project / custom domain 状態を調査しないため、cutover 差分が見えない。
- Cause: Phase 1 を要件定義のみと誤認し、現状調査を Phase 5 以降の runbook に押し込んだ。
- Recurrence condition: 既存 production resource の置換系 spec（CD topology、deploy target、auth provider 切替）。
- 5-minute resolution: Phase 1 で `web-cd.yml` の現行 deploy step、`wrangler.toml` の OpenNext 形式、Pages project の active / dormant 状態、custom domain 配信先、observability sink の現状を **既実装状態 (P50)** として明示する。これを欠くと Phase 5 cutover-runbook の差分が抽象化される。
- Evidence path: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/outputs/phase-01/main.md`, `outputs/phase-12/skill-feedback-report.md` F-2

## Downstream boundaries

- 実 `.github/workflows/web-cd.yml` Workers deploy 置換、staging / production deploy、Phase 11 実測 evidence 取得は `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` が owner。
- Pages project 物理削除（destructive cleanup）は `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md` が owner、observation period 後 user 明示承認で実行。
- Pages 由来 Logpush observability の切替は `UT-06-FU-A-logpush-target-diff-script-001` および route inventory 系列が owner。
- Web CD と API CD の job structure / approval gate 整合 review は UT-29 系列に委譲。
