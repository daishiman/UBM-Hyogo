# Implementation Guide

## Part 1. 中学生レベルの説明

トップページの部品（ヘッダー、統計、ゾーン紹介、タイムライン、フッター、メンバー一覧）は画面には出ていたものの、見た目を整える CSS のルールが足りなかったため、プロトタイプのような並び・余白・色合いになっていませんでした。

今回の実装では、各部品がもともと持っていた `data-component` / `data-role` / `data-stat` / `data-zone` / `data-density` という目印に対応する CSS ルールを `legacy-public.css` に追加し、`tokens.css` の変数（色・角丸・影・余白）だけを使って見た目を組み立てました。

あわせて、CTA（行動喚起）セクションだけが残していた古い `call-to-action-cta__*` というクラス名指定を、他のコンポーネントと同じ `data-role` / `data-variant` ベースに揃えました。

## Part 2. 技術者向け実装内容

### task-01: 公開トップ用 CSS rule 追加（`apps/web/src/styles/legacy-public.css`）

`@layer components` 末尾、`@media (max-width: 760px)` block の直後に `home-page-prototype-alignment task-01 (start/end)` マーカー付きの block を追加。

- `[data-page="home"]`: flex column / `max-width: 1200px` / `gap: 8px` でホーム全体の rhythm を確定
- `[data-component="public-header"]`: sticky / backdrop-filter blur / nav 横並び / `aria-current="page"` の active state
- `[data-component="stats"]`: 4 column grid（900px 未満で 2 column / 600px 未満で 1 column）、各 card に panel bg + xs shadow
- `[data-component="zone-intro"]`: 3 column grid（900px 未満で 1 column）、`border-left: 4px solid`（color は TSX 側 inline で zone tone を上書き）
- `[data-component="timeline"]`: panel container + `88px 1fr auto` grid（600px 未満で 1 column 縦並び）、既存 `[data-component="timeline"] li` の border-left を `ol > li` セレクタ + `border-left: 0` で上書き
- `[data-component="member-grid"]`: `[data-density="comfy"]` で `minmax(320px, 1fr)` / `[data-density="dense"]` で `minmax(240px, 1fr)`
- `[data-component="public-footer"]`: border-top + 2 段組（リンクリスト + copyright）

### task-02: CallToActionCTA className → data-role 統一

- `apps/web/src/components/public/CallToActionCTA.tsx`: `className="call-to-action-cta*"` / `cta-button cta-button--accent` を全廃し、`data-role="inner|copy|eyebrow|heading|body|cta-button"` / `data-variant="accent"` に置換
- `apps/web/src/styles/legacy-public.css`: 既存 `[data-component="call-to-action-cta"] .call-to-action-cta__*` 系 selector を `[data-role="…"]` 形式に書き換え。declaration は維持し見た目は不変
- `Icon name="external-link"` の className を撤去し、`[data-role="cta-button"] [data-component="icon"]` で `flex: 0 0 auto` を適用

### テスト追加

`apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` に 2 件の assertion を追加:

- `uses data-role driven structure`: `data-role="inner|copy|eyebrow|heading|body|cta-button"` と `data-variant="accent"` の存在を検証
- `does not retain legacy BEM-like className`: rendered HTML から `call-to-action-cta__` / `cta-button--accent` が消えていることを regression guard として確認

### token gate follow-up: OG image HEX removal

`pnpm verify:tokens` で既存 `opengraph-image` route の HEX 直書き 3 件が検出されたため、今回サイクル内で修正:

- `apps/web/app/opengraph-image.tsx`: gradient / text color を OKLch 値へ置換し、negative `letterSpacing` を 0 に変更
- `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`: 同上

## Part 3. 検証結果（ローカル）

| Step | Command | 結果 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | ✅ PASS |
| lint（dep-cruiser + stableKey + tsc + eslint） | `mise exec -- pnpm lint` | ✅ PASS（0 violation / 1609 modules cruised） |
| unit / component test（全 122 spec files / 873 tests） | `mise exec -- pnpm --filter @ubm-hyogo/web test` | ✅ 873 PASS / 1 skipped |
| webpack production build | `NEXT_PUBLIC_API_BASE_URL=http://localhost:8787 ENVIRONMENT=local mise exec -- pnpm --filter @ubm-hyogo/web build` | ✅ PASS |
| token gate | `pnpm verify:tokens` | ✅ PASS |
| HEX / negative letter-spacing grep | `rg -n 'letter-spacing: -|#[0-9a-fA-F]{3,8}' apps/web/src/styles/legacy-public.css docs/30-workflows/home-page-prototype-alignment/tasks/task-01-public-home-css-rules.md apps/web/app/opengraph-image.tsx 'apps/web/app/(public)/members/[id]/opengraph-image/route.tsx'` | ✅ 0 件 |
| local runtime screenshot | `node -e 'playwright chromium screenshot capture'` against `http://localhost:3001/` | ✅ desktop / mobile captured |

> `pnpm verify:tokens` は review 中に一度既存 OG image HEX で失敗したが、同 cycle で修正し PASS まで確認した。

## Part 4. 変更ファイル一覧（`git diff --stat`）

```
apps/web/src/components/public/CallToActionCTA.tsx                          |  22 +-
apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx |  21 ++
apps/web/src/styles/legacy-public.css                                       | 304 +++++++++++++++++++++-
apps/web/app/opengraph-image.tsx                                            |   8 +-
apps/web/app/(public)/members/[id]/opengraph-image/route.tsx                |   8 +-
```

skill メタデータ（quick-reference / resource-map / task-workflow-active / LOGS）は Phase 12 実装同期で更新済み。

## Part 5. Runtime Screenshot Evidence

- `outputs/phase-11/screenshots/home-desktop-2026-05-23.png`
- `outputs/phase-11/screenshots/home-mobile-2026-05-23.png`

Local runtime note: `next start` + deterministic mock API returned `/` with status 200. JavaScript 有効時は既存 `/terms` env validation の prefetch 起因エラーが出るため、今回の CSS selector / server-rendered visual validation は JavaScript 無効で取得した。

## Part 6. Known Limits / Followup

- staging deploy はユーザー承認後のみ実施する。
- `pnpm verify:tokens` は PASS 済み。今回追加 CSS と OG image route に HEX / negative letter-spacing は残していない。
- commit / push / PR 作成はユーザー明示承認後のみ（CONST_002）。
