# Phase 08 — DRY 化

状態: `COMPLETED`
正本: `../../phase-08.md`

## 9 series 内 link 戦略（X.7 参照節 fixed format）

```markdown
### X.7 参照

- token: [09b §<番号>](./09b-design-tokens.md#<anchor>)
- primitive: [09c §<番号>](./09c-primitives.md#<anchor>)
- icon: [09d §<番号>](./09d-icons.md#<anchor>)
- prototype-map: [09a §<番号>](./09a-prototype-map.md#<anchor>) <!-- optional -->
```

## DRY 適用

- §X.4 API 表は現行 API 正本（apps/api / apps/web BFF / aiworkflow-requirements）を参照し、古い phase-3 endpoint 名を持ち込まない
- 視覚値は token 名 link に統一（HEX/oklch/px の重複定義禁止）
- §X.6 a11y は WAI-ARIA 標準語彙のみ使用
