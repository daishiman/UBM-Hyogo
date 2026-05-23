# Phase 5: 実装ランブック

[実装区分: ドキュメントのみ]

**判定根拠**: 編集対象は `.claude/skills/aiworkflow-requirements/references/*.md`、`task-workflow-backlog.md`、関連 3 物理タスク、04c / 09b ledger fallback に限定。runtime code / D1 / Secret 変更なし。本 phase はランブック定義だけで止めず、対象 md への実編集を同サイクルで実行する。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

Phase 2 の `classification-policy.md` を入力に、references / backlog / 関連タスク逆リンク / skill indexes 再生成までを **file:line 単位の編集手順** として展開し、その手順を同 phase 内で実ファイルに適用する。実編集後に Phase 4 の scan を再実行し、Phase 6 以降の検証フェーズに進む。

---

## 2. スコープ

### 対象

- references 5 ファイルの編集手順（file:line + before/after 概念記述）
- `task-workflow-backlog.md` の supersede 手順
- 3 物理タスク + 2 ledger fallback への逆リンク追記手順
- skill indexes 再生成手順
- 実装後セルフチェック（Phase 4 scan command を再実行）

### 対象外

- runtime code / D1 migration / Cloudflare Secret 変更
- commit / push / PR

---

## 3. 前提条件

- Phase 4 で regression scan command が確定済み
- `pnpm install` 済み
- worktree が同期済み（main 取り込み済み）

---

## 実行タスク

### 4.1 references 編集ランブック（file:line × before/after 概念）

> **注意**: 以下の before/after はコードスニペットではなく **編集指示** として読む。Phase 5 完了時には、これらの指示を対象 md へ実適用済みにする。

#### 4.1.1 `api-endpoints.md` L69-74

| 行 | before（current 記述） | after（編集指示） |
|----|----------------------|------------------|
| L69 | 単一 `POST /admin/sync` を「互換 mount」として残す記述 | "legacy（UT-09 で廃止、新設禁止。現行は `/admin/sync/schema` と `/admin/sync/responses`）" 注記に置換 |
| L70 | `POST /admin/sync/run` を current として記述 | historical section（u-04 legacy）へ移送し、current section からは削除 |
| L71 | `POST /admin/sync/backfill` を current として記述 | 同上 |
| L72 | `GET /admin/sync/audit` を current として記述 | 同上 |
| L73-74 | `GET /admin/smoke/sheets` を current として記述 | 同上、Sheets API 自体が legacy のため historical 化 |

current section に残すのは `/admin/sync/schema`（04c 管轄）と `/admin/sync/responses`（04c 管轄）のみ。

#### 4.1.2 `environment-variables.md` L55, L65, L436, L442, L443

| 行 | before | after |
|----|--------|-------|
| L55 | `GOOGLE_SERVICE_ACCOUNT_JSON` を「Google Sheets API 用」と記載 | 「Google Forms API 用（u-04 legacy では Google Sheets API でも使用していた）」に修正 |
| L65 | `SYNC_ADMIN_TOKEN` の射程に legacy `/admin/sync` を含む | 射程を `/admin/sync/schema` と `/admin/sync/responses` のみに限定 |
| L436 | `GOOGLE_SHEETS_SA_JSON` を current Required と表示 | historical（u-04 legacy）に格下げ、Required から外す |
| L442 | `SHEETS_SPREADSHEET_ID` を current Required と表示 | 同上 |
| L443 | Sheets 関連 secret の運用説明 | "legacy（UT-09 で廃止）" 注記に置換 |

#### 4.1.3 `deployment-cloudflare.md` L293

| 行 | before | after |
|----|--------|-------|
| L293 | Google Sheets API v4 同期を current として説明 | Forms API split endpoint（`/admin/sync/schema` + `/admin/sync/responses`）を current として説明。Sheets API v4 記述は historical note へ移送（L255 周辺の legacy 注記と整合させる） |

#### 4.1.4 `deployment-secrets-management.md` L86

| 行 | before | after |
|----|--------|-------|
| L86 | `GOOGLE_SERVICE_ACCOUNT_JSON`「Google Sheets API 用」記載 | 「Google Forms API 用（current）」に修正 |

#### 4.1.5 `architecture-overview-core.md` L243

| 行 | before | after |
|----|--------|-------|
| L243 | admin sync 行が「u-04 Sheets→D1 sync」前提 | 「Forms API → D1 (`sync_jobs` テーブル) 経由の split endpoint sync」に書き換え。Sheets→D1 は legacy note 化 |

### 4.2 backlog supersede 手順

#### `task-workflow-backlog.md` L349, L350

```
1. UT-DSC-MIGRATION-SCRIPT-001（L349 周辺）の status 行を `status: superseded` に変更
2. 同 entry に supersede 理由を追記:
   理由: legacy umbrella task-sync-forms-d1-legacy-umbrella-001 で sync_jobs に集約済み（2026-04-30）
3. UT-DSC-SYNC-AUDIT-APPEND-ONLY-001（L350 周辺）も同様に supersede
4. 該当 entry を backlog の active section から superseded / archived section へ移送（backlog の構造に依存）
```

### 4.3 逆リンク追記ランブック

現 worktree に物理 root が存在する 3 タスクは `index.md` または `related-tasks` セクションへ追記する。物理 root が存在しない 04c / 09b は存在しない path を新規正本扱いせず、`task-workflow-active.md` の該当 row へ legacy umbrella 参照を追記する。

| 関連タスク | 追記先 |
|-----------|------------|
| 03a | `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` |
| 03b | `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` |
| 04c | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` の 04c row（physical root absent fallback） |
| 09b | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` の 09b row（physical root absent fallback） |
| 02c | `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/index.md` |

追記テンプレート（related-tasks セクション末尾に挿入）:

```markdown
#### 関連タスク（legacy umbrella 逆リンク）

| 関連タスク | リンク | 理由 |
|-----------|--------|------|
| task-sync-forms-d1-legacy-umbrella-001 | [umbrella close-out](../completed-tasks/task-sync-forms-d1-legacy-umbrella-001/) | 旧 UT-09（単一 /admin/sync + sync_audit + Sheets API）の close-out。本タスクが current Forms API 経路を担保する。Refs: Issue #291 |
```

完了済みタスクへの追記は本文編集にあたるため、changelog または Decision Log セクションに追記理由を 1 行記録する。
ledger fallback への追記では、該当 row の末尾に「legacy umbrella: `task-sync-forms-d1-legacy-umbrella-001` / cleanup: `issue-291-forms-d1-legacy-followup-cleanup`」を 1 文で追加する。

### 4.4 skill indexes 再生成

すべての references 編集完了後に 1 回だけ実行:

```bash
mise exec -- pnpm indexes:rebuild
```

差分を確認し、意図しない変更があれば Phase 4 の index drift scan で検出する。

### 4.5 実装後セルフチェック

Phase 4 の 6 種 scan command を全件実行し、全 PASS を確認してから Phase 6 に進む。

```bash
# 1. stale current scan
rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" \
  .claude/skills/aiworkflow-requirements/references \
  | rg -v "lessons-learned-|task-workflow-completed|task-workflow-active|workflow-task-sync-forms-d1-legacy-umbrella-artifact-inventory|legacy（UT-09 で廃止|historical:"

# 2. conflict marker scan
rg -n "^(<<<<<<<|=======|>>>>>>>)" .claude/skills/aiworkflow-requirements/references docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup

# 3. backlink scan (期待: 3 physical file hit + 2 ledger fallback rows)
rg -l "task-sync-forms-d1-legacy-umbrella-001" \
  docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
  docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver \
  docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary

rg -n "04c-parallel-admin-backoffice-api-endpoints.*task-sync-forms-d1-legacy-umbrella-001|09b-parallel-cron-triggers-monitoring-and-release-runbook.*task-sync-forms-d1-legacy-umbrella-001" \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

# 4. index drift
git diff --stat .claude/skills/aiworkflow-requirements/indexes

# 5. Phase 12 readiness
jq '.phases[] | select(.phase == 12) | .outputs' docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/artifacts.json

# 6. backlog status
rg -n "UT-DSC-MIGRATION-SCRIPT-001|UT-DSC-SYNC-AUDIT-APPEND-ONLY-001" \
  .claude/skills/aiworkflow-requirements/references/task-workflow-backlog.md
```

---

## 統合テスト連携

- docs-only / NON_VISUAL のため runtime 統合テストは非該当。代替として rg scan、path existence、artifacts parity、Phase 12 readiness を各 phase の gate として扱う。

## 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-05/main.md` | ランブックサマリ |
| `outputs/phase-05/file-edit-runbook.md` | references 5 + backlog の file:line × before/after 表 |
| `outputs/phase-05/backlink-runbook.md` | 3 物理タスク + 2 ledger fallback への逆リンク追記テンプレート + 追記理由記録方針 |

---

## 完了条件

- [ ] references 5 ファイルの編集手順が file:line で確定
- [ ] backlog 2 entry の supersede 手順が確定
- [ ] 3 物理タスク + 2 ledger fallback への逆リンク追記テンプレートが確定
- [ ] indexes 再生成手順が明示
- [ ] 実装後セルフチェック（6 種 scan）が明示
- [ ] historical ファイル（lessons-learned / completed / inventory）への編集禁止が明示
- [ ] `artifacts.json` phase 5 status → `completed`

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| 行番号が他コミットでズレる | 編集時点で `rg -n` を再実行して行番号を再確認。before/after の文脈マッチで edit する |
| 完了済みタスクへの追記で履歴が乱れる | 追記は related-tasks セクションへの append のみ。本文編集は禁止。changelog / Decision Log に追記理由を記録 |
| skill indexes 再生成で他 skill の差分も発生 | indexes 再生成前に `git status` で baseline を確認し、本タスク由来以外の差分は別 commit に分離 |

---

## 参照資料

- Phase 2 `outputs/phase-02/classification-policy.md`
- Phase 4 `outputs/phase-04/regression-scan-commands.md`
- `.claude/skills/aiworkflow-requirements/references/`
- `CLAUDE.md` § よく使うコマンド（`pnpm indexes:rebuild`）

---

## 9. 次フェーズへの引き継ぎ

Phase 6 で異常系（誤削除 / 残存 drift / 逆リンク欠落）の検出手順を確定する。本 phase のランブックを 1 度実行した状態を入力とする。
