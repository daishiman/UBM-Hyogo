# Phase 11: 手動テスト

## 1. 起動

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

別 terminal で:

```bash
open http://localhost:3000/profile
```

> `/profile` は認証必須のため、未ログインの場合は `/login` 経由で auth 状態を作る（memory: `manju.manju.03.28@gmail.com` がテスト一般会員）。

## 2. 通常 navigation での skeleton 確認

DevTools → Network → Throttling を `Slow 3G` に設定して以下を実行:

1. `/login` から sign-in 後 `/profile` に遷移
2. skeleton (avatar + heading + 4 KV bars) が一瞬表示される
3. streaming 完了で本体 page に差し替わる
4. layout shift が視覚的に大きくない（CLS 観点）

## 3. reduced-motion 確認

macOS: システム設定 → アクセシビリティ → ディスプレイ → 「視差効果を減らす」を ON。

または DevTools → Rendering → `Emulate CSS media feature prefers-reduced-motion` → `reduce`。

- skeleton block の pulse animation が停止すること
- 静止 placeholder として表示されること

## 4. screen reader 確認（任意）

macOS VoiceOver (Cmd+F5) で `/profile` を開き:

- 「マイページを読み込み中」が読み上げられること（`.sr-only`）
- streaming 完了後、本体 heading が読み上げられること

## 5. DevTools accessibility tree 確認

DevTools → Elements → Accessibility パネルで root `<main>` を選択:

- Role: `status`
- aria-busy: `true`
- aria-live: `polite`

## 6. data-page 属性確認

DevTools console:

```js
document.querySelector('[data-page="profile-loading"]')
```

streaming 中に skeleton が取得できること。

## 7. visual baseline 影響確認（参考）

`/profile` の visual baseline は task-709 で 3 viewport × 1 route 撮影済み。loading boundary は別 capture のため baseline diff は発生しない見込み（必要なら別 PR で再撮影）。

## 8. evidence inventory / runtime boundary

| Evidence | 状態 |
|---|---|
| focused unit test / typecheck / lint / HEX grep | Phase 11 evidence として `outputs/phase-11/evidence/` に保存 |
| local component screenshot | `outputs/phase-11/screenshots/profile-loading-local-component-desktop.png` に保存 |
| screenshot coverage / metadata | `outputs/phase-11/screenshot-coverage.md`, `outputs/phase-11/screenshots/screenshot-plan.json`, `outputs/phase-11/screenshots/phase11-capture-metadata.json` に保存 |
| authenticated browser screenshot | user-gated runtime visual evidence。未取得でも local implementation 完了は阻害しない |
| staging runtime smoke | user-gated |

## 9. local screenshot capture

Authenticated runtime 遷移は user-gated のため、Phase 11 では実装 DOM と同じ形状を isolated local component render として capture した。

| Test Case | Screenshot | Coverage |
|---|---|---|
| TC-VIS-01 | `outputs/phase-11/screenshots/profile-loading-local-component-desktop.png` | avatar + heading + 4 key-value skeleton blocks |

## 10. 確認後の状態更新

- Phase 5 §6 に従い parallel-07 spec / i07 spec / integration-fixes index を更新
