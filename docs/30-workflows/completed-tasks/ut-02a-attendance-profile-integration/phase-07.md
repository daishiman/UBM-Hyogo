# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | completed |

## 目的

AC-1〜10 を test ケース（U-* / I-* / T-* / F-*）と evidence ファイル / 不変条件に対し N:M でトレースし、漏れを構造的に検出する。

## AC × Test × Evidence × 不変条件 マトリクス

| AC | 概要 | 紐付く test | evidence path | 不変条件 |
| --- | --- | --- | --- | --- |
| AC-1 | builder の `attendance: []` stub 排除、provider 注入 | I-1, I-2, I-3 | outputs/phase-11/evidence/api-curl/me-profile-attendance.json | 02a interface 不変 |
| AC-2 | `findByMemberIds` 新設 / `IN (?,?,...)` バッチ | U-1〜U-6, I-2 | api-curl + N+1 metric | #5 D1 直接アクセスは apps/api |
| AC-3 | bind 上限超過時の chunk 分割 | U-7, F-3 | n-plus-1-metric.md | #5 |
| AC-4 | 単体テスト網羅 | U-1〜U-9 | local-check-result.md | — |
| AC-5 | 02a 既存テスト regression なし | I-4, F-9 | local-check-result.md | 02a interface 不変 |
| AC-6 | typecheck / lint / build PASS | T-1, T-2, T-3 | local-check-result.md | — |
| AC-7 | branded type 独立 module | T-4, F-10 | repository-contract.md / branded-type-module.md | 02a 確定済み型不変 |
| AC-8 | API 通電 evidence | smoke (Phase 11) | outputs/phase-11/evidence/api-curl/*.json / *.curl.txt | #5 |
| AC-9 | UI 通電 evidence (NON_VISUAL) | smoke (Phase 11) | outputs/phase-11/evidence/ui-smoke/*.md | #1 admin-managed data |
| AC-10 | ドキュメント同期 | — | outputs/phase-12/* (7 ファイル) | — |

## 不変条件カバレッジ

| 不変条件 | カバー AC | 検証 Phase |
| --- | --- | --- |
| #1 form schema 固定回避（attendance は admin-managed） | AC-9 | Phase 11 |
| #4 admin-managed data 分離 | AC-1, AC-9 | Phase 5, 11 |
| #5 D1 直接アクセスは apps/api | AC-2, AC-3, AC-8 | Phase 5, 9, 11 |
| 02a interface 不変 | AC-1, AC-5, AC-7 | Phase 5, 9 |

## 完了条件

- [ ] AC-1〜10 全てに紐付く test と evidence が 1 つ以上ある
- [ ] 不変条件 4 件全てがカバー AC に紐付いている
- [ ] orphan（紐付き先のない test / evidence）がない

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | Phase 7 主成果物 |
| Matrix | outputs/phase-07/ac-matrix.md | 上記表の機械可読版 |

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed / 全成果物配置済み / 完了条件すべてチェック
- [ ] artifacts.json の phase 7 を completed

## 次 Phase

- 次: Phase 8 (DRY 化)
- 引き継ぎ: Phase 7 で発見された冗長 / 重複の修正候補

## 実行タスク

- [ ] Phase 固有の成果物を作成する
- [ ] 完了条件と次 Phase への引き継ぎを確認する
- [ ] artifacts.json の該当 Phase status を実行時に更新する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/index.md | workflow 全体仕様 |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/artifacts.json | Phase status / outputs 契約 |
| 必須 | docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md | legacy source / Canonical Status |

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 4 | AC と test matrix の対応を維持 |
| Phase 9 | typecheck / lint / build / regression gate に接続 |
| Phase 11 | NON_VISUAL runtime evidence に接続 |
| Phase 12 | system spec sync と compliance check に接続 |
