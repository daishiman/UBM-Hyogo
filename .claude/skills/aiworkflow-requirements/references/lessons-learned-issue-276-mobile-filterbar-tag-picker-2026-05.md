# Lessons Learned — Issue #276 mobile FilterBar tag picker（公開メンバー一覧, 2026-05-20）

> task: `issue-276-mobile-filterbar-tag-picker`
> workflow: `docs/30-workflows/issue-276-mobile-filterbar-tag-picker/`
> source unassigned-task: `docs/30-workflows/unassigned-task/task-06a-followup-003-mobile-filterbar-tag-picker.md`（completed-tasks/unassigned-task/ へ rename 済み）
> 関連 skill 反映: `.claude/skills/aiworkflow-requirements/changelog/20260520-issue276-mobile-filterbar-tag-picker.md`
> 関連 artifact inventory: `references/workflow-issue-276-mobile-filterbar-tag-picker-artifact-inventory.md`
> 関連 reference（新規）: `.claude/skills/task-specification-creator/references/patterns-mobile-ui-primitive-3point-sync.md`

## 背景

公開メンバー一覧 `/members` の FilterBar に tag chip picker を導入し、`?tag=` 反復 URL 維持・mobile 折りたたみ・選択上限 5 件 hint を追加した。実装は 4 層（shared zod / API repository + use-case / web client primitives / Playwright mobile spec）を同一 wave で更新し、system spec 4 ファイル（01-api-schema / 09-ui-ux / 09e / 12-search-tags）を同期させた。

苦戦の要点は次の 3 点に集約される:

1. **4 層 + 4 spec を同一 wave で同期させる順序設計**: shared schema 先行で contract を固定しないと、API response shape と UI 期待 shape が drift しやすい。
2. **selected tag の URL state（canonical）と mobile expanded state（local）の境界**: 折りたたみ状態を URL に乗せると bookmark/share が壊れるため local 限定にする判断が必要。
3. **5 件上限の semantics を a11y まで貫通**: `role="switch"` + `aria-checked` + `aria-disabled` + `aria-live="polite"` hint の 4 点を 1 component で噛み合わせる。

## 教訓一覧

### L-I276-001: shared zod schema を最初に固定し、API → UI の順で 1 contract を貫通させる

- **背景**: `topTags: { code, label, count }[]`（max 20）を `PublicMemberListViewZ` に追加する際、API repository / use-case / view-model / web fetcher / UI component の 5 surface が並走したが、shared zod を先に確定させたことで全 surface が同じ parse 結果を扱えた。逆順で API 実装を先に進めると UI 側 fixture が drift し、Phase 4-6 で contract test が連続失敗する。
- **教訓**: 4 層実装は **shared zod → API repository → API use-case → API contract test → web fetcher → web component** の固定順で進める。`packages/shared/src/zod/viewmodel.ts` を変更したら同一 commit で `viewmodel.spec.ts` を更新し、API/web の `__tests__/` fixtures を一括追従させる。
- **将来アクション**: task-specification-creator `references/patterns-mobile-ui-primitive-3point-sync.md` に「4-layer sync 順序固定」を pattern として登録（本 lesson と double-link）。

### L-I276-002: URL state と local UI state の境界を明示する

- **背景**: 選択中の tag は `?tag=ai&tag=design` の **反復 query parameter** として URL canonical で持ち、bookmark / share / back navigation で復元可能にした。一方 mobile での FilterBar 展開/折りたたみは React local state（`useState`）のみで管理し URL に乗せない設計を選んだ。最初は「折りたたみ状態も URL に乗せた方が一貫」と考えがちだが、share された URL が常に展開済みになると mobile での「初期表示が見やすい」目的が崩れる。
- **教訓**: filter の **意味的 state**（検索条件・絞り込み・並び順）は URL canonical、**表示的 state**（折りたたみ / hover / focus / dialog open）は local に置く。判断軸は「他者と share した時に再現してほしいか」。
- **将来アクション**: `references/patterns-mobile-ui-primitive-3point-sync.md` §「URL canonical vs local UI state matrix」に、本基準を表で記録する。

### L-I276-003: 上限 5 件の a11y は switch+aria-checked+aria-disabled+aria-live の 4 点セットで実装する

- **背景**: tag 選択を toggle で表現するため `role="switch"` + `aria-checked={isSelected}` を採用。上限到達時は未選択 chip を `aria-disabled` で操作不可化（`onClick` 側で no-op）し、`aria-live="polite"` の hint で screen reader に通知する。`disabled` 属性ではなく `aria-disabled` を選んだのは、focusable を維持して上限到達理由を読み上げ可能にするため。
- **教訓**: 「toggle + 上限制約」を伴う chip / pill primitive では (a) `role="switch"`、(b) `aria-checked`、(c) `aria-disabled`（DOM `disabled` ではない）、(d) `aria-live="polite"` hint の 4 点を必須セットとする。`onClick` 側でも `if (isDisabled) return;` の早期 return を入れ、event を二重で塞ぐ。
- **将来アクション**: `docs/00-getting-started-manual/specs/09-ui-ux.md` FilterBar 仕様に 4 点セットを正本として記載（本 close-out で反映済み）。`docs/00-getting-started-manual/claude-design-prototype/` の primitives 章にも `tag-pill` の switch variant として転記候補。

### L-I276-004: client primitive を 3 component に責務分割する

- **背景**: 「候補表示」「選択済み表示」「mobile 折りたたみ summary」を 1 component に詰め込むと、props 増殖と test 行数膨張で破綻する。今回は `TagPicker.client.tsx`（候補 chip 列）/ `SelectedTagsBar.client.tsx`（選択済み + clear）/ `FiltersSummaryMobile.client.tsx`（折りたたみ時の summary 行）の 3 component に分割した。
- **教訓**: filter 系 UI の責務分割軸は (a) 候補列、(b) 選択済み列、(c) summary / 折りたたみ control の 3 軸。`MemberFilters.client.tsx` は **composition root** に留め、business logic（toggle / clear / limit）は親に集約しつつ視覚要素は子に委譲する。
- **将来アクション**: `references/patterns-mobile-ui-primitive-3point-sync.md` §「3-point primitive split rule」に責務軸を pattern として登録。

### L-I276-005: `topTags` の集計境界は公開可視タグに閉じる

- **背景**: `aggregateTopTags()` を repository に追加する際、admin-only tag や非公開 member の tag を `topTags` に混入させない不変条件が必要。集計クエリは「public visibility = 1 の member に紐づく active tag を COUNT(DISTINCT member_id) DESC」で固定し、max 20 で truncate する。
- **教訓**: 公開境界を持つ aggregate field（topTags / counters / facets）は、repository 層で **WHERE 句に public visibility 条件を入れた専用 query** を持ち、共通 list query から派生させない。max 件数は API 層ではなく shared zod schema で `.max(20)` 制約として強制する。
- **将来アクション**: `docs/00-getting-started-manual/specs/01-api-schema.md` `GET /public/members` セクションに「topTags は public 境界内 active tag のみ・max 20」を明記済み（本 close-out で反映）。`docs/00-getting-started-manual/specs/12-search-tags.md` にも tag 候補の境界を記述。

### L-I276-006: Playwright mobile evidence は viewport + URL 状態の 2 軸で 4 枚撮る

- **背景**: Phase 11 evidence として `mobile-initial.png`（折りたたみ初期）/ `mobile-expanded.png`（展開）/ `mobile-limit-reached.png`（5 件選択済み）/ `desktop-picker-and-selected.png`（desktop 側）の 4 枚を撮影。mobile 単体だと「上限到達 hint」が visual 差分で確認できない。
- **教訓**: 折りたたみ + 上限制約を持つ filter UI の visual evidence は最低 4 枚（mobile-initial / mobile-expanded / mobile-limit-reached / desktop-overview）を canonical とする。screenshot は `outputs/phase-11/evidence/` 配下に固定 path で保存し、`screenshot-plan.json` で path と viewport を宣言する。
- **将来アクション**: `references/patterns-mobile-ui-primitive-3point-sync.md` §「mobile visual evidence canonical 4-shot」に list 化する。

### L-I276-007: system spec 4 ファイル同時更新は責務マトリクスで漏れを潰す

- **背景**: 同一 wave で `01-api-schema.md`（response 契約）/ `09-ui-ux.md`（FilterBar props）/ `09e-screen-blueprints-public.md`（画面 blueprint）/ `12-search-tags.md`（tag search 仕様）の 4 ファイルを更新。1 ファイルでも追従漏れがあると Phase 12 system-spec-update-summary で `wording mismatch` を検出する。
- **教訓**: UI primitive 追加は **(a) API contract / (b) UI props / (c) 画面 blueprint / (d) feature 仕様** の 4 軸 spec を同時更新する。`outputs/phase-12/system-spec-update-summary.md` に 4 行の更新表を作って漏れチェックする運用を固定する。
- **将来アクション**: task-specification-creator `references/patterns-mobile-ui-primitive-3point-sync.md` §「4-spec sync matrix」に表 template を登録。

## 後発タスクへの転記チェックリスト（filter / picker primitive 追加時に複製）

- [ ] shared zod schema を最初に追加し `.max(N)` で件数制約を埋め込む
- [ ] API repository に専用 aggregate query を追加し、公開境界条件（visibility / status）を WHERE に入れる
- [ ] API use-case で list + count + aggregate を 1 response にまとめ、contract test fixture を更新
- [ ] web fetcher（`apps/web/src/lib/api/*`）に response shape の zod parse を追加
- [ ] client primitive を「候補 / 選択済み / summary 折りたたみ」の 3 component に分割
- [ ] toggle UI は `role="switch"` + `aria-checked` + `aria-disabled`（DOM disabled ではない）+ `aria-live="polite"` hint
- [ ] selected state は URL 反復 query で canonical、表示 state（折りたたみ / hover / focus）は local
- [ ] Playwright mobile evidence は 4 枚（initial / expanded / limit-reached / desktop-overview）
- [ ] system spec 4 ファイル（API schema / UI 仕様 / 画面 blueprint / 機能仕様）を同一 wave 更新
- [ ] `outputs/phase-12/system-spec-update-summary.md` に 4 行の更新マトリクスを記載
- [ ] artifact inventory / changelog / indexes（resource-map / quick-reference / topic-map / keywords.json）を同一 wave で同期

## 参照

- 親 workflow: `docs/30-workflows/issue-276-mobile-filterbar-tag-picker/`
- 元 unassigned-task: `docs/30-workflows/completed-tasks/unassigned-task/task-06a-followup-003-mobile-filterbar-tag-picker.md`
- skill changelog: `.claude/skills/aiworkflow-requirements/changelog/20260520-issue276-mobile-filterbar-tag-picker.md`
- artifact inventory: `references/workflow-issue-276-mobile-filterbar-tag-picker-artifact-inventory.md`
- 関連 pattern reference（新規）: `.claude/skills/task-specification-creator/references/patterns-mobile-ui-primitive-3point-sync.md`
- 関連 spec: `docs/00-getting-started-manual/specs/{01-api-schema.md, 09-ui-ux.md, 09e-screen-blueprints-public.md, 12-search-tags.md}`
