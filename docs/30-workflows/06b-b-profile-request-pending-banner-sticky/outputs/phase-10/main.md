# Phase 10: 最終レビュー — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 10 / 13 |
| wave | 06b-fu |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1〜9 の成果物（要件 / 設計 / テスト / 実装ランブック / 品質保証）を横断レビューし、Phase 11 実測と Phase 12 ドキュメント更新へ渡せる状態かを判定する。

## レビュー観点

| 観点 | 確認内容 | 判定 |
| --- | --- | --- |
| AC 完全性 | AC-1..AC-7 全てに TC + evidence 紐付け | PASS / MINOR / FAIL |
| 不変条件 | #4 / #5 / #11 grep result 0 hit（期待） | PASS / FAIL |
| 苦戦箇所 S1 | server pending が disabled 判定の最優先 | PASS / FAIL |
| 苦戦箇所 S2 | `authGateState` enum 再宣言なし | PASS / FAIL |
| 苦戦箇所 S3 | BFF passthrough 変更なし | PASS / FAIL |
| 苦戦箇所 S4 | Phase 11 status `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` を許容 | PASS |
| 苦戦箇所 S5 | 新 error code 追加なし | PASS / FAIL |
| 後方互換性 | API/web を同 commit で更新する deploy 順序が記載 | PASS |
| coverage | Line 80% / Branch 60% / Function 80% 達成 | PASS / MINOR / FAIL |
| Playwright | TC-E-01..06 全 PASS | PASS / FAIL |

## 判定区分

- **PASS**: Phase 11 へ進める
- **MINOR**: 軽微な指摘あり、Phase 11 と並行修正可
- **FAIL**: Phase 2 / 5 / 9 へ差し戻し

## 差し戻し条件

- 不変条件 grep に hit がある
- AC のいずれかに evidence 紐付けがない
- coverage が目標を下回る（追加 TC で吸収）
- Playwright 一部 PASS / flaky（再実行で安定するか確認）

## サブタスク管理

- [ ] 観点表の各項目を判定
- [ ] 差し戻し有無を確定
- [ ] `outputs/phase-10/main.md` 作成

## 成果物

| 成果物 | パス |
| --- | --- |
| 最終レビュー | `outputs/phase-10/main.md` |

## 完了条件

- [ ] 全観点を PASS / MINOR / FAIL のいずれかで判定
- [ ] FAIL の場合は差し戻し先 phase が指定されている
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ、PASS / MINOR 判定とレビュー結果を渡す。
