# Phase 01 — 要件整理

## 目的

`useAutoFocusOnMount` 共通 hook の責務範囲・呼び出し契約・適用対象 boundary を確定する。

## 入力

- Issue #799 本文
- `docs/30-workflows/unassigned-task/issue-769-followup-001-use-auto-focus-on-mount-hook.md`
- 既存実装: `apps/web/app/error.tsx`（i06 root error focus）
- 既存テスト: `apps/web/app/__tests__/error.component.spec.tsx`

## 機能要件 (FR)

- **FR-1**: `useAutoFocusOnMount<T extends HTMLElement>(ref: RefObject<T | null>)` の signature で、mount 時 1 回だけ `ref.current?.focus({ preventScroll: true })` を呼ぶ
- **FR-2**: SSR 環境では何もしない（`useEffect` 経由で client only に閉じる）
- **FR-3**: ref が null の場合 noop（throw しない）
- **FR-4**: ref オブジェクト identity の変更で再 focus しない（依存配列空 `[]` で mount 時のみ）
- **FR-5**: i06 (root) / i05 (login) / profile / admin の 4 error boundary で同一 hook を使用する
- **FR-6**: 起点 unassigned spec は i05/i06 前提・`options?: FocusOptions` 前提だったが、現行コード調査では root のみ既存 focus 実装、login/profile/admin は未対応だったため、本 workflow では 4 boundary 横展開へ再定義する

## 非機能要件 (NFR)

- **NFR-1 (a11y)**: WAI-ARIA `role="alert"` を持つ container 内の h1 を focus 起点とし、AT に対して即時告知する
- **NFR-2 (no-scroll)**: `preventScroll: true` を必須とし、view 位置を保持する
- **NFR-3 (test)**: hook 単体テストで focus 呼び出し回数 = 1、preventScroll 引数 = true を assert する
- **NFR-4 (type)**: `tsconfig` strict mode で型エラーゼロ
- **NFR-5 (lint)**: `pnpm lint` pass
- **NFR-6 (a11y regression)**: 既存 `error.component.spec.tsx` の AC を維持

## 制約

- `useRef<HTMLHeadingElement>` 以外の HTMLElement にも適用可能な generic にする（将来の modal 等への流用余地確保のためではなく、`h1` 以外の要素にも適用される現実的な可能性を許容するため。CONST_004 例外: 過剰汎化はしない）
- React 19 / Next.js 16 環境で動作する
- Cloudflare Workers (`@opennextjs/cloudflare`) bundle に焼き込まれるため、Node.js 専用 API を使わない
- `FocusOptions` opt-out API は採用しない。今回の対象は error boundary h1 への安全側 focus 移譲に限定し、`preventScroll: true` を固定することで指定漏れを構造的に防ぐ

## 受入条件 (AC) 抜粋

- AC-1: 4 つの error boundary で h1 が mount 時に focus される
- AC-2: hook の単体 spec が 3 ケース以上（happy path / ref null / preventScroll arg）を網羅
- AC-3: `pnpm typecheck && pnpm lint` pass

詳細は `outputs/phase-01/requirements.md` 参照。
