# parallel-09 jest-axe 実 a11y test 統合 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | parallel-09-followup-003-jest-axe-real-a11y-integration                       |
| タスク名     | parallel-09 primitive 5種に対する jest-axe 実 a11y test 統合                  |
| 分類         | 品質改善                                                                      |
| 対象機能     | FormField / EmptyState / Pagination / Icon / Breadcrumb の Vitest a11y test  |
| 優先度       | 中                                                                            |
| 見積もり規模 | 中                                                                            |
| ステータス   | consumed                                                                      |
| 発見元       | parallel-09 Phase 12 implementation-guide.md                                  |
| 発見日       | 2026-05-15                                                                    |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/`
- Issue: 元は未起票（unassigned-task 段階）。canonical workflow は closed Issue #748 を `Refs #748` として参照する。
- 状態: `consumed` / canonical workflow root に移管済み。
- canonical_workflow: `docs/30-workflows/completed-tasks/issue-748-jest-axe-primitive-a11y-integration/`
- AC close-out: local implementation and evidence captured in canonical workflow. Commit / push / PR / issue mutation are user-gated.
- AC canonical replacement: AC-1 / AC-5 の `toHaveNoViolations()` / `expect.extend` は、既存 admin component spec と同じ `results.violations.toHaveLength(0)` pattern に置換して close-out する。目的は axe violation 0 件保証であり、Jest matcher API 形状ではない。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

parallel-09 で実装した 5 primitive（`FormField` / `EmptyState` / `Pagination` / `Icon` / `Breadcrumb`）は、Vitest による component test を `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx` に集約している。当該 spec は **aria 属性 assertion（`aria-invalid` / `aria-describedby` / `aria-current` / `role` 等）を Vitest で個別に確認** することで a11y の代替検証を行っている。

`jest-axe` / `axe-core` パッケージは既に依存に存在するが、parallel-09 の focused run では **時間制約と rule baseline 未確定** により real a11y rule 実行までは統合できなかった。Phase 12 implementation-guide.md にも「aria 属性 assertion を Vitest で代替」と明記している。

### 1.2 問題点・課題

- aria 属性 assertion は **「属性が存在すること」** の確認に過ぎず、axe-core が検証する以下のような違反は捕捉できない:
  - landmark / heading 階層の欠落
  - インタラクティブ要素の name 不在
  - role と implicit semantic の競合
  - focus order の崩壊
- 結果として「a11y 担保」と称しているが実態は proxy assertion であり、Lighthouse / Playwright axe との二重防御が機能していない
- 後続の primitive 追加時に「aria 属性を書き忘れる」ケースを test で検出できない

### 1.3 放置した場合の影響

- a11y regression が CI で検知できず、production で screen reader 利用者の体験を破壊するリスクが残る
- design tokens / primitives 拡張時に a11y baseline が暗黙化し、修正コストが増大
- parallel-09 の品質ゲート（Phase 5/6）が「proxy だけで通過した」という負債が後続並列タスクへ波及する

---

## 2. 何を達成するか（What）

### 2.1 目的

`parallel09-primitives.component.spec.tsx` 内の 5 primitive に対して `jest-axe` を統合し、**aria attribute proxy assertion を real a11y rule violation 0 件確認に置換** する。

### 2.2 最終ゴール

- 5 primitive / 7 scenarios 全てで `axe(container)` の `results.violations.toHaveLength(0)` が green
- axe-core rule baseline（color-contrast / region / landmark-one-main 等）が `axe-core` config として明示的に enable/disable 管理されている
- 重複する aria attribute proxy assertion は削除され、real a11y check に一本化されている

### 2.3 スコープ

#### 含むもの

- `parallel09-primitives.component.spec.tsx` への `jest-axe` 統合
- axe-core rule baseline config の正本化（jsdom 環境で動作する rule のみ enable）
- proxy assertion との重複整理
- Vitest + jest-axe の TypeScript 型整合確認（Jest matcher augmentation ではなく inline assertion pattern を採用）

#### 含まないもの

- Playwright e2e の axe-playwright 統合（別 followup）
- parallel-09 範囲外の primitive / 画面コンポーネントへの拡大適用
- Lighthouse CI への a11y score 連動

### 2.4 成果物

- `parallel09-primitives.component.spec.tsx` の jest-axe 統合 diff
- axe-core rule baseline config（spec 冒頭または `apps/web/src/test/axe.ts` 等の共有 module）
- jest-axe 統合に伴う共有 axe helper 追記（`apps/web/src/test/axe.ts`）
- 統合後の `pnpm test` 通過 evidence

---

## 3. 苦戦箇所（parallel-09 focused run での未統合理由）

### 3.1 rule baseline の未確定

parallel-09 Phase 5/6 の test 設計時点で、5 primitive それぞれに対し「どの axe rule を enable / disable するか」の baseline を確定していなかった。特に `color-contrast` は OKLch token (task-09) と jsdom の `getComputedStyle` 制約により誤検知が発生しやすく、parallel-09 のスコープ内で baseline を切れなかった。

### 3.2 jsdom 環境での axe-core 制約

axe-core は `getComputedStyle` / `getBoundingClientRect` / layout 情報に依存する rule が複数あり、jsdom では一部 rule が動作しないか false positive を出す。Vitest jsdom 環境で安全に動かす rule subset を確定する作業がスコープ外となった。

### 3.3 Vitest + jest-axe の型整合

`jest-axe` は名の通り Jest 想定で `expect.extend(toHaveNoViolations)` の型 augmentation が Jest matcher 前提になっている。Vitest の `expect` に対して `toHaveNoViolations` matcher 型を merge する手順を確定する時間が parallel-09 focused run には無かった。

### 3.4 暫定的代替手段の限界

暫定的に `aria-invalid` / `aria-describedby` / `aria-current` / `role` 等の **属性 assertion** を Vitest で実装したが、これは attribute の有無を確認しているに過ぎず、real a11y rule violation の検出にはならない。Phase 12 implementation-guide.md でもこの限界を明記している。

---

## 4. 受入条件（AC）

- AC-1: `parallel09-primitives.component.spec.tsx` 内で 5 primitive（FormField / EmptyState / Pagination / Icon / Breadcrumb）/ 7 scenarios に対し `axe(container)` が実行され、`results.violations.toHaveLength(0)` で green
- AC-2: axe-core rule baseline が `axe-core` config として明示化されている（color-contrast / region / landmark-one-main 等の enable/disable が config 上で読める）
- AC-3: jsdom で false positive を出す rule は disable 理由をコメントで明記
- AC-4: 既存 aria attribute proxy assertion のうち real a11y check で代替可能なものは削除、固有 contract（例: `aria-current="page"` の正確な値）の確認だけが残る
- AC-5: `expect.extend(toHaveNoViolations)` / `vitest.setup.ts` 追加は canonical workflow で不採用。既存 admin component spec と同じ inline assertion pattern と `apps/web/src/test/axe.ts` 共有 helper で close-out
- AC-6: `pnpm --filter web test` が green、CI でも通過

---

## 5. 関連リソース

- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-12/implementation-guide.md` — 親 workflow Phase 12 知見
- `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx` — 統合対象 spec
- `apps/web/src/components/ui/FormField.tsx` / `EmptyState.tsx` / `Pagination.tsx` / `Icon.tsx` / `src/components/admin/Breadcrumb.tsx` — 対象 primitive
- `apps/web/src/styles/tokens.css` — OKLch tokens（color-contrast rule との関係）
- https://github.com/nickcolley/jest-axe — jest-axe 公式
- https://github.com/dequelabs/axe-core — axe-core rule 一覧
- CLAUDE.md「UI prototype alignment / MVP recovery」節 — primitives 正本順位
