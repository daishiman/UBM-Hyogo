# Phase 4: 詳細実装手順

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 名称 | 詳細実装手順 |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | completed |
| 前 Phase | 3 (全体設計) |
| 次 Phase | 5 (ローカル検証) |

## 目的

第一候補 A を実装するための具体手順を確定する。本仕様書はサンプル diff を「案」として示すのみで、
コード実装は本サイクル内で同時に反映する。

## 手順 1: `package.json` の overrides bump

### diff 案（参考）

```diff
   "pnpm": {
     "overrides": {
-      "esbuild": "0.25.4"
+      "esbuild": "0.27.3"
     }
   }
```

> 値 `"0.27.3"` は wrangler 4.85.0 同梱の esbuild と整合する第一候補。
> 実装値は exact `"0.27.3"` に固定する。

### 確認ポイント

- `package.json` の他フィールド（`devDependencies.wrangler` 等）を変更しない。
- JSON 末尾のカンマ・改行を崩さない。

## 手順 2: `pnpm-lock.yaml` の再生成

### コマンド

```bash
mise exec -- pnpm install --force
```

### 期待挙動

- `pnpm-lock.yaml` の `overrides` セクションが新値を反映。
- `wrangler` 解決ブロックの `esbuild` resolved-version が `0.27.x` に。
- `@opennextjs/aws` / `@opennextjs/cloudflare` 解決ブロックの `esbuild` も同期。
- `node_modules/wrangler/node_modules/@esbuild` 配下のプラットフォームバイナリが再 download される。

### 異常パターン

- `peerDependencies` 警告が出た場合は内容を記録し、Phase 5 build が PASS すれば許容、FAIL すれば Phase 2 ゲートに戻る。
- `pnpm install --force` が失敗した場合は `pnpm store prune` 後に再実行。

## 手順 3: `scripts/cf.sh` の fallback ロジック確認

### 確認手順（参考コマンド）

```bash
ls /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260517-134038-wt-10/node_modules/wrangler/node_modules/@esbuild 2>/dev/null || echo "NOT_FOUND"
```

### 判定

- `darwin-arm64` / `linux-x64` 等の platform dir が存在 → 既存 fallback で OK、`scripts/cf.sh` の変更不要。
- 存在しない（hoisted 単一 esbuild に統合された）→ `scripts/cf.sh:39` の `ESBUILD_PARENT` を `node_modules/esbuild/node_modules/@esbuild` または `node_modules/.pnpm/esbuild@<ver>/node_modules/@esbuild` に拡張する追記が必要。

### 追記が必要な場合の diff 案（参考）

```diff
-ESBUILD_PARENT="$REPO_ROOT/node_modules/wrangler/node_modules/@esbuild"
-for p in darwin-arm64 darwin-x64 linux-x64 linux-arm64; do
-  candidate="$ESBUILD_PARENT/$p/bin/esbuild"
-  if [ -f "$candidate" ]; then
-    export ESBUILD_BINARY_PATH="$candidate"
-    break
-  fi
-done
+for parent in \
+  "$REPO_ROOT/node_modules/wrangler/node_modules/@esbuild" \
+  "$REPO_ROOT/node_modules/esbuild/node_modules/@esbuild"; do
+  for p in darwin-arm64 darwin-x64 linux-x64 linux-arm64; do
+    candidate="$parent/$p/bin/esbuild"
+    if [ -f "$candidate" ]; then
+      export ESBUILD_BINARY_PATH="$candidate"
+      break 2
+    fi
+  done
+done
```

## 手順 4: コミット粒度（参考）

```
1) package.json: chore(deps): bump pnpm.overrides.esbuild to 0.27.3 for wrangler 4.85.0
2) pnpm-lock.yaml: chore(deps): regenerate lockfile after esbuild override bump
3) (必要時) scripts/cf.sh: chore(cf): widen ESBUILD_BINARY_PATH fallback for hoisted esbuild
```

> 1 PR 内で完結させ、3 コミット以内に収める。

## ローカル実行コマンド一覧

```bash
# 手順 1 後（package.json 編集後）
mise exec -- pnpm install --force

# 手順 3 fallback 確認
ls node_modules/wrangler/node_modules/@esbuild 2>/dev/null || echo "NOT_FOUND"
ls node_modules/esbuild/node_modules/@esbuild 2>/dev/null || echo "NOT_FOUND"
```

## 実行タスク

- [ ] `package.json` の overrides 値を第一候補で更新
- [ ] `pnpm install --force` を実行
- [ ] `scripts/cf.sh` fallback path の有効性を ls で確認
- [ ] 必要なら fallback 配列拡張の diff を Phase 4 成果物に転記
- [ ] `outputs/phase-04/implementation-steps.md` を作成

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/implementation-steps.md | 手順 1-4 とコマンド一覧 |

## 完了条件

- [ ] 手順 1 の diff 案が記載されている
- [ ] 手順 2 の pnpm install コマンドと期待挙動が記載されている
- [ ] 手順 3 の fallback 確認手順と追記 diff 案が記載されている
- [ ] コミット粒度の参考が記載されている

## 次 Phase

- 次: 5 (ローカル検証)
- 引き継ぎ事項: 適用後の `node_modules/wrangler/node_modules/@esbuild` 実在の有無
- ブロック条件: `pnpm install --force` が失敗した場合は Phase 2 ゲートに戻る

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` | 本 Phase の正本 |
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase outputs / 状態語彙 / strict 7 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Cloudflare wrapper / esbuild SSOT |

## 統合テスト連携

| 連携先 | 扱い |
| --- | --- |
| local dependency convergence | `pnpm exec esbuild --version` / `pnpm why esbuild` で確認 |
| local static gates | typecheck / lint は Phase 11 evidence 境界で扱う |
| GitHub Actions | commit / push / PR が user-gated のため runtime_pending |
