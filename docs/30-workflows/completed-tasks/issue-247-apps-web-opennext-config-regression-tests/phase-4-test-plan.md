# Phase 4 — テスト計画

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. テスト戦略

本タスクの「実装」自体が vitest spec のため、本フェーズは spec 自身の検証手順を定義する（メタテスト）。

## 2. テスト対象

| 対象 | 種別 | 確認内容 |
|------|------|---------|
| `opennext-config-regression.spec.ts` | vitest | 5 AC 独立検証 |

## 3. 緑化条件（grow / pass）

現行コードに対し以下のコマンドで 4 it block 全 pass:

```bash
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts
```

## 4. 赤化条件（fail injection / 手動）

Phase 11 で以下 4 ケースを順に **一時挿入し、対応する 1 つの it のみが fail し残りが pass** することを確認する:

| inject | 対象 | 期待 fail |
|--------|------|-----------|
| 1 | `wrangler.toml` 先頭に `pages_build_output_dir = ".next"` 追加 | AC1 |
| 2 | `wrangler.toml` から `[env.staging.assets]` ブロック削除 | AC2 |
| 3 | `package.json` の `scripts` に `"deploy": "wrangler deploy"` 追加 | AC3 |
| 4 | `.assetsignore` から `*.spec.*` 行削除 | AC4 |

挿入後は必ず `git restore` で戻し、git status クリーンを確認する。

## 5. CI 検証

- `.github/workflows/ci.yml` の web job に step 追加 → GitHub Actions UI で job 名と status が表示されることを Phase 11 で確認

## 6. ローカル実行コマンド

```bash
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts
pnpm typecheck
pnpm lint
```

## 7. DoD

- 緑化条件・赤化条件 4 件・CI 検証それぞれの evidence が Phase 11 で残せる
