# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | post-release-dashboard 30 日連続実行 conclusion 集計と skill feedback 化 (issue-497) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-05-06 |
| 前 Phase | 6（異常系） |
| 次 Phase | 8（DRY 化 / 仕様間整合） |
| 状態 | spec_created |
| タスク分類 | docs-only（acceptance-traceability） |
| taskType | docs-only（CONST_004 例外） |
| visualEvidence | NON_VISUAL |
| 実装区分 | ドキュメントのみ |

## 目的

`index.md` で定義された AC-1〜AC-11 を **検証方法 × 期待 evidence × Phase 11 取得成果物パス × Phase 12 記録場所** の 4 軸で表化し、トレーサビリティを担保する。本 Phase は AC が「全 PASS で根拠付き」（AC-10）であることを最終的に裏付ける入力を作る。

## 完了条件チェックリスト

- [ ] AC-1〜AC-11 全 11 項目が表に揃っている（`index.md` と完全一致）
- [ ] 各 AC に「検証方法」「期待 evidence」「Phase 11 取得パス」「Phase 12 記録場所」が記載されている
- [ ] AC 間依存（AC-1 → AC-2〜AC-5、AC-8 → AC-2/AC-3）が明記されている
- [ ] 30 日 gate 不成立時の close 経路が AC-1 補足として記述されている
- [ ] 不変条件への影響が「なし」と明記されている
- [ ] 4 条件評価が PASS 判定で根拠付き

## AC マトリクス

| AC | 内容（要約） | 検証方法 | 期待 evidence | Phase 11 取得成果物パス | Phase 12 記録場所 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `gh run list --limit=80` の取得対象が 30 日以上の連続期間をカバー（最古 run `createdAt` ≦ 着手日 - 30 日） | `gh run list --limit=80 --json createdAt --jq '.[0].createdAt'` の値を 着手日 - 30 日 と比較 | 最古 run 日付 ≦ 着手日 - 30 日 の判定結果 | `outputs/phase-11/30day-gate-check.log` | `outputs/phase-12/implementation-guide.md` § 30 日 gate 判定 |
| AC-2 | conclusion 分布表（success / failure / cancelled / startup_failure / timed_out / action_required の件数と比率）が `deployment-gha.md` に追記 | (a) `jq 'group_by(.conclusion) \| map({conclusion: .[0].conclusion, count: length})'` 実行、(b) skill references の `#### conclusion 分布` セクション存在確認 | conclusion 6 種の件数 + 比率表 | `outputs/phase-11/conclusion-distribution.json` / `outputs/phase-11/aggregation.md` | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` § `#### conclusion 分布` |
| AC-3 | failure run の根本原因分類表（token 失効 / GraphQL 5xx / cron schedule drift / schema drift / artifact retention / その他）が同 references に追記 | failure run ごとに `gh run view --log-failed` を取得し、redaction 後にカテゴリ分類 | 6 カテゴリ別件数表 | `outputs/phase-11/log-failed-<id>.log` 群 / `outputs/phase-11/aggregation.md` | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` § `#### failure 根本原因分類` |
| AC-4 | 連続 failure 区間の最大日数が記録（0 日でも明記） | `jq -r 'sort_by(.createdAt) \| .[] \| .conclusion'` を時系列走査し最大連続 failure ブロック長を算出 | 最長連続 failure 日数（整数 / 0 含む） | `outputs/phase-11/timeline.txt` / `outputs/phase-11/aggregation.md` | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` § `#### 連続 failure 区間` |
| AC-5 | failure 比率に応じた次アクション（`< 10%`: 現状維持 / `>= 10%`: 別 unassigned task 起票）が判断され、判断根拠と起票 issue 番号（起票時のみ）が記録 | (a) failure 比率算出、(b) `< 10%` なら現状維持、(c) `>= 10%` なら `gh issue create` で起票し issue 番号取得 | failure 比率 + 判定 + （起票時）issue 番号 | `outputs/phase-11/aggregation.md` § 次アクション判断 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` § `#### 次アクション判断` |
| AC-6 | aiworkflow-requirements changelog fragmentに 30 日 feedback 反映行が追加 | 1 行追加して `rg -n "issue497-30day-feedback" .claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` でヒット確認 | changelog の 1 行 | （Phase 12 で生成） | `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md`（または `workflow-local close-out`） |
| AC-7 | 取得した raw JSON が `outputs/phase-11/post-release-dashboard-30d.json` として保存 | ファイル存在確認 + `jq 'length'` で件数 ≧ 30 | raw JSON ファイル存在 + 件数 ≧ 30 | `outputs/phase-11/post-release-dashboard-30d.json` | `outputs/phase-12/implementation-guide.md` § evidence 一覧 |
| AC-8 | failure log redaction grep（`token` / `bearer` / `secret` / `Authorization`）が実施され機微情報が skill references に混入していない | (a) `outputs/phase-11/redaction-grep.log` 存在確認、(b) マッチあり時は skill references に原文転記がないことを `rg` で再確認 | redaction-grep.log 存在 + skill references に原文なし | `outputs/phase-11/redaction-grep.log` | `outputs/phase-12/implementation-guide.md` § redaction 実施記録 |
| AC-9 | GitHub Issue #497 は CLOSED 据え置き（再 OPEN しない / PR 文面は `Refs #497`） | `gh issue view 497 --json state` の値が `CLOSED` | Issue state = `CLOSED` | `outputs/phase-11/issue-state.log`（任意） | `outputs/phase-12/implementation-guide.md` § Issue 状態確認 |
| AC-10 | 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き | Phase 1 / 3 / 10 で 4 条件を再判定し、全時点 PASS であること | 4 条件 × 3 時点 PASS の表 | `outputs/phase-01/main.md` / `outputs/phase-03/main.md` / `outputs/phase-10/go-no-go.md` | `outputs/phase-12/implementation-guide.md` § 4 条件評価 |
| AC-11 | Phase 12 で 7 必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）と aiworkflow-requirements skill 同期が完了 | 7 ファイル存在確認 + サイズ > 0 + `pnpm indexes:rebuild` で drift 0 | 7 markdown 存在 + indexes drift 0 | （Phase 11 では生成しない） | `outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |

## AC 間依存関係

```
                AC-1（30 日 gate）
                    │
                    ├─ PASS → AC-7（raw JSON 保存）
                    │           ├─→ AC-2（conclusion 分布）
                    │           ├─→ AC-3（failure 根本原因）─── AC-8（redaction）
                    │           ├─→ AC-4（連続 failure 区間）
                    │           └─→ AC-5（次アクション判断）
                    │                   │
                    │                   └─→ AC-6（changelog 反映）
                    │
                    └─ NOT PASS → spec_created 据え置き
                                  AC-2〜AC-8 はスコープ外（Phase 11 未実施）
                                  AC-9 のみ評価対象（CLOSED 据え置き確認）
                                  AC-10 は「実装不要」を運用性 PASS 根拠とする
                                  AC-11 は Phase 12 の implementation-guide.md で「30 日未達 / 据え置き」を記録するのみ
```

| 依存元 | 依存先 | 関係 |
| --- | --- | --- |
| AC-1 PASS | AC-2, AC-3, AC-4, AC-5, AC-7 | gate 成立が前提 |
| AC-7 | AC-2, AC-3, AC-4, AC-5 | raw JSON 保存が集計の前提 |
| AC-8 | AC-2, AC-3 | redaction 実施が skill references 追記の前提（特に failure 根本原因分類） |
| AC-5 | AC-6 | 次アクション判断結果が changelog 行の内容を決定 |
| AC-9 | （独立） | Issue CLOSED 据え置き確認は他 AC と独立に判定可能 |
| AC-10 | AC-1〜AC-9 | 4 条件評価は他 AC の達成を根拠とする |
| AC-11 | AC-1〜AC-10 | Phase 12 成果物は前段すべてを集約 |

## 30 日 gate 不成立時の close 経路（AC-1 特殊性）

| gate 判定 | 後続 AC の扱い |
| --- | --- |
| 成立（最古 run ≦ 着手日 - 30 日） | AC-2〜AC-11 をすべて PASS で満たす必要あり |
| 不成立 | AC-2〜AC-8 はスコープ外（仕様書 spec_created 据え置き）/ AC-9 のみ評価（CLOSED 据え置き確認）/ AC-10 は「実装不要」が運用性 PASS 根拠 / AC-11 は Phase 12 で「30 日未達 / 据え置き」を `implementation-guide.md` に記録するのみ |

## AC-10 / AC-11 特殊性の補足

- **AC-10（4 条件評価）**: 価値性 / 実現性 / 整合性 / 運用性 を Phase 1（初期）/ Phase 3（設計レビュー後）/ Phase 10（最終ゲート）の 3 時点で再判定し、すべて PASS の場合のみ AC-10 を PASS とする。30 日 gate 不成立時は「実装不要」が運用性 PASS の根拠となる。
- **AC-11（Phase 12 必須成果物 + aiworkflow-requirements 同期）**: 7 必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）に加え、`aiworkflow-requirements` の references（`deployment-gha.md`）と changelog（`changelog/20260506-issue497-30day-feedback.md`）の同期、必要時の indexes rebuild（`pnpm indexes:rebuild` で drift 0）を必須とする。

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | CLAUDE.md 全項目 | **影響なし** | コード変更なし。AC 判定はすべて文書 / 文書存在確認 / read-only シェルで完結 |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | AC-1〜AC-11 すべてに検証方法 / evidence パス / 記録場所が紐付き、Phase 10 ゲートで本マトリクス走査だけで GO/NO-GO 判定が可能 |
| 実現性 | PASS | 検証手段が `gh` / `jq` / `rg` / 文書存在確認 のみで完結 |
| 整合性 | PASS | `index.md` AC-1〜AC-11 と本マトリクスの行が完全一致。Phase 4 / 5 / 6 で予約した evidence パスと整合 |
| 運用性 | PASS | 30 日 gate 不成立時の close 経路も明示され、Phase 11 / 12 で「30 日未達」を文書化する経路が確保 |

## 受入条件（AC）

本 Phase は **AC-10（4 条件評価）/ AC-11（Phase 12 必須成果物）** のトレーサビリティを最終固定する責務を担う。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/index.md` § 受入条件 | AC-1〜AC-11 正本 |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-04.md` | 検証戦略連結 |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-05.md` | runbook step sequence 連結 |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-06.md` | 異常系 Case 連結 |
| 参考 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-07.md` | フォーマット参照 |

## 苦戦箇所【記入必須】

- AC-1（30 日 gate）と AC-9（Issue CLOSED 据え置き）は他 AC と依存関係が異なる。AC-1 は他 AC の前提となり、AC-9 は独立して評価される。本 Phase では「AC 間依存関係」セクションを設けて図式化し、gate 不成立時の close 経路を「AC-9 / AC-10 / AC-11 のみ評価」と明示することで Phase 10 ゲート判定を一意化した。
- AC-11 の必須成果物が「7 必須成果物」（issue-497 の `index.md` に明記）と「7 必須成果物」（ut-07b-fu-01 のフォーマット参照）で異なる。本タスクは `index.md` の 6 件を正本とした（main.md は Phase 12 の総括として暗黙含意）。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-07/ac-matrix.md` | AC-1〜11 × 検証方法 × 期待 evidence × Phase 11 パス × Phase 12 記録場所 + AC 間依存 + 30 日 gate 特殊性 + AC-10 / AC-11 補足 |
| メタ | `artifacts.json` | Phase 7 状態の更新 |

## 次 Phase への引き渡し

- 次 Phase: 8（DRY 化 / 仕様間整合）
- 引き継ぎ事項:
  - AC-1〜AC-11 の検証方法 / evidence パス / Phase 11 / 12 記録場所
  - AC 間依存関係（AC-1 → AC-2〜AC-5 / AC-8 → AC-2/AC-3）
  - 30 日 gate 不成立時の close 経路
  - Phase 10 ゲートで本マトリクスを走査するだけで GO / NO-GO 判定可能な粒度
- ブロック条件:
  - AC-1〜AC-11 が `index.md` と乖離
  - evidence パスが Phase 11 / 12 成果物と矛盾
  - PASS 基準が客観判定不可能
  - 30 日 gate 二択の close 経路が欠落

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として `gh run list` raw JSON の `jq empty`、redaction grep、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
