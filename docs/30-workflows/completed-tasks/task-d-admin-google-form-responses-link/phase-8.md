# Phase 8: リファクタリング

> 親フェーズ: タスク仕様書（implemented_local_evidence_captured）
> 対象: admin サイドバー nav への Google Form 回答編集 外部リンク追加（dev landed / 親 PR #1064 / commit 745c95115）

## 目的

landed 実装（4 ファイル編集 + 3 spec）に対し、重複・複雑度・命名・不変条件適合をレビューし、
新規 primitive を生やさず既存 primitive 再利用で完結しているかを確認する。本サイクルは
verify_existing であり apps 差分を新規発生させないため、リファクタリングは「これ以上の構造変更は不要」
の判定（no-op）を正本記述する。

## リファクタリング観点と結果

| 観点 | 評価 | 根拠 |
| --- | --- | --- |
| 新規 primitive ゼロ | OK | 外部リンクは既存 `<a>` + `ShellIcon` + `Chip` + OKLch トークン className で構成。`SidebarNavItem` の分岐追加のみで、専用コンポーネントを新設していない（不変条件: プロトタイプ primitive 群維持） |
| markup 重複排除 | OK | icon / label / badge を `content` 変数 1 つに集約し、内部 `<Link>` 分岐と外部 `<a>` 分岐で共有。描画分岐間で JSX を複製していない |
| 既存パターン踏襲 | OK | `RegisterCallout.tsx` の `target="_blank" rel="noopener noreferrer"` 外部リンクパターンと同形。独自の外部遷移ヘルパを発明していない |
| OKLch トークンのみ | OK | className は `var(--shell-active-bg)` / `var(--ubm-color-accent)` / `var(--ubm-color-text-*)` 等のトークン変数のみ。HEX 直書き・`bg-[#xxx]`・`text-[#xxx]`・inline `style={{...}}` なし |
| URL 単一参照点 | OK | href は `FORM_RESPONSES_EDIT_URL` 定数経由（`constants/form.ts`）。`shell-config.ts` / `SidebarNavItem.tsx` に URL を直書きしていない（AC-D3） |
| 網羅型による icon 強制 | OK | `ShellNavItemId` union に `"form-responses"` を足すと `PATHS: Record<ShellNavItemId, string>` が型レベルで path 追加を要求。icon 追加漏れを構造的に防止 |
| 命名整合 | OK | id `"form-responses"` / icon key `"form-responses"` / label「Form回答」が一貫。external フラグ名 `external?` は意図が自明 |
| 責務分離 | OK | 定数（URL）/ nav config（並び・型）/ icon（path）/ 描画（分岐・a11y）の 4 レイヤに責務が分離。active 判定は内部分岐に閉じ、external 分岐へ漏れない |
| 複雑度 | OK | 描画は `item.external` の単一 boolean 分岐。ネスト・cyclomatic complexity の増加は最小限。collapsed 条件（`item.external && !collapsed`）も既存 collapsed 表現と同一規約 |

## 対象ファイル

| 区分 | パス | リファクタ判定 |
| --- | --- | --- |
| 定数 | `apps/web/src/lib/constants/form.ts` | 変更不要（単一定数 export で十分） |
| nav config | `apps/web/src/components/shell/shell-config.ts` | 変更不要（union/interface/`buildAdminGroup` は最小差分） |
| icon | `apps/web/src/components/shell/icons.tsx` | 変更不要（網羅型 `PATHS` に 1 path 追加のみ） |
| 描画 | `apps/web/src/components/shell/SidebarNavItem.tsx` | 変更不要（`content` 共有で重複なし） |

## 検証コマンド

```bash
# OKLch トークン以外（HEX / inline style）の混入がないことを確認
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
# 型・lint の健全性
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## DoD（Definition of Done）

- [x] 新規 primitive を生やしていない（既存 `<a>`/`ShellIcon`/`Chip`/トークン再利用）
- [x] icon/label/badge の markup を内部/外部分岐で重複させていない
- [x] href が `FORM_RESPONSES_EDIT_URL` 定数経由（URL 直書きなし）
- [x] HEX 直書き・inline style を導入していない（OKLch トークン className のみ）
- [x] active 判定が external 分岐に漏れていない
- [x] これ以上のリファクタは不要と判定（apps 差分を新規発生させない）

## 完了条件

完了条件は、landed 実装が新規 primitive ゼロ・markup 重複なし・URL 単一参照点・OKLch トークンのみで
構成されていることを確認し、追加のリファクタリングが不要であると正本記述したうえで、
`verify-design-tokens` / `typecheck` / `lint` が green であることが確認できた状態とする。
