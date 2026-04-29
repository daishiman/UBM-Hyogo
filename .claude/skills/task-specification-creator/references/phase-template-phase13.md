# Phase Template Phase13

## 対象

Phase 13 の PR 作成。

## ルール

1. user の明示承認がない限り blocked のままにする。
2. ローカル確認を省略しない。
3. commit / PR を自動で作らない。

## quick-summary（Phase 13 必須成果物 4 点）

| 必須成果物 | 役割 |
| --- | --- |
| `outputs/phase-13/local-check-result.md` | **必須**: typecheck / lint / build などローカル検証ログを記録 |
| `outputs/phase-13/change-summary.md` | 変更サマリー（PR 作成前にユーザーに提示） |
| `outputs/phase-13/pr-info.md` | PR 作成後の URL / CI 結果 |
| `outputs/phase-13/pr-creation-result.md` | PR 作成プロセスの実行ログ |

> **`local-check-result.md` は見落としやすい必須成果物**。Phase 13 着手時の最初のチェックリストに含めること。

## 最低限の記録

- なぜ blocked か
- user approval の有無
- Phase 12 までの完了根拠
- local check の結果要約（→ `outputs/phase-13/local-check-result.md` に必ず記録）
- `outputs/phase-13/local-check-result.md` と `outputs/phase-13/change-summary.md` の作成有無
- `pr-info.md` / `pr-creation-result.md` を作成できる状態か

## 関連ガイド

- [review-gate-criteria.md](review-gate-criteria.md)
- [commands.md](commands.md)
