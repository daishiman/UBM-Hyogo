# Phase 6: テスト拡充（fail-path / 回帰 guard）

> 本プロンプト（タスク仕様書作成）ではコードを実装しない。本 Phase は後続実装プロンプトが着手できる
> **テスト拡充仕様**を記述する（CONST_006）。

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- 前 Phase: 5 / 次 Phase: 7
- 作成日: 2026-06-02

## 目的

Phase 4 の正常系 TC（TC-H1〜H7 / TC-S1〜S3 / TC-B1,B2 / TC-M1,M2 / TC-I1,I2）に対し、
fail-path・境界条件・回帰 guard を追加し、IME-safe 入力ロジック共有化（AC-1〜AC-7）の劣化を機械的に検知できる状態を確定する。
特に「debounce 連続入力の最終値のみ commit」「unmount 時タイマー clear」「ブラウザ間の compositionend 発火順序差吸収」
「英数字後方互換」「×クリア後の再入力」「SelectedFiltersBar の zone/status/tag チップ非回帰」
「Input imeSafe 未指定時の既存挙動非回帰」を回帰 guard として固定する。

## 実行タスク

1. 追加テストケース（fail-path / 回帰 guard）を既存 5 spec ファイルへ追記する形で定義する。
2. 各追加 TC の対象が外部 prop か内部 state かを明示する（[VSCPKR-03]）。
3. fake timers / `act(async)` ラップの統一規約を再掲し、flush 漏れによる偽陰性を防ぐ。
4. apps/web カバレッジ AC（>=80%）と `bash scripts/coverage-guard.sh` exit 0 を完了条件へ組み込む。

## 6.1 追加テストケース一覧（既存 spec へ追記）

### `useImeSafeInput.spec.tsx`（フック純ロジック・内部 state 観測）

| TC | 内容 | 種別 | AC |
| --- | --- | --- | --- |
| TC-H8 | debounce 中に複数回 `onChange` 連続発火 → 最終値で `onCommit` が **1 回だけ**呼ばれる（中間値で発火しない） | 回帰 guard | AC-2 |
| TC-H9 | 保留タイマーがある状態で unmount → `onCommit` が一切呼ばれない（clearTimer cleanup 確認） | fail-path | AC-2 |
| TC-H10 | compositionend の値取得が `e.target.value`（テスト風）でも `e.currentTarget.value`（実 DOM 風）でも同値で commit される | 境界 | AC-1/AC-2 |
| TC-H11 | compositionstart → compositionend → さらに非 IME change の順でも、確定値が欠落せず最終値が commit される（Chrome/Safari 発火順序差吸収） | 境界 | AC-1/AC-2 |
| TC-H12 | `debounceMs: 0` 指定時は change 直後に同期 commit される（タイマー待ちゼロ） | 境界 | AC-2 |
| TC-H13 | `commitNow("")` 直後に再入力（change）すると、新しい draft が保持され再び debounce commit される（×クリア後の再入力） | 回帰 guard | AC-4 |

### `Search.spec.tsx`（外部 prop `onChange` 観測）

| TC | 内容 | 種別 | AC |
| --- | --- | --- | --- |
| TC-S4 | ×クリック（`commitNow("")`）後に再入力すると、確定後に新しい値で `onChange` が発火する | 回帰 guard | AC-4 |
| TC-S5 | 英数字を連続入力しても composition 扱いされず、最終値のみ debounce 後 `onChange` 発火（後方互換回帰） | 回帰 guard | AC-6 |
| TC-S6 | compositionend で受け取った確定文字列が「ｔえｓうｔお」のような混在崩れにならず、確定済み文字列のみが `onChange` へ渡る | fail-path | AC-1 |

### `SelectedFiltersBar.client.spec.tsx`（描画 DOM 観測）

| TC | 内容 | 種別 | AC |
| --- | --- | --- | --- |
| TC-B3 | `search.q` が非空でも「検索: … ×」チップが描画されない（×重複解消の回帰 guard） | 回帰 guard | AC-3 |
| TC-B4 | zone / status / tag の各チップは従来どおり描画され `×` で除去できる（非回帰） | 回帰 guard | AC-3 |
| TC-B5 | 全フィルタ未設定（q のみ設定）でチップ 0 件のとき `null` を返す（空表示の非回帰） | 境界 | AC-3 |

### `MemberFilters.client.spec.tsx`（配線・外部挙動観測）

| TC | 内容 | 種別 | AC |
| --- | --- | --- | --- |
| TC-M3 | IME 変換中は `update()`（→ `router.replace`）が呼ばれず、compositionend + debounce 後に確定値で 1 回だけ呼ばれる | 回帰 guard | AC-1/AC-2 |

### `Input.spec.tsx`（外部 prop / DOM 観測）

| TC | 内容 | 種別 | AC |
| --- | --- | --- | --- |
| TC-I3 | `imeSafe` 未指定（デフォルト）時は従来どおり素の controlled `<input>` として `onChange` が即発火する（既存挙動非回帰） | 回帰 guard | AC-6 |
| TC-I4 | `imeSafe` 指定かつ `onValueChange` 未指定時は IME-safe 経路に入らず描画が壊れない（不完全 opt-in の安全側挙動） | fail-path | AC-5/AC-6 |

## 6.2 テスト実装規約（偽陰性防止・Phase 4 から継承）

- 実行は**リポジトリルートから**: `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts <paths>`。
- `vi.useFakeTimers()` を使い、timer callback による state 更新は必ず
  `await act(async () => { await vi.advanceTimersByTimeAsync(250); })` でラップする（act 外 flush による警告/偽陰性回避）。
- unmount テスト（TC-H9）は `const { unmount } = render(...)` → 保留タイマー作成 → `unmount()` → `advanceTimersByTimeAsync` 後に `onCommit` 未呼出を assert。
- IME 発火: `fireEvent.compositionStart(el)` / `fireEvent.compositionEnd(el, { target: { value } })` / `fireEvent.change(el, { target: { value } })`。
- `apps/web/src` は `no-restricted-globals` のため、テスト内タイマー参照も `globalThis` 経由を尊重する。
- `onCommit` / `onChange` / `update` は `vi.fn()` で受け、呼出回数・最終引数の両方を assert する。

## 6.3 実行コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/hooks/__tests__/useImeSafeInput.spec.tsx \
  apps/web/src/components/ui/__tests__/Search.spec.tsx \
  apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/ui/__tests__/Input.spec.tsx
```

## 6.4 カバレッジ AC

- apps/web の Statements / Branches / Functions / Lines が **>= 80%**（プロジェクト coverage しきい値）。
- `bash scripts/coverage-guard.sh` が **exit 0**（しきい値割れ / 退行なし）。
- 変更ファイルの分岐網羅は Phase 7 で 100% 目標として確認する。

## 参照資料

- `phase-2.md`（設計）/ `phase-4.md`（正常系 TC 定義）/ `phase-5.md`（実装手順）
- [Feedback VSCPKR-03]（prop か state かの明示）
- [Feedback BEFORE-QUIT-002]（coverage 対象限定は Phase 7）

## 成果物

- `phase-6.md`（fail-path / 回帰 guard テスト拡充仕様）

## 統合テスト連携

- Phase 4 正常系 TC（Green）を前提に、本 Phase の追加 TC で fail-path / 回帰を固定する。
- Phase 7 で本 Phase の追加分を含めた変更ファイル限定カバレッジを確認する。
- Phase 9 品質保証で `coverage-guard.sh` exit 0 を最終判定する。

## 完了条件

- [ ] `useImeSafeInput.spec.tsx` に TC-H8〜H13 を追加定義した
- [ ] `Search.spec.tsx` に TC-S4〜S6 を追加定義した
- [ ] `SelectedFiltersBar.client.spec.tsx` に TC-B3〜B5 を追加定義した
- [ ] `MemberFilters.client.spec.tsx` に TC-M3 を追加定義した
- [ ] `Input.spec.tsx` に TC-I3,I4 を追加定義した
- [ ] 各追加 TC で対象が外部 prop か内部 state かを明示した（[VSCPKR-03]）
- [ ] fake timers + `act(async)` ラップ規約を明記した
- [ ] apps/web カバレッジ >=80%（Statements/Branches/Functions/Lines）を完了条件に含めた
- [ ] `bash scripts/coverage-guard.sh` exit 0 を完了条件に含めた
