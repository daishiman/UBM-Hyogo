# DESIGN-BRIEF — issue-1116 admin tag master code edit UI

## 1. 1 行サマリ

CLOSED Issue #1116 を最新コードに最適化し、admin が tag master の `code` / `label` / `category` を安全に編集できる
新規 admin ルート `/admin/tag-master` と編集フォーム（`expectedCode` CAS・409 分離表示）を `apps/web` に追加する実装仕様書（implemented_local_evidence_captured）。

## 2. 根本問題

operator が誤った tag `code` を後から修正する UI 導線が無い。API（`PATCH /admin/tags/:tagId` code/expectedCode・409 `tag_code_conflict` / `tag_stale_conflict` 分離）は issue-1069 で完備しているが、それを叩く画面が存在しない（`apps/web` に `expectedCode` 参照ゼロ）。

## 3. 設計方針（要点）

1. **sibling ルート**: `/admin/tags` は tag QUEUE で占有済み。`isNavItemActive` の `startsWith(href+"/")` により子ルートは nav 衝突を起こすため、`/admin/tag-master` を新設する。
2. **API は既存再利用**: web proxy catch-all `app/api/admin/[...path]/route.ts` が `PATCH /api/admin/tags/:tagId` を転送。新規 proxy 不要。read は既存 `fetchTagMaster`（`members.ts`）。
3. **CAS**: 編集フォームは行ロード時の `code` を `expectedCode` として保持し、submit 時に同梱（`code` 指定時は API が `expectedCode` 必須）。
4. **409 分離**: `tag_code_conflict`（UNIQUE 衝突）と `tag_stale_conflict`（最新値競合）を別文言で表示。stale 時は画面更新を促し、古い入力での上書きを防ぐ。
5. **不変条件遵守**: mutation=`useAdminMutation`（#10）、input=`FormField`（#9）、色=OKLch token（#2）、D1 直アクセス禁止（#5）、`apps/api` 非変更（#1/#7）。

## 4. 変更対象ファイル一覧（inventory）

> 詳細は `outputs/phase-1/phase-1.md` §1.7。

| 種別 | パス | 変更 |
| --- | --- | --- |
| admin route | `apps/web/app/(admin)/admin/tag-master/page.tsx` | new |
| client component | `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx` | new |
| client component | `apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx` | new |
| web API client | `apps/web/src/features/admin/api/tags.ts` | new |
| nav config | `apps/web/src/components/shell/shell-config.ts` | edit |
| nav icon | `apps/web/src/components/shell/icons.tsx` | edit |
| tests | `__tests__/tags.update.spec.ts` / `TagMasterPanel.spec.tsx` / `page.spec.tsx` / nav regression / Playwright local fixture visual | new/edit |

## 5. 受け入れ基準

AC-1..AC-5（Issue #1116 と 1:1）。詳細は `outputs/phase-1/phase-1.md` §1.6。

## 6. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| member tag assignment UI と tag master CRUD UI を混同 | 高 | route / page 名 / copy を tag master 管理に限定。nav label「タグ管理」 vs「タグキュー」 |
| stale conflict を code conflict と同表示にする | 中 | error code 別の unit/component test を追加 |
| 子ルートにして nav 衝突 | 中 | sibling `/admin/tag-master` + `isNavItemActive` 衝突なし test |
| rename 後の一覧 cache が旧 code を表示 | 中 | mutation success 後に row optimistic 置換 or 再 fetch |
