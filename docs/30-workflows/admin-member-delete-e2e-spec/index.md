# admin-member-delete E2E spec — タスク仕様書（Phase 1-13）

> **[実装区分: 実装仕様書]**
>
> 元タスク: [`docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2c-admin-member-delete.md`](../e2e-quality-uplift-stage-2-sub-tasks/2c-admin-member-delete.md)
> 判断根拠（CONST_004）: 後続成果物は実コードファイル `apps/web/playwright/tests/admin-member-delete.spec.ts` の新規作成。コード変更を伴う実装仕様書として作成する。

## メタ情報

| key | value |
|-----|-------|
| workflow ID | `admin-member-delete-e2e-spec` |
| 親 workflow | `e2e-quality-uplift-stage-2`（sub-task 2c） |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| coverageTier | `standard`（lines >= 70% / critical route smoke 100%） |
| implementation_mode | `new` |
| workflow_state | `implemented-local-runtime-pending` |
| evidence_state | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| 主要対象ファイル | `apps/web/playwright/tests/admin-member-delete.spec.ts`（新規・175 行） |
| 起点日 | 2026-05-10 |

## スコープ

`POST /admin/members/:memberId/delete` の二段確認削除フロー、reason 必須 validation、audit log 連動、3 ロール認可分岐の E2E spec を **1 ファイル新規作成** した。新 endpoint・D1 schema 変更・新 Playwright fixture は禁止（Stage 2 不変条件継承）。

## Phase 1-13 構成

| Phase | ファイル | 役割 |
|-------|---------|------|
| 1 | [phase-1.md](phase-1.md) | 要件定義（前提・対象・受け入れ基準） |
| 2 | [phase-2.md](phase-2.md) | 設計（spec 構造・mock 戦略・fixture 形） |
| 3 | [phase-3.md](phase-3.md) | 設計レビュー（4-condition gate） |
| 4 | [phase-4.md](phase-4.md) | テスト作成（TDD Red） |
| 5 | [phase-5.md](phase-5.md) | 実装（TDD Green・差分概要） |
| 6 | [phase-6.md](phase-6.md) | リファクタリング |
| 7 | [phase-7.md](phase-7.md) | 結合テスト・全体回帰 |
| 8 | [phase-8.md](phase-8.md) | コードレビュー |
| 9 | [phase-9.md](phase-9.md) | ドキュメント整備 |
| 10 | [phase-10.md](phase-10.md) | デプロイ準備 |
| 11 | [phase-11.md](phase-11.md) | 実行・evidence 取得 |
| 12 | [phase-12.md](phase-12.md) | 振り返り・正本仕様 sync |
| 13 | [phase-13.md](phase-13.md) | PR 作成 |

## 不変条件（全 Phase 共通）

1. 既存 API endpoint surface のみ利用。新 endpoint・D1 schema 変更禁止
2. `apps/web` から D1 直接アクセス禁止（Server Component 初期 fetch は `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1`、Client mutation は `page.route()`）
3. OKLch 正本（HEX 直書き禁止／selector に色値使用禁止）
4. 既存 fixture（`adminPage` / `memberPage` / `anonymousPage`）再利用、新 fixture 禁止
5. reason は zod schema `DeleteBodyZ` で必須（`apps/api/src/routes/admin/member-delete.ts:10`）
6. skip 許容は cascade preview 1 件のみ（CONST_007 例外条件 1, 2 同時該当）
7. API route / D1 schema / Playwright auth fixture は変更しない。E2E 専用 Server Component fixture gate、spec、削除後 UI 反映のみ追加

## 参照

- 親 Stage 2: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/`
- 不変条件正本: `CLAUDE.md` 「重要な不変条件」「UI prototype alignment / MVP recovery」
