# Phase 7 — カバレッジ確認（サマリ）

## Status
done

> docs-only / NON_VISUAL / spec_created タスクのため、本 Phase の「カバレッジ」とは
> **コード実行カバレッジではなく、Phase 1 受入条件 (AC-1〜AC-7) と Phase 2 設計章立て
> （branch-protection / squash-only / auto-rebase / pr-target safety gate / 状態遷移 /
> 横断境界）の網羅性**、および Phase 4 検証手段との対応の完全性を意味する。

## 1. 入力
| 入力 | 参照先 |
| --- | --- |
| 受入条件 | `outputs/phase-1/main.md` §4 (AC-1〜AC-7) |
| 設計章立て | `outputs/phase-2/design.md` §1〜§9 |
| レビュー結果 | `outputs/phase-3/review.md` §3 受入条件チェック表 |
| 検証手段 | `outputs/phase-4/test-matrix.md`（docs-only 用静的検証マトリクス） |
| 失敗ケース | `outputs/phase-6/failure-cases.md` |

## 2. 対象スコープ

- 仕様要素カバレッジ（仕様要素 × 受入条件）
- 検証手段カバレッジ（AC × Phase 4 検証手段）
- 設計章立てカバレッジ（design.md §N × 草案アーティファクト）
- 失敗ケース被覆（Phase 6 で追加された負例が AC を逸脱しないか）

## 3. 観点別 結果サマリ

| 観点 | 結果 | 補足 |
| --- | :-: | --- |
| AC-1〜AC-7 の全件カバー | PASS | 詳細は `coverage.md` §1 |
| design.md 全章の AC 紐付け | PASS | §1〜§8 すべて 1 つ以上の AC を満たす |
| Phase 4 検証手段の AC 紐付け | PASS | 全 AC に静的検証手段が紐付く（`coverage.md` §2） |
| 失敗ケース（Phase 6）の AC 一致 | PASS | Phase 6 の負例は AC-3 / AC-4 のいずれかを直接検証 |
| 草案アーティファクト命名 canonical 一致 | PASS | Phase 1 §7 と一致 |

## 4. 残課題

なし。MINOR-1〜MINOR-3（Phase 3）は Phase 5 / 横断タスク / 将来 OSS 化タスクへ既に委譲済みで本 Phase では再検出されない。

## 5. Phase 8 への申し送り

- Phase 8 では「branch-protection と auto-rebase で重複していた permissions 記述」など、
  仕様要素レベルの重複を before/after で統合すること。
- `coverage.md` の対応表は Phase 9 品質ゲートで artifacts parity の参照根拠になる。
