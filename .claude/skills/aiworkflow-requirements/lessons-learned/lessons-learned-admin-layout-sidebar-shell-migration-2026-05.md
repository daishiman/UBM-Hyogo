# Lessons Learned — admin-layout-sidebar-shell-migration (2026-05)

`docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/` の実装サイクルで得た苦戦箇所を体系化する。
今後「spec_created → implementation の state drift」「同一 wave での scope 拡張」「Phase 12 doc の code sample と実装コードの乖離」
「child workflow が parent primitive を削除したときの cross-workflow stale reference」「storage 禁止制約による in-memory 制限」を
簡潔に解決するための原則を残す。

## L-ALSSM-001: scope 拡張で実装が走ったら state 伝播 SSOT セットを同一 wave で一括更新する

- **苦戦**: 本 workflow は `spec_created` として Phase 12 strict 7 を作成した後、ユーザー承認（CONST_009）で Task A/B/D + Task E 最小を一括実装した。
  しかし `index.md` frontmatter `workflow_state` / root+output `artifacts.json`（`workflow_state` + `phases[].state` + `metadata.gates`）/ Phase 12 strict 7 / aiworkflow ledger が `spec_created` のまま取り残され、`outputs/implementation-summary.md`（implementation complete）と全面的に矛盾していた。
- **原因**: 実装アクションと state 伝播アクションを別物として扱い、後者を省略した。workflow state の SSOT は index frontmatter だが、artifacts.json の `phases[].state` / `metadata.gates` も同じ事実の別表現であり、片方だけ更新すると semantic drift になる。
- **対策**: scope 拡張による実装開始時は、次の SSOT セットを **同一 wave で一括更新**する — (a) `index.md` frontmatter `workflow_state`、(b) root/output `artifacts.json`（`workflow_state` + `phases[].state` + `metadata.gates`）、(c) Phase 12 strict 7、(d) aiworkflow ledger（quick-reference / resource-map / task-workflow-active / artifact-inventory / changelog / LOGS / lessons-learned）。
- **検証の限界**: `verify:phase12-compliance` と `gate-metadata:validate` は **構造**（heading 存在 / strict 7 / status enum / gate schema）のみ検出し、**意味的矛盾**（spec_created doc vs implemented code）は検出しない。scope 拡張時は人手 or レビュー workflow で state 伝播を確認する。

## L-ALSSM-002: Phase 12 implementation-guide の code sample は実装完了直後に実ファイルから引き写す

- **苦戦**: Phase 12 implementation-guide の code sample が実コードと乖離していた（`session.user.isAdmin` 想定 vs 実装の `session.isAdmin`、`role` prop 想定 vs 実装の `activePath` + `mobileTriggerSlot`、`safeServerFetch` の戻り値が discriminated-union シグネチャ）。
- **原因**: sample を spec 執筆時点の予想コードとして固定化し、実装後の同期を省略した。doc の sample が実コードと乖離すると参照価値が落ちる。
- **対策**: implementation-guide の code sample は spec_created 時点では「予想形」と明示し、implementation 完了直後に実ファイルから引き写す。Phase 12 documentation-changelog に「code sample sync」を 1 行で記録する。

## L-ALSSM-003: child workflow が parent primitive を削除したら parent ledger の present-tense reference を同一 wave で補正する

- **苦戦**: 本 workflow で `apps/web/src/components/layout/AdminSidebar.tsx`（+ Brand/NavItem + tests 計 6 file）を削除したが、親 `unified-sidebar-shell-public-and-admin` の ledger に「current anchors `AdminSidebar.tsx`」の present-tense 記述が残るリスクがあった。
- **原因**: child workflow の物理削除が parent ledger の reference へ自動伝播しないため。
- **対策**: child workflow が primitive を削除 or 大幅移動したら、parent workflow の resource-map / quick-reference / task-workflow-active / artifact-inventory を grep し、**「current / 現行 anchor として実在を主張する present-tense 参照」**のみを「child で実装済み・旧 file 削除済 grep 0」へ補正する。
- **境界**: **dated 過去ワークフローエントリ**（例 quick-reference の `06c / 2026-04-29`、resource-map の `PARALLEL-01-NAV / 2026-05-15`、`UT-05A / 2026-05-03`）はその時点の implementation target を記録した point-in-time record であり、改変は履歴の改竄になるため触らない。stale 補正の対象は present-tense「current anchor」主張に限定する。

## L-ALSSM-004: artifacts.json の gates は `metadata.gates` 配下にのみ置く（top-level は non-normative）

- **苦戦**: Phase 12 gate validator（`gate-metadata:validate`）は `metadata.gates` 配下の gate structure のみ検証する。top-level に置いた gate は WARN skip され実質未検証状態になる。
- **対策**: artifacts.json の gates 記述位置を **`metadata.gates`** に限定する。Gate-A/B/C を `metadata.gates` 配下に `status`(enum: passed/pending) + `passed_at`(ISO) + `evidence_path` 付きで記述し、top-level 直下への追加は禁止する。validator が `[OK] ... Gate-X: passed (evidence ...)` を出すことを read-only で確認する。

## L-ALSSM-005: storage 禁止制約に当たった機能は in-memory に縮退し、永続化は別スコープ follow-up として Issue 紐付けする

- **苦戦**: sidebar collapse 状態を Web Storage に永続化する当初想定だったが、`scripts/lint-boundaries.mjs` が `localStorage`/`sessionStorage` トークンを forbidden（`apps/web/src` 使用例ゼロ）としているため、`useSidebarState.ts` を in-memory（session 単位）に限定した。
- **原因**: 永続化には storage 禁止制約を回避する cookie ベースの新方式（SSR/CSR 両対応・読み取り箇所追加）が必要で、本タスクの「layout 移行 + 旧 sidebar 削除」とは独立した別スコープ。今 wave に混入すると DOM contract 検証の焦点がぼやける。
- **対策**: 制約に当たった機能は機能上動作する最小形（in-memory）へ縮退し、永続化は CONST_008 に従いユーザー承認のうえ別 workflow / 別 Issue へ分離する。follow-up は `FU-<WORKFLOW>-<SEQ>: <desc>（**GitHub Issue #xxxx 起票済み**）` 形式で記録し、unassigned-task-detection / artifact-inventory / LOGS の follow-up 節すべてに Issue # を明記して追跡可能性を保つ。本件は **FU-ALSSM-001 / GitHub Issue #1024**（type:followup / priority:low / wave:2-plus / scale:small）。

## 関連リソース

- workflow root: `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/`
- artifact inventory: `.claude/skills/aiworkflow-requirements/references/workflow-admin-layout-sidebar-shell-migration-artifact-inventory.md`
- parent workflow: `docs/30-workflows/unified-sidebar-shell-public-and-admin/`
- skill feedback report: `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/phase-12/skill-feedback-report.md`
- follow-up: GitHub Issue #1024（FU-ALSSM-001 sidebar collapse 永続化・cookie 方式）
