# task-B: BulkActionBar 大規模 tag catalog UX

issue: #1078 / 親 workflow `issue-1078-bulk-tag-picker-large-catalog-ux`
区分: 実装仕様書（CONST_005）
依存: **task-A**（`fetchAllTagMaster` / `TagMasterFullResult` / `TAG_PAGE_SIZE_MAX` を消費）
不変条件: apps/api 変更なし。色は OKLch token `var(--ubm-*)` のみ（HEX/`bg-[#xxx]`/`text-[#xxx]` 禁止・CI gate `verify-design-tokens`）。新規 primitive を生やさず `TagPill`（`_shared/TagPill.tsx`）を再利用。test は `*.spec.{ts,tsx}` のみ（#8）。`FormField` 不要（picker の検索 input は filter 用途で admin form mutation でない → 不変条件 #9 対象外。理由をコメントで明記）。

---

## 0. 現状（変更前）

- `BulkActionBar.tsx` L63-75: `fetchTagMaster()` 初回ロードで `setAvailable(r.available)`（task-A で root-cause 修正後も全件ロードへ差し替える）。
- L78-86: `available` を category grouping して L219-236 で全件描画 → tag 増加で sticky footer が縦に伸び続ける（本タスクの主対象）。
- L52: `selectedTagIds: Set<string>` は既に response page と独立に保持されている（AC-4 の基盤）。
- L213-238: 空表示 `付与可能なタグがありません`、TagPill 列描画。

---

## 1. 変更対象ファイル一覧 + 変更種別

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | 編集 | state 追加、ロードを `fetchAllTagMaster` へ、検索/折りたたみ/固定行/高さ制御 UI 追加 |

> import 追加: `fetchAllTagMaster`（および必要なら型）を `../../api/members` から。`useMemo` / `useRef` を `react` から（既に `useEffect, useMemo, useState` import 済 L4 → `useRef` 追加）。

---

## 2. 追加 state とシグネチャ

```ts
const COLLAPSE_THRESHOLD = 24; // この件数を超えたら検索 + category 折りたたみ表示へ

// 既存
const [available, setAvailable] = useState<AdminTagRef[]>([]);
const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(() => new Set());

// 追加
const [tagTotal, setTagTotal] = useState<number>(0);          // API total（truncated 判定表示用）
const [serverSearchMode, setServerSearchMode] = useState<boolean>(false); // truncated 時 true
const [query, setQuery] = useState<string>("");               // 検索語（internal state / VSCPKR-03）
const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set()); // 折りたたみ中 category 名（internal state）
const knownTagsRef = useRef<Map<string, AdminTagRef>>(new Map()); // tagId -> AdminTagRef（label 解決用キャッシュ）
const [debouncedQuery, setDebouncedQuery] = useState<string>(""); // debounce 後の検索語
```

> private/internal state（`query` / `collapsed` / `debouncedQuery` / `knownTagsRef`）は component 内部状態であり props 公開しない（VSCPKR-03）。テストは DOM 観測（input value / aria-expanded / pill 表示）経由で検証する。

---

## 3. 実装方針

### 3.1 ロード（`fetchTagMaster()` → `fetchAllTagMaster()`）

L63-75 の `useEffect` を差し替え:

```ts
useEffect(() => {
  let active = true;
  fetchAllTagMaster()
    .then((r) => {
      if (!active) return;
      setAvailable(r.available);
      setTagTotal(r.total);
      setServerSearchMode(r.truncated); // cap で打ち切った場合のみ server search 案内
      // knownTagsRef に全件を蓄積（後の固定行 label 解決用）
      for (const t of r.available) knownTagsRef.current.set(t.tagId, t);
    })
    .catch(() => {
      if (active) setAvailable([]); // 失敗時は picker を空にする（既存挙動踏襲）
    });
  return () => { active = false; };
}, []);
```

- 失敗時の `setAvailable([])` は既存挙動維持（AC: 空 catalog 表示「付与可能なタグがありません」）。

### 3.2 debounce（最小実装・250ms）

```ts
useEffect(() => {
  const id = setTimeout(() => setDebouncedQuery(query.trim()), 250);
  return () => clearTimeout(id); // cleanup で多重発火を抑止
}, [query]);
```

- MVP は client-side filter（`fetchAllTagMaster` で全件取得済）。`serverSearchMode=true`（truncated）時のみ、検索で全件に当たらない可能性がある旨を案内文で示す（実 server re-fetch は本タスク範囲外・将来拡張点としてコメント）。

### 3.3 表示制御（閾値ゲート）

- `largeCatalog = available.length > COLLAPSE_THRESHOLD || serverSearchMode`。
- `largeCatalog === false`: 現行 UI を維持（検索 input / 折りたたみ / 高さ制限を出さず、従来の全件 category 描画）。← small catalog 後方互換。
- `largeCatalog === true`: 検索 input + category 折りたたみ + `max-h-[40vh] overflow-y-auto` を適用。

### 3.4 visible / groupedTags useMemo

```ts
// filter（large catalog かつ debouncedQuery 非空のときのみ絞り込み）
const visible = useMemo(() => {
  if (!debouncedQuery) return available;
  const q = debouncedQuery.toLowerCase();
  return available.filter(
    (t) =>
      t.label.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q),
  );
}, [available, debouncedQuery]);

const groupedTags = useMemo(() => {
  const m = new Map<string, AdminTagRef[]>();
  for (const t of visible) {
    const arr = m.get(t.category) ?? [];
    arr.push(t);
    m.set(t.category, arr);
  }
  return [...m.entries()];
}, [visible]);
```

- 既存 `groupedTags`（L78-86・`available` 直読み）を上記 `visible` 経由へ差し替え。small catalog では `debouncedQuery` 空 = `visible === available` で従来と同一。

### 3.5 選択中固定行（picker リスト外・AC-4）

- `selectedTagIds` から固定 chip 行を picker リストの上（リスト外）に描画。検索や折りたたみで picker から消えても解除できるようにする。

```ts
const selectedRefs = useMemo(
  () =>
    [...selectedTagIds].map((id) => {
      const ref = knownTagsRef.current.get(id);
      // 未取得（truncated で全件に居ない等）は code/id フォールバック
      return ref ?? ({ tagId: id, code: id, label: id, category: "" } as AdminTagRef);
    }),
  [selectedTagIds],
);
```

- 描画: large catalog かつ `selectedTagIds.size > 0` のとき、`role="group" aria-label="選択中のタグ"` の行に `TagPill selected onClick={() => toggleTag(t.tagId)}` を並べる。label は `knownTagsRef` で解決、未取得は `code`（=id フォールバック）を表示。
- これにより検索結果外・別ページの選択 tag も常時解除可能。

### 3.6 高さ制御（AC-5）

- large catalog 時、picker リストのコンテナに `max-h-[40vh] overflow-y-auto` を付与（token クラスでなく Tailwind の高さユーティリティ。色 token 不変条件には抵触しない）。
- sticky bar 全体（L139-143）の構造は維持。固定 chip 行と実行ボタンはスクロール領域の外に置き、リストだけスクロールさせる。

### 3.7 category 折りたたみ（`<button aria-expanded>`）

- large catalog 時、各 category 見出しを `<button type="button" aria-expanded={!collapsed.has(category)}>` にする。
- click で `collapsed` Set にトグル追加／削除。`collapsed.has(category)` のとき、その category の TagPill 群を非表示にする。
- 折りたたみは表示のみ。`selectedTagIds` には一切影響しない（選択は固定行で維持）。

```ts
const toggleCategory = (category: string) => {
  setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    return next;
  });
};
```

### 3.8 検索 input

- large catalog 時、section 先頭に検索 input:

```tsx
{/* filter 用途の検索 input。admin form mutation でなく client filter のため
    不変条件 #9（FormField 経由）の対象外。値は API 送信せず client filter に使う。 */}
<input
  type="search"
  aria-label="タグを検索"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="タグを検索"
  className="rounded border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] px-2 py-1 text-xs text-[var(--ubm-color-text-primary)]"
/>
```

- token のみ。プレースホルダ色などの HEX 直書き禁止。

---

## 4. 既存挙動の不変（regression）

- `toggleTag`（L110-117）/ `runBulkTags`（L119-132）/ `summarize`（L31-47）/ 部分失敗集計表示（L253-283）は変更しない。
- `TagPill` の props（`selected` / `onClick` / `disabled` / `title`）は現行のまま。`title={t.code}` 維持。
- publish / hide / soft-delete ボタン群（L148-173）と `aria-pressed` 付与モードトグル（L183-210）は不変（AC-2）。
- 空 catalog 文言「付与可能なタグがありません」（L214）維持。
- `selectedIds.length === 0` で `null`（L88）維持。

---

## 5. テスト方針（task-C で詳細記述）

`BulkActionBar.spec.tsx` を編集（mock 是正）+ 新規ケース TC-BAB-CAT-*。本 task の受け入れ確認は:

- contract 修正後、`{ total, items }` mock で picker が描画される。
- COLLAPSE_THRESHOLD 超の fixture で検索 input / 折りたたみ button が出る。
- 検索で絞り込んでも選択中 chip が固定行に残る。
- 既存 TC-BAB-01..05 / TAG-01..05 が維持される。

---

## 6. ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/__tests__/BulkActionBar.spec.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# 色 token gate（HEX 直書き検出）
mise exec -- pnpm exec rg -n "bg-\[#|text-\[#|#[0-9a-fA-F]{3,6}" apps/web/src/features/admin/components/_members/BulkActionBar.tsx || echo "HEX 0"
```

---

## 7. DoD

- [ ] `fetchAllTagMaster` でロードし、`{ total, items }` 応答で picker が描画される（root-cause 解消）。
- [ ] `available.length > COLLAPSE_THRESHOLD(24)` または `serverSearchMode` で検索 input + 折りたたみ + `max-h-[40vh] overflow-y-auto` を表示。
- [ ] 小規模（閾値以下・非 truncated）では現行 UI を完全維持。
- [ ] 検索は debounce 250ms（setTimeout + cleanup）で client filter。
- [ ] 選択中 tag は picker リスト外の固定行に表示され、検索/折りたたみ/別ページに関わらず解除可能（label は knownTagsRef 解決・未取得は code/id フォールバック）。
- [ ] category 折りたたみは `<button aria-expanded>`、選択状態に影響しない。
- [ ] 検索 input は `type="search"` + `aria-label`、token のみ、不変条件 #9 対象外コメント有り。
- [ ] `aria-pressed` / keyboard / TagPill props / 部分失敗集計 / 空表示 が不変。
- [ ] color は `var(--ubm-*)` のみ（HEX 0）。apps/api 差分 0。
- [ ] `pnpm typecheck` / `pnpm lint` / 当該 spec 緑。
