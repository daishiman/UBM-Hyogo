# Phase 6: 関数シグネチャと擬似コード

## 目的

本タスクは build pipeline の最小変更であり、アプリケーション関数シグネチャを追加・変更しない。Phase 6 では `package.json` `scripts.build` の before/after と、webpack 経路で既存 instrumentation copy patch が no-op 可能になる条件を示す。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented-local |

## 1. 変更（before / after）

```diff
--- a/apps/web/package.json
+++ b/apps/web/package.json
   "scripts": {
-    "build": "NODE_ENV=production next build",
+    "build": "NODE_ENV=production next build --webpack",
```

`--webpack` フラグは Next.js 16 の builder selection で webpack を強制する公式オプション（`--turbopack` の対義）。

```diff
--- a/scripts/patch-next-standalone-instrumentation.mjs
+++ b/scripts/patch-next-standalone-instrumentation.mjs
+if (!existsSync(join(nextDir, "server/instrumentation.js"))) {
+  console.log("[patch-next-standalone-instrumentation] instrumentation not emitted; skipping");
+  process.exit(0);
+}
```

webpack 経路では `.next/server/instrumentation.js` が生成されない場合があるため、既存 patch は「存在すれば standalone にコピー、存在しなければ skip」を明示する。

## 2. ビルドパイプラインの擬似コード

```text
pnpm --filter @ubm-hyogo/web build:cloudflare
└─ NODE_ENV=production opennextjs-cloudflare build
   ├─ buildCommand (= open-next.config.ts の "pnpm build && node ../../scripts/patch-next-standalone-instrumentation.mjs")
   │  ├─ pnpm build  # ← package.json scripts.build
   │  │  └─ NODE_ENV=production next build --webpack   ◀ ここが変化点
   │  │     # 出力: apps/web/.next/  （webpack output, [project]/... 仮想 prefix なし）
   │  └─ node patch-next-standalone-instrumentation.mjs  # 既存 post-build patch
   ├─ Worker bundle 生成 (.open-next/worker.js)
   │  # ここが Turbopack 経路では parse fail していた
   └─ (本 npm-script では続けて) node ../../scripts/patch-open-next-worker.mjs
      # auth env bridge を worker.js に注入
```

## 3. 関数追加 / 削除 / 変更

| 種別 | 件数 |
| --- | --- |
| 追加 | 0（新規 business function なし。既存 helper `jstLocalToUtcIso` を `audit-query.ts` へ移設） |
| 削除 | 0（runtime behavior deletion なし。`page.tsx` からの named export のみ削除） |
| 変更 | 0（helper の入出力とテスト期待値は不変） |

## 完了条件

- [x] build pipeline の最小変更点を diff で固定
- [x] ビルドパイプラインの擬似コードで変化点を明示
- [x] 関数追加 / 削除 / 変更が無いことを宣言

## 出力

- `phase-06.md`

## 参照資料

- `phase-04.md`（ビルド I/O 契約）
- `phase-03.md`（修正方針）
