# Skill Feedback Report — task-specification-creator

> 本 task（08b parallel-playwright-e2e-and-ui-acceptance-smoke）の仕様書作成 / 実行を通じた、`task-specification-creator` skill への改善提案。

## 良かった点

| # | 観点 | 内容 |
| --- | --- | --- |
| G-1 | scenario × viewport matrix が明確 | Phase 7 の AC マトリクスが「AC × scenario × viewport × screenshot × invariant × failure」を 1:1 で要求しており、漏れの発見が容易だった |
| G-2 | 不変条件 trace の強制 | Phase 12 compliance で #4 / #8 / #9 / #15 の test 化点が必須セクション化されており、E2E task における観点漏れを防げた |
| G-3 | spec_created 境界の明示 | `workflow_state` で「実 evidence の取得は scope 外」と判断する境界が明確で、scaffolding と実 evidence の混同を防止できた |
| G-4 | Phase 11 の 44 screenshot リスト先出し | 仕様書に「期待 evidence 一覧」を明記する設計が、後続 task の引き継ぎコストを下げる |

## 改善提案

### F-1. E2E task テンプレ化（page object / screenshot / fixture）

**課題**: 本 task では page object 命名規約（`{Domain}{Role}Page.ts`）、screenshot 命名規約（`{viewport}/{screen}-{state?}.png`）、fixture 分離パターン（`adminPage / memberPage / unregisteredPage`）を Phase 5 / 8 で個別に定義した。

**提案**: `task-specification-creator` の **E2E task テンプレ**として上記 3 規約を Phase 5 / 8 のデフォルトセクションに含める。新規 E2E task で再発明を避ける。

### F-2. axe / browser / viewport matrix を Phase 9 標準セクションに

**課題**: 品質保証 Phase 9 で「a11y rule tag（wcag2a/wcag2aa/wcag21a/wcag21aa）」「impact フィルタ（critical/serious のみ FAIL）」「browser matrix（chromium/webkit/firefox 配分）」「viewport matrix（desktop/mobile）」を都度記述した。

**提案**: Phase 9 (品質保証) の sub-section として **「a11y 戦略 / browser matrix / viewport matrix」** を必須化。デフォルト値（wcag2.1 AA + critical/serious + chromium+webkit + 1280x800/390x844）を skill resource に同梱。

### F-3. external nav（Google Form / Stripe 等）観測戦略の同梱

**課題**: editResponseUrl → `forms.google.com/.../viewform` への popup 観測を本 task で初めて記述した（不変条件 #4）。Stripe 決済リダイレクト等、外部 nav 観測は他 task でも頻出する。

**提案**: skill resource に `external-nav-observation.md` を追加し、`page.waitForEvent('popup')` / `expect(popup).toHaveURL(/forms\.google\.com/)` のパターンを共通化。

### F-4. `actions/upload-artifact` path と evidence 規約の統一

**課題**: CI workflow yml の `path:` と、`outputs/phase-11/evidence/` の配置規約が独立して定義されており、片方更新時に他方の同期忘れが起こりやすい。

**提案**: Phase 11 / Phase 12 で **「evidence path 規約 → workflow yml path に転記」** をチェックリスト化。skill が CI yml 雛形を生成する際に同 path を自動展開する。

### F-5. `docs_only` 判定と実装範囲のグレーゾーン解消

**課題**: 本 task は `taskType: docs-only` だが、scaffolding（playwright.config.ts / page-objects / spec / CI yml）の追加は **コード変更**を含む。`docs-only` の定義が「実 evidence を撮らない」なのか「コード追加を一切しない」なのかが skill 内で曖昧。

**提案**: `taskType` の enum を以下に細分化:
- `docs-only`: ドキュメントのみ。コード変更なし
- `scaffolding-only`: spec / config / fixture を追加するが実走しない（本 task のケース）
- `full-execution`: scaffolding + 実走 + evidence 取得

これにより `spec_created` 境界の判定が明確化される。

### F-6. screenshot 数の事前見積りテンプレート

**課題**: Phase 4 verify-matrix で 45 行、Phase 7 ac-matrix で 44 枚と、行数と screenshot 数が手計算で齟齬を起こす可能性があった。

**提案**: `task-specification-creator` に **screenshot 集計テーブル雛形**（区分 × desktop × mobile × 合計）を Phase 7 の必須セクション化。

## 重要度サマリ

| # | 改善 | 重要度 |
| --- | --- | --- |
| F-1 | E2E テンプレ化（page object / screenshot / fixture） | High |
| F-2 | axe / browser / viewport matrix 標準化 | High |
| F-5 | `docs_only` グレーゾーン解消 | High |
| F-3 | external nav 観測戦略 | Medium |
| F-4 | upload-artifact path 統一 | Medium |
| F-6 | screenshot 集計テンプレ | Low |
