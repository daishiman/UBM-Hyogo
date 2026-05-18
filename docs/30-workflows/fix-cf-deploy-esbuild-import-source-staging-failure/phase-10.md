# Phase 10: ロールバック手順

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 名称 | ロールバック手順 |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | completed |
| 前 Phase | 9 (受入確認) |
| 次 Phase | 11 (NON_VISUAL evidence) |

## 目的

本タスク適用後に未知の不具合（OpenNext build 不整合 / vitest regression / wrangler nested binary 取得失敗 等）が発生した場合の退避手順を明文化する。

## ロールバック範囲別手順

### 範囲 1: コード単体の rollback（Cloudflare 直前 version へ戻す）

```bash
# Cloudflare deploy 直前の VERSION_ID を確認
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging

# 該当 VERSION_ID で rollback
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env staging
```

### 範囲 2: 依存メタを直前値（`0.25.4`）に戻す

```diff
 "pnpm": {
   "overrides": {
-    "esbuild": "0.27.3"
+    "esbuild": "0.25.4"
   }
 }
```

```bash
mise exec -- pnpm install --force
```

> この退避で deploy パイプラインは再び `"import-source"` エラーで失敗する。あくまで本 PR の差分を完全に取り消すための手順。

### 範囲 3: wrangler ピンを 4.85.0 に固定維持（代替案 B 採用済の場合）

候補 B/C を採用した場合のみ:

```diff
-          wranglerVersion: 4.92.0
+          wranglerVersion: 4.85.0
```

`.github/workflows/backend-ci.yml` の 4 箇所すべてを 4.85.0 に戻す。

### 範囲 4: `scripts/cf.sh` の fallback path 拡張を取り消す

Phase 4 手順 3 で `scripts/cf.sh` を編集した場合、git revert で該当 commit を取り消す。

## git レベルの取り消し

```bash
# 本 PR のマージコミットを revert
gh pr list --base main --search "fix/cf-deploy-esbuild-import-source-staging-failure"
git revert -m 1 <MERGE_SHA>
```

## ロールバック判断フロー

```
本 PR マージ後に deploy パイプライン以外で regression 発生?
  ├─ Cloudflare ランタイム異常 → 範囲 1 (Cloudflare rollback)
  ├─ ローカル build / test 失敗 → 範囲 2 (依存メタ rollback)
  ├─ wrangler 挙動差分 → 範囲 3 (wranglerVersion 戻し)
  └─ scripts/cf.sh 失敗 → 範囲 4 (script revert)
```

## 実行タスク

- [ ] 4 範囲の手順をすべて記載
- [ ] `outputs/phase-10/rollback.md` を作成

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/rollback.md | 4 範囲のロールバック手順 |

## 完了条件

- [ ] 範囲 1-4 の手順が記載されている
- [ ] 判断フローが図示されている

## 次 Phase

- 次: 11 (NON_VISUAL evidence)
- ブロック条件: なし

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
