# Phase 11: 手動テスト結果（implemented local / screenshot pending）

- task_id: `public-member-common-ui-card-unification`
- タスク種別: **VISUAL**（公開層＋会員層＋login の8画面を共通レイアウト層へ移行）
- 状態: **implemented_local_visual_pending** — apps/web 実装は存在するが、スクリーンショット実測は pending。

## 証跡の主ソース

| 主ソース | 内容 | 状態 |
|---------|------|------|
| 自動テスト | focused apps/web Vitest（新プリミティブ/ButtonLink/API wrapper/既存 members page 回帰） | PASS |
| 視覚証跡 | 代表4 screenshot（home desktop/mobile, members desktop, login mobile） | present |
| 視覚証跡 | 残り planned screenshot（`screenshot-plan.json` 参照） | pending |
| staging 実機 | 認証必須画面（/profile）の visual baseline | user-gated（pending） |

## Local screenshot capture

apps/web 実装は存在するため screenshot 対象は描画可能な状態。今回レビューでは代表4枚を取得し、`phase11-capture-metadata.json` の status を `partial_local_screenshot_captured` に更新した。残り planned screenshot と staging/profile authenticated baseline は pending。

| Screenshot | Status |
| --- | --- |
| `screenshots/home-desktop.png` | present |
| `screenshots/home-mobile.png` | present |
| `screenshots/members-desktop.png` | present |
| `screenshots/login-mobile.png` | present |

## 発見・修正

| ID | 内容 | 対応 |
| --- | --- | --- |
| V-1 | `/members` が `topTags` 省略 API レスポンスで Zod parse error を表示していた | `apps/web/src/lib/api/public.ts` で `topTags: []` を境界補完し、`apps/web/src/lib/api/__tests__/public.spec.ts` に回帰 test 追加。再撮影で fallback 表示正常化を確認 |

## 実施予定テストケース（pending）

| TC | 画面 | 確認内容 |
|----|------|---------|
| TC-11-1 | `/` | Hero/Stats/About/Members/Timeline/CTA が SectionCard/ContentCard で表現される |
| TC-11-2 | `/members` | PageHeader + 絞り込み SectionCard + MemberCard(ContentCard 基盤) |
| TC-11-3 | `/members/[id]` | 全情報グループ（dl 含む）がカード化される |
| TC-11-4 | `/register` | PageHeader + 案内/フォームプレビュー SectionCard |
| TC-11-5 | `/privacy` | PageHeader + Prose 本文 |
| TC-11-6 | `/terms` | PageHeader + Prose 本文 |
| TC-11-7 | `/profile` | 全セクションが SectionCard、ボタンが ButtonLink/Button 統一 |
| TC-11-8 | `/login` | PageShell(bare) + SectionCard(auth) |
