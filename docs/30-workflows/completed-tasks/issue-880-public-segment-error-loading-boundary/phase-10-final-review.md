---
phase: 10
title: 最終レビュー
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 10 — 最終レビュー

[実装区分: 実装仕様書]

## 1. レビュー観点

| カテゴリ | 観点 | 判定 |
|---------|------|------|
| 要件 | FR-01..07 すべて実装 | レビュー時確認 |
| 設計 | Phase 2 設計に従う | レビュー時確認 |
| テスト | TC-01 / TC-02 PASS | Phase 11 evidence で確認 |
| コード品質 | typecheck / lint / build green | Phase 9 gate |
| セキュリティ | `error-boundary-smoke` production ガード | grep evidence |
| トークン | OKLch のみ | grep gate |
| ドキュメント | serial-06 への backfill 完了 | Phase 12 で確認 |

## 2. 戻り先決定基準

| 問題 | 戻り先 |
|------|--------|
| 要件不足 | Phase 1 |
| 設計欠陥 | Phase 2 |
| テスト不足 | Phase 4 |
| 実装バグ | Phase 5 |
| 品質ゲート fail | Phase 9 |

## 3. 判定基準

| 判定 | 条件 | 次アクション |
|------|------|-------------|
| PASS | 全観点問題なし | Phase 11 進行 |
| MINOR | 軽微指摘 | 指摘対応 → Phase 11 |
| MAJOR | 重大問題 | 該当 Phase に戻る |
| CRITICAL | 致命的問題 | Phase 1 戻り + ユーザー確認 |

## 4. PR readiness チェック

- [ ] `git diff dev...HEAD --name-only` で本 task が touch するファイルが期待集合と一致
- [ ] 期待集合: 4 ファイル新規 + 1 ファイル追記 + spec 作成 + (任意) unassigned-task 更新
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] `outputs/phase-11/screenshots/public-error-boundary.png` 存在
