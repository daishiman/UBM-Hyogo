# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-05-01 |
| 前 Phase | 6（異常系） |
| 次 Phase | 8（DRY 化 / 仕様間整合） |
| 状態 | spec_created |
| タスク分類 | implementation（acceptance-traceability） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

`index.md` で定義された AC-1〜AC-10 を、**実証手段 × 担当 Phase × evidence パス × PASS 基準** の 4 軸で表に落とし、トレーサビリティを担保する。本タスクは implementation タスクのため、文書レビュー / grep / 文書存在確認に加え、unit / route / workflow / staging テスト実行結果と staging 大規模実測 evidence を実証手段として用いる。本 Phase は AC が「全 PASS で根拠付き」（AC-9）であることを最終的に裏付ける入力を作る。

## 完了条件チェックリスト

- [ ] AC-1〜AC-10 の全 10 項目が表に揃っている（index.md と完全一致）
- [ ] 各 AC に「実証手段」が 1 つ以上紐付いている（テスト実行 / 文書レビュー / grep / staging 計測 / 文書存在確認）
- [ ] 各 AC に「担当 Phase」「evidence パス」が記載されている
- [ ] 各 AC の PASS 基準が客観的に判定可能な形で記述されている
- [ ] AC-9（4 条件評価）と AC-10（Phase 12 の 7 必須成果物）の特殊性が補足されている
- [ ] 異常系カバレッジ補助列（Phase 6 Case 1〜6 との連動）が記述されている

## AC マトリクス

| AC | 内容（要約） | 実証手段 | 担当 Phase | evidence パス | PASS 基準 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `schema_questions(revision_id, stable_key)` collision を DB constraint + repository pre-check の二段防御で保証 | (a) partial UNIQUE index DDL レビュー (b) Miniflare D1 で SQLITE_CONSTRAINT 再現 (c) repository pre-check unit test | Phase 2, Phase 4, Phase 8〜9 | `outputs/phase-02/db-constraint-design.md`, `outputs/phase-04/test-strategy.md` (T-U-01〜03, T-W-01), Phase 9 test 実行 log | partial UNIQUE DDL が記述 + T-W-01 で 2 行目 INSERT が SQLITE_CONSTRAINT で reject + T-U-01 が 409 を返す |
| AC-2 | 既存衝突検出 SQL + rollback 手順が Phase 5 runbook に記載、UT-04 / 本 migration の適用順序が明示 | 文書レビュー（Phase 5 runbook の章立て確認） | Phase 5 | `outputs/phase-05/migration-runbook.md` § Step 0 / Step 4, `outputs/phase-05/rollback-runbook.md` § A〜E | 検出 SQL + rollback 4 シナリオ + UT-04 順序関係（独立適用可）が runbook に記述 |
| AC-3 | alias 確定と back-fill 継続の状態分離 + CPU budget 超過後の retry で残件のみ処理（idempotent） | (a) Phase 2 設計レビュー (b) workflow integration test の cursor 進行 assert (c) staging 実測の retry 挙動確認 | Phase 2, Phase 4, Phase 9, Phase 11 | `outputs/phase-02/resumable-backfill-design.md`, `outputs/phase-04/test-strategy.md` § idempotent cursor 進行表 (T-W-05/06/08), `outputs/phase-11/manual-evidence.md` § Case 2 | T-W-06 で同一行が 2 試行以上で UPDATE されないこと + cursor 進行表で 3 試行 idempotent 証明 + staging で retry 後の updated 件数積算が初回 + 2 回目 = 全件と一致 |
| AC-4 | `backfill_cpu_budget_exhausted` retryable failure が API contract（HTTP / body）として正本化、route test で境界固定 | (a) api-contract-update.md レビュー (b) route test で 5 ケース全境界の HTTP / body assert (c) `aiworkflow-requirements/references/api-endpoints.md` への差分反映 | Phase 5, Phase 4, Phase 9, Phase 12 | `outputs/phase-05/api-contract-update.md`, `outputs/phase-04/test-strategy.md` § T-R-01〜10, Phase 9 route test 実行 log, Phase 12 で `api-endpoints.md` 差分 commit | 5 ケース contract が正本化 + T-R-01〜10 全 PASS + `api-endpoints.md` に retryable failure が記述 |
| AC-5 | 10,000 行以上の `response_fields` fixture を staging D1 / Workers 実環境で実測、batch 数 / CPU 時間 / retry 回数を Phase 11 evidence に残す | staging 実測（T-S-01〜03） | Phase 11 | `outputs/phase-11/manual-evidence.md` § T-S-01〜03 | 10K / 50K / 100K 行 3 サイズで apply 応答時間 / batch 数 / Workers CPU 時間 / retry 回数が表として記録 + 100K 行が 3 retry 以下に収束 OR follow-up 起票条件発動の判定が記録 |
| AC-6 | 実 DB schema（`response_fields` に `questionId` / `is_deleted` カラム不在）と仕様書差分の吸収方針が Phase 1 / Phase 5 で明示 | 文書レビュー | Phase 1, Phase 5, Phase 12 | `outputs/phase-01/main.md` § 既存差分前提, `outputs/phase-05/api-contract-update.md` § AC-6, `outputs/phase-12/implementation-guide.md` | `__extra__:<questionId>` リテラル一致 + `deleted_members` JOIN 除外 が両 Phase で一貫記述 + `database-schema.md` 差分にも反映 |
| AC-7 | unit / route / workflow tests が collision / retryable failure / idempotent retry / CPU budget 超過を網羅 | テスト実行 log（vitest） + Phase 4 テストケース ID 一覧との突合 | Phase 4, Phase 9 | `outputs/phase-04/test-strategy.md` § T-U/T-R/T-W ID 一覧, Phase 9 test 実行 log | T-U-* + T-R-* + T-W-* 全件 PASS + 4 境界（collision / retryable / idempotent / CPU 超過）が ID と紐付いている |
| AC-8 | 不変条件 #5（D1 直接アクセスは apps/api 限定）違反ゼロ。migration / repository / workflow すべて apps/api 配下に閉じる | grep ベース機械検査（`apps/web/**` から D1 binding 参照が無いこと）+ 文書レビュー | Phase 2, Phase 9, Phase 10 | Phase 9 grep 結果 log, Phase 10 go-no-go.md | `git grep -n "DB" apps/web/src` で D1 binding 直接参照が 0 件 + 全 migration / repository / workflow ファイルが `apps/api/**` 配下 |
| AC-9 | 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き | 4 条件再判定（Phase 1, 3, 10 横断） | Phase 1, Phase 3, Phase 10 | `outputs/phase-01/main.md` § 4 条件評価, `outputs/phase-03/main.md` § 4 条件再評価, `outputs/phase-10/go-no-go.md` | 4 条件すべてに 1 つ以上の具体根拠（成果物パス + 該当章）が紐付き、PASS 判定が 3 Phase で一貫 |
| AC-10 | Phase 12 で 7 必須成果物確認（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main） | 文書存在確認 + 章立て確認 | Phase 12 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | 7 ファイルすべてが存在 + サイズ > 0 + 各規定章立てを満たす |

## 異常系カバレッジ補助列（Phase 6 連動）

各 AC が Phase 6 のどの異常 Case を予防するかの補助マッピング:

| AC | 予防する Case | 連動メカニズム |
| --- | --- | --- |
| AC-1 | Case 5（同時 apply 競合）/ Case 6（規約 drift） | partial UNIQUE 物理制約 + 除外条件のテスト固定 |
| AC-2 | Case 1（migration 失敗） | Step 0 検出 SQL + rollback §B 適用順序 |
| AC-3 | Case 2（back-fill 中断）/ Case 4（D1 batch 失敗） | Stage 分離 + 1 batch = 1 transaction + cursor idempotent |
| AC-4 | Case 3（CPU budget 超過） | retryable contract で復旧経路明示 |
| AC-5 | Case 3（CPU 恒常超過の検出） | staging 大規模実測で follow-up 起票条件を発動可能化 |
| AC-6 | （直接の予防対象なし。差分吸収による silent drift 防止） | `__extra__:%` + `deleted_members` JOIN の方針一貫化 |
| AC-7 | Case 1〜5（実装層全般） | テストケースが各 Case の予防策と紐付く |
| AC-8 | （構造的予防：境界違反による下流事故防止） | apps/api 内完結の grep 検証 |

## 実証手段の凡例

| 凡例 | 意味 |
| --- | --- |
| 文書レビュー | 該当成果物を Read し、章立て・必須項目の存在を目視確認 |
| 文書存在確認 | ファイルパスの存在 + サイズ > 0 + 規定の見出し存在を確認 |
| grep | `git grep` / Phase 4 grep 計画パターンを適用し、ヒット件数 / 値集合を機械的に確認 |
| テスト実行 | `pnpm test`（vitest）で T-U / T-R / T-W が全件 PASS することを log で確認 |
| staging 計測 | `scripts/cf.sh` 経由で staging に curl + Workers Logs 収集、応答時間 / batch 数 / CPU 時間 / retry 回数を表化 |
| 4 条件再判定 | 価値性 / 実現性 / 整合性 / 運用性 のチェック観点を成果物に対し再走査し PASS 判定 |

## 4 軸境界の AC 紐付け（Phase 4 連動）

Phase 4 で確定した 4 境界（collision / idempotent retry / CPU budget 超過 / dryRun / apply）は本 AC マトリクスの以下と対応する:

| 境界 | 対応 AC | 主たるテストケース ID |
| --- | --- | --- |
| collision | AC-1, AC-7 | T-U-01, T-W-01, T-R-07, T-R-08 |
| idempotent retry | AC-3, AC-7 | T-U-04〜08, T-W-06, T-W-08, T-R-04〜06 |
| CPU budget 超過 | AC-3, AC-4, AC-5, AC-7 | T-W-07, T-R-05, T-S-03 |
| dryRun | AC-7 | T-R-01, T-R-02, T-W-10 |
| apply | AC-1, AC-3, AC-4, AC-7 | T-R-03〜06, T-W-05 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/index.md` § 受入条件 | AC-1〜AC-10 の正本 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-02/*` | AC-1, AC-3, AC-4 の根拠 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-04/test-strategy.md` | AC-7 / 4 境界 / テストケース ID |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md` | AC-2 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md` | AC-2 / Phase 6 recovery 連結 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/api-contract-update.md` | AC-4, AC-6 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-06/failure-cases.md` | AC 補助カバレッジ |
| 参考 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-11/manual-evidence.md`（予約） | AC-3, AC-5, Phase 6 evidence |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC-1〜10 × 実証手段 × 担当 Phase × evidence パス × PASS 基準 + 異常系カバレッジ補助 + 4 境界紐付け |
| メタ | artifacts.json | Phase 7 状態の更新 |

## 実行タスク

1. AC-1〜AC-10 の 10 行を表に展開し、実証手段 / 担当 Phase / evidence パス / PASS 基準を埋める。
2. 異常系カバレッジ補助列（Phase 6 Case 1〜6 との対応）を追加する。
3. 4 軸境界（Phase 4 連動）の AC 紐付け表を追加する。
4. AC-9（4 条件評価）と AC-10（Phase 12 の 7 必須成果物）の特殊性を補足する。
5. 成果物 `outputs/phase-07/ac-matrix.md` の章立てを確定する。

## 多角的チェック観点

- **AC 一致**: AC-1〜AC-10 が `index.md` § 受入条件 と完全一致しているか（文言・順序）。
- **evidence パス予約**: 各 AC の evidence パスが後続 Phase（特に Phase 9 / 11 / 12）の成果物パスと整合しているか。
- **実証手段の客観性**: 各 AC が「読めば PASS / NOT PASS が一意に判定できる」基準で記述されているか。
- **4 境界 × AC 連結**: Phase 4 の 4 境界が 1 つ以上の AC と紐付いているか（漏れ検出）。
- **異常系連結**: Phase 6 Case 1〜6 が 1 つ以上の AC と紐付いているか（予防対応の網羅）。
- **不変条件 #5**: AC-8 の grep 検査が機械的に実行可能な粒度で記述されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-10 表展開 | 7 | pending | index.md と完全一致 |
| 2 | evidence パス予約 | 7 | pending | Phase 9 / 11 / 12 の成果物パス整合 |
| 3 | 異常系カバレッジ補助列 | 7 | pending | Phase 6 Case 1〜6 連動 |
| 4 | 4 境界 × AC 紐付け表 | 7 | pending | Phase 4 連動 |
| 5 | AC-9 / AC-10 特殊性補足 | 7 | pending | 4 条件 / 7 成果物 |
| 6 | 成果物 ac-matrix.md の章立て確定 | 7 | pending | Phase 10 ゲートの走査リスト |

## タスク 100% 実行確認【必須】

- 全実行タスク（5 件）が `spec_created` へ遷移
- AC-1〜AC-10 全 10 行が実証手段 / 担当 Phase / evidence / PASS 基準で揃っている
- 異常系カバレッジ補助列に Case 1〜6 が漏れなく紐付いている
- 4 境界（collision / idempotent / CPU 超過 / dryRun / apply）が AC と紐付いている
- artifacts.json の `phases[6].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 8（DRY 化 / 仕様間整合）
- 引き継ぎ事項:
  - AC-1〜AC-10 の実証手段 / 担当 Phase / evidence パス / PASS 基準
  - Phase 6 異常 Case 1〜6 と AC のカバレッジ対応
  - Phase 4 の 4 境界 × AC 紐付け
  - Phase 10 ゲートで本マトリクスを走査するだけで GO / NO-GO 判定可能な粒度
- ブロック条件:
  - AC-1〜AC-10 が `index.md` と乖離
  - evidence パスが後続 Phase 成果物と矛盾
  - 4 境界 / Case 1〜6 のいずれかが AC と紐付いていない
  - PASS 基準が客観判定不可能（曖昧）

## 注意事項

- 本 Phase は **判定基準の文書化のみ**。実際の PASS 確認は Phase 9 / 10 / 11 / 12 で行う。
- AC-10 の 7 必須成果物存在確認は Phase 12 の責務（本 Phase ではパスと項目を予約するのみ）。
- AC-5 の staging 実測は Phase 11 の責務（本 Phase では計測項目と PASS 基準を予約するのみ）。

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow integration test に接続する。
- D1 物理制約、`schema_aliases` write target、back-fill retry、NON_VISUAL evidence は Phase 4 / Phase 9 / Phase 11 で実測またはテスト証跡へ連結する。
