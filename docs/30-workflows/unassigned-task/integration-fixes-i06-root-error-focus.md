# integration-fixes-i06 root error.tsx h1 自動 focus 実装 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | integration-fixes-i06-root-error-focus                                                          |
| タスク名     | root `apps/web/app/error.tsx` の h1 への自動 focus 移譲を実装                                   |
| 分類         | 改善 / a11y (accessibility) integration-fix                                                     |
| 対象機能     | root route error boundary のスクリーンリーダー読み上げ促進                                       |
| 優先度       | 中（a11y 改善。i05 と同根の問題だが root error boundary 単独で対処可能で他タスクとの依存なし）   |
| 見積もり規模 | 極小（4 行差分 + spec 1 本）                                                                    |
| ステータス   | pending                                                                                         |
| 発見元       | improvements/integration-fixes 接続検証（i06 行）                                               |
| 発見日       | 2026-05-16                                                                                      |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/`
- 親 workflow 状態: `spec_ready_implementation_pending`
- 直接の親 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md`
- 親 parallel-07 spec section: 4.3 「Root error.tsx focus 管理」未達
- 関連実装:
  - `apps/web/app/error.tsx`（修正対象 / `useRef` + `headingRef.current?.focus()` 未実装）
  - `apps/web/app/error.spec.tsx`（新規または追記）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`parallel-07`（auth/shared error & loading UI alignment）の spec section 4.3 では、root `apps/web/app/error.tsx` に対して以下 3 点を要求していた:

1. `role="alert"` + `aria-live="assertive"` の設定
2. `error.digest` の表示（運用調査のための識別子）
3. **マウント直後に h1 へ自動 focus を移譲し、スクリーンリーダーがエラー見出しを即座に読み上げる挙動**

1 と 2 は既に実装済みだが、**3 の h1 への自動 focus 移譲が未実装** であることが integration-fixes 接続検証（i06 行）で確認された。実コード `apps/web/app/error.tsx` には `useRef<HTMLHeadingElement>` / `tabIndex={-1}` / `headingRef.current?.focus({ preventScroll: true })` のいずれも存在しない。

### 1.2 問題点・課題

- スクリーンリーダー利用者がエラー発生に気付くまでに遅延が生じる（`aria-live="assertive"` のみではフォーカス位置が前画面に残るケースがある）
- parallel-07 の DoD（spec 4.3）が未達のまま親 workflow (`ui-prototype-alignment-mvp-recovery`) が closing できない
- 同根の問題 (i05 = `/login/error.tsx` の focus 未管理) と別々に放置されると、a11y regression を体系的に検知する hook が育たない

### 1.3 放置した場合の影響

- root level の error boundary で a11y degradation が継続し、UI prototype alignment / MVP recovery の Phase 13 PR merge gate を通せない
- 後続で別 boundary（例: `/admin/error.tsx` 等）を追加する際にも同じ実装漏れが再発し、focus 管理の共通 hook 整備が進まない
- task-22 regression smoke で a11y baseline を取りに行く際、root error boundary の自動 focus baseline が無いため diff 検知が成立しない

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/web/app/error.tsx` の h1 にマウント直後の自動 focus を実装し、`parallel-07` spec 4.3 「Root error.tsx focus 管理」を達成する。

### 2.2 最終ゴール

- `apps/web/app/error.tsx` が `useRef<HTMLHeadingElement>` で h1 を bind
- `useEffect` 内で `logger.error` 呼び出しに続けて `headingRef.current?.focus({ preventScroll: true })` を実行
- h1 に `ref={headingRef}` と `tabIndex={-1}` を付与
- `apps/web/app/error.spec.tsx` に focus 移譲と digest 表示の単体検証を追加（新規または追記）
- `pnpm typecheck` / `pnpm lint` / 該当 vitest が PASS
- 親 spec の DoD 全項目達成

### 2.3 スコープ

#### 含むもの

- `apps/web/app/error.tsx` への `useRef` import 追加・ref 生成・focus 呼び出し・h1 への `ref` + `tabIndex={-1}` 付与
- `apps/web/app/error.spec.tsx` の新規作成または追記（focus 検証 + digest 検証）
- ローカル `pnpm typecheck` / `pnpm lint` / 該当 vitest 実行

#### 含まないもの

- error.tsx の文言変更
- `logger.error` 呼び出しシグネチャの変更
- 別 boundary（`/login/error.tsx` 等）の focus 管理修正（i05 で別途実施）
- `useAutoFocusOnMount(ref)` のような共通 hook 抽出（§3.3 横展開メモで言及するが本タスクスコープ外）
- error.tsx の CSS / OKLch トークン変更（`tabIndex={-1}` による visual outline 抑制は既存 focus-visible utility に委ねる）

### 2.4 成果物

- `apps/web/app/error.tsx` の修正差分（約 4 行）
- `apps/web/app/error.spec.tsx` の新規または追記差分
- 親 spec DoD 全項目に対応する evidence（typecheck / lint / test PASS log）

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 useRef / useEffect の実装漏れが発生した経緯

parallel-07 (`feat(task-parallel-07): auth/shared error & loading UI alignment`, commit `802b77a3`) で `apps/web/app/error.tsx` を整備した際、以下 3 要素のうち最後の 1 つを実装し忘れた:

1. `role="alert"` + `aria-live="assertive"` ← 実装済
2. digest 表示 ← 実装済
3. **h1 への自動 focus 移譲** ← **入れ忘れ**

原因は spec section 4.3 を `aria-live="assertive"` だけで満たしたと誤認したこと。`aria-live` は内容変更通知であり、フォーカス位置を移動させないため screen reader 利用者の体験は不十分。実装時の DoD 確認で「`useRef` の有無」「`tabIndex={-1}` の有無」をチェックリスト化していなかったことが直接の原因。

### 3.2 Next.js error boundary 特有の制約

Next.js App Router の `error.tsx` は **client component** として動作するため、以下を満たす実装でないと SSR mismatch / hydration warning を引き起こす:

- ファイル先頭の `"use client"` directive 維持（既存）
- `useRef` / `useEffect` を React 16+ 標準の hook として使用（SSR 中は実行されず client mount 後にのみ focus 呼び出しが走る）
- `headingRef.current?.focus({ preventScroll: true })` の `preventScroll: true` で視覚スクロール抑制 → モバイル端末でビューポート跳躍を防ぐ
- `tabIndex={-1}` を h1 に付与し、プログラム的 focus を許可しつつタブ移動の natural order からは外す

これらは Next.js / React の hook 規約と WAI-ARIA `tabIndex` 仕様を両立する書き方であり、特に `preventScroll: true` の指定漏れが過去に他プロジェクトで「focus 移動時に画面トップへスナップ」する UX 回帰を起こしたことがある（横展開注意点）。

### 3.3 解決策候補（実施順）

1. **最小差分実装**: 親 spec の Before / After 通り、`useRef` import → ref 生成 → useEffect 内 focus 呼び出し → h1 に `ref` + `tabIndex={-1}` の 4 行差分で完結させる。
2. **副作用順序の固定**: 既存 `useEffect` 内で `logger.error → focus` の順を厳守。順序を逆にすると、log 失敗時に focus が走らない競合を生む可能性がある。
3. **テスト追加**: `@testing-library/react` の `render` + `toHaveFocus()` で focus が当たることを検証。digest 表示も併せて検証し、既存 a11y 要素を巻き戻し regression として検知できるようにする。
4. **横展開（本タスク外、将来案）**: i05 と本タスク i06 が同根（error boundary h1 への focus 移譲）であるため、`apps/web/src/lib/a11y/useAutoFocusOnMount.ts`（仮）として共通 hook 化する案を提案。`useAutoFocusOnMount(ref, { preventScroll: true })` で 1 行化できれば、`/admin/error.tsx` 追加時にも漏れにくくなる。ただし本タスクでは i05 と i06 を独立に完了させた後、別 followup として hook 抽出するのが安全（並列実行中の i05 と本タスクで同じファイルを編集して衝突するのを避ける）。

### 3.4 学んだこと / 横展開メモ

- `aria-live="assertive"` ≠ 自動 focus。screen reader 体験を完成させるには両方必要。
- error boundary の DoD チェックリストには「ref / useEffect / tabIndex / preventScroll」の 4 項目を必須化する運用を、parallel-07 retrospective に反映する。
- 共通 hook `useAutoFocusOnMount(ref)` は i05 と i06 が両方 merge された後に抽出するのが安全。本タスク完了報告で followup 提案として残す。
- `tabIndex={-1}` を h1 に付ける際、既存 CSS で `:focus-visible` の outline が見出しに乗らないことを確認する。本タスクでは既存 `focus-visible` utility に変更を加えないため CSS 修正は不要。

---

## 4. 受入条件 (AC)

- **AC-1**: `apps/web/app/error.tsx` で h1 に `ref={headingRef}` と `tabIndex={-1}` が付与されている
- **AC-2**: 同ファイル内 `useEffect` で `logger.error → headingRef.current?.focus({ preventScroll: true })` の順序で副作用が実行される
- **AC-3**: `useRef` が React から import され、`useRef<HTMLHeadingElement>(null)` で生成されている
- **AC-4**: `apps/web/app/error.spec.tsx` に「マウント直後に h1 に focus が当たる」検証が存在し PASS する
- **AC-5**: `apps/web/app/error.spec.tsx` に「digest を表示する」検証が存在し PASS する
- **AC-6**: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` がローカルで 0 error / 0 warning（既存 baseline 維持）
- **AC-7**: `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error` が 0 fail で完走
- **AC-8**: parallel-07 spec section 4.3 「Root error.tsx focus 管理」DoD が達成済み（親 spec の DoD 5 項目すべて check 済）
- **AC-9**: 親 workflow `ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` 表中の i06 行が「実装済」状態として参照可能（PR merge 後に index.md 更新）
- **AC-10**: i05 と編集ファイルが重複しておらず、並列実行下で衝突していないこと（i05 = `apps/web/app/login/error.tsx` / 本タスク = `apps/web/app/error.tsx`）

---

## 5. 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md` — 直接の親 spec（Before/After サンプルコード含む）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` — 親 workflow index（i01〜i07 並列性表）
- `apps/web/app/error.tsx` — 修正対象実装
- `apps/web/app/error.spec.tsx` — 新規または追記対象テスト
- 関連 commit: `802b77a3` (`feat(task-parallel-07): auth/shared error & loading UI alignment`) — 実装漏れの起点
- 関連タスク (i05): `parallel-i05-login-loading-and-error-focus/spec.md` — 同根の問題で独立並列実行
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション 不変条件 1〜4 継承
