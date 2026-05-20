# Lessons Learned — issue-800 profile/login/admin error boundary focus transfer (2026-05)

Issue #769 で root `apps/web/app/error.tsx` のみに導入した h1 auto-focus を、profile / login / admin の error boundary (`apps/web/app/(public)/profile/error.tsx` ほか) へ scope 拡大し、`useAutoFocusOnMount` 共通 hook を `apps/web/src/lib/a11y/` に抽出した NON_VISUAL 実装タスク。followup-001/002/003 を 1 workflow に統合し、Phase 1-13 を 1 サイクルで完走した。focus 移譲設計・hook 抽出責務・effect deps の落とし穴で学びがあった。

## L-A11YFOCUS-001: error boundary focus 移譲は root 単独では不十分、scope 拡大は a11y baseline 統一の単位で行う

- 動機: Issue #769 で root error boundary のみに h1 focus 移譲を入れたが、profile / login / admin の各 error boundary は依然 mount 時に focus が hang し screen reader 利用者が boundary 切替を検知できない状態だった。boundary 単位の a11y 体験は「ある boundary だけで announce / 別 boundary では silent」という不均一が最も悪い UX を生む。
- 解消: followup-001 (profile) / followup-002 (login) / followup-003 (admin) を**同一 workflow** にまとめ、`error.tsx` を持つ全 boundary に同じ pattern (`useAutoFocusOnMount` + `tabIndex={-1}` + `aria-live="assertive"` + digest + `logger.error`) を一括導入。boundary が増えるたびに `useAutoFocusOnMount` を再利用する仕様にした。
- Why: a11y baseline は「全 boundary で同じ最低保証」が成立して初めて意味を持つ。1 つでも未対応 boundary があると assistive tech 利用者は boundary 単位の挙動差異を学習する必要があり認知負荷が増す。
- 適用範囲: error boundary / loading boundary / not-found boundary など Next.js App Router の reserved file 全般。a11y 仕様変更時は boundary 全体を 1 wave で更新する。

## L-A11YFOCUS-002: 共通 hook 抽出は「3 callsite」で初めて発火する（rule of three）

- 動機: 当初 root error boundary 単独 (Issue #769) では `useRef + useEffect + focus({ preventScroll: true })` を error.tsx 内に直書きしていた。profile / login / admin に拡大する段階で同じ 4 行が 4 boundary に重複する状態になり、a11y 仕様変更時に 4 箇所同期が必要になる drift リスクが顕在化した。
- 解消: `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` を新規作成し `useEffect` + `ref.current?.focus(options)` を hook 化。signature は `useAutoFocusOnMount<T extends HTMLElement>(ref: RefObject<T | null>, options?: FocusOptions): void`。各 error boundary は hook 呼び出し 1 行に簡略化。
- Why: 2 callsite では DRY 違反の判定が早すぎる場合があるが、4 callsite は明確に hook 化の閾値を超える。将来 dialog / modal / drawer mount 時の focus 移譲にも再利用可能なため、`lib/a11y/` という domain-neutral path に置いた（`features/error/` 等の boundary-specific path には置かない）。
- 適用範囲: hook 抽出判断全般。callsite 数だけでなく「a11y / security / logging」など boundary を超えて統一すべき責務が含まれる場合は 2 callsite でも前倒し抽出を検討する。

## L-A11YFOCUS-003: `tabIndex={-1}` 付与責任は hook 内ではなく呼び出し側 (JSX) に置く

- 動機: `useAutoFocusOnMount` が ref を受け取って focus を当てる以上、対象要素に `tabIndex={-1}` を自動付与したくなる誘惑があった。だが hook 側で DOM mutation すると React の rendering model から外れた副作用になり、SSR / hydration 不整合 / strict mode double mount 時の挙動が不安定になる。
- 解消: `tabIndex={-1}` の付与は呼び出し側 JSX (`<h1 ref={headingRef} tabIndex={-1}>`) の責任とし、hook 側は ref が受け取った要素を「focus 可能と仮定する」契約にした。hook の JSDoc / 型定義に「対象要素は focus 可能であること（interactive 要素か `tabIndex` 付き非対話要素）」を明記。
- Why: 「hook が DOM 属性を mutate しない」契約により、SSR / hydration / strict mode で同じ振る舞いを保証できる。hook の責務を「effect 実行」のみに絞ることで、呼び出し側が `tabIndex` を `0` にしたい場合 (focusable + tabbable) や対象要素を `<button>` などの interactive 要素に変えた場合にも hook を変更せず再利用できる。
- 適用範囲: DOM mutation を伴うか迷う custom hook 全般。React rendering model に従い「mutation は JSX、effect は hook」の責務分離を守る。

## L-A11YFOCUS-004: `preventScroll: true` を hook デフォルトにすると screen reader user の体験が安定する

- 動機: 標準 `HTMLElement.focus()` は対象要素が viewport 外にある場合スクロールを発火する。boundary mount 時に `role="alert"` の h1 へ programmatic focus を当てた瞬間にページがジャンプすると、視覚利用者・拡大鏡利用者の体験を壊す。screen reader user は announce で boundary 切替を検知できるためスクロールは不要。
- 解消: `useAutoFocusOnMount` の `options` 引数のデフォルトを `{ preventScroll: true }` 相当（呼び出し側で `focus({ preventScroll: true })` 相当を強制）にし、呼び出し側で `options` を渡さない呼び出しでも安全な挙動を保証。
- Why: a11y デフォルトは「最も体験を壊さない」方向に倒すべき。`preventScroll: true` は IE 非対応だが本プロジェクトのブラウザ matrix では問題なし。デフォルトを `false` にすると新規 boundary 追加時に毎回 `preventScroll` 指定を忘れる drift が起きる。
- 適用範囲: a11y 系 hook / utility の API 設計全般。「安全な側のデフォルト」を原則にする。

## L-A11YFOCUS-005: `useEffect` deps を `[ref, options]` にすると options 再生成で再 focus 暴走、mount-only 動作は `[]` + lint disable で担保する

- 症状: `useAutoFocusOnMount(ref, options)` の useEffect deps を `[ref, options]` にすると、呼び出し側で `options` を inline object literal (`{ preventScroll: true }`) で渡している場合、render のたびに `options` reference が変わり再 focus が走る。逆に `[]` にすると `react-hooks/exhaustive-deps` の lint warning が出る。
- 解消: 設計上「mount-only 1 回 focus」を契約とし、deps `[]` + 該当行に `// eslint-disable-next-line react-hooks/exhaustive-deps` を付ける選択を採用。代替案として `useRef` で `options` を pin する案・呼び出し側で `useMemo` する案も検討したが、いずれも呼び出し側に責務が漏れるため不採用。hook JSDoc に「mount 時 1 回のみ focus、props 変更による再 focus は仕様外」と明記。
- Why: 「options 変更で再 focus」は a11y 観点でほぼ never 必要な挙動。lint disable + JSDoc 明文化で意図を残す方が、呼び出し側に `useMemo` を強制するより API として健全。
- 適用範囲: mount-only 副作用を持つ custom hook 全般。「lint 警告 vs API 健全性」のトレードオフは API 健全性側に倒す。
