# Phase 12 — implementation guide

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. 目的

apps/web OpenNext on Workers 構成の構造的不変条件 4 件を vitest で機械検証し、CI で PR ブロッカーとして組み込む。

## 2. 変更対象

| パス | 種別 |
|------|------|
| `apps/web/__tests__/opennext-config-regression.spec.ts` | 新規 vitest |
| `.github/workflows/ci.yml` | Type check 後に focused guard step 追加 |

## 3. 実装ガイド

`phase-5-implementation.md` §2 の TypeScript snippet を正本とする。要点:

- repo root から `apps/web/wrangler.toml` / `package.json` / `.assetsignore` を read-only で読む
- 対象 TOML の section / scalar / string-array だけを読む test-local parser を使い、追加依存を増やさない
- 4 it block は AC と 1:1
- assert msg は drift 個所が一意特定できる文言

## 4. CI 組み込み

```yaml
- name: OpenNext config regression guard
  run: pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts
```

## 5. ローカル検証コマンド

```bash
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts
pnpm typecheck
pnpm lint
```

## 6. regression 観点

実ファイルを汚す drift inject ではなく、focused Vitest の構造 assertion で以下を直接検証する: Pages output 禁止、top-level/env assets binding、package deploy script 禁止、`.assetsignore` required lines。

## 7. PR まで

`phase-13-pr.md` の手順に従う。commit/push/PR は user-gated。
