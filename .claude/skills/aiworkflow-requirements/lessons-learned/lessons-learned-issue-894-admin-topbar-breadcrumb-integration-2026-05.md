# Lessons Learned — issue-894 admin topbar breadcrumb integration (2026-05)

`docs/30-workflows/completed-tasks/issue-894-admin-topbar-breadcrumb-integration/` の実装サイクルで得た苦戦箇所を体系化する。将来「topbar / page-local の二重表示」「Issue state drift」「strict 7 欠落」「primitive ownership 越境」を簡潔に解決するための原則を残す。

## L-I894-001: Issue state は `gh issue view` で実測してから spec を書く

- **苦戦**: spec ヘッダの Issue 状態が `OPEN` のまま、GitHub 側は CLOSED。Phase 12 で初めて検出した。
- **原因**: spec 起票時の Issue 状態をローカル要約に固定化し、再検証していなかった。
- **対策**: requirements / artifacts / phase-12-compliance のいずれかに Issue 状態を書く場合、`gh issue view <num> --json state,number,title` の出力を evidence として `outputs/phase-11/evidence/` に保存し、CLOSED の場合は PR 文脈を `Refs #<num>` に固定する。

## L-I894-002: 「primary consumer だけ」と書いた scope は直接 consumer を漏らす

- **苦戦**: 初版 scope は `AdminPageHeader` 経由のみに見えていたが、`apps/web/app/(admin)/admin/**/page.tsx` の page-local `Breadcrumb` 直接呼び出しが残っていた。
- **原因**: 抽象化された wrapper をスコープ単位として扱い、primitive 直接呼び出しを別軸として数えていなかった。
- **対策**: UI primitive 移管タスクでは、(a) wrapper 経由、(b) primitive 直接呼び出しの 2 軸で grep gate を引く。grep 0 hit を Phase 11 evidence に固定し、追加 consumer が将来再発しても CI で検出できる状態にする。

## L-I894-003: flat root の Phase 1-13 ワークフローも `outputs/phase-12/` strict 7 が必須

- **苦戦**: flat root（`phase-XX-*.md` を root 直下に置く方式）でも verifier は `outputs/phase-12/` 配下の strict 7 を期待する。両方揃えないと `verify:phase12-compliance` が fail する。
- **原因**: root 直下の `phase-12-compliance-check.md` だけで完結すると誤認した。
- **対策**: flat root workflow でも `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` を必ず生成する。`task-specification-creator/references/phase-12-spec.md` の strict 7 規定に従う。

## L-I894-004: closeout で `completed-tasks/` 移動した直後は aiworkflow 参照を全 grep で再点検する

- **苦戦**: aiworkflow の `quick-reference.md` / `resource-map.md` / `task-workflow-active.md` / `LOGS/_legacy.md` / artifact inventory / changelog の path 参照を、closeout 移動と同一 wave で更新する必要がある。1 ファイル落とすと stale 参照になる。
- **原因**: 「dir 移動」と「参照更新」が別アクションになっていて、漏れに気づきにくい。
- **対策**: 移動直後に `grep -rn "docs/30-workflows/<task>" .claude docs | grep -v "completed-tasks/<task>"` を実行し、0 hit を確認するまで closeout を完了扱いしない。`feedback_stale_ref_grep_filepath_gotcha.md` のとおり、filepath マッチで自分自身を巻き込まないよう `-l` ではなく `-n` を使い content だけ判定する。

## L-I894-005: Breadcrumb primitive の「final item = current span」契約は primitive 側の spec で固定する

- **苦戦**: AdminTopbar が root「管理」を current span として所有する場合、page-local Breadcrumb の最終 item も current span として render される必要があった。layout 側だけで検証すると primitive のリファクタリングで容易に崩れる。
- **原因**: primitive contract が暗黙のままで、consumer 側の spec が contract の唯一の証拠だった。
- **対策**: `apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx` で「最終 item は `<span aria-current="page">`、非最終 item は anchor」という primitive 契約を直接アサートする。consumer 側 spec（`apps/web/app/(admin)/layout.spec.tsx`）は wiring を、primitive 側 spec は contract を、と責務分離する。

## 関連リソース

- workflow root: `docs/30-workflows/completed-tasks/issue-894-admin-topbar-breadcrumb-integration/`
- artifact inventory: [[workflow-issue-894-admin-topbar-breadcrumb-integration-artifact-inventory]]
- changelog: `.claude/skills/aiworkflow-requirements/changelog/20260525-issue894-admin-topbar-breadcrumb-integration.md`
- parent: `docs/30-workflows/completed-tasks/parallel-03-followup-001-admin-topbar-primitive-extraction/`
