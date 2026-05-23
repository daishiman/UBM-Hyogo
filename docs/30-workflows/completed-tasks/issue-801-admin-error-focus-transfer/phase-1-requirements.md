# Phase 1: Requirements — issue-801 admin error focus transfer

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-769 で root `apps/web/app/error.tsx` の h1 自動 focus 移譲を実装し、`parallel-07` spec section 4.3「Root error.tsx focus 管理」を達成した。同 Phase 12 unassigned-task-detection で **`/admin/error.tsx` への focus transfer 適用** が followup candidate として記録され、issue #801 として open している。

現状 `apps/web/app/(admin)/admin/error.tsx`（10 行スタブ）は以下が **すべて未実装**:

- `aria-live="assertive"`（screen reader 通知）
- `useRef<HTMLHeadingElement>` + `tabIndex={-1}` + `focus({ preventScroll: true })`（自動 focus 移譲）
- `error.digest` 表示（運用調査の識別子）
- `logger.error({ event: "error.boundary.caught", ... })`（構造化ログ）
- `process.env.NODE_ENV` 分岐の stack 抑制
- OKLch トークン className

admin route segment は管理者業務の中核（members 編集 / tags 管理 / meetings 操作 / schema 変更 / requests 承認 / identity-conflicts 解決 / audit 閲覧）であり、Next.js App Router の error boundary 仕様上 `(admin)/admin/error.tsx` は `/admin` page とその nested child routes の render error をキャッチする segment-level boundary として機能する。`apps/web/app/(admin)/layout.tsx` 由来の layout error は同階層の child boundary では捕捉できないため、本タスクの対象外とする。

### 1.2 問題点

- 管理者が screen reader 利用時にエラー発生に気付けず、誤った状態のまま操作続行するリスク
- `error.message` をそのまま画面表示しており、stack や内部識別子が本番でも露出しうる
- root boundary との a11y 実装非対称が `parallel-07` spec section 4.3 の DoD 未達を温存し、`task-22 regression smoke` で分岐ロジックが増えていく

### 1.3 放置した場合の影響

- a11y 退行のリスクが `/admin` page と nested child routes に滞留
- 共通 hook 抽出 (`useAutoFocusOnMount` / issue-769-followup-001) の整備順序が複雑化（admin を含めて 4 箇所同時 refactor が必要に）
- `ui-prototype-alignment-mvp-recovery` Phase 13 まで a11y 横展開未達が持ち越される

## 2. 何を達成するか（What）

### 2.1 目的

`apps/web/app/(admin)/admin/error.tsx` を root error.tsx と同等の a11y hardening 水準まで引き上げ、`/admin` page と nested child routes の render error boundary として `parallel-07` spec section 4.3 を満たす。

### 2.2 スコープ

#### 含むもの

- `apps/web/app/(admin)/admin/error.tsx` の全面書き換え
- `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` の新規追加
- `mise exec -- pnpm typecheck` / `pnpm lint` / 該当 vitest のローカル PASS

#### 含まないもの

- admin auth gate のロジック変更（`specs/13-mvp-auth.md` 不変）
- 管理 API のエラー型変更
- root / login / profile error.tsx の追加修正（別 followup）
- `useAutoFocusOnMount(ref)` 共通 hook の抽出（issue-769-followup-001 で別途）
- route-level error.tsx 分散配置（採用しない、§Phase 2 で根拠記録）

## 3. 受入条件（AC）

- **AC-1**: `(admin)/admin/error.tsx` で h1 に `ref={headingRef}` + `tabIndex={-1}` が付与されている
- **AC-2**: 同ファイル内 `useEffect` で `logger.error → headingRef.current?.focus({ preventScroll: true })` の順序で副作用実行
- **AC-3**: `useRef` / `useEffect` を React から import、`useRef<HTMLHeadingElement>(null)` で生成
- **AC-4**: 外側 wrapper に `role="alert"` + `aria-live="assertive"`
- **AC-5**: `error.digest` を `<code>` 内に表示する分岐が存在
- **AC-6**: `process.env.NODE_ENV !== "production"` の `isDev` 分岐で stack 表示（本番抑制）
- **AC-7**: 「トップへ戻る」リンク遷移先が `/`（公開 top）で、auth 切れ時の無限ループを回避
- **AC-8**: className が OKLch トークン (`text-danger` / `text-text-3` / `bg-surface-2` / `border-border` / `bg-accent` / `text-panel`) のみで構成。HEX 直書き / `bg-[#xxx]` / 旧 `ubm-color-*` 不在
- **AC-9**: `__tests__/error.component.spec.tsx` に「マウント直後に h1 へ focus」「`tabIndex=-1`」「`focus({preventScroll:true})` 呼び出し」の 3 検証が存在し PASS
- **AC-10**: 同 test に「digest 表示」「reset click で reset prop 1 回呼ばれる」「`logger.error` が `event="error.boundary.caught"` で 1 回呼ばれる」「rerender で 2 回呼ばれない」「isDev 分岐 stack 表示/抑制」が存在し PASS
- **AC-11**: `mise exec -- pnpm typecheck` 0 error
- **AC-12**: `mise exec -- pnpm lint` 0 error / 0 warning（既存 baseline 維持）
- **AC-13**: `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error` 0 fail
- **AC-14**: 親 spec `parallel-i06-root-error-focus/spec.md` section 4.3 admin segment 適用達成（trace 可能）
- **AC-15**: admin auth gate (`specs/13-mvp-auth.md`) 変更なし（`apps/web/middleware.ts` / auth 関連 diff 空）
- **AC-16**: D1 schema / `apps/api/src/routes/admin/*` endpoint surface 不変
