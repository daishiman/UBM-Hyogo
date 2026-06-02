# Phase 12 — ドキュメント同期（Task D: admin サイドバー Google Form 回答編集リンク）

## 概要

本フェーズは Task D（admin サイドバー nav に Google Form の回答編集画面への外部リンクを 1 項目追加する）の
ドキュメント同期フェーズである。実装は親 PR #1064 / commit `745c95115`（親ワークフロー
`member-publish-recovery-form-ops-and-admin-link`）で **dev へ landed 済み**であり、本サイクルは
landed 実装の正本記述（`verify_existing`）として、`apps/web` の新規差分を発生させずに strict 7 成果物を整える。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `task-d-admin-google-form-responses-link` |
| parentWorkflow | `member-publish-recovery-form-ops-and-admin-link` |
| workflow_state | `implemented_local_evidence_captured` |
| taskType | `implementation` |
| visualEvidence | **VISUAL**（admin サイドバー nav に項目を 1 件追加する UI 変更を含む） |
| implementationCategory | `standard` |
| landed | dev へマージ済み（親 PR #1064 / commit `745c95115`） |
| apps 差分 | `git diff origin/dev...HEAD -- apps/web` は空（本サイクルで新規差分なし） |

## strict 7 成果物一覧

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | 本ファイル（Phase 12 概要・strict 7 一覧・user-gated 境界） |
| 2 | `outputs/phase-12/implementation-guide.md` | 中学生レベル概念説明 + 技術者向け実装ガイド |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements への反映サマリ |
| 4 | `outputs/phase-12/documentation-changelog.md` | 本 workflow で追加した docs 一覧 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出結果（必須 0 件の結論） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | skill feedback と同一 wave 反映結果 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | CI gate `verify-phase12-compliance` 対象の遵守チェック（9 見出し SSOT） |

## 実装の事実（landed）

| 区分 | パス | 役割 |
| --- | --- | --- |
| 定数 | `apps/web/src/lib/constants/form.ts` | `FORM_RESPONSES_EDIT_URL`（外部リンク URL の唯一の正本） |
| nav config | `apps/web/src/components/shell/shell-config.ts` | union に `form-responses` + `external?` フラグ + `buildAdminGroup` 項目追加 |
| icon | `apps/web/src/components/shell/icons.tsx` | `form-responses` の SVG path（網羅型 Record で型強制） |
| 描画 | `apps/web/src/components/shell/SidebarNavItem.tsx` | external 分岐 `<a target="_blank" rel="noopener noreferrer">` + `↗` + sr-only「（外部リンク）」+ active 除外 |

label は「Form回答」。

## 受け入れ条件との対応

| AC | 条件 | strict 7 / 証跡での扱い |
| --- | --- | --- |
| AC-D1 | 別タブで Form 編集 URL を開く | implementation-guide §使用例・SidebarNavItem.spec.tsx |
| AC-D2 | `target="_blank"` + `rel="noopener noreferrer"`（不変条件 #7） | implementation-guide §タブナビング・SidebarNavItem.spec.tsx |
| AC-D3 | href は `FORM_RESPONSES_EDIT_URL` 定数経由 | implementation-guide §なぜ定数化・form-responses.spec.ts |
| AC-D4 | `↗` + sr-only 判別 + active 対象外 | implementation-guide §external 設計・shell-config.spec.ts |

## user-gated 境界

| 操作 | 状態 |
| --- | --- |
| 本サイクルでの apps/web 実コード変更 | なし（landed 済みの正本記述のみ） |
| commit / push / PR 作成 | user-gated（CONST_002）。本サイクルでは実行しない |
| staging screenshot 取得 | user-gated（admin 認証必須）。`pending` として保留 |
| GitHub Issue state 変更 | user-gated。本サイクルでは行わない |

主証跡は `apps/web` の jsdom render unit / 純関数 unit / 定数 unit（自動テスト）であり、
screenshot は staging 認証必須のため two-tier evidence（local test = 主証跡 / screenshot = pending）とする。

## 完了条件

- strict 7 成果物 7 ファイルがすべて `outputs/phase-12/` に存在すること。
- `workflow_state=implemented_local_evidence_captured` / `taskType=implementation` / `visualEvidence=VISUAL` が
  artifacts.json と本ファイルで一致していること。
- commit / push / PR / staging screenshot が user-gated として保留されていることが明記されていること。
