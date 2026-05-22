# Phase 5: 実装手順 — error boundary focus hook + 横展開

**[実装区分: 実装仕様書]**

## 0. 方針変更

初期計画は `/profile/error.tsx` 単独の inline 実装だったが、30種レビューで `/login/error.tsx` と `(admin)/admin/error.tsx` に同じ a11y 漏れが残り、`issue-769-followup-001` の hook 抽出条件（3 箇所目）が成立していることを確認した。CONST_008 に従い、未タスク送りではなく今回サイクルで横展開まで回収する。

`scope: "profile"` は source follow-up 側の候補だったが、root parity と既存 `logger.error({ event, digest, err })` 契約を優先し、全 boundary で payload shape を揃える。

## 1. 実装対象

| Path | 内容 |
| --- | --- |
| `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` | `preventScroll: true` default の共通 hook を追加 |
| `apps/web/app/error.tsx` | focus 副作用を hook に委譲 |
| `apps/web/app/profile/error.tsx` | root 同等の digest / aria-live / logger / focus を実装し hook を利用 |
| `apps/web/app/login/error.tsx` | console.error 実装を root 同等の error boundary に置換 |
| `apps/web/app/(admin)/admin/error.tsx` | message 露出のみの簡易 boundary を root 同等の実装に置換 |
| `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx` | hook 単体テスト |
| `apps/web/app/{profile,login}/__tests__/error.component.spec.tsx` | route boundary の focus / digest / logger tests |
| `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` | admin boundary の focus / digest / logger tests |

## 2. 実装要点

- `useAutoFocusOnMount(ref, options?)` は `{ preventScroll: true, ...options }` を渡す。
- `tabIndex={-1}` は呼び出し側責務として h1 に残す。
- `logger.error` の effect を hook 呼び出しより上に置き、ログ記録後に focus effect が走る順序を維持する。
- wrapper は `role="alert" aria-live="assertive"`、digest は存在時のみ `<code>` で表示する。
- production では stack を表示せず、dev only の `<pre>` に限定する。

## 3. ローカル品質ゲート

```bash
pnpm exec vitest run apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx apps/web/app/__tests__/error.component.spec.tsx apps/web/app/profile/__tests__/error.component.spec.tsx apps/web/app/login/__tests__/error.component.spec.tsx 'apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx'
pnpm -F "@ubm-hyogo/web" typecheck
pnpm -F "@ubm-hyogo/web" lint
```

## 4. ロールバック手順

```bash
git checkout -- apps/web/app/error.tsx apps/web/app/profile/error.tsx apps/web/app/login/error.tsx 'apps/web/app/(admin)/admin/error.tsx'
rm -rf apps/web/src/lib/a11y apps/web/app/profile/__tests__ apps/web/app/login/__tests__ 'apps/web/app/(admin)/admin/__tests__'
```
