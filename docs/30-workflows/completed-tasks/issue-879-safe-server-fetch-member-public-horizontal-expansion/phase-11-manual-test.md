# Phase 11: 手動テスト

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 11 / 13 |
| visual category | NON_VISUAL |

## NON_VISUAL 宣言（skill feedback WEEKGRD-03 準拠）

本タスクは UI コンポーネント（SectionError）を追加するが、

- 既存 OKLch token のみ参照（新規 token / 色追加なし）
- 既存 playwright visual smoke の巡回路に乗っており、新規 visual baseline を増やさない
- a11y / role / class 構造は public / member で同一 props shape

ため **NON_VISUAL** として宣言する。視覚評価は新規 baseline を増やさず、既存 smoke 巡回と focused server component spec で代替する。

## 目的

- 共通 helper の挙動を実 runtime（next dev）で確認
- per-section degrade が体験として機能することを目視確認

## 実行結果

本サイクルで実コードと focused evidence を取得した。runtime dev server で API Worker を停止する目視確認は、同等の server component 分岐を Vitest で固定し、NON_VISUAL 代替証跡として扱う。

## 1. 3層評価（NON_VISUAL 版）

### 層 A: helper 単体

- `pnpm --dir apps/web exec vitest run src/lib/server-fetch` で U-1〜U-8 が green

### 層 B: 統合（page）

- `pnpm --dir apps/web dev` 起動
- `/profile` で API Worker を停止 → SectionError が描画され、page 自体は描画されることを確認
- `/(public)/members` で API Worker を停止 → SectionError 描画＋Filters/Density 描画維持
- `/(public)/members/存在しない_id` → notFound() 経路維持

### 層 C: regression

- admin dashboard（`/admin`）が引き続き正常描画
- `/admin` の section degrade（既存）が壊れていない

## 2. 検証手順

```bash
# 層 A
mise exec -- pnpm --dir apps/web exec vitest run src/lib/server-fetch
mise exec -- pnpm --dir apps/web exec vitest run src/components/public/__tests__/SectionError.spec.tsx src/components/member/__tests__/SectionError.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run app/profile/page.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run "app/(public)/members/page.spec.tsx" "app/(public)/members/[id]/page.spec.tsx"

# 層 B（手動・API Worker を kill した状態で）
mise exec -- pnpm --dir apps/web dev
# → /profile, /(public)/members, /(public)/members/[id] を訪問し SectionError を目視確認

# 層 C
mise exec -- pnpm --dir apps/web exec vitest run src/lib/admin/__tests__/safe-server-fetch.spec.ts
```

## 3. source-level PASS と環境ブロッカーの分離

| 区分 | 範囲 |
|---|---|
| source-level PASS | 層 A・層 C（vitest） |
| 環境依存 | 層 B（dev サーバー＋ API Worker 起動状態の制御。本 spec では手順のみ規定し、実行は実装サイクルに委ねる） |

## 4. 証跡メタ

- 層 A / 層 C: vitest stdout を `outputs/phase-11/vitest-safe-fetch.log` に保存
- 層 B: 本 workflow は NON_VISUAL のため screenshot baseline は更新しない。degraded section の分岐は page spec で固定し、runtime 目視は user-gated の補助確認として扱う

## 実行タスク

- 実行済み: `pnpm --dir apps/web exec vitest run src/lib/server-fetch src/lib/admin/__tests__/safe-server-fetch.spec.ts src/components/public/__tests__/SectionError.spec.tsx src/components/member/__tests__/SectionError.spec.tsx app/profile/page.spec.tsx "app/(public)/members/page.spec.tsx" "app/(public)/members/[id]/page.spec.tsx" --root=../.. --config=vitest.config.ts` → 7 files / 21 tests PASS
- 実行済み: `pnpm --filter @ubm-hyogo/web typecheck` → PASS
- 実行済み: `pnpm --filter @ubm-hyogo/web verify-design-tokens` → 9 tests PASS
- 実行済み: `pnpm --filter @ubm-hyogo/web lint` → PASS

## 統合テスト連携

- e2e の axe smoke（既存 task-18 smoke）が SectionError markup を巡回し critical 0 を維持していることを確認

## 参照資料

- `docs/30-workflows/admin-ui-prototype-alignment/phase-11-manual-test.md`（admin 側先行例）

## 成果物

- 本ファイル
- `outputs/phase-11/main.md`
- `outputs/phase-11/vitest-safe-fetch.log`
- `outputs/phase-11/typecheck.log`
- `outputs/phase-11/design-tokens.log`

## 完了条件

- 3 層評価の手順が明示されている
- NON_VISUAL 宣言の根拠が明示されている
