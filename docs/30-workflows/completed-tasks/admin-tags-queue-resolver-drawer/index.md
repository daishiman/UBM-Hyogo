# admin-tags-queue-resolver-drawer

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | admin-tags-queue-resolver-drawer |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-04-tags-assignment/spec.md` |
| 実装区分 | implementation |
| taskType | implementation |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_evidence_captured |
| evidence_state | LOCAL_TESTS_AND_VISUAL_EVIDENCE_PASSED |
| 実装対象 | `apps/web/src/components/admin/TagQueuePanel.tsx`（既存 hardening + drawer 抽出）、`apps/web/src/components/admin/TagsQueueResolveDrawer.tsx`（新規）、`apps/web/src/features/admin/hooks/useAdminMutation.ts`（success message 拡張）、`apps/web/app/(admin)/admin/tags/page.tsx`（既存統合） |
| 作成日 | 2026-05-17 |
| Phase 13 | blocked_pending_user_approval |

## Summary

元 spec は `apps/web/app/(admin)/admin/tags/_components/` 配下に TagsQueueList / TagsQueueResolveDrawer を新規追加する前提だが、current topology では既に `apps/web/src/components/admin/TagQueuePanel.tsx` が queue list + inline review pane を実装している。

そのため本タスクは **「TagQueuePanel hardening + resolve drawer 抽出」** として再分類し、以下を行う:

1. 既存 `TagQueuePanel` から resolve UI を `TagsQueueResolveDrawer` として切り出し、a11y drawer pattern (role="dialog" + aria-modal + focus trap) と form validation を強化する
2. mutation 経路を素の `fetch` ベース `resolveTagQueue` から `useAdminMutation` hook（`apps/web/src/features/admin/hooks/useAdminMutation.ts`）経由に切り替え、busy state / toast / router.refresh を統一する
3. confirmed / rejected の form validation を `tagQueueResolveBodySchema` (`@ubm-hyogo/shared`) と整合させる

不変条件 #13（tag 書き込みは tagQueueResolve workflow 経由のみ）と既存 API endpoint surface を変更しない。

## Scope

### 含む

- `TagQueuePanel.tsx` から resolve 操作部を `TagsQueueResolveDrawer.tsx` へ分離（既存 testid と DOM semantics は後方互換維持）
- `TagsQueueResolveDrawer` の a11y 強化（`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, ESC で close, initial focus, return focus）
- browser fetch 経路を `useAdminMutation<TagQueueResolveResponse>('/api/admin/tags/queue/:queueId/resolve', 'POST')` へ統一。upstream API 正本は `/admin/tags/queue/:queueId/resolve`
- confirmed 時の tag selection（既定: suggestedTags 全選択、最小1 件を validation）
- rejected 時の reason 入力（最小1 文字を validation、trim 後）
- terminal status (`resolved` / `rejected` / `dlq`) item で drawer の submit を block
- OKLch design token（`apps/web/src/styles/tokens.css`）で status badge color mapping を集約
- Phase 11 で `/admin/tags` を Playwright で実描画した screenshot を VISUAL evidence として残す

### 含まない

- API endpoint（upstream `/admin/tags/queue`, `/admin/tags/queue/:queueId/resolve` / BFF `/api/admin/tags/queue*`）の変更
- `tagQueueResolveBodySchema` の変更
- D1 schema / tag_assignment_queue 構造の変更
- Google Form schema の変更
- `apps/web/src/lib/admin/api.ts` の `resolveTagQueue` helper 削除（後続 task）
- commit / push / PR 作成

## Phase 一覧

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-01.md` | completed |
| 2 | `outputs/phase-02.md` | completed |
| 3 | `outputs/phase-03.md` | completed |
| 4 | `outputs/phase-04.md` | completed |
| 5 | `outputs/phase-05.md` | completed |
| 6 | `outputs/phase-06.md` | completed |
| 7 | `outputs/phase-07.md` | completed |
| 8 | `outputs/phase-08.md` | completed |
| 9 | `outputs/phase-09.md` | completed |
| 10 | `outputs/phase-10.md` | completed |
| 11 | `outputs/phase-11.md` | completed |
| 12 | `outputs/phase-12.md` | completed |
| 13 | `outputs/phase-13.md` | blocked_pending_user_approval |

## DoD

- `TagsQueueResolveDrawer.tsx` 新規 + spec が完成し、`TagQueuePanel` の test green を維持
- mutation 経路が `useAdminMutation` 経由に統一され、`resolveTagQueue` の直接呼び出しが UI layer から消えている
- `useAdminMutation` が idempotent response に応じた success message を返せる（既存 caller は string 指定のまま後方互換）
- `pnpm typecheck` / `pnpm lint` / 関連 `*.spec.tsx` がローカルで pass
- `pnpm --filter @ubm-hyogo/web test -- ...` は対象 spec を含む apps/web 626 tests PASS（2026-05-17）
- Phase 11 で `/admin/tags` の VISUAL screenshot（drawer closed / confirmed open / rejected open / validation error / terminal disabled の 5 枚）を `outputs/phase-11/screenshots/` に保存
- Playwright drawer evidence spec が PASS し、axe violations 0 を `outputs/phase-11/logs/axe.json` に保存
- Phase 12 strict 7 files が `outputs/phase-12/` に存在
- `verify-design-tokens` gate を local で実行し HEX 直書きが新規ファイルに含まれない
- commit / push / PR はユーザー承認まで未実行
