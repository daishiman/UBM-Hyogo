# Phase 6: テスト拡充

> Phase: 6 / 13

---

## 目的

回帰 guard / fail path / a11y 観点のテストを追加し、Phase 5 で導入した CSS / 属性の劣化を CI で検知できるようにする。

---

## 6.1 追加テスト

### Vitest

| テスト | spec ファイル | 目的 |
|--------|---------------|------|
| tag pill active state | `MemberFilters.client.spec.tsx` | active tag pill が `aria-pressed="true"` / `data-selected="true"` を持ち、`aria-selected` を持たない |
| section visibility が "public"|"member"|"admin" 以外を渡された場合 | `MemberDetailSections.component.spec.tsx` | TypeScript レベルで防がれることを type-level test or 実行時 fallback の確認 |
| FormPreviewSections の `data-visibility` 既存値伝搬 | `FormPreviewSections.component.spec.tsx` | label の `data-visibility` 属性が正しく伝搬 |

### axe (jest-axe)

| テスト | 対象 |
|--------|------|
| `MemberFilters` violations 0 | tag pill 含む render |
| `MemberDetailSections` violations 0 | visibility 3 種すべて render |

### Playwright

| テスト | 内容 |
|--------|------|
| transition timing 回帰 | `getComputedStyle(...).transitionDuration` が `--ubm-dur-fast` 解決値（例: `150ms`）と一致 |
| HEX 直書き smoke | `apps/web/src/**` を grep して HEX が 0 件であることを CI で確認（既存 `verify-design-tokens` で代替可ならスキップ） |

---

## 6.2 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual
```

---

## 6.3 DoD

- [ ] 追加 Vitest spec が Green
- [ ] axe violations 0
- [ ] Playwright transition 回帰テストが `completed (exit 0)`
