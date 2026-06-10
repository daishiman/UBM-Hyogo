# lessons-learned: dev sync 後に「text 非衝突だが semantic に壊れる」CI 失敗 2 系統 — nav render-count test の追従漏れ + sibling form 追加による strict-mode locator 曖昧化（2026-06-10 `feat/admin-tag-definition-unify-create-and-catalog-fix`）

## 文脈

`feat/admin-tag-definition-unify-create-and-catalog-fix`（admin タグ定義 UI を 1 画面統合・`tag-catalog` nav 削除・`TagDefinitionCreateForm` 新設）へ dev 6 コミットを取込（behind 6 / union 5、全て aiworkflow-requirements 配下・[[20260610-dev-sync-admin-tag-definition-unify-behind6-ahead2-union5-aiworkflow-only-skillmd-conflict]]）。skill index の union 衝突は `pnpm sync:resolve` 1 パスで解消し typecheck / lint 緑だったが、**push 後 CI で 2 系統が fail**。両方とも `git` の text conflict には現れず（auto-merge 成功扱い）、**semantic な不整合**だった。

## L-TAGUNIFY-CI-001: coverage-gate-shard(web) — nav render-count test が旧期待値のまま取り残される

- 症状: `coverage-gate-shard (web)` が `2 failed | 1776 passed`。`SidebarShell.spec.tsx` / `SidebarShell.server.spec.tsx` が `expected …(15) to have a length of 16`。
- 真因: feature 実装が admin nav を **12→11 に削減**（`tag-catalog` 削除 + `tag-master` ラベル "タグ管理"→"タグ定義"）。**logic test（`shell-config.spec.ts`）は `admin.items` を 11 期待 + `not.toContain("tag-catalog")` へ正しく更新済**だったが、**render-count test 2 件（`data-shell-block="nav-item"` を `toHaveLength(16)` で数える）の追従を漏らした**。dev 側はこの 2 test を 16 のまま保持しており、auto-merge は feature の config（11 item）と dev の test（16 期待）を**矛盾したまま結合**した。
- 確定則: **「同じ不変条件（nav item 数）を検証する test が logic-level と render-level の 2 箇所にある場合、片方だけ更新すると text 非衝突で CI の別 shard が落ちる」**。`shell-config.spec.ts`（純関数 `buildNavForRole` の items 数）と `SidebarShell*.spec.tsx`（実 DOM の `nav-item` 数）は同じ 3+1+N 不変条件を別レイヤで二重検証している。**nav を増減したら `grep -rn "toHaveLength\|nav item\|3+1+" components/shell/__tests__` で render-count test も同時に更新する**。
- 解消: render-count test 2 件を `16→15` / `3+1+12→3+1+11` へ追従（config = feature 意図が正本）。

## L-TAGUNIFY-CI-002: e2e(desktop-chromium) — sibling form 追加で `getByLabel` が strict-mode violation

- 症状: `e2e (desktop-chromium)` が `1 failed | 157 passed`。`admin-tag-master-code-edit-ui.spec.ts`（issue-1116・dev 由来）が `locator.fill: strict mode violation: getByLabel('コード') resolved to 2 elements`。
- 真因: feature が `/admin/tag-master` ページへ **新フォーム `TagDefinitionCreateForm`（`aria-label="タグ作成"`・`label="コード"` 入力）を追加**。dev 由来の e2e は `adminPage.getByLabel('コード').fill(...)`（ページ全体スコープ・1 要素前提）だったが、**作成フォームの「コード」と編集フォームの「コード」が同居して 2 要素にマッチ**。
- 確定則: **「既存ページに同種フィールドを持つ sibling form/section を追加したら、そのページを触る既存 e2e の `getByLabel`/`getByRole` がページ全体スコープのままだと strict-mode violation になる」**。新フォーム追加時は `grep -rn "<page-route>" apps/web/playwright/tests` で既存 e2e を洗い、page 全体スコープの locator を `getByRole('form', { name: ... }).getByLabel(...)` の **form スコープへ降格**する。
- 解消: 編集系の操作を編集フォーム（`getByRole('form', { name: /メンター を編集/ })`）へスコープ。`保存` ボタンも併せて form スコープ化（作成フォームの送信は "作成" ラベルで非曖昧だったが防御的に統一）。

## メタ教訓（sync-merge CI 緑化チェックリストへの追加）

- **typecheck / lint / indexes:rebuild / static-manifest の 4 点は「text/型」レベルしか担保せず、test の期待値ドリフトと e2e locator 曖昧化は検知しない**。feature が「nav 構成変更」「既存ページへの form/section 追加」を含む回は、merge 後に push する前に最低限:
  1. `grep -rn "toHaveLength\|個（[0-9]" apps/web/src/components/**/__tests__` で count 系 test の期待値が config と一致するか確認
  2. feature が新設した form/section と同じページを触る既存 e2e を `grep` で洗い、page 全体スコープの `getByLabel`/`getByRole` を form スコープへ降格
- 先行例 [[lessons-learned-attendance-dashboard-ux-e2e-testid-drift-sync-merge-ci-fix-2026-06]] / [[lessons-learned-public-header-auth-slot-e2e-sync-merge-ci-fix-2026-05]] と同じ「**dev sync は text 衝突 0 でも semantic に test/e2e を壊す**」系統。union resolver では拾えないため push 後 CI が初検知点になりやすく、ローカル pre-push hook（coverage-guard は `--changed` で merge スキップ）でも漏れる。

## L-TAGUNIFY-CI-003: dev 再取込で他PRが再生成した visual baseline が自branchの意図的UI変更と不一致 → `playwright-visual-baseline-update` で自branch追従 + **bot push は CI 非起動の罠**

- 症状: 2nd pass（#1181/#1182 取込）push 後、`visual-full (tablet)` のみ fail（desktop/mobile pass）。admin 6 画面（members/tags/meetings/requests/identity-conflicts/audit）の tablet スクショが `toHaveScreenshot` で baseline 不一致。
- 真因: dev #1181（サイドバー collapsed 是正）が **tablet baseline 6枚を dev の admin nav（12-item・"タグ管理"+"タグカタログ"）で再生成**してマージで持ち込まれた。本 feature は admin nav を **11-item（"タグ定義"・tag-catalog 削除）** に統合しており、merge で入った dev の tablet baseline が feature の実描画と構造的に不一致。desktop/mobile が pass したのは、当該 baseline が #1181 で再生成されず旧版のまま許容内（mobile はサイドバーがドロワー格納で nav 非表示／desktop は旧 baseline 許容）だったため。**baseline drift は「自分が触った領域を、取込む dev 側も別目的で触って再生成した」ときに viewport 単位で部分発火する**。
- 解消: ローカル（macOS）では `-linux` baseline を正しく生成不可（フォントレンダリング差）。正規経路 `gh workflow run playwright-visual-baseline-update.yml -f reason="..." -r <feature-branch>`（`.baseline-meta.json` の `refresh_command_hint` 記載）を dispatch。ubuntu 上で build → visual-full/smoke/sidebar-shell 全 baseline を `--update-snapshots` 再生成 → source branch へ直接 commit/push。これで baseline が feature の 11-item 描画に追従。
- **🔴罠 = bot の `GITHUB_TOKEN` push は CI を再起動しない**: baseline-update workflow は `git push origin HEAD:<branch>`（GITHUB_TOKEN・contents:write）でコミットするが、**GITHUB_TOKEN による push は再帰 CI 防止仕様で `on: push`/`on: pull_request` を発火しない**。結果 PR head が baseline コミットに進むが **statusCheckRollup=0 checks**（required check 未充足）になる。→ **baseline 反映後は開発者自身の認証で follow-up push（実変更 or 記録コミット）して CI を再起動する**必要がある。本 lesson の記録コミット自体をその follow-up push に充てた。
- 教訓（sync-merge チェックリスト追加）: ①dev 取込が visual baseline（`*-linux.png`）を更新した回は、自 branch が同一 UI 領域を別意図で変更していないか確認。重なれば push 前に baseline drift を想定。②baseline 不一致は `playwright-visual-baseline-update` workflow で自 branch 追従（ローカル生成は OS 差で不可）。③**workflow が bot push する設計なら、その後に開発者 push で CI 再起動を忘れない**（GITHUB_TOKEN no-trigger）。
