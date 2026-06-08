# Phase 6: テスト拡充（境界・異常系・回帰 guard）

> 正本: `outputs/phase-1/phase-1.md`（§1.6 AC / §1.7 inventory）+ `DESIGN-BRIEF.md` §6（リスク表）。
> Phase 4 の Happy / 主要 fail path に加え、**境界値・client 前検証・連続編集・stale conflict 分離表示・nav active 衝突なし回帰** を補強する。
> 新規 test ファイルは `*.spec.{ts,tsx}` のみ（不変条件 #8）。

## 0. 実行コマンド（artifacts.json verify_commands 転記）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:run \
  apps/web/src/features/admin/api/__tests__/tags.update.spec.ts \
  apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx \
  apps/web/app/(admin)/admin/tag-master/page.spec.tsx \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:design-tokens
```

## 1. API client 境界・異常系の追加（`tags.update.spec.ts`）

### 1.1 U-T7: code regex 違反は **クライアント前検証** ではなく API へ委譲した場合の 400 経路

- **狙い**: `updateTag` 自体は CODE_RE 検証を持たず、サーバ 400 `invalid_body` を `TagUpdateError` として透過すること（client 前検証はフォーム側の責務・§2 で別途固定）。
- **Arrange**: `mockFetch(400, { ok:false, error:"invalid_body" })`。
- **Act**: `updateTag("t1", { code:"Bad Code!", expectedCode:"vip" })`。
- **Assert**: `rejects.toMatchObject({ code:"invalid_body", status:400 })`。fetch は 1 回だけ呼ばれる（事前ブロックしない）。

### 1.2 U-T8: 全フィールド同時更新（code + label + category）の body 整合

- **Arrange**: `mockFetch(200, { tagId:"t1", code:"vip2", label:"VIP2", category:"tier", active:1 })`。
- **Act**: `updateTag("t1", { code:"vip2", label:"VIP2", category:"tier", expectedCode:"vip" })`。
- **Assert**: `JSON.parse(init.body)` が 4 キー全て（`code` / `label` / `category` / `expectedCode`）を含む。戻り値は `active` を除く 4 項目。

### 1.3 U-T9: 空 bodyText（204 以外の !ok で body 空）でも throw（code=null）

- **Arrange**: `mockFetch(503, "", false)`（body 空文字）。
- **Act**: `updateTag("t1", { label:"X" })`。
- **Assert**: `rejects.toMatchObject({ code:null, status:503 })`（`parseTagUpdateErrorCode("")` が null）。

## 2. EditForm 境界・連続編集・回復の追加（`TagMasterPanel.spec.tsx`）

### 2.1 E-T8: code regex 違反は client 前検証で送信ブロック

- **狙い**: `MemberTagInlineCreate` の client validation（`MemberDrawer.tagInlineCreate.spec.tsx` C-T3）と同等の前検証を tag master 編集にも適用し、mutation を無駄打ちしない。
- **Arrange**: `render(<TagMasterEditForm tag={VIP} />)`。
- **Act**: code を `Bad Code!`（大文字・空白・記号で `/^[a-z0-9][a-z0-9_]*$/` 違反）に変更 → submit。
- **Assert**: `patch.trigger` 未発火。`screen.getByText(/英小文字・数字・アンダースコア/)`（既存 create フォームと同文言）が `role="alert"` で表示。
- **境界**: `_leading`（先頭 `_`）も違反でブロック。`a`（最小 1 文字小文字）は通過し submit が発火する。

### 2.2 E-T9: label 121 文字 / category 65 文字の長さ前検証

- **Act**: label を `"a".repeat(121)` に変更 → submit / category を `"c".repeat(65)` に変更 → submit。
- **Assert**: それぞれ `patch.trigger` 未発火・「表示名は120文字以内…」「カテゴリは64文字以内…」（create フォーム既存文言を踏襲）。境界 120 / 64 文字は通過。

### 2.3 E-T10: 連続編集（成功 → 再編集 → 再成功）

- **狙い**: 1 回成功した後に同フォームで再度別フィールドを編集して submit でき、2 回目の expectedCode が **1 回目成功後の最新 code** になること（CAS の連鎖正しさ）。本ケースは `TagMasterPanel` 経由（`key` 再マウント）で検証する方が自然なため §3 の P-T6 に置く。EditForm 単体では、同一 `tag` props 下での 2 連続 submit が二重発火しないこと（`isSubmittingRef` 相当）を確認:
- **Arrange**: `patch.trigger` を解決まで遅延させる pending promise にする。
- **Act**: code 変更 → submit を 2 回連続クリック。
- **Assert**: `patch.trigger` の呼び出し回数が 1（多重送信なし）。

### 2.4 E-T11: stale conflict 後の文言と回復導線

- **Arrange**: `patch.trigger = vi.fn(() => Promise.reject(new FetchAuthedError(409, '{"ok":false,"error":"tag_stale_conflict"}')))`。
- **Act**: code を `vip9` に変更 → submit。
- **Assert**: `screen.getByText(/別の変更/)` が表示。フォームは維持され入力値は保持される。回復は手動更新案内で行う。

### 2.5 E-T12: conflict 表示後に再 submit すると conflict がクリアされる

- **Arrange**: 1 回目 `tag_code_conflict` reject → 2 回目 resolve。
- **Act**: code 変更 → submit（conflict 表示）→ code を別値に変更 → submit。
- **Assert**: 2 回目 submit 前に `setConflict(null)` され、成功後は conflict 文言が消える（`screen.queryByText(/同じコードのタグ/)` が null）。

## 3. Panel 境界・row 反映・stale 回復の追加（`TagMasterPanel.spec.tsx`）

### 3.1 P-T5: pagination truncated（total > available）の注記表示

- **狙い**: server が pageSize=50 上限で truncate した場合（`total > available.length`）に「全件ではない」注記を出す（DESIGN-BRIEF のリスク「一覧 cache が旧 code」を一覧件数面でも明示）。
- **Arrange**: `render(<TagMasterPanel initial={{ available:[VIP], total:120 }} />)`。
- **Act**: —。
- **Assert**: `screen.getByText(/120/)` 等で total を表示し、`available.length < total` のとき truncated 注記（例: 「先頭50件を表示」）を出す。`available.length === total` のときは注記なし。

### 3.2 P-T6: 連続編集 → 2 回目の expectedCode が 1 回目成功後の新 code

- **狙い**: rename 成功で row が `vip→vip2` に置換された後、同じ行を再選択して再 rename すると expectedCode が `vip2`（最新値）になること（CAS 連鎖）。
- **Arrange**: `render(<TagMasterPanel initial={{ available:[VIP], total:1 }} />)`。1 回目 `patch.trigger` が `{ tagId:"t_vip", code:"vip2", label:"VIP会員", category:"membership" }` を返す。
- **Act**: 行選択 → code を `vip2` → submit → `onSuccess` 反映 → 同行を再選択 → code を `vip3` → submit。
- **Assert**: 2 回目 `patch.trigger` の body の `expectedCode === "vip2"`（1 回目成功後の最新 code がフォーム初期値になり expectedCode に乗る）。`key={selected.tagId}` だけでは同一 tagId で再マウントされないため、**onSuccess 後に `rows` が更新され `selected` が新オブジェクトになる**ことで EditForm の props.tag が更新され初期値が再計算されることを固定する。

### 3.3 P-T7: stale conflict 分離表示

- **狙い**: stale conflict が出た後、code conflict と異なる文言で手動更新を促す。
- **Arrange**: `useRouter().refresh` を spy。1 回目 `patch.trigger` が `tag_stale_conflict` reject。
- **Act**: 行選択 → code 変更 → submit（stale）→ 回復導線クリック。
- **Assert**: `tag_stale_conflict` の文言が表示され、`tag_code_conflict` 文言と混同しない。
- **注**: authenticated staging の実 D1 反映は user-gated。

## 4. nav 回帰 guard（`shell-config.spec.ts` / `SidebarNavItem.spec.tsx`・編集）

### 4.1 Reg-N1: admin group に tag-master item が追加される（`shell-config.spec.ts`）

- **既存更新**: `shell-config.spec.ts:25` の `expect(admin?.items).toHaveLength(10)` を **11** に更新（tag-master 追加分）。
- **新規 it**: admin group に `{ id:"tag-master", href:"/admin/tag-master", label:"タグ管理", icon:"tag-master" }` が tag-queue の直後に存在:
  ```ts
  const admin = buildNavForRole("admin").find((g) => g.id === "admin");
  const ids = admin!.items.map((i) => i.id);
  expect(ids).toContain("tag-master");
  expect(ids.indexOf("tag-master")).toBe(ids.indexOf("tag-queue") + 1);
  const tm = admin!.items.find((i) => i.id === "tag-master");
  expect(tm).toMatchObject({ href:"/admin/tag-master", label:"タグ管理", icon:"tag-master" });
  ```

### 4.2 Reg-N2: tag-master と tag-queue の active 衝突なし（`shell-config.spec.ts`）

- **狙い**: sibling route 採用の核心（Phase 1 §1.3.2）を回帰固定。
- **Assert**:
  ```ts
  // /admin/tag-master 上で tag-queue は active にならない
  expect(isNavItemActive("/admin/tags", "/admin/tag-master")).toBe(false);
  // /admin/tag-master 自身は active
  expect(isNavItemActive("/admin/tag-master", "/admin/tag-master")).toBe(true);
  // 逆方向: /admin/tags 上で tag-master は active にならない
  expect(isNavItemActive("/admin/tag-master", "/admin/tags")).toBe(false);
  // /admin/tags/queue 等の子では tag-queue が active・tag-master は false
  expect(isNavItemActive("/admin/tags", "/admin/tags/queue")).toBe(true);
  expect(isNavItemActive("/admin/tag-master", "/admin/tags/queue")).toBe(false);
  ```

### 4.3 Reg-N3: SidebarNavItem が tag-master を内部 active item として描画（`SidebarNavItem.spec.tsx`）

- **新規 it**: `usePathname` を `/admin/tag-master` に mock した状態で `item={ id:"tag-master", href:"/admin/tag-master", label:"タグ管理", icon:"tag-master" }` を `activePath="/admin/tag-master"` で render し、`data-active === "true"` / `aria-current === "page"` / `textContent` に「タグ管理」を含むこと。icon が `ShellIcon` 経由で path 解決され throw しないこと（`PATHS["tag-master"]` 追加の回帰）。

## 5. 既存テスト非破壊確認

| 既存 spec | 影響 | 非破壊確認 |
| --- | --- | --- |
| `members.tagCreate.spec.ts` | なし（`members.ts` 不変・`tags.ts` は別ファイル） | Green 維持 |
| `MemberDrawer.tagInlineCreate.spec.tsx` | なし（drawer 経路不変） | Green 維持 |
| `TagQueuePanel.component.spec.tsx` | なし（`/admin/tags` queue 不変） | Green 維持 |
| `shell-config.spec.ts` | admin item 数 10→11 | §4.1 で 11 に更新（唯一の既存破壊→更新で Green） |
| `SidebarNavItem.spec.tsx` | なし（新規 it 追加のみ） | 既存 4 ケース Green 維持 |
| `icons.tsx` の `PATHS` exhaustive Record | `tag-master` キー追加で型は満たす | typecheck Green（キー漏れなら逆に fail） |

## 6. 観測点まとめ

- 境界: CODE_RE 違反（client 前検証・E-T8）/ label 120・category 64 長さ（E-T9）/ 空 bodyText 500 系（U-T9）/ pagination truncated（P-T5）。
- 異常系: 409 code_conflict / 409 stale_conflict の **別文言**（E-T4/E-T5・E-T11/E-T12）/ 404 / no_update_fields / invalid_body（U-T4/U-T5/U-T7）。
- 連続編集 / CAS 連鎖: 多重送信ブロック（E-T10）/ 2 回目 expectedCode が最新 code（P-T6）/ stale conflict 分離表示（P-T7）。
- nav 回帰: tag-master 追加（Reg-N1）/ tag-queue との active 衝突なし sibling route 固定（Reg-N2）/ SidebarNavItem 描画 + icon path 解決（Reg-N3）。
- 全テストは public 関数 / public component / 純関数（`isNavItemActive`）のみ対象。`apps/api` 非変更・D1 直アクセス無し・OKLch token 維持。
