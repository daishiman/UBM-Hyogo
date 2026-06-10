# Phase 8 リファクタリング — main

> 上流: Phase 7（未カバー AC ゼロ確認済み）。本 Phase は**挙動不変**を絶対条件に、duplicate（route 二重 className=M-1）と navigation drift を削減する。詳細な前後は `before-after.md`。

## 1. リファクタの目的とスコープ

- **目的**: 3 層化に伴って生じる構造の散らばり（重複 className・ゾーン命名の drift）を整理し、保守性を上げる。新機能追加・挙動変更はしない。
- **スコープ**: `apps/web` 表現層に閉じる。`page.tsx` / `AttendanceAnalyticsPage.tsx` / `KpiPanel.tsx` / `globals.css` の attendance ブロックのみ。API/D1/shared 型には触れない（AC-7）。

## 2. duplicate 削減（M-1 — route 二重 className/testid）

- **問題**: `page.tsx` と `AttendanceAnalyticsPage` が共に `attendance-analytics-page` 系の className / `data-testid` を持つ（Phase 1-3 裏取り確定・MINOR M-1）。testid が衝突し、テストの一意セレクタが曖昧になる。
- **方針**:
  - route 側（`page.tsx`）はページ外枠の責務に限定し、`attendance-analytics-page` testid を 1 箇所（`AttendanceAnalyticsPage` 側）に集約する。
  - `AttendanceAnalyticsPage` 内の 3 層は `attendance-zone-{primary,trend,detail}` のラッパー名で分離する。
  - 既存 spec が `attendance-analytics-page` testid に依存していないかを grep で確認し、依存があれば残す側（`AttendanceAnalyticsPage`）に寄せる。

```bash
# 既存 spec の testid 依存確認（一元化前に実施）
grep -rn "attendance-analytics-page" apps/web/src/features/admin/attendance/__tests__/
```

## 3. navigation drift 削減（3 層命名の集約）

- **問題**: 8 セクション flat → 3 層に再構成すると、ゾーン見出し（h2）とラッパー className が散発的に命名され drift しやすい。
- **方針**: 命名規約を `attendance-zone-{primary,trend,detail}`（ラッパー）+ `aria-labelledby` で見出し（h2）と 1:1 に結ぶ。ゾーンごとに「ラッパー class / h2 id / aria-labelledby」を対にして揃える（AC-2 / AC-9）。

## 4. 責務分離（`KpiPanel` → PRIMARY hero）

- **問題**: 現状 `KpiPanel` は 5 枚を均等ウェイトで描画し、焦点（出席率・要フォロー）が埋もれる。
- **方針**: hero（出席率特大 + 要フォロー強調）と secondary stat を責務分離する。hero は `Stat`（`--ubm-text-3xl`）+ `Badge`(tone) を使い、secondary は従来の stat 列に残す。詳細は `before-after.md` 行 2。

## 5. `globals.css` `.attendance-*` クラス整理

- **問題**: 8 セクション flat 前提のクラスに、3 層化で未使用化するもの（旧 grid 前提クラス等）と、新規 3 層クラスが混在し重複が生じる。
- **方針**: (1) 未使用化したクラスを削除、(2) 3 層用クラス（`.attendance-zone-*` / `.attendance-hero-*`）へ集約、(3) 全プロパティが `var(--ubm-*)` 経由であること（HEX 非増加・AC-5）を維持。

## 6. 挙動不変の担保（全体方針）

- リファクタ後に Phase 7 の TC を**全件再実行**し、PASS を維持する。1 件でも FAIL すれば挙動が変わった証拠として差し戻す。
- testid を維持する（既存 spec のセレクタを壊さない）。
- Phase 11 の screenshot で視覚差分が「3 層化の意図した変化のみ」で、リファクタ起因の予期せぬ差分が出ないことを確認する。

```bash
# 挙動不変の機械確認
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root .
```
