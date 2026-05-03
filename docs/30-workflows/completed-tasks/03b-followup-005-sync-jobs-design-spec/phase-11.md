# Phase 11: NON_VISUAL evidence 収集（grep / typecheck / vitest / indexes diff）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 11 / 13 |
| Phase 名称 | NON_VISUAL evidence 収集 |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | 10 (レビュー + 整合確認) |
| 次 Phase | 12 (実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

AC-1〜AC-11 の証跡を実コマンド出力として `outputs/phase-11/` 配下に保存する。`visualEvidence=NON_VISUAL` のためスクリーンショットは作成しない。

## 実行コマンド一覧（必須）

```bash
# 1. typecheck（AC-10）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck \
  | tee outputs/phase-11/typecheck.log

# 2. 新規テスト（AC-2 / AC-11）
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test \
  | tee outputs/phase-11/vitest-sync-jobs-schema.log

# 3. 既存テスト回帰（AC-6）
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-forms-responses \
  | tee outputs/phase-11/vitest-sync-forms-responses.log
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-sheets-to-d1 \
  | tee outputs/phase-11/vitest-sync-sheets-to-d1.log

# 4. grep evidence（AC-3 / AC-4 / AC-5 / AC-7 / AC-8）
rg -n "DEFAULT_LOCK_TTL_MS" apps/api/src/jobs/sync-forms-responses.ts \
  | tee outputs/phase-11/grep-default-lock-ttl-absent.log    # 0 件期待
rg -n "SYNC_LOCK_TTL_MS" apps/api/src/jobs/sync-forms-responses.ts \
  | tee outputs/phase-11/grep-sync-lock-ttl-present.log
rg -n "SyncJobKind" apps/api/src/repository/syncJobs.ts \
  | tee outputs/phase-11/grep-syncjobkind-reexport.log
rg -n "parseMetricsJson" apps/api/src/jobs/cursor-store.ts \
  | tee outputs/phase-11/grep-parse-metrics-json.log
rg -n "_shared/sync-jobs-schema" docs/30-workflows/_design/sync-jobs-spec.md \
  | tee outputs/phase-11/grep-design-ts-link.log
rg -n "_design/sync-jobs-spec" .claude/skills/aiworkflow-requirements/references/database-schema.md \
  | tee outputs/phase-11/grep-database-schema-link.log

# 5. indexes drift（AC-9）
mise exec -- pnpm indexes:rebuild \
  | tee outputs/phase-11/indexes-rebuild.log
git status --porcelain .claude/skills/aiworkflow-requirements/indexes \
  | tee outputs/phase-11/indexes-drift.log    # 0 行期待
```

## evidence ファイル一覧（DoD）

| ファイル | 期待内容 | 紐づく AC |
| --- | --- | --- |
| typecheck.log | exit 0 | AC-10 |
| vitest-sync-jobs-schema.log | 10 件 PASS | AC-2 / AC-11 |
| vitest-sync-forms-responses.log | 全 PASS | AC-6 |
| vitest-sync-sheets-to-d1.log | 全 PASS | AC-6 |
| grep-default-lock-ttl-absent.log | 0 行 | AC-3 |
| grep-sync-lock-ttl-present.log | 1+ 行 | AC-3 |
| grep-syncjobkind-reexport.log | `export type {` を含む 1+ 行 | AC-4 |
| grep-parse-metrics-json.log | 1+ 行 | AC-5 |
| grep-design-ts-link.log | 2+ 行（§3 / §5） | AC-7 |
| grep-database-schema-link.log | 1+ 行 | AC-8 |
| indexes-rebuild.log | 正常終了 | AC-9 |
| indexes-drift.log | 0 行 | AC-9 |

## 失敗時の分岐

| evidence | 期待外 | 対応 |
| --- | --- | --- |
| grep-default-lock-ttl-absent.log | 1+ 行 | Phase 7 差し替え漏れ → 該当箇所修正 |
| indexes-drift.log | 1+ 行 | drift を本 PR に含めて再実行 |
| vitest-* | fail | Phase 7 ロールバック判定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| evidence | outputs/phase-11/*.log | 上記一覧 |
| ドキュメント | outputs/phase-11/main.md | evidence サマリ + AC × ファイル対応表 |
| メタ | artifacts.json | Phase 11 を completed に更新 |

## 統合テスト連携

- 本 Phase が NON_VISUAL タスクの最終統合テスト
- 全 evidence が期待通りなら Phase 12 へ進む

## 完了条件

- [ ] evidence ファイルが 12 件以上揃っている
- [ ] AC × evidence 対応表が `main.md` に記述
- [ ] 期待外結果が 0 件、または対応記録が残っている

## 次 Phase

- 次: 12（実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback）
- 引き継ぎ事項: evidence ログ一式
- ブロック条件: 期待外結果が解消できない
