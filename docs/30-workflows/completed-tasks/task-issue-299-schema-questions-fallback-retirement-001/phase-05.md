# Phase 5: 実装計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | 実装順序と rollback 境界 |

## 目的

実装者が coverage 確認 → test 更新（赤化）→ fallback 削除（緑化）→ 正本仕様更新の順序で進められる runbook を定義する。

## 実行タスク

1. **coverage 事前確認**: `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --file scripts/diagnose/schema-aliases-coverage.sql --remote` と `--env staging` を実行し、production / staging で 0 件確認。Phase 11 `outputs/phase-11/coverage-evidence.md` に記録。
2. **0 件でない場合**: ここで実装作業（test RED / fallback 削除 / GREEN 確認）は停止し、unresolved な question_id を一覧化して Phase 10 DEFERRED 判定と Phase 12 close-out へ進む。Phase 12 `unassigned-task-detection.md` と source unassigned task には再判定条件を追記し、source task を completed 化しない。
3. **test 先行更新（RED）**: `apps/api/src/sync/schema/resolve-stable-key.spec.ts` の "fallback" ケースを T-02/T-03 セマンティクスに更新する。実装変更前の test 実行で赤になることを確認する（fallback 削除前は test が失敗する）。
4. **fallback 削除**: `apps/api/src/repository/schemaQuestions.ts` L142-150 を Phase 2 の "変更後" シグネチャに置き換える。
5. **緑化確認**: `mise exec -- pnpm --filter @repo/api test` 実行で全 PASS を確認する。
6. **doc comment 更新**: L130-134 の JSDoc から fallback 言及を削除。
7. **正本仕様更新**: `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` 内の fallback 記述を「retired at 2026-05-15 by task-issue-299」として更新（または削除）。
8. **静的検査**: `rg -n "stable_key FROM schema_questions WHERE question_id" apps/api packages` で 0 件確認。
9. 各 step は小さい commit 単位にできる粒度で進める。ただし commit はユーザー承認後（Phase 13）。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 2 | `phase-02.md` | 変更対象とシグネチャ |
| Phase 4 | `phase-04.md` | test matrix |
| Cloudflare CLI | `scripts/cf.sh` | D1 read-only 実行 |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | fallback 記述更新対象 |

## 実行手順

| step | 直後に実行する検証 |
| --- | --- |
| coverage query (prod) | `--file scripts/diagnose/schema-aliases-coverage.sql` で 0 件確認、evidence 化 |
| coverage query (staging) | `--file scripts/diagnose/schema-aliases-coverage.sql` で 0 件確認、evidence 化 |
| test 更新 | spec 単独 run で RED |
| fallback 削除 | spec 単独 run で GREEN |
| 全体 test | `pnpm --filter @repo/api test` PASS |
| 静的検査 | `rg` 0 件 |
| 正本仕様 | diff 確認 |

## 統合テスト連携

| step | コマンド |
| --- | --- |
| spec | `mise exec -- pnpm --filter @repo/api test -- resolve-stable-key` |
| 全体 | `mise exec -- pnpm --filter @repo/api test` |
| typecheck | `mise exec -- pnpm typecheck` |
| static | `rg -n "stable_key FROM schema_questions WHERE question_id" apps/api packages` |

## 多角的チェック観点（AIが判断）

- coverage 0 件確認なしに step 3 以降へ進んでいないか。
- `updateStableKey` / `listFieldsByVersion` 等の無関係な経路を巻き添え編集していないか。
- doc comment と正本仕様の整合が取れているか。

## サブタスク管理

| サブタスク | 並列可否 |
| --- | --- |
| coverage 確認 | 先行必須 |
| test 更新 | coverage 後 |
| fallback 削除 | test 更新後 |
| 正本仕様更新 | 削除後 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 実装計画 | `phase-05.md` | runbook |

## 完了条件

- [ ] 実装順序が「coverage → test (RED) → 実装 (GREEN) → docs」で書かれている
- [ ] coverage 0 件でない場合の rollback / 延期判断が明記されている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 実装者がこの Phase だけで作業順序を判断できる

## 次Phase

Phase 6: 異常系設計
