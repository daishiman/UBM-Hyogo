# Phase 12 — 実装ガイド / Documentation (canonical 9 headings)

## 1. 概要 (Overview)

`apps/web/app/error.tsx` (i06 root) で実装済みの `useRef + useEffect + focus({ preventScroll: true })` パターンを `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` として共通化し、未対応の 3 boundary (`/login` / `/profile` / `/(admin)/admin`) にも同パターンを適用する。

## 2. 中学生レベル概念説明 (Concept for Beginners)

ウェブページでエラーが起きたとき、目の見えない人が使うスクリーンリーダーは「いま画面に何が表示されているか」を読み上げてくれます。ただし、何もしないと「エラー画面に変わったよ」とは気付いてくれません。そこで、エラーが出た瞬間に画面の見出し (h1) に「カーソル（focus）」を移すと、スクリーンリーダーが自動でその見出しを読み上げてくれます。

このタスクでは、その「カーソルを移す処理」をひとつの再利用できる部品 (hook) として切り出し、4 つあるエラー画面すべてで同じやり方を使えるようにします。`preventScroll: true` というオプションを付けるのは、カーソルを移すときに画面が勝手にスクロールしないようにするためです。

## 3. 実装範囲 (Implementation Scope)

| カテゴリ | ファイル |
| --- | --- |
| 新規 hook | `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` |
| 新規 spec | `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx` |
| 編集 (置換) | `apps/web/app/error.tsx` |
| 編集 (適用) | `apps/web/app/login/error.tsx`, `apps/web/app/profile/error.tsx`, `apps/web/app/(admin)/admin/error.tsx` |
| 新規/編集 spec | 4 boundary 各 `error.component.spec.tsx` |

## 4. アーキテクチャ (Architecture)

```
apps/web/
├── src/lib/a11y/
│   ├── useAutoFocusOnMount.ts          (新規: hook 本体)
│   └── __tests__/useAutoFocusOnMount.spec.tsx
└── app/
    ├── error.tsx                       (hook 経由に置換)
    ├── login/error.tsx                 (hook 適用)
    ├── profile/error.tsx               (hook 適用)
    └── (admin)/admin/error.tsx         (hook 適用)
```

責務分離: hook = focus only / boundary = logging + UI。

## 5. テスト戦略 (Test Strategy)

- hook 単体: 3 ケース (mount focus / ref null / re-render)
- 各 boundary: focus assertion 追加（既存テストは AC 維持）
- coverage: hook 100% line/branch、各 boundary は既存閾値維持

## 6. 受け入れ基準 (Acceptance) — Phase 09 参照

`phase-09-quality-assurance.md` AC-1 〜 AC-14 を引用。

## 7. リスクと緩和策 (Risks & Mitigations)

| リスク | 緩和策 |
| --- | --- |
| `exhaustive-deps` lint warn | `eslint-disable-next-line` で mount-only 意図を明示 |
| jsdom focus 制約 | `vi.spyOn(HTMLElement.prototype, "focus")` で観測 |
| 既存 root spec の破壊 | hook 経由でも同じ `focus({ preventScroll: true })` が呼ばれるため AC 不変 |

## 8. Phase 11 Evidence 表 — Phase 11 参照

`phase-11-manual-test.md` EV-1〜EV-6 のとおり。`outputs/phase-11/` 配下に取得。

## 9. 後続タスク (Follow-ups)

なし（CONST_007 単一サイクル完結）。同 `apps/web/src/lib/a11y/` 配下に modal/dialog 系 hook を追加する将来タスクは別 issue 化を要しない（必要時に随時追加）。
