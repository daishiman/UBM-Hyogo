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
