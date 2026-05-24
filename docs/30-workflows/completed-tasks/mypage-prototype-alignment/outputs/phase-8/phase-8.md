# Phase 8: リファクタリング

> workflow: mypage-prototype-alignment
> 目的: prototype 準拠の再構成にあたって発生する重複・bare HTML 残骸・navigation drift を削る。**公開 props（インターフェース）は不変**を保ち、挙動を変えない構造改善のみを行う。

## 8.0 方針（[Feedback RT-03]）

- 変更は `対象 / Before / After / 理由` テーブル形式で記録する。
- インターフェース（各 component の公開 props）は変更しない。型・export 名は維持し、内部実装と markup のみ整理する。
- API surface（`apps/api/src/routes/me/*`・`apps/web/app/api/me/*`）には一切触れない。
- 色は OKLch tokens のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を残さない。
- 新規 primitive を生やさず、既存 `apps/web/src/components/ui/` の合成に閉じる。

## 8.1 重複削除 / 共通化

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `renderValue`（field 値の表示変換） | `ProfileFields.tsx` 内にローカル関数として閉じている | `_lib/profile-summary.ts` または `_lib/render-field-value.ts` へ純粋関数として切り出し、`ProfileFields` / `ProfilePreview` の双方から import | プレビュー側でも同じ値変換が必要になり、ロジックの二重実装を防ぐ。純粋関数化で Phase 7 の line/branch 100% 測定対象に乗せる |
| visibility 件数の集計 | 各 component が `sections` を都度走査する懸念 | `deriveVisibilityCounts(sections)` に集約し、`VisibilitySummary` のみが呼ぶ | 集計ロジックの単一化。state ではなく導出値に統一（stale 排除） |
| displayName / subtitle / chips 抽出 | page.tsx や ProfilePreview に stableKey ハードコードが散る懸念 | `pickProfileSummary(sections)` に集約し stableKey 参照を 1 箇所に閉じる | 不変条件 #6（stableKey 経由）の単一化。欠損時空表示も 1 箇所で防御 |
| tokens class の散在 | page-head / Card / Stat grid の class 名がコンポーネントごとに重複・揺れ | globals.css 既存 utility（`page-head` / `grid-3` 等）に揃え、独自 class を新設しない | navigation/visual の drift 削減。新規 utility を増やさない |

## 8.2 bare HTML 残骸の除去

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| StatusSummary | `<section><h2>アカウント状態</h2><KVList .../></section>` の bare semantic + 旧 `<dl>` 相当の素描画 | `Banner`（tone 連動）+ 補助 `KVList` を Card surface 内に再構成。旧 `<h2>` 直書き見出しは tokens の eyebrow/見出し class へ | prototype の status banner と整合。bare `<dl>` 直書き残骸を残さない |
| ProfileFields | `<section><h2>…</h2>` + section ごと `<div><h3>…</h3><dl>…</dl></div>` の素 HTML | `Card` + section ごと `KVList` グループへ置換。素の `<dl>/<dt>/<dd>` は KVList primitive へ寄せる | bare HTML の視覚未整備を解消し prototype の Card/KVList へ統一 |
| EditCta（旧 plain `<a>`） | `<a href={editResponseUrl} …>Google Form で編集する</a>` の plain anchor（取得中は `<span aria-disabled>`） | `EditCta.client.tsx` で `Button` primitive + `RevalidateModal` を内包。`editResponseUrl ?? fallbackResponderUrl` で常に有効リンクとし、`aria-disabled` の「取得中」span を撤去 | 編集導線を prominent button + Modal へ昇格。旧 plain `<a>` 実装を置換（Phase 1 §1.4 の課題） |
| RequestActionPanel | 素の `<button>` 群 + `<section><h2>` | danger-zone Card（border tone=danger soft）+ `Button` primitive + eyebrow「DANGER ZONE」。POST 経路・dialog 子は不変 | prototype の danger-zone styling へ整備。挙動（POST endpoint / dialog open state）は変更しない |
| MemberHeader | `<a href="/profile">マイページ</a>` テキストリンク 1 本 + SignOutButton | brand + `nav`（マイページ / 公開ページ）+ SignOutButton。`data-testid="member-header"` と既存 href は維持 | global 動線の drift（リンク 1 本のみ）を解消 |

## 8.3 EditCta の旧 plain `<a>` 実装の置換確認（重点項目）

| 確認項目 | PASS 基準 |
|----------|-----------|
| 旧 `EditCta.tsx`（plain `<a>` / `aria-disabled` span）が `EditCta.client.tsx` へ置換された | 旧ファイルが git delete されている **OR** stub 化（`export {}`）かつ live import ゼロ |
| page.tsx が新 `EditCta.client` を import している | `import { EditCta } from "./_components/EditCta.client"` 等で配線済み |
| 旧実装への live import が残っていない | `grep -rn "from \"./_components/EditCta\"" apps/web/app/profile/` で旧パス参照が 0 件（新パスのみヒット） |
| `data-cta="edit-response"` 等の旧 testid が `describe.skip` 含め残存していない | `grep -rn "edit-response-disabled" apps/web/` で 0 件（[FB-TASK-01/02]） |

> 削除確認は「git delete OR stub 化かつ live import ゼロ」を PASS 基準とする（[FB-UI-02-1]）。stub 化を選んだ場合は `grep -rn "import.*旧ファイル名" apps/web/` の 0 件結果を Phase 9 の証跡に残す。

## 8.4 navigation drift 削減

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `/profile` への global 動線 | MemberHeader のテキストリンク 1 本のみ | MemberHeader nav（マイページ / 公開ページ / ログアウト）+ ProfileHeader「公開ページを見る」（個別 `/members/[memberId]`） | 動線の単線化を解消。MemberHeader は一覧 `/members`、ProfileHeader は個別公開ページと役割分離 |
| 「公開ページを見る」リンク | （未実装） | publishState 連動: `public` → 有効リンク `/members/[memberId]` / `member_only`・`hidden` → `aria-disabled` ボタン | publishState 別の到達可否を 1 箇所で決定し、リンク先の揺れを防ぐ |

## 8.5 インターフェース不変の保証

リファクタリング後も以下の公開 props は変更しないことを確認する（変更すると Phase 4/6 のテストと page.tsx 配線が壊れる）。

| component | 維持する公開 props |
|-----------|--------------------|
| StatusBanner（StatusSummary） | `statusSummary`, `authGateState` |
| VisibilitySummary | `sections` |
| ProfilePreview | `memberId`, `displayName`, `subtitle?`, `chips?` |
| ProfileFields | `sections` |
| EditCta.client | `editResponseUrl`, `fallbackResponderUrl`, `variant?` |
| RevalidateModal | `open`, `onClose`, `editResponseUrl`, `fallbackResponderUrl` |
| RequestActionPanel | `publishState`, `rulesConsent`, `pendingRequests?`（**既存のまま不変**） |
| MemberHeader | （props なし・`data-testid="member-header"` 維持） |

> `RequestActionPanel` の POST body schema・dialog open state・既存 `data-testid`（`request-action-panel` / `open-hide-dialog` 等）は本 Phase で変更しない。styling のみを danger-zone へ整える。

## 8.6 完了条件

1. §8.1〜§8.4 の `対象/Before/After/理由` がすべて適用され、重複・bare HTML 残骸・navigation drift が解消された。
2. EditCta の旧 plain `<a>` 実装が置換され、§8.3 の live import ゼロが確認できた。
3. §8.5 の公開 props が不変であることを `mise exec -- pnpm typecheck` で確認した。
4. tokens class のみで配色され、HEX 直書きが 0 件（Phase 9 の verify-design-tokens で確定）。
5. リファクタリング後も Phase 6 の targeted test が GREEN を維持している。
