# Phase 12 Task Spec Compliance Check

| Check | Status | Evidence |
| --- | --- | --- |
| Phase 1-13 files exist | PASS | `phase-01.md` ... `phase-13.md` and `outputs/phase-*` present |
| Phase 12 strict outputs exist | PASS | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| Root / outputs artifacts parity | PASS | `artifacts.json` and `outputs/artifacts.json` synchronized |
| Implementation files present | PASS | `scripts/release/`, `.github/workflows/release-create.yml`, `docs/runbooks/release-create.md` |
| aiworkflow SSOT sync | PASS | `references/release-runbook.md`, `task-workflow-active.md`, `resource-map.md`, `quick-reference.md` |
| User-gated mutation boundary | PASS | `workflow_dispatch` dry-run only; apply creates draft release through tag push or explicit local approval |
| Phase 11 local evidence | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING | `dry-run-release-notes.md` and `lint-evidence.log` captured; `gh-release-view.json` remains user-gated because it requires GitHub Release mutation |

## Part 2 必須5項目チェック (C12P2-1 〜 C12P2-5)

| ID | Item | Result | Evidence |
| --- | --- | --- | --- |
| C12P2-1 | TypeScript / スキーマ型定義 | PASS | `implementation-guide.md` Part 2 C12P2-1 セクション（GitHub Actions 入力契約 + テンプレート placeholder） |
| C12P2-2 | API シグネチャ | PASS | `implementation-guide.md` API Signatures + 発火条件式 (`refs/tags/v*` push / `workflow_dispatch` dry-run) |
| C12P2-3 | 使用例 | PASS | `implementation-guide.md` Usage セクション (dry-run / draft apply 2例) |
| C12P2-4 | エラー処理 | PASS | `implementation-guide.md` Error Handling テーブル (exit 64 NO-GO 条件) |
| C12P2-5 | 設定可能パラメータ・定数 | PASS | `implementation-guide.md` Parameters テーブル + `artifacts.json.metadata` 必須フィールド宣言 |

## L1〜L4 Legacy Stub Gate

| Gate | Item | Result | Evidence |
| --- | --- | --- | --- |
| L1 | unassigned-task の consumed/formalized 状態明記 | PASS | `unassigned-task-detection.md` で `task-09c-github-release-tag-automation-001` の consumed 宣言 |
| L2 | canonical pointer 配置 | PASS | `docs/30-workflows/unassigned-task/task-09c-github-release-tag-automation-001.md` 冒頭に canonical pointer |
| L3 | legacy-ordinal-family-register への登録要否判定 | N/A | source は unassigned-task で旧 ordinal root 不在のため登録不要（他の 09c 系列と同パターン） |
| L4 | unassigned-task-quality-standards 命名規則準拠 | PASS | `task-09c-{semantic-name}-001.md` 形式準拠 |

## 4 Conditions

| Condition | Result |
| --- | --- |
| 矛盾なし | PASS |
| 漏れなし | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| 整合性あり | PASS |
| 依存関係整合 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` の根拠: 同一wave同期はすべて完了し、残るのは GitHub Release mutation の user-gated runtime ステップのみ（Phase 13）。
