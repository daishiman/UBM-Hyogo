# Phase 6 成果物: テスト拡充方針（確定記録）

> 状態: completed。Phase 4 正常系 Red → Phase 5 Green 後の異常系・境界値拡充方針。

## 1. 正常系 / 異常系の責務分担

| 区分 | 担当 Phase | 内容 |
| --- | --- | --- |
| 正常系（描画 / 写像 / 文言） | Phase 4（TC-XX） | V01/V02/D01 の diff 描画・日本語ラベル写像・`destructiveMessage` 具体文言 |
| 異常系・境界値（欠損 / 未知値 / fail-soft / null 分岐） | Phase 6（TC-E-XX） | publishState 未知値・desiredState 欠落/型不一致・対象外 note_type・delete の visibility 非露出・fallback 文言・a11y 維持 |

## 2. fail-soft 契約の境界保証

diff helper は外部入力（projection の 3 値）に依存するが、`formatPublishStateLabel` / `buildPublishStateDiff` はいずれも **throw しない**契約。境界テストで以下を保証する:

- 未知 publishState → 「不明」（throw なし）。
- `desiredState` 欠落・型不一致 → after「不明」（throw なし）。
- 対象外 note_type / `item=null` → `null`（diff 行非描画）。
- `destructiveMessage` は diff 構築不能時に既存汎用文言へ fallback。

## 3. 回帰 guard 位置づけ

| guard | 種別 | 担保 AC | 連携 Phase |
| --- | --- | --- | --- |
| `verify-design-tokens` | CI gate（HEX 0 件） | AC-5 | Phase 9 |
| HEX grep（対象 3 ファイル） | ローカル gate | AC-5 | Phase 5 / Phase 9 |
| `git diff -- apps/api packages/shared` 空 | ローカル gate | AC-7 | Phase 5 / Phase 9 |
| VISUAL staging capture（V01/V02/D01） | user-gated（Gate-C） | AC-1/AC-2（視覚確認） | Phase 11 |

## 4. 境界値網羅

| 軸 | 値 | 網羅 TC-E |
| --- | --- | --- |
| publishState | 列挙内（public/member_only/hidden）/ `unknown` / 空 / 列挙外 | TC-E-01, TC-E-02 |
| desiredState | 正常 string / キー不在 / 非 object payload / 非 string | TC-E-03, TC-E-04 |
| note_type | visibility / delete / 対象外 / null item | TC-E-05, TC-E-06 |
| 文言 fallback | diff 構築不能の visibility | TC-E-07 |
| a11y | diff 行描画時の矢印 aria-hidden | TC-E-08 |

## 5. 完了状態

異常系・境界値の TC-E-XX を edge-cases.md に採番。全 TC-E が AC-3/AC-4/AC-5/AC-9/AC-10 にマップされる。Phase 7（カバレッジ）へ正常 + 異常の全 TC を引き渡す。
