# Phase 11: NON_VISUAL evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | 非視覚 evidence |

## 目的

API/D1 cleanup タスクとして、スクリーンショットではなくコマンド結果と coverage query 結果で完了を証明する。

## 実行タスク

作成する evidence:

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | 実行結果サマリー |
| `outputs/phase-11/test-results.md` | `pnpm --filter @repo/api test` 結果 |
| `outputs/phase-11/coverage-evidence.md` | production / staging coverage SQL 結果 |
| `outputs/phase-11/sync-log-evidence.md` | 03a sync log / metric の fallback hit 確認。取得不能時は理由を記録 |
| `outputs/phase-11/static-guard.md` | `rg` による fallback 経路 0 件確認 |
| `outputs/phase-11/diff-evidence.md` | `findStableKeyByQuestionId` の before / after diff、変更行数、影響範囲 |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 9 | `phase-09.md` | quality gates |
| Phase 10 | `phase-10.md` | GO 判定 |

## 実行手順

1. `mise exec -- pnpm --filter @repo/api test` の結果（特に `resolve-stable-key.spec.ts` と `schemaQuestions` 関連 test）を `test-results.md` に記録する。
2. `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --file scripts/diagnose/schema-aliases-coverage.sql --remote` の coverage 結果を `coverage-evidence.md` に記録する（タイムスタンプ含む）。
3. 同じく `--env staging` での結果を記録する。
4. `rg -n "stable_key FROM schema_questions WHERE question_id" apps/api packages` の結果を `static-guard.md` に記録する。
5. `git diff -- apps/api/src/repository/schemaQuestions.ts apps/api/src/sync/schema/resolve-stable-key.spec.ts` を `diff-evidence.md` に記録する。
6. 03a sync log / metrics で fallback hit が取得可能なら `sync-log-evidence.md` に記録、不能なら同ファイルに「取得不能、理由」を明記する。
7. coverage SQL は Phase 13 承認直前または承認同日に再実行し、古い snapshot の流用を禁止する。

## 統合テスト連携

| evidence | 必須 |
| --- | --- |
| automated test | yes |
| coverage SQL (prod + staging) | yes |
| 03a sync log / metric | yes（取得不能なら `sync-log-evidence.md` に理由） |
| static guard | yes |
| diff | yes |
| screenshot | no |

## 多角的チェック観点（AIが判断）

- placeholder evidence を PASS と扱っていないか。
- coverage 取得タイムスタンプが Phase 13 承認直前または承認同日か（古い snapshot 流用禁止）。

## サブタスク管理

| サブタスク | 完了条件 |
| --- | --- |
| test evidence | command/output recorded |
| coverage evidence | prod + staging 両方 |
| sync log evidence | fallback hit 0 または取得不能理由 |
| static evidence | grep 0 件記録 |
| diff evidence | unified diff 記録 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| NON_VISUAL evidence | `outputs/phase-11/*` | 実測記録 |

## 完了条件

- [ ] NON_VISUAL evidence が揃っている
- [ ] coverage が prod / staging 両方で 0 件記録されている
- [ ] placeholder を PASS と扱っていない
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Phase 12 へ転記できる evidence がある

## 次Phase

Phase 12: ドキュメント同期
