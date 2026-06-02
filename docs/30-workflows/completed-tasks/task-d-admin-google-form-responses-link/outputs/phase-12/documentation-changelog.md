# Phase 12 — ドキュメント変更ログ（Task D: admin サイドバー外部リンク）

本 workflow `task-d-admin-google-form-responses-link` で追加したドキュメント一覧。
実コード（`apps/web` shell）は親 PR #1064 / commit `745c95115` で landed 済みのため、本サイクルの追加は
**docs / workflow artifacts のみ**（apps 差分なし）。

## workflow root

| ファイル | 区分 | 内容 |
| --- | --- | --- |
| `index.md` | root | workflow 概要・AC・対象ファイル・Phase 構成 |
| `artifacts.json` | root | workflow メタ（status / gates / phases / dependencies） |
| `phase-12-compliance.md` | root | 互換スタブ（正本は `outputs/phase-12/phase12-task-spec-compliance-check.md`） |
| `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | skill 正本 | 認証必須 VISUAL の two-tier evidence パターンを追記 |
| `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | skill 正本 | Shell nav 外部リンク項目パターンを追記 |
| `.claude/skills/aiworkflow-requirements/references/workflow-task-d-admin-google-form-responses-link-artifact-inventory.md` | skill 正本 | Task D artifact inventory / contract / lessons を新規登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | skill index | Task D 入口を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | skill index | Task D リソースマップを追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | skill 正本 | Active workflow 入口を追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260601-task-d-admin-google-form-responses-link.md` | skill changelog | 同期履歴を追加 |
| `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` | system spec | admin nav 14 item / external nav 契約を同期 |
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | system spec | AdminSidebar `Form回答` item / active 除外を同期 |

## Phase 宣言ファイル（root）

| ファイル | Phase | 状態 |
| --- | --- | --- |
| `phase-1.md` | 1 要件定義 | completed |
| `phase-2.md` | 2 設計 | completed |
| `phase-3.md` | 3 設計レビュー | completed |
| `phase-4.md` | 4 テスト作成 | completed |
| `phase-5.md` | 5 実装手順 | completed |
| `phase-6.md` | 6 テスト拡充 | completed |
| `phase-7.md` | 7 カバレッジ確認 | completed |
| `phase-8.md` | 8 リファクタリング | completed |
| `phase-9.md` | 9 品質保証 | completed |
| `phase-10.md` | 10 最終レビュー（導線サマリ） | completed |
| `phase-11.md` | 11 証跡取得（種別判定・導線宣言） | completed |
| `phase-13.md` | 13 PR 作成 | blocked / user-gated |

## outputs

| ファイル | Phase | 内容 |
| --- | --- | --- |
| `outputs/phase-1/requirements.md` | 1 | 要件詳細 |
| `outputs/phase-11/canonical-paths.json` | 11 | Phase 11 evidence canonical path validator manifest |
| `outputs/phase-12/main.md` | 12 | Phase 12 概要・strict 7 一覧・user-gated 境界 |
| `outputs/phase-12/implementation-guide.md` | 12 | 中学生レベル説明 + 技術者向け実装ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | 12 | aiworkflow-requirements 反映サマリ（API/DB 契約変更なし） |
| `outputs/phase-12/documentation-changelog.md` | 12 | 本ファイル |
| `outputs/phase-12/unassigned-task-detection.md` | 12 | 未タスク検出（必須 0 件） |
| `outputs/phase-12/skill-feedback-report.md` | 12 | skill feedback と同一 wave 反映結果 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 12 | 遵守チェック（CI gate 9 見出し SSOT） |

## 実コード（landed 済み・本サイクルでの新規差分なし）

> 参考: 親 PR #1064 / commit `745c95115` で dev へ反映済み。本サイクルでは変更しない。

| パス | 区分 |
| --- | --- |
| `apps/web/src/lib/constants/form.ts` | 定数（`FORM_RESPONSES_EDIT_URL`） |
| `apps/web/src/components/shell/shell-config.ts` | nav config（`external?` + 項目追加） |
| `apps/web/src/components/shell/icons.tsx` | icon（`form-responses` SVG path） |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | 描画（external 分岐） |
| `apps/web/src/lib/constants/__tests__/form-responses.spec.ts` | 定数 spec |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 描画 spec（3 test） |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | nav config spec（external 検証） |

## 反映なし（明示）

- API endpoint / D1 migration / Google Form schema ドキュメント: 変更なし。
- aiworkflow-requirements の `api-endpoints` / `database-implementation-core`: 追記なし（契約変更なしのため）。

## 完了条件

- 本 workflow で追加した workflow root / Phase 宣言 / outputs の docs が網羅されていること。
- landed 済み実コードが「本サイクルで新規差分なし」と明示されていること。
- API/DB/Form schema ドキュメントへの反映がないことが明示されていること。
- skill 正本・system spec・indexes への同一 wave 反映が列挙されていること。
