[実装区分: 実装仕様書]

# Phase 7: CI workflow / lefthook / package.json 統合

## メタ情報

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-05-15 |
| Phase 状態 | completed |
| 出力 | `outputs/phase-07/main.md` |

## 変更対象ファイル一覧

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `.github/workflows/verify-stable-key-update.yml` | new | CI gate |
| `lefthook.yml` | modify | pre-commit に `block-stable-key-update` 追加 |
| `package.json` | modify | `lint:stable-key-update` / `lint:stable-key-update:strict` script 追加、`lint` chain に組み込み |

## CI workflow（雛形）

```yaml
# 目的: schema_questions.stable_key の direct UPDATE を CI で恒久拒否する gate
# 不変条件: #14 / Schema Alias Resolution Contract
# 起票: GitHub Issue #300
name: verify-stable-key-update

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

permissions:
  contents: read

concurrency:
  group: verify-stable-key-update-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify-stable-key-update:
    name: verify-stable-key-update
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - uses: actions/setup-node@v4
        with:
          node-version: 24.15.0
          cache: pnpm

      - name: Run stable-key-update guard (strict)
        run: node scripts/lint-stable-key-update.mjs --strict
```

## lefthook 追加（pre-commit）

```yaml
pre-commit:
  parallel: true
  commands:
    # ... 既存
    block-stable-key-update:
      run: node scripts/lint-stable-key-update.mjs --strict
      stage_fixed: false
      fail_text: |
        🚫 direct `schema_questions.stable_key` mutation is forbidden (invariant #14).
        Write to `schema_aliases` instead via POST /admin/schema/aliases.
        詳細: .claude/skills/aiworkflow-requirements/references/database-implementation-core.md
```

## package.json scripts 追加 / 変更

```jsonc
{
  "scripts": {
    "lint:stable-key-update": "node scripts/lint-stable-key-update.mjs",
    "lint:stable-key-update:strict": "node scripts/lint-stable-key-update.mjs --strict",
    "lint": "node scripts/lint-boundaries.mjs && pnpm run lint:deps && node scripts/lint-stablekey-literal.mjs && node scripts/lint-stable-key-update.mjs --strict && pnpm -r lint"
  }
}
```

> 既存 `lint` chain の末尾に `node scripts/lint-stable-key-update.mjs --strict` を挿入し、`pnpm -r lint` の前に直列実行する。

## 統合テスト連携

- Phase 9 で `mise exec -- pnpm lint` がチェーン全体 PASS することを確認
- `git commit` 経由で lefthook が発火するスモークを Phase 11 manual smoke で実施
- CI 実行は Phase 13 PR 作成時に確認（implemented-local runtime pending cycle では未実行）

## 完了条件

- [ ] CI workflow 仕様確定
- [ ] lefthook 追加 hook 仕様確定
- [ ] package.json scripts 確定（既存 `lint` chain の冪等性を維持）

## 次Phase

Phase 8（docs 同期）
