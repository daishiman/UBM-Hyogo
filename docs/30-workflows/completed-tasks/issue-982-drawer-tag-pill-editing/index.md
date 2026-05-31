# issue-982-drawer-tag-pill-editing

[実装区分: 実装仕様書]

GitHub Issue #982（CLOSED のまま）に対し、`/admin/members` の `MemberDrawer` 内 tag pill を「見せかけ disabled 表示」から「実際に追加 / 削除できる編集 UI」へ昇格させ、その永続化（write endpoint + repository + audit）を **1 PR サイクル** で完遂する実装仕様書。

## このタスクの位置づけ（調査結果サマリー）

2026-05-29 の初期調査時点（`origin/dev` = `b70ded680`）では、Issue #982 は未実装であり、他タスク / PR でも解決されていなかった。本ワークツリーでは同日サイクル内に実コードへ反映済みで、残る user-gated 境界は staging visual baseline、commit、push、PR のみ。

| 層 | 現状 | 出典 |
| --- | --- | --- |
| API endpoint | 初期調査時点では `POST/DELETE /admin/members/:memberId/tags` は存在せず、`tags-queue` resolver のみだった。本ワークツリーでは `GET/POST/DELETE` を追加済み | `apps/api/src/routes/admin/members.ts` / `tags-queue.ts` |
| repository | `assignTagsToMember` は tagQueueResolve workflow 専用・**新規呼び出し禁止** | `apps/api/src/repository/memberTags.ts` |
| audit | `admin.member.tag_assigned` / `tag_unassigned` は **未定義**（`admin.tag.queue_resolved` のみ）。記録は `auditLogProvider.append()` 経由 | `apps/api/src/workflows/tagQueueResolve.ts:183-196` / `apps/api/src/repository/auditLog.ts` |
| UI | tag pill は `disabled` 固定 + `title="タグ編集は別タスクで対応予定"` | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx:158-189` |
| tag master | `MemberDrawer` の `ALL_TAGS` がハードコード。**tag master 読取 endpoint なし**（master は `tag_definitions`） | `MemberDrawer.tsx:24` |

> **結論**: Issue #982 の作業は必要。クローズ状態は維持したまま本仕様書を作成する（ユーザー指示）。

## Issue を「現在のコードに最適化」した差分（根本問題の解決）

Issue 本文は親ワークフロー時点（2026-05-27）の前提で書かれており、最新コードと次の乖離がある。本仕様書はこれを最新コードへ最適化する。

| Issue 本文の記述 | 最新コードの事実 | 本仕様書での扱い |
| --- | --- | --- |
| `tag_assignments` テーブル | 中間テーブルの実在は **`member_tags`**（PK `(member_id, tag_id)`、`source`、`assigned_by`）。tag master は **`tag_definitions`**（PK `tag_id`、UNIQUE `code`、`label`、`category`、`active`） | `member_tags`（中間）+ `tag_definitions`（master）を正本とする。`tag_assignments` 表記は全廃 |
| 「idempotency-key middleware 経由 200」 | API admin 側に idempotency **middleware は未実装**（`useAdminMutation` が `Idempotency-Key` header を送るが server は現状 no-op） | 冪等性は PK `INSERT OR IGNORE`（POST）/ DELETE no-op で担保。header は受理するが server 追加実装は本タスク scope 外 |
| `:id`（パスパラメータ） | 既存 members route は `c.req.param("memberId")` で統一 | `:memberId` に統一 |
| AC-5「削除済み member（`isDeleted=true`）」 | `member_status.is_deleted INTEGER`（default 0）が実在。detail view は `isDeleted: status.is_deleted === 1` | `member_status.is_deleted = 1` を 409 条件とする（Issue AC-5 の 409 契約に準拠。既存 attendance route は同状況 422） |
| 「tag pill を見せる UI / 編集する UI が同居しない」根本原因 | 不変条件 #13「tag は queue resolve 経由のみ。直接更新 endpoint なし」が真の制約 | **本タスクの根本論点**。invariant #13 を「auto-suggest は queue / admin manual は専用 endpoint（audit 必須）」へ正式分離する |

## 背景

- `tags-queue.ts:1-2` のコメント: 「不変条件 #13: tag は queue resolve 経由のみ。直接更新 endpoint なし。」
- `memberTags.ts:3-5`: 「`assignTagsToMember` のみ tagQueueResolve workflow 専用 helper として残置。新規 caller から呼ぶことを禁止」+ 型レベル gate（`assign*` prefix allowlist）。
- このため親ワークフローは tag pill を disabled で hold する以外なかった。プロトタイプ正本（`docs/00-getting-started-manual/claude-design-prototype/`）では drawer 内で tag 追加 / 削除が完結する想定。
- 真の論点 = 「AI/フォーム由来の tag 提案（queue で承認）」と「管理者が直接キュレーションする tag 付与」は **意味の異なる別経路** である、という設計判断が未確定だったこと。本仕様書でこれを確定する。

## スコープ

含む:

- API: `apps/api/src/routes/admin/members.ts` に tag 編集 3 endpoint を追記
  - `GET /admin/members/:memberId/tags` → `{ assigned: TagRef[], available: TagRef[] }`（drawer 用 read。tag master 読取経路の新設を兼ねる）
  - `POST /admin/members/:memberId/tags` body `{ tagId }` → tag 付与（`INSERT OR IGNORE` で冪等）
  - `DELETE /admin/members/:memberId/tags/:tagId` → tag 解除（未存在でも 204 で冪等）
- repository: `apps/api/src/repository/memberTags.ts` に admin 直接付与 / 解除 / master 読取関数を追加。型 gate（`memberTags.readonly.test-d.ts`）の allowlist 更新
- audit: action `admin.member.tag_assigned` / `admin.member.tag_unassigned` を `auditLogProvider.append()` 経由で記録
- Web: `MemberDrawer.tsx` の tag pill を編集可能化（`useAdminMutation` + 楽観更新 + rollback + toast + `Idempotency-Key`）。`ALL_TAGS` ハードコードを API 取得の available tags へ置換
- Web API client: `apps/web/src/features/admin/api/members.ts` に `fetchMemberTags` / `assignMemberTag` / `unassignMemberTag`
- 不変条件 #13 の正式分離（コメント + system spec 更新）
- テスト: API route contract spec / repository spec / 型 gate 更新 / MemberDrawer 編集 spec / Playwright visual baseline（drawer-tag-edit）

含まない:

- tag master の作成 / 削除 / rename（write）— `/admin/tags` 側の別責務。本タスクは master を **read のみ**
- tag に紐づく公開フィルタロジックの再設計
- 一括操作（bulk assign）— 単一 member 単位のみ
- tags-queue（AI/フォーム提案）の resolve ロジック変更

> CONST_007: 上記すべてを 1 PR サイクル内で完了する。先送り（別 PR / wave 2 / backlog）は行わない。

## 不変条件（本タスク固有 + 既存）

1. D1 直接アクセスは `apps/api` に閉じる（CLAUDE.md invariant #5）。`apps/web` から D1 binding 禁止
2. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（CLAUDE.md invariant #10）。legacy `@/lib/useAdminMutation` 新規参照禁止
3. admin form input は `FormField` 経由を標準とし、`apps/web/src/components/admin/` 配下で直接 `<input>` を増やさない（CLAUDE.md invariant #9）※本タスクは pill click 主体で input 追加なし
4. 新規 test ファイルは `*.spec.{ts,tsx}` のみ（CLAUDE.md invariant #8）
5. 色は OKLch token（`apps/web/src/styles/tokens.css`）のみ。HEX / `bg-[#xxx]` 直書き禁止
6. **invariant #13 を本タスクで再定義**: 「AI/フォーム由来 tag は queue resolve 経由。admin manual 付与 / 解除は専用 endpoint 経由（audit 必須）」。`member_tags` への直接 write は admin manual 経路に限り許可する
7. 中間テーブルは `member_tags`（`tag_assignments` ではない）。tag master は `tag_definitions`（`tags` ではない）
8. 既存 `*.spec.{ts,tsx}` の green を維持する（regression 無し）

## 正本順位（衝突時の優先度）

1. 本 workflow の Phase 1-3 設計書（phase-1/2/3）
2. 最新コード（`apps/api/src/routes/admin/`、`apps/api/src/repository/memberTags.ts`、`apps/web/.../MemberDrawer.tsx`）
3. `docs/00-getting-started-manual/specs/01-api-schema.md`
4. プロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`）

## タスク表（関心ごとの分離 / 1 PR サイクル）

| タスク | 区分 | 概要 | 主担当領域 |
|--------|------|------|-----------|
| [task-A](tasks/task-A-tag-write-api-and-repository.md) | 実装 | API 3 endpoint + `memberTags` repository 関数 + audit + 型 gate 更新 + contract/repository spec | `apps/api` |
| [task-B](tasks/task-B-member-drawer-editable-tags.md) | 実装 | `MemberDrawer` 編集可能化 + web API client + `useAdminMutation` 配線 + 楽観更新 spec | `apps/web` |
| [task-C](tasks/task-C-visual-baseline-and-invariant-doc.md) | 実装 | Playwright drawer-tag-edit visual baseline + invariant #13 再定義の system spec / コメント更新 | `apps/web/playwright` + docs |

依存: task-A → task-B（B は A の endpoint shape に依存）→ task-C（C は B の編集 UI に依存）。設計レベルでは並列着手可、実装は直列で締める。

## 想定 PR 範囲（変更ファイル）

- `apps/api/src/routes/admin/members.ts`（3 endpoint 追記）
- `apps/api/src/repository/memberTags.ts`（admin 付与 / 解除 / master read 関数）
- `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts`（allowlist 更新）
- `apps/api/src/routes/admin/tags-queue.ts`（invariant #13 コメント修正のみ）
- `apps/api/src/routes/admin/members.tags.contract.spec.ts`（新規）
- `apps/api/src/repository/__tests__/memberTags.repository.spec.ts`（追補 or 新規）
- `apps/web/src/features/admin/api/members.ts`（client 関数 3 本）
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（編集可能化）
- `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx`（新規）
- `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-edit.spec.ts`（新規）
- `docs/00-getting-started-manual/specs/01-api-schema.md`（invariant #13 / tag write endpoint 追記）
- `.claude/skills/aiworkflow-requirements/references/*`（system spec 同期 / Phase 12）

## Phase 一覧

| Phase | ファイル | 目的 |
|-------|---------|------|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | scope / AC / inventory / 命名規則 / P50 確定 |
| 2 | [phase-2-design.md](phase-2-design.md) | endpoint shape / repository signature / 409 条件 / lane 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビューゲート（Phase 4 へ進む判定） |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | TDD Red: test ケース一覧 + expected |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順（新規 / 修正ファイルパス一覧） |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | fail path / 回帰 guard 追加 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | 変更範囲の coverage 可視化 |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | duplicate / drift 削減 |
| 9 | [phase-9-qa.md](phase-9-qa.md) | typecheck / lint / token gate / parity |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | AC 充足 / blocker 判定 |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | VISUAL: drawer-tag-edit screenshot + 手動確認 |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | implementation guide / spec sync / unassigned / feedback |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（user 明示承認後のみ） |

## 完了条件（DoD）

- `mise exec -- pnpm typecheck` green（全 package）
- `mise exec -- pnpm lint` green
- API: `members.tags.contract.spec.ts` 全 PASS（POST/DELETE/GET 冪等性 + audit + 404 + 409 + regression）
- Web: `MemberDrawer.tags.spec.tsx` 全 PASS（add/remove + 楽観更新 rollback + toast）
- Playwright `member-drawer-tag-edit` baseline 取得（VISUAL_ON_EXECUTION / staging は user-gated）
- invariant #13 の再定義が `tags-queue.ts` コメント + `01-api-schema.md` + aiworkflow-requirements に反映
- 既存テスト regression 0

## GitHub Issue

- #982 — https://github.com/daishiman/UBM-Hyogo/issues/982（CLOSED のまま維持）
- labels: `priority:medium`, `scale:medium`, `type:followup`, `area:api`, `area:web`, `area:admin-ui`, `wave:2-plus`
