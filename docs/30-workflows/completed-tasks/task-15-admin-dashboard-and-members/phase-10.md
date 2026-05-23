# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

> 目的: Phase 1 §3 の DoD G-01〜G-12 を一括判定し、Phase 11 進行可否を決める。MINOR 指摘は Phase 12 で **必ず未タスク化** する（FB「Phase 10 MINOR は未タスク化対象」）。

---

## 1. DoD 一括判定

| ID | 条件 | 判定基準 | 判定 |
|----|------|---------|------|
| G-01 | `/admin` SSR 200、KPI 4 / Zone / Status / RecentActions が描画 | dev server で curl + 目視 | □ PASS / □ FAIL |
| G-02 | `/admin/members` SSR 200、テーブル + フィルタ + bulk + drawer | 同上 | □ |
| G-03 | `(admin)/layout.tsx` に AdminSidebar 8 nav + AdminPageHeader + 2 カラム grid | 目視 | □ |
| G-04 | 既存 admin endpoint 6 操作の adapter 接続（dashboard / members list / detail / status / delete / restore、新 endpoint なし） | unit test + Phase 9 Q-06 | □ |
| G-05 | OKLch tokens のみ、HEX 0 件 | Phase 9 Q-04 / Q-08 | □ |
| G-06 | jest-axe critical 0 | Phase 6 TC-A11Y-01〜06 全 PASS | □ |
| G-07 | sort / filter が client state で動作 | Phase 4-6 TC-MF / TC-MT | □ |
| G-08 | bulk action 起動可能 | TC-BAB-02〜04 + Phase 11 manual | □ |
| G-09 | drawer で 1 会員詳細確認 | TC-MD（Phase 6 追加）+ Phase 11 manual | □ |
| G-10 | typecheck / lint / verify-design-tokens green | Phase 9 Q-01 / Q-02 / Q-04 | □ |
| G-11 | `apps/api` 差分 0 行 | Phase 9 Q-06 | □ |
| G-12 | 旧 `apps/web/src/components/admin/` 残骸 0 | Phase 8 §2 + Phase 9 Q-09 | □ |

---

## 2. レビュー観点（severity 分類）

### 2.1 BLOCKER（Phase 11 進行不可）

| 観点 | 該当時の対処 |
|------|-------------|
| G-01 〜 G-12 のいずれかが FAIL | Phase 5 へ戻り修正、再度 Phase 9-10 実施 |
| 元仕様 §0.5 不変条件違反 | 同上 |

### 2.2 MAJOR（Phase 11 進行可、Phase 12 で必ず修正）

- a11y violations（critical 以外）
- coverage 90% 未達
- z-index 階層の局所違反

### 2.3 MINOR（**Phase 12 で必ず未タスク化** — 「機能に影響なし」は不要判定の理由にならない）

- 命名揺れ（`fullName` vs `displayName` 等）
- console.log の残骸
- TODO/FIXME コメント
- 軽微なレイアウトずれ
- prototype との差分（派生ルール §7 で許容済みのものを除く）

---

## 3. 残課題棚卸し（Phase 12 未タスク化の input）

Phase 1 §2.3 で予告した未タスク化候補を最終確認:

| # | 項目 | Phase 12 未タスク化 |
|---|------|-------------------|
| U-01 | `/admin/dashboard` API への `byZone` / `byStatus` 集計フィールド追加 | Yes |
| U-02 | CSV export 実装 | Yes |
| U-03 | task-17 audit page リリース後の RecentActions filter 反映 | Yes（task-17 完了タイミングで実施） |
| U-04 | Drawer focus trap が task-10 primitive に無い場合の最小実装持続検証 | 条件付き Yes |

---

## 4. 完了条件（DoD）

- [ ] §1 G-01〜G-12 すべて PASS
- [ ] §2 BLOCKER 0 件
- [ ] §3 MAJOR / MINOR を `outputs/phase-10/review-result.md` に列挙、Phase 12 未タスク化リストに移管
- [ ] Phase 11 進行 GO 判定

## 成果物

- `outputs/phase-10/review-result.md`（DoD 判定表 + severity 分類 + 残課題リスト）
- 実行後に `artifacts.json` の `phase10.status` を `completed` へ更新（仕様書作成時点は `spec_created`）
