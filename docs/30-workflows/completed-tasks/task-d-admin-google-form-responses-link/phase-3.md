# Phase 3: 設計レビュー（ゲート）

## 判定

**PASS** — Phase 4（テスト作成）へ進めてよい。

## レビュー観点と結果

| 観点 | 評価 | 根拠 |
| --- | --- | --- |
| AC 充足性 | OK | AC-D1〜AC-D4 が Phase 2 の external 分岐設計（`<a target="_blank" rel="noopener noreferrer">` / 定数経由 href / `↗`+sr-only / active 除外）で全てカバーされる |
| 実コード整合 | OK | dev landed 実装（`SidebarNavItem.tsx` の `item.external` 分岐、`shell-config.ts` の union/interface/buildAdminGroup、`icons.tsx` の `form-responses` path）を verbatim 反映済み |
| 責務境界 | OK | 定数 / nav config / icon / 描画 の 4 レイヤで責務分離。state owner（active 判定）は内部分岐に閉じ external とは混在しない |
| 既存実装との整合 | OK | `RegisterCallout.tsx` 外部リンクパターン踏襲、`ShellIcon`/`Chip`/OKLch トークン再利用。新規 primitive ゼロ（不変条件整合） |
| セキュリティ（不変条件 #7） | OK | `rel="noopener noreferrer"` でタブナビング防止。iframe 不採用。外部静的 URL のみ（D1/API/Form 不変） |
| アクセシビリティ | OK | 外部リンクを `↗`（aria-hidden）+ sr-only「（外部リンク）」で告知。external は `aria-current`/`data-active` を出さず screen reader が active と誤認しない |
| OKLch トークン正本化 | OK | className は `var(--shell-active-bg)`/`var(--ubm-color-accent)` 等のトークン変数のみ。HEX 直書き・inline style なし |
| 後方互換 | OK | `external` は optional。未指定の既存内部項目は従来どおり `<Link>` + active 判定（回帰なし） |
| スコープ妥当性（CONST_007） | OK | nav リンク 1 項目追加で 1 サイクル完結。Form 権限設計・D1 取り込みは Task A/B/C の責務分離でスコープ外（先送りではない） |

## 設計上の決定事項（confirmed）

1. **external は `ShellNavItem` の optional フラグ**: union/interface に id/`external?` を足し `buildAdminGroup` で 1 項目化。案A 採用。
2. **icon は網羅型必須**: `ShellNavItemId` に id を足した時点で `PATHS: Record<ShellNavItemId, string>` への path 追加が型レベル必須。
3. **active 判定は内部分岐に閉じる**: external 項目は `<a>` 分岐で描画し `isNavItemActive` 由来の `data-active`/`aria-current` を出さない。
4. **href は定数経由のみ**: `FORM_RESPONSES_EDIT_URL` を import。コンポーネント/設定に URL を直書きしない（AC-D3）。
5. **判別は label + icon + ↗ + sr-only の多重**: 視覚（↗）と支援技術（sr-only）の両方で外部遷移を告知（AC-D4）。
6. **content markup を内部/外部で共有**: icon/label/badge を 1 つの `content` に集約し描画分岐間で重複させない。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `ShellNavItemId` に id を足して `PATHS` 追加を忘れ型エラー | Phase 5 で icon path 追加を必須手順化。`pnpm typecheck` で網羅型違反を機械検知 |
| external 項目に active ハイライトが付き内部項目と誤認 | external 分岐で `data-active`/`aria-current` を出さない。Phase 4 で「external に aria-current/data-active が付かない」を assert |
| URL ハードコード混入で定数の単一参照点が崩れる | href は `FORM_RESPONSES_EDIT_URL` 経由。Phase 4 で「href が定数と一致」を assert。lint/grep で `bg-[#` 系と併せ URL 直書きを検知 |
| collapsed 時に `↗` が潰れてレイアウト崩れ | `↗` は非 collapsed 時のみ描画（`item.external && !collapsed`）。collapsed 時は label/↗ ともに非表示 |
| inline style 混入で `verify:no-inline-style` 失敗 | className トークン変数で表現。`style={{...}}` を書かない |

## 次フェーズへの申し送り

- Phase 4: ① external 描画分岐（target/rel/active 除外）の検証 ② href 定数一致 ③ 内部項目の回帰（active 維持）④ collapsed 時の sr-only を `*.spec.tsx` で定義。`buildNavForRole("admin")` の純関数テストで admin group に external 項目が含まれ href/label/external が一致することを検証。
- Phase 5: landed 実装（4 ファイル編集）と spec（2 ファイル + 定数 spec）の正本記述を整合確認。本サイクルで apps 差分は新規発生させない（verify_existing）。
