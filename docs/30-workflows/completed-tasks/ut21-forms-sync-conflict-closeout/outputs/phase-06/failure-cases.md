# Phase 6 Output: Failure Cases（legacy umbrella close-out 異常系）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 6 / 13（異常系検証） |
| taskType | docs-only / specification-cleanup（failure-case 列挙） |
| 前 Phase | 5（実装ランブック：受入条件 patch 案） |
| 次 Phase | 7（AC マトリクス） |

## 0. スコープ宣言

本タスクは docs-only であり、ランタイム例外は対象外。代わりに、UT-21 を legacy umbrella として閉じる **仕様整理プロセス自体の failure case** を 5 軸で列挙する。

| 軸 | 軸名 | 概要 |
| --- | --- | --- |
| A | 移植漏れ | Bearer guard / 409 / D1 retry / manual smoke の 4 品質要件が 03a/03b/04c/09b に未割当 |
| B | 新設誘惑の復活 | `POST /admin/sync` / `GET /admin/sync/audit` / audit table が close-out 後に「便利だから」と復活 |
| C | U02 判定の前倒し | `sync_audit_logs` 必要性判定を本タスクで前倒し decision してしまう（U02 スコープ侵食） |
| D | 受入条件競合 | patch 案が 03a/03b/04c/09b の既存 AC と矛盾／重複／単一 `job_kind='sync'` への退化 |
| E | 実装パス・スコープ逸脱 | `apps/api/src/sync/{core,manual,scheduled,audit}.ts` 想定の混入、03a〜09b の実体編集、UT-21 本体改編、Issue 再オープン |

## 1. failure cases マトリクス（17 件 / 要件 12 件以上）

| # | 軸 | ケース | 原因 | 検出 (Phase 4 wire-in) | 対応方針 | 復旧 | 証跡例 |
| - | - | --- | --- | --- | --- | --- | --- |
| 1 | A | 04c Bearer guard patch 案が未提示 | Phase 5 で 04c 確認漏れ | スイート 3 (S3-01) | blocker | Phase 5 に戻し patch 案 1 を追加 | `rg "04c-parallel-admin-backoffice" outputs/phase-05/implementation-runbook.md` の 0 hit |
| 2 | A | 03a or 03b の 409 排他 patch 案が片側のみ | sync 対象種別の見落とし | スイート 3 (S3-02) | 即時修正 | 不足側を patch 案 2 に追記 | patch 案文書内の `03a` / `03b` 言及バランス |
| 3 | A | D1 retry patch 案が AC レベルで未明記（設計のみ記述） | AC への昇格漏れ | スイート 3 (S3-03) | 即時修正 | AC 形式へ書き直し | `rg "AC-X.*SQLITE_BUSY\|AC-Y.*backoff" outputs/phase-05` |
| 4 | A | 09b manual smoke patch 案が NON_VISUAL 証跡保存先を欠く | smoke 観点の欠落 | スイート 3 (S3-04) | 即時修正 | `outputs/phase-11/` 保存先を明記 | patch 案 4 内の保存先パス記述 |
| 5 | B | `POST /admin/sync` 単一 endpoint を「DRY 化」と称して復活 | `job_kind` 単一責務原則の誤適用 | スイート 1 (S1-01) | blocker | 該当 patch を撤回し 2 系統維持 | `rg "POST /admin/sync\b" outputs/phase-05` で禁止文脈以外 hit |
| 6 | B | `GET /admin/sync/audit` を admin UI から逆参照する patch として混入 | `sync_jobs` admin UI 経由方針の見落とし | スイート 1 (S1-01) | blocker | 削除し `sync_jobs` 直接参照へ書き戻し | `rg "GET /admin/sync/audit" outputs/phase-05` |
| 7 | B | `sync_audit_logs` / `sync_audit_outbox` テーブル新設 patch を含めてしまう | U02 判定前の先走り | スイート 1 (S1-02) + 手動 M-02 | blocker | 当該 patch を削除し U02 link で代替 | `rg "sync_audit_logs\|sync_audit_outbox" outputs/phase-05` |
| 8 | C | 本タスク内で `sync_jobs` 不足分析を実施し U02 を不要と decision | スコープ侵食 | manual M-02 | blocker | 該当記述を削除し U02 link で代替 | `rg "sync_jobs.*不足\|sync_jobs.*ledger.*不十分" outputs/phase-0[1-9]` |
| 9 | C | U02 タスクファイル未起票のまま AC-5 を PASS と判定 | 後続タスク連動確認漏れ | スイート 2（cross-link 死活） | blocker | U02 タスクを `unassigned-task/` に作成 | `ls docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md` |
| 10 | D | patch 案 2 が 03a/03b 既存 AC と単一 `job_kind='sync'` で重複定義 | 整合性 grep 結果未反映 | スイート 3 (S3-02) + manual M-01 | 即時修正 | `job_kind` 単位で分離した文言に書き直し | patch 案 2 内に `job_kind='schema_sync'` / `job_kind='response_sync'` の 2 値が登場 |
| 11 | D | patch 案 1 の 4 状態（401/403/200/409）が 04c 既存 AC の 3 状態定義と矛盾 | 整合性 grep 結果未反映 | スイート 3 (S3-01) + manual M-01 | 即時修正 | 4 状態に統一 | 04c 既存 AC との diff |
| 12 | D | patch 案 4 の smoke 手順が 09a / 09c smoke と二重定義 | smoke 系タスク間の責任分界漏れ | manual review | 即時修正 | runbook=09b、smoke 実行=09a/09c に責任分離 | 09a/09c index.md と patch 案 4 の比較 |
| 13 | E | patch 案 or 苦戦想定に `apps/api/src/sync/{core,manual,scheduled,audit}.ts` を現行構成として記述 | UT-21 当初仕様からのコピペ | スイート 1 (S1-03) | blocker | 現行 `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` に書き直し、差分は U05 へ | `rg "apps/api/src/sync/(core\|manual\|scheduled\|audit)" outputs/phase-0[1-9]` |
| 14 | E | 不変条件 #5 違反として `apps/web` から D1 直接アクセスを示唆する patch 案 | `apps/api` 境界の見落とし | manual M-04 | blocker | 該当文を削除し `apps/api` 経由を明記 | `rg "apps/web.*\\bDB\\b\|apps/web.*\\bd1\\b" outputs/phase-0[1-9]` |
| 15 | E | GitHub Issue #234 を再オープン | CLOSED 維持ポリシーの見落とし | `gh issue view 234 --json state` | blocker | 即時クローズ、CLOSED 維持 | `gh issue view 234 --json state` の `"state":"CLOSED"` |
| 16 | E | 本タスク Phase 内で 03a/03b/04c/09b の実体 index.md を編集 | 責任分界の逸脱（patch 案=本タスク、実適用=受入先） | `git diff --stat docs/30-workflows/{03a,03b,04c,09b}*` | blocker | revert し patch 案文書のみに記述を戻す（user 承認なしに復元コマンドを実行しない） | `git diff --stat` |
| 17 | E | UT-21 当初仕様書本体を削除・改編 | 「legacy 状態欄追記」と削除の混同 | `git diff` | blocker | revert し状態欄追記のみに留める | `git diff docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` の hunk 内容 |

合計: **17 件**（軸 A=4 / B=3 / C=2 / D=3 / E=5）。要件 12 件以上を満たす。

## 2. 各ケース ↔ 検証スイート wire-in（Phase 4 連携表）

| Case # | 対応スイート (Phase 4) |
| --- | --- |
| 1, 2, 3, 4 | スイート 3（正本整合性 grep, S3-01〜S3-04） |
| 5, 6, 7, 13 | スイート 1（stale 参照 grep, S1-01〜S1-03） |
| 8, 12 | スイート 4（手動目視レビュー, M-01 / M-02） |
| 9 | スイート 2（cross-link 死活） |
| 10, 11 | スイート 3 + スイート 4 |
| 14 | スイート 4（手動 M-04） |
| 15 | manual review + `gh issue view 234 --json state` |
| 16 | manual review + `git diff --stat` |
| 17 | manual review + `git diff` |

すべての case が 1 つ以上の検証スイートに wire 済み。

## 3. 復旧 runbook（代表 4 ケース）

### 3.1 Case 5: `POST /admin/sync` 復活誘惑

```bash
# 禁止文脈以外で hit していないか確認
rg -n "POST /admin/sync\b" docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md

# hit があれば該当 patch を撤回し、04c の 2 系統 (/admin/sync/schema, /admin/sync/responses) に戻す
# AC-3（新設しない方針）が index.md に明記済みであることを再確認
rg -n "POST /admin/sync\b|GET /admin/sync/audit" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md
```

### 3.2 Case 7: `sync_audit_logs` / `sync_audit_outbox` 新設誘惑

```bash
# 当該テーブル新設 patch が紛れていないか
rg -n "sync_audit_logs|sync_audit_outbox" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md

# hit があれば削除し、U02 タスクへの link に置換
rg -n "task-ut21-sync-audit-tables-necessity-judgement-001" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout
# U02 link が 1 件以上残っていることを期待
```

### 3.3 Case 13: `apps/api/src/sync/{core,manual,scheduled,audit}.ts` 混入

```bash
# 旧パス想定の混入確認
# UT-21 legacy / U05 / 本タスク差分表（phase-02 §(a) 行 #5）以外で hit してはならない
rg -n "apps/api/src/sync/(core|manual|scheduled|audit)" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout

# hit があれば現行構成に置換:
#   apps/api/src/jobs/sync-forms-responses.ts + apps/api/src/sync/schema/*
# 構成差分は UT21-U05 タスクへリンク
```

### 3.4 Case 16: 03a/03b/04c/09b の実体を本タスクで編集

```bash
git diff --stat docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
                 docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver \
                 docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints \
                 docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook

# 0 行であるべき。差分があれば即時停止し、差分所有者と意図を確認する。
# user 承認なしに復元系コマンド（git checkout -- / git reset --hard）は実行しない。
git diff -- docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
            docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver \
            docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints \
            docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook
```

## 4. 証跡フォーマット統一

すべての failure case の証跡は次の 3 系統に正規化する。

| 系統 | 用途 | 出力先 |
| --- | --- | --- |
| `rg` | grep ベース検出（軸 A / B / C / D / E #13, #14） | `outputs/phase-09/stale-grep-evidence.md` |
| `git diff` / `git diff --stat` | スコープ逸脱（軸 E #16, #17） | `outputs/phase-09/main.md` の不変条件チェック節 |
| `gh issue view --json state` | Issue 状態（軸 E #15） | `outputs/phase-09/issue-state.json` |

## 5. Phase 7 への Case ID 引き渡し

各 Case ID（#1〜#17）は Phase 7 AC マトリクスの「関連 failure case」補助列で参照される。

| AC# | 主に関連する failure case |
| --- | --- |
| AC-1 | #5, #6, #7, #13 |
| AC-2 | #1, #2, #3, #4, #10, #11, #12 |
| AC-3 | #5, #6 |
| AC-4 | #7, #8 |
| AC-5 | #9 |
| AC-6 | #1〜#4, #10〜#12, #16 |
| AC-7 | #8, #13 |
| AC-8 | 全件（MAJOR 残存有無で判定） |
| AC-9 | #14, #16 |
| AC-10 | #5, #6, #7 |
| AC-11 | #15 |

## 6. 実行手順

1. §1 の 17 件マトリクスを本ファイルに固定（完了）
2. §2 で Phase 4 スイートへ wire-in（完了）
3. §3 で代表 4 ケースの復旧 runbook をコマンド付きで記述（完了）
4. §4 で証跡フォーマットを 3 系統に統一（完了）
5. §5 で Case ID を AC マトリクスへ引き渡せる形に整備（完了）

## 7. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case ID を AC マトリクスへ紐付け |
| Phase 9 | 復旧 runbook の rg / git diff / gh issue view コマンドを実測ログに含める |
| Phase 11 | 復旧 runbook を 1 件以上ローカル smoke で実演（NON_VISUAL 証跡） |
| Phase 12 | unassigned-task-detection.md に派生確認タスクとして記録（必要時） |

## 8. 多角的チェック観点

- 価値性: 5 軸が漏れなく failure case 化されているか（軸 A=4 / B=3 / C=2 / D=3 / E=5、合計 17）
- 実現性: 全ケースの検出が `rg` / `git diff` / `gh issue view` のみで完結（外部 API / 実環境不要）
- 整合性: 03a/03b/04c/09b の owner が patch 案を読んだ際、矛盾なく適用できる前提が崩れていない
- 運用性: 復旧コマンドが copy-paste で完結
- スコープ境界: 本タスクが U02 / U05 のスコープを侵食していない（Case 8 / 13 で blocker 化）
- 不変条件: #5（D1 アクセス境界）/ #7（Forms 再回答経路）抵触見落としが Case 14 / 13 で独立 case として存在
- プロセス整合: CLOSED Issue #234 維持（Case 15）と responsible boundary（Case 16, 17）が独立 case として存在

## 9. 完了条件チェック

- [x] 12 件以上の failure case が 5 軸別に網羅（実態 17 件）
- [x] 全ケースで対応方針が一意（即時修正 / blocker のいずれか）
- [x] 全ケースに対応する Phase 4 スイートが指定（§2）
- [x] 代表 4 ケースの復旧 runbook がコマンド付き（§3）
- [x] 不変条件 #5 / #7 抵触が独立 case として存在（Case 13 / 14）
- [x] CLOSED Issue #234 の再オープン禁止が独立 case として存在（Case 15）
