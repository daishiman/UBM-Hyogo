# Phase 12: ドキュメント（Documentation / close-out）

> `implementation_mode: verify_existing`。実装は PR #1064 / commit 745c95115 で dev に landed 済み。
> 本タスクは CREATE モード（spec 作成）のため、本 Phase 仕様書は **実行時に何を作るかの責務を記述**する。
> `outputs/phase-12/*.md` は strict 7 として実体生成済み。Phase 12 は spec 作成だけで閉じず、close-out evidence package まで同一 cycle で揃える。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 12 |
| 名称 | ドキュメント更新（close-out） |
| 種別 | close-out |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | Phase 11（手動テスト検証） |

## 目的

close-out の 6 成果物（implementation-guide / system-spec-update / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-compliance-check）の責務と完了条件を記述し、`03-data-fetching.md` 反映 SLA 追記の記録方針を固定する。

## 実行タスク

- 視覚証跡（VISUAL だが screenshot user-gated）を記述する。
- 6 成果物（Task 12-1〜12-6）それぞれの責務と完了条件を記述する。
- Task 12-2 で内部型 N/A 判定 + `03-data-fetching.md` 反映 SLA 追記の spec doc 更新記録を明示する。
- Task 12-4 で 0 件出力必須 + screenshot user-gated 判定を記述する。

## 参照資料

- `apps/web/src/components/public/ReflectionTimingNote.tsx`
- `docs/00-getting-started-manual/specs/03-data-fetching.md`
- 親 workflow: `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/`
- 兄弟タスク Task A / Task B（member-publish-recovery 系列）

## 成果物

- 本 Phase 12 close-out 文書（6 成果物の責務記述 / 視覚証跡セクション / spec doc 更新記録方針）。

## 視覚証跡セクション

本タスクは **NON_VISUAL ではなく VISUAL**。ただし `/profile` 認証必須かつ CONST_002 により runtime screenshot は **user-gated（deferred）**。証跡の主ソースは `ReflectionTimingNote.spec.tsx` 7 ケース PASS（Phase 11 参照）。

## 6 成果物の責務（実体生成済み）

### Task 12-1 implementation-guide.md
- Part 1 中学生レベル例え話: 「フォームを出してから掲示板に貼られるまで時間がかかる」（フォーム回答→同期→公開反映の遅延を比喩で説明）。
- Part 2 技術詳細: `ReflectionTimingNoteProps`（`surface`/`lastSyncAt?` 等の props・型）、データソース `GET /public/stats` の `lastSync.responseSyncFinishedAt`、`formatJstDateTime` 定数、surface 別文言定数。
- 完了条件: Part 1 / Part 2 の 2 部構成で props・型・データソース・定数を網羅。

### Task 12-2 system-spec-update
- Step 1-A: 完了記録 + `LOGS.md`×2（workflow-local / global）+ topic-map 反映。
- Step 1-B: 実装状況テーブル（5 ファイルの new/modified）。
- Step 1-C: 関連タスク（親 member-publish-recovery / 兄弟 Task A・B）。
- Step 2: 新規インターフェース判定 = `ReflectionTimingNoteProps` は **public component 内部型**で aiworkflow システム仕様の新規 interface ではない → **N/A 判定可**。ただし `03-data-fetching.md` 反映 SLA 追記は **spec doc 更新として記録**。
- 完了条件: Step 1-A〜1-C 記録 + Step 2 で内部型 N/A 判定と spec doc 更新記録の両方を明示。

### Task 12-3 documentation-changelog.md
- workflow-local 変更ブロックと global skill sync ブロックを **別ブロック**で記載。
- 完了条件: 2 ブロック分離で記述。

### Task 12-4 unassigned-task-detection.md
- **0 件でも出力必須**。current / baseline を分離。
- Phase 10 の MINOR 候補 = runtime screenshot user-gated を未タスク化するか判定（CONST_002 由来の deferred は未タスクではなく user-gated として扱う方針を記録）。
- 完了条件: 0 件時も current/baseline 分離で出力し、screenshot deferred の未タスク化判定を記載。

### Task 12-5 skill-feedback-report.md
- **改善点なしでも出力必須**。
- 完了条件: 改善点 0 件でも明示的に出力。

### Task 12-6 phase12-task-spec-compliance-check.md
- root evidence（canonical 9 見出し + Phase 11 evidence inventory テーブル）。
- 完了条件: root 直下に compliance check を配置し 9 見出しを充足。

## 完了条件

- [x] 6 成果物それぞれの責務と完了条件を記述済み。
- [x] Task 12-2 で内部型 N/A 判定 + 03-data-fetching.md 反映 SLA 追記の spec doc 更新記録を明示済み。
- [x] Task 12-4 で 0 件出力必須 + screenshot user-gated 判定を記述済み。
- [x] VISUAL だが screenshot user-gated（deferred）である点を視覚証跡セクションで明記済み。
- [x] outputs/phase-12 strict 7 を実体生成済み。
