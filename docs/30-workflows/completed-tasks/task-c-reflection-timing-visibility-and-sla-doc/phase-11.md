# Phase 11: 手動テスト（Manual Test）

> `implementation_mode: verify_existing`。実装は PR #1064 / commit 745c95115 で dev に landed 済み。
> 本 Phase は新規の手動 QA 実施ではなく、**landed UI に対する評価観点と証跡所在の確認**に読み替える（runtime screenshot は user-gated → deferred）。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 11 |
| 名称 | 手動テスト検証 |
| 種別 | 検証（VISUAL / runtime screenshot user-gated） |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | Phase 10（最終レビューゲート） |

## 目的

landed UI（`/members`・`/profile` の `ReflectionTimingNote`）に対する 3 層評価観点と証跡所在を確認し、runtime screenshot を user-gated（deferred）として宣言する。

## 実行タスク

- タスク種別 VISUAL と対象 2 surface を宣言する。
- 3 層評価（Semantic / Visual / AI UX）方針を記述する。
- 主ソース = spec 7 ケース PASS を証跡として明記する。
- screenshot を即時取得しない理由（`/profile` 認証必須 + CONST_002）を明記し deferred 宣言する。
- 手動確認観点（文言 / fallback / JST / token 配色）を列挙する。

## 参照資料

- `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`
- `apps/web/src/components/public/ReflectionTimingNote.tsx`
- `apps/web/app/(public)/members/page.tsx`
- `apps/web/app/(member)/profile/page.tsx`

## 成果物

- 本 Phase 11 検証結果（VISUAL 宣言 / 3 層評価方針 / spec 7 ケース証跡 / screenshot deferred 宣言 / 手動確認観点）。

## 統合テスト連携

本タスクは公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を流用する read-only 表示で、新規 API / D1 変更を伴わない。品質担保はコンポーネント単体 spec（`ReflectionTimingNote.spec.tsx` 7 ケース）と既存 `/members`・`/profile` page 統合テスト（fail-soft 経路）で行う。runtime screenshot は user-gated（deferred）。

## タスク種別宣言: VISUAL

UI 描画あり。対象 surface は 2 面:

| surface | route | 認証 | 表示位置 |
|---------|-------|------|----------|
| `members` | `/(public)/members` | 不要（公開） | `MemberFilters` 直後 |
| `profile` | `/(member)/profile` | **必須**（会員ログイン） | `PublicConsentCallout` 後 |

## 3層評価方針

- **Semantic**: `<aside>` ランドマーク / `aria-label="Google Form 反映タイミング"` / `data-testid="reflection-timing-{surface}"` の存在と surface 別文言の正しさ。
- **Visual**: OKLch トークン配色（`var(--ubm-color-*)`）がライト・ダーク両モードで可読、`var(--ubm-radius-md)` 角丸、HEX 直書きなし（`verify-design-tokens` GREEN）。
- **AI UX**: 「フォーム反映には遅延がある」「公開一覧と本人マイページで条件が異なる」という情報が一目で伝わるか。

## 証跡（主ソース = 自動テスト）

- **主ソース**: `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx` の **7 ケース PASS**（surface 別文言 / fallback 表示 / JST フォーマット / data-testid / aria-label / token className / 非 HEX）。
- 補助: 既存 `members/page.tsx` / `profile/page.tsx` 統合テスト（fail-soft `statsUnavailable` 経路）。

## runtime screenshot: deferred（user-gated）

[Feedback 4] screenshot を即時取得しない理由:

1. `/profile` は **会員認証必須**で、staging 環境の認証ユーザー操作が前提。無認証では描画到達不可。
2. CONST_002 により staging deploy / authenticated runtime screenshot 取得は **ユーザー明示指示まで禁止**。

→ screenshot は user-gated として **deferred** 宣言。承認後に `/members`（公開）+ `/profile`（認証）両面のライト・ダーク screenshot を取得する。

## 手動確認観点（承認後に実施）

| 観点 | 現在の証跡 |
| --- | --- |
| surface 別文言が正しい（公開一覧 / 本人マイページで条件差が読める） | focused spec で PASS |
| `lastSync.responseSyncFinishedAt` 欠落時の fallback 表示が崩れない | focused spec で PASS |
| 最終同期時刻が JST フォーマット（`formatJstDateTime`）で表示される | focused spec で PASS |
| token 配色がライト・ダーク両対応で可読 | source / token class assertion で local PASS、runtime screenshot は user-gated |

## 完了条件

- [x] タスク種別 VISUAL と対象 2 surface を宣言済み。
- [x] 3層評価（Semantic / Visual / AI UX）方針を記述済み。
- [x] 主ソース = spec 7 ケース PASS を証跡として明記済み。
- [x] screenshot を即時取得しない理由（`/profile` 認証必須 + CONST_002）を明記し deferred 宣言済み。
- [x] 手動確認観点（文言 / fallback / JST / token 配色）を列挙済み。
