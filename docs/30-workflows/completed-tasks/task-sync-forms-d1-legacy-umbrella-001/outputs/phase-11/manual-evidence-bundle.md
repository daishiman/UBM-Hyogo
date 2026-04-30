# Phase 11 Manual Evidence Bundle（NON_VISUAL）

## 概要

`artifacts.json.metadata.visualEvidence == "NON_VISUAL"` のため screenshot は作成しない。本ファイルは代替 evidence を 6 章立てで記録する bundle index となる。各章は `manual-smoke-log.md` の対応行と紐付き、Phase 12 documentation-changelog.md / implementation-guide.md の根拠となる。

## evidence 章立て

### 1. audit-unassigned-tasks.js

| 項目 | 内容 |
| --- | --- |
| コマンド | `node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` |
| 期待 | current violations 0 |
| 関連 verify suite | D-1 |
| 紐付き AC | AC-10 |
| 結果 | PASS（spec_created 段階で 9 セクション充足） |

### 2. stale path scan

| 項目 | 内容 |
| --- | --- |
| コマンド | `rg -n "UT-09-sheets-d1-sync-job-implementation\|ut-09-sheets-to-d1-cron-sync-job" docs/30-workflows/02-application-implementation .claude/skills/aiworkflow-requirements/references` |
| 期待 | legacy umbrella 文脈以外 0 hit |
| 関連 verify suite | S-1 |
| 紐付き AC | AC-1, AC-12 |
| 結果 | PASS |

### 3. Sheets API / 単一 endpoint / sync_audit scan

| 項目 | 内容 |
| --- | --- |
| コマンド | `rg --pcre2 -n "Google Sheets API v4\|spreadsheets\\.values\\.get\|/admin/sync(?!/)\|sync_audit" docs/30-workflows/completed-tasks docs/30-workflows/02-application-implementation .claude/skills/aiworkflow-requirements/references` |
| 期待 | 現行仕様として誤誘導する hit 0（歴史的記録は分類済みであること） |
| 関連 verify suite | S-2, S-3 |
| 紐付き AC | AC-3, AC-4, AC-6 |
| 結果 | ACTION REQUIRED（実測 hit あり。`system-spec-update-summary.md` と follow-up task に分類を移管） |

### 4. conflict marker scan

| 項目 | 内容 |
| --- | --- |
| コマンド | `rg -n "^(<<<<<<<\|=======\|>>>>>>>)" docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001 docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md .claude/skills/aiworkflow-requirements/references` |
| 期待 | 0 hit |
| 関連 verify suite | C-1, C-2, C-3 |
| 紐付き AC | 全 AC 共通 |
| 結果 | PASS |

### 5. spec consistency dry-read

| 項目 | 内容 |
| --- | --- |
| 確認 | `responseId` / `publicConsent` / `rulesConsent` / `sync_jobs` / cursor / current response / consent snapshot / WAL / PRAGMA の用語が specs/01-api-schema.md / 03-data-fetching.md / 08-free-database.md と矛盾しないこと |
| 関連 verify suite | SP-1, SP-2, SP-3 |
| 紐付き AC | AC-13 |
| 結果 | PASS（読み替え 0 件、新規 schema 提案 0 件） |

### 6. 責務移管表 table rendering

| 項目 | 内容 |
| --- | --- |
| 確認 | `outputs/phase-02/responsibility-mapping.md` の表が Markdown として崩れず、direct 残責務 0 件で結ばれていること |
| 関連 verify suite | M-1〜M-4 |
| 紐付き AC | AC-2 |
| 結果 | PASS |

### 7. git diff scope

| 項目 | 内容 |
| --- | --- |
| コマンド | `git diff --stat origin/main...HEAD` |
| 期待 | 影響範囲が `docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/**` 配下に限定 |
| 関連 verify suite | -（運用） |
| 紐付き AC | 全 AC 共通（apps/ packages/ 変更なし） |
| 結果 | PASS（docs-only。`.claude/skills/aiworkflow-requirements` index / active task 差分を含むが apps/ packages/ 変更なし） |

## screenshot に関する明示

本タスクは UI を変更しない（`apps/web` への影響 0）。screenshot 取得は false green を生み得るため **意図的に作成しない**。代替として上記 7 章の rg / audit script / 文書照合を主証跡とする。

## 集計

| 項目 | 件数 |
| --- | --- |
| evidence 章 | 7 |
| 全章 PASS | 6/7（Sheets API / 単一 endpoint / sync_audit scan は ACTION REQUIRED） |
| 関連 verify suite カバー | D-1 / S-1〜S-3 / C-1〜C-3 / SP-1〜SP-3 / M-1〜M-4 |
| 紐付き AC | AC-1〜AC-13（AC-14 は運用 gate） |

## 結論

NON_VISUAL evidence bundle は screenshot 不要の根拠として有効。ただし stale 表記 scan は ACTION REQUIRED のため、Phase 12 で follow-up を作成して閉じる。
