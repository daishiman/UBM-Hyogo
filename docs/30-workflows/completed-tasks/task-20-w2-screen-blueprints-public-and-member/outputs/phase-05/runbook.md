# Runbook

## 1. prototype 確認

```bash
sed -n '4,154p' docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx
sed -n '208,338p' docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx
sed -n '339,472p' docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx
sed -n '4,67p' docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx
sed -n '220,373p' docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx
```

## 2. 執筆対象

```
docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md
docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md
```

## 3. grep gate

```bash
# 視覚値混入（fenced jsx ブロックを除外する目視 + awk フィルタ）
grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|\bbg-\[' docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md
grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|\bbg-\[' docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md

# 章立て count
grep -cE '^## [0-9]+\. ' docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md   # → 7
grep -cE '^## [0-9]+\. ' docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md   # → 3

# mermaid block
grep -c '^```mermaid' docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md      # ≥ 6
grep -c '^```mermaid' docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md      # ≥ 2
```

## 4. ローカルビルド・テストは不要

`apps/` / `packages/` 配下のコード変更なし。typecheck / lint / build は本タスクのスコープ外。
