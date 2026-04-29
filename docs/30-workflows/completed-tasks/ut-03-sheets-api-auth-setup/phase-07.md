# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | completed（実装・仕様書フェーズ完了。workflow root は `completed`） |

## 目的

Phase 1 で確定した AC-1〜AC-10 と、Phase 2-6 の各成果物・テスト・runbook ステップとの対応を網羅した検証可能なマトリクスを作成する。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-07/ac-matrix.md | AC × 検証手段の二次元マトリクス |

## 完了条件

- [ ] AC-1〜AC-10 すべてに「検証手段」「検証 evidence のパス」「検証実施 Phase」が紐付く
- [ ] テスト未カバー AC（docs only）が明示的に分類される
- [ ] AC 削除・改変が Phase 1 と矛盾しない
