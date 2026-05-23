# Phase 11: 手動 smoke

[実装区分: ドキュメントのみ]

**判定根拠**: NON_VISUAL タスク（UI/UX 変更なし）。実 smoke は rg コマンドの before/after 比較に置換。runtime code / browser 操作なし。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

NON_VISUAL タスクとして、Phase 5 ランブック適用前後の `rg` 出力比較を smoke evidence として記録する。スクリーンショットは作成しない（UI/UX 変更がないため）。

---

## 2. スコープ

### 対象

- 編集前後の rg 出力比較（stale current scan）
- 編集前後の backlink scan 比較
- 編集前後の backlog status scan 比較
- NON_VISUAL 宣言と非該当理由の記録

### 対象外

- スクリーンショット撮影
- playwright / browser 操作
- UI sanity visual review（非該当）

---

## 3. 前提条件

- Phase 10 で go / conditional-go 判定済み
- Phase 5 ランブック実行直前と直後の状態が再現可能

---

## 実行タスク

### 4.1 NON_VISUAL 宣言

`outputs/phase-11/manual-test-result.md` の冒頭に以下を明記:

```markdown
## NON_VISUAL 宣言

- タスク種別: docs-only
- 視覚証跡: NON_VISUAL
- 非視覚的理由: 編集対象は `.claude/skills/aiworkflow-requirements/references/*.md` のドキュメントのみ。UI / runtime 動作変更なし。
- 代替証跡: 編集前後の `rg` 出力比較（本ファイル参照）
- スクリーンショットを作らない理由: 表示される画面が存在しない
- 主証跡ソース: rg-before.txt / rg-after.txt の diff
```

### 4.2 before snapshot 取得（Phase 5 ランブック実行直前）

```bash
mkdir -p docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11

rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" \
  .claude/skills/aiworkflow-requirements/references \
  > docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/rg-before.txt

rg -l "task-sync-forms-d1-legacy-umbrella-001" \
  docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
  docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver \
  docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary \
  > docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/backlink-before.txt

rg -n "04c-parallel-admin-backoffice-api-endpoints.*task-sync-forms-d1-legacy-umbrella-001|09b-parallel-cron-triggers-monitoring-and-release-runbook.*task-sync-forms-d1-legacy-umbrella-001" \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md \
  > docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/backlink-ledger-before.txt
```

### 4.3 after snapshot 取得（Phase 5 ランブック実行直後）

```bash
rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" \
  .claude/skills/aiworkflow-requirements/references \
  > docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/rg-after.txt

rg -l "task-sync-forms-d1-legacy-umbrella-001" \
  docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
  docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver \
  docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary \
  > docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/backlink-after.txt

rg -n "04c-parallel-admin-backoffice-api-endpoints.*task-sync-forms-d1-legacy-umbrella-001|09b-parallel-cron-triggers-monitoring-and-release-runbook.*task-sync-forms-d1-legacy-umbrella-001" \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md \
  > docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/backlink-ledger-after.txt
```

### 4.4 diff 記録

```bash
diff docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/rg-before.txt \
     docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/rg-after.txt \
  > docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/rg-before-after.md

diff docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/backlink-before.txt \
     docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/backlink-after.txt \
  >> docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/rg-before-after.md

diff docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/backlink-ledger-before.txt \
     docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/backlink-ledger-after.txt \
  >> docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/outputs/phase-11/rg-before-after.md
```

### 4.5 期待 diff

| scan | before | after | 期待 diff |
|------|--------|-------|----------|
| stale current scan | 既知 hit（references 5 + backlog 2 = 多数） | historical / 注記付き行のみ残存 | current 行が historical 化または削除されている |
| backlink scan | 5 未満（追記前） | 3 physical file hit + 2 ledger fallback row | 追記分が新規 hit として現れる |

### 4.6 manual-test-result.md 記録項目

メタ情報セクション必須項目:

- 実施者: claude code（automated）
- 実施日時: 実行時刻
- 証跡の主ソース: rg-before.txt / rg-after.txt / rg-before-after.md
- スクリーンショットを作らない理由: NON_VISUAL（UI/UX 変更なし）
- 仕様判断根拠: Phase 1 inventory + Phase 2 classification-policy + Phase 5 ランブック
- 実行記録: 各 rg コマンドの exit code と出力サマリ

---

## 統合テスト連携

- docs-only / NON_VISUAL のため runtime 統合テストは非該当。代替として rg scan、path existence、artifacts parity、Phase 12 readiness を各 phase の gate として扱う。

## 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-11/main.md` | smoke サマリ |
| `outputs/phase-11/manual-test-result.md` | NON_VISUAL 宣言 + 主証跡 + 実行記録（fixed phrase）|
| `outputs/phase-11/rg-before.txt` | 編集前 stale scan 生出力 |
| `outputs/phase-11/rg-after.txt` | 編集後 stale scan 生出力 |
| `outputs/phase-11/backlink-before.txt` | 編集前 backlink scan 生出力 |
| `outputs/phase-11/backlink-after.txt` | 編集後 backlink scan 生出力 |
| `outputs/phase-11/backlink-ledger-before.txt` | 編集前 ledger fallback backlink scan 生出力 |
| `outputs/phase-11/backlink-ledger-after.txt` | 編集後 ledger fallback backlink scan 生出力 |
| `outputs/phase-11/rg-before-after.md` | diff レポート |

---

## 完了条件

- [ ] NON_VISUAL 宣言が `manual-test-result.md` 冒頭に記載
- [ ] before / after の rg 出力が両方保存済み
- [ ] diff レポートが期待 diff と整合
- [ ] スクリーンショット不要の理由が明記
- [ ] 証跡の主ソースが明示
- [ ] `screenshots/.gitkeep` を作らない（NON_VISUAL のため）
- [ ] `artifacts.json` phase 11 status → `completed`

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| before snapshot を取り忘れて diff 不能になる | Phase 5 ランブック開始前に Phase 11 のステップ 4.2 を必ず実行 |
| diff が期待と異なり current drift が残る | Phase 6 異常系 2 の復旧手順を適用し Phase 5 を再適用 |
| NON_VISUAL 判定根拠が薄い | 「UI / runtime 動作変更なし」を明示し、編集対象が md のみであることを宣言文に含める |

---

## 参照資料

- Phase 5 ランブック
- Phase 6 異常系手順
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`
- `.claude/skills/task-specification-creator/references/phase-template-audit-task.md`（NON_VISUAL 分岐）

---

## 9. 次フェーズへの引き継ぎ

Phase 12 で本 phase の証跡を implementation-guide.md の「視覚証跡」セクションに引用する（UI/UX 変更なしのため Phase 11 スクリーンショット不要、と固定フレーズで記載）。
