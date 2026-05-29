<!-- workflow: members-list-ux-clarity / task: A / phase: 10 -->

# Phase 10 — 最終レビュー (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]

## 1. 受入条件 (AC) 確認

| ID | 期待 | 確認方法 | 結果 |
| -- | ---- | -------- | ---- |
| AC-A1 | sublabel 3 個描画 | TC-A1 GREEN | (Phase 5 実装後に判定) |
| AC-A2 | aria-describedby + visually-hidden span | TC-A2 / TC-A3 GREEN | 〃 |
| AC-A3 | HelpHint `<details>` + aria-label summary | TC-A4 GREEN | 〃 |
| AC-A4 | HelpHint open 時 dt/dd 3 ペア描画 | TC-A5 / TC-A6 GREEN | 〃 |
| AC-A5 | 既存 3 ケース PASS 維持 | TC-E1〜E3 GREEN | 〃 |
| AC-A6 | 主ラベル不変 | TC-A7 GREEN | 〃 |
| AC-A7 | HEX 0 / 新 primitive 0 / `verify-design-tokens` GREEN | Phase 9 ゲート | 〃 |
| AC-A8 | mobile sublabel visually-hidden | Phase 11 手動 | 〃 |

## 2. blocker 判定

| 項目 | 判定 |
| ---- | ---- |
| 既存 spec 破壊 | NO (TC-E1〜E3 GREEN) |
| API / Schema / token 変更 | NO |
| 新 primitive 追加 | NO |
| URL query 仕様変更 | NO |
| 他 route 影響 | NO (`Segmented` optional prop は他呼び出し元無影響) |

## 3. MINOR 指摘候補 → 未タスク化判定

| 指摘 | 対応 |
| ---- | ---- |
| 複数 DensityToggle 並走時の id 重複対策 (RA-4) | 現状未発生のため**未タスク化候補** (Phase 12 で formalize 判定) |
| HelpHint の click-outside 自動 close | スコープ外。要望が出た時点で別タスク化 |
| `?` グリフを SVG icon にする | スコープ外。primitive 拡張要件と一緒に検討 |

## 4. 承認可否

| 項目 | 結果 |
| ---- | ---- |
| AC 8 件すべて満たす | (実装後判定) |
| blocker 0 件 | (実装後判定) |
| MINOR は未タスク化計画あり | ○ |

**結論**: Phase 11 (手動テスト) へ進行可。

## DoD

- [x] AC 確認テーブルが用意されている
- [x] blocker 判定が明示されている
- [x] MINOR → 未タスク化の判定方針が明示されている
