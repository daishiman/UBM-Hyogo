---
workflow_id: issue-1078-bulk-tag-picker-large-catalog-ux
workflow_state: implemented_local_evidence_captured
created_at: 2026-06-03
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
implementation_status: implementation_complete_pending_pr
branch: docs/issue-1078-bulk-tag-picker-large-catalog-ux-spec
related_issue: 1078
issue_state: CLOSED
parent_workflow: issue-1036-bulk-member-tag-assign
---

# issue-1078 BulkActionBar tag picker 大規模 tag catalog UX 改善 + tag master read contract 修正

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-1078-bulk-tag-picker-large-catalog-ux |
| workflow_state | implemented_local_evidence_captured |
| verdict | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| implementation_status | implementation_complete_pending_pr |
| user-gated | staging authenticated visual baseline / commit / push / PR / GitHub issue mutation |

## 概要

admin members 一覧の `BulkActionBar` tag picker（issue-1036 で実装）を、tag master が
増えても破綻しない大規模 catalog UX へ改善する。検索 / category 折りたたみ / 表示上限
（max-height + overflow）/ 選択済み tag の固定表示を導入し、`GET /admin/tags`（#1035 で
pagination/search 化済み）の client contract を正しく接続する。

- GitHub Issue: [#1078](https://github.com/daishiman/UBM-Hyogo/issues/1078)（= `task-issue-1036-followup-002-bulk-tag-picker-large-catalog-ux`）
- 親 workflow: `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/`
- 元仕様書: `docs/30-workflows/unassigned-task/task-issue-1036-followup-002-bulk-tag-picker-large-catalog-ux.md`

## 実装区分

**`[実装区分: 実装仕様書]`** — apps/web のコード変更を伴う。
ユーザー指定（issue body）は priority:low の「将来 UX 改善」だが、調査の結果、現コードに
**P0 correctness バグ（tag picker が runtime クラッシュ／空表示し得る contract 不一致）**が
潜在することを確認したため、cosmetic UX 改善だけでなく root-cause 修正を含む実装仕様書として
作成する（CONST_004: ラベルより実態優先）。判断根拠は下記「最新コードへの最適化ポイント」を参照。

> apps/api は #1035（CLOSED）で `GET /admin/tags` が `{ q, page, pageSize }` クエリ +
> `{ total, items }` レスポンスへ pagination/search 化済みのため、**本タスクで apps/api の
> 変更は不要**（不変条件: 既存 API のみ接続）。

## GitHub Issue 状態に関する重要注記

- ユーザーは本 issue を「クローズド」と認識しているが、**実際の GitHub 上の状態は `OPEN`**
  （`closedAt: null`、2026-06-03 時点）である。
- ユーザー依頼「クローズドのままタスク仕様書を作成する」に従い、**本タスクでは issue 状態を
  一切 mutate しない**（reopen も close もしない）。状態の乖離は最終レポートで報告し、
  close/コメントは user-gated とする。

## 調査による判定（issue が古い可能性への対応）

| 観点 | 判定 | 根拠 |
|------|------|------|
| 別タスクで解決済みか | **未解決** | `BulkActionBar.tsx` に検索 / 折りたたみ / max-height / overflow は不在（L213-238 全件 category grouping 描画）。他 issue（#1035/#1068/#1069/#1070 すべて CLOSED）でも client-side large catalog UX は扱われていない。 |
| 実装は必要か | **必要** | AC-1（検索/折りたたみ）・AC-3（client pagination/search）・AC-5（sticky 高さ制御）が未充足。加えて P0 contract バグが現存。 |
| issue は最新コードと乖離しているか | **乖離あり（最適化済み）** | issue は「将来 tag 増加時の cosmetic UX」想定だが、現コードでは `fetchTagMaster()` が `{ total, items }` レスポンスを `{ available }` として読むため **`available` が `undefined` になり、`groupedTags` の `for...of` がクラッシュ／空表示し得る**。これは UX 以前の correctness 欠陥。さらに `pageSize` 既定 50 のため 50 件超の tag が黙って切り捨てられる。これらを root-cause として取り込み最適化した。 |
| 既に充足している AC | **AC-2 / AC-4 は構造上充足済み** | AC-2: `TagPill.tsx` L24 `aria-pressed={selected}` + 標準 `<button>` keyboard。AC-4: `selectedTagIds: Set<string>` は `available` と独立保持（BulkActionBar.tsx L52, L110-117）。本タスクでは regression coverage として固定する。 |

## 最新コードへの最適化ポイント（root-cause 解決）

1. **P0: tag master read contract 不一致の修正**（最優先）
   - 現状: `apps/api` `GET /admin/tags` は `{ total, items: TagDefinitionRow[] }` を返す（`apps/api/src/routes/admin/tags.ts` L110-129、#1035 で実装）。Next.js proxy（`apps/web/app/api/admin/[...path]/route.ts`）は pass-through。
   - バグ: `apps/web` `fetchTagMaster()`（`features/admin/api/members.ts` L88-94）は応答を `{ available: AdminTagRef[] }` として cast → 実行時 `r.available === undefined`。
   - 影響: `BulkActionBar.tsx` L67 `setAvailable(undefined)` → L80 `for (const t of available)` が `undefined is not iterable` で throw（render クラッシュ）、または防御後でも picker が常に空。
   - 隠蔽要因: `BulkActionBar.spec.tsx` L58-66 の fetch mock が **実 API 形ではなく `{ available: AVAILABLE }` を返す**ため、テストが緑のまま runtime 破綻を検知できていない。
   - 対策: `fetchTagMaster()` を `{ total, items }` から読むよう修正し、テスト mock を実 API 形へ是正する。
2. **AC-3: pagination/search の client contract 接続**
   - `fetchTagMaster()` を `{ q?, page?, pageSize? }` 受け取り対応にし、既定 `pageSize` を API 上限の 100 にして 50 件切り捨てを解消。
   - 大規模時は `q`（server-side search）で絞り込み、`total` をもとに「全 N 件中 M 件表示」ヒントを出す。
3. **AC-1 / AC-5: large catalog UX**
   - 検索入力 + category 折りたたみ + picker リストの `max-height` + `overflow-y-auto` を追加し、sticky bar の縦伸びを抑止。
   - 既存 primitives（`TagPill`）を再利用し新規 primitive を生やさない（不変条件: プロトタイプ正本順位）。
4. **AC-4: 選択 tag の検索結果外保持**
   - 取得済み tag を `Map<tagId, AdminTagRef>` に累積し、検索/ページで結果外になった選択 tag も「選択中」行に label 付きで固定描画する。

## タスク分割（関心ごとの分離 — 全て同一サイクル内で完結）

| Task | 領域 | 責務 | 依存 |
|------|------|------|------|
| task-A | apps/web | tag master read client contract 修正（`{total,items}`）+ pagination/search query 対応 + 型 | なし |
| task-B | apps/web | `BulkActionBar` tag picker の large catalog UX（検索 / 折りたたみ / max-height・overflow / 選択中固定行 / 閾値ゲート） | task-A |
| task-C | apps/web | `BulkActionBar.spec.tsx` mock 是正 + 新規テストケース（contract / search / collapse / persistence / truncation / keyboard regression）+ Playwright visual sanity 計画 | task-A, task-B |

> **CONST_007 遵守**: 先送り（別 PR / バックログ）はしない。3 task はすべて 1 実装サイクル
> （03.実装.md）で完了するスコープ。apps/api は #1035 で必要機能が landed 済みのため変更不要。
> P0 バグ修正も同サイクルに含め、cosmetic UX と一体で解消する。

## Phase 一覧

| Phase | 名称 | ステータス | ファイル |
|-------|------|-----------|---------|
| 1 | 要件定義 | completed | phase-1-requirements.md |
| 2 | 設計 | completed | phase-2-design.md |
| 3 | 設計レビュー | completed | phase-3-design-review.md |
| 4 | テスト作成 | completed | phase-4-test-plan.md |
| 5 | 実装 | completed | phase-5-implementation.md |
| 6 | テスト拡充 | completed | phase-6-test-additions.md |
| 7 | カバレッジ確認 | completed | phase-7-coverage.md |
| 8 | リファクタリング | completed | phase-8-refactor.md |
| 9 | 品質保証 | completed | phase-9-qa.md |
| 10 | 最終レビュー | completed | phase-10-final-review.md |
| 11 | 手動テスト | completed（local deterministic evidence captured / staging visual pending） | phase-11-manual-test.md |
| 12 | ドキュメント更新 | completed | phase-12-documentation.md |
| 13 | PR作成 | pending_user_approval | phase-13-pr.md |

## 受入条件 (AC)

元 issue の AC-1〜AC-5 を最新コードへ最適化し、root-cause 修正の AC-0 を先頭に追加する。

- **AC-0**（新規・最優先）: `fetchTagMaster()` が `GET /admin/tags` の `{ total, items }` 応答を
  正しく読み、`BulkActionBar` の tag picker が実 API 形でクラッシュ・空表示しない。テスト mock も
  実 API 形に一致する。
- **AC-1**: tag 数が閾値を超える場合、検索または category 折りたたみで picker の高さを制御できる。
- **AC-2**: 既存 `TagPill` の keyboard 操作 / `aria-pressed` が維持される（regression）。
- **AC-3**: `GET /admin/tags` の pagination/search に接続した client contract が定義され、`pageSize`
  既定で tag が黙って切り捨てられない（50 件超でも全件到達可能）。
- **AC-4**: selected tag が検索/ページ結果外へ移動しても選択状態と label 表示が失われない。
- **AC-5**: picker に `max-height` + `overflow-y` が効き、sticky bar が member table 操作を塞ぎ
  すぎない（desktop / mobile の visual sanity）。

## 検証コマンド（実装サイクルで使用）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/__tests__/BulkActionBar.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/api/__tests__/members.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## ランタイム境界（user-gated）

- commit / push / PR 作成 / GitHub issue mutation（close / コメント）/ staging 認証付き
  visual baseline 取得は、すべてユーザー明示承認後のみ実行する。
