# 出席ダッシュボード / 統計可視化 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | ut-02a-followup-002-attendance-dashboard-analytics |
| タスク名 | admin 向け出席履歴ダッシュボード / 集計可視化 |
| 分類 | 実装 / UI / 集計クエリ |
| 対象機能 | admin 画面の attendance 集計タブ、`/admin/analytics/attendance` API |
| 優先度 | priority:low |
| 見積もり規模 | 大規模 |
| ステータス | 未実施 |
| 発見元 | ut-02a-attendance-profile-integration Phase 12 unassigned-task-detection |
| 発見日 | 2026-05-01 |
| 委譲先 wave | 06b 後続 / または独立 product wave |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

ut-02a-attendance-profile-integration では個人の attendance read path のみ実装した。
admin が組織全体の出席率傾向を把握する集計可視化はスコープ外として保留している。

### 1.2 問題点・課題

- 全体出席率 / セッション別参加率 / 会員別連続出席数などの基本指標が UI から見えない
- 集計クエリは N+1 / 大規模 scan を発生させやすく専用設計が必要

### 1.3 放置した場合の影響

- 運営判断（出席率低下セッションの特定、欠席継続会員のフォロー）が手動 SQL 依存になる
- product 価値の半分（記録 → 可視化）が欠落する

---

## 2. 何を達成するか（What）

### 2.1 目的

attendance データを集計可視化し、admin が運営判断に使えるダッシュボードを提供する。

### 2.2 最終ゴール

- 全体出席率 / セッション別 / 会員別ランキングの集計 API
- admin 画面に attendance 集計タブ
- 集計クエリは事前 aggregate or 適切な index で N+1 / full scan 回避

### 2.3 スコープ

#### 含むもの

- 集計用 API ルート / repository 関数
- admin 画面の集計 UI（既存デザインプロトタイプ参照）
- index 追加 migration（必要に応じて）

#### 含まないもの

- write path（[ut-02a-followup-001](ut-02a-followup-001-attendance-write-operations.md)）
- 個人マイページの attendance 表示（02a / read path で完了済み）
- BI ツール連携 / R2 export

### 2.4 成果物

- `apps/api/src/routes/admin/analytics/attendance.ts`
- 集計 repository + 単体テスト
- admin UI コンポーネント
- visual evidence

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- ut-02a-followup-001（write path）でデータ蓄積が始まっていること（または seed データで動作可）

### 3.2 実装手順

1. 集計クエリ要件定義（指標 / 期間 / 粒度）
2. index 設計（`held_on`, `member_id`, `session_id`）と migration
3. 集計 repository 実装 + テスト
4. admin UI 実装

---

## 4. 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/attendance.ts`
- 症状: read path 実装時、`ATTENDANCE_BIND_CHUNK_SIZE = 80` で chunk 分割した。集計系は member_id を全件渡せないため、SQL 内で `GROUP BY` 完結の設計が必要。read path の chunk pattern を流用しないこと。
- 対象: `apps/api/migrations/`
- 症状: index 追加 migration は 02b と編集権競合の可能性。Schema Ownership 宣言を Phase 1 で明示する必要あり。
- 参照: `docs/30-workflows/ut-02a-attendance-profile-integration/outputs/phase-12/implementation-guide.md`

---

## 5. リスクと対策

| リスク | 対策 |
| --- | --- |
| 集計クエリの full scan で D1 CPU 超過 | index 追加 + クエリ EXPLAIN を Phase 4 に必須化 |
| 02b の meeting domain と migration 衝突 | Phase 1 で Schema Ownership 宣言 + 02b と調整 |
| 集計 UI の visual regression | claude-design-prototype をベースに baseline 設定 |

---

## 6. 検証方法

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test attendance
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web build
```

期待結果: 集計 API 単体テスト全 PASS、UI 描画 visual evidence 取得。

---

## 7. 参考リンク

- `docs/30-workflows/ut-02a-attendance-profile-integration/index.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
