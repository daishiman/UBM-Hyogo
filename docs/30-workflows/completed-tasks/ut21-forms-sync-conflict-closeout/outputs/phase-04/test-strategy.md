# Phase 4 Output: Test Strategy（docs-only 整合性検証戦略）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 4 / 13（テスト戦略） |
| taskType | docs-only / specification-cleanup（legacy umbrella close-out） |
| 前 Phase | 3（設計レビュー） |
| 次 Phase | 5（実装ランブック：受入条件 patch 案） |
| visualEvidence | NON_VISUAL |

## 0. スコープ宣言（docs-only）

本タスクは `apps/api` / `apps/web` / `packages/shared` / D1 schema (DDL) / Zod schema をいずれも編集しない。
従来の unit / integration / e2e / coverage は対象外で、検証本質は次の **3 軸 + 1 補助** に絞られる。

1. **stale 参照の機械検出（grep based）**: 旧 UT-21 語彙が現行正本側に再混入していないかを `rg` で確認
2. **cross-link 死活**: 本タスク仕様書群と参照先（U02/U04/U05、姉妹 close-out、UT-21 当初仕様、aiworkflow-requirements references）の相互リンクが切れていないかを確認
3. **正本整合性 grep**: 03a / 03b / 04c / 09b の現行受入条件と Phase 5 patch 案の重複・矛盾を `rg` で突合
4. **手動目視レビュー（補助）**: grep で検出不能な意味論的衝突を 5 観点で点検

これらを Phase 7 AC マトリクス（特に AC-1 / AC-2 / AC-3 / AC-7 / AC-9 / AC-10）にトレースする。

## 1. 検証スイート 1: stale 参照 grep（旧 UT-21 語彙の混入検出）

| ID | 観点 | コマンド | 期待出力 |
| --- | --- | --- | --- |
| S1-01 | 単一 endpoint 復活誘惑 (`POST /admin/sync` / `GET /admin/sync/audit`) | `rg -n "POST /admin/sync\b\|GET /admin/sync/audit" docs/30-workflows .claude/skills/aiworkflow-requirements/references` | hit-allowed-paths のみ：本タスク仕様書（禁止文脈）/ UT-21 legacy / U02 |
| S1-02 | audit テーブル (`sync_audit_logs` / `sync_audit_outbox`) | `rg -n "sync_audit_logs\|sync_audit_outbox" docs/30-workflows .claude/skills/aiworkflow-requirements/references` | hit-allowed-paths のみ：U02 / 本タスク禁止文脈 / UT-21 legacy |
| S1-03 | 旧実装パス想定 | `rg -n "apps/api/src/sync/(core\|manual\|scheduled\|audit)" docs/30-workflows .claude/skills/aiworkflow-requirements/references` | hit-allowed-paths のみ：UT-21 legacy / U05 / 本タスク差分表 |
| S1-04 | Sheets API v4 同期元語彙 | `rg -n "spreadsheets\.values\.get\|Google Sheets API v4\|SheetRow" docs/30-workflows .claude/skills/aiworkflow-requirements/references` | hit-allowed-paths のみ：UT-21 legacy / 本タスク差分表 / U05 |
| S1-05 | 単一 `job_kind='sync'` への退化検出 | `rg -n "job_kind\s*=\s*['\"]sync['\"]" docs/30-workflows .claude/skills/aiworkflow-requirements/references` | zero-hit（`schema_sync` / `response_sync` のみ許容） |
| S1-06 | AC-10 規定コマンド | `rg -n "POST /admin/sync\b\|GET /admin/sync/audit\|sync_audit_logs\|sync_audit_outbox" docs/30-workflows .claude/skills/aiworkflow-requirements/references` | 既知 hit のみ（本タスク + UT-21 legacy + U02） |

合計 6 件（要件 6 件以上を満たす）。各コマンドは copy-paste 即実行可能。

### 許容パス allowlist（hit-allowed-paths）

```
docs/30-workflows/ut21-forms-sync-conflict-closeout/**          # 本タスク仕様書群（禁止文脈として明記）
docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md  # legacy 原典
docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md     # U02
docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md            # U05
docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md              # U04
.claude/skills/aiworkflow-requirements/references/task-workflow.md  # close-out 注記内のみ
```

これら以外で hit が検出された場合は Red（Phase 6 の failure case 5 / 6 / 7 / 13 へ転換）。

## 2. 検証スイート 2: cross-link 死活

```bash
# 本タスク仕様書群から外向きリンク（相対パス .md）を抽出
rg -n -oN "\.\.?/[A-Za-z0-9_\-/.]+\.md" docs/30-workflows/ut21-forms-sync-conflict-closeout > /tmp/ut21-outlinks.txt

# 各リンク先の実在確認
while IFS= read -r line; do
  src=$(echo "$line" | cut -d: -f1)
  rel=$(echo "$line" | cut -d: -f3-)
  base=$(dirname "$src")
  test -e "$base/$rel" || echo "BROKEN: $src -> $rel"
done < /tmp/ut21-outlinks.txt
```

`BROKEN:` が 0 件であることを期待。具体的に死活確認すべきリンクは以下。

| 起点 | リンク先 | 種別 |
| --- | --- | --- |
| `index.md` | `../README.md` | 上位 README |
| `index.md` | `../unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md` | 原典 close-out spec |
| `index.md` | `../unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` | UT-21 legacy |
| `index.md` | `../unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 姉妹 umbrella |
| `index.md` | `../unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md` | U02 |
| `index.md` | `../unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md` | U04 |
| `index.md` | `../unassigned-task/task-ut21-impl-path-boundary-realignment-001.md` | U05 |
| `phase-04`〜`phase-07` | 相互参照（cycle-free 化のため上向きのみ） | self-link |

サイクル検出: phase-N → phase-M（M > N）の前方リンクは禁止しない（次 Phase への引き渡し節は許容）。

## 3. 検証スイート 3: 正本整合性 grep（03a / 03b / 04c / 09b ↔ patch 案）

| ID | 観点 | コマンド | 判定基準 |
| --- | --- | --- | --- |
| S3-01 | 04c の Bearer guard 既述有無 | `rg -n "SYNC_ADMIN_TOKEN\|Bearer\|401\|403\|409" docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints` | 既述あり → Phase 5 patch 案 1 = 「補強」、なし → 「新規追記」 |
| S3-02 | 03a/03b の 409 排他 既述有無 | `rg -n "sync_jobs\.status\s*=\s*'running'\|409\s*Conflict" docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver` | 既述あり → 「補強」 |
| S3-03 | 03a/03b の D1 retry / SQLITE_BUSY / batch-size | `rg -n "SQLITE_BUSY\|backoff\|batch.?size\|retry" docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver` | 既述あり → 「補強」 |
| S3-04 | 09b の manual smoke / runbook | `rg -n "manual smoke\|runbook\|Cron Triggers\|pause\|resume" docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook` | 既述あり → 「補強」 |

これら grep 結果を Phase 5 で patch 種別（補強 / 新規追記）に反映する。

## 4. 検証スイート 4: 手動目視レビュー観点（grep で検出不能な論点）

| # | 観点 | チェック内容 |
| --- | --- | --- |
| M-01 | API 境界の意味的衝突 | `/admin/sync/schema` + `/admin/sync/responses` 2 系統が `job_kind` 単一責務原則と整合しているかを文脈判定 |
| M-02 | U02 判定の前倒し誘惑 | 本タスク内で `sync_jobs` 不足分析を実施し U02 を不要と decision していないか |
| M-03 | 実装パス想定ずれ | patch 案で言及するパスが現行 `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` と一致しているか |
| M-04 | 不変条件 #5 抵触 | `apps/web` 側に D1 直接アクセス記述が混入していないか（grep だけでは判定不能な文脈レベル） |
| M-05 | UT-21 legacy 状態欄 | UT-21 当初仕様書状態欄に「legacy / superseded by ut21-forms-sync-conflict-closeout」と明記されているか（Phase 12 適用後） |

合計 5 件（要件 4 件以上を満たす）。

## 5. AC × 検証スイート 対応表（空セル無し）

| AC# | スイート 1 (stale) | スイート 2 (cross-link) | スイート 3 (整合性) | スイート 4 (manual) |
| --- | --- | --- | --- | --- |
| AC-1 | ○ (S1-01〜S1-04) | - | - | ○ (M-01) |
| AC-2 | - | - | ○ (S3-01〜S3-04) | ○ (M-01) |
| AC-3 | ○ (S1-01) | - | - | ○ (M-05) |
| AC-4 | ○ (S1-02) | - | - | ○ (M-02) |
| AC-5 | - | ○ | - | - |
| AC-6 | - | - | ○ (S3-01〜S3-04) | - |
| AC-7 | ○ (S1-04, S1-05) | - | ○ | ○ (M-02, M-03) |
| AC-8 | - | - | - | ○ (全件) |
| AC-9 | - | - | - | ○ (M-04) |
| AC-10 | ○ (S1-06 = 規定 rg) | - | - | - |
| AC-11 | - | - | - | ○ (`gh issue view 234 --json state`) |

すべての AC が 1 件以上の検証手段に紐付く。

## 6. TDD 相当の Red→Green サイクル（docs 版）

| サイクル | 内容 |
| --- | --- |
| Red | stale grep が許容外で hit / cross-link が BROKEN / 整合性 grep で重複定義検出 / 手動レビューで MAJOR |
| Green | 本タスク内文書を patch 案・cross-link 修正 / 03a/03b/04c/09b 側は本タスクで触らず Phase 5 patch 案として提示 |
| Refactor | 重複表記を 1 箇所に集約（DRY 化は Phase 8 で実施） |

## 7. AC-10 規定 rg の運用ルール

```bash
# AC-10 規定コマンド（Phase 9 で実測ログを outputs/phase-09/stale-grep-evidence.md へ記録する）
rg -n "POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox" \
  docs/30-workflows .claude/skills/aiworkflow-requirements/references
```

- 出力を `tee` で保存し、許容パス分類（allowlist との突合）を表として残す
- 許容外 hit が 1 行でもあれば NO-GO（Phase 10 ゲート）
- Phase 1 §10 / Phase 2 §(g) の再現性が AC-7 の根拠になる

## 8. 統合テスト連携（次 Phase 引き渡し）

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | S3-01〜S3-04 の grep 結果を patch 案分類（補強 / 新規追記）に反映 |
| Phase 6 | 各検証スイートで検出される failure case を異常系の入力に転換 |
| Phase 7 | AC × スイート 対応表をそのままトレース表へ転記 |
| Phase 9 | stale grep / cross-link / 整合性 grep を実測ログとして保存 |
| Phase 11 | 手動目視観点 5 件を smoke 観点に転記 |

## 9. 多角的チェック観点

- 価値性: AC-1〜AC-11 すべてが 1 つ以上の検証手段で検証可能（§5 表で網羅）
- 実現性: 全 grep / link チェックがローカル `rg` のみで完結し、Cloudflare Secret 等を要求しない
- 整合性: 03a/03b/04c/09b の現行仕様を本 Phase 内で書き換えない（読み取りのみ）
- 運用性: コマンドが copy-paste で動作（変数 / heredoc 不使用）
- 不変条件: #5（D1 アクセス境界）/ #7（Forms 再回答経路）の検出が M-04 / M-03 に組み込まれている
- スコープ境界: U02 / U05 への前倒しを M-02 で拒絶

## 10. 完了条件チェック

- [x] 検証スイート 4 種 × 対象パスのマトリクスに空セル無し
- [x] rg コマンドが 6 件以上列挙（S1-01〜S1-06 = 6 件、AC-10 規定 = S1-06）
- [x] cross-link 死活確認手順が記述（BROKEN 0 件期待）
- [x] 03a/03b/04c/09b 整合性 grep が 4 観点（S3-01〜S3-04）で記述
- [x] 手動目視観点が 4 件以上（実態 5 件: M-01〜M-05）
- [x] AC-1〜AC-11 すべてが 1 つ以上のスイートに紐付く

## 11. visualEvidence

NON_VISUAL のため screenshot は不要。Phase 11 はテキスト証跡（`outputs/phase-11/manual-smoke-log.md` + `spec-integrity-check.md`）で代替する。
