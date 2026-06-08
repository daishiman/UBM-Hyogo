# Phase 8: リファクタリング（issue-1116 admin tag master code edit UI）

**[実装区分: 実装仕様書]**

> GREEN 達成後に行う構造改善の方針を確定する。本タスクは `apps/web` に新規 admin ルート / client component / web API client を追加する VISUAL / implementation_mode=new だが、**既存パターン（`members.ts` の create error parse・`MemberTagInlineCreate` の FormField + useAdminMutation・`TagQueuePanel` の一覧+選択構造・`/admin/tags/page.tsx` の server component）へ整合する**ことを基本とし、**新規抽象レイヤーを生やさない**（YAGNI）。
> implemented_local_evidence_captured 段階。本 Phase のリファクタ判断は本実行サイクルの GREEN 達成後に適用する。

## 1. 既存パターンへの整合（対象 / Before / After / 理由） — [Feedback RT-03]

| 対象 | Before（独自に書くと） | After（既存踏襲） | 理由 |
| --- | --- | --- | --- |
| update error code parse | `tags.ts` 内に独自 JSON parse + 既知 code 判定を別実装 | `members.ts` の `parseTagErrorCode`（`members.ts:224-236`）と**同一構造**の `parseTagUpdateErrorCode` を書く（try/catch JSON → object 判定 → 既知 code set 判定 → null fallback） | repo に確立済みの create 版 parse が存在。語彙（update 用 error code set）だけ差し替えた逐語踏襲で、読み手の認知コストを最小化（Phase 4 §1 注記） |
| error class | 新規 error クラスを独自 shape で設計 | `TagCreateError`（`status`/`code`/`bodyText`）と**同形**の `TagUpdateError` を書く | 既存 create error の継承構造に揃える。test の `toMatchObject({code,status})` パターンも共用できる |
| web API mutation 関数 | fetch ラッパを独自設計 | `createTag`（`members.ts`）の fetch + `!res.ok` → error throw + 成功 JSON 正規化を踏襲した `updateTag`（method=PATCH・`encodeURIComponent(tagId)`・active 除外 4 項目返却） | 同 repo の確立済み二経路方針（raw helper + `useAdminMutation` 経路）に整合（Phase 5 §1.4 注記） |
| フォーム入力 | `<input>` を直接配置 | `FormField`（不変条件 #9）経由。`MemberTagInlineCreate` の FormField×N 構造を踏襲 | admin form input の標準。`apps/web/src/components/admin/` 配下に裸 `<input>` を増やさない（不変条件 #9） |
| mutation 配線 | 独自 fetch hook | `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10） | admin mutation の標準。legacy `@/lib/useAdminMutation` への新規参照を増やさない（不変条件 #10） |
| 一覧 + 選択 + 詳細ペイン | 独自レイアウト | `TagQueuePanel` の「一覧 + 行選択 → 詳細フォーム」二分割構造を踏襲 | 既存 admin パネルの確立済み UX パターン。新規レイアウト primitive を生やさない（不変条件 #3） |
| server component の error 分岐 | 独自 error UI | `/admin/tags/page.tsx` の `safeServerFetch` → `result.ok` 分岐 + `AdminPageHeader` / `AdminSectionErrorClient` 再利用 | 既存 admin route の確立済み構造（Phase 5 §4） |

## 2. 重複排除方針（members.ts の create error parse との共通化是非）

| 候補 | 判断 | 理由 |
| --- | --- | --- |
| `parseTagErrorCode`（create）と `parseTagUpdateErrorCode`（update）を**汎用 parse util に統合** | **不採用（統合しない）** | 構造は似るが**既知 error code セットが異なる**（create=`tag_code_conflict`/`invalid_body`/`invalid_json` 系 vs update=さらに `tag_stale_conflict`/`tag_not_found`/`no_update_fields` を含む）。汎用化すると「許可 code set を引数で渡す」設計になり、呼び出し側の認知コストが上がる。create は `members.ts`、update は `tags.ts` に**文脈ごとに閉じる**方が読みやすい。Rule of Three 未成立（2 箇所目）でもあり YAGNI |
| `TagCreateError` / `TagUpdateError` を共通基底 `TagMutationError` に統合 | **不採用** | error class の継承段数を増やすメリットが薄い。両者は別ファイル（members.ts / tags.ts）に閉じ、shape は同形でも責務文脈が異なる。共通基底は Rule of Three 成立時に再検討（YAGNI） |
| `updateTag` の差分 body 構築（`buildBody`）を汎用 diff util 化 | **不採用** | code 変更時のみ expectedCode を同梱する CAS 固有ロジック（Phase 5 §2.2）。tag master 編集 1 箇所だけで、汎用 diff util にすると CAS 固有分岐が util に漏れる。`TagMasterEditForm` 内インラインで十分（YAGNI） |
| `CONFLICT_COPY`（409 文言 map）を専用 i18n / 文言 util に切り出し | **不採用** | 2 文言（code_conflict / stale_conflict）のみ。`TagMasterEditForm` 内に名前付き `Record` で 1 箇所集約すれば AC-3 の分離は担保され、文言の散在も防げる（Phase 5 §2.4）。専用 util 化はコスト過多（YAGNI） |

> 重複排除は「**型・既知 code set の 1 箇所集約**（`AdminTagUpdateErrorCode` union + `KNOWN_TAG_UPDATE_ERROR_CODES`）」と「**409 文言の名前付き map 集約**（`CONFLICT_COPY`）」に閉じる。create 版との物理統合はしない（語彙が別・YAGNI）。

## 3. 命名整合 / early return / 構造改善

| 項目 | 方針 |
| --- | --- |
| 命名整合 | Phase 1 §1.4 の整合表どおり: route dir=`tag-master`（kebab）/ component=`TagMasterPanel`/`TagMasterEditForm`（PascalCase）/ API 関数=`updateTag`（camelCase 動詞始まり）/ error 型=`AdminTagUpdateErrorCode`（PascalCase+`...ErrorCode`）/ nav id=`tag-master`（kebab）。捏造識別子なし |
| early return | EditForm submit ハンドラは `setConflict(null)` → `buildBody()` → **差分ゼロなら early return**（「変更がありません」表示・mutation 未発火）→ client 前検証 NG なら early return（CODE_RE / 長さ）→ mutation 発火、の順で浅いネストを保つ（E-T3c / E-T8 / E-T9） |
| 多重送信ガード | submit 中は `isSubmittingRef` 相当で二重 trigger を防ぐ（E-T10）。新規 hook は作らず component 内 ref で閉じる |
| 早期 null 描画 | Panel は `rows.length === 0` で「該当するタグはありません」を early に描画し編集フォームを描画しない（P-T1b） |
| key 再マウント | `<TagMasterEditForm key={selected.tagId} ... />` で行切替時の state 再初期化を構造で保証（P-T4・新規 reset ロジック不要） |

## 4. 「新規抽象を生やさない」方針の明記

本タスクは新規ファイルを 6 追加するが、いずれも**既存 primitive / 既存 hook / 既存パターンの組み合わせ**であり、新たな共通抽象レイヤー（汎用 form builder / 汎用 mutation util / 汎用 error parse / 新規 design primitive）は導入しない（不変条件 #3「新規 primitive を生やさない」/ #9 / #10）。

- 重複が「2 箇所目」（create vs update の parse / error class）に留まるものは **Rule of Three 未成立**として統合を見送る（§2）。
- CAS 差分構築・409 文言は **文脈に閉じたインライン + 名前付き定数**で 1 箇所集約に留める（汎用化しない）。
- レイアウト・色は既存 utility class（`ui-input` / `ui-button` / admin alert）と OKLch token のみ（不変条件 #2・HEX 直書きなし・新規色トークンなし）。

## 5. navigation drift 確認（VISUAL）

本タスクは admin に**新規ルート `/admin/tag-master` を 1 本追加**し、sidebar nav に `tag-master` item を追加する。navigation への影響を以下で確認する:

| 観点 | 確認 | テスト |
| --- | --- | --- |
| 新規 nav item 追加 | admin group items 10 → 11（tag-queue 直後に tag-master） | Reg-N1 |
| active 衝突なし（核心） | sibling route 採用により `/admin/tag-master` 表示時に tag-queue（`/admin/tags`）が active にならない。`isNavItemActive` は変更しない | Reg-N2 |
| icon path 解決 | `PATHS["tag-master"]` 追加で `SidebarNavItem` が throw せず描画 | Reg-N3 |
| 既存 nav 非破壊 | 他 nav item / 既存ルートの active 判定に影響なし | 既存 `shell-config.spec.ts` / `SidebarNavItem.spec.ts` Green 維持 |

> **navigation drift: 制御済み**。sibling route + `isNavItemActive` 非変更で衝突を構造的に回避（DESIGN-BRIEF §3-1 / §6）。dead link・404 link は新設のみで発生しない。

## 6. リファクタ後の不変条件再確認

- error code / 既知 set は `AdminTagUpdateErrorCode` union + `KNOWN_TAG_UPDATE_ERROR_CODES` の 1 箇所集約（route の `ERROR_TO_STATUS` と逐語一致）。
- 409 文言は `CONFLICT_COPY` の名前付き map で 1 箇所集約（AC-3 分離・E-T4/E-T5 が固定）。
- CAS（expectedCode 同梱は code 変更時のみ）は `TagMasterEditForm` の `buildBody` にインライン集約（汎用化しない）。
- mutation=`useAdminMutation`（#10）/ input=`FormField`（#9）/ 色=OKLch 既存 token（#2・HEX なし）/ D1 直アクセスなし（#5）/ `apps/api` 非変更（#1/#7）。
- 外部 contract（既存 `members.ts` / `useAdminMutation` / `/admin/tags` queue page / catch-all proxy）は後方互換に保つ。既存テスト（`members.tagCreate.spec.ts` / `MemberDrawer.tagInlineCreate.spec.tsx` / `TagQueuePanel.component.spec.tsx`）は Green 維持を GREEN 維持条件とする（Phase 6 §5）。

> commit / push / PR / staging deploy / authenticated visual capture / Issue 状態変更は user-gated。Issue #1116 は CLOSED（`Refs #1116` のみ）。
