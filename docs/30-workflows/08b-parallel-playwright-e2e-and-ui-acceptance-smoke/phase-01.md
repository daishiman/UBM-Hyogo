# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 8 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | なし（Wave 8 並列開始） |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

`docs/00-getting-started-manual/specs/09-ui-ux.md` の検証マトリクス（10 画面 × 2 viewport = 20 セル相当）を Playwright で完全網羅し、AC-1〜8 を全 green にする。screenshot evidence + a11y assertion (WCAG 2.1 AA) を恒久的な受入証跡として残す。

## 真の論点 (true issue)

- E2E は **実 D1 + 実 Workers** で走らせるか、それとも **mock + storybook 的 placeholder** で走らせるか。本タスクは「local 起動の Workers (wrangler dev) + local D1 + seed 済み fixture」で走らせ、staging deploy 前に green を担保する方針を採用（実環境近似 + 無料枠両立）。
- AuthGateState 5 状態 (input / sent / unregistered / rules_declined / deleted) の **out of scope state を `/no-access` という独立 URL** に移すか、`/login` 内で出し分けるか。仕様 (不変条件 #9) は後者なので、`/no-access` への redirect が **発生しないこと** を E2E で verify する。
- screenshot evidence の枚数が肥大化しがちなので、**画面 × viewport の格子状 + 主要操作後の差分** に限定し、30 枚以上 50 枚以下を目標。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | 06a public pages | `/`, `/members`, `/members/[id]`, `/register` 実装 | E2E navigation scenario |
| 上流 | 06b member pages | `/login`, `/profile` 実装 | AuthGateState 5 状態の verify |
| 上流 | 06c admin pages | `/admin/*` 5 画面実装 | admin 5 シナリオ |
| 上流 | 07a tag queue | `/admin/tags` queue 操作 | tag resolve E2E |
| 上流 | 07b schema alias | `/admin/schema` alias 操作 | alias E2E |
| 上流 | 07c attendance | `/admin/meetings` attendance 操作 | attendance + 二重防御 E2E |
| 下流 | 09a staging smoke | E2E green を staging deploy 前提 | Playwright report |
| 下流 | 09b release runbook | CI workflow を release runbook に組込 | e2e-tests.yml |

## 価値とコスト

- **初回価値**: 09-ui-ux.md の検証マトリクスを「人間の chrome chrome dev tools 目視」から「Playwright pass / fail」へ機械化。後続の UI 改修が AuthGateState やキー導線を壊した瞬間に CI で検知。
- **初回で払わないコスト**: visual regression snapshot diff（一部のみ #15 attendance UI）、staging URL での Playwright（09a 担当）、production 負荷 test。
- **トレードオフ**: ローカル起動コストが Vitest より重い（chromium / webkit 起動 ~ 5 sec）。代わりに 1 度に画面 + a11y + 操作を verify でき、unit test では拾えない layout / focus / aria-* 違反を捕まえる。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 不変条件 #4 / #8 / #9 / #15 を E2E test として恒久固定するか | PASS | 各不変条件に対応する scenario を 1 つ以上記述（profile に編集 form 不在 / reload 後 state 維持 / `/no-access` 不在 / attendance 二重防御） |
| 実現性 | local Workers + Playwright で実装可能か | PASS | wrangler dev + Next.js dev server + chromium 起動、無料枠運用、CI も GitHub Actions ubuntu-latest で動作 |
| 整合性 | 上流 06/07 wave の AC と矛盾しないか | PASS | 上流 6 task の URL 一覧と view model schema を artifacts.json で再列挙、検証マトリクス全 row と URL 1:1 |
| 運用性 | CI で必ず実行・rollback で test 戻し可能か | PASS | `.github/workflows/e2e-tests.yml` placeholder で確実、Playwright HTML report を artifact 保存 |

## 実行タスク

- [ ] 上流 6 task の URL 一覧と view model を artifacts.json に列挙
- [ ] AC-1〜8 を quantitative に記述（10 画面 × 2 viewport = 20 セル / 5 AuthGateState / 6 検索パラメータ / screenshot 30 枚以上 / WCAG 違反 0 件）
- [ ] 真の論点（local Workers vs mock）と非採用案を記録
- [ ] 4 条件評価の根拠を埋める

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09-ui-ux.md | 検証マトリクス |
| 必須 | docs/00-getting-started-manual/specs/05-pages.md | URL 一覧 |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | 検索 / density |
| 必須 | docs/00-getting-started-manual/specs/11-admin-management.md | admin 5 画面 |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | AuthGateState 5 状態 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-2-design.md | Wave 8b 詳細 |

## 実行手順

### ステップ 1: 上流 URL / 検証マトリクス引き取り

- 06a/b/c の URL 一覧、07a/b/c の admin 操作 URL を artifacts.json `ui_routes` に列挙
- 09-ui-ux.md の検証マトリクス（screen × viewport × focus / aria / layout）を 1 表として再構成
- 不足あれば上流に open question

### ステップ 2: AC-1〜8 quantitative 化

- AC-1: 10 画面 × desktop + mobile = 20 セル green
- AC-2: 公開導線 4 シナリオ × 2 viewport = 8 pass
- AC-3: AuthGateState 5 状態すべて `/login` 内で表示観測、`/no-access` URL の 404 / 不在 verify
- AC-4: editResponseUrl ボタン押下 → Google Form viewform への遷移観測
- AC-5: 管理 5 画面 × 認可境界 (admin / member / anonymous) = 15 セル
- AC-6: 検索 6 パラメータ (q / zone / status / tag / sort / density) × 代表 5 ケース
- AC-7: screenshot evidence 30 枚以上の配置規約と実行ゲートを定義（10 画面 × desktop + mobile + 主要操作後）
- AC-8: `@axe-core/playwright` で WCAG 2.1 AA 主要違反 0 件

### ステップ 3: 4 条件評価と handoff

- 4 条件記入
- Phase 2 へ「local Workers / wrangler dev / D1 seed の手順」「Playwright runner image」「viewport 定義」を open question

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | URL × 検証マトリクス、test directory layout |
| Phase 4 | AC × scenario × viewport × screenshot 対応 |
| Phase 7 | AC マトリクス |
| Phase 10 | GO 判定 |

## 多角的チェック観点

- 不変条件 **#4**: profile 画面に **編集 form がない** ことを E2E で verify（理由: D1 override で本人プロフィール本文を編集しない）
- 不変条件 **#8**: localStorage を route / session の正本にしない（理由: reload 後の state 維持を verify、状態は D1 / cookie 由来）
- 不変条件 **#9**: `/no-access` URL の 404 / 不在を verify、`/login` 内で AuthGateState 5 状態を出し分け（理由: 専用画面に依存しない）
- 不変条件 **#15**: meeting attendance UI で重複登録 → toast、削除済み除外（理由: 07c の二重防御を UI 側で観測）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 URL / 検証マトリクス引き取り | 1 | pending | 6 task |
| 2 | AC-1〜8 quantitative 化 | 1 | pending | 20 セル / 5 状態 / 6 パラメータ / 30 枚 / WCAG |
| 3 | 真の論点記録 | 1 | pending | local Workers vs mock |
| 4 | 4 条件評価 | 1 | pending | — |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物 |
| メタ | artifacts.json | phase 1 status |

## 完了条件

- [ ] AC-1〜8 quantitative 化済み
- [ ] 真の論点 + 4 条件評価記録
- [ ] Phase 2 への open question 明記

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（権限 / 無料枠 / drift）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 1 を completed

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ: local Workers / D1 seed 手順、Playwright runner image、viewport 定義、screenshot 命名規約
- ブロック条件: AC-1〜8 quantitative 化未完なら Phase 2 不可
