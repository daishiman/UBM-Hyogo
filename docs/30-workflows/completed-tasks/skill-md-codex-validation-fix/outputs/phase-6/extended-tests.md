# Phase 6 / Extended Tests

## 拡充内容

Phase 4 の 24 ケースに加え、境界値・退避動作・YAML parser・生成統合の検証を `codex_validation.test.js` に内包する設計とした。Anchors / Trigger 件数上限定数 (TC-CDX-C08) は本フェーズで分離テスト化。

## 追加ケース (Phase 6 で確認)

| ID | 検証内容 | 結果 |
|----|---------|------|
| TC-CDX-A05 | description 1024 字 ちょうど → ok=true | PASS |
| TC-CDX-B04 | plain scalar 抽出 | PASS |
| TC-CDX-B05 | literal block 改行込み抽出 | PASS |
| TC-CDX-C08 | MAX_DESC_LENGTH=1024 / MAX_ANCHORS=5 / MAX_TRIGGER_KEYWORDS=15 | PASS |

## 既知の未実装範囲

Anchors/Trigger keywords が上限を超えた場合の自動退避 (`references/anchors.md` / `references/triggers.md` 出力) は `generate_skill_md.js` の `writeOverflowReferences` 経由で動作するが、E2E テスト（実生成 → ファイル検証）は本タスクのスコープ外として後続タスクへ送る。

## カバレッジ観点

- **R-01〜R-07**: 7/7 ルール網羅
- **解析パス**: missing / sequence / plain / double-quoted / literal block 全 5 種
- **エスケープ**: 改行 / Tab / 連続空白 / `"` / `\\` 5 種
- **境界値**: 1024 / 1025 字を測定
- **件数定数**: 3 種定数
- **既存実 SKILL.md**: 3 種 (Lane A 連携)

合計 28 ケースで Phase 6 拡充スコープを充足する。
