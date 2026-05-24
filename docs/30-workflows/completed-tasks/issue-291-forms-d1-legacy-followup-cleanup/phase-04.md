# Phase 4: テスト戦略

[実装区分: ドキュメントのみ]

**判定根拠**: docs-only タスクのため、ユニット/E2E テスト追加は不要。本 phase は **regression scan command suite** を設計する。runtime code 変更なし。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

docs-only タスクにおける「テスト」相当として、編集後に以下が成立することを機械検証するコマンドセットを設計する。

- current guidance として stale な API / endpoint / table が残らない
- conflict marker が混入していない
- skill indexes が drift していない
- 3 物理タスク + 2 ledger fallback から legacy umbrella が逆引きできる

---

## 2. スコープ

### 対象

- regression scan command（rg-based）
- conflict marker scan
- index drift scan
- backlink scan
- 期待結果の定義（PASS / FAIL 判定）

### 対象外

- vitest / playwright 等のテストフレームワーク導入
- runtime code への test 追加

---

## 3. 前提条件

- Phase 3 で go 判定済み
- `rg` / `node` / `pnpm` 利用可能

---

## 実行タスク

### 4.1 stale current scan（最重要 gate）

```bash
# 編集後に current guidance としての stale hit が残らないことを確認
rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" \
  .claude/skills/aiworkflow-requirements/references \
  | rg -v "lessons-learned-|task-workflow-completed|task-workflow-active|workflow-task-sync-forms-d1-legacy-umbrella-artifact-inventory|legacy（UT-09 で廃止|historical:"
```

**期待**: 0 hit（historical / 注記付き行は除外フィルタで除く）

### 4.2 conflict marker scan

```bash
rg -n "^(<<<<<<<|=======|>>>>>>>)" \
  .claude/skills/aiworkflow-requirements/references \
  docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup
```

**期待**: 0 hit

### 4.3 backlink scan

```bash
# 物理 root が存在する 03a / 03b / 02c
rg -l "task-sync-forms-d1-legacy-umbrella-001" \
  docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
  docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver \
  docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary

# 物理 root が現 worktree に存在しない 04c / 09b
rg -n "04c-parallel-admin-backoffice-api-endpoints.*task-sync-forms-d1-legacy-umbrella-001|09b-parallel-cron-triggers-monitoring-and-release-runbook.*task-sync-forms-d1-legacy-umbrella-001" \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
```

**期待**: 物理 root 3 ファイル + ledger fallback 2 row（04c / 09b）。存在しない path を PASS 判定に含めない。

### 4.4 index drift scan

```bash
mise exec -- pnpm indexes:rebuild
git diff --stat .claude/skills/aiworkflow-requirements/indexes
```

**期待**: rebuild 後に `git diff` 差分なし（drift なし）

### 4.5 Phase 12 readiness scan

```bash
jq '.phases[] | select(.phase == 12) | .outputs' docs/30-workflows/issue-291-forms-d1-legacy-followup-cleanup/artifacts.json
```

**期待**: strict 7 outputs（main.md + 必須 6 成果物）が列挙済み。`verify-pr-ready.sh` は Phase 12 成果物生成後の Phase 13 pre-flight で実行する。

### 4.6 backlog status scan

```bash
rg -n "UT-DSC-MIGRATION-SCRIPT-001|UT-DSC-SYNC-AUDIT-APPEND-ONLY-001" \
  .claude/skills/aiworkflow-requirements/references/task-workflow-backlog.md
```

**期待**: 該当 entry の周辺 5 行以内に `status: superseded` を含む

---

## 統合テスト連携

- docs-only / NON_VISUAL のため runtime 統合テストは非該当。代替として rg scan、path existence、artifacts parity、Phase 12 readiness を各 phase の gate として扱う。

## 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-04/main.md` | テスト戦略サマリ |
| `outputs/phase-04/regression-scan-commands.md` | コマンド一覧 + 期待結果 + 失敗時の trace 手順 |

---

## 完了条件

- [ ] 6 種類の scan command が確定（stale / conflict / backlink / index / phase12 / backlog）
- [ ] 各コマンドの期待結果と判定基準が明文化
- [ ] 失敗時の trace 手順が `regression-scan-commands.md` に記載
- [ ] `artifacts.json` phase 4 status → `completed`

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| stale scan の除外フィルタで current drift も除外してしまう | 除外パターンは「legacy（UT-09 で廃止」「historical:」など編集時に意図的に付与する prefix に限定し、ファイル名ベース除外は historical 専用 file 群のみ |
| backlink scan が一部完了済みディレクトリの path 変更で誤検知 | path を Phase 1 inventory 時点で固定し、変更があれば Phase 5 ランブックの参照 path も同期更新 |
| index rebuild が `pnpm install` 未実行で失敗 | Phase 4 開始時に `mise exec -- pnpm install` 済みを前提条件として明示 |

---

## 参照資料

- Phase 2 `outputs/phase-02/classification-policy.md`
- Phase 3 `outputs/phase-03/main.md`
- `.github/workflows/verify-indexes.yml`
- `scripts/verify-pr-ready.sh`（Phase 13 pre-flight）

---

## 9. 次フェーズへの引き継ぎ

Phase 5 のランブックは本 phase で確定した scan command を「実装後セルフチェック」セクションに組み込む。Phase 9 品質保証 / Phase 11 手動 smoke で同じコマンドを再実行する。
