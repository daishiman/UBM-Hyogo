# integration-fixes i07 `/profile/loading.tsx` OKLch skeleton 化 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| タスクID     | integration-fixes-i07-profile-loading-skeleton                                                                        |
| タスク名     | `/profile/loading.tsx` を OKLch skeleton (avatar + 4 KV rows) に置換し parallel-07 spec 4.5 を達成                    |
| 分類         | 改善 / integration-fixes (UI prototype alignment 接続検証ギャップ)                                                    |
| 対象機能     | `apps/web/app/profile/loading.tsx`（`/profile` streaming 用 placeholder UI）                                          |
| 優先度       | 中                                                                                                                    |
| 見積もり規模 | 小規模                                                                                                                |
| ステータス   | consumed                                                                                                               |
| canonical_workflow | `docs/30-workflows/issue-770-profile-loading-skeleton/`                                                        |
| 発見元       | UI prototype alignment / MVP recovery — improvements 接続検証 (integration-fixes index.md §2 i07)                     |
| 発見日       | 2026-05-16                                                                                                            |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`
- 親 sub-workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/`
- 親タスク状態: `implemented_local_runtime_pending`
- consumed_by: Issue #770 canonical workflow (`docs/30-workflows/issue-770-profile-loading-skeleton/`)
- 仕様正本: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md`
- 関連 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md`（§2 検出 evidence、§5 DoD i07）
- 関連実装ファイル:
  - `apps/web/app/profile/loading.tsx`（修正対象）
  - `apps/web/app/profile/loading.spec.tsx`（新規作成対象）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UI prototype alignment / MVP recovery ワークフローの `parallel-07`（auth/shared error & loading UI alignment, PR #743）では、不変条件3「プロトタイプ正本順位」と OKLch token 正本化に基づき、`/login`・`/profile`・root の loading / error UI を skeleton pattern + a11y 属性で統一する設計を spec 4.5 として定義した。

しかし `improvements/integration-fixes/` の接続検証で `apps/web/app/profile/loading.tsx` を実コード grep した結果、以下の簡素実装のままであることが判明した。

```tsx
export default function ProfileLoading() {
  return (
    <main>
      <h1>マイページ</h1>
      <p aria-live="polite">読み込み中…</p>
    </main>
  );
}
```

`role="status"` / `aria-busy` / skeleton 形状 / OKLch token utility いずれも未適用で、parallel-07 spec 4.5 の DoD を満たしていない。

### 1.2 問題点・課題

- profile streaming 中に skeleton placeholder が無く、本体 render 時に大きな CLS（Cumulative Layout Shift）が発生する
- `role="status"` 未設定のためスクリーンリーダーが loading 状態を構造的に通知できない（`aria-live="polite"` 単独では landmark として弱い）
- `/login/loading.tsx`（i05）と `/profile/loading.tsx` の loading UI 言語が乖離し、UX 一貫性が崩れる
- OKLch token utility (`bg-surface-2`) を使用していないため、不変条件2「OKLch トークン正本化」の verify-design-tokens CI gate を通過できない設計差分が残存

### 1.3 放置した場合の影響

- parallel-07 workflow が DoD 未達のまま固定され、`improvements/integration-fixes` workflow の完了条件 §5 i07 が満たされない
- 後続 task-18 (visual-design-tokens) / task-22 (regression smoke) の visual baseline 取得時に profile loading 画面のみ skeleton 欠落で diff が安定せず、recovery workflow の前提が崩れる
- 視覚障害ユーザーに対する loading 状態通知の品質低下が公開後の a11y インシデント要因となる

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/web/app/profile/loading.tsx` を OKLch token utility (`bg-surface-2`) ベースの skeleton（avatar + heading row + 4 KV rows）に置換し、`role="status"` / `aria-busy="true"` / `aria-live="polite"` / sr-only テキストを備えた a11y compliant な placeholder に統一する。`motion-safe:animate-pulse` で `prefers-reduced-motion` を尊重し、parallel-07 spec 4.5 の DoD を達成する。

### 2.2 最終ゴール

- `apps/web/app/profile/loading.tsx` が avatar (h-16 w-16 rounded-full) + heading bar + 4 KV bars の skeleton 形状で render
- `<main role="status" aria-busy="true" aria-live="polite" data-page="profile-loading">` を root に持つ
- sr-only テキスト「マイページを読み込み中」を含む
- すべての skeleton 形状 div が `bg-surface-2 motion-safe:animate-pulse` を class に持つ
- `apps/web/app/profile/loading.spec.tsx` が role/aria/sr-only 属性を検証して PASS
- `pnpm typecheck` / `pnpm lint` がローカル PASS
- HEX 直書きゼロ（OKLch token utility のみ）
- `improvements/integration-fixes/index.md` §5 DoD i07 が consumed 状態に更新

### 2.3 スコープ

#### 含むもの

- `apps/web/app/profile/loading.tsx` の skeleton 化（spec.md の After 実装に整合）
- `apps/web/app/profile/loading.spec.tsx` の新規作成（`*.spec.tsx` 命名規約遵守）
- a11y 属性: `role="status"` / `aria-busy="true"` / `aria-live="polite"` / sr-only テキスト
- OKLch token utility (`bg-surface-2`) 使用確認
- `motion-safe:animate-pulse` 適用確認

#### 含まないもの

- profile page 本体（`apps/web/app/profile/page.tsx`）の変更
- avatar / KV pair component の新規 primitive 化
- 新規 skeleton primitive component の `apps/web/src/components/ui/` 配下追加（不変条件3 違反候補）
- `tokens.css` への新規 token 追加（§3.3 横展開メモで提案するに留め、本タスクでは実施しない）

### 2.4 成果物

- `apps/web/app/profile/loading.tsx`（modify）
- `apps/web/app/profile/loading.spec.tsx`（create）
- `improvements/integration-fixes/index.md` §5 DoD i07 の状態更新差分
- 親 spec.md の DoD チェック更新

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 簡素テキスト実装で済ませた経緯

parallel-07 実装時、`/profile/loading.tsx` の skeleton 化要件は spec 4.5 に明記されていたものの、parallel-09 (UX cross-cutting primitives) で **skeleton primitive component（例: `<Skeleton />`）が未提供** だったため、実装担当は「primitive 不在のまま個別 div を並べる skeleton を書くと token 命名規約と整合性確認が個別ファイルで分散する」と判断し、最小実装の `<p aria-live="polite">読み込み中…</p>` で一旦止めた。

結果として:
- parallel-07 spec 4.5 の DoD 達成は parallel-09 の primitive 提供を暗黙的に待っていた
- parallel-09 では Icon / FormField / Pagination / Breadcrumb / EmptyState 等は実装したが Skeleton primitive は scope 外で未提供のまま完了
- 双方の DoD 接続が i07 接続検証で初めて検出された

加えて、`role="status"` 属性が欠落していた点は parallel-07 spec 4.5 のレビュー時にも見落とされており、`aria-live="polite"` 単独で a11y 要件を満たすという誤認が混入していた。`aria-live` は変化通知の polite 度を制御するのみで、loading 状態の landmark としては `role="status"`（暗黙的に `aria-live="polite"` を含む ARIA live region）が必須である。

### 3.2 解決策（実施順）

1. **spec.md の After 実装を素直に適用**: `<main role="status" aria-busy="true" aria-live="polite">` + avatar 行 + 4 KV bars の skeleton をそのまま `loading.tsx` に書き戻す。primitive 化は本タスクでは行わない（不変条件3 違反回避）。
2. **`bg-surface-2` utility 存在確認**: `apps/web/src/styles/tokens.css` および Tailwind config の `bg-surface-2` 定義を grep。i05 / parallel-03 で既に追加済みであることを前提とするが、未定義なら最小追加（spec.md リスク欄に従う）。
3. **`motion-safe:animate-pulse` 確認**: Tailwind core utility のため追加実装不要。`prefers-reduced-motion: reduce` 環境で pulse が止まることを `chrome://flags` または DevTools の rendering emulation で目視確認。
4. **`loading.spec.tsx` 作成**: `*.spec.tsx` 命名規約（CLAUDE.md 不変条件 8）に従い、`@testing-library/react` で role/aria/sr-only テキストを検証する 2 ケースを追加。
5. **typecheck / lint / test 実行**: `mise exec -- pnpm typecheck`、`mise exec -- pnpm lint`、`mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/loading` の 3 コマンドで PASS 確認。
6. **HEX 直書き grep**: `rg -n "#[0-9a-fA-F]{3,8}|bg-\[#" apps/web/app/profile/loading.tsx` が 0 hit であることを確認。

### 3.3 学んだこと / 横展開メモ

- **loading.tsx は skeleton primitive を必須採用とする運用ルール案**: 今後の loading.tsx 追加時には、avatar/heading/KV/list 等の基本形状をカバーする再利用可能な `<Skeleton variant="..." />` primitive を `apps/web/src/components/ui/Skeleton.tsx` に集約し、route 配下では primitive を組み合わせるのみとする。これにより token 命名・animation・a11y 属性の一貫性を 1 箇所で担保できる。本タスクでは scope 外（不変条件3）として実施しないが、`integration-fixes` 完了後の followup（例: `parallel-11-skeleton-primitive`）で提案する。
- **token 命名規約 `bg-skeleton` の `tokens.css` 追加案**: 現状 skeleton 形状には `bg-surface-2` を流用しているが、surface-2 は card / panel 等の正規 surface 色でもあるため、loading 用と通常用が同色 token を共有している。`--ubm-color-skeleton`（初期値は surface-2 と同値）を追加し `bg-skeleton` utility を新設すれば、後日 skeleton 色のみ独立調整できる（例: わずかに明度を下げて pulse 視認性向上）。本タスクでは `bg-surface-2` 流用を維持し、`tokens.css` 拡張は task-08 design-tokens 改修サイクルへの提案として残す。
- **`role="status"` と `aria-live="polite"` の関係**: `role="status"` は暗黙的に `aria-live="polite"` および `aria-atomic="true"` を含むが、互換性のため両方を明示記述する pattern が WAI-ARIA Authoring Practices で推奨される。今回の skeleton も明示記述を採用している。
- **`*.test.tsx` 禁止規約再確認**: CLAUDE.md 不変条件 8 により新規 test ファイルは `*.spec.{ts,tsx}` のみ。`loading.test.tsx` ではなく `loading.spec.tsx` で作成すること（lefthook `block-test-suffix` と GitHub Actions `verify-test-suffix` が reject する）。

---

## 4. 受入条件 (AC)

spec.md DoD を踏襲する。

- **AC-1**: `apps/web/app/profile/loading.tsx` が skeleton (avatar h-16 w-16 rounded-full + heading bar h-8 w-48 + KV bars h-6 × 4 行) で render されること
- **AC-2**: root `<main>` が `role="status"` / `aria-busy="true"` / `aria-live="polite"` / `data-page="profile-loading"` を持つこと
- **AC-3**: sr-only テキスト「マイページを読み込み中」を含むこと
- **AC-4**: すべての skeleton 形状 div が `bg-surface-2 motion-safe:animate-pulse` class を持ち、`prefers-reduced-motion: reduce` 環境で pulse animation が停止すること
- **AC-5**: `apps/web/app/profile/loading.spec.tsx` が `role="status"` + `aria-busy="true"` + `aria-live="polite"` 検証 1 ケース、sr-only テキスト検証 1 ケースの 2 ケースで PASS（`*.spec.tsx` 命名）
- **AC-6**: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` がローカル PASS
- **AC-7**: `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/loading` が PASS
- **AC-8**: HEX 直書きゼロ（`rg -n "#[0-9a-fA-F]{3,8}|bg-\[#" apps/web/app/profile/loading.tsx` 0 hit、OKLch token utility のみ使用）
- **AC-9**: parallel-07 spec 4.5 達成（spec.md DoD 末尾項目）
- **AC-10**: `improvements/integration-fixes/index.md` §5 DoD i07「`/profile/loading.tsx` が skeleton で render され role=status を持つこと」が consumed 状態に更新済み

---

## 5. 参照資料

- 仕様正本: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md`
- 親 sub-workflow index: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md`
- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`
- parallel-07 元 PR: #743 (auth/shared error & loading UI alignment)
- 関連既存実装: `apps/web/app/profile/loading.tsx`（修正対象）, `apps/web/app/login/loading.tsx`（i05 で追加される姉妹 loading）, `apps/web/app/error.tsx`（i06 で focus 管理追加）
- design tokens 正本: `apps/web/src/styles/tokens.css`, `docs/00-getting-started-manual/specs/design-tokens.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/`
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション（不変条件 1〜4）
- CLAUDE.md 不変条件 8（`*.spec.{ts,tsx}` 命名規約）
