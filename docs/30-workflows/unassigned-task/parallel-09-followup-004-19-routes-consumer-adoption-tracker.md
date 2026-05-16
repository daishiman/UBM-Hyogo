# 19 routes consumer adoption tracker (parallel-09 primitives) - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | parallel-09-followup-004-19-routes-consumer-adoption-tracker                  |
| タスク名     | 19 routes consumer adoption tracker (parallel-09 primitives)                  |
| 分類         | トラッキング / umbrella                                                       |
| 対象機能     | parallel-09 で配置した 5 primitive + `useAdminMutation` hook の 19 routes 全採用追跡 |
| 優先度       | 中                                                                            |
| 見積もり規模 | 大                                                                            |
| ステータス   | pending                                                                       |
| 発見元       | parallel-09 Phase 12 Open Runtime Boundary                                    |
| 発見日       | 2026-05-15                                                                    |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/parallel-09-ux-cross-cutting/index.md`
- 関連 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` (parallel-01〜08)
- 状態: `pending` / parallel-01〜08 の進捗に追随する umbrella tracking。primitive 実装本体は parallel-09 で完了済み。各 route への consumer 採用は parallel-01〜08 各 spec の責務として明示的にスコープ外とした残務を集約する。
- 完了基準: 19 routes 全てで採用条件（後述 AC-1〜AC-4）を満たし、`outputs/` の adoption table 上で全行 ✅ となった時点で close。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

parallel-09 (`docs/30-workflows/parallel-09-ux-cross-cutting/`) では UI cross-cutting primitive として以下を一括実装した:

- `apps/web/src/components/ui/FormField.tsx`
- `apps/web/src/components/ui/EmptyState.tsx`
- `apps/web/src/components/ui/Pagination.tsx`
- `apps/web/src/components/ui/Icon.tsx`
- `apps/web/src/components/admin/Breadcrumb.tsx`
- `apps/web/src/lib/useAdminMutation.ts`

しかし、これら primitive を 19 routes (公開6 + 会員2 + 管理8 + 共通3) 各画面へ実適用する責務は parallel-01〜08 の各 spec に分散して割り当てられており、parallel-09 のスコープからは明示的に除外されている。

### 1.2 問題点・課題

- 各 route の primitive 採用責務が parallel-01〜08 に分散しており、**進捗を横断的に把握する仕組みがない**。
- HEX 直書きは `verify-design-tokens` CI gate (task-18) で抑止しているが、**primitive 自体の採用率は CI で検出できない**。`<input>` 直接利用 / 独自 empty 表示 / ad-hoc breadcrumb 等の legacy パターンを grep で検出する gate は未整備。
- 各 parallel タスクが独立して進行するため、**adoption 進捗の正本ドキュメント**が欠如しており、「どの route がどの primitive を採用済みか」のスナップショットを誰も持っていない。
- 結果、parallel-09 で配置した primitive が部分採用にとどまり、UI 一貫性 (`docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` の不変条件 #3 プロトタイプ正本順位) が崩れるリスクがある。

### 1.3 放置した場合の影響

- 公開 / 会員 / 管理の 19 routes で primitive 採用がバラつき、デザイン言語の一貫性が崩壊する。
- 後続の visual regression (parallel-09 Phase 8) baseline が legacy 実装混在のまま固定され、後で差し替えるとスナップショット大量更新が必要になる。
- primitive の API 改善時、採用箇所が網羅できず breaking change の影響範囲が不明になる。

---

## 2. 何を達成するか（What）

### 2.1 目的

parallel-09 で配置した 5 primitive と `useAdminMutation` hook が、19 routes 全てで一貫採用されたことを **追跡可能な形で証跡化** し、parallel-01〜08 各タスクの完了条件と接続する。

### 2.2 最終ゴール

- 19 routes × 採用対象 primitive のマトリクス表 (adoption table) が `docs/30-workflows/parallel-09-ux-cross-cutting/outputs/` 配下に存在し、各 cell が「該当なし / 未採用 / 採用済み」のいずれかで埋まる。
- grep ベースの簡易 adoption checker スクリプトが `scripts/` 配下に追加され、`<input` 直接利用などの legacy パターンを CI で検出できる。
- 全 19 routes で AC-1〜AC-4 を満たし、umbrella task として close 可能。

### 2.3 スコープ

#### 含むもの (19 routes 一覧)

| 層 | 数 | routes |
|----|----|--------|
| 公開 | 6 | `/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms` |
| 会員 | 2 | `/login`, `/profile` |
| 管理 | 8 | `/(admin)/admin`, `/(admin)/admin/members`, `/(admin)/admin/tags`, `/(admin)/admin/meetings`, `/(admin)/admin/schema`, `/(admin)/admin/requests`, `/(admin)/admin/identity-conflicts`, `/(admin)/admin/audit` |
| 共通 | 3 | `apps/web/src/app/error.tsx`, `apps/web/src/app/not-found.tsx`, `apps/web/src/app/loading.tsx` |

#### 含まないもの

- primitive 本体の実装変更（parallel-09 本体スコープ）
- 新 primitive の追加（不変条件 #3「プロトタイプ正本順位」により禁止）
- API endpoint / D1 schema 変更（不変条件 #1）

### 2.4 成果物

- `docs/30-workflows/parallel-09-ux-cross-cutting/outputs/adoption-tracker.md`（19 routes × primitive のマトリクス）
- `scripts/verify-primitive-adoption.mjs`（legacy パターン grep checker, 任意 CI gate）
- 各 parallel-01〜08 task spec の Phase 13 受入条件への primitive 採用条項追記差分

---

## 3. 苦戦箇所 / 想定リスク

### 3.1 責務分散による進捗トラッキング困難

parallel-01〜08 が並列タスクとして独立して進行しており、各タスクが「どの primitive をどの route で採用したか」を個別 PR で完結させてしまうと、umbrella tracker への反映が漏れる。**adoption-tracker.md を各 parallel task の Phase 13 完了条件に含める** ことで反映漏れを防ぐ運用が必要。

### 3.2 CI による採用率検出の限界

`verify-design-tokens` CI gate は HEX / `bg-[#xxx]` / `text-[#xxx]` を grep で禁止できるが、`<input>` / `<select>` / 独自 empty state の直接記述は HTML として valid なため抑止できない。**`scripts/verify-primitive-adoption.mjs` を新設** し以下を grep gate する:

- `apps/web/src/app/**/*.tsx` で `<input ` / `<select ` / `<textarea ` の直接利用 (FormField 経由になっていない箇所)
- admin route で `<nav` を含むファイルが `Breadcrumb` を import しているか
- `apps/web/src/app/**/*.tsx` で「データが見つかりません」「該当なし」等の hard-coded empty 文言が `EmptyState` 経由か

ただし false positive が多くなる可能性が高いため、**warning レベル**から開始し、route ごとに `// adoption-tracker: opt-out` コメントで例外を明示する設計が現実的。

### 3.3 共通 3 routes (`error.tsx` / `not-found.tsx` / `loading.tsx`) の primitive 適合性

`error.tsx` は Next.js error boundary なので `EmptyState` ではなく独自エラー UI 構成、`loading.tsx` は suspense skeleton で primitive 不要、というように **primitive を採用しないことが正解の route が混在** する。adoption-tracker では「該当なし」セルを明示的に区別する必要がある。

### 3.4 parallel-01〜08 完了タイミングとの整合

このトラッキング task は parallel-01〜08 全完了後でないと close できない umbrella なので、**自己ループする close 基準** にならないよう、各 parallel task 側に「adoption-tracker.md の該当行を ✅ に更新すること」を Phase 13 受入条件として明示的に書き込む必要がある。

---

## 4. 受入条件 (AC)

- AC-1: **FormField 採用** — 19 routes 全てで `<input>` / `<select>` / `<textarea>` の直接利用が 0 件 (parallel-09 `FormField` 経由になっている)。`error.tsx` / `not-found.tsx` / `loading.tsx` 等 form 不要 route は「該当なし」として除外を明示。
- AC-2: **EmptyState 採用** — empty 状態表示 (members 一覧 0 件 / requests 0 件 / search 該当なし等) が `EmptyState` primitive 経由になっている。hard-coded `<div>該当なし</div>` 等が 0 件。
- AC-3: **Breadcrumb 採用** — admin 8 routes 全てで breadcrumb が `apps/web/src/components/admin/Breadcrumb.tsx` 経由 (ad-hoc `<nav><ol>` 0 件)。
- AC-4: **Pagination / Icon / useAdminMutation 採用** — 一覧画面 (members / requests / audit 等) で `Pagination` 経由、装飾アイコンが `Icon` 経由、admin mutation が `useAdminMutation` 経由。
- AC-5: **adoption-tracker.md の存在** — `docs/30-workflows/parallel-09-ux-cross-cutting/outputs/adoption-tracker.md` に 19 routes × primitive のマトリクスが存在し、全 cell が埋まっている (✅ / N/A のいずれか)。
- AC-6: **CI gate (任意)** — `scripts/verify-primitive-adoption.mjs` が warning レベルで動作し、`<input>` 直書き等の legacy パターンを検出可能。
- AC-7: **parallel-01〜08 spec への接続** — 各 parallel task の Phase 13 受入条件に「adoption-tracker 該当行を更新」が明示的に書かれている。

---

## 5. 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` — 19 routes 定義と不変条件 #1〜#4
- `docs/30-workflows/parallel-09-ux-cross-cutting/index.md` — parallel-09 本体 workflow（primitive 実装スコープ）
- `apps/web/src/components/ui/index.ts` — primitive export 一覧（FormField / EmptyState / Pagination / Icon）
- `apps/web/src/components/admin/Breadcrumb.tsx` — admin breadcrumb primitive
- `apps/web/src/lib/useAdminMutation.ts` — admin mutation hook
- `apps/web/src/styles/tokens.css` — OKLch design tokens（task-09 正本）
- `docs/00-getting-started-manual/claude-design-prototype/` — UI primitives + tokens + rhythm 正本順位
- CLAUDE.md `UI prototype alignment / MVP recovery` セクション
