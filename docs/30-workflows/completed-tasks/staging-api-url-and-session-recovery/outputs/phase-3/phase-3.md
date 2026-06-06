# Phase 3: 設計レビュー（Phase 4 へ進めるかの判定）

## 一次結論（要件レビュー 5 項目）

| 項目 | 判定 | 根拠 |
|------|------|------|
| 真の論点 | OK | 「同一 account workers.dev への web→api 外向き fetch が staging で構造破綻」を 1 文固定。S2/S3 を同根に収束。 |
| 依存関係・責務境界 | OK | transport 選択を `transport.ts` に単一化。各 route は cookie forward + アクセサ参照のみ。env 読取は env.ts に集約（不変条件遵守）。 |
| 価値とコストの不均衡 | OK | 最大価値（セッション復旧）= Lane A、低コスト（既存 public.ts ロジック移植）。高コスト項目（staging 実走 / secret 投入）は user-gated に分離。 |
| 改善優先順位 | OK | A（実害解消）> B（潜在 localhost 根絶）> C（再発防止 gate / secret parity）。1 サイクルで全完了。 |
| 4 条件 | PASS | 下表。 |

## 4 条件評価

| 条件 | 判定 | 内容 |
|------|------|------|
| 価値性 | PASS | 会員/管理者の `/profile`・認証経路が staging で復旧。誰の(会員)どのコスト(再ログインループ)を下げるか明確。 |
| 実現性 | PASS | 既存 `public.ts` の service-binding パターンを `authed.ts`/proxy へ移植する範囲。新規概念なし。1 サイクル実装可能。 |
| 整合性 | PASS | 不変条件 #5(D1)/env アクセサ経由/#11 fail-closed と矛盾なし。transport 選択の責務が単一所有。 |
| 運用性 | PASS | grep gate + secret parity 診断 + smoke で再発検知。user-gated 境界が明確。 |

## 設計上の論点と決定

| 論点 | 決定 | 理由 |
|------|------|------|
| `getApiBaseEnv` 拡張 vs `getAuthEnv` 参照へ切替（Lane A） | `authed.ts` を `getAuthEnv()` 参照へ切替（`API_SERVICE` を既に返す）。`getApiBaseEnv` は後方互換で残置 | binding expose 済みアクセサを再利用し新規 surface を増やさない |
| `PUBLIC_API_BASE_URL` 即削除 vs 後方互換残置（Lane B） | 残置し参照を `NEXT_PUBLIC_API_BASE_URL` 優先へ。削除は drift リスクのため別途（未タスク候補化を検討） | env schema 一括削除は consumer 全走査が必要・本サイクルのリスクを下げる |
| secret 値の直接比較 vs presence + smoke 間接証明（Lane C） | presence（secret list）+ runtime smoke の 200 で間接証明 | L-AUTHSECRET-001（値は表示しない / presence != usability）。実値を AI/ログに混入させない不変条件 |
| grep gate を既存 task-18 smoke に統合 vs 新 gate（Lane C） | 新 `verify-no-localhost-bake.sh` + CI job。task-18 の `:8888` 限定を `:8787`/localhost まで拡張 | 検出範囲が現状 gate で漏れている（S3 が CI 未検出だった構造原因） |

## リスクと緩和

| リスク | 緩和 |
|--------|------|
| service-binding `fetch(url)` の host 無視で path/search が落ちる | public.ts:69 と同じく URL parse 用 dummy host + `${path}${url.search}` を保持。Phase 4 で search 付き path のテストを必須化 |
| local `next dev`（binding 不在）の回帰 | `environment==="local"` 分岐で localhost fallback 維持。local 起動 smoke を Phase 11 に含める |
| Playwright e2e の mock API 差替が壊れる | `isTest && baseUrl` 分岐を最優先に維持（public.ts:37-38 の意図を transport.ts に継承） |
| AUTH_SECRET parity を直したつもりで値不一致が残る | smoke の `/me` 200 を最終証明にする（presence だけで完了にしない） |

## 判定

**Phase 4 へ進行可（GO）。** 3 lane の責務境界・受入条件・テスト方針が確定。
