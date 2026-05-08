# Phase 04: 検証戦略

state: COMPLETED

## 検証 Layer

### Layer 1: markdown 構造

```bash
wc -l docs/00-getting-started-manual/specs/09b-design-tokens.md   # ≥ 380
grep -c '^## ' docs/00-getting-started-manual/specs/09b-design-tokens.md  # = 12
grep -cE '`--ubm-[a-z0-9-]+`' docs/00-getting-started-manual/specs/09b-design-tokens.md  # ≥ 60
grep -c '@theme inline' docs/00-getting-started-manual/specs/09b-design-tokens.md  # ≥ 1
grep -c '@supports not' docs/00-getting-started-manual/specs/09b-design-tokens.md  # ≥ 1
grep -c 'data-theme="dark"' docs/00-getting-started-manual/specs/09b-design-tokens.md  # ≥ 1
```

### Layer 2: JSON 健全性

```bash
awk '/^```json$/,/^```$/' docs/00-getting-started-manual/specs/09b-design-tokens.md \
  | sed '/^```/d' | jq . > /dev/null
```

### Layer 3: OKLch / HEX cross-check

`outputs/phase-09/cross-check.sh` で `styles.css` L1-L70 の literal 値が
`09b-design-tokens.md` に欠落 0 で含まれることを確認する。

### Layer 4: markdown lint

`pnpm lint:md` が package.json 未定義の場合は WARNING_NO_SCRIPT として記録。

### Layer 5: diff scope

`git diff --name-only main...HEAD` の出力範囲確認（SCOPE.md §6）。

## NON_VISUAL evidence

screenshot は適用外。`outputs/phase-11/evidence/` に以下を保存:

- `markdown-structure.log`
- `json-parse.log`
- `cross-check.log`
- `lint-md.log`
- `scope-diff.log`
