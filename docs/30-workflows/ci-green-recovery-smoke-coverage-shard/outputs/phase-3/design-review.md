# Phase 3 サマリ: 設計レビュー

詳細: [`../../phase-3-design-review.md`](../../phase-3-design-review.md)

## 判定

**PASS** — Phase 4（テスト計画）へ進む。

## 4 条件評価

| 条件 | 評価 | 要点 |
|---|---|---|
| 価値性 | ✅ | Lane A は 24h 失効の悪循環を断ち手動再発行コストをゼロに。Lane B/C は誤検知による原因誤認の復旧遅延を解消 |
| 実現性 | ✅ | `signSessionJwt` は純粋 Web Crypto（node 依存なし）で tsx 実行可。`@ubm-hyogo/shared` は TS 直 export で build 不要。ci.yml は宣言的変更で低リスク |
| 整合性 | ✅ | smoke 系（Lane A）と coverage 系（Lane B/C）はファイル交差ゼロ。Lane B/C のみ ci.yml を共有し 1 diff に統合 |
| 運用性 | ✅ | mint は fallback で即時運用復旧経路を維持。required context 名不変。reason 分類で将来の 401 を即時切り分け可能 |

## 因果ループ

- 強化ループ（断つ）: 静的 bearer → 24h 失効 → 401 → 手動再発行 → また失効。mint 化で消滅。
- バランスループ（安定化）: shard 失敗 → MISSING 誤検知 → 原因誤認 → 復旧遅延。step 順序入れ替えで 1 回収束。

## レビュー指摘と解決

| # | 指摘 | 重大度 | 解決 |
|---|---|---|---|
| R-1 | mint JWT を stdout echo すると平文露出 | CRITICAL | helper は `GITHUB_OUTPUT`/`GITHUB_ENV` 追記のみ。workflow が同一 step で `::add-mask::` 適用。console echo 禁止 |
| R-2 | mint JWT format が require-admin 期待と drift | HIGH | parity test（AC-2）で mint→`verifySessionJwt` を必須化。format 正本は `signSessionJwt` 一本 |
| R-3 | `STAGING_AUTH_SECRET` 不一致だと verify 失敗で 401 継続 | HIGH | runbook に「staging `AUTH_SECRET` と同値」明記。reason=`auth-token-invalid-or-expired` で切り分け |
| R-4 | MISSING 判定を緩めると false negative | HIGH | 判定ロジック不変。step 順序とメッセージのみ変更 |
| R-5 | Lane C が transient で hardening 無駄 | MINOR | hardening は無害・回帰リスクなし。再現確認はユーザー運用側 |
| R-6 | top-level permissions が既存 job token を縮退させないか | HIGH | ci.yml の job は read のみで十分。job 別 permissions は据え置き。Phase 9 で actionlint 突合必須化 |

## 引き継ぎ

R-6 は Phase 9 QA で actionlint + job 別 permissions 突合を必須チェックとして引き継ぐ。
