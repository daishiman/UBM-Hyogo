# issue-991-admin-fetch-error-typed-class

**[実装区分: 実装仕様書]**

> 本ディレクトリは Issue #991（`[admin-audit-prototype-alignment-fu-001] AdminFetchError typed class 導入で 404 切り分け強化`）の Phase 1-13 実装仕様書一式である。
> **Issue #991 は CLOSED のまま**であり、本仕様書群の作成・実装によって reopen しない（ユーザー指示）。

## 概要

`apps/web/src/lib/admin/server-fetch.ts` の admin API 呼び出し失敗を、現状の untyped `throw new Error(...)` から **`AdminFetchError extends Error`** に置き換え、`status` / `path` / `responseBodySnippet` を構造化フィールドで提供する。これにより「404 と 500 を message 正規表現 parse なしで構造的に区別する」「再現用 body snippet を構造化 metadata として保持する」を達成する。

呼び出し側（`safe-fetch.ts` の共通正規化レイヤー）は、構造化 `status` フィールドを優先利用し、未提供時は既存の正規表現 fallback を維持する。これにより public/admin 両方を扱う共通層に admin 固有 import を持ち込まずに observability を強化する。

## Issue を現状コードに最適化した判断（最重要）

Issue #991 / 元 followup-001 spec は 2026-05-27 時点の記述であり、現状コードと2点乖離している。本仕様書は **現状コードを正本**として再最適化した。

| # | Issue / followup-001 の記述 | 現状コード（2026-05-30 調査） | 本仕様の最適化 |
| --- | --- | --- | --- |
| 1 | 「既存 `Error.message` フォーマット（`admin api ${path} failed: ${status}`）が維持される」 | `server-fetch.ts:530` は `admin api ${path} failed: ${status}${bodySnippet}`（`bodySnippet = " body=" + text.slice(0,256)`）を throw。`server-fetch.binding.spec.ts:89/101` がこの ` body=` suffix を assert | 「既存フォーマット」= **現状の実 message**（` body=` suffix 込み）と再定義。message は **byte-identical に維持**し、256 文字 body= suffix を保持する |
| 2 | §4#1「response body の二重 read を `Response.clone()` で回避」 | body は error path（`server-fetch.ts:512`）で **既に 1 回だけ** read 済み。`res.json()` は ok path のみ | `Response.clone()` 不要。既に read 済みの `text` 変数を再利用する（二重 read 問題は構造的に発生しない） |
| 3 | `responseBodySnippet` を 500 文字切り | （新規フィールド） | message suffix は後方互換のため 256 文字維持、`responseBodySnippet` フィールドは Issue AC 通り **≤500 文字**。同一 `text` の独立スライス |

> 結論: Issue は別タスクで未解決（`AdminFetchError` は全コードベースに不在、`server-fetch.ts:530` は untyped Error のまま、`safe-fetch.ts` は正規表現 parse 依存）。実装は必要。ただし Issue 記述は stale のため、本仕様書で現状コードに最適化した。

## メタ情報

| 項目                | 値                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------- |
| workflow_id         | `issue-991-admin-fetch-error-typed-class`                                                   |
| issue               | [#991](https://github.com/daishiman/UBM-Hyogo/issues/991)（**CLOSED 維持**）                |
| parent_workflow     | `admin-audit-prototype-alignment`                                                           |
| source_task_spec    | `docs/30-workflows/completed-tasks/admin-audit-prototype-alignment/unassigned-task/followup-001-admin-fetch-error-typed-class.md` |
| implementation_mode | `new`                                                                                       |
| workflow_state      | `implemented_local_evidence_captured`（ローカル実装・focused tests・typecheck・lint 完了。commit / push / PR は user-gated） |
| タスク種別          | NON_VISUAL（error class 追加 + 純関数 unit test。UI レイアウト変更なし）                      |
| visualEvidence      | NON_VISUAL                                                                                   |
| visual_evidence     | N/A（UI/UX 変更なし。証跡は focused Vitest）                                                  |
| primary_evidence    | `outputs/phase-11/manual-test-result.md`（focused Vitest 6 files / 31 tests PASS）             |
| created_at          | 2026-05-30                                                                                  |
| owner               | daishiman                                                                                    |

## スコープ

### in scope
- `apps/web/src/lib/admin/server-fetch.ts`: `AdminFetchError extends Error` を新規 export し、`server-fetch.ts:530` の `throw new Error(...)` を置換。message は byte-identical。`status` / `path` / `responseBodySnippet`（≤500）を構造化提供。`isAdminFetchError()` type guard（Cloudflare Workers cross-module `instanceof` false 対策の `name` 判定 fallback 込み）。
- `apps/web/src/lib/server-fetch/safe-fetch.ts`: `normalizeError` を構造化 `status` フィールド優先（数値）→ 既存正規表現 fallback の順に強化（generic / admin 非依存）。
- `apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts`: 新規。typed throw / fields / message byte-identical / 256 vs 500 スライス / type guard を検証。

### out of scope（理由付き / CONST_007 準拠）
- response body の PII masking: 今回サイクル内で最小実装済み。`AdminFetchError` constructor で email / phone 形状を snippet 化前に `[masked-email]` / `[masked-phone]` へ redaction する。フィールド別高度 masking は実測 need が出るまで追加しない。
- `error.tsx` の表示分岐刷新: status 構造化の consumer 拡張は観測 evidence 取得後。今回は status を「提供する」までで、表示分岐は変更しない。
- `apps/api` 側の error response shape 変更: 不変条件（既存 endpoint surface のみ）に反するため対象外。

## Phase 一覧

| Phase | 名称             | 成果物                                                                                                                                          | 状態         |
| ----- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1     | 要件定義         | `outputs/phase-1/phase-1.md`                                                                                                                    | completed |
| 2     | 設計             | `outputs/phase-2/phase-2.md`                                                                                                                    | completed |
| 3     | 設計レビュー     | `outputs/phase-3/phase-3.md`                                                                                                                    | completed |
| 4     | テスト作成       | `outputs/phase-4/phase-4.md`                                                                                                                    | completed |
| 5     | 実装             | `outputs/phase-5/phase-5.md`                                                                                                                    | completed |
| 6     | テスト拡充       | `outputs/phase-6/phase-6.md`                                                                                                                    | completed |
| 7     | カバレッジ確認   | `outputs/phase-7/phase-7.md`                                                                                                                    | completed |
| 8     | リファクタリング | `outputs/phase-8/phase-8.md`                                                                                                                    | completed |
| 9     | 品質保証         | `outputs/phase-9/phase-9.md`                                                                                                                    | completed |
| 10    | 最終レビュー     | `outputs/phase-10/phase-10.md`                                                                                                                  | completed |
| 11    | 手動テスト       | `outputs/phase-11/phase-11.md`, `outputs/phase-11/manual-test-result.md`                                                                        | completed |
| 12    | ドキュメント更新 | `outputs/phase-12/phase-12.md`, `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | completed |
| 13    | PR作成           | `outputs/phase-13/phase-13.md`                                                                                                                  | pending |

## 完了条件（workflow 全体 DoD）

- [x] `AdminFetchError` が `apps/web/src/lib/admin/server-fetch.ts` から export されている
- [x] `AdminFetchError` が `Error` を継承し、`status` / `path` / `responseBodySnippet` を持つ
- [x] `Error.message` が現状と byte-identical（非 PII body では `admin api ${path} failed: ${status}${bodySnippet}`、` body=` suffix は 256 文字切り）
- [x] `responseBodySnippet` が ≤500 文字に切られる（message suffix の 256 とは独立スライス）
- [x] `responseBodySnippet` / message suffix に入る email / phone 形状の PII は redaction 済み
- [x] `isAdminFetchError()` type guard が `instanceof` + `name` fallback で true を返す
- [x] `safe-fetch.ts` が構造化 `status` フィールドを優先し、未提供時は正規表現 fallback を維持
- [x] 新規 `admin-fetch-error.spec.ts` が green
- [x] 既存 regression spec 群（binding / safe-server-fetch / 404-vs-401 / env / safe-fetch）が引き続き green
- [x] `pnpm typecheck` / `pnpm lint` green
- [x] Phase 12 strict 7 成果物 完備

## 参照
- Issue: https://github.com/daishiman/UBM-Hyogo/issues/991
- 元 follow-up 仕様: `docs/30-workflows/completed-tasks/admin-audit-prototype-alignment/unassigned-task/followup-001-admin-fetch-error-typed-class.md`
- 現状実装: `apps/web/src/lib/admin/server-fetch.ts`（throw 箇所 = line 530）, `apps/web/src/lib/server-fetch/safe-fetch.ts`（`STATUS_FROM_MESSAGE` 正規表現）
- 既存 consumer: `apps/web/src/lib/admin/safe-server-fetch.ts`（`ADMIN_FETCH_404` warn）
- 先行事例: `docs/30-workflows/completed-tasks/fix-admin-fetch-cf-1042-service-binding/`, `docs/30-workflows/completed-tasks/issue-976-admin-fetch-service-binding/`
