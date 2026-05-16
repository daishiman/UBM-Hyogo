# parallel-06-public-pages-homepage-cta - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 新規 React コンポーネント `apps/web/src/components/public/CallToActionCTA.tsx` 追加、`apps/web/app/page.tsx` への統合、`apps/web/src/lib/constants.ts` への `FORM_RESPONDER_URL` 定数化、対応 vitest spec の新規追加を伴うコード実装タスク。ドキュメント単独では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | parallel-06-public-pages-homepage-cta |
| タスク名 | HomePage への FOR MEMBERS CTA セクション追加（prototype 準拠） |
| ディレクトリ | docs/30-workflows/parallel-06-public-pages-homepage-cta |
| 親タスク | docs/30-workflows/ui-prototype-alignment-mvp-recovery (UI prototype alignment / MVP recovery) |
| 原典 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-06-public-pages/spec.md |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 状態 | implemented_local_evidence_captured / implementation_complete_pending_pr |
| タスク種別 | implementation / VISUAL |
| 優先度 | MID |

## 目的

`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` の 136-149 行で定義されている
「FOR MEMBERS」CTA セクション（ダークバリアント + accent CTA、外部 Google Form への遷移）を、
`apps/web/app/page.tsx` (`/` HomePage) の最終セクションとして実装する。

監査結果 (spec.md) で `/`, `/register`, `/privacy`, `/terms` の 4 routes のうち改善対象は `/` のみであり、
本タスクの主スコープは HomePage への CTA 追加に限定する。`/register` はユーザー挙動を変えず、既存 fallback URL literal を共通定数参照へ置き換える内部整理のみを含む。

## スコープ

### 含む

- `apps/web/src/components/public/CallToActionCTA.tsx`（新規）: prototype 136-149 のダーク variant CTA セクション実装
- `apps/web/app/page.tsx`: MemberGrid セクションの直後に `<CallToActionCTA />` を追加
- `apps/web/src/lib/constants.ts`: `FORM_RESPONDER_URL` 定数を集約・export（HomePage / RegisterPage 両方の fallback として使う）
- `apps/web/app/(public)/register/page.tsx`: 既存 fallback responderUrl を `FORM_RESPONDER_URL` 定数参照に差し替え（重複文字列排除）
- 新規 `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx`: snapshot / a11y / external link / token 検証
- `apps/web/app/__tests__/page.spec.tsx`（既存）: CallToActionCTA がレンダリング順序末尾に含まれることを assertion 追加

### 含まない

- `/register`, `/privacy`, `/terms` の挙動変更（監査結果 OK のため）
- `apps/api` 側の endpoint 変更・追加（既存 `/public/form-preview` のみ利用）
- D1 schema 変更
- Google Form 仕様変更
- 新規 design token / primitive の追加（既存 `--ubm-color-text-primary` / `--ubm-color-surface-panel` / `--ubm-color-accent` を流用）
- responderUrl の動的取得方式変更（spec.md 付記により static fallback B 案で確定済み）

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-06-public-pages/spec.md | 原典 spec & B 案決定根拠 |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx | UI prototype 正本（136-149 行: FOR MEMBERS） |
| 必須 | apps/web/app/page.tsx | 統合先 HomePage |
| 必須 | apps/web/app/(public)/register/page.tsx | fallback 共有先 |
| 必須 | apps/web/src/styles/tokens.css | `--ubm-color-text-primary` / `--ubm-color-surface-panel` OKLch tokens 正本 |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | tokens spec 正本 |
| 必須 | CLAUDE.md | フォーム固定値（responderUrl）正本 |

## 受入条件 (AC)

- **AC-1**: `apps/web/src/components/public/CallToActionCTA.tsx` が新規作成され、`responderUrl: string` を必須 prop に持つ named export `CallToActionCTA` として exposed されている。
- **AC-2**: `apps/web/app/page.tsx` 内で `<MemberGrid />` セクションの直後（同じ root container 内）に `<CallToActionCTA responderUrl={FORM_RESPONDER_URL} />` が描画される。
- **AC-3**: `apps/web/src/lib/constants.ts` に `export const FORM_RESPONDER_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";` が定義され、RegisterPage の fallback もこの定数を参照している。
- **AC-4**: CallToActionCTA は `data-component="call-to-action-cta"` を root `<section>` に持ち、CSS 上で `background: var(--ubm-color-text-primary); color: var(--ubm-color-surface-panel);` のダークバリアントを実現している（HEX 直書きなし）。
- **AC-5**: CTA `<a>` 要素は `href={responderUrl}` / `target="_blank"` / `rel="noopener noreferrer"` を持つ。
- **AC-6**: `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` が新規作成され、snapshot / external link rel / token (`var(--ubm-color-text-primary)` 参照) / a11y (button-like accessible name) を検証する。
- **AC-7**: 既存 `apps/web/app/__tests__/page.spec.tsx`（または同等の HomePage spec）が更新され、`members.items.length > 0` fixture では `MemberGrid` の後方に CallToActionCTA が描画され、`members.items.length === 0` fixture でも CallToActionCTA が `<main>` の最終セクションとして描画されることを assertion している。
- **AC-8**: `pnpm typecheck` / `pnpm lint` / `pnpm test` がすべて GREEN。
- **AC-9**: `pnpm build`（`apps/web` 含む）が成功する。
- **AC-10**: 既存 CI gate `verify-design-tokens` が新規ファイルに対して PASS（HEX 直書き / `bg-[#xxx]` 検出ゼロ）。

## 不変条件

1. 既存 API endpoint surface (`/public/form-preview` 等) のみ利用。新規 endpoint 追加・D1 schema 変更禁止。
2. HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（OKLch tokens 正本）。
3. `apps/web` から D1 binding への直接アクセス禁止。
4. 外部リンクは `target="_blank"` + `rel="noopener noreferrer"` 必須。
5. responderUrl の正本は CLAUDE.md「フォーム固定値」セクション。`FORM_RESPONDER_URL` 変更時は CLAUDE.md と同時更新する。
6. `apps/web` 内の env 参照は `getEnv()` / `getPublicEnv()` 経由のみ（CLAUDE.md 不変条件）。本タスクは env 参照を増やさない（static 定数で完結）。

## Phase 構成

| Phase | 名称 | 状態 | ファイル |
| --- | --- | --- | --- |
| 1 | 要件定義 | completed | [phase-01.md](phase-01.md) |
| 2 | 設計 | completed | [phase-02.md](phase-02.md) |
| 3 | データモデル / 契約 | completed | [phase-03.md](phase-03.md) |
| 4 | テスト戦略 (Red) | completed | [phase-04.md](phase-04.md) |
| 5 | 実装 (Green) | completed | [phase-05.md](phase-05.md) |
| 6 | リファクタ / 品質 | completed | [phase-06.md](phase-06.md) |
| 7 | パフォーマンス / セキュリティ | completed | [phase-07.md](phase-07.md) |
| 8 | アクセシビリティ / レスポンシブ | completed | [phase-08.md](phase-08.md) |
| 9 | 統合 / 回帰 | completed | [phase-09.md](phase-09.md) |
| 10 | デプロイ / リリース準備 | completed | [phase-10.md](phase-10.md) |
| 11 | 証跡 / E2E スクリーンショット | completed | [phase-11.md](phase-11.md) |
| 12 | ドキュメント / 振り返り | completed | [phase-12.md](phase-12.md) |
| 13 | コミット / PR | pending_user_approval | [phase-13.md](phase-13.md) |

## 完了条件 (DoD)

- AC-1 〜 AC-10 すべて満たす
- CallToActionCTA component 単体 spec PASS
- HomePage snapshot に CTA セクション含む
- Prototype (`pages-public.jsx` 136-149) と視覚比較で大きな乖離がない
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` GREEN
- PR 本文に prototype との比較スクリーンショット添付
