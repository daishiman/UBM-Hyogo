# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 direction reconciliation（task-ut09-direction-reconciliation-001） |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| 前 Phase | 11 (手動 smoke / 検証) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| タスク分類 | docs-only / direction-reconciliation（close-out / docs sync） |
| taskType | docs-only |
| docsOnly | true |
| visualEvidence | NON_VISUAL |
| user_approval_required | false（Phase 13 で true） |
| Issue | #94 (CLOSED — 仕様書化のみ。再オープンしない) |
| タスク状態 | blocked（reconciliation 文書化のみ。コード撤回 / migration 削除は別タスク） |

## 目的

Phase 1〜11 で確定した reconciliation 結論（base case = 案 a / current Forms 分割方針へ寄せる）と
30 種思考法レビュー / 5 文書同期チェック / 運用ルール 2 件 / open question 6 件を、運用ドキュメント・正本仕様
（`.claude/skills/aiworkflow-requirements/references/`）・LOGS / topic-map・GitHub Issue #94（CLOSED のまま）に反映し、
task-specification-creator skill の **必須 5 タスク** + same-wave sync ルール + 二重 ledger 同期を完了させる。

本タスクは **docs-only / NON_VISUAL** であり、コード撤回・migration 削除・Cloudflare Secret 削除は **本タスクに含めない**。
それらの実作業は Phase 12 で発行する unassigned-task として別タスク化し、後続 wave で順次解消する。

## 必須 5 タスク（task-specification-creator skill 準拠 / 0 件でも全タスク出力必須）

1. **実装ガイド作成（Part 1 中学生 + Part 2 技術者の 2 パート構成）** — `outputs/phase-12/implementation-guide.md`
   - docs-only タスクのため「実装ガイド」は **reconciliation 実行手順ガイド** として記述する。
   - 「コードの書き方」ではなく「方針統一の進め方」「撤回 / 移植マッピングの読み方」「5 文書同期チェックの実施手順」を扱う。
2. **システム仕様書更新（Step 1-A / 1-B / 1-C + 条件付き Step 2）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴作成** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

加えて **Phase 12 自身の compliance check** を `outputs/phase-12/phase12-task-spec-compliance-check.md` に出力する。

## 実行タスク

- Task 12-1: reconciliation 実行手順ガイドを Part 1（中学生）+ Part 2（技術者）の 1 ファイルに統合作成。
- Task 12-2: system-spec-update-summary を Step 1-A / 1-B / 1-C + 条件付き Step 2 で構造化記述。docs-only のため Step 2 は **採用方針 A 維持時は不要 / B 採用承認時のみ広範囲更新リストとして発火** する条件分岐を明示。
- Task 12-3: documentation-changelog を `scripts/generate-documentation-changelog.js` 相当のフォーマットで出力。
- Task 12-4: unassigned-task-detection を 0 件でも必ず出力（Phase 3 の open question 6 件を formalize）。
- Task 12-5: skill-feedback-report を改善点なしでも必ず出力。
- Task 12-6: phase12-task-spec-compliance-check を実施。
- Task 12-7: same-wave sync（workflow LOG / SKILL.md ×2 / topic-map / active guide）完了。
- Task 12-8: 二重 ledger（root `artifacts.json` と `outputs/artifacts.json`）同期。
- Task 12-9: `validate-phase-output.js` と `verify-all-specs.js` 実行・全 PASS 確認。
- Task 12-10: GitHub Issue #94 は CLOSED のまま、コメントでクローズアウト記録のみ追加（`gh issue comment 94` / 再オープン禁止）。
- Task 12-11: 「docs-only / NON_VISUAL / コード撤回は別タスク」境界を全成果物で再確認。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 仕様詳細 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 落とし穴対策 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md | 完了判定リスト |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | 文書化ガイド |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/1-B/1-C / Step 2 / same-wave sync |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-01.md | 真の論点 / Ownership 宣言 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-02.md | reconciliation 設計 / 撤回 / 移植マッピング |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-03.md | base case 結論 / open question / 運用ルール 2 件 |
| 必須 | docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md | UT-09 reconciliation 原典 spec |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | current 方針正本 |
| 必須 | docs/30-workflows/LOGS.md | task-level LOGS 同期対象 |
| 必須 | CLAUDE.md | 不変条件 / scripts/cf.sh / op 参照 / ブランチ戦略 |
| 参考 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-12.md | 構造リファレンス |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-12.md | 旧 UT-09 系 Phase 12 |

---

## 実行手順

Task 12-1〜12-5 と compliance check を順に実行し、root / outputs の artifacts ledger、LOGS / SKILL / topic-map 同期、docs-only close-out ルールを同一 wave で確認する。

## タスク 1: reconciliation 実行手順ガイド作成（`outputs/phase-12/implementation-guide.md`）

### Part 1（中学生レベル / 日常の例え話必須）

docs-only タスクのため、「実装」を「方針を 1 つに揃える話し合いの段取り」として例え話で説明する。3 つ以上の例え話を含めること。

- 全体導入: 「学校の文化祭で、A 案（劇）と B 案（合唱）の両方が同時に『正本の出し物』になっていた状態を、先生 1 人の判断で A 案 1 本に揃え直す段取りの話です」
- 例え話 1（二重正本）: 「クラスのアンケート用紙が 2 種類同時に出回っていて、係の人が両方とも『正本』だと思って配ってしまっている状態。誰かが 1 つに決めないと、回答が混ざってしまう」
- 例え話 2（撤回 / 移植）: 「B 案を捨てる時に、B 案で作ってしまった舞台道具のうち『丈夫な釘の打ち方』だけはノートに書き残して、A 案でも使えるようにする。これが移植」
- 例え話 3（5 文書同期チェック）: 「学級会のしおり 5 冊を、机に並べて 1 ページずつ見比べて、内容が食い違っていないか確認する作業」
- 例え話 4（pending と PASS の区別）: 「『まだ走っていないテスト』は『合格』ではなく『未走』。pending と PASS をごちゃ混ぜにすると、走らせていないのに通った扱いになって、後で大事故になる」

### Part 2（技術者レベル）

以下を網羅すること。

- **reconciliation 実行手順（base case = 案 a / 採用 A 維持）**:
  1. Phase 1〜3 の成果物を read-only で再確認する。
  2. `outputs/phase-02/reconciliation-design.md` の撤回対象 5 軸（コード / migration / endpoint / Secret / Cron schedule）と移植対象 5 知見を別タスクの input として登録する（本タスクは登録のみ。実行は別タスク）。
  3. `outputs/phase-02/option-comparison.md` を Phase 9 の 5 文書同期チェックに引き渡す。
  4. `outputs/phase-03/main.md` の base case PASS 判定を Phase 13 承認ゲートの前提として固定する。
  5. unassigned-task-detection.md に open question 6 件 + 追加 4 件を検出する（Task 12-4）。実ファイル起票は `pending_creation` として扱う。
- **採用方針別の発火条件**:
  - A 維持: Step 2（aiworkflow-requirements references の採用更新）は不要だが、既存 references / runtime に Sheets 系 stale contract が残る場合は **stale 撤回として発火**。B-05 / B-10 で撤回・停止する。
  - B 採用（要 user 承認）: Step 2 が **広範囲更新** として発火。`api-endpoints.md` / `database-schema.md` / `deployment-cloudflare.md` / `environment-variables.md / deployment-cloudflare.md` / `topic-map.md` を same-wave 更新する。
- **5 文書同期チェック手順**:
  | 文書 | チェック項目 | A 採用時 | B 採用時 |
  | --- | --- | --- | --- |
  | legacy umbrella spec | 「旧 UT-09 を direct implementation にしない」方針 | 維持 | 更新 |
  | 03a/index.md | Forms schema sync 責務 | 無変更 | Sheets 前提に再設計 |
  | 03b/index.md | Forms response sync responseId 解決 | 無変更 | Sheets 前提に再設計 |
  | 04c/index.md | `/admin/sync*` endpoint 数 / 認可境界 | 2 endpoint 維持 | 単一 endpoint 更新 |
  | 09b/index.md | cron schedule / runbook | Forms 2 経路維持 | Sheets 単一経路 |
- **運用ルール 2 件の運用方法**:
  - ルール 1（staging smoke 表記）: pending = 実機未走行、PASS = 実機走行 + 合否 OK、FAIL = 実機走行 + 合否 NG。Phase 12 / Phase 13 で混同検出時は reconciliation タスクを再起票する。
  - ルール 2（unrelated verification-report 削除）: 本 reconciliation PR には混入させない。検出時は Phase 13 GO/NO-GO を NO-GO とする。
- **docs-only 境界**:
  - 本タスクで `apps/api/src/jobs/sync-sheets-to-d1.ts` 系・migration `sync_locks` / `sync_job_logs` の削除は **行わない**。
  - Cloudflare Secret（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID`）の削除も **行わない**。
  - これらは unassigned-task として登録（Task 12-4）し、別タスクで `bash scripts/cf.sh` 経由で実施する。
- **CLI 規約**: `wrangler` 直接実行禁止 / `bash scripts/cf.sh ...` 経由のみ。本タスクは docs-only のため CLI は基本不要だが、別タスク発火時の規約として明記。
- **1Password vault**: `op://Employee/ubm-hyogo-env/<FIELD>` 固定形式。実値の docs 転記禁止。

### 成果物

- パス: `outputs/phase-12/implementation-guide.md`
- 完了条件:
  - Part 1（例え話 4 つ以上）+ Part 2（reconciliation 手順 / 採用方針別発火条件 / 5 文書同期チェック / 運用ルール 2 件 / docs-only 境界 / CLI 規約 / op vault）が含まれる。
  - 「コード変更は本タスクに含めない」が明示されている。

### セルフチェックリスト

- [ ] Part 1 に 4 つ以上の日常例え話
- [ ] Part 2 に採用方針 A / B の発火条件分岐
- [ ] 5 文書同期チェック表に 5 行
- [ ] 運用ルール 2 件が pending/PASS/FAIL の定義付きで記載
- [ ] docs-only 境界（コード変更は別タスク）が明文化

---

## タスク 2: システム仕様更新（`outputs/phase-12/system-spec-update-summary.md`）

### Step 1-A: 完了タスク記録 + 関連 doc リンク + 変更履歴 + workflow LOG + topic-map

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | UT-09 reconciliation の Phase 1〜13 完了行追記（base case = 案 a 採用 A）|
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴テーブル更新（A 維持でも stale 撤回発火） |
| `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴テーブル更新（実測 PASS と記述レベル PASS を分離） |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | キーワード追加: 「direction-reconciliation」「二重正本解消」「stale 撤回」「runtime kill-switch」「pending と PASS の区別」 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | docs-only reconciliation の stale 撤回境界を追記 |
| 関連 doc リンク | legacy umbrella / 03a / 03b / 04c / 09b / ut-09 root / ut-21 への双方向リンク予定（実追記は B-03/B-04/B-05） |

### Step 1-B: 実装状況テーブル更新（`spec_created` / `merged` 想定）

- `docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md` から本タスクディレクトリへの移動（または link）を記録。
- 統合 README / `docs/30-workflows/LOGS.md` の実装状況テーブルで UT-09 reconciliation を `spec_created` ステータスに更新（コード反映は別タスク化のため `implemented` にしない）。
- 仕様状態の遷移: `blocked` →（reconciliation 完了）→ `spec_created` →（採用方針 A の関連タスク反映後）→ `merged`。

### Step 1-C: 関連タスクテーブル更新予定

- 以下 5 タスクの index.md「下流 / 関連」テーブルに UT-09 reconciliation 完了情報と base case 結論を反映予定:
  - `task-sync-forms-d1-legacy-umbrella-001`
  - `completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/`
  - `02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/`
  - `02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/`
  - `02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/`
- `ut-09-sheets-to-d1-cron-sync-job/index.md` を legacy umbrella 参照に戻す方針を明記（実書き換えは別タスク）。
- `ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md` の「同様に blocked」項目に「UT-09 reconciliation で base case = 案 a 確定」を双方向リンク。

### Step 2（条件付き）: 採用方針別の発火

| 採用方針 | Step 2 発火 | 更新対象 |
| --- | --- | --- |
| A（推奨 / base case） | **stale 撤回として発火** | 現行 Forms 分割方針登録を維持しつつ、`api-endpoints.md` / `deployment-cloudflare.md` / `environment-variables.md` / runtime mount / cron に残る Sheets 系 current 風記述・経路を B-05 / B-10 で撤回・停止する。 |
| B（要 user 承認） | **広範囲発火** | `api-endpoints.md`（`/admin/sync` 単一）/ `database-schema.md`（`sync_locks` + `sync_job_logs`）/ `deployment-cloudflare.md`（Sheets 単一経路 cron）/ `environment-variables.md / deployment-cloudflare.md`（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` 正式採用）/ `topic-map.md` を same-wave 更新。 |

> **重要**: 本タスクは docs-only のため、コード / migration / Secret / wrangler の本体変更は行わない。A 維持時の stale 撤回は B-05 / B-10、B 採用時の広範囲更新は user 承認後の別タスクで実施する。

### 成果物

- パス: `outputs/phase-12/system-spec-update-summary.md`
- 完了条件:
  - Step 1-A / 1-B / 1-C + Step 2（条件分岐の発火条件）が明記され、実ファイル名と一致している。
  - A 採用時に「stale 撤回発火」/ B 採用時に「広範囲更新リスト + user 承認必須」の 2 経路が分離されている。

### セルフチェックリスト

- [ ] Step 1-A の同期対象 7 行（workflow LOG / SKILL×2 / topic-map / active guide / 関連 doc / 変更履歴）
- [ ] Step 1-B で `spec_created` ステータスに固定（`implemented` は使わない）
- [ ] Step 1-C で 5 関連タスクへの双方向リンク
- [ ] Step 2 が A / B 別の発火条件で記述
- [ ] 「書き換え本体は別タスク」が明記

---

## タスク 3: ドキュメント更新履歴作成（`outputs/phase-12/documentation-changelog.md`）

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 新規 | docs/30-workflows/ut09-direction-reconciliation/ | UT-09 reconciliation 仕様書 13 Phase + index + artifacts.json |
| 2026-04-29 | 同期 | docs/30-workflows/LOGS.md | UT-09 reconciliation 完了行（base case = 案 a）|
| 2026-04-29 | 同期 | | 2026-04-29 | 同期 | | 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/SKILL.md | 変更履歴テーブル更新 |
| 2026-04-29 | 同期 | .claude/skills/task-specification-creator/SKILL.md | 変更履歴テーブル更新 |
| 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | direction-reconciliation / 二重正本解消 / Ownership 宣言 |
| 2026-04-29 | リンク追記予定 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | UT-09 reconciliation との双方向リンク |
| 2026-04-29 | リンク追記予定 | docs/30-workflows/02-application-implementation/03a/index.md | UT-09 reconciliation の base case = A を引用 |
| 2026-04-29 | リンク追記予定 | docs/30-workflows/02-application-implementation/03b/index.md | 同上 |
| 2026-04-29 | リンク追記予定 | docs/30-workflows/02-application-implementation/04c/index.md | endpoint 認可境界の current 維持を引用 |
| 2026-04-29 | リンク追記予定 | docs/30-workflows/09b-.../index.md | cron 経路 = Forms 2 endpoint 維持を引用 |
| 2026-04-29 | リンク追記予定 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | legacy umbrella 参照復元方針（書き換えは別タスク）|
| 2026-04-29 | リンク追記予定 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md | base case 結論の共有 |

> 採用方針 A 維持のため、`references/api-endpoints.md` / `database-schema.md` / `deployment-cloudflare.md` / `environment-variables.md / deployment-cloudflare.md` の **書き換えは行わない**（Step 2 stale 撤回発火）。B 採用承認時のみ追加更新行が発生する。

### 成果物

- パス: `outputs/phase-12/documentation-changelog.md`
- 完了条件: 全変更ファイルが網羅され、A 維持で発火しない更新行が「stale 撤回発火」と明示されている。

### セルフチェックリスト

- [ ] 新規 / 同期 / リンク追記 の 3 区分が揃っている
- [ ] 5 関連タスクへのリンク追記行が漏れていない
- [ ] A 維持時に references 書き換えが「stale 撤回発火」と明示

---

## タスク 4: 未割当タスク検出レポート（`outputs/phase-12/unassigned-task-detection.md` / 0 件でも出力必須）

Phase 3 の open question 6 件 + reconciliation 由来の追加検出を一括登録する。

| # | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- | --- |
| 1 | Sheets 実装撤回 PR（`apps/api/src/jobs/sync-sheets-to-d1.ts` 系・`apps/api/src/routes/admin/sync.ts` 単一 endpoint） | 実作業（コード削除） | reconciliation の base case = 案 a に従い撤回 | 新規 unassigned-task: `task-ut09-sheets-impl-withdrawal-001` |
| 2 | D1 migration `sync_locks` / `sync_job_logs` の down + 削除 | 実作業（migration） | `sync_jobs` ledger に統一するため不要化 | 新規 unassigned-task: `task-ut09-sheets-migration-withdrawal-001` |
| 3 | D1 contention mitigation 知見の 03a / 03b / 09b への移植 | 設計 / 仕様更新 | retry/backoff・short transaction・batch-size 制限を AC として継承 | 03a / 03b / 09b の各 application_implementation タスク |
| 4 | 旧 UT-09 root を legacy umbrella 参照に戻す書き換え | 仕様更新 | direct implementation 化記述の撤回 | 新規 unassigned-task: `task-ut09-legacy-umbrella-restore-001` |
| 5 | aiworkflow-requirements references 現行登録の整合確認 | 検証 | A 採用時に stale Sheets 系記述が残っていないか Phase 9 並みのチェックを実施 | 新規 unassigned-task: `task-ut09-references-stale-audit-001` |
| 6 | unrelated verification-report 削除の独立 PR 化 | 実作業 | 本 reconciliation PR に混ぜない方針に従い独立タスクで処理 | 新規 unassigned-task: `task-verification-report-cleanup-001` |
| 7 | Sheets 系 Cloudflare Secret（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID`）の削除 | 実作業（secret） | `bash scripts/cf.sh secret delete ...` 経由 / dev / production 双方 | 新規 unassigned-task: `task-ut09-sheets-secrets-withdrawal-001` |
| 8 | 案 b（Sheets 採用）の将来採用判断時期 | 設計 / 戦略 | wave 後段以降の検討候補 | 本ファイルに保留登録（user 判断 trigger） |
| 9 | Phase 12 compliance の判定ルール統一（pending と PASS の混同防止） | 運用 | 全 task の Phase 12 compliance check に運用ルール 1 を組み込む | task-specification-creator skill 改善（Task 12-5） |

> open question 6 件 + 追加 4 件 = **10 件**。0 件でも出力必須のため「該当なし」セクションは作成しないが、10 件すべてに割り当て先を明示する。

### セルフチェックリスト

- [ ] Phase 3 の open question 6 件すべてが含まれる
- [ ] 撤回 / 移植 / 削除 / 整合確認 の 4 種が揃っている
- [ ] 各検出項目に割り当て先（既存タスク or 新規 unassigned-task ID）が明示

---

## タスク 5: スキルフィードバックレポート（`outputs/phase-12/skill-feedback-report.md` / 改善点なしでも出力必須）

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | direction-reconciliation 系 docs-only タスクの `implemented` 強要が不適切。`spec_created` で close-out するパスがテンプレ化されていなかった | docs-only / direction-reconciliation のテンプレ化（`implemented` 必須化を緩和し `spec_created` で close-out 可能と明示） |
| task-specification-creator | Phase 12 「実装ガイド」が code-only 前提で、reconciliation 系では reconciliation 手順ガイドへの読み替えが必要 | Phase 12 spec に「docs-only 時は reconciliation / 文書化手順ガイドに読み替え可能」を明記 |
| task-specification-creator | Phase 12 compliance check の「pending を PASS と誤記しない」運用ルールが skill 全体で共通化されていない | 全 task の Phase 12 compliance check に運用ルール 1（staging smoke 表記）を組み込む |
| aiworkflow-requirements | Forms 分割方針 vs Sheets 採用方針の二重正本リスクを検知する仕組みが弱い | Ownership 宣言（5 対象）を references の正本構造に組み込み、衝突検出時に reconciliation タスクを自動起票する hook を提案 |
| aiworkflow-requirements | `references/api-endpoints.md` / `database-schema.md` の登録に「採用方針別の有効期間」を持たせる仕組みが無い | 各 entry に `direction_owner` フィールドを導入し、reconciliation で参照される base case を明示 |
| github-issue-manager | Issue #94 (CLOSED) を再オープンせずコメント追記で同期できた | CLOSED Issue への close-out コメント手順をテンプレ化 |
| automation-30 | 30 種思考法は省略不可であり、Phase 3 の代表 8 種だけでは AC-11 PASS にできない。Phase 10 補完 22 種を必須ゲート化することで全 30 種適用を満たせた | 分割適用する場合も、全 30 種が揃うまで PASS としない運用ルールを skill に追記 |

> 改善点が無い場合も「改善点なし」と明示して必ず出力すること。本タスクは direction-reconciliation の初例のため、改善提案が複数発生した。

### セルフチェックリスト

- [ ] task-specification-creator の改善提案が 3 件以上
- [ ] aiworkflow-requirements の改善提案が 1 件以上
- [ ] 「改善点なし」セクションは不要だが、無提案 skill にはその旨を記載

---

## タスク 6: Phase 12 compliance check（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 5 タスクの成果物が揃っている | 6 成果物（compliance check 含む） | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | 中学生 / 技術者の 2 パート | PASS |
| Part 1 に例え話 4 つ以上 | 二重正本 / 撤回 / 5 文書同期 / pending vs PASS | PASS |
| Part 2 に reconciliation 実行手順 + 採用方針 A / B 発火条件 + 5 文書同期チェック + 運用ルール 2 件 + docs-only 境界 | 全項目記述 | PASS |
| Step 1-A / 1-B / 1-C が記述 | 仕様書同期サマリー | PASS |
| Step 2 条件分岐記述 | A 維持で stale 撤回発火 / B 採用承認時のみ広範囲更新リスト | PASS |
| same-wave sync 完了 | workflow LOG + SKILL ×2 + topic-map + active guide | PASS |
| 二重 ledger 同期 | root + outputs の artifacts.json | PASS |
| validate-phase-output.js | 全 Phase PASS | PASS（警告あり） |
| verify-all-specs.js | 全 spec PASS | PASS（警告あり） |
| spec_created ステータス維持 | docs_only=true / `implemented` は使わない | PASS |
| Issue #94 CLOSED のまま | 再オープン禁止 / コメントのみ追記 | PASS |
| 機密情報非混入 | SA JSON / Bearer / op:// 実値が docs に無い | PASS |
| 運用ルール 2 件の組込 | staging smoke pending != PASS / unrelated 削除分離 | PASS |
| docs-only 境界 | コード削除 / migration down / Secret 削除を本タスクに含めない | PASS |
| 5 文書同期チェック起点 | Phase 9 で実施する 5 文書 × 採用方針マトリクスが phase-12 でも参照可能 | PASS |

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| workflow LOG | docs/30-workflows/LOGS.md | YES |
| SKILL #1 | .claude/skills/aiworkflow-requirements/SKILL.md | YES |
| SKILL #2 | .claude/skills/task-specification-creator/SKILL.md | YES |
| Index | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES |
| active guide | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | YES |

## 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）を必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `task.metadata.docsOnly` / `task.metadata.visualEvidence`。
- 片方のみ更新は禁止（drift 主要原因）。
- 本タスクは `taskType=docs-only` / `docsOnly=true` / `visualEvidence=NON_VISUAL` を全 ledger で固定する。

## docs-only close-out ルール【必須】

- 本タスクは reconciliation の文書化のみを行うため `spec_created` で close-out する。`implemented` ステータスには **しない**。
- 残作業（Sheets 実装撤回 / migration down / Secret 削除 / references stale audit）は **すべて unassigned-task として登録**（Task 12-4）し、本タスクの完了条件に含めない。
- same-wave sync を必ず通し、workflow LOG / SKILL change history / topic-map / active guide を完了させて初めて close-out。
- 関連タスクテーブルの実リンク追記は既存タスクの所有権を尊重し、B-03 / B-04 / B-05 の pending_creation として扱う。
- `apps/` / `packages/` / `migrations/` / `wrangler.toml` の差分は **本 PR に混入しない**。`git status` で意図せぬ変更が無いことを Phase 13 step 2 で再確認する。
- unrelated verification-report 削除も **本 PR に混入しない**（運用ルール 2）。

## validate-phase-output.js / verify-all-specs.js 実行確認

```bash
node scripts/validate-phase-output.js \
  --task ut09-direction-reconciliation

node scripts/verify-all-specs.js
```

- 期待: 両方とも exit code 0 / 全 PASS。
- FAIL 時: 該当 Phase の outputs/ 不足ファイルまたは artifacts.json drift を是正してから再実行。

## GitHub Issue #94 連携【必須 / 再オープン禁止】

```bash
# Issue #94 は CLOSED のまま。クローズアウト記録のコメントのみ追加。
gh issue comment 94 --body "$(cat <<'EOF'
UT-09 direction reconciliation の Phase 1〜12 仕様書化が完了しました。

- 仕様書ディレクトリ: docs/30-workflows/ut09-direction-reconciliation/
- base case: 案 a（current Forms 分割方針へ寄せる / MAJOR ゼロ・MINOR ゼロ）
- 残作業（unassigned-task として登録済 / 別タスクで実施）:
  - Sheets 実装撤回 PR
  - migration `sync_locks` / `sync_job_logs` down
  - Sheets 系 Cloudflare Secret 削除
  - 旧 UT-09 root を legacy umbrella 参照に戻す書き換え
  - references stale audit
  - unrelated verification-report 削除（独立 PR）

本タスクは docs-only / NON_VISUAL のため `spec_created` で close-out。
Issue は CLOSED のまま、追跡情報のみ追記。
EOF
)"

# 再オープンは禁止
# gh issue reopen 94 ← 実行しない
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 5 文書同期チェック結果を system-spec-update-summary に転記 |
| Phase 10 | base case = 案 a の GO 判定を承認ゲート前提として再利用 |
| Phase 11 | docs-only / NON_VISUAL の smoke 結果を unassigned-task-detection に反映 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 |
| 関連タスク | legacy umbrella / 03a / 03b / 04c / 09b / ut-09 root / ut-21 の index を双方向更新 |

## 多角的チェック観点

- 価値性: Part 1 が非エンジニアでも reconciliation の意義を理解できるか（例え話 4 つ以上）。
- 実現性: Step 2 の発火条件が A / B で正しく分岐し、A 維持時に references 書き換えを誘発しないか。
- 整合性: same-wave sync の LOGS / SKILL / topic-map が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の 10 件すべてに割り当て先 ID が記述されているか。
- docs-only 境界: コード削除 / migration down / Secret 削除を本タスクに含めない設計が貫徹されているか。
- Secret hygiene: ガイド・更新 references に実 SA JSON / 実 Bearer / 実 op 解決値が含まれていないか。
- Issue 整合: #94 を CLOSED のまま扱い、再オープンしていないか。
- 運用ルール: pending / PASS / FAIL の区別 / unrelated 削除分離 が成果物全体で一貫しているか。
- 5 文書同期: legacy umbrella / 03a / 03b / 04c / 09b / ut-09 root / ut-21 の双方向リンク予定が changelog で網羅され、実追記が pending_creation と明示されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | reconciliation 手順ガイド Part 1（中学生）| 12 | spec_created | 例え話 4 つ以上 |
| 2 | 同 Part 2（技術者）| 12 | spec_created | 採用方針 A / B 発火条件 / 5 文書同期 / 運用ルール |
| 3 | system-spec-update-summary | 12 | spec_created | Step 1-A/B/C + Step 2 条件分岐 |
| 4 | documentation-changelog | 12 | spec_created | 全変更ファイル網羅 / A 維持時の stale 撤回発火明記 |
| 5 | unassigned-task-detection | 12 | spec_created | 10 件登録（open question 6 件 + 追加 4 件）|
| 6 | skill-feedback-report | 12 | spec_created | 改善提案複数 |
| 7 | phase12-compliance-check | 12 | spec_created | 全 PASS |
| 8 | same-wave sync (workflow LOG / SKILL×2 / topic-map / active guide) | 12 | spec_created | 必須 |
| 9 | 二重 ledger 同期 | 12 | spec_created | docs_only=true 固定 |
| 10 | validate / verify スクリプト | 12 | spec_created | exit 0 |
| 11 | Issue #94 コメント追記 | 12 | spec_created | CLOSED のまま / 再オープン禁止 |
| 12 | docs-only 境界の再確認 | 12 | spec_created | コード差分の混入なし |

## 成果物

必須 7 成果物（`main.md` + Task 12-1〜12-5 + compliance check）と 2 ledger:

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生） + Part 2（技術者）= reconciliation 実行手順 |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + Step 2（A/B 条件分岐） |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 + A 維持時の stale 撤回発火行 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 10 件登録 |
| FB | outputs/phase-12/skill-feedback-report.md | 改善提案 |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 全 PASS |
| メタ | artifacts.json (root) | Phase 12 状態の更新（docs_only=true）|
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件

- [ ] 必須 6 成果物が `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成で、Part 1 に日常の例え話が 4 つ以上含まれる
- [ ] Part 2 に reconciliation 手順 / A・B 発火条件 / 5 文書同期 / 運用ルール 2 件 / docs-only 境界 が網羅
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2（A 維持で stale 撤回発火 / B で広範囲発火）が明記
- [ ] documentation-changelog に変更ファイルが網羅され、A 維持時の stale 撤回発火行が明示
- [ ] unassigned-task-detection が 10 件登録され、各々に割り当て先 ID が記述
- [ ] skill-feedback-report が改善提案複数で記述（無提案 skill には「改善点なし」明示）
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync（workflow LOG / SKILL ×2 / topic-map / active guide）が完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が `docs_only=true` / `taskType=docs-only` / `visualEvidence=NON_VISUAL` で同期
- [ ] `validate-phase-output.js` / `verify-all-specs.js` が exit code 0
- [ ] Issue #94 へのコメント追記済み（再オープンしていない）
- [ ] docs-only 境界（コード変更・migration 削除・Secret 削除を本タスクに含めない）が貫徹

## タスク100%実行確認【必須】

- 全実行タスク（12 件）が `spec_created`
- 必須 6 成果物が `outputs/phase-12/` に配置される設計になっている
- docs-only タスクの close-out ルール（`spec_created` で閉じる / `implemented` にしない）が遵守されている
- Step 2 条件分岐（A 維持で stale 撤回発火 / B で広範囲発火）が明記されている
- Issue #94 を CLOSED のまま扱い、再オープン手順を含めていない
- artifacts.json の `phases[11].status` が `spec_created`、`task.metadata.docsOnly = true`

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection 10 件 → 関連タスク / 新規 unassigned-task への双方向リンク反映予定
  - Issue #94 は CLOSED のまま PR 側で `Refs #94` として参照（`Closes #94` は不可）
  - docs-only 境界（コード変更は別タスク）を Phase 13 で再確認
  - 運用ルール 2 件（staging smoke 表記 / unrelated 削除分離）を Phase 13 GO/NO-GO チェックに組込
  - 本タスクの PR 作成自体を「採用方針確定後の独立タスクに切り出す」選択肢があることを Phase 13 冒頭で明示
- ブロック条件:
  - 必須 6 成果物のいずれかが欠落
  - same-wave sync が未完了（workflow LOG / SKILL ×2 / topic-map / active guide）
  - 二重 ledger に drift がある（特に `docs_only` フラグ）
  - validate / verify スクリプトが FAIL
  - Step 2 条件分岐が未記述
  - Issue #94 を誤って再オープンした
  - apps/ や migrations/ などコード差分が本 PR に混入
