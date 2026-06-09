---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 3
artifact: design-review
status: completed
decision: PROCEED_TO_PHASE_4
updated: 2026-06-09
---

# Phase 3 outputs — design-review（要約）

正本は `../../phase-3-design-review.md`。判定: **PROCEED_TO_PHASE_4**。

## 真の論点
取込が構造的に壊れ会員が表示されず、確定編集の上書き防止（3層プレシデンス）が無く、/profile が閉塞している。3 案件を Lane で分離（B=構造バグ / A+C=新機能 / E=独立バグ）。

## 4 条件評価（一次結論）
- 価値性: ✅ 高（取込全失敗の致命解消 + override 運用価値 + マイページ閉塞解消）
- 実現性: ✅ 適（既存 repository/primitive 再利用・新規最小・1サイクル）
- 整合性: ✅ 閉じている（状態所有権分離・projection 純関数1つを3経路共有）
- 運用性: ✅ 破綻なし（import-once 冪等・override 再同期耐性・外形契約不変・test focused）

## 不変条件整合（#1/#4/#5/#7）
すべて ✅（実ラベル準拠 / admin-managed 分離 / D1 は apps/api / Form 再回答 L2 維持）。

## 残論点と決定
- R-1 会員未登録 /profile 体験 → 401→/login 維持 + login 案内（最小）。
- R-2 Sheets seed の formId/revision → seed 専用固定定数。
- R-3 zone/status enum 正規化 → 本タスクで取込時に持つ（AC-1 達成のため）。
- R-4 transport binding 真因 → Lane E phase-1 実機ログ（user-gated）+ web fail-safe 分岐で両真因に耐性。
- R-5 override value バリデーション → 文字列/null 最小（UI select で enum 担保・YAGNI）。

ブロッカーなし。Phase 4 へ。
