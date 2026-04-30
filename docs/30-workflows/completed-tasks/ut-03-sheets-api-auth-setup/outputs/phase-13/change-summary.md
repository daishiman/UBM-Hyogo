# Phase 13: 変更ファイル一覧

## 新規作成

```
docs/30-workflows/ut-03-sheets-api-auth-setup/
├── index.md
├── artifacts.json
├── phase-01.md … phase-13.md (13 files)
└── outputs/
    ├── phase-01/main.md
    ├── phase-02/main.md
    ├── phase-03/main.md
    ├── phase-03/alternatives.md
    ├── phase-04/test-strategy.md
    ├── phase-05/implementation-runbook.md
    ├── phase-06/failure-cases.md
    ├── phase-07/ac-matrix.md
    ├── phase-08/main.md
    ├── phase-08/before-after.md
    ├── phase-09/main.md
    ├── phase-09/free-tier-estimation.md
    ├── phase-09/secret-hygiene.md
    ├── phase-10/go-no-go.md
    ├── phase-11/main.md
    ├── phase-11/manual-smoke-log.md
    ├── phase-11/link-checklist.md
    ├── phase-12/main.md
    ├── phase-12/implementation-guide.md
    ├── phase-12/system-spec-update-summary.md
    ├── phase-12/documentation-changelog.md
    ├── phase-12/unassigned-task-detection.md
    ├── phase-12/skill-feedback-report.md
    ├── phase-12/phase12-task-spec-compliance-check.md
    ├── phase-13/main.md
    ├── phase-13/local-check-result.md
    ├── phase-13/change-summary.md
    └── phase-13/pr-template.md
```

## 既存ファイルの変更

- `packages/integrations/google/src/index.ts`: `sheets` namespace export を追加
- `packages/integrations/google/src/sheets/auth.ts`: Service Account JSON key + Web Crypto JWT bearer auth 実装
- `packages/integrations/google/src/sheets/index.ts`: Sheets auth export
- `packages/integrations/google/src/sheets/auth.test.ts`: auth / cache / redact unit tests
- `packages/integrations/google/src/sheets/auth.contract.test.ts`: public contract tests

## 件数

- 新規: 計 43 ファイル（index.md + artifacts.json + phase-01〜13.md + outputs 28 ファイル）
- 変更: 0
- 削除: 0
