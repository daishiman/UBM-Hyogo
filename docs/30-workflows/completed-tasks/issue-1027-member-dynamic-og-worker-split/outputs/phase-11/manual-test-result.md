# Phase 11 実行結果 — 手動テスト（VISUAL_ON_EXECUTION）

| 項目 | 値 |
|------|-----|
| Phase | 11（手動テスト） |
| 成果物種別 | VISUAL_ON_EXECUTION |
| 証跡の主ソース | OG 画像 PNG（`outputs/phase-11/screenshots/`） |
| VISUAL 理由 | 成果物が 1200×630 OG 画像そのもの。SNS シェアプレビューの見た目が UX 要件であり、視覚確認が必須のため |
| ワークフロー状態 | implemented_local_runtime_pending（local runtime PNG captured / staging runtime は user-gated） |

## 3 層評価結果

| 層 | 評価対象 | 結果 |
|----|---------|------|
| Semantic | metadata（og:image / twitter:image / twitterCard） | focused test で確定 |
| Visual | OG 画像（1200×630・氏名肩書き可読性・日本語・配色） | local Wrangler + mock API で PNG 取得済み |
| AI UX | SNS シェアプレビュー（large image 表示） | staging runtime evidence は user-gated |

## 検証手順結果

| 手順 | 内容 | 証跡 | 結果 |
|------|------|------|------|
| ① named | member 存在 → 1200×630 PNG | `member-og-image-named.png` | local runtime で確定 |
| ② default | member 不明 → default 200 PNG | `member-og-image-default.png` | local runtime で確定 |
| ③ metadata | og:image/twitter:image = OG URL、card=summary_large_image | focused Vitest | 確定 |
| ④ SNS preview | Twitter Card Validator 等 | — | staging deploy 後の user-gated evidence |

## screenshot canonical 名

- `member-og-image-named.png`
- `member-og-image-default.png`
> 保存先 `outputs/phase-11/screenshots/`。ローカル render / route / build / size gate は本実装サイクルで確定済み。Cloudflare staging での SNS preview は user-gated runtime evidence として残す。
