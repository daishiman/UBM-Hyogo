# Phase 11 — エビデンス計画 / Manual Test

## visualEvidence 判定

`NON_VISUAL` — UI 文言・layout・color token に変更なし。focus 管理は ARIA 振る舞いであり screenshot 比較対象外。

## Evidence 表

| ID | 種別 | 取得方法 | 配置先 |
| --- | --- | --- | --- |
| EV-1 | typecheck | `pnpm typecheck` の stdout | `outputs/phase-11/evidence/typecheck.txt` |
| EV-2 | lint | `pnpm lint` の stdout | `outputs/phase-11/evidence/lint.txt` |
| EV-3 | hook + boundary + web vitest | vitest reporter 結果 | `outputs/phase-11/evidence/web-vitest.txt` |
| EV-4 | verify-pr-ready | `bash scripts/verify-pr-ready.sh` の stdout | `outputs/phase-11/evidence/verify-pr-ready.txt` |
| EV-5 | a11y manual (任意) | Chrome DevTools Accessibility tree で h1 focus 受領を確認 | `outputs/phase-11/a11y-manual.md`（テキスト記録） |
| EV-6 | a11y manual (任意) | Chrome DevTools Accessibility tree で「画面を表示できませんでした」h1 が focus 受領を確認 | `outputs/phase-11/a11y-manual.md`（テキスト記録） |

## 取得コマンド集

```bash
pnpm --filter @ubm-hyogo/web typecheck 2>&1 | tee outputs/phase-11/evidence/typecheck.txt
pnpm --filter @ubm-hyogo/web lint 2>&1 | tee outputs/phase-11/evidence/lint.txt
pnpm --filter @ubm-hyogo/web test -- --reporter=verbose \
  apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx \
  apps/web/app/__tests__/error.component.spec.tsx \
  apps/web/app/login/__tests__/error.component.spec.tsx \
  apps/web/app/profile/__tests__/error.component.spec.tsx \
  "apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx" \
  2>&1 | tee outputs/phase-11/evidence/web-vitest.txt
bash scripts/verify-pr-ready.sh 2>&1 | tee outputs/phase-11/evidence/verify-pr-ready.txt
```

## verify-pr-ready 境界

本レビューサイクルでは commit / PR が禁止されているため、`verify-pr-ready.sh` は `verify:phase12-compliance` と `gate-metadata:validate` を PASS し、最後に regenerated index files が未コミットであることを `indexes:rebuild drift` として検出する。この failure は Phase 13 handoff 前の未コミット差分検出であり、実装・証跡不備ではない。

## 不足時のフォールバック

- jsdom が `focus()` を sentinel として呼び出すのみで実 focus stack は持たない → component spec で `vi.spyOn(HTMLHeadingElement.prototype, "focus")` で観測
- 実機 a11y は EV-6 で manual ノートとして補完。screenshot 不要
