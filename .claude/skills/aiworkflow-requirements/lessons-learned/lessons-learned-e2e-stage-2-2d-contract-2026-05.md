# E2E Stage 2 Sub-task 2d Contract Test 実装教訓（2026-05）

## 対象

- workflow: `docs/30-workflows/completed-tasks/e2e-stage-2-2d-contract-stage-2/`
- 起案ブランチ: `feat/e2e-stage-2-2d-contract-spec`
- source unassigned task: `docs/30-workflows/completed-tasks/e2e-stage-2-2d-contract-stage-2-001.md`
- 同期 changelog: `.claude/skills/aiworkflow-requirements/changelog/20260510-e2e-stage-2-2d-contract.md`
- artifact inventory: `references/workflow-e2e-stage-2-2d-contract-artifact-inventory.md`
- 親 workflow: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/`

## Lessons

### L-E2E2D-001: 親 workflow の response shape 記載が正本と乖離していたケース

- **状況**: 親 workflow `phase-4.md` §1 Q2 / `phase-5.md` §4 は `MergeIdentityResponseZ` の shape を `{ targetMemberId, sourceMemberId, mergedAt }` と記述していたが、shared 正本 `packages/shared/src/schemas/identity-conflict.ts` および route 実装は `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` を返す。古い記述に従って fixture / contract test を書くと runtime と乖離する。
- **学び**: contract test 系の sub-task では「親 workflow doc」と「shared schema 実体 + route 実装」が衝突したとき、**必ず shared schema 実体 + route 実装を正本**として fixture / type を組む。親 workflow の古い記述は consumed trace としては残し、Phase 12 の `system-spec-update-summary.md` で「正本境界」を明示する。
- **再発防止**: shared schema が `as const` / zod export を持つときは、test 内で `z.object(` を**新規定義しない**こと（CONST_007 schema 重複禁止）。`packages/shared` から import するか、route 内 schema を named export 化して import する。
- **関連 refs**: `outputs/phase-12/implementation-guide.md` Part 2 第 1 項、`outputs/phase-12/system-spec-update-summary.md` 正本境界節

### L-E2E2D-002: response shape が zod 未 export な場合の type-level 同型 fallback

- **状況**: route から返す response のうち、zod schema として export されていない shape は contract test 側で `z.object(` を新規定義せず、かつ runtime parse もできない。CONST_007（schema 重複禁止）と pure unit test という前提の両立が必要。
- **学び**: 対象 shape の zod export が無い場合は `expectTypeOf<typeof fixture>().toMatchTypeOf<RouteReturnType>()` で **type-level 同型を assert する fallback** を使う。runtime parse は無くなるが、fixture と route 戻り型の structural match は型検査で担保できる。
- **再発防止**: 横展開（2a/2b/2c など同種 contract test 化）の際は、まず shared schema export → 次に route named export → どちらも無理なら `expectTypeOf` fallback、の優先順序で選択する。
- **関連 refs**: `outputs/phase-12/implementation-guide.md` Part 2 第 3 項

### L-E2E2D-003: route 内 schema の named export 化で CONST_007 を満たす最小差分パターン

- **状況**: `apps/api/src/routes/admin/{member-delete,requests,audit}.ts` の入力 schema は route 内に inline 定義されており、contract test から import できなかった。shared 昇格は本タスクの目的（contract drift gate 化）に対して過剰であり、PR 範囲が広がる。
- **学び**: route 内 schema を **named export** 化するだけで、`DeleteBodyZ` / `ListRequestsQueryZ` / `ListAuditQueryZ` のように route から直接 import できる。route 内部の参照識別子は不変、+1 字句〜+1 行の最小差分で済む。response 側は `satisfies` チェックを route 内で同時に行うことで、route runtime semantics を変えずに contract を固定できる。
- **再発防止**: 「shared 昇格 vs route inline」で迷ったときの判定基準は、**他 route / 他 package が同じ shape を共有するか**。共有しないなら route named export で十分（YAGNI）。共有する時点で `packages/shared` に昇格する。
- **関連 refs**: `outputs/phase-12/implementation-guide.md` Part 2 第 2 項・第 4 項、`outputs/phase-12/unassigned-task-detection.md`

### L-E2E2D-004: pure unit contract test の workflow_state は runtime 概念を持たない

- **状況**: 親 Stage 2 系の他 sub-task は staging runtime evidence を Phase 11 で要求し、`spec_verified_pending_dependency` → `implemented_runtime_evidence_captured` のような遷移を持つ。contract test は DB / network / FS / Cloudflare binding に一切触れない pure unit のため、staging runtime という概念が存在しない。
- **学び**: pure unit の場合は **local focused Vitest pass = canonical pass**。`workflow_state = implemented_local_evidence_captured` / `evidence_state = PASS_LOCAL_CANONICAL` で Phase 12 を確定し、runtime evidence セクションを Phase 11 で作らない（placeholder すら作らない）。
- **再発防止**: workflow 起案時に `coverageTier` と `requires_runtime_evidence` を Phase 1 で明示し、pure unit の場合は Phase 11 evidence inventory から runtime 系項目を除外する。
- **関連 refs**: `outputs/phase-12/main.md` Four-Condition Verdict、`outputs/phase-12/phase12-task-spec-compliance-check.md` Phase 11 Evidence File Inventory

### L-E2E2D-005: 親 workflow が completed-tasks へ移動済みでも contract drift gate は新規 workflow として起案する

- **状況**: 親 `e2e-quality-uplift-stage-2` は既に `completed-tasks/` に移動済み。その後 contract drift を gate するための新規 sub-task が発生したが、completed 配下を編集すべきか新規 workflow を起案すべきか曖昧だった。
- **学び**: completed-tasks 配下は consumed trace として **read-only**。drift gate のような後続 task は `docs/30-workflows/<new-workflow-slug>/` として新規起案し、source unassigned task からの consumed trace と、親 completed workflow への参照 link を両方持たせる。aiworkflow-requirements 側には新 workflow 用の changelog + artifact inventory + active guide entry を **same-wave** で追加する。Phase 12 PASS で新 workflow 自身が完成した時点で `docs/30-workflows/completed-tasks/<new-workflow-slug>/` へ移動し、artifact inventory / resource-map / quick-reference / task-workflow-active のパスも `completed-tasks/` 配下へ同一 wave で書き換える（drift を残さない）。
- **再発防止**: 新 workflow slug は `<親 workflow slug>-<phase-or-aspect>` で命名し、artifact inventory に「親 completed workflow への参照」と「source unassigned task への consumed trace」を必ず記載する。
- **関連 refs**: `references/workflow-e2e-stage-2-2d-contract-artifact-inventory.md`、`docs/30-workflows/completed-tasks/e2e-stage-2-2d-contract-stage-2-001.md` の consumed trace
