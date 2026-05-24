# Phase 3: 設計レビュー

## 3.1 設計レビュー判定: PASS（条件付き）

Phase 4 着手前に **Phase 2.2 の stack trace 取得を完了する** ことを必須前提とする。
仮説 H1 が確証されればそのまま Phase 4 → 5、H2/H4 が原因なら Phase 5 着手前に Phase 2 へ差し戻して該当ファイルを inventory に追加する。

## 3.2 4 条件評価

| 観点   | 評価                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| 価値性 | PASS — staging admin 全機能の復旧 + focused regression で恒久対策                                                |
| 実現性 | PASS — 修正対象は単一 helper（+optional に `env.ts`）。1 サイクル完了可能。                                       |
| 整合性 | PASS — 既存 `getEnv()` schema・wrangler.toml binding・既存 fixture 経路（test）と矛盾なし                        |
| 運用性 | PASS — 新規 focused regression で再発を検出。fallback 撤去により silent fallback の事故発生確率を 0 にする        |

## 3.3 設計レビュー指摘 (MINOR)

| ID    | 内容                                                                                                | 対応                           |
| ----- | --------------------------------------------------------------------------------------------------- | ------------------------------ |
| M-01  | `INTERNAL_AUTH_SECRET` を `EnvSchema` に追加すると Node test env で未定義時に schema parse 失敗の可能性 | `.optional()` 採用で回避       |
| M-02  | `getEnv()` を fetch ごとに呼ぶと cold start のコストが小さく上乗せされる                              | 影響無視可（Workers では `getCloudflareContext` キャッシュ済み）。最適化が必要なら未タスク化 |
| M-03  | `auth.ts` は既存認証 env 境界であり、本タスクの直接原因ではない                                       | 新規未タスク化しない |
| M-04  | broad grep guard は fixture branch の `NODE_ENV` / `PLAYWRIGHT_*` と衝突する可能性                    | runtime env 解決の focused regression に限定 |

## 3.4 Go/No-Go 決定

| 判定項目                  | 状態 | 備考                                                |
| ------------------------- | ---- | --------------------------------------------------- |
| stack trace 取得計画あり  | ✅   | Phase 2.2 にコマンド列を明記                        |
| 修正 surface 特定済み     | ✅   | server-fetch.ts + env.ts (optional)                 |
| 不変条件への抵触なし      | ✅   | 修正方向自体が不変条件を満たす方向                  |
| 1 サイクル完了可能性      | ✅   | スコープ外項目を明記 (CONST_007)                    |
| 結論                      | **GO** | Phase 2.2 完了次第 Phase 4 着手                   |
