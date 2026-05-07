# Phase 7: AC マトリクス

[実装区分: ドキュメントのみ]

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | schema alias back-fill Queue / DLQ 監視ダッシュボード整備 (issue-502) |
| GitHub Issue | #502（CLOSED 維持 / `Refs #502`） |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-05-07 |
| 前 Phase | 6（異常系） |
| 次 Phase | 8（DRY 化 / 仕様間整合） |
| 状態 | spec_created |
| タスク分類 | docs-only（acceptance-traceability） |
| taskType | docs-only（CONST_004 例外適用） |
| visualEvidence | NON_VISUAL |
| 実装区分 | **ドキュメントのみ** |

## 目的

`index.md` で定義された AC-1〜AC-11 を **検証方法 × 期待 evidence × Phase 11 取得成果物パス × Phase 12 記録場所** の 4 軸で表化し、トレーサビリティを担保する。本 Phase は AC が「全 PASS で根拠付き」（AC-10）であることを最終的に裏付ける入力を作る。

## 完了条件チェックリスト

- [ ] AC-1〜AC-11 全 11 項目が表に揃っている（`index.md` と完全一致）
- [ ] 各 AC に「検証方法」「期待 evidence」「Phase 11 取得パス」「Phase 12 記録場所」が記載されている
- [ ] AC 間依存（AC-1/2/3/4/5 → AC-8、AC-7 → AC-2、AC-6 → AC-5）が明記されている
- [ ] DLQ 0 件 / Paid 限定 / op secret 失効時の代替評価経路が記述されている
- [ ] 不変条件への影響が「なし」と明記されている
- [ ] 4 条件評価が PASS 判定で根拠付き

## AC マトリクス

| AC | 内容（要約） | 検証方法 | 期待 evidence | Phase 11 取得成果物パス | Phase 12 記録場所 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | Cloudflare Queue / DLQ メトリクス観測手順が runbook に記載 | runbook §3 を参照し、`bash scripts/cf.sh whoami` 後に dash の Queues > metrics 画面手順が章立てで存在することを確認 | runbook §3 の章存在 + `cf-whoami.log` | `outputs/phase-11/cf-whoami.log` / `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` §3 | `outputs/phase-12/implementation-guide.md` § Cloudflare 観測手順 |
| AC-2 | D1 集計 SQL（DLQ 投入 / retry 過剰 / exhausted 滞留）が runbook に記載 | runbook §4 で SQL #1 / #2 / #3 が完成形 read-only として存在することを `rg` で確認 | runbook §4 に SQL 3 種 + 実行 trace | `outputs/phase-11/sql-1-dlq-pending.log` / `sql-2-retry-excess.log` / `sql-3-exhausted-stalled.log` | `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` §4 |
| AC-3 | 異常しきい値（DLQ ≥ 1、retry ≥ 3、exhausted 24h）文書化 | runbook §5 にしきい値表が存在 + skill references の DLQ 監視 topic にしきい値が記載 | しきい値表（runbook + references） | `outputs/phase-11/aggregation.md` § しきい値判定 | `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` §5 / `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md` |
| AC-4 | エスカレーション先と次アクション分岐が runbook に明記 | runbook §6 にエスカレーション先（owner 通知）と次アクション（UT-07B-FU-01 Phase 12 unassigned-task 起票）が記載 | エスカレーション章存在 | `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` §6 | `outputs/phase-12/implementation-guide.md` § エスカレーション |
| AC-5 | aiworkflow-requirements skill `references/` に DLQ 監視 topic 追加 | `.claude/skills/aiworkflow-requirements/references/` 配下に DLQ 監視 topic（`dlq-monitoring.md` 新規 or 既存 deployment 系への追記）が存在 | references 新規 / 編集差分 | `outputs/phase-12/skill-references-diff.md` | `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md`（または相当 references） |
| AC-6 | topic-map / keywords / quick-reference / resource-map / task-workflow-active / SKILL / LOGS に Issue #502 導線 | `rg -n "issue-502|dlq-monitoring" ...` で逆引き可能 | 正本導線あり | Phase 12 実ファイル | `outputs/phase-12/system-spec-update-summary.md` |
| AC-7 | 集計 SQL が read-only（UPDATE/DELETE/INSERT 不在） | runbook §4 と `outputs/phase-11/sql-*.log` 全文に `rg -i "(update\|delete\|insert\|drop\|alter)"` をかけて hits 0 件（句頭の動詞として）を確認 | 禁止句 0 hits | `outputs/phase-11/sql-readonly-grep.log` | `outputs/phase-12/implementation-guide.md` § read-only 検証 |
| AC-8 | Queue / DLQ binding 名と D1 schema が aiworkflow-requirements から逆引き可 | references の DLQ 監視 topic から `SCHEMA_ALIAS_BACKFILL_QUEUE` / `schema-alias-backfill[-staging][-dlq]` / `schema_diff_queue` が grep 可能、`indexes/keywords.json` にも語彙が登録 | 逆引き grep hits ≥ 1 | `outputs/phase-11/reverse-lookup-grep.log` | `.claude/skills/aiworkflow-requirements/indexes/keywords.json` |
| AC-9 | 既存 schema / API contract / Queue 構造の変更なし | `git diff main... -- apps/api/migrations/ apps/api/wrangler.toml apps/api/src/repository/schemaDiffQueue.ts apps/api/src/index.ts` が差分 0 | source diff 0 | `outputs/phase-11/no-source-change-diff.log` | `outputs/phase-12/implementation-guide.md` § 不変条件確認 |
| AC-10 | 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）全 PASS | Phase 1 / 3 / 10 で 4 条件を再判定し、全時点 PASS であること | 4 条件 × 3 時点 PASS の表 | `outputs/phase-01/main.md` / `outputs/phase-03/main.md` / `outputs/phase-10/go-no-go.md` | `outputs/phase-12/implementation-guide.md` § 4 条件評価 |
| AC-11 | Phase 12 strict 7 成果物 + runbook 本体 + aiworkflow-requirements 同期完了 | 7 ファイル存在確認 + runbook 本体存在 + 正本導線同期 | 7 markdown 存在 + runbook + 正本導線あり | （Phase 11 では生成しない） | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` + `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` |

## AC 間依存関係

```
                AC-9（既存変更なし） ── 独立
                AC-1 / AC-2 / AC-3 / AC-4（runbook 章群）
                    │
                    ├─→ AC-5（references 追記）
                    │     │
                    │     ├─→ AC-6（正本導線同期）
                    │     └─→ AC-8（逆引き可）
                    │
                    └─→ AC-7（read-only grep）

                AC-10 ← AC-1〜AC-9 の達成根拠
                AC-11 ← AC-1〜AC-10 を集約
```

| 依存元 | 依存先 | 関係 |
| --- | --- | --- |
| AC-1, AC-2, AC-3, AC-4 | AC-5 | runbook 章が確定してから references topic に link / 要約を追記 |
| AC-5 | AC-6 | references 編集後に `indexes:rebuild` で drift を解消 |
| AC-5 | AC-8 | references topic に binding / schema 名を載せて初めて逆引き grep が成立 |
| AC-2 | AC-7 | SQL 確定後に read-only grep を実施 |
| AC-9 | （独立） | 既存 source 差分 0 確認は他 AC と独立 |
| AC-10 | AC-1〜AC-9 | 4 条件評価は他 AC の達成を根拠とする |
| AC-11 | AC-1〜AC-10 | Phase 12 成果物は前段すべてを集約 |

## 異常時の代替評価経路

| 異常状況（Phase 6 Case） | 代替評価 | 影響 AC |
| --- | --- | --- |
| Case 2: DLQ ゼロ件 | SQL 結果 0 件でも runbook §4 章存在 + `EXPLAIN QUERY PLAN` 構文 PASS で AC-2 を PASS 判定 | AC-2 |
| Case 3: Paid 限定 | Cloudflare dash 不可視時は runbook §3 に「plan 依存 / Queue 指標取得不能時のテキスト手順」と明記されていれば AC-1 は境界付き PASS。D1 SQL は AC-2 の根拠に分離 | AC-1 |
| Case 4: fixture 欠落 | EXPLAIN PLAN で SQL 構文 validate 済みなら AC-7 PASS | AC-7 |
| Case 5: op secret 失効 | 1Password 再発行後に `cf-whoami.log` 取得しなおして再評価。token 値転記禁止を pass 条件に組込み | AC-1, AC-2, AC-7 |
| Case 6: index drift | rebuild 出力を採用 / 手動編集破棄で drift 0 を達成すれば AC-6 PASS | AC-6 |

## AC-10 / AC-11 特殊性の補足

- **AC-10（4 条件評価）**: 価値性 / 実現性 / 整合性 / 運用性 を Phase 1（初期）/ Phase 3（設計レビュー後）/ Phase 10（最終ゲート）の 3 時点で再判定し、すべて PASS の場合のみ AC-10 を PASS とする。Cloudflare dash が plan 制限で観測不能な場合でも D1 SQL 経路で運用性 PASS の根拠を保持する
- **AC-11（Phase 12 strict 7 成果物 + aiworkflow-requirements 同期）**: `outputs/phase-12/main.md` を含む strict 7 成果物に加え、runbook 本体、`aiworkflow-requirements` の references（DLQ 監視 topic）と changelog（`changelog/20260507-issue502-dlq-monitoring.md`）の同期、`pnpm indexes:rebuild` で drift 0 を必須とする

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | CLAUDE.md 全項目 | **影響なし** | コード変更なし。AC 判定はすべて文書 / 文書存在確認 / read-only D1 query / `git diff` で完結。`apps/web` から D1 への直接アクセス（不変条件 5）は本タスクで発生しない |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | AC-1〜AC-11 すべてに検証方法 / evidence パス / 記録場所が紐付き、Phase 10 ゲートで本マトリクス走査だけで GO/NO-GO 判定が可能 |
| 実現性 | PASS | 検証手段が `bash scripts/cf.sh` / `rg` / `git status` / 文書存在確認 のみで完結 |
| 整合性 | PASS | 起票元仕様（`task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md`）の完了条件チェックリストおよび `index.md` AC-1〜AC-11 と本マトリクスの行が完全一致。Phase 4 / 5 / 6 で予約した evidence パスと整合 |
| 運用性 | PASS | DLQ 0 件 / Paid 制限 / op secret 失効時の代替評価経路が明示され、Phase 11 / 12 で「観測不能」を文書化する経路が確保 |

## 受入条件（AC）

本 Phase は **AC-10（4 条件評価）/ AC-11（Phase 12 strict 7 成果物 + runbook 本体）** のトレーサビリティを最終固定する責務を担う。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/index.md` § 受入条件 | AC-1〜AC-11 正本 |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/phase-04.md` | 検証戦略連結 |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/phase-05.md` | runbook step sequence 連結 |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/phase-06.md` | 異常系 Case 連結 |
| 参考 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-07.md` | フォーマット exemplar |

## 苦戦箇所【記入必須】

- AC-7（read-only）の grep 検証で「`update` / `delete` / `insert`」を単純に検索すると `last_processed_at`、`failed_items_json` 等のカラム名や `INSERT` を含むコメントに誤マッチする可能性があった。本 Phase では「句頭の SQL 動詞として」（行頭または空白後の `UPDATE\b` 等）に grep パターンを限定する方針に固定し、Phase 9 で具体 regex を確定させる経路にした
- AC-9（既存変更なし）の検証範囲を `apps/api/migrations/` だけでなく `wrangler.toml` / `schemaDiffQueue.ts` / `apps/api/src/index.ts` の Queue consumer shim にも広げる必要がある。狭く取ると「Queue 構造の変更なし」を取りこぼすため、git diff 対象パスを 4 ファイル明示した

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-07/ac-matrix.md` | AC-1〜11 × 検証方法 × 期待 evidence × Phase 11 パス × Phase 12 記録場所 + AC 間依存 + 異常代替経路 + AC-10 / AC-11 補足 |
| メタ | `artifacts.json` | Phase 7 状態の更新 |

## 次 Phase への引き渡し

- 次 Phase: 8（DRY 化 / 仕様間整合）
- 引き継ぎ事項:
  - AC-1〜AC-11 の検証方法 / evidence パス / Phase 11 / 12 記録場所
  - AC 間依存関係（AC-5 → AC-6 / AC-8、AC-2 → AC-7、AC-9 独立）
  - 異常時の代替評価経路（DLQ 0 件 / Paid 制限 / op secret 失効）
  - Phase 10 ゲートで本マトリクスを走査するだけで GO / NO-GO 判定可能な粒度
- ブロック条件:
  - AC-1〜AC-11 が `index.md` / 起票元 spec と乖離
  - evidence パスが Phase 11 / 12 成果物と矛盾
  - PASS 基準が客観判定不可能
  - 異常時の代替評価経路が欠落

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として D1 SQL の read-only grep 検証、redaction grep、`pnpm indexes:rebuild` drift 0、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
