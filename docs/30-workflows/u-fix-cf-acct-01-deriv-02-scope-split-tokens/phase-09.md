# Phase 9: 品質保証

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-9/phase-9.md` |

## 目的
`pnpm typecheck` / `pnpm lint` / `actionlint` / `pnpm sync:check` を全 PASS させる。secret hygiene（実値が docs/log に残らないこと）を確認する。

## 参照資料
- `outputs/phase-9/phase-9.md`

## 成果物
- `outputs/phase-9/quality-report.md`
- `outputs/phase-9/secret-hygiene-check.md`

## 完了条件
- 4 検証コマンド全 PASS、secret hygiene grep が 0 hit。

## 実行タスク
- [ ] local shell smoke、YAML parse、secret hygiene、必要な repo quality commands を実行する。

## 統合テスト連携
- CI/CD 変更のため統合テストは workflow parse と shell smoke で代替する。
