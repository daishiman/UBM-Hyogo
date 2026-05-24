# Phase 2: 設計

[実装区分: ドキュメントのみ]

**判定根拠**: 分類基準・更新方針・逆リンク戦略の文書化のみで、runtime code / D1 / Secret 変更を伴わない。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

Phase 1 で確定した stale hit inventory を入力に、

- current drift の各行をどのように編集するか（注記 / 削除 / 移送 / プレフィクス付与）
- historical をどのように保護するか
- superseded backlog の status 変更方法
- 03a / 03b / 04c / 09b / 02c から legacy umbrella への逆リンク戦略

を `classification-policy.md` として確定する。Phase 5 のランブックは本設計を file:line 単位の実行手順に展開する。

---

## 2. スコープ

### 対象

- 分類基準（current drift / historical / superseded backlog）の判定アルゴリズム
- references 5 ファイル + backlog 1 ファイルの更新方針
- 関連 5 タスクへの逆リンク追記戦略
- skill indexes 再生成タイミングの設計

### 対象外

- 実際の編集作業（Phase 5）
- 新規 endpoint / D1 table / secret の設計

---

## 3. 前提条件

- Phase 1 の `stale-hit-inventory.md` が完成済み
- `task-sync-forms-d1-legacy-umbrella-001` の `outputs/phase-12/implementation-guide.md` の current facts セクションが読める

---

## 実行タスク

### 4.1 分類アルゴリズムの確定

```
入力: rg hit（file, line, context）
判定:
  1. file が lessons-learned-*.md / task-workflow-completed.md / task-workflow-active.md /
     workflow-task-sync-forms-d1-legacy-umbrella-artifact-inventory.md の場合
     → historical（残す。本文編集なし）
  2. file が task-workflow-backlog.md の場合
     → 該当 entry の status を "superseded"（理由: legacy umbrella で sync_jobs に集約済み）に変更
  3. それ以外（api-endpoints / environment-variables / deployment-* / architecture-*）
     → current drift と判定
     → 行ごとに editing-mode を決定:
        a) 互換 mount 注記 → "legacy（UT-09 で廃止、現行は /admin/sync/schema|responses）" を強調表示
        b) Sheets API 系 secret/env → Forms API 用と明示 + Sheets 文脈は historical note へ移送
        c) Sheets→D1 sync 図表 → Forms→D1 current 図に置換 + historical note 追加
```

### 4.2 references 5 ファイルの更新方針

| ファイル | 行 | 更新方針 |
|---------|----|---------|
| `api-endpoints.md` | 69 | 単一 `POST /admin/sync`「互換 mount」記述を削除し、「legacy（UT-09 で廃止）」注記に置換。新設禁止を明示 |
| `api-endpoints.md` | 70-74 | `/admin/sync/run` / `/backfill` / `/audit` / `/admin/smoke/sheets` を current sections から historical section（u-04 legacy）に移送。Forms 系 `/admin/sync/schema` / `/admin/sync/responses` のみ current として残す |
| `environment-variables.md` | 55 | `GOOGLE_SERVICE_ACCOUNT_JSON` の説明を「Forms API + （historical: Google Sheets API）」に修正 |
| `environment-variables.md` | 65, 436, 442, 443 | `SYNC_ADMIN_TOKEN` の射程説明から legacy `/admin/sync` を外し、Forms split endpoint のみを current に。`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` は Required から historical（u-04 legacy）に格下げ |
| `deployment-cloudflare.md` | 293 | Google Sheets API v4 同期説明を Forms API split endpoint 説明に置換。Sheets API 記述は historical note へ |
| `deployment-secrets-management.md` | 86 | `GOOGLE_SERVICE_ACCOUNT_JSON` の用途記述を「Forms API（current）」に修正 |
| `architecture-overview-core.md` | 243 | admin sync 行を Forms→D1 + `sync_jobs` 前提に書き換え、Sheets→D1 は legacy note 化 |

### 4.3 backlog 更新方針

| ファイル | 行 | 更新方針 |
|---------|----|---------|
| `task-workflow-backlog.md` | 349 | UT-DSC-MIGRATION-SCRIPT-001 を `status: superseded`、理由欄に「legacy umbrella `task-sync-forms-d1-legacy-umbrella-001` で sync_jobs 一本化済み（2026-04-30）」を記載 |
| `task-workflow-backlog.md` | 350 | UT-DSC-SYNC-AUDIT-APPEND-ONLY-001 を同様に `status: superseded` |

### 4.4 逆リンク戦略

3 物理タスクの `index.md` または `related-tasks` セクションに以下のフォーマットで追記する。物理 root が存在しない 04c / 09b は `task-workflow-active.md` の ledger fallback で追記する:

```markdown
| 関連タスク | リンク | 理由 |
|-----------|--------|------|
| task-sync-forms-d1-legacy-umbrella-001 | [umbrella close-out](../completed-tasks/task-sync-forms-d1-legacy-umbrella-001/) | 旧 UT-09（単一 /admin/sync + sync_audit + Sheets API）の close-out。本タスクは current Forms API 経路を担保 |
```

追記理由は changelog または Decision Log にも記録する（完了済みタスクの履歴を乱さないため）。

### 4.5 indexes 再生成設計

すべての references 編集完了後に以下を 1 回実行する:

```bash
mise exec -- pnpm indexes:rebuild
```

`pnpm verify-indexes`（または CI の `verify-indexes-up-to-date`）で drift が出ないことを確認する。

### 4.6 ステップ間 state 引き渡し

| ステップ | 引き渡し項目 | 受け手 |
|---------|-------------|--------|
| 4.1 分類アルゴリズム | classification rule set | 4.2 / 4.3 |
| 4.2 references 更新方針 | file:line 編集マップ | Phase 5 ランブック |
| 4.4 逆リンク戦略 | 追記テンプレート | Phase 5 ランブック |

---

## 統合テスト連携

- docs-only / NON_VISUAL のため runtime 統合テストは非該当。代替として rg scan、path existence、artifacts parity、Phase 12 readiness を各 phase の gate として扱う。

## 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-02/main.md` | 設計サマリ・判断根拠 |
| `outputs/phase-02/classification-policy.md` | 分類アルゴリズム + file:line 更新方針表 + 逆リンクテンプレート |

---

## 完了条件

- [ ] 分類アルゴリズムが flow として記述済み
- [ ] references 5 ファイルの更新方針が file:line で確定
- [ ] backlog 2 entry の supersede 方針が確定
- [ ] 逆リンクテンプレートが確定
- [ ] indexes 再生成タイミングが明示
- [ ] historical 保護方針（本文編集禁止）が明示
- [ ] `artifacts.json` phase 2 status → `completed`

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| 互換 mount 注記の削除で過去 issue 履歴が辿れなくなる | 削除ではなく「legacy（UT-09 で廃止、現行は X）」注記に置換する |
| Sheets API secret の格下げで現在の Forms API ワークフローが影響を受ける | `GOOGLE_SERVICE_ACCOUNT_JSON` 自体は Forms API でも使用するため Required は維持、用途文言のみ修正 |
| 逆リンク追記で完了済みタスクの履歴整合が壊れる | 追記は related-tasks セクション末尾追加に限定し、本文編集は禁止 |

---

## 参照資料

- Phase 1 `outputs/phase-01/stale-hit-inventory.md`
- `docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`

---

## 9. 次フェーズへの引き継ぎ

Phase 3 で本設計を umbrella close-out / spec 08 / spec 13 と照合し、矛盾がないかをレビューする。Phase 5 のランブックは `classification-policy.md` を直接展開する。
