# Phase 8: リファクタリング

**[実装区分: 実装仕様書]**

## 判定: リファクタリング **不要**

理由（CLAUDE.md "Don't add features, refactor, or introduce abstractions beyond what the task requires" に従う）:

1. **`AdminSidebarNavItem` の `dataRole` prop 拡張は見送り**
   - 公開サイトに戻る anchor は 1 箇所限定で、共通プリミティブ化のメリットなし
   - 3 行の prop / render 拡張を全 nav item に伝搬させると regression リスクが拡大
2. **`<Link>` 化見送り**
   - admin → public はレイアウト境界（`(admin)` → public）を跨ぐため full reload が安全
   - `<Link prefetch>` で public bundle を admin に巻き込むのは無駄
3. **CSS クラス抽出見送り**
   - 1 箇所のみで利用するスタイルを `globals.css` / `tokens.css` に持ち上げる必要はない
   - 既存 utility class の組み合わせで完結

## 将来 Phase 候補（**本サイクル外、CONST_007 例外**として記録）

| 候補 | 条件 | 実施時期 |
|------|------|---------|
| Sidebar 全体の primitive 化（`SidebarShell`） | 親 workflow `unified-sidebar-shell-public-and-admin` の進捗による | 親 workflow にて吸収。本タスクからは何も追加しない |

> 本タスクは「将来 task」を作らない（unassigned-task として起票しない）。`SidebarShell` 統一は既に別 workflow が存在し、責務が明確に分離されている。

## DoD

- [ ] リファクタ判定の根拠が 3 点書かれている
- [ ] 将来 Phase 候補が「不要 or 既存 workflow に吸収」と明示されている
- [ ] 本サイクル内で着手する追加リファクタは無いことが確認されている
