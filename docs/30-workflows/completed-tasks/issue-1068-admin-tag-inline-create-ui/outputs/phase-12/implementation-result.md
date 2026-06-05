# 実装結果サマリ（issue-1068 admin tag inline-create UI）

> 実装完了日: 2026-06-03
> workflow_state: spec_created → **implemented_local_visual_pending**
> 区分: 実装（apps/web 専用 / apps/api 差分 0）

## 概要

Issue #1068 の inline-create UI 要件をフェーズ 1〜12 のステップバイステップで実コードへ実装した。
`/admin/members` の `MemberDrawer` 内 `MemberTagsEditor` に「必要な tag が無ければその場で作成して
member に付与する」導線を追加。create（tag master write）と attach（junction write）の責務を分離し、
部分成功（作成だけ成功）と 409 conflict の 2 失敗モードを状態機械で破綻なく扱う。

## 実コード変更ファイル

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/features/admin/api/members.ts` | 編集 | `AdminTagCreateErrorCode` 型 / `TagCreateError` / `parseTagErrorCode` / `createTag` を追加（task-A） |
| `apps/web/src/features/admin/components/_members/MemberTagInlineCreate.tsx` | 新規 | create フォーム + 状態機械（`createPhase`）+ client validation + 409/400 ハンドリング + conflict 回収（task-B） |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | `MemberTagsEditor` 配線（`createdPendingAttach` state + `runAttach` + create→attach 連結 + conflict refetch + retry 導線）（task-B） |
| `apps/web/src/features/admin/api/__tests__/members.tagCreate.spec.ts` | 新規 | C-A-T1〜C-A-T3（createTag / parseTagErrorCode unit） |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx` | 新規 | C-T1〜C-T8（状態機械 / create→attach / conflict / validation / 部分成功 / regression / a11y） |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx` | 編集 | 既存 mock を endpoint 判別へ更新（create POST と assign POST を区別。B-T1〜B-T8 維持） |
| `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-inline-create.spec.ts` | 新規 | desktop/mobile visual evidence（env-gated・task-C） |

> `apps/api` 差分 0（`git diff --stat apps/api` 空）を確認。既存 endpoint surface の利用のみ。

## 受入条件（AC）達成状況

| AC | 内容 | 状態 | 根拠 |
| --- | --- | --- | --- |
| AC-1 | drawer から新規 tag 作成 | ✅ | `MemberTagInlineCreate` form → `POST /api/admin/tags`（C-T2） |
| AC-2 | 作成後 attach + pill 反映 | ✅ | `onTagCreated` → 親 `runAttach` → `{assigned,available}` 反映（C-T2） |
| AC-3 | `tag_code_conflict` を既存 tag 選択へ回収 | ✅ | 409 → `conflict` → `fetchMemberTags` refetch → 既存 pill 選択（C-T5、create 再発火 0） |
| AC-4 | validation error を drawer 内表示 | ✅ | client 事前 validation（field error / `role=alert`）+ server 400 包括フォールバック（C-T3 / C-T4） |
| AC-5 | 既存検索/付与/解除が退化しない | ✅ | B-T1〜B-T8 + C-T7 green（既存 toggle 経路不変） |
| AC-6 | desktop/mobile で操作部品と pill が重ならない | ✅ | pill 群と縦分離（`border-t` ブロック）。Playwright desktop/mobile spec（baseline は user-gated） |

## ローカル検証結果（全 green）

| コマンド | 結果 |
| --- | --- |
| `pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| `pnpm --filter @ubm-hyogo/web lint` | exit 0（HEX 直書き 0） |
| `members.tagCreate.spec.ts`（C-A-T1〜C-A-T3） | 4 tests PASS |
| `MemberDrawer.tagInlineCreate.spec.tsx`（C-T1〜C-T8） | 8 tests PASS |
| `MemberDrawer.tags.spec.tsx`（B-T1〜B-T8 regression） | 8 tests PASS |
| `_members` + `api/__tests__` 全 spec | 4 files / 30 tests PASS |
| `git diff --stat apps/api` | 空（API 変更 0） |

> vitest 正経路: `pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts <paths>`
> （`apps/web/vitest.config.ts` は不在。config はリポジトリルート）。

## 不変条件の遵守

1. D1 直接アクセス 0（fetch のみ・apps/api 経由）— ✅
2. mutation は `@/features/admin/hooks/useAdminMutation` 経由（legacy import 0）— ✅
3. admin input は `FormField` + `Input` primitive 経由（生 `<input>` を増やさない）— ✅
4. 新規 test は `*.spec.{ts,tsx}` のみ — ✅
5. 色は OKLch token のみ（HEX 0）— ✅
6. 既存 primitive（`TagPill` / `FormField` / `Button` / `Input`）再利用・新規 primitive 0 — ✅
7. `apps/api` 変更 0 — ✅
8. 既存 `MemberDrawer.tags.spec.tsx` green 維持 — ✅

## 残課題 / user-gated

- Playwright baseline screenshot 取得（staging 認証要・Phase 11 / user-gated）。env-gated spec は追加済み。
- commit / push / PR 作成（user-gated）

別タスク化・先送りは無し（CONST_009: 1 PR サイクルで全 task-A/B/C 完了）。
