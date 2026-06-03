# Phase 1: 要件定義（正本）

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- feature: `japanese-ime-input-composition-search-fix`
- 作成日: 2026-06-02
- taskType: implementation
- 実装区分: **実装仕様書（VISUAL）** / implementation_mode: `new`
- workflow_state: `spec_created`

## 目的

メンバー一覧（会員ディレクトリ `/(public)/members`）のキーワード検索で、日本語 IME 変換中の文字列が
「ｔえｓうｔお」のように崩れて確定できず、検索が機能しない不具合を解消する。あわせて ×（クリア）アイコンの
二重表示を解消し、IME-safe 入力ロジックを共有フックへ集約して横展開可能にする。

## 実行タスク

1. 現状コードの事実確認（verbatim anchor）を固定する。
2. 受け入れ条件（AC-1〜AC-7）を確定する。
3. タスク分類（UI task / VISUAL）と命名規則（camelCase 関数・kebab なし・`use*` フック・`*.spec.tsx`）を記録する。
4. スコープ（1 サイクル完結）と対象外（submit 型 textarea）の境界を固定する。
5. targeted test 対象ファイルを列挙する（全件 `pnpm test` ではなく対象 spec 指定）。

## 現状コードの事実（verbatim 確認済み）

### 検索プリミティブ `apps/web/src/components/ui/Search.tsx`（全 39 行）

```tsx
export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function Search({ value, onChange, placeholder, id, name,
  "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }: SearchProps) {
  return (
    <div>
      <input
        type="search" id={id} name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}   // ← RC-1: composition 中も発火
        placeholder={placeholder}
        aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy}
      />
      {value && (
        <button type="button" aria-label="クリア" onClick={() => onChange("")}>×</button>  // ← RC-2: ×(1)
      )}
    </div>
  );
}
```

- `onCompositionStart` / `onCompositionEnd` ハンドラ無し。debounce 無し。ローカル draft state 無し。
- `"use client"` ディレクティブ無し（現状 hooks 不使用のため）。consumer の `MemberFilters.client.tsx` が client 境界。

### 検索の配線 `apps/web/src/components/public/MemberFilters.client.tsx`

```tsx
// L143-154 付近
<FormField name="member-search" label="キーワード検索">
  <Search
    id="member-search-input" name="member-search"
    value={initial.q}
    onChange={(v) => update({ q: v })}          // ← RC-1/RC-3: 即 update → router.replace
    placeholder="名前・職業・地域で検索"
  />
</FormField>
<span data-role="live-filter-hint" id="member-search-live-hint">入力すると即反映されます</span>
```

```tsx
// L69-96 付近: update() は URLSearchParams を組み立て router.replace する（URL 正本設計）
const update = useCallback((patch: Patch) => {
  const next = new URLSearchParams(sp ? sp.toString() : "");
  // ... q が "" のとき delete、それ以外 set ...
  const qs = next.toString();
  router.replace(qs ? `/members?${qs}` : "/members");
}, [router, sp]);
```

- `value={initial.q}` は親（Server Component `page.tsx`）が URL から parse した値。`router.replace` →
  Server Component 再レンダリング → `initial.q` 変化 → `Search` の `value` 再設定で composition が中断される。

### ×重複の片割れ `apps/web/src/components/public/SelectedFiltersBar.client.tsx`

```tsx
// L43-54 付近: chips 配列に q（キーワード）チップを push（← RC-2: 除去対象）
const chips: FilterChip[] = [];
if (search.q) {
  chips.push({
    key: "q",
    label: `検索: ${search.q}`,
    removeLabel: /* ... */,
    onRemove: () => onPatch({ q: "" }),
  });
}
// zone / status / tag チップは維持
// L119-121 付近: チップの × 描画
//   {chip.label} ×
```

### 既存の良い実装（実装不整合の証左・流用参考）

`apps/web/src/features/admin/components/_members/MembersFilters.tsx:43-59`

```tsx
<input
  type="search"
  value={qLocal}
  onChange={(e) => setQLocal(e.currentTarget.value)}   // ローカル state のみ
  onBlur={() => { if (qLocal !== value.q) onChange({ q: qLocal }); }}
  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (qLocal !== value.q) onChange({ q: qLocal }); } }}
/>
```

admin 側は遅延確定で実質 IME-safe。public `Search` 経路だけが保護を欠く。本タスクは IME-safe ロジックを
**共有フックに昇格**して両者の方式を統一可能にする（admin は別関心のため本サイクルでは配線変更しない）。

## 受け入れ条件（AC）

| ID | 条件 |
| --- | --- |
| AC-1 | 「テスト」等の日本語を IME 入力すると、変換確定後に正しい確定文字列が入力欄へ反映され、未確定の中間文字列が URL / 検索へ漏れない |
| AC-2 | IME 確定（compositionend）+ debounce（既定 250ms）経過で URL（`?q=`）と検索結果が更新される。確定前は URL 更新が発火しない |
| AC-3 | ×（クリア）アイコンはキーワードに対し 1 箇所のみ（入力欄内の×を正、`SelectedFiltersBar` の `q` チップは非表示） |
| AC-4 | 入力欄の×クリックで draft と URL の `q` が即時クリアされる（debounce 待ちなし） |
| AC-5 | IME-safe ロジックが共有フック `useImeSafeInput` に集約され、`Search` がこれを利用。`Input` も opt-in（`imeSafe`）で利用可能 |
| AC-6 | 既存 `Search` / `Input` 利用箇所の公開 props（`value` / `onChange` 等）が後方互換で、非 IME / 英数字入力が回帰しない |
| AC-7 | OKLch トークン正本化を維持（HEX 直書き禁止）。既存 API のみ接続（D1 / API / Form schema 不変） |

## タスク分類・命名規則

- タスク分類: **UI task / VISUAL**（Phase 11 で screenshot を計画。ただし IME 操作 + staging 認証必須で user-gated）。
- 命名規則（既存コードベース踏襲）:
  - フック: `use` プレフィックス camelCase（`useImeSafeInput`）。配置 `apps/web/src/hooks/`（新設ディレクトリ）。
  - コンポーネント: PascalCase。spec は co-located `__tests__/*.spec.tsx`（不変条件 #8: `*.test.*` 禁止）。
  - `apps/web/src` は `no-restricted-globals` のため `setTimeout`/`clearTimeout` は `globalThis.setTimeout` 経由で参照する。

## targeted test 対象ファイル（[FB-UI-02-2]）

全件 `pnpm test` は実行せず、以下を指定実行する（ルートから `--root=. --config=vitest.config.ts`）:

- `apps/web/src/hooks/__tests__/useImeSafeInput.spec.tsx`
- `apps/web/src/components/ui/__tests__/Search.spec.tsx`
- `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx`
- `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx`
- `apps/web/src/components/ui/__tests__/Input.spec.tsx`

## 不変条件

- URL 正本設計（`MemberFilters` は URL query を正本とし React state を最小化）を壊さない。draft はコンポーネント
  ローカルの一時表示値であり、確定後に URL へ反映する（URL 正本と矛盾しない）。
- 既存 API endpoint surface のみ接続。D1 schema / Google Form schema 変更禁止。
- 不変条件 #8（`*.spec.{ts,tsx}` のみ）/ #9（admin form input は対象外・本サイクルで admin 配線変更なし）。
- OKLch トークン正本化（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止）。

## 成果物

- 本ファイル `outputs/phase-1/requirements.md`（要件正本）
- `phase-1.md`（root index 導線サマリ）

## 統合テスト連携

Phase 4 のテスト設計に AC-1〜AC-7 を 1:1 で対応付ける。Phase 11 では jsdom render unit を主証跡とし、
IME 操作の実機 screenshot は user-gated（未取得が正）として記録する。

## 完了条件

- [x] RC-1〜RC-3 を実コード anchor 付きで固定した
- [x] AC-1〜AC-7 を確定した
- [x] タスク分類（UI/VISUAL）・命名規則・targeted test 対象を記録した
- [x] スコープ（1 サイクル）と対象外（submit 型 textarea）の境界を固定した
