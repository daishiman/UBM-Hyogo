# Phase 4: 検証戦略

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | issue-502 UT-07B-FU-01-FOLLOWUP schema alias back-fill Queue / DLQ 監視ダッシュボード整備 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 検証戦略 |
| 作成日 | 2026-05-07 |
| 前 Phase | 3（設計レビューゲート） |
| 次 Phase | 5（仕様 runbook 作成） |
| 状態 | spec_created |
| タスク分類 | docs-only（test-strategy） |
| taskType | docs-only（CONST_004 例外） |
| visualEvidence | NON_VISUAL |
| 実装区分 | ドキュメントのみ |
| 検証種別 | NON_VISUAL / docs-only / read-only SQL / fixture |

## 目的

本タスクはコード変更を伴わず、runbook markdown 追加 / 集計 SQL 3 種を runbook 内 code block 化 / skill references topic 追加 / `pnpm indexes:rebuild` で完結する。したがって unit / integration / e2e の自動テスト戦略は **N/A** とし、検証は (1) **集計 SQL の read-only 性検証**（rg grep で書き換え系 SQL の不在）、(2) **staging D1 fixture での dry-run**（count 返却 / staging で `failed_items_json IS NOT NULL` row が 0 件でも syntax error を出さない）、(3) **skill references 追記の整合性検証**（`pnpm indexes:rebuild` drift ゼロ + topic-map / keywords / quick-reference / resource-map 4 種の更新確認）の 3 点を manual verification で固定することに絞る。

AC-1〜AC-11 のすべてを Queue / DLQ 観測手順 / SQL 3 種 / しきい値 / escalation / references topic / index drift / read-only / binding 逆引き / 既存変更なし / 4 条件 / Phase 12 7 成果物 の 11 軸で 100% カバーする検証戦略を本 Phase で確定する。

## 完了条件チェックリスト

- [ ] テストレベル戦略表（unit / integration / e2e / manual）が記述され、コード系は **N/A（コード変更なし）** と明記されている
- [ ] manual verification の 3 観点（read-only SQL / staging dry-run / references 整合）が AC と紐付いている
- [ ] 検証ツール（`scripts/cf.sh` / D1 / `rg` / `mise exec -- pnpm indexes:rebuild` / `gh`）が列挙されている
- [ ] 検証カバレッジ目標が AC-1〜AC-11 全件 100% で明記されている
- [ ] evidence 種別（runbook / staging-aggregation log / read-only grep log / index drift log）が `outputs/phase-11/` 配下のパスで予約されている
- [ ] 不変条件への影響が「なし（コード変更なし）」で明記されている
- [ ] 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が PASS 判定で根拠付き

## 検証戦略詳細

### 1. テストレベル戦略

| 層 | 対象 | 環境 | 判定 |
| --- | --- | --- | --- |
| unit | — | — | **N/A（コード変更なし）** |
| integration | — | — | **N/A（コード変更なし）** |
| e2e | — | — | **N/A（コード変更なし）** |
| manual verification | (1) 集計 SQL の read-only 性、(2) staging D1 dry-run、(3) skill references / index drift 整合 | 開発者ローカル + Cloudflare staging（read-only） | 本タスクの主検証経路 |

> 本タスクは runbook markdown 追加 / 集計 SQL を runbook 内 code block 化 / skill references topic 追加 / `pnpm indexes:rebuild` に閉じるため、コード経路の自動検証は不要。検証は manual の 3 観点で固定する。

### 2. manual verification 詳細

#### 2.1 集計 SQL の read-only 性検証

| 項目 | 内容 |
| --- | --- |
| 検証対象 | `outputs/phase-11/dlq-monitoring-runbook.md`（および本仕様書 phase-02.md / phase-05.md の SQL code block） |
| 検証方法 | `rg -i -n -e '\b(INSERT\|UPDATE\|DELETE\|DROP\|ALTER\|CREATE\|REPLACE\|TRUNCATE)\b' <runbook>` を実行し、マッチが **0 件**であることを確認。マッチ行があれば AC-7 違反として Phase 6 異常系に escalation し Phase 2 戻し |
| 期待 | (a) runbook の SQL code block を抽出した上で句頭 SQL 動詞のみを検査し、改変系動詞が 0 件、(b) `outputs/phase-11/sql-readonly-grep.log` が生成されている（マッチ 0 でも空ファイルとして evidence 化）、(c) `last_error` を SELECT 句に含めない（redaction 補強） |
| 関連 AC | AC-7 / AC-9 |

#### 2.2 staging D1 dry-run（count 返却 / 0 件許容）

| 項目 | 内容 |
| --- | --- |
| 検証対象 | staging D1 (`ubm-hyogo-db-staging`) の `schema_diff_queue` テーブル |
| 検証方法 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "<SQL>"` を 3 種すべて実行し、stdout が JSON / 表形式で返ることを確認。`failed_items_json IS NOT NULL` の count が **0 件でも syntax error を出さない**ことを判定基準とする |
| 期待 | (a) DLQ 投入相当 SQL が `dlq_equivalent_total = N（0 ≤ N）` を返す、(b) retry 過剰 SQL が 0 件 or `LIMIT 50` 内の行を返す、(c) exhausted 滞留 SQL が同様、(d) すべて exit 0、(e) 結果は `outputs/phase-11/dlq-aggregation-staging.log` に保存 |
| 関連 AC | AC-1 / AC-2 / AC-3 |

> Phase 1 苦戦箇所 #1（DLQ ゼロ件で staging dry-run の異常検知を実証できない）はここで吸収する。count=0 を「観測 OK / 異常なし」と機械判定できることが救い。

#### 2.3 skill references 追記 + index drift 整合

| 項目 | 内容 |
| --- | --- |
| 検証対象 | `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md`（追加後）/ `.claude/skills/aiworkflow-requirements/indexes/{topic-map.md,keywords.json,quick-reference.md,resource-map.md}` |
| 検証方法 | (a) `mise exec -- pnpm indexes:rebuild` を実行 → `git status .claude/skills/aiworkflow-requirements/indexes/` で **追記反映後の差分のみ**（drift ゼロ）であることを確認、(b) `rg -n "DLQ Monitoring\|dlq-monitoring" .claude/skills/aiworkflow-requirements/indexes/topic-map.md` で topic がマップされている、(c) `keywords.json` に `dlq` / `schema-alias-backfill` が登録されている |
| 期待 | references topic が追加され、4 種 index に反映済みで、再実行 `pnpm indexes:rebuild` で追加差分が出ない（drift ゼロ） |
| 関連 AC | AC-5 / AC-6 / AC-8 |

### 3. 検証ツール

| ツール | 用途 |
| --- | --- |
| `bash scripts/cf.sh d1 execute` | staging / production D1 read-only 集計（`wrangler` 直接禁止） |
| `rg` (ripgrep) | read-only SQL grep（`INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/REPLACE/TRUNCATE`）/ topic-map / keywords grep |
| `mise exec -- pnpm indexes:rebuild` | skill index 4 種再生成 |
| `git status` | index drift 確認 |
| `gh` CLI | `gh issue view 502 --json state` / Phase 12 escalation 起票時の `gh issue create` |

### 4. 検証カバレッジ目標

| 範囲 | 目標 |
| --- | --- |
| AC カバレッジ | AC-1〜AC-11 全 11 件 100% |
| 集計 SQL read-only | 書き換え系 SQL マッチ 0 件（AC-7） |
| staging D1 dry-run | 3 種 SQL すべて exit 0 / count 返却 / 0 件許容（AC-1 / AC-2 / AC-3） |
| skill index drift | `pnpm indexes:rebuild` 後の `git status` で drift ゼロ（AC-6） |
| Issue 状態 | `gh issue view 502 --json state` が `CLOSED`（AC-9 と直結する Phase 13 の前提） |

### 5. evidence 種別と保存パス

| 種別 | パス | 内容 |
| --- | --- | --- |
| runbook | `outputs/phase-11/dlq-monitoring-runbook.md` | 5 章構成の runbook 本体（AC-1〜AC-4） |
| staging 集計 log | `outputs/phase-11/dlq-aggregation-staging.log` | `scripts/cf.sh d1 execute` 3 種の dry-run 出力 |
| read-only grep log | `outputs/phase-11/sql-readonly-grep.log` | `rg -i -e 'INSERT\|UPDATE\|DELETE\|...'` の実行結果（マッチ 0 件想定） |
| index drift log | `outputs/phase-11/index-drift.log` | `pnpm indexes:rebuild` 後の `git status .claude/skills/aiworkflow-requirements/indexes/` 出力 |
| references diff | `outputs/phase-12/skill-references-diff.md` | `dlq-monitoring.md` 追加の差分記録 |
| Issue 状態 log | `outputs/phase-11/issue-502-state.log` | `gh issue view 502 --json state` 出力 |

### 6. 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | CLAUDE.md 全項目 | **影響なし** | コード変更ゼロ。markdown 追加と read-only D1 SQL のみ |

### 7. 検証コマンド一覧（参考 / 詳細は Phase 5）

```bash
# 1. read-only grep
rg -i -n -e '\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|TRUNCATE)\b' \
  outputs/phase-11/dlq-monitoring-runbook.md \
  > outputs/phase-11/sql-readonly-grep.log || echo "OK (read-only)"

# 2. staging D1 dry-run（3 種）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS dlq_equivalent FROM schema_diff_queue WHERE failed_items_json IS NOT NULL" \
  | tee -a outputs/phase-11/dlq-aggregation-staging.log

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT diff_id, retry_count, status, last_processed_at FROM schema_diff_queue WHERE retry_count >= 3 ORDER BY retry_count DESC LIMIT 50" \
  | tee -a outputs/phase-11/dlq-aggregation-staging.log

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT diff_id, backfill_status, retry_count, last_processed_at FROM schema_diff_queue WHERE backfill_status='exhausted' AND last_processed_at < datetime('now','-24 hours') ORDER BY last_processed_at ASC LIMIT 50" \
  | tee -a outputs/phase-11/dlq-aggregation-staging.log

# 3. skill index drift
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes/ \
  > outputs/phase-11/index-drift.log

# 4. Issue CLOSED 据え置き
gh issue view 502 --json state \
  > outputs/phase-11/issue-502-state.log
```

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | manual 3 観点（read-only SQL / staging dry-run / index drift）で AC-1〜AC-11 全件をカバー。Queue / DLQ + D1 失敗永続化列の観測ベースラインが客観 evidence で確定する |
| 実現性 | PASS | `scripts/cf.sh` / `rg` / `pnpm indexes:rebuild` / `gh` のみで完結。CI / production 副作用ゼロ。staging count=0 でも検証成立 |
| 整合性 | PASS | コード変更なしのため不変条件 #1〜#7 への影響ゼロ。CONST_004 例外条件適用済み。`wrangler` 直接実行禁止規約遵守 |
| 運用性 | PASS | 後続実行者が Phase 5 runbook をそのまま実行すれば evidence が揃う粒度。10〜20 分で完了想定。staging fixture 0 件でも syntax 動作確認は成立 |

## 受入条件（AC）

本 Phase は **AC-1（観測手順検証） / AC-2 / AC-3（集計 SQL）/ AC-6（index drift）/ AC-7（read-only）** の検証手段を確定する責務を担う。AC-4 / AC-5 / AC-8 / AC-9 / AC-10 / AC-11 は Phase 5 runbook + Phase 12 ドキュメント更新で確定し、本 Phase は manual verification の 3 観点として裏付ける。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/index.md` | AC-1〜AC-11 正本 |
| 必須 | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` | 起票元仕様 / 検証方法 |
| 必須 | `apps/api/wrangler.toml` | binding 名 正本 |
| 必須 | `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | D1 列 正本 |
| 必須 | `scripts/cf.sh` | D1 / Workers アクセスラッパー |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | references 追記 + index drift 同期 |
| 参考 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-04.md` | docs-only 検証戦略フォーマット参照 |

## 苦戦箇所【記入必須】

- staging D1 で `failed_items_json IS NOT NULL` の row が 0 件の場合、「異常検知できる」ことを実体で確認できない。本 Phase では「count=0 を OK 判定とし、syntax error を出さないこと」を最低限の動作確認ラインに固定し、Phase 6 異常系で「DLQ ゼロ件 / fixture 欠落」を仕様上の正常状態として扱う。
- read-only grep は本文全体ではなく SQL code block 抽出後に実行する。本文には `INSERT` / `UPDATE` / `DELETE` を禁止語説明として含むため、全文 grep 0 件を期待しない。Phase 5 で grep 対象パスを `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` + `docs/30-workflows/issue-502-.../phase-0{2,5}.md` の SQL block に限定する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-04/test-strategy.md`（必要時） | manual 3 観点 / 検証ツール / カバレッジ目標 / evidence 予約 / AC 対応表 |
| メタ | `artifacts.json` | Phase 4 状態の更新 |

## 次 Phase への引き渡し

- 次 Phase: 5（仕様 runbook 作成 / 実行可能 step sequence）
- 引き継ぎ事項:
  - manual verification 3 観点と AC 紐付け
  - evidence パス予約（`outputs/phase-11/` 配下 5 種 + `outputs/phase-12/` 配下 1 種）
  - 検証コマンド一覧（`scripts/cf.sh` / `rg` / `pnpm indexes:rebuild` / `gh`）
  - read-only grep の対象 path（runbook 本体 + 仕様書 phase-02 / phase-05）
- ブロック条件:
  - manual 3 観点のいずれかが AC と紐付いていない
  - evidence パスが Phase 11 / 12 の成果物パスと矛盾
  - 不変条件への影響が「なし」と明記されていない
  - `wrangler` 直接実行が検証コマンドに混入している

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として 集計 SQL の `rg` read-only grep、staging D1 dry-run、skill index drift ゼロ、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
