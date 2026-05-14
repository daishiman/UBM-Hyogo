# Phase 9: QA

[実装区分: 実装仕様書]

> Phase: 9 / 13

---

## QA チェック一覧

### 9.1 静的検査

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

すべて exit 0 であることを確認。

### 9.2 unit test 実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/fetch/public.spec.ts
```

AC-R-02 / AC-R-03 / edge-1 / edge-2 / edge-3 の 5 ケース、および既存 `describe('fetchPublic', ...)` 内の全ケースが green であることを確認。

### 9.3 OpenNext Workers build 副作用確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
```

exit 0 であり、build エラー / warning が新規発生していないことを確認。OpenNext Workers bundle は `pnpm --filter @ubm-hyogo/web build:cloudflare` で別途確認し、`CI=true` 単独が transport fallback を許可しないことを focused test で保証する。

### 9.4 逆 assertion 妥当性確認

`apps/web/src/lib/fetch/public.spec.ts` の AC-R-02 ケースを一時的に以下に書き換え:

```ts
// 一時的逆書き(commit しない)
expect(bindingFetch).not.toHaveBeenCalled();
```

`mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/fetch/public.spec.ts` を実行し、**fail** することを確認。確認後すぐ元に戻す。

evidence として、逆書き状態の test 実行ログ末尾を `outputs/phase-11/evidence/inverse-assertion-fail.txt` に保存(Phase 11 で実施)。

### 9.5 grep regression

```bash
# 本ファイル内の新規 process.env 直参照箇所
grep -nE "^[[:space:]]*[^/].*process\.env\." apps/web/src/lib/fetch/public.ts

# 期待 hit:
# - isTestOrPlaywright 内: NODE_ENV / PLAYWRIGHT_TEST (2 行)
# - getBaseUrl 内: PUBLIC_API_BASE_URL (1 行)
# - getServiceBinding 内: PUBLIC_API_BASE_URL (1 行)
# 上記以外の hit があれば Phase 8 リファクタに戻る
```

### 9.6 production safety スモークチェック(静的)

`apps/web/wrangler.toml` を `grep` で確認し、`[env.production.vars]` / `[env.staging.vars]` セクションに `CI` / `NODE_ENV` / `PLAYWRIGHT_TEST` が存在しないことを観測する。

```bash
grep -nE "^(CI|NODE_ENV|PLAYWRIGHT_TEST)\s*=" apps/web/wrangler.toml
# 期待: 0 件
```

存在した場合は本タスクの assumption 違反であり、Phase 13 PR レビュー時にユーザーへエスカレーション(本タスクで修正はしない)。

## QA NG 時の対応

| 失敗箇所 | 対応 |
|---------|------|
| typecheck | Phase 5 に戻り型不整合修正 |
| lint | Phase 8 で `pnpm lint --fix` 適用、残違反のみ手修正 |
| unit test fail | Phase 6 に戻り test setup(env stub / cloudflareEnv reset)を確認 |
| build fail | Phase 5 の編集範囲を見直し、interface / 他関数への意図しない変更がないか `git diff` で確認 |
| 逆 assertion で fail しない | Phase 6 の test が実際には挙動を検証していない。spy 経路を見直す |
| `wrangler.toml` に test env 混入 | 本タスクで修正せず、PR 本文に hand-off として記録 |

## 完了条件(Phase 9)

1. 9.1 〜 9.5 すべて PASS
2. 9.6 で `wrangler.toml` に test env 混入なし(or 混入時はエスカレーション済)
3. evidence ファイルが Phase 11 で保存される準備が整っている
