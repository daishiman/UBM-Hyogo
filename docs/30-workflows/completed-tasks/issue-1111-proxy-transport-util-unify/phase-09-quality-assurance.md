# Phase 09 — 品質保証

pure refactor の品質ゲートを一括判定する。挙動不変の機械証明（回帰 5 spec 緑）と、焼き込み gate・env アクセサ不変条件・真理値表整合を確認する。

## 1. 検証コマンド

| # | 目的 | コマンド | 合格条件 |
| --- | --- | --- | --- |
| 1 | 型整合 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| 2 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS |
| 3 | util 単体 + 回帰 5 spec | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/fetch/__tests__/transport-select.spec.ts apps/web/app/api/admin/[...path]/route.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts apps/web/src/lib/fetch/public.spec.ts` | PASS（6 files / 44 tests） |
| 9 | 焼き込み grep（task-18） | `rg -n "127\.0\.0\.1:8888" apps/web/src \|\| echo OK` | `OK`（0 hit。新規追加なし） |
| 10 | util の process.env 直参照禁止 | `rg -n "process\.env\[" apps/web/src/lib/fetch/transport-select.ts` | 0 hit（AC-4） |
| 11 | util の 127.0.0.1 焼き込み禁止 | `rg -n "127\.0\.0\.1" apps/web/src/lib/fetch/transport-select.ts \|\| echo OK` | `OK`（0 hit。AC-5） |

> 回帰 5 spec（#4-8）が緑のまま = transport の外部観測挙動が抽出前後で不変であることの機械証明。1 本でも赤なら pure refactor 違反として実装へ差し戻す。

## 2. 真理値表整合の確認手順（phase-01 §4-7）

| 確認項目 | 手順 | 期待 |
| --- | --- | --- |
| isTestOrPlaywright 差異保存（§4） | `route.ts` のみ `env.ENVIRONMENT==="local"` 条件を持つことを diff で確認。util に判定式が移送されていないこと | 3 変種が呼び出し側に残存・util は `disableBinding` boolean のみ受領 |
| binding 無効化条件（§5） | route/server-fetch=INTERNAL、public=PUBLIC の base var 選択が呼び出し側に残ることを確認 | base var 差が `disableBinding` 計算で吸収済み |
| fallback base 戦略（§6） | route.ts のみ `null` 返却（fail-fast）→ `base-unavailable` → 500 経路が残ることを確認 | server-fetch/public は常に string・base-unavailable 非到達 |
| ログ shape（§7） | server-fetch=`scope:"admin"`、public=scope 無し、route=ログ無しが diff で不変 | log fn 注入の有無・shape が Before と一致 |

## 3. line budget / link / mirror parity

| 判定 | 手順 | 合格条件 |
| --- | --- | --- |
| line budget | 各 phase doc が冗長化していないこと（表中心・先送り表現なし） | 逸脱なし |
| link 健全性 | phase 間相互参照（phase-01 §4-7・AC-1〜6）のリンク切れ無し | 0 件 |
| mirror parity | `artifacts.json` と `outputs/artifacts.json` の byte 一致 | `diff` 空（一致） |

artifacts byte 一致確認コマンド:

```bash
diff "docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/artifacts.json" \
     "docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/outputs/artifacts.json" && echo "PARITY OK"
```

## 4. design token gate（NON_VISUAL・念のため確認）

本タスクは NON_VISUAL で色・トークンに無関係（transport の内部抽出のみ）。ただし回帰として `verify-design-tokens` が緑であることを確認する。

| 確認 | 期待 |
| --- | --- |
| HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` の新規混入 | 0 件（util は color を扱わない） |
| `verify-design-tokens` CI gate | 緑（本タスク差分で fail を誘発しない） |

## 5. ゲート判定基準

§1 の #1-11 全合格 + §2 真理値表整合 OK + §3 mirror parity OK + §4 design token 緑 → Phase 10（最終レビュー）へ進行可。1 項目でも不合格なら該当 Phase へ差し戻す。
