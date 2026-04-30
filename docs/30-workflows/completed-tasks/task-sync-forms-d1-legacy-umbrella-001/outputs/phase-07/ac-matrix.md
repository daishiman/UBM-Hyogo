# AC マトリクス（AC-1〜AC-14 × verify suite × runbook step × failure case × 不変条件）

## positive AC matrix

| AC | 内容 | verify suite | runbook step | 不変条件 | 確定 Phase |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 旧 UT-09 が legacy umbrella として扱われる | D-1, D-3, S-1 | R-1, R-3 (Diff A) | #1 | Phase 02, 03 |
| AC-2 | 03a / 03b / 04c / 09b / 02c に分解（direct 残責務 0） | M-1, M-2, M-3, M-4 | R-2 | #5 | Phase 02, 03 |
| AC-3 | Forms API 統一（`forms.get` / `forms.responses.list`） | S-2 | R-1 | #1, #7 | Phase 02 |
| AC-4 | `POST /admin/sync/schema` / `POST /admin/sync/responses` 正本、単一 `/admin/sync` 不採用 | S-3, M-3 | R-1, R-2 | -| Phase 02 |
| AC-5 | SQLITE_BUSY retry/backoff / 短い transaction / batch-size 制限が 03a/03b 異常系で追跡 | M-1, M-2（異常系 grep） | R-3 (Diff B, C) | -| Phase 05 |
| AC-6 | sync_jobs 同種 job 排他で 409 Conflict | S-3, M-3 | R-3 (Diff E) | -| Phase 02, 05 |
| AC-7 | Workers Cron Triggers の pause/resume/evidence が 09b runbook | M-4 | R-3 (Diff D) | #6 | Phase 05 |
| AC-8 | dev branch -> staging env / main branch -> production env | S-4 | R-1 | -| Phase 02 |
| AC-9 | apps/web→D1 直接禁止に違反する記述なし | S-3 + #5 監査 | R-2, R-4 | #5 | Phase 02 |
| AC-10 | 必須 9 セクション準拠 | D-1 | R-4 | -| Phase 09 |
| AC-11 | filename lowercase / hyphen | D-2 | R-4 | -| Phase 09 |
| AC-12 | stale `ut-09-sheets-to-d1-cron-sync-job/` 新設禁止 | S-1 | R-1 | -| Phase 02 |
| AC-13 | specs/01 / 03 / 08 と矛盾しない | SP-1, SP-2, SP-3 | R-4 | -| Phase 04, 09 |
| AC-14 | Phase 13 commit / PR はユーザー承認まで実行しない | -（運用 gate） | -| -| Phase 13 |

**positive 空白セル**: 0 件（AC-14 の verify 列は意図的に空、運用 gate と明示）

## negative AC matrix（FD-1〜FD-8）

| FD | failure 内容 | 関連 AC | verify suite | runbook step | mitigation |
| --- | --- | --- | --- | --- | --- |
| FD-1 | 旧 UT-09 path / id 残存 | AC-1, AC-12 | S-1 | R-1 | Phase 02, 05 |
| FD-2 | Sheets API 表記残存 | AC-3 | S-2 | R-1 | 03a / 03b |
| FD-3 | 単一 `/admin/sync` / `sync_audit` 残存 | AC-4, AC-6 | S-3 | R-1 | 04c / 02c |
| FD-4 | `dev / main 環境` 単独表記残存 | AC-8 | S-4 | R-1 | 09a / 09b / 09c |
| FD-5 | WAL 前提 / PRAGMA 必須化 | AC-5, AC-13 | SP-3 | R-4 | 03a / 03b 異常系、09b runbook |
| FD-6 | 9 セクション / lowercase / hyphen 違反 | AC-10, AC-11 | D-1, D-2, D-3 | R-4 | Phase 09 |
| FD-7 | conflict marker 残存 | 全 AC 共通 | C-1, C-2, C-3 | R-4 | merge 再実施 |
| FD-8 | specs/08 違反の D1 制約読み替え | AC-5, AC-13 | SP-3 | R-4 | 未確認 PRAGMA 前提を削除し retry/backoff / 短 transaction / batch-size 制限へ統一 |

**negative 空白セル**: 0 件

## 不変条件 × matrix

| 不変条件 | positive AC との紐付け | negative FD との紐付け |
| --- | --- | --- |
| #1 schema 過剰固定回避 | AC-1, AC-3 | FD-2 |
| #5 apps/web→D1 直接禁止 | AC-2, AC-9 | FD-3（02c 範囲） |
| #6 GAS prototype 不採用 | AC-7 | FD-1（GAS trigger 新設なし） |
| #7 Form 再回答が本人更新 | AC-3 | FD-2 |
| #10 無料枠運用 | -（補助） | FD-5（cron 頻度試算） |

## 集計

| 観点 | 数値 |
| --- | --- |
| positive AC | 14 |
| 検証列充足 AC | 13（AC-14 を除く） |
| 不変条件カバー数 | 5（#1 / #5 / #6 / #7 / #10） |
| failure case | 8 |
| 失敗ケースに mitigation 紐付け | 8/8（100%） |
| §7 リスク + specs/08 リスク → FD マッピング | 8/8（FD-1〜FD-8、複数リスクが FD-3 に集約） |

## 次 Phase（08 DRY 化）への引き渡し

1. AC matrix のセル ID を DRY 化対象の正規化規則と紐付け
2. verify suite ID（S-/M-/C-/D-/SP-）を Phase 8 用語 audit の入力に使う
