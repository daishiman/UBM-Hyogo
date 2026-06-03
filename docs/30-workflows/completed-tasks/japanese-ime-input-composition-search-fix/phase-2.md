# Phase 2: 設計

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- 前 Phase: 1（要件定義） / 次 Phase: 3（設計レビュー）
- 作成日: 2026-06-02

## 目的

IME-safe + debounce-commit を実現する共有フックと、それを利用する `Search` / `Input` の API、
×重複解消の責務配置を確定し、後続 Phase が迷わず実装できる設計を固定する。

## 実行タスク

1. 共有フック `useImeSafeInput` のシグネチャ・内部状態・イベント挙動を確定。
2. `Search` の改修方針（後方互換 props 維持・×即 commit）を確定。
3. `SelectedFiltersBar` の `q` チップ除去方針を確定。
4. `MemberFilters` 配線の確認点（変更最小）を確定。
5. `Input` の opt-in（`imeSafe`）方針と後方互換を確定。
6. 因果ループ・状態所有権・debounce タイマー解放経路を明示。

## 設計詳細

### 1. 共有フック `useImeSafeInput`（新規 `apps/web/src/hooks/useImeSafeInput.ts`）

責務: controlled input を「表示は即時・確定（外部 commit）は IME 確定 + debounce 後」にする。状態所有権は
**フック内に draft（表示値）と isComposing（変換中フラグ）を閉じ込め**、確定値（canonical）は呼び出し元 / URL が所有する。

#### シグネチャ

```ts
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

#### 内部状態と挙動

| 要素 | 型 | 役割 |
| --- | --- | --- |
| `draft` | `useState<string>` | 入力欄の表示値。初期値 = `value` |
| `isComposingRef` | `useRef<boolean>` | IME 変換中フラグ（再描画を起こさないため ref） |
| `timerRef` | `useRef<number \| null>` | debounce タイマー id（`globalThis.setTimeout`） |

挙動:

- `onChange(e)`: `setDraft(e.target.value)` を常に実行。`isComposingRef.current === false` のときのみ
  `scheduleCommit(e.target.value)`（既存タイマー clear → `globalThis.setTimeout(() => onCommit(v), debounceMs)`）。
  composition 中は commit しない（未確定文字列を外部へ流さない = AC-1/AC-2）。
- `onCompositionStart()`: `isComposingRef.current = true`、既存 debounce タイマーを clear。
- `onCompositionEnd(e)`: `isComposingRef.current = false`、`setDraft(e.currentTarget.value)`、
  `scheduleCommit(e.currentTarget.value)`。これにより確定文字列のみ debounce 後に commit される。
  ブラウザ差（Chrome は compositionend 前に input、Safari は後）に対し、`isComposing` フラグで input 経路の
  commit を抑止し、end 経路で確定するため順序差を吸収する。
- 外部 `value` 同期（`useEffect([value])`）: `isComposingRef.current === false` かつ `value !== draft` のとき
  `setDraft(value)`。**composition 中は同期しない**（外部再描画で draft を上書きして IME を壊さないため = RC-1 の本質的修正）。
- `commitNow(v)`: 既存タイマー clear → `setDraft(v)` → `onCommit(v)` を同期実行（×クリアの即時反映 = AC-4）。
- クリーンアップ: unmount 時に `timerRef` を clear（`useEffect` の return）。

#### 入出力・副作用

- 入力: `value`（外部確定値）、`onCommit`、`debounceMs`。
- 出力: `value`（draft）、`inputProps`、`commitNow`。
- 副作用: `globalThis.setTimeout` / `globalThis.clearTimeout` による debounce タイマー（ブラウザのみ）。

#### ロック/タイマー解放経路テーブル（[Feedback STATE-DETAIL-01]）

| 経路 | タイマー処理 |
| --- | --- |
| 通常 commit | schedule 前に既存 clear → 新規 set |
| compositionstart | clear のみ（未確定を確定させない） |
| commitNow（×クリア） | clear → 即時 onCommit |
| unmount | useEffect cleanup で clear |

### 2. `Search.tsx` 改修

- `"use client"` を付与（hooks 利用のため。現状 consumer 経由でも client だが明示する）。
- 公開 props（`SearchProps`）は**不変**（後方互換）。`onChange` を `useImeSafeInput.onCommit` に接続。
- `value`（外部確定値）を `useImeSafeInput({ value, onCommit: onChange })` に渡し、`binding.value` を input の表示値に。
- input へ `binding.inputProps`（onChange / onCompositionStart / onCompositionEnd）を展開。
- ×ボタン: 表示条件は `binding.value`（draft）非空。クリックで `binding.commitNow("")`（draft クリア + 即 commit）= AC-4。
- 任意で `debounceMs?: number` を `SearchProps` に追加（既定 250。後方互換のため optional）。

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

### 3. `SelectedFiltersBar.client.tsx` 改修（×重複解消 = AC-3）

- `if (search.q) { chips.push({ key: "q", ... }) }` ブロック（L47-54 付近）を**削除**する。
- zone / status / tag チップ生成・focus 移譲（`chipKeySignature` / `removeWithFocus`）はそのまま維持。
- `chips.length === 0` で `return null` する既存ガードはそのまま（q 単独時はバー非表示になる）。
- キーワード解除は検索入力欄内の×（`commitNow("")`）が唯一の導線となる。

### 4. `MemberFilters.client.tsx` 配線確認（変更最小）

- `<Search value={initial.q} onChange={(v) => update({ q: v })} />` の配線は**そのまま**で動作する
  （IME-safe 化は `Search` 内部に閉じる）。`onChange` は確定値のみ受け取るため `update`/`router.replace` は確定後 1 回。
- 「入力すると即反映されます」のヒント文言は維持（IME 確定 + debounce 後の自動反映であり「即反映」の趣旨に整合）。
- 確認点: `initial.q` が `Search` の `value`（外部同期）に渡り、composition 中に同期が走らないこと（フック側で保証）。

### 5. `Input.tsx` opt-in（横展開基盤 = AC-5・後方互換 = AC-6）

- 既存 forwardRef / uncontrolled 挙動は**デフォルト不変**。
- 追加 props（すべて optional）:
  - `imeSafe?: boolean`（既定 false）
  - `onValueChange?: (value: string) => void`（`imeSafe` 時の commit ハンドラ）
  - `debounceMs?: number`
- `imeSafe === true` かつ `onValueChange` 指定時のみ `useImeSafeInput` 経路を使う。
  `value`（controlled）必須。`imeSafe` 未指定時は既存の素の input をそのまま描画（既存利用箇所に影響なし）。
- forwardRef と hook の両立: `imeSafe` 経路でも `ref` は input にそのまま forward する。

### 因果ループ（責務境界の確認）

- バランスループ（修正後）: ユーザー入力 → draft 更新（表示即時）→ [composition 中は外部へ流さない] →
  compositionend + debounce → onCommit → URL 更新 → 親再描画 → 外部 value 変化 →
  [非 composition 時のみ draft 同期] → 安定。composition 中の `value` 再設定ループ（RC-1）が isComposing ガードで遮断される。

## 参照資料

- `outputs/phase-1/requirements.md`
- 既存 IME-safe 参考: `apps/web/src/features/admin/components/_members/MembersFilters.tsx`
- 既存プリミティブ: `apps/web/src/components/ui/Input.tsx` / `FormField.tsx`

## 成果物

- `phase-2.md`（本ファイル・設計正本）

## 統合テスト連携

本設計の `useImeSafeInput` 挙動・`Search` ×即 commit・`SelectedFiltersBar` q チップ除去は Phase 4 のテストケース
（TC-H1〜H6 / TC-S1〜S3 / TC-B1 / TC-M1 / TC-I1）へ対応する。

## 完了条件

- [x] `useImeSafeInput` のシグネチャ・状態・イベント挙動・解放経路を確定
- [x] `Search` / `SelectedFiltersBar` / `MemberFilters` / `Input` の改修方針を確定
- [x] 後方互換（AC-6）と URL 正本設計の非破壊を確認
- [x] 因果ループで RC-1 の遮断点を明示
