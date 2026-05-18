# Phase 12 — ドキュメント・未タスク検出 close-out

`outputs/phase-12/` に strict 7 files を生成する。本ファイル自身は summary index としてのみ機能し、詳細は各 sub file に書く。

## strict 7 files（canonical）

| # | file | 責務 |
| --- | --- | --- |
| 1 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル概念説明・例え話）+ Part 2（type / API / hooks / a11y 詳細）+ 視覚証跡（Phase 11 screenshot 参照） |
| 2 | `outputs/phase-12/system-spec-update-summary.md` | `docs/00-getting-started-manual/specs/` 影響評価。本 task は既存仕様の運用詳細のため update なし / spec_created を記録 |
| 3 | `outputs/phase-12/documentation-changelog.md` | Step 1-A〜1-C + Step 2 の判定を個別記録。workflow-local sync と global skill sync を別ブロックで記述 |
| 4 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも出力必須。候補: `resolveTagQueue` helper 削除 / queue dashboard / dlq 専用画面 |
| 5 | `outputs/phase-12/skill-feedback-report.md` | 改善点なしでも出力。template / workflow / docs 観点で記録 |
| 6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 1-11 各成果物の compliance チェック結果（root evidence） |
| 7 | `outputs/phase-12/main.md` | サマリー（5 行以内）と上記 6 ファイルへのリンク |

## Task 12-1: implementation-guide.md

### Part 1（中学生レベル）

例: 「学校の落とし物センターに似ています。誰かが拾った物（提案タグ）が箱に集まり、先生（管理者）が箱を一つずつ開けて『これは持ち主に返してOK（confirmed）』『誰の物か分からないから返さない（rejected）』と判断します。」

### Part 2（技術者）

- `TagsQueueResolveDrawer` の props と return type
- `useAdminMutation` の trigger payload と response 型
- `tagQueueResolveBodySchema` の discriminatedUnion 構造
- a11y 実装方針（dialog / focus trap / ESC / return focus）

### 視覚証跡

Phase 11 の 5 screenshot を canonical 名で参照。

## Task 12-2: system-spec-update-summary.md

- Step 1-A: 仕様作成タスク記録（aiworkflow-requirements 側 LOGS.md / task-specification-creator 側 LOGS.md / topic-map に追記）
- Step 1-B: 実装状況テーブルに `admin-tags-queue-resolver-drawer = spec_created`（実装は別 wave）を記録し、runtime PASS / completed とは書かない
- Step 1-C: 関連タスクテーブル更新（step-04-tags-assignment の元 spec.md ステータスを `superseded_by_admin-tags-queue-resolver-drawer` に）
- Step 2: 新規 interface なし → N/A

## Task 12-4: 未タスク検出候補

| ID | 内容 |
| --- | --- |
| UT-DRAWER-FU-01 | `apps/web/src/lib/admin/api.ts` の `resolveTagQueue` helper 削除（UI 層 caller 0 になった時点で） |
| UT-DRAWER-FU-02 | tag queue dashboard / 件数監視（depth / dlq） |
| UT-DRAWER-FU-03 | dlq item の専用処理 UI（read-only viewer + ops escalation） |

## 完了条件

- 上記 7 ファイルが `outputs/phase-12/` に存在
- `outputs/artifacts.json` の `phase12_completed: true` と root `artifacts.json` が一致
- `outputs/phase-12/main.md` から他 6 ファイルへの相対リンクが全て resolve 可能
