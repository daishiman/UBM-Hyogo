# Phase 5: 実装手順（実装計画）

> 本プロンプト（タスク仕様書作成）ではコードを実装しない。本 Phase は後続の実装プロンプト（03.実装.md）が
> そのまま着手できる**実装手順**を記述する（CONST_006）。

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- 前 Phase: 4 / 次 Phase: 6
- 作成日: 2026-06-02

## 目的

Phase 2 設計を最小差分で実装するための、ファイル単位の新規作成 / 修正手順を確定する（[Feedback RT-03]）。

## 実行タスク

1. 新規作成 / 修正ファイル一覧を確定する（5.1）。
2. 共有フック `useImeSafeInput.ts` の実装要点を確定する（5.2）。
3. `Search.tsx` / `SelectedFiltersBar.client.tsx` / `MemberFilters.client.tsx` / `Input.tsx` の改修手順を確定する（5.3〜5.6）。
4. 入出力・副作用・ローカル検証コマンド・DoD を確定する（5.7〜5.9）。

## 5.1 新規作成 / 修正ファイル一覧（CONST_005）

| # | パス | 種別 | 概要 |
| --- | --- | --- | --- |
| 1 | `apps/web/src/hooks/useImeSafeInput.ts` | 新規 | IME-safe + debounce-commit フック |
| 2 | `apps/web/src/components/ui/Search.tsx` | 修正 | フック利用へ改修・`"use client"` 付与・×即 commit |
| 3 | `apps/web/src/components/public/SelectedFiltersBar.client.tsx` | 修正 | `q` チップ生成ブロック削除 |
| 4 | `apps/web/src/components/public/MemberFilters.client.tsx` | 修正（最小/確認） | 配線確認。原則無改修（必要なら `debounceMs` 受け渡しのみ） |
| 5 | `apps/web/src/components/ui/Input.tsx` | 修正 | `imeSafe` / `onValueChange` / `debounceMs` opt-in 追加 |

> テストファイル（Phase 4 の 5 ファイル）も同 wave で実装する。

## 5.2 タスク 1: `useImeSafeInput.ts`（新規）

実装要点（Phase 2 のシグネチャに準拠）:

1. `"use client"` 不要（フックは consumer の client 境界で動く）。ただし React `useState`/`useRef`/`useEffect`/`useCallback` を使用。
2. `globalThis.setTimeout` / `globalThis.clearTimeout` を使用（`no-restricted-globals` 準拠）。タイマー id は `ReturnType<typeof globalThis.setTimeout>` を `number` として ref 保持。
3. `scheduleCommit(v)`: `clearTimer()` → `timerRef.current = globalThis.setTimeout(() => onCommit(v), debounceMs ?? 250)`。`debounceMs === 0` のときは即時 `onCommit(v)`。
4. `onChange`: `setDraft(v)`。`!isComposingRef.current` のとき `scheduleCommit(v)`。
5. `onCompositionStart`: `isComposingRef.current = true`、`clearTimer()`。
6. `onCompositionEnd`: `isComposingRef.current = false`、`setDraft(v)`、`scheduleCommit(v)`。
7. `commitNow(v)`: `clearTimer()`、`setDraft(v)`、`onCommit(v)`。
8. `useEffect([value])`: `!isComposingRef.current && value !== draft` なら `setDraft(value)`。
9. `useEffect(() => () => clearTimer(), [])`: unmount cleanup。
10. `inputProps` / `commitNow` は `useCallback` で安定参照にする（不要再描画抑制）。

> エッジケース: compositionend の `e` から値を取得する際、テストは `target.value`、実 DOM は `currentTarget.value` を
> 渡しうる。`(e.currentTarget ?? e.target).value` で吸収する実装にする。

## 5.3 タスク 2: `Search.tsx`（修正）

1. 先頭に `"use client";` を追加。
2. `import { useImeSafeInput } from "@/hooks/useImeSafeInput";`
3. `SearchProps` に `debounceMs?: number;` を追加（optional）。
4. 本体で `const { value: draft, inputProps, commitNow } = useImeSafeInput({ value, onCommit: onChange, debounceMs });`
5. `<input type="search" ... {...inputProps} />`（既存の `id`/`name`/`placeholder`/`aria-*` は残す。`value`/`onChange` は `inputProps` 側を使う）。
6. ×ボタン表示条件を `value` → `draft` に変更。`onClick={() => commitNow("")}`。

## 5.4 タスク 3: `SelectedFiltersBar.client.tsx`（修正）

1. `if (search.q) { chips.push({ key: "q", label: \`検索: ${search.q}\`, ... }) }` ブロック（L47-54 付近）を削除。
2. 他チップ（zone/status/tag）と `chipKeySignature` / `removeWithFocus` / `chips.length === 0 → null` は変更しない。
3. `search.q` が props 型に残っていても未使用になる場合は lint（unused）を確認し、型は維持（呼び出し元互換のため）。

## 5.5 タスク 4: `MemberFilters.client.tsx`（確認・最小）

1. `<Search value={initial.q} onChange={(v) => update({ q: v })} />` は無改修で動作（IME-safe は Search 内部）。
2. 「入力すると即反映されます」ヒント文言は維持。
3. 必要に応じて `debounceMs` を明示渡し（既定 250 で十分なら省略）。

## 5.6 タスク 5: `Input.tsx`（修正）

1. `InputProps` に `imeSafe?: boolean` / `onValueChange?: (value: string) => void` / `debounceMs?: number` を追加。
2. `imeSafe && onValueChange` のときのみ `useImeSafeInput({ value: String(value ?? ""), onCommit: onValueChange, debounceMs })` を使い、
   `inputProps` を input へ展開（`ref` は forward 維持）。
3. それ以外は既存の素の `<input>` 描画を維持（デフォルト経路不変 = AC-6）。
4. `imeSafe` 経路では `value` が controlled 前提であることを型/実装で担保。

## 5.7 入出力・副作用

- 入力: ユーザーのキーボード / IME / クリック操作、URL `?q=`。
- 出力: 確定キーワードの URL 反映、検索結果再取得、× による即時クリア。
- 副作用: debounce タイマー（ブラウザ）、`router.replace`（既存）。

## 5.8 ローカル検証コマンド（CONST_005）

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

## 5.9 DoD（Definition of Done）

- [ ] 上記 5 実装ファイル + 5 テストファイルが作成/修正されている
- [ ] `pnpm typecheck` / `pnpm lint` が 0 エラー
- [ ] 対象 spec が全 PASS（Phase 4 の全 TC）
- [ ] 日本語 IME 入力で確定文字列が正しく検索へ反映される（手動確認は Phase 11）
- [ ] ×アイコンがキーワードに対し 1 箇所のみ
- [ ] HEX 直書きなし（OKLch 維持）/ D1・API・Form schema 不変

## 参照資料

- `phase-2.md`（設計）/ `phase-4.md`（テスト）

## 成果物

- `phase-5.md`（実装手順）

## 統合テスト連携

実装後に Phase 4 の全 TC を Green にし、Phase 6 で fail-path / 回帰 guard を拡充する。

## 完了条件

- [x] 新規/修正ファイル一覧と各タスク手順を確定（CONST_005）
- [x] ローカル検証コマンドと DoD を明記
- [x] 後方互換・既存 API 不変の制約を明記
