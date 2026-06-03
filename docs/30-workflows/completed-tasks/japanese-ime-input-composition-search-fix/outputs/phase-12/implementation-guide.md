# 実装ガイド: 日本語 IME 入力（変換）対応の検索修正

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- workflow: `docs/30-workflows/japanese-ime-input-composition-search-fix`
- workflow_state: `implemented_local_evidence_captured`（本ガイドは実装済みコードと同一サイクルで同期した正本）
- 作成日: 2026-06-02

---

## Part 1: 中学生にもわかる説明

### 何が困っていたの？

会員一覧ページには「キーワード検索」の入力欄があります。ここに日本語を打つと、文字がぐちゃぐちゃに
なってしまいました。たとえば「テスト」と入力したいのに、画面には「ｔえｓうｔお」のような、変換途中の
壊れた文字が残ってしまうのです。これでは検索が使えません。

### なぜそんなことが起きるの？（理由を先に）

日本語をパソコンで打つときは、いきなり漢字やカタカナにはなりません。まず「tesuto」のようにローマ字を
打って、変換キーを押して、最後に「テスト」と**確定**します。この「打っている途中（＝変換中）」の状態を、
コンピューターの世界では「変換セッション（composition）」と呼びます。

問題の検索欄は、**1文字打つたびに**「いま入力された内容で検索をやり直そう」として、ページの一部を
作り直していました。ところが、変換の途中でページを作り直すと、日本語の変換が**強制的に途中で止められて
しまう**のです。これは、たとえるなら「あなたが文章を書いている途中の紙を、隣の人が何度も横から
引き抜いて新しい紙に差し替える」ようなものです。書き終わる前に紙を変えられたら、文章は完成しませんよね。

### どう直すの？

考え方はとてもシンプルです。

1. **打っている途中は、見た目だけ更新して、検索はまだやらない。** 紙を引き抜かずに、書き終わるまで待ちます。
2. **変換が確定したら、少しだけ待ってから（およそ4分の1秒）検索する。** すぐに何度も検索すると重いので、
   入力が落ち着いてからまとめて1回だけ検索します。この「少し待つ」仕組みを debounce（デバウンス）と呼びます。
3. **×（消す）ボタンは1つだけにする。** これまで入力欄の中と、その下の「検索: … ×」という札（チップ）の
   2か所に×がありました。同じものが2つあると迷うので、入力欄の中の×だけを残します。
4. **×を押したときは、待たずにすぐ消す。** 消す操作だけは「4分の1秒待つ」をスキップして、即座にきれいにします。

### 例え話でまとめると

「日本語入力の変換中に、勝手に確定ボタンが押されてしまう」状態でした。今回の修正は、
「変換が終わるまで黙って待ち、終わったらまとめて検索する」という、ごく当たり前の順番に直すものです。

### 他の場所でも使えるように

この「変換中は待つ」仕組みは、検索欄だけでなく、ほかの日本語入力欄でも使いたくなります。
そこで、この仕組みを**部品（共有フック）として1つにまとめ**、必要な場所が呼び出すだけで使えるようにします。
1か所を直せば全部直る、という形にしておくのが狙いです。

---

## Part 2: 技術者向け詳細

### なぜ共有フックが必要か（理由先行）

根本原因（RC-1）は、controlled な `Search` が IME composition 中も `onChange` を発火させ、
`MemberFilters.client.tsx` の `update()` → `router.replace()` → Server Component 再取得 →
`value` 再設定が走り、composition を中断する点にある。修正の本質は **「composition 中は外部 commit を
抑止し、外部 value 同期も止める」** こと。この責務は複数の入力箇所（公開 `Search`・汎用 `Input`）で
共通であり、ロジックの重複と片側だけ修正される実装不整合（admin 側 `MembersFilters` は `qLocal`+`onBlur`/
`onKeyDown(Enter)` で実質 IME-safe）を避けるため、共有フック `useImeSafeInput` に集約する（AC-5）。

### 公開インターフェース（phase-2 設計から引用）

```ts
// apps/web/src/hooks/useImeSafeInput.ts
export interface UseImeSafeInputOptions {
  /** 外部の確定値（canonical source）。URL や親 state 由来。 */
  value: string;
  /** IME 確定 + debounce 経過後に確定値を通知する。 */
  onCommit: (value: string) => void;
  /** debounce 時間（ms）。既定 250。0 で即時 commit。 */
  debounceMs?: number;
}

export interface ImeSafeInputBinding {
  /** input の value に渡す表示用 draft。 */
  value: string;
  /** input へ展開する props（value/onChange/onCompositionStart/onCompositionEnd）。 */
  inputProps: {
    value: string;
    onChange: (e: { target: { value: string } }) => void;
    onCompositionStart: () => void;
    onCompositionEnd: (e: { currentTarget: { value: string } }) => void;
  };
  /** draft を即時に value へ設定し、即 commit する（×クリア用。debounce をスキップ）。 */
  commitNow: (value: string) => void;
}

export function useImeSafeInput(options: UseImeSafeInputOptions): ImeSafeInputBinding;
```

### 内部状態（phase-2 設計から引用）

| 要素 | 型 | 役割 |
| --- | --- | --- |
| `draft` | `useState<string>` | 入力欄の表示値。初期値 = `value` |
| `isComposingRef` | `useRef<boolean>` | IME 変換中フラグ（再描画を起こさないため ref） |
| `timerRef` | `useRef<number \| null>` | debounce タイマー id（`globalThis.setTimeout`） |

### イベント挙動

- `onChange(e)`: 常に `setDraft((e.currentTarget ?? e.target).value)`。`isComposingRef.current === false`
  のときのみ `scheduleCommit(v)`（既存タイマー clear → `globalThis.setTimeout(() => onCommit(v), debounceMs)`）。
  composition 中は commit しない（未確定文字列を外部へ流さない = AC-1/AC-2）。
- `onCompositionStart()`: `isComposingRef.current = true`、保留中の debounce タイマーを clear。
- `onCompositionEnd(e)`: `isComposingRef.current = false`、`setDraft((e.currentTarget ?? e.target).value)`、
  `scheduleCommit(v)`。確定文字列のみ debounce 後に commit される。
- 外部 `value` 同期（`useEffect([value])`）: `isComposingRef.current === false` かつ `value !== draft` のとき
  `setDraft(value)`。**composition 中は同期しない**（RC-1 の本質的修正）。
- `commitNow(v)`: 既存タイマー clear → `setDraft(v)` → `onCommit(v)` を同期実行（×クリアの即時反映 = AC-4）。
- クリーンアップ: unmount 時に `timerRef` を clear（`useEffect` の return）。

### 使用例（Search 改修・phase-2 設計から引用）

```tsx
"use client";
import { useImeSafeInput } from "@/hooks/useImeSafeInput";

export function Search({ value, onChange, placeholder, id, name,
  "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, debounceMs }: SearchProps) {
  const { value: draft, inputProps, commitNow } = useImeSafeInput({ value, onCommit: onChange, debounceMs });
  return (
    <div>
      <input type="search" id={id} name={name} placeholder={placeholder}
        aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy} {...inputProps} />
      {draft && (
        <button type="button" aria-label="クリア" onClick={() => commitNow("")}>×</button>
      )}
    </div>
  );
}
```

### 使用例（Input opt-in・横展開基盤）

```tsx
// imeSafe===true かつ onValueChange 指定時のみ useImeSafeInput 経路を使う。
// 未指定時は既存の素の input をそのまま描画（既存利用箇所に影響なし = AC-6）。
<Input imeSafe value={q} onValueChange={setQ} debounceMs={250} />
```

### エラーハンドリング / 境界

- `imeSafe === true` だが `onValueChange` 未指定の場合は IME 経路を発火させず、既存の input 挙動へ
  フォールバックする（破壊しない）。`value` は controlled 利用時のみ意味を持つ。
- `apps/web/src` は `no-restricted-globals` 制約のため、タイマーは `window.setTimeout` ではなく
  `globalThis.setTimeout` / `globalThis.clearTimeout` を使用する（lint 非抵触）。
- D1 / apps/api / Google Form schema は一切変更しない（AC-7）。OKLch トークン正本を維持し HEX 直書き禁止。

### エッジケース

| ケース | 挙動 |
| --- | --- |
| Chrome（compositionend より前に input 発火）/ Safari（後に発火）の順序差 | `isComposingRef` フラグで input 経路の commit を抑止し、`onCompositionEnd` 経路で確定するため順序差を吸収する |
| イベントの `currentTarget` 有無のブラウザ差 | `(e.currentTarget ?? e.target).value` で安全に値を取得する |
| debounce 中の連続入力 | schedule 前に既存タイマーを clear するため、最後の値で 1 回だけ commit（TC-H4） |
| ×クリアと debounce の競合 | `commitNow("")` がタイマーを clear してから同期 commit するため、後から旧 draft が commit されない |
| unmount 時の保留タイマー | `useEffect` cleanup で clear し、commit が発火しない（TC-H7） |

### 設定項目 / 定数一覧

| 設定 | 既定値 | 意味 |
| --- | --- | --- |
| `debounceMs`（`UseImeSafeInputOptions`） | `250` | IME 確定後、外部 commit までの待ち時間（ms）。`0` で即時 commit |
| `SearchProps.debounceMs`（optional） | `250` | `Search` から `useImeSafeInput` へ透過する debounce 値 |
| `Input` の `imeSafe`（optional） | `false` | true かつ `onValueChange` 指定時のみ IME-safe 経路を使う |
| `Input` の `onValueChange`（optional） | - | `imeSafe` 経路の確定値 commit handler。未指定時は既存 `onChange` 経路を維持 |
| `Input` の `debounceMs`（optional） | `250` | `imeSafe` 経路で `useImeSafeInput` へ渡す debounce 値 |

### ロック / タイマー解放経路

| 経路 | タイマー処理 |
| --- | --- |
| 通常 commit | schedule 前に既存 clear → 新規 set |
| compositionstart | clear のみ（未確定を確定させない） |
| commitNow（×クリア） | clear → 即時 onCommit |
| unmount | useEffect cleanup で clear |

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/hooks/__tests__/useImeSafeInput.spec.tsx \
  apps/web/src/components/ui/__tests__/Search.spec.tsx \
  apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/ui/__tests__/Input.spec.tsx
```

> debounce テストは `vi.useFakeTimers()` + `act(async () => { await vi.advanceTimersByTimeAsync(250); })`
> でラップする（timer callback の state 更新を act 外で flush しないため）。

## 視覚証跡

本タスクは visualEvidence=`VISUAL`。Phase 11 では local `/members` の Playwright screenshot を 2 枚取得済み:

- `outputs/phase-11/screenshots/member-search-local-overview.png`
- `outputs/phase-11/screenshots/member-search-local-keyword-filter.png`

local screenshot では baseline filter UI が runtime error なしで表示されること、`q=テスト` + zone filter 状態で
入力欄内の × が表示され、サマリーバーに `検索: テスト` chip が出ないことを確認した。日本語 IME の
composition 中/確定操作そのものは **staging 認証 + 実機 IME 操作（OS の日本語入力）を要するため user-gated**。
主な挙動証跡は jsdom render unit（`Search.spec.tsx` / `SelectedFiltersBar.client.spec.tsx` /
`MemberFilters.client.spec.tsx`）と純粋ロジック unit（`useImeSafeInput.spec.tsx`）。`fireEvent.compositionStart` /
`compositionEnd` で composition を擬似発火し、未確定文字列が外部 commit へ漏れないこと（AC-1）・確定 +
debounce で 1 回だけ反映されること（AC-2）・×が 1 箇所で即時クリアされること（AC-3/AC-4）を検証する。
