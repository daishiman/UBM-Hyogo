# serial-06 followup-001 — `(public)` segment error / loading boundary 明示配置

## メタ情報

```yaml
issue_number: 880
canonical_workflow: docs/30-workflows/issue-880-public-segment-error-loading-boundary/
status: consumed_by_issue_880
```

| 項目         | 内容                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| タスクID     | serial-06-followup-001-public-segment-error-loading-boundary                              |
| タスク名     | `apps/web/app/(public)/error.tsx` / `loading.tsx` の明示配置                              |
| 分類         | 改善（堅牢性）                                                                             |
| 対象機能     | `(public)` segment の error / loading boundary                                            |
| 優先度       | 中                                                                                         |
| 見積もり規模 | 小規模                                                                                     |
| ステータス   | consumed（Issue #880 / canonical workflow 実装・local evidence 取得済）                  |
| 発見元       | serial-06-form-response-binding Phase 12 implementation-guide §「仕様との差分・判断記録」 |
| 発見日       | 2026-05-23                                                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

serial-06 Phase 5 §0 precondition は `apps/web/app/(public)/error.tsx` / `loading.tsx` の存在を前提としていたが、実 worktree には未配置。Next.js App Router の継承仕様で親階層 `apps/web/app/error.tsx` / `loading.tsx` がフォールバックとして機能するため実害は発生しなかったが、`(public)` segment 固有の error / loading UI を将来追加できない構造になっている。

### 1.2 問題点・課題

- `(public)` 専用の error 文言（公開ディレクトリ向け案内・register 導線含む）を出せない
- `(public)` route の loading skeleton を `(admin)` と差別化できない
- serial-06 / serial-05 仕様書の precondition と実装の drift が残り、後続 phase でレビュー摩擦になる

### 1.3 放置した場合の影響

- `PublicMemberProfileZ.parse` が production で throw した場合、汎用 root `error.tsx` が表示され、公開導線（register / `/members`）への誘導が崩れる
- `(public)/members` 一覧の loading skeleton を AppShell 配下デザインに整合させる際、boundary の再配置から始める必要が生じる

---

## 2. 何を達成するか（What）

### 2.1 目的

`(public)` segment 専用の error boundary と loading skeleton を明示的にファイル配置し、`apps/web/app/error.tsx` 継承に依存しない構造に整える。

### 2.2 最終ゴール

- `apps/web/app/(public)/error.tsx` が `(public)` AppShell と整合したエラー画面を表示
- `apps/web/app/(public)/loading.tsx` が `(public)` AppShell と整合したスケルトンを表示
- serial-06 Phase 5 §0 precondition が grep で検出される
- 既存 root `error.tsx` / `loading.tsx` の挙動と干渉しない

### 2.3 スコープ

#### 含むもの

- `(public)/error.tsx` / `(public)/loading.tsx` 新規追加
- design tokens（`apps/web/src/styles/tokens.css`）経由の色指定のみ
- a11y: `role="alert"` / `aria-live` 等の最低限の attributes
- Playwright smoke 1 ケース（force throw からの boundary 描画確認）

#### 含まないもの

- `(admin)` segment の boundary 追加（別タスク）
- error reporting（Sentry / Workers Analytics）配線（observability scope）
- root `error.tsx` の挙動変更

### 2.4 成果物

- `apps/web/app/(public)/error.tsx`
- `apps/web/app/(public)/loading.tsx`
- Playwright spec（force throw による boundary 検証）
- spec drift 解消の grep evidence

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- serial-06-form-response-binding が merge 済み
- design tokens（task-09）正本が稼働
- AppShell（parallel-03）が `(public)` に適用済み

### 3.2 依存タスク

- serial-06-form-response-binding（merge 必須）
- parallel-03-appshell-layouts（参照）

### 3.3 必要な知識

- Next.js App Router の error / loading boundary 仕様（`"use client"` 必須、`reset()` callback）
- `(public)` segment の primitive 構成
- OKLch トークン（`apps/web/src/styles/tokens.css`）の利用方法

### 3.4 推奨アプローチ

既存 `apps/web/app/error.tsx` をベースに `(public)` 向け文言・導線・AppShell 階層整合だけを差し替える。新規 primitive は生やさず、既存 `Card` / `Button` primitive で構成する。

---

## 4. 実行手順

### Phase構成

1. 現状 root boundary の挙動確認
2. `(public)` 向け文言 / 導線設計
3. error.tsx / loading.tsx 実装
4. Playwright smoke 追加
5. spec drift 解消 evidence

### Phase 1: 現状把握

- `apps/web/app/error.tsx` / `loading.tsx` の DOM contract と stylesheet 依存を grep
- `(public)` AppShell（parallel-03）の outer container と margin 仕様を確認

### Phase 2: 文言設計

- error: 「会員情報を読み込めませんでした」+ `/(public)/members` / `/register` への導線 2 つ
- loading: ProfileHero / MemberTags / MemberDetailSections スケルトン（既存 primitive の `data-skeleton` 拡張で実現）

### Phase 3: 実装

- `"use client"` 宣言
- design tokens のみ利用（`bg-[#...]` 直書き禁止 = task-18 grep gate）
- `reset()` ボタン経路を含む

### Phase 4: テスト

- Playwright force-throw（`/error-boundary-smoke` route）で boundary 発火
- visual snapshot は `serial-07-regression-evidence` baseline に合流

### Phase 5: evidence

- `grep -R "(public)/error.tsx" apps/web/app` で配置 evidence
- serial-06 Phase 5 §0 precondition との整合性 note を `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-12-compliance-check.md` 末尾に backfill

---

## 5. 苦戦箇所メモ（serial-06 実装時に経験した課題）

- **SSR fetch error の補足経路**: `PublicMemberProfileZ.parse` の throw は Server Component 層で発生する。client `"use client"` error.tsx は React Server Component の throw を補足できる仕様だが、検証時に「どの階層の boundary が発火するか」が直感に反するため、Playwright force-throw を最初から組む方が解決が早い。
- **`(public)` の loading skeleton と AppShell の干渉**: AppShell の `<nav>` 高さが loading 中に再計算され layout shift する。`min-h` を AppShell 側で確定させる必要がある（parallel-03 backlog にも関連項目あり）。

---

## 6. 完了条件

- [x] `apps/web/app/(public)/error.tsx` 配置済み
- [x] `apps/web/app/(public)/loading.tsx` 配置済み
- [x] `pnpm typecheck` / `pnpm lint` green
- [x] Playwright smoke 1 spec / 2 ケース pass
- [x] design tokens grep gate pass
- [x] serial-06 Phase 12 compliance check への backfill 完了
