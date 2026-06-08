---
phase: 4
name: テスト作成
task_id: issue-1102-usedismissable-hook-extraction
status: completed
---

# Phase 4: テスト作成（RED 設計）

`useDismissable` の挙動を先にテストで定義する（RED）。新規 spec は
`apps/web/src/hooks/__tests__/useDismissable.spec.tsx` のみ。2 consumer の既存 spec は
**無改修**で回帰確認に使う（このフェーズでは一切変更しない・§4.4 参照）。

## 4.1 テスト対象とスコープ

| 項目 | 内容 |
| --- | --- |
| 対象 | `apps/web/src/hooks/useDismissable.ts`（hook 単体） |
| 新規 spec | `apps/web/src/hooks/__tests__/useDismissable.spec.tsx` |
| 非対象（回帰のみ） | `SidebarUserMenu.spec.tsx` / `DensityToggle.client.spec.tsx`（既存・無改修） |
| 命名規約 | `*.spec.tsx`（不変条件 #8。`*.test.*` 禁止） |

## 4.2 テストの書き方指針

- **render 方式**: React Testing Library。`renderHook` で hook を呼び、`ref` には
  テスト用 DOM 要素（`document.body` に append した `<div>` 等）を割り当てる方式を基本とする。
  ref 内側/外側の判定を確実に検証するため、外側要素も別途 `document.body` 直下に置く。
  - 代替: 小さなテスト用コンポーネント（`<div ref={ref}>inside</div>` ＋兄弟に outside 要素）を
    `render` し、hook を内部で呼ぶ方式でも可。reason 検証が主眼のため `renderHook` を推奨。
- **イベント発火**: `fireEvent.pointerDown(target)` / `fireEvent.keyDown(document, { key })`。
  document レベルの listener を検証するため、keydown は `document`（または `document.body`）に対して発火する。
- **onClose**: `vi.fn()`。
- **reason 引数の検証**: `expect(onClose).toHaveBeenCalledWith("escape")` /
  `expect(onClose).toHaveBeenCalledWith("pointerdown-outside")` で第 1 引数まで厳密検証する。
- **未呼出の検証**: `expect(onClose).not.toHaveBeenCalled()`。
- **cleanup 検証**: `renderHook` の `unmount()` 後にイベントを発火し、`onClose` が呼ばれないことで
  removeEventListener を間接検証する。
- **SSR 検証**: `browserDocument` を `vi.mock`（または spy）で `undefined` を返すよう差し替え、
  hook 呼び出しが throw せず listener も張らないことを検証する。

## 4.3 RED テストケース一覧（AC-1〜AC-5 網羅）

| ID | 目的（AC） | セットアップ | 操作 | 期待値 |
| --- | --- | --- | --- | --- |
| HT-1 | 外側 pointerdown で onClose 呼出＋reason 検証（AC-1） | ref に inside 要素を割当、別に outside 要素を body 直下に配置、`onClose=vi.fn()`、`useDismissable(ref, onClose)` | `fireEvent.pointerDown(outside要素)` | `onClose` が 1 回呼ばれ、`toHaveBeenCalledWith("pointerdown-outside")` |
| HT-2 | 内側 pointerdown では呼ばない（AC-2） | HT-1 と同じ | `fireEvent.pointerDown(inside要素)`（ref 配下の子要素） | `onClose` 未呼出（`not.toHaveBeenCalled()`） |
| HT-3 | Escape で onClose 呼出＋reason 検証（AC-3） | HT-1 と同じ | `fireEvent.keyDown(document, { key: "Escape" })` | `onClose` が `toHaveBeenCalledWith("escape")` |
| HT-4 | 他キー（Tab）では呼ばない（AC-3） | HT-1 と同じ | `fireEvent.keyDown(document, { key: "Tab" })` | `onClose` 未呼出 |
| HT-5 | enabled:false で listener を張らない（AC-4） | `useDismissable(ref, onClose, { enabled: false })` | outside pointerdown と Escape を両方発火 | `onClose` 未呼出（両イベントとも） |
| HT-6 | unmount で listener 解除（AC-4） | `useDismissable(ref, onClose)` を `renderHook` | `unmount()` 後に outside pointerdown と Escape を発火 | `onClose` 未呼出（解除済み） |
| HT-7 | SSR 想定（browserDocument undefined）→ no-op・throw なし（AC-5） | `browserDocument` を `undefined` 返却に差し替え | hook を render（マウント）し、イベントを発火 | render が throw しない／`onClose` 未呼出（listener 未登録） |

> 補足: HT-1/HT-2 の inside/outside 判定は `el.contains(target)` に依存する。outside 要素は
> ref 要素の DOM サブツリー外（body 直下の兄弟）に置くこと。inside 操作は ref 要素自身または
> その子孫に対して `pointerDown` を発火する。

## 4.4 2 consumer の既存 spec（無改修・回帰確認用）

このフェーズでは下記 2 spec を**変更しない**。Phase 5 で consumer を hook へ置換した後、
無改修のまま全パスすることが「挙動不変」の最強証跡となる（AC-6 / AC-7）。

| spec | 保護すべき既存ケース |
| --- | --- |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | 「外側 pointerdown で popover を閉じる」「内側 pointerdown では閉じない」「Escape で閉じる」（いずれも `details.open=true` を手動設定後に fireEvent） |
| `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | TC-4（Escape→close＋summary へ focus 復帰）／ TC-5（外側 pointerdown→close）／ TC-6（内側→close しない）／ TC-7（再 open 可）／ TC-10（unmount 後 listener 残らない）／ TC-13（Tab→閉じない） |

## 4.5 props vs state 整合性（[VSCPKR-03]）

`useDismissable` は internal state を持たない（I-2）。テスト操作対象は外部から渡す `ref`（RefObject）と
`document` イベントのみであり、戻り値も `void`。したがって props/state を混同するリスクは構造的に存在しない。
テストは「ref と document イベントへの反応」だけを検証すればよく、state 遷移の検証は不要。

## 4.6 private method の扱い（[Feedback P0-09-U1]）

本タスクの公開境界は `useDismissable` hook（公開 export）のみ。`onPointerDown` / `onKeyDown` は
hook 内部のクロージャであり private method 相当だが、document イベント発火（`fireEvent`）を通じて
公開挙動として観測可能なため、private method を直接テストする必要はない（非該当）。

## 4.7 RED 確認

Phase 5 で `useDismissable.ts` を実装する前に HT-1〜HT-7 を作成した RED 時点では、hook 本体が存在しないため
import エラーまたは全ケース fail（RED）となることを確認する。実装後に GREEN へ遷移させる。
