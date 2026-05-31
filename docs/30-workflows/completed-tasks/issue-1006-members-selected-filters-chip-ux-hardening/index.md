# issue-1006-members-selected-filters-chip-ux-hardening

[実装区分: 実装仕様書]

> 判定根拠: 本タスクの目的（① tag chip を表示名で描画 / ② chip 削除後の focus 遷移を固定 / ③ mobile での chip overflow 整理）は、いずれも `apps/web/src/components/public/SelectedFiltersBar.client.tsx` / `MemberFilters.client.tsx` のコード編集と `apps/web/src/styles/legacy-public.css` の編集、および focused vitest の追加・編集なしには達成不可能。ドキュメント・調査・合意形成のみで完結する余地は無いため、CONST_004 デフォルト（実装仕様書）に該当する。GitHub Issue #1006 はクローズド状態だが、最新コード（`origin/dev` = `origin/main` 同期済み HEAD `51ec9eb06`）で 3 課題が未解決であることを確認済みのため、issue をクローズドのまま本仕様書を作成する。

## メタ情報

| 項目                | 値                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Task ID             | TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001                                          |
| Feature 名          | issue-1006-members-selected-filters-chip-ux-hardening                                        |
| 元 Issue            | GitHub #1006（CLOSED のまま。状態変更しない）                                                |
| Task type           | implementation                                                                              |
| visualEvidence      | VISUAL（chip ラベル表示・focus リング・mobile レイアウトが変化する。Phase 11 で screenshot 取得） |
| implementation_mode | `edit`                                                                                       |
| workflow_state      | `implemented_local_runtime_pending`                                                                              |
| implementation_status | local focused tests PASS / mobile CSS runtime sanity PASS / full data-backed visual runtime pending             |
| 影響 surface        | `apps/web/src/components/public/SelectedFiltersBar.client.tsx` / `MemberFilters.client.tsx` / `apps/web/src/styles/legacy-public.css` および対応 spec |
| 親ワークフロー      | `docs/30-workflows/completed-tasks/members-list-ux-clarity/`                                 |
| 元タスク仕様        | `docs/30-workflows/completed-tasks/members-list-ux-clarity/unassigned-task-specs/task-members-selected-filters-chip-ux-hardening-001.md` |
| 想定 1 cycle 完了   | はい（編集 3 ファイル + spec 2 ファイル + DoD 検証を 1 PR で完了。CONST_007 充足）            |

## 元 Issue サマリ（一次情報・#1006）

`members-list-ux-clarity` で `SelectedTagsBar` を `SelectedFiltersBar` へ一般化し `q / zone / status / tag` を chip 表示できるようにしたが、初回実装では次の 3 点が未処理:

1. **tag code を表示名に変換する**: 現状 `#${tag}`（code）表示で公開ユーザーに意味が伝わりにくい。`TagPicker` は `#{label}` 表示のため不整合。
2. **削除後の focus を戻す**: chip 個別削除後の focus 戻しが未定義でキーボード操作の連続性が弱い。
3. **mobile で chip が多い場合の操作密度を整える**: 横スクロール / wrap / clear 配置が仕様化されていない。

> Issue 本文の「`sort` は表示順であり絞り込みではない」補正（親 Phase 12）に整合し、本タスクでも **sort は chip 化しない**（既存挙動を維持）。

## 現状コード調査（最新 HEAD 51ec9eb06）

| 課題 | 現状 | 根拠 |
| --- | --- | --- |
| ① tag label | `label: \`#${tag}\`` で code 直書き。`topTags`（`{code,label,count}`）は `MemberFilters` まで来ているが `SelectedFiltersBar` 未伝播 | `SelectedFiltersBar.client.tsx:61-69` / `MemberFilters.client.tsx:184-190` / `TagPicker.client.tsx`（`#{opt.label}`） |
| ② focus | 純粋関数。`useRef`/`useEffect` による focus 管理なし。削除 → `onPatch` → `router.replace` 再レンダーで focus ロスト | `SelectedFiltersBar.client.tsx:30-93` |
| ③ mobile | `[data-component="selected-filters-bar"]` は `flex; justify-content: space-between` のみ。mobile breakpoint 無し | `apps/web/src/styles/legacy-public.css:1375-1389` |

## 真の論点

1. **真の論点**: フィルタ可視化は成立しているが、(a) tag chip が機械可読 code のままで人間に意味が伝わらない、(b) キーボードユーザーが chip 削除のたびに focus を失い操作が途切れる、(c) 実データ件数増加時に mobile で chip / clear / result count の操作密度が破綻する。データ規模が増えた段階で「UX clarity」という親タスクの価値が薄れる。
2. **依存関係・責務境界**:
   - tag label 解決は **既存 props（`topTags: TagPickerOption[]`）から導出**し、API schema 変更・新規 endpoint・D1 アクセスは一切しない（UI prototype alignment 不変条件 #1 / CLAUDE.md 不変条件 #5）。
   - `search.tag` には `topTags` に載らない code も入りうるため、未登録 code は `#${code}` に fallback（純粋関数の防御的返却。`[WEEKGRD-02]` に整合）。
   - **intra-bar focus（次/前 chip・clear-all）は `SelectedFiltersBar` が所有**。最後の chip 削除で bar 自体が unmount するため、その fallback focus 先（検索入力）は **親 `MemberFilters` が所有**（state ownership を混在させない）。
   - mobile CSS は `[data-component="selected-filters-bar"]` 配下に閉じ、他ページへ波及させない。
3. **価値とコストの不均衡**: 編集は 3 ファイル + spec 2 ファイル。新規 component・新規 primitive・API 変更ゼロ。ユーザー価値（意味のある chip / キーボード操作連続性 / mobile 操作密度）に対しコスト極小。
4. **改善優先順位**: ① tag label 解決（最も視認影響大かつ低リスク）→ ② focus 管理（a11y 価値・中リスク）→ ③ mobile overflow（CSS 局所）。
5. **4条件評価**:
   - 価値性: 公開ユーザー（特にキーボード / mobile）の認知・操作コストを下げる
   - 実現性: 3 file edit + spec 2 file の最小差分で 1 cycle 完了
   - 整合性: 既存 `topTags` 契約 / `TagPicker` 表示規則 / OKLch トークン / `*.spec.tsx` 規約と整合
   - 運用性: focused vitest で chip label / focus 遷移 / sort 非 chip 化を回帰固定

## Phase 構成

| Phase | 名称             | 状態          | 出力先                                  |
| ----- | ---------------- | ------------- | --------------------------------------- |
| 1     | 要件定義         | completed  | outputs/phase-1/phase-1.md              |
| 2     | 設計             | completed  | outputs/phase-2/phase-2.md              |
| 3     | 設計レビュー     | completed  | outputs/phase-3/phase-3.md              |
| 4     | テスト作成       | completed  | outputs/phase-4/phase-4.md              |
| 5     | 実装手順         | completed  | outputs/phase-5/phase-5.md              |
| 6     | テスト拡充       | completed  | outputs/phase-6/phase-6.md              |
| 7     | カバレッジ確認   | completed  | outputs/phase-7/phase-7.md              |
| 8     | リファクタリング | completed  | outputs/phase-8/phase-8.md              |
| 9     | 品質保証         | completed  | outputs/phase-9/phase-9.md              |
| 10    | 最終レビュー     | completed  | outputs/phase-10/phase-10.md            |
| 11    | 手動テスト       | completed_local_runtime_pending  | outputs/phase-11/phase-11.md（計画）/ outputs/phase-11/manual-test-result.md（結果）  |
| 12    | ドキュメント更新 | completed  | outputs/phase-12/phase-12.md（要約）/ outputs/phase-12/main.md（サマリ）              |
| 13    | PR作成           | pending_user_approval | outputs/phase-13/phase-13.md    |

> `workflow_state=implemented_local_runtime_pending`: 本 wave でコード実装・focused Vitest・typecheck・lint・design-token gate・local Playwright component-harness screenshot 3 枚を完了した。staging data-backed visual verification は Phase 13 以降の user-gated 境界に残す。

## 不変条件（CLAUDE.md / UI prototype alignment / 親ワークフローより）

- **既存 API のみ接続**: `apps/api/src/routes/` の現行 endpoint のみ。新 endpoint / D1 schema 変更 / Google Form 仕様変更は禁止（不変条件 #1）。tag label は `topTags` から導出のみ。
- D1 直接アクセスは `apps/api` に閉じる（`apps/web` から直接アクセス禁止）。
- 新規 / 変更 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.{ts,tsx}` 禁止）。
- OKLch トークン正本化。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。CSS は `var(--ubm-...)` トークン経由のみ。CI gate `verify-design-tokens` で fail 判定。
- `apps/web` env 参照は公開アクセサ経由のみ（本タスクは env 非依存）。
- mobile CSS selector は `[data-component="selected-filters-bar"]` 配下に閉じる（他画面へ波及禁止）。
- `sort` は chip 化しない（親 Phase 12 補正の維持）。

## DoD（Definition of Done）

- tag chip が `topTags` の表示名（`#{label}`）で描画され、未登録 code は `#{code}` に fallback する。
- chip 個別削除後、focus が「次の chip → （無ければ）前の chip → （chip が残らなければ）クリアボタン or 検索入力」へ決定論的に遷移し、focused vitest で固定される。
- mobile 幅（`<=640px`）で chip / クリアボタン / result count が重ならず縦積みされる（screenshot で確認）。
- `sort` が chip 化されないことが test で維持される（回帰）。
- `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx` / `MemberFilters.client.spec.tsx` の Vitest 17/17 が green。
- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` が green。
- `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` が green。
- `mise exec -- pnpm lint` / `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` が green（HEX 直書きゼロ）。

## 関連タスク

| ID | 関係 | 状態 |
| --- | --- | --- |
| GitHub #222 public search query parser shared 化 | 関連だが**非依存**（別責務） | 別タスク |
| `members-list-ux-clarity`（親） | 前提（`SelectedFiltersBar` 実装済み） | completed |
