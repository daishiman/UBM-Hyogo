# Phase 1: 要件定義

## 目的

issue #767 の真の問題（HomePage に prototype L136-149 の dark variant CTA section が欠落）を inventory 化し、実装可能な scope に固定する。

## P50 チェック

| 項目 | 結果 |
|------|------|
| current branch に実装が存在する | **No**（CallToActionCTA.tsx 未存在を確認） |
| upstream（main / dev）にマージ済み | **No** |
| 前提タスク（parallel-03 globals.css dark variant utility）が完了済み | **Partial**（legacy-public.css に `[data-component="register-callout"]` の style はあるが、`call-to-action-cta` 用は未追加） |

→ `implementation_mode`: **`new`**（通常実装）

## carry-over 確認

- 親 spec `parallel-i04-homepage-cta/spec.md` がすでに在る → これを「発注書」として参照
- 未タスク仕様書 `unassigned-task/integration-fixes-i04-homepage-cta.md` がすでに在る
- 類似の `RegisterCallout`（register page 用 light variant）あり → API 設計の参考にする（**共通化はしない**）

## タスク分類

- **UI task / VISUAL**
- HomePage に visible section を追加するため Phase 11 でスクリーンショット capture 必須

## scope（含む）

1. `apps/web/src/components/public/CallToActionCTA.tsx` 新規作成（dark variant）
2. `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` 新規作成
3. `apps/web/src/lib/constants/form.ts` 新規作成（`FORM_RESPONDER_URL` constant）
4. `apps/web/src/lib/constants/` ディレクトリの新規作成
5. `apps/web/app/page.tsx` に CallToActionCTA を MemberGrid section の後に mount
6. `apps/web/src/styles/legacy-public.css` に `[data-component="call-to-action-cta"]` の dark variant style を追加（OKLch token のみ・HEX 禁止）

## scope（含まない）

- 新 API endpoint の追加
- D1 schema 変更
- `RegisterCallout` との共通 base component 抽出（親 spec の判断踏襲）
- prototype CSS の token 設計変更

## 受入条件（AC）

| ID | 条件 |
|----|------|
| AC-1 | `CallToActionCTA.tsx` が dark variant で render される |
| AC-2 | `apps/web/app/page.tsx` の MemberGrid section の後に mount され、`members.items.length === 0` の場合も表示される（CTA は常時表示） |
| AC-3 | external link が `target="_blank"` + `rel="noopener noreferrer"` を持つ |
| AC-4 | `responderUrl` が `CLAUDE.md` の固定値（`https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform`）と一致する。**hardcode 禁止**、`FORM_RESPONDER_URL` 定数経由 |
| AC-5 | `data-component="call-to-action-cta"` selector が root 要素に存在 |
| AC-6 | コンポーネントテストが PASS |
| AC-7 | `pnpm typecheck` / `pnpm lint` PASS |
| AC-8 | HEX 直書きなし（`verify-design-tokens` 相当 grep gate） |
| AC-9 | dev server で section render を目視確認できる |
| AC-10 | parent spec `parallel-i04-homepage-cta/spec.md` の DoD と整合 |

## 既存命名規則の分析

| 種類 | 規則 | 例 |
|------|------|----|
| component file | PascalCase + `.tsx` | `RegisterCallout.tsx`, `MemberGrid.tsx` |
| component test | `<Name>.component.spec.tsx` | `RegisterCallout.component.spec.tsx` |
| `data-component` selector | kebab-case | `register-callout`, `featured-members` |
| dark variant 識別 | `data-variant` 属性 | （未確立 → 本 task で `data-variant="dark"` を導入） |
| constants file | camelCase + `.ts` | （`lib/constants/` 未存在 → 本 task で導入） |

## 不変条件

- #5: D1 直接アクセス禁止 — HomePage は既に `/public` API 経由のため影響なし
- #8: 新規 test ファイルは `*.spec.tsx` のみ
- CLAUDE.md UI alignment：OKLch token 正本、HEX 禁止

## 成果物

`outputs/phase-1/requirements.md`（本ファイルから抜粋した要件サマリ）
