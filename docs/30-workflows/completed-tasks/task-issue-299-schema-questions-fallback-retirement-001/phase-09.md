# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | quality gate |

## 目的

実装後に必ず実行する品質ゲートを固定する。coverage 0 件 → test PASS → 静的検査 0 件 の順序で確認する。

## 実行タスク

| Gate | コマンド | 成功条件 |
| --- | --- | --- |
| G-01 | `mise exec -- pnpm --filter @repo/api test` | PASS |
| G-02 | `mise exec -- pnpm typecheck` | PASS |
| G-03 | `mise exec -- pnpm lint` | PASS |
| G-04 | `rg -n "stable_key FROM schema_questions WHERE question_id" apps/api packages` | 0 件 |
| G-05 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --file scripts/diagnose/schema-aliases-coverage.sql --remote` | 0 rows |
| G-06 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env staging --file scripts/diagnose/schema-aliases-coverage.sql --remote` | 0 rows |
| G-07 | `bash scripts/coverage-guard.sh` | exit 0（既定 80% / 80% / 80% / 80% 維持） |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Quality gates | `.claude/skills/task-specification-creator/references/coverage-standards.md` | coverage 既定 |
| Phase 7 | `phase-07.md` | AC coverage |

## 実行手順

1. G-01 から G-07 を順に実行する。
2. 失敗した gate は Phase 5/6/8 のどこへ戻すか分類する。
3. 結果を Phase 11 evidence に転記する。

## 統合テスト連携

| 判定項目 | 基準 |
| --- | --- |
| automated tests | PASS |
| typecheck / lint | PASS |
| static guard | 0 件 |
| coverage SQL (prod/staging) | 0 件 |
| coverage-guard | exit 0 |

## 多角的チェック観点（AIが判断）

- G-05 / G-06 を「Phase 5 の事前確認だけで PASS 扱い」していないか（Phase 13 承認直前または同日に再実行が必要）。
- coverage-guard が API 範囲の閾値を維持しているか。

## サブタスク管理

| failure | 戻り先 |
| --- | --- |
| test failure | Phase 5 |
| coverage SQL > 0 | Phase 5 step 2（廃止延期） |
| static failure | Phase 8 |
| coverage-guard failure | Phase 4（テスト追加） |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 品質保証 | `phase-09.md` | gate list |

## 完了条件

- [ ] G-01 から G-07 が定義されている
- [ ] failure の戻り先が明確
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Phase 10 の GO/NO-GO 判定に必要な gate が揃っている

## 次Phase

Phase 10: GO/NO-GO
