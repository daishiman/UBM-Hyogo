# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | Schema alias back-fill queue/cron split (UT-07B-FU-01) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-05-05 |
| 前 Phase | 6（異常系） |
| 次 Phase | 8（DRY 化 / 仕様間整合） |
| 状態 | spec_created |
| タスク分類 | implementation（acceptance-traceability） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |

## 目的

`index.md` で定義された AC-1〜AC-11 を、**実証手段 × 担当 Phase × evidence パス × PASS 基準** の 4 軸で表に落とし、トレーサビリティを担保する。本タスクは条件付き implementation のため、文書レビュー / grep / 文書存在確認 / unit-route-workflow-repository テスト実行結果 / staging 大規模実測 evidence（before / after）の 5 種を実証手段として用いる。本 Phase は AC が「全 PASS で根拠付き」（AC-10）であることを最終的に裏付ける入力を作る。

## 完了条件チェックリスト

- [ ] AC-1〜AC-11 の全 11 項目が表に揃っている（index.md と完全一致）
- [ ] 各 AC に「実証手段」が 1 つ以上紐付いている（テスト実行 / 文書レビュー / grep / staging 計測 / 文書存在確認）
- [ ] 各 AC に「担当 Phase」「evidence パス」が記載されている
- [ ] 各 AC の PASS 基準が客観的に判定可能な形で記述されている
- [ ] AC-10（4 条件評価）と AC-11（Phase 12 の 7 必須成果物 + aiworkflow-requirements 同期）の特殊性が補足されている
- [ ] 異常系カバレッジ補助列（Phase 6 Case 1〜7 との連動）が記述されている
- [ ] 5 境界（duplicate enqueue / partial failure / batch idempotent / contract 移行 / before-after）が AC と紐付いている
- [ ] 着手 gate（AC-1）特殊性の補足記述がある
- [ ] 4 条件評価が PASS 判定で根拠付き

## AC マトリクス

| AC | 内容（要約） | 実証手段 | 担当 Phase | evidence パス | PASS 基準 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | staging 10K+ rows fixture と既存 API（dryRun/apply/retry）の before evidence が Phase 11 に保存され、着手 gate（持続再現 / 収束）が判定されている | staging 計測（T-S-01 before） | Phase 11 | `outputs/phase-11/manual-evidence.md` § T-S-01, `outputs/phase-11/before-evidence.md` | 10K rows fixture 投入 + 旧同期 apply で `backfill_cpu_budget_exhausted` 発生回数 / retry 回数 / 完了時間が表に記録 + 着手 gate（持続再現 = 実装続行 / 収束 = close）が判定済み |
| AC-2 | 着手 gate 成立時、Cloudflare Queue または Cron Trigger のいずれを採用するかの設計判断が Phase 2 で根拠付き決定されている | 文書レビュー（Phase 2 trade-off 表） | Phase 2 | `outputs/phase-02/queue-vs-cron-decision.md` | trade-off 表に評価軸（応答時間 / 実装コスト / Workers Paid 要否 / 運用性）が並び、選択結果と根拠が明示 |
| AC-3 | 着手 gate 成立時、alias 確定と back-fill 継続の状態が API request 内 / queue/cron consumer 内に責務分離されている | (a) Phase 5 §2 関数シグネチャレビュー (b) workflow integration test の status 遷移 assert | Phase 5, Phase 4, Phase 9 | `outputs/phase-05/implementation-spec.md` § 2, `outputs/phase-04/test-strategy.md` § T-W-01〜03, Phase 9 test 実行 log | Stage 1（alias 確定）と Stage 2（enqueue → batch consume）が別関数 / 別 transaction / 別 module で実装され、T-W-01 で alias 確定 + queue message 1 件の状態遷移が assert される |
| AC-4 | 着手 gate 成立時、API response が `confirmed: true` と `backfill.status: pending\|running\|exhausted\|completed` を区別して返す契約に統一されている | (a) Phase 5 §6 contract 移行レビュー (b) route test 5 ケース全境界の HTTP / body assert (c) `aiworkflow-requirements/references/api-endpoints.md` への差分反映 | Phase 5, Phase 4, Phase 9, Phase 12 | `outputs/phase-05/api-contract-update.md`, `outputs/phase-04/test-strategy.md` § T-R-02〜05 / T-R-08 / T-R-09 / T-W-09, Phase 9 route test 実行 log, Phase 12 で `api-endpoints.md` 差分 commit | 新 contract（200 + `confirmed:true, backfill.status`）が正本化、旧 202 撤廃、T-R-02〜05/08/09 全 PASS、`api-endpoints.md` に新形式が記述 |
| AC-5 | 着手 gate 成立時、batch 処理が remaining-scan model + idempotent update で実装され、duplicate enqueue / duplicate processing / partial failure recovery が test で固定されている | unit / repository / workflow integration test 実行 | Phase 4, Phase 5, Phase 9 | `outputs/phase-05/implementation-spec.md` § 2 (`processBackfillBatch`), `outputs/phase-04/test-strategy.md` § T-U-03〜05 / T-Q-01〜05 / T-W-04〜06, Phase 9 test 実行 log | T-Q-01 で dedupe_key UNIQUE 制約 PASS、T-W-06 で at-least-once 再配送下の idempotent UPDATE PASS、T-W-04 で partial failure 時の `retry_count++` + 次 batch 持ち越し PASS |
| AC-6 | 着手 gate 成立時、Cloudflare binding（Queue / Cron / KV など必要なもの）が `wrangler.toml`、CI variables、runbook で staging / production 一致している | grep ベース機械検査（`wrangler.toml` の base / staging / production セクション間で binding 名 / queue 名 / cron が一致）+ 文書レビュー | Phase 5, Phase 9 | `outputs/phase-05/implementation-spec.md` § 5, Phase 9 grep 結果 log, `apps/api/wrangler.toml` | base / `[env.staging]` / `[env.production]` の 3 箇所すべてに同一 queue 名 / binding 名 / cron が出現 + CI Variables / runbook で衝突なし |
| AC-7 | route / workflow / repository tests が PASS し、idempotent retry / duplicate enqueue 抑止 / partial failure recovery / batch size boundary を網羅している | テスト実行 log（vitest）+ Phase 4 テストケース ID 一覧との突合 | Phase 4, Phase 9 | `outputs/phase-04/test-strategy.md` § T-U/T-R/T-W/T-Q ID 一覧, Phase 9 test 実行 log | T-U-* + T-R-* + T-W-* + T-Q-* 全件 PASS + 4 境界（duplicate / partial failure / idempotent / boundary）が ID と紐付く |
| AC-8 | 着手 gate 成立時、staging 10,000+ rows after evidence で CPU budget exhaustion が運用上収束することが確認されている | staging 計測（T-S-02 / T-S-03 after） | Phase 11 | `outputs/phase-11/manual-evidence.md` § T-S-02, T-S-03, `outputs/phase-11/after-evidence.md` | 10K / 50K rows fixture で apply 応答時間 < 5s + queue/cron 経由で `backfill.status:'completed'` に収束 + before/after 比較で `backfill_cpu_budget_exhausted` 再発回数が 0 |
| AC-9 | 不変条件 #5（D1 直接アクセスは apps/api 限定）違反ゼロ。queue consumer / cron handler すべて `apps/api/**` 配下に閉じる | grep ベース機械検査（`apps/web/**` から D1 / Queue binding 参照が無いこと）+ 文書レビュー | Phase 5, Phase 9, Phase 10 | Phase 9 grep 結果 log, Phase 10 go-no-go.md, `apps/api/src/workflows/schemaAliasBackfill*.ts` | `git grep -nE "DB|SCHEMA_BACKFILL_QUEUE" apps/web/src` で 0 件 + 全 queue consumer / cron handler が `apps/api/src/workflows/` 配下 |
| AC-10 | 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き | 4 条件再判定（Phase 1 / 3 / 10 横断） | Phase 1, Phase 3, Phase 10 | `outputs/phase-01/main.md` § 4 条件評価, `outputs/phase-03/main.md` § 4 条件再評価, `outputs/phase-10/go-no-go.md` | 4 条件すべてに 1 つ以上の具体根拠（成果物パス + 該当章）が紐付き、PASS 判定が 3 Phase で一貫 |
| AC-11 | Phase 12 で 7 必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main）と aiworkflow-requirements（api-endpoints / database-schema / task-workflow-active / indexes）が同期されている | 文書存在確認 + 章立て確認 + indexes rebuild 検証 | Phase 12 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`, `.claude/skills/aiworkflow-requirements/references/{api-endpoints.md,database-schema.md,task-workflow-active.md}`, `.claude/skills/aiworkflow-requirements/indexes/*` | 7 ファイル + 3 references がすべて存在 + サイズ > 0 + 各規定章立てを満たす + `pnpm indexes:rebuild` で drift 0 |

## 異常系カバレッジ補助列（Phase 6 連動）

各 AC が Phase 6 のどの異常 Case を予防するかの補助マッピング:

| AC | 予防する Case | 連動メカニズム |
| --- | --- | --- |
| AC-1 | Case 7（batch boundary） | before evidence が初期値の妥当性検証の起点 |
| AC-2 | （直接の予防対象なし。設計選択の根拠化） | Queue vs Cron trade-off で運用負荷を評価 |
| AC-3 | Case 6（enqueue 失敗 compensation） | Stage 分離で compensation 経路を契約化 |
| AC-4 | Case 5（max retry exceeded） | internal failure is not exposed as a new public status; public contract remains `backfill.status:'exhausted'` with retry metadata |
| AC-5 | Case 1（duplicate enqueue）/ Case 2（partial failure）/ Case 3（consumer crash） | dedupe_key UNIQUE + remaining-scan + retry_count |
| AC-6 | （構造的予防：binding drift） | wrangler.toml の 3 箇所同期 |
| AC-7 | Case 1〜6（実装層全般） | テストケースが各 Case の予防策と紐付く |
| AC-8 | Case 7（batch boundary tuning） | after evidence でチューニング後の値が SLO 内 |
| AC-9 | （構造的予防：境界違反による下流事故防止） | apps/api 内完結の grep 検証 |

## 実証手段の凡例

| 凡例 | 意味 |
| --- | --- |
| 文書レビュー | 該当成果物を Read し、章立て・必須項目の存在を目視確認 |
| 文書存在確認 | ファイルパスの存在 + サイズ > 0 + 規定の見出し存在を確認 |
| grep | `git grep` / Phase 4 grep 計画パターンを適用し、ヒット件数 / 値集合を機械的に確認 |
| テスト実行 | `mise exec -- pnpm --filter @ubm-hyogo/api test`（vitest）で T-U / T-R / T-W / T-Q が全件 PASS することを log で確認 |
| staging 計測 | `scripts/cf.sh` 経由で staging に curl + Workers Logs / Queue dashboard 収集、応答時間 / batch 数 / CPU 時間 / retry 回数 / queue lag を表化 |
| 4 条件再判定 | 価値性 / 実現性 / 整合性 / 運用性 のチェック観点を成果物に対し再走査し PASS 判定 |
| indexes rebuild 検証 | `mise exec -- pnpm indexes:rebuild` 実行後 `git diff` が空 |

## 5 境界の AC 紐付け（Phase 4 連動）

Phase 4 で確定した 5 境界（duplicate enqueue / batch idempotent / partial failure / contract 移行 / before-after）は本 AC マトリクスの以下と対応する:

| 境界 | 対応 AC | 主たるテストケース ID |
| --- | --- | --- |
| duplicate enqueue | AC-5, AC-7 | T-U-01, T-W-05, T-Q-01 |
| batch idempotent | AC-5, AC-7 | T-U-03〜05, T-W-06, T-Q-03 |
| partial failure | AC-5, AC-7 | T-W-04, T-Q-05 |
| contract 移行（旧→新） | AC-4, AC-7 | T-R-02〜05, T-R-08, T-R-09, T-W-09 |
| before-after evidence | AC-1, AC-8 | T-S-01（before）, T-S-02 / T-S-03（after） |

## 着手 gate（AC-1）特殊性の補足

AC-1 は他の AC と異なり「実装着手の可否を決定する gate」であり、以下の二択で取り扱いが分岐する:

| gate 判定 | 後続 AC の扱い |
| --- | --- |
| 持続再現 → 実装続行 | AC-2〜AC-11 をすべて PASS で満たす必要あり |
| 収束 → close as not-needed | AC-2 のみ後続評価対象（設計判断は記録）/ AC-3〜AC-9 はスコープ外（仕様書 spec_created のまま据え置き）/ AC-10 は 4 条件評価で「実装不要」を PASS 判定 / AC-11 は Phase 12 の 1 必須成果物（unassigned-task-detection.md）への記録のみ必要 |

## AC-10 / AC-11 特殊性の補足

- **AC-10（4 条件評価）**: 価値性 / 実現性 / 整合性 / 運用性 を Phase 1（初期）/ Phase 3（設計レビュー後）/ Phase 10（最終ゲート）の 3 時点で再判定し、すべて PASS の場合のみ AC-10 を PASS とする。着手 gate 不成立時は「実装不要」が運用性 PASS の根拠となる。
- **AC-11（Phase 12 必須成果物 + aiworkflow-requirements 同期）**: 7 必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main）に加え、`aiworkflow-requirements` の 3 references（api-endpoints / database-schema / task-workflow-active）と indexes（`pnpm indexes:rebuild` で drift 0）の同期を必須とする。

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | AC-1〜AC-11 すべてに evidence パスと PASS 基準が紐付き、Phase 10 ゲートで本マトリクス走査だけで GO/NO-GO 判定が可能 |
| 実現性 | PASS | 実証手段が `mise exec -- pnpm` / `scripts/cf.sh` / `git grep` の 3 経路で完結し、ローカル + staging の既存環境で実行可能 |
| 整合性 | PASS | index.md AC-1〜AC-11 と本マトリクスの行が完全一致。Phase 4 / 5 / 6 で予約した evidence パスと整合 |
| 運用性 | PASS | 着手 gate 不成立時の close 判定パスも明示され、Phase 11 / 12 で「実装不要」を文書化する経路が確保 |

## 受入条件（AC）

本 Phase は **AC-10（4 条件評価）/ AC-11（Phase 12 必須成果物）** のトレーサビリティを最終固定する責務を担う。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/index.md` § 受入条件 | AC-1〜AC-11 の正本 |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-02.md` | AC-2 の根拠 |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-04.md` | AC-7 / 5 境界 / テストケース ID |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-05.md` | AC-3 / AC-4 / AC-5 / AC-6 / AC-9 の根拠 |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-06.md` | AC 補助カバレッジ |
| 参考 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-07.md` | 親タスク AC マトリクス（テンプレ） |
| 参考 | `outputs/phase-11/manual-evidence.md`（Phase 11 で予約） | AC-1, AC-8, Case 1〜7 evidence |

## 苦戦箇所【記入必須】

- AC-1（着手 gate）と他 AC の依存関係をどう表現するかで悩んだが、「着手 gate 特殊性の補足」セクションで二択分岐を明示する形に統一した。これにより gate 不成立時に他 AC を「実装不要」で PASS 判定する経路が形式化される。
- AC-11 の aiworkflow-requirements 同期は `pnpm indexes:rebuild` の drift 検証が CI gate（`verify-indexes.yml`）で機械検査される。本 Phase ではマトリクスに「indexes rebuild 検証」凡例を追加するに留め、実検証は Phase 12 で行う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC-1〜11 × 実証手段 × 担当 Phase × evidence パス × PASS 基準 + 異常系カバレッジ補助 + 5 境界紐付け + 着手 gate 特殊性 + AC-10 / AC-11 補足 |
| メタ | artifacts.json | Phase 7 状態の更新 |

## 実行タスク

1. AC-1〜AC-11 の 11 行を表に展開し、実証手段 / 担当 Phase / evidence パス / PASS 基準を埋める。
2. 異常系カバレッジ補助列（Phase 6 Case 1〜7 との対応）を追加する。
3. 5 境界（Phase 4 連動）の AC 紐付け表を追加する。
4. AC-1（着手 gate）特殊性の二択分岐補足を追加する。
5. AC-10（4 条件評価）と AC-11（7 必須成果物 + aiworkflow-requirements 同期）の特殊性を補足する。
6. 4 条件評価を独立節として記述する。
7. 成果物 `outputs/phase-07/ac-matrix.md` の章立てを確定する。

## 多角的チェック観点

- **AC 一致**: AC-1〜AC-11 が `index.md` § 受入条件 と完全一致しているか（文言・順序）。
- **evidence パス予約**: 各 AC の evidence パスが後続 Phase（特に Phase 9 / 11 / 12）の成果物パスと整合しているか。
- **実証手段の客観性**: 各 AC が「読めば PASS / NOT PASS が一意に判定できる」基準で記述されているか。
- **5 境界 × AC 連結**: Phase 4 の 5 境界が 1 つ以上の AC と紐付いているか（漏れ検出）。
- **異常系連結**: Phase 6 Case 1〜7 が 1 つ以上の AC と紐付いているか（予防対応の網羅）。
- **不変条件 #5**: AC-9 の grep 検査が機械的に実行可能な粒度で記述されているか。
- **着手 gate 二択**: AC-1 不成立時の close 経路（後続 AC のスコープ外化）が明示されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-11 表展開 | 7 | pending | index.md と完全一致 |
| 2 | evidence パス予約 | 7 | pending | Phase 9 / 11 / 12 の成果物パス整合 |
| 3 | 異常系カバレッジ補助列 | 7 | pending | Phase 6 Case 1〜7 連動 |
| 4 | 5 境界 × AC 紐付け表 | 7 | pending | Phase 4 連動 |
| 5 | 着手 gate 特殊性補足 | 7 | pending | AC-1 二択分岐 |
| 6 | AC-10 / AC-11 特殊性補足 | 7 | pending | 4 条件 / 7 成果物 + aiworkflow 同期 |
| 7 | 4 条件評価独立節 | 7 | pending | 価値性 / 実現性 / 整合性 / 運用性 |
| 8 | 成果物 ac-matrix.md の章立て確定 | 7 | pending | Phase 10 ゲートの走査リスト |

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created` へ遷移
- AC-1〜AC-11 全 11 行が実証手段 / 担当 Phase / evidence / PASS 基準で揃っている
- 異常系カバレッジ補助列に Case 1〜7 が漏れなく紐付いている
- 5 境界（duplicate / idempotent / partial failure / contract 移行 / before-after）が AC と紐付いている
- 着手 gate 不成立時の close 経路が明示
- artifacts.json の `phases[6].status` が `spec_created`

## 注意事項

- 本 Phase は **判定基準の文書化のみ**。実際の PASS 確認は Phase 9 / 10 / 11 / 12 で行う。
- AC-1 の着手 gate 判定 + AC-8 の after evidence は Phase 11 の責務（本 Phase ではパスと項目を予約するのみ）。
- AC-11 の 7 必須成果物存在確認は Phase 12 の責務（本 Phase ではパスと項目を予約するのみ）。

## 次 Phase への引き渡し

- 次 Phase: 8（DRY 化 / 仕様間整合）
- 引き継ぎ事項:
  - AC-1〜AC-11 の実証手段 / 担当 Phase / evidence パス / PASS 基準
  - Phase 6 異常 Case 1〜7 と AC のカバレッジ対応
  - Phase 4 の 5 境界 × AC 紐付け
  - 着手 gate 不成立時の close 経路
  - Phase 10 ゲートで本マトリクスを走査するだけで GO / NO-GO 判定可能な粒度
- ブロック条件:
  - AC-1〜AC-11 が `index.md` と乖離
  - evidence パスが後続 Phase 成果物と矛盾
  - 5 境界 / Case 1〜7 のいずれかが AC と紐付いていない
  - PASS 基準が客観判定不可能（曖昧）
  - 着手 gate 二択の close 経路が欠落

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow / repository test に接続する。
- queue producer / consumer / cron handler / dedupe_key / remaining-scan / DLQ / response contract / before-after evidence / aiworkflow-requirements 同期は Phase 4 / 5 / 6 / 9 / 11 / 12 で実測またはテスト証跡へ連結する。
