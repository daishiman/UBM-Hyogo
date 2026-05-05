# Phase 11: NON_VISUAL evidence 収集（grep / typecheck / vitest / indexes diff / 1-hop 到達）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 11 / 13 |
| Phase 名称 | NON_VISUAL evidence 収集 |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | 10 (レビュー + 整合確認) |
| 次 Phase | 12 (実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback) |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |

## 第 0 セクション: 実装区分の宣言

`visualEvidence=NON_VISUAL` のためスクリーンショットは作成しない。Phase 4 で設計した verify suite A〜H を実コマンドとして実行し、結果を `outputs/phase-11/` 配下にログとして保存する。

## 目的

AC-1〜AC-8 の証跡を実コマンド出力として `outputs/phase-11/` 配下に保存する。

## 実行コマンド一覧（必須）

```bash
WORKFLOW="docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001"
mkdir -p "$WORKFLOW/outputs/phase-11"

# A. ADR / owner 表 / 参照リンク（AC-1 / AC-2 / AC-3）
rg -n "ADR-001 runtime SSOT 配置" docs/30-workflows/_design/sync-jobs-spec.md \
  | tee "$WORKFLOW/outputs/phase-11/grep-adr-001-present.log"
rg -n "Decision" docs/30-workflows/_design/sync-jobs-spec.md \
  | tee "$WORKFLOW/outputs/phase-11/grep-adr-decision.log"
rg -n "sync-jobs-schema\\.ts" docs/30-workflows/_design/sync-shared-modules-owner.md \
  | tee "$WORKFLOW/outputs/phase-11/grep-owner-row-present.log"
rg -n "sync-shared-modules-owner" docs/30-workflows/_design/sync-jobs-spec.md \
  | tee "$WORKFLOW/outputs/phase-11/grep-owner-link-from-spec.log"
rg -n "_shared/sync-jobs-schema" docs/30-workflows/_design/sync-jobs-spec.md \
  | tee "$WORKFLOW/outputs/phase-11/grep-runtime-ssot-link.log"

# B. contract test（AC-4）
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test \
  | tee "$WORKFLOW/outputs/phase-11/vitest-sync-jobs-schema.log"
rg -n "SYNC_JOB_TYPES" apps/api/src/jobs/_shared/sync-jobs-schema.test.ts \
  | tee "$WORKFLOW/outputs/phase-11/grep-test-job-types.log"
rg -n "SYNC_LOCK_TTL_MS|600000|600_000" apps/api/src/jobs/_shared/sync-jobs-schema.test.ts \
  | tee "$WORKFLOW/outputs/phase-11/grep-test-lock-ttl.log"
rg -n "email|assertNoPii|PII" apps/api/src/jobs/_shared/sync-jobs-schema.test.ts \
  | tee "$WORKFLOW/outputs/phase-11/grep-test-pii-rejection.log"

# C. database-schema.md（AC-5）
rg -n "_design/sync-jobs-spec" .claude/skills/aiworkflow-requirements/references/database-schema.md \
  | tee "$WORKFLOW/outputs/phase-11/grep-database-schema-link.log"

# D. unassigned-task ステータス（AC-6）
rg -n "^- status:" docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md \
  | tee "$WORKFLOW/outputs/phase-11/grep-unassigned-status.log"

# E. indexes drift（AC-7）
mise exec -- pnpm indexes:rebuild \
  | tee "$WORKFLOW/outputs/phase-11/indexes-rebuild.log"
git status --porcelain .claude/skills/aiworkflow-requirements/indexes \
  | tee "$WORKFLOW/outputs/phase-11/indexes-drift.log"

# F. typecheck / lint（AC-8）
mise exec -- pnpm typecheck | tee "$WORKFLOW/outputs/phase-11/typecheck.log"
mise exec -- pnpm lint | tee "$WORKFLOW/outputs/phase-11/lint.log"

# G. 1-hop 到達（governance L-003）
rg -n "sync-shared-modules-owner|_shared/sync-jobs-schema" docs/30-workflows/_design/sync-jobs-spec.md \
  | tee "$WORKFLOW/outputs/phase-11/grep-1hop-reach.log"

# H. secret-hygiene（governance L-003）
rg -n "API_TOKEN|SECRET|password" docs/30-workflows/_design/sync-jobs-spec.md docs/30-workflows/_design/sync-shared-modules-owner.md \
  | tee "$WORKFLOW/outputs/phase-11/grep-secret-hygiene.log"
```

## evidence ファイル一覧（DoD）

| ファイル | 期待内容 | 紐づく AC |
| --- | --- | --- |
| grep-adr-001-present.log | 1+ 行 | AC-1 |
| grep-adr-decision.log | 1+ 行 | AC-1 |
| grep-owner-row-present.log | 1+ 行 | AC-2 |
| grep-owner-link-from-spec.log | 3+ 行 | AC-3 |
| grep-runtime-ssot-link.log | 4+ 行 | AC-3 |
| vitest-sync-jobs-schema.log | 全件 PASS | AC-4 / AC-8 |
| grep-test-job-types.log | 1+ 行 | AC-4 |
| grep-test-lock-ttl.log | 1+ 行 | AC-4 |
| grep-test-pii-rejection.log | 1+ 行 | AC-4 |
| grep-database-schema-link.log | 1+ 行 | AC-5 |
| grep-unassigned-status.log | `status: resolved` を含む | AC-6 |
| indexes-rebuild.log | 正常終了 | AC-7 |
| indexes-drift.log | 0 行 | AC-7 |
| typecheck.log | exit 0 | AC-8 |
| lint.log | exit 0 | AC-8 |
| grep-1hop-reach.log | 各 1+ 行 | AC-3 / governance |
| grep-secret-hygiene.log | 0 行 | governance |

## 失敗時の分岐

| evidence | 期待外 | 対応 |
| --- | --- | --- |
| grep-adr-001-present.log | 0 行 | Phase 6 戻り |
| grep-owner-row-present.log | 0 行 | Phase 6 戻り |
| vitest-sync-jobs-schema.log | fail | Phase 7 戻り |
| grep-test-* | 0 行 | Phase 7 で contract test 補強 |
| grep-database-schema-link.log | 0 行 | Phase 7 で `database-schema.md` 更新 |
| grep-unassigned-status.log | unassigned のまま | Phase 8 戻り |
| indexes-drift.log | 1+ 行 | drift を本 PR に含めて再実行 |
| typecheck.log / lint.log | exit !=0 | 自動修復 |
| grep-secret-hygiene.log | 1+ 行 | secret 文字列除去 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| evidence | outputs/phase-11/*.log | 上記一覧 |
| ドキュメント | outputs/phase-11/main.md | evidence サマリ + AC × ファイル対応表 |
| メタ | artifacts.json | Phase 11 を completed に更新（実行時） |

## 統合テスト連携

- 本 Phase が NON_VISUAL タスクの最終統合テスト
- 全 evidence が期待通りなら Phase 12 へ進む

## 完了条件

- [ ] evidence ファイルが 17 件以上揃っている
- [ ] AC × evidence 対応表が `main.md` に記述
- [ ] 期待外結果が 0 件、または対応記録が残っている

## 次 Phase

- 次: 12（実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback）
- 引き継ぎ事項: evidence ログ一式
- ブロック条件: 期待外結果が解消できない

## 実行タスク

- Phase 4 の verify suite A〜H を実行する
- `outputs/phase-11/` に raw log を保存する
- `main.md` / `manual-smoke-log.md` / `link-checklist.md` に NON_VISUAL evidence summary を記録する

## 参照資料

- `docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/phase-04.md`
- `docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/outputs/phase-11/`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`

## 依存 Phase 参照

- Phase 1: `outputs/phase-01/main.md`
- Phase 2: `outputs/phase-02/main.md`
- Phase 5: `outputs/phase-05/main.md`
- Phase 6: `outputs/phase-06/main.md`
- Phase 7: `outputs/phase-07/main.md`
- Phase 8: `outputs/phase-08/main.md`
- Phase 9: `outputs/phase-09/main.md`
- Phase 10: `outputs/phase-10/main.md`
