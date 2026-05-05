# Phase 4: verify suite 設計（typecheck / vitest / grep / indexes drift / 1-hop 到達 grep）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | verify suite 設計 |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | 3 (実装計画) |
| 次 Phase | 5 (既存 contract test カバレッジ棚卸し) |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |

## 第 0 セクション: 実装区分の宣言

本 Phase は verify suite の設計のみで実体ファイルを変更しない。Phase 9 / 11 で実行する検証コマンドと期待結果を確定する。

## 目的

AC-1〜AC-8 を 1:1 で検証する verify suite を設計し、各検証コマンドの期待結果と evidence ファイル名を確定する。

## verify suite 一覧

### A. ADR / owner 表 / 参照リンク（AC-1 / AC-2 / AC-3）

| # | コマンド | 期待結果 | 紐づく AC | evidence ファイル |
| --- | --- | --- | --- | --- |
| A-1 | `rg -n "ADR-001 runtime SSOT 配置" docs/30-workflows/_design/sync-jobs-spec.md` | 1+ 行 | AC-1 | grep-adr-001-present.log |
| A-2 | `rg -n "Decision" docs/30-workflows/_design/sync-jobs-spec.md` | 1+ 行（ADR 内） | AC-1 | grep-adr-decision.log |
| A-3 | `rg -n "sync-jobs-schema\\.ts" docs/30-workflows/_design/sync-shared-modules-owner.md` | 1+ 行 | AC-2 | grep-owner-row-present.log |
| A-4 | `rg -n "sync-shared-modules-owner" docs/30-workflows/_design/sync-jobs-spec.md` | 3+ 行（§2 / §3 / §5 + ADR Links）| AC-3 | grep-owner-link-from-spec.log |
| A-5 | `rg -n "_shared/sync-jobs-schema" docs/30-workflows/_design/sync-jobs-spec.md` | 既存 + ADR Links 分で 4+ 行 | AC-3 | grep-runtime-ssot-link.log |

### B. contract test（AC-4）

| # | コマンド | 期待結果 | 紐づく AC | evidence ファイル |
| --- | --- | --- | --- | --- |
| B-1 | `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test` | 全件 PASS（Phase 5 棚卸しで網羅性確認後） | AC-4 / AC-8 | vitest-sync-jobs-schema.log |
| B-2 | `rg -n "SYNC_JOB_TYPES" apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` | 1+ 行（canonical 値断言） | AC-4 | grep-test-job-types.log |
| B-3 | `rg -n "SYNC_LOCK_TTL_MS" apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` | 1+ 行（600000 値断言） | AC-4 | grep-test-lock-ttl.log |
| B-4 | `rg -n "rejects email key in metrics_json\\|PII\\|assertNoPii" apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` | 1+ 行 | AC-4 | grep-test-pii-rejection.log |

### C. database-schema.md 整合（AC-5）

| # | コマンド | 期待結果 | 紐づく AC | evidence ファイル |
| --- | --- | --- | --- | --- |
| C-1 | `rg -n "_design/sync-jobs-spec" .claude/skills/aiworkflow-requirements/references/database-schema.md` | 1+ 行 | AC-5 | grep-database-schema-link.log |

### D. unassigned-task ステータス（AC-6）

| # | コマンド | 期待結果 | 紐づく AC | evidence ファイル |
| --- | --- | --- | --- | --- |
| D-1 | `rg -n "^- status: resolved\\|^- status: closed" docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md` | 1 行 | AC-6 | grep-unassigned-status.log |
| D-2 | `rg -n "^- status: unassigned" docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md` | 0 行 | AC-6 | grep-unassigned-status-absent.log |

### E. indexes drift（AC-7）

| # | コマンド | 期待結果 | 紐づく AC | evidence ファイル |
| --- | --- | --- | --- | --- |
| E-1 | `mise exec -- pnpm indexes:rebuild` | 正常終了 | AC-7 | indexes-rebuild.log |
| E-2 | `git status --porcelain .claude/skills/aiworkflow-requirements/indexes` | 0 行 | AC-7 | indexes-drift.log |

### F. typecheck / lint（AC-8）

| # | コマンド | 期待結果 | 紐づく AC | evidence ファイル |
| --- | --- | --- | --- | --- |
| F-1 | `mise exec -- pnpm typecheck` | exit 0 | AC-8 | typecheck.log |
| F-2 | `mise exec -- pnpm lint` | exit 0 | AC-8 | lint.log |

### G. 1-hop 到達 grep（governance L-003）

| # | コマンド | 期待結果 | 紐づく AC | evidence ファイル |
| --- | --- | --- | --- | --- |
| G-1 | `rg -n "sync-shared-modules-owner\\|_shared/sync-jobs-schema" docs/30-workflows/_design/sync-jobs-spec.md` | 各 1+ 行（1-hop 到達） | AC-3 | grep-1hop-reach.log |

### H. secret-hygiene grep（governance L-003）

| # | コマンド | 期待結果 | 紐づく AC | evidence ファイル |
| --- | --- | --- | --- | --- |
| H-1 | `rg -n "API_TOKEN\\|SECRET\\|password" docs/30-workflows/_design/sync-jobs-spec.md docs/30-workflows/_design/sync-shared-modules-owner.md` | 0 行 | governance | grep-secret-hygiene.log |

## 失敗時の分岐

| evidence | 期待外 | 対応 |
| --- | --- | --- |
| A-1〜A-5 | 0 行 | Phase 6 で再追記 |
| B-1 | fail | Phase 7 で test 修正 / Phase 5 棚卸しに戻る |
| B-2〜B-4 | 0 行 | Phase 7 で contract test 補強 |
| C-1 | 0 行 | Phase 7 で database-schema.md 更新 |
| D-1 / D-2 | 期待外 | Phase 8 で unassigned-task 再更新 |
| E-2 | 1+ 行 | drift を本 PR に含めて再実行（CONST_007） |
| F-1 / F-2 | exit !=0 | CLAUDE.md PR 自律フローの自動修復ループ（最大 3 回） |
| G-1 | 1-hop 未達 | Phase 6 でリンク追記 |
| H-1 | 1+ 行 | secret 文字列を除去（drift 0 件まで） |

## DoD

- [ ] verify suite A〜H が AC-1〜AC-8 を網羅している
- [ ] 各コマンドに期待結果と evidence ファイル名が紐づく
- [ ] 失敗時の分岐が定義されている

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | verify suite 一覧 / AC × evidence 対応表 |
| メタ | artifacts.json | Phase 4 を completed に更新（実行時） |

## 統合テスト連携

- 設計のみ。Phase 9 で実コマンド実行、Phase 11 で evidence 化

## 完了条件

- [ ] verify suite が AC を網羅
- [ ] evidence ファイル名が一意
- [ ] 失敗時分岐が網羅

## 次 Phase

- 次: 5（既存 contract test カバレッジ棚卸し）
- 引き継ぎ事項: verify suite B-2〜B-4 の grep パターン
- ブロック条件: AC × evidence の対応に欠落

## 実行タスク

- AC-1〜AC-8 に対応する検証コマンドを定義する
- Phase 11 に保存する evidence file 名を固定する
- indexes rebuild / drift check の扱いを決める

## 参照資料

- `docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/phase-01.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.github/workflows/verify-indexes.yml`

## 依存 Phase 参照

- Phase 1: `outputs/phase-01/main.md`
- Phase 2: `outputs/phase-02/main.md`
- Phase 3: `outputs/phase-03/main.md`
