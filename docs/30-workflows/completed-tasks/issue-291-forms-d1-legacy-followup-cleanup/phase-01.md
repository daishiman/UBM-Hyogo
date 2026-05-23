# Phase 1: 要件定義

[実装区分: ドキュメントのみ]

**判定根拠**: 本 phase は実測 rg 出力に基づく stale hit の inventory 化と初期分類のみで、runtime code / D1 / Secret 変更を伴わない。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

`.claude/skills/aiworkflow-requirements/references/` 配下に残存する stale current guidance を実測ベースで抽出し、後続 phase で current drift / historical / superseded backlog に分類できるよう inventory を確定する。期待値ではなく **実 rg 出力** を証跡として残し、`task-sync-forms-d1-legacy-umbrella-001` で発生した「0 hit 想定の PASS 自己申告」と「実測 hit」の乖離を再発させない。

---

## 2. スコープ

### 対象

- `.claude/skills/aiworkflow-requirements/references/` 配下の md 全件
- 検索パターン: `Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b`

### 対象外

- `.claude/skills/aiworkflow-requirements/references/` 外の docs / runtime code
- 本 phase での編集作業（Phase 5 ランブックで実施）
- backlog ledger の status 変更（Phase 5）

---

## 3. 前提条件

- worktree 配下で `pnpm install` 済み（`mise exec --` 経由）
- `task-sync-forms-d1-legacy-umbrella-001` Phase 12 close-out 成果物が読める
- 03a / 03b / 04c / 09b / 02c の関連タスクドキュメントが存在する
- `rg`（ripgrep）が利用可能

---

## 実行タスク

### 4.1 タスク分類の固定（recovery-from-unassigned 必須項目）

Phase 1 冒頭で以下を `outputs/phase-01/main.md` に明記する。

- タスク種別: docs-only
- 視覚証跡: NON_VISUAL
- 実装区分判定根拠: 「対象ファイルは `.claude/skills/aiworkflow-requirements/references/*.md` のみで runtime code / D1 / Secret 変更を伴わない」
- recovery source: `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-followup-cleanup-001.md`
- canonical workflow root: 本 workflow

### 4.2 stale hit の機械抽出

```bash
rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" \
  .claude/skills/aiworkflow-requirements/references \
  > docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-01/rg-raw.txt
```

出力例（指示書記載の既知 hit を初期分類済みベースラインとして固定）:

| file | 行 | 文脈サマリ | 初期分類仮 |
|------|----|-----------|-----------|
| `api-endpoints.md` | 69 | 単一 `POST /admin/sync` を「互換 mount」として残す記述 | current drift |
| `api-endpoints.md` | 70-74 | `/admin/sync/run` / `/backfill` / `/audit` / `/admin/smoke/sheets`（u-04 Sheets→D1 current 前提） | current drift |
| `environment-variables.md` | 55 | `GOOGLE_SERVICE_ACCOUNT_JSON` を「Google Sheets API 用」と記載 | current drift |
| `environment-variables.md` | 65, 436, 442, 443 | `SYNC_ADMIN_TOKEN` 射程に legacy 含む / `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` を current Required 表示 | current drift |
| `deployment-cloudflare.md` | 293 | Google Sheets API v4 同期を current として説明 | current drift |
| `deployment-secrets-management.md` | 86 | `GOOGLE_SERVICE_ACCOUNT_JSON`「Google Sheets API 用」 | current drift |
| `architecture-overview-core.md` | 243 | admin sync 行 u-04 Sheets→D1 前提 | current drift |
| `task-workflow-backlog.md` | 349, 350 | UT-DSC-MIGRATION-SCRIPT-001 / UT-DSC-SYNC-AUDIT-APPEND-ONLY-001（`sync_audit` 4テーブル前提） | superseded backlog |
| `lessons-learned-*.md` | 該当行 | 過去の知見として `/admin/sync` / `sync_audit` 言及 | historical（残す） |
| `task-workflow-completed.md` / `task-workflow-active.md` | 該当行 | 完了済タスク記録の文脈で legacy 名称言及 | historical（残す） |
| `workflow-task-sync-forms-d1-legacy-umbrella-artifact-inventory.md` | 全文 | stale / current 対比表 | historical（残す） |

### 4.3 inventory ドキュメント化

`outputs/phase-01/stale-hit-inventory.md` に上記表を実 rg 出力と突合した上で確定する。実 rg 出力で上記表に未掲載の hit が見つかった場合は、必ず該当行を表に追加してから Phase 2 へ進む。

### 4.4 carry-over 確認

`task-sync-forms-d1-legacy-umbrella-001` の Phase 11/12 成果物に既出の knownledge（stale 0 hit 自己申告の reason / superseded 候補 list / 関連タスク 5 件）を inventory 表に紐付ける。

---

## 統合テスト連携

- docs-only / NON_VISUAL のため runtime 統合テストは非該当。代替として rg scan、path existence、artifacts parity、Phase 12 readiness を各 phase の gate として扱う。

## 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-01/main.md` | タスク種別・視覚証跡・判定根拠・recovery source の宣言 |
| `outputs/phase-01/rg-raw.txt` | `rg -n` 生出力（実測証跡） |
| `outputs/phase-01/stale-hit-inventory.md` | 分類付き hit inventory 表 |

---

## 完了条件

- [ ] `rg-raw.txt` が実測値で生成済み
- [ ] `stale-hit-inventory.md` に file / 行 / 文脈 / 初期分類が全件記載済み
- [ ] 既知 5 references + backlog 1 file + historical group が分類されている
- [ ] タスク種別（docs-only / NON_VISUAL）が `main.md` に明記済み
- [ ] `artifacts.json` の phase 1 status を `completed` に更新

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| 期待値で表を埋めて実 rg 出力と乖離させる | `rg-raw.txt` を必ず実行・保存し、表は rg 出力からの転記とする |
| 新規 stale hit を見落とす | 表に未掲載の hit を 1 件以上発見した時点で Phase 2 着手を中断し inventory に追加 |
| historical を current drift と誤分類 | lessons-learned / completed / inventory ファイル群は default で historical 扱い、current section に live で出ているもののみ current drift と判定する |

---

## 参照資料

- `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-followup-cleanup-001.md`
- `docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/outputs/phase-12/implementation-guide.md`
- `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md`

---

## 9. 次フェーズへの引き継ぎ

Phase 2 では本 inventory を入力として、current drift の各行に対する **更新方針**（注記追加 / 行削除 / current section から history section へ移送 / 「legacy（UT-09 で廃止）」プレフィクス付与など）と、historical の保護方針、superseded backlog の status 変更方針を決定する。
