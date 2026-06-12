# Documentation changelog

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

本サイクルで追加・更新するドキュメント全量。Step 1（完了記録）を 1-A / 1-B / 1-C に分解し、Step 2（新規インターフェース）を個別に記録する（[Feedback BEFORE-QUIT-003]: workflow-local 同期と global skill sync を別ブロックで管理）。

## Step 1-A — workflow root ドキュメント（本仕様書サイクルで追加）

| path | 内容 |
|------|------|
| `docs/30-workflows/admin-meetings-card-ux-clarity/index.md` | workflow index（frontmatter `workflow_state: implemented_local_evidence_captured`） |
| `docs/30-workflows/admin-meetings-card-ux-clarity/artifacts.json` | gate metadata（Gate-A/B passed、Gate-C pending） |
| `docs/30-workflows/admin-meetings-card-ux-clarity/shared-context.md` | SSOT（真因 / スコープ / CSS 契約 / DOM 改修 / DoD） |
| `outputs/phase-1/phase-1.md` / `spec-extraction-map.md` | スコープ / 既存実装インベントリ / route-state-view owner |
| `outputs/phase-2/phase-2.md` | 設計詳細（CSS 契約 + DOM 改修） |
| `outputs/phase-3/phase-3.md` | AC / 依存関係 / 変更マップ |
| `outputs/phase-4/phase-4.md` | 実装ガイド本体 |
| `outputs/phase-5/phase-5.md` | 実装順序・依存グラフ |
| `outputs/phase-6/phase-6.md` | ローカル動作確認手順 |
| `outputs/phase-7/phase-7.md` | エラーハンドリング |
| `outputs/phase-8/phase-8.md` | 観測性 |
| `outputs/phase-9/phase-9.md` | セキュリティ / 不変条件 / grep gate |
| `outputs/phase-10/phase-10.md` | リリース計画 / rollback |
| `outputs/phase-11/phase-11.md` | Evidence 取得仕様（screenshot-plan mode VISUAL・5 件） |

## Step 1-B — Phase 12 strict 7（本仕様書サイクルで追加）

| path | 内容 |
|------|------|
| `outputs/phase-12/main.md` | Phase 12 集約 entry |
| `outputs/phase-12/implementation-guide.md` | 実装ハンドブック（Part 1 中学生 / Part 2 技術者・CONST_005 5 項目 + 視覚証跡） |
| `outputs/phase-12/system-spec-update-summary.md` | 正本 spec 影響（Step 1 N/A / Step 2 N/A） |
| `outputs/phase-12/documentation-changelog.md` | 本ファイル |
| `outputs/phase-12/unassigned-task-detection.md` | current 0 件 + baseline OOS-1〜OOS-4 |
| `outputs/phase-12/skill-feedback-report.md` | 3 観点 feedback + L-AMCUX-* |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings compliance |

## Step 1-C — Phase 13（本仕様書サイクルで追加）

| path | 内容 |
|------|------|
| `outputs/phase-13/phase-13.md` | PR 作成手順（base=dev・commit/push/PR/staging/screenshot 全 user-gated） |

## global skill sync（workflow-local とは別ブロック・[BEFORE-QUIT-003]）

> **本サイクルで実施済み。staging screenshot / deploy / commit / push / PR のみ user-gated。**

| path | 内容 | 本サイクル状態 |
|------|------|------|
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 本 workflow root 1 行追加 | done |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 同上 | done |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | entry 追加 | done |
| `.claude/skills/aiworkflow-requirements/references/workflow-admin-meetings-card-ux-clarity-artifact-inventory.md` | 新規作成 | done |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | dated entry 追記 | done |
| `.claude/skills/aiworkflow-requirements/indexes/{topic-map.md,keywords.json}` | `pnpm indexes:rebuild` 反映 | done |
| `docs/30-workflows/LOGS.md` | 本 workflow root 1 行追加 | n/a（該当ファイルなし） |

## 実装サイクルで追加・更新した実コード

| path | 内容 |
|------|------|
| `apps/web/src/styles/globals.css` | 未定義 BEM クラス CSS 実体化 + 汎用 primitive 新設（`var(--ubm-*)` 経由） |
| `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 4 セクションのサブカード化 + 出席者行リスト化 + 人数表示 |
| `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` | heading wrapper（任意） |
| `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx` | DR-1〜DR-3 構造ケース追加 |
| `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` | TL-1 構造ケース追加 |

## 実装サイクルで取得済み

| path | 内容 |
|------|------|
| `outputs/phase-11/evidence/*.txt` | local validation summary / typecheck / lint / vitest / verify:tokens / hex-grep / apps-api-diff / testid-contract |
| `outputs/phase-11/screenshots/*.png` | local Playwright fixture screenshot 5 枚（desktop/mobile・折りたたみ/展開/出席者） |
| `outputs/phase-11/local-visual-review.md` | local screenshot の視覚レビュー表 |

## 実装サイクルで未取得（user-gated）

| path | 内容 |
|------|------|
| `outputs/phase-11/screenshots/*.png` | staging production-equivalent screenshot 5 枚（user-gated） |

## Step 2 — 新規インターフェース

**N/A**（本タスクは `implemented_local_evidence_captured` だが、新規 API endpoint / 関数 export / 型 export を追加しない。新設する `.admin-detail-section*` / `.admin-attendee-row*` は **CSS クラスであり公開 API インターフェースではない**。詳細は `system-spec-update-summary.md` Step 2）。

## 正本 spec 更新

**N/A**（詳細は `system-spec-update-summary.md` Step 1）。

## 実コードの changelog

git 履歴で管理し本ファイルには列挙しない（skill `references/phase12-skill-feedback-promotion.md` 規約）。
