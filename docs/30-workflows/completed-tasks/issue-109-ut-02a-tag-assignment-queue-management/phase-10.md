# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-109-ut-02a-tag-assignment-queue-management |
| Issue | #109 [UT-02A] tag_assignment_queue 管理 Repository / Workflow |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビューゲート |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 作成日 | 2026-05-01 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (NON_VISUAL evidence) |
| 状態 | completed |

## 目的

Phase 1〜9 の成果物を統合レビューし、PASS / MINOR / MAJOR / CRITICAL を判定する。MINOR は未タスク化したうえで Phase 11 に進む。MAJOR / CRITICAL は影響範囲に応じて差戻し先を決定する。GO / NO-GO 判定により Phase 11（NON_VISUAL evidence）への遷移可否を確定する。

## 実行タスク

1. 全 phase 自己レビュー（Phase 1〜9）
2. 上流 / 下流 AC trace
3. 不変条件 #5 / #13 の最終確認
4. blocker / MINOR 一覧の整理
5. PASS / MINOR / MAJOR / CRITICAL 判定マトリクスの記入
6. GO / NO-GO 判定と Phase 13 blocked 条件確認

## 判定マトリクス

| 判定 | 条件 | 対応 |
| --- | --- | --- |
| PASS | 全観点で問題なし | Phase 11 へ進行 |
| MINOR | 軽微な指摘あり | 未タスク化（`docs/30-workflows/unassigned-task/`）後、Phase 11 へ進行 |
| MAJOR | 重大な問題あり（不変条件違反 / AC 未達 / coverage 未達 等） | 影響範囲に応じて Phase 1〜9 のいずれかに差戻し |
| CRITICAL | 致命的問題（#5 / #13 違反、secret 漏出、無料枠超過） | Phase 1 へ戻りユーザーと要件再確認 |

## レビュー観点

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| Phase 1 要件定義 | TBD | scope / queue 状態定義 / 不変条件参照 |
| Phase 2 設計 | TBD | state machine / retry / DLQ / aliasMap |
| Phase 3 設計レビュー | TBD | MAJOR 不採用案の記録 |
| Phase 4 テスト戦略 | TBD | unit / contract / integration の層別計画 |
| Phase 5 実装 runbook | TBD | repository / workflow 擬似コード |
| Phase 6 異常系 | TBD | retry cap / DLQ / idempotency 衝突 |
| Phase 7 AC マトリクス | TBD | AC × layer trace |
| Phase 8 DRY | TBD | `lib/queue/` 5 件集約 / 仕様語マップ単一化 |
| Phase 9 品質保証 | TBD | typecheck / lint / unit / contract / coverage / grep PASS |
| 上流 04c API endpoint AC | TBD | enqueue / list / detail endpoint 契約 |
| 上流 03b sync hook AC | TBD | candidate 自動投入 hook の signature |
| 下流 07a resolve workflow | TBD | 02a queue を入力として消費可能 |

## 不変条件最終確認

| 不変条件 | 最終確認 | 結果 |
| --- | --- | --- |
| #5 D1 直接アクセスは apps/api に閉じる | Phase 9 grep ステップ 8 が 0 件 | TBD |
| #13 02a memberTags.ts read-only 維持 | Phase 9 grep ステップ 7 が 0 件 | TBD |
| 監査 | 全 status transition に audit_log entry | unit test 結果 |
| 仕様語 ↔ DB 語 | `candidate/confirmed/rejected` ↔ `queued/resolved/rejected/dlq` の双方向一致 | aliasMap unit test |
| 無料枠 | 723 writes / 月、99.97% 余裕 | Phase 9 ステップ 9 |

## blocker / MINOR 一覧

| # | 区分 | 内容 | 解消方針 |
| --- | --- | --- | --- |
| 1 | TBD | 04c の enqueue endpoint response shape 確定状況 | 04c で確定 / 仮契約は spec に明記 |
| 2 | TBD | 03b の sync 完了 hook signature | 03b で hook 公開 |
| 3 | TBD | 07a resolve workflow が消費する queue row 形状 | 07a 仕様で確認 |
| 4 | TBD | retry attempts cap 値の運用合意 | Phase 1 要件で確定済みかを再確認 |

## 4 条件最終評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | TBD | tag 品質と監査両立、retry / DLQ で運用堅牢性確保 |
| 実現性 | TBD | guarded update + 既存 d1Tx wrapper で実装可能 |
| 整合性 | TBD | 不変条件 #5 / #13 を構造的に担保（grep 0 件） |
| 運用性 | TBD | DLQ 監視 / retry policy / 仕様語マップが単一情報源 |

## GO / NO-GO ゲート条件

| 条件 | 必須 | 充足判定 |
| --- | --- | --- |
| Phase 1〜9 すべて completed | ✅ | TBD |
| 不変条件 #5 / #13 violation 0 件 | ✅ | TBD |
| coverage branch 80% 以上 | ✅ | TBD |
| MAJOR / CRITICAL 0 件 | ✅ | TBD |
| MINOR は未タスク化済み | ✅ | TBD |
| 上流 AC（04c / 03b）trace 完了 | ✅ | TBD |

- すべて充足 → **GO**（Phase 11 NON_VISUAL evidence へ進行）
- 1 件でも未充足 → **NO-GO**（差戻し先を blocker 一覧に明記）

## Phase 13 blocked 条件

Phase 13（PR / sync）は以下のいずれかに該当する間 blocked とする:

- ユーザー承認（GO 判定の最終承認）が未取得
- Phase 11 / 12 の成果物 commit が未実行
- `artifacts.json` の phase 1〜12 のいずれかが completed でない
- `outputs/phase-09/quality-report.md` で grep 検証 0 件が確認できていない

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO なら NON_VISUAL evidence 取得へ進行 |
| Phase 12 | spec sync の根拠として最終レビュー結果を参照 |
| Phase 13 | PR description に判定結果と blocker 一覧を転記 |

## 多角的チェック観点

| 不変条件 | 最終確認 | 結果 |
| --- | --- | --- |
| #5 | apps/api 内のみ | TBD |
| #13 | memberTags.ts read-only 維持 | TBD |
| 監査 | audit_log entry の網羅 | TBD |
| retry / DLQ | attempts cap → DLQ 動線 | TBD |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 全 phase 自己レビュー | 10 | pending | 9 phase |
| 2 | 上流 / 下流 AC trace | 10 | pending | 04c / 03b / 07a |
| 3 | 不変条件最終確認 | 10 | pending | grep 結果再掲 |
| 4 | MINOR 未タスク化 | 10 | pending | unassigned-task |
| 5 | GO / NO-GO 判定 | 10 | pending | 根拠記入 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-01〜09/` | 全成果物 |
| 必須 | `index.md` | scope / 依存関係 |
| 必須 | `outputs/phase-09/quality-report.md` | grep / coverage 実測 |
| 参考 | `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/phase-10.md` | 判定形式の先例 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-10/main.md` | 最終レビュー結果 |
| ドキュメント | `outputs/phase-10/go-no-go.md` | GO / NO-GO 判定とゲート条件充足表 |
| メタ | `artifacts.json` | Phase 10 を completed |

## 完了条件

- [ ] 全 phase が completed
- [ ] 上流 / 下流 AC trace 完了
- [ ] 不変条件 #5 / #13 violation 0 件
- [ ] blocker / MINOR が一覧化され、MINOR は未タスク化
- [ ] GO / NO-GO 判定が記録されている
- [ ] Phase 13 blocked 条件が確認されている
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認

- 全項目に判定 (PASS / MINOR / MAJOR / CRITICAL)
- artifacts.json で phase 10 を completed

## 次 Phase

- 次: 11 (NON_VISUAL evidence)
- 引き継ぎ: GO なら NON_VISUAL evidence 取得、NO-GO なら blocker 解消後に再判定
- ブロック条件: 不変条件 violation または coverage 未達なら NO-GO
