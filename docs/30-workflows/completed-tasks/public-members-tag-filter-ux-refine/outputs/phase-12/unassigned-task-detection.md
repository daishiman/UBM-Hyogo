# Unassigned Task Detection

## Result

Detected: **0 new unassigned tasks**（新規起票 0 件・先送り 0 件・CONST_007 1 サイクル完結）。

## Rationale

本タスク（タグ chip 横並び化 + フィルタ領域グルーピング + 選択強調是正 + member-grid 過密緩和）は CSS + 最小 markup のみで 1 サイクル内に完結する。RCA で確定したスコープ（`_shared-context.md` §1）はすべて本 workflow の Phase 4 以降の実装仕様書で消化される。スコープ分割・後続独立サイクルを要する作業はない。

## Out-of-scope baseline（YAGNI・非起票・将来候補）

`_shared-context.md` §6 のスコープ外 3 項目を、起票せず baseline として理由付き記録する。いずれも本サイクルでは対処不要。

| # | 項目 | 非起票理由（YAGNI） | 扱い |
|---|------|--------------------|------|
| B-1 | タグの category 別グルーピング表示 | 現 `topTags` は `{code,label,count}` の flat 配列。category 軸での束ね表示には API/schema 拡張が必要であり、INV-4（API/schema/Form 非変更）に違反する。横並び化（flex-wrap）で現状の発見性は十分。 | baseline・非起票 |
| B-2 | タグ検索ボックス（タグ多数時の絞り込み入力） | 現 `topTags` 件数（MVP 規模で十数件想定・選択上限 hint あり）では検索入力は過剰。flex-wrap の自然折返しで一覧性が確保され、追加 UI を増やす価値が現時点でない。 | baseline・非起票 |
| B-3 | メンバーカードのデザイン全面刷新 | ユーザー依頼の「整える」範囲を超える。本サイクルは余白/階層調整に限定（MemberCard/MemberGrid は CSS gap 調整で吸収・無変更）。全面刷新は別タスクの判断事項。 | スコープ外明記・非起票 |

## TODO / skip scan

- ソース内 TODO / FIXME / skip による暗黙の未タスクなし（本サイクルはローカル実装済みのため新規 TODO 発生なし）。

## Conclusion

新規起票 0 件。スコープ外 3 項目は YAGNI baseline として記録のみ（先送りではなく「現時点で価値が立たないため非起票」）。
