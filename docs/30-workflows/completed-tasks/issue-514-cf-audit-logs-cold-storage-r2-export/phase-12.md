# Phase 12: ドキュメント整備（必須 6 タスク + 7 outputs）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 親タスク | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/index.md` |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 適用仕様 | [phase-12-spec.md](../../../.claude/skills/task-specification-creator/references/phase-12-spec.md) |

## 目的

Issue #514 の cold storage / R2 export 実装 / Phase 1-11 evidence を踏まえ、必須 6 タスク（Task 12-1〜12-6）と 7 outputs（main.md + 6 補助）を揃え、SSOT を same-wave で同期する。runtime evidence は Phase 11 で `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のため、本 phase の総合判定行は **`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`** とし、`PASS` 単独表記を禁止する。

## 必須 outputs（7 ファイル / 逐語固定 / 短縮名禁止）

| # | ファイル（canonical absolute path） | 由来 Task | 欠落時 |
| - | --- | --- | --- |
| 1 | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/outputs/phase-12/main.md` | Phase 12 本体 | FAIL |
| 2 | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/outputs/phase-12/implementation-guide.md` | Task 12-1 | FAIL |
| 3 | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/outputs/phase-12/system-spec-update-summary.md` | Task 12-2 | FAIL |
| 4 | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/outputs/phase-12/documentation-changelog.md` | Task 12-3 | FAIL |
| 5 | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/outputs/phase-12/unassigned-task-detection.md` | Task 12-4（0 件でも必須） | FAIL |
| 6 | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/outputs/phase-12/skill-feedback-report.md` | Task 12-5（改善なしでも必須） | FAIL |
| 7 | `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-6 | FAIL |

短縮名（`impl-guide.md` / `feedback-report.md` 等）は禁止。

---

## Task 12-1: 実装ガイド作成（Part 1 中学生 + Part 2 技術者）

### Part 1（中学生レベル）必須要素

- 日常の例え話を 1 つ以上含める。**推奨**: 「学校の図書館で古い本を倉庫（R2）に移し、台帳（manifest）に何月何日にどこへ移したかを書き、半年に 1 回倉庫から本を取り出して中身が崩れていないか（restore drill）確認する」。
- 専門用語セルフチェック表を 5 用語以上：

| 専門用語 | 日常語 |
| --- | --- |
| R2 bucket | クラウド上の大きなフォルダ |
| binding (`UBM_AUDIT_COLD_STORAGE`) | サーバーがフォルダにアクセスするための接続口 |
| D1 / `cf_audit_log` | 過去 30 日の足跡を入れる近場の引き出し |
| manifest (`cf_audit_log_export_manifest`) | 何月何日にどのファイルを倉庫に入れたかの台帳 |
| restore drill | 倉庫から本を取り出して中身が消えていないか半年に 1 回確認する訓練 |
| redaction | 個人名や合言葉を黒塗りにすること |
| object key (`audit/v1/yyyy=YYYY/mm=MM/dd=DD/...`) | 倉庫の棚番号 |

- 「なぜ必要か（D1 が 30 日で消えるので半年監査に耐えない）」を「何をするか（毎月 R2 に redacted コピーを移す）」より先に書く。

### Part 2（技術者レベル）必須要素

- D1 → JSONL → gzip → R2 PutObject の sequence と 2-phase commit（manifest pending → completed）
- `runtime path × evidence` 表（fixture / dry-run / production 日次 / 半期 restore drill）
- 主要シグネチャ:
  - `exportToR2({ env, dateRange, redactionPolicyVersion }): Promise<ExportManifestRow>`
  - `restoreDrill({ env, objectKey, targetTempTable }): Promise<{ rowCount: number; hash: string }>`
- TypeScript 型: `ExportManifestRow`, `RedactionPolicyV1`, `R2ObjectKey`
- エラーハンドリング: redaction grep ヒット時 fail-closed / R2 PutObject 失敗時の manifest rollback / `If-None-Match` 重複防止
- 設定値・パラメータ一覧: 30 日境界、日次 schedule `0 2 * * *`、半期 restore drill `0 2 1 1,7 *`、object key UTC、gzip 単位 1 日

> 元仕様書（本 `phase-12.md`）に Part 1 ドラフトがある場合は **逐語コピー**。AI による「整え」を加えない。

---

## Task 12-2: システム仕様書更新（SSOT 同期 / canonical absolute path）

| Step | 必須 | 同期対象（canonical absolute path） |
| --- | --- | --- |
| 1-A | ✅ | `docs/30-workflows/LOGS.md` に Issue #514 完了行追記 |
| 1-A | ✅ | `.claude/skills/aiworkflow-requirements/LOGS.md` に Phase 12 close-out 行追記 |
| 1-A | ✅ | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` を `mise exec -- pnpm indexes:rebuild` で再生成 |
| 1-B | ✅ | 実装状況テーブル（`docs/30-workflows/task-workflow-active.md` 等）の本タスク行を `verified` + `implementation_complete_pending_pr` に更新 |
| 1-C | ✅ | 関連タスク表（U-FIX-CF-ACCT-01 wave / UT-25-DERIV-03 / U-FIX-CF-ACCT-01-DERIV-03）のステータス drift 解消 |
| 1-D | 条件 | `runbook-diff-plan.md` を作成し、本 wave で 15-infrastructure-runbook を更新する旨を確定 |
| 2 | ✅ | **新規 SSOT 追加が発火**: 下表参照 |

### Step 2 同期対象（canonical absolute path で必ず列挙）

| # | 同期先（canonical absolute path） | 追記内容 |
| --- | --- | --- |
| S2-1 | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | cold storage 30 日境界契約 / R2 binding 名 `UBM_AUDIT_COLD_STORAGE` / 日次 export schedule / 半期 restore drill / redaction 二重化 / manifest 2-phase commit |
| S2-2 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | R2 bucket 作成手順（Phase 13 G1 後）/ lifecycle policy（Standard → Infrequent Access のみ、auto-delete なし）/ rollback 経路（workflow 無効化 + R2 binding 解除）/ 半期 restore drill 手順 |
| S2-3 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | R2 binding `UBM_AUDIT_COLD_STORAGE` の production / preview env 定義 / export Token `CF_AUDIT_R2_TOKEN_PROD` の 1Password / GitHub Secrets 配備経路 / 監視 Token との分離方針 / 90 日 rotation との同期 |
| S2-4 | `docs/30-workflows/LOGS.md` | Issue #514 完了行（Phase 12 close-out / runtime evidence pending） |
| S2-5 | `.claude/skills/aiworkflow-requirements/LOGS.md` | observability-monitoring / deployment-secrets-management 更新行 |

> Step 2 は「public response 不変でも back-fill / CPU budget / retryable error / owner boundary / DB 実スキーマ差分吸収」が入る場合に発火する（[phase-12-spec.md](../../../.claude/skills/task-specification-creator/references/phase-12-spec.md) §Task 2）。本タスクは新規 binding / 新規 D1 table / 新規 workflow を追加するため **Step 2 必須**。

### `outputs/artifacts.json` parity（compliance-check 文言）

本ワークフローでは `outputs/artifacts.json` を作成しない方針なら以下を逐語記述:

> `outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。

両方存在する場合は `cmp -s artifacts.json outputs/artifacts.json` 実測結果を記述。

---

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を記録:

- 更新日 / 更新ファイル（canonical absolute path）/ 更新行範囲 / 更新理由 / 関連 PR（後追い）
- 生成補助: `node scripts/generate-documentation-changelog.js` を実行（存在する場合）

---

## Task 12-4: 未タスク検出レポート（0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` に以下を記録:

| ソース | 確認項目 |
| --- | --- |
| 元タスク仕様書「含まない」 | ML anomaly detection / GitHub audit log merge / SIEM 連携 / Slack 通知 / redaction policy 刷新 |
| Phase 3/10 レビュー MINOR | （該当があれば列挙） |
| Phase 11 発見事項 | （該当があれば列挙） |
| コードコメント | TODO / FIXME / HACK / XXX |
| 苦戦箇所継承 | object key TZ / gzip 単位 / lifecycle delete 禁止 |

> **0 件でも「0 件である」旨を明記必須**。生成された未タスクファイルは `unassigned-task-quality-standards.md` のファイル命名規則 / `<cat>` 語彙に従う。

検出補助:

```bash
node scripts/detect-unassigned-tasks.js \
  --scan apps/api,scripts/cf-audit-log \
  --output .tmp/unassigned-candidates-issue-514.json
```

---

## Task 12-5: スキルフィードバックレポート（改善なしでも 3 観点固定で出力必須）

`outputs/phase-12/skill-feedback-report.md` に以下 3 観点を **必ず** 記録（改善なしでも「改善なし」と明記）:

| 観点 | 記録内容 |
| --- | --- |
| テンプレート改善 | NON_VISUAL 縮約テンプレ / G1-G4 ゲートの曖昧さ / runtime evidence pending 内訳の不足 |
| ワークフロー改善 | 30 日境界契約 / 2-phase commit / redaction grep の機械検証導線 |
| ドキュメント改善 | observability-monitoring / 15-infrastructure-runbook / deployment-secrets-management の re-use 可能化 |

各 item は Step 1-H の routing（promote / defer / reject）と紐付ける。

---

## Task 12-6: タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md` に以下を記録:

### 7 outputs 実体確認表

| # | ファイル | 実体 | 短縮名チェック |
| --- | --- | --- | --- |
| 1〜7 | 上記 7 ファイル | OK / FAIL | 逐語一致 OK / 短縮名検出 FAIL |

### G1-G4 status 表（[phase-template-phase13.md](../../../.claude/skills/task-specification-creator/references/phase-template-phase13.md) §G1-G4 連動）

| Gate | 操作 | status | evidence path |
| --- | --- | --- | --- |
| G1 | production R2 binding 登録 + Secret 配備 | PENDING | `outputs/phase-13/g1-deploy-production.log`（後追い） |
| G2 | D1 migration `0015_add_audit_export_manifest.sql` apply | PENDING | `outputs/phase-13/g2-d1-applied-fresh-production.log`（後追い） |
| G3-prod | 初回日次 export + restore drill | PENDING | `outputs/phase-13/g3-export-first-run.log`（後追い） |
| G4 | commit / push / PR | PENDING | `outputs/phase-13/pr-info.md`（後追い） |

### Implementation evidence path 状態揃え 6 項目チェック

[phase-12-spec.md](../../../.claude/skills/task-specification-creator/references/phase-12-spec.md) §「Implementation evidence path 状態揃え checklist」の 6 項目すべてを順に検証し、結果を記録。

### 総合判定行

- **採用**: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
- **禁止**: `PASS` 単独 / `verified` 単独
- 根拠: spec contract 完了 / runtime evidence は G1-G4 ゲート後に取得

---

## 検証コマンド

| # | コマンド | 期待 |
| --- | --- | --- |
| V-1 | `mise exec -- pnpm typecheck` | exit 0 |
| V-2 | `mise exec -- pnpm lint` | exit 0 |
| V-3 | `mise exec -- pnpm indexes:rebuild` | topic-map 再生成 |
| V-4 | `ls outputs/phase-12/` | 7 ファイル全て存在 |
| V-5 | `rg -n 'impl-guide\|feedback-report\.md\|unassigned-tasks\.md\|spec-update\.md\|compliance-check\.md\|doc-changelog' outputs/phase-12/` | 短縮名 0 件 |
| V-6 | `rg -n '^\| [^|]*\| PASS \|' outputs/phase-12/phase12-task-spec-compliance-check.md` | `PASS` 単独表記 0 件 |

## DoD

- [ ] 7 outputs 実体配置 + 逐語ファイル名
- [ ] Task 12-1 Part 1 中学生レベル + Part 2 技術者レベル の双方記載
- [ ] Step 1-A〜1-C / Step 2（S2-1〜S2-5）の SSOT 同期完了 or `PASS_WITH_OPEN_SYNC` 根拠記載
- [ ] Task 12-4 が 0 件でも明記
- [ ] Task 12-5 の 3 観点が改善なしでも明記
- [ ] Task 12-6 で G1-G4 status 表 + 6 項目 checklist + `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 採用
- [ ] V-1〜V-6 全て PASS

## 関連参照

- [phase-12-spec.md](../../../.claude/skills/task-specification-creator/references/phase-12-spec.md)
- [phase-template-phase11.md](../../../.claude/skills/task-specification-creator/references/phase-template-phase11.md)
- [phase-template-phase13.md](../../../.claude/skills/task-specification-creator/references/phase-template-phase13.md)
- [index.md](./index.md)
- [phase-11.md](./phase-11.md)
- [phase-13.md](./phase-13.md)
