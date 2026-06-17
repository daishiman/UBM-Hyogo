# Phase 7 — カバレッジ確認（変更範囲限定 + 受入条件マトリクス）

> 本 Phase は `_shared-context.md`（SSOT）§3 変更ファイル・§2 不変条件・§4 DoD を正本として参照する。

## 目的

Phase 5/6 の変更範囲（apps/web/src/components/public の 4 コンポーネント + `page.tsx` + `legacy-public.css`）に
限定したカバレッジを確認し、受入条件（AC-1〜AC-8）が各 spec・各 gate で検証されることを
`ac-matrix.md` でトレースする。jsdom は CSS を評価しないため、CSS（F6）は構造検証限定である旨を明記する。

## 成果物

### カバレッジ対象（変更範囲限定）
| 種別 | 対象 | カバレッジ観点 |
| --- | --- | --- |
| コンポーネント | `Stats.tsx` | 4 ラベル日本語 + 同期バッジ文言を T1 で line/branch 到達 |
| コンポーネント | `AboutUbm.tsx` | eyebrow 不在 + section-heading 日本語を T2 で到達 |
| コンポーネント | `Timeline.tsx` | eyebrow 不在 + header section-heading を T3 で到達 |
| コンポーネント | `CallToActionCTA.tsx` | eyebrow 不在を T4 で到達 |
| ページ | `app/(public)/page.tsx` | FEATURED MEMBERS overline 削除・Hero prop 非渡しを page.spec の stub で間接確認 |
| スタイル | `legacy-public.css` | CSS のため jsdom 非評価 = **構造検証限定**（Phase 11 視覚証跡で補完） |

### 受入条件マトリクス
- `outputs/phase-07/ac-matrix.md` に AC-1〜AC-8 と検証方法の対応表を置く（本書の正本）。

### 関連成果物
- `outputs/phase-07/main.md` — カバレッジ方針・jsdom 制約の説明。

## 統合テスト連携

- SSOT §4-1 の focused vitest を変更範囲のカバレッジ取得経路とする。グローバル coverage gate（80%）は本タスクの
  小規模変更（文字列置換・要素削除）では既存 baseline を割らないため、focused 実行で line/branch 到達を確認する。
- AC-7（apps/api + packages/shared diff 空）・AC-8（HEX 0 トークン維持）はコンポーネントテストでなく
  grep / `verify-design-tokens` gate で検証する（ac-matrix.md に記載）。
- jsdom が CSS を評価しないため、F6 の CSS 削除の視覚的妥当性（eyebrow 削除後の見出し上端余白）は
  AC-4 の構造検証（dead rule が消えたこと）+ Phase 11 スクリーンショット（user-gated）で二段確認する。

## 完了条件

- [ ] `ac-matrix.md` に AC-1〜AC-8 が表で列挙され、各 AC に検証方法（spec 名 / grep / gate）が対応づいている
- [ ] 変更 4 コンポーネント + page.tsx が focused vitest でカバーされる経路が示されている
- [ ] CSS（F6）が jsdom 非評価 = 構造検証限定である旨が明記されている
- [ ] AC-7（diff 空）・AC-8（HEX 0）が grep / gate 検証であることが ac-matrix に明示されている
- [ ] AC-6（英語残存 0）が SSOT §4-4 grep に対応づいている
