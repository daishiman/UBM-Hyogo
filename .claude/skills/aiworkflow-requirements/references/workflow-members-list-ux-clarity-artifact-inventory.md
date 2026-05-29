# workflow-members-list-ux-clarity artifact inventory

| Type | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/members-list-ux-clarity/` |
| root artifacts | `docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json`, `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/artifacts.json` |
| phase 12 strict 7 | `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-12/` |
| implementation targets | `apps/web/src/components/public/{DensityToggle.client,MemberFilters.client,SelectedFiltersBar.client,SelectedTagsBar.client}.tsx`, `apps/web/src/components/ui/{Segmented,Search}.tsx`, `apps/web/app/(public)/members/page.tsx`, `apps/web/src/styles/legacy-public.css` |
| focused tests | `apps/web/src/components/public/__tests__/{DensityToggle.client,MemberFilters.client,SelectedTagsBar.client,SelectedFiltersBar.client}.spec.tsx` |

Status: `implemented_local_runtime_pending / implementation / VISUAL`.

## Lessons Learned

- **L-MLUC-001** parent + sub-workflow 構造で Phase 12 strict 7 を親 root へ集約する場合でも、sub-task root（`tasks/<task-id>/`）配下の `index.md` / `artifacts.json` は `verify:phase12-compliance` の `collectChangedWorkflowRoots` に独立 root として検出される。そのため sub-task ごとに canonical 9 heading 準拠の `outputs/phase-12/phase12-task-spec-compliance-check.md` を必ず配置し、Phase 12 strict 7 行は `status=n/a (parent root 集約)`、自身の compliance-check 行のみ `present` とする。
- **L-MLUC-002** Phase 11 evidence inventory の Status 列の許容 enum は `present` / `pending` / `n/a` の 3 値固定（`scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts` の `VALID_STATUSES`）。`present: 24 PNGs` 等の自由記述は `invalid status` として reject される。件数や注釈は Classification 列か Path 列に書く。
- **L-MLUC-003** Phase 11 evidence の Path は workflow root 配下に存在する**ファイル**でなければならない（ディレクトリ不可）。`relative(root, resolved)` が `..` を含むと reject されるため、sub-task から `../../../../outputs/phase-11/` 形式で親 evidence を参照する場合は `status=n/a` にして path 存在検査を skip させる。
- **L-MLUC-004** URL query 正本（`q`/`zone`/`status`/`sort`/`tag`/`density`）を維持することと、SelectedFilters chip の表示対象に含めることは別問題。`sort` は表示順であり絞り込みではないため chip 対象から除外する。AC-5 で「URL query をすべて chip 化」と読まれないよう、Phase 12 implementation-guide で明示する。
- **L-MLUC-005** `SegmentedOption` に `sublabel` / `describedBy` を optional prop として追加すれば、既存呼び出しサイト（`Segmented` を消費する他 component）を壊さずに `DensityToggle` の affordance（visually-hidden description / sublabel / HelpHint）を加法追加できる。OPTIONS const を SSOT にして button sublabel / hidden description / HelpHint 本文を派生させる。
- **L-MLUC-006** parent + sub-workflow を `completed-tasks/` へ移動するとき、`docs/30-workflows/unassigned-task/` 配下の関連 follow-up spec も `completed-tasks/<workflow>/unassigned-task-specs/` へ併合移動し、`outputs/phase-12/unassigned-task-detection.md` の path 列を新 path に sed 補修する。`docs/30-workflows/unassigned-task/` は active staging 用で、`completed-tasks/` に移動済の workflow からは参照されない。

