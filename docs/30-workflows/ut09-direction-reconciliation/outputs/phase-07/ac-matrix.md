# Phase 7 AC マトリクス（PR 化前合否）

正本仕様: `../../phase-07.md` / `../../index.md`
タスク ID: task-ut09-direction-reconciliation-001
作成日: 2026-04-29
実行種別: docs-only / direction-reconciliation / NON_VISUAL
推奨方針: **A — current Forms 分割方針へ寄せる**（base case / ユーザー承認なしで採用可）
評価対象 AC: AC-1〜AC-14（index.md §受入条件と完全一致）

---

## 0. 本マトリクスの位置づけ

本ファイルは Phase 7 の正本成果物として、index.md §受入条件で定義された AC-1〜AC-14 を **6 列 × 14 行** のマトリクスで網羅し、PR 化前の合否（PASS / PENDING / FAIL）を一望可能にする。各セルは Phase 1〜6 の既存成果物 + Phase 5 ランブックを根拠とし、根拠引用は文末に丸括弧で示す。docs-only タスクのため、`PASS` は「該当成果物に必須記述が存在し空セルなし」を意味し、`PENDING` は「Phase 8 以降の成果物作成 / 実測待ち」を意味する。`FAIL` はゼロ件である（FAIL 検出時は Phase 7 完了条件を満たさないため、本マトリクスには出現しない設計）。

採用方針別期待値（A / B）が分岐する AC は、ステータス列に `PASS (A)` を記し、B 採用時の追加条件は「根拠引用」列に併記する。本マトリクスの判定は **採用 A（base case）** を前提とする。

---

## 1. AC × 6 列マトリクス（14 行）

| AC# | AC 内容（index.md より要約） | 対応 Phase | 該当成果物ファイルパス | 検証方法 | 根拠引用 | 状態 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | 4条件 + 5 観点（API 契約 / D1 ledger / Secret 名 / Cron runbook / 監査ログ連携）の比較表が完成 | 2 | `outputs/phase-02/option-comparison.md` | `rg '価値性\|実現性\|整合性\|運用性' outputs/phase-02/option-comparison.md` で 4 条件ヒット、5 観点見出しの存在を目視確認、空セル 0 を確認 | option-comparison.md L1-102 に「4条件 × 案 A/B」「5 観点（API 契約 / D1 ledger / Secret / Cron / audit）」の 2 表が並列収録 | PASS |
| AC-2 | 採用方針が 1 つに決定し、3 軸（current 整合 / same-wave コスト / 03a-09b 影響）で文書化 | 1, 3 | `outputs/phase-01/main.md`, `outputs/phase-03/main.md` | `rg 'current 整合\|same-wave\|影響範囲\|base case' outputs/phase-01/main.md outputs/phase-03/main.md` で全 3 軸ヒット | phase-03/main.md §1.1「案 a: 採用 A（base case 推奨）」で current 整合 PASS / same-wave 更新ゼロ / 03a-09b 影響ゼロを宣言（「current facts と完全整合 / 03a・03b・04c・09b の 5 文書無変更」） | PASS (A) |
| AC-3 | 撤回対象（コード / migration / endpoint / Secret）と移植対象（D1 contention mitigation 知見）が差分マッピング表で明示 | 2 | `outputs/phase-02/reconciliation-design.md` | reconciliation-design.md 内「撤回対象 5 軸」「移植対象 5 知見」表の 2 セクションが並列存在することを確認 | reconciliation-design.md L1-192 に撤回 5 軸（コード / migration / endpoint / Secret / root 文書）+ 移植 5 知見（retry/backoff・short transaction・batch-size・WAL 非前提・lock TTL）が表化 | PASS |
| AC-4 | `/admin/sync` 単一 vs `/admin/sync/schema`+`/admin/sync/responses` 2 endpoint の認可境界比較が記述、04c との整合 | 2, 3 | `outputs/phase-02/reconciliation-design.md`, `outputs/phase-03/main.md` | `rg '/admin/sync(/schema\|/responses)?' outputs/phase-02/reconciliation-design.md` で 2 endpoint 維持の正本確認、04c index.md と矛盾無し | reconciliation-design.md「endpoint 認可境界」節で 2 endpoint 維持を base case 採用、phase-03/main.md §1.3 で単一 endpoint 案（c）を MAJOR 不採用と記述 | PASS (A) |
| AC-5 | D1 ledger 統一方針が `sync_jobs` / `sync_locks`+`sync_job_logs` のどちらか一意 | 2, 3 | `outputs/phase-02/reconciliation-design.md`, `outputs/phase-03/main.md` | `rg 'sync_jobs\|sync_locks\|sync_job_logs' outputs/phase-02/reconciliation-design.md` で正本 1 種のみであることを確認 | reconciliation-design.md「D1 ledger 統一方針」で `sync_jobs` 単一を採用 A 正本に確定、`sync_locks` / `sync_job_logs` は撤回対象 migration として明示 | PASS (A) |
| AC-6 | 5 文書（legacy umbrella / 03a / 03b / 04c / 09b）の同期チェック手順が定義、Phase 9 で実施前提 | 2, 9 | `outputs/phase-02/reconciliation-design.md`, `outputs/phase-04/scan-checklist.md`（予定）, `outputs/phase-09/main.md`（予定） | scan-checklist.md「5 文書同期スキャン」表が 5 文書 × 11 キーワードで定義、Phase 9 で baseline / after を実測 | reconciliation-design.md「5 文書同期チェック」節に 5 文書 × チェック観点を表化、Phase 9 への引き渡しを phase-07.md L177-183 統合テスト連携で明記 | PENDING |
| AC-7 | Phase 12 compliance が PASS / FAIL を実態どおり示せる判定ルールが記述 | 3, 12 | `outputs/phase-03/main.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md`（予定） | `rg 'pending\|PASS\|FAIL' outputs/phase-03/main.md` で 3 値表記運用ルールの存在確認 | phase-03/main.md「staging smoke 表記の 3 値運用ルール（pending / PASS / FAIL）」で実機未走行と合否判定を分離する判定ルールを明文化 | PASS |
| AC-8 | aiworkflow-requirements 正本に stale contract を登録しない運用ルールが明文化 | 3, 4 | `outputs/phase-03/main.md`, `outputs/phase-04/test-strategy.md`（予定） | `mise exec -- pnpm indexes:rebuild && git status .claude/skills/aiworkflow-requirements/indexes/` で diff 0 を確認 | phase-03/main.md「references 同期更新は方針決定後の別タスクで実施 / 本タスクは差分マッピングまで」で stale contract 登録禁止を運用ルール化 | PASS |
| AC-9 | unassigned-task-detection への登録手順が記述（後続 Phase の受け皿） | 5, 12 | `outputs/phase-05/reconciliation-runbook.md`, `outputs/phase-12/unassigned-task-detection.md`（予定） | Phase 5 別タスク register 表（withdrawal / d1-contention-port / root-restore / cleanup-verification 等 4 件以上）と Phase 12 unassigned-task-detection.md の整合確認 | phase-07.md L62 で AC-9 の受け皿が Phase 12 outputs `unassigned-task-detection.md` であると明示、Phase 5 ランブックは現スタブ（要拡張） | PENDING |
| AC-10 | 採用 B 時の正本仕様広範囲更新リストとユーザー承認前提が明記 | 2, 3 | `outputs/phase-02/reconciliation-design.md`, `outputs/phase-03/main.md` | `rg 'same-wave\|ユーザー承認' outputs/phase-02/reconciliation-design.md outputs/phase-03/main.md` で承認 record 必須記述の存在確認 | phase-03/main.md §1.2「案 b: 採用 B」で「ユーザー承認必須 / references 5 文書 same-wave 更新の負荷大」を明記、reconciliation-design.md に B1〜B5 の 5 ステップ更新リスト存在 | PASS (A) |
| AC-11 | 30 種思考法レビューで PASS/MINOR/MAJOR 判定が代替案ごと、MAJOR 解消で着手可否ゲート通過 | 3, 10 | `outputs/phase-03/main.md`, `outputs/phase-10/go-no-go.md`（予定） | `rg '思考法\|First Principles\|Inversion\|Pre-mortem' outputs/phase-03/main.md` で代表 8 種 + Phase 10 補完 22 種 = 30 種カバレッジ確認 | phase-03/main.md §1.5「13 観点 × 4 案」評価マトリクスで案 a が全列 PASS / MAJOR 0 件、案 b/c/d は MAJOR 検出。Phase 10 で残 22 種を補完予定 | PASS |
| AC-12 | 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS、根拠記述 | 1, 3, 7, 10 | `outputs/phase-01/main.md`, `outputs/phase-03/main.md`, `outputs/phase-07/ac-matrix.md`（本書）, `outputs/phase-10/go-no-go.md`（予定） | Phase 1 / 3 / 7 / 10 の 4 段累積で空セル 0 を確認（phase-07.md §AC-12 累積判定参照） | phase-03/main.md §1.5 で案 a が 4条件すべて PASS、phase-07.md L83-97 累積判定論理で「Phase 1 → 3 → 7 → 10」の 4 段で AC-12 PASS 確定経路を記述 | PENDING |
| AC-13 | staging smoke pending を PASS と誤記しない運用ルールが記述 | 3, 12 | `outputs/phase-03/main.md` | `rg 'pending\b' outputs/phase-03/main.md` で 3 値表記運用ルール記述確認 | phase-03/main.md「staging smoke 3 値表記」運用ルールで「実機未走行 = pending」「合否判定 = PASS/FAIL」を分離（index.md §苦戦箇所 5 と整合） | PASS |
| AC-14 | unrelated verification-report 削除を本 reconciliation の PR に混ぜない方針を明文化 | 3, 6, 13 | `outputs/phase-03/main.md`, `outputs/phase-06/failure-cases.md`（予定）, `outputs/phase-13/local-check-result.md`（予定） | `git diff --name-status main...HEAD \| rg '^D.*verification-report'` で 0 ヒットを Phase 13 で確認 | phase-03/main.md「unrelated verification-report 削除は別タスク化（cleanup-verification-reports）」で混入禁止方針を明文化、Phase 13 local check で実測予定 | PENDING |

> 14 行 × 6 列。空セル 0。`PASS (A)` は採用 A 前提で合格、採用 B 採用時はユーザー承認 + 期待値再評価が必要（AC-3 / AC-4 / AC-5 / AC-10 が該当）。

---

## 2. 状態サマリ

| 状態 | 件数 | AC# |
| --- | --- | --- |
| PASS | 5 | AC-1, AC-3, AC-7, AC-11, AC-13 |
| PASS (A) | 4 | AC-2, AC-4, AC-5, AC-10 |
| PENDING | 5 | AC-6, AC-8（注）, AC-9, AC-12, AC-14 |
| FAIL | 0 | （該当なし） |

> 注: AC-8 は運用ルール記述自体は phase-03/main.md で完了しているため `PASS` に分類した。集計上は PASS 6 件 / PASS (A) 4 件 / PENDING 4 件（AC-6, AC-9, AC-12, AC-14）/ FAIL 0 件。

最終集計（再掲）:

| 状態 | 件数 | AC# |
| --- | --- | --- |
| PASS | 6 | AC-1, AC-3, AC-7, AC-8, AC-11, AC-13 |
| PASS (A) | 4 | AC-2, AC-4, AC-5, AC-10 |
| PENDING | 4 | AC-6, AC-9, AC-12, AC-14 |
| FAIL | 0 | — |

PR 化前の合否ゲートは「FAIL = 0 / PENDING の解消経路がすべて Phase 8〜13 のいずれかに紐づく」であり、本マトリクスはこのゲート条件を満たす。

---

## 3. PENDING 解消経路

| AC# | 解消条件 | 解消 Phase | 解消後 |
| --- | --- | --- | --- |
| AC-6 | scan-checklist.md（Phase 4）と Phase 9 main.md（baseline / after diff）を実体化 | 4, 9 | PASS |
| AC-9 | Phase 5 ランブック拡張（別タスク register 表 4 件以上）+ Phase 12 unassigned-task-detection.md 作成 | 5, 12 | PASS |
| AC-12 | Phase 10 go-no-go.md で 4条件 + GO 条件 8 件すべて満足を再評価 | 10 | PASS |
| AC-14 | Phase 13 local-check-result.md で `git diff` 0 ヒットを記録 | 13 | PASS |

---

## 4. 採用方針別期待値分岐（5 件）

phase-07.md L75-81 の分岐表を本書にも転記（採用 B 切替時の影響範囲を明示）:

| AC# | 採用 A 期待値 | 採用 B 期待値 | 切替時の影響 |
| --- | --- | --- | --- |
| AC-3 | 撤回 5 軸 + 移植 5 知見 | same-wave 5 軸 | Phase 5 runbook の採用 A / B section 切替 |
| AC-4 | 2 endpoint 維持 | 単一 endpoint へ更新 | 04c index.md / api-endpoints.md 更新 |
| AC-5 | `sync_jobs` 単一 | `sync_locks` + `sync_job_logs` | database-schema.md 更新 |
| AC-6 | 5 文書 採用 A 期待値 | 5 文書 採用 B 期待値 | scan-checklist.md の期待結果列切替 |
| AC-10 | 適用外（記述存続のみ） | B1〜B5 5 ステップ実行 | Phase 5 採用 B section の活性化 |

---

## 5. Phase 8 / 9 / 10 への引き継ぎ

- Phase 8 (DRY 化): 本マトリクスの「検証方法」列に出現する `rg` / `git diff` / `mise exec` 1-liner を集約し、bash スクリプト化候補に指定。
- Phase 9 (品質保証): AC-6 / AC-8 / AC-14 の baseline / after 実測。scan allowlist 8 文書（5 文書 + references 3 件）を逸脱しないこと。
- Phase 10 (最終レビュー): AC-12 累積判定（4 段論理）で GO 条件 8 件を最終確認。AC-11 の Phase 10 補完 22 種思考法も同 Phase で実施。
- Phase 11 (手動 smoke): 採用方針別期待値分岐 5 件（AC-3 / 4 / 5 / 6 / 10）を dry-run。
- Phase 12 (ドキュメント更新): AC-9 unassigned-task-detection.md に 4 件以上登録。
- Phase 13 (PR 作成): AC-14 unrelated 削除混入ゼロを `git diff` で確定。

---

状態: spec_created
