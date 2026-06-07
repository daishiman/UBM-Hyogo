# System Spec Update Summary（issue-1111-proxy-transport-util-unify）

Phase 12 Step 1（完了タスク記録 / 実装状況 / 関連タスク）と Step 2（新規インターフェース反映）の system spec への反映状況を記録する。本タスクは `implemented_local_evidence_captured`（実装済み・ローカル証跡取得済み）である。公開 API / D1 / Google Form 変更はないため、`docs/00-getting-started-manual/specs/` への契約変更追記は不要。

## Step 1-A — 完了タスク記録

| 項目 | 内容 |
| --- | --- |
| 対象 | issue #1111（admin API proxy の transport 選択ロジックを共通 util に抽出する pure refactor） |
| 完了範囲 | 実コード実装 + focused tests + Phase 12 strict 7 成果物の作成（`implemented_local_evidence_captured`） |
| コード変更 | `transport-select.ts` 新規、util spec 新規、`route.ts` / `server-fetch.ts` / `public.ts` 切替 |
| 記録先 | 本ワークフロー `docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/`。Phase 12 完了条件に基づき completed-tasks へ移動済み |

Step 1-A の system spec 反映: 公開契約変更なしの web 内部 refactor のため、manual specs への追記は不要。本 workflow の Phase 12 strict 7 を正本記録とする。

## Step 1-B — 実装状況

| Key | Value |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| implementation_status | `IMPLEMENTED_LOCAL_EVIDENCE_CAPTURED` |
| implementation_mode | `new`（`apps/web/src/lib/fetch/transport-select.ts` 新規 + 3 呼び出し側切替） |
| apps/ 変更 | 5 件（新規 util / 新規 spec / 3 呼び出し側切替） |
| 検証 | focused Vitest 6 files / 44 tests PASS、web typecheck PASS、web lint PASS、verify:phase12-compliance PASS |

実装状況に基づく system spec 反映: 公開 API surface は不変。web 内部 util surface は本 workflow と implementation guide に固定する。

## Step 1-C — 関連タスク

| 関連 | 関係 |
| --- | --- |
| 親 workflow | `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/`（本タスクは followup-002） |
| 兄弟参照 | `task-05a-fetchpublic-service-binding-001`（`public.ts` の逆方向 fallback 設計）/ `staging-api-url-and-session-recovery`（server-side fetch の service-binding 統一） |
| スコープ外（別形状） | `apps/web/src/lib/auth.ts`（軽量変種・同型 4 値 transport 選択ではない。将来 transport が isTestOrPlaywright + fallback を要した時点で別 Issue 化） |

関連タスクとの依存整合: 新規 endpoint / `apps/api` 変更 / D1 schema 変更を伴わず、既存 endpoint surface のみを使う。親・兄弟タスクの transport 設計（service-binding 統一）と方向性が整合する。

## Step 2 — 新規インターフェースの system spec 反映

| Key | Value |
| --- | --- |
| 新規インターフェース | `apps/web/src/lib/fetch/transport-select.ts`（`resolveServiceBinding` / `stripTrailingSlash` / `selectAndFetch` / 型 `TransportKind` / `SelectTransportResult`） |
| 現時点の反映 | done（`transport-select.ts` に実装済み。本 workflow / implementation-guide / compliance に確定 surface を記録） |
| 反映先 | 公開 API（`apps/api` endpoint surface）に変更はなく、manual specs 追記は不要。web 層内部 util の文書化は workflow-local に限定 |

Step 2 の system spec 反映: workflow-local 反映済み。manual specs への契約変更は不要。

## 反映タイミング総括

| Step | specs 反映 | タイミング |
| --- | --- | --- |
| 1-A 完了タスク記録 | workflow-local 反映済み | 本サイクル |
| 1-B 実装状況 | workflow-local 反映済み | 本サイクル |
| 1-C 関連タスク | 該当なし（依存追加なし） | — |
| 2 新規インターフェース | workflow-local 反映済み | 本サイクル |

`docs/00-getting-started-manual/specs/` への反映は、公開契約変更がないため不要。本ワークフロー配下で記録を完結する。
