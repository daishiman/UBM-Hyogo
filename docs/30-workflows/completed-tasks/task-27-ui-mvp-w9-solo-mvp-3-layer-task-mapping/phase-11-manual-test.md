# Phase 11: 手動テスト（NON_VISUAL）

> Phase: 11 / 13
> 名称: 手動テスト
> visual classification: NON_VISUAL（UI/UX 変更なし）

---

## NON_VISUAL 宣言

本タスクは docs-only / mapping matrix の生成のみで、UI/UX 変更を一切含まない。よって Phase 11 スクリーンショットは **N/A** とし、`screenshots/.gitkeep` は配置せず `screenshots/` ディレクトリを生成しない。

NON_VISUAL 判断根拠:
- タスク種別: docs-only
- 非視覚的理由: ブラウザ render 対象なし / Markdown のみ
- 代替証跡: `manual-test-result.md`（本仕様書記載の確認結果）

---

## 代替証跡（自動テスト + 構造検証）

| 証跡項目 | 主ソース | 件数 |
|---------|---------|------|
| Phase 4 TC-01〜10 結果 | `outputs/phase-11/manual-test-result.md` に記録 | 10 件 PASS |
| Phase 6 TC-11〜15 結果 | 同上 | 5 件 PASS |
| 双方向一致 cross-check | Phase 7 coverage 算出値 | 100% |
| 19 routes 網羅 | TC-10 / TC-15 | 19/19 |

スクリーンショットを作らない理由: matrix は markdown 表形式で、視覚的差分検証の対象とならない（ブラウザ render なし）。

---

## 実施タスク

1. `MVP-3LAYER-TASK-MAPPING.md` の Markdown table 構造をローカルファイル上で確認し、列数・区切り・空欄がないことを検証
2. Phase 4 / 6 の全 TC を順に手動で再走査
3. `outputs/phase-11/manual-test-result.md` に NON_VISUAL 宣言 + 確認結果サマリーを記録

---

## 完了条件

- NON_VISUAL 宣言が `manual-test-result.md` 冒頭に明記されている
- 自動テスト件数（10 + 5 = 15 件）と件数別 PASS/FAIL/SKIP を記録
- スクリーンショットを作らない理由が明記されている
- 環境ブロッカーがあれば source-level PASS と分離記載（WEEKGRD-01）
## メタ情報

- Phase: 11 / 手動テスト
- taskType: docs-only
- visualEvidence: NON_VISUAL

## 目的

NON_VISUAL 代替証跡を記録し、スクリーンショット不要の境界を明確にする。

## 実行タスク

- Phase 11 補助成果物を確認する。
- Markdown matrix の構造確認結果を記録する。

## 参照資料

- `outputs/phase-11/manual-test-result.md`
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md`

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`

## 完了条件

- [x] NON_VISUAL evidence が物理ファイルとして存在する。

## 統合テスト連携

runtime test は不要。apps / packages に変更がないことを確認する。
