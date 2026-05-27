# Phase 1 — 要件定義

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. 背景

UT-06-FU-A で apps/web を Cloudflare Pages 形式から OpenNext on Workers 形式へ移行した。移行の正しさは設定ファイル上の構造的不変条件に依存しており、目視レビューだけが頼りの状態が続いている。

## 2. ステークホルダー

| 役割 | 担当 |
|------|------|
| 実装 | Claude Code（次サイクル） |
| レビュー / Gate 承認 | daishiman |
| 影響範囲 | apps/web デプロイ全体 |

## 3. 受入条件 (AC)

1. `apps/web/wrangler.toml` のトップレベルに `pages_build_output_dir` が **存在しない** ことを assert する
2. `apps/web/wrangler.toml` の `[env.staging.assets]` / `[env.production.assets]` が存在し、`directory = ".open-next/assets"` を含むことを assert する
3. `apps/web/package.json` の `scripts.deploy` が **存在しない**（`bash scripts/cf.sh deploy` 経由必須ルール）ことを assert する
4. `apps/web/.assetsignore` に `node_modules` / `*.test.*` / `*.spec.*` / `__tests__` を含む必須行が存在することを assert する
5. CI workflow に組み込まれ、PR で fail することを確認する

## 4. スコープ

### 含む

- `apps/web/__tests__/opennext-config-regression.spec.ts`（vitest 単一 spec）
- `.github/workflows/ci.yml` の step 追加

### 含まない

- 実 deploy 実行 / Cloudflare 実 API 叩き
- OpenNext 本体の挙動テスト
- E2E smoke（UT-06 既出）

## 5. DoD

- 5 assertion すべて green
- drift 挿入で 5 assertion が独立に fail することを Phase 11 で手動確認
- CI で job として可視化される
