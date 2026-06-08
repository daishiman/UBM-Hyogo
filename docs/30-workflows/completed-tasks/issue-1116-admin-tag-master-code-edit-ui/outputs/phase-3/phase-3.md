# Phase 3: 設計レビュー（Gate-A 証跡 / issue-1116 admin tag master code edit UI）

> 本ファイルは `artifacts.json` の Gate-A `evidence_path` から参照される設計レビュー証跡である。Phase 4（テスト作成 / 実装）へ進める可否を判定する。
> Phase 2（設計）の内容を実コード（`apps/api/src/routes/admin/tags.ts` / `apps/api/src/repository/tagDefinitions.ts` / `apps/web/app/api/admin/[...path]/route.ts` / `apps/web/src/features/admin/api/members.ts` / `apps/web/src/features/admin/hooks/useAdminMutation.ts` / `apps/web/src/components/shell/shell-config.ts` / `apps/web/src/components/shell/icons.tsx` / `apps/web/src/components/ui/FormField.tsx` / `apps/web/src/lib/admin/safe-server-fetch.ts` / `apps/web/app/(admin)/admin/tags/page.tsx`）と突合した。

## 3.1 判定サマリ

**判定: PASS（Phase 4 へ進める）**

Phase 1（要件定義）・Phase 2（設計）が AC-1..AC-5 を 1:1 で満たし、実コードのシグネチャ・error code・ファイルパス・nav 規則と矛盾しないことを確認した。`apps/api` は無変更で、不変条件 #1/#2/#5/#7/#9/#10 を破らない。

## 3.2 AC-1..AC-5 の設計カバレッジ（1:1 検証）

| AC | 受け入れ基準 | Phase 2 充足箇所 | 実コード裏取り | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | tag master 一覧から対象 tag を選び code/label/category 編集 UI に到達 | §2.4.1 `TagMasterPanel`（行選択）+ §2.4.2 `TagMasterEditForm`（FormField で 3 項目）+ §2.4.3 `page.tsx`（一覧取得） | sibling route `/admin/tag-master`・`safeServerFetch('/admin/tags?page=1&pageSize=50')` は `GET /admin/tags`（`tags.ts:133-152` `{total,items}`）と整合 | ✅ |
| AC-2 | code rename 時に現 code を `expectedCode` として送り stale を検出 | §2.5 expectedCodeRef=row.code・code 変更時のみ同梱 | API は code 指定時 `expectedCode` 必須（`tags.ts:41-44`）/ CAS で `stale`（`tagDefinitions.ts:131-133,163-166`） | ✅ |
| AC-3 | 409 `tag_code_conflict` と `tag_stale_conflict` を別メッセージで表示 | §2.4.2 `conflictKind` 分岐（code / stale 別文言・別 data-testid） | route が 409 を 2 error code に分けて返す（`tags.ts:207-208`・`ERROR_TO_STATUS:58,60`） | ✅ |
| AC-4 | label/category 更新と code rename が後方互換に動く | §2.4.2 submit「変更フィールドだけ送る」+ §2.3「code 未指定なら expectedCode 送らない」+ `no_update_fields` 先回り防御 | `UpdateTagBodyZ` は全 optional・refine で `no_update_fields`（`tags.ts:38-40`）/ `expected_code_required`（:41-44） | ✅ |
| AC-5 | focused component/API client test と visual evidence | §1.7 inventory の test files（`tags.update.spec.ts` / `TagMasterPanel.spec.tsx` / `page.spec.tsx` / `shell-config.spec.ts` / `admin-tag-master-code-edit-ui.spec.ts`） | focused test / typecheck / lint / design-tokens を規定。local fixture visual は取得済み、authenticated staging capture は user-gated | ✅ |

全 AC が設計でカバーされている。

## 3.3 シグネチャ / error code / ファイルパス整合チェック

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| `updateTag` 戻り値型 | ✅ | API 200 は `rowBody`（`tags.ts:78-84` = `{tagId,code,label,category,active}`）。`AdminTagRef`（`members.ts:6-11`）は active を含まない 4 項目で、`updateTag` は `createTag`（`members.ts:259-265`）と同様に active を捨てて返すため整合 |
| `AdminTagUpdateErrorCode` の網羅 | ✅ | `ERROR_TO_STATUS`（`tags.ts:52-61`）の中で PATCH ハンドラが返しうる code = `invalid_json` / `invalid_body` / `no_update_fields` / `tag_not_found` / `tag_code_conflict` / `tag_stale_conflict`（`tags.ts:184-210`）を過不足なく列挙。`tag_has_references` は physical delete 専用（:272）で PATCH では発生せず除外して正しい |
| `parseTagUpdateErrorCode` 構造 | ✅ | `members.ts:parseTagErrorCode:224-236`（JSON parse → object guard → `error` 取り出し → 既知 code allowlist `.includes`）と同一構造で、API error body `{ ok:false, error:"<code>" }`（`fail:69-70`）に対応 |
| `TagUpdateError` 構造 | ✅ | `TagCreateError`（`members.ts:207-218`・status/code/bodyText）と同一形。`useAdminMutation` catch 経路は `FetchAuthedError.bodyText`（`useAdminMutation.ts:67,195`）を渡すため、`TagMasterEditForm` 側で bodyText → parse する流れ（`MemberTagInlineCreate.tsx:134-138`）と整合 |
| `useAdminMutation` PATCH overload | ✅ | `"PATCH"` は非冪等 overload（`useAdminMutation.ts:132-136`・retry 不可）。設計は retry を渡さないため型エラーにならない。`refreshOnSuccess:false` + `successMessage` も既存 option（:39,38） |
| proxy 経路 | ✅ | `app/api/admin/[...path]/route.ts:125` で `export const PATCH = proxy` 済み。`PATCH /api/admin/tags/:tagId` は新 proxy route 不要 |
| `FormField` 利用 | ✅ | `FormField`（`FormField.tsx:19`）は単一 `children: ReactElement` を取り `Input` を包む。`MemberTagInlineCreate.tsx:227-271` と同一用法で不変条件 #9 を満たす |
| server fetch shape | ✅ | `page.tsx` の `safeServerFetch<TagMasterListView>` は `/admin/tags/page.tsx:42` と同型。`{ total, items: AdminTagRef[] }` は API rowBody 配列と整合（active を含むが UI は 4 項目のみ参照） |
| ファイルパス | ✅ | 新規 6（route/Panel/EditForm/api tags.ts/shell-config edit/icons edit）+ test 群が artifacts.json `implementation_files`（:27-34）/ `test_files`（:35-41）と一致 |

## 3.4 nav 衝突回避の検証（ADR 核心）

| 検証 | 判定 | 根拠 |
| --- | --- | --- |
| sibling route が tag-queue と衝突しない | ✅ | `isNavItemActive("/admin/tags", "/admin/tag-master")`：`"/admin/tags"` は特例（`/` `/admin`）でないため `pathname === "/admin/tags"`（false）∨ `pathname.startsWith("/admin/tags/")`（`"/admin/tag-master"` は `"/admin/tags/"` で始まらない → false）= **false**。衝突しない（`shell-config.ts:125-128`） |
| 子ルートなら衝突する（却下根拠の妥当性） | ✅ | 仮に `/admin/tags/master` だと `"/admin/tags/master".startsWith("/admin/tags/")` = true → tag-queue が常時 active になるため、子ルート却下は正しい |
| `tag-master` active 判定 | ✅ | `/admin/tag-master` 滞在時 `isNavItemActive("/admin/tag-master", "/admin/tag-master")` = `pathname === itemHref` true。自身は正しく active |
| 型網羅性 | ✅ | `ShellNavItemId` に `"tag-master"` を足すと `PATHS: Record<ShellNavItemId, string>`（`icons.tsx:25`）が未追加で型エラー → icon 同時追加が型レベルで強制され、配線漏れを防ぐ |

regression test（`shell-config.spec.ts` / `SidebarNavItem.spec.tsx`）で上記を固定する設計は妥当。

## 3.5 4 条件評価

| 条件 | 評価 | 判定 |
| --- | --- | --- |
| 価値性 | 誤 code を後から安全に修正する UI 導線（これまで皆無・`apps/web` に expectedCode 参照 0）を提供し、operator が D1 直叩きや tag 作り直しをせずに済む | **PASS** |
| 実現性 | 既存 API surface（issue-1069/1070 完成）・既存 proxy・既存 primitives（FormField/Button/Input/AdminPageHeader/useAdminMutation/safeServerFetch）の再利用のみ。新規は UI 6 ファイル + tests で 1 サイクル完結（CONST_007） | **PASS** |
| 整合性 | 命名（`tag-master` / `AdminTagUpdateErrorCode` / `updateTag`）・error code・proxy 経路・FormField/useAdminMutation 利用が既存規則と一致。`apps/api` 無変更・型網羅で配線漏れ防止 | **PASS** |
| 運用性 | nav 衝突を sibling route で構造的に回避し regression test で固定。stale conflict は「最新を再読込」で回復導線を明示。visual 証跡は user-gated で運用境界を明確化 | **PASS** |

4 条件すべて PASS。

## 3.6 リスク再評価（DESIGN-BRIEF §6）

| リスク | 当初評価 | 再評価後 | 残存対応 |
| --- | --- | --- | --- |
| member tag assignment UI と master CRUD UI 混同 | 高 | **低** | route `/admin/tag-master`・nav label「タグ管理」vs「タグキュー」・eyebrow「ADMIN / TAG MASTER」で文脈分離（§2.4.3-2.4.4） |
| stale conflict を code conflict と同表示 | 中 | **低** | `conflictKind` 2 値分岐・別 data-testid・error code 別 component test で固定（§2.4.2 / AC-3） |
| 子ルートで nav 衝突 | 中 | **解消** | sibling route で構造的に回避・`isNavItemActive` 衝突なしを test 固定（§3.4） |
| rename 後の一覧 cache が旧 code 表示 | 中 | **低** | 成功時 `onSaved` で row optimistic 置換（§2.4.1）。stale 時は手動更新案内で古い入力の上書きを防ぐ |
| icon path の視認性 | （新規）| **MINOR** | 提案 path（矩形＋ペン）は実装時に他 icon と並べて微調整可（§2.4.4 注記）。blocker でない |

## 3.7 残課題（MINOR）

| ID | 課題 | 区分 | 対応方針 |
| --- | --- | --- | --- |
| M-1 | ページネーション（pageSize=50 超）の UI は本スコープ外。`total > 50` のときヒント表示に留める | MINOR | 別スコープ。検索 `q` は searchParams 透過で将来拡張を阻害しない（§2.4.3） |
| M-2 | tag 物理削除 / reactivate（issue-1070 API 済）の UI は本スコープ外 | MINOR | 別タスク。本 UI は list + code/label/category edit + conflict 表示に限定（Phase 1 §1.5） |
| M-3 | icon path の最終確定は実装時の視認性確認に委ねる | MINOR | §2.4.4 注記。blocker でない |

いずれも Phase 4 進行を妨げる blocker ではない。

## 3.8 Gate-A 結論

- AC-1..AC-5 を設計が 1:1 でカバー（§3.2）。
- シグネチャ / error code / ファイルパス / proxy / FormField / useAdminMutation がすべて実コードと整合（§3.3）。
- nav 衝突を sibling route で構造的に回避し型網羅で配線漏れ防止（§3.4）。
- 4 条件すべて PASS（§3.5）。リスクは全て低 / 解消 / MINOR（§3.6-3.7）。
- `apps/api` 無変更・不変条件 #1/#2/#5/#7/#9/#10 を遵守。

→ **Gate-A: PASS（approver: daishiman・spec design review）。Phase 4 へ進行可。**
