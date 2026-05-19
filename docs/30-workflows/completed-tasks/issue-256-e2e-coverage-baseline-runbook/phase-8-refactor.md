# Phase 8 — リファクタリング

`[実装区分: 実装仕様書]`

## 1. 想定リファクタ

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `extractExcludePatterns` | inline regex | module-private function (export 不要) | 単一責任 |
| markdown 生成 | `main` 内 inline | `toMarkdown` 関数に分離 (Phase 5 仕様で既に分離済) | テスタビリティ |

## 2. 既存重複の確認

| 確認 | 結果 |
|------|------|
| `scripts/` 配下に類似の coverage 関連 script ありか | `coverage-guard.sh` (bash, 別目的: PR の coverage 低下 gate)。重複なし |
| `verify-*` 系 workflow と命名整合 | `verify-design-tokens`, `verify-indexes` と同パターンで OK |

## 3. DoD

- [ ] 重複コードなし
- [ ] 関数 1 つにつき 1 責務
- [ ] 既存 `coverage-guard.sh` との混乱を避けるため新 script の README コメントに「目的: exclude pattern の比率計測 (gate 機構は別)」を 1 行で明記
