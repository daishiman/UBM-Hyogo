# Phase 2: 設計 — 削除順序 / lane 分割 / 検証経路

> **[実装区分: 実装仕様書]** NON_VISUAL

## 1. メタ情報

| 項目 | 内容 |
| ---- | ---- |
| Phase | 2（設計） |
| 入力 | Phase 1 scope / inventory |
| 出力 | 本 `phase-2.md`（topology / lane / validation path） |

## 2. 既存コンポーネント再利用可否（FB-SDK-07-1）

新規実装ゼロ。既存の env accessor（`getPublicFetchEnv`）/ transport 選択（`resolveServiceBinding` / `selectAndFetch`）/ OgEnv をそのまま使い、**旧キー分岐の除去 + rename のみ**。新規モジュール・新規 primitive・新規 accessor は一切作らない。

## 3. 因果ループ（システム思考）

- **バランスループ（解消対象）**: 「旧キーを残す → 後続が `PUBLIC_*` と `NEXT_PUBLIC_*` を両方書く先例を踏襲 → 二重定義が他キーへ波及 → 値乖離事故」。本タスクで旧キーを 0 にし grep gate を置くことでループを断つ。
- **強化ループ（維持対象）**: 「accessor 経由 env 参照 → 型安全 → drift を typecheck が検出」。`getPublicFetchEnv` の戻り値型から `PUBLIC_API_BASE_URL?` を消すことで、consumer 側の旧キー参照が **typecheck で機械検出**される（public.ts の取りこぼし防止に作用）。

## 4. 状態所有権 / 責務境界

| レイヤ | 所有ファイル | 旧キー除去後の責務 |
| ------ | ----------- | ------------------ |
| env 定義（schema） | `apps/web/src/lib/env.ts` `EnvSchema` | `NEXT_PUBLIC_API_BASE_URL` 単一 |
| env accessor | `env.ts` `getPublicFetchEnv` / （`getApiBaseEnv` は削除） | `NEXT_PUBLIC_API_BASE_URL` 単一解決 |
| consumer (web) | `fetch/public.ts` | `env.NEXT_PUBLIC_API_BASE_URL` 単独 |
| consumer (og) | `og/src/member-source.ts` `OgEnv` | `NEXT_PUBLIC_API_BASE_URL` 単独 |
| config | wrangler×2 / .dev.vars.example / playwright×2 | `NEXT_PUBLIC_API_BASE_URL` のみ |
| test | spec 11 本 | `NEXT_PUBLIC_API_BASE_URL` seed/assert |

## 5. 削除順序（型結合を壊さない順序設計）

旧キー削除は **「定義を消すと consumer が型エラーになる」結合**を持つため、順序を固定する。

```
Step 1: env.ts の型・schema・accessor から旧キー除去
        → この時点で getPublicFetchEnv() の戻り値型から PUBLIC_API_BASE_URL? が消える
        → public.ts の `?? env.PUBLIC_API_BASE_URL` が typecheck エラーになる（意図的に露見させる）
Step 2: public.ts の `?? env.PUBLIC_API_BASE_URL` 2 箇所削除 + コメント更新
        → web consumer の型エラー解消
Step 3: apps/og の OgEnv / member-source.ts を rename
Step 4: wrangler×2 / .dev.vars.example / playwright×2 の旧キー行削除・rename
Step 5: spec 群 11 本の seed/assert/テスト名を移行（env.spec の getApiBaseEnv テスト 2 件は削除）
Step 6: grep gate（AC-7）と getApiBaseEnv 参照 0 件（AC-2）を確認
Step 7: typecheck / lint / targeted vitest（AC-8）
```

> **設計上の肝**: Step 1 を先に行うことで、Step 2 の取りこぼし（最重要 struggle point）を typecheck が機械検出する。env.ts と public.ts は **同一 PR・同一サイクル**で直す（片方だけだと型エラー or fallback 消失）。

## 6. SubAgent lane 設計（実装時の並列分割・最大 3 並列）

実装フェーズ（Phase 5）は型結合のため**直列が安全**だが、関心ごとで以下に分けられる:

| Lane | 対象 | 並列可否 |
| ---- | ---- | -------- |
| Lane A（web core） | env.ts → public.ts（Step 1-2・型結合のため直列） | 内部直列 |
| Lane B（config） | wrangler×2 / .dev.vars.example / playwright×2（Step 4） | Lane A と並列可 |
| Lane C（og） | member-source.ts + og/wrangler.toml + og spec 2 本（Step 3） | Lane A/B と並列可 |
| Lane D（web spec 群） | spec 9 本（Step 5）| Lane A 完了後（型に依存） |

validation lane（grep gate + typecheck）は**直列で最後に締める**。

## 7. apps/og rename の semantics 確認（D-4）

`NEXT_PUBLIC_` 接頭辞は Next.js では「client bundle へ inline」を意味するが、apps/og は Hono Worker（非 Next.js）であり、この URL は server-side 専用。**接頭辞の意味的役割は apps/og では発生しない**（単なる env 変数名）。rename は runtime 挙動に影響しない（`env.NEXT_PUBLIC_API_BASE_URL?.trim()` は同じ値を読む）。wrangler の `[vars]` キー名と `OgEnv` のフィールド名を揃えれば解決する。

## 8. 完了条件

- [x] 再利用可否確認（新規実装ゼロ）
- [x] 因果ループ・責務境界記録
- [x] 削除順序（Step 1-7）固定
- [x] lane 分割（A-D + validation 直列）
- [x] apps/og rename semantics 確認

## 9. 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| env アクセス不変条件 | `CLAUDE.md` task-02 | accessor 経由のみ |
| transport 選択 | `apps/web/src/lib/fetch/transport-select.ts` | binding 優先 / HTTP fallback（挙動不変） |
