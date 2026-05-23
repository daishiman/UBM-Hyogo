# Lessons Learned: runtime screenshot evidence replacement (issue-819 / step-05)

step-05 admin dashboard chart implementation (`v2026.05.18`) は SVG bar chart の component-test PASS と「16x16 / 445 byte の dummy PNG 2 枚」で Phase 11 evidence inventory を PASS させていた。Issue #819 は dummy PNG を authenticated admin runtime screenshot に置換する execution workflow として spec_created したが、進める過程で「inventory PASS と content quality FAIL の分離」「closed Issue の evidence boundary」「parent / source の chain mutation」など、後続が同じ罠を踏まないための知見が複数得られた。

## L-RSE-001: dummy small-byte PNG は inventory PASS と content quality FAIL を分離するリスクを必ず Acceptance Criteria で閉じる

step-05 親 workflow は `admin-dashboard-placeholder.png` / `admin-dashboard-chart.png` を「ファイル存在」だけで Phase 11 evidence inventory を PASS させていた。実体は 16x16 / 445 byte の dummy で、`evidence existence validator` は通っても visual content として無意味だった。issue-819 ではこれを補正するため AC-3 に「個別 ≤ 500KB かつ **200x100 以上** (16x16 dummy ではない)」を明示した。

**Why:** Phase 11 evidence existence validator (issue-730) はファイル存在 / size>0 までしか担保しない。「実装意図と合致する PNG か」は別 gate を要し、AC で明文化しなければ後続 review で見逃される。

**How to apply:** VISUAL_ON_EXECUTION タスクの Acceptance Criteria に screenshot を含む場合は、必ず「最小 width x height」「最小 byte 数」「視認できる UI 要素」の 3 条件を AC レベルで宣言する。task-specification-creator の Phase 1 / 4 テンプレに「screenshot content quality AC」項目を組み込み、`screenshot-plan.json` の `expectedMinDimensions` schema と突合できるようにする。dummy PNG (16x16 / 1x1 等) は inventory PASS 後も `evidence_state: DUMMY_PNG_PRESENT_RUNTIME_PENDING` として artifacts.json に明示する。

## L-RSE-002: closed Issue の evidence 取得 follow-up は `closed-issue-canonical-workflow-recovery` パターンに従う

Issue #819 は GitHub 上で closed のまま「実体未完了 (dummy PNG)」状態だった。通常なら reopen するが、ユーザー指示で closed 維持・Refs 参照のみで進める方針となった。lesson-20260516-closed-issue-canonical-workflow-absence の延長で、closed Issue を canonical workflow 化する際は `source_issue_state: closed` / `source_issue_state_note` を artifacts.json に必ず明記し、PR 文脈は `Closes #N` ではなく `Refs #N` を強制する。

**Why:** GitHub の Issue close 状態と workflow 実体状態が乖離している場合、`Closes #N` で再 close を発生させると Issue 通知 / 監査ログのノイズになる。`Refs #N` なら link を保ったまま state mutation を起こさない。

**How to apply:** artifacts.json schema に `source_issue_state` (closed/open) / `source_issue_state_note` を必須化し、closed の場合は PR template の `Closes` 行を `Refs` に書き換える gate を verify-pr-ready に追加する候補。`closed-issue-canonical-workflow-recovery` パターンは resource-map / topic-map から再検索できるよう keyword を `keywords.json` に登録済み。

## L-RSE-003: source unassigned-task の status は `consumed (by <canonical_workflow>, <date>)` で更新する

issue-819 は `docs/30-workflows/unassigned-task/step-05-followup-001-admin-dashboard-runtime-screenshot-capture.md` を source とする。実 screenshot 取得完了時点で source unassigned を `consumed (by issue-819-admin-dashboard-runtime-screenshot, 2026-05-20)` に更新し、canonical workflow link を必須項目とする。link 抜けで consumed 化すると、後続が source を再度 spec 化する重複が起こる。

**Why:** unassigned-task は次世代の workflow 候補プールであり、consumed 化リンクが切れると同じ要件が 2 重起票される。`physical deletion 2-stage` (task-specification-creator) と整合させる必要がある。

**How to apply:** Phase 12 `unassigned-task-detection.md` に「source consumed update checklist」を必ず置き、canonical workflow 相対 path + ISO date を含める。`verify:phase12-compliance` gate に「source unassigned consumed link 存在」check を追加する候補。move 先は `docs/30-workflows/unassigned-task/completed-tasks/` 配下に統一する。

## L-RSE-004: Playwright runtime screenshot 用 spec は Phase 11 evidence の一部として tracked 必須

issue-819 の `apps/web/playwright/tests/issue-819-status-distribution.spec.ts` は runtime screenshot capture を駆動する正本 spec だが、untracked のままだと「evidence 取得手段が外部依存」になり、後続が再現できない。Phase 11 artifact inventory に `Phase 11 Playwright spec` 行を必ず追加し、git tracked 状態を inventory で確認できるようにする。

**Why:** screenshot は実行結果 (PNG) だけが evidence ではなく、「どの spec が何の condition で生成したか」も evidence の一部。spec が untracked / deleted だと evidence chain が切断し、再撮影時に divergence が発生する。

**How to apply:** VISUAL_ON_EXECUTION 系タスクの artifact-inventory.md には必ず `Phase 11 Playwright spec` 行を入れ、`apps/web/playwright/tests/<task-slug>*.spec.ts` を絶対 path で参照する。task-specification-creator の Phase 11 テンプレに同行を組み込み済みであることを確認する。mock api 拡張も同様に「runtime_only」status で inventory に明示する。

## L-RSE-005: 子 workflow の workflow_state は PNG 置換完了時点で再分類する

issue-819 は spec_created 段階では `workflow_state: spec_created` / `evidence_state: DUMMY_PNG_PRESENT_RUNTIME_PENDING` だが、実 PNG 置換 + 親 evidence 更新 + source consumed 化が完了した時点で、子側を `implemented_runtime_evidence_captured` 相当に再分類し、親側 step-05 を `runtime_completed` に更新する 2 段 mutation が必要。state vocabulary に gate ルールとして追加候補。

**Why:** 親子 workflow の state が独立すると、resource-map / quick-reference の検索で「親は VISUAL_ON_EXECUTION 完了 / 子は spec_created」のような誤読が起き、後続が「親はまだ runtime 未完」と誤判定する。state mutation を atomic に表現する語彙が必要。

**How to apply:** task-specification-creator の state-vocabulary references に `implemented_runtime_evidence_captured` を正式語として登録し、子 workflow が完了したら親側を `runtime_completed` に同 wave で更新する gate を `verify:phase12-compliance` の親子 chain check に組み込む候補。本パターンは parallel-02 close-out (`VISUAL_RUNTIME_PENDING` 導入) と同列の語彙拡張として追跡する。
