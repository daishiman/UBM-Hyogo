# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-sync-forms-d1-legacy-umbrella-001 |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新（Phase 12 5 必須タスク + Task 6 compliance check） |
| Wave | umbrella close-out |
| Mode | docs-only / NON_VISUAL |
| 作成日 | 2026-04-30 |
| 前 Phase | 11 (手動 smoke / NON_VISUAL) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed_with_followups |

## 目的

Phase 12 必須 5 タスク（実装ガイド作成 / システム仕様書更新 / ドキュメント更新履歴 / 未タスク検出レポート / スキルフィードバックレポート）＋ Task 6（phase12-task-spec-compliance-check）を `outputs/phase-12/` に揃える。本タスクは docs-only / spec_created のため、workflow root の `metadata.workflow_state` は `spec_created` のまま据え置く。レビューで stale 正本掃除・逆リンク反映・skill 改善の follow-up が必要と判定された場合、`phases[12].status` は `completed_with_followups` とする。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜこのタスクが必要かを、日常生活の例え話から説明する
- [ ] 「旧仕様書を消さずに『これは古いやり方の入口です』と札を立てて、新しい入口に案内する作業」のニュアンスを必ず含める
- [ ] 専門用語を使う場合は、その場で短く説明する（例: legacy umbrella → 「古い包括タスク」、stale → 「古くなって使えなくなった」）
- [ ] 何を作るかより先に、困りごと（旧 UT-09 を見て新規実装してしまうリスク）と解決後の状態を書く

### Part 2: 開発者・技術者レベル

- [ ] legacy umbrella pattern の定義と適用条件
- [ ] stale → canonical のマッピング表（旧 UT-09 → 03a / 03b / 04c / 09b）
- [ ] 責務移管の根拠（Forms API への正規化 / `sync_jobs` 同種 job 排他 / WAL 非前提 retry/backoff）
- [ ] 検証コマンド（`audit-unassigned-tasks.js` / `rg` / `git diff --stat`）と期待出力
- [ ] specs 由来の用語解説（中学生レベル補助説明とともに併記）:
  - `sync_jobs`（specs/03-data-fetching.md）: 同期ジョブの実行履歴を保持する D1 テーブル。`status='running'` 行が同種 job 排他の鍵
  - cursor pagination（specs/03-data-fetching.md）: Forms API レスポンス分割取得の続きを示すしおり（途中再開に必要）
  - current response（specs/03-data-fetching.md）: 同一 `responseId` の最新 1 件を「現在の回答」として resolve するロジック
  - consent snapshot（specs/03-data-fetching.md / specs/01-api-schema.md）: response 取得時点の `publicConsent` / `rulesConsent` を凍結保存する仕組み

## 実行タスク（Phase 12 必須 6 タスク）

### Task 12-1: 実装ガイド作成 → `outputs/phase-12/implementation-guide.md`

**Part 1（中学生レベル）必須内容**:

- 例え話: 「旧 UT-09 という古い入口があって、そこを通ると古い地図（Sheets API）が渡される。新しい地図（Forms API）はもう別の 4 つの入口（03a/03b/04c/09b）に置いてある。だから古い入口に『ここはもう使いません。新しい入口はこちら』と札を立てる作業をする」
- 困りごと: 古い入口をうっかり使うと、二重地図になって迷子になる
- 解決後: 古い入口は説明書としては残るが、実装の出発点ではなくなる

**Part 2（技術者レベル）必須内容**:

- legacy umbrella pattern の定義: 「過去に提案された実装タスクが、現行仕様への分解（split）によって direct implementation 不要となった場合、当該タスクを supersede / migrate として閉じ、責務移管マッピングと耐障害要件の継承先を明記する設計パターン」
- stale → canonical マッピング表:

  | 旧 UT-09 の責務 | canonical 移管先 | 実体 |
  | --- | --- | --- |
  | schema 取得・schema upsert | 03a | `forms.get` / `schema_questions` upsert / `POST /admin/sync/schema` |
  | response 取得・cursor pagination・current response | 03b | `forms.responses.list` / `member_responses` / `member_identities` / `member_status` |
  | 手動同期 endpoint | 04c | `/admin/sync/schema` / `/admin/sync/responses` admin gate |
  | cron schedule / pause / resume / runbook | 09b | Workers Cron Triggers / release runbook / incident response |
  | sync 監査 | 02c | `sync_jobs` table（旧 `sync_audit` ではない） |

- 責務移管の根拠:
  - Forms API 正規化: `forms.get` + `forms.responses.list` で section / question / consent を直接取得でき、Sheets 列固定の脆弱性を回避
  - `sync_jobs` 同種 job 排他: `status='running'` の existing row があれば 409 Conflict を返す guard。WAL 非前提 D1 で二重起動を防ぐ
  - WAL 非前提: D1 は `PRAGMA journal_mode=WAL` を保証しないため、`SQLITE_BUSY` retry/backoff・短い transaction・batch-size 制限を 03a/03b の異常系として継承
- 検証コマンド + 期待出力:

  ```bash
  node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
    --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
  # => current violations: 0

  rg -n "ut-09-sheets-to-d1-cron-sync-job" docs/30-workflows/unassigned-task
  # => 0 hit（stale 明記の文脈以外）

  rg -n "^(<<<<<<<|=======|>>>>>>>)" .claude/skills/aiworkflow-requirements/references
  # => 0 hit
  ```

### Task 12-2: システム仕様書更新 → `outputs/phase-12/system-spec-update-summary.md`

> **更新対象 specs（明示）**:
> - `docs/00-getting-started-manual/specs/01-api-schema.md`（Forms schema / `responseId` / `publicConsent` / `rulesConsent` の正本）
> - `docs/00-getting-started-manual/specs/03-data-fetching.md`（sync_jobs / cursor pagination / current response / consent snapshot 契約）
> - `docs/00-getting-started-manual/specs/08-free-database.md`（D1 / WAL 非対応 / PRAGMA 制約 / free-tier baseline）
>
> 本タスクは docs-only であり specs を「直接書き換えない」が、本タスク仕様書 → specs 参照リンクの整合性確認と、specs 側に legacy umbrella close-out への参照行を追記すべきか否かの判定対象として上記 3 ファイルを明示する。

**Step 1-A**: タスク完了記録

- 完了タスクセクション追加（`spec_created` ステータスで）
- LOGS.md × 2（`task-specification-creator` / `aiworkflow-requirements`）に記録
- topic-map.md に「legacy umbrella close-out」エントリを追加

**Step 1-B**: 実装状況テーブル更新

- 該当行を `spec_created`（`completed` ではない）として記録

**Step 1-C**: 関連タスクテーブル更新

- 03a / 03b / 04c / 09b の `関連タスク` テーブルに `task-sync-forms-d1-legacy-umbrella-001` を upstream/legacy-umbrella として追記

**Step 2 条件付き**: aiworkflow-requirements references のスキャンと更新指示

```bash
# Sheets API 残存記述を検出
rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit" \
  .claude/skills/aiworkflow-requirements/references
```

- hit があれば、`outputs/phase-12/system-spec-update-summary.md` に「対象 file / 該当行 / 更新指示（Forms API へ書き換え or stale 明記）」を表で列挙する
- hit が 0 ならその旨を記録して N/A とする

### Task 12-3: ドキュメント更新履歴 → `outputs/phase-12/documentation-changelog.md`

- 追加: `docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/index.md` / `artifacts.json` / `phase-01.md`〜`phase-13.md` / `outputs/phase-{01..13}/*`
- 更新: `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` への「legacy umbrella as canonical entry」明記（必要時）
- 削除: なし（stale `ut-09-sheets-to-d1-cron-sync-job/` は最初から作らない方針）

### Task 12-4: 未タスク検出レポート → `outputs/phase-12/unassigned-task-detection.md`（**0 件でも出力必須**）

| ソース | 確認項目 | 検出結果 |
| --- | --- | --- |
| 元仕様 §2.3 スコープ外 | 新 sync 実装 / 03a 等 Phase 実行 / commit/PR | 0 件（明示的にスコープ外として close） |
| Phase 3/10 レビュー MINOR | 残課題 | （実行時記入） |
| Phase 11 ウォークスルー | 発見事項 Note 分類 | （実行時記入） |
| コードコメント TODO/FIXME | 本タスクで触る範囲 | 0 件（docs-only） |

> 0 件であっても本ファイルは必ず出力する（Phase 12 必須）。

### Task 12-5: スキルフィードバックレポート → `outputs/phase-12/skill-feedback-report.md`（**改善点なしでも出力必須**）

| 観点 | 記録内容 |
| --- | --- |
| テンプレート改善 | legacy umbrella pattern を `task-specification-creator/references/` に専用テンプレ化する候補の有無 |
| ワークフロー改善 | `audit-unassigned-tasks.js` に「legacy umbrella 検出フラグ」を追加する候補の有無 |
| ドキュメント改善 | `docs/30-workflows/unassigned-task/` の README に「legacy umbrella としての close-out 手順」を追加する候補の有無 |

> 改善点なしでも本ファイルは必ず出力する（Phase 12 必須）。

### Task 12-6: phase12-task-spec-compliance-check → `outputs/phase-12/phase12-task-spec-compliance-check.md`

7 ファイルの実体存在を validator で確認:

| # | ファイル | 存在 | 由来 Task |
| --- | --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | （記入） | Phase 12 本体 |
| 2 | `outputs/phase-12/implementation-guide.md` | （記入） | Task 12-1 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | （記入） | Task 12-2 |
| 4 | `outputs/phase-12/documentation-changelog.md` | （記入） | Task 12-3 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | （記入） | Task 12-4 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | （記入） | Task 12-5 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | （記入） | Task 12-6 |

不変条件 #1〜#15 の compliance check（PASS 断言は 7 ファイル実体 + same-wave sync 証跡が揃ってからのみ許可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase 12 必須タスク定義 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-tasks-guide.md` | Task 6 詳細 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` | 7 ファイル checklist |
| 必須 | `docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-11.md` | NON_VISUAL evidence bundle 起点 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/` | Step 2 スキャン対象 |

## 実行手順

### ステップ 1: Task 12-1（実装ガイド Part 1 + Part 2）作成
### ステップ 2: Task 12-2（spec update Step 1-A/B/C + 条件付き Step 2）実行
### ステップ 3: Task 12-3（documentation-changelog）作成
### ステップ 4: Task 12-4（未タスク検出 0 件でも出力）作成
### ステップ 5: Task 12-5（skill-feedback 改善点なしでも出力）作成
### ステップ 6: Task 12-6（compliance check）で 7 ファイル実体を validator 確認
### ステップ 7: artifacts.json の `phases[12].status` を実態に合わせて更新（**`metadata.workflow_state` は `spec_created` のまま据え置き**）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR body に Phase 12 7 ファイルへのリンクを記載 |
| same-wave 03a/03b/04c/09b | 関連タスクテーブルへの追記を同波 sync |

## 多角的チェック観点（不変条件）

- 不変条件 #1〜#15 を `phase12-task-spec-compliance-check.md` で全項目チェック
- 特に **#5**（apps/web → D1 直接禁止）/ **#6**（GAS prototype 昇格しない）/ **#1**（schema 固定しすぎない）/ **#10**（無料枠）を本タスクで担保

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md（Part 1 + Part 2） | 12 | completed | Task 12-1 |
| 2 | system-spec-update-summary.md（Step 1-A/B/C + 条件付き Step 2） | 12 | completed_with_followups | Task 12-2。stale/current 掃除と逆リンクは follow-up 化 |
| 3 | documentation-changelog.md | 12 | completed | Task 12-3 |
| 4 | unassigned-task-detection.md | 12 | completed | Task 12-4（0 件でも） |
| 5 | skill-feedback-report.md | 12 | completed | Task 12-5（改善なしでも） |
| 6 | phase12-task-spec-compliance-check.md | 12 | completed_with_followups | Task 12-6 |
| 7 | artifacts.json: phases[12].status を `completed_with_followups` に更新（workflow_state は据え置き） | 12 | completed | spec_created 保持 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-12/main.md` | Phase 12 サマリ |
| ドキュメント | `outputs/phase-12/implementation-guide.md` | Part 1 + Part 2 |
| ドキュメント | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/B/C + 条件付き Step 2 |
| ドキュメント | `outputs/phase-12/documentation-changelog.md` | 追加 / 更新 / 削除 |
| ドキュメント | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも出力必須 |
| ドキュメント | `outputs/phase-12/skill-feedback-report.md` | 改善点なしでも出力必須 |
| ドキュメント | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 7 ファイル + 不変条件 #1〜#15 |
| メタ | `artifacts.json` | `phases[12].status = completed_with_followups`、`metadata.workflow_state = spec_created` のまま据え置き |

## 完了条件

- [x] 7 ファイル実体配置（`main.md` + 6 補助）
- [x] `unassigned-task-detection.md` を 0 件でも出力
- [ ] `skill-feedback-report.md` を改善点なしでも出力
- [ ] `phase12-task-spec-compliance-check.md` で 7 ファイル全 PASS / 不変条件 #1-#15 PASS
- [ ] `artifacts.json` の `phases[12].status` のみ completed に更新
- [ ] **`metadata.workflow_state` を `completed` に書き換えていない（`spec_created` のまま）**
- [ ] same-wave sync（03a/03b/04c/09b の関連タスクテーブル更新）完了

## タスク100%実行確認【必須】

- 全実行タスク（7 件）completed
- 7 ファイル実体配置確認（`ls outputs/phase-12/*.md` で 7 ファイル）
- workflow_state が `spec_created` のままであることを `jq` で確認:

  ```bash
  jq -r '.metadata.workflow_state' \
    docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/artifacts.json
  # => spec_created
  ```

## 次 Phase への引き渡し

- 次: 13 (PR 作成 / **user 承認必須**)
- 引き継ぎ事項: Phase 12 7 ファイル / 責務移管マッピング / 検証コマンド結果
- ブロック条件: 7 ファイルの 1 つでも欠落、または `metadata.workflow_state` が誤って `completed` に書き換えられた場合は Phase 13 に進まない
