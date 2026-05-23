# Phase 6: 異常系検証

[実装区分: ドキュメントのみ]

**判定根拠**: 異常系シナリオの検出手順設計のみ。runtime code / D1 / Secret 変更なし。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

Phase 5 ランブック実行で起こりうる以下 3 種の異常系を検出する手順を確定する。

1. **historical lessons 誤削除**: lessons-learned / completed / inventory の本文を誤って編集してしまうケース
2. **current drift 残存**: stale 行を編集したつもりが除外フィルタに該当せず current guidance として残るケース
3. **逆リンク欠落**: 3 物理タスク + 2 ledger fallback のうち一部に逆リンクが追記されないケース

---

## 2. スコープ

### 対象

- 上記 3 種の異常系シナリオ
- 検出コマンド + 想定誤りパターン + 復旧手順

### 対象外

- 異常系ケースの実発生（実装サイクルで遭遇した場合に本 phase の手順を適用）

---

## 3. 前提条件

- Phase 5 ランブックが確定済み
- Phase 4 scan command 一式が利用可能

---

## 実行タスク

### 4.1 異常系 1: historical lessons 誤削除

**症状**: lessons-learned-*.md / task-workflow-completed.md などの本文に意図しない変更が入る。

**検出**:

```bash
git diff --stat .claude/skills/aiworkflow-requirements/references/lessons-learned-*.md \
  .claude/skills/aiworkflow-requirements/references/task-workflow-completed.md \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md \
  .claude/skills/aiworkflow-requirements/references/workflow-task-sync-forms-d1-legacy-umbrella-artifact-inventory.md
```

**期待**: 0 file changed（historical は本タスクで編集禁止）

**復旧**: 差分内容を確認し、意図しない編集だけを手動で戻す。履歴ファイルの広範な復旧が必要な場合はユーザー承認を得る。

### 4.2 異常系 2: current drift 残存

**症状**: Phase 4 stale scan で hit が 0 にならない。

**検出**:

```bash
rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" \
  .claude/skills/aiworkflow-requirements/references \
  | rg -v "lessons-learned-|task-workflow-completed|task-workflow-active|workflow-task-sync-forms-d1-legacy-umbrella-artifact-inventory|legacy（UT-09 で廃止|historical:"
```

**想定誤りパターン**:

| パターン | 原因 | 対応 |
|---------|------|------|
| api-endpoints.md の current section に `/admin/sync/run` 等が残る | historical section への移送漏れ | 該当行を historical へ移送 |
| environment-variables.md で `GOOGLE_SHEETS_SA_JSON` が Required 表に残る | 格下げ漏れ | Required 表から削除し historical 表に追加 |
| 注記キーワード（"legacy（UT-09 で廃止"）の表記揺れ | プレフィクスが除外フィルタにマッチしない | 注記キーワードを Phase 2 で固定したフォーマットに統一 |

**復旧**: 該当 hit ごとに Phase 5 file-edit-runbook を再適用。

### 4.3 異常系 3: 逆リンク欠落

**症状**: backlink scan が 3 物理ファイル + 2 ledger fallback row に満たない。

**検出**:

```bash
rg -l "task-sync-forms-d1-legacy-umbrella-001" \
  docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
  docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver \
  docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary \
  | wc -l

rg -n "04c-parallel-admin-backoffice-api-endpoints.*task-sync-forms-d1-legacy-umbrella-001|09b-parallel-cron-triggers-monitoring-and-release-runbook.*task-sync-forms-d1-legacy-umbrella-001" \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md \
  | wc -l
```

**期待**: 物理 root 3 + ledger fallback 2

**想定誤りパターン**:

| パターン | 原因 | 対応 |
|---------|------|------|
| 物理 root が 0-2 件 hit | 03a / 03b / 02c の追記漏れ | Phase 5 backlink-runbook を該当タスクに再適用 |
| ledger fallback が 0-1 件 hit | 04c / 09b の active ledger row 追記漏れ | `task-workflow-active.md` の該当 row に追記 |
| 存在しない 04c / 09b path を参照 | workflow path existence gate 違反 | path を PASS 対象から外し ledger fallback へ戻す |

**復旧**: 不足タスクごとに逆リンクテンプレートを追記。

### 4.4 異常系 4: index drift（補助）

**症状**: indexes 再生成後に予期せぬ差分が発生。

**検出**:

```bash
mise exec -- pnpm indexes:rebuild
git diff .claude/skills/aiworkflow-requirements/indexes
```

**復旧**: 差分が本タスク由来のみであることを確認。他 skill の差分があれば別 commit / 別タスクに分離。

### 4.5 異常系 5: backlog supersede 失敗

**症状**: `task-workflow-backlog.md` で UT-DSC-* が active section に残る。

**検出**: Phase 4 backlog status scan で `status: superseded` が周辺 5 行以内に含まれない。

**復旧**: Phase 5 backlog supersede 手順を再適用。

---

## 統合テスト連携

- docs-only / NON_VISUAL のため runtime 統合テストは非該当。代替として rg scan、path existence、artifacts parity、Phase 12 readiness を各 phase の gate として扱う。

## 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-06/main.md` | 5 種異常系の検出手順 + 想定誤りパターン + 復旧手順 |

---

## 完了条件

- [ ] 5 種の異常系シナリオが定義済み
- [ ] 各シナリオの検出コマンドと復旧手順が明文化
- [ ] historical 編集禁止の徹底方法（git diff guard）が明示
- [ ] `artifacts.json` phase 6 status → `completed`

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| 異常系を全網羅できない | 既知 3 種に加え index drift / backlog supersede 失敗も含めて 5 種に拡張 |
| 復旧で他の current 編集を巻き戻す | 差分単位で手動復旧し、対象外ファイルの変更は巻き戻さない |

---

## 参照資料

- Phase 5 `outputs/phase-05/file-edit-runbook.md`
- Phase 5 `outputs/phase-05/backlink-runbook.md`
- Phase 4 `outputs/phase-04/regression-scan-commands.md`

---

## 9. 次フェーズへの引き継ぎ

Phase 7 で AC マトリクスを確定する。本 phase の異常系検出が全 PASS であることを DoD に含める。
