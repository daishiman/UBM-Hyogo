# task-11 members pagination prefetch strategy - タスク指示書

## メタ情報

| 項目         | 内容                                                                 |
| ------------ | -------------------------------------------------------------------- |
| タスクID     | task-11-followup-003-pagination-prefetch-strategy                    |
| タスク名     | members 一覧の Pagination prefetch 戦略設計（Next.js Link + cursor） |
| 分類         | パフォーマンス / 設計 ADR                                            |
| 対象機能     | `apps/web/app/(public)/members` + `apps/web/src/lib/api/public.ts` + `apps/api/src/routes/members` |
| 優先度       | 低〜中                                                               |
| 見積もり規模 | 小〜中規模                                                           |
| ステータス   | 未実施                                                               |
| 発見元       | task-11-public-top-and-member-list / Phase 12 main.md                |
| 発見日       | 2026-05-09                                                           |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

task-11 で `/members` 一覧を実装し、`apps/web/src/lib/api/public.ts` から API の cursor pagination を呼ぶ adapter ができた。一方で「次ページに進むときの prefetch をいつ・どう発火させるか」「Next.js `<Link prefetch>` と cursor pagination の整合をどう取るか」は未設計のまま、UI 上は単純な next/prev ボタン or 全件取得寄りになっている。会員数が増えた場合の LCP / TTFB 劣化を予防するため設計を確定したい。

### 1.2 問題点・課題

- API は cursor pagination を返すが、UI 側はページ番号 URL を持たないため `<Link prefetch>` の効果範囲が不明
- viewport-based prefetch (IntersectionObserver) と cursor の整合が取れていない
- LCP / TTFB の計測指標と SLO が未定義

### 1.3 放置した場合の影響

- 会員数増加時に一覧が線形劣化
- prefetch を後付けすると URL 設計から再設計になりがち

---

## 2. 何を達成するか（What）

### 2.1 目的

cursor pagination + Next.js prefetch の設計 ADR を確定し、計測指標を仕込む。実装は最小限のフックのみ、本格実装は別 task に切り出して可。

### 2.2 最終ゴール

- ADR `docs/30-workflows/.../adr-pagination-prefetch.md` 作成
- prefetch 戦略の決定（候補: a) cursor を URL query に持つ + Link prefetch / b) IntersectionObserver で次 cursor を SWR 先読み / c) 両者ハイブリッド）
- LCP / TTFB / INP の計測指標と閾値を定義
- 既存 `public.ts` adapter への最小フック（cursor を URL に持つ場合の URL builder 等）

### 2.3 スコープ

#### 含むもの

- ADR の起票
- 既存 API endpoint surface の制約整理（変更しない前提）
- prefetch 戦略の比較と選定
- 計測指標と SLO 仮置き

#### 含まないもの

- API 側 cursor pagination の実装変更
- 大規模な UI 書き換え
- Web Vitals の本格収集基盤（別タスク）
- infinite scroll の本実装

### 2.4 成果物

- `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-12/adr-pagination-prefetch.md`（または unassigned-task 完了時に親 spec に追記）
- 計測指標表（LCP / TTFB / INP の目標）
- prefetch 設計図（簡易シーケンス）

---

## 3. 検証方法

- ADR レビュー（自己レビュー + lessons-learned 反映）
- 既存 e2e (`public-top-and-list.spec.ts`) で URL 構造を assert
- `lighthouse` または Playwright trace で LCP / TTFB をベースライン取得

---

## 4. リスクと対策

| リスク                                                | 対策                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| URL に cursor を入れることでブックマーク URL が壊れやすい | cursor は opaque token とし、無効化時は先頭にフォールバック        |
| Link prefetch が Workers の cache で効かない         | `cache-control` と Cloudflare cache rules を ADR で明記           |
| 計測指標を決めても収集する基盤が無い                 | まずは Playwright trace の手動取得で十分とし、本格収集は別 task    |

---

## 5. 苦戦箇所メモ（再発防止）

- API の pagination 形式（cursor）と UI の URL 設計を分離して進めたため、後追いで prefetch 戦略を決めるコストが発生した。新規 list 系 UI を実装する task では Phase 2 でこの ADR を必ず参照する。

---

## 6. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-12/main.md`
- `apps/web/src/lib/api/public.ts`（adapter 実装）
- `apps/api/src/routes/members`（cursor pagination の正本）

### 関連 task

- task-11-public-top-and-member-list（親 workflow）
- task-04a-followup-002-public-member-kv-cache（cache 層との関係）
- task-04a-followup-004-cf-cache-rules-cache-control-validation（cache-control 整合）
