# ut-07b-fu-02-admin-schema-alias-retry-label - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | UT-07B-FU-02 管理 UI schema alias retryable back-fill 表示 |
| GitHub Issue | #362（CLOSED 維持 / 再 OPEN しない / PR 文面は `Refs #362`） |
| 親タスク | ut-07b-schema-alias-hardening |
| 関連タスク | ut-07b-fu-01-schema-alias-backfill-queue-cron-split |
| 起票元 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md` |
| 作成日 | 2026-05-06 |
| ステータス | implemented-local（web 実装 + focused tests 完了 / runtime screenshot pending / PR user-gated） |
| 総 Phase 数 | 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| Wave | 2 |
| 優先度 | LOW |
| 見積もり規模 | 小規模（admin UI 1 component + API client narrowing + tests） |

---

## 実装区分

`[実装区分: 実装仕様書]`

判定根拠: 本タスクは Issue #362 body 上「small / improvement」のラベルだが、目的（HTTP 202 / `backfill_cpu_budget_exhausted` / `retryable=true` を運用者が通常エラーと区別できるよう管理 UI に表示する）を達成するには、`apps/web/src/lib/admin/api.ts` の `postSchemaAlias` 戻り値拡張、`apps/web/src/components/admin/SchemaDiffPanel.tsx` の表示分岐追加、`apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx` および `apps/web/src/lib/admin/__tests__/api.test.ts` のテスト追加が不可避である。CONST_004 に従い実装仕様書として作成する。

---

## 目的

UT-07B schema alias hardening で導入された retryable continuation contract（HTTP 202 + `code='backfill_cpu_budget_exhausted'` + `retryable=true` + `backfill.status='exhausted'`）を、管理 UI 側で「失敗」とは異なる「続きから再試行できる状態」として運用者に見せる。alias 確定（`confirmed=true`）と back-fill 残件（`backfill.status`）の責務分離を UI 表示にも反映する。

API contract（`apps/api/src/routes/admin/schema.ts` の POST `/schema/aliases` 200/202 分岐、`apps/api/src/workflows/schemaAliasAssign.ts` の retryable union）は変更しない。

---

## スコープ

### 含む

- `apps/web/src/lib/admin/api.ts#postSchemaAlias` の戻り値型を `status` / `body` を保持する narrow union に拡張（`call` 内部で 202 を ok 扱いに保ったまま、status code と body を component に伝播）
- `apps/web/src/components/admin/SchemaDiffPanel.tsx` への retryable continuation 表示追加（既存の toast 表示を 4 状態に拡張: success / validation error / conflict error / retryable continuation）
- 表示文言: 短い retryable label（例: 「Back-fill 再試行可能（続きから処理）」）と補助説明
- 再実行導線: 既存 `割当` ボタンの再押下を retry 経路として扱い、loading / disabled 制御で重複送信を防ぐ
- `SchemaDiffPanel.test.tsx` に 4 fixture を追加: 200 success / 202 retryable continuation / 422 validation error / 409 conflict error
- `api.test.ts` に 202 response の status / body 透過テストを追加
- `outputs/phase-11/` への component test 出力 evidence と manual screenshot
- `outputs/phase-12/implementation-guide.md`（中学生レベル + 技術者レベル）

### 含まない

- API contract の変更（200/202/422/409 分岐、`schemaAliasAssign.ts` の union、`mapBackfillToV2`）
- queue / cron / migration の追加（UT-07B-FU-01 で扱う）
- back-fill 状態取得 API（GET `/schema/aliases/:diffId/backfill`）の UI 化（本タスクではポーリング機能は追加しない）
- 監視アラート / 通知基盤の変更
- commit / push / PR 作成（ユーザー明示承認まで禁止）

---

## 不変条件 / 既存契約の参照

| 不変条件 | 適用 |
| --- | --- |
| #5 D1 直接アクセスは `apps/api` 限定 | 本タスクは web 側の表示変更のみ。fetch 先は同一 origin の `/api/admin/*` proxy 経由のまま維持 |
| #11 profile 本文編集 mutation を web に追加しない | 本タスクは schema alias 確定の表示改善であり、profile mutation を追加しない |
| #14 schema 解消は `/admin/schema` 画面のみ | 表示分岐は本画面 / 本 component に閉じる |

参照 API contract（変更禁止）:

- `apps/api/src/routes/admin/schema.ts` line 196-241: apply 時の 200/202 切替と `confirmed` / `backfill.status` 分離
- `apps/api/src/workflows/schemaAliasAssign.ts` line 47-55: `BackfillResult` union（`completed` / `exhausted` retryable=true）

---

## Phase 一覧

| Phase | 内容 | 状態 |
| --- | --- | --- |
| 01 | 要件定義 | completed |
| 02 | 設計（response narrowing / 表示分岐） | completed |
| 03 | 設計レビューゲート（design-spec gate） | completed |
| 04 | 検証戦略 | completed |
| 05 | 実装（API client / SchemaDiffPanel） | completed |
| 06 | 異常系（4 状態区別） | completed |
| 07 | AC マトリクス | completed |
| 08 | DRY 化 / 仕様間整合 | completed |
| 09 | 品質保証（typecheck / lint / unit） | completed |
| 10 | 最終レビューゲート（implementation-ready gate） | completed |
| 11 | 手動検証（component evidence captured / screenshot pending） | blocked_runtime_visual_pending |
| 12 | ドキュメント更新 | completed |
| 13 | PR 作成 | blocked_pending_user_approval |

---

## 完了条件（ワークフロー全体）

- 仕様書 13 ファイル + `artifacts.json` + `index.md` が作成済み
- `apps/web/src/lib/admin/api.ts` / `apps/web/src/components/admin/SchemaDiffPanel.tsx` / focused tests に実装済み
- Focused Vitest: 30 tests PASS、JUnit evidence は `outputs/phase-11/test-junit.xml`
- 既存 UT-07B / UT-07B-FU-01 仕様との整合（API contract 不変）
- runtime screenshot / commit / push / PR は user-gated のまま
