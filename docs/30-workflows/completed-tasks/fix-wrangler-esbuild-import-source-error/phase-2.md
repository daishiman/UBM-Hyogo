# Phase 2: 設計 — esbuild バージョン選定

## 2.1 候補案の比較

| 案 | 概要 | メリット | デメリット | 採否 |
|----|------|---------|-----------|------|
| A | `pnpm.overrides.esbuild` を削除 | 各依存（wrangler / OpenNext）が個別に必要な版を解決 | monorepo 内で複数 esbuild 版が共存し、host/binary mismatch 再発リスク（`cf.sh` コメントが警告） | 不採用 |
| B | `pnpm.overrides.esbuild` を wrangler exact version に bump | wrangler 4.85.0 が要求する `esbuild 0.27.3` と一致 | OpenNext 側 `@opennextjs/aws@3.10.4` は `0.25.4` 要求のため build 実走で互換確認が必要 | **採用** |
| C | wrangler を 4.84.x へダウングレード | esbuild 0.25.4 のまま動作 | 後続の wrangler セキュリティ修正取り込み不能 | 不採用 |
| D | scoped override / pnpm packageExtensions で wrangler のみ 0.27.3 | OpenNext 側 0.25.4 を維持できる | pnpm 解決が複雑化し、既存 `cf.sh` の単一 binary 解決方針と衝突 | B 失敗時の再判定候補 |

## 2.2 採用方針（案 B）

1. `wrangler@4.85.0` の exact dependency である **esbuild 0.27.3** を採用する。
2. `@opennextjs/cloudflare@1.19.4` は直接 esbuild 依存を持たず、`@opennextjs/aws@3.10.4` が `esbuild 0.25.4` を要求するため、交点ではなく **wrangler exact 優先 + OpenNext build 実測**で判断する。
3. `build:cloudflare` が失敗した場合のみ、D の scoped override または override 削除を Phase 5 で再判定する。

## 2.3 変更対象ファイル

| パス | 種別 | 変更内容 |
|------|------|---------|
| `package.json` | 編集 | `pnpm.overrides.esbuild` を Phase 2.2 で確定したバージョンに更新 |
| `pnpm-lock.yaml` | 編集（自動再生成） | esbuild 関連 entry の一斉更新 |
| `scripts/cf.sh` | 編集（コメントのみ・必要時） | override バージョンの根拠コメント追記 |

## 2.4 esbuild バージョン確定手順（Phase 5 で実行）

```bash
# wrangler / opennext が要求する esbuild の range を確認
pnpm view wrangler@4.85.0 dependencies.esbuild
pnpm view @opennextjs/cloudflare@1.19.4 dependencies
pnpm view @opennextjs/aws@3.10.4 dependencies.esbuild

# 候補バージョンで import-source feature を試す（CLI レベル）
npx -y esbuild@0.27.3 --supported:import-source=false --version
# 候補版で deploy --dry-run が通るかを Phase 6 で検証
```

## 2.5 リスク

- esbuild bump によって OpenNext build path（`@opennextjs/cloudflare`）が別エラーを出す可能性 → Phase 4 で `build:cloudflare` を必須検証コマンドに含める。
- 既存 `pnpm patch` (patchedDependencies) との衝突可能性 → Phase 5 着手前に `pnpm-lock.yaml` の `patchedDependencies` セクションが esbuild を含んでいないことを確認する。
