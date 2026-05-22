# Phase 3 成果物: 設計レビュー

Phase 3 spec: `../../phase-03.md`

## レビュー観点と結果

| 観点 | 確認内容 | 判定 |
| --- | --- | --- |
| Schema による不正値遮断 | `additionalProperties:false` で webhook id / 素 url / 素 secret を拒否 | GO |
| Token scope 分離 | apply / read 分離、deploy token と独立 | GO |
| 冪等性 | apply 後の diff で空配列 (S10 で検証済み) | GO |
| 順序 | webhook → policy が apply / S9 で検証済み | GO |
| Mock 切替 | `CF_ALERTS_MOCK_DIR` で実 API 不発火 | GO |
| Secret 不混入 | git grep で実 token / 実 URL ヒット 0 件 | GO |
| 親 UT-17 整合 | Dashboard 手構築 → IaC に置換、monthly healthcheck Step 4 を `cf:alerts:diff` で代替 | GO |
| CONST_007 | テスト先送り禁止 — vitest C1〜Q6 + 統合 S1〜S13 全 green | GO |

## GO/NO-GO

**GO** — 設計上の不整合なし。実装フェーズへ進行可。

## 残課題 (Phase 10 リリース時に解消)

- 1Password に `UBM-Hyogo Alerts Apply Token` / `UBM-Hyogo Alerts Read Token` を発行 (運用作業)
- GitHub Secrets に `CLOUDFLARE_ALERTS_TOKEN_READ` を登録 (運用作業)
