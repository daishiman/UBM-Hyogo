# Phase 12: ドキュメント同期

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 12（ドキュメント同期 / strict 7 outputs 親） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| workflow_state | implemented_local_evidence_captured |
| visual_category | NON_VISUAL |
| issue | #1063（CLOSED のまま再スコープ・reopen しない） |

## 目的

本タスクの strict 7 outputs（`outputs/phase-12/` + `outputs/phase-11/manual-test-result.md`）への導線を確定する。本サイクルは local code implementation + focused Vitest evidence を取得済みであり、各種 close-out 系 output は「ローカル実装済み、外部操作 user-gated」の状態を記録する。

## 実行タスク

### 12.1 Task 12-1〜12-6 の構成

| Task | 名称 | 成果物 | 本タスクでの内容 |
|------|------|--------|------------------|
| 12-1 | 実装ガイド | `outputs/phase-12/implementation-guide.md` | `serializeShellCollapsedCookie` の `secure` 第2引数追加 + `isSecureRuntimeContext` 新設 + TC-1〜TC-6 追記の手順（Phase 5 / Phase 6 を統合）。 |
| 12-2 | 仕様正本更新サマリ | `outputs/phase-12/system-spec-update-summary.md` | `docs/00-getting-started-manual/specs/` 配下の正本更新は **N/A**（API/D1/Form schema 不変・cookie 属性のみの変更）。N/A の根拠を明記する。 |
| 12-3 | ドキュメント変更ログ | `outputs/phase-12/documentation-changelog.md` | 本 workflow dir 追加、apps/web 実装差分、aiworkflow-requirements 同 wave 反映の記録。 |
| 12-4 | 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` | Issue #1063 本体（`Secure` hardening）は本サイクルで仕様確定。follow-up の有無を検出し記録する（sibling #1065 は別関心で本タスク非該当）。 |
| 12-5 | skill feedback | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements への lessons 反映候補を記録する。 |
| 12-6 | compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Changed-files 分類 / workflow_state 整合 / Phase 11 evidence inventory / strict 7 inventory / skill same-wave sync / runtime boundary / archive-delete gate の 7 観点を実装済みローカル証跡ありで検証する。 |

### 12.2 strict 7 ファイル名一覧

`outputs/phase-12/` 配下に以下 6 ファイル + `outputs/phase-11/manual-test-result.md` の計 7 点を揃える:

1. `outputs/phase-12/implementation-guide.md`
2. `outputs/phase-12/system-spec-update-summary.md`
3. `outputs/phase-12/documentation-changelog.md`
4. `outputs/phase-12/unassigned-task-detection.md`
5. `outputs/phase-12/skill-feedback-report.md`
6. `outputs/phase-12/phase12-task-spec-compliance-check.md`
7. `outputs/phase-11/manual-test-result.md`

### 12.3 implemented_local_evidence_captured の close-out ルール

本タスクは local code implementation と focused evidence を取得済み。close-out の Step 1-A〜1-C は省略・N/A 化せず、実装済みローカル状態として明示記録する:

- **Step 1-A（未タスク検出）**: `Secure` hardening の残課題を検出し `unassigned-task-detection.md` に記録する。検出 0 件なら「0 件・本サイクルで完結」と明記する（空欄にしない）。
- **Step 1-B（skill feedback）**: lessons 反映候補を `skill-feedback-report.md` に記録する（候補無しなら「無し」と明記）。
- **Step 1-C（compliance check）**: 7 観点を `phase12-task-spec-compliance-check.md` に記録し、`workflow_state: implemented_local_evidence_captured` と apps/web 実コード差分・focused Vitest evidence を整合確認する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| 実装手順 | `phase-5-implementation.md` | serializer After 逐語 / grep 確認 |
| テスト計画 | `phase-4-test-plan.md` | TC-1〜TC-6 |
| NON_VISUAL 証跡 | `phase-11-manual-test.md` | 代替証跡 = focused Vitest log |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/phase-12-documentation.md` | strict 7 / lessons 構成の踏襲元 |

## 統合テスト連携

統合テストは適用外。focused Vitest（serializer 文字列検証）が AC-1〜AC-6 の唯一の自動検証経路であり、`implementation-guide.md` にその実行コマンド（`mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`）を明記する。

## 成果物

- 本ファイル（`phase-12-documentation.md`）= strict 7 outputs への親導線。
- `outputs/phase-12/` 配下 6 点 + `outputs/phase-11/manual-test-result.md`（local focused evidence と user-gated smoke 境界を記録）。

## 完了条件

- strict 7 ファイル名が列挙されている。
- implemented_local_evidence_captured の close-out ルール（Step 1-A〜1-C を N/A にしない）が明記されている。
- 仕様正本更新が N/A である根拠（API/D1/Form schema 不変）が記載されている。
- commit / push / PR は user 明示承認後のみ（Phase 13）であることが整合している。
