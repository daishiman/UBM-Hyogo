# Phase 3: 設計レビュー

Phase 2 設計が Phase 4（テスト計画）へ進めるかを判定するゲート。

## 1. 4条件評価（一次結論）

| 条件 | 評価 | 根拠 |
|---|---|---|
| 価値性 | ✅ | Lane A は「24h 失効」の悪循環を断ち、運用者の手動再発行コストをゼロにする。Lane B/C は誤検知による原因誤認の復旧遅延を解消する。 |
| 実現性 | ✅ | 初回スコープに収まる。`signSessionJwt` は純粋 Web Crypto（node 依存なし）で `tsx` 実行可能。`@ubm-hyogo/shared` は TS 直 export で build 不要。ci.yml の permissions/step 順序は宣言的変更で低リスク。 |
| 整合性 | ✅ | smoke 系（Lane A）と coverage 系（Lane B/C）はファイル交差ゼロ。Lane B/C のみ ci.yml を共有し 1 diff に統合。状態所有権の混在なし。 |
| 運用性 | ✅ | mint は fallback を残し即時運用復旧経路を維持。required context 名不変で branch protection を壊さない。reason 分類で将来の 401 を即時切り分け可能。 |

## 2. 因果ループ確認

- **強化ループ（断つ対象）**: 静的 bearer → 24h 失効 → 401 → 手動再発行 → また失効。mint 化で「実行毎に新規発行」に置換し、ループ自体を消す。
- **バランスループ（安定化）**: shard 失敗 → MISSING 誤検知 → 原因誤認 → 復旧遅延 → 再 push → また誤検知。step 順序入れ替えで「shard 失敗を先に明示」しループを 1 回で収束させる。

## 3. レビュー指摘と解決

| # | 指摘 | 重大度 | 解決 |
|---|---|---|---|
| R-1 | mint helper が JWT を stdout へ echo すると平文露出 | CRITICAL | helper は `GITHUB_OUTPUT`/`GITHUB_ENV` 追記のみ。workflow が mint 直後・同一 step で `::add-mask::` 適用。console echo 禁止を §1.2 に明記。 |
| R-2 | mint した JWT の format が require-admin の期待と drift する | HIGH | parity test（AC-2）で mint→`verifySessionJwt` を必須化。format 正本は `signSessionJwt` 一本に集約。 |
| R-3 | `STAGING_AUTH_SECRET` が staging 値と不一致だと verify 失敗で 401 継続 | HIGH | runbook に「staging API の `AUTH_SECRET` と同値を投入」を明記（§1.5）。reason=`auth-token-invalid-or-expired` で切り分け可能。 |
| R-4 | coverage MISSING 判定ロジックを緩めると false negative（真の欠落を見逃す） | HIGH | 判定ロジックは不変。step 順序とメッセージのみ変更（§3.2）。 |
| R-5 | Lane C が transient で、hardening が無駄になる懸念 | MINOR | hardening は無害かつ回帰リスクなし。再現確認はユーザー運用側。permissions 明示は他 workflow と一貫化する正の副作用あり。 |
| R-6 | top-level permissions 追加が既存 job（deploy 等）の token を縮退させないか | HIGH | `ci.yml` の job は typecheck/lint/coverage のみで write を要さない。`contents: read` で十分。job 個別 permissions は据え置き（既に各 job が明示）。Phase 9 で actionlint + job 別 permissions 突合を必須化。 |

## 4. スコープ妥当性（CONST_007）

3 lane すべて 1 実装サイクルに収める。「Phase 2 で」「別 PR」への先送りなし。Lane B/C は同一 ci.yml のため統合実装が妥当で、分割理由なし。即時運用の secret 再発行のみユーザー gated（手順は runbook 記述、実行は本仕様外）。

## 5. 判定

**PASS** — Phase 4（テスト計画）へ進む。CRITICAL/HIGH 指摘はすべて設計に反映済み。R-6 は Phase 9 QA で actionlint 突合を必須チェックとして引き継ぐ。

## 6. 成果物

- `outputs/phase-3/design-review.md`（本レビュー結論）
