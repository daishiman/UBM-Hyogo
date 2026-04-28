# Phase 9: 品質保証レポート

## 1. typecheck / lint / build

| 項目 | コマンド | 結果 (docs-only 時点) | 実行時要件 |
| --- | --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | TBD (未実行) | exit 0 必須 |
| lint | `mise exec -- pnpm lint` | TBD | exit 0 必須 |
| api build | `mise exec -- pnpm --filter @ubm-hyogo/api build` | TBD | exit 0 必須 |
| web build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | TBD | exit 0 必須 |

→ 全て Phase 4 verify suite で確認済の状態で Phase 5 に進行する。

## 2. ドキュメント品質

| 項目 | 確認 |
| --- | --- |
| Phase 1〜8 outputs が完成しているか | DONE |
| AC × Phase マッピングが Phase 1 / Phase 7 で一貫しているか | DONE |
| rollback-runbook.md が deploy-runbook.md と整合しているか | DONE |
| 命名規則が env-binding-matrix.md と他文書で一貫しているか | DONE |
| 機密情報 (実 database_id / Secrets 値) を含んでいないか | DONE (プレースホルダ化) |

## 3. 無料枠制約への配慮

| Cloudflare 製品 | 無料枠 | 本タスクへの影響 |
| --- | --- | --- |
| Workers | 100,000 req/day | デプロイ自体はカウント外。smoke の curl は微小 |
| D1 | 5GB / 25M reads / 50K writes per day | マイグレーション 1 件 + smoke SELECT のみ。問題なし |
| Pages | 無制限デプロイ | 影響なし |

## 4. 残存リスク

| リスク | 重要度 | 対応 |
| --- | --- | --- |
| OpenNext Workers 形式整合課題 | MEDIUM | Phase 12 で別タスク化 |
| staging リハーサル未実施 | MEDIUM | 実行時に Phase 6 で必須化 |
| `[env.production]` 不在による暗黙挙動 | LOW | runbook で明記済 |
| バックアップ初回空 export | LOW | 仕様として許容・restore-empty.sql で代替 |

## 5. 品質ゲート判定

- 判定 (docs-only): PASS (ドキュメント完成 / プレースホルダ整備 / 機密情報なし)
- 判定 (実行時): TBD (Phase 4 verify suite 全 PASS + 本書 §1 全 exit 0 で PASS)
