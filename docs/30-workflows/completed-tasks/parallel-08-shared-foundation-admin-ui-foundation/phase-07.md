# Phase 7: 静的解析・型安全性

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| workflow | parallel-08-shared-foundation-admin-ui-foundation |
| phase | 7 / 13 |
| 種別 | 検証（静的解析・型 strict・規約 grep） |
| 想定所要 | 15〜20 分 |
| 前提 Phase | Phase 6 完了（テスト・カバレッジ pass） |

---

## 目的

Phase 5 で投入したファイル群（`layout.tsx` / `useAdminMutation.ts` / `index.ts`）が次の静的品質ゲートを満たすことを保証する。

1. `pnpm lint` 0 error / 0 warning
2. `tsc --noEmit` strict mode で 0 error
3. unused import / unused variable 0 件（本 Phase 触れたファイル）
4. OKLch token 直書き禁止（`bg-[#`, `text-[#`, `border-[#` grep 0 件）
5. `process.env.*` 直接参照禁止（`apps/web/src` 配下、`getEnv()` 経由のみ）
6. CLAUDE.md `*.test.ts` 禁止規約への適合（`*.spec.ts` のみ）

---

## 実行タスク

| # | 観点 | コマンド |
|---|------|---------|
| T1 | Lint | `mise exec -- pnpm lint` |
| T2 | Type strict | `mise exec -- pnpm tsc --noEmit` |
| T3 | unused import | `mise exec -- pnpm lint -- --rule "@typescript-eslint/no-unused-vars: error"` または `pnpm lint` 内で検出 |
| T4 | OKLch 直書き grep | 下記 grep ブロック |
| T5 | process.env 直接参照 grep | `grep -rn "process.env" apps/web/src/features/admin/hooks/` |
| T6 | test suffix 規約 | `find apps/web/src/features/admin -name "*.test.ts*"` で 0 件 |

---

## 参照資料

| 種別 | パス |
|------|------|
| ESLint 設定 | `apps/web/eslint.config.js`（または root の `eslint.config.js`） |
| Design tokens 正本 | `apps/web/src/styles/tokens.css`, `docs/00-getting-started-manual/specs/design-tokens.md` |
| env helper | `apps/web/src/lib/env.ts` |
| CLAUDE.md | プロジェクト直下 |

---

## 実行手順

### Step 1 — Lint

```bash
mise exec -- pnpm lint
```

**期待値**: 0 error / 0 warning。warning が出る場合は本 Phase 内で修正する（先送り禁止 — CONST_007）。

### Step 2 — Type strict

```bash
mise exec -- pnpm tsc --noEmit
```

**期待値**: strict / noImplicitAny / strictNullChecks 全て pass。

### Step 3 — Unused import / variable 検査

Phase 5 で追加したファイル限定で確認:

```bash
mise exec -- pnpm eslint \
  apps/web/app/layout.tsx \
  apps/web/src/features/admin/hooks/useAdminMutation.ts \
  apps/web/src/features/admin/hooks/index.ts \
  --rule "@typescript-eslint/no-unused-vars: error"
```

**期待値**: 0 violation。`useAdminMutation.ts` 内の `void endpoint; void options;` で skeleton 段階の unused 警告を抑止していること。

### Step 4 — OKLch token 直書き禁止

```bash
grep -rnE "bg-\[#|text-\[#|border-\[#" \
  apps/web/app/layout.tsx \
  apps/web/src/features/admin/hooks/ \
  || echo "OK: no inline hex"
```

**期待値**: マッチ 0 件（`OK: no inline hex` が出力される）。色指定が必要な場合は `apps/web/src/styles/tokens.css` の OKLch 変数を参照（本 Phase の変更ファイルでは色指定そのものを行わない）。

### Step 5 — `process.env` 直接参照禁止

```bash
grep -rn "process.env" \
  apps/web/src/features/admin/hooks/ \
  apps/web/app/layout.tsx \
  || echo "OK: no direct process.env"
```

**期待値**: マッチ 0 件。env 参照が必要な場合は `apps/web/src/lib/env.ts` の `getEnv()` / `getPublicEnv()` 経由（CLAUDE.md 不変条件）。

### Step 6 — test suffix 規約

```bash
find apps/web/src/features/admin -type f \( -name "*.test.ts" -o -name "*.test.tsx" \)
```

**期待値**: 出力 0 行。lefthook `block-test-suffix` と `verify-test-suffix` の reject 条件に該当しないこと。

---

## 統合テスト連携

- 本 Phase の lint / type gate は GitHub Actions の `verify-test-suffix` / `verify-design-tokens` と整合。
- Phase 8 のセキュリティ観点（XSS, CSRF）と独立だが、unused / strict 違反があると Phase 8 のレビューが空転するため本 Phase で必ず clean にする。

---

## 多角的チェック観点（AIが判断）

- `void endpoint; void options;` 抑止が ESLint の `no-unused-expressions` ルールに抵触していないか
- `readonly` 修飾子付き interface が consumer 側で型エラーを誘発していないか
- `@/components/ui/Toast` の path alias が `apps/web/tsconfig.json` の `paths` と一致しているか
- `useAdminMutation` が `Promise<void>` を返すシグネチャ宣言として `async` を付けていないことの妥当性（throw skeleton のため）

---

## サブタスク管理

| ID | 内容 | 完了条件 |
|----|------|---------|
| ST-07-01 | pnpm lint 0 violation | exit 0 |
| ST-07-02 | tsc strict 0 error | exit 0 |
| ST-07-03 | unused import 0 件 | eslint 該当 rule 0 |
| ST-07-04 | OKLch 直書き 0 件 | grep miss |
| ST-07-05 | process.env 直書き 0 件 | grep miss |
| ST-07-06 | *.test.ts 0 件 | find 0 行 |

---

## 成果物

- `outputs/phase-07/lint-report.md`（lint 実行結果 + 上記 grep ログ）

---

## 完了条件 (DoD)

- [ ] `mise exec -- pnpm lint` exit 0 (0 error / 0 warning)
- [ ] `mise exec -- pnpm tsc --noEmit` exit 0
- [ ] Phase 5 追加ファイルに unused import / variable なし
- [ ] OKLch 直書き grep 0 件
- [ ] `process.env` 直書き grep 0 件（admin/hooks 配下と layout.tsx）
- [ ] `*.test.ts(x)` ファイル 0 件（admin feature 配下）

---

## タスク100%実行確認【必須】

```bash
mise exec -- pnpm lint \
  && mise exec -- pnpm tsc --noEmit \
  && { ! grep -rnE "bg-\[#|text-\[#|border-\[#" apps/web/app/layout.tsx apps/web/src/features/admin/hooks/; } \
  && { ! grep -rn "process.env" apps/web/src/features/admin/hooks/ apps/web/app/layout.tsx; } \
  && [ -z "$(find apps/web/src/features/admin -type f \( -name '*.test.ts' -o -name '*.test.tsx' \))" ]
```

このチェーンが exit 0 で完走することを確認。1 件でも違反があれば本 Phase で解消し、Phase 8 に進まない。

---

## 次Phase

→ Phase 8: パフォーマンス・セキュリティ（re-render scope / AbortController 競合防止方針 / CSRF / XSS escape）
