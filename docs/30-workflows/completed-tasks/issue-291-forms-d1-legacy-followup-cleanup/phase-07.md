# Phase 7: AC マトリクス

[実装区分: ドキュメントのみ]

**判定根拠**: DoD（Definition of Done）の確定のみで、runtime code / D1 / Secret 変更を伴わない。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

CONST_007（後続 1 実装サイクルで完了スコープ、先送り禁止）を満たす Acceptance Criteria を確定し、Phase 11 / 12 / 13 完了時の達成判定基準を 1 ヶ所に集約する。

---

## 2. スコープ

### 対象

- 機能要件 AC（references current drift 解消）
- 品質要件 AC（historical 保護 / 逆リンク完備）
- ドキュメント要件 AC（indexes 同期 / artifacts.json parity）
- recovery 要件 AC（unassigned-task consumed pointer / canonical workflow root）

### 対象外

- 新規機能の AC（本タスクは仕様掃除のため new endpoint / new D1 table の AC なし）

---

## 3. 前提条件

- Phase 1-6 が確定済み
- Phase 4 の 6 種 scan command が確定済み

---

## 実行タスク

### 4.1 機能要件 AC（current drift 解消）

| ID | AC | 検証方法 |
|----|----|----------|
| AC-F-01 | `api-endpoints.md` の current section に単一 `POST /admin/sync` が残らない | rg + 目視 |
| AC-F-02 | `api-endpoints.md` の current section に `/admin/sync/run` / `/backfill` / `/audit` / `/admin/smoke/sheets` が残らない | rg + 目視 |
| AC-F-03 | current section に残る admin sync endpoint は `/admin/sync/schema` と `/admin/sync/responses` の 2 つのみ | 目視 |
| AC-F-04 | `environment-variables.md` で `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` が Required current から historical に格下げ済み | rg + 目視 |
| AC-F-05 | `environment-variables.md` の `SYNC_ADMIN_TOKEN` 射程記述から legacy `/admin/sync` が除外済み | rg + 目視 |
| AC-F-06 | `deployment-cloudflare.md` L293 周辺の Google Sheets API v4 同期説明が Forms API split endpoint に置換済み | rg + 目視 |
| AC-F-07 | `deployment-secrets-management.md` L86 の `GOOGLE_SERVICE_ACCOUNT_JSON` 用途が「Forms API（current）」に修正済み | rg + 目視 |
| AC-F-08 | `architecture-overview-core.md` L243 の admin sync 行が Forms→D1 + `sync_jobs` 前提に書き換え済み | rg + 目視 |

### 4.2 品質要件 AC

| ID | AC | 検証方法 |
|----|----|----------|
| AC-Q-01 | lessons-learned-*.md / task-workflow-completed.md / task-workflow-active.md / inventory.md に本文編集差分なし | `git diff --stat` |
| AC-Q-02 | conflict marker 0 hit | Phase 4 scan 2 |
| AC-Q-03 | 3 物理タスク + 2 ledger fallback から legacy umbrella への逆リンクが検証できる | Phase 4 scan 3 |
| AC-Q-04 | `task-workflow-backlog.md` の UT-DSC-MIGRATION-SCRIPT-001 / UT-DSC-SYNC-AUDIT-APPEND-ONLY-001 が `status: superseded` | Phase 4 scan 6 |
| AC-Q-05 | 不変条件 #1 / #5 / #7 違反なし | Phase 3 整合確認 |

### 4.3 ドキュメント要件 AC

| ID | AC | 検証方法 |
|----|----|----------|
| AC-D-01 | `pnpm indexes:rebuild` 後に `verify-indexes-up-to-date` drift なし | Phase 4 scan 4 |
| AC-D-02 | `artifacts.json` と `outputs/artifacts.json` が parity（全 phase 同 status） | diff |
| AC-D-03 | Phase 12 strict 7 outputs（main.md + 6 成果物）が全件存在 | `ls outputs/phase-12/` |
| AC-D-04 | Phase 12 readiness scan が PASS | Phase 4 scan 5 |

### 4.4 recovery 要件 AC

| ID | AC | 検証方法 |
|----|----|----------|
| AC-R-01 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-followup-cleanup-001.md` 冒頭メタに `status: consumed` / `consumed_at: 2026-05-22` / `canonical_workflow` / `recovery_note` の YAML frontmatter が追記済み | 目視 |
| AC-R-02 | canonical workflow root（本ディレクトリ）が `artifacts.json` `metadata.recovered_from_unassigned` / `metadata.recovery_pattern` を持つ | jq |
| AC-R-03 | PR は `Refs #291` のみで `Closes #291` を含まない | Phase 13 PR 本文 |

### 4.5 CONST_007 単一サイクル完了 AC

| ID | AC | 検証方法 |
|----|----|----------|
| AC-C-01 | Phase 1-12 を 1 実装サイクルで完了できる粒度 | Phase 10 最終レビューで判定 |
| AC-C-02 | 先送り（"後続別タスク化"）禁止。skill 改善判断は本タスク内で採否決定 | Phase 12 skill-feedback-report |

---

## 統合テスト連携

- docs-only / NON_VISUAL のため runtime 統合テストは非該当。代替として rg scan、path existence、artifacts parity、Phase 12 readiness を各 phase の gate として扱う。

## 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-07/main.md` | AC マトリクスサマリ |
| `outputs/phase-07/ac-matrix.md` | AC ID × 検証方法 × 判定基準の表 |

---

## 完了条件

- [ ] 機能要件 AC（8 件）が確定
- [ ] 品質要件 AC（5 件）が確定
- [ ] ドキュメント要件 AC（4 件）が確定
- [ ] recovery 要件 AC（3 件）が確定
- [ ] CONST_007 AC（2 件）が確定
- [ ] 各 AC に検証方法が紐付け済み
- [ ] `artifacts.json` phase 7 status → `completed`

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| AC が網羅されない | references 5 + backlog 1 + 逆リンク 5 + recovery 3 + CI gate 4 を機械的に列挙 |
| AC 検証が手動目視に偏る | Phase 4 の rg コマンドに紐付け、機械検証可能な AC を優先 |

---

## 参照資料

- Phase 1-6 の全成果物
- `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md`

---

## 9. 次フェーズへの引き継ぎ

Phase 8 で類似 stale 表現の共通テンプレート化を検討する。本 AC は Phase 10 最終レビュー / Phase 12 compliance check の判定基準としても使用される。
