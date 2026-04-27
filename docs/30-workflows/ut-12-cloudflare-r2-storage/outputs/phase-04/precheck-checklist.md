# Phase 4 成果物: 事前検証チェックリスト (precheck-checklist.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 4 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |
| 連動 | precheck-runbook.md / rollback-procedure.md |

## 1. チェック項目（PASS / FAIL 記録枠）

> docs-only タスクのため、本書の `状態` 列は将来の Phase 5 実行時に PASS / FAIL を記録する欄とする。本タスク完了時点では「将来検証」を意味する `PENDING` を記録する。

| # | カテゴリ | チェック項目 | 期待結果 | 状態 | 記録（実行日時 / 実行者 / 備考） |
| --- | --- | --- | --- | --- | --- |
| 1 | 上流 | 01b token-scope-matrix.md に R2:Edit 追加可能エントリあり | YES | PENDING | Phase 5 着手時に記録 |
| 2 | 上流 | 01b cloudflare-bootstrap-runbook.md に Account ID 取得経路あり | YES | PENDING | 同上 |
| 3 | 上流 | 04 secrets-and-environment-sync の Secrets 登録経路確立 | YES | PENDING | 同上 |
| 4 | アカウント | `wrangler whoami` で運用アカウントが表示される | YES | PENDING | 同上 |
| 5 | アカウント | 既存 API Token のスコープ確認（R2:Edit 不在） | 記録のみ | PENDING | 採用案D で新規作成のため |
| 6 | アカウント | 新規 Token 作成権限あり | YES | PENDING | Dashboard 権限要確認 |
| 7 | wrangler.toml | `apps/api/wrangler.toml` に既存 `[[r2_buckets]]` がない | YES | PENDING | grep で確認 |
| 8 | wrangler.toml | `apps/web/wrangler.toml` に R2 設定がない（不変条件 5） | YES | PENDING | grep で確認 |
| 9 | wrangler | `wrangler --version` が 3.x 以上 | YES | PENDING | mise exec -- wrangler --version |
| 10 | wrangler | `wrangler r2 bucket list` が権限エラーなく実行可能 | YES | PENDING | - |
| 11 | 命名 | `ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging` が既存バケットと衝突しない | YES | PENDING | bucket list で確認 |
| 12 | rollback | バケット削除手順 (`wrangler r2 bucket delete`) を確認済 | YES | PENDING | rollback-procedure.md 参照 |
| 13 | rollback | wrangler.toml revert 手順を確認済 | YES | PENDING | git revert / 該当セクション削除 |
| 14 | rollback | CORS 設定解除手順を確認済 | YES | PENDING | wrangler r2 bucket cors delete |
| 15 | rollback | Token 削除手順を確認済 | YES | PENDING | Dashboard で revoke + GitHub Secrets 削除 |

## 2. FAIL 時の対応分類

| FAIL カテゴリ | 対応 | 差し戻し先 |
| --- | --- | --- |
| 上流（#1-3） | 上流タスクの完了を待つ | NO-GO（タスク保留） |
| アカウント（#4-6） | アカウント / 権限の見直し | NO-GO または条件付き GO |
| wrangler.toml（#7） | 既存 r2_buckets と統合検討 | RETURN to Phase 2 |
| wrangler.toml（#8） | apps/web から R2 削除（不変条件 5 違反） | **BLOCKER** RETURN to Phase 2 |
| wrangler（#9） | mise / pnpm で wrangler 更新 | 条件付き GO |
| wrangler（#10） | API Token 権限見直し | RETURN to Phase 2（Token 戦略再検討） |
| 命名（#11） | 命名再検討 | RETURN to Phase 2 |
| rollback（#12-15） | 手順を rollback-procedure.md に追記 | 条件付き GO |

## 3. 判定サマリ枠（Phase 5 実行時に記入）

| 集計 | 値 |
| --- | --- |
| 総項目数 | 15 |
| PASS 件数 | TBD（Phase 5 着手時記入） |
| FAIL 件数 | TBD |
| PENDING（未実行） | 15（本タスク完了時点） |
| ゲート判定 | TBD（Phase 5 で確定） |

## 4. 機密情報の取扱い

- `wrangler whoami` の出力に Account ID が含まれる場合、本書の備考欄には PASS / FAIL のみ記録（実値は記録しない）
- Token 値の確認は Dashboard 上で目視のみ。チェックリストには値を記録しない

## 5. 完了条件チェック

- [x] 15 項目すべての検証項目が記載
- [x] 期待結果 / 状態 / 記録欄のテンプレートが整備
- [x] FAIL 時の対応分類が記載
- [x] 不変条件 5 違反は BLOCKER として明示
- [x] 機密情報取扱い方針が明記
