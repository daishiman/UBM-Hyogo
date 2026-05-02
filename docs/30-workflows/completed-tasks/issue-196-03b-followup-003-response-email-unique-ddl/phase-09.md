# Phase 9: 品質保証

[実装区分: 実装仕様書 / NON_VISUAL]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-196-03b-followup-003-response-email-unique-ddl` |
| phase | Phase 9 |
| status | `done` |

## 目的

実装 follow-up 時に必要な品質ゲートを一覧化する。

## 実行タスク

- typecheck / lint / build / SQL semantic diff / migration list の期待結果を定義する。
- static evidence PASS と production D1 migration list pending の境界を分離する。

## 参照資料

- `phase-04.md`
- `phase-11.md`
- `package.json`

## 統合テスト連携

新規統合テストは追加しない。既存 gate と Phase 11 evidence を利用する。

## 品質ゲート

| ゲート | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | exit=0 |
| lint | `mise exec -- pnpm lint` | exit=0 |
| build (sanity) | `mise exec -- pnpm build` | exit=0（コメント編集のみのため影響しないが念のため） |
| SQL semantic diff | `git diff main -- apps/api/migrations/` の SQL 行抽出が空 | empty |
| spec grep | `grep "正本 UNIQUE" database-schema.md` | hit |
| migration list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` | 0001 / 0005 が `applied` のまま |
| skill 4 条件 | Phase 10 レビュー | PASS |

## 自動化との関係

- 既存 lefthook hooks（pre-commit / pre-push）が typecheck / lint を実行する。本タスクではこれらが通る前提。
- CI（`.github/workflows/`）の type / lint job が PR 上で再確認する。
- DB 関連 CI（migration 検証 job がある場合）でも同様に PASS を期待。

## 完了条件

- [x] 全品質ゲートのコマンドと期待値が宣言されている
- [x] CI / hooks が補助検証する経路が記載されている

## 成果物

- `outputs/phase-09/main.md`: 本品質保証定義のコピー
