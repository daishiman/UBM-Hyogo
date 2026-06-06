# Phase 10: 最終レビュー — issue-1081-bulk-tag-real-d1-runtime-smoke

## 目的

acceptance criteria の最終判定・blocker 判定・DoD チェック・Phase 12 へ引き継ぐ MINOR を確定する。
本サイクルは**local 実装完了（implemented_local_evidence_captured）**であり、staging 実走・commit/push/PR は user-gated。

## DoD チェックリスト（成果物・gate）

| 項目 | 状態 | 根拠 |
| ---- | ---- | ---- |
| 成果物 5 点の実装手順を仕様化 | [x] | Phase 5（runner / seed SQL / cleanup SQL / CI job / local test の骨格） |
| seed/cleanup SQL を実 schema で記述（推測なし） | [x] | `member_identities` / `member_responses` / `member_status` / `tag_definitions` / `member_tags` / `audit_log` を migrations から確認 |
| local test PASS（設計上） | [x]（実行は実装 wave） | Phase 6 TC/FP/G + Phase 9 検証コマンド |
| actionlint PASS（設計上） | [x]（実行は実装 wave） | Phase 9（`runtime-smoke-staging.yml`） |
| production guard 動作 | [x] | `assert_staging_guard`（AC-6・FP-2/3/4） |
| redaction 動作 | [x] | redact.sh 再利用 + grep gate（AC-5・G-2） |
| cleanup always | [x] | runner trap（AC-4） |
| runtime evidence（実 D1 実走） | pending（Gate-B / user-gated） | Phase 11 ledger・AC-1〜AC-5 の実走部分 |
| commit / push / PR | pending（Gate-C / user-gated） | Phase 13 |
| issue #1081 状態 | CLOSED 維持（変更しない） | — |

## AC 判定（3-state verdict）

| AC | 内容 | 判定 |
| -- | ---- | ---- |
| AC-1 | assign → 全 assigned | spec 完備（local: TC-1/6/7。real: Gate-B） |
| AC-2 | retry → 全 noop ＋ audit count 不変 | spec 完備（local: TC-2/3。real: Gate-B） |
| AC-3 | unassign → 全 unassigned ＋ audit parity | spec 完備（local: TC-4/5。real: Gate-B） |
| AC-4 | cleanup が `e2e_test_issue1081_%` 限定・残件 0 | spec 完備（local: TC-8/9 + seed-syntax。real: Gate-B） |
| AC-5 | command log（endpoint / redaction / summary / audit query） | spec 完備（local: G-2。real: Gate-B artifact） |
| AC-6 | production 誤実行 guard（exit 2） | spec 完備（local 完結: FP-2/3/4・G-5） |
| AC-7 | local test PASS | spec 完備（Phase 6/9） |

> 全 AC は仕様として設計確定。real D1 実走部分のみ Gate-B（user-gated）で最終確認する。

## blocker 判定

| 項目 | blocker か | 備考 |
| ---- | ---------- | ---- |
| endpoint 実装 | NO | issue-1036 で landed 済（変更しない） |
| staging secret 整備 | NO（fail-closed） | 未整備時は実 D1 mutation smoke 未実行を成功扱いしない（FP-9） |
| 実 D1 への seed/mutation/cleanup | NO（Gate-B user-gated） | 副作用ゆえの実行タイミング分離。先送り＝別 Issue 化ではない |
| commit/push/PR | YES（user-gated） | Phase 13（Gate-C） |

## Phase 12 へ引き継ぐ MINOR（検出一覧）

| ID | 内容 | 区分 | 引き継ぎ先 |
| -- | ---- | ---- | ---------- |
| M-1 | smoke runner 共通 lib（`scripts/smoke/lib/smoke-common.sh`）抽出は 3 本目の runner 増加時点で実施（YAGNI 先送り） | refactoring/将来候補 | Phase 12 detection（baseline 候補） |
| M-2 | bulk tag smoke を production runtime smoke へ拡張する（現状 staging 固定）。production への bulk mutation は allowlist subject + 専用 test fixture 設計が別途必要 | improvement/将来候補 | Phase 12 detection |
| M-3 | `audit_log` に correlation_id 列が無いため batchId は after_json/before_json の `json_extract` 経由でしか相関できない。bulk 相関 query の index 最適化は親 issue-1036 の軽量方針に従い別関心 | improvement/将来候補 | Phase 12 detection |

> M-1/M-2/M-3 は本タスク AC 射程外。Phase 12 の unassigned-task-detection で 2 回検証一致を取り、必要なら Issue 化（user-gated）。

## 最終判定

**implemented_local_evidence_captured として完成**。runner / seed・cleanup SQL / CI job / local test を実装し、local evidence を取得した。
コード実装の実行・staging 実走（Gate-B）・commit/push/PR（Gate-C）は user-gated。Gate-A passed / Gate-B,C pending。

## 4 条件最終評価

| 条件 | 判定 | 根拠 |
| ---- | ---- | ---- |
| 価値性 | PASS | bulk tag mutation の real D1 回帰 gate を自動化し、deploy 毎に contract 崩れを検知 |
| 実現性 | PASS | 既存 cf.sh / redact.sh / attendance runner / seed-399 パターンの再利用で実装可能 |
| 整合性 | PASS | 実 contract（results[].status / audit parity）と実 schema に整合。不変条件 I-1〜I-6 遵守 |
| 運用性 | PASS | secret 不足 fail-closed / cleanup always / redaction grep gate / artifact upload で CI 運用に耐える |
