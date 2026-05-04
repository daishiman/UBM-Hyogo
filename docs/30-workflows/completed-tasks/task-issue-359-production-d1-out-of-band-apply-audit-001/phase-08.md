# Phase 8: DRY 化（記述重複の正規化）

[実装区分: ドキュメントのみ仕様書]

## 目的

Phase 1-7 を横断して重複している記述を特定し、正本箇所を 1 箇所に固定する。docs-only タスクのため、リファクタ対象は「ドキュメント記述」のみでコードは含まない。

## 重複検出と正規化方針

| 重複領域 | 出現箇所 | 正本（SSOT） | 他箇所の扱い |
| --- | --- | --- | --- |
| read-only / redaction 不変条件 | Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 9 | `index.md` の `invariants touched` | 各 Phase は「`index.md` invariants 参照」と書き、再記述を避ける |
| 対象 timestamp 値 | `index.md` / Phase 1 / Phase 5 / Phase 7 / Phase 11 evidence | `index.md` の `refs` / `outputs/phase-11/d1-migrations-ledger.md` | Phase ドキュメント内では timestamp を再ハードコードせず `index.md` 参照とする |
| 監査ソース 5 種 | Phase 2 / Phase 5 | `outputs/phase-02/main.md` の表 | Phase 5 の Step 1-4 では「Phase 2 監査ソース表 N に基づく」と参照 |
| 判定アルゴリズム疑似コード | Phase 2 / Phase 5 Step 6 | Phase 2 設計書 | Phase 5 では「Phase 2 §判定アルゴリズム」へリンクするのみ |
| AC 期待値 | `index.md` AC / Phase 7 マトリクス | Phase 7 マトリクス | `index.md` AC は概要のみ、検証詳細は Phase 7 を SSOT とする |

## 正規化アクション

1. Phase 5 ランブックから Phase 2 と重複する判定アルゴリズム本文を削除し、参照リンクへ置換
2. Phase 9 の redaction / read-only 検証は Phase 4 検証コマンド表を参照し、コマンド本文を再掲しない
3. timestamp / migration 名は `index.md` の `refs` を SSOT として、各 Phase はラベル参照のみ

## 排除しない重複

- 各 Phase の「目的」「完了条件」: Phase ごとに独立した read 経験を成立させるため重複維持
- AC ID とタイトルの併記: トレース容易性のため重複維持

## 出力 (`outputs/phase-08/main.md`)

- 重複検出表
- 正規化アクション一覧
- 排除しなかった重複の理由

## 完了条件

- [ ] 重複領域 5 種すべてに SSOT が指定されている
- [ ] 正規化アクションが Phase 5 / Phase 9 の修正計画として落ちている

## メタ情報

- taskType: docs-only
- visualEvidence: NON_VISUAL
- workflow_state: spec_created

## 実行タスク

- 詳細は本 Phase の既存セクションを参照する。

## 参照資料

- index.md
- artifacts.json
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 成果物

- 対応する `outputs/phase-*` 配下の `main.md`。

## 統合テスト連携

- docs-only / NON_VISUAL のため UI 統合テストは対象外。Phase 11 の read-only audit evidence と Phase 12 compliance check で検証する。
