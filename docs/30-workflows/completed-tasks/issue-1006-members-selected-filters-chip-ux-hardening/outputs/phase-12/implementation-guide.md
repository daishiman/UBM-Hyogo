# Phase 12: 実装ガイド

Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001

> 本ワークフローは `workflow_state=implemented_local_runtime_pending`。本ガイドは実装済みローカル差分の設計・検証ポイントを記述する。commit / push / PR のみ user-gated。

---

## Part 1: 中学生にもわかる説明

`/members`（会員一覧）には、いま絞り込んでいる条件を小さな「札（ふだ）」として並べる場所があります。今回はこの札の使い勝手を 3 つよくします。

### 1. タグの札に「わかりやすい名前」を付ける

いまは、タグの札に内部の記号（例: `#a1b2`）がそのまま出ていて、見ても何のタグか分かりません。これは、図書館の本に「整理番号」だけ貼ってあって「本のタイトル」が書いていないのと同じです。今回は、整理番号の代わりに **人が読んでわかる名前**（例: `#自然体験`）を札に書くようにします。もし名前が見つからないタグ（名前リストに載っていないタグ）が来たら、エラーにはせず、これまで通り記号を出します（読めないより、何か出ているほうが安全だからです）。

### 2. 札を消したら、自動で次のボタンに「指が移る」

キーボードだけで操作する人は、札を 1 つ消すたびに「いま自分がどこを触っているか」が分からなくなってしまいます。これは、エレベーターのボタンを押した瞬間にボタンが消えて、次にどこを押せばいいか分からなくなるようなものです。今回は、札を消したら **自動的に隣の札へ指（カーソル）が移る** ようにします。隣に札がなければ前の札へ、札が全部なくなったら検索の入力欄へ移ります。こうすると、手を止めずに続けて操作できます。

### 3. スマホで札が「重ならないように縦に並べる」

スマホは画面が狭いので、札がたくさんあると横にあふれてボタンと重なってしまいます。机が小さいときに書類を横に広げると落ちるので、縦に積むのと同じ考え方です。今回は、画面の幅が狭い（640 ピクセル以下）ときだけ、札を **縦に並べて** 「クリア」ボタンを右下に置き、重ならないようにします。

> なぜ必要か → これまで「札は出るが意味が伝わらない・キーボードで操作が途切れる・スマホで崩れる」状態でした。意味のある名前・途切れない操作・崩れない表示にすることで、誰にとっても使いやすくします。

---

## Part 2: 技術者向け詳細

### 2.1 変更対象ファイル

| ファイル | 変更 |
| --- | --- |
| `apps/web/src/components/public/SelectedFiltersBar.client.tsx` | props 拡張（`tagLabels` / `onEmpty`）、`resolveTag`、focus 管理 hooks |
| `apps/web/src/components/public/MemberFilters.client.tsx` | `tagLabels` 導出と prop 配信、`onEmpty` で検索入力 focus |
| `apps/web/src/styles/legacy-public.css` | mobile breakpoint(<=640px) ブロック追加 |
| `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx` | chip label / focus 遷移 / sort 非 chip 化の回帰追加 |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | `tagLabels` 導出 / `onEmpty` → 検索入力 focus の回帰追加 |

### 2.2 props 型（identifier は逐語固定。drift 禁止）

```ts
interface SelectedFiltersBarProps {
  // 既存 props は維持
  tagLabels?: Readonly<Record<string, string>>;
  onEmpty?: () => void;
}
```

- `tagLabels` は **optional**。未指定でも既存挙動（code fallback）で動作する後方互換を維持する。
- `onEmpty` は **optional**。bar が最後の chip 削除で unmount するときの fallback focus を親へ委譲する。

### 2.3 tag 解決（純粋関数・防御的返却）

```ts
const resolveTag = (code: string): string =>
  Object.hasOwn(tagLabels, code) ? tagLabels[code] : code;
// 表示ラベル
const label = `#${resolveTag(tag)}`;
// aria 用 remove ラベル
const removeLabel = `${resolveTag(tag)} タグ絞り込みを解除`;
```

- 未登録 code は `code` を返す。`toString` / `constructor` など prototype property 名も own property 以外は fallback し、**throw しない**（AC-2）。
- `#` 接頭辞は表示ラベルにのみ付与し、`resolveTag` 自体は接頭辞を含まない。

### 2.4 focus 管理 hooks 構造

```ts
const chipRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
const pendingFocusRef = useRef<string | null>(null); // 削除後に focus すべき chip key

useEffect(() => {
  if (pendingFocusRef.current == null) return;
  const next = chipRefs.current.get(pendingFocusRef.current);
  next?.focus();
  pendingFocusRef.current = null;
}, [/* chips 依存配列（描画されている chip key 群） */]);
```

- 削除ハンドラは「**次の chip → 無ければ前の chip → 0 件なら `onEmpty()`**」の順で focus 先を決定し、再レンダー後に `useEffect` で `.focus()` を適用する。
- chip が 0 件になる削除では bar 自体が unmount するため、`onEmpty()` を呼び出し focus 責務を親 `MemberFilters` へ委譲する（intra-bar focus は bar 所有、unmount 後 fallback は親所有という state ownership 分離）。

### 2.5 MemberFilters 側の導出と配信

```ts
const tagLabels = useMemo(
  () => Object.fromEntries(topTags.map((t) => [t.code, t.label])),
  [topTags],
);
// ...
<SelectedFiltersBar
  /* 既存 props */
  tagLabels={tagLabels}
  onEmpty={() => document.getElementById("member-search-input")?.focus()}
/>
```

- `topTags` の型は `TagPickerOption = { code: string; label: string; count: number }`。
- `onEmpty` は検索入力（`member-search-input`）へ focus を戻す。

### 2.6 mobile CSS ブロック（HEX 禁止・`var(--ubm-...)` のみ）

```css
@media (max-width: 640px) {
  [data-component="selected-filters-bar"] {
    flex-direction: column;
    align-items: stretch;
    gap: var(--ubm-space-2);
  }
  [data-component="selected-filters-bar"] [data-role="clear-all"] {
    align-self: flex-end;
  }
}
```

- breakpoint は **640px**（設定値）。selector は `[data-component="selected-filters-bar"]` 配下に閉じ、他画面へ波及させない。
- 色・余白は `var(--ubm-...)` トークン経由のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（AC-7 / `verify-design-tokens`）。

### 2.7 エッジケース

| ケース | 挙動 |
| --- | --- |
| 未登録 tag code | `resolveTag` が code を返し `#${code}` 表示。throw しない（AC-2） |
| 最後の chip 削除 | bar が unmount → `onEmpty()` → 検索入力 focus（AC-3） |
| `tagLabels` 未指定 | 全 tag が code fallback で描画（後方互換） |
| `sort` 変更 | chip を生成しない（AC-5 回帰固定） |

### 2.8 設定値

| 項目 | 値 |
| --- | --- |
| mobile breakpoint | `640px` |
| gap トークン | `var(--ubm-space-2)` |

---

## 視覚証跡

本タスクは **VISUAL**。Phase 11 で取得する screenshot の canonical 名と保存先は以下。

| canonical 名 | 保存先 | 内容 |
| --- | --- | --- |
| `selected-filters-bar-desktop-labels.png` | `outputs/phase-11/screenshots/` | desktop で tag chip が表示名描画 |
| `selected-filters-bar-mobile-stacked.png` | `outputs/phase-11/screenshots/` | <=640px で縦積み |
| `selected-filters-bar-focus-after-remove.png` | `outputs/phase-11/screenshots/` | chip 削除後 focus 遷移 |

> 現ローカルでは実装・focused vitest・component-harness screenshot 3 枚・CSS sanity まで確認済み。staging または auth 設定済みローカルで data-backed visual verification を行う場合は、同じ canonical 名で再取得する。
