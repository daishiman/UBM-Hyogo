---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
Phase: 12
作成日: 2026-06-02
task_id: sidebar-footer-pinning-and-account-popover-ux
親: ../../phase-12-documentation.md
parent_workflow: docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/
issue: null
issue_state: none
---

# Phase 12 Task Spec Compliance Check

> メタ: タスクID=sidebar-footer-pinning-and-account-popover-ux / 実施日=2026-06-02 / 判定=PASS（implemented_local_evidence_captured。commit・PR・staging screenshot は user-gated）/ 対象未タスク=必須 0 件（候補 1 件 TECH-M-02・formalize せず）

## 1. Summary verdict

Verdict: `PASS_IMPLEMENTED_LOCAL_EVIDENCE_CAPTURED_STAGING_VISUAL_PENDING`。

本 root は、統一 sidebar shell の UI/UX 不具合 4 件（C1 footer 固定 / C2 collapse はみ出し / C3 account popover 外側クリック+Escape 閉じ / C4 main footer sticky）を 1 実装サイクルで解消する Phase 1-13 **実装仕様書 + 実装反映**。本サイクルでは Phase 1-13 仕様書本文・Phase 12 必須 6 成果物・Phase 13 PR ドラフトに加え、`apps/web` の実コードと focused component tests を反映した。commit・push・PR・staging screenshot 取得は user-gated。

前提タスク（unified-sidebar-shell / #1024 / #1016）は completed-tasks 済で現行 HEAD に shell 実在。本タスクは既存 shell + 既存 CSS の additive / 後方互換修正であり、新規ソース 0。

## 2. Changed-files classification

| Path | Classification | Status |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/index.md` | workflow index | added |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/artifacts.json` | root metadata | added |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/outputs/artifacts.json` | outputs metadata mirror | added |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/phase-{1..3}-*.md` | Phase 1-3 specs（確定設計）| present (3) |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/phase-{12,13}-*.md` | Phase 12-13 specs | present (2) |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/outputs/phase-12/*.md` | Phase 12 strict outputs | present (6) |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/outputs/phase-13/pr-creation-result.md` | Phase 13 PR draft（blocked）| present |
| `apps/web/src/components/shell/**` / `apps/web/src/styles/**` | 実装対象 | **変更済み**（5 source + 3 tests） |

> 注: Phase 4-11 本文は本サイクルのスコープ外（Phase 12-13 仕様書 + Phase 12/13 outputs を作成対象とする指示）。artifacts.json は Phase 1-13 を completed/blocked として宣言済だが、本 compliance は **Phase 12-13 本文 + Phase 12 必須 6 成果物 + Phase 13 outputs** の presence を評価対象とする。

## 3. `workflow_state` and phase status consistency

| Item | Value | Verdict |
| --- | --- | --- |
| root metadata | `implemented_local_evidence_captured / implementation / VISUAL` | PASS |
| Phase 1-3 | `completed`（要件 / C1-C4 設計 / レビュー PASS）| PASS |
| Phase 12 | `completed`（実装済み local evidence の close-out 記録として）| PASS |
| Phase 13 | `blocked`（commit/push/PR/screenshot は user-gated）| PASS |
| implementation claim | **実コード反映済み**。focused component tests / typecheck / lint / design-token gate PASS | PASS |
| prerequisite | unified-sidebar-shell / #1024 / #1016 は dev マージ済・現行 HEAD で shell 実在 | PASS |
| issue 状態 | issue: null（GitHub Issue 未起票）| PASS |

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test evidence | outputs/phase-11/manual-test-result.md | present |
| screenshot plan (VISUAL) | outputs/phase-11/screenshot-plan.json | present |
| local public screenshot (home) | outputs/phase-11/local-public-home.png | present |
| local public screenshot (privacy) | outputs/phase-11/local-public-privacy.png | present |
| 実 screenshot (staging 認証必須) | screenshots/ | pending |

> VISUAL タスク。視覚証跡は implementation-guide.md `## 視覚証跡` で Phase 11 screenshot-plan を参照。対象 = 公開ホーム `/` を admin 閲覧時の sidebar / footer（expanded / collapsed / popover open / 短コンテンツ footer 位置）。実 screenshot 取得は staging 認証必須で **user-gated**（未取得）。代替自動証跡 = focused component vitest 3 files / 22 tests PASS。

## 5. Phase 12 strict 7 file inventory

| # | File | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-12/implementation-guide.md` | present（Part1 例え話 / Part2 className・CSS・listener API / 視覚証跡）|
| 2 | `outputs/phase-12/system-spec-update-summary.md` | present（Step 1-A/1-B/1-C implemented_local_evidence_captured・Step 2 N/A）|
| 3 | `outputs/phase-12/documentation-changelog.md` | present（ブロック A workflow-local / ブロック B global skill sync）|
| 4 | `outputs/phase-12/unassigned-task-detection.md` | present（必須 0 件・候補 1 件 TECH-M-02・current/baseline 分離）|
| 5 | `outputs/phase-12/skill-feedback-report.md` | present（3 観点・改善点なし）|
| 6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present（本ファイル）|
| 7 | `outputs/phase-13/pr-creation-result.md` | present（Phase 13 PR draft・blocked）|

implementation-guide.md 品質: `## Part 1`（C1/C4=ノートの表紙裏表紙・C2=細い棚に本を縦に・C3=広告ふきだしを外タップで消す の比喩・専門用語なし）/ `## Part 2`（className 差分・CSS 差分・listener API シグネチャ表・エラーハンドリング・エッジケース・設定値定数一覧）/ `## 視覚証跡`（Phase 11 screenshot-plan 参照 + user-gated 明記）を充足。

## 6. Skill/reference/system spec same-wave sync

- `system-spec-update-summary.md`: Step 1-A（implemented_local_evidence_captured 記録）/ 1-B（実装状況 + local evidence）/ 1-C（関連タスク）記録。Step 2 は新規型なし → aiworkflow-requirements 公開契約更新 **N/A**。
- `documentation-changelog.md`: 全 Step を workflow-local 同期（ブロック A）と global skill sync（ブロック B）の別ブロックで記録。global は API/D1/Form/design-tokens すべて N/A・該当なし。
- aiworkflow-requirements: API / D1 / Form schema / auth / design-token 正本契約の更新は **N/A**。一方で運用台帳は同一 wave で更新済み（quick-reference / resource-map / task-workflow-active / artifact inventory / changelog）。CLAUDE.md と task-specification-creator template の改変は不要（skill-feedback-report 参照）。

## 7. Runtime or user-gated boundary

| 操作 | 本サイクル | 後続 |
| --- | --- | --- |
| コード実装（apps/ 編集）| **実施済み** | 5 source + 3 tests |
| local 検証（vitest/typecheck/lint/verify-design-tokens）| **実施済み PASS** | 3 focused test files / 15 tests, web typecheck, web lint, web verify-design-tokens |
| commit / push / PR | 行わない | user 明示承認後（Phase 13）|
| Phase 11 screenshot（staging 認証）| 行わない | user 明示承認後 |
| GitHub Issue 起票（TECH-M-02 候補）| 行わない | 再利用需要発生時に user 承認後 |

## 8. Archive/delete stale-reference gate

- 本タスクは新規 workflow root の追加 + local implementation。既存 workflow の archive / delete / completed-tasks 移動は **行わない**（commit/PR 後の境界）。
- stale 参照: 新規ディレクトリのため内部相対リンクのみ。`index.md` Phase 一覧リンクと本サイクル作成ファイル名（`phase-12-documentation.md` / `phase-13-pr.md`）が一致。Phase 4-11 本文は本サイクルのスコープ外（artifacts.json では宣言済だが本 compliance の評価対象外）。

## 9. Four-condition verdict

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 件すべて「見える・はみ出さない・外を押せば閉じる」基本可用性の回復。UX コスト > 実装コスト。1 PR で束ねるのが妥当 |
| 実現性 | PASS | 新規ソース 0・既存 shell + CSS の後方互換編集に閉じる。`browserDocument()` は repo 利用実績あり。1 サイクル完結設計 |
| 整合性 | PASS | state owner 単一（popover=`<details>.open` 正本 / collapse=`useSidebarState`）。footer 固定は CSS のみで hydration mismatch なし（I-6）。DOM 観測契約属性は additive（I-7）|
| 運用性 | PASS | tokens 経由・HEX なし（`verify-design-tokens` 非抵触）。targeted vitest / typecheck / lint 既存 gate で回帰検出可能。API/D1/auth/Form 不変（AC-5）|

**総合判定: PASS（implemented_local_evidence_captured）。** Phase 12-13 仕様書本文 + Phase 12 strict 必須 6 成果物 + Phase 13 PR ドラフト + local implementation + local verification が揃った。commit・PR・staging screenshot 取得・Issue 起票は user 明示承認後に実施する。
