# Phase 8: 実装計画（順序・ファイル table・コミット粒度）

[実装区分: 実装仕様書]

実装順序とコミット粒度を確定。後続 03.実装.md / Codex に渡す手順書。

---

## 1. 推奨実装順序

| # | ステップ | 出力物 | 検証 |
|---|---------|-------|------|
| 1 | 既存型 / fetchAuthed の存在確認 | grep ログ | `cat apps/web/src/lib/api/me-types.ts` |
| 2 | 必要なら `lib/api/me.ts` に adapter（Phase 4 §5 の判断後） | `lib/api/me.ts` | typecheck |
| 3 | `PublicVisibilityBanner.tsx`（new）+ test | new file 2 | Vitest |
| 4 | `StatusSummary.tsx` rebuild + test | M file 2 | Vitest + jest-axe |
| 5 | `RequestPendingBanner.tsx` + `RequestErrorMessage.tsx` 最小編集 + test | M file 4 | Vitest |
| 6 | `VisibilityRequestDialog.tsx` を ui-primitive `<Dialog>` に移行 + test | M file 2 | Vitest + a11y |
| 7 | `DeleteRequestDialog.tsx` を ui-primitive `<Dialog>` に移行 + test（IME ロジック含む） | M file 2 | Vitest + a11y |
| 8 | `RequestActionPanel.tsx` を Card 化 + pending 連動の disable ロジック | M file 1 + test | Vitest |
| 9 | `page.tsx` 編集: Promise.all + `<PublicVisibilityBanner>` 最上部挿入 + 4 領域配置 | M file 1 | typecheck + 手動 |
| 10 | `e2e/profile-smoke.spec.ts` への append（task-18 規約に従う） | M file 1 | Playwright |
| 11 | profile token grep pass まで HEX 除去 | grep 経由 | profile token grep gate |
| 12 | 手動 smoke（dev 起動 → ログイン → 4 領域確認） | スクリーンショット | 手動 |

---

## 2. 変更対象ファイル table（再掲）

| path | 区分 | 役割 |
|------|------|------|
| `apps/web/app/profile/page.tsx` | M | Server Component / Promise.all / `<PublicVisibilityBanner>` 追加 |
| `apps/web/app/profile/_components/PublicVisibilityBanner.tsx` | C | 公開状態 Banner (new) |
| `apps/web/app/profile/_components/StatusSummary.tsx` | M | Card + Badge + tokens で rebuild |
| `apps/web/app/profile/_components/RequestActionPanel.tsx` | M | Card 化 + pending 連動 disabled |
| `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` | M | ui-primitive `<Dialog>` 化 |
| `apps/web/app/profile/_components/DeleteRequestDialog.tsx` | M | ui-primitive `<Dialog>` 化 + IME ロジック |
| `apps/web/app/profile/_components/RequestPendingBanner.tsx` | M | tokens 適用 + 文言確定 |
| `apps/web/app/profile/_components/RequestErrorMessage.tsx` | M | tokens + `role="alert"` |
| `apps/web/app/profile/_components/__tests__/PublicVisibilityBanner.test.tsx` | C | new test |
| `apps/web/app/profile/_components/__tests__/StatusSummary.test.tsx` | M | rebuild test |
| `apps/web/app/profile/_components/__tests__/RequestActionPanel.test.tsx` | M | append |
| `apps/web/app/profile/_components/__tests__/VisibilityRequestDialog.test.tsx` | M | append |
| `apps/web/app/profile/_components/__tests__/DeleteRequestDialog.test.tsx` | M | append |
| `apps/web/app/profile/_components/__tests__/RequestPendingBanner.test.tsx` | M | append |
| `apps/web/app/profile/_components/__tests__/RequestErrorMessage.test.tsx` | M | append |
| `e2e/profile-smoke.spec.ts` | M | 8 ケース append（task-18） |
| `apps/web/src/lib/api/me.ts`（必要時のみ） | C? | adapter（Phase 4 §5） |

---

## 3. コミット粒度（推奨）

| commit | 内容 |
|--------|------|
| `feat(profile): add PublicVisibilityBanner` | step 3 |
| `refactor(profile): rebuild StatusSummary with tokens` | step 4 |
| `refactor(profile): minor edits on pending/error banners` | step 5 |
| `refactor(profile): migrate VisibilityRequestDialog to ui-primitive Dialog` | step 6 |
| `refactor(profile): migrate DeleteRequestDialog with IME-safe submit` | step 7 |
| `feat(profile): pending-aware RequestActionPanel` | step 8 |
| `feat(profile): integrate 4 regions in page.tsx` | step 9 |
| `test(profile): append e2e smoke for 4 regions and dialogs` | step 10 |
| `chore(profile): remove HEX literals to satisfy tokens gate` | step 11（差分があれば） |

> CLAUDE.md「PR 作成の完全自律フロー」を遵守。コミット・push・PR は明示指示まで実行しない。

---

## 4. ロールバック計画

| 状態 | 復旧手順 |
|------|---------|
| `me-types.ts` の型乖離が発覚 | adapter 追加（既存型は不変） |
| ui-primitive Dialog の SSR エラー | trigger を Server / 本体を `'use client'` 配下に閉じる |
| profile token grep 失敗 | 失敗箇所を grep して tokens 変数に置換、修正 commit |
| Playwright fail（fixture mismatch） | fixture mock を `apps/web/playwright/fixtures/profile.ts` に追加 |

---

## 5. 完了条件

- step 1-12 がすべて green
- 変更対象 path が §2 table 内に閉じている（範囲外への混入 0）
- コミット粒度が §3 に沿う
