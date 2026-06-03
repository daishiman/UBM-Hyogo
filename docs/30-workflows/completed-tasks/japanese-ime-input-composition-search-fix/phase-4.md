# Phase 4: テスト作成（TDD Red フェーズ）

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- 前 Phase: 3 / 次 Phase: 5
- 作成日: 2026-06-02

## 目的

AC-1〜AC-7 を検証する failing test（Red）を設計する。テスト操作対象が外部 prop か内部 state かを明示する（[VSCPKR-03]）。

## 実行タスク

1. 変更対象テストファイルと種別を確定。
2. テストケース一覧と AC マッピングを作成。
3. jsdom / @testing-library での IME composition イベント発火方法を固定。
4. 期待結果（Red）と実行コマンドを記述。

## 4.1 変更対象テストファイル一覧と種別（CONST_005）

| パス | 種別 | 対象 |
| --- | --- | --- |
| `apps/web/src/hooks/__tests__/useImeSafeInput.spec.tsx` | 新規 | フックの純ロジック（composition / debounce / commitNow / 外部同期） |
| `apps/web/src/components/ui/__tests__/Search.spec.tsx` | 新規 | Search の IME-safe 挙動・×即 commit |
| `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx` | 新規/編集 | q チップ非表示・他チップ維持 |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 編集 | 配線後の確定値のみ commit される回帰 |
| `apps/web/src/components/ui/__tests__/Input.spec.tsx` | 新規/編集 | imeSafe opt-in と既存挙動の後方互換 |

## 4.2 テスト基盤の事実（取り違え防止）

- ランナー: `vitest`（ルート `vitest.config.ts`、jsdom 環境）。実行は**リポジトリルートから**
  `pnpm exec vitest run --root=. --config=vitest.config.ts <paths>`。
- render: `@testing-library/react`。IME は `fireEvent.compositionStart(el)` / `fireEvent.compositionEnd(el, { target: { value } })`
  と `fireEvent.change(el, { target: { value } })` で発火。
- debounce: `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(ms)`。timer callback の state 更新は
  `act(async () => { await vi.advanceTimersByTimeAsync(250); })` でラップする（act 外 flush 回避）。
- `apps/web/src` は `no-restricted-globals`。テスト側も `globalThis` 経由を尊重。

## 4.3 テストケース一覧と AC マッピング

### `useImeSafeInput.spec.tsx`

| TC | 内容 | AC |
| --- | --- | --- |
| TC-H1 | compositionstart → change（未確定）中は `onCommit` が呼ばれない | AC-1/AC-2 |
| TC-H2 | compositionend 後 debounce 経過で確定文字列 1 回 commit される | AC-2 |
| TC-H3 | 非 IME（英数字）change は debounce 後に commit される（後方互換） | AC-6 |
| TC-H4 | debounce 中の連続 change は最後の値で 1 回だけ commit（タイマー clear） | AC-2 |
| TC-H5 | `commitNow("")` で draft 即クリア + 即時 commit（debounce 待ちなし） | AC-4 |
| TC-H6 | 外部 `value` 変化は非 composition 時のみ draft へ同期。composition 中は同期しない | AC-1 |
| TC-H7 | unmount 時に保留タイマーが clear され commit が発火しない | AC-2 |

### `Search.spec.tsx`

| TC | 内容 | AC |
| --- | --- | --- |
| TC-S1 | 日本語 composition 中は `onChange`(prop) 未発火、compositionend + debounce 後に確定値で発火 | AC-1/AC-2 |
| TC-S2 | ×ボタンは draft 非空時のみ表示。クリックで `onChange("")` 即時発火 | AC-3/AC-4 |
| TC-S3 | 英数字入力は debounce 後に `onChange` 発火（回帰なし） | AC-6 |

### `SelectedFiltersBar.client.spec.tsx`

| TC | 内容 | AC |
| --- | --- | --- |
| TC-B1 | `search.q` が非空でもキーワードチップ（`検索: …`）が描画されない | AC-3 |
| TC-B2 | zone / status / tag チップは従来どおり描画され、`q` のみのとき bar は非表示（null） | AC-3 |

### `MemberFilters.client.spec.tsx`

| TC | 内容 | AC |
| --- | --- | --- |
| TC-M1 | 日本語 composition 中は `router.replace` が呼ばれず、確定 + debounce 後に 1 回だけ `?q=確定値` で呼ばれる | AC-1/AC-2 |
| TC-M2 | 「入力すると即反映されます」ヒントが維持される | AC-2 |

### `Input.spec.tsx`

| TC | 内容 | AC |
| --- | --- | --- |
| TC-I1 | `imeSafe` 未指定時は従来どおり（onChange 即時・ref forward） | AC-6 |
| TC-I2 | `imeSafe` + `onValueChange` 時は composition + debounce で `onValueChange` が確定値で発火 | AC-5 |

## 4.4 テストコード骨子（実装者向けスケッチ）

```tsx
// useImeSafeInput.spec.tsx — TC-H1/H2
it("does not commit during composition, commits confirmed value after debounce", async () => {
  const onCommit = vi.fn();
  const { result } = renderHook(() => useImeSafeInput({ value: "", onCommit, debounceMs: 250 }));
  act(() => result.current.inputProps.onCompositionStart());
  act(() => result.current.inputProps.onChange({ target: { value: "てす" } }));
  expect(onCommit).not.toHaveBeenCalled();           // 未確定中は commit しない
  act(() => result.current.inputProps.onCompositionEnd({ currentTarget: { value: "テスト" } }));
  await act(async () => { await vi.advanceTimersByTimeAsync(250); });
  expect(onCommit).toHaveBeenCalledExactlyOnceWith("テスト");
});
```

```tsx
// Search.spec.tsx — TC-S1（@testing-library/react）
const onChange = vi.fn();
render(<Search value="" onChange={onChange} placeholder="検索" />);
const input = screen.getByRole("searchbox");
fireEvent.compositionStart(input);
fireEvent.change(input, { target: { value: "てすと" } });
expect(onChange).not.toHaveBeenCalled();
fireEvent.compositionEnd(input, { target: { value: "テスト" } });
await act(async () => { await vi.advanceTimersByTimeAsync(250); });
expect(onChange).toHaveBeenCalledExactlyOnceWith("テスト");
```

## 4.5 入出力・副作用

- 入力: composition / change / click イベント、外部 `value` prop 変化、fake timer 進行。
- 出力: `onCommit` / `onChange` / `onValueChange` の呼び出し回数・引数、draft 表示値、×ボタン有無。
- 副作用: debounce タイマー（fake timers で制御）。

## 4.6 ローカル実行コマンド（CONST_005）

```bash
# 対象 spec を個別実行（ルートから）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/hooks/__tests__/useImeSafeInput.spec.tsx \
  apps/web/src/components/ui/__tests__/Search.spec.tsx \
  apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/ui/__tests__/Input.spec.tsx
```

## 4.7 期待される結果

- 実装前（Red）: フック / 改修が未着手のため import 解決失敗または assertion 失敗で **FAIL**。
- 実装後（Green）: 全 TC PASS（Phase 5/6 で確認）。

## 参照資料

- `phase-2.md`（設計）/ `outputs/phase-1/requirements.md`（AC）

## 成果物

- `phase-4.md`（テスト仕様）

## 統合テスト連携

TC ↔ AC マッピングを Phase 7 のカバレッジ確認・Phase 10 の最終レビューで再利用する。

## 完了条件

- [x] 変更対象テストファイルと種別を確定（CONST_005）
- [x] 全 AC を TC に 1:1 で写像
- [x] IME composition / debounce のテスト発火手段を固定
- [x] ローカル実行コマンドを明記
