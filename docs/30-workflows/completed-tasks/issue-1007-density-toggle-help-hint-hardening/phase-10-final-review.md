# Phase 10: 最終レビュー

`[実装区分: 実装仕様書]`

## 10.1 受入条件の最終判定マトリクス

| AC | 検証手段 | 判定基準 |
|----|----------|----------|
| AC-1 | TC-1/TC-3/TC-11 | 複数配置で id unique |
| AC-2 | TC-2 | aria-describedby 参照切れゼロ |
| AC-3 | TC-4 | Escape close + focus 戻し |
| AC-4 | TC-5/TC-6 | click-outside close（内側は閉じない） |
| AC-5 | TC-7 | native toggle 維持 |
| AC-6 | TC-8/TC-9 | Icon 描画 + aria-label 維持 |
| AC-7 | 既存 4 test + TC-14 | 回帰なし |
| AC-8 | Q3/Q6 | token gate PASS |
| AC-9 | TC-10/TC-12 + Phase 7 | listener leak なし |

## 10.2 blocker / MINOR 判定

- blocker: なし（全 AC が focused test で固定可能）。
- MINOR 候補: なし（M1/M2 は Phase 4 で吸収済）。

## 10.3 Gate-B 前提

- Phase 11 で `/members` を実描画し、HelpHint open/closed と icon 表示の screenshot を取得 → Gate-B evidence。

## 完了条件
- 全 AC が PASS 見込みで blocker ゼロ、Phase 11 へ進める判定。
