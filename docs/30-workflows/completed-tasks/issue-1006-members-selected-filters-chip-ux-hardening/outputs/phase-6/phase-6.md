# Phase 6: テスト拡充（fail path・回帰 guard）

- Task ID: issue-1006-members-selected-filters-chip-ux-hardening
- 区分: Phase 4 の RED ケースを GREEN 化した後、edge / fail path / 回帰を網羅して branch カバレッジを確保する

---

## 1. fail path / edge ケース

すべて `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx`（特記なき限り）に追記。focus 検証は `userEvent`、Controlled wrapper（Phase 4 §2.1）を流用。

| TC-ID | ケース名 | 入力 | 期待値 | 狙う branch / AC |
|-------|----------|------|--------|------------------|
| SFB-E1 | `tagLabels` undefined（prop 省略）で後方互換 = code 表示 | `tag: ["ai"]`, `tagLabels` 省略 | chip テキスト `#ai`、aria-label `ai タグ絞り込みを解除` | `resolveTag` の code fallback / AC-2 |
| SFB-E2 | tag 複数で一部のみ登録 | `tag: ["ai", "newx"]`, `tagLabels: { ai: "AI活用" }` | `#AI活用` chip（登録）と `#newx` chip（fallback）が両方描画。aria-label もそれぞれ `AI活用 タグ絞り込みを解除` / `newx タグ絞り込みを解除` | `resolveTag` の両分岐（登録 / fallback）混在 / AC-1・AC-2 |
| SFB-E3 | chip 0→1→0 の focus 遷移（単一 chip） | Controlled, `tag: ["a"]`, `onEmpty: vi.fn()` | A 削除クリック → chips=0 で bar unmount → `onEmpty` 1 回呼ばれ、`document.activeElement` は bar 外（body 等。bar 内 button でないこと） | `pendingFocusRef` の `null` 分岐（onEmpty） / AC-3 |
| SFB-E4 | 中間 chip 削除で「次の chip」優先（前ではなく後） | Controlled, `tag: ["a","b","c"]`, labels 全登録 | 中央 B 削除 → `document.activeElement` が C（`chips[idx+1]`）であり A ではない | `nextKey = chips[idx+1] ?? chips[idx-1]` の第 1 項分岐 / AC-3 |
| SFB-E5 | 末尾 chip 削除で「前の chip」へ（次が無い） | Controlled, `tag: ["a","b"]` | B 削除 → `activeElement` が A（`chips[idx-1]`） | 第 2 項分岐（`?? chips[idx-1]`） / AC-3 |
| SFB-E6 | q+zone+status+tag 混在時の chip 順序と削除 focus | `q:"山田", zone:"0_to_1", status:"member", tag:["ai"]`, labels `{ai:"AI活用"}` | 順序が `検索: 山田` → `区画: 0→1` → `種別: 正会員` → `#AI活用` の DOM 順。先頭（q）chip を削除 → 次（zone）chip に focus | chip 構築順 + focus index 計算 / AC-3・AC-5 |

> SFB-E6 の順序検証は `container.querySelectorAll('[data-role="active-filters"] li button')` の `textContent` 配列で assert する（`screen.getAllByRole("button")` だと clear-all を含むため li 配下に限定）。

### mobile（縦積み）の扱い

mobile の縦積みレイアウト（AC-4）は CSS メディアクエリ（`@media (max-width: 640px)`）に依存し、jsdom はレイアウト計算・メディアクエリ適用を行わないため **ユニットテストでは担保しない**。Phase 11 の visual evidence（<=640px viewport のスクリーンショット）で確認する旨をここに明記する。ユニットでは「`[data-component="selected-filters-bar"]` と `[data-role="clear-all"]` が存在する」構造のみ（既存の描画ケースで間接担保）。

---

## 2. 回帰 guard（既存挙動の固定）

| TC-ID | ケース名 | 期待値 | AC |
|-------|----------|--------|----|
| SFB-R1 | sort は chip 化しない | `sort:"name"` 単独 → bar は描画されず（chips=0 → null）。他 1 件と併存時も `名前順` / `並び替え` テキスト無し | AC-5 |
| SFB-R2 | 「絞り込みをクリア」で onClearAll | clear-all クリックで `onClearAll` 呼ばれる（既存ケース維持） | — |
| SFB-R3 | 絞り込み条件が空なら null | 全 default → `container.firstChild === null`（既存ケース維持） | — |
| SFB-R4 | q/zone/status の削除は onPatch に正しい patch | q→`{q:""}` / zone→`{zone:"all"}` / status→`{status:"all"}` / tag→`{tag: 残り}`（`removeChipAt` ラップ後も patch 内容が不変であること） | AC-6 相当（挙動不変） |
| MF-R1 | topTags 未指定時 tagLabels 空 = code 表示維持 | `MemberFilters` で `topTags` 省略・`tag:["foo"]` → `foo タグ絞り込みを解除`（既存 line 76 ケース） | AC-2 |
| MF-R2 | clear-all で `/members` へ router.replace | 既存ケース維持 | AC-6 |

> SFB-R4 は focus 管理ラップ（`removeChipAt`）導入で patch 内容が壊れていないことの回帰。既存「区画絞り込みを解除 → `{zone:"all"}`」ケースを残しつつ、q / status / tag についても同様の `toHaveBeenCalledWith` を追加する。

---

## 3. カバレッジで狙う branch（Phase 7 へ申し送り）

| 関数 / 箇所 | branch | 担保 TC |
|-------------|--------|---------|
| `resolveTag` | `tagLabels?.[code]` がヒット（左辺） | SFB-T1 / SFB-E2 |
| `resolveTag` | own property 以外は code fallback | SFB-T2 / SFB-T3 / SFB-E1 / SFB-E2 / prototype key fallback |
| `removeChipAt` の `nextKey` | `chips[idx+1]?.key`（次あり） | SFB-T5 / SFB-E4 |
| `removeChipAt` の `nextKey` | `?? chips[idx-1]?.key`（次なし・前あり） | SFB-T6 / SFB-E5 |
| `removeChipAt` の `nextKey` | `?? null`（前後とも無し → onEmpty） | SFB-T7 / SFB-E3 |
| `useEffect` 復帰 | `target === null` で early return | SFB-E3（unmount で effect 自体走らないが、複数 chip→他 chip 残存ケースで非 null 経路を SFB-T5 が担保） |
| MemberFilters `tagLabels` | `topTags` 空 → 空 object | MF-R1 |
| MemberFilters `tagLabels` | `topTags` あり → label map | MF-T1 |
| `onEmpty` 配線 | 検索入力 focus 経路 | MF-T2 / SFB-E3（component 単体側） |

> Phase 7（カバレッジ確認）では `resolveTag` の own property / code fallback / prototype key fallback、`pendingFocusRef` の 3 分岐（次 / 前 / null）が全て踏まれていることを branch coverage レポートで確認する。未踏 branch があれば上表の TC-ID から欠落ケースを補う。

---

## 4. テスト方針の制約（再掲）

- `userEvent` を focus 検証に使用。`fireEvent` は patch 内容のみ見る回帰ケースで継続使用可。
- `vi.stubGlobal("window", ...)` 禁止。jsdom の window / activeElement をそのまま使う。
- 新規/編集テストファイルは `*.spec.tsx` のみ（`*.test.tsx` 禁止）。
- 日本語ラベルは実装文字列と 1 文字一致（`#` + 表示名、`<表示名> タグ絞り込みを解除`、`検索: ` / `区画: ` / `種別: ` の ASCII コロン + 半角スペース）。

## 5. 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
```

全 GREEN（fail path 含む）+ branch カバレッジ充足を確認して Phase 7 へ。
