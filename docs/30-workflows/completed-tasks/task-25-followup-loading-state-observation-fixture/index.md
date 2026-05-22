# task-25-followup-loading-state-observation-fixture

> ワークフロー: `task-25-followup-loading-state-observation-fixture`
> 親ワークフロー: `task-25-ui-mvp-w8-par-routes-smoke-coverage`（completed）
> Source Issue: https://github.com/daishiman/UBM-Hyogo/issues/711（CLOSED のまま実装する。CLOSED 状態でもタスク仕様書を作成・実行可能にする運用ポリシー）
> 種別: **実装仕様書 / NON_VISUAL**

## 実装区分

`[実装区分: 実装仕様書]`

判定根拠:
- Issue #711 は表面上 CLOSED だが、`SMOKE-COVERAGE-MATRIX.md` の行 19（`app/loading.tsx`）が依然 `N/A-runtime-observation` のまま。
- `apps/web/app/__smoke__/` 配下に `loading-state/` fixture が存在せず、`apps/web/tests/e2e/staging-smoke.spec.ts` にも `loading.tsx` の runtime 観測ケースが無い。
- 同 follow-up の error-boundary 側（Issue #710）は `apps/web/app/smoke/error-boundary/page.tsx` と staging-smoke spec で既に実装され runtime 観測が成立している。同パターンを loading 側に展開する必要がある。
- 「runtime 観測を成立させる」「matrix の `N/A-runtime-observation` を置換する」目的は、ファイル新規追加・spec 追加・matrix 更新を伴うためコード変更必須。

## メタ情報

| 項目 | 値 |
|------|----|
| Task ID | `task-25-followup-loading-state-observation-fixture` |
| Implementation Mode | `implementation` |
| タスク種別 | `implementation` |
| visualEvidence | `NON_VISUAL` |
| Classification | implementation / NON_VISUAL |
| 目的 | `apps/web/app/loading.tsx` を flaky network sleep 無しで deterministic に観測する staging smoke fixture を追加し、`SMOKE-COVERAGE-MATRIX.md` の `loading.tsx` 行で `N/A-runtime-observation` を実観測へ置換する |
| 主成果物（コード） | `apps/web/app/smoke/loading-state/page.tsx` 新規 / `apps/web/app/smoke/loading-state/loading.tsx` 新規 / `apps/web/tests/e2e/staging-smoke.spec.ts` 編集 |
| 主成果物（ドキュメント） | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` 更新 |
| 依存（upstream） | task-25（completed）, task-25-followup-error-boundary-smoke-fixture（実装済 fixture pattern 流用元） |
| 依存（downstream） | なし（独立完結） |
| ブランチ命名 | `feat/task-25-followup-loading-state-fixture` |
| PR base | `dev` |
| Workflow State | `verified` |
| Implementation Status | `implementation_complete_pending_pr` |

## Phase 一覧

| Phase | 名称 | 状態 |
|-------|------|------|
| 1 | 要件定義 | completed |
| 2 | 設計 | completed |
| 3 | 設計レビュー | completed |
| 4 | テスト作成（fixture spec の skeleton） | completed |
| 5 | 実装（fixture route + loading.tsx + smoke spec 追加） | completed |
| 6 | テスト拡充（latency variation / 二重ガード / 404） | completed |
| 7 | カバレッジ確認（matrix 行 19 の置換） | completed |
| 8 | リファクタリング（error-boundary fixture との重複除去） | completed |
| 9 | 品質保証（typecheck / lint / smoke / token gate） | completed |
| 10 | 最終レビュー | completed |
| 11 | 手動テスト（NON_VISUAL evidence） | completed |
| 12 | ドキュメント更新（SMOKE-COVERAGE-MATRIX / implementation-guide） | completed |
| 13 | PR 作成（ユーザー明示承認後） | blocked |

## Phase Links

- [Phase 1](phase-01.md)
- [Phase 2](phase-02.md)
- [Phase 3](phase-03.md)
- [Phase 4](phase-04.md)
- [Phase 5](phase-05.md)
- [Phase 6](phase-06.md)
- [Phase 7](phase-07.md)
- [Phase 8](phase-08.md)
- [Phase 9](phase-09.md)
- [Phase 10](phase-10.md)
- [Phase 11](phase-11.md)
- [Phase 12](phase-12.md)
- [Phase 13](phase-13.md)

## 不変条件

1. **production 漏出禁止**: fixture は `ENABLE_STAGING_SMOKE_FIXTURE === "1"` かつ `ENVIRONMENT !== "production"` の二重ガードで保護し、条件不一致時は `notFound()` で 404 を返す（既存 `__smoke__/error-boundary/page.tsx` と同一パターン）。
2. **flaky network sleep 禁止**: latency は server component 内の `setTimeout` ベース固定遅延（既定 1500ms、query param `?delay=` で 0–3000ms にクランプ）で deterministic に制御する。network throttle / `page.route` の artificial delay は使わない。
3. **TOKEN-SSOT 維持**: loading UI は `apps/web/app/loading.tsx` と同じ design token（`apps/web/src/styles/tokens.css`）を流用し、HEX 直書き / `bg-[#xxx]` を導入しない。`verify-design-tokens` CI gate が pass すること。
4. **新規 endpoint surface 追加禁止**: API surface は変更しない（fixture は Web layer のみで完結）。
5. **新規テスト suffix 規約**: `*.spec.ts` のみ（`*.test.ts` 禁止）。
6. **CONST_007 単一サイクル完了**: Phase 5 の実装は 1 PR で完結する（後続 follow-up を生まない）。
7. **既存 fixture pattern 流用**: 新たな env flag / 認証経路 / route group を生やさず、`__smoke__/error-boundary/` と `__smoke__/members-list/` と同じ `readRawEnv()` ガード経路に揃える。

## 関連リンク

- Source Issue: https://github.com/daishiman/UBM-Hyogo/issues/711
- 親 task: `docs/30-workflows/completed-tasks/task-25-ui-mvp-w8-par-routes-smoke-coverage/`
- 元 spec（移動済）: `docs/30-workflows/completed-tasks/unassigned-task/task-25-followup-loading-state-observation-fixture.md`
- 主成果物（既存 matrix）: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- 流用元 fixture: `apps/web/app/smoke/error-boundary/page.tsx`
- 流用元 smoke spec: `apps/web/tests/e2e/staging-smoke.spec.ts`（行 105–115 の error-boundary describe block）
- 対象 loading 群: `apps/web/app/loading.tsx`, `apps/web/app/(admin)/admin/loading.tsx`, `apps/web/app/(admin)/admin/audit/loading.tsx`, `apps/web/app/profile/loading.tsx`, `apps/web/app/login/loading.tsx`
- env 規約: `apps/web/src/lib/env.ts`（`readRawEnv()`）
