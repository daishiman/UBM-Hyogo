# ut-07b-schema-alias-hardening - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | ut-07b-schema-alias-hardening |
| GitHub Issue | #293（CLOSED のままタスク仕様書のみ作成 / 再 OPEN しない） |
| 親タスク | 07b-parallel-schema-diff-alias-assignment-workflow |
| 起票元 | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md` |
| 検出仕様書 | `docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md` |
| 作成日 | 2026-05-01 |
| ステータス | implemented-local |
| 総 Phase 数 | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| 優先度 | HIGH |
| 見積もり規模 | 中規模（migration / repository / workflow / route / test の更新） |

---

## 目的

07b で実装した schema alias assignment workflow を、(1) **同一 revision 内での stableKey collision を防ぐ DB 物理制約**、(2) **alias 確定と back-fill を分離した再開可能な workflow**、(3) **10,000 行以上の Workers / D1 実測**、(4) **CPU budget 超過時の retryable HTTP contract** の 4 軸で運用に耐える状態へ強化する。

## スコープ

### 含む

- `apps/api/migrations/*.sql` 確認後の `schema_questions(revision_id, stable_key)` UNIQUE index（または同等 partial unique）追加可否判断と migration 起草
- 既存データ衝突検出 SQL と rollback 手順の正本化
- alias 確定と response_fields back-fill の責務分離（単一 transaction → 段階化）
- CPU budget 超過時の `backfill_cpu_budget_exhausted` retryable response（HTTP status / response body）の API contract 化
- back-fill の idempotent 条件（残件のみ処理）と repository test 固定
- 10,000 行以上の `response_fields` fixture を staging D1 / Workers で実測し Phase 11 evidence に残す
- route / workflow / repository unit test の更新（collision / retry / idempotent）
- `aiworkflow-requirements` の `api-endpoints.md` / `database-schema.md` / `task-workflow-active.md` / indexes 同期

### 含まない

- 管理 UI の新規画面追加（既存 admin schema UI の最小限の表示調整を除く）
- 無関係な schema diff algorithm 改修
- queue / cron 分割実装（実測結果次第で別タスクに分離する判断は本タスクで行うが、実装委譲）
- Phase 13 の commit / push / PR 作成（user_approval 必須）

## 受入条件（AC）

- AC-1: `schema_questions(revision_id, stable_key)` の同一 revision collision が DB constraint（UNIQUE index または同等の partial unique）と repository pre-check の二段防御で保証されている
- AC-2: 既存データ衝突検出 SQL と rollback 手順が Phase 5 runbook に記載され、UT-04 / 本 migration の適用順序が明示
- AC-3: alias 確定と back-fill 継続の状態が分離され、CPU budget 超過後の再実行で残件のみ処理される（idempotent）
- AC-4: `backfill_cpu_budget_exhausted` retryable failure が API contract（HTTP status / response body）として正本化され、route test で境界が固定
- AC-5: 10,000 行以上の `response_fields` fixture を staging D1 / Workers 実環境で実測し、batch 数 / CPU 時間 / retry 回数が Phase 11 evidence に残る
- AC-6: 実 DB schema（`response_fields` に `questionId` / `is_deleted` カラムが存在しない事実）と仕様書差分の吸収方針が Phase 1 / Phase 5 implementation guide で明示
- AC-7: unit / route / workflow tests が collision / retryable failure / idempotent retry / CPU budget 超過を網羅
- AC-8: 不変条件 #5（D1 直接アクセスは apps/api 限定）違反ゼロ。migration / repository / workflow すべて apps/api 配下に閉じる
- AC-9: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き
- AC-10: Phase 12 で 7 必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main）を確認

---

## Phase 一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | completed |
| 2 | 設計（DB 制約 + 再開可能 back-fill + retryable contract） | [phase-02.md](phase-02.md) | completed |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | completed |
| 4 | 検証戦略 | phase-04.md | completed |
| 5 | 仕様 runbook 作成（migration / rollback / API contract） | phase-05.md | completed |
| 6 | 異常系（衝突 / CPU budget / 部分失敗） | phase-06.md | completed |
| 7 | AC マトリクス | phase-07.md | completed |
| 8 | DRY 化 / 仕様間整合 | phase-08.md | completed |
| 9 | 品質保証 | phase-09.md | completed |
| 10 | 最終レビューゲート | phase-10.md | completed |
| 11 | 手動検証（NON_VISUAL 縮約 + 大規模実測 evidence） | phase-11.md | completed-local / staging-deferred |
| 12 | ドキュメント更新 | phase-12.md | completed |
| 13 | PR 作成 | phase-13.md | pending_user_approval |

---

## 実行フロー

```
Phase 1 → Phase 2 → Phase 3 (Gate) → Phase 4 → Phase 5 → Phase 6 → Phase 7
                         ↓                                      ↓
                    (MAJOR→戻り)                           (未達→戻り)
                         ↓                                      ↓
Phase 8 → Phase 9 → Phase 10 (Gate) → Phase 11 → Phase 12 → Phase 13 → 完了
```

---

## 不変条件への影響

| # | 不変条件 | 本タスクの取り扱い |
| --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | `__extra__:<questionId>` alias の取り扱いは既存方針を維持。新規ハードコードは行わない |
| 4 | admin-managed data はフォーム外として分離 | alias / stableKey 編集は admin operation。既存方針を維持 |
| 5 | D1 への直接アクセスは `apps/api` に閉じる | **本タスクの中心制約**。migration / repository / workflow すべて apps/api 内で完結。`apps/web` からの D1 binding 直接参照を発生させない |

---

## 主要参照

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md` | 起票仕様（source of truth） |
| 必須 | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/implementation-guide.md` | 07b 完了状態 / 実 DB と仕様書の差分吸収根拠 |
| 必須 | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md` | 検出根拠 |
| 必須 | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/skill-feedback-report.md` | 苦戦箇所 lessons learned |
| 必須 | `apps/api/migrations/*.sql` | 実 DB schema（`schema_questions` / `response_fields` / `schema_diff_queue`） |
| 必須 | `apps/api/src/repository/schemaQuestions.ts` | revision-scoped stableKey collision pre-check |
| 必須 | `apps/api/src/workflows/schemaAliasAssign.ts` | alias 確定 / back-fill workflow / CPU budget 処理 |
| 必須 | `apps/api/src/routes/admin/schema.ts`（または該当 route） | dryRun / apply / retryable failure 境界 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | API contract 正本 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | D1 schema 正本 |

---

## 注意事項

- **Issue #293 は CLOSED のまま再 OPEN しない**。本タスクは「実装を伴う未タスク仕様書化」であり、PR 文面でも `Closes #293` は使わず `Refs #293` を用いる。close 主導はしない。
- 実装はするが、コミット / push / PR 作成は Phase 13 で user_approval 必須。
- 10,000 行 fixture の実測が CPU budget を恒常的に超える場合、queue / cron 分割を**本タスクで採用するか別タスクに分離するかの判断**を Phase 2-3 / Phase 11 で行う（仕様書は「分離決定 = follow-up 起票」も成立とする）。
- migration は **変換 UPDATE / 衝突解消 → UNIQUE index 追加 / partial unique 追加** の順序を必須とする（CHECK 句追加と同じ 2 段階パターン）。

## Decision Log

- 2026-05-01: Issue #293 CLOSED 状態維持を確認。本仕様書は spec_created として作成し、PR 文面でも `Closes #293` を使わず `Refs #293` を採用する。
- 2026-05-01: taskType = implementation。docs-only ではなく migration / repository / workflow / route / test の実コード更新を伴う。visualEvidence = NON_VISUAL（admin API + DB 系で UI 追加なし）。
