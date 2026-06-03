# Phase 12: ドキュメント同期

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 12 / 13 |
| 名称 | ドキュメント同期 |
| spec_classification | implementation_spec |
| task_type | implementation |
| visual_category | VISUAL |
| implementation_mode | new |
| workflow_state | implemented_local_evidence_captured |
| status | completed（implemented_local_evidence_captured タスクの Phase 12 close-out 記録として完了）|
| created_at | 2026-06-02 |

> 本タスクは **implemented_local_evidence_captured**。実コードは本サイクルで実装済み。Phase 12 は implemented_local_evidence_captured UI task の close-out ルールに従い、Step 1-A〜1-C を「N/A」にせず **implemented_local_evidence_captured を記録**する（completed ではない）。commit / PR / screenshot は user-gated（Phase 13 blocked）。

## 目的

C1〜C4 の 4 concern を解消する Phase 1-13 実装仕様書が完成した段階で、以下を 1 wave で同期・記録する。

1. 実装ガイド（中学生レベル概念説明 + 技術者レベル差分）を `outputs/phase-12/implementation-guide.md` に作成する。
2. system spec 更新判定（Step 1-A/1-B/1-C/Step 2）を記録する。本タスクは UI 挙動修正で aiworkflow-requirements 正本への新規型追加なし → Step 2 は N/A。
3. ドキュメント更新履歴（全 Step 結果・該当なしも明記）を workflow-local 同期と global skill sync の別ブロックで記録する。
4. 未タスク検出（0 件でも必須出力）。Phase 3 MINOR の TECH-M-02（外側クリック listener の汎用 hook 化 `useDismissable` 抽出）を未タスク候補として記載する。
5. skill feedback（改善点なしでも必須出力）。
6. Phase 12 タスク仕様準拠チェック（root evidence）を作成する。

## 実行タスク

| Task | 成果物 | 内容 | 状態 |
|------|--------|------|------|
| Task 12-1 | `outputs/phase-12/implementation-guide.md` | Part1 中学生レベル概念説明（日常の例え話・専門用語なし）+ Part2 技術者レベル（型/className 差分/CSS 差分/listener API）+ `## 視覚証跡`（Phase 11 screenshot-plan 参照）| [x] 作成済 |
| Task 12-2 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A（完了タスク記録 → implemented_local_evidence_captured 記録）/ 1-B（実装状況 implemented_local_evidence_captured）/ 1-C（関連タスク）/ Step 2（新規 I/F → N/A）| [x] 作成済 |
| Task 12-3 | `outputs/phase-12/documentation-changelog.md` | 全 Step 結果を個別記載（該当なしも明記）。ブロック A=workflow-local 同期 / ブロック B=global skill sync | [x] 作成済 |
| Task 12-4 | `outputs/phase-12/unassigned-task-detection.md` | current / baseline 分離 + 関連タスク差分確認。TECH-M-02 を未タスク候補として記載（0 件でも必須出力）| [x] 作成済 |
| Task 12-5 | `outputs/phase-12/skill-feedback-report.md` | テンプレート / ワークフロー / ドキュメント観点（改善点なしでも必須出力）| [x] 作成済 |
| Task 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | root evidence。Phase 1-13 存在・必須成果物・canonical 見出し・Phase11 evidence・Changed-files 分類・workflow_state 整合・Skill 同期・Runtime 境界・Archive-delete gate を検証 | [x] 作成済 |

## 参照資料

- Phase 1（要件・inventory・AC）/ Phase 2（C1-C4 設計）/ Phase 3（設計レビュー PASS・MINOR 3 件）
- `index.md`（4 concern 根本原因テーブル・AC-1〜AC-6・scope）
- `artifacts.json`（status=implemented_local_evidence_captured / gates A passed・B/C pending / phase 13 blocked）
- 参照フォーマット: `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/outputs/phase-12/`
- `.claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md`
- `apps/web/src/lib/is-browser.ts`（`browserDocument()`）/ `apps/web/src/styles/tokens.css`（`--shell-*`）

## 実行手順

1. Phase 1-3 の確定設計（C1-C4 / AC / 不変条件 I-1〜I-8）を正本として読み込む。
2. implementation-guide.md を Part1/Part2/視覚証跡の 3 部構成で作成する（コードは差分提示のみ・実コードは編集しない）。
3. system-spec-update-summary.md に Step 1-A/1-B/1-C を implemented_local_evidence_captured として記録し、Step 2 を N/A 判定する。
4. documentation-changelog.md に全 Step を 2 ブロックで記録する。
5. unassigned-task-detection.md を current / baseline 分離で作成し、TECH-M-02 を未タスク候補に記載する。
6. skill-feedback-report.md を 3 観点で作成する。
7. phase12-task-spec-compliance-check.md（root evidence）を canonical 9 セクションで作成する。
8. commit / PR / screenshot は実施しない（Phase 13 blocked / user-gated）。

## 統合テスト連携

- 本 Phase はドキュメント同期のため統合テスト実走なし（implemented_local_evidence_captured 段階）。
- 実装サイクルで実走する targeted vitest（Phase 4 list の `SidebarShell.spec` / `SidebarUserMenu.spec` / `SidebarNavItem.spec` / `(public)/layout.spec` / `PublicFooter.spec`）が AC-1〜AC-4 を保護する設計を Phase 4-9 で確定済みであることのみ参照記録する。

## 多角的チェック観点（AIが判断）

- **責務境界**: Phase 12 はドキュメント生成のみ。実コード（apps/web）には触れない（implemented_local_evidence_captured を維持）。
- **整合性**: 6 成果物の状態語彙を `implemented_local_evidence_captured` で統一。artifacts.json の gates（A passed=spec presence / B,C pending）と矛盾させない。
- **後方互換**: 新規型追加なし → aiworkflow-requirements 正本（API/IPC/状態管理契約）更新は N/A。
- **追跡可能性**: Phase 3 MINOR（TECH-M-01/02/03）の処遇を Phase 12 で明示（M-01/M-03 は実装 Phase 内解決・M-02 は未タスク候補）。

## サブタスク管理

| 成果物 | 担当 concern | 状態 |
|--------|-------------|------|
| implementation-guide.md | C1/C2/C3/C4 全体 | [x] |
| system-spec-update-summary.md | 全体 | [x] |
| documentation-changelog.md | 全体 | [x] |
| unassigned-task-detection.md | C3（TECH-M-02）| [x] |
| skill-feedback-report.md | 全体 | [x] |
| phase12-task-spec-compliance-check.md | 全体（root evidence）| [x] |

## 成果物

- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [x] implementation-guide.md を Part1（例え話・専門用語なし）/ Part2（型・className・CSS・listener API）/ 視覚証跡 の 3 部で作成した
- [x] system-spec-update-summary.md に Step 1-A/1-B/1-C を implemented_local_evidence_captured で記録し Step 2 を N/A 判定した
- [x] documentation-changelog.md に全 Step を workflow-local / global skill sync の 2 ブロックで記録した（該当なしも明記）
- [x] unassigned-task-detection.md を current/baseline 分離で作成し TECH-M-02 を未タスク候補に記載した（0 件でも出力）
- [x] skill-feedback-report.md を 3 観点で作成した（改善点なしでも出力）
- [x] phase12-task-spec-compliance-check.md（root evidence）を canonical 9 セクションで作成した
- [x] commit / PR / screenshot は実施せず Phase 13 blocked を維持した

## タスク100%実行確認【必須】

- [x] 全実行タスク（Task 12-1〜12-6）を完了
- [x] 必須 6 成果物を `outputs/phase-12/` に実体化
- [x] implemented_local_evidence_captured 状態を全成果物で統一（completed と誤記しない）
- [x] Phase 13 開始条件（Phase 1-12 完了）を満たす

## 次Phase

[Phase 13: PR](phase-13-pr.md)
