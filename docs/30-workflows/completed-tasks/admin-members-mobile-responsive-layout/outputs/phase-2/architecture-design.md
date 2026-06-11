# アーキテクチャ設計

## 設計方針

CSS駆動 responsive table→card（単一DOM）。詳細は [phase-2-design.md](../../phase-2-design.md) と [SSOT §3](../shared-context.md)。

## concern マップ

| concern | 対象 | 変更 | state 所有権 |
| ------- | ---- | ---- | ------------ |
| A: マークアップ | F1 MembersTable.tsx | `data-component`/`data-role`/`data-label`/`data-cell` 属性追加 | なし（純表現） |
| B: スタイル | F2 globals.css | `@media (max-width:640px)` card 化 | なし（CSS） |
| C: 検証 | F3/F4 | 属性検証 + mobile visual | なし |

## 再利用判断

- 新規コンポーネント / primitive / state / hook: **作らない**。
- 既存 `Chip` / `Button` / `MemberPublishSwitch` / `MemberAvatar` をそのまま流用。
- breakpoint は CSS 正本（JS/matchMedia 分岐なし）。

## lane（≤3）

Lane A（F1）→ Lane B（F2）→ Lane C（F3/F4、validation 直列締め）。
