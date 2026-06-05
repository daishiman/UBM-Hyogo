# Phase 10: 最終レビュー / Gate 判定

**[実装区分: 実装仕様書]**

> AC-1..AC-6（DESIGN-BRIEF §3）の達成可否を実装箇所・テストへ写像して確認し、MINOR 指摘を Phase 12 未タスク化対象として切り出す。本サイクルは `implemented_local_evidence_captured` であり、local 実装・検証まで完了した。

## 1. AC 達成チェックリスト（AC → 実装箇所 → テスト）

| AC | 内容 | 実装箇所 | 検証テスト | 判定 |
|----|------|---------|-----------|------|
| AC-1 | tag `code` rename を許可する ADR が記録されている（immutable → mutable へ改訂） | Phase 2 ADR（issue-1035 `issue_optimization_note` を supersede）+ `docs/00-getting-started-manual/specs/01-api-schema.md` 不変条件 #13 改訂 | spec 改訂の存在（Phase 9 DoD #5） | ✅ 写像済 |
| AC-2 | rename API は code uniqueness（`tag_code_conflict` 409）と optimistic conflict（`tag_stale_conflict` 409）を**別々の** error code で返す | `repository/tagDefinitions.ts` の `updateTagDefinition`（UNIQUE catch → `code_conflict` / `expectedCode` mismatch / CAS update 0 → `stale`）+ `routes/admin/tags.ts` の `ERROR_TO_STATUS`（`tag_code_conflict:409` / `tag_stale_conflict:409`）+ result map | `tags.contract.spec.ts` C-2（409 tag_code_conflict）/ C-3（409 tag_stale_conflict）/ `tagDefinitions.write.repository.spec.ts` R-2 / R-3 | ✅ 写像済 |
| AC-3 | 既存 `member_tags` row の参照整合が rename 後も保たれる | `member_tags` は `PRIMARY KEY (member_id, tag_id)` で tag_id 参照。rename は tag_id を変えない（設計上無傷） | `tagDefinitions.write.repository.spec.ts` R-5（rename 後も member_tags row 残存・tag_id 一致）/ `members.tags.contract.spec.ts` Reg-1（解決が tag_id 経由） | ✅ 写像済 |
| AC-4 | rename 前後の audit log に old/new code が残る | `routes/admin/tags.ts` PATCH ハンドラの audit 発火（`before.code !== after.code` 時に `admin.tag.code_renamed`、before `{code: old}` / after `{code: new}`）+ `appendTagAudit` action union 拡張 | `tags.contract.spec.ts` C-5（audit row に old/new code）/ `auditLog.repository.spec.ts` Reg-2（action 文字列 append） | ✅ 写像済 |
| AC-5 | seed / static manifest / admin UI 表示で stale code が残らないことを grep または focused test で確認 | `0004_seed_tags.sql` は OR IGNORE（PK=tag_id idempotent）で無害。admin UI は未整備で stale 表示導線なし | Phase 9 §5 grep evidence + `verify:static-manifest` PASS（Phase 9 DoD #4） | ✅ 写像済 |
| AC-6 | rename を許可した結果の運用注意（seed と code がずれ得る点）を spec に明記 | `specs/01-api-schema.md` 不変条件 #13 注記（runbook ではなく spec の不変条件に閉じる） | spec 改訂内容に「seed と code がずれ得る」運用注意が含まれること | ✅ 写像済 |

## 2. result map exhaustiveness 確認

`updateTagDefinition` の discriminated union（`ok:true` / `not_found` / `code_conflict` / `missing_expected_code` / `stale`）を route の result map が**網羅**することをレビュー観点とする:

| repository reason | route error code | HTTP status |
|-------------------|------------------|-------------|
| `not_found` | `tag_not_found` | 404 |
| `code_conflict` | `tag_code_conflict` | 409 |
| `missing_expected_code` | `invalid_body` | 400 |
| `stale` | `tag_stale_conflict` | 409 |
| `ok:true` | （成功）`rowBody(after)` | 200 |

> 4 分岐が漏れなく写像され、typecheck が exhaustive を担保することを green 基準とする（Phase 9 §4）。

## 3. MINOR 指摘 → Phase 12 未タスク化対象（unassigned-task-guidelines 準拠）

本タスクのスコープ外であり、別 follow-up として切り出す（本サイクルでは実装しない）。詳細は `outputs/phase-12/unassigned-task-detection.md` に登録する。

| # | 候補 | 種別 | スコープ外の根拠 |
|---|------|------|-----------------|
| U-1 | **admin tag master の code 編集 UI 導線**（apps/web） | UI / `apps/web` | 本タスクは rename **API surface のみ**（NON_VISUAL）。admin tag master の専用 CRUD UI ページは現状未整備であり、code 編集導線（フォーム + CAS 用 expectedCode 連携 + 409 tag_code_conflict / tag_stale_conflict のエラー表示）は別実装サイクルを要する。Phase 12 未タスク化候補として明記 |
| U-2 | **tag 物理削除 / reactivate** | API | rename は code 変更のみ。物理 DELETE・再有効化（active=0→1）は本 issue スコープ外で別設計判断が必要（issue-1035 の U-3 を継承） |

## 4. blocker 判定（CONST_007 充足）

- 変更対象は `apps/api` の repository 1 ファイル編集 + route 1 ファイル編集 + spec 1 節改訂 + test 2〜3 ファイル編集。**外部依存・前提タスク待ちは無い**（親 issue-1035 完了済・supersede 関係明確）。
- 設計上の未確定点（参照整合 / seed drift / audit ambiguity / 409 churn 分離）は DESIGN-BRIEF §2 の supersede 根拠 1..4 で確定済み。
- D1 schema 変更は不要（`expectedCode` CAS は `UPDATE ... WHERE tag_id AND code` の atomic compare-and-swap で実現・新カラム不要）。
- → **本サイクル内で全 AC を 1 実装サイクルで完了できる。blocker なし（CONST_007 充足）**。

## 5. Gate 判定

| Gate | 判定 | 備考 |
|------|------|------|
| Gate-A（設計レビュー） | **PASS（spec 上）** | DESIGN-BRIEF §2 supersede 根拠 + §5 シグネチャ確定 |
| Gate-B（品質保証） | **PASS** | focused D1 Vitest / typecheck / lint / static manifest verification PASS |
| Gate-C（最終レビュー） | **PASS（spec 上）** | AC-1..AC-6 写像完了 + 正本 spec 改訂方針確定 |

## 6. 4 条件評価

| 条件 | 評価 |
|------|------|
| 単一責務 | tag `code` rename パス（CAS + UNIQUE 分離 + 専用 audit）の追加に限定。create/deactivate は非接触 |
| 1 実装サイクル完結 | apps/api 内 edit のみ・D1 schema/新 endpoint なし・前提タスク待ちなし（§4）→ 完結可 |
| 既存 contract 後方互換 | code/expectedCode を送らない PATCH は issue-1035 と同一挙動（C-6 / Reg-1 / Reg-2 で保証） |
| user-gated 境界 | commit / push / PR / staging deploy / Issue #1069 状態変更は未実行（Phase 13） |

## 7. runtime boundary

spec 上の設計レビューは完了。focused D1 Vitest・typecheck・lint・verify:static-manifest の実測、staging deploy / runtime smoke / commit / push / PR / Issue #1069 状態変更は user-gated。Issue #1069 は 2026-06-03 に外部で **CLOSED**（本ワークフローは状態変更せず）。
