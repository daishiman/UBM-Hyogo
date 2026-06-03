# Phase 3 — 設計レビュー（Phase 4 へ進めるか判定）

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 3.1 レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 真の論点の解決 | PASS | 「OG 意匠の正本乖離」を正本 hex 複製 + test ガードで根治。暫定対処でなく構造的再発防止を含む |
| 責務境界の閉じ | PASS | tokens.css（正本）/ og-tokens.ts（派生）/ render.tsx（消費）/ spec（検証）で所有権分離（Phase 2 §2.7） |
| 依存関係の整合 | PASS | apps/web への実行時依存を増やさない。test 時のみ fs read（build/runtime 非依存） |
| スコープの 1 サイクル性（CONST_007） | PASS | `apps/og` 5 ファイル。外部依存・合意未済分岐なし |
| 不変条件抵触 | PASS | Phase 2 §2.8。apps/api / D1 / Google Form / og-cd.yml 不変 |
| テスト可能性 | PASS | `buildHtml` / `tagLine` / `titleFontSize` は pure。ImageResponse path は既存どおり v8-ignore（Workers runtime 限定） |

## 3.2 検討した代替案（A/B 比較 = title の「A/B 改善」趣旨）

| 案 | 内容 | 採否 | 理由 |
| --- | --- | --- | --- |
| 案 A: 正本 hex 複製 + test ガード | 採用 | ✅ | OG 独立性維持・整合継続性・最小変更。Satori 制約に適合 |
| 案 B: build 時 codegen（tokens.css → og 色定数自動生成） | 不採用 | build 依存・複雑性増・apps/og 独立性低下（ユーザー確認で案 A 確定） |
| 案 C: ランタイム A/B テスト（2 意匠出し分け） | 不採用（スコープ外） | body AC 外・KV/計測の Free 枠コスト増。意匠は単一へ磨き込む（ユーザー確認済み） |
| 案 D: serif 見出し追加 | 不採用（将来） | font 追加 fetch/レイテンシ増。今回は Noto Sans JP の weight/size/tracking で階層化 |

## 3.3 リスクと緩和

| リスク | 緩和 |
| --- | --- |
| Satori が一部 CSS（letter-spacing 等）を未対応 | `workers-og`/Satori は letter-spacing / flex / border-radius を解釈。既存 `buildHtml` も flex inline style 構成で実績あり。staging runtime cycleの local render（Phase 11）で確認 |
| `og-tokens.spec.ts` の tokens.css パスが将来移動 | 相対解決を 1 箇所に集約し、不在時は明示 fail メッセージ。移動時は test が即検知 |
| accent 出典（`@supports`）の block が tokens.css で改変 | 正本側変更は意図的整合作業の対象。test fail = 追従トリガー（強化ループ） |
| bundle が size gate を超過 | 定数のみ変更・font 非 bundle 維持で重量不変。Phase 9/10 で `check-worker-size.sh` 再確認 |

## 3.4 判定

**Phase 4（テスト作成）へ進行可**。設計は単一責務・1 サイクル完結・不変条件非抵触・テスト可能性を満たす。
未確定事項なし（A/B 解釈・整合方式はユーザー確認で確定済み）。
