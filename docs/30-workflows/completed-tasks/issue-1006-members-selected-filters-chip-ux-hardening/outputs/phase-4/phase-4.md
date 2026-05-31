# Phase 4: テスト作成（TDD RED）

- Task ID: issue-1006-members-selected-filters-chip-ux-hardening
- 区分: テスト作成（実装前。新規 assert は RED で fail することを期待値とする）

---

## 1. テスト戦略

### 1.1 internal state か external prop かの切り分け [VSCPKR-03]

| 検証対象 | 由来 | テストでの扱い |
|----------|------|----------------|
| chip の表示・順序・ラベル | `search`（external prop）＋ `tagLabels`（external prop） | prop を渡して描画結果を assert（純粋関数として検証） |
| chip 削除後の focus 遷移 | `chipRefs` / `pendingFocusRef`（internal ref）＋ `useEffect` 復帰 | DOM 操作（クリック）後の `document.activeElement` を assert。internal の ref そのものは触らない |
| 最後の chip 削除で外部要素へ focus | `onEmpty`（external callback） | `onEmpty` の呼び出しと、MemberFilters 側では検索入力への focus を assert |

chips は `search`（=URL 正本）由来なので external。focus 制御は component 内部 ref と effect で完結するため internal。テストは「prop 入力 → 観測可能な DOM 出力（描画・activeElement・callback）」のみを assert し、ref の中身や private 変数には踏み込まない。

### 1.2 ライブラリ・方針

- `@testing-library/react`（`render` / `screen` / `cleanup`）＋ **`@testing-library/user-event`**。
- focus 遷移の検証は `fireEvent.click` ではなく `userEvent.click` を使う（user-event はクリックに伴う focus/blur を実ブラウザに近い順序で発火するため、削除後 `useEffect` で復帰した `activeElement` を決定論的に観測できる）。`const user = userEvent.setup();` を各テスト先頭で生成。
- `vi.stubGlobal("window", ...)` は **禁止**（jsdom の window を差し替えると focus / activeElement 検証が壊れる）。
- 既存 `SelectedFiltersBar.client.spec.tsx` は `fireEvent` ベースだが、focus を検証する新規ケースのみ `userEvent` を使う。`fireEvent` ベースの既存ケースはそのまま残す（focus を見ないケースは移行不要）。
- MemberFilters 側は既存どおり `next/navigation` を `vi.mock` で stub（`useRouter().replace` を mock）したまま追記する。
- 日本語ラベルの実文字に注意（全角コロン `：` ではなく ASCII の `: ` を使う既存実装に合わせる。tag chip は `#` + 表示名、`removeLabel` は「表示名 + 半角スペース + `タグ絞り込みを解除`」。テスト文字列は実装の文字列と 1 文字単位で一致させること）。

---

## 2. 追加・編集するテストケース

### 2.1 SelectedFiltersBar.client.spec.tsx（編集）

import 追加: `import userEvent from "@testing-library/user-event";`

| TC-ID | ケース名 | 入力 prop | 期待値 | AC |
|-------|----------|-----------|--------|----|
| SFB-T1 | tagLabels の表示名で tag chip が出る | `tag: ["ai"]`, `tagLabels: { ai: "AI活用" }` | `screen.getByRole("button", { name: "AI活用 タグ絞り込みを解除" })` が真。chip テキストに `#AI活用` を含む（`screen.getByText(/#AI活用/)`） | AC-1 |
| SFB-T2 | 未登録 code は code 自身に fallback | `tag: ["newtag"]`, `tagLabels: { ai: "AI活用" }`（newtag 未含有） | `screen.getByRole("button", { name: "newtag タグ絞り込みを解除" })` が真。`#newtag` テキストを含む | AC-2 |
| SFB-T3 | tagLabels 省略時も code 表示（後方互換） | `tag: ["ai"]`, `tagLabels` を渡さない | `screen.getByRole("button", { name: "ai タグ絞り込みを解除" })` が真。`#ai` テキスト | AC-2 |
| SFB-T4 | sort は chip 化しない（回帰） | `sort: "name"` ＋ 他 1 件 | `screen.queryByText(/名前順/)` が null。`screen.queryByText(/並び替え/)` が null | AC-5 |
| SFB-T5 | chip 削除後 focus が「次の chip」へ移る | `tag: ["a", "b"]`, `tagLabels: { a: "A", b: "B" }`。`onPatch` は `search.tag` を絞り込んだ結果で **再 render** する制御コンポーネント wrapper を用意 | 先頭 chip（A）の削除ボタンを `userEvent.click` → 再 render 後 `document.activeElement` が「B タグ絞り込みを解除」ボタン | AC-3 |
| SFB-T6 | 末尾 chip 削除で「前の chip」へ移る | 同上 wrapper、`tag: ["a", "b"]` | 末尾 chip（B）削除 → `document.activeElement` が「A タグ絞り込みを解除」ボタン | AC-3 |
| SFB-T7 | 単一 chip 削除で onEmpty が呼ばれる | `tag: ["a"]`, `tagLabels: { a: "A" }`, `onEmpty: vi.fn()`。削除後 chips=0 で bar が unmount | 削除ボタンを `userEvent.click` → `onEmpty` が 1 回呼ばれる。`onPatch` も `{ tag: [] }` 相当で呼ばれる | AC-3 |

#### SFB-T5/T6 用の制御 wrapper（テスト内ヘルパー方針）

`SelectedFiltersBar` 単体は `onPatch` を受けるだけで自分では再 render しない。focus 遷移は「削除 → search が縮む → 再 render → useEffect 復帰」の一連で起きるため、テストでは search を `useState` で保持し `onPatch` で patch を適用して再 render する小さな wrapper を spec 内に定義する:

```tsx
function Controlled({ initialTag, tagLabels, onEmpty }: {
  initialTag: string[];
  tagLabels?: Record<string, string>;
  onEmpty?: () => void;
}) {
  const [search, setSearch] = useState<MembersSearch>({
    ...baseSearch, tag: initialTag,
  });
  return (
    <SelectedFiltersBar
      search={search}
      tagLabels={tagLabels}
      onPatch={(patch) => setSearch((s) => ({ ...s, ...patch }))}
      onClearAll={() => setSearch({ ...baseSearch })}
      onEmpty={onEmpty}
    />
  );
}
```

`import { useState } from "react";` を spec に追加。これで `userEvent.click` → state 更新 → 再 render → effect で focus 復帰、という実挙動を E2E に近い形で固定できる。

### 2.2 MemberFilters.client.spec.tsx（編集）

| TC-ID | ケース名 | 入力 prop | 期待値 | AC |
|-------|----------|-----------|--------|----|
| MF-T1 | topTags の label が SelectedFiltersBar に伝播し表示名 chip になる | `initial.tag: ["ai"]`, `topTags: [{ code: "ai", label: "AI活用", count: 3 }]` | `[data-component="selected-filters-bar"]` 内に `#AI活用` テキストの chip。`screen.getByRole("button", { name: "AI活用 タグ絞り込みを解除" })` が真 | AC-1 |
| MF-T2 | 最後の選択 chip 削除で検索入力に focus が戻る | `initial.tag: ["ai"]`, `topTags: [{ code: "ai", label: "AI活用", count: 3 }]` | selected-filters-bar の tag 削除ボタンを `userEvent.click` → `router.replace` で URL は変わるが、`onEmpty` 経由で検索入力（`screen.getByLabelText("キーワード検索")` 相当の input）に focus（`document.activeElement`） | AC-3 |

> MF-T2 補足: MemberFilters は `initial` が URL 正本で再 render は router 経由のため、jsdom 単体では削除後に chips=0 へ自然遷移しない。テストでは「削除クリック直後に `onEmpty` が発火し検索入力 input が `document.activeElement` になる」ことを assert すれば足りる（chips の再導出は Phase 6 の Controlled 相当で別途担保）。`onEmpty` 配線が querySelector / ref どちらでも、観測対象は「クリック後に検索 input が activeElement」で固定する。

---

## 3. 既存テストの回帰更新（明示）

`SelectedFiltersBar.client.spec.tsx` の既存ケース「q / zone / status / tag を chip 化し、sort は chip 化しない」は現状 `tag: ["ai"]` に対し `name: "ai タグ絞り込みを解除"` を assert している。`tagLabels` を渡していないため **fallback で `ai` のまま**になり、この期待値は変更不要（後方互換が効く）。明示的に 2 系統を整理する:

- **tagLabels を渡す場合**: 期待値は表示名（例 `AI活用`）に更新。→ 新規 SFB-T1 で担保。
- **tagLabels を渡さない場合**: 期待値は code（`ai`）のまま維持。→ 既存ケース／SFB-T3 で担保。

`MemberFilters.client.spec.tsx` の既存ケース（line 76 付近）「`foo タグ絞り込みを解除`」は `topTags` を渡さない入力なので fallback で `foo` のまま。**期待値変更不要**。`topTags` を渡す MF-T1 のみ表示名期待に切り替える。

---

## 4. TDD RED の期待と現在状態

実装前に上記 spec を実行すると、以下が fail する想定だった:

- SFB-T1 / SFB-T2 / MF-T1: `SelectedFiltersBar` が `tagLabels` を受けず `#${tag}` を出す状態では、表示名 chip が見つからず fail。
- SFB-T5 / SFB-T6 / SFB-T7 / MF-T2: focus 管理（`chipRefs` / `pendingFocusRef` / `useEffect`）と `onEmpty` が無い状態では、`document.activeElement` / `onEmpty` 呼び出し assert が fail。
- 既存ケース・SFB-T3・SFB-T4 は後方互換で PASS のまま（回帰検知用の緑帯）。

現在は `tagLabels` / `onEmpty` / focus 管理 / mobile CSS を実装済みで、focused vitest 2 spec は 17/17 pass。

---

## 5. 検証コマンド（Phase 4 完了時 = RED 確認）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx
```

新規 assert が fail（RED）し、後方互換ケースが PASS することを確認して Phase 5 へ。
