# Phase 10: 最終レビュー（GO / NO-GO ゲート）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 10 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. Phase 1〜9 の成果物・AC マトリクス・QA 結果を統合レビューする。
2. automation-30 の 3 系統思考法（システム系 / 戦略系 / 問題解決系）で最終エレガンス検証を行う。
3. blocking 事項の有無を確認する。
4. Phase 11（dry-run smoke）/ Phase 12（ドキュメント更新）/ Phase 13（PR 作成）への進行判断を確定する。
5. 残課題（実 production apply の運用実行が下流に存在する旨）を明示する。
6. 4 条件評価を実施し、完了判定を記録する。

## 目的

Phase 11 の手動 smoke（dry-run）実施可否を「GO 判定」として確定するためのゲート。
本 Phase 終了時点では仕様書のみが揃った状態（`spec_created` 維持）であり、PR は作成しない。
production apply の実運用は本タスクの下流（別タスク or 別運用）に存在し、本タスク内では実行しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `phase-01.md` 〜 `phase-09.md`
- `.claude/skills/automation-30/references/elegant-review-prompt.md`
- `.claude/skills/automation-30/references/pattern-catalog.md`
- 上流: `../completed-tasks/ut-07b-schema-alias-hardening/`
- 上流: `../u-fix-cf-acct-01-cloudflare-api-token-scope-audit/`

## 入力

- Phase 7 成果物（AC マトリクス）
- Phase 8 成果物（DRY 判定）
- Phase 9 成果物（QA 結果 / 4 条件評価集約）

## automation-30 3 系統思考法による最終レビュー

### システム系（System Thinking）

- production D1 は単一の状態保有点であり、`migrations apply` は idempotent 設計（D1 が `_cf_KV` テーブルで適用済 migration を管理）に依存する。本 runbook の preflight `migrations list` はこの idempotency を確認する境界制御として機能する。
- 承認ゲート（commit / PR / merge / ユーザー明示承認）を多段に挟むことで、自律エージェントの誤実行を構造的に遮断している。
- 不変条件 #5 はランタイムのデータアクセス境界に対する制約であり、CI / 手動運用上の `scripts/cf.sh d1 migrations apply` は対象外（Phase 1 / Phase 9 で再確認済み）。

### 戦略系（Strategic Thinking）

- 短期戦略（runbook 文書化 + dry-run smoke）と長期戦略（実 production apply は別運用タスクで実施）を分離し、本タスクは「文書品質の verified」までで cut する設計。
- UT-07B 本体（CLOSED）と本タスクの責務境界が「実装期 / 運用期」で明確に分かれ、Phase 8 で参照継承方式が確定。タスク間 drift リスクが小さい。
- Phase 13（PR 作成）はユーザー明示承認後にのみ実行する制約を維持し、自律実行による誤デプロイを防ぐ。

### 問題解決系（Problem Solving）

- 「DB 取り違え」リスクに対し、対象 DB 名 `ubm-hyogo-db-prod` の冒頭明文化 + `--env production` 必須化 + preflight `migrations list` で 3 重の防御が確立されている。
- 「二重適用」リスクに対し、`migrations list` の未適用 / 既適用判定 + ALTER TABLE introspection の 2 段で吸収する設計（Phase 2 / Phase 6）。
- 「UNIQUE index 作成失敗（既存重複）」に対し、即興 SQL での修復を禁止し、判断待ちで停止する運用境界が Phase 6 に明記されている。
- 「evidence への機密混入」に対し、`set -x` 禁止 + grep verification + production 値の非記録規律で多重防御。

## 全 Phase 成果物 review 結果テーブル

| Phase | 成果物 | review 結果 | 根拠 |
| --- | --- | --- | --- |
| Phase 1 | 要件定義（真の論点 / AC-1〜AC-12） | DOC_PASS | runbook 適用境界が定義済み |
| Phase 2 | runbook 構造設計（5 セクション） | DOC_PASS | preflight / apply / post-check / evidence / failure handling 揃い |
| Phase 3 | 設計レビュー（3 案比較） | DOC_PASS | runbook 化案を採用、自動化案を NO-GO |
| Phase 4 | 検証戦略（grep / dry-run / staging 模擬） | DOC_PASS | AC-3〜AC-10 の検証経路が確定 |
| Phase 5 | runbook 本体仕様 | DOC_PASS | UT-07B Phase 5 と責務分離（Phase 8）に整合 |
| Phase 6 | 異常系（4 シナリオ + UT-07B 4 シナリオ継承） | DOC_PASS | 二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 衝突を網羅 |
| Phase 7 | AC マトリクス | DOC_PASS | AC-1〜AC-12 が Phase × 検証 × 成果物にトレース |
| Phase 8 | DRY 化判定 | DOC_PASS | 統合化を不採用、参照継承を採用 |
| Phase 9 | 品質保証 / 4 条件評価 | DOC_PASS | 文書品質 PASS（MINOR 3 件 / MAJOR 0 件）。runtime PASS ではない |
| Phase 10 | 本 Phase | DOC_PASS（本書で確定） | automation-30 3 系統で文書品質に major blocker なし |
| Phase 11 | 手動 smoke 計画 | OPERATOR_GATE_OPEN | ユーザー承認後に dry-run 実施。現時点で runtime PASS は主張しない |
| Phase 12 | ドキュメント更新計画 | PASS_WITH_OPEN_SYNC | Issue #363 再 open 判断と global index/log sync を含む |

## レビュー観点（AC × Phase トレース）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| AC-1（runbook 作成） | DOC_PASS | Phase 5 で `outputs/phase-05/main.md` 作成計画 |
| AC-2（commit/PR/merge + 承認後の境界明記） | DOC_PASS | Phase 5 / index で明記済み |
| AC-3（対象オブジェクト特定） | DOC_PASS | `schema_aliases` / 2 UNIQUE index / `schema_diff_queue` 追加カラム明記 |
| AC-4（preflight 手順） | DOC_PASS | `migrations list` + DB 確認 + introspection の 3 段 |
| AC-5（apply 手順） | DOC_PASS | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` |
| AC-6（post-check 手順） | DOC_PASS | テーブル / index / カラム存在確認 |
| AC-7（evidence 保存項目） | DOC_PASS | コマンド / 出力 / 時刻 / 承認者 / 対象 DB / commit SHA |
| AC-8（failure handling） | DOC_PASS | Phase 6 で 4 + 4 シナリオ網羅 |
| AC-9（本タスク内で production apply 実行しない） | DOC_PASS | index / Phase 5 / Phase 11 で一貫明記 |
| AC-10（post-check smoke の read/dryRun 限定） | DOC_PASS | Phase 11 で dry-run のみ |
| AC-11（skill 検証 4 条件） | DOC_PASS | Phase 9 で判定基準確定。最終 PASS は Phase 12 |
| AC-12（機密情報非含有） | OPERATOR_GATE_OPEN | Phase 11 で grep 検証実施 |

## blocking 事項の有無

| 種別 | 内容 | 判定 |
| --- | --- | --- |
| MAJOR blocker | なし | - |
| MINOR blocker | なし | Phase 9 サマリー記載の MINOR 3 件はいずれも Phase 12 / 下流タスクへ移管可能 |
| 技術的依存切れ | なし | UT-07B（CLOSED）と U-FIX-CF-ACCT-01 の上流が確定 |
| 運用境界違反 | なし | 本タスクは production apply を実行しない |

## MINOR / MAJOR 指摘

| Severity | 内容 | 対応 |
| --- | --- | --- |
| MINOR | GitHub Issue #363 が CLOSED 状態 | Phase 12 で再 open / 新規 Issue 起票判断 |
| MINOR | 共通 SQL スニペット集（collision / introspection）の集約は将来候補 | Phase 12 unassigned-task-detection に記録 |
| MINOR | 実 production apply の運用実行は本タスク外 | 残課題として下流タスク化を Phase 12 で明示 |
| MAJOR | なし | - |

## DOC_PASS / OPERATOR_GATE_OPEN / NO-GO 判定

**OPERATOR_GATE_OPEN**: Phase 11 dry-run smoke は、ユーザー明示承認と operator credential が揃った後に実施可能。ただし以下の制約を厳守する。

- Phase 11 は **dry-run / read-only 検証のみ** とする（production への破壊的変更は禁止）。
- production apply 完了までは `artifacts.json` の `status` を `spec_created` のまま維持する。
- Phase 13（PR 作成）は **ユーザー明示承認後** にのみ実行する。
- 実 production migration apply は本タスク完了後の **別運用タスク** で実施する。

### NO-GO となる条件

以下のいずれかが発生した場合は NO-GO とし、該当 Phase に差戻す。

| 条件 | 差戻し先 |
| --- | --- |
| Phase 5 runbook の preflight / apply / post-check / evidence / failure handling のいずれかが未記載 | Phase 2 / Phase 5 |
| AC-3 の対象オブジェクトに漏れがある | Phase 1 / Phase 5 |
| Phase 6 異常系に二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 衝突のいずれかが欠落 | Phase 6 |
| Phase 8 で UT-07B Phase 5 とのコピペが残っている（責務境界違反） | Phase 5 / Phase 8 |
| Phase 9 の skill 検証 4 条件に FAIL がある | Phase 1 / Phase 5 |
| Phase 11 evidence 計画で Token 値・Account ID 漏えいリスクがある | Phase 9 / Phase 11 |
| 不変条件 #5 の侵害が新たに判明した | Phase 1 |
| 本タスク内で production apply を実行しようとする手順が混入している | Phase 5 / Phase 6 |

## 残課題（下流に存在することの明示）

| 項目 | 担当先 | 補足 |
| --- | --- | --- |
| 実 production migration apply の運用実行 | 別運用タスク（本タスク完了後） | runbook に従って人間が承認・実行する |
| GitHub Issue #363 の再 open / 新規起票判断 | Phase 12 | evidence と判断根拠を記録 |
| 共通 SQL スニペット集の集約 | 将来 unassigned-task | 同種 production runbook が 3 件目到達時に再評価 |
| OIDC 移行による Token 廃止（U-FIX-CF-ACCT-01 ADR 言及） | 別タスク | Token 期限管理の長期戦略 |

## Phase 11 / 12 / 13 への進行判断

| Phase | 判定 | 前提条件 |
| --- | --- | --- |
| Phase 11（dry-run smoke） | OPERATOR_GATE_OPEN | ユーザー明示承認 + read/dryRun のみ。未実施なら runtime PASS を主張しない |
| Phase 12（ドキュメント更新） | PASS_WITH_OPEN_SYNC | workflow-local 成果物は作成済み。global index/log sync は別項目として追跡 |
| Phase 13（PR 作成） | blocked_until_user_approval | ユーザー明示承認後にのみ実行 |

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | DOC_PASS | automation-30 3 系統で文書品質上の衝突なし。AC × Phase × 成果物が整合 |
| 漏れなし | PASS_WITH_OPEN_SYNC | AC-1〜AC-12 / blocking / NO-GO 条件 / 残課題は列挙済み。global index/log sync と operator dry-run は open |
| 整合性 | PASS | UT-07B（CLOSED）/ U-FIX-CF-ACCT-01 / `scripts/cf.sh` 運用ルール / aiworkflow-requirements と整合 |
| 依存関係整合 | PASS | 上流（UT-07B / U-FIX-CF-ACCT-01）/ 下流（実 production apply 別運用タスク）の依存が破綻しない |

## 責任者・承認

| 役割 | 担当 |
| --- | --- |
| Phase 10 ゲート判定 | 仕様書作成エージェント（本タスクスペシフィケーション） |
| Phase 11 実施承認 | ユーザー（明示承認待ち） |
| Phase 13 PR 作成承認 | ユーザー（明示承認待ち） |
| 実 production migration 実行 | ユーザー（Cloudflare 操作権限保有者・別運用タスクで実施） |

## 統合テスト連携

- 本タスクは runbook 文書化と dry-run 検証のみで、アプリケーション統合テストの追加は行わない。
- 代替検証は Phase 4 設計の三段検証を Phase 11 で実施。

## 完了条件

- [ ] 全 Phase（1〜12）の成果物 review が DOC_PASS / OPERATOR_GATE_OPEN で判定されている
- [ ] automation-30 の 3 系統思考法が適用されている
- [ ] blocking 事項が 0 件であることが確認されている
- [ ] MINOR 指摘 3 件が Phase 12 / 下流タスクへの移管経路と紐付いている
- [ ] MAJOR 指摘がない
- [ ] NO-GO 条件が明文化されている
- [ ] 残課題（実 production apply は下流運用）が明示されている
- [ ] Phase 11 / 12 / 13 への進行判断が記録されている
- [ ] 4 条件評価（矛盾なし / 漏れなし / 整合性 / 依存関係整合）が PASS で記録されている
- [ ] `spec_created` 維持・PR 作成禁止が確認されている

## 完了判定

**OPERATOR_GATE_OPEN（Phase 11 dry-run smoke は operator 実施待ち・実 production apply は本タスク外）**。

- Phase 11 はユーザー明示承認後に dry-run のみ実施。
- Phase 13 はユーザー明示承認後にのみ実行。
- 本タスク完了基準は「runbook 文書の verified 達成」までとし、実 production apply は別運用タスクとして残す。

## 苦戦想定

**1. OPERATOR_GATE_OPEN の解釈ぶれ**

Phase 11 完了までは PR を作成しないことを強調しないと、自律ワークフローが Phase 13 へ進んでしまう。本 Phase で「Phase 13 はユーザー明示承認後」を 2 度明記している。

**2. NO-GO 差戻し時の責務境界**

Phase 6 異常系シナリオが不足した場合、UT-07B Phase 5 の rollback-runbook 継承で吸収するか、本タスク Phase 6 を追補するかの判断が必要。本仕様では「production 固有シナリオは Phase 6 追補、共通シナリオは UT-07B 継承」を原則とする。

**3. Issue #363 CLOSED 状態の扱い**

Phase 12 で再 open / 新規 Issue 起票判断が残るため、Phase 10 段階では「判断保留・Phase 12 で確定」のステータスとする。

**4. 「本タスクで production apply を実行しない」境界の周知**

自律エージェント実行時、Phase 11 dry-run と実 apply の境界が曖昧になりやすい。NO-GO 条件に「production apply 実行手順の混入」を明記し、構造的に防御する。

## 関連リンク

- 上位 index: `./index.md`
- AC マトリクス: `./phase-07.md`
- DRY 判定: `./phase-08.md`
- 品質保証: `./phase-09.md`
- 手動 smoke: `./phase-11.md`
- ドキュメント更新: `./phase-12.md`
- PR 作成: `./phase-13.md`

## 成果物

- `outputs/phase-10/main.md`
