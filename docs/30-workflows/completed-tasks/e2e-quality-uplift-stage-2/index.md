# Stage 2 — Admin route 未カバー領域の E2E + Contract テスト追加

| 項目 | 値 |
|------|-----|
| Workflow ID | `e2e-quality-uplift-stage-2` |
| Branch | `feat/e2e-quality-uplift` |
| 起点日 | 2026-05-08 |
| Tier | standard (lines >= 70%, critical route smoke 100%) |
| 単一サイクル | CONST_007 適用 |
| Implementation Mode | `new` (4 sub-task すべて新規) |
| 依存 | Stage 1（既存 admin smoke / fixtures 整備）完了前提 |

## 機械検証メタ情報

| key | value |
| --- | --- |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| coverageTier | standard |
| workflow_state | spec_verified |
| evidence_state | runtime_pending |

---

## 背景

PR #594（Stage 1）は admin smoke を 5 画面 × 3 ロールでカバーしたが、以下 3 routes は **mutation flow が未カバー**のまま残った。

| Route | Mutation 系 endpoint | リスク |
|-------|---------------------|--------|
| `/admin/requests` | `POST /admin/requests/:noteId/resolve` | approve/reject 結果の DB 不整合・二重実行 |
| `/admin/identity-conflicts` | `POST /admin/identity-conflicts/:id/merge` / `dismiss` | merge による member データ破壊 |
| `/admin/members`（delete gate） | `POST /admin/members/:memberId/delete` | cascade 削除 / audit 連動の失敗 |

加えて、これら 3 routes に触れる **UI ↔ API shape** の契約検証が未追加。

---

## サブタスク構成

| ID | spec ファイル | 対象 route | 主目的 |
|----|--------------|-----------|--------|
| 2a | `admin-requests.spec.ts` | `/admin/requests` | approve/reject + race + 認可 |
| 2b | `admin-identity-conflicts.spec.ts` | `/admin/identity-conflicts` | merge/dismiss + DB 整合 + 認可 |
| 2c | `admin-member-delete.spec.ts` | `/admin/members` (delete gate) | 二段確認 + cascade + audit + 認可 |
| 2d | contract test 拡張 | 2a/2b/2c が叩く全 endpoint | UI ↔ API shape 同型性 |

---

## 受け入れ基準（Stage 全体）

1. 上記 4 ファイルが追加され、`pnpm --filter @ubm-hyogo/web test:e2e` で green。
2. 各 route の Mutation flow が **少なくとも 1 つの成功系 + 1 つの失敗系** を含む。
3. admin-only 認可境界が member / anonymous の 2 ロール分岐で確認される。
4. `page.route()` mock により D1 直接アクセスを必要としない（`apps/web` から D1 binding 禁止の不変条件 5 を維持）。
5. contract test が 2a/2b/2c で参照する全 endpoint shape を網羅する。
6. critical route smoke 成功率 100%、line coverage >= 70%（standard tier）。

---

## 不変条件（Stage 横断）

- 既存 API endpoint surface のみ利用。新規 endpoint・D1 schema 変更は禁止（CLAUDE.md UI alignment 不変条件 1 と整合）。
- `apps/web` から D1 直接アクセス禁止（CLAUDE.md 重要不変条件 5）。
- E2E は `apps/web/playwright/fixtures/auth.ts:1-67` の `adminPage` / `memberPage` / `anonymousPage` fixture を再利用する。新 fixture 禁止。
- `page.route()` で API endpoint を mock し、決定論的 flow を保証する。
- Tokens は OKLch 正本（HEX 直書き禁止、CLAUDE.md UI alignment 不変条件 2）。テスト内 selector も色値依存にしない。
- spec のみ作成。コード生成・テスト実装は本ワークフローの範囲外。

---

## API endpoint inventory (mock 対象)

| sub-task | method | path | 実装位置 |
|----------|--------|------|---------|
| 2a | GET | `/admin/requests` | `apps/api/src/routes/admin/requests.ts:194` |
| 2a | POST | `/admin/requests/:noteId/resolve` | `apps/api/src/routes/admin/requests.ts:254` |
| 2b | GET | `/admin/identity-conflicts` | `apps/api/src/routes/admin/identity-conflicts.ts:38` |
| 2b | POST | `/admin/identity-conflicts/:id/merge` | `apps/api/src/routes/admin/identity-conflicts.ts:54` |
| 2b | POST | `/admin/identity-conflicts/:id/dismiss` | `apps/api/src/routes/admin/identity-conflicts.ts:91` |
| 2c | POST | `/admin/members/:memberId/delete` | `apps/api/src/routes/admin/member-delete.ts:44` |
| 2c | GET | `/admin/audit` | `apps/api/src/routes/admin/audit.ts:144` |
| 2c | POST | `/admin/members/:memberId/restore` | `apps/api/src/routes/admin/member-delete.ts:121` (参考) |

> 全 endpoint は実装済み。**API 実装ブロッカーなし**（phase-3 Open Questions 参照）。

---

## Phase 1-13 ステータス

| Phase | 内容 | 状態 |
|-------|------|------|
| 1 | 要件定義 | done (`phase-1.md`) |
| 2 | 設計 | done (`phase-2.md`) |
| 3 | 設計レビュー（4-condition gate） | done (`phase-3.md`) |
| 4 | テスト作成（TDD Red） | done (`phase-4.md`) |
| 5 | 実装（TDD Green） | done (`phase-5.md`) |
| 6 | テスト拡充 | done (`phase-6.md`) |
| 7 | カバレッジ確認 | done (`phase-7.md`) |
| 8 | リファクタリング | done (`phase-8.md`) |
| 9 | 品質保証 | done (`phase-9.md`) |
| 10 | 最終レビュー | done (`phase-10.md`) |
| 11 | 手動テスト（3 層評価） | done (`phase-11.md`) |
| 12 | ドキュメント更新（implementation guide Part 1/2） | done (`phase-12.md`) |
| 13 | PR 作成（base = `dev`） | done (`phase-13.md`) |

---

## 関連ワークフロー

- Stage 1: `docs/30-workflows/e2e-quality-uplift-stage-1/`（依存・前提）
- Stage 0: `docs/30-workflows/e2e-quality-uplift-stage-0/`
- Stage 3: `docs/30-workflows/e2e-quality-uplift-stage-3/`（後続）
- 本ワークフローは UI alignment と独立し、E2E 品質軸のみを扱う。
