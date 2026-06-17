# 実装ガイド — 管理ダッシュボード 日本語化＋カード型UI/UX是正

task_id: `admin-dashboard-jp-clarity-and-card-ux` / workflow_state: `implemented_local_runtime_pending`

## Part 1: やさしい説明（はじめての人向け）

### なぜ必要か

この管理画面を使うのは、プログラミングをしない支部会の運営者です。ところが今のダッシュボードは、英語の見出し（`Total members` など）や「スキーマ」「alias」といった専門用語が並んでいて、「これは何を表しているの？」と迷ってしまいます。お店のレジ画面が全部英語と専門記号だったら、店員さんが困るのと同じです。だから、誰が見ても日本語でわかるように直します。

### 何が読みにくいか（たとえ話）

- **英語の見出し**: 棚のラベルが外国語で貼ってある状態。「会員総数」と日本語で貼り直します。
- **直近のアクションのはみ出し**: 細長い表に内容を詰め込みすぎて、文字が箱からはみ出している状態。1 件ずつを「カード（小さな付箋）」に分けて、長い文字は「…」で切って箱に収めます。
- **公開ステータスの横長グラフ**: 横にだらんと伸びた棒グラフで、ぱっと見て分かりにくい状態。短い横棒のリストにして、コンパクトに並べ直します。

### 何をするか

1. 英語の見出しを日本語にする（会員総数 / サイト公開中 / タグ未設定 / 要対応のフォーム項目）。
2. 専門用語をやさしい言葉に言い換える（「スキーマ未解決」→「要対応のフォーム項目」など）。
3. 「直近のアクション」を、誰が・いつ・何をしたかが一目で読めるカードのリストにする。
4. 「公開ステータス」を、短い横棒のコンパクトなリストにする。

すべて「画面の見せ方」を直すだけで、保存されているデータそのものは一切変えません。

### 専門用語セルフチェック（やさしい言い換え）

| 専門用語 | やさしい言い換え |
| --- | --- |
| スキーマ（schema） | フォームの設問とデータ保存先の対応づけ |
| alias | 設問の結び直し（言い換え） |
| KPI | 主要な数字（会員数など） |
| トークン（design token） | 色をまとめて管理する「色の名前」 |
| コンポーネント | 画面を作る部品 |
| truncation | 長い文字を「…」で切ること |

## Part 2: 技術詳細（開発者向け）

### 全体方針

`apps/web` 表現層のみの変更。API（`/admin/dashboard`）の `AdminDashboardView` / `StatusSlice` 契約は不変（不変条件 #1 #5）。日本語化は新規 SSOT `dashboardGlossary.ts` の表示変換で行い、色は OKLch トークン（`--ubm-color-*`）のみ使用する（HEX 直書き禁止・`verify:tokens` gate）。

### 変更ファイル一覧

| 種別 | パス |
| --- | --- |
| 新規 | `apps/web/src/lib/admin/dashboardGlossary.ts` |
| 新規(test) | `apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts` |
| 新規(test) | `apps/web/src/features/admin/components/_dashboard/__tests__/{KpiGrid,SchemaAlertCard,ZoneDistribution}.spec.tsx` |
| 編集 | `_dashboard/{KpiGrid,KpiCard,SchemaAlertCard,ZoneDistribution,StatusDistribution,RecentActionsTable}.tsx` |
| 更新(test) | `_dashboard/StatusDistribution.spec.tsx`, `components/__tests__/RecentActionsTable.spec.tsx` |

### glossary 型・シグネチャ

```ts
export const DASHBOARD_KPI_LABELS: {
  readonly totalMembers: string; readonly publicMembers: string;
  readonly untaggedMembers: string; readonly unresolvedSchema: string;
};
export const MEMBER_STATUS_LABELS: Record<"public" | "member_only" | "hidden", string>;
export function describeAuditAction(code: string): string;   // 未登録は raw コード返却
export function describeTargetType(type: string): string;     // 未登録は raw 値返却
export function describeTarget(targetType: string, targetId: string | null): string;
```

### コンポーネント Before→After（要点）

| 対象 | Before | After |
| --- | --- | --- |
| KpiGrid | `label="Total members"` 英語直書き ×4 | `DASHBOARD_KPI_LABELS.*` 参照 |
| KpiCard | `text-xs uppercase tracking-wide` | `text-xs font-medium`（uppercase 撤廃） |
| SchemaAlertCard | 「スキーマ未解決 / alias / schema 管理を開く」 | 「要対応のフォーム項目 / 対応づけが必要 / フォーム項目の対応づけを開く」 |
| ZoneDistribution | eyebrow `DISTRIBUTION` | `会員分布` |
| RecentActionsTable | 4 列 `<table>` + raw code/target | `<ul>` カードリスト + `describeAuditAction`/`describeTarget` + `truncate` |
| StatusDistribution | 600px 固定 SVG 縦棒 | `<ul role="img">` コンパクト横バー（`viewBox="0 0 100 8"`）。`aria-label` 維持 |

### トークン使用例

```tsx
className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-bg)] p-3"
// バー色: fill={s.colorVar}  // s.colorVar = "var(--ubm-color-ok|info|warn)"
```

`--ubm-color-surface-subtle` は tokens.css に存在しないため不使用。沈めた面は `--ubm-color-bg` を使う。

### エッジケース・既知制限

- 未登録の action code / targetType は raw 文字列をそのまま表示（情報を握り潰さない）。
- `actorEmail` が `null` のときは `—` 表示（既存挙動維持）。
- `targetId` が `null` のときは対象ラベルのみ表示。
- jsdom は CSS を評価しないため、`truncate`（ellipsis）・横バー幅・はみ出し解消の最終確認は Phase 11 staging screenshot（実装後・user-gated）で行う。
- 既存テスト契約（aria-label「公開ステータス分布: …」/ HEX 禁止 `#[0-9a-fA-F]{6}` / `/admin/audit` リンク / axe violations 0）は維持する。

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_dashboard \
  apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx \
  apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts
git diff --name-only -- apps/api   # 空であること（AC-8）
```

## 視覚証跡

VISUAL タスクだが `implemented_local_runtime_pending` 段階のため、実スクリーンショットは未取得（`staging_visual_pending_user_gate`）。撮影計画は `outputs/phase-11/screenshot-plan.json` / `phase11-capture-metadata.json` を参照。canonical 名は `admin-dashboard-desktop.png` / `admin-dashboard-narrow-mobile.png` / `recent-actions-card-list.png` / `status-distribution-bars.png`。実装完了後に staging（user-gated）で取得し、`outputs/phase-11/screenshots/` に配置する。
