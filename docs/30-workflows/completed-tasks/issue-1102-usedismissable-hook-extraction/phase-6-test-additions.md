---
phase: 6
name: テスト拡充
task_id: issue-1102-usedismissable-hook-extraction
status: completed
---

# Phase 6: テスト拡充（fail path / 回帰 guard）

Phase 4 の基本ケース（HT-1〜HT-7）に加え、再構成・複数インスタンス併存・防御的ガードの
fail path を `useDismissable.spec.tsx` に追加する。対象は引き続き hook 単体。

## 6.1 追加テストケース一覧

| ID | 目的 | セットアップ | 操作 | 期待値 |
| --- | --- | --- | --- | --- |
| HT-8 | enabled を false→true に切替で listener が再構成され有効化される | `renderHook` を `{ enabled }` 可変 props で初期 `enabled:false` | `rerender({ enabled: true })` 後に Escape を発火 | `onClose` が `toHaveBeenCalledWith("escape")`（true 化後は反応する） |
| HT-9 | enabled を true→false に切替で listener が解除される | 初期 `enabled:true` | `rerender({ enabled: false })` 後に Escape / 外側 pointerdown を発火 | `onClose` 未呼出（再構成で解除済み） |
| HT-10 | onClose 参照変化で最新コールバックが呼ばれる（re-register） | `onClose` を `vi.fn()` A で初期 render | `rerender` で `onClose` を `vi.fn()` B に差し替え後、Escape を発火 | B が呼ばれ A は呼ばれない（deps 変化で再登録） |
| HT-11 | 複数 hook インスタンス併存で互いに干渉しない | 2 つの ref（refA / refB）＋ 2 つの onClose（A / B）で hook を 2 回呼ぶテストコンポーネント | refA の外側 pointerdown を発火 | onClose A が `"pointerdown-outside"` で呼ばれる。onClose B も「refB 外側」として 1 回呼ばれうるが、A/B が取り違えられない（各 onClose に対応 ref の contains 判定が独立して効く）ことを ref 配置で検証 |
| HT-12 | pointerdown の target が null のときガード（throw なし・onClose 未呼出は contains 判定不能のため呼ぶ/呼ばないを明示） | `useDismissable(ref, onClose)` | `target` を持たない pointerdown を `document` に発火（`fireEvent.pointerDown(document)` 等で target=document） | throw しない。target が `el.contains` の外なら `"pointerdown-outside"` が呼ばれる（実装の `instanceof Node` ガードで非 Node は外側扱い→呼ぶ。null/非 Node でも throw しないことが主眼） |
| HT-13 | ref.current が null のとき throw しない | ref に要素を割り当てない状態で hook 呼出 | 外側相当の pointerdown を発火 | `el` が null のため early return（`if (!el) return;`）で `onClose` 未呼出・throw なし |

> HT-11 の干渉検証ポイント: SidebarUserMenu（shell）と DensityToggle（public）が同一ページに
> 同時 mount されるケースの構造的等価物。各 hook の listener は独立した `el.contains` 判定を持つため、
> 一方の外側クリックが他方の close を誤って抑止/誘発しないことを保証する。

## 6.2 防御的ガードの根拠

- **target 非 Node / null**: `target instanceof Node` が false のとき `el.contains(target)` を呼ばず
  「内側ではない」＝外側扱いで `onClose("pointerdown-outside")` を呼ぶ。これにより非 Node target で
  `contains` が throw する事故を防ぐ（HT-12）。
- **ref.current === null**: listener 内 `if (!el) return;` で早期離脱（HT-13）。mount 直後や
  条件付きレンダーで ref が未割当のタイミングでも安全。
- **enabled / onClose 切替**: deps `[ref, onClose, enabled]` により React が cleanup→再登録を行う。
  HT-8/9/10 はこの再構成が listener 登録状態へ正しく反映されることを保証する。

## 6.3 2 consumer 既存回帰テスト＝挙動不変の証跡（再強調）

`useDismissable.spec.tsx` の拡充とは独立に、下記 2 spec を**無改修**のまま全パスさせることが
リファクタの「挙動不変」を機械的に立証する中核証跡である（AC-6 / AC-7）。

| spec | 役割 |
| --- | --- |
| `SidebarUserMenu.spec.tsx` | 外側/内側 pointerdown・Escape の close 挙動が hook 化後も完全一致 |
| `DensityToggle.client.spec.tsx` | TC-4（Escape→summary focus 復帰）など 6 ケースが hook 化後も完全一致。特に reason 分岐による focus 復帰の保持を担保 |

これら 2 spec はテスト追加・編集を行わない。差分ゼロで GREEN を維持することが本タスクの合格基準。
