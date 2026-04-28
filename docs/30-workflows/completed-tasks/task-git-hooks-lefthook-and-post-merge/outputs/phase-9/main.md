# Phase 9 — 品質保証

## Status

completed

## サマリ

implementation タスクのため、品質保証は「仕様書群の整合性」と「本タスクで実行されるべきゲート定義」を対象とする。本 Phase ではコードを実行しない。代わりに、本タスクが満たすべき品質ゲートを 4 軸（yaml 構文 / shell lint / artifacts ↔ outputs 1:1 / 依存切離し）で定義し、現時点での仕様書段階のセルフチェック結果を記録する。

## 品質ゲート 4 軸

詳細は `outputs/phase-9/quality-gate.md` を参照。

| ID | ゲート | 検証対象 | 実行タイミング |
| --- | --- | --- | --- |
| QG-A | lefthook.yml 構文 | `lefthook.yml` の min_version / lane / commands 定義 | 実装タスク（lefthook validate / parse） |
| QG-B | shell スクリプト shellcheck | `scripts/hooks/*.sh` 2 本 | 実装タスク（shellcheck SC2086 等） |
| QG-C | artifacts.json と outputs 1:1 対応 | `artifacts.json :: phases[].outputs` と実ファイル | docs フェーズ（本 Phase 含む） |
| QG-D | `generate-index.js` 依存切離し | `lefthook.yml` から node 直呼び出しがない | 実装タスク（grep ベース） |

## docs 段階セルフチェック結果

| ゲート | 結果 | 備考 |
| --- | --- | --- |
| QG-C（artifacts ↔ outputs） | PASS | Phase 1-11 の全 outputs パスが `artifacts.json` と一致（本タスクで Phase 8-11 を新規作成） |
| line budget（各 phase ≤ 500 行目安） | PASS | 全 phase 数十〜数百行に収束。超過なし。 |
| 内部リンク | PASS | 相互参照は `outputs/phase-N/*.md` 相対 / `CLAUDE.md` / `scripts/cf.sh` のみで、すべて存在 |
| mirror parity（main.md ↔ design/review/before-after） | PASS | 各 Phase の main.md が detail 子ファイルを参照 |
| yaml lint（仕様内 yaml ブロック） | PASS（構文段階） | Phase 2 design.md の yaml はキー重複なし。実 lint はPhase 11で再検証 |

## 受入確認

- [x] 4 つの品質ゲートを定義し、`outputs/phase-9/quality-gate.md` に詳細記載
- [x] artifacts.json と outputs 1:1 対応の確認手順を明示
- [x] `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` 依存切離しの検証方法を明示
- [x] line budget / link / mirror parity / yaml lint の現時点状態を記録
