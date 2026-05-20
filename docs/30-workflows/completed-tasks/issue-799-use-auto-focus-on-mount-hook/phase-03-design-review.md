# Phase 03 — 設計レビュー

## レビュー観点

### 1. 責務分離

| 観点 | 判定 | 補足 |
| --- | --- | --- |
| hook 1 責務 | OK | mount 時 focus のみ。logger 呼び出しは boundary 側に残す |
| 過剰汎化 | OK | `T extends HTMLElement` の generic は h1 以外への現実適用（h2 等）にとどめ、複雑な option API は追加しない |
| 場所選定 | OK | `apps/web/src/lib/a11y/` 配下に集約。将来 a11y 系 hook 追加時の集約点となる |

### 2. 依存

- React 19 (`useEffect` + `RefObject`) のみ
- Next.js / Cloudflare Workers API 非依存（SSR/Edge どちらでも安全）

### 3. test 充足

- hook 単体 3 ケース + 4 boundary 各 1 focus assertion = 計 7 assertion 以上
- 既存 root error spec の AC を破壊しない (`focus({ preventScroll: true })` の呼び出しは維持)

### 4. リスク

| リスク | 対応 |
| --- | --- |
| `useEffect` 依存配列 `[]` で react-hooks/exhaustive-deps warn | `eslint-disable-next-line` で明示的に抑制（mount only が意図） |
| ref の generic 型推論失敗 | 呼び出し側は `useRef<HTMLHeadingElement>(null)` で明示する記述例を docs に含める |
| jsdom での `focus()` 挙動 | `vi.spyOn(element, "focus")` で観測する pattern を使い、jsdom focus 制約を回避 |

### 5. CLAUDE.md 整合

- 不変条件1（既存 API のみ接続）: 影響なし
- 不変条件2（OKLch token）: 影響なし
- 不変条件3（プロトタイプ正本順位）: 影響なし
- 不変条件8（`*.spec.tsx` 固定）: 遵守

## 結論

設計承認可能。Phase 04 に進む。
