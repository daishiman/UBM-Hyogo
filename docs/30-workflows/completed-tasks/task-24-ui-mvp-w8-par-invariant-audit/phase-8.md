# Phase 8: リファクタリング

**実装区分**: 実装仕様書（read-only audit; 成果物は audit-runner.sh + INVARIANT-AUDIT.md + evidence。`apps/` / `packages/` 変更ゼロを DoD で担保）。

監査タスクのため対象は監査スクリプトおよび成果物テンプレート。

## 変更テーブル

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `audit-runner.sh` | INV ごとに inline grep | INV ごとに function 化 | 並列実行（lane-A/B/C）の単位明確化 |
| matrix Markdown | 手書き | `matrix.tsv` から自動生成 | re-run 時の再現性向上 |

## navigation drift

なし（既存ドキュメント階層に新 task root を追加のみ）。

## メタ情報
- Phase: 8 / リファクタリング
- State: completed

## 目的
監査 runner と outputs を不要に複雑化せず、read-only 境界を維持する。

## 実行タスク
- 既存 apps/packages 変更がないことを確認する。
- evidence path を Phase 5 に集約する。

## 参照資料
- `git diff apps/ packages/`
- `outputs/phase-5/`

## 成果物
- `phase-8.md`

## 完了条件
- [x] apps/packages 差分がない
- [x] evidence path が分散していない

## 統合テスト連携
Phase 9 と Phase 12 が apps/packages 差分 0 を検証する。
