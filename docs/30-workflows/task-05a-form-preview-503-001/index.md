# task-05a-form-preview-503-001 — `/public/form-preview` 503 root cause + fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-05a-form-preview-503-001 |
| 作成日 | 2026-05-05 |
| 状態 | implemented-local-runtime-evidence-blocked |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | NON_VISUAL |
| 優先度 | Medium（label: priority:medium / scale:small / type:bugfix） |
| 起票元 | GitHub Issue #388（CLOSED 状態のままタスク仕様書化） |
| 既存仕様書 | `docs/30-workflows/unassigned-task/task-05a-form-preview-503-001.md` |
| ブランチ | 本ワークツリー (`.worktrees/task-20260505-092049-wt-6`) — 後続実装サイクルで `feat/05a-form-preview-503` を派生予定 |

## 実装区分

`[実装区分: 実装仕様書]`

- 受け入れ条件 (`/public/form-preview` を 200 化) は **コード変更 + データ整合**を経由しないと達成できないため、ドキュメントのみ仕様書では成立しない。
- 「ドキュメントのみ」指示は無いが、既存 unassigned spec が docs として残っており、本タスクはそれを **実装仕様** に昇格させる位置付け。

## 背景

- staging で `https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview` が **HTTP 503** を返す。他 `/public/*` は 200。
- 該当 use-case `apps/api/src/use-cases/public/get-form-preview.ts` は `getLatestVersion()` が `null` の場合に `ApiError({ code: "UBM-5500" })` を throw する。
- `packages/shared/src/errors.ts` で `UBM-5500` は `status: 503` にマップされている（`UBM_ERROR_CODES`）。
- `/register` page は fetchPublic 経由で `/public/form-preview` を叩くため、503 のまま放置すると register 機能に影響する。

## スコープ

| 含む | 含まない |
| --- | --- |
| staging `wrangler tail` での 503 stack 取得 | `/public/form-preview` の API 仕様変更（response shape 不変条件 #14） |
| staging D1 `schema_versions` / `schema_questions` の状態確認 | UI 側 register page の機能追加 |
| 必要なら schema sync / seed migration を staging に投入 | production schema sync の運用フロー全面改訂 |
| `apps/api/src/use-cases/public/get-form-preview.ts` の 503 分岐の挙動再確認・回帰テスト追加 | 他 public route のリファクタリング |
| `apps/api/src/routes/public/form-preview.ts` の error mapping 経路の text fixture 化 | 認証経路 (`apps/api/src/routes/admin`) の変更 |
| staging で 200 を取得する evidence 採取 | E2E (Playwright) の新規シナリオ追加 |
| production 側でも 200 を維持していることの確認 | Cloudflare D1 の billing / 容量設計変更 |

## 受け入れ条件 (AC)

- AC-1: staging `GET /public/form-preview` が **200** を返す。
- AC-2: production `GET /public/form-preview` が **200** を維持。
- AC-3: staging `/register` ページが 200 を返し、form preview が表示される。
- AC-4: `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` に「`schema_versions` 欠落 → UBM-5500（503）」と「正常 manifest → 200」の両ケースが揃った状態で green。
- AC-5: 503 発生条件と緊急回復手順が `outputs/phase-12/implementation-guide.md` に Part 1 / Part 2 の構成で記録される。
- AC-6: Phase 12 strict 7 files（`main.md` + 6 補助成果物）が揃う。

## 不変条件参照

- 不変条件 #1: 実フォームの schema をコードに固定しない（schema_versions の動的解決を維持）。
- 不変条件 #5: D1 への直接アクセスは `apps/api` に閉じる。staging 修復は wrangler 経由のみ。
- 不変条件 #14: schema 集約点は `schema_versions` × `schema_questions`。本タスクで列追加はしない。

## 主要参照

- `apps/api/src/routes/public/form-preview.ts`
- `apps/api/src/use-cases/public/get-form-preview.ts`
- `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts`
- `apps/api/src/repository/schemaVersions.ts`
- `apps/api/src/repository/schemaQuestions.ts`
- `packages/shared/src/errors.ts`（UBM-5500 → 503 mapping）
- `docs/30-workflows/unassigned-task/task-05a-form-preview-503-001.md`
- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-005`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`

## CONST_007 適用 — 単一サイクル完了原則

- 全 13 Phase 仕様書を**今回の実装サイクル**（後続 `03.実装.md`）の 1 ターンで完了できるスコープに収める。
- 先送り対象（バックログ送り）は本仕様書では発生させない。staging schema sync を恒常運用に格上げするテーマは別タスク化候補だが、**今回の AC を満たすには runbook 化のみで足り、運用化は scope-out**。

## 完了条件（spec / local implementation 段階）

- [x] Phase 1-3 の設計書 (`outputs/phase-0{1,2,3}/main.md`) が存在し、要件・設計・俯瞰が記述されている。
- [x] `phase-01.md`〜`phase-13.md` が存在し、CONST_005 必須項目を満たす（実装仕様）。
- [x] `artifacts.json` の Phase ステータスが local implementation 実態に同期されている。
- [x] index.md / unassigned 元仕様書 / GitHub Issue #388 の参照リンクが整合している。

## 完了条件（実装段階・後続サイクル）

- [ ] AC-1〜AC-6 をすべて満たす（AC-1〜AC-3 は runtime evidence blocked）。
- [x] focused Vitest で get-form-preview / public route の local regression が green。
- [ ] `pnpm typecheck` / `pnpm lint` green（本レビューで `@ubm-hyogo/api typecheck` は green、root lint は未実行）。
- [ ] staging `curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview` が `200`。
- [ ] `outputs/phase-11/manual-smoke-log.md` / `manual-test-result.md` に staging / production の curl 実測 evidence が記録される。
- [x] Phase 12 strict 7 files が揃い、artifacts parity が確認される。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | `phase-01.md` | completed |
| 2 | 設計 | `phase-02.md` | completed |
| 3 | 設計レビュー | `phase-03.md` | completed |
| 4 | テスト作成（RED） | `phase-04.md` | completed |
| 5 | 実装（GREEN） | `phase-05.md` | completed-local |
| 6 | テスト拡充 | `phase-06.md` | completed-local |
| 7 | カバレッジ確認 | `phase-07.md` | completed-local |
| 8 | リファクタリング | `phase-08.md` | completed-local |
| 9 | 品質保証 | `phase-09.md` | completed-local |
| 10 | 最終レビュー | `phase-10.md` | completed-with-runtime-blocker |
| 11 | 手動テスト（NON_VISUAL） | `phase-11.md` | blocked-pending-runtime-evidence |
| 12 | ドキュメント更新 | `phase-12.md` | completed |
| 13 | PR 作成 | `phase-13.md` | blocked-until-user-approval |
