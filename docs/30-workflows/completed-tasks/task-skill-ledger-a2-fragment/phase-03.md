# Phase 03: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| Phase | 3 |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |

## 目的

Phase 2 設計が Phase 4（テスト設計）以降に進める品質を満たすかを判定する。MAJOR / MINOR / INFO の 3 レベルで指摘を整理し、MAJOR が 0 件であることを Phase 4 着手の gate とする。

## レビュー観点（5 軸）

| 軸 | 観点 | 不合格の例 |
| -- | ---- | ---------- |
| 整合性 | 命名 regex / front matter / CLI 引数の表記が `fragment-schema.md` / `render-api.md` / `main.md` で一致 | regex が schema と CLI ヘルプで異なる |
| 完全性 | 受入条件 8 項目が設計成果物にすべて反映 | `--out` tracked 拒否（exit 2）が schema にだけあり API 仕様にない |
| 実現性 | nonce 衝突確率・path 上限 240 byte が実装可能なオーダー | path 上限が NTFS 制約に違反 |
| 運用性 | render が legacy 混在しても降順を保てる擬似 timestamp 戦略がある | mtime 1 軸に依存し本文日付フォールバックが無い |
| セキュリティ・安全性 | `--out` 誤上書きで tracked canonical ledger を破壊しない / front matter parse 不能 fragment が silent fail しない | `--out` が `LOGS.md` を指しても上書き許可 |

## 実行タスク

- Phase 2 成果物 3 ファイルを読み込み、5 軸チェックリストで確認する。
- レビュー結果を `outputs/phase-3/review.md` に MAJOR / MINOR / INFO 区分で記録する。
  - MAJOR: 設計矛盾・受入条件未充足・セキュリティ欠陥（Phase 4 着手不可）
  - MINOR: 表現ぶれ・ドキュメント不足（Phase 4 並行で修正）
  - INFO: 改善提案（後続タスクへ）
- ドッグフーディング観点：task-specification-creator の SKILL changelog と aiworkflow-requirements の LOGS の fragment 化が schema / render API でカバーできているか確認。
- nonce 衝突確率の数値検証：8 hex（32bit）／秒間 1000 ファイル想定で期待衝突回数 ≈ `1000² / 2^33 ≈ 1.16×10⁻⁴` を main.md に記録。
- legacy include window 30 日の妥当性確認：30 日を超える履歴が必要な場合の手順（`--include-legacy` + 手動 merge）を補記。
- Go/No-Go 判定：MAJOR 0 件 → GO（Phase 4 着手）／MAJOR ≥1 件 → NO-GO（Phase 2 へ差戻）。

## 4 条件レビュー

- 価値性: conflict 0 件と blame 連続性が誰のどのコストを削減するかを 1 行で言語化。
- 実現性: render script の実装ボリューム（推定 LoC・依存パッケージ）が medium 規模に収まる。
- 整合性: 状態所有権が Store / Helper / Engine / Bridge / Guard の 5 層で閉じている。
- 運用性: 4 worktree smoke が CI 手動 trigger で再現可能であること。

## 参照資料

- Phase 1 `outputs/phase-1/main.md`
- Phase 2 `outputs/phase-2/main.md` / `fragment-schema.md` / `render-api.md`
- Issue #130 完了条件チェックリスト

## 成果物

- `outputs/phase-3/main.md`（5 軸サマリー・4 条件レビュー・Go/No-Go 判定）
- `outputs/phase-3/review.md`（MAJOR / MINOR / INFO 指摘の詳細）

## 統合テスト連携

レビューのみで完結。

## 完了条件

- [ ] 5 軸チェックリストが review.md にすべて記録されている。
- [ ] MAJOR / MINOR / INFO の各件数が main.md に集計されている。
- [ ] MAJOR 0 件である（≥1 件のときは Phase 2 へ差戻して再レビュー）。
- [ ] 4 条件レビューが main.md に記録されている。
- [ ] nonce 衝突確率の数値計算が記載されている。
- [ ] Go/No-Go 判定が GO であり、Phase 4 への前提が明記されている。
- [ ] artifacts.json の Phase 3 status と整合。
