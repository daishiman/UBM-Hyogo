# Phase 1: 要件定義 / SSOT 確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 区分 | 設計（実装なし） |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 想定所要 | 0.25 人日 |

## 目的

`StatusDistribution` component に SVG bar chart 描画ロジックを後方互換で追加するための前提条件を SSOT として確定する。具体的には次の 5 点を固定する。

1. **API contract**: `apps/api/src/routes/admin/dashboard.ts` の response に `byStatus` field を追加する。frontend は `byStatus` が `undefined / null / empty` でも壊れない実装とする。
2. **fallback 戦略**: `slices` が `undefined / null / empty` のとき、既存 placeholder の描画を完全維持する。
3. **chart 戦略**: 依存追加（`recharts` / `visx` 等）は本ワークフロー範囲外。SVG 直書き bar chart で実装する。
4. **token 正本**: 色値は `apps/web/src/styles/tokens.css` の `--ubm-color-ok` / `--ubm-color-info` / `--ubm-color-warn`（OKLch）を介す。HEX 直書き / `bg-[#xxx]` 禁止。
5. **`StatusDistributionProps` の signature 不変**: 既存 caller を壊さない。

## 入力

- 元仕様: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-05-dashboard-chart/spec.md`
- 既存実装: `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`
- 型定義: `apps/web/src/lib/admin/admin-dashboard-ui.ts` (`StatusSlice`)
- design tokens: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`

## SSOT 決定事項

### 1. props 契約（変更なし）

```typescript
interface StatusDistributionProps {
  readonly slices: ReadonlyArray<StatusSlice> | undefined;
}

interface StatusSlice {
  readonly status: "public" | "member_only" | "hidden";
  readonly count: number;
}
```

### 2. 描画分岐

| `slices` の状態 | 描画内容 |
| --- | --- |
| `undefined` / `null` | placeholder（`<p role="status">分布データは現在集計対象外です</p>`） |
| `length === 0` | placeholder（上と同一） |
| `length > 0` | SVG bar chart + 既存 chip list（chart 下に補助表示） |

### 3. SVG 仕様

| 観点 | 値 |
| --- | --- |
| viewBox | `0 0 600 200` |
| 描画領域 | width 100% / max-width 600px / height 200px |
| chart 種別 | 縦 bar chart（3 bar 固定: public / member_only / hidden） |
| color mapping | public → `var(--ubm-color-ok)` / member_only → `var(--ubm-color-info)` / hidden → `var(--ubm-color-warn)` |
| label | x 軸: 日本語ラベル（公開 / 会員限定 / 非公開） / bar 上に count |
| responsive | `preserveAspectRatio="xMidYMid meet"` で親幅追従 |
| a11y | `role="img"` + `aria-label`（例: "公開ステータス分布: 公開 12, 会員限定 8, 非公開 3"） |

### 4. 非機能要件

- **後方互換**: 既存 caller（`apps/web/src/app/(admin)/admin/page.tsx` 等）の変更なしで動作。
- **lines coverage**: 追加コード部分 ≥ 80%（リポジトリ閾値）。
- **build / typecheck / lint**: green 維持。
- **visual regression**: Playwright visual snapshot が更新差分のみで pass。

## 実行タスク

- Phase 1: 元仕様・現行実装・API境界を確認し、frontend 受け皿の SSOT を固定する。

## 参照資料

- - `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-05-dashboard-chart/spec.md`
- - `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`
- - `apps/web/src/lib/admin/admin-dashboard-ui.ts`

## 成果物

- - `phase-01.md` に SSOT と境界条件を記録する。

## 統合テスト連携

- - Phase 11 で focused component test と grep gate に接続する。

## 完了条件

- [ ] 上記 5 点 SSOT が本 Phase ドキュメントに記載されている
- [ ] 後続 Phase 2-13 が本 SSOT に整合する

## リスク

- API 側 `byStatus` producer の field 名 / shape 変動 → shared schema と `StatusSlice` 型に集約し、`toAdminDashboardUi()` 側で正規化することで吸収する（Phase 2 で配置確定）。
