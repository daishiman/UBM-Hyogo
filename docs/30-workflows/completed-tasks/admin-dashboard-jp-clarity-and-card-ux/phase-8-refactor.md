# Phase 8: リファクタリング

- task_id: `admin-dashboard-jp-clarity-and-card-ux`
- 前提: Phase 1（要件・AC）/ Phase 2（設計）/ Phase 3（設計レビュー PASS）/ Phase 4〜7（実装・テスト・カバレッジ）
- 本 Phase の責務: 実装後の重複解消・命名整理・SRP 観点の整理を行い保守性を高める。新機能追加は行わず、DOM contract（testid / aria / role）を壊さない。

## 目的

日本語化・カード化の実装で生じた **ラベルの二重定義** と **不要になった縦棒グラフロジック** を解消し、`dashboardGlossary.ts` をラベルの単一の正本（SSOT）に統一する。
- StatusDistribution の `LABEL` 定数と glossary の `MEMBER_STATUS_LABELS` の二重定義を解消する（glossary を正本に）。
- 各コンポーネントのラベル直書きを glossary 集約済みかを確認し、漏れを除去する。
- 横バー再設計で未使用になった `VIEWBOX` / `computeBarLayout` 等の縦棒 SVG ロジックを削除する。
- duplicate / navigation drift（リンク URL の重複・齟齬）が無いことを確認する。
- リファクタ後も typecheck / lint / focused vitest が緑であることを確認する（DOM contract 不変なので既存 spec は壊れない）。

## 成果物

| 成果物 | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` | 編集 | `LABEL` ローカル定数を撤廃し `MEMBER_STATUS_LABELS`（glossary）参照へ統一・未使用 `VIEWBOX` / `computeBarLayout` / `BarLayout` の SVG 縦棒ロジック削除 |
| （確認のみ） KpiGrid / KpiCard / SchemaAlertCard / ZoneDistribution / RecentActionsTable | 確認 | ラベル直書き残存 0・navigation URL 重複 0 を確認（変更が出た場合のみ編集） |

## リファクタリング方針

本タスクの変更対象は `apps/web/src/features/admin/components/_dashboard/` および新規 `apps/web/src/lib/admin/dashboardGlossary.ts` に閉じており範囲が限定的である。Phase 2 設計から「最小差分・新規 CSS クラス 0・DOM contract 維持」を採用しているため大規模リファクタは発生しない。以下に整理観点を `対象 / Before / After / 理由` 形式で列挙し採否を明記する（[Feedback RT-03]）。

## 実行タスク（対象 / Before / After / 理由）

### タスク 1: StatusDistribution の LABEL 二重定義解消（採用）

横バー再設計（C4）で StatusDistribution は依然ローカル `LABEL` 定数を持ち、glossary の `MEMBER_STATUS_LABELS` と同一内容が二重定義されている。glossary を正本に統一する。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `StatusDistribution.tsx`（:15-19 `LABEL`） | ローカル `const LABEL: Record<…> = { public:"公開", member_only:"会員限定", hidden:"非公開" }` | 削除し `import { MEMBER_STATUS_LABELS } from "../../../../lib/admin/dashboardGlossary"` を参照（`LABEL[status]` → `MEMBER_STATUS_LABELS[status]`） | ラベルの SSOT を glossary に一本化。同一文言の二重定義はラベル変更時に片方だけ更新する drift 源（DRY 違反）。AC-6 の「ラベルを一元管理」を実装側でも徹底 |

> `buildAriaLabel` が参照する `LABEL`（aria-label 文字列生成）も `MEMBER_STATUS_LABELS` へ置換する。aria-label の出力文言「公開ステータス分布: 公開 12, …」は不変（同一文言の定数を参照先だけ変える）のため、Phase 6 SD-03 / SD-08 の aria-label assert は緑を維持する。

### タスク 2: 未使用となった縦棒 SVG ロジックの削除（採用）

横バーリスト化（C4）により、縦棒グラフ専用の座標計算（`VIEWBOX` / `computeBarLayout` / `BarLayout` 型の x/y/width/height）が不要になる。横バーは `widthPct = (count/maxCount)*100` のみで描画するため、旧ロジックは dead code。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `StatusDistribution.tsx`（:5-13 `VIEWBOX`） | `const VIEWBOX = { width:600, height:200, top, right, bottom, left, gap }` | 削除 | 600px 固定 viewBox は縦棒専用。横バーは `viewBox="0 0 100 8"` 固定で参照しない |
| `StatusDistribution.tsx`（:35-44 `BarLayout` 型・:50-74 `computeBarLayout`） | x/y/width/height を算出する縦棒座標計算 | 削除し、横バー用の最小算出（`maxCount` と `widthPct`）へ置換 | 縦棒の座標計算は dead code。残すと「使われていない複雑ロジック」として保守者を誤認させる |
| `StatusDistribution.tsx`（:76-79 `buildAriaLabel`） | `computeBarLayout(slices).map(bar => …)` | `STATUS_ORDER` で並べた slices から直接 `${MEMBER_STATUS_LABELS[status]} ${count}` を組む | `computeBarLayout` 削除に伴い aria-label 生成を縦棒非依存に。出力文言は不変 |

> `COLOR_VAR` / `STATUS_ORDER` は横バーの fill 色・並び順に転用するため **維持**（Phase 2 §C4 の設計どおり）。`TONE`（chip 用 soft 色）は横バー再設計後に chip を残すか否かで採否が分かれる。Phase 5 実装で chip を廃し横バーへ一本化した場合は `TONE` も dead code として削除し、chip を補助表示として残した場合は維持する（実装に合わせて判定）。

### タスク 3: ラベル直書き残存の確認（確認 → 必要時のみ編集）

C1-C3 の編集後、各コンポーネントにラベル直書きが残っていないかを確認する。

| 対象 | 確認内容 | 期待 | 採否 |
| --- | --- | --- | --- |
| `KpiGrid.tsx` | `DASHBOARD_KPI_LABELS` 参照に統一され英語直書き 0 | 直書き 0 | 確認のみ（残存あれば編集） |
| `KpiCard.tsx` | label は props 受け取り・`uppercase` 撤廃済 | 装飾クラス残存 0 | 確認のみ |
| `SchemaAlertCard.tsx` | 文言は平易日本語直書き（単発のため SSOT 化不要） | 技術語 0 | 現状維持（後述判定） |
| `ZoneDistribution.tsx` | eyebrow `会員分布`（単発）/ `DISTRIBUTION` 0 | 英語大文字 0 | 確認のみ |
| `RecentActionsTable.tsx` | `describeAuditAction` / `describeTarget` 経由で raw 表示 0 | glossary 経由 | 確認のみ |

> **SchemaAlertCard / ZoneDistribution の文言を glossary に入れるか**: これらは「単一コンポーネントの 1 回限りの文言」であり、action code / targetType のような **キー → ラベルの多対多マップ** ではない。glossary は「コードを日本語へ変換する辞書」が責務であり、単発の見出し文言まで吸い上げると glossary が UI 文言の雑多な置き場になる（SRP 違反）。よって SchemaAlertCard / ZoneDistribution の文言は **コンポーネント内直書きのまま維持**（採否: 否・現状維持）。

### タスク 4: duplicate / navigation drift の確認（確認）

リンク URL とラベルの重複・齟齬が無いことを確認する。

| 対象 | 確認内容 | 期待 | 採否 |
| --- | --- | --- | --- |
| `/admin/schema` リンク | SchemaAlertCard のみが参照・URL ハードコード重複が無いか | 単一箇所 | 確認のみ |
| `/admin/audit` リンク | RecentActionsTable のみが参照・URL 重複が無いか | 単一箇所 | 確認のみ |
| glossary import パス | 各コンポーネントの相対パス（`../../../../lib/admin/dashboardGlossary`）が一貫 | 一貫 | 確認のみ |
| `MEMBER_STATUS_LABELS` 参照 | StatusDistribution が参照。audit 画面は action/targetType のみ `dashboardGlossary` を再利用 | 単一方向参照 | 確認のみ |

> ナビゲーションリンク（`/admin/schema` / `/admin/audit`）は各コンポーネントで 1 箇所ずつのため URL 定数への抽出は過剰（YAGNI）。リンク先 URL は API ルートと対応し本タスクで変更不可（不変条件 #1）。重複が無いことの確認に留める。

## 実行手順

### ステップ 1: StatusDistribution の glossary 統一 + dead code 削除

```tsx
// Before（抜粋）
const VIEWBOX = { width: 600, height: 200, /* … */ } as const;
const LABEL: Record<StatusSlice["status"], string> = {
  public: "公開", member_only: "会員限定", hidden: "非公開",
};
function computeBarLayout(slices) { /* x/y/width/height 縦棒座標計算 */ }
function buildAriaLabel(slices) {
  const items = computeBarLayout(slices).map((bar) => `${bar.label} ${bar.count}`);
  return `公開ステータス分布: ${items.join(", ")}`;
}

// After（抜粋）
import { MEMBER_STATUS_LABELS } from "../../../../lib/admin/dashboardGlossary";
// VIEWBOX / LABEL / BarLayout / computeBarLayout を削除
const STATUS_ORDER = ["public", "member_only", "hidden"] as const; // 維持
const COLOR_VAR = { /* var(--ubm-color-ok|info|warn) */ } as const; // 維持

function orderedSlices(slices) {
  return STATUS_ORDER.flatMap((status) => {
    const s = slices.find((x) => x.status === status);
    return s ? [{ status, count: Math.max(0, s.count) }] : [];
  });
}
function buildAriaLabel(slices) {
  const items = orderedSlices(slices).map((s) => `${MEMBER_STATUS_LABELS[s.status]} ${s.count}`);
  return `公開ステータス分布: ${items.join(", ")}`;
}
// 描画は orderedSlices + maxCount から widthPct を算出（縦棒座標は使わない）
```

> aria-label の出力文言は不変（`MEMBER_STATUS_LABELS` は旧 `LABEL` と同一値）。`Math.max(0, count)` の負値クランプは維持し、全件 0 / 部分データの既存挙動（SD-07 / SD-08）を保つ。

### ステップ 2: 残存ラベル直書き・navigation drift の grep 確認

```bash
# glossary を介さないラベル直書きが残っていないか（_dashboard 配下）
grep -rn '"会員総数"\|"サイト公開中"\|"タグ未設定"\|"要対応のフォーム項目"' \
  apps/web/src/features/admin/components/_dashboard
# → DASHBOARD_KPI_LABELS 定義（glossary）と KpiGrid の参照のみがヒットすべき（直書き 0）

# StatusDistribution に旧 LABEL / VIEWBOX / computeBarLayout が残っていないか
grep -n 'VIEWBOX\|computeBarLayout\|const LABEL' \
  apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx
# → 0 件であること（dead code 削除確認）

# navigation URL の重複
grep -rn '/admin/schema\|/admin/audit' apps/web/src/features/admin/components/_dashboard \
  apps/web/src/features/admin/components/_dashboard/../
# → /admin/schema は SchemaAlertCard 1 箇所・/admin/audit は RecentActionsTable 1 箇所
```

### ステップ 3: リファクタ後の回帰確認

```bash
# 型チェック（VIEWBOX/LABEL 削除・import 変更で破壊がないこと）
mise exec -- pnpm typecheck

# リント（未使用 import / dead code の lint エラーが解消されていること）
mise exec -- pnpm lint

# focused vitest（DOM contract 不変なので既存 + 新規 spec が緑であること）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts \
  apps/web/src/features/admin/components/_dashboard \
  apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx
```

> リファクタは **DOM contract（testid / aria / role）を壊さない**: `status-distribution-list` testid・`role="img"`・aria-label「公開ステータス分布: …」・`status-bar` / `data-status` 順・HEX 不在は不変。`MEMBER_STATUS_LABELS` 参照化と縦棒 dead code 削除は描画 DOM を変えないため、Phase 6 の SD / GL ケースは緑を維持する。

## DOM contract 維持の確認表

| contract | 対象 | リファクタ後 | 保護 spec |
| --- | --- | --- | --- |
| aria-label「公開ステータス分布: …」 | StatusDistribution | 不変（参照定数のみ変更） | SD-03 / SD-08 |
| `status-distribution-list` testid | StatusDistribution | 不変 | SD-03 |
| `status-bar` / `data-status` 順 | StatusDistribution | 不変 | SD-04 |
| HEX 不在 / トークン fill | StatusDistribution | 不変（`COLOR_VAR` 維持） | SD-06 |
| `/admin/audit` リンク | RecentActionsTable | 不変 | RAT-06 |
| `/admin/schema` リンク | SchemaAlertCard | 不変 | SA-3 |
| glossary fallback | dashboardGlossary | 不変 | GL-1..7 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 設計正本 | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-2-design.md` | `MEMBER_STATUS_LABELS` 正本化方針（§C4「LABEL の正本にして二重定義を避ける」）・`COLOR_VAR` / `STATUS_ORDER` 維持 |
| テスト追加 | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-6-test-additions.md` | DOM contract 保護 spec（SD / RAT / GL） |
| 変更対象 | `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` | `LABEL` 撤廃・`VIEWBOX`/`computeBarLayout` 削除 |
| SSOT | `apps/web/src/lib/admin/dashboardGlossary.ts` | `MEMBER_STATUS_LABELS` 正本 |
| 既存先例 | `docs/30-workflows/admin-attendance-dashboard-ux/phase-8-refactor.md` | リファクタ採否判定の粒度・回帰確認手順 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 統合テスト連携

- Phase 9 QA で focused vitest を実行し、リファクタによる回帰（aria-label / testid / リンク drift）がないことを確認する。
- `MEMBER_STATUS_LABELS` 統一は参照定数の差し替えのみで DOM を変えないため、aria-label / DOM アサート系テスト（SD-03/04/06/08）に影響しない。
- 縦棒 dead code 削除は描画ロジックを横バーへ一本化済みのため、SD-05（横バー幅比例・600px 不在）の assert と整合する。
- RES-1（`/admin/audit` 画面への glossary 適用）は automation-30 レビューで同サイクル実装へ昇格した。audit 画面では `describeAuditAction` / `describeTargetType` のみを参照し、`MEMBER_STATUS_LABELS` は公開ステータス専用として維持する。

## 完了条件

- [ ] StatusDistribution のローカル `LABEL` を撤廃し `MEMBER_STATUS_LABELS`（glossary）参照へ統一した（二重定義解消・glossary が正本）。
- [ ] 未使用の `VIEWBOX` / `computeBarLayout` / `BarLayout` 縦棒 SVG ロジックを削除した（dead code 0・`COLOR_VAR` / `STATUS_ORDER` は横バー転用で維持）。
- [ ] 各コンポーネントにラベル直書き残存が無いこと（grep 確認）、SchemaAlertCard / ZoneDistribution の単発文言は SSOT 化せず現状維持の採否を記録した。
- [ ] navigation URL（`/admin/schema` / `/admin/audit`）の重複が無いこと（各 1 箇所）を確認した。
- [ ] DOM contract（testid / aria / role / リンク URL）を壊していないこと（保護 spec が緑）を確認した。
- [ ] `pnpm typecheck` / `pnpm lint` / focused vitest が全 green である（リファクタによる回帰なし）。
