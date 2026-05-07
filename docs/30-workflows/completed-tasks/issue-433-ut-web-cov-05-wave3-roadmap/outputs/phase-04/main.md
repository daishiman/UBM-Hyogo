# Phase 4 Main

Status: `COMPLETED`

Wave-2 5 タスク（`ut-web-cov-01〜04` および `ut-08a-01-public-use-case-coverage-hardening`）の `phase-12/skill-feedback-report.md` / `implementation-guide.md` / `documentation-changelog.md` を `grep` で `NON_VISUAL` / `integration` / `delegation` / `未` / `残` / `backlog` / `e2e` 抽出し、`wave2-backlog-inventory.md` に集約した。

## 抽出方針

- 各 wave-2 タスクの `outputs/phase-12/` 配下を `grep -niE` で対象キーワードヒットさせ、ヒット行の文脈を Read で確認。
- NON_VISUAL coverage task で integration / e2e への委譲が示唆された箇所と、Phase 12 で「coverage 数値未取得」「pre-existing timeout risk」など後続 wave 申し送りが残されている項目を抽出。
- inventory は最低 5 件、最大 15 件で構成。

## キーファイル

- `docs/30-workflows/completed-tasks/ut-08a-01-public-use-case-coverage-hardening/outputs/phase-12/implementation-guide.md` (line 22, 107: coverage 実数値未取得・pre-existing timeout 申し送り)
- `docs/30-workflows/completed-tasks/ut-web-cov-01-admin-components-coverage/outputs/phase-12/skill-feedback-report.md` (NON_VISUAL governance: VISUAL/runtime separation)
- `docs/30-workflows/completed-tasks/ut-web-cov-02-public-components-coverage/outputs/phase-12/skill-feedback-report.md` (implemented-local / NON_VISUAL の Phase 13 PR ゲート扱い)
- `docs/30-workflows/completed-tasks/ut-web-cov-04-admin-lib-ui-primitives-coverage/outputs/phase-12/skill-feedback-report.md` (Phase 11 reserved evidence)
- `docs/30-workflows/completed-tasks/ut-web-cov-03-auth-fetch-lib-coverage/outputs/phase-12/implementation-guide.md` (oauth-client 想定 path 通過 / fallback 系の追測対象)

## 結果

inventory rows: 7 件（詳細は `wave2-backlog-inventory.md`）。
