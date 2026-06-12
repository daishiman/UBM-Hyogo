# Unassigned Task Detection

## current 未タスク

**0 件。** 本タスクで完結する。

- 真因（collapsed icon-box `h-10` の余白）に対する修正は SidebarNavItem.tsx / SidebarShell.tsx の
  2 箇所 + 回帰テストで閉じる。
- AC-1〜AC-7 がすべて本ワークフロー内で充足し、追加で別タスク化が必要な残件はない。

## baseline candidate（候補記載のみ・起票せず）

| 候補 | 内容 | 起票しない理由 |
| --- | --- | --- |
| OOS-1 | `SidebarBrand.tsx:20` ロゴ箱 `collapsed ? "h-10 w-10" : "h-8 w-8"` の統一 | 独立プリミティブ。border 区切りで nav 行間隔に非寄与。統一の必要性が未確定 |
| OOS-2 | `SidebarUserMenu.tsx:56` アバター箱 `collapsed ? "inline-flex h-10 w-10 ..."` の統一 | 同上。footer 別領域・視覚リズムへの実害が未確認 |

> OOS-1 / OOS-2 はいずれも「アイコンのみ collapsed 時の箱サイズ」という同系統だが、nav 行ピッチへの
> 寄与がなく、デザイン上意図的に大きい箱の可能性もある。必要性が未確定のため候補記載に留め、起票しない。

## 関連タスク差分確認（FB-CANCEL-004-2）

| 確認 | 結果 |
| --- | --- |
| 同一 collapsed icon-box を扱う別ブランチ / open issue | 既存に重複対応中のものなし（related_issue=null） |
| profile 観測性タスク（スクショ内「セッション情報を取得できませんでした」） | 別タスクで進行（OOS-4）。本タスクと責務分離済・重複起票不要 |
| sidebar shell 系の進行中ワークフロー | 本タスクと干渉する未完タスクなし |
