# Phase 11: NON_VISUAL evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-109-ut-02a-tag-assignment-queue-management |
| Issue | #109 [UT-02A] tag_assignment_queue 管理 Repository / Workflow |
| Phase 番号 | 11 / 13 |
| Phase 名称 | NON_VISUAL evidence（手動検証） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 作成日 | 2026-05-01 |
| 前 Phase | 10 (最終レビューゲート) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |

## 目的

`artifacts.json.metadata.visualEvidence == "NON_VISUAL"` のため、screenshot は不要（生成禁止: false green 防止）。
`bash scripts/cf.sh d1 execute` 経由で D1 binding に対し queue insert / status transition / retry / DLQ の動作を手動検証し、不変条件 #5（D1 直接アクセスは apps/api に閉じる）/ #13（02a memberTags.ts read-only 維持）が実装で守られていることを実証する。

## 発火条件の機械判定

```bash
jq -r '.metadata.visualEvidence // empty' \
  docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/artifacts.json
# 期待: NON_VISUAL → 本縮約テンプレを適用
```

## 必須 outputs（NON_VISUAL 縮約テンプレ準拠）

| ファイル | 役割 | 最小フォーマット |
| --- | --- | --- |
| `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式（NON_VISUAL）/ 発火条件 / 必須 outputs 一覧 / 第一適用例参照 |
| `outputs/phase-11/non-visual-evidence.md` | D1 binding 経由の動作 evidence | 「実行コマンド / 期待結果 / 実測 / PASS or FAIL」テーブル |
| `outputs/phase-11/manual-verification-log.md` | 手動検証セッションのログ | 実行日時 / branch / 実行者 / 主証跡（vitest 件数 + cf.sh d1 出力） |

VISUAL タスクの必須 outputs（manual-test-checklist.md / screenshot-plan.json 等）とは別セット。混在禁止。

## 実行タスク

1. local apps/api で `pnpm dev` または contract test fixture から D1 binding を確保
2. `bash scripts/cf.sh d1 execute` で queue insert / status transition / retry / DLQ を実機検証
3. 各シナリオの実行ログを `non-visual-evidence.md` に記録
4. audit_log への記録を SQL で確認
5. 02a memberTags.ts への write 経路が無いことを grep で再実証
6. apps/web からの D1 / queue 直接参照が無いことを grep で再実証

## 検証シナリオ

### シナリオ 1: queue enqueue 正常系（candidate 投入）

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env staging --command \
  "INSERT INTO tag_assignment_queue (id, member_id, tag_codes_json, status, attempts, created_at) \
   VALUES ('q_smoke_001', 'm_smoke_001', '[\"ai\"]', 'queued', 0, datetime('now'));"

bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env staging --command \
  "SELECT id, status, attempts FROM tag_assignment_queue WHERE id='q_smoke_001';"
# 期待: status='queued', attempts=0
```

### シナリオ 2: status transition (queued → resolved)

```bash
# repository 経由（apps/api ローカル経由で API を叩くか、unit test fixture を流用）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env staging --command \
  "SELECT status FROM tag_assignment_queue WHERE id='q_smoke_001';"
# 期待: status='resolved'（仕様語: confirmed）

bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env staging --command \
  "SELECT action FROM audit_log WHERE entity_id='q_smoke_001' ORDER BY created_at;"
# 期待: 'admin.tag.queue_enqueued', 'admin.tag.queue_resolved' の 2 行
```

### シナリオ 3: status transition (queued → rejected)

- 別 queue row に対し reject 経路を実行
- 期待: `status='rejected'`、`audit_log` に `admin.tag.queue_rejected` entry

### シナリオ 4: retry attempts cap → DLQ 移送

```bash
# attempts を cap 直前まで増やしてから transition を試行
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env staging --command \
  "UPDATE tag_assignment_queue SET attempts=4 WHERE id='q_smoke_002';"
# repository.transition() 呼び出しで 3 回目超過を試行

bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env staging --command \
  "SELECT status, attempts FROM tag_assignment_queue WHERE id='q_smoke_002';"
# 期待: status='dlq', attempts=3

bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env staging --command \
  "SELECT action FROM audit_log WHERE entity_id='q_smoke_002';"
# 期待: 'admin.tag.queue_dlq' を含む
```

### シナリオ 5: idempotency

- 同一 idempotency key で enqueue を 2 回呼び出し
- 期待: queue row は 1 件のみ、audit_log の `admin.tag.queue_enqueued` は 1 件のみ

### シナリオ 6: 仕様語 ↔ DB 語 変換

- API response（仕様語 `candidate` / `confirmed` / `rejected`）と D1 実値（`queued` / `resolved` / `rejected` / `dlq`）が aliasMap で 1:1 に変換されること
- evidence: API response JSON と D1 SELECT 結果を並べて比較

### シナリオ 7: 02a memberTags.ts write 経路 0 件（不変条件 #13 実証）

```bash
grep -RIn "INSERT INTO member_tags\|UPDATE member_tags\|DELETE FROM member_tags" apps/api/src
grep -RIn "memberTags.*\.\(insert\|update\|delete\)" apps/api/src
# 期待: 0 件（02a 配下から member_tags への write 経路なし）

grep -RIn "from.*repositories/memberTags" apps/api/src
# 期待: read 用途（select）の参照のみ
```

### シナリオ 8: apps/web から D1 / queue 直接参照 0 件（不変条件 #5 実証）

```bash
grep -RIn "DB_BINDING\|d1\.prepare\|from.*lib/queue" apps/web/src
# 期待: 0 件
```

## evidence 一覧

| evidence | path | 種別 |
| --- | --- | --- |
| シナリオ 1 enqueue | `outputs/phase-11/sql/enqueue.txt` | text |
| シナリオ 2 transition resolved | `outputs/phase-11/sql/transition-resolved.txt` | text |
| シナリオ 3 transition rejected | `outputs/phase-11/sql/transition-rejected.txt` | text |
| シナリオ 4 DLQ 移送 | `outputs/phase-11/sql/dlq-transfer.txt` | text |
| シナリオ 5 idempotency | `outputs/phase-11/sql/idempotency.txt` | text |
| シナリオ 6 aliasMap 比較 | `outputs/phase-11/sql/alias-map-compare.txt` | text |
| シナリオ 7 grep memberTags | `outputs/phase-11/grep/membertags-write.txt` | text |
| シナリオ 8 grep apps/web | `outputs/phase-11/grep/web-direct-d1.txt` | text |
| audit_log 全行 | `outputs/phase-11/sql/audit-log-all.txt` | text |

## manual-verification-log.md 必須メタ

- 実行日時 / 実行者（branch 名）
- 主証跡: 自動テスト件数（例: vitest `XX/XX PASS`）+ `cf.sh d1 execute` 実行回数
- screenshot を作らない理由: `NON_VISUAL`（artifacts.json で確定）
- 検証環境: staging D1（`ubm-hyogo-db-dev`）

## 多角的チェック観点

| 不変条件 | 手動確認 | 結果 |
| --- | --- | --- |
| #5 | apps/web から D1 / queue 直接参照 0 件（grep 実証） | TBD |
| #13 | 02a memberTags.ts read-only（grep 実証） | TBD |
| 監査 | 全 transition に audit_log entry（SQL 実証） | TBD |
| retry / DLQ | attempts cap 到達で DLQ 移送（SQL 実証） | TBD |
| 仕様語 ↔ DB 語 | aliasMap 双方向 1:1（API + SQL 比較） | TBD |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | NON_VISUAL evidence を documentation-changelog へ転記 |
| Phase 13 | PR description に主証跡（vitest 件数 + grep 0 件）を記載 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | enqueue / transition 検証 | 11 | completed | Vitest + NON_VISUAL evidence |
| 2 | retry / DLQ 検証 | 11 | completed | Vitest + migration grep |
| 3 | idempotency 検証 | 11 | completed | 同一 key 2 回 |
| 4 | aliasMap 仕様語 ↔ DB 語 検証 | 11 | completed | docs + enum |
| 5 | audit_log 記録確認 | 11 | completed | 07a route/workflow tests |
| 6 | memberTags.ts write 0 件 grep | 11 | completed | 不変条件 #13 |
| 7 | apps/web 直接参照 0 件 grep | 11 | completed | 不変条件 #5 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `index.md` | scope / 依存 |
| 必須 | `outputs/phase-09/quality-report.md` | grep / coverage 実測 |
| 必須 | `outputs/phase-10/go-no-go.md` | GO 判定根拠 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` §NON_VISUAL 縮約テンプレ | 必須 outputs 仕様 |
| 必須 | `CLAUDE.md` §Cloudflare 系 CLI 実行ルール | `cf.sh` 経由限定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-11/main.md` | Phase 11 トップ index |
| ドキュメント | `outputs/phase-11/non-visual-evidence.md` | シナリオ別 evidence テーブル |
| ドキュメント | `outputs/phase-11/manual-verification-log.md` | 検証セッションログ |
| evidence | `outputs/phase-11/sql/*.txt` | D1 SQL 実行ログ |
| evidence | `outputs/phase-11/grep/*.txt` | grep 実証ログ |
| メタ | `artifacts.json` | Phase 11 を completed |

## 完了条件

- [ ] 必須 3 成果物（main.md / non-visual-evidence.md / manual-verification-log.md）が揃う
- [ ] 8 シナリオすべて期待通りの結果
- [ ] 不変条件 #5 / #13 が grep で実証されている
- [ ] audit_log に全 transition の entry が記録されている
- [ ] screenshot を生成していない（NON_VISUAL 適用の構造的担保）
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認

- 全シナリオに evidence
- artifacts.json で phase 11 を completed
- `outputs/phase-11/` 配下に screenshot ファイル（png / jpg）が存在しないことを確認

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ: NON_VISUAL evidence と grep 実証結果を changelog / spec sync に転記
- ブロック条件: 不変条件 violation または audit_log 記録欠落があれば差し戻し
