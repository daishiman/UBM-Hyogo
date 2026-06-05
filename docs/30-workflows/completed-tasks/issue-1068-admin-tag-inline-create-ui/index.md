# issue-1068-admin-tag-inline-create-ui

[実装区分: 実装仕様書]

GitHub Issue #1068（CLOSED のまま）に対し、`/admin/members` の `MemberDrawer` 内 `MemberTagsEditor`（issue-982 で実装済みの tag pill 編集 UI）へ「必要な tag が無ければその場で作成して member に付与する」inline-create 導線を追加し、**1 PR サイクル**で完遂する実装仕様書。`apps/api` は既存エンドポイントのみ利用し変更しない（apps/web 専用タスク）。

## このタスクの位置づけ（調査結果サマリー）

2026-06-03 時点（`origin/dev` = `17a18e1c2`）でコードベースを精査した結果、**Issue #1068 の inline-create UI 要件は未実装**であり、他タスク / PR でも解決されていない。依存タスク（API・既存 drawer）は両方とも landed 済みで、本タスクは純粋に apps/web の UI 配線で完結する。

| AC | 要件 | 現状 | 出典 |
| --- | --- | --- | --- |
| AC-1 | drawer から新規 tag を作成できる | ❌ 未実装。`MemberTagsEditor` には作成フォーム / ボタンが無い | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx:285-407` |
| AC-2 | 作成成功後に member へ付与し pill 反映 | ❌ create→attach の連結ロジック無し | 同上 |
| AC-3 | `tag_code_conflict` を既存 tag 選択へ回収 | ❌ 409 ハンドリング無し | 同上 |
| AC-4 | validation error を drawer 内表示 | ❌ fetch error 表示のみ（`MemberDrawer.tsx:374-377`） | 同上 |
| AC-5 | 既存 tag 検索/付与/解除が退化しない | ✅ 既存 baseline は健全（issue-982 / #1085） | 同上 |
| AC-6 | desktop/mobile で操作部品と pill が重ならない | ❌ inline-create UI 自体が未存在 | 同上 |

**依存（両方 landed 済み・本タスクは利用のみ）:**

| 依存 | 提供物 | 状態 | 出典 |
| --- | --- | --- | --- |
| issue-1035（#1073） | `POST /admin/tags`（tag master 作成）。201 で `{ tagId, code, label, category, active }`、409 `tag_code_conflict`、400 `invalid_body`/`invalid_json` | 実装済み | `apps/api/src/routes/admin/tags.ts:131-155` |
| issue-982（#982） | `MemberTagsEditor` + `POST /admin/members/:memberId/tags { tagId }`（付与・冪等）→ 200 `{ assigned, available }` | 実装済み | `apps/api/src/routes/admin/members.ts:731-783` / `MemberDrawer.tsx:285-407` |

> **結論**: Issue #1068 の作業は必要。CLOSED 状態は維持したまま本仕様書を作成する（ユーザー指示）。

## Issue を「現在のコードに最適化」した差分（根本問題の解決）

Issue 本文は issue-1035 Phase 12（2026-06-01）の前提で書かれており、最新コードと次の乖離がある。本仕様書はこれを最新コードへ最適化する。

| Issue 本文の記述 | 最新コードの事実 | 本仕様書での扱い |
| --- | --- | --- |
| 「admin member drawer の tag 編集 UI」 | 実体は `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` の `MemberTagsEditor`（`apps/web/src/components/admin/` ではない） | `MemberTagsEditor` を拡張対象として固定 |
| 「`POST /admin/tags` を利用し、作成済み tag は既存 member tag 付与 API に渡す」 | `POST /admin/tags` body は `{ code, label, category }`（label だけでなく code/category も必須）。付与は `POST /admin/members/:memberId/tags { tagId }` で 200 `{ assigned, available }` を返す | create の入力は 3 項目。attach は既存 `assign` mutation を再利用し、戻り値で `assigned`/`available` を一括更新 |
| 「label/category/code validation error」 | server 側は `code` が regex `/^[a-z0-9][a-z0-9_]*$/`・1〜64、`label` 1〜120、`category` 1〜64。失敗は 400 `invalid_body`（field 粒度のメッセージは返らない） | client 側で同じ規則の事前 validation を行い field error を出す。server 400 は包括フォールバックとして扱う |
| AC-5「`GET /admin/tags` search/pagination が退化しない」 | drawer は tag master を `GET /admin/members/:memberId/tags` の `available` から得ており、ページネーション付き `GET /admin/tags`（`tags.ts`・tags 管理画面用）は drawer から呼ばない | AC-5 は「既存 drawer の付与/解除と tags 管理画面の双方に regression を出さない」へ具体化。conflict 回収は member tags の再取得で行う |
| 「create と attach の部分成功」 | create（201）後に attach（付与）が失敗し得る。tag は master に作成済みのまま | `createdPendingAttach` を独立 state とし、作成済み tag を保持して attach リトライ導線を出す |

## 背景 / 真の論点

- issue-982 で drawer の tag pill 編集（既存 tag の付与/解除）は完成したが、「必要な tag が一覧に無い」ケースの導線は「タグ管理へ」リンク（`MemberDrawer.tsx:399-404`）で別画面へ送るだけだった。
- issue-1035 で tag master の write endpoint（`POST /admin/tags`）が追加され、UI から作成する前提が揃った。
- **真の論点** = 「tag 作成（master への write）」と「member への付与（junction への write）」は別エンドポイント・別責務であり、UI 上は 1 操作に見せつつ、**部分成功（作成だけ成功）と重複（conflict）の 2 つの失敗モードを破綻なく扱えるか**。本仕様書はこの状態機械を確定する。

## スコープ

含む:

- `MemberTagsEditor`（`MemberDrawer.tsx`）に inline-create 導線を追加（既存 pill 編集の補助導線として）
- 新規子コンポーネント `MemberTagInlineCreate.tsx`（create フォーム + 状態機械）
- web API client `members.ts` に tag 作成 helper（`createTag`）と error code 型 / parser を追加
- create 成功 → 既存 `assign` mutation で attach → `{ assigned, available }` 反映の連結
- `tag_code_conflict`（409）回収・client validation・部分成功リトライの UI state
- focused component test（新規 spec）+ Playwright desktop/mobile visual evidence

含まない:

- `apps/api` の変更（`POST /admin/tags` / member tag endpoints はすべて実装済み。**API 変更ゼロ**）
- tag `code` rename（別タスク `task-issue-1035-followup-002`）
- tag 物理削除 / reactivate（別タスク `task-issue-1035-followup-003`）
- bulk 作成・tags 管理画面（`/admin/tags`）側の UI 変更
- staging / production deploy、commit、push、PR 作成（すべて user-gated）

> CONST_007: 上記すべてを 1 PR サイクル内で完了する。先送り（別 PR / wave 2 / backlog）は行わない。

## 不変条件（本タスク固有 + 既存）

1. D1 直接アクセスは `apps/api` に閉じる（CLAUDE.md invariant #5）。`apps/web` から D1 binding 禁止。本タスクは fetch のみ
2. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（CLAUDE.md invariant #10）。legacy `@/lib/useAdminMutation` 新規参照禁止
3. admin form input は `FormField`（`apps/web/src/components/ui/FormField.tsx`）経由を標準とし、生 `<input>` を無秩序に増やさない（CLAUDE.md invariant #9）
4. 新規 test ファイルは `*.spec.{ts,tsx}` のみ（CLAUDE.md invariant #8）
5. 色は OKLch token（`apps/web/src/styles/tokens.css`）のみ。HEX / `bg-[#xxx]` 直書き禁止（CI gate `verify-design-tokens`）
6. プロトタイプ正本（`docs/00-getting-started-manual/claude-design-prototype/`）の primitives を再利用し、新規 primitive を生やさない（drawer の既存 layout primitive・`TagPill`・`FormField` を再利用）
7. `apps/api` は変更しない（既存 endpoint surface のみ利用）
8. 既存 `*.spec.{ts,tsx}` の green を維持（issue-982 `MemberDrawer.tags.spec.tsx` B-T1〜B-T8 を含む regression 0）

## 正本順位（衝突時の優先度）

1. 本 workflow の Phase 1-3 設計書（phase-1/2/3）
2. 最新コード（`MemberDrawer.tsx` / `apps/web/src/features/admin/api/members.ts` / `apps/api/src/routes/admin/{tags,members}.ts`）
3. `docs/00-getting-started-manual/specs/01-api-schema.md`
4. プロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`）

## 状態機械（Phase 2 で確定する設計の要約）

`MemberTagInlineCreate` のローカル state：

| state | 意味 | 遷移先 |
| --- | --- | --- |
| `idle` | 「+ 新規タグ」ボタンのみ表示 | → `form`（ボタン click） |
| `form` | code/label/category 入力フォーム表示 | → `submitting`（送信）/ → `idle`（キャンセル） |
| `submitting` | `POST /admin/tags` 実行中 | → idle 化して親へ attach 委譲（201）/ → `conflict`（409）/ → `form`+field error（400） |
| `conflict` | 同 code の既存 tag あり。member tags を再取得し既存 tag 選択へ誘導 | → `idle`（既存 pill を選択）/ → `form`（入力修正） |

部分成功（create 201 → attach 失敗）は親 `MemberTagsEditor` の `createdPendingAttach: AdminTagRef | null` で保持し、attach リトライ導線を出す（作成済み tag を破棄しない）。

## 想定 PR 範囲（変更ファイル）

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_members/MemberTagInlineCreate.tsx` | 新規 | create フォーム + 状態機械 + conflict/validation 表示 |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | `MemberTagsEditor` に inline-create 配線・`createdPendingAttach` state・attach リトライ |
| `apps/web/src/features/admin/api/members.ts` | 編集 | `createTag` helper + `AdminTagCreateErrorCode` 型 + `parseTagErrorCode` |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx` | 新規 | inline-create component test（C-T1〜C-T8） |
| `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-inline-create.spec.ts` | 新規 | desktop/mobile visual evidence |

> `apps/api` は変更しない。`docs/00-getting-started-manual/specs/01-api-schema.md` は新 endpoint が無いため Phase 12 で「該当なし」を記録する（既存契約の利用のみ）。

## タスク表（関心ごとの分離 / 1 PR サイクル）

| タスク | 区分 | 概要 | 主担当領域 | 依存 |
|--------|------|------|-----------|------|
| [task-A](tasks/task-A-tag-create-web-client.md) | 実装 | `members.ts` の `createTag` helper + error code 型 + parser + raw helper unit | `apps/web/api` | なし |
| [task-B](tasks/task-B-inline-create-component-and-wiring.md) | 実装 | `MemberTagInlineCreate` 新規 + `MemberTagsEditor` 配線 + 状態機械 + component test | `apps/web/components` | task-A |
| [task-C](tasks/task-C-visual-evidence.md) | 実装 | desktop/mobile Playwright visual evidence + AC-6 overlap 確認 | `apps/web/playwright` | task-B |

依存: task-A → task-B → task-C。設計レベルでは並列着手可、実装は直列で締める。

## Phase 一覧

| Phase | ファイル | 目的 |
|-------|---------|------|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | scope / AC / inventory / 命名規則 / P50 確定 |
| 2 | [phase-2-design.md](phase-2-design.md) | 状態機械 / component API / create→attach 連結 / 409・400・部分成功設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビューゲート（Phase 4 へ進む判定） |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | TDD Red: C-T1〜C-T8 + expected |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順（新規 / 修正ファイルパス一覧） |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | fail path / 回帰 guard 追加 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | 変更範囲の coverage 可視化 |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | duplicate / drift 削減 |
| 9 | [phase-9-qa.md](phase-9-qa.md) | typecheck / lint / token gate / parity |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | AC 充足 / blocker 判定 |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | VISUAL: desktop/mobile inline-create screenshot |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | implementation guide / spec sync / unassigned / feedback |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（user 明示承認後のみ） |

## 完了条件（DoD）

- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` green
- `mise exec -- pnpm --filter @ubm-hyogo/web lint` green（HEX 直書き 0）
- Web: `MemberDrawer.tagInlineCreate.spec.tsx`（C-T1〜C-T8）全 PASS
- 既存 `MemberDrawer.tags.spec.tsx`（B-T1〜B-T8）regression 0
- Playwright `member-drawer-tag-inline-create` で desktop/mobile evidence 取得（staging は user-gated）
- `apps/api` 差分 0（git diff で確認）

## GitHub Issue

- #1068 — https://github.com/daishiman/UBM-Hyogo/issues/1068（CLOSED のまま維持）
- task_id: `task-issue-1035-followup-001-admin-tag-inline-create-ui`
- labels: `priority:medium`, `scale:medium`, `type:improvement`, `status:unassigned`
