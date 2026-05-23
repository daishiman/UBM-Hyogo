---
phase: 1
title: 要件定義 — /login の loading 新規作成と error focus 管理
workflow_id: parallel-i05-login-loading-and-error-focus
status: completed
taskType: implementation
visualEvidence: VISUAL
implementation_mode: new
---

# Phase 1: 要件定義

[実装区分: 実装仕様書]

## 1. 目的

`/login` route の Next.js App Router boundary を整備する:

1. `loading.tsx` を新規作成し、route transition 中に OKLch skeleton + a11y 属性付き status を表示する
2. `error.tsx` を改修し、エラー発生時に h1 へ自動 focus を移譲、`aria-live="assertive"` を追加、`error.digest` を条件表示する

## 2. carry-over 確認

- 親 workflow `ui-prototype-alignment-mvp-recovery` の task-05 / task-07 (parallel-07-auth-and-shared) で宣言された §4.1 / §4.2 が未実装である
- 直近 `git log --oneline -5`（`1d200aa6 feat: UI prototype design system foundation ...` ほか）で `apps/web/app/login/` 配下に loading.tsx が存在しないことを確認する
- 兄弟タスク i06 / i07 は同 integration-fixes 配下の別 spec として並列扱い（本 SW スコープ外）

## 3. 機能要件

| ID | 要件 | 根拠 |
|----|------|------|
| FR-01 | `apps/web/app/login/loading.tsx` を新規作成し、Next.js App Router の loading boundary として render される | parallel-07 spec §4.1 |
| FR-02 | loading 要素は `role="status"` / `aria-busy="true"` / `aria-live="polite"` を持つ | a11y 要件 |
| FR-03 | sr-only テキスト「ログイン画面を読み込み中」を含む | screen reader アナウンス |
| FR-04 | skeleton は OKLch token 由来 utility（`bg-surface-2` 等）で `motion-safe:animate-pulse` を持つ | parallel-03 token 整合 |
| FR-05 | `apps/web/app/login/error.tsx` の h1 に `useRef` を bind し、mount 直後に `focus({ preventScroll: true })` を呼ぶ | parallel-07 spec §4.2 |
| FR-06 | `<section>` に `aria-live="assertive"` を追加（既存 `role="alert"` を維持） | screen reader 即時アナウンス |
| FR-07 | `error.digest` が truthy のときのみ `<code>error id: {digest}</code>` を render | digest 表示は条件付き |
| FR-08 | `reset` button click は既存挙動を維持（`reset()` 呼び出し） | 回帰防止 |

## 4. 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（grep gate 0 件） |
| NFR-02 | `bg-surface-2` 等 token utility が未定義の場合は `apps/web/src/styles/globals.css` `@layer utilities` に最小定義を追加する（HEX 禁止） |
| NFR-03 | `pnpm typecheck` / `pnpm lint` / `next build --webpack` が exit 0 |
| NFR-04 | 新規テストは `*.spec.tsx` のみ（`*.test.tsx` 禁止 — CLAUDE.md 不変条件 8） |
| NFR-05 | jest-axe が既存導入されている場合、loading / error それぞれで `toHaveNoViolations()` を 1 件追加（任意） |
| NFR-06 | `process.env.*` 直接参照は導入しない（`apps/web/src/lib/env.ts` の `getEnv()` 経由方針を継承） |

## 5. 不変条件（CLAUDE.md 継承）

1. 既存 API endpoint surface のみ接続（UI のみ変更）
2. OKLch トークン正本性維持
3. プロトタイプ正本順位を尊重（新規 primitive を生やさない）
4. D1 直接アクセス禁止（本 SW では該当なし）
5. 新規テストは `*.spec.{ts,tsx}` のみ

## 6. スコープ境界

### IN
- `apps/web/app/login/loading.tsx`（新規）
- `apps/web/app/login/error.tsx`（修正）
- `apps/web/app/login/loading.spec.tsx`（新規）
- `apps/web/app/login/error.spec.tsx`（新規 or 修正）
- `apps/web/src/styles/globals.css`（`bg-surface-2` utility 未定義時のみ最小追加）

### OUT
- root `app/error.tsx`（i06）
- `app/profile/loading.tsx`（i07）
- `Card` / `CardContent` 新規実装（既存があれば best-effort で採用）
- Tailwind config 変更
- 認証 flow 本体の変更

## 7. 既存命名規則の確認

- ファイル: `loading.tsx` / `error.tsx`（Next.js App Router 規約に固定）
- spec: kebab-case + `.spec.tsx` サフィックス
- React component: PascalCase（`LoginLoading` / `LoginError`）
- data-attribute: kebab-case（`data-page="login-loading"` / `data-page="login-error"`）
- token utility: `bg-surface-2` のような kebab + token 名（既存命名と整合）

## 8. UI/docs-only 判定

- 判定: **UI task / VISUAL**
- 根拠: `/login` route の表示要素が変わる（skeleton 追加、error UI の DOM 構造変化）
- Phase 11 では `screenshot-plan.json` の `mode: "VISUAL"` を採用する

## 9. 受け入れ条件

1. `/login` 初回 navigation 中に skeleton が render され `role="status"` / `aria-busy="true"` を持つ
2. `/login` で SSR/RSC 例外発生時、h1 に focus が移譲される
3. `<section>` が `aria-live="assertive"` を持つ
4. `error.digest` 表示が条件 render である
5. `loading.spec.tsx` / `error.spec.tsx` が PASS
6. token grep gate（HEX / `bg-\[#` / `text-\[#`）が 0 件
7. `pnpm typecheck` / `pnpm lint` / `pnpm build` が exit 0

## 10. 参照

- 発注書: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i05-login-loading-and-error-focus/spec.md`
- 親 SCOPE: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- 親 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md` §4.1 / §4.2
- token 正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- Next.js App Router loading/error 規約: 公式ドキュメント


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 1 |
| status | completed |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的

/login loading boundary と error focus management を、実装・証跡・仕様の状態語彙が矛盾しない形で完了させる。

## 実行タスク

- 対象 phase の本文に従い、/login の loading / error / test / evidence contract を確認する。
- 実装済み差分と workflow state の整合を維持する。
- Phase 13 の commit / push / PR / runtime screenshot は user approval まで実行しない。

## 参照資料

- docs/30-workflows/parallel-i05-login-loading-and-error-focus/index.md
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/artifacts.json
- docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md

## 成果物

- apps/web/app/login/loading.tsx
- apps/web/app/login/error.tsx
- apps/web/app/login/loading.spec.tsx
- apps/web/app/login/error.spec.tsx
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-11/
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-12/

## 完了条件

- Focused Vitest が exit 0。
- Phase 12 compliance check が exit 0。
- 矛盾なし・漏れなし・整合性あり・依存関係整合の 4 条件が completed。

## 統合テスト連携

Focused Vitest: `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/app/login/error.spec.tsx apps/web/app/login/loading.spec.tsx`。Runtime screenshot は user-gated evidence として Phase 13 境界に残す。
