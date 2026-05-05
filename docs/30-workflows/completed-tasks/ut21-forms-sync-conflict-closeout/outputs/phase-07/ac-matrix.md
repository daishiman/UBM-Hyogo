# Phase 7 Output: AC Matrix（AC-1〜AC-11 完全トレース）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 7 / 13（AC マトリクス） |
| taskType | docs-only / specification-cleanup（traceability） |
| 前 Phase | 6（異常系検証） |
| 次 Phase | 8（DRY 化） |

## 0. 目的

`index.md` で定義された AC-1〜AC-11 を、Phase 4（検証手段）/ Phase 5（patch 案 = 成果物パス）/ Phase 6（failure case）と縦串で結び、4 列マトリクス「AC × 検証手段 × 成果物パス × 担当 Phase」として完全トレースする。
docs-only / legacy umbrella close-out のため code coverage の代わりに以下 2 軸を完全性指標として採用する。

1. **patch 案網羅性**: Phase 5 patch 案が 03a / 03b / 04c / 09b の 4 移植先タスクすべてを網羅している
2. **stale 参照ゼロ性**: AC-10 規定 rg の hit が「禁止文脈 / UT-21 legacy / U02 / U04 / U05」以外でゼロ

これらを Phase 9 で実測し、Phase 10 GO/NO-GO に渡す。

## 1. AC マトリクス（11 行 × 4 列 + 関連 failure case 補助列）

| AC# | AC 内容（要約） | 検証手段 (Phase 4) | 成果物パス (Phase 5 / 他) | 担当 Phase | 関連 failure case (Phase 6) |
| --- | --- | --- | --- | --- | --- |
| AC-1 | UT-21 stale 前提 5 項目（同期元 / 単一 endpoint / GET audit / audit テーブル / 実装パス）が差分表として固定 | スイート 1 (S1-01〜S1-04) + スイート 4 (M-01) | `outputs/phase-02/migration-matrix-design.md` §(a) 差分表 | Phase 2 確定、Phase 7 トレース | #5, #6, #7, #13 |
| AC-2 | 有効品質要件 4 種（Bearer guard / 409 排他 / D1 retry / manual smoke）の移植先が 03a/03b/04c/09b に一意割当 | スイート 3 (S3-01〜S3-04) | `outputs/phase-02/migration-matrix-design.md` §(b) 移植マトリクス + `outputs/phase-05/implementation-runbook.md` patch 案 1〜4 | Phase 5 提示、各受入先タスクで実適用 | #1, #2, #3, #4, #10, #11, #12 |
| AC-3 | `POST /admin/sync` / `GET /admin/sync/audit` を新設しない方針が本仕様書と UT-21 仕様書状態欄の双方に明記 | スイート 1 (S1-01) + スイート 4 (M-05) | `index.md` AC-3 + `outputs/phase-02/no-new-endpoint-policy.md` + `outputs/phase-05/implementation-runbook.md` patch 案 5 | Phase 5 案提示、Phase 12 で UT-21 仕様書状態欄に追記 | #5, #6 |
| AC-4 | `sync_audit_logs` / `sync_audit_outbox` の新設は U02 判定後まで保留 | スイート 1 (S1-02) + スイート 4 (M-02) | `outputs/phase-02/no-new-endpoint-policy.md` + `outputs/phase-02/migration-matrix-design.md` §(d) + U02 タスクへの link | Phase 2 確定、Phase 7 トレース | #7, #8 |
| AC-5 | 後続タスク UT21-U02 / U04 / U05 が `unassigned-task/` 配下に別ファイルで存在し本仕様書からリンク | スイート 2（cross-link 死活） | `unassigned-task/task-ut21-{sync-audit-tables-necessity-judgement,phase11-smoke-rerun-real-env,impl-path-boundary-realignment}-001.md` 3 件 + `index.md` 関連リンク節 | 作成済み（本タスク前提）、Phase 7 で死活確認 | #9 |
| AC-6 | 03a/03b/04c/09b の受入条件 patch 案が Phase 5 で提示（実適用は各タスク内 Phase） | スイート 3 (S3-01〜S3-04) + スイート 4 (M-01) | `outputs/phase-05/implementation-runbook.md` 全体（§2〜§6） | Phase 5 提示、各受入先タスクの Phase 1 / 11 / 12 で適用 | #1〜#4, #10〜#12, #16 |
| AC-7 | aiworkflow-requirements `task-workflow.md` current facts と矛盾する記述が本仕様書内に存在しない | スイート 1 (S1-04, S1-05) + スイート 3 + スイート 4 (M-02, M-03) | `outputs/phase-09/main.md` の current facts 突合ログ | Phase 9 で実測、Phase 7 で枠組み確定 | #8, #13 |
| AC-8 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS | スイート 4（手動観点全件）+ Phase 3 review 結果 | `outputs/phase-03/main.md` + `outputs/phase-10/go-no-go.md` | Phase 3 / Phase 10 | 全件（MAJOR 残存有無で判定） |
| AC-9 | 不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）に違反する記述なし | スイート 4 (M-04) | `outputs/phase-09/main.md` の不変条件チェック節 | Phase 9 で実測 | #14, #16 |
| AC-10 | 検証コマンド `rg -n "POST /admin/sync\b\|GET /admin/sync/audit\|sync_audit_logs\|sync_audit_outbox" docs/30-workflows .claude/skills/aiworkflow-requirements/references` の出力に基づく差分根拠が記録 | スイート 1 (S1-06 = 規定 rg) | `outputs/phase-09/stale-grep-evidence.md` への貼り付け + `outputs/phase-02/migration-matrix-design.md` §(g) | Phase 4 で定義、Phase 9 で実測 | #5, #6, #7 |
| AC-11 | GitHub Issue #234 が CLOSED 状態のまま、本仕様書が成果物として参照可能 | `gh issue view 234 --json state` + `ls docs/30-workflows/ut21-forms-sync-conflict-closeout/` | `outputs/phase-09/issue-state.json` | Phase 9 で実測、Phase 10 で確認 | #15 |

11 行 × 4 列 + 補助列すべてに値が埋まる（空セル無し）。

## 2. 完全性指標

### 2.1 patch 案網羅性

```bash
# Phase 5 patch 案文書内で 4 移植先タスクすべてに言及があること
for slug in 03a-parallel-forms-schema-sync 03b-parallel-forms-response-sync 04c-parallel-admin-backoffice 09b-parallel-cron-triggers; do
  count=$(rg -c "${slug}" docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md)
  echo "${slug}: ${count}"
done
```

期待: 各 slug で 1 hit 以上。0 hit が 1 つでもあれば NO-GO。
記録先: `outputs/phase-09/patch-coverage.json`

### 2.2 stale 参照ゼロ性

```bash
# AC-10 規定コマンド
rg -n "POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox" \
  docs/30-workflows .claude/skills/aiworkflow-requirements/references > /tmp/ut21-stale.txt

# 許容パスのみで hit していることを確認
# 許容: 本タスク仕様書（禁止文脈）/ UT-21 legacy / U02 / U04 / U05 / task-workflow.md close-out 注記
grep -v -E "(ut21-forms-sync-conflict-closeout|UT-21-sheets-d1-sync-endpoint-and-audit-implementation|task-ut21-sync-audit-tables-necessity-judgement-001|task-ut21-impl-path-boundary-realignment-001|task-ut21-phase11-smoke-rerun-real-env-001|task-workflow\.md)" \
  /tmp/ut21-stale.txt
```

許容外 hit が 0 行であれば PASS。1 行でもあれば NO-GO。
記録先: `outputs/phase-09/stale-grep-evidence.md`

### 2.3 証跡記録方法

`outputs/phase-09/` 配下に以下を記録する。

```
outputs/phase-09/patch-coverage.json    # patch 案網羅性の実測値（4 slug × hit 数）
outputs/phase-09/stale-grep-evidence.md # AC-10 規定 rg 出力 + 許容パス分類表
outputs/phase-09/issue-state.json       # gh issue view 234 --json state の生出力
outputs/phase-09/main.md                # 上記 3 ファイルのサマリ + 不変条件チェック
```

## 3. 計測対象 allowlist（広域指定の禁止）

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

理由: docs-only スコープでは「既存仕様書全体」を巻き込むと、本タスクと無関係なドリフトを誤検知し、PASS 判定が困難になる。

## 4. AC × 完全性指標 対応

| AC# | patch 案網羅性 (§2.1) | stale 参照ゼロ性 (§2.2) | その他 |
| --- | --- | --- | --- |
| AC-1 | - | ○ | 差分表整合性（手動 M-01） |
| AC-2 | ○ | - | - |
| AC-3 | - | ○ | - |
| AC-4 | - | ○ | - |
| AC-5 | - | - | cross-link 死活 (Phase 4 スイート 2) |
| AC-6 | ○ | - | - |
| AC-7 | - | ○ | task-workflow.md 突合 |
| AC-8 | - | - | Phase 3 / Phase 10 review |
| AC-9 | - | - | manual M-04 + git diff |
| AC-10 | - | ○ (規定 rg) | - |
| AC-11 | - | - | `gh issue view 234 --json state` |

## 5. 統合テスト連携（次 Phase 引き渡し）

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 重複記述検出時、AC マトリクスの行が崩れないことを確認 |
| Phase 9 | §2 完全性指標を実測し、AC-2 / AC-7 / AC-10 / AC-11 を確定 |
| Phase 10 | GO/NO-GO の根拠として AC マトリクス空セル無し + 完全性指標 PASS を参照 |
| Phase 11 | AC-9 / AC-10 / AC-11 を手動 smoke で再確認 |
| Phase 12 | AC-3 patch 案 5（UT-21 仕様書状態欄追記）を実適用 |

## 6. 多角的チェック観点

- 価値性: 11 件 AC が漏れなく検証 → 成果物 → 担当 Phase にトレース（§1 で空セル無し）
- 実現性: 完全性指標が変更ファイル限定で、既存仕様書全体に widen していない（§3 allowlist）
- 整合性: Phase 4 / 5 / 6 のファイル名・スイート番号・case ID と差分ゼロ
- 運用性: 完全性指標コマンドが PR 上で再現可能（copy-paste 可）
- 不変条件: AC-9 が手動観点 M-04 にきちんと wire されている
- スコープ境界: AC-2 / AC-6 が「実適用は受入先タスク」を明示し、本 Phase 内で 03a/03b/04c/09b を編集しない

## 7. 完了条件チェック

- [x] AC マトリクス 11 行 × 4 列に空セル無し（§1）
- [x] patch 案網羅性指標の計測コマンドが記述（§2.1）
- [x] stale 参照ゼロ性指標の計測コマンド（AC-10 規定 rg 含む）が記述（§2.2）
- [x] 広域指定の禁止パターンが例示（§3）
- [x] Phase 9 / Phase 10 への引き継ぎ項目が箇条書き（§5）
- [x] 関連 failure case 補助列が Phase 6 case# を 1 つ以上参照（AC-8 は「全件」）
- [x] 完全性指標 allowlist と Phase 5 patch 案文書 / 各 phase-XX.md の対象範囲が一致

## 8. Phase 9 / Phase 10 への引き継ぎ項目

- 実測値:
  - patch 案網羅性: 4 slug 各々の `rg -c` 出力を `outputs/phase-09/patch-coverage.json` に記録
  - stale 参照ゼロ性: AC-10 規定 rg の生出力 + 許容パス分類を `outputs/phase-09/stale-grep-evidence.md` に貼付
  - Issue 状態: `gh issue view 234 --json state,title,url` を `outputs/phase-09/issue-state.json` に保存
- gap 分析:
  - 許容外 hit が出た場合は失敗 case ID（#5/#6/#7/#13/#14）と紐付けて記録
  - 4 slug のいずれかが 0 hit なら failure case #1 として記録
- GO/NO-GO 入力:
  - 完全性指標 2 件 PASS + AC-1〜AC-11 全行埋まる + 不変条件 #5 抵触ゼロ → GO
  - 1 件でも NO-GO → Phase 5 / Phase 6 へ差し戻し
