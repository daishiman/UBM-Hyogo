# integration-fixes i05 /login loading + error focus 完遂 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | integration-fixes-i05-login-loading-and-error-focus                                             |
| タスク名     | /login の loading.tsx 新規作成と error.tsx の h1 自動 focus / aria-live=assertive / Card layout 適用 |
| 分類         | 改善 / DoD completion (a11y)                                                                    |
| 対象機能     | `apps/web/app/login/loading.tsx`（新規） / `apps/web/app/login/error.tsx`（修正）                |
| 優先度       | 高                                                                                              |
| 見積もり規模 | 小規模                                                                                          |
| ステータス   | consumed                                                                                        |
| canonical_workflow | `docs/30-workflows/issue-768-login-loading-and-error-focus/`                              |
| consumed_by | Issue #768 canonical workflow                                                                    |
| 発見元       | improvements integration-fixes 接続検証（parallel-07 DoD line 141, 142 未達）                   |
| 発見日       | 2026-05-16                                                                                      |
| consumed日   | 2026-05-18                                                                                      |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/`
- 親 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i05-login-loading-and-error-focus/spec.md`
- 親 index: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md`
- 親 workflow 状態: `spec_ready_implementation_pending`
- consumed_by: Issue #768 canonical workflow (`docs/30-workflows/issue-768-login-loading-and-error-focus/`)
- 関連実装（未着手）:
  - `apps/web/app/login/loading.tsx`（不在 → 新規）
  - `apps/web/app/login/error.tsx`（focus 管理 / Card layout / aria-live=assertive 未適用）
- 関連 parallel: parallel-07 (auth and shared error & loading UI alignment)、parallel-i06 / parallel-i07（同 integration-fixes 内の独立 spec）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`parallel-07-auth-and-shared` で公開系・shared 系の loading / error UI を統一実装した際、`apps/web/app/login/` 配下については spec section 4.1 / 4.2 に「`/login/loading.tsx` を OKLch skeleton + a11y 属性で新規作成」「`/login/error.tsx` を h1 自動 focus + `aria-live="assertive"` + Card layout で再構成」と宣言したが、PR #743 のマージ時点で**実コードに反映されていない**ことが integration-fixes 接続検証（`apps/web/app/login/loading.tsx` が不在、`error.tsx` に `useRef` / `tabIndex={-1}` 無し）で確定した。

parallel-07 DoD line 141, 142 が現状未達であり、本 i05 で `/login` 配下の loading / error boundary を spec どおりの a11y 仕様に揃える。

### 1.2 問題点・課題

- `/login/loading.tsx` が存在せず、Next.js の loading boundary が default fallback（空白）になっている。screen reader 利用者にロード状況が伝わらない。
- `/login/error.tsx` が `useRef` + `tabIndex={-1}` + `useEffect` 内の `.focus({ preventScroll: true })` パターンを欠いており、route error 発生時に h1（"ログイン画面でエラーが発生しました"）へフォーカスが移譲されない。screen reader が状況をアナウンスせず、キーボード利用者は Tab を多数回押さないとエラー箇所に辿り着けない。
- `section role="alert"` に `aria-live="assertive"` が無く、即時アナウンスが起きない。
- Card layout（既存 `Card` / `CardContent` がある場合のみ）が未適用で、視覚的にも公開系 error UI とのリズム整合が崩れている。

### 1.3 放置した場合の影響

- a11y 観点で /login の error 経路が WCAG 2.1 SC 4.1.3 (Status Messages) を満たさない状態が継続する。
- 認証導線で SSR / RSC 例外が出た場合、screen reader 利用者・キーボード利用者がエラー復旧操作（reset button）に到達できない。
- parallel-07 workflow が `implemented_local_runtime_pending` から `completed` に進めず、improvements ロールアップが部分達成のまま固定される。
- 後続 i06（root error focus） / i07（profile loading skeleton）と合わせて initial parallel-07 spec 4.1〜4.5 が全件 carryover となり、a11y regression が複数 sprint にまたがる。

---

## 2. 何を達成するか（What）

### 2.1 目的

`parallel-07-auth-and-shared` spec 4.1 / 4.2 を `/login` 配下に正しく反映し、loading boundary・error boundary の a11y 仕様（role / aria-busy / aria-live / focus 移譲）を確定させる。同時に `useEffect` で h1 へ focus を当てるパターンを共通 hook（`useFocusOnMount` 等）として横展開できる土台を作る。

### 2.2 最終ゴール

- `apps/web/app/login/loading.tsx` が新規作成され、`role="status"` / `aria-busy="true"` / `aria-live="polite"` / `.sr-only` text を持つ OKLch skeleton pattern で render される
- `apps/web/app/login/error.tsx` が h1 への自動 focus（`useRef<HTMLHeadingElement>` + `useEffect` + `.focus({ preventScroll: true })` + `tabIndex={-1}`）を実装し、`section role="alert"` に `aria-live="assertive"` が付く
- digest が存在する場合のみ `<code>error id: {digest}</code>` が条件 render される
- 既存 `Card` / `CardContent` が `apps/web/src/components/ui/` にある場合は Card layout を適用、無ければ素の section で focus 管理を必須項目として完了させる（spec line 141 の best-effort 判定に従う）
- `loading.spec.tsx` / `error.spec.tsx` が PASS し、`pnpm typecheck` / `pnpm lint` も PASS
- parallel-07 DoD line 141, 142 が消し込まれ、integration-fixes index の i05 が完了状態に更新される

### 2.3 スコープ

#### 含むもの

- `apps/web/app/login/loading.tsx` 新規作成（OKLch skeleton + a11y）
- `apps/web/app/login/error.tsx` の focus 管理追加 + `aria-live="assertive"` 追加 + digest 条件 render + Card layout（best-effort）
- `apps/web/app/login/loading.spec.tsx` 新規作成（role / aria 属性検証）
- `apps/web/app/login/error.spec.tsx` 新規 or 修正（focus 移譲・digest 表示・reset 呼び出し検証）
- `bg-surface-2` utility が未定義の場合のみ `apps/web/src/styles/globals.css` の `@layer utilities` に OKLch token (`--ubm-color-surface-2`) 経由で追加

#### 含まないもの

- root `error.tsx` の focus 管理（→ parallel-i06 で別タスク化済み）
- `/profile/loading.tsx` の skeleton 化（→ parallel-i07 で別タスク化済み）
- 新規 `Card` / `CardContent` primitive の追加実装（既存がなければ素の section で focus 管理のみ必須化）
- 新規 API endpoint / D1 schema 変更（不変条件1 違反のため禁止）
- HEX 直書きでの色指定（不変条件2 違反のため禁止、OKLch token 経由のみ）

### 2.4 成果物

- 新規ファイル: `apps/web/app/login/loading.tsx`, `apps/web/app/login/loading.spec.tsx`, `apps/web/app/login/error.spec.tsx`（既存なら修正）
- 修正ファイル: `apps/web/app/login/error.tsx`
- 任意修正: `apps/web/src/styles/globals.css`（`bg-surface-2` utility 未定義時のみ）
- 完了報告: parallel-07 spec 4.1 / 4.2 / DoD line 141, 142 の消し込み記録、integration-fixes index の i05 状態更新

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 parallel-07 で /login 配下だけ取り残された経緯

parallel-07 spec section 4.1 / 4.2 では公開系 (`/`) / shared (`error.tsx`) / `/login` / `/profile` の loading・error UI を統一する設計だったが、実装 PR #743 のレビュー時に「公開系 + shared を先行マージ、`/login` / `/profile` は次サイクル」と暗黙に line-drop されたまま DoD checklist は full set のまま merge された。spec が宣言した a11y パターン（`useRef` + `tabIndex={-1}` + `useEffect` で `.focus()`）が `/login` 系のファイルに反映されず、結果として spec と実装の乖離が integration-fixes 接続検証で初めて検出された。

教訓: parallel タスクで「同一 a11y パターンを複数 route に横展開」する設計を採る場合、DoD checklist は **route 単位で分解** し、partial merge を防ぐ。本タスクで focus 管理を共通化する `useFocusOnMount` hook の抽出を後続検討事項として記録する。

### 3.2 解決策候補（実施順）

1. **`/login/error.tsx` 現状読み取り**: `useRef` / `tabIndex` / `aria-live` の欠落箇所を特定し、parallel-07 spec の After ブロック（spec.md L100-131）と diff を取る。
2. **`/login/loading.tsx` 新規作成**: spec.md L50-71 の skeleton pattern をそのまま採用（`role="status"`, `aria-busy="true"`, `aria-live="polite"`, `.sr-only` text, `motion-safe:animate-pulse`, `bg-surface-2`）。
3. **`bg-surface-2` 存在確認**: `apps/web/src/styles/globals.css` を grep し、未定義なら `--ubm-color-surface-2` 参照 utility を `@layer utilities` に追加（OKLch token 経由のみ、HEX 禁止）。
4. **`/login/error.tsx` 修正**: `useRef<HTMLHeadingElement>` を h1 に bind、`useEffect` で `.focus({ preventScroll: true })`、`section` に `aria-live="assertive"` + `data-page="login-error"` を追加、digest を条件 render。
5. **Card layout 判定**: `apps/web/src/components/ui/Card.tsx` 等を確認し、存在すれば適用、無ければ素の section で focus 管理を優先確定。
6. **spec ファイル作成**: spec.md L168-216 の test ケースを `loading.spec.tsx` / `error.spec.tsx` にそのまま実装。
7. **検証コマンド実行**: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run login` を順に PASS まで回す。
8. **手動 a11y 確認**: dev server 起動後、`/login` で意図的に error を起こし screen reader (VoiceOver) で h1 即時アナウンスとフォーカス位置を確認。

### 3.3 学んだこと / 横展開メモ

- **共通 hook 化候補**: error boundary 系で「マウント直後に特定 ref へ focus を移譲する」パターンは、`/login`, root `error.tsx`, `/profile`, 管理画面 8 route で繰り返し現れるため、`apps/web/src/lib/hooks/useFocusOnMount.ts` として共通化する候補。signature 案:

  ```ts
  export function useFocusOnMount<T extends HTMLElement>(
    deps: ReadonlyArray<unknown> = []
  ): RefObject<T> {
    const ref = useRef<T>(null);
    useEffect(() => {
      ref.current?.focus({ preventScroll: true });
    }, deps);
    return ref;
  }
  ```

  本 i05 では `/login` 単独 scope のため inline 実装を優先し、i06 / i07 と合わせて 3 route 出揃った段階で hook 抽出 refactor を別タスク化する（過剰早期抽象化回避）。

- **Card layout の判定優先度**: DoD line 141 "Card layout + focus 管理" は a11y 視点では focus 管理が main objective。Card layout は視覚的整合の secondary objective として best-effort 扱いとし、focus 管理を必須項目に格上げ。

- **`focus({ preventScroll: true })` の互換性**: TypeScript 型定義上は標準だが、レガシーブラウザでは `preventScroll` オプションが無視され通常 focus にフォールバックする。fallback は害なし。`.focus()` 単体呼び出しに切り替える必要はない。

- **`bg-surface-2` utility の整備位置**: parallel-03 (OKLch token) の `apps/web/src/styles/tokens.css` が `--ubm-color-surface-2` を定義する正本。Tailwind utility としての展開先は `apps/web/src/styles/globals.css` の `@layer utilities`。HEX 直書きは task-18 `verify-design-tokens` CI gate で fail する。

---

## 4. 受入条件 (AC)

- **AC-1**: `apps/web/app/login/loading.tsx` が新規作成され、root 要素が `role="status"` / `aria-busy="true"` / `aria-live="polite"` を持つ
- **AC-2**: `apps/web/app/login/loading.tsx` に `<span className="sr-only">ログイン画面を読み込み中</span>` 相当の screen reader 専用テキストが含まれる
- **AC-3**: `apps/web/app/login/error.tsx` が `useRef<HTMLHeadingElement>` を h1 にバインドし、`useEffect` 内で `headingRef.current?.focus({ preventScroll: true })` を呼ぶ
- **AC-4**: `apps/web/app/login/error.tsx` の h1 に `tabIndex={-1}` が付与される
- **AC-5**: `apps/web/app/login/error.tsx` の `section role="alert"` に `aria-live="assertive"` と `data-page="login-error"` が付与される
- **AC-6**: `error.digest` が存在する場合のみ `<p><code>error id: {error.digest}</code></p>` が render される（digest 無しの場合は何も出さない）
- **AC-7**: `Card` / `CardContent` primitive が `apps/web/src/components/ui/` に既存する場合は Card layout を適用、無ければ素の section で focus 管理のみ満たす（best-effort 判定）
- **AC-8**: `apps/web/app/login/loading.spec.tsx` が `role=status` / `aria-busy=true` / `aria-live=polite` / sr-only テキスト 3 観点で PASS
- **AC-9**: `apps/web/app/login/error.spec.tsx` が「h1 自動 focus」「digest 条件 render」「reset button 呼び出し」3 観点で PASS
- **AC-10**: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` がローカル PASS
- **AC-11**: HEX 直書き 0 件（`bg-[#xxx]` / `text-[#xxx]` / `#[0-9a-f]{3,8}` を `apps/web/app/login/loading.tsx` / `error.tsx` で grep して 0 hit）
- **AC-12**: parallel-07 spec line 141, 142 が満たされ、integration-fixes index の i05 行が完了状態に更新済み
- **AC-13**: 苦戦箇所 §3.3 の「`useFocusOnMount` hook 共通化を i06 / i07 完了後に検討する」記録が本 followup に確定状態で残る

---

## 5. 参照資料

- 親 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i05-login-loading-and-error-focus/spec.md`
- 親 index: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md`
- parallel-07 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md`（DoD line 141, 142）
- 関連 i06 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md`
- 関連 i07 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md`
- OKLch token 正本: `apps/web/src/styles/tokens.css`, `docs/00-getting-started-manual/specs/design-tokens.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/`（不変条件3）
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション（不変条件 1〜4）
- WCAG 2.1 SC 4.1.3 Status Messages（a11y 根拠）
