**[実装区分: 実装仕様書 / 状態: spec_created]**

# Phase 10: 最終レビュー (AC judge 計画 / blocker 分類 / Phase 11 進行可否ゲート)

issue #872 [FU-LOGIN-001] Google brand 4-tone 正規アイコン導入 + `verify-design-tokens` の brand-color exempt path 拡張について、Phase 1-9 で設計した実装内容が AC を満たしうるかを judge する手順を固定する。本 Phase は実装後 (Phase 11 evidence 取得直前) に再度走らせ、verdict を `outputs/phase-11/evidence/local-validation-summary.txt` に転記する。

## 1. AC judge 計画

| AC | 判定対象 | 判定コマンド / 観点 | judge 方法 |
|----|----------|---------------------|-----------|
| AC-1 | `apps/web/src/components/ui/brand-icons/google.svg` + `GoogleBrandIcon.tsx` 存在 | `ls apps/web/src/components/ui/brand-icons/` | 2 ファイル両方が `present` |
| AC-2 | `/login` で 4-tone "G" 表示 | Playwright visual snapshot (`login.spec.ts` baseline diff) | `playwright test --update-snapshots` を 1 回実行後、再 run で diff=0 |
| AC-3 | `pnpm tsx scripts/verify-design-tokens.ts` exit 0 | brandIconExemptPaths 経由で SVG の HEX が drift 0 | exit 0 |
| AC-4 | `pnpm vitest run scripts/verify-design-tokens.spec.ts` PASS | exempt 単体テスト追加分が GREEN | PASS / 失敗 0 |
| AC-5 | `IconName` union から `"google"` 削除 + `Icon.tsx` の `case "google"` 削除 | `rg '"google"' apps/web/src/components/ui/icons.ts` 0 件 / `rg 'case "google"' apps/web/src/components/ui/Icon.tsx` 0 件 | grep 0 件 |
| AC-6 | `09b-design-tokens.md` に brand-asset exempt 章追加 | 章タイトル `## Brand-asset exempt` 等の節が存在 | `rg -n 'brand-asset' docs/00-getting-started-manual/specs/09b-design-tokens.md` ヒット |
| AC-7 | 親 FU-LOGIN-001 行 / unassigned-task spec が consumed 表記 | `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` の FU-LOGIN-001 行に `consumed (issue-872)` 等の表記追加 / `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` に `status: consumed` と `canonical_workflow: docs/30-workflows/issue-872-.../` 追加 | grep でヒット |
| AC-8 | typecheck / lint / build PASS | `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web build` exit 0 | 全 exit 0 |
| AC-9 | login visual baseline 更新後 Playwright visual PASS | `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual/login.spec.ts` exit 0 | exit 0 / diff PNG なし |

## 2. blocker / non-blocker の分類

| 分類 | 条件 | 対応 |
|------|------|------|
| **blocker (即修正)** | AC-1 / AC-3 / AC-4 / AC-5 / AC-8 のいずれか fail | Phase 11 evidence 取得を中止し、該当 Phase (3-9) の設計に戻る |
| **blocker (即修正)** | `GoogleBrandIcon.tsx` の SVG 4 path 色値が Google 公式 4-tone (#4285F4 / #34A853 / #FBBC05 / #EA4335) と一致しない | Phase 4 (実装計画) のコード snippet を見直し、色を Google brand guideline に整合 |
| **non-blocker (記録のみ)** | AC-2 / AC-9 で 1px 以下の anti-alias diff | `playwright.config.ts` の `maxDiffPixels` を 1 以内で許容済の範囲で吸収。新 baseline を commit |
| **non-blocker (FU 候補)** | 他 OAuth provider (GitHub / X / Apple) の brand-icon 未対応 | FU として `unassigned-task-detection.md` に切り出し、本 cycle は対象外 |
| **non-blocker (記録のみ)** | `09b-design-tokens.md` の他章で軽微な表記揺れ | scope outside (本 task では brand-asset exempt 章のみ touch) |

## 3. Phase 11 進行可否ゲート

Phase 11 (evidence 取得) へ進む条件:

- [ ] §1 表の AC-1 / AC-3 / AC-4 / AC-5 / AC-8 のすべてが judge PASS
- [ ] §2 blocker 行 0 件
- [ ] `git status --porcelain` で本 task scope 外のファイルが未 stage されていない (CONST_007 1サイクル完結)
- [ ] 親 workflow `login-page-prototype-alignment` の `outputs/phase-12/unassigned-task-detection.md` の FU-LOGIN-001 行を consumed 表記へ更新する diff を含む (AC-7)

上記すべて満たした場合のみ Phase 11 へ進む。1 つでも fail なら Phase 3/4 設計に戻り、修正後に本 Phase 10 を再走させる。

## 4. レビュー観点 (人間レビュー時の追加チェック)

- Google ブランドガイドライン (https://about.google/brand-resource-center/logos-list/) との 4 色対応が正しいか
- SVG path data が Google 公式 G logo の縮退ではない正規 4-tone "G" であること (グレースケール / 1-tone fallback ではない)
- `GoogleBrandIcon` component が `aria-hidden="true"` を持ち、Button の `<span class="sr-only">` 等で OAuth 文言が screen reader に伝わる構造を維持
- exempt 設計が path-glob (`apps/web/src/components/ui/brand-icons/*.svg`) と token-name prefix reserved (`--brand-google-*` 等を追加した場合) の 2 層で構成されている (brand SVG 専用ゾーンに限定し、汎用 component への HEX 開放にならない)

## 5. DoD

- [ ] §1 AC-1..AC-9 のすべてに judge コマンドが定義済
- [ ] §2 blocker 分類が明確
- [ ] §3 進行可否ゲート 4 項目が満たされ Phase 11 へ進む

## 次 Phase への引き継ぎ

Phase 11 では本 Phase の AC judge 結果 (typecheck / lint / build / verify-design-tokens / vitest / playwright visual のログ) を `outputs/phase-11/evidence/` 配下に物理ファイルとして tracked-commit する。VISUAL task のため、`outputs/phase-11/screenshots/login-google-button-4tone.png` と `login-google-button-4tone-mobile.png` の 2 枚を Playwright screenshot で取得する計画を Phase 11 に記述する。
