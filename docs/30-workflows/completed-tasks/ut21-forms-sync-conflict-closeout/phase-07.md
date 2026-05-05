# Phase 7: AC マトリクス（AC-1〜AC-11 完全トレース）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-30 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（traceability） |

## 目的

index.md で定義された AC-1〜AC-11 を、Phase 4（検証手段）/ Phase 5（patch 案 = 成果物パス）/ Phase 6（failure case）と縦串で結び、4 列マトリクス「AC × 検証手段 × 成果物パス × 担当 Phase」として完全トレースする。
本タスクは docs-only / legacy umbrella close-out であり、code coverage の代わりに次の 2 軸を完全性指標として採用する。

1. **patch 案網羅性**: Phase 5 で提示された patch 案が 03a / 03b / 04c / 09b の 4 移植先タスクすべてを網羅していること。
2. **stale 参照ゼロ性**: Phase 4 stale grep の結果、`POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` / `apps/api/src/sync/{core,manual,scheduled,audit}.ts` の hit が「禁止文脈として明記する文 / UT-21 legacy 仕様内の引用 / U02・U05 後続タスク」以外でゼロであること。

これらを Phase 9 の品質保証で実測し、Phase 10 の GO/NO-GO 判定に渡す。

## 実行タスク

1. AC × 4 列（AC 内容 / 検証手段 (Phase 4) / 成果物パス (Phase 5) / 担当 Phase）の 11 行マトリクスを完成する（完了条件: 空セル無し、関連 failure case 列も補助情報として併記）。
2. patch 案網羅性指標の計測コマンドを定義する（完了条件: 4 移植先タスク言及件数 = 4 を確認する rg コマンドが記述）。
3. stale 参照ゼロ性指標の計測コマンドを定義する（完了条件: AC-10 規定 rg を含む）。
4. 各完全性指標の証跡記録方法を定義する（完了条件: `outputs/phase-09/` 配下の出力先 / フォーマットが指定）。
5. Phase 9 / Phase 10 への引き継ぎ項目（実測値・gap 分析・GO/NO-GO 入力）を予約する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md | AC-1〜AC-11 原典 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-04.md | 検証手段 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-05.md | patch 案 = 成果物パス |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-06.md | failure case ID |

## AC マトリクス（4 列 + 関連 failure case 補助列）

| AC# | AC 内容（要約） | 検証手段 (Phase 4) | 成果物パス (Phase 5) | 担当 Phase | 関連 failure case |
| --- | --- | --- | --- | --- | --- |
| AC-1 | UT-21 stale 前提 5 項目（同期元 / 単一 endpoint / GET audit / audit テーブル / 実装パス）が差分表として固定 | スイート 1（stale 参照 grep）+ スイート 4（手動観点 #1） | `outputs/phase-02/migration-matrix-design.md` の差分表セクション | Phase 2 確定、Phase 7 トレース | #5, #6, #7, #13 |
| AC-2 | 有効な品質要件 4 種（Bearer guard / 409 排他 / D1 retry / manual smoke）の移植先が 03a/03b/04c/09b に一意割当 | スイート 3（正本整合性 grep 4 観点） | `outputs/phase-05/implementation-runbook.md` の patch 案 1〜4 | Phase 5 提示、各受入先タスクで実適用 | #1, #2, #3, #4, #10, #11, #12 |
| AC-3 | `POST /admin/sync` / `GET /admin/sync/audit` を新設しない方針が本仕様書と UT-21 仕様書状態欄の双方に明記 | スイート 1（stale 参照 grep）+ スイート 4（手動観点 #5） | `index.md`（AC-3 として記述済）+ `outputs/phase-05/implementation-runbook.md` patch 案 5 | Phase 5 案提示、Phase 12 で UT-21 仕様書状態欄に追記 | #5, #6 |
| AC-4 | `sync_audit_logs` / `sync_audit_outbox` の新設は U02 判定後まで保留 | スイート 1（stale 参照 grep audit テーブル）+ スイート 4（手動観点 #2） | `outputs/phase-02/no-new-endpoint-policy.md` + U02 タスクへの link | Phase 2 確定、Phase 7 トレース | #7, #8 |
| AC-5 | 後続タスク UT21-U02 / U04 / U05 が `unassigned-task/` 配下に別ファイルで存在し本仕様書からリンク | スイート 2（cross-link 死活） | `unassigned-task/task-ut21-{sync-audit-tables-necessity-judgement,phase11-smoke-rerun-real-env,impl-path-boundary-realignment}-001.md` + `index.md` 関連リンク節 | 作成済み（本タスク前提）、Phase 7 で死活確認 | #9 |
| AC-6 | 03a/03b/04c/09b の受入条件 patch 案が Phase 5 で提示（実適用は各タスク内 Phase） | スイート 3（正本整合性 grep）+ スイート 4（手動観点 #1） | `outputs/phase-05/implementation-runbook.md` 全体 | Phase 5 提示、各受入先タスクの Phase 1 / 11 / 12 で適用 | #1〜#4, #10〜#12, #16 |
| AC-7 | aiworkflow-requirements `task-workflow.md` current facts と矛盾する記述が本仕様書内に存在しない | スイート 1（stale 参照 grep）+ スイート 3 + スイート 4（手動観点 #2 / #3） | `outputs/phase-09/main.md`（current facts 突合ログ） | Phase 9 で実測、Phase 7 で枠組み確定 | #8, #13 |
| AC-8 | 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS | スイート 4（手動観点全件）+ Phase 3 review 結果 | `outputs/phase-03/main.md` + `outputs/phase-10/go-no-go.md` | Phase 3 / Phase 10 | 全件（MAJOR 残存有無で判定） |
| AC-9 | 不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）に違反する記述なし | スイート 4（手動観点 #4） | `outputs/phase-09/main.md` の不変条件チェックセクション | Phase 9 で実測 | #14, #16 |
| AC-10 | 検証コマンド `rg -n "POST /admin/sync\b\|GET /admin/sync/audit\|sync_audit_logs\|sync_audit_outbox" docs/30-workflows .claude/skills/aiworkflow-requirements/references` の出力に基づく差分根拠が記録 | スイート 1（規定 rg コマンド） | `outputs/phase-09/stale-grep-evidence.md` への貼り付け | Phase 4 で定義、Phase 9 で実測 | #5, #6, #7 |
| AC-11 | GitHub Issue #234 が CLOSED 状態のまま、本仕様書が成果物として参照可能 | `gh issue view 234 --json state` + `ls docs/30-workflows/ut21-forms-sync-conflict-closeout/` | `outputs/phase-09/issue-state.json` | Phase 9 で実測、Phase 10 で確認 | #15 |

11 行 × 4 列（+ 補助列）すべてに値が埋まる。

## 完全性指標

### 1. patch 案網羅性

```bash
# Phase 5 patch 案文書内で 4 移植先タスクすべてに言及があること
for slug in 03a-parallel-forms-schema-sync 03b-parallel-forms-response-sync 04c-parallel-admin-backoffice 09b-parallel-cron-triggers; do
  count=$(rg -c "${slug}" docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md)
  echo "${slug}: ${count}"
done
```

期待: 各 slug で 1 hit 以上。0 hit が 1 つでもあれば NO-GO。

### 2. stale 参照ゼロ性

```bash
# AC-10 規定コマンド
rg -n "POST /admin/sync\b\|GET /admin/sync/audit\|sync_audit_logs\|sync_audit_outbox" \
  docs/30-workflows .claude/skills/aiworkflow-requirements/references > /tmp/ut21-stale.txt

# 許容パスのみで hit していることを確認
# 許容: 本タスク仕様書（禁止文脈として明記）/ UT-21 legacy 仕様 / U02 タスク / U05 タスク
grep -v -E "(ut21-forms-sync-conflict-closeout|UT-21-sheets-d1-sync-endpoint-and-audit-implementation|task-ut21-sync-audit-tables-necessity-judgement-001|task-ut21-impl-path-boundary-realignment-001)" /tmp/ut21-stale.txt
```

許容外 hit が 0 行であれば PASS。1 行でもあれば NO-GO。

### 3. 証跡

`outputs/phase-09/` に以下を記録。

```
outputs/phase-09/patch-coverage.json   # patch 案網羅性の実測値
outputs/phase-09/stale-grep-evidence.md # stale grep 出力 + 許容パス分類
outputs/phase-09/issue-state.json       # gh issue view 234 --json state の生出力
outputs/phase-09/main.md                # 上記 3 ファイルのサマリ + 不変条件チェック
```

## 計測対象 allowlist（広域指定の禁止）

本タスクは docs-only であり、コード coverage の対象は無い。完全性指標の対象は以下に限定する。

```
docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md
docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md
docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-*.md
docs/30-workflows/unassigned-task/task-ut21-*.md
docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md
.claude/skills/aiworkflow-requirements/references/task-workflow.md
```

### 禁止パターン（広域指定）

```
# 以下は禁止: 既存仕様書群全体を含めると指標が歪む
docs/**/*.md
.claude/skills/**/*.md
apps/**/*.ts
```

## 実行手順

1. 11 行 × 4 列（+ 補助列）の AC マトリクスを `outputs/phase-07/ac-matrix.md` に転記。
2. patch 案網羅性 / stale 参照ゼロ性の計測コマンドを Phase 9 入力として固定。
3. 広域指定禁止ルールを Phase 8 DRY 化 / Phase 9 の入力に固定。
4. Phase 9 / Phase 10 への引き継ぎ項目を箇条書きで明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 重複記述検出時、AC マトリクスの行が崩れないことを確認 |
| Phase 9 | 完全性指標を実測し、AC-2 / AC-7 / AC-10 / AC-11 を確定 |
| Phase 10 | GO/NO-GO の根拠として AC マトリクスの空セル無し + 完全性指標 PASS を参照 |
| Phase 11 | AC-9 / AC-10 / AC-11 を手動 smoke で再確認 |
| Phase 12 | AC-3 patch 案 5（UT-21 仕様書状態欄追記）を実適用 |

## 多角的チェック観点

- 価値性: 11 件 AC が漏れなく検証 → 成果物 → 担当 Phase にトレースされているか。
- 実現性: 完全性指標が変更ファイル限定で、既存仕様書全体に widen していないか。
- 整合性: Phase 4 / 5 / 6 のファイル名・スイート番号・case ID と差分ゼロ。
- 運用性: 完全性指標コマンドが PR 上で再現可能か。
- 不変条件: AC-9 が手動観点 #4 にきちんと wire されているか。
- スコープ境界: AC-2 / AC-6 が「実適用は受入先タスク」を明示し、本 Phase 内で 03a/03b/04c/09b を編集しないことが反映されているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC マトリクス 11 行 × 4 列（+ 関連 failure case 補助列） | spec_created |
| 2 | patch 案網羅性指標確定 | spec_created |
| 3 | stale 参照ゼロ性指標確定 | spec_created |
| 4 | 広域指定禁止ルール文書化 | spec_created |
| 5 | Phase 9 / 10 引き継ぎ項目予約 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × 成果物 × 担当 Phase の 4 列トレース表 + 完全性指標 |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件

- [ ] AC マトリクス 11 行 × 4 列に空セル無し
- [ ] patch 案網羅性指標の計測コマンドが記述
- [ ] stale 参照ゼロ性指標の計測コマンド（AC-10 規定 rg を含む）が記述
- [ ] 広域指定の禁止パターンが例示
- [ ] Phase 9 / Phase 10 への引き継ぎ項目が箇条書き

## タスク100%実行確認【必須】

- 実行タスク 5 件すべて `spec_created`
- 成果物が `outputs/phase-07/ac-matrix.md` に配置予定
- AC-1〜AC-11 の 11 行が全て埋まる
- 関連 failure case 補助列が Phase 6 の case# を 1 つ以上参照（AC-8 は「全件」可）
- 完全性指標 allowlist と Phase 5 patch 案文書 / 各 phase-XX.md の対象範囲が一致

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC マトリクス → Phase 10 GO/NO-GO の根拠
  - patch 案網羅性 / stale 参照ゼロ性指標 → Phase 9 で実測
  - 広域指定禁止ルール → Phase 8 / Phase 9 で逸脱を防ぐ
- ブロック条件:
  - AC マトリクス空セル残存
  - 完全性指標が広域指定に変質
  - AC-11（Issue #234 CLOSED 維持）が `gh issue view` で未確認
