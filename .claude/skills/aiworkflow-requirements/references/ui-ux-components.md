# コンポーネント UI/UX ガイドライン

## 概要
この親仕様書は UI/UX surface の入口であり、機能別詳細と履歴は child companion へ分離した。

## 仕様書インデックス
| ファイル | 役割 | 主な見出し |
| --- | --- | --- |
| [ui-ux-components-core.md](ui-ux-components-core.md) | core specification | 概要 / ドキュメント構成 / コンポーネント設計概要 / デザイン原則サマリー |
| [ui-ux-components-details.md](ui-ux-components-details.md) | detail specification | 仕様書作成済みタスク（spec_created） |
| [ui-ux-components-history.md](ui-ux-components-history.md) | history bundle | 完了タスク / SkillCenterView 関連未タスク / 変更履歴 / 関連ドキュメント |

## 利用順序
- まずこの親仕様書で対象 child companion を選ぶ。
- 実装や契約の詳細は `core` / `details` / `advanced` 系を読む。
- 完了タスク、変更履歴、補助情報は `history` / `archive` 系を読む。

## 関連ドキュメント
- `indexes/quick-reference.md`
- `indexes/resource-map.md`

## Wave 0 UI primitives baseline（2026-04-26）

`apps/web/src/components/ui/` に以下の primitive を配置する。

`Chip / Avatar / Button / Switch / Segmented / Field / Input / Textarea / Select / Search / Drawer / Modal / Toast / KVList / LinkPills`

全 primitive は `apps/web/src/components/ui/index.ts` から barrel export する。`Modal` と `Drawer` は Escape close、初期 focus、Tab focus loop、close 後 focus restore を最低基準とする。`ToastProvider` は client component とし、通知領域に `aria-live="polite"` を置く。

`apps/web/src/lib/tones.ts` は `ChipTone`、`zoneTone(zone: string): ChipTone`、`statusTone(status: string): ChipTone` を提供する。

## task-10 UI primitives integration contract（2026-05-09）

`docs/30-workflows/task-10-ui-primitives-spec/` は Wave 0 baseline の破棄ではなく、既存 `apps/web/src/components/ui/` と task-10 contract の統合実装である。既存 PascalCase files と barrel export を維持し、後続 task-11..17 は `@/components/ui` から import する。

| 区分 | primitive | 方針 |
| --- | --- | --- |
| 既存拡張 | `Button / Avatar / Field / Input / Select` | 既存 props を後方互換で維持し、task-10 props を optional に追加 |
| 新規追加 | `Card / Badge / Sidebar / Stat / EmptyState / Banner` | task-10 contract の不足分として追加 |
| 維持 | `Chip / Switch / Segmented / Textarea / Search / Drawer / Modal / Toast / KVList / LinkPills` | 削除せず Wave 0 baseline として保持 |

task-10 contract は 11 primitive、Wave 0 baseline は 15 primitive、prototype full catalog は 21 primitive として語彙を分離する。後続 task-11..17 は task-10 の 11 primitive contract と Wave 0 維持 export の交差を `@/components/ui` barrel から使う。09c の 21 primitive catalog は full prototype reference であり、task-10 の完了条件ではない。

状態語彙は `implemented-local-build-blocked / implementation / VISUAL_ON_EXECUTION / existing-ui-integration`。typecheck / lint / focused test / coverage / Next build は PASS。`build:cloudflare` は OpenNext esbuild host `0.25.4` / binary `0.21.5` mismatch で blocker のため、runtime screenshot / axe は blocker 解消後に取得する。現時点で screenshot PASS は主張しない。
