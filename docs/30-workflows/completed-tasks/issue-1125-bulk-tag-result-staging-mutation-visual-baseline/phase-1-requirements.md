# Phase 1 — 要件定義

> **実装区分: 実装仕様書** — 新規 Playwright spec 1 + seed/cleanup SQL 2 + capture runner shell 1 のコード追加を伴う（CONST_004）。

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1125-bulk-tag-result-staging-mutation-visual-baseline` |
| task_id | `TASK-ISSUE-1125-BULK-TAG-RESULT-STAGING-MUTATION-VISUAL-001` |
| implementation_mode | `new`（成果物コードは新規追加。bulk tag 機能本体は landed 済み） |
| GitHub issue | [#1125](https://github.com/daishiman/UBM-Hyogo/issues/1125)（**CLOSED 維持**） |

---

## 1.1 真の論点

issue #1125 の表層は「bulk tag UI の result screenshot を取りたい」だが、本質的な論点は 3 つの最適化である:

1. **証跡の hole**: result 2 状態（all-success / partial-failure）の visual 証跡は `apps/web/playwright/tests/issue1036-bulk-member-tags.spec.ts:136-146` の `page.setContent()` local fixture でしか取得できていない。実機 `/admin/members` で実 `POST /admin/members/tags/bulk` mutation を経た result summary の証跡が無い（親 issue-1077 が picker 2 状態を read-only で消化した際、result 2 状態は staging D1 副作用ゆえ明示的にスコープ外とされ Issue #1125 へ trace された）。
2. **issue の前提が古い**: issue 作成時（2026-06-03）は「手動 user-gated screenshot 取得」前提だったが、その後 (a) 認証付き staging Playwright 基盤（`setup.staging-auth.ts` / `staging-visual-authenticated` project）と (b) staging D1 seed/cleanup + redact 基盤（issue-1081 `scripts/smoke/runtime-tag-bulk.sh`）が landed した。**真の最適化**は手動取得をやめ、両基盤に乗せた **mutation interaction-gated authenticated staging Playwright spec + seed/cleanup runner** をコード化すること。
3. **副作用境界の設計**: result baseline は実 mutation = staging 共有 D1 への破壊的副作用を伴う。これを安全化する論点は「synthetic prefix `e2e_test_issue1125_` への限定」「`trap ... EXIT` による確実な cleanup」「staging guard（production 拒否）」「mutation 対象 ID の実行ログ記録」である。

機能本体（`BulkActionBar.tsx` の tag bulk、`POST /admin/members/tags/bulk`、`bulkApplyMemberTagsByAdmin`）は dev に landed 済み。本タスクは **テストコード + staging fixture + runner の新規追加のみ**で、apps/api・apps/web のアプリ本体ソース・D1 schema・Google Form は一切変更しない。

---

## 1.2 スコープ in / out

| 状態 | 取得方法 | スコープ |
| --- | --- | --- |
| `bulk-tag-result-all-success` | 認証 staging で active member 2 名選択 → 登録済み tag 適用 → 全成功 result（**実 mutation**） | ✅ in |
| `bulk-tag-result-partial-failure` | 認証 staging で active + 退会済み member 混在選択 → 登録済み tag 適用 → `skipped` を含む result（**実 mutation**） | ✅ in |
| `notFound`（未登録 tag）の視覚網羅 | tag picker は登録済み tag しか描画しないため UI 操作で再現不可 | ❌ out（代替担保あり・下記） |

### `notFound` 視覚網羅を除外する理由（先送りではない scope-out）

`bulk-tag-result-not-found`（未登録 tagId の `notFound`）は、UI の tag picker が `tag_definitions.active=1` の登録済み tag しか描画しない設計上、**UI 操作だけでは自然発生させられない**。この視覚要素は次で既に担保済みであり、本タスクで未取得のまま残す「先送り」ではない:

- 親 local fixture `bulk-tag-result-partial-failure.png`（`page.setContent()` で `notFound` を含む状態を描画済み・`issue1036-bulk-member-tags.spec.ts`）
- component spec `BulkActionBar.spec.tsx` TC-BAB-TAG-03（result summary の counts / skipped / notFound 描画を unit で担保）

本タスクの partial-failure baseline は **退会済み member による `skipped`** を主軸とする（実 mutation + UI 操作で確実に再現可能）。判断根拠は `outputs/phase-12/unassigned-task-detection.md` に baseline 項目として記録する（current gap ではなく代替担保済みの scope-out）。

---

## 1.3 受け入れ基準（index.md と整合）

index.md §1 の AC-1〜AC-8 を正本とする。要点:

- AC-1: 専用 staging fixture（`e2e_test_issue1125_` prefix）を seed する。
- AC-2: all-success result summary の baseline を取得する。
- AC-3: partial-failure（`skipped` を含む）result summary の baseline を取得する。
- AC-4: canonical 名が phase-11 / implementation-guide / artifacts ledger と一致する。
- AC-5: `trap ... EXIT` で確実に cleanup し synthetic 残存 0 を検証する。
- AC-6: 実行ログに認証経路・URL・command・保存先・mutation 対象 ID・seed/cleanup 結果を残す。
- AC-7: staging guard（production 拒否 / `CF_D1_DATABASE=ubm-hyogo-db-staging`）。
- AC-8: アプリ本体ソース・D1 schema・Google Form を変更しない。

---

## 1.4 現状 inventory（実コード確認済み）

| 要素 | 現状 |
| --- | --- |
| `BulkActionBar` result summary | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx:387-417`。`bulkResult` 存在時に `data-testid="bulk-tag-result"`（`aria-live="polite"`）を描画。内部に `bulk-tag-result-counts`（付与/解除/変更なし/退会済みスキップ/未登録タグ）、`skipped.length>0` で `bulk-tag-result-skipped`、`notFound.length>0` で `bulk-tag-result-not-found`。 |
| apply ボタン | 同 `:374-385`。`runBulkTags` を呼び `POST /admin/members/tags/bulk` を実行。ラベルは `${selectedIds.length}人 × ${selectedTagIds.size}タグ を${verb}`。 |
| bulk route | `apps/api/src/routes/admin/members.ts:726` `app.post("/members/tags/bulk", ...)`。`bulkApplyMemberTagsByAdmin` を呼び、item.status ごとに audit（`admin.member.tag_assigned` / `admin.member.tag_unassigned`）。 |
| status 判定 | `apps/api/src/repository/memberTags.ts` の `bulkApplyMemberTagsByAdmin`（Phase 2 で詳細確定）。status: `assigned` / `unassigned` / `noop` / `skipped`（退会済み member）/ `notFound`（未登録 tag）。 |
| members list | `MembersTable.tsx` 行 `data-testid="admin-members-row-{memberId}"`、行内チェックボックス `aria-label="{fullName} を選択"`。selection は `MembersClientShell.tsx` の `selected: Set<string>`。 |
| staging 認証基盤 | `setup.staging-auth.ts` が `admin.storageState.json` を mint。`staging-visual-authenticated` project（`playwright.config.ts`）が `testDir: ./playwright/tests/visual-staging-authenticated` で自動登録。snapshot 名前空間 `{arg}-authenticated-staging-visual-{platform}`。 |
| read-only 先例 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`（picker 2 状態・mutation 非実行）。本タスクの参照モデル。 |
| seed/cleanup + runner 先例 | issue-1081 `scripts/smoke/runtime-tag-bulk.sh` + `apps/api/migrations/seed/bulk-tag-staging-{seed,cleanup}.sql`（prefix `e2e_test_issue1081_`・`trap` cleanup・`redact.sh`・staging guard）。本タスクの seed/cleanup/runner 参照モデル。 |
| 既存 seed の制約 | issue-1081 seed は両 member とも `member_status.is_deleted=0`（active）→ **partial-failure（退会済み skipped）を再現できない**。本タスクは退会済み member を含む専用 seed が必須。 |

---

## 1.5 命名規則

- spec ファイル名（既存 authenticated spec の kebab-case + `-authenticated.spec.ts` に倣う）:
  `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts`
- seed/cleanup SQL（issue-1081 の `bulk-tag-staging-{seed,cleanup}.sql` に倣う）:
  `apps/api/migrations/seed/bulk-tag-result-staging-seed.sql` / `bulk-tag-result-staging-cleanup.sql`
- capture runner（issue-1081 `runtime-tag-bulk.sh` に倣う）:
  `scripts/smoke/capture-bulk-tag-result.sh`
- synthetic prefix: `e2e_test_issue1125_`
- canonical screenshot 名（`toHaveScreenshot` arg）:
  - `bulk-tag-result-all-success.png`
  - `bulk-tag-result-partial-failure.png`
- 変数: camelCase（`bulkRegion`, `allSuccessMember` 等）。

---

## 1.6 P50（単一責務）チェック

- 機能本体は実装済み（verify_existing 寄り）だが、本タスクの成果物（spec / seed / cleanup / runner）は **新規ファイル**であり `implementation_mode = "new"`。
- 単一責務: 「認証 staging 実機で実 mutation を経た result 2 状態の visual baseline を、安全な seed/cleanup 境界の中で取得する」。
- 依存タスク: 親 issue-1036（landed）、部分消化 issue-1077（landed）、seed/cleanup 基盤 issue-1081（landed）。すべて完了済みのため依存解消タスクは不要。

---

## 1.7 targeted test ファイルリスト

| 種別 | パス |
| --- | --- |
| 新規（実装ファイル） | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts` |
| 新規（fixture） | `apps/api/migrations/seed/bulk-tag-result-staging-seed.sql` |
| 新規（fixture） | `apps/api/migrations/seed/bulk-tag-result-staging-cleanup.sql` |
| 新規（runner） | `scripts/smoke/capture-bulk-tag-result.sh` |
| 新規（runner test） | `scripts/smoke/__tests__/capture-bulk-tag-result.test.sh`（Phase 6 で追加。seed/cleanup/guard の shell 単体検証） |
| 回帰（変更しないが実行する） | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` |
| config 編集 | **不要**（`testDir` + `testIgnore` で自動登録） |
