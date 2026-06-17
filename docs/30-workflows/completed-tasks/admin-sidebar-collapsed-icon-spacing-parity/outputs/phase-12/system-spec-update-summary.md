# System Spec Update Summary

## Step 1 — 新規インターフェース / 型の追加有無

なし。本タスクは `apps/web` の Tailwind className 文字列リテラル内の utility 変更のみで、
公開インターフェース・props・型・DOM 構造・API endpoint surface はいずれも不変。

| 対象 | 変更 |
| --- | --- |
| `SidebarNavItemProps` / `SidebarShellProps` | 不変 |
| `ShellIcon` / `Stroke`（icons.tsx） | 不変 |
| data 属性（`data-shell-block` 等）/ aria | 不変 |
| API / D1 / Google Form schema | 非接触 |

## Step 2 — 正本 spec（aiworkflow-requirements / specs）更新要否

**仕様正本は N/A、workflow ledger は同期対象**。

判定根拠:

- 内部 className（視覚リズム）変更のみで、新規の型・契約・インターフェースを導入しない。
- `docs/00-getting-started-manual/specs/*.md` が規定する API schema / 認証 / DB 構成いずれにも
  影響しない（表現層の余白調整）。
- OKLch トークン正本（`tokens.css` / `design-tokens.md`）にも変更なし。色は不変、
  HEX 直書きも追加しない（AC-6）。
- したがって `docs/00-getting-started-manual/specs/**` の更新は不要。
- 一方で、本ワークフローは実装済みローカル証跡へ昇格したため、
  aiworkflow-requirements の workflow ledger / artifact inventory / indexes には同期する。
