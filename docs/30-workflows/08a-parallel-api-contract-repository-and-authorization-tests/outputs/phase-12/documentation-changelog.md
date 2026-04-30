# Documentation Changelog — 08a (Phase 1〜12)

本タスクで作成・更新したドキュメントとコード変更の一覧。

## 1. タスク仕様書（`docs/30-workflows/08a-.../`）

| 種別 | パス | 状態 |
| --- | --- | --- |
| メタ | `artifacts.json` | 更新（taskType=implementation / visualEvidence=NON_VISUAL / phase-11〜12 partial） |
| メタ | `outputs/artifacts.json` | 追加（root artifacts parity） |
| index | `index.md` | 既存 |
| phase-01 | `phase-01.md` | 既存 |
| phase-02 | `phase-02.md` | 既存 |
| phase-03 | `phase-03.md` | 既存 |
| phase-04 | `phase-04.md` | 既存 |
| phase-05 | `phase-05.md` | 既存 |
| phase-06 | `phase-06.md` | 既存 |
| phase-07 | `phase-07.md` | 既存 |
| phase-08 | `phase-08.md` | 既存 |
| phase-09 | `phase-09.md` | 既存 |
| phase-10 | `phase-10.md` | 既存 |
| phase-11 | `phase-11.md` | 既存 |
| phase-12 | `phase-12.md` | 既存 |
| phase-13 | `phase-13.md` | 既存 |

## 2. outputs/（新規作成）

```
outputs/
├── phase-01/main.md
├── phase-02/main.md
├── phase-02/test-architecture.mmd
├── phase-02/test-directory-layout.md
├── phase-03/main.md
├── phase-04/main.md
├── phase-04/verify-suite-matrix.md
├── phase-05/main.md
├── phase-05/runbook.md
├── phase-05/test-signatures.md
├── phase-06/main.md
├── phase-07/main.md
├── phase-07/ac-matrix.md
├── phase-08/main.md
├── phase-09/main.md
├── phase-10/main.md
├── phase-11/main.md
├── phase-11/evidence/test-run.log
├── phase-11/evidence/coverage-report.txt
├── phase-11/evidence/ci-workflow.yml
├── phase-12/main.md                                # 本 phase
├── phase-12/implementation-guide.md                # 本 phase
├── phase-12/system-spec-update-summary.md          # 本 phase
├── phase-12/documentation-changelog.md             # 本 phase
├── phase-12/unassigned-task-detection.md           # 本 phase
├── phase-12/skill-feedback-report.md               # 本 phase
└── phase-12/phase12-task-spec-compliance-check.md  # 本 phase
```

合計: phase 1〜11 で 21 ファイル + phase-12 で 7 ファイル = **28 ファイル**

## 3. コード（apps/api/src/__tests__/, 新規）

| ファイル | 行数 |
| --- | --- |
| `apps/api/src/__tests__/authz-matrix.test.ts` | 79 |
| `apps/api/src/__tests__/brand-type.test.ts`   | 38 |
| `apps/api/src/__tests__/invariants.test.ts`   | 132 |

## 4. specs への変更

本 PR では **specs 本体は無変更**。提案差分は `system-spec-update-summary.md` を参照。

## 4-a. formalized unassigned task

| パス | 状態 |
| --- | --- |
| `docs/30-workflows/unassigned-task/UT-08A-01-public-use-case-coverage-hardening.md` | 新規。AC-6 coverage 未達の High 課題を正式未タスク化 |

## 5. CI / インフラ系

| パス | 状態 |
| --- | --- |
| `outputs/phase-11/evidence/ci-workflow.yml` | placeholder（09b で `.github/workflows/api-tests.yml` として配置） |
| root `vitest.config.ts` / `apps/api/package.json` scripts | `--root=../.. --config=vitest.config.ts` で 85/80 coverage を実行 |

## Path Drift Correction (2026-04-30)

本 task root のディレクトリ位置を以下のとおり昇格補正した。

| 項目 | 値 |
| --- | --- |
| 旧パス | `docs/30-workflows/02-application-implementation/08a-parallel-api-contract-repository-and-authorization-tests/` |
| 新パス | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` |
| 補正理由 | legacy-ordinal-family-register の task root path drift 補正手順に基づく昇格（07b と同等パターン）。`docs/30-workflows/<task-slug>/` を正本とする運用に整合 |
| 影響範囲 | aiworkflow-requirements skill の `indexes/resource-map.md` / `indexes/quick-reference.md` / `references/task-workflow-active.md` を新パスに同期済み |
| 補正日 | 2026-04-30 |
