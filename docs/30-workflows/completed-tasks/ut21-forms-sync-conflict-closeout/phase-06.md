# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（legacy umbrella close-out failure cases） |
| 作成日 | 2026-04-30 |
| 前 Phase | 5 (実装ランブック：受入条件 patch 案) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（failure-case 列挙） |

## 目的

本タスクは docs-only であり、ランタイム例外は対象外。代わりに、UT-21 を legacy umbrella として閉じる過程で発生し得る **仕様整理プロセス自体の failure case** を列挙する。
特に重視するのは次の 5 軸である。

1. **移植漏れ**: Bearer guard / 409 排他 / D1 retry / manual smoke の 4 品質要件のいずれかが、03a/03b/04c/09b への patch 案として提示されない / 提示先タスクを誤る。
2. **新設誘惑の復活**: `POST /admin/sync` / `GET /admin/sync/audit` の単一 endpoint や `sync_audit_logs` / `sync_audit_outbox` テーブルが、close-out 後に「便利だから」という理由で復活する。
3. **U02 判定の前倒し**: `sync_audit_logs` の必要性判定を本タスクで前倒しして decision してしまう（U02 のスコープ侵食）。
4. **03a / 03b 側の受入条件競合**: patch 案が 03a/03b の既存受入条件と矛盾する語彙で書かれ、適用時に重複定義 or 単一 `job_kind='sync'` への退化を招く。
5. **`apps/api/src/sync/*` 想定の混入**: UT-21 当初仕様の `apps/api/src/sync/{core,manual,scheduled,audit}.ts` 構成が、close-out 後の patch 案に紛れ込んで現行 `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` 構成を破壊する。

各ケースに対する検出方法・復旧手順・証跡例を Phase 7 の AC マトリクスへ紐付ける。

## 実行タスク

1. failure case を 5 軸（移植漏れ / 新設誘惑 / U02 前倒し / 受入条件競合 / 実装パス混入）別に列挙し、合計 12 件以上のマトリクスを完成する（完了条件: 各ケースに分類・原因・検出・復旧・証跡例の 5 項目が埋まる）。
2. 各ケースの対応方針（即時修正 / 派生タスク委譲 / blocker / Phase 12 で再確認）を一意に付与する。
3. 復旧 runbook を 3 ケース以上について整備する（完了条件: コマンドベースで完結）。
4. 各 failure case を Phase 4 の検証スイートへ wire-in する（完了条件: 全件で対応スイートが特定）。
5. Phase 7 AC マトリクスの「関連 failure case」列に渡せる ID（#1〜#NN）を確定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-04.md | 検証スイート 4 種 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-05.md | patch 案 5 件 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md | AC-1〜AC-11 |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-21 当初仕様（stale 語彙の発生源） |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md | U02 のスコープ境界 |
| 参考 | CLAUDE.md `不変条件 #5 / #7` | 抵触見落とし定義 |
| 参考 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-06.md | docs-only failure case の参考 |

## failure cases マトリクス

| # | 分類 | ケース | 原因 | 検出 | 方針 | 復旧 | 証跡例 |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 | 移植漏れ | 04c Bearer guard patch 案が未提示 | Phase 5 で 04 タスク確認漏れ | Phase 4 整合性 grep（観点 1） | blocker | Phase 5 へ戻し patch 案 1 を追加 | `rg "04c-parallel-admin-backoffice" docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05` の 0 hit |
| 2 | 移植漏れ | 03a or 03b の 409 排他 patch 案が片側のみ | sync 対象種別の見落とし | Phase 4 整合性 grep（観点 2） | 即時修正 | 不足側を patch 案 2 に追記 | patch 案文書内の `03a` / `03b` 言及バランス |
| 3 | 移植漏れ | D1 retry patch 案が AC レベルで未明記 | 設計セクションのみ記述 | Phase 4 整合性 grep（観点 3） | 即時修正 | AC 形式へ書き直し | `rg "AC-X.*SQLITE_BUSY\|AC-X.*backoff" outputs/phase-05` |
| 4 | 移植漏れ | 09b manual smoke patch 案が NON_VISUAL 証跡保存先を欠く | smoke 観点の欠落 | Phase 4 整合性 grep（観点 4） | 即時修正 | `outputs/phase-11/` 保存先を明記 | patch 案 4 内の保存先パス記述 |
| 5 | 新設誘惑 | `POST /admin/sync` 単一 endpoint を「DRY 化」と称して復活 | job_kind 単一責務原則の誤適用 | Phase 4 stale grep（規定コマンド） | blocker | 当該 patch 案を撤回し 2 系統を維持 | `rg "POST /admin/sync\b" outputs/phase-05` で禁止文脈以外 hit |
| 6 | 新設誘惑 | `GET /admin/sync/audit` を admin UI から逆参照する patch 案として混入 | `sync_jobs` admin UI 経由方針の見落とし | Phase 4 stale grep | blocker | 削除し `sync_jobs` 直接参照に書き戻し | `rg "GET /admin/sync/audit" outputs/phase-05` |
| 7 | 新設誘惑 | `sync_audit_logs` / `sync_audit_outbox` テーブル新設 patch を含めてしまう | U02 判定前の先走り | Phase 4 stale grep + 手動観点 | blocker | 当該 patch を削除し U02 へリンク | `rg "sync_audit_logs\|sync_audit_outbox" outputs/phase-05` |
| 8 | U02 前倒し | 本タスク内で `sync_jobs` の不足分析を実施し U02 を不要と decision | スコープ侵食 | manual review（手動観点 #2） | blocker | 当該記述を削除し U02 link で代替 | `rg "sync_jobs.*不足\|sync_jobs.*ledger.*不十分" outputs/phase-0[1-9]` |
| 9 | U02 前倒し | U02 のタスクファイルが未起票のまま AC-5 を PASS と判定 | 後続タスク連動確認漏れ | cross-link 死活 | blocker | U02 タスクファイルを `unassigned-task/` に作成 | `ls docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md` |
| 10 | 受入条件競合 | patch 案 2 が 03a/03b の既存 AC と単一 `job_kind='sync'` で重複定義 | 整合性 grep の結果未反映 | Phase 4 整合性 grep（観点 2） | 即時修正 | `job_kind` 単位で分離した文言に書き直し | patch 案 2 内に `job_kind='schema_sync'` / `job_kind='response_sync'` の 2 値が登場するか |
| 11 | 受入条件競合 | patch 案 1 の 4 状態（401/403/200/409）が 04c 既存 AC の 3 状態定義と矛盾 | 整合性 grep の結果未反映 | Phase 4 整合性 grep（観点 1）+ manual review | 即時修正 | 4 状態に統一 | 04c 既存 AC との diff |
| 12 | 受入条件競合 | patch 案 4 の smoke 手順が 09a / 09c smoke と二重定義 | smoke 系タスク間の責任分界漏れ | manual review | 即時修正 | runbook=09b、smoke 実行=09a/09c に責任分離 | 09a/09c index.md と patch 案 4 の比較 |
| 13 | 実装パス混入 | patch 案 or 苦戦想定に `apps/api/src/sync/{core,manual,scheduled,audit}.ts` を現行構成として記述 | UT-21 当初仕様からのコピペ | Phase 4 stale grep（観点 3） | blocker | 現行 `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` に書き直し、差分は U05 へ | `rg "apps/api/src/sync/(core\|manual\|scheduled\|audit)" outputs/phase-0[1-9]` |
| 14 | 実装パス混入 | 不変条件 #5 違反として `apps/web` から D1 直接アクセスを示唆する patch 案 | `apps/api` 境界の見落とし | Phase 4 手動観点 #4 | blocker | 該当文を削除し `apps/api` 経由を明記 | `rg "apps/web.*DB\\b\|apps/web.*d1" outputs/phase-0[1-9]` |
| 15 | プロセス逸脱 | GitHub Issue #234 を再オープン | CLOSED 維持ポリシーの見落とし | `gh issue view 234 --json state` | blocker | 即時クローズ、CLOSED 維持 | `gh issue view 234 --json state` の `"state":"CLOSED"` |
| 16 | プロセス逸脱 | 本タスク Phase 内で 03a/03b/04c/09b の実体 index.md を編集 | 責任分界の逸脱（patch 案=本タスク、実適用=受入先） | `git diff --stat docs/30-workflows/{03a,03b,04c,09b}*` | blocker | revert し patch 案文書のみに記述を戻す | `git diff --stat` |
| 17 | プロセス逸脱 | UT-21 当初仕様書本体を削除・改編 | 「legacy 状態欄追記」と削除の混同 | `git diff docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` | blocker | revert し状態欄追記のみに留める | `git diff` の hunk 内容 |

合計: 17 件（要件 12 件以上を満たす）。

## 各ケース ↔ 検証スイート wire-in（Phase 4）

| Case # | 対応スイート |
| --- | --- |
| 1, 2, 3, 4 | スイート 3（正本整合性 grep） |
| 5, 6, 7, 13 | スイート 1（stale 参照 grep） |
| 8, 12 | スイート 4（手動目視レビュー） |
| 9 | スイート 2（cross-link 死活） |
| 10, 11 | スイート 3 + スイート 4 |
| 14 | スイート 4（手動観点 #4） |
| 15, 16, 17 | manual review + `git diff` / `gh issue view` |

## 復旧 runbook（代表 4 ケース）

### Case 5: `POST /admin/sync` 復活誘惑

```bash
# 禁止文脈以外で hit していないか確認
rg -n "POST /admin/sync\b" docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md
# hit があれば該当 patch 案を撤回し、04c の 2 系統 (/admin/sync/schema, /admin/sync/responses) に戻す
# AC-3（新設しない方針）に明示済みであることを再確認
rg -n "POST /admin/sync\|GET /admin/sync/audit" docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md
```

### Case 7: `sync_audit_logs` / `sync_audit_outbox` 新設誘惑

```bash
# 当該テーブル新設 patch が紛れていないか
rg -n "sync_audit_logs\|sync_audit_outbox" docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md
# hit があれば削除し U02 タスクへの link に置換
rg -n "task-ut21-sync-audit-tables-necessity-judgement-001" docs/30-workflows/ut21-forms-sync-conflict-closeout
```

### Case 13: `apps/api/src/sync/{core,manual,scheduled,audit}.ts` 混入

```bash
# 旧パス想定の混入確認（UT-21 legacy / U05 後続タスク以外で hit してはならない）
rg -n "apps/api/src/sync/(core\|manual\|scheduled\|audit)" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout
# hit があれば現行構成に置換
# 現行: apps/api/src/jobs/sync-forms-responses.ts + apps/api/src/sync/schema/*
# 構成差分は U05 タスクへリンク
```

### Case 16: 03a/03b/04c/09b の実体 index.md を本タスクで編集

```bash
git diff --stat docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
                 docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver \
                 docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints \
                 docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook
# 0 行であるべき。差分があれば即時停止し、差分所有者と意図を確認する。
# user 承認なしに復元系コマンドで戻さない。
git diff -- docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
            docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver \
            docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints \
            docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook
```

## 実行手順

1. 17 件のマトリクスを `outputs/phase-06/failure-cases.md` に転記。
2. 証跡フォーマットを `rg` 出力 / `git diff` / `gh issue view` の 3 系統に統一。
3. Phase 4 スイートへの wire-in を相互参照。
4. 代表 4 ケースの復旧 runbook をコマンドベースで記述。
5. Case ID（#1〜#17）を Phase 7 AC マトリクスの「関連 failure case」列に渡せる形にする。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクスへ紐付け |
| Phase 9 | 復旧 runbook の rg コマンドを実測ログに含める |
| Phase 11 | 復旧 runbook を 1 件以上ローカル smoke で実演 |
| Phase 12 | unassigned-task-detection.md に派生確認タスクとして記録（必要時） |

## 多角的チェック観点

- 価値性: 5 軸が漏れなく failure case 化されているか。
- 実現性: 全ケースの検出が `rg` / `git diff` / `gh issue view` のみで完結するか。
- 整合性: 03a/03b/04c/09b の owner が patch 案を読んだ際、矛盾なく適用できる前提が崩れていないか。
- 運用性: 復旧コマンドが copy-paste で完結するか。
- スコープ境界: 本タスクが U02 / U05 のスコープを侵食していないか（Case 8 / 13）。
- 不変条件: #5（D1 アクセス境界）/ #7（Forms 再回答経路）抵触見落としが独立 case として存在するか（Case 14）。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 17 件 failure case マトリクス | spec_created |
| 2 | 対応方針付与 | spec_created |
| 3 | 証跡フォーマット統一 | spec_created |
| 4 | Phase 4 スイートへの wire-in | spec_created |
| 5 | 代表 4 ケースの復旧 runbook | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 17 件マトリクス + 復旧 runbook + 証跡例 |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] 12 件以上の failure case が 5 軸別に網羅（実態 17 件）
- [ ] 全ケースで対応方針が一意
- [ ] 全ケースに対応する Phase 4 スイートが指定
- [ ] 代表 4 ケースの復旧 runbook がコマンド付き
- [ ] 不変条件 #5 / #7 抵触が独立 case として存在
- [ ] CLOSED Issue #234 の再オープン禁止が独立 case として存在

## タスク100%実行確認【必須】

- 実行タスク 5 件すべて `spec_created`
- 成果物が `outputs/phase-06/failure-cases.md` に配置予定
- 17 件全てに 5 項目（分類・原因・検出・復旧・証跡例）が記入
- Phase 5 patch 案で発生し得る逸脱が網羅
- docs-only スコープ逸脱（Case 16 / 17）が blocker として明記

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - 17 件の Case ID を AC マトリクスの「関連 failure case」列で参照
  - 復旧 runbook を Phase 11 手動 smoke の対象に予約
- ブロック条件:
  - 12 件未満で Phase 7 へ進む
  - 復旧手順が記述されないケースが残る
  - 不変条件 #5 / #7 抵触見落としが failure case 化されていない
