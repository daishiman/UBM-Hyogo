# Phase 8: DRY 化

[実装区分: ドキュメントのみ]

**判定根拠**: stale 表現の共通テンプレート化のみで、runtime code 変更を伴わない。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

5 references に分散している類似 stale 表現（"u-04 legacy"、"GOOGLE_SERVICE_ACCOUNT_JSON 用途説明"、"Sheets API → Forms API への移行注記"）を共通テンプレ化し、将来の legacy 注記表記揺れを予防する。本 phase は **テンプレートの定義** のみ行い、references への適用は Phase 5 ランブックに反映される。

---

## 2. スコープ

### 対象

- legacy 注記の共通フォーマット
- historical migration note の共通フォーマット
- supersede 理由欄の共通フォーマット
- 逆リンク追記の共通フォーマット（Phase 5 で既出のものを再確認）

### 対象外

- 新規共通ドキュメント（reusable-templates.md など）の作成
- references 構造のリファクタリング

---

## 3. 前提条件

- Phase 5 ランブックが確定済み
- Phase 7 AC マトリクスが確定済み

---

## 実行タスク

### 4.1 共通テンプレート 1: legacy 注記

```markdown
> **legacy（UT-09 で廃止）**: 本記述は u-04 時代の Google Sheets API + 単一 /admin/sync + sync_audit の経路を指す。
> 現行（Refs Issue #291 / task-sync-forms-d1-legacy-umbrella-001）は Forms API + /admin/sync/schema + /admin/sync/responses + sync_jobs。
> 新規実装ではこの経路を使わない。
```

**適用箇所**: `api-endpoints.md` L69, `environment-variables.md` L443, `deployment-cloudflare.md` L293 など互換 mount / Sheets 経路の注記が必要な行

### 4.2 共通テンプレート 2: historical migration note（短縮形）

行内に挿入できる短縮形:

```markdown
（historical: u-04 では Google Sheets API でも使用。current は Forms API）
```

**適用箇所**: secret 用途欄など 1 行で legacy 移行注記が必要な箇所

### 4.3 共通テンプレート 3: backlog supersede 理由

```yaml
status: superseded
superseded_by: task-sync-forms-d1-legacy-umbrella-001
superseded_at: 2026-04-30
reason: legacy umbrella で sync_jobs に集約済み。sync_audit 4 テーブル前提は廃止
refs:
  - Issue #95（umbrella 元 issue）
  - Issue #291（cleanup follow-up）
```

**適用箇所**: `task-workflow-backlog.md` の UT-DSC-MIGRATION-SCRIPT-001 / UT-DSC-SYNC-AUDIT-APPEND-ONLY-001

### 4.4 共通テンプレート 4: 逆リンク追記

```markdown
#### 関連タスク（legacy umbrella 逆リンク）

| 関連タスク | リンク | 理由 |
|-----------|--------|------|
| task-sync-forms-d1-legacy-umbrella-001 | [umbrella close-out](../completed-tasks/task-sync-forms-d1-legacy-umbrella-001/) | 旧 UT-09（単一 /admin/sync + sync_audit + Sheets API）の close-out。本タスクが current Forms API 経路を担保する。Refs: Issue #291 |
```

**適用箇所**: 03a / 03b / 04c / 09b / 02c の `index.md`

### 4.5 表記統一ルール

| 用語 | 統一表記 | 理由 |
|------|---------|------|
| 旧 UT-09 経路 | "legacy（UT-09 で廃止）" | Phase 4 stale scan 除外フィルタと整合 |
| 現行 Forms API 経路 | "current（Forms API + /admin/sync/{schema|responses}）" | API 表との整合 |
| 廃止 D1 table | "legacy: sync_audit（廃止、現行は sync_jobs）" | 02c artifacts の用語と整合 |
| 廃止 secret | "legacy: GOOGLE_SHEETS_SA_JSON / SHEETS_SPREADSHEET_ID（u-04 時代）" | secret 表との整合 |

### 4.6 reuse 判定

本タスク内で 3 回以上同じ注記文を貼る箇所がある場合のみテンプレ採用。1-2 回の場合はインライン記述で済ます（過度な DRY 化を避ける）。

---

## 統合テスト連携

- docs-only / NON_VISUAL のため runtime 統合テストは非該当。代替として rg scan、path existence、artifacts parity、Phase 12 readiness を各 phase の gate として扱う。

## 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-08/main.md` | 4 種共通テンプレート + 表記統一ルール + reuse 判定基準 |

---

## 完了条件

- [ ] 4 種共通テンプレート（legacy 注記 / historical short / backlog supersede / 逆リンク）が確定
- [ ] 表記統一ルール（4 項目）が確定
- [ ] reuse 判定基準（3 回以上）が明示
- [ ] Phase 5 ランブックに本テンプレートが反映可能か確認
- [ ] `artifacts.json` phase 8 status → `completed`

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| 過度な DRY 化で可読性が落ちる | reuse 判定基準（3 回以上）を厳守 |
| 表記揺れが残り stale scan の除外フィルタが効かない | Phase 4 scan の除外パターンと Phase 8 表記統一ルールを同期させる |

---

## 参照資料

- Phase 5 `outputs/phase-05/file-edit-runbook.md`
- Phase 4 `outputs/phase-04/regression-scan-commands.md`

---

## 9. 次フェーズへの引き継ぎ

Phase 9 で品質保証として `pnpm indexes:rebuild` / `verify:phase12-compliance` を実行し、本テンプレ適用後の drift がないことを確認する。
